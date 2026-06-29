import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
// getReactNativePersistence exists at runtime but is omitted from some v11 typings.
import * as firebaseAuth from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

/**
 * Firebase configuration.
 *
 * La config est lue depuis `app.json` → `expo.extra.firebase` (ou des
 * variables d'environnement EXPO_PUBLIC_FIREBASE_*). Créez un projet Firebase
 * (console.firebase.google.com), activez Authentication (Email/Mot de passe)
 * et Firestore, puis collez les clés. Voir mobile/FIREBASE_SETUP.md.
 */
const extra = (Constants.expoConfig?.extra?.firebase ?? {}) as Partial<FirebaseOptions>;

// La config embarquée (app.json → extra.firebase) est prioritaire sur les
// variables d'environnement, afin que les valeurs committées (sûres car
// publiques) priment sur d'éventuelles Variables de dépôt erronées.
const firebaseConfig: FirebaseOptions = {
  apiKey: extra.apiKey || process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: extra.authDomain || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: extra.projectId || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: extra.storageBucket || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: extra.messagingSenderId || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: extra.appId || process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

/** True once real Firebase keys are provided. */
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: (firebaseAuth as any).getReactNativePersistence(AsyncStorage),
});

export const firestore = getFirestore(app);
export const storage = getStorage(app);
export default app;
