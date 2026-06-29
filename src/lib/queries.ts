import 'server-only';
import { db } from './db';
import { toPublicUser, type Bid, type Freight, type PublicUser, type Shipment } from './types';

export function userById(id?: string): PublicUser | undefined {
  if (!id) return undefined;
  const u = db().users.find((x) => x.id === id);
  return u ? toPublicUser(u) : undefined;
}

export function freightById(id: string): Freight | undefined {
  return db().freights.find((f) => f.id === id);
}

export function bidsForFreight(freightId: string): Bid[] {
  return db()
    .bids.filter((b) => b.freightId === freightId)
    .sort((a, b) => a.amount - b.amount);
}

export function shipmentById(id: string): Shipment | undefined {
  return db().shipments.find((s) => s.id === id);
}

export function shipmentByFreight(freightId: string): Shipment | undefined {
  return db().shipments.find((s) => s.freightId === freightId);
}

export function trackingFor(shipmentId: string) {
  return db()
    .tracking.filter((t) => t.shipmentId === shipmentId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function documentsFor(opts: { shipmentId?: string; freightId?: string }) {
  return db().documents.filter(
    (d) =>
      (opts.shipmentId && d.shipmentId === opts.shipmentId) ||
      (opts.freightId && d.freightId === opts.freightId),
  );
}

export function unreadNotifications(userId: string): number {
  return db().notifications.filter((n) => n.userId === userId && !n.read).length;
}

export function notificationsFor(userId: string) {
  return db()
    .notifications.filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ── Role dashboards ────────────────────────────────────────────────────

export function shipperFreights(shipperId: string): Freight[] {
  return db()
    .freights.filter((f) => f.shipperId === shipperId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function openMarketplace(filter?: { cargo?: string; vehicle?: string; q?: string }): Freight[] {
  let list = db()
    .freights.filter((f) => f.status === 'PUBLISHED')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (filter?.cargo) list = list.filter((f) => f.cargoType === filter.cargo);
  if (filter?.vehicle) list = list.filter((f) => f.vehicleType === filter.vehicle);
  if (filter?.q) {
    const q = filter.q.toLowerCase();
    list = list.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.pickup.city.toLowerCase().includes(q) ||
        f.delivery.city.toLowerCase().includes(q),
    );
  }
  return list;
}

export function carrierShipments(carrierId: string): Shipment[] {
  return db()
    .shipments.filter((s) => s.carrierId === carrierId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function shipperShipments(shipperId: string): Shipment[] {
  return db()
    .shipments.filter((s) => s.shipperId === shipperId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function carrierBids(carrierId: string): Bid[] {
  return db()
    .bids.filter((b) => b.carrierId === carrierId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function driverShipments(driverUserId: string): Shipment[] {
  const driver = db().drivers.find((d) => d.userId === driverUserId);
  if (!driver) return [];
  return db()
    .shipments.filter((s) => s.driverId === driver.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function vehiclesOf(carrierId: string) {
  return db().vehicles.filter((v) => v.carrierId === carrierId);
}

export function driversOf(carrierId: string) {
  return db().drivers.filter((d) => d.carrierId === carrierId);
}

export function reviewsFor(userId: string) {
  return db()
    .reviews.filter((r) => r.toUserId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ── Admin KPIs ─────────────────────────────────────────────────────────

export interface AdminStats {
  users: number;
  shippers: number;
  carriers: number;
  drivers: number;
  freights: number;
  activeShipments: number;
  delivered: number;
  gmv: number; // gross merchandise value
  revenue: number; // ONE WAY commission
  pendingKyc: number;
  byVehicle: { name: string; value: number }[];
  monthly: { month: string; gmv: number; revenue: number; shipments: number }[];
}

export function adminStats(): AdminStats {
  const d = db();
  const delivered = d.shipments.filter((s) => s.status === 'DELIVERED');
  const gmv = d.shipments.reduce((s, x) => s + x.price, 0);
  const revenue = d.shipments.reduce((s, x) => s + x.commission, 0);

  const byVehicleMap = new Map<string, number>();
  for (const f of d.freights) byVehicleMap.set(f.vehicleType, (byVehicleMap.get(f.vehicleType) ?? 0) + 1);

  // Synthetic 6-month trend (demo): scale around current totals.
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
  const monthly = months.map((m, i) => {
    const factor = 0.45 + i * 0.12;
    return {
      month: m,
      gmv: Math.round((gmv || 12_000_000) * factor),
      revenue: Math.round((revenue || 1_400_000) * factor),
      shipments: Math.max(1, Math.round((d.shipments.length || 6) * factor)),
    };
  });

  return {
    users: d.users.length,
    shippers: d.users.filter((u) => u.role === 'SHIPPER').length,
    carriers: d.users.filter((u) => u.role === 'CARRIER').length,
    drivers: d.users.filter((u) => u.role === 'DRIVER').length,
    freights: d.freights.length,
    activeShipments: d.shipments.filter((s) => !['DELIVERED', 'CANCELLED'].includes(s.status)).length,
    delivered: delivered.length,
    gmv,
    revenue,
    pendingKyc: d.kyc.filter((k) => k.status === 'PENDING').length,
    byVehicle: [...byVehicleMap.entries()].map(([name, value]) => ({ name, value })),
    monthly,
  };
}
