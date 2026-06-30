import type { CargoTypeKey, VehicleTypeKey } from '@/data/catalog';
import type { LatLng } from '@/data/roads';

/** ONE WAY est l'app d'UN transporteur : gérant + chauffeurs (comptes), client public. */
export type Role = 'GERANT' | 'CHAUFFEUR';

/** Tonalités de couleur partagées (badges, statuts). */
export type Tone = 'slate' | 'blue' | 'amber' | 'green' | 'red';

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  companyName?: string;
  /** Pour un chauffeur : le gérant (entreprise) auquel il est rattaché. */
  ownerId?: string;
  avatarColor: string;
  createdAt: string;
}

export type PublicUser = Omit<User, 'passwordHash'>;

export interface Vehicle {
  id: string;
  ownerId: string;
  type: VehicleTypeKey;
  name: string;
  plate: string;
  capacityKg: number;
  available: boolean;
}

export interface Driver {
  id: string;
  ownerId: string;
  userId?: string; // compte chauffeur
  name: string;
  phone: string;
  licenseNumber: string;
  vehicleId?: string;
  status: 'DISPONIBLE' | 'EN_MISSION' | 'HORS_LIGNE';
}

export interface GeoPoint {
  address: string;
  city: string;
  lat: number;
  lng: number;
}

export type CourseStatus =
  | 'NOUVELLE'
  | 'ASSIGNEE'
  | 'EN_ROUTE_RAMASSAGE'
  | 'AU_CHARGEMENT'
  | 'EN_ROUTE'
  | 'ARRIVEE'
  | 'LIVREE'
  | 'ANNULEE';

export interface Course {
  id: string;
  code: string; // code de suivi public (ex. OW7F3K2)
  reference: string; // ex. OW-0042
  ownerId: string; // gérant
  client: { name: string; phone: string };
  cargoType: CargoTypeKey;
  cargoDescription: string;
  weightKg: number;
  vehicleType: VehicleTypeKey;
  pickup: GeoPoint;
  delivery: GeoPoint;
  distanceKm: number;
  durationH: number;
  price: number;
  /** Géométrie de l'itinéraire (vrais axes), pour la carte. */
  routeGeometry: LatLng[];
  driverId?: string;
  vehicleId?: string;
  status: CourseStatus;
  progress: number; // 0..1
  currentLat?: number;
  currentLng?: number;
  createdAt: string;
  assignedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
}

export interface TrackingEvent {
  id: string;
  courseId: string;
  status: CourseStatus;
  label: string;
  lat?: number;
  lng?: number;
  note?: string;
  by: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  href?: string;
  createdAt: string;
}

export interface DB {
  users: User[];
  vehicles: Vehicle[];
  drivers: Driver[];
  courses: Course[];
  events: TrackingEvent[];
  notifications: Notification[];
  meta: { courseSeq: number };
}

export function toPublicUser(u: User): PublicUser {
  const { passwordHash: _omit, ...rest } = u;
  return rest;
}

/** Km restants à parcourir selon l'avancement. */
export function kmRemaining(course: Pick<Course, 'distanceKm' | 'progress' | 'status'>): number {
  if (course.status === 'LIVREE') return 0;
  return Math.max(0, Math.round(course.distanceKm * (1 - course.progress)));
}

/**
 * Vue de suivi PUBLIQUE (client sans compte) — sanitisée : aucune donnée
 * sensible (prix, identité/numéro du client, identifiants internes).
 * Type partagé client/serveur ; la projection vit dans `lib/tracking.ts`.
 */
export interface PublicTracking {
  code: string;
  reference: string;
  status: CourseStatus;
  statusLabel: string;
  statusTone: Tone;
  progress: number;
  distanceKm: number;
  kmRemaining: number;
  durationH: number;
  pickup: { city: string; address: string; lat: number; lng: number };
  delivery: { city: string; address: string; lat: number; lng: number };
  current: { lat: number; lng: number } | null;
  routeGeometry: LatLng[];
  cargo: { label: string; weightKg: number };
  vehicle: { label: string };
  transporter: { company: string; phone: string; driverName?: string };
  delivered: boolean;
  cancelled: boolean;
  createdAt: string;
  deliveredAt?: string;
  timeline: { status: CourseStatus; label: string; at: string }[];
}
