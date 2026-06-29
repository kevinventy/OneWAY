import type { ShipmentStatus } from './types';

/** Linear delivery lifecycle (client-safe — shared by UI and services). */
export const STATUS_FLOW: ShipmentStatus[] = [
  'ASSIGNED',
  'EN_ROUTE_PICKUP',
  'AT_PICKUP',
  'LOADED',
  'IN_TRANSIT',
  'AT_DELIVERY',
  'DELIVERED',
];

export const STATUS_LABEL: Record<ShipmentStatus, string> = {
  ASSIGNED: 'Mission attribuée',
  EN_ROUTE_PICKUP: 'En route vers le chargement',
  AT_PICKUP: 'Arrivé au point de chargement',
  LOADED: 'Chargement terminé',
  IN_TRANSIT: 'En transit',
  AT_DELIVERY: 'Arrivé au point de livraison',
  DELIVERED: 'Livraison confirmée',
  CANCELLED: 'Annulé',
};

export const STATUS_ACTION: Partial<Record<ShipmentStatus, string>> = {
  ASSIGNED: 'Démarrer — en route vers le chargement',
  EN_ROUTE_PICKUP: 'Je suis au point de chargement',
  AT_PICKUP: 'Chargement terminé',
  LOADED: 'Démarrer le transit',
  IN_TRANSIT: 'Arrivé à destination',
  AT_DELIVERY: 'Confirmer la livraison',
};

export function nextStatus(current: ShipmentStatus): ShipmentStatus | null {
  const i = STATUS_FLOW.indexOf(current);
  if (i < 0 || i >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[i + 1];
}
