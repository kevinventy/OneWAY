import type { LatLng } from '@/data/roads';

/**
 * Routage routier réel via OSRM (démo publique) : renvoie la géométrie qui
 * suit exactement les routes et la distance de conduite. Best-effort — renvoie
 * `null` hors-ligne ou si le service est indisponible (on retombe alors sur les
 * axes RN répertoriés).
 */
const OSRM = 'https://router.project-osrm.org/route/v1/driving';

export interface RoadRoute {
  distanceKm: number;
  durationH: number;
  geometry: LatLng[];
}

export async function fetchRoadRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  timeoutMs = 8000,
): Promise<RoadRoute | null> {
  try {
    const url = `${OSRM}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const route = data?.routes?.[0];
    const coords: [number, number][] | undefined = route?.geometry?.coordinates;
    if (!coords || coords.length < 2) return null;
    // GeoJSON = [lng, lat] → on repasse en [lat, lng].
    let geometry: LatLng[] = coords.map(([lng, lat]) => [lat, lng] as LatLng);
    if (geometry.length > 400) geometry = decimate(geometry, 400); // limite la taille Firestore
    return {
      distanceKm: Math.max(1, Math.round(route.distance / 1000)),
      durationH: +(route.duration / 3600).toFixed(1),
      geometry,
    };
  } catch {
    return null;
  }
}

/** Réduit une polyligne à ~max points en gardant les extrémités. */
function decimate(pts: LatLng[], max: number): LatLng[] {
  const step = Math.ceil(pts.length / max);
  const out: LatLng[] = [];
  for (let i = 0; i < pts.length; i += step) out.push(pts[i]);
  const last = pts[pts.length - 1];
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}
