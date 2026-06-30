import bcrypt from 'bcryptjs';
import type { Course, DB, Driver, TrackingEvent, User, Vehicle } from './types';
import { findCity, buildCourseRoute } from './geo';
import { pointAtProgress } from '@/data/roads';
import { computeQuote } from './pricing';

export const DEMO_PASSWORD = 'oneway123';
const COLORS = ['#1d3df5', '#f07d1a', '#16a34a', '#9333ea', '#0891b2'];
const now = () => Date.now();
const daysAgo = (n: number) => new Date(now() - n * 86_400_000).toISOString();
const hoursAgo = (n: number) => new Date(now() - n * 3_600_000).toISOString();
const inDays = (n: number) => new Date(now() + n * 86_400_000).toISOString();
const hash = (pw: string) => bcrypt.hashSync(pw, 8);

function price(distanceKm: number, vehicleType: any, cargoType: any): number {
  return computeQuote({ distanceKm, vehicleType, cargoType, handlingPickup: true, handlingDelivery: true, insurance: false, vat: false }).totalTTC;
}

function makeCourse(params: {
  id: string; code: string; reference: string; ownerId: string;
  client: { name: string; phone: string };
  fromCity: string; fromAddr: string; toCity: string; toAddr: string;
  cargoType: any; cargoDescription: string; weightKg: number; vehicleType: any;
  status: Course['status']; progress: number; driverId?: string; vehicleId?: string; createdAt: string;
}): Course {
  const from = findCity(params.fromCity)!;
  const to = findCity(params.toCity)!;
  const route = buildCourseRoute(params.fromCity, from, params.toCity, to);
  const pos = pointAtProgress(route.geometry, params.progress);
  return {
    id: params.id, code: params.code, reference: params.reference, ownerId: params.ownerId,
    client: params.client,
    cargoType: params.cargoType, cargoDescription: params.cargoDescription, weightKg: params.weightKg, vehicleType: params.vehicleType,
    pickup: { address: params.fromAddr, city: from.name, lat: from.lat, lng: from.lng },
    delivery: { address: params.toAddr, city: to.name, lat: to.lat, lng: to.lng },
    distanceKm: route.distanceKm, durationH: route.durationH, price: price(route.distanceKm, params.vehicleType, params.cargoType),
    routeGeometry: route.geometry,
    driverId: params.driverId, vehicleId: params.vehicleId,
    status: params.status, progress: params.progress,
    currentLat: pos[0], currentLng: pos[1],
    createdAt: params.createdAt,
    assignedAt: params.driverId ? params.createdAt : undefined,
    deliveredAt: params.status === 'LIVREE' ? hoursAgo(2) : undefined,
  };
}

export function buildSeed(): DB {
  const pw = hash(DEMO_PASSWORD);
  const users: User[] = [
    { id: 'u_gerant', role: 'GERANT', name: 'Hery Rakoto', email: 'gerant@oneway.mg', phone: '+261341234567', passwordHash: pw, companyName: 'One Way SARL', avatarColor: COLORS[0], createdAt: daysAgo(120) },
    { id: 'u_chauf1', role: 'CHAUFFEUR', name: 'Rivo Be', email: 'chauffeur@oneway.mg', phone: '+261347654321', passwordHash: pw, ownerId: 'u_gerant', avatarColor: COLORS[1], createdAt: daysAgo(100) },
    { id: 'u_chauf2', role: 'CHAUFFEUR', name: 'Koto Solo', email: 'koto@oneway.mg', phone: '+261349876543', passwordHash: pw, ownerId: 'u_gerant', avatarColor: COLORS[2], createdAt: daysAgo(80) },
  ];

  const vehicles: Vehicle[] = [
    { id: 'v1', ownerId: 'u_gerant', type: 'CAMION_5T', name: 'Isuzu NQR', plate: '1234 TBB', capacityKg: 5000, available: false },
    { id: 'v2', ownerId: 'u_gerant', type: 'CAMION_3T', name: 'Mitsubishi Canter', plate: '5678 TBA', capacityKg: 3000, available: true },
    { id: 'v3', ownerId: 'u_gerant', type: 'CAMION_10T', name: 'Renault Kerax', plate: '9012 TBC', capacityKg: 10000, available: true },
  ];

  const drivers: Driver[] = [
    { id: 'd1', ownerId: 'u_gerant', userId: 'u_chauf1', name: 'Rivo Be', phone: '+261347654321', licenseNumber: 'PL-2019-00451', vehicleId: 'v1', status: 'EN_MISSION' },
    { id: 'd2', ownerId: 'u_gerant', userId: 'u_chauf2', name: 'Koto Solo', phone: '+261349876543', licenseNumber: 'PL-2020-01122', vehicleId: 'v2', status: 'DISPONIBLE' },
  ];

  const courses: Course[] = [
    makeCourse({ id: 'c1', code: 'OWTOA01', reference: 'OW-0001', ownerId: 'u_gerant', client: { name: 'Société ABC Import', phone: '+261330000001' }, fromCity: 'Antananarivo', fromAddr: 'Analakely', toCity: 'Toamasina', toAddr: 'Port de Toamasina', cargoType: 'GENERAL', cargoDescription: '12 palettes marchandises générales', weightKg: 4200, vehicleType: 'CAMION_5T', status: 'EN_ROUTE', progress: 0.45, driverId: 'd1', vehicleId: 'v1', createdAt: hoursAgo(10) }),
    makeCourse({ id: 'c2', code: 'OWANT02', reference: 'OW-0002', ownerId: 'u_gerant', client: { name: 'Marie Boutique', phone: '+261330000002' }, fromCity: 'Antananarivo', fromAddr: 'Ivandry', toCity: 'Antsirabe', toAddr: 'Antsirabe Centre', cargoType: 'FRAGILE', cargoDescription: 'Lot électronique', weightKg: 900, vehicleType: 'CAMION_3T', status: 'LIVREE', progress: 1, driverId: 'd2', vehicleId: 'v2', createdAt: daysAgo(2) }),
    makeCourse({ id: 'c3', code: 'OWMAH03', reference: 'OW-0003', ownerId: 'u_gerant', client: { name: 'Chantier BTP', phone: '+261330000003' }, fromCity: 'Antananarivo', fromAddr: 'Tanjombato', toCity: 'Mahajanga', toAddr: 'Marché Mahabibo', cargoType: 'LOURD', cargoDescription: '190 sacs de ciment', weightKg: 9500, vehicleType: 'CAMION_10T', status: 'NOUVELLE', progress: 0, createdAt: hoursAgo(1) }),
  ];

  const events: TrackingEvent[] = [
    { id: 't1', courseId: 'c1', status: 'ASSIGNEE', label: 'Course assignée à Rivo Be', by: 'u_gerant', createdAt: hoursAgo(10) },
    { id: 't2', courseId: 'c1', status: 'AU_CHARGEMENT', label: 'Chargement terminé (4 200 kg)', by: 'd1', createdAt: hoursAgo(9) },
    { id: 't3', courseId: 'c1', status: 'EN_ROUTE', label: 'En route vers Toamasina', by: 'd1', createdAt: hoursAgo(4) },
    { id: 't4', courseId: 'c2', status: 'LIVREE', label: 'Livraison confirmée', by: 'd2', createdAt: hoursAgo(2) },
  ];

  const notifications = [
    { id: 'n1', userId: 'u_gerant', type: 'COURSE', title: 'Nouvelle course à assigner', body: 'OW-0003 Tana → Mahajanga', read: false, href: '/app/gerant/course/c3', createdAt: hoursAgo(1) },
    { id: 'n2', userId: 'u_chauf1', type: 'MISSION', title: 'Mission en cours', body: 'OW-0001 vers Toamasina', read: true, href: '/app/chauffeur/course/c1', createdAt: hoursAgo(10) },
  ];

  return { users, vehicles, drivers, courses, events, notifications, meta: { courseSeq: 3 } };
}
