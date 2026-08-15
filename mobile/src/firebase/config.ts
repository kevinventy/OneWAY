import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
// getReactNativePersistence exists at runtime but is omitted from some v11 typings.
import * as firebaseAuth from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
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

/**
 * Auth avec session persistante (AsyncStorage) : l'utilisateur reste connecté
 * d'un lancement à l'autre.
 *
 * `getReactNativePersistence` est absent de certains bundles (selon la manière
 * dont Metro résout `firebase/auth`). Sans garde, l'app **plantait au
 * démarrage** — écran blanc / « erreur » sur tout. On retombe alors sur une
 * session en mémoire : moins confortable (reconnexion au prochain lancement),
 * mais l'app fonctionne.
 */
function createAuth() {
  const rnPersistence = (firebaseAuth as any).getReactNativePersistence;
  try {
    if (typeof rnPersistence === 'function') {
      return initializeAuth(app, { persistence: rnPersistence(AsyncStorage) });
    }
  } catch {
    // déjà initialisé (Fast Refresh) ou persistance indisponible
  }
  return getAuth(app);
}

export const auth = createAuth();

/**
 * Firestore en **long polling**.
 *
 * Par défaut le SDK web ouvre un flux temps réel (WebChannel/streaming) qui est
 * régulièrement coupé par les réseaux mobiles, les proxys d'opérateur et les
 * WebView Android. Résultat côté utilisateur : les boutons qui écrivent ou
 * lisent dans Firestore échouaient (« Erreur … »), y compris la création de
 * compte, alors que la connexion Internet marchait. Le long polling utilise de
 * simples requêtes HTTPS, bien plus tolérantes sur ces réseaux.
 *
 * `ignoreUndefinedProperties` évite en prime les écritures rejetées à cause
 * d'un champ facultatif non renseigné.
 */
function createFirestore() {
  try {
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
      ignoreUndefinedProperties: true,
    });
  } catch {
    // Firestore déjà initialisé (Fast Refresh) : on réutilise l'instance.
    return getFirestore(app);
  }
}

export const firestore = createFirestore();
export const storage = getStorage(app);
export default app;
