import type { CargoTypeKey, VehicleTypeKey } from '@/data/catalog';

export type Role = 'SHIPPER' | 'CARRIER' | 'DRIVER' | 'ADMIN';
export type KycStatus = 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';

/** App user profile (Firestore `users/{uid}`). Auth itself is Firebase Auth. */
export interface User {
  id: string; // Firebase Auth uid
  role: Role;
  name: string;
  /** Identifiant de connexion (nom d'utilisateur). Pas besoin d'email réel. */
  identifiant: string;
  /** Email synthétique `identifiant@oneway.app` utilisé en interne par Firebase. */
  email: string;
  phone?: string;
  companyName?: string;
  city?: string;
  carrierId?: string;
  kycStatus: KycStatus;
  rating: number;
  ratingCount: number;
  premium: boolean;
  avatarColor: string;
  createdAt: number;
}

export interface Vehicle {
  id: string;
  carrierId: string;
  type: VehicleTypeKey;
  name: string;
  plate: string;
  capacityKg: number;
  refrigerated: boolean;
  available: boolean;
  lat?: number;
  lng?: number;
}

export interface Driver {
  id: string;
  carrierId: string;
  userId?: string;
  name: string;
  phone: string;
  licenseNumber: string;
  status: 'AVAILABLE' | 'ON_MISSION' | 'OFFLINE';
  vehicleId?: string;
}

export type FreightStatus = 'DRAFT' | 'PUBLISHED' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
export type Urgency = 'STANDARD' | 'EXPRESS' | 'FLEXIBLE';
export type PricingMode = 'FIXED' | 'AUCTION';

export interface GeoPoint {
  address: string;
  city: string;
  lat: number;
  lng: number;
  contactName?: string;
  contactPhone?: string;
}

export interface Freight {
  id: string;
  reference: string;
  shipperId: string;
  title: string;
  cargoType: CargoTypeKey;
  weightKg: number;
  volumeM3?: number;
  dimensions?: string;
  photos: string[];
  pickup: GeoPoint;
  delivery: GeoPoint;
  pickupDate: number;
  deliveryDate?: number;
  urgency: Urgency;
  pricingMode: PricingMode;
  vehicleType: VehicleTypeKey;
  declaredValue?: number;
  insurance: boolean;
  distanceKm: number;
  durationH: number;
  budget: number;
  status: FreightStatus;
  createdAt: number;
}

export type BidStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface Bid {
  id: string;
  freightId: string;
  carrierId: string;
  carrierName?: string;
  amount: number;
  etaHours: number;
  message?: string;
  vehicleId?: string;
  status: BidStatus;
  createdAt: number;
}

export type ShipmentStatus =
  | 'ASSIGNED'
  | 'EN_ROUTE_PICKUP'
  | 'AT_PICKUP'
  | 'LOADED'
  | 'IN_TRANSIT'
  | 'AT_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface Shipment {
  id: string;
  reference: string;
  freightId: string;
  shipperId: string;
  carrierId: string;
  driverId?: string;
  vehicleId?: string;
  bidId?: string;
  price: number;
  commission: number;
  status: ShipmentStatus;
  trackingCode: string;
  /** Dispatch : course assignée par l'admin et acceptée (ou non) par le chauffeur. */
  accepted?: boolean;
  currentLat?: number;
  currentLng?: number;
  progress: number;
  createdAt: number;
  deliveredAt?: number;
}

export interface TrackingEvent {
  id: string;
  shipmentId: string;
  status: ShipmentStatus;
  label: string;
  lat?: number;
  lng?: number;
  note?: string;
  photoUrl?: string;
  by: string;
  createdAt: number;
}

export type DocumentType = 'QUOTE' | 'BL' | 'INVOICE' | 'POD' | 'CERTIFICATE';

export interface DocumentRecord {
  id: string;
  shipmentId?: string;
  freightId?: string;
  type: DocumentType;
  reference: string;
  title: string;
  createdAt: number;
}

export interface Review {
  id: string;
  shipmentId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  comment?: string;
  createdAt: number;
}

export type TxStatus = 'PENDING' | 'ESCROW' | 'RELEASED' | 'REFUNDED' | 'FAILED';
export type PaymentMethod = 'MVOLA' | 'ORANGE_MONEY' | 'AIRTEL_MONEY' | 'WAVE' | 'CARD' | 'TRANSFER' | 'CASH';

export interface Transaction {
  id: string;
  reference: string;
  shipmentId: string;
  payerId: string;
  payeeId: string;
  amount: number;
  commission: number;
  method: PaymentMethod;
  status: TxStatus;
  createdAt: number;
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
