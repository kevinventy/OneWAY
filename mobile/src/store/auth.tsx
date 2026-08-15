import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User as FbUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, firestore, isFirebaseConfigured } from '@/firebase/config';
import { login as svcLogin, logout as svcLogout, register as svcRegister, type RegisterInput } from '@/firebase/authService';
import type { User } from '@/lib/types';

interface AuthState {
  firebaseUser: FbUser | null;
  user: User | null;
  loading: boolean;
  configured: boolean;
  /** Connecté à Firebase Auth, mais aucune fiche profil en base (inscription interrompue). */
  profileMissing: boolean;
  /** Le profil n'a pas pu être lu (règles / réseau) — message technique. */
  profileError: string | null;
  login: (identifiant: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FbUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileMissing, setProfileMissing] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    let unsubProfile: (() => void) | undefined;
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      unsubProfile?.();
      setProfileMissing(false);
      setProfileError(null);
      if (fbUser) {
        // Live profile so KYC/rating/role changes reflect immediately.
        unsubProfile = onSnapshot(doc(firestore, 'users', fbUser.uid), (snap) => {
          setUser(snap.exists() ? (snap.data() as User) : null);
          // Sans cette information, l'app restait bloquée sur un spinner sans
          // fin quand un compte existait sans profil. `fromCache` : hors-ligne,
          // « absent » signifie seulement « pas encore en cache » — on ne
          // conclut qu'à partir d'une réponse du serveur.
          setProfileMissing(!snap.exists() && !snap.metadata.fromCache);
          setProfileError(null);
          setLoading(false);
        }, (err) => {
          setProfileError(err?.code ?? err?.message ?? 'inconnue');
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => {
      unsub();
      unsubProfile?.();
    };
  }, []);

  const value: AuthState = {
    firebaseUser,
    user,
    loading,
    configured: isFirebaseConfigured,
    profileMissing,
    profileError,
    login: svcLogin,
    register: async (input) => {
      await svcRegister(input);
    },
    logout: svcLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
