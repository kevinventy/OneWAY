import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { subscribeNotifications } from '@/firebase/db';

/** Affiche les notifications même quand l'app est au premier plan. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
});

let permAsked = false;
async function ensurePermission() {
  if (permAsked) return;
  permAsked = true;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'ONE WAY',
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: '#2a44a0',
      });
    }
    const cur = await Notifications.getPermissionsAsync();
    if (!cur.granted && cur.canAskAgain) await Notifications.requestPermissionsAsync();
  } catch {
    // permission facultative
  }
}

async function present(title: string, body: string) {
  try {
    await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null });
  } catch {
    // ignore
  }
}

/**
 * Transforme les notifications Firestore de l'utilisateur en bannières système
 * (tant que l'app tourne — avant-plan ou arrière-plan). N'affiche PAS
 * l'historique existant au lancement, seulement les nouvelles.
 */
export function useNotificationBanners(userId?: string) {
  useEffect(() => {
    if (!userId) return;
    ensurePermission();
    const seen = new Set<string>();
    let first = true;
    const unsub = subscribeNotifications(userId, (rows) => {
      if (first) {
        rows.forEach((n) => seen.add(n.id));
        first = false;
        return;
      }
      for (const n of rows) {
        if (!seen.has(n.id)) {
          seen.add(n.id);
          if (!n.read) present(n.title, n.body);
        }
      }
    });
    return () => unsub();
  }, [userId]);
}
