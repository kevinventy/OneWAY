/**
 * Mémorisation des identifiants de connexion (« Se souvenir de moi »).
 *
 * Stockés dans le trousseau chiffré du téléphone (Android Keystore via
 * expo-secure-store), pas en clair. Utilisé uniquement pour pré-remplir
 * l'écran de connexion après une déconnexion.
 */
import * as SecureStore from 'expo-secure-store';

const KEY = 'oneway.savedLogin';

export interface SavedLogin {
  identifiant: string;
  password: string;
}

export async function saveLogin(identifiant: string, password: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify({ identifiant, password }));
  } catch {
    // stockage sécurisé indisponible : on ignore silencieusement
  }
}

export async function getSavedLogin(): Promise<SavedLogin | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (v && typeof v.identifiant === 'string' && typeof v.password === 'string') return v;
  } catch {
    // valeur illisible : on ignore
  }
  return null;
}

export async function clearSavedLogin(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // ignore
  }
}
