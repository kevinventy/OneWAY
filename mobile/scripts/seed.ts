/**
 * Seed Firebase (Auth + Firestore) — ONE WAY, modèle transporteur unique.
 *
 * Prérequis :
 *   cd mobile && npm i -D firebase-admin tsx
 *   # Console Firebase → Paramètres → Comptes de service → Générer une clé privée
 *   export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json
 *   node --import tsx scripts/seed.ts
 *
 * Crée 1 gérant + 2 chauffeurs (mot de passe : oneway123), une flotte et 3
 * courses de démonstration avec leur suivi public (collection `tracking`).
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const auth = getAuth();
const db = getFirestore();
const PW = 'oneway123';
const now = Date.now();
const hoursAgo = (n: number) => now - n * 3600000;
const COMPANY = 'One Way SARL';
const COMPANY_CODE = 'OWDEMO';

const synthEmail = (id: string) => `${id.toLowerCase().replace(/[^a-z0-9._-]+/g, '')}@oneway.app`;

// ── Géométries routières (RN) embarquées ───────────────────────────────────
type LL = [number, number];
const ROUTES: Record<string, LL[]> = {
  toamasina: [[-18.879, 47.508], [-18.917, 47.783], [-18.933, 48.2], [-18.62, 48.52], [-18.82, 49.067], [-18.4, 49.41], [-18.15, 49.402]],
  antsirabe: [[-18.879, 47.508], [-19.0, 47.46], [-19.383, 47.417], [-19.6, 47.2], [-19.866, 47.033]],
  mahajanga: [[-18.879, 47.508], [-18.317, 47.117], [-17.3, 46.97], [-16.95, 46.833], [-16.3, 46.55], [-15.717, 46.317]],
};
const R = 6371, rad = (d: number) => (d * Math.PI) / 180;
const dist = (a: LL, b: LL) => { const dLat = rad(b[0] - a[0]), dLng = rad(b[1] - a[1]); const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
const length = (p: LL[]) => { let s = 0; for (let i = 1; i < p.length; i++) s += dist(p[i - 1], p[i]); return Math.round(s); };
function at(p: LL[], t: number): LL { if (t <= 0) return p[0]; if (t >= 1) return p[p.length - 1]; let target = length(p) * t; for (let i = 1; i < p.length; i++) { const seg = dist(p[i - 1], p[i]); if (target <= seg) { const r = seg ? target / seg : 0; return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * r, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * r]; } target -= seg; } return p[p.length - 1]; }

async function ensureUser(uid: string, identifiant: string, profile: Record<string, unknown>) {
  const email = synthEmail(identifiant);
  try { await auth.getUser(uid); } catch { await auth.createUser({ uid, email, password: PW, displayName: profile.name as string }); }
  await db.collection('users').doc(uid).set({ id: uid, identifiant, email, ...profile }, { merge: true });
}

const CITY: Record<string, { city: string; lat: number; lng: number }> = {
  tana: { city: 'Antananarivo', lat: -18.8792, lng: 47.5079 },
  toamasina: { city: 'Toamasina', lat: -18.1499, lng: 49.4023 },
  antsirabe: { city: 'Antsirabe', lat: -19.8659, lng: 47.0333 },
  mahajanga: { city: 'Mahajanga', lat: -15.7167, lng: 46.3167 },
};

async function makeCourse(o: {
  id: string; code: string; ref: string; routeKey: keyof typeof ROUTES; toKey: keyof typeof CITY;
  client: { name: string; phone: string }; cargoType: string; cargoLabel: string; cargoDescription: string;
  weightKg: number; vehicleType: string; vehicleLabel: string; price: number;
  status: string; statusLabel: string; progress: number; driverId?: string; driverUserId?: string;
  driverName?: string; driverPhone?: string; vehicleId?: string; createdAt: number;
  timeline: { status: string; label: string; at: number }[];
}) {
  const geom = ROUTES[o.routeKey];
  const from = CITY.tana, to = CITY[o.toKey];
  const pos = at(geom, o.progress);
  const distanceKm = length(geom);
  const course = {
    id: o.id, code: o.code, reference: o.ref, ownerId: 'u_gerant', companyName: COMPANY,
    client: o.client, cargoType: o.cargoType, cargoDescription: o.cargoDescription, weightKg: o.weightKg,
    vehicleType: o.vehicleType,
    pickup: { address: 'Analakely', city: from.city, lat: from.lat, lng: from.lng },
    delivery: { address: `${to.city} Centre`, city: to.city, lat: to.lat, lng: to.lng },
    distanceKm, durationH: +(distanceKm / 55).toFixed(1), price: o.price, routeGeometry: geom,
    driverId: o.driverId, driverUserId: o.driverUserId, vehicleId: o.vehicleId,
    status: o.status, progress: o.progress, currentLat: pos[0], currentLng: pos[1], createdAt: o.createdAt,
  };
  await db.collection('courses').doc(o.id).set(clean(course));

  const kmRemaining = o.status === 'LIVREE' ? 0 : Math.max(0, Math.round(distanceKm * (1 - o.progress)));
  await db.collection('tracking').doc(o.code).set(clean({
    code: o.code, reference: o.ref, company: COMPANY, status: o.status, statusLabel: o.statusLabel,
    progress: o.progress, distanceKm, kmRemaining, durationH: +(distanceKm / 55).toFixed(1),
    pickup: { city: from.city, lat: from.lat, lng: from.lng },
    delivery: { city: to.city, lat: to.lat, lng: to.lng },
    current: o.status === 'NOUVELLE' ? null : { lat: pos[0], lng: pos[1] },
    routeGeometry: geom, cargoLabel: o.cargoLabel, weightKg: o.weightKg, vehicleLabel: o.vehicleLabel,
    driverName: o.driverName, contactPhone: o.driverPhone,
    delivered: o.status === 'LIVREE', cancelled: false, updatedAt: now, timeline: o.timeline,
  }));
}

function clean<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out as T;
}

async function main() {
  console.log('→ Comptes (identifiant / mot de passe : oneway123)…');
  await ensureUser('u_gerant', 'gerant', { role: 'GERANT', name: 'Hery Rakoto', phone: '+261341234567', companyName: COMPANY, companyCode: COMPANY_CODE, avatarColor: '#1d3df5', createdAt: now });
  await ensureUser('u_chauf1', 'chauffeur', { role: 'CHAUFFEUR', name: 'Rivo Be', phone: '+261347654321', ownerId: 'u_gerant', avatarColor: '#ff9500', createdAt: now });
  await ensureUser('u_chauf2', 'koto', { role: 'CHAUFFEUR', name: 'Koto Solo', phone: '+261349876543', ownerId: 'u_gerant', avatarColor: '#16a34a', createdAt: now });

  console.log('→ Flotte…');
  await db.collection('vehicles').doc('v1').set({ id: 'v1', ownerId: 'u_gerant', type: 'CAMION_5T', name: 'Isuzu NQR', plate: '1234 TBB', capacityKg: 5000, available: false });
  await db.collection('vehicles').doc('v2').set({ id: 'v2', ownerId: 'u_gerant', type: 'CAMION_3T', name: 'Mitsubishi Canter', plate: '5678 TBA', capacityKg: 3000, available: true });
  await db.collection('vehicles').doc('v3').set({ id: 'v3', ownerId: 'u_gerant', type: 'CAMION_10T', name: 'Renault Kerax', plate: '9012 TBC', capacityKg: 10000, available: true });
  await db.collection('drivers').doc('d1').set({ id: 'd1', ownerId: 'u_gerant', userId: 'u_chauf1', name: 'Rivo Be', phone: '+261347654321', licenseNumber: 'PL-2019-00451', vehicleId: 'v1', status: 'EN_MISSION' });
  await db.collection('drivers').doc('d2').set({ id: 'd2', ownerId: 'u_gerant', userId: 'u_chauf2', name: 'Koto Solo', phone: '+261349876543', licenseNumber: 'PL-2020-01122', vehicleId: 'v2', status: 'DISPONIBLE' });

  console.log('→ Courses + suivi public…');
  await makeCourse({
    id: 'c1', code: 'OWTOA01', ref: 'OW-0001', routeKey: 'toamasina', toKey: 'toamasina',
    client: { name: 'Société ABC Import', phone: '+261330000001' }, cargoType: 'GENERAL', cargoLabel: 'Marchandises générales',
    cargoDescription: '12 palettes marchandises générales', weightKg: 4200, vehicleType: 'CAMION_5T', vehicleLabel: 'Camion 5 tonnes',
    price: 1650000, status: 'EN_ROUTE', statusLabel: 'En route', progress: 0.45, driverId: 'd1', driverUserId: 'u_chauf1',
    driverName: 'Rivo', driverPhone: '+261347654321', vehicleId: 'v1', createdAt: hoursAgo(10),
    timeline: [
      { status: 'ASSIGNEE', label: 'Course assignée à Rivo Be', at: hoursAgo(10) },
      { status: 'AU_CHARGEMENT', label: 'Au point de chargement', at: hoursAgo(9) },
      { status: 'EN_ROUTE', label: 'En route vers la livraison', at: hoursAgo(4) },
    ],
  });
  await makeCourse({
    id: 'c2', code: 'OWANT02', ref: 'OW-0002', routeKey: 'antsirabe', toKey: 'antsirabe',
    client: { name: 'Marie Boutique', phone: '+261330000002' }, cargoType: 'FRAGILE', cargoLabel: 'Fragiles / électroniques',
    cargoDescription: 'Lot électronique', weightKg: 900, vehicleType: 'CAMION_3T', vehicleLabel: 'Camion 3 tonnes',
    price: 720000, status: 'LIVREE', statusLabel: 'Livrée', progress: 1, driverId: 'd2', driverUserId: 'u_chauf2',
    driverName: 'Koto', driverPhone: '+261349876543', vehicleId: 'v2', createdAt: hoursAgo(48),
    timeline: [
      { status: 'ASSIGNEE', label: 'Course assignée à Koto Solo', at: hoursAgo(48) },
      { status: 'LIVREE', label: 'Livraison confirmée', at: hoursAgo(44) },
    ],
  });
  await makeCourse({
    id: 'c3', code: 'OWMAH03', ref: 'OW-0003', routeKey: 'mahajanga', toKey: 'mahajanga',
    client: { name: 'Chantier BTP', phone: '+261330000003' }, cargoType: 'LOURD', cargoLabel: 'Matériaux lourds',
    cargoDescription: '190 sacs de ciment', weightKg: 9500, vehicleType: 'CAMION_10T', vehicleLabel: 'Camion 10 tonnes',
    price: 3200000, status: 'NOUVELLE', statusLabel: 'À assigner', progress: 0, createdAt: hoursAgo(1), timeline: [],
  });

  await db.collection('counters').doc('global').set({ course: 3 }, { merge: true });
  console.log(`✓ Seed terminé. Gérant: gerant · Chauffeurs: chauffeur, koto · MDP: ${PW} · Code entreprise: ${COMPANY_CODE}`);
  console.log('  Codes de suivi public : OWTOA01 (en route), OWANT02 (livrée), OWMAH03 (à assigner)');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
