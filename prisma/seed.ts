/**
 * Seed PostgreSQL (production) — données de démonstration ONE WAY.
 *
 * Autonome (n'importe rien de `src/`) pour être exécutable directement :
 *   npx tsx prisma/seed.ts
 * ou via Prisma (ajoutez `"prisma": { "seed": "tsx prisma/seed.ts" }` au
 * package.json) puis : `npx prisma db seed`.
 *
 * Prérequis : `npm i -D prisma tsx && npm i @prisma/client`,
 * `DATABASE_URL` défini, `npx prisma migrate dev --name init`.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const PW = bcrypt.hashSync('oneway123', 8);
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const inDays = (n: number) => new Date(Date.now() + n * 86_400_000);

async function main() {
  console.log('→ Nettoyage…');
  // Ordre inverse des dépendances
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.review.deleteMany(),
    prisma.trackingEvent.deleteMany(),
    prisma.document.deleteMany(),
    prisma.message.deleteMany(),
    prisma.bid.deleteMany(),
    prisma.shipment.deleteMany(),
    prisma.freight.deleteMany(),
    prisma.kycDocument.deleteMany(),
    prisma.driver.deleteMany(),
    prisma.vehicle.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log('→ Utilisateurs…');
  const mk = (data: Record<string, unknown>) => prisma.user.create({ data: { password: PW, ...data } as never });

  const admin = await mk({ id: 'u_admin', role: 'ADMIN', name: 'Admin ONE WAY', email: 'admin@oneway.mg', phone: '+261340000000', companyName: 'One Way SARL', city: 'Antananarivo', kycStatus: 'VERIFIED', premium: true, createdAt: daysAgo(120) });
  const ship1 = await mk({ id: 'u_ship1', role: 'SHIPPER', name: 'Hery Rakoto', email: 'chargeur@oneway.mg', phone: '+261341111111', companyName: 'Société ABC Import', city: 'Antananarivo', kycStatus: 'VERIFIED', rating: 4.8, ratingCount: 12, premium: true, createdAt: daysAgo(95) });
  const ship2 = await mk({ id: 'u_ship2', role: 'SHIPPER', name: 'Marie Rakoto', email: 'marie@boutique.mg', phone: '+261342222222', companyName: 'Marie Boutique en ligne', city: 'Antananarivo', kycStatus: 'VERIFIED', rating: 4.6, ratingCount: 7, createdAt: daysAgo(60) });
  const car1 = await mk({ id: 'u_car1', role: 'CARRIER', name: 'Jean Randria', email: 'transporteur@oneway.mg', phone: '+261343333333', companyName: 'Trans Express Mada', city: 'Antananarivo', kycStatus: 'VERIFIED', rating: 4.9, ratingCount: 34, premium: true, createdAt: daysAgo(110) });
  const car2 = await mk({ id: 'u_car2', role: 'CARRIER', name: 'Naina Rabe', email: 'fitateza@oneway.mg', phone: '+261344444444', companyName: 'Fitateza Logistique', city: 'Toamasina', kycStatus: 'VERIFIED', rating: 4.7, ratingCount: 21, createdAt: daysAgo(80) });
  const drv1 = await mk({ id: 'u_drv1', role: 'DRIVER', name: 'Rivo Be', email: 'chauffeur@oneway.mg', phone: '+261346666666', city: 'Antananarivo', carrierId: 'u_car1', kycStatus: 'VERIFIED', rating: 4.8, ratingCount: 18, createdAt: daysAgo(100) });

  console.log('→ Véhicules & chauffeurs…');
  await prisma.vehicle.createMany({ data: [
    { id: 'v1', carrierId: car1.id, type: 'CAMION_5T', name: 'Isuzu NQR', plate: '1234 TBB', capacityKg: 5000 },
    { id: 'v2', carrierId: car1.id, type: 'CAMION_3T', name: 'Mitsubishi Canter', plate: '5678 TBA', capacityKg: 3000 },
    { id: 'v4', carrierId: car2.id, type: 'CAMION_10T', name: 'Renault Kerax', plate: '3456 TCA', capacityKg: 10000 },
    { id: 'v5', carrierId: car2.id, type: 'FRIGO_5T', name: 'Hino frigo', plate: '7890 TCB', capacityKg: 5000, refrigerated: true },
  ] as never });
  await prisma.driver.createMany({ data: [
    { id: 'd1', carrierId: car1.id, userId: drv1.id, name: 'Rivo Be', phone: '+261346666666', licenseNumber: 'PL-2019-00451', status: 'AVAILABLE', vehicleId: 'v1' },
    { id: 'd3', carrierId: car2.id, name: 'Faly Nirina', phone: '+261348888888', licenseNumber: 'PL-2018-00987', status: 'AVAILABLE', vehicleId: 'v4' },
  ] as never });

  console.log('→ Fret & offres…');
  await prisma.freight.create({ data: {
    id: 'f1', reference: 'OW-0001', shipperId: ship1.id, title: 'Palettes marchandises générales — Tana → Toamasina',
    cargoType: 'GENERAL', weightKg: 4200, volumeM3: 18, dimensions: '12 palettes 120×80', photos: [],
    pickupAddress: 'Analakely, Antananarivo', pickupCity: 'Antananarivo', pickupLat: -18.8792, pickupLng: 47.5079,
    deliveryAddress: 'Port de Toamasina', deliveryCity: 'Toamasina', deliveryLat: -18.1499, deliveryLng: 49.4023,
    pickupDate: inDays(3), urgency: 'STANDARD', pricingMode: 'FIXED', vehicleType: 'CAMION_5T',
    declaredValue: 35_000_000, insurance: true, distanceKm: 357, durationH: 5.5, budget: 1_650_000, status: 'PUBLISHED', createdAt: daysAgo(1),
  } as never });
  await prisma.bid.createMany({ data: [
    { id: 'b1', freightId: 'f1', carrierId: car1.id, amount: 1_600_000, etaHours: 5.5, message: 'Disponible dès demain.', vehicleId: 'v1', status: 'PENDING' },
    { id: 'b2', freightId: 'f1', carrierId: car2.id, amount: 1_716_000, etaHours: 6.5, message: 'Retour à vide sur Toamasina.', vehicleId: 'v5', status: 'PENDING' },
  ] as never });
  await prisma.document.create({ data: { id: 'doc1', freightId: 'f1', type: 'QUOTE', reference: 'DEV-OW-0001', title: 'Devis de transport — OW-0001' } as never });

  await prisma.kycDocument.createMany({ data: [
    { id: 'k1', userId: car1.id, type: 'COMPANY_REG', reference: 'NIF-123-456', status: 'VERIFIED' },
    { id: 'k4', userId: car2.id, type: 'LICENSE', reference: 'PL-2018-00987', status: 'PENDING' },
  ] as never });

  console.log('✓ Seed terminé. Mot de passe démo : oneway123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
