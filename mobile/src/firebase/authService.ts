import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, firestore } from './config';
import type { Role, User } from '@/lib/types';

const COLORS = ['#1d3df5', '#ff9500', '#16a34a', '#9333ea', '#e11d48', '#0891b2'];

export interface RegisterInput {
  role: Extract<Role, 'SHIPPER' | 'CARRIER'>;
  name: string;
  email: string;
  phone: string;
  password: string;
  companyName?: string;
  city?: string;
}

export async function register(input: RegisterInput): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
  const uid = cred.user.uid;
  const profile: User = {
    id: uid,
    role: input.role,
    name: input.name,
    email: input.email.trim().toLowerCase(),
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
  for (const [k, v] of Object.entries(profile)) if (v !== undefined) clean[k] = v;
  await setDoc(doc(firestore, 'users', uid), clean);
  return profile;
}

export async function login(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function loadProfile(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(firestore, 'users', uid));
  return snap.exists() ? (snap.data() as User) : null;
}
