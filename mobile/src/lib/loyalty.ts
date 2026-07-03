/**
 * Programme de fidélité ONE WAY — une récompense tous les N livraisons.
 *
 * Le client visualise sa progression (X / N) sur son accueil et débloque un
 * code promo à chaque palier. Côté gérant, un rappel « client fidèle » apparaît
 * à la création d'une course, avec application de la remise en un tap.
 */

import type { Course } from '@/lib/types';

export const LOYALTY = {
  /** Nombre de livraisons pour débloquer une récompense. */
  milestone: 10,
  /** Remise accordée à chaque palier (%). */
  discountPct: 10,
  /** Code à mentionner au transporteur. */
  code: 'FIDELE10',
} as const;

/** Livraisons effectivement terminées (statut LIVREE) pour ce client. */
export function countDelivered(courses: Course[]): number {
  return courses.filter((c) => c.status === 'LIVREE').length;
}

export interface LoyaltyProgress {
  count: number; // livraisons terminées
  tier: number; // paliers atteints (récompenses gagnées)
  inTier: number; // progression dans le palier courant (0..milestone-1)
  toNext: number; // livraisons restantes avant le prochain palier (1..milestone)
  milestone: number;
}

export function loyaltyProgress(count: number): LoyaltyProgress {
  const milestone = LOYALTY.milestone;
  const tier = Math.floor(count / milestone);
  const inTier = count - tier * milestone; // 0..milestone-1
  const toNext = milestone - inTier; // 1..milestone
  return { count, tier, inTier, toNext, milestone };
}
