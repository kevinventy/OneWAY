'use client';

import { MADAGASCAR_OUTLINE, MADAGASCAR_BBOX } from '@/data/madagascar';
import { CITIES } from '@/lib/geo';
import type { LatLng } from '@/data/roads';
import { cn } from '@/lib/utils';

const B = MADAGASCAR_BBOX;
const MEAN_LAT = (B.minLat + B.maxLat) / 2;
const KX = Math.cos((MEAN_LAT * Math.PI) / 180);
const S = 10; // facteur d'échelle pour des unités SVG lisibles
const W = (B.maxLng - B.minLng) * KX * S;
const H = (B.maxLat - B.minLat) * S;

function proj(lat: number, lng: number): [number, number] {
  return [(lng - B.minLng) * KX * S, (B.maxLat - lat) * S];
}

const LANDMASS = MADAGASCAR_OUTLINE.map(([lat, lng], i) => {
  const [x, y] = proj(lat, lng);
  return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
}).join(' ') + ' Z';

export interface MapPoint {
  lat: number;
  lng: number;
  label?: string;
}

/**
 * Carte réaliste de Madagascar (vrai contour Natural Earth) avec l'itinéraire
 * suivant les vrais axes routiers (géométrie embarquée), le véhicule en
 * position réelle et les kilomètres restants. 100 % hors-ligne, sans clé API.
 */
export function RealMap({
  route,
  current,
  from,
  to,
  kmRemaining,
  className,
  showCities = true,
}: {
  route?: LatLng[];
  current?: MapPoint | null;
  from?: MapPoint;
  to?: MapPoint;
  kmRemaining?: number;
  className?: string;
  showCities?: boolean;
}) {
  const routePath =
    route && route.length > 1
      ? route.map(([lat, lng], i) => {
          const [x, y] = proj(lat, lng);
          return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
        }).join(' ')
      : null;

  const a = from ? proj(from.lat, from.lng) : null;
  const b = to ? proj(to.lat, to.lng) : null;
  const c = current ? proj(current.lat, current.lng) : null;

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border border-slate-200 bg-[#dbecf7]', className)}>
      <svg viewBox={`-4 -4 ${W + 8} ${H + 8}`} preserveAspectRatio="xMidYMid meet" className="h-full w-full">
        {/* Landmass */}
        <path d={LANDMASS} fill="#e7efe1" stroke="#a9c39a" strokeWidth={0.6} />

        {/* Villes (contexte) */}
        {showCities &&
          CITIES.map((city) => {
            const [x, y] = proj(city.lat, city.lng);
            return (
              <g key={city.name}>
                <circle cx={x} cy={y} r={0.7} fill="#5b6678" opacity={0.5} />
              </g>
            );
          })}

        {/* Itinéraire (vrais axes) */}
        {routePath && (
          <>
            <path d={routePath} fill="none" stroke="#ffffff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
            <path d={routePath} fill="none" stroke="#2a44a0" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}

        {a && <Marker x={a[0]} y={a[1]} color="#16a34a" />}
        {b && <Marker x={b[0]} y={b[1]} color="#e11d48" />}

        {c && (
          <g>
            <circle cx={c[0]} cy={c[1]} r={3.2} fill="#f07d1a" opacity={0.25} className="animate-pulse-dot" />
            <circle cx={c[0]} cy={c[1]} r={1.8} fill="#f07d1a" stroke="#fff" strokeWidth={0.7} />
          </g>
        )}
      </svg>

      {/* Overlays */}
      {kmRemaining != null && (
        <div className="absolute right-2 top-2 rounded-lg bg-white/90 px-2.5 py-1.5 text-right shadow-sm backdrop-blur">
          <p className="text-[10px] font-medium text-ink-muted">Km restants</p>
          <p className="text-base font-extrabold text-brand-700">{Math.max(0, Math.round(kmRemaining))} km</p>
        </div>
      )}
      <div className="pointer-events-none absolute bottom-2 left-2 flex flex-col gap-1 rounded-lg bg-white/85 px-2 py-1.5 text-[10px] font-medium shadow-sm backdrop-blur">
        {from?.label && <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-600" /> {from.label}</span>}
        {to?.label && <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-600" /> {to.label}</span>}
        {current && <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Véhicule</span>}
      </div>
    </div>
  );
}

function Marker({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g>
      <path
        d={`M${x} ${y} c -1.9 -2.9 -2.9 -4.3 -2.9 -6 a 2.9 2.9 0 1 1 5.8 0 c 0 1.7 -1 3.1 -2.9 6 z`}
        fill={color}
        stroke="#fff"
        strokeWidth={0.5}
      />
      <circle cx={x} cy={y - 6} r={1.1} fill="#fff" />
    </g>
  );
}
