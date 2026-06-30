import 'server-only';
import { db, write } from './db';
import { buildCourseRoute } from './geo';
import { pointAtProgress } from '@/data/roads';
import { computeQuote } from './pricing';
import { STATUS_FLOW, COURSE_STATUS, nextCourseStatus } from './labels';
import { nanoId, sequenceRef } from './utils';
import type { Course, CourseStatus, DB, GeoPoint, TrackingEvent } from './types';

function genCode(): string {
  return 'OW' + Math.random().toString(36).slice(2, 7).toUpperCase();
}
function priceOf(distanceKm: number, vehicleType: any, cargoType: any): number {
  return computeQuote({ distanceKm, vehicleType, cargoType, handlingPickup: true, handlingDelivery: true, insurance: false, vat: false }).totalTTC;
}
function mkEvent(courseId: string, status: CourseStatus, label: string, by: string, lat?: number, lng?: number, note?: string): TrackingEvent {
  return { id: nanoId('t'), courseId, status, label, lat, lng, note, by, createdAt: new Date().toISOString() };
}
function notify(d: DB, userId: string, type: string, title: string, body: string, href?: string) {
  d.notifications.unshift({ id: nanoId('n'), userId, type, title, body, href, read: false, createdAt: new Date().toISOString() });
}

export interface CreateCourseInput {
  client: { name: string; phone: string };
  cargoType: any;
  cargoDescription: string;
  weightKg: number;
  vehicleType: any;
  pickup: GeoPoint;
  delivery: GeoPoint;
}

export function createCourse(ownerId: string, input: CreateCourseInput): Course {
  return write((d) => {
    const route = buildCourseRoute(input.pickup.city, input.pickup, input.delivery.city, input.delivery);
    const seq = ++d.meta.courseSeq;
    const course: Course = {
      id: nanoId('c'),
      code: genCode(),
      reference: sequenceRef('OW', seq),
      ownerId,
      client: input.client,
      cargoType: input.cargoType,
      cargoDescription: input.cargoDescription,
      weightKg: input.weightKg,
      vehicleType: input.vehicleType,
      pickup: input.pickup,
      delivery: input.delivery,
      distanceKm: route.distanceKm,
      durationH: route.durationH,
      price: priceOf(route.distanceKm, input.vehicleType, input.cargoType),
      routeGeometry: route.geometry,
      status: 'NOUVELLE',
      progress: 0,
      currentLat: input.pickup.lat,
      currentLng: input.pickup.lng,
      createdAt: new Date().toISOString(),
    };
    d.courses.push(course);
    notify(d, ownerId, 'COURSE', 'Course créée', `${course.reference} · code ${course.code}`, `/app/gerant/course/${course.id}`);
    return course;
  });
}

export function assignCourse(courseId: string, driverId: string, ownerId: string): Course {
  return write((d) => {
    const course = d.courses.find((c) => c.id === courseId && c.ownerId === ownerId);
    if (!course) throw new Error('Course introuvable');
    if (course.status === 'ANNULEE' || course.status === 'LIVREE') throw new Error('Course terminée');
    const driver = d.drivers.find((x) => x.id === driverId && x.ownerId === ownerId);
    if (!driver) throw new Error('Chauffeur introuvable');

    course.driverId = driver.id;
    course.vehicleId = driver.vehicleId;
    course.status = 'ASSIGNEE';
    course.assignedAt = new Date().toISOString();
    driver.status = 'EN_MISSION';
    const veh = d.vehicles.find((v) => v.id === driver.vehicleId);
    if (veh) veh.available = false;

    d.events.push(mkEvent(course.id, 'ASSIGNEE', `Course assignée à ${driver.name}`, ownerId));
    if (driver.userId) notify(d, driver.userId, 'MISSION', 'Nouvelle mission 🚚', `${course.reference} : ${course.pickup.city} → ${course.delivery.city}`, `/app/chauffeur/course/${course.id}`);
    return course;
  });
}

export function advanceCourse(courseId: string, by: string): { course: Course; event: TrackingEvent } {
  return write((d) => {
    const course = d.courses.find((c) => c.id === courseId);
    if (!course) throw new Error('Course introuvable');
    if (course.status === 'NOUVELLE') throw new Error('Course non assignée');
    const next = nextCourseStatus(course.status);
    if (!next) throw new Error('Course déjà livrée');

    const idx = STATUS_FLOW.indexOf(next);
    const progress = next === 'LIVREE' ? 1 : Math.min(0.95, Math.max(course.progress, idx / (STATUS_FLOW.length - 1)));
    const pos = pointAtProgress(course.routeGeometry, progress);
    course.status = next;
    course.progress = progress;
    course.currentLat = pos[0];
    course.currentLng = pos[1];

    if (next === 'LIVREE') {
      course.deliveredAt = new Date().toISOString();
      const driver = d.drivers.find((x) => x.id === course.driverId);
      if (driver) driver.status = 'DISPONIBLE';
      const veh = d.vehicles.find((v) => v.id === course.vehicleId);
      if (veh) veh.available = true;
    }

    const event = mkEvent(course.id, next, COURSE_STATUS[next].label, by, pos[0], pos[1]);
    d.events.push(event);
    notify(d, course.ownerId, 'TRACKING', `Suivi ${course.reference}`, COURSE_STATUS[next].label, `/app/gerant/course/${course.id}`);
    return { course, event };
  });
}

export function cancelCourse(courseId: string, ownerId: string): Course {
  return write((d) => {
    const course = d.courses.find((c) => c.id === courseId && c.ownerId === ownerId);
    if (!course) throw new Error('Course introuvable');
    if (course.status === 'LIVREE') throw new Error('Course déjà livrée');
    course.status = 'ANNULEE';
    course.cancelledAt = new Date().toISOString();
    const driver = d.drivers.find((x) => x.id === course.driverId);
    if (driver) driver.status = 'DISPONIBLE';
    const veh = d.vehicles.find((v) => v.id === course.vehicleId);
    if (veh) veh.available = true;
    d.events.push(mkEvent(course.id, 'ANNULEE', 'Course annulée', ownerId));
    return course;
  });
}

/** Suivi public par code (aucune donnée sensible exposée par l'appelant). */
export function getCourseByCode(code: string): Course | undefined {
  const norm = code.trim().toUpperCase();
  return db().courses.find((c) => c.code.toUpperCase() === norm);
}
