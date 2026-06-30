import Constants from 'expo-constants';

/**
 * Vérification de mise à jour « légère » (sans compte Expo) : l'app lit un
 * manifeste `latest.json` hébergé sur GitHub. Si une version plus récente y est
 * publiée, on propose à l'utilisateur de télécharger le nouvel APK (1 tap).
 *
 * Pour publier une mise à jour : bumper app.json (version + android.versionCode),
 * builder l'APK (CI), puis mettre à jour mobile/latest.json (version + apkUrl).
 */
const MANIFEST_URL =
  'https://raw.githubusercontent.com/kevinventy/OneWAY/claude/freight-marketplace-app-ymffso/mobile/latest.json';

export const currentVersion = Constants.expoConfig?.version ?? '1.0.0';

/** Compare deux versions sémantiques « x.y.z ». > 0 si a plus récent que b. */
function cmpVersion(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d > 0 ? 1 : -1;
  }
  return 0;
}

export interface UpdateInfo {
  version: string;
  apkUrl: string;
  notes?: string;
}

/** Retourne les infos de mise à jour si une version plus récente est dispo. */
export async function checkForUpdate(): Promise<UpdateInfo | null> {
  try {
    const res = await fetch(`${MANIFEST_URL}?t=${Date.now()}`); // anti-cache
    if (!res.ok) return null;
    const m = (await res.json()) as Partial<UpdateInfo>;
    if (m?.version && m?.apkUrl && cmpVersion(m.version, currentVersion) > 0) {
      return { version: m.version, apkUrl: m.apkUrl, notes: m.notes };
    }
    return null;
  } catch {
    return null; // hors-ligne : pas de bandeau
  }
}
