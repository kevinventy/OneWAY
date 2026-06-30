/**
 * Axes routiers nationaux de Madagascar (RN), tracés via les vraies
 * villes-étapes — corridors réels, embarqués (offline, sans clé API).
 *
 * Le routage en ligne (OSRM) étant indisponible dans cet environnement, les
 * itinéraires suivent les routes nationales par leurs villes intermédiaires
 * (bien plus réaliste qu'une ligne droite). Format des points : [lat, lng].
 */

export type LatLng = [number, number];

export interface RoadRoute {
  from: string;
  to: string;
  road: string;
  points: LatLng[];
}

/** Itinéraires principaux (Antananarivo = hub). */
export const ROAD_ROUTES: RoadRoute[] = [
  {
    from: 'Antananarivo', to: 'Toamasina', road: 'RN2',
    points: [[-18.879, 47.508], [-18.917, 47.783], [-18.933, 48.2], [-18.62, 48.52], [-18.82, 49.067], [-18.4, 49.41], [-18.15, 49.402]],
  },
  {
    from: 'Antananarivo', to: 'Moramanga', road: 'RN2',
    points: [[-18.879, 47.508], [-18.917, 47.783], [-18.933, 48.2]],
  },
  {
    from: 'Antananarivo', to: 'Antsirabe', road: 'RN7',
    points: [[-18.879, 47.508], [-19.0, 47.46], [-19.383, 47.417], [-19.6, 47.2], [-19.866, 47.033]],
  },
  {
    from: 'Antananarivo', to: 'Ambositra', road: 'RN7',
    points: [[-18.879, 47.508], [-19.383, 47.417], [-19.866, 47.033], [-20.3, 47.25], [-20.53, 47.244]],
  },
  {
    from: 'Antananarivo', to: 'Fianarantsoa', road: 'RN7',
    points: [[-18.879, 47.508], [-19.383, 47.417], [-19.866, 47.033], [-20.53, 47.244], [-21.0, 47.15], [-21.454, 47.086]],
  },
  {
    from: 'Antananarivo', to: 'Toliara', road: 'RN7',
    points: [[-18.879, 47.508], [-19.383, 47.417], [-19.866, 47.033], [-20.53, 47.244], [-21.454, 47.086], [-21.78, 46.87], [-22.4, 46.117], [-22.55, 45.4], [-23.0, 44.3], [-23.35, 43.667]],
  },
  {
    from: 'Antananarivo', to: 'Mahajanga', road: 'RN4',
    points: [[-18.879, 47.508], [-18.317, 47.117], [-17.3, 46.97], [-16.95, 46.833], [-16.3, 46.55], [-15.717, 46.317]],
  },
  {
    from: 'Antananarivo', to: 'Fort-Dauphin', road: 'RN7+RN13',
    points: [[-18.879, 47.508], [-19.866, 47.033], [-21.454, 47.086], [-22.4, 46.117], [-23.27, 46.1], [-24.2, 46.08], [-25.03, 46.982]],
  },
  {
    from: 'Mahajanga', to: 'Antsiranana', road: 'RN6',
    points: [[-15.717, 46.317], [-15.5, 47.0], [-15.0, 47.6], [-14.3, 48.0], [-13.4, 48.6], [-12.93, 49.3], [-12.279, 49.292]],
  },
  {
    from: 'Antananarivo', to: 'Antsiranana', road: 'RN4+RN6',
    points: [[-18.879, 47.508], [-18.317, 47.117], [-16.95, 46.833], [-15.717, 46.317], [-14.3, 48.0], [-13.4, 48.6], [-12.279, 49.292]],
  },
];

const norm = (s: string) => s.trim().toLowerCase();

/** Géométrie routière entre deux villes (inverse si besoin), sinon ligne directe. */
export function roadGeometry(from: string, to: string, fallback?: { from: LatLng; to: LatLng }): LatLng[] {
  const f = norm(from);
  const t = norm(to);
  const direct = ROAD_ROUTES.find((r) => norm(r.from) === f && norm(r.to) === t);
  if (direct) return direct.points;
  const reverse = ROAD_ROUTES.find((r) => norm(r.from) === t && norm(r.to) === f);
  if (reverse) return [...reverse.points].reverse();
  if (fallback) return [fallback.from, fallback.to];
  return [];
}

const R = 6371;
const rad = (d: number) => (d * Math.PI) / 180;
function dist(a: LatLng, b: LatLng): number {
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const la1 = rad(a[0]);
  const la2 = rad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Longueur cumulée (km) d'une polyligne routière. */
export function roadLength(points: LatLng[]): number {
  let s = 0;
  for (let i = 1; i < points.length; i++) s += dist(points[i - 1], points[i]);
  return s;
}

/** Position du véhicule à la fraction t (0..1) le long de la route. */
export function pointAtProgress(points: LatLng[], t: number): LatLng {
  if (points.length === 0) return [-18.879, 47.508];
  if (points.length === 1 || t <= 0) return points[0];
  if (t >= 1) return points[points.length - 1];
  const total = roadLength(points);
  let target = total * t;
  for (let i = 1; i < points.length; i++) {
    const seg = dist(points[i - 1], points[i]);
    if (target <= seg) {
      const r = seg === 0 ? 0 : target / seg;
      return [points[i - 1][0] + (points[i][0] - points[i - 1][0]) * r, points[i - 1][1] + (points[i][1] - points[i - 1][1]) * r];
    }
    target -= seg;
  }
  return points[points.length - 1];
}
