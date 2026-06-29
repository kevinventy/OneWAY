import { z } from 'zod';
import { CARGO_TYPES, VEHICLE_TYPES, type CargoTypeKey, type VehicleTypeKey } from '@/data/catalog';

const vehicleKeys = VEHICLE_TYPES.map((v) => v.key) as [VehicleTypeKey, ...VehicleTypeKey[]];
const cargoKeys = CARGO_TYPES.map((c) => c.key) as [CargoTypeKey, ...CargoTypeKey[]];

export const registerSchema = z.object({
  role: z.enum(['SHIPPER', 'CARRIER']),
  name: z.string().min(2, 'Nom trop court'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(8, 'Téléphone invalide'),
  password: z.string().min(6, 'Mot de passe : 6 caractères minimum'),
  companyName: z.string().optional(),
  city: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

const geoPointSchema = z.object({
  address: z.string().min(2),
  city: z.string().min(2),
  lat: z.number(),
  lng: z.number(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
});

export const freightSchema = z.object({
  title: z.string().min(4, 'Titre trop court'),
  cargoType: z.enum(cargoKeys),
  weightKg: z.number().positive('Poids requis'),
  volumeM3: z.number().nonnegative().optional(),
  dimensions: z.string().optional(),
  photos: z.array(z.string()).default([]),
  pickup: geoPointSchema,
  delivery: geoPointSchema,
  pickupDate: z.string(),
  deliveryDate: z.string().optional(),
  urgency: z.enum(['STANDARD', 'EXPRESS', 'FLEXIBLE']).default('STANDARD'),
  pricingMode: z.enum(['FIXED', 'AUCTION']).default('FIXED'),
  vehicleType: z.enum(vehicleKeys),
  declaredValue: z.number().nonnegative().optional(),
  insurance: z.boolean().default(false),
  budget: z.number().nonnegative(),
});

export const bidSchema = z.object({
  amount: z.number().positive('Montant requis'),
  etaHours: z.number().positive('Délai requis'),
  message: z.string().optional(),
  vehicleId: z.string().optional(),
});

export const advanceSchema = z.object({
  status: z
    .enum(['ASSIGNED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED', 'IN_TRANSIT', 'AT_DELIVERY', 'DELIVERED'])
    .optional(),
  note: z.string().optional(),
  photoUrl: z.string().optional(),
});

export const quoteSchema = z.object({
  distanceKm: z.number().nonnegative(),
  vehicleType: z.enum(vehicleKeys),
  cargoType: z.enum(cargoKeys).default('GENERAL'),
  weightKg: z.number().optional(),
  declaredValue: z.number().optional(),
  handlingPickup: z.boolean().optional(),
  handlingDelivery: z.boolean().optional(),
  express: z.boolean().optional(),
  night: z.boolean().optional(),
  ruralRoad: z.boolean().optional(),
  insurance: z.boolean().optional(),
  discountPct: z.number().min(0).max(100).optional(),
  vat: z.boolean().optional(),
});

export const reviewSchema = z.object({
  shipmentId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type FreightInput = z.infer<typeof freightSchema>;
