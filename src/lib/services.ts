import 'server-only';
import { db, write } from './db';
import { estimateRoute, lerpPoint, findCity } from './geo';
import { computeQuote } from './pricing';
import { MARKETPLACE } from '@/data/catalog';
import { nanoId, sequenceRef } from './utils';
import { STATUS_FLOW, STATUS_LABEL } from './flow';
import type {
  Bid,
  Freight,
  Notification,
  Shipment,
  ShipmentStatus,
  TrackingEvent,
} from './types';

/** Commission rate for a carrier (reduced when Premium). */
export function commissionRateFor(carrierId: string): number {
  const carrier = db().users.find((u) => u.id === carrierId);
  return carrier?.premium ? MARKETPLACE.commissionRatePremiumCarrier : MARKETPLACE.commissionRate;
}

export function notify(userId: string, n: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>) {
  write((d) => {
    d.notifications.unshift({
      id: nanoId('n'),
      userId,
      read: false,
      createdAt: new Date().toISOString(),
      ...n,
    });
  });
}

/** Carrier places (or updates) a bid on a published freight. */
export function placeBid(params: {
  freightId: string;
  carrierId: string;
  amount: number;
  etaHours: number;
  message?: string;
  vehicleId?: string;
}): Bid {
  return write((d) => {
    const freight = d.freights.find((f) => f.id === params.freightId);
    if (!freight) throw new Error('Annonce introuvable');
    if (freight.status !== 'PUBLISHED') throw new Error('Cette annonce n’accepte plus d’offres');

    const existing = d.bids.find(
      (b) => b.freightId === params.freightId && b.carrierId === params.carrierId && b.status === 'PENDING',
    );
    if (existing) {
      existing.amount = params.amount;
      existing.etaHours = params.etaHours;
      existing.message = params.message;
      existing.vehicleId = params.vehicleId;
      return existing;
    }
    const bid: Bid = {
      id: nanoId('b'),
      freightId: params.freightId,
      carrierId: params.carrierId,
      amount: params.amount,
      etaHours: params.etaHours,
      message: params.message,
      vehicleId: params.vehicleId,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    d.bids.push(bid);
    const carrier = d.users.find((u) => u.id === params.carrierId);
    // Notify shipper (outside this write via direct push to keep it atomic)
    d.notifications.unshift({
      id: nanoId('n'), userId: freight.shipperId, type: 'BID', read: false,
      title: 'Nouvelle offre reçue',
      body: `${carrier?.companyName ?? 'Un transporteur'} a proposé un prix pour ${freight.reference}.`,
      href: `/app/shipper/freight/${freight.id}`, createdAt: new Date().toISOString(),
    });
    return bid;
  });
}

/**
 * Shipper accepts a bid → creates the Shipment (mission), books the carrier,
 * rejects the other bids, opens the escrow transaction and the first
 * tracking event. This is the heart of the marketplace.
 */
export function acceptBid(freightId: string, bidId: string): Shipment {
  return write((d) => {
    const freight = d.freights.find((f) => f.id === freightId);
    if (!freight) throw new Error('Annonce introuvable');
    if (freight.status !== 'PUBLISHED') throw new Error('Annonce déjà attribuée');
    const bid = d.bids.find((b) => b.id === bidId && b.freightId === freightId);
    if (!bid) throw new Error('Offre introuvable');

    bid.status = 'ACCEPTED';
    d.bids
      .filter((b) => b.freightId === freightId && b.id !== bidId)
      .forEach((b) => (b.status = 'REJECTED'));
    freight.status = 'ASSIGNED';

    const seq = ++d.meta.shipmentSeq;
    const commission = Math.round(bid.amount * commissionRateFor(bid.carrierId));
    const driver = d.drivers.find((dr) => dr.carrierId === bid.carrierId && dr.status === 'AVAILABLE');

    const shipment: Shipment = {
      id: nanoId('s'),
      reference: sequenceRef('EXP', seq),
      freightId,
      shipperId: freight.shipperId,
      carrierId: bid.carrierId,
      driverId: driver?.id,
      vehicleId: bid.vehicleId ?? driver?.vehicleId,
      bidId: bid.id,
      price: bid.amount,
      commission,
      status: 'ASSIGNED',
      trackingCode: 'OW' + nanoId().slice(0, 6).toUpperCase(),
      currentLat: freight.pickup.lat,
      currentLng: freight.pickup.lng,
      progress: 0,
      createdAt: new Date().toISOString(),
    };
    d.shipments.push(shipment);

    d.tracking.push({
      id: nanoId('t'),
      shipmentId: shipment.id,
      status: 'ASSIGNED',
      label: 'Mission attribuée au transporteur',
      by: freight.shipperId,
      createdAt: new Date().toISOString(),
    });

    const seqTx = ++d.meta.txSeq;
    d.transactions.push({
      id: nanoId('tx'),
      reference: sequenceRef('PAY', seqTx),
      shipmentId: shipment.id,
      payerId: freight.shipperId,
      payeeId: bid.carrierId,
      amount: bid.amount,
      commission,
      method: 'MVOLA',
      status: 'ESCROW',
      createdAt: new Date().toISOString(),
    });

    if (driver) driver.status = 'ON_MISSION';

    // Generate a Bordereau de Livraison placeholder.
    d.documents.push({
      id: nanoId('doc'),
      shipmentId: shipment.id,
      freightId,
      type: 'BL',
      reference: `BL-${shipment.reference}`,
      title: `Bordereau de livraison — ${shipment.reference}`,
      createdAt: new Date().toISOString(),
    });

    d.notifications.unshift({
      id: nanoId('n'), userId: bid.carrierId, type: 'MISSION', read: false,
      title: 'Offre acceptée 🎉', body: `Votre offre pour ${freight.reference} a été acceptée.`,
      href: `/app/carrier/mission/${shipment.id}`, createdAt: new Date().toISOString(),
    });

    return shipment;
  });
}

/** Driver/carrier advances a shipment along the status flow. */
export function advanceShipment(params: {
  shipmentId: string;
  status?: ShipmentStatus;
  note?: string;
  photoUrl?: string;
  by: string;
}): { shipment: Shipment; event: TrackingEvent } {
  return write((d) => {
    const shipment = d.shipments.find((s) => s.id === params.shipmentId);
    if (!shipment) throw new Error('Expédition introuvable');
    const freight = d.freights.find((f) => f.id === shipment.freightId)!;

    const nextStatus =
      params.status ??
      STATUS_FLOW[Math.min(STATUS_FLOW.indexOf(shipment.status) + 1, STATUS_FLOW.length - 1)];

    const idx = STATUS_FLOW.indexOf(nextStatus);
    const progress =
      nextStatus === 'DELIVERED' ? 1 : Math.min(0.95, Math.max(shipment.progress, idx / (STATUS_FLOW.length - 1)));
    const pos = lerpPoint(freight.pickup, freight.delivery, progress);

    shipment.status = nextStatus;
    shipment.progress = progress;
    shipment.currentLat = pos.lat;
    shipment.currentLng = pos.lng;
    if (nextStatus === 'IN_TRANSIT') freight.status = 'IN_TRANSIT';
    if (nextStatus === 'DELIVERED') {
      freight.status = 'DELIVERED';
      shipment.deliveredAt = new Date().toISOString();
      const tx = d.transactions.find((t) => t.shipmentId === shipment.id);
      if (tx) tx.status = 'RELEASED';
      const driver = d.drivers.find((dr) => dr.id === shipment.driverId);
      if (driver) driver.status = 'AVAILABLE';
      // POD + invoice
      d.documents.push(
        { id: nanoId('doc'), shipmentId: shipment.id, freightId: freight.id, type: 'POD', reference: `POD-${shipment.reference}`, title: `Preuve de livraison — ${shipment.reference}`, createdAt: new Date().toISOString() },
        { id: nanoId('doc'), shipmentId: shipment.id, freightId: freight.id, type: 'INVOICE', reference: `FAC-${shipment.reference}`, title: `Facture — ${shipment.reference}`, createdAt: new Date().toISOString() },
      );
    }

    const event: TrackingEvent = {
      id: nanoId('t'),
      shipmentId: shipment.id,
      status: nextStatus,
      label: STATUS_LABEL[nextStatus],
      lat: pos.lat,
      lng: pos.lng,
      note: params.note,
      photoUrl: params.photoUrl,
      by: params.by,
      createdAt: new Date().toISOString(),
    };
    d.tracking.push(event);

    d.notifications.unshift({
      id: nanoId('n'), userId: shipment.shipperId, type: 'TRACKING', read: false,
      title: `Suivi ${shipment.reference}`, body: STATUS_LABEL[nextStatus],
      href: `/app/shipper/tracking/${shipment.id}`, createdAt: new Date().toISOString(),
    });

    return { shipment, event };
  });
}

/** Smart matching: rank available carriers for a freight. */
export interface MatchSuggestion {
  carrierId: string;
  companyName: string;
  city?: string;
  rating: number;
  premium: boolean;
  vehicleType: string;
  estimatedPrice: number;
  distanceToPickupKm: number;
  score: number;
}

export function matchCarriers(freight: Freight, limit = 5): MatchSuggestion[] {
  const d = db();
  const suggestions: MatchSuggestion[] = [];
  for (const carrier of d.users.filter((u) => u.role === 'CARRIER')) {
    const fleet = d.vehicles.filter((v) => v.carrierId === carrier.id && v.available);
    // Prefer a vehicle matching the requested class, else any with capacity.
    const vehicle =
      fleet.find((v) => v.type === freight.vehicleType) ??
      fleet.find((v) => v.capacityKg >= freight.weightKg);
    if (!vehicle) continue;

    const pickupCity = findCity(freight.pickup.city);
    const distanceToPickup =
      vehicle.lat != null && vehicle.lng != null && pickupCity
        ? Math.round(estimateRoute(
            d.users.find((u) => u.id === carrier.id)?.city ?? '',
            freight.pickup.city,
          ).distanceKm)
        : 0;

    const q = computeQuote({
      distanceKm: freight.distanceKm,
      vehicleType: freight.vehicleType,
      cargoType: freight.cargoType,
      handlingPickup: true,
      handlingDelivery: true,
      insurance: freight.insurance,
      declaredValue: freight.declaredValue,
      vat: false,
    }, commissionRateFor(carrier.id));

    // Score: rating (40%), proximity (30%), price competitiveness (20%), premium (10%).
    const proximityScore = 1 - Math.min(1, distanceToPickup / 800);
    const priceScore = Math.min(1, freight.budget / Math.max(1, q.totalTTC));
    const score =
      (carrier.rating / 5) * 0.4 + proximityScore * 0.3 + priceScore * 0.2 + (carrier.premium ? 0.1 : 0);

    suggestions.push({
      carrierId: carrier.id,
      companyName: carrier.companyName ?? carrier.name,
      city: carrier.city,
      rating: carrier.rating,
      premium: carrier.premium,
      vehicleType: vehicle.type,
      estimatedPrice: q.totalTTC,
      distanceToPickupKm: distanceToPickup,
      score: +score.toFixed(3),
    });
  }
  return suggestions.sort((a, b) => b.score - a.score).slice(0, limit);
}
