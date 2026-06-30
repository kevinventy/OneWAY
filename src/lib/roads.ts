import { CITIES, haversine } from './geo';
import { ROADS_MG } from '@/data/madagascar-roads';

/**
 * Géométrie routière réelle (OSM → Natural Earth, routée hors-ligne).
 * Permet de tracer le vrai axe routier entre deux villes et d'y positionner
 * le véhicule, au lieu d'une ligne droite. Repli silencieux (null) sur les
 * paires non couvertes (grand Nord isolé) → l'appelant retombe sur la droite.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/** Ville du gazetteer la plus proche d'un point (si < maxKm). */
export function nearestCityName(p: LatLng, maxKm = 35): string | undefined {
  let best: string | undefined;
  let bd = maxKm;
  for (const c of CITIES) {
    const d = haversine(p, c);
    if (d < bd) {
      bd = d;
      best = c.name;
    }
  }
  return best;
}

/** Polyligne routière [lat,lng] orientée de `from` vers `to`, ou null. */
export function roadBetween(from: LatLng, to: LatLng): [number, number][] | null {
  const a = nearestCityName(from);
  const b = nearestCityName(to);
  if (!a || !b || a === b) return null;
  const key = [a, b].sort().join('|');
  const road = ROADS_MG[key];
  if (!road) return null;
  return road.from === a ? road.pts : [...road.pts].reverse();
}

/** Longueur d'une polyligne (km). */
export function pathLengthKm(pts: [number, number][]): number {
  let s = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    s += haversine({ lat: pts[i][0], lng: pts[i][1] }, { lat: pts[i + 1][0], lng: pts[i + 1][1] });
  }
  return s;
}

/** Point à la fraction t (0..1) le long de la polyligne, par longueur d'arc. */
export function pointAlongPath(pts: [number, number][], t: number): LatLng {
  if (pts.length === 0) return { lat: 0, lng: 0 };
  if (pts.length === 1 || t <= 0) return { lat: pts[0][0], lng: pts[0][1] };
  if (t >= 1) return { lat: pts[pts.length - 1][0], lng: pts[pts.length - 1][1] };

  const seg: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = haversine({ lat: pts[i][0], lng: pts[i][1] }, { lat: pts[i + 1][0], lng: pts[i + 1][1] });
    seg.push(d);
    total += d;
  }
  let target = t * total;
  for (let i = 0; i < seg.length; i++) {
    if (target <= seg[i] || i === seg.length - 1) {
      const f = seg[i] > 0 ? target / seg[i] : 0;
      return {
        lat: pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f,
        lng: pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f,
      };
    }
    target -= seg[i];
  }
  return { lat: pts[pts.length - 1][0], lng: pts[pts.length - 1][1] };
}
