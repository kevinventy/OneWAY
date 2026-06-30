import type { CourseStatus, Role, Tone } from './types';

export type { Tone };

export const TONE_CLASS: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-600',
  blue: 'bg-brand-50 text-brand-700',
  amber: 'bg-amber-100 text-amber-600',
  green: 'bg-emerald-100 text-emerald-700',
  red: 'bg-rose-100 text-rose-600',
};

export const COURSE_STATUS: Record<CourseStatus, { label: string; tone: Tone }> = {
  NOUVELLE: { label: 'À assigner', tone: 'red' },
  ASSIGNEE: { label: 'Assignée', tone: 'blue' },
  EN_ROUTE_RAMASSAGE: { label: 'Vers chargement', tone: 'blue' },
  AU_CHARGEMENT: { label: 'Au chargement', tone: 'amber' },
  EN_ROUTE: { label: 'En route', tone: 'amber' },
  ARRIVEE: { label: 'Arrivée', tone: 'amber' },
  LIVREE: { label: 'Livrée', tone: 'green' },
  ANNULEE: { label: 'Annulée', tone: 'slate' },
};

export const ROLE_LABEL: Record<Role, string> = {
  GERANT: 'Gérant',
  CHAUFFEUR: 'Chauffeur',
};

/** Étapes d'avancement d'une course (du chargement à la livraison). */
export const STATUS_FLOW: CourseStatus[] = [
  'ASSIGNEE',
  'EN_ROUTE_RAMASSAGE',
  'AU_CHARGEMENT',
  'EN_ROUTE',
  'ARRIVEE',
  'LIVREE',
];

/** Libellé du bouton « passer à l'étape suivante » (côté chauffeur). */
export const STATUS_ACTION: Partial<Record<CourseStatus, string>> = {
  ASSIGNEE: 'Démarrer — en route vers le chargement',
  EN_ROUTE_RAMASSAGE: 'Je suis au point de chargement',
  AU_CHARGEMENT: 'Chargement terminé — démarrer le trajet',
  EN_ROUTE: 'Arrivé à destination',
  ARRIVEE: 'Confirmer la livraison',
};

export function nextCourseStatus(current: CourseStatus): CourseStatus | null {
  const i = STATUS_FLOW.indexOf(current);
  if (i < 0 || i >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[i + 1];
}
