import type { CourseStatus } from './types';
import { COURSE_STATUS } from './labels';

/** Étapes d'avancement d'une course (du chargement à la livraison). */
export const STATUS_FLOW: CourseStatus[] = [
  'ASSIGNEE',
  'EN_ROUTE_RAMASSAGE',
  'AU_CHARGEMENT',
  'EN_ROUTE',
  'ARRIVEE',
  'LIVREE',
];

export const STATUS_LABEL: Record<CourseStatus, string> = {
  NOUVELLE: 'À assigner',
  ASSIGNEE: 'Course assignée',
  EN_ROUTE_RAMASSAGE: 'En route vers le chargement',
  AU_CHARGEMENT: 'Au point de chargement',
  EN_ROUTE: 'En route vers la livraison',
  ARRIVEE: 'Arrivé à destination',
  LIVREE: 'Livraison confirmée',
  ANNULEE: 'Course annulée',
};

/** Libellé du bouton « étape suivante » (côté chauffeur/gérant). */
export const STATUS_ACTION: Partial<Record<CourseStatus, string>> = {
  ASSIGNEE: 'Démarrer — en route vers le chargement',
  EN_ROUTE_RAMASSAGE: 'Je suis au point de chargement',
  AU_CHARGEMENT: 'Chargement terminé — démarrer le trajet',
  EN_ROUTE: 'Arrivé à destination',
  ARRIVEE: 'Confirmer la livraison',
};

export function nextStatus(current: CourseStatus): CourseStatus | null {
  const i = STATUS_FLOW.indexOf(current);
  if (i < 0 || i >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[i + 1];
}

export { COURSE_STATUS };
