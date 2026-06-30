import type { CargoTypeKey, VehicleTypeKey } from '@/data/catalog';
import type { LatLng } from '@/data/roads';

/** ONE WAY = l'app d'UN transporteur : gérant + chauffeurs (comptes), client public. */
export type Role = 'GERANT' | 'CHAUFFEUR';

/** Profil app (Firestore `users/{uid}`). Auth = Firebase Auth (identifiant synthétique). */
export interface User {
  id: string; // Firebase Auth uid
  role: Role;
  name: string;
  identifiant: string;
  email: string; // synthétique `identifiant@oneway.app`
  phone?: string;
  /** Gérant : nom de l'entreprise. */
  companyName?: string;
  /** Gérant : code à partager aux chauffeurs pour rejoindre l'entreprise. */
  companyCode?: string;
  /** Chauffeur : uid du gérant (entreprise) auquel il est rattaché. */
  ownerId?: string;
  avatarColor: string;
  createdAt: number;
}

export interface Vehicle {
  id: string;
  ownerId: string; // gérant
  type: VehicleTypeKey;
  name: string;
  plate: string;
  capacityKg: number;
  available: boolean;
}

export interface Driver {
  id: string;
  ownerId: string; // gérant
  userId?: string; // compte chauffeur lié
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
  companyName?: string;
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
  /** Géométrie de l'itinéraire (vrais axes RN) pour la carte. */
  routeGeometry: LatLng[];
  driverId?: string;
  driverUserId?: string; // pour le cloisonnement côté règles/queries
  vehicleId?: string;
  status: CourseStatus;
  progress: number; // 0..1
  currentLat?: number;
  currentLng?: number;
  createdAt: number;
  assignedAt?: number;
  deliveredAt?: number;
  cancelledAt?: number;
}

export interface TrackingEvent {
  id: string;
  courseId: string;
  ownerId: string;
  status: CourseStatus;
  label: string;
  lat?: number;
  lng?: number;
  note?: string;
  by: string;
  createdAt: number;
}

/** Doc public de suivi (`tracking/{code}`) — sanitisé, lisible sans compte. */
export interface PublicTracking {
  code: string;
  reference: string;
  company: string;
  status: CourseStatus;
  statusLabel: string;
  progress: number;
  distanceKm: number;
  kmRemaining: number;
  durationH: number;
  pickup: { city: string; lat: number; lng: number };
  delivery: { city: string; lat: number; lng: number };
  current: { lat: number; lng: number } | null;
  routeGeometry: LatLng[];
  cargoLabel: string;
  weightKg: number;
  vehicleLabel: string;
  driverName?: string;
  contactPhone?: string;
  delivered: boolean;
  cancelled: boolean;
  updatedAt: number;
  timeline: { status: CourseStatus; label: string; at: number }[];
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  href?: string;
  createdAt: number;
}

/** Km restants selon l'avancement. */
export function kmRemaining(course: Pick<Course, 'distanceKm' | 'progress' | 'status'>): number {
  if (course.status === 'LIVREE') return 0;
  return Math.max(0, Math.round(course.distanceKm * (1 - course.progress)));
}
