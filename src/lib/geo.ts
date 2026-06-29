/**
 * Geo utilities.
 *
 * The MVP ships an embedded city gazetteer + a curated set of real
 * Madagascar inter-city routes (extracted from the ONE WAY tariff sheet)
 * so the map and distance estimates work with zero external API keys.
 *
 * In production, swap `estimateRoute()` for a Mapbox / Google Directions
 * call (see src/lib/integrations/maps.ts stub) to get real road geometry,
 * traffic and turn-by-turn data.
 */

export interface City {
  name: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
}

/** Curated gazetteer — Madagascar hubs (extendable / multi-country ready). */
export const CITIES: City[] = [
  { name: 'Antananarivo', region: 'Analamanga', country: 'MG', lat: -18.8792, lng: 47.5079 },
  { name: 'Toamasina', region: 'Atsinanana', country: 'MG', lat: -18.1499, lng: 49.4023 },
  { name: 'Antsirabe', region: 'Vakinankaratra', country: 'MG', lat: -19.8659, lng: 47.0333 },
  { name: 'Mahajanga', region: 'Boeny', country: 'MG', lat: -15.7167, lng: 46.3167 },
  { name: 'Fianarantsoa', region: 'Haute Matsiatra', country: 'MG', lat: -21.4536, lng: 47.0858 },
  { name: 'Toliara', region: 'Atsimo-Andrefana', country: 'MG', lat: -23.35, lng: 43.6667 },
  { name: 'Ambositra', region: 'Amoron’i Mania', country: 'MG', lat: -20.53, lng: 47.2441 },
  { name: 'Moramanga', region: 'Alaotra-Mangoro', country: 'MG', lat: -18.9333, lng: 48.2 },
  { name: 'Antalaha', region: 'Sava', country: 'MG', lat: -14.9003, lng: 50.2788 },
  { name: 'Fort-Dauphin', region: 'Anosy', country: 'MG', lat: -25.0314, lng: 46.9821 },
  { name: 'Antsiranana', region: 'Diana', country: 'MG', lat: -12.2787, lng: 49.2917 },
];

/** Bounding box used by the embedded SVG map (Madagascar). */
export const MAP_BOUNDS = { minLat: -25.8, maxLat: -11.8, minLng: 43.0, maxLng: 50.7 };

export interface KnownRoute {
  from: string;
  to: string;
  distanceKm: number;
  durationH: number;
}

/** Real routes & durations from the ONE WAY reference sheet. */
export const KNOWN_ROUTES: KnownRoute[] = [
  { from: 'Antananarivo', to: 'Toamasina', distanceKm: 357, durationH: 5.5 },
  { from: 'Antananarivo', to: 'Antsirabe', distanceKm: 167, durationH: 3 },
  { from: 'Antananarivo', to: 'Mahajanga', distanceKm: 472, durationH: 8 },
  { from: 'Antananarivo', to: 'Fianarantsoa', distanceKm: 404, durationH: 7 },
  { from: 'Antananarivo', to: 'Toliara', distanceKm: 756, durationH: 13 },
  { from: 'Antananarivo', to: 'Ambositra', distanceKm: 258, durationH: 4.5 },
  { from: 'Antananarivo', to: 'Moramanga', distanceKm: 109, durationH: 2 },
  { from: 'Antananarivo', to: 'Antalaha', distanceKm: 820, durationH: 15 },
  { from: 'Antananarivo', to: 'Fort-Dauphin', distanceKm: 950, durationH: 18 },
  { from: 'Toamasina', to: 'Mahajanga', distanceKm: 720, durationH: 14 },
  { from: 'Antsirabe', to: 'Fianarantsoa', distanceKm: 237, durationH: 4.5 },
  { from: 'Mahajanga', to: 'Antsiranana', distanceKm: 620, durationH: 11.5 },
];

const R = 6371; // Earth radius km
const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in km. */
export function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const lat1 = rad(a.lat);
  const lat2 = rad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function findCity(name?: string | null): City | undefined {
  if (!name) return undefined;
  const n = name.trim().toLowerCase();
  return (
    CITIES.find((c) => c.name.toLowerCase() === n) ??
    CITIES.find((c) => n.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(n))
  );
}

export interface RouteEstimate {
  distanceKm: number;
  durationH: number;
  from?: City;
  to?: City;
  source: 'known' | 'estimated';
}

/**
 * Estimate distance & duration between two place names.
 * Prefers the curated route table; otherwise falls back to a road-factor
 * adjusted great-circle distance (×1.3) at a 55 km/h average.
 */
export function estimateRoute(fromName: string, toName: string): RouteEstimate {
  const from = findCity(fromName);
  const to = findCity(toName);

  const known = KNOWN_ROUTES.find(
    (r) =>
      (r.from === from?.name && r.to === to?.name) ||
      (r.to === from?.name && r.from === to?.name),
  );
  if (known) return { ...known, from, to, source: 'known' };

  if (from && to) {
    const straight = haversine(from, to);
    const distanceKm = Math.round(straight * 1.3);
    return { distanceKm, durationH: +(distanceKm / 55).toFixed(1), from, to, source: 'estimated' };
  }

  // Unknown places — return a neutral estimate so the form still works.
  return { distanceKm: 0, durationH: 0, from, to, source: 'estimated' };
}

/** Project lat/lng into 0..100 SVG viewport coords for the embedded map. */
export function projectToMap(p: { lat: number; lng: number }): { x: number; y: number } {
  const x = ((p.lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 100;
  const y = ((MAP_BOUNDS.maxLat - p.lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100;
  return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
}

/** Linear interpolation between two points (for simulated GPS progress). */
export function lerpPoint(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
  t: number,
): { lat: number; lng: number } {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}
