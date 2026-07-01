import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCourse, updateDriverLocation } from '@/firebase/db';

/**
 * Suivi GPS en arrière-plan du chauffeur.
 *
 * `startLocationUpdatesAsync` lance un service de premier plan Android : la
 * position continue d'être remontée même téléphone verrouillé / app en
 * arrière-plan. La tâche headless lit la course active (AsyncStorage), la
 * relit dans Firestore et met à jour la position. Elle s'auto-arrête quand la
 * course est livrée/annulée.
 *
 * Ce module DOIT être importé au démarrage de l'app (voir app/_layout.tsx) pour
 * que la tâche soit enregistrée même lors d'un relancement headless par l'OS.
 */
export const LOCATION_TASK = 'oneway-driver-location';
const ACTIVE_KEY = 'oneway.activeCourseId';

TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: any) => {
  if (error) return;
  const locations: Location.LocationObject[] | undefined = data?.locations;
  const loc = locations && locations[locations.length - 1];
  if (!loc) return;
  try {
    const courseId = await AsyncStorage.getItem(ACTIVE_KEY);
    if (!courseId) return;
    const course = await getCourse(courseId);
    if (!course) return;
    if (['LIVREE', 'ANNULEE'].includes(course.status)) {
      await stopDriverTracking(); // mission terminée → on coupe le service.
      return;
    }
    await updateDriverLocation(course, loc.coords.latitude, loc.coords.longitude);
  } catch {
    // silencieux : une erreur ponctuelle ne doit pas tuer la tâche de fond.
  }
});

/** Démarre le partage GPS (premier plan + arrière-plan) pour une course. */
export async function startDriverTracking(courseId: string): Promise<'ok' | 'denied' | 'error'> {
  try {
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== 'granted') return 'denied';
    // Autorisation « en arrière-plan » (Android 10+) : indispensable pour
    // continuer quand l'écran est verrouillé. Refus non bloquant (le service de
    // premier plan fonctionne au moins app ouverte).
    await Location.requestBackgroundPermissionsAsync().catch(() => undefined);

    await AsyncStorage.setItem(ACTIVE_KEY, courseId);

    const already = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
    if (already) return 'ok';

    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 40, // m
      timeInterval: 15000, // ms
      showsBackgroundLocationIndicator: true,
      pausesUpdatesAutomatically: false,
      foregroundService: {
        notificationTitle: 'ONE WAY — suivi en cours',
        notificationBody: 'Votre position est partagée pour le suivi de la livraison.',
        notificationColor: '#2a44a0',
      },
    });
    return 'ok';
  } catch {
    return 'error';
  }
}

/** Arrête le partage GPS et oublie la course active. */
export async function stopDriverTracking(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ACTIVE_KEY);
    const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
    if (started) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  } catch {
    // ignore
  }
}
