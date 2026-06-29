/**
 * Seed Firebase (Auth + Firestore) avec des données de démonstration ONE WAY.
 *
 * Prérequis :
 *   npm i -D firebase-admin tsx
 *   # Téléchargez une clé de compte de service depuis la console Firebase
 *   # (Paramètres du projet → Comptes de service → Générer une clé privée)
 *   export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json
 *   node --import tsx scripts/seed.ts
 *
 * Crée 6 comptes (mot de passe : oneway123) + véhicules, chauffeurs, un fret et des offres.
 */
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ credential: process.env.GOOGLE_APPLICATION_CREDENTIALS ? applicationDefault() : applicationDefault() });
const auth = getAuth();
const db = getFirestore();
const PW = 'oneway123';
const now = Date.now();
const days = (n: number) => now + n * 86400000;

// Identifiant → email synthétique (cohérent avec l'app : pas d'email réel).
const synthEmail = (identifiant: string) => `${identifiant.toLowerCase().replace(/[^a-z0-9._-]+/g, '')}@oneway.app`;

async function ensureUser(uid: string, identifiant: string, profile: Record<string, unknown>) {
  const email = synthEmail(identifiant);
  try {
    await auth.getUser(uid);
  } catch {
    await auth.createUser({ uid, email, password: PW, displayName: profile.name as string });
  }
  await db.collection('users').doc(uid).set({ id: uid, identifiant, email, ...profile }, { merge: true });
}

async function main() {
  console.log('→ Comptes… (identifiant / mot de passe : oneway123)');
  await ensureUser('u_admin', 'admin', { role: 'ADMIN', name: 'Admin ONE WAY', phone: '+261340000000', companyName: 'One Way SARL', city: 'Antananarivo', kycStatus: 'VERIFIED', rating: 0, ratingCount: 0, premium: true, avatarColor: '#1d3df5', createdAt: now });
  await ensureUser('u_ship1', 'chargeur', { role: 'SHIPPER', name: 'Hery Rakoto', phone: '+261341111111', companyName: 'Société ABC Import', city: 'Antananarivo', kycStatus: 'VERIFIED', rating: 4.8, ratingCount: 12, premium: true, avatarColor: '#16a34a', createdAt: now });
  await ensureUser('u_ship2', 'marie', { role: 'SHIPPER', name: 'Marie Rakoto', phone: '+261342222222', companyName: 'Marie Boutique', city: 'Antananarivo', kycStatus: 'VERIFIED', rating: 4.6, ratingCount: 7, premium: false, avatarColor: '#e11d48', createdAt: now });
  await ensureUser('u_car1', 'transporteur', { role: 'CARRIER', name: 'Jean Randria', phone: '+261343333333', companyName: 'Trans Express Mada', city: 'Antananarivo', kycStatus: 'VERIFIED', rating: 4.9, ratingCount: 34, premium: true, avatarColor: '#1d3df5', createdAt: now });
  await ensureUser('u_car2', 'fitateza', { role: 'CARRIER', name: 'Naina Rabe', phone: '+261344444444', companyName: 'Fitateza Logistique', city: 'Toamasina', kycStatus: 'VERIFIED', rating: 4.7, ratingCount: 21, premium: false, avatarColor: '#0891b2', createdAt: now });
  await ensureUser('u_drv1', 'chauffeur', { role: 'DRIVER', name: 'Rivo Be', phone: '+261346666666', city: 'Antananarivo', carrierId: 'u_car1', kycStatus: 'VERIFIED', rating: 4.8, ratingCount: 18, premium: false, avatarColor: '#ca8a04', createdAt: now });

  console.log('→ Véhicules & chauffeurs…');
  await db.collection('vehicles').doc('v1').set({ id: 'v1', carrierId: 'u_car1', type: 'CAMION_5T', name: 'Isuzu NQR', plate: '1234 TBB', capacityKg: 5000, refrigerated: false, available: true, lat: -18.8792, lng: 47.5079 });
  await db.collection('vehicles').doc('v4').set({ id: 'v4', carrierId: 'u_car2', type: 'CAMION_10T', name: 'Renault Kerax', plate: '3456 TCA', capacityKg: 10000, refrigerated: false, available: true, lat: -18.1499, lng: 49.4023 });
  await db.collection('drivers').doc('d1').set({ id: 'd1', carrierId: 'u_car1', userId: 'u_drv1', name: 'Rivo Be', phone: '+261346666666', licenseNumber: 'PL-2019-00451', status: 'AVAILABLE', vehicleId: 'v1' });

  console.log('→ Fret & offres…');
  await db.collection('freights').doc('f1').set({
    id: 'f1', reference: 'OW-0001', shipperId: 'u_ship1', title: 'Palettes marchandises générales — Tana → Toamasina',
    cargoType: 'GENERAL', weightKg: 4200, volumeM3: 18, dimensions: '12 palettes', photos: [],
    pickup: { address: 'Analakely', city: 'Antananarivo', lat: -18.8792, lng: 47.5079 },
    delivery: { address: 'Port de Toamasina', city: 'Toamasina', lat: -18.1499, lng: 49.4023 },
    pickupDate: days(3), urgency: 'STANDARD', pricingMode: 'FIXED', vehicleType: 'CAMION_5T',
    declaredValue: 35000000, insurance: true, distanceKm: 357, durationH: 5.5, budget: 1650000, status: 'PUBLISHED', createdAt: now,
  });
  await db.collection('bids').doc('b1').set({ id: 'b1', freightId: 'f1', carrierId: 'u_car1', carrierName: 'Trans Express Mada', amount: 1600000, etaHours: 5.5, message: 'Disponible dès demain.', vehicleId: 'v1', status: 'PENDING', createdAt: now });
  await db.collection('bids').doc('b2').set({ id: 'b2', freightId: 'f1', carrierId: 'u_car2', carrierName: 'Fitateza Logistique', amount: 1716000, etaHours: 6.5, message: 'Retour à vide sur Toamasina.', vehicleId: 'v4', status: 'PENDING', createdAt: now });
  await db.collection('documents').doc('doc1').set({ id: 'doc1', freightId: 'f1', type: 'QUOTE', reference: 'DEV-OW-0001', title: 'Devis de transport — OW-0001', createdAt: now });
  await db.collection('counters').doc('global').set({ freight: 1, shipment: 0, transaction: 0 }, { merge: true });

  console.log('✓ Seed Firebase terminé. Mot de passe démo : oneway123');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
