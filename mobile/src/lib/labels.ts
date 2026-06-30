import type { CourseStatus, Role } from './types';

export type Tone = 'slate' | 'blue' | 'amber' | 'green' | 'red';

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
