import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, firestore } from './config';
import type { Role, User } from '@/lib/types';

const COLORS = ['#1d3df5', '#ff9500', '#16a34a', '#9333ea', '#e11d48', '#0891b2'];

/**
 * ONE WAY n'exige ni email ni téléphone : l'utilisateur choisit un identifiant
 * (nom d'utilisateur). En interne, Firebase Auth utilise un email synthétique
 * `identifiant@oneway.app` — aucun email réel n'est envoyé ou requis.
 */
export function synthEmail(identifiant: string): string {
  const slug = identifiant.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '');
  return `${slug || 'user'}@oneway.app`;
}

export interface RegisterInput {
  role: Extract<Role, 'SHIPPER' | 'CARRIER'>;
  name: string;
  identifiant: string;
  password: string;
  phone?: string;
  companyName?: string;
  city?: string;
}

export async function register(input: RegisterInput): Promise<User> {
  const email = synthEmail(input.identifiant);
  const cred = await createUserWithEmailAndPassword(auth, email, input.password);
  const uid = cred.user.uid;
  const profile: User = {
    id: uid,
    role: input.role,
    name: input.name,
    identifiant: input.identifiant.trim(),
    email,
    phone: input.phone,
    companyName: input.companyName,
    city: input.city,
    kycStatus: 'NONE',
    rating: 0,
    ratingCount: 0,
    premium: false,
    avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)],
    createdAt: Date.now(),
  };
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(profile)) if (v !== undefined && v !== '') clean[k] = v;
  await setDoc(doc(firestore, 'users', uid), clean);
  return profile;
}

export async function login(identifiant: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, synthEmail(identifiant), password);
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function loadProfile(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(firestore, 'users', uid));
  return snap.exists() ? (snap.data() as User) : null;
}
