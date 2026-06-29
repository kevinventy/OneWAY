/**
 * ONE WAY commercial catalog.
 *
 * Source of truth = the "PARAMÈTRES & TARIFS DE RÉFÉRENCE" and
 * "COEFFICIENTS DE MAJORATION" sheets of OneWay_Devis_Transport.xlsx.
 * Kept in code so the live price calculator and the printed quote stay in sync.
 *
 * Modèle de prix rectifié : le tarif kilométrique est « hors carburant » et le
 * carburant est une ligne explicite, calculée à partir de la consommation
 * propre à chaque type de transport et du prix courant du gasoil/essence
 * (cf. FUEL_PRICES). Régénérer l'Excel : `python3 scripts/gen-devis-transport.py`.
 *
 * Amounts are in Ariary (MGA).
 */

export type VehicleTypeKey =
  | 'MOTO'
  | 'CAMIONNETTE'
  | 'CAMION_3T'
  | 'CAMION_5T'
  | 'CAMION_10T'
  | 'SEMI_20T'
  | 'FRIGO_5T'
  | 'BENNE_15T'
  | 'CONTENEUR_20'
  | 'CONTENEUR_40';

export type FuelKey = 'DIESEL' | 'ESSENCE';

/**
 * Prix du carburant à la pompe (Ariary / litre) — Madagascar, paramétrable.
 * Modifiable par l'admin lorsque le cours évolue : tous les frais de carburant
 * sont recalculés automatiquement à partir de ces deux valeurs.
 */
export const FUEL_PRICES: Record<FuelKey, number> = {
  DIESEL: 4_900, // gasoil
  ESSENCE: 5_100, // sans plomb / super
};

export interface VehicleType {
  /** 1..10 calculator index, matching the Excel "Type véhicule (1→10)". */
  index: number;
  key: VehicleTypeKey;
  label: string;
  capacityLabel: string;
  maxKg: number;
  /** Kilometric haulage rate (Ar/km), **carburant exclu** (usure, pneus, conducteur, marge). */
  ratePerKm: number;
  /** Carburant utilisé par ce véhicule. */
  fuelType: FuelKey;
  /** Consommation moyenne (litres / 100 km) — base du calcul carburant par type de transport. */
  fuelConsumption: number;
  /** Fixed pickup / handling base fee (Ar). */
  baseFee: number;
  /** Vehicle-class surcharge over the reference rate. */
  surcharge: number;
  refrigerated?: boolean;
  emoji: string;
}

// Tarifs rectifiés : le kilométrique est désormais « hors carburant » et le
// carburant est facturé séparément en fonction de la consommation propre à
// chaque type de transport (un semi-remorque brûle ~12× plus qu'une moto).
export const VEHICLE_TYPES: VehicleType[] = [
  { index: 1, key: 'MOTO', label: 'Moto-taxi / Tricycle', capacityLabel: '< 200 kg', maxKg: 200, ratePerKm: 800, fuelType: 'ESSENCE', fuelConsumption: 3, baseFee: 15_000, surcharge: 0, emoji: '🛵' },
  { index: 2, key: 'CAMIONNETTE', label: 'Camionnette légère', capacityLabel: '200 – 800 kg', maxKg: 800, ratePerKm: 1_200, fuelType: 'DIESEL', fuelConsumption: 10, baseFee: 30_000, surcharge: 0.1, emoji: '🚐' },
  { index: 3, key: 'CAMION_3T', label: 'Camion 3 tonnes', capacityLabel: '800 kg – 3 T', maxKg: 3_000, ratePerKm: 1_900, fuelType: 'DIESEL', fuelConsumption: 18, baseFee: 60_000, surcharge: 0.15, emoji: '🚚' },
  { index: 4, key: 'CAMION_5T', label: 'Camion 5 tonnes', capacityLabel: '3 T – 5 T', maxKg: 5_000, ratePerKm: 2_800, fuelType: 'DIESEL', fuelConsumption: 25, baseFee: 100_000, surcharge: 0.2, emoji: '🚚' },
  { index: 5, key: 'CAMION_10T', label: 'Camion 10 tonnes', capacityLabel: '5 T – 10 T', maxKg: 10_000, ratePerKm: 3_900, fuelType: 'DIESEL', fuelConsumption: 32, baseFee: 180_000, surcharge: 0.25, emoji: '🚛' },
  { index: 6, key: 'SEMI_20T', label: 'Semi-remorque 20 T', capacityLabel: '10 T – 20 T', maxKg: 20_000, ratePerKm: 5_600, fuelType: 'DIESEL', fuelConsumption: 38, baseFee: 300_000, surcharge: 0.3, emoji: '🚛' },
  { index: 7, key: 'FRIGO_5T', label: 'Camion frigorifique 5 T', capacityLabel: '3 T – 5 T frigo', maxKg: 5_000, ratePerKm: 3_800, fuelType: 'DIESEL', fuelConsumption: 28, baseFee: 150_000, surcharge: 0.2, refrigerated: true, emoji: '❄️' },
  { index: 8, key: 'BENNE_15T', label: 'Camion benne', capacityLabel: "Jusqu'à 15 T", maxKg: 15_000, ratePerKm: 4_300, fuelType: 'DIESEL', fuelConsumption: 35, baseFee: 200_000, surcharge: 0.25, emoji: '🚜' },
  { index: 9, key: 'CONTENEUR_20', label: 'Conteneur 20 pieds', capacityLabel: 'Max 24 T', maxKg: 24_000, ratePerKm: 4_600, fuelType: 'DIESEL', fuelConsumption: 38, baseFee: 250_000, surcharge: 0.35, emoji: '📦' },
  { index: 10, key: 'CONTENEUR_40', label: 'Conteneur 40 pieds', capacityLabel: 'Max 28 T', maxKg: 28_000, ratePerKm: 6_300, fuelType: 'DIESEL', fuelConsumption: 45, baseFee: 400_000, surcharge: 0.4, emoji: '📦' },
];

/** Coût carburant (Ar/km) pour un véhicule donné, au prix courant de la pompe. */
export function fuelCostPerKm(v: VehicleType): number {
  return (v.fuelConsumption / 100) * FUEL_PRICES[v.fuelType];
}

export function vehicleByKey(key: VehicleTypeKey): VehicleType {
  return VEHICLE_TYPES.find((v) => v.key === key) ?? VEHICLE_TYPES[2];
}
export function vehicleByIndex(i: number): VehicleType {
  return VEHICLE_TYPES.find((v) => v.index === i) ?? VEHICLE_TYPES[2];
}

/** Smallest vehicle class that can carry `weightKg`. */
export function suggestVehicle(weightKg: number, refrigerated = false): VehicleType {
  const pool = refrigerated ? VEHICLE_TYPES.filter((v) => v.refrigerated) : VEHICLE_TYPES;
  return pool.find((v) => v.maxKg >= weightKg) ?? VEHICLE_TYPES[VEHICLE_TYPES.length - 1];
}

export type CargoTypeKey =
  | 'GENERAL'
  | 'PERISSABLE'
  | 'FRAGILE'
  | 'LOURD'
  | 'DANGEREUX'
  | 'CONTENEUR_FCL'
  | 'CONVOI_EXCEPTIONNEL'
  | 'ANIMAUX';

export interface CargoType {
  key: CargoTypeKey;
  label: string;
  /** Multiplier applied to the kilometric cost (Excel "COEFF."). */
  coefficient: number;
  note: string;
  emoji: string;
}

export const CARGO_TYPES: CargoType[] = [
  { key: 'GENERAL', label: 'Marchandises générales', coefficient: 1.0, note: 'Tarif de référence', emoji: '📦' },
  { key: 'PERISSABLE', label: 'Produits périssables / alimentaires', coefficient: 1.35, note: 'Urgence + conditionnement', emoji: '🥬' },
  { key: 'FRAGILE', label: 'Fragiles / électroniques', coefficient: 1.25, note: 'Emballage soigné', emoji: '📱' },
  { key: 'LOURD', label: 'Matériaux lourds (ciment, ferraille)', coefficient: 1.15, note: 'Renforcement camion', emoji: '🧱' },
  { key: 'DANGEREUX', label: 'Produits dangereux (ADR)', coefficient: 1.8, note: 'Conformité réglementaire', emoji: '☣️' },
  { key: 'CONTENEUR_FCL', label: 'Conteneur chargé (FCL)', coefficient: 2.1, note: 'Équipement spécial', emoji: '🚢' },
  { key: 'CONVOI_EXCEPTIONNEL', label: 'Convoi exceptionnel (>48 T)', coefficient: 3.0, note: 'Escorte police obligatoire', emoji: '🚧' },
  { key: 'ANIMAUX', label: 'Animaux vivants', coefficient: 1.6, note: 'Conditions spéciales', emoji: '🐄' },
];

export function cargoByKey(key: CargoTypeKey): CargoType {
  return CARGO_TYPES.find((c) => c.key === key) ?? CARGO_TYPES[0];
}

/** Situational surcharges that stack on top of the cargo coefficient. */
export const SITUATION_SURCHARGES = {
  express: { label: 'Service express (J+1)', factor: 0.3 },
  night: { label: 'Livraison de nuit (22h-6h)', factor: 0.2 },
  ruralRoad: { label: 'Zones rurales / pistes dégradées', factor: 0.15 },
} as const;

/** Default platform parameters (also editable by admin). */
export const PRICING_DEFAULTS = {
  insuranceRate: 0.005, // 0,5 % de la valeur déclarée
  handlingRate: 0.15, // manutention = 15 % du forfait véhicule (par opération)
  miscFeesRate: 0.03, // frais divers (péages...) = 3 % des frais kilométriques
  vatRate: 0.2, // TVA 20 %
  defaultDiscount: 0,
  currency: 'MGA' as const,
  quoteValidityDays: 30,
  freeWaitingHours: 2,
  // Aller-retour : le véhicule doit revenir à son point de départ. Le trajet
  // retour (souvent à vide) est facturé au prix de l'aller × ce coefficient.
  // 0,7 = retour à vide standard (carburant + usure + conducteur, partiellement
  // compensé par un éventuel fret retour). Mettre 1 pour facturer le retour
  // plein, 0 pour un aller simple.
  roundTripDefault: true,
  returnLegRate: 0.7,
};

/**
 * Prestations annexes proposées par ONE WAY (transport · livraison · suivi
 * digital). Servent à enrichir le devis ; montants indicatifs en Ariary.
 */
export const EXTRA_SERVICES = [
  { key: 'ARRIMAGE', label: 'Arrimage / sanglage / bâchage', unit: 'forfait', price: 25_000, emoji: '🪢' },
  { key: 'EMBALLAGE', label: 'Emballage / palettisation', unit: 'palette', price: 20_000, emoji: '📦' },
  { key: 'SUIVI_GPS', label: 'Suivi GPS temps réel (plateforme ONE WAY)', unit: 'forfait', price: 15_000, emoji: '📡' },
  { key: 'DOUANE', label: 'Accompagnement douane / portuaire', unit: 'dossier', price: 50_000, emoji: '🛃' },
  { key: 'GARDIENNAGE', label: 'Gardiennage / stationnement de nuit', unit: 'nuit', price: 30_000, emoji: '🌙' },
  { key: 'ATTENTE', label: "Heure d'attente (>2h offert)", unit: 'heure', price: 20_000, emoji: '⏱️' },
  { key: 'ESCORTE', label: 'Escorte / convoi exceptionnel', unit: 'forfait', price: 120_000, emoji: '🚨' },
  { key: 'ADMIN', label: 'Frais administratifs / documentation', unit: 'dossier', price: 15_000, emoji: '🗂️' },
] as const;

/** Marketplace economics. */
export const MARKETPLACE = {
  /** Commission ONE WAY prélevée sur chaque transaction. */
  commissionRate: 0.12,
  /** Commission réduite pour les abonnés Premium transporteur. */
  commissionRatePremiumCarrier: 0.08,
  depositRate: 0.5, // acompte 50 % à la commande
  lateFeeWeekly: 0.02, // pénalité 2 % / semaine
};

export const SUBSCRIPTION_PLANS = [
  {
    key: 'FREE',
    name: 'Gratuit',
    audience: 'Tous',
    priceMonthly: 0,
    features: ['Publication d’annonces', 'Mise en relation', 'Chat & suivi', 'Commission standard 12 %'],
  },
  {
    key: 'CARRIER_PRO',
    name: 'Transporteur Pro',
    audience: 'Transporteurs',
    priceMonthly: 49_000,
    features: ['Commission réduite 8 %', 'Alertes fret prioritaires', 'Mise en avant du profil', 'Gestion de flotte illimitée'],
  },
  {
    key: 'SHIPPER_BUSINESS',
    name: 'Chargeur Business',
    audience: 'Chargeurs',
    priceMonthly: 89_000,
    features: ['Facturation centralisée', 'Comptes multi-utilisateurs', 'Tarifs négociés', 'Support dédié & SLA'],
  },
] as const;
