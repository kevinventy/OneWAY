/**
 * Grille tarifaire ONE WAY — prix par AXE (ville → ville) et par TRANCHE DE
 * TONNAGE, éditable par le gérant depuis l'app (stockée dans Firestore
 * `tariffs/{id}`). Sert de prix de référence à la création d'une course :
 * si l'axe + le tonnage correspondent à une entrée, ce prix est proposé
 * automatiquement (le gérant peut toujours l'ajuster).
 */

export interface TonnageBracket {
  key: string;
  label: string;
  /** Borne supérieure incluse (kg). Le dernier palier est ouvert (Infinity). */
  maxKg: number;
}

/** Tranches de tonnage de la grille (colonnes du tableau tarifaire). */
export const TONNAGE_BRACKETS: TonnageBracket[] = [
  { key: 'T1', label: '≤ 1 T', maxKg: 1_000 },
  { key: 'T3', label: '1 – 3 T', maxKg: 3_000 },
  { key: 'T5', label: '3 – 5 T', maxKg: 5_000 },
  { key: 'T10', label: '5 – 10 T', maxKg: 10_000 },
  { key: 'T20', label: '10 – 20 T', maxKg: 20_000 },
  { key: 'TMAX', label: '> 20 T', maxKg: Number.POSITIVE_INFINITY },
];

/** Tranche correspondant à un poids donné. */
export function bracketForWeight(kg: number): TonnageBracket {
  return TONNAGE_BRACKETS.find((b) => kg <= b.maxKg) ?? TONNAGE_BRACKETS[TONNAGE_BRACKETS.length - 1];
}

/** Une ligne de grille (un axe) — document Firestore `tariffs/{id}`. */
export interface Tariff {
  id: string;
  ownerId: string; // gérant
  fromCity: string;
  toCity: string;
  /** Le tarif s'applique aussi dans le sens inverse. */
  bidirectional: boolean;
  /** Prix par tranche : { [bracket.key]: montant en Ar }. */
  prices: Record<string, number>;
  updatedAt: number;
}

const norm = (s: string) => (s || '').trim().toLowerCase();

export interface TariffMatch {
  price: number;
  tariff: Tariff;
  bracket: TonnageBracket;
}

/**
 * Cherche le prix de grille pour un axe + un poids. Retourne `null` si aucune
 * entrée ne correspond (on retombe alors sur l'estimation automatique).
 */
export function findTariffPrice(tariffs: Tariff[], fromCity: string, toCity: string, weightKg: number): TariffMatch | null {
  const bracket = bracketForWeight(weightKg);
  const f = norm(fromCity);
  const t = norm(toCity);
  for (const tar of tariffs) {
    const tf = norm(tar.fromCity);
    const tt = norm(tar.toCity);
    const match = (tf === f && tt === t) || (tar.bidirectional && tf === t && tt === f);
    if (match) {
      const price = tar.prices?.[bracket.key];
      if (price != null && price > 0) return { price: Math.round(price), tariff: tar, bracket };
    }
  }
  return null;
}

/** Nombre de tranches renseignées (> 0) pour un axe — pour l'affichage. */
export function filledBrackets(tariff: Pick<Tariff, 'prices'>): number {
  return TONNAGE_BRACKETS.filter((b) => (tariff.prices?.[b.key] ?? 0) > 0).length;
}
