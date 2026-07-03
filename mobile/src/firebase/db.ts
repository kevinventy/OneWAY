import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type QueryConstraint,
} from 'firebase/firestore';
import { firestore } from './config';
import { buildCourseRoute, findCity } from '@/lib/geo';
import { fetchRoadRoute } from '@/lib/routing';
import { pointAtProgress, progressAlongRoute, flattenLatLng, unflattenLatLng, type LatLng } from '@/data/roads';
import { quickEstimate } from '@/lib/pricing';
import { vehicleByKey, cargoByKey } from '@/data/catalog';
import { STATUS_LABEL, nextStatus } from '@/lib/flow';
import { COURSE_STATUS } from '@/lib/labels';
import { kmRemaining } from '@/lib/types';
import type {
  Course,
  CourseStatus,
  Driver,
  GeoPoint,
  Notification,
  PublicTracking,
  QuoteRequest,
  TrackingEvent,
  User,
  Vehicle,
} from '@/lib/types';

const col = (name: string) => collection(firestore, name);
const pad = (n: number, w = 4) => String(n).padStart(w, '0');
const trackCode = () => 'OW' + Math.random().toString(36).slice(2, 7).toUpperCase();

/** Firestore rejette `undefined` — on retire ces clés avant écriture. */
function clean<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out as T;
}

/**
 * Firestore **interdit les tableaux imbriqués** : `routeGeometry` (liste de
 * `[lat,lng]`) est donc aplatie en `number[]` à l'écriture et reconstituée à la
 * lecture. (Cause de l'erreur « nested arrays are not supported ».)
 */
function courseForWrite(course: Course): Record<string, any> {
  return clean({ ...course, routeGeometry: flattenLatLng(course.routeGeometry) });
}

function courseFromDoc(data: any): Course {
  return { ...data, routeGeometry: unflattenLatLng(data?.routeGeometry) } as Course;
}

function trackingFromDoc(data: any): PublicTracking {
  return { ...data, routeGeometry: unflattenLatLng(data?.routeGeometry) } as PublicTracking;
}

async function nextSeq(name: string): Promise<number> {
  const ref = doc(firestore, 'counters', 'global');
  return runTransaction(firestore, async (tx) => {
    const snap = await tx.get(ref);
    const data = (snap.exists() ? snap.data() : {}) as Record<string, number>;
    const next = (data[name] ?? 0) + 1;
    tx.set(ref, { [name]: next }, { merge: true });
    return next;
  });
}

function priceOf(distanceKm: number, vehicleType: Course['vehicleType'], cargoType: Course['cargoType']): number {
  return quickEstimate(distanceKm, vehicleType, cargoType);
}

async function notify(userId: string, n: { type: string; title: string; body: string; href?: string }) {
  const ref = doc(col('notifications'));
  await setDoc(ref, { id: ref.id, userId, read: false, createdAt: Date.now(), ...n });
}

/** Construit le doc public de suivi (sanitisé) à partir d'une course. */
function buildTracking(course: Course, driver: Driver | null, timeline: PublicTracking['timeline']): PublicTracking {
  return clean({
    code: course.code,
    reference: course.reference,
    company: course.companyName || 'ONE WAY',
    status: course.status,
    statusLabel: COURSE_STATUS[course.status].label,
    progress: course.progress,
    distanceKm: course.distanceKm,
    kmRemaining: kmRemaining(course),
    durationH: course.durationH,
    pickup: { city: course.pickup.city, lat: course.pickup.lat, lng: course.pickup.lng },
    delivery: { city: course.delivery.city, lat: course.delivery.lat, lng: course.delivery.lng },
    current: course.currentLat != null && course.currentLng != null ? { lat: course.currentLat, lng: course.currentLng } : null,
    routeGeometry: course.routeGeometry,
    cargoLabel: cargoByKey(course.cargoType).label,
    weightKg: course.weightKg,
    vehicleLabel: vehicleByKey(course.vehicleType).label,
    driverName: driver ? driver.name.split(' ')[0] : undefined,
    contactPhone: driver?.phone || undefined,
    delivered: course.status === 'LIVREE',
    cancelled: course.status === 'ANNULEE',
    updatedAt: Date.now(),
    timeline,
  }) as PublicTracking;
}

async function syncTracking(course: Course, driver: Driver | null, appendEvent?: { status: CourseStatus; label: string; at: number }) {
  const ref = doc(firestore, 'tracking', course.code);
  // Toujours repartir de l'historique existant (sinon une simple mise à jour de
  // position — GPS — effacerait la chronologie).
  const prev = await getDoc(ref);
  let timeline: PublicTracking['timeline'] = prev.exists() ? ((prev.data() as PublicTracking).timeline ?? []) : [];
  if (appendEvent) timeline = [...timeline, appendEvent];
  const tracking = buildTracking(course, driver, timeline);
  // Aplati la géométrie (tableaux imbriqués interdits par Firestore).
  await setDoc(ref, clean({ ...tracking, routeGeometry: flattenLatLng(tracking.routeGeometry) }));
}

// ── Création d'une course (gérant) ─────────────────────────────────────────

export interface NewCourseInput {
  client: { name: string; phone: string };
  cargoType: Course['cargoType'];
  cargoDescription: string;
  weightKg: number;
  vehicleType: Course['vehicleType'];
  pickup: GeoPoint;
  delivery: GeoPoint;
  /** Prix saisi par le gérant (sinon estimation automatique). */
  price?: number;
}

export async function createCourse(gerant: User, input: NewCourseInput): Promise<Course> {
  // Itinéraire routier réel (OSRM, suit les routes) ; repli sur les axes RN
  // répertoriés si le service est indisponible (hors-ligne).
  const road = await fetchRoadRoute(input.pickup, input.delivery);
  const fallback = buildCourseRoute(input.pickup.city, input.pickup, input.delivery.city, input.delivery);
  const distanceKm = road?.distanceKm ?? fallback.distanceKm;
  const durationH = road?.durationH ?? fallback.durationH;
  const geometry = road?.geometry ?? fallback.geometry;
  const seq = await nextSeq('course');
  const ref = doc(col('courses'));
  const course: Course = {
    id: ref.id,
    code: trackCode(),
    reference: `OW-${pad(seq)}`,
    ownerId: gerant.id,
    companyName: gerant.companyName || 'ONE WAY',
    client: input.client,
    cargoType: input.cargoType,
    cargoDescription: input.cargoDescription,
    weightKg: input.weightKg,
    vehicleType: input.vehicleType,
    pickup: input.pickup,
    delivery: input.delivery,
    distanceKm,
    durationH,
    price: input.price != null && input.price > 0 ? Math.round(input.price) : priceOf(distanceKm, input.vehicleType, input.cargoType),
    routeGeometry: geometry,
    status: 'NOUVELLE',
    progress: 0,
    currentLat: input.pickup.lat,
    currentLng: input.pickup.lng,
    createdAt: Date.now(),
  };
  await setDoc(ref, courseForWrite(course));
  await syncTracking(course, null);
  await notify(gerant.id, { type: 'COURSE', title: 'Course créée', body: `${course.reference} · code ${course.code}`, href: `/(app)/course/${course.id}` });
  return course;
}

// ── Affectation d'un chauffeur (gérant) ────────────────────────────────────

export async function assignCourse(course: Course, driver: Driver): Promise<void> {
  const batch = writeBatch(firestore);
  batch.update(doc(firestore, 'courses', course.id), clean({
    driverId: driver.id,
    driverUserId: driver.userId,
    vehicleId: driver.vehicleId,
    status: 'ASSIGNEE',
    assignedAt: Date.now(),
  }));
  batch.update(doc(firestore, 'drivers', driver.id), { status: 'EN_MISSION' });
  if (driver.vehicleId) batch.update(doc(firestore, 'vehicles', driver.vehicleId), { available: false });
  const ev = doc(col('events'));
  batch.set(ev, { id: ev.id, courseId: course.id, ownerId: course.ownerId, status: 'ASSIGNEE', label: `Course assignée à ${driver.name}`, by: course.ownerId, createdAt: Date.now() });
  await batch.commit();

  const updated: Course = { ...course, driverId: driver.id, driverUserId: driver.userId, vehicleId: driver.vehicleId, status: 'ASSIGNEE' };
  await syncTracking(updated, driver, { status: 'ASSIGNEE', label: `Course assignée à ${driver.name}`, at: Date.now() });
  if (driver.userId) {
    await notify(driver.userId, { type: 'MISSION', title: 'Nouvelle mission 🚚', body: `${course.reference} : ${course.pickup.city} → ${course.delivery.city}`, href: `/(app)/course/${course.id}` });
  }
}

// ── Avancement d'étape (gérant propriétaire ou chauffeur assigné) ──────────

export async function advanceCourse(course: Course, by: string): Promise<void> {
  if (course.status === 'NOUVELLE') throw new Error('Course non assignée');
  const next = nextStatus(course.status);
  if (!next) throw new Error('Course déjà livrée');

  // La progression de la marchandise dépend UNIQUEMENT du GPS du chauffeur :
  // changer d'étape (assignée, chargement, en route…) ne fait PAS avancer la
  // barre ni les km restants. Seule la livraison force 100 %.
  const progress = next === 'LIVREE' ? 1 : course.progress;
  // Position : GPS réel si disponible ; sinon point de l'itinéraire selon la
  // progression GPS actuelle (départ tant que le GPS n'a rien remonté).
  const pos: LatLng =
    course.currentLat != null && course.currentLng != null
      ? [course.currentLat, course.currentLng]
      : pointAtProgress(course.routeGeometry as LatLng[], progress);

  const driver = course.driverId ? await getDriver(course.driverId) : null;
  const batch = writeBatch(firestore);
  batch.update(doc(firestore, 'courses', course.id), clean({
    status: next, progress, currentLat: pos[0], currentLng: pos[1],
    deliveredAt: next === 'LIVREE' ? Date.now() : undefined,
  }));
  const ev = doc(col('events'));
  batch.set(ev, clean({ id: ev.id, courseId: course.id, ownerId: course.ownerId, status: next, label: STATUS_LABEL[next], lat: pos[0], lng: pos[1], by, createdAt: Date.now() }));

  if (next === 'LIVREE') {
    if (course.driverId) batch.update(doc(firestore, 'drivers', course.driverId), { status: 'DISPONIBLE' });
    if (course.vehicleId) batch.update(doc(firestore, 'vehicles', course.vehicleId), { available: true });
  }
  await batch.commit();

  const updated: Course = { ...course, status: next, progress, currentLat: pos[0], currentLng: pos[1] };
  await syncTracking(updated, driver, { status: next, label: STATUS_LABEL[next], at: Date.now() });
  await notify(course.ownerId, { type: 'TRACKING', title: `Suivi ${course.reference}`, body: COURSE_STATUS[next].label, href: `/(app)/course/${course.id}` });
}

// ── Annulation (gérant) ────────────────────────────────────────────────────

export async function cancelCourse(course: Course): Promise<void> {
  const driver = course.driverId ? await getDriver(course.driverId) : null;
  const batch = writeBatch(firestore);
  batch.update(doc(firestore, 'courses', course.id), { status: 'ANNULEE', cancelledAt: Date.now() });
  if (course.driverId) batch.update(doc(firestore, 'drivers', course.driverId), { status: 'DISPONIBLE' });
  if (course.vehicleId) batch.update(doc(firestore, 'vehicles', course.vehicleId), { available: true });
  const ev = doc(col('events'));
  batch.set(ev, { id: ev.id, courseId: course.id, ownerId: course.ownerId, status: 'ANNULEE', label: 'Course annulée', by: course.ownerId, createdAt: Date.now() });
  await batch.commit();
  await syncTracking({ ...course, status: 'ANNULEE' }, driver);
}

// ── Suppression d'une livraison terminée (gérant propriétaire) ─────────────

export async function deleteCourse(course: Course): Promise<void> {
  const batch = writeBatch(firestore);
  batch.delete(doc(firestore, 'courses', course.id));
  batch.delete(doc(firestore, 'tracking', course.code));
  await batch.commit();
}

// ── Position temps réel (GPS du chauffeur) ─────────────────────────────────

/**
 * Met à jour la position réelle du véhicule à partir du GPS du téléphone du
 * chauffeur : recalcule l'avancement (projection sur l'itinéraire) et les km
 * restants, côté course et suivi public. N'altère pas le statut ni l'historique.
 */
export async function updateDriverLocation(course: Course, lat: number, lng: number): Promise<void> {
  if (['LIVREE', 'ANNULEE'].includes(course.status)) return;
  const geo = (course.routeGeometry as LatLng[]) ?? [];
  const projected = progressAlongRoute(geo, [lat, lng]);
  const progress = Math.min(0.99, Math.max(course.progress, projected));
  await updateDoc(doc(firestore, 'courses', course.id), clean({ currentLat: lat, currentLng: lng, progress }));
  const driver = course.driverId ? await getDriver(course.driverId) : null;
  await syncTracking({ ...course, currentLat: lat, currentLng: lng, progress }, driver);
}

// ── Prix modifiable (gérant) ───────────────────────────────────────────────

export async function updateCoursePrice(courseId: string, price: number): Promise<void> {
  await updateDoc(doc(firestore, 'courses', courseId), { price: Math.max(0, Math.round(price)) });
}

// ── Flotte (gérant) ────────────────────────────────────────────────────────

export async function addVehicle(ownerId: string, input: { type: Vehicle['type']; name: string; plate: string; capacityKg: number }): Promise<void> {
  const ref = doc(col('vehicles'));
  await setDoc(ref, { id: ref.id, ownerId, type: input.type, name: input.name, plate: input.plate, capacityKg: input.capacityKg, available: true });
}

export async function setDriverVehicle(driverId: string, vehicleId: string | null): Promise<void> {
  await updateDoc(doc(firestore, 'drivers', driverId), clean({ vehicleId: vehicleId ?? undefined }));
}

async function getDriver(id: string): Promise<Driver | null> {
  const snap = await getDoc(doc(firestore, 'drivers', id));
  return snap.exists() ? (snap.data() as Driver) : null;
}

/** Fiche chauffeur liée à un compte utilisateur. */
export async function getDriverByUser(uid: string): Promise<Driver | null> {
  const snap = await getDocs(query(col('drivers'), where('userId', '==', uid)));
  return snap.empty ? null : (snap.docs[0].data() as Driver);
}

// ── Subscriptions temps réel ───────────────────────────────────────────────

function subscribe<T>(name: string, constraints: QueryConstraint[], cb: (rows: T[]) => void, map?: (data: any) => T) {
  return onSnapshot(query(col(name), ...constraints), (snap) => cb(snap.docs.map((d) => (map ? map(d.data()) : (d.data() as T)))));
}

export const subscribeOwnerCourses = (ownerId: string, cb: (c: Course[]) => void) =>
  subscribe<Course>('courses', [where('ownerId', '==', ownerId)], (rows) => cb(rows.sort((a, b) => b.createdAt - a.createdAt)), courseFromDoc);

export const subscribeDriverCourses = (driverUserId: string, cb: (c: Course[]) => void) =>
  subscribe<Course>('courses', [where('driverUserId', '==', driverUserId)], (rows) => cb(rows.sort((a, b) => b.createdAt - a.createdAt)), courseFromDoc);

export const subscribeOwnerVehicles = (ownerId: string, cb: (v: Vehicle[]) => void) =>
  subscribe<Vehicle>('vehicles', [where('ownerId', '==', ownerId)], cb);

export const subscribeOwnerDrivers = (ownerId: string, cb: (d: Driver[]) => void) =>
  subscribe<Driver>('drivers', [where('ownerId', '==', ownerId)], cb);

export const subscribeEvents = (courseId: string, cb: (t: TrackingEvent[]) => void) =>
  subscribe<TrackingEvent>('events', [where('courseId', '==', courseId)], (rows) => cb(rows.sort((a, b) => a.createdAt - b.createdAt)));

export const subscribeNotifications = (uid: string, cb: (n: Notification[]) => void) =>
  subscribe<Notification>('notifications', [where('userId', '==', uid)], (rows) => cb(rows.sort((a, b) => b.createdAt - a.createdAt)));

/** Courses d'un client (rattachées à son numéro de téléphone). */
export const subscribeClientCourses = (phone: string, cb: (c: Course[]) => void) =>
  subscribe<Course>('courses', [where('client.phone', '==', phone)], (rows) => cb(rows.sort((a, b) => b.createdAt - a.createdAt)), courseFromDoc);

/** Demandes de devis en attente (vue gérant). */
export const subscribeQuoteRequests = (cb: (q: QuoteRequest[]) => void) =>
  subscribe<QuoteRequest>('quoteRequests', [where('status', '==', 'NOUVELLE')], (rows) => cb(rows.sort((a, b) => b.createdAt - a.createdAt)));

// ── Demandes de devis (client → gérant) ────────────────────────────────────

export async function createQuoteRequest(client: User, input: { fromCity: string; toCity: string; cargoType: QuoteRequest['cargoType']; weightKg: number; description: string }): Promise<void> {
  const ref = doc(col('quoteRequests'));
  await setDoc(ref, clean({
    id: ref.id, clientId: client.id, clientName: client.name, clientPhone: client.phone || '',
    fromCity: input.fromCity, toCity: input.toCity, cargoType: input.cargoType, weightKg: input.weightKg,
    description: input.description, status: 'NOUVELLE', createdAt: Date.now(),
  }));
}

export async function markQuoteHandled(id: string, status: 'TRAITEE' | 'REFUSEE' = 'TRAITEE'): Promise<void> {
  await updateDoc(doc(firestore, 'quoteRequests', id), { status });
}

export function subscribeCourse(id: string, cb: (c: Course | null) => void) {
  return onSnapshot(doc(firestore, 'courses', id), (snap) => cb(snap.exists() ? courseFromDoc(snap.data()) : null));
}

/** Suivi public (par code), sans compte. */
export function subscribePublicTracking(code: string, cb: (t: PublicTracking | null) => void) {
  return onSnapshot(doc(firestore, 'tracking', code.trim().toUpperCase()), (snap) => cb(snap.exists() ? trackingFromDoc(snap.data()) : null));
}

export async function getPublicTracking(code: string): Promise<PublicTracking | null> {
  const snap = await getDoc(doc(firestore, 'tracking', code.trim().toUpperCase()));
  return snap.exists() ? trackingFromDoc(snap.data()) : null;
}

export async function getCourse(id: string): Promise<Course | null> {
  const snap = await getDoc(doc(firestore, 'courses', id));
  return snap.exists() ? courseFromDoc(snap.data()) : null;
}

export async function markNotificationsRead(uid: string): Promise<void> {
  const snap = await getDocs(query(col('notifications'), where('userId', '==', uid), where('read', '==', false)));
  const batch = writeBatch(firestore);
  snap.forEach((d) => batch.update(d.ref, { read: true }));
  if (!snap.empty) await batch.commit();
}

export { findCity };
