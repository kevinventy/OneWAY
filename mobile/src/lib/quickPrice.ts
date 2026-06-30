/**
 * Calculateur de prix RAPIDE — ONE WAY (espace gérant).
 *
 * Reproduit la feuille Excel « 🧮 Calculateur Rapide » (Calcul_rapide.xlsx).
 * La grille tarifaire (tarif/km hors carburant, forfait de base, majoration)
 * provient telle quelle de la feuille « ⚙️ Paramètres » du classeur de devis
 * ONE WAY.
 *
 * Deux paramètres du classeur d'origine ne figurent pas dans le fichier fourni
 * et sont donc estimés ici, à partir de coûts gazole réalistes à Madagascar
 * (~5 000 Ar/L) et des consommations moyennes par classe de véhicule :
 *   - `fuelPerKm`  : carburant aller (Ar/km)
 *   - `repositioningFactor` : retour à vide ≈ part du coût roulant aller
 * Ils sont ajustables ci-dessous si le gérant dispose de chiffres précis.
 */

export interface QuickVehicle {
  index: number; // 1..10, comme la colonne « Type véhicule (1→10) » du tableur
  key: string;
  label: string;
  capacity: string;
  ratePerKm: number; // D : frais kilométriques aller, hors carburant (Ar/km)
  fuelPerKm: number; // F : carburant aller (Ar/km) — estimé
  baseFee: number; // G : forfait de base véhicule (Ar)
  surcharge: number; // H : majoration de classe (fraction)
  emoji: string;
}

/** Grille tarifaire ONE WAY (feuille « ⚙️ Paramètres », véhicules 1→10). */
export const QUICK_VEHICLES: QuickVehicle[] = [
  { index: 1, key: 'MOTO', label: 'Moto-taxi / Tricycle', capacity: '< 200 kg', ratePerKm: 180, fuelPerKm: 150, baseFee: 8_000, surcharge: 0, emoji: '🛵' },
  { index: 2, key: 'CAMIONNETTE', label: 'Camionnette légère', capacity: '200–800 kg', ratePerKm: 250, fuelPerKm: 500, baseFee: 15_000, surcharge: 0.1, emoji: '🚐' },
  { index: 3, key: 'CAMION_3T', label: 'Camion 3 tonnes', capacity: '800 kg–3 T', ratePerKm: 300, fuelPerKm: 900, baseFee: 20_000, surcharge: 0.15, emoji: '🚚' },
  { index: 4, key: 'CAMION_5T', label: 'Camion 5 tonnes', capacity: '3–5 T', ratePerKm: 350, fuelPerKm: 1_250, baseFee: 25_000, surcharge: 0.2, emoji: '🚚' },
  { index: 5, key: 'CAMION_10T', label: 'Camion 10 tonnes', capacity: '5–10 T', ratePerKm: 420, fuelPerKm: 1_600, baseFee: 35_000, surcharge: 0.25, emoji: '🚛' },
  { index: 6, key: 'SEMI_20T', label: 'Semi-remorque 20 T', capacity: '10–20 T', ratePerKm: 520, fuelPerKm: 2_000, baseFee: 50_000, surcharge: 0.3, emoji: '🚛' },
  { index: 7, key: 'FRIGO_5T', label: 'Camion frigorifique 5 T', capacity: '3–5 T frigo', ratePerKm: 450, fuelPerKm: 1_400, baseFee: 40_000, surcharge: 0.2, emoji: '❄️' },
  { index: 8, key: 'BENNE_15T', label: 'Camion benne', capacity: "Jusqu'à 15 T", ratePerKm: 400, fuelPerKm: 1_500, baseFee: 30_000, surcharge: 0.15, emoji: '🚜' },
  { index: 9, key: 'CONTENEUR_20', label: 'Conteneur 20 pieds', capacity: 'Max 24 T', ratePerKm: 600, fuelPerKm: 1_900, baseFee: 80_000, surcharge: 0.35, emoji: '📦' },
  { index: 10, key: 'CONTENEUR_40', label: 'Conteneur 40 pieds', capacity: 'Max 28 T', ratePerKm: 750, fuelPerKm: 2_250, baseFee: 120_000, surcharge: 0.4, emoji: '📦' },
];

/** Paramètres globaux du calcul (identiques au tableur). */
export const QUICK_PARAMS = {
  repositioningFactor: 0.5, // retour à vide ≈ 50 % du coût roulant aller (estimé)
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
