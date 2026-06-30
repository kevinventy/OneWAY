import bcrypt from 'bcryptjs';
import type {
  Bid,
  DB,
  DocumentRecord,
  Driver,
  Freight,
  KycDocument,
  Message,
  Notification,
  Review,
  Shipment,
  TrackingEvent,
  Transaction,
  User,
  Vehicle,
} from './types';
import { estimateRoute, findCity } from './geo';
import { positionOnRoute } from './roads';
import { computeQuote, quickEstimate } from './pricing';
import { MARKETPLACE } from '@/data/catalog';

/** Shared demo password for every seeded account. */
export const DEMO_PASSWORD = 'oneway123';

const COLORS = ['#1d3df5', '#ff9500', '#16a34a', '#9333ea', '#e11d48', '#0891b2', '#ca8a04'];

const now = () => Date.now();
const daysAgo = (n: number) => new Date(now() - n * 86_400_000).toISOString();
const hoursAgo = (n: number) => new Date(now() - n * 3_600_000).toISOString();
const inDays = (n: number) => new Date(now() + n * 86_400_000).toISOString();

function hash(pw: string) {
  return bcrypt.hashSync(pw, 8);
}

export function buildSeed(): DB {
  const pw = hash(DEMO_PASSWORD);

  // ── Users ────────────────────────────────────────────────────────────
  const users: User[] = [
    {
      id: 'u_admin', role: 'ADMIN', name: 'Admin ONE WAY', email: 'admin@oneway.mg',
      phone: '+261340000000', passwordHash: pw, companyName: 'One Way SARL', city: 'Antananarivo',
      kycStatus: 'VERIFIED', rating: 0, ratingCount: 0, premium: true, avatarColor: COLORS[0], createdAt: daysAgo(120),
    },
    {
      id: 'u_ship1', role: 'SHIPPER', name: 'Hery Rakoto', email: 'chargeur@oneway.mg',
      phone: '+261341111111', passwordHash: pw, companyName: 'Société ABC Import', city: 'Antananarivo',
      kycStatus: 'VERIFIED', rating: 4.8, ratingCount: 12, premium: true, avatarColor: COLORS[2], createdAt: daysAgo(95),
    },
    {
      id: 'u_ship2', role: 'SHIPPER', name: 'Marie Rakoto', email: 'marie@boutique.mg',
      phone: '+261342222222', passwordHash: pw, companyName: 'Marie Boutique en ligne', city: 'Antananarivo',
      kycStatus: 'VERIFIED', rating: 4.6, ratingCount: 7, premium: false, avatarColor: COLORS[4], createdAt: daysAgo(60),
    },
    {
      id: 'u_car1', role: 'CARRIER', name: 'Jean Randria', email: 'transporteur@oneway.mg',
      phone: '+261343333333', passwordHash: pw, companyName: 'Trans Express Mada', city: 'Antananarivo',
      kycStatus: 'VERIFIED', rating: 4.9, ratingCount: 34, premium: true, avatarColor: COLORS[0], createdAt: daysAgo(110),
    },
    {
      id: 'u_car2', role: 'CARRIER', name: 'Naina Rabe', email: 'fitateza@oneway.mg',
      phone: '+261344444444', passwordHash: pw, companyName: 'Fitateza Logistique', city: 'Toamasina',
      kycStatus: 'VERIFIED', rating: 4.7, ratingCount: 21, premium: false, avatarColor: COLORS[5], createdAt: daysAgo(80),
    },
    {
      id: 'u_car3', role: 'CARRIER', name: 'Tahina Andry', email: 'sudcargo@oneway.mg',
      phone: '+261345555555', passwordHash: pw, companyName: 'Sud Cargo', city: 'Fianarantsoa',
      kycStatus: 'PENDING', rating: 4.3, ratingCount: 4, premium: false, avatarColor: COLORS[3], createdAt: daysAgo(25),
    },
    {
      id: 'u_drv1', role: 'DRIVER', name: 'Rivo Be', email: 'chauffeur@oneway.mg',
      phone: '+261346666666', passwordHash: pw, city: 'Antananarivo', carrierId: 'u_car1',
      kycStatus: 'VERIFIED', rating: 4.8, ratingCount: 18, premium: false, avatarColor: COLORS[6], createdAt: daysAgo(100),
    },
    {
      id: 'u_drv2', role: 'DRIVER', name: 'Koto Solo', email: 'koto@transexpress.mg',
      phone: '+261347777777', passwordHash: pw, city: 'Antananarivo', carrierId: 'u_car1',
      kycStatus: 'VERIFIED', rating: 4.5, ratingCount: 9, premium: false, avatarColor: COLORS[1], createdAt: daysAgo(70),
    },
    {
      id: 'u_drv3', role: 'DRIVER', name: 'Faly Nirina', email: 'faly@fitateza.mg',
      phone: '+261348888888', passwordHash: pw, city: 'Toamasina', carrierId: 'u_car2',
      kycStatus: 'VERIFIED', rating: 4.6, ratingCount: 11, premium: false, avatarColor: COLORS[2], createdAt: daysAgo(65),
    },
  ];

  // ── Vehicles ─────────────────────────────────────────────────────────
  const ta = findCity('Antananarivo')!;
  const toam = findCity('Toamasina')!;
  const fia = findCity('Fianarantsoa')!;
  const vehicles: Vehicle[] = [
    { id: 'v1', carrierId: 'u_car1', type: 'CAMION_5T', name: 'Isuzu NQR', plate: '1234 TBB', capacityKg: 5000, refrigerated: false, available: true, lat: ta.lat, lng: ta.lng },
    { id: 'v2', carrierId: 'u_car1', type: 'CAMION_3T', name: 'Mitsubishi Canter', plate: '5678 TBA', capacityKg: 3000, refrigerated: false, available: true, lat: ta.lat, lng: ta.lng },
    { id: 'v3', carrierId: 'u_car1', type: 'SEMI_20T', name: 'Volvo FH', plate: '9012 TBC', capacityKg: 20000, refrigerated: false, available: false, lat: ta.lat, lng: ta.lng },
    { id: 'v4', carrierId: 'u_car2', type: 'CAMION_10T', name: 'Renault Kerax', plate: '3456 TCA', capacityKg: 10000, refrigerated: false, available: false, lat: toam.lat, lng: toam.lng },
    { id: 'v5', carrierId: 'u_car2', type: 'FRIGO_5T', name: 'Hino frigo', plate: '7890 TCB', capacityKg: 5000, refrigerated: true, available: true, lat: toam.lat, lng: toam.lng },
    { id: 'v6', carrierId: 'u_car3', type: 'CAMIONNETTE', name: 'Toyota HiAce', plate: '2468 TFA', capacityKg: 800, refrigerated: false, available: true, lat: fia.lat, lng: fia.lng },
    { id: 'v7', carrierId: 'u_car3', type: 'CAMION_3T', name: 'JAC 3T', plate: '1357 TFB', capacityKg: 3000, refrigerated: false, available: true, lat: fia.lat, lng: fia.lng },
  ];

  // ── Drivers ──────────────────────────────────────────────────────────
  const drivers: Driver[] = [
    { id: 'd1', carrierId: 'u_car1', userId: 'u_drv1', name: 'Rivo Be', phone: '+261346666666', licenseNumber: 'PL-2019-00451', status: 'AVAILABLE', vehicleId: 'v1' },
    { id: 'd2', carrierId: 'u_car1', userId: 'u_drv2', name: 'Koto Solo', phone: '+261347777777', licenseNumber: 'PL-2020-01122', status: 'AVAILABLE', vehicleId: 'v2' },
    { id: 'd3', carrierId: 'u_car2', userId: 'u_drv3', name: 'Faly Nirina', phone: '+261348888888', licenseNumber: 'PL-2018-00987', status: 'ON_MISSION', vehicleId: 'v4' },
    { id: 'd4', carrierId: 'u_car3', name: 'Mamy Lalaina', phone: '+261349999999', licenseNumber: 'PL-2021-02233', status: 'AVAILABLE', vehicleId: 'v6' },
  ];

  // ── Freights ─────────────────────────────────────────────────────────
  const freights: Freight[] = [];
  const bids: Bid[] = [];
  const shipments: Shipment[] = [];
  const tracking: TrackingEvent[] = [];
  const documents: DocumentRecord[] = [];
  const reviews: Review[] = [];
  const transactions: Transaction[] = [];

  function geoOf(cityName: string, address: string, contactName?: string, contactPhone?: string) {
    const c = findCity(cityName)!;
    return { address, city: c.name, lat: c.lat, lng: c.lng, contactName, contactPhone };
  }

  // f1 — published, fixed price, with competing bids
  {
    const r = estimateRoute('Antananarivo', 'Toamasina');
    const budget = quickEstimate(r.distanceKm, 'CAMION_5T', 'GENERAL');
    freights.push({
      id: 'f1', reference: 'OW-0001', shipperId: 'u_ship1', title: 'Palettes marchandises générales — Tana → Port de Toamasina',
      cargoType: 'GENERAL', weightKg: 4200, volumeM3: 18, dimensions: '12 palettes 120×80',
      photos: [], pickup: geoOf('Antananarivo', 'Analakely, Antananarivo', 'Hery Rakoto', '+261341111111'),
      delivery: geoOf('Toamasina', 'Port de Toamasina, Quai 3', 'Magasinier ABC', '+261341111100'),
      pickupDate: inDays(3), deliveryDate: inDays(4), urgency: 'STANDARD', pricingMode: 'FIXED',
      vehicleType: 'CAMION_5T', declaredValue: 35_000_000, insurance: true, distanceKm: r.distanceKm,
      durationH: r.durationH, budget, status: 'PUBLISHED', createdAt: hoursAgo(20),
    });
    bids.push(
      { id: 'b1', freightId: 'f1', carrierId: 'u_car1', amount: Math.round(budget * 0.97), etaHours: r.durationH, message: 'Disponible dès demain, chauffeur expérimenté Tana-Toamasina.', vehicleId: 'v1', status: 'PENDING', createdAt: hoursAgo(16) },
      { id: 'b2', freightId: 'f1', carrierId: 'u_car2', amount: Math.round(budget * 1.04), etaHours: r.durationH + 1, message: 'Retour à vide sur Toamasina, prix ferme.', vehicleId: 'v5', status: 'PENDING', createdAt: hoursAgo(11) },
    );
    documents.push({ id: 'doc1', freightId: 'f1', type: 'QUOTE', reference: 'DEV-OW-0001', title: 'Devis de transport — OW-0001', createdAt: hoursAgo(20) });
  }

  // f2 — auction, fragile electronics
  {
    const r = estimateRoute('Antananarivo', 'Antsirabe');
    const budget = quickEstimate(r.distanceKm, 'CAMION_3T', 'FRAGILE');
    freights.push({
      id: 'f2', reference: 'OW-0002', shipperId: 'u_ship2', title: 'Lot téléphones & accessoires (fragile) — Tana → Antsirabe',
      cargoType: 'FRAGILE', weightKg: 1100, volumeM3: 6, dimensions: '30 cartons',
      photos: [], pickup: geoOf('Antananarivo', 'Ivandry, Antananarivo', 'Marie Rakoto', '+261342222222'),
      delivery: geoOf('Antsirabe', 'Antsirabe Centre, Av. de l’Indépendance', 'Boutique Antsirabe', '+261342200000'),
      pickupDate: inDays(2), urgency: 'EXPRESS', pricingMode: 'AUCTION', vehicleType: 'CAMION_3T',
      declaredValue: 18_000_000, insurance: true, distanceKm: r.distanceKm, durationH: r.durationH,
      budget, status: 'PUBLISHED', createdAt: hoursAgo(8),
    });
    bids.push(
      { id: 'b3', freightId: 'f2', carrierId: 'u_car1', amount: Math.round(budget * 0.92), etaHours: r.durationH, message: 'Camion bâché, sangles + couvertures pour le fragile.', vehicleId: 'v2', status: 'PENDING', createdAt: hoursAgo(5) },
      { id: 'b4', freightId: 'f2', carrierId: 'u_car3', amount: Math.round(budget * 0.88), etaHours: r.durationH + 0.5, message: 'Meilleur prix, départ ce soir possible.', vehicleId: 'v7', status: 'PENDING', createdAt: hoursAgo(3) },
    );
  }

  // f3 — assigned -> shipment IN_TRANSIT
  {
    const r = estimateRoute('Antananarivo', 'Mahajanga');
    const q = computeQuote({ distanceKm: r.distanceKm, vehicleType: 'CAMION_10T', cargoType: 'LOURD', handlingPickup: true, handlingDelivery: true, insurance: true, declaredValue: 22_000_000, vat: false });
    freights.push({
      id: 'f3', reference: 'OW-0003', shipperId: 'u_ship1', title: 'Sacs de ciment (matériaux lourds) — Tana → Mahajanga',
      cargoType: 'LOURD', weightKg: 9500, volumeM3: 12, dimensions: '190 sacs 50 kg',
      photos: [], pickup: geoOf('Antananarivo', 'Zone industrielle Tanjombato', 'Hery Rakoto', '+261341111111'),
      delivery: geoOf('Mahajanga', 'Mahajanga, Marché Mahabibo', 'Chantier BTP', '+261341111200'),
      pickupDate: hoursAgo(10), urgency: 'STANDARD', pricingMode: 'FIXED', vehicleType: 'CAMION_10T',
      declaredValue: 22_000_000, insurance: true, distanceKm: r.distanceKm, durationH: r.durationH,
      budget: q.totalTTC, status: 'IN_TRANSIT', createdAt: daysAgo(2),
    });
    const from = findCity('Antananarivo')!;
    const to = findCity('Mahajanga')!;
    const progress = 0.45;
    const pos = positionOnRoute(from, to, progress);
    const commission = Math.round(q.totalTTC * MARKETPLACE.commissionRate);
    shipments.push({
      id: 's1', reference: 'EXP-0001', freightId: 'f3', shipperId: 'u_ship1', carrierId: 'u_car2',
      driverId: 'd3', vehicleId: 'v4', price: q.totalTTC, commission, status: 'IN_TRANSIT',
      trackingCode: 'OWMG3456', currentLat: pos.lat, currentLng: pos.lng, progress, createdAt: hoursAgo(11),
    });
    tracking.push(
      { id: 't1', shipmentId: 's1', status: 'ASSIGNED', label: 'Mission attribuée à Fitateza Logistique', by: 'u_ship1', createdAt: hoursAgo(11) },
      { id: 't2', shipmentId: 's1', status: 'AT_PICKUP', label: 'Chauffeur au point de chargement', lat: from.lat, lng: from.lng, by: 'd3', createdAt: hoursAgo(10) },
      { id: 't3', shipmentId: 's1', status: 'LOADED', label: 'Chargement terminé (190 sacs)', lat: from.lat, lng: from.lng, note: '9 500 kg chargés', by: 'd3', createdAt: hoursAgo(9.5) },
      { id: 't4', shipmentId: 's1', status: 'IN_TRANSIT', label: 'En route vers Mahajanga', lat: pos.lat, lng: pos.lng, by: 'd3', createdAt: hoursAgo(4) },
    );
    transactions.push({
      id: 'tx1', reference: 'PAY-0001', shipmentId: 's1', payerId: 'u_ship1', payeeId: 'u_car2',
      amount: q.totalTTC, commission, method: 'MVOLA', status: 'ESCROW', createdAt: hoursAgo(11),
    });
  }

  // f4 — delivered -> shipment DELIVERED + review + docs
  {
    const r = estimateRoute('Antananarivo', 'Fianarantsoa');
    const q = computeQuote({ distanceKm: r.distanceKm, vehicleType: 'FRIGO_5T', cargoType: 'PERISSABLE', handlingPickup: true, handlingDelivery: true, insurance: true, declaredValue: 8_000_000, vat: false });
    freights.push({
      id: 'f4', reference: 'OW-0004', shipperId: 'u_ship2', title: 'Produits frais (frigorifique) — Tana → Fianarantsoa',
      cargoType: 'PERISSABLE', weightKg: 3200, volumeM3: 14, dimensions: 'Palettes réfrigérées',
      photos: [], pickup: geoOf('Antananarivo', 'Marché d’Andravoahangy', 'Marie Rakoto', '+261342222222'),
      delivery: geoOf('Fianarantsoa', 'Fianarantsoa, Supermarché Score', 'Réception Score', '+261342200111'),
      pickupDate: daysAgo(6), deliveryDate: daysAgo(5), urgency: 'EXPRESS', pricingMode: 'FIXED',
      vehicleType: 'FRIGO_5T', declaredValue: 8_000_000, insurance: true, distanceKm: r.distanceKm,
      durationH: r.durationH, budget: q.totalTTC, status: 'DELIVERED', createdAt: daysAgo(7),
    });
    const from = findCity('Antananarivo')!;
    const to = findCity('Fianarantsoa')!;
    const commission = Math.round(q.totalTTC * MARKETPLACE.commissionRate);
    shipments.push({
      id: 's2', reference: 'EXP-0002', freightId: 'f4', shipperId: 'u_ship2', carrierId: 'u_car2',
      driverId: 'd3', vehicleId: 'v5', price: q.totalTTC, commission, status: 'DELIVERED',
      trackingCode: 'OWFR7788', currentLat: to.lat, currentLng: to.lng, progress: 1, createdAt: daysAgo(6), deliveredAt: daysAgo(5),
    });
    tracking.push(
      { id: 't5', shipmentId: 's2', status: 'LOADED', label: 'Chargement frigorifique terminé', lat: from.lat, lng: from.lng, by: 'd3', createdAt: daysAgo(6) },
      { id: 't6', shipmentId: 's2', status: 'IN_TRANSIT', label: 'En route, chaîne du froid OK (4°C)', by: 'd3', createdAt: daysAgo(6) },
      { id: 't7', shipmentId: 's2', status: 'DELIVERED', label: 'Livraison confirmée — signature réception', lat: to.lat, lng: to.lng, note: 'Reçu par Score Fianarantsoa', by: 'd3', createdAt: daysAgo(5) },
    );
    reviews.push({ id: 'rv1', shipmentId: 's2', fromUserId: 'u_ship2', toUserId: 'u_car2', rating: 5, comment: 'Chaîne du froid parfaite, livraison à l’heure. Je recommande !', createdAt: daysAgo(5) });
    reviews.push({ id: 'rv2', shipmentId: 's2', fromUserId: 'u_car2', toUserId: 'u_ship2', rating: 5, comment: 'Marchandise bien préparée, chargement rapide.', createdAt: daysAgo(5) });
    documents.push(
      { id: 'doc2', shipmentId: 's2', freightId: 'f4', type: 'BL', reference: 'BL-OW-0002', title: 'Bordereau de livraison — EXP-0002', createdAt: daysAgo(6) },
      { id: 'doc3', shipmentId: 's2', freightId: 'f4', type: 'POD', reference: 'POD-OW-0002', title: 'Preuve de livraison — EXP-0002', createdAt: daysAgo(5) },
      { id: 'doc4', shipmentId: 's2', freightId: 'f4', type: 'INVOICE', reference: 'FAC-OW-0002', title: 'Facture — EXP-0002', createdAt: daysAgo(5) },
    );
    transactions.push({
      id: 'tx2', reference: 'PAY-0002', shipmentId: 's2', payerId: 'u_ship2', payeeId: 'u_car2',
      amount: q.totalTTC, commission, method: 'ORANGE_MONEY', status: 'RELEASED', createdAt: daysAgo(5),
    });
  }

  // f5 — fresh, no bids yet
  {
    const r = estimateRoute('Antananarivo', 'Moramanga');
    const budget = quickEstimate(r.distanceKm, 'CAMIONNETTE', 'GENERAL');
    freights.push({
      id: 'f5', reference: 'OW-0005', shipperId: 'u_ship1', title: 'Colis e-commerce — Tana → Moramanga',
      cargoType: 'GENERAL', weightKg: 450, volumeM3: 3, dimensions: '15 colis',
      photos: [], pickup: geoOf('Antananarivo', 'Ankorondrano, Antananarivo', 'Hery Rakoto', '+261341111111'),
      delivery: geoOf('Moramanga', 'Moramanga Centre', 'Point relais', '+261341111300'),
      pickupDate: inDays(1), urgency: 'FLEXIBLE', pricingMode: 'FIXED', vehicleType: 'CAMIONNETTE',
      declaredValue: 3_500_000, insurance: false, distanceKm: r.distanceKm, durationH: r.durationH,
      budget, status: 'PUBLISHED', createdAt: hoursAgo(2),
    });
  }

  // ── Messages ─────────────────────────────────────────────────────────
  const messages: Message[] = [
    { id: 'm1', threadId: 'f1', fromUserId: 'u_car1', toUserId: 'u_ship1', body: 'Bonjour, je confirme la disponibilité de mon Isuzu 5T pour demain.', read: true, createdAt: hoursAgo(15) },
    { id: 'm2', threadId: 'f1', fromUserId: 'u_ship1', toUserId: 'u_car1', body: 'Parfait, le chargement se fait à Analakely à 8h.', read: false, createdAt: hoursAgo(14) },
    { id: 'm3', threadId: 's1', fromUserId: 'u_car2', toUserId: 'u_ship1', body: 'Nous avons passé Maevatanana, livraison prévue ce soir.', read: false, createdAt: hoursAgo(4) },
  ];

  // ── KYC ──────────────────────────────────────────────────────────────
  const kyc: KycDocument[] = [
    { id: 'k1', userId: 'u_car1', type: 'COMPANY_REG', reference: 'NIF-123-456', status: 'VERIFIED', createdAt: daysAgo(108) },
    { id: 'k2', userId: 'u_car1', type: 'VEHICLE_REG', reference: 'CG-1234-TBB', status: 'VERIFIED', createdAt: daysAgo(108) },
    { id: 'k3', userId: 'u_car2', type: 'COMPANY_REG', reference: 'NIF-789-012', status: 'VERIFIED', createdAt: daysAgo(78) },
    { id: 'k4', userId: 'u_car3', type: 'LICENSE', reference: 'PL-2021-02233', status: 'PENDING', createdAt: daysAgo(20) },
    { id: 'k5', userId: 'u_car3', type: 'VEHICLE_REG', reference: 'CG-2468-TFA', status: 'PENDING', createdAt: daysAgo(20) },
  ];

  // ── Notifications ────────────────────────────────────────────────────
  const notifications: Notification[] = [
    { id: 'n1', userId: 'u_ship1', type: 'BID', title: 'Nouvelle offre reçue', body: 'Trans Express Mada a proposé un prix pour OW-0001.', read: false, href: '/app/shipper/freight/f1', createdAt: hoursAgo(16) },
    { id: 'n2', userId: 'u_ship1', type: 'TRACKING', title: 'Expédition en route', body: 'EXP-0001 a passé Maevatanana.', read: false, href: '/app/shipper/tracking/s1', createdAt: hoursAgo(4) },
    { id: 'n3', userId: 'u_car1', type: 'FREIGHT', title: 'Nouveau fret près de vous', body: 'Colis e-commerce Tana → Moramanga disponible.', read: false, href: '/app/carrier', createdAt: hoursAgo(2) },
    { id: 'n4', userId: 'u_drv3', type: 'MISSION', title: 'Mission en cours', body: 'Livraison ciment vers Mahajanga.', read: true, href: '/app/driver', createdAt: hoursAgo(10) },
  ];

  return {
    users, vehicles, drivers, freights, bids, shipments, tracking, documents,
    messages, reviews, transactions, kyc, notifications,
    meta: { freightSeq: 5, shipmentSeq: 2, quoteSeq: 1, txSeq: 2 },
  };
}
