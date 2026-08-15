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
  /** Vraie adresse email (facultative). Si fournie, elle sert d'identifiant de connexion. */
  email?: string;
  /** Gérant uniquement. */
  companyName?: string;
  /** Chauffeur uniquement : code de l'entreprise à rejoindre. */
  companyCode?: string;
}

/** Relance une écriture Firestore : les réseaux mobiles coupent souvent la 1re. */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let last: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e: any) {
      last = e;
      // Une erreur de droits ou de validation ne s'arrangera pas en réessayant.
      if (e?.code === 'permission-denied' || e?.code === 'invalid-argument') throw e;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 600 * (i + 1)));
    }
  }
  throw last;
}

/**
 * Ouvre (ou récupère) le compte Firebase Auth de l'inscription.
 *
 * Une inscription interrompue après la création du compte mais avant
 * l'enregistrement du profil laissait un compte « orphelin » : toute nouvelle
 * tentative échouait alors définitivement avec « Cet identifiant est déjà
 * pris », sans aucun moyen de s'en sortir. On récupère donc ce compte quand le
 * mot de passe saisi est le bon et qu'aucun profil n'existe.
 */
async function openAccount(email: string, password: string): Promise<{ uid: string; adopted: boolean }> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return { uid: cred.user.uid, adopted: false };
  } catch (e: any) {
    if (e?.code !== 'auth/email-already-in-use') throw e;
    let cred;
    try {
      cred = await signInWithEmailAndPassword(auth, email, password);
    } catch {
      throw e; // le compte appartient à quelqu'un d'autre → message d'origine
    }
    if (await loadProfile(cred.user.uid)) {
      throw new Error('Ce compte existe déjà. Touchez « J’ai déjà un compte » pour vous connecter.');
    }
    return { uid: cred.user.uid, adopted: true };
  }
}

export async function register(input: RegisterInput): Promise<User> {
  if (input.role === 'CHAUFFEUR' && !(input.companyCode || '').trim()) {
    throw new Error('Code entreprise requis');
  }
  // Si une vraie adresse email est fournie, elle devient l'identifiant de
  // connexion Firebase ; sinon on retombe sur l'email synthétique (@oneway.app).
  const realEmail = (input.email || '').trim().toLowerCase();
  const email = realEmail || synthEmail(input.identifiant);
  const { uid, adopted } = await openAccount(email, input.password);

  try {
    // La résolution du code entreprise nécessite d'être authentifié (règles) →
    // on le fait APRÈS la création du compte, et on nettoie en cas d'échec.
    let ownerId: string | undefined;
    if (input.role === 'CHAUFFEUR') {
      const code = (input.companyCode || '').trim().toUpperCase();
      const found = await withRetry(() => resolveCompanyOwner(code));
      if (!found) {
        throw Object.assign(new Error('Code entreprise introuvable. Demandez-le à votre gérant.'), { badCompanyCode: true });
      }
      ownerId = found;
    }

    const profile: User = {
      id: uid,
      role: input.role,
      name: input.name,
      identifiant: input.identifiant.trim(),
      email,
      contactEmail: realEmail || undefined,
      phone: input.phone,
      avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)],
      createdAt: Date.now(),
      ...(input.role === 'GERANT' ? { companyName: input.companyName, companyCode: genCompanyCode() } : {}),
      ...(input.role === 'CHAUFFEUR' ? { ownerId } : {}),
    };

    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(profile)) if (v !== undefined && v !== '') clean[k] = v;
    await withRetry(() => setDoc(doc(firestore, 'users', uid), clean));

    // Crée la fiche chauffeur rattachée au gérant (flotte).
    if (input.role === 'CHAUFFEUR' && ownerId) {
      const dref = doc(collection(firestore, 'drivers'));
      await withRetry(() => setDoc(dref, {
        id: dref.id, ownerId, userId: uid,
        name: profile.name, phone: profile.phone || '', licenseNumber: '', status: 'DISPONIBLE',
      }));
    }
    return profile;
  } catch (err: any) {
    // Saisie à corriger (code entreprise) : on libère l'identifiant tout de
    // suite pour que la nouvelle tentative reparte de zéro.
    if (err?.badCompanyCode && !adopted) {
      await auth.currentUser?.delete().catch(() => {});
      throw err;
    }
    // Panne réseau / Firestore : le compte Auth est conservé volontairement.
    // La tentative suivante avec les mêmes identifiants le récupérera et
    // terminera l'inscription (cf. openAccount) au lieu de rester bloquée.
    if (err?.code === 'permission-denied') throw err;
    throw new Error(
      'Compte créé, mais le profil n’a pas pu être enregistré (connexion instable). ' +
      'Réessayez avec les mêmes identifiants dès que le réseau revient : l’inscription reprendra où elle s’est arrêtée.',
    );
  }
}

/** Retourne l'uid du gérant possédant ce code entreprise, sinon null. */
async function resolveCompanyOwner(code: string): Promise<string | null> {
  const snap = await getDocs(
    query(collection(firestore, 'users'), where('companyCode', '==', code)),
  );
  return snap.empty ? null : snap.docs[0].id;
}

/**
 * Connexion par identifiant OU vraie adresse email. Si la saisie contient « @ »,
 * elle est utilisée telle quelle comme email Firebase ; sinon on la transforme
 * en email synthétique `identifiant@oneway.app`.
 */
export async function login(identifier: string, password: string): Promise<void> {
  const id = identifier.trim();
  const email = id.includes('@') ? id.toLowerCase() : synthEmail(id);
  await signInWithEmailAndPassword(auth, email, password);
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function loadProfile(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(firestore, 'users', uid));
  return snap.exists() ? (snap.data() as User) : null;
}
