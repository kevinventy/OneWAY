import { useEffect } from 'react';
import { Alert } from 'react-native';
import { startDriverTracking, stopDriverTracking } from '@/lib/locationTask';
import type { Course } from '@/lib/types';

/**
 * Active le partage GPS du chauffeur affecté pendant une course active.
 * S'appuie sur un service de premier plan (voir locationTask) : la position
 * continue d'être remontée téléphone verrouillé / app en arrière-plan.
 * Le partage s'arrête quand l'écran est quitté ou la mission terminée.
 */
export function useDriverLocation(course: Course | null, active: boolean) {
  const courseId = course?.id;
  useEffect(() => {
    if (!courseId || !active) return;
    startDriverTracking(courseId)
      .then((r) => {
        if (r === 'denied') {
          Alert.alert(
            'Localisation requise',
            'Activez la localisation (« Toujours autoriser » pour le suivi même écran verrouillé) afin de partager votre position au client.',
          );
        }
      })
      .catch(() => undefined);
    return () => {
      stopDriverTracking().catch(() => undefined);
    };
  }, [courseId, active]);
}
