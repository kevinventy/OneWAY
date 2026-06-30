import AsyncStorage from '@react-native-async-storage/async-storage';

/** Suivis enregistrés du client (codes de suivi favoris), stockés hors-ligne. */
const KEY = 'oneway:favorites';

export async function getFavorites(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export async function addFavorite(code: string): Promise<string[]> {
  const c = code.trim().toUpperCase();
  const list = await getFavorites();
  if (!c || list.includes(c)) return list;
  const next = [c, ...list].slice(0, 50);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function removeFavorite(code: string): Promise<string[]> {
  const c = code.trim().toUpperCase();
  const next = (await getFavorites()).filter((x) => x !== c);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
