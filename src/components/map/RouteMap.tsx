'use client';

import { CITIES, projectToMap } from '@/lib/geo';
import { roadBetween, pointAlongPath } from '@/lib/roads';
import { MADAGASCAR_OUTLINE } from '@/data/madagascar-geo';
import { cn } from '@/lib/utils';

export interface MapPoint {
  lat: number;
  lng: number;
  label?: string;
}

/**
 * Realistic Madagascar coastline (~223 points, [lat,lng]) projected
 * client-side. Sourced from public GeoJSON — see src/data/madagascar-geo.ts.
 */
const OUTLINE = MADAGASCAR_OUTLINE;

function pointsToPath(pts: [number, number][]): string {
  return (
    pts
      .map(([lat, lng], i) => {
        const { x, y } = projectToMap({ lat, lng });
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ') + ' Z'
  );
}

/** Open polyline (no closing Z) — used for the road geometry. */
function pointsToPath2(pts: [number, number][]): string {
  return pts
    .map(([lat, lng], i) => {
      const { x, y } = projectToMap({ lat, lng });
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

/**
 * Lightweight, key-less interactive map.
 * Renders a stylized Madagascar with the route, pickup/delivery markers and
 * (optionally) a live vehicle position. In production this component is the
 * single swap-point for Mapbox GL / Google Maps.
 */
export function RouteMap({
  from,
  to,
  current,
  progress = 0,
  className,
  showCities = true,
}: {
  from?: MapPoint;
  to?: MapPoint;
  current?: MapPoint | null;
  progress?: number;
  className?: string;
  showCities?: boolean;
}) {
  const island = pointsToPath(OUTLINE);
  const a = from ? projectToMap(from) : null;
  const b = to ? projectToMap(to) : null;

  // Vraie géométrie routière entre les deux villes (sinon ligne droite).
  const road = from && to ? roadBetween(from, to) : null;
  const roadPath = road ? pointsToPath2(road) : null;

  // Véhicule masqué une fois livré (progress 1). Sinon il suit la route (sur
  // tout [0,1], pas seulement à l'intérieur) si on la connaît, sinon `current`.
  const delivered = progress >= 1;
  const vehicleGeo = delivered
    ? null
    : road
      ? pointAlongPath(road, Math.min(1, Math.max(0, progress)))
      : current ?? null;
  const c = vehicleGeo ? projectToMap(vehicleGeo) : null;

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border border-slate-200 bg-[#eaf1fb]', className)}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="h-full w-full">
        <defs>
          <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M8 0H0V8" fill="none" stroke="#d6e2f5" strokeWidth="0.3" />
          </pattern>
          <linearGradient id="land" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dcebcf" />
            <stop offset="0%" stopColor="#d7e8cf" />
            <stop offset="100%" stopColor="#c6dcbb" />
          </linearGradient>
          <filter id="coast" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0.5" stdDeviation="0.6" floodColor="#1d3068" floodOpacity="0.18" />
          </filter>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />

        {/* Landmass — realistic coastline */}
        <path d={island} fill="url(#land)" stroke="#8bb27f" strokeWidth="0.4" strokeLinejoin="round" filter="url(#coast)" />

        {/* City dots for context */}
        {showCities &&
          CITIES.map((city) => {
            const p = projectToMap(city);
            return <circle key={city.name} cx={p.x} cy={p.y} r="0.7" fill="#7c9a72" />;
          })}

        {/* Route : vraie géométrie routière si connue, sinon ligne droite */}
        {roadPath ? (
          <>
            {/* casing blanc pour l'effet « itinéraire » */}
            <path d={roadPath} fill="none" stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
            <path d={roadPath} fill="none" stroke="#1d3df5" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round" />
          </>
        ) : (
          a && b && (
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#1d3df5"
              strokeWidth="1"
              strokeDasharray="2 1.5"
              strokeLinecap="round"
            />
          )
        )}

        {/* Pickup marker */}
        {a && <Marker x={a.x} y={a.y} color="#16a34a" />}
        {/* Delivery marker */}
        {b && <Marker x={b.x} y={b.y} color="#e11d48" />}

        {/* Live vehicle */}
        {c && (
          <g>
            <circle
              cx={c.x}
              cy={c.y}
              r="2.6"
              fill="#ff9500"
              opacity="0.25"
              className="animate-pulse-dot"
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            />
            <circle cx={c.x} cy={c.y} r="1.4" fill="#ff9500" stroke="white" strokeWidth="0.5" />
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className="pointer-events-none absolute bottom-2 left-2 flex flex-col gap-1 rounded-lg bg-white/85 px-2 py-1.5 text-[10px] font-medium text-ink shadow-sm backdrop-blur">
        {from?.label && (
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-600" /> {from.label}
          </span>
        )}
        {to?.label && (
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-600" /> {to.label}
          </span>
        )}
        {current && (
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Véhicule · {Math.round(progress * 100)}%
          </span>
        )}
      </div>
    </div>
  );
}

function Marker({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g>
      <path
        d={`M${x} ${y} c -1.6 -2.4 -2.4 -3.6 -2.4 -5 a 2.4 2.4 0 1 1 4.8 0 c 0 1.4 -0.8 2.6 -2.4 5 z`}
        fill={color}
        stroke="white"
        strokeWidth="0.4"
      />
      <circle cx={x} cy={y - 5} r="0.9" fill="white" />
    </g>
  );
}
