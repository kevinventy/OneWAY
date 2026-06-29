import type { BidStatus, FreightStatus, ShipmentStatus, TxStatus, Role, Urgency } from './types';

export const FREIGHT_STATUS: Record<FreightStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: 'Brouillon', tone: 'slate' },
  PUBLISHED: { label: 'Publié', tone: 'blue' },
  ASSIGNED: { label: 'Attribué', tone: 'amber' },
  IN_TRANSIT: { label: 'En transit', tone: 'amber' },
  DELIVERED: { label: 'Livré', tone: 'green' },
  CANCELLED: { label: 'Annulé', tone: 'red' },
};

export const SHIPMENT_STATUS: Record<ShipmentStatus, { label: string; tone: Tone }> = {
  ASSIGNED: { label: 'Attribué', tone: 'slate' },
  EN_ROUTE_PICKUP: { label: 'Vers chargement', tone: 'blue' },
  AT_PICKUP: { label: 'Au chargement', tone: 'blue' },
  LOADED: { label: 'Chargé', tone: 'blue' },
  IN_TRANSIT: { label: 'En transit', tone: 'amber' },
  AT_DELIVERY: { label: 'À destination', tone: 'amber' },
  DELIVERED: { label: 'Livré', tone: 'green' },
  CANCELLED: { label: 'Annulé', tone: 'red' },
};

export const BID_STATUS: Record<BidStatus, { label: string; tone: Tone }> = {
  PENDING: { label: 'En attente', tone: 'amber' },
  ACCEPTED: { label: 'Acceptée', tone: 'green' },
  REJECTED: { label: 'Refusée', tone: 'red' },
  WITHDRAWN: { label: 'Retirée', tone: 'slate' },
};

export const TX_STATUS: Record<TxStatus, { label: string; tone: Tone }> = {
  PENDING: { label: 'En attente', tone: 'slate' },
  ESCROW: { label: 'Sous séquestre', tone: 'amber' },
  RELEASED: { label: 'Versé', tone: 'green' },
  REFUNDED: { label: 'Remboursé', tone: 'blue' },
  FAILED: { label: 'Échoué', tone: 'red' },
};

export const URGENCY: Record<Urgency, { label: string; tone: Tone }> = {
  STANDARD: { label: 'Standard', tone: 'slate' },
  EXPRESS: { label: 'Express', tone: 'red' },
  FLEXIBLE: { label: 'Flexible', tone: 'green' },
};

export const ROLE_LABEL: Record<Role, string> = {
  SHIPPER: 'Chargeur',
  CARRIER: 'Transporteur',
  DRIVER: 'Chauffeur',
  ADMIN: 'Administrateur',
};

export const KYC_LABEL: Record<string, { label: string; tone: Tone }> = {
  NONE: { label: 'Non vérifié', tone: 'slate' },
  PENDING: { label: 'En cours', tone: 'amber' },
  VERIFIED: { label: 'Vérifié', tone: 'green' },
  REJECTED: { label: 'Rejeté', tone: 'red' },
};

export type Tone = 'slate' | 'blue' | 'amber' | 'green' | 'red';

export const TONE_CLASS: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-600',
  blue: 'bg-brand-50 text-brand-700',
  amber: 'bg-amber-100 text-amber-600',
  green: 'bg-emerald-100 text-emerald-700',
  red: 'bg-rose-100 text-rose-600',
};
