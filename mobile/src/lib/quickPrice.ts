/**
 * Calculateur de prix RAPIDE — ONE WAY (espace gérant).
 *
 * Port fidèle de la feuille « 🧮 Calculateur Rapide » du classeur officiel
 * OneWay_Devis_Transport.xlsm. Toutes les valeurs proviennent de sa feuille
 * « ⚙️ Paramètres » (grille tarifaire, prix du carburant, coefficient de
 * retour à vide) — plus aucune estimation.
 */

/** Prix du carburant (⚙️ Paramètres) — modifiable selon le cours. */
export const FUEL_PRICES = { diesel: 4900, essence: 5100 } as const; // Ar / litre

type FuelKind = keyof typeof FUEL_PRICES;

export interface QuickVehicle {
  index: number; // 1..10 (colonne « Type véhicule 1→10 » du tableur)
  key: string;
  label: string;
  capacity: string;
  ratePerKm: number; // D : frais kilométriques aller, hors carburant (Ar/km)
  consoPer100: number; // E : consommation (L/100 km)
  fuel: FuelKind; // type de carburant
  fuelPerKm: number; // F : carburant aller (Ar/km) = conso/100 × prix carburant
  baseFee: number; // G : forfait de base véhicule (Ar)
  surcharge: number; // H : majoration de classe (fraction)
  emoji: string;
}

/** Grille tarifaire ONE WAY (⚙️ Paramètres, véhicules 1→10). */
const RAW_VEHICLES: Omit<QuickVehicle, 'fuelPerKm'>[] = [
  { index: 1, key: 'MOTO', label: 'Moto-taxi / Tricycle', capacity: '< 200 kg', ratePerKm: 800, consoPer100: 3, fuel: 'essence', baseFee: 15_000, surcharge: 0, emoji: '🛵' },
  { index: 2, key: 'CAMIONNETTE', label: 'Camionnette légère', capacity: '200–800 kg', ratePerKm: 1_200, consoPer100: 10, fuel: 'diesel', baseFee: 30_000, surcharge: 0.1, emoji: '🚐' },
  { index: 3, key: 'CAMION_3T', label: 'Camion 3 tonnes', capacity: '800 kg–3 T', ratePerKm: 1_900, consoPer100: 18, fuel: 'diesel', baseFee: 60_000, surcharge: 0.15, emoji: '🚚' },
  { index: 4, key: 'CAMION_5T', label: 'Camion 5 tonnes', capacity: '3–5 T', ratePerKm: 2_800, consoPer100: 25, fuel: 'diesel', baseFee: 100_000, surcharge: 0.2, emoji: '🚚' },
  { index: 5, key: 'CAMION_10T', label: 'Camion 10 tonnes', capacity: '5–10 T', ratePerKm: 3_900, consoPer100: 32, fuel: 'diesel', baseFee: 180_000, surcharge: 0.25, emoji: '🚛' },
  { index: 6, key: 'SEMI_20T', label: 'Semi-remorque 20 T', capacity: '10–20 T', ratePerKm: 5_600, consoPer100: 38, fuel: 'diesel', baseFee: 300_000, surcharge: 0.3, emoji: '🚛' },
  { index: 7, key: 'FRIGO_5T', label: 'Camion frigorifique 5 T', capacity: '3–5 T frigo', ratePerKm: 3_800, consoPer100: 28, fuel: 'diesel', baseFee: 150_000, surcharge: 0.2, emoji: '❄️' },
  { index: 8, key: 'BENNE_15T', label: 'Camion benne', capacity: "Jusqu'à 15 T", ratePerKm: 4_300, consoPer100: 35, fuel: 'diesel', baseFee: 200_000, surcharge: 0.25, emoji: '🚜' },
  { index: 9, key: 'CONTENEUR_20', label: 'Conteneur 20 pieds', capacity: 'Max 24 T', ratePerKm: 4_600, consoPer100: 38, fuel: 'diesel', baseFee: 250_000, surcharge: 0.35, emoji: '📦' },
  { index: 10, key: 'CONTENEUR_40', label: 'Conteneur 40 pieds', capacity: 'Max 28 T', ratePerKm: 6_300, consoPer100: 45, fuel: 'diesel', baseFee: 400_000, surcharge: 0.4, emoji: '📦' },
];

/** Carburant/km recalculé à partir du prix du carburant (comme dans le tableur). */
export const QUICK_VEHICLES: QuickVehicle[] = RAW_VEHICLES.map((v) => ({
  ...v,
  fuelPerKm: Math.round((v.consoPer100 / 100) * FUEL_PRICES[v.fuel]),
}));

/** Paramètres globaux du calcul (⚙️ Paramètres + formule du tableur). */
export const QUICK_PARAMS = {
  repositioningFactor: 0.7, // C15 : retour à vide = 70 % du coût roulant aller
  handlingRate: 0.15, // manutention = 15 % du forfait, par opération
  insuranceRate: 0.005, // assurance = 0,5 % de la valeur déclarée
  miscFeesRate: 0.03, // frais divers (péages…) = 3 % (frais km + retour)
  vatRate: 0.2, // TVA 20 %
};

export function quickVehicleByIndex(i: number): QuickVehicle {
  return QUICK_VEHICLES.find((v) => v.index === i) ?? QUICK_VEHICLES[2];
}

export interface QuickInput {
  distanceKm: number;
  vehicleIndex: number; // 1..10
  declaredValue: number; // Ar
  loadHandling: boolean;
  unloadHandling: boolean;
  roundTrip: boolean;
  discountPct: number; // 0..100
  vat: boolean;
}

export interface QuickResult {
  vehicle: QuickVehicle;
  kmFee: number; // C20 — frais kilométriques aller (hors carburant)
  fuel: number; // C21 — carburant aller
  returnEmpty: number; // C22 — retour à vide (repositionnement)
  baseFee: number; // C23 — forfait de base véhicule
  loadFee: number; // C24 — manutention chargement
  unloadFee: number; // C25 — manutention déchargement
  insurance: number; // C26 — assurance
  misc: number; // C27 — frais divers (péages)
  subtotal: number; // C28 — sous-total H.T.
  discount: number; // C29 — remise commerciale (négatif)
  vat: number; // C30 — TVA
  total: number; // C31 — total estimé TTC
  pricePerKm: number; // C32 — prix moyen / km (aller)
}

const r = (n: number) => Math.round(n);

/** Calcule le prix selon la formule du « Calculateur Rapide » ONE WAY. */
export function computeQuickPrice(input: QuickInput): QuickResult {
  const vehicle = quickVehicleByIndex(input.vehicleIndex);
  const d = Math.max(0, input.distanceKm || 0);
  const value = Math.max(0, input.declaredValue || 0);
  const discountPct = Math.min(100, Math.max(0, input.discountPct || 0));

  const kmFee = r(d * vehicle.ratePerKm * (1 + vehicle.surcharge)); // C20
  const fuel = r(d * vehicle.fuelPerKm); // C21
  const returnEmpty = input.roundTrip ? r((kmFee + fuel) * QUICK_PARAMS.repositioningFactor) : 0; // C22
  const baseFee = vehicle.baseFee; // C23
  const loadFee = input.loadHandling ? r(vehicle.baseFee * QUICK_PARAMS.handlingRate) : 0; // C24
  const unloadFee = input.unloadHandling ? r(vehicle.baseFee * QUICK_PARAMS.handlingRate) : 0; // C25
  const insurance = r(value * QUICK_PARAMS.insuranceRate); // C26
  const misc = r((kmFee + returnEmpty) * QUICK_PARAMS.miscFeesRate); // C27

  const subtotal = kmFee + fuel + returnEmpty + baseFee + loadFee + unloadFee + insurance + misc; // C28
  const discount = -r((subtotal * discountPct) / 100); // C29
  const vat = input.vat ? r((subtotal + discount) * QUICK_PARAMS.vatRate) : 0; // C30
  const total = subtotal + discount + vat; // C31
  const pricePerKm = d > 0 ? r(total / d) : 0; // C32

  return { vehicle, kmFee, fuel, returnEmpty, baseFee, loadFee, unloadFee, insurance, misc, subtotal, discount, vat, total, pricePerKm };
}
