import 'server-only';
import { db } from './db';
import { eventsFor } from './queries';
import { COURSE_STATUS } from './labels';
import { kmRemaining, type Course, type PublicTracking } from './types';
import { vehicleByKey, cargoByKey } from '@/data/catalog';

export type { PublicTracking };

function firstName(name: string): string {
  return name.split(' ')[0];
}

/** Projette une course vers sa vue de suivi publique (sanitisée). */
export function publicTracking(course: Course): PublicTracking {
  const d = db();
  const owner = d.users.find((u) => u.id === course.ownerId);
  const driver = course.driverId ? d.drivers.find((x) => x.id === course.driverId) : undefined;
  const st = COURSE_STATUS[course.status];

  return {
    code: course.code,
    reference: course.reference,
    status: course.status,
    statusLabel: st.label,
    statusTone: st.tone,
    progress: course.progress,
    distanceKm: course.distanceKm,
    kmRemaining: kmRemaining(course),
    durationH: course.durationH,
    pickup: { city: course.pickup.city, address: course.pickup.address, lat: course.pickup.lat, lng: course.pickup.lng },
    delivery: { city: course.delivery.city, address: course.delivery.address, lat: course.delivery.lat, lng: course.delivery.lng },
    current:
      course.currentLat != null && course.currentLng != null
        ? { lat: course.currentLat, lng: course.currentLng }
        : null,
    routeGeometry: course.routeGeometry,
    cargo: { label: cargoByKey(course.cargoType).label, weightKg: course.weightKg },
    vehicle: { label: vehicleByKey(course.vehicleType).label },
    transporter: {
      company: owner?.companyName || 'ONE WAY',
      phone: driver?.phone || owner?.phone || '',
      driverName: driver ? firstName(driver.name) : undefined,
    },
    delivered: course.status === 'LIVREE',
    cancelled: course.status === 'ANNULEE',
    createdAt: course.createdAt,
    deliveredAt: course.deliveredAt,
    timeline: eventsFor(course.id)
      .filter((e) => e.status !== 'ANNULEE')
      .map((e) => ({ status: e.status, label: e.label, at: e.createdAt })),
  };
}

/** Recherche d'une course par code public (suivi sans compte). */
export function trackingByCode(code: string): PublicTracking | null {
  const norm = code.trim().toUpperCase();
  const course = db().courses.find((c) => c.code.toUpperCase() === norm);
  if (!course) return null;
  return publicTracking(course);
}
