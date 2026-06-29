import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type QueryConstraint,
} from 'firebase/firestore';
import { firestore } from './config';
import { estimateRoute, findCity, lerpPoint } from '@/lib/geo';
import { computeQuote, quickEstimate } from '@/lib/pricing';
import { MARKETPLACE } from '@/data/catalog';
import { STATUS_FLOW, STATUS_LABEL } from '@/lib/flow';
import type {
  Bid,
  Freight,
  Shipment,
  ShipmentStatus,
  TrackingEvent,
  User,
  Vehicle,
} from '@/lib/types';

const col = (name: string) => collection(firestore, name);

/** Sequential reference counter (counters/global). */
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

const pad = (n: number, w = 4) => String(n).padStart(w, '0');
const code = () => 'OW' + Math.random().toString(36).slice(2, 8).toUpperCase();

function commissionRateFor(carrier?: User | null) {
  return carrier?.premium ? MARKETPLACE.commissionRatePremiumCarrier : MARKETPLACE.commissionRate;
}

async function getUser(id: string): Promise<User | null> {
  const snap = await getDoc(doc(firestore, 'users', id));
  return snap.exists() ? (snap.data() as User) : null;
}

async function pushNotification(userId: string, n: { type: string; title: string; body: string; href?: string }) {
  const ref = doc(col('notifications'));
  await setDoc(ref, { id: ref.id, userId, read: false, createdAt: Date.now(), ...n });
}

// ── Freight ──────────────────────────────────────────────────────────────

export interface NewFreightInput {
  title: string;
  cargoType: Freight['cargoType'];
  weightKg: number;
  volumeM3?: number;
  dimensions?: string;
  photos?: string[];
  pickup: Freight['pickup'];
  delivery: Freight['delivery'];
  pickupDate: number;
  urgency: Freight['urgency'];
  pricingMode: Freight['pricingMode'];
  vehicleType: Freight['vehicleType'];
  declaredValue?: number;
  insurance: boolean;
  budget?: number;
}

export async function createFreight(shipperId: string, input: NewFreightInput): Promise<Freight> {
  const route = estimateRoute(input.pickup.city, input.delivery.city);
  const seq = await nextSeq('freight');
  const ref = doc(col('freights'));
  const freight: Freight = {
    id: ref.id,
    reference: `OW-${pad(seq)}`,
    shipperId,
    title: input.title,
    cargoType: input.cargoType,
    weightKg: input.weightKg,
    volumeM3: input.volumeM3,
    dimensions: input.dimensions,
    photos: input.photos ?? [],
    pickup: input.pickup,
    delivery: input.delivery,
    pickupDate: input.pickupDate,
    urgency: input.urgency,
    pricingMode: input.pricingMode,
    vehicleType: input.vehicleType,
    declaredValue: input.declaredValue,
    insurance: input.insurance,
    distanceKm: route.distanceKm,
    durationH: route.durationH,
    budget: input.budget || quickEstimate(route.distanceKm, input.vehicleType, input.cargoType),
    status: 'PUBLISHED',
    createdAt: Date.now(),
  };
  await setDoc(ref, stripUndefined(freight));
  const dref = doc(col('documents'));
  await setDoc(dref, { id: dref.id, freightId: ref.id, type: 'QUOTE', reference: `DEV-${freight.reference}`, title: `Devis de transport — ${freight.reference}`, createdAt: Date.now() });
  return freight;
}

// ── Bids ─────────────────────────────────────────────────────────────────

export async function placeBid(freight: Freight, carrier: User, input: { amount: number; etaHours: number; message?: string; vehicleId?: string }): Promise<void> {
  // One pending bid per carrier/freight: reuse if exists.
  const existing = await getDocs(query(col('bids'), where('freightId', '==', freight.id), where('carrierId', '==', carrier.id), where('status', '==', 'PENDING')));
  if (!existing.empty) {
    await updateDoc(existing.docs[0].ref, stripUndefined({ amount: input.amount, etaHours: input.etaHours, message: input.message, vehicleId: input.vehicleId }));
  } else {
    const ref = doc(col('bids'));
    const bid: Bid = {
      id: ref.id, freightId: freight.id, carrierId: carrier.id, carrierName: carrier.companyName ?? carrier.name,
      amount: input.amount, etaHours: input.etaHours, message: input.message, vehicleId: input.vehicleId,
      status: 'PENDING', createdAt: Date.now(),
    };
    await setDoc(ref, stripUndefined(bid));
  }
  await pushNotification(freight.shipperId, {
    type: 'BID', title: 'Nouvelle offre reçue',
    body: `${carrier.companyName ?? carrier.name} a proposé un prix pour ${freight.reference}.`,
    href: `/shipper/freight/${freight.id}`,
  });
}

/** Shipper accepts a bid → books the mission (batched write). */
export async function acceptBid(freight: Freight, bid: Bid): Promise<Shipment> {
  const carrier = await getUser(bid.carrierId);
  const seq = await nextSeq('shipment');
  const txSeq = await nextSeq('transaction');
  const batch = writeBatch(firestore);

  // Reject competing bids, accept this one.
  const all = await getDocs(query(col('bids'), where('freightId', '==', freight.id)));
  all.forEach((d) => batch.update(d.ref, { status: d.id === bid.id ? 'ACCEPTED' : 'REJECTED' }));

  batch.update(doc(firestore, 'freights', freight.id), { status: 'ASSIGNED' });

  // Assign an available driver if any.
  const drivers = await getDocs(query(col('drivers'), where('carrierId', '==', bid.carrierId), where('status', '==', 'AVAILABLE')));
  const driver = drivers.docs[0];
  const commission = Math.round(bid.amount * commissionRateFor(carrier));

  const sref = doc(col('shipments'));
  const shipment: Shipment = {
    id: sref.id, reference: `EXP-${pad(seq)}`, freightId: freight.id, shipperId: freight.shipperId,
    carrierId: bid.carrierId, driverId: driver?.id, vehicleId: bid.vehicleId ?? driver?.data()?.vehicleId,
    bidId: bid.id, price: bid.amount, commission, status: 'ASSIGNED', trackingCode: code(),
    currentLat: freight.pickup.lat, currentLng: freight.pickup.lng, progress: 0, createdAt: Date.now(),
  };
  batch.set(sref, stripUndefined(shipment));

  const tref = doc(col('tracking'));
  batch.set(tref, { id: tref.id, shipmentId: sref.id, status: 'ASSIGNED', label: 'Mission attribuée au transporteur', by: freight.shipperId, createdAt: Date.now() });

  const xref = doc(col('transactions'));
  batch.set(xref, { id: xref.id, reference: `PAY-${pad(txSeq)}`, shipmentId: sref.id, payerId: freight.shipperId, payeeId: bid.carrierId, amount: bid.amount, commission, method: 'MVOLA', status: 'ESCROW', createdAt: Date.now() });

  const blref = doc(col('documents'));
  batch.set(blref, { id: blref.id, shipmentId: sref.id, freightId: freight.id, type: 'BL', reference: `BL-${shipment.reference}`, title: `Bordereau de livraison — ${shipment.reference}`, createdAt: Date.now() });

  if (driver) batch.update(driver.ref, { status: 'ON_MISSION' });

  const nref = doc(col('notifications'));
  batch.set(nref, { id: nref.id, userId: bid.carrierId, type: 'MISSION', read: false, title: 'Offre acceptée 🎉', body: `Votre offre pour ${freight.reference} a été acceptée.`, href: `/carrier/mission/${sref.id}`, createdAt: Date.now() });

  await batch.commit();
  return shipment;
}

// ── Shipment lifecycle ────────────────────────────────────────────────────

export async function advanceShipment(shipment: Shipment, by: string, opts?: { status?: ShipmentStatus; note?: string; photoUrl?: string }): Promise<void> {
  const freightSnap = await getDoc(doc(firestore, 'freights', shipment.freightId));
  const freight = freightSnap.data() as Freight;
  const next = opts?.status ?? STATUS_FLOW[Math.min(STATUS_FLOW.indexOf(shipment.status) + 1, STATUS_FLOW.length - 1)];
  const idx = STATUS_FLOW.indexOf(next);
  const progress = next === 'DELIVERED' ? 1 : Math.min(0.95, Math.max(shipment.progress, idx / (STATUS_FLOW.length - 1)));
  const pos = lerpPoint(freight.pickup, freight.delivery, progress);

  const batch = writeBatch(firestore);
  batch.update(doc(firestore, 'shipments', shipment.id), stripUndefined({
    status: next, progress, currentLat: pos.lat, currentLng: pos.lng,
    deliveredAt: next === 'DELIVERED' ? Date.now() : undefined,
  }));

  const tref = doc(col('tracking'));
  batch.set(tref, stripUndefined({ id: tref.id, shipmentId: shipment.id, status: next, label: STATUS_LABEL[next], lat: pos.lat, lng: pos.lng, note: opts?.note, photoUrl: opts?.photoUrl, by, createdAt: Date.now() }));

  if (next === 'IN_TRANSIT') batch.update(doc(firestore, 'freights', freight.id), { status: 'IN_TRANSIT' });
  if (next === 'DELIVERED') {
    batch.update(doc(firestore, 'freights', freight.id), { status: 'DELIVERED' });
    const txs = await getDocs(query(col('transactions'), where('shipmentId', '==', shipment.id)));
    txs.forEach((d) => batch.update(d.ref, { status: 'RELEASED' }));
    if (shipment.driverId) batch.update(doc(firestore, 'drivers', shipment.driverId), { status: 'AVAILABLE' });
    const podref = doc(col('documents'));
    batch.set(podref, { id: podref.id, shipmentId: shipment.id, freightId: freight.id, type: 'POD', reference: `POD-${shipment.reference}`, title: `Preuve de livraison — ${shipment.reference}`, createdAt: Date.now() });
    const facref = doc(col('documents'));
    batch.set(facref, { id: facref.id, shipmentId: shipment.id, freightId: freight.id, type: 'INVOICE', reference: `FAC-${shipment.reference}`, title: `Facture — ${shipment.reference}`, createdAt: Date.now() });
  }

  const nref = doc(col('notifications'));
  batch.set(nref, { id: nref.id, userId: shipment.shipperId, type: 'TRACKING', read: false, title: `Suivi ${shipment.reference}`, body: STATUS_LABEL[next], href: `/shipper/tracking/${shipment.id}`, createdAt: Date.now() });

  await batch.commit();
}

// ── Reviews ───────────────────────────────────────────────────────────────

export async function leaveReview(shipment: Shipment, fromUserId: string, toUserId: string, rating: number, comment?: string): Promise<void> {
  const ref = doc(col('reviews'));
  await setDoc(ref, stripUndefined({ id: ref.id, shipmentId: shipment.id, fromUserId, toUserId, rating, comment, createdAt: Date.now() }));
  // Recompute target rolling average.
  const rs = await getDocs(query(col('reviews'), where('toUserId', '==', toUserId)));
  const ratings = rs.docs.map((d) => d.data().rating as number);
  const avg = ratings.reduce((s, r) => s + r, 0) / ratings.length;
  await updateDoc(doc(firestore, 'users', toUserId), { rating: Math.round(avg * 100) / 100, ratingCount: ratings.length });
}

// ── Matching ──────────────────────────────────────────────────────────────

export interface MatchSuggestion {
  carrierId: string;
  companyName: string;
  city?: string;
  rating: number;
  premium: boolean;
  estimatedPrice: number;
  score: number;
}

export async function matchCarriers(freight: Freight, max = 5): Promise<MatchSuggestion[]> {
  const [carriersSnap, vehiclesSnap] = await Promise.all([
    getDocs(query(col('users'), where('role', '==', 'CARRIER'))),
    getDocs(col('vehicles')),
  ]);
  const vehicles = vehiclesSnap.docs.map((d) => d.data() as Vehicle);
  const out: MatchSuggestion[] = [];
  for (const cd of carriersSnap.docs) {
    const carrier = cd.data() as User;
    const fleet = vehicles.filter((v) => v.carrierId === carrier.id && v.available);
    const vehicle = fleet.find((v) => v.type === freight.vehicleType) ?? fleet.find((v) => v.capacityKg >= freight.weightKg);
    if (!vehicle) continue;
    const q = computeQuote({ distanceKm: freight.distanceKm, vehicleType: freight.vehicleType, cargoType: freight.cargoType, handlingPickup: true, handlingDelivery: true, insurance: freight.insurance, declaredValue: freight.declaredValue, vat: false }, commissionRateFor(carrier));
    const priceScore = Math.min(1, freight.budget / Math.max(1, q.totalTTC));
    const score = (carrier.rating / 5) * 0.5 + priceScore * 0.3 + (carrier.premium ? 0.2 : 0);
    out.push({ carrierId: carrier.id, companyName: carrier.companyName ?? carrier.name, city: carrier.city, rating: carrier.rating, premium: carrier.premium, estimatedPrice: q.totalTTC, score: Math.round(score * 1000) / 1000 });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, max);
}

// ── Realtime subscriptions ────────────────────────────────────────────────

function subscribe<T>(name: string, constraints: QueryConstraint[], cb: (rows: T[]) => void) {
  return onSnapshot(query(col(name), ...constraints), (snap) => cb(snap.docs.map((d) => d.data() as T)));
}

export const subscribeOpenFreights = (cb: (f: Freight[]) => void) =>
  subscribe<Freight>('freights', [where('status', '==', 'PUBLISHED')], (rows) => cb(rows.sort((a, b) => b.createdAt - a.createdAt)));

export const subscribeShipperFreights = (uid: string, cb: (f: Freight[]) => void) =>
  subscribe<Freight>('freights', [where('shipperId', '==', uid)], (rows) => cb(rows.sort((a, b) => b.createdAt - a.createdAt)));

export const subscribeBids = (freightId: string, cb: (b: Bid[]) => void) =>
  subscribe<Bid>('bids', [where('freightId', '==', freightId)], (rows) => cb(rows.sort((a, b) => a.amount - b.amount)));

export const subscribeShipperShipments = (uid: string, cb: (s: Shipment[]) => void) =>
  subscribe<Shipment>('shipments', [where('shipperId', '==', uid)], (rows) => cb(rows.sort((a, b) => b.createdAt - a.createdAt)));

export const subscribeCarrierShipments = (uid: string, cb: (s: Shipment[]) => void) =>
  subscribe<Shipment>('shipments', [where('carrierId', '==', uid)], (rows) => cb(rows.sort((a, b) => b.createdAt - a.createdAt)));

export const subscribeDriverShipments = (driverId: string, cb: (s: Shipment[]) => void) =>
  subscribe<Shipment>('shipments', [where('driverId', '==', driverId)], (rows) => cb(rows.sort((a, b) => b.createdAt - a.createdAt)));

export const subscribeTracking = (shipmentId: string, cb: (t: TrackingEvent[]) => void) =>
  subscribe<TrackingEvent>('tracking', [where('shipmentId', '==', shipmentId)], (rows) => cb(rows.sort((a, b) => a.createdAt - b.createdAt)));

export const subscribeNotifications = (uid: string, cb: (n: any[]) => void) =>
  subscribe<any>('notifications', [where('userId', '==', uid)], (rows) => cb(rows.sort((a, b) => b.createdAt - a.createdAt)));

export function subscribeDoc<T>(name: string, id: string, cb: (row: T | null) => void) {
  return onSnapshot(doc(firestore, name, id), (snap) => cb(snap.exists() ? (snap.data() as T) : null));
}

export async function getFreight(id: string): Promise<Freight | null> {
  const snap = await getDoc(doc(firestore, 'freights', id));
  return snap.exists() ? (snap.data() as Freight) : null;
}

export async function getShipmentByFreight(freightId: string): Promise<Shipment | null> {
  const snap = await getDocs(query(col('shipments'), where('freightId', '==', freightId)));
  return snap.empty ? null : (snap.docs[0].data() as Shipment);
}

export function subscribeShipmentByFreight(freightId: string, cb: (s: Shipment | null) => void) {
  return onSnapshot(query(col('shipments'), where('freightId', '==', freightId)), (snap) =>
    cb(snap.empty ? null : (snap.docs[0].data() as Shipment)),
  );
}

/** Resolve the driver document id for a logged-in DRIVER user. */
export async function getDriverByUser(uid: string): Promise<{ id: string } | null> {
  const snap = await getDocs(query(col('drivers'), where('userId', '==', uid)));
  return snap.empty ? null : { id: snap.docs[0].id };
}

export async function markNotificationsRead(uid: string): Promise<void> {
  const snap = await getDocs(query(col('notifications'), where('userId', '==', uid), where('read', '==', false)));
  const batch = writeBatch(firestore);
  snap.forEach((d) => batch.update(d.ref, { read: true }));
  if (!snap.empty) await batch.commit();
}

export { getUser };

/** Firestore rejects `undefined` — drop those keys before writing. */
function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out as T;
}
