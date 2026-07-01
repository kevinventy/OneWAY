import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { updateDriverLocation } from '@/firebase/db';
import type { Course } from '@/lib/types';

/**
 * Partage la position GPS du téléphone du chauffeur pendant une course active.
 * À activer uniquement pour le chauffeur affecté (`active`) : demande la
 * permission de localisation puis pousse la position vers Firestore (au plus
 * une fois toutes les ~12 s ou tous les 40 m) pour un suivi temps réel.
 */
export function useDriverLocation(course: Course | null, active: boolean) {
  // Réf. tenue à jour pour toujours écrire avec la version la plus récente de la course.
  const courseRef = useRef<Course | null>(course);
  courseRef.current = course;
  const lastSent = useRef(0);

  useEffect(() => {
    if (!course || !active) return;
    let cancelled = false;
    let sub: Location.LocationSubscription | undefined;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 40, timeInterval: 12000 },
        (pos) => {
          const now = Date.now();
          if (now - lastSent.current < 10000) return;
          lastSent.current = now;
          const c = courseRef.current;
          if (!c) return;
          updateDriverLocation(c, pos.coords.latitude, pos.coords.longitude).catch(() => {});
        },
      );
    })();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [course?.id, active]);
}
