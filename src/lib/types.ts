import type { CargoTypeKey, VehicleTypeKey } from '@/data/catalog';

export type Role = 'SHIPPER' | 'CARRIER' | 'DRIVER' | 'ADMIN';

export type KycStatus = 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  companyName?: string;
  city?: string;
  /** For DRIVER accounts: the carrier they belong to. */
  carrierId?: string;
  kycStatus: KycStatus;
  rating: number;
  ratingCount: number;
  premium: boolean;
  avatarColor: string;
  createdAt: string;
}

export type PublicUser = Omit<User, 'passwordHash'>;

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

export type FreightStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'ASSIGNED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

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
  pickupDate: string;
  deliveryDate?: string;
  urgency: Urgency;
  pricingMode: PricingMode;
  vehicleType: VehicleTypeKey;
  declaredValue?: number;
  insurance: boolean;
  distanceKm: number;
  durationH: number;
  /** Fixed price (FIXED mode) or starting budget (AUCTION mode). */
  budget: number;
  status: FreightStatus;
  createdAt: string;
}

export type BidStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface Bid {
  id: string;
  freightId: string;
  carrierId: string;
  amount: number;
  etaHours: number;
  message?: string;
  vehicleId?: string;
  status: BidStatus;
  createdAt: string;
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
  /** Simulated live position. */
  currentLat?: number;
  currentLng?: number;
  progress: number; // 0..1
  createdAt: string;
  deliveredAt?: string;
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
  createdAt: string;
}

export type DocumentType = 'QUOTE' | 'BL' | 'INVOICE' | 'POD' | 'CERTIFICATE';

export interface DocumentRecord {
  id: string;
  shipmentId?: string;
  freightId?: string;
  type: DocumentType;
  reference: string;
  title: string;
  createdAt: string;
  /** Inline JSON payload used to render the document on the fly. */
  payload?: Record<string, unknown>;
}

export interface Message {
  id: string;
  threadId: string; // freightId or shipmentId
  fromUserId: string;
  toUserId: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  shipmentId: string;
  fromUserId: string;
  toUserId: string;
  rating: number; // 1..5
  comment?: string;
  createdAt: string;
}

export type PaymentMethod = 'MVOLA' | 'ORANGE_MONEY' | 'AIRTEL_MONEY' | 'WAVE' | 'CARD' | 'TRANSFER' | 'CASH';
export type TxStatus = 'PENDING' | 'ESCROW' | 'RELEASED' | 'REFUNDED' | 'FAILED';

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
  createdAt: string;
}

export interface KycDocument {
  id: string;
  userId: string;
  type: 'ID' | 'LICENSE' | 'VEHICLE_REG' | 'INSURANCE' | 'COMPANY_REG';
  reference: string;
  status: KycStatus;
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
  freights: Freight[];
  bids: Bid[];
  shipments: Shipment[];
  tracking: TrackingEvent[];
  documents: DocumentRecord[];
  messages: Message[];
  reviews: Review[];
  transactions: Transaction[];
  kyc: KycDocument[];
  notifications: Notification[];
  meta: { freightSeq: number; shipmentSeq: number; quoteSeq: number; txSeq: number };
}

export function toPublicUser(u: User): PublicUser {
  const { passwordHash: _omit, ...rest } = u;
  return rest;
}
