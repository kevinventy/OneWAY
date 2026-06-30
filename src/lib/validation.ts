import { z } from 'zod';
import { CARGO_TYPES, VEHICLE_TYPES } from '@/data/catalog';

const vehicleKeys = VEHICLE_TYPES.map((v) => v.key) as [string, ...string[]];
const cargoKeys = CARGO_TYPES.map((c) => c.key) as [string, ...string[]];

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

/** Inscription = création d'un compte gérant (entreprise de transport). */
export const registerSchema = z.object({
  name: z.string().min(2, 'Nom trop court'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(8, 'Téléphone invalide'),
  password: z.string().min(6, 'Mot de passe : 6 caractères minimum'),
  companyName: z.string().optional(),
});

const geoPointSchema = z.object({
  address: z.string().min(2),
  city: z.string().min(2),
  lat: z.number(),
  lng: z.number(),
});

export const courseSchema = z.object({
  client: z.object({ name: z.string().min(2, 'Nom du client requis'), phone: z.string().min(6, 'Téléphone client requis') }),
  cargoType: z.enum(cargoKeys),
  cargoDescription: z.string().min(2, 'Décrivez la marchandise'),
  weightKg: z.number().positive('Poids requis'),
  vehicleType: z.enum(vehicleKeys),
  pickup: geoPointSchema,
  delivery: geoPointSchema,
});

export const assignSchema = z.object({ driverId: z.string().min(1) });

export type CourseInput = z.infer<typeof courseSchema>;
