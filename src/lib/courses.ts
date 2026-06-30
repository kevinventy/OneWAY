import 'server-only';
import { db, write } from './db';
import { estimateRoute, findCity, remainingKm } from './geo';
import { computeQuote } from './pricing';
import { advanceShipment } from './services';
import { nanoId, sequenceRef } from './utils';
import { STATUS_LABEL } from './flow';
import type { CargoTypeKey, VehicleTypeKey } from '@/data/catalog';
import type { Freight, Shipment, TrackingEvent } from './types';

/**
 * Service « transporteur » — création directe d'une course (départ → arrivée),
 * assignée à un chauffeur, SANS passer par la place de marché (offres/enchères).
 * C'est le cœur métier de l'app pour une entreprise qui transporte elle-même.
 */

/** L'entreprise par défaut = le premier compte transporteur. */
function company() {
  const c = db().users.find((u) => u.role === 'CARRIER');
  if (!c) throw new Error('Aucun compte transporteur configuré');
  return c;
}

/** Id de l'entreprise du gérant connecté (CARRIER) ou, à défaut, la première. */
export function resolveCompanyId(carrierId?: string): string {
  if (carrierId && db().users.some((u) => u.id === carrierId && u.role === 'CARRIER')) {
    return carrierId;
  }
  return company().id;
}

export interface NewCourseInput {
  fromCity: string;
  toCity: string;
  title: string;
  cargoType: CargoTypeKey;
  weightKg: number;
  vehicleType: VehicleTypeKey;
  driverId?: string;
  clientName?: string;
  clientPhone?: string;
  insurance?: boolean;
  declaredValue?: number;
}

export function createCourse(input: NewCourseInput, carrierId?: string): Shipment {
  const companyId = resolveCompanyId(carrierId);
  const from = findCity(input.fromCity);
  const to = findCity(input.toCity);
  if (!from || !to) throw new Error('Ville de départ ou d’arrivée inconnue');
  if (from.name === to.name) throw new Error('Le départ et l’arrivée doivent être différents');

  const route = estimateRoute(from.name, to.name);
  const quote = computeQuote(
    {
      distanceKm: route.distanceKm,
      vehicleType: input.vehicleType,
      cargoType: input.cargoType,
      weightKg: input.weightKg,
      handlingPickup: true,
      handlingDelivery: true,
      insurance: input.insurance,
      declaredValue: input.declaredValue,
      vat: false,
    },
    0,
  );

  return write((d) => {
    const co = d.users.find((u) => u.id === companyId)!;
    const driver = input.driverId ? d.drivers.find((dr) => dr.id === input.driverId) : undefined;
    const vehicle =
      d.vehicles.find((v) => v.carrierId === co.id && v.type === input.vehicleType) ??
      d.vehicles.find((v) => v.type === input.vehicleType);

    const fSeq = ++d.meta.freightSeq;
    const now = new Date().toISOString();

    const freight: Freight = {
      id: nanoId('f'),
      reference: sequenceRef('CRS', fSeq),
      shipperId: co.id,
      title: input.title || `${from.name} → ${to.name}`,
      cargoType: input.cargoType,
      weightKg: input.weightKg,
      photos: [],
      pickup: { address: from.name, city: from.name, lat: from.lat, lng: from.lng },
      delivery: {
        address: to.name,
        city: to.name,
        lat: to.lat,
        lng: to.lng,
        contactName: input.clientName,
        contactPhone: input.clientPhone,
      },
      pickupDate: now,
      urgency: 'STANDARD',
      pricingMode: 'FIXED',
      vehicleType: input.vehicleType,
      declaredValue: input.declaredValue,
      insurance: !!input.insurance,
      distanceKm: route.distanceKm,
      durationH: route.durationH,
      budget: quote.totalTTC,
      status: 'ASSIGNED',
      createdAt: now,
    };
    d.freights.push(freight);

    const sSeq = ++d.meta.shipmentSeq;
    const shipment: Shipment = {
      id: nanoId('s'),
      reference: sequenceRef('EXP', sSeq),
      freightId: freight.id,
      shipperId: co.id,
      carrierId: co.id,
      driverId: driver?.id,
      vehicleId: vehicle?.id,
      price: quote.totalTTC,
      commission: 0,
      status: 'ASSIGNED',
      trackingCode: 'OW' + nanoId().slice(0, 6).toUpperCase(),
      currentLat: from.lat,
      currentLng: from.lng,
      progress: 0,
      createdAt: now,
    };
    d.shipments.push(shipment);

    d.tracking.push({
      id: nanoId('t'),
      shipmentId: shipment.id,
      status: 'ASSIGNED',
      label: `Course créée${driver ? ` · chauffeur ${driver.name}` : ''}`,
      lat: from.lat,
      lng: from.lng,
      by: co.id,
      createdAt: now,
    });

    if (driver) driver.status = 'ON_MISSION';

    return shipment;
  });
}

/** Avance la course d'une étape (réutilise la machine à états partagée). */
export function advanceCourse(shipmentId: string): { shipment: Shipment; event: TrackingEvent } {
  return advanceShipment({ shipmentId, by: company().id });
}

export interface CourseView {
  shipment: Shipment;
  freight: Freight;
  driverName?: string;
  vehicleLabel?: string;
  remainingKm: number;
  pct: number;
}

function toView(s: Shipment): CourseView {
  const d = db();
  const freight = d.freights.find((f) => f.id === s.freightId)!;
  const driver = d.drivers.find((dr) => dr.id === s.driverId);
  const vehicle = d.vehicles.find((v) => v.id === s.vehicleId);
  return {
    shipment: s,
    freight,
    driverName: driver?.name,
    vehicleLabel: vehicle?.name,
    remainingKm: remainingKm(freight.distanceKm, s.progress),
    pct: Math.round(s.progress * 100),
  };
}

/** Courses de l'entreprise (les plus récentes d'abord). Filtre par carrierId si fourni. */
export function allCourses(carrierId?: string): CourseView[] {
  return db()
    .shipments.slice()
    .filter((s) => !carrierId || s.carrierId === carrierId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toView);
}

export function activeCourses(carrierId?: string): CourseView[] {
  return allCourses(carrierId).filter((c) => !['DELIVERED', 'CANCELLED'].includes(c.shipment.status));
}

export function courseById(id: string): CourseView | undefined {
  const s = db().shipments.find((x) => x.id === id);
  return s ? toView(s) : undefined;
}

/** Courses affectées au chauffeur (par son compte utilisateur). */
export function driverCoursesByUser(userId: string): CourseView[] {
  const driver = db().drivers.find((dr) => dr.userId === userId);
  if (!driver) return [];
  return db()
    .shipments.filter((s) => s.driverId === driver.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toView);
}

/** Annule une course (libère chauffeur/véhicule, journalise). */
export function cancelCourse(shipmentId: string, by: string): void {
  write((d) => {
    const s = d.shipments.find((x) => x.id === shipmentId);
    if (!s || s.status === 'DELIVERED' || s.status === 'CANCELLED') return;
    s.status = 'CANCELLED';
    const freight = d.freights.find((f) => f.id === s.freightId);
    if (freight) freight.status = 'CANCELLED';
    const driver = d.drivers.find((dr) => dr.id === s.driverId);
    if (driver) driver.status = 'AVAILABLE';
    const tx = d.transactions.find((t) => t.shipmentId === s.id);
    if (tx) tx.status = 'REFUNDED';
    d.tracking.push({
      id: nanoId('t'),
      shipmentId: s.id,
      status: 'CANCELLED',
      label: 'Course annulée',
      by,
      createdAt: new Date().toISOString(),
    });
  });
}

export interface FleetStats {
  active: number;
  delivered: number;
  total: number;
  revenue: number;
  drivers: { id: string; name: string; phone: string; status: string }[];
}

export function fleetStats(carrierId?: string): FleetStats {
  const d = db();
  const coId = carrierId;
  const shipments = d.shipments.filter((s) => !coId || s.carrierId === coId);
  return {
    active: shipments.filter((s) => !['DELIVERED', 'CANCELLED'].includes(s.status)).length,
    delivered: shipments.filter((s) => s.status === 'DELIVERED').length,
    total: shipments.length,
    revenue: shipments.filter((s) => s.status === 'DELIVERED').reduce((sum, s) => sum + s.price, 0),
    drivers: d.drivers
      .filter((dr) => !coId || dr.carrierId === coId)
      .map((dr) => ({ id: dr.id, name: dr.name, phone: dr.phone, status: dr.status })),
  };
}

/** Liste des chauffeurs de l'entreprise (pour le formulaire de création). */
export function availableDrivers(carrierId?: string): { id: string; name: string }[] {
  const d = db();
  const coId = resolveCompanyId(carrierId);
  return d.drivers.filter((dr) => dr.carrierId === coId).map((dr) => ({ id: dr.id, name: dr.name }));
}

/** Véhicules de l'entreprise. */
export function companyVehicles(carrierId?: string) {
  const coId = resolveCompanyId(carrierId);
  return db().vehicles.filter((v) => v.carrierId === coId);
}
