import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
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

/** Code entreprise court (partagé par le gérant à ses chauffeurs). */
function genCompanyCode(): string {
  return 'OW' + Math.random().toString(36).slice(2, 6).toUpperCase();
}

export interface RegisterInput {
  role: Role;
  name: string;
  identifiant: string;
  password: string;
  phone?: string;
  /** Gérant uniquement. */
  companyName?: string;
  /** Chauffeur uniquement : code de l'entreprise à rejoindre. */
  companyCode?: string;
}

export async function register(input: RegisterInput): Promise<User> {
  if (input.role === 'CHAUFFEUR' && !(input.companyCode || '').trim()) {
    throw new Error('Code entreprise requis');
  }
  const email = synthEmail(input.identifiant);
  const cred = await createUserWithEmailAndPassword(auth, email, input.password);
  const uid = cred.user.uid;

  try {
    // La résolution du code entreprise nécessite d'être authentifié (règles) →
    // on le fait APRÈS la création du compte, et on nettoie en cas d'échec.
    let ownerId: string | undefined;
    if (input.role === 'CHAUFFEUR') {
      ownerId = (await resolveCompanyOwner((input.companyCode || '').trim().toUpperCase())) || undefined;
      if (!ownerId) throw new Error("Code entreprise introuvable. Demandez-le à votre gérant.");
    }

    const profile: User = {
      id: uid,
      role: input.role,
      name: input.name,
      identifiant: input.identifiant.trim(),
      email,
      phone: input.phone,
      avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)],
      createdAt: Date.now(),
      ...(input.role === 'GERANT'
        ? { companyName: input.companyName, companyCode: genCompanyCode() }
        : { ownerId }),
    };

    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(profile)) if (v !== undefined && v !== '') clean[k] = v;
    await setDoc(doc(firestore, 'users', uid), clean);

    // Crée la fiche chauffeur rattachée au gérant (flotte).
    if (input.role === 'CHAUFFEUR' && ownerId) {
      const dref = doc(collection(firestore, 'drivers'));
      await setDoc(dref, {
        id: dref.id, ownerId, userId: uid,
        name: profile.name, phone: profile.phone || '', licenseNumber: '', status: 'DISPONIBLE',
      });
    }
    return profile;
  } catch (err) {
    // Code invalide ou règles verrouillées : on supprime le compte Auth orphelin.
    await cred.user.delete().catch(() => {});
    throw err;
  }
}

/** Retourne l'uid du gérant possédant ce code entreprise, sinon null. */
async function resolveCompanyOwner(code: string): Promise<string | null> {
  const snap = await getDocs(
    query(collection(firestore, 'users'), where('companyCode', '==', code)),
  );
  return snap.empty ? null : snap.docs[0].id;
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
