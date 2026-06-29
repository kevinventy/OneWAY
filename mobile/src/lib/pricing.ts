/**
 * ONE WAY pricing engine — a faithful port of the Excel
 * "CALCULATEUR DE PRIX RAPIDE" sheet.
 *
 * Decomposition (all amounts in Ariary):
 *   frais_km     = distance × tarif/km × (1 + surcharge_véhicule) × coeff_marchandise × (1 + situations)
 *   forfait      = forfait de base du véhicule
 *   manutention  = (chargement ? rate×forfait : 0) + (déchargement ? rate×forfait : 0)
 *   assurance    = taux_assurance × valeur_déclarée
 *   frais_divers = taux_divers × frais_km
 *   ──────────────────────────────────────────────
 *   sous_total_HT      = somme des lignes ci-dessus
 *   base_imposable     = sous_total_HT × (1 − remise%)
 *   tva                = tva_applicable ? base × 20% : 0
 *   total_TTC          = base_imposable + tva
 */

import {
  CARGO_TYPES,
  PRICING_DEFAULTS,
  SITUATION_SURCHARGES,
  VEHICLE_TYPES,
  cargoByKey,
  vehicleByKey,
  type CargoTypeKey,
  type VehicleTypeKey,
} from '@/data/catalog';

export interface QuoteInput {
  distanceKm: number;
  vehicleType: VehicleTypeKey;
  cargoType: CargoTypeKey;
  weightKg?: number;
  declaredValue?: number;
  handlingPickup?: boolean;
  handlingDelivery?: boolean;
  express?: boolean;
  night?: boolean;
  ruralRoad?: boolean;
  insurance?: boolean;
  discountPct?: number; // 0..100
  vat?: boolean;
}

export interface QuoteLine {
  key: string;
  label: string;
  amount: number;
}

export interface QuoteResult {
  lines: QuoteLine[];
  subtotalHT: number;
  discountPct: number;
  discountAmount: number;
  taxableBase: number;
  vatRate: number;
  vatAmount: number;
  totalTTC: number;
  pricePerKm: number;
  /** Suggested marketplace commission for this job. */
  commission: number;
  currency: 'MGA';
  meta: { vehicleLabel: string; cargoLabel: string; coefficient: number };
}

function round(n: number): number {
  // Round to the nearest 100 Ar, as on the printed quotes.
  return Math.round(n / 100) * 100;
}

export function computeQuote(input: QuoteInput, commissionRate = 0.12): QuoteResult {
  const v = vehicleByKey(input.vehicleType);
  const cargo = cargoByKey(input.cargoType);
  const d = PRICING_DEFAULTS;

  let situationFactor = 0;
  if (input.express) situationFactor += SITUATION_SURCHARGES.express.factor;
  if (input.night) situationFactor += SITUATION_SURCHARGES.night.factor;
  if (input.ruralRoad) situationFactor += SITUATION_SURCHARGES.ruralRoad.factor;

  const distance = Math.max(0, input.distanceKm || 0);

  const fraisKm = round(
    distance * v.ratePerKm * (1 + v.surcharge) * cargo.coefficient * (1 + situationFactor),
  );
  const forfait = v.baseFee;
  const manutentionPickup = input.handlingPickup ? round(v.baseFee * d.handlingRate) : 0;
  const manutentionDelivery = input.handlingDelivery ? round(v.baseFee * d.handlingRate) : 0;
  const assurance = input.insurance ? round((input.declaredValue || 0) * d.insuranceRate) : 0;
  const fraisDivers = round(fraisKm * d.miscFeesRate);

  const lines: QuoteLine[] = [
    { key: 'km', label: 'Frais kilométriques', amount: fraisKm },
    { key: 'forfait', label: 'Forfait de base véhicule', amount: forfait },
  ];
  if (manutentionPickup) lines.push({ key: 'man_charg', label: 'Manutention chargement', amount: manutentionPickup });
  if (manutentionDelivery) lines.push({ key: 'man_dech', label: 'Manutention déchargement', amount: manutentionDelivery });
  if (assurance) lines.push({ key: 'assurance', label: 'Assurance marchandise (0,5 %)', amount: assurance });
  lines.push({ key: 'divers', label: 'Frais divers (péages, etc.)', amount: fraisDivers });

  const subtotalHT = lines.reduce((s, l) => s + l.amount, 0);
  const discountPct = Math.min(100, Math.max(0, input.discountPct ?? d.defaultDiscount));
  const discountAmount = round(subtotalHT * (discountPct / 100));
  const taxableBase = subtotalHT - discountAmount;
  const vatRate = input.vat ? d.vatRate : 0;
  const vatAmount = round(taxableBase * vatRate);
  const totalTTC = taxableBase + vatAmount;
  const pricePerKm = distance > 0 ? Math.round(totalTTC / distance) : 0;

  return {
    lines,
    subtotalHT,
    discountPct,
    discountAmount,
    taxableBase,
    vatRate,
    vatAmount,
    totalTTC,
    pricePerKm,
    commission: round(totalTTC * commissionRate),
    currency: 'MGA',
    meta: { vehicleLabel: v.label, cargoLabel: cargo.label, coefficient: cargo.coefficient },
  };
}

/** Convenience for matching: quick budget estimate from minimal inputs. */
export function quickEstimate(distanceKm: number, vehicleType: VehicleTypeKey, cargoType: CargoTypeKey = 'GENERAL'): number {
  return computeQuote({
    distanceKm,
    vehicleType,
    cargoType,
    handlingPickup: true,
    handlingDelivery: true,
    insurance: false,
    vat: false,
  }).totalTTC;
}

export { VEHICLE_TYPES, CARGO_TYPES };
