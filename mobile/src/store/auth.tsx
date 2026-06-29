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
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FbUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    let unsubProfile: (() => void) | undefined;
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      unsubProfile?.();
      if (fbUser) {
        // Live profile so KYC/rating/role changes reflect immediately.
        unsubProfile = onSnapshot(doc(firestore, 'users', fbUser.uid), (snap) => {
          setUser(snap.exists() ? (snap.data() as User) : null);
          setLoading(false);
        }, () => setLoading(false));
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
