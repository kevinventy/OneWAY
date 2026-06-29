'use client';

import { CITIES, projectToMap } from '@/lib/geo';
import { cn } from '@/lib/utils';

export interface MapPoint {
  lat: number;
  lng: number;
  label?: string;
}

/** Rough Madagascar outline (lat,lng) — projected client-side for context. */
const OUTLINE: [number, number][] = [
  [-11.95, 49.27], [-13.4, 50.0], [-15.3, 49.9], [-16.9, 49.8], [-18.15, 49.42],
  [-19.9, 48.8], [-21.5, 48.0], [-23.5, 47.4], [-24.9, 46.9], [-25.6, 45.2],
  [-25.0, 44.0], [-23.4, 43.65], [-22.0, 43.25], [-20.3, 44.3], [-18.0, 44.0],
  [-15.7, 45.9], [-14.3, 47.7], [-13.4, 48.6], [-12.3, 49.0],
];

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
  const c = current ? projectToMap(current) : null;

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border border-slate-200 bg-[#eaf1fb]', className)}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="h-full w-full">
        <defs>
          <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M8 0H0V8" fill="none" stroke="#d6e2f5" strokeWidth="0.3" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />

        {/* Landmass */}
        <path d={island} fill="#cfe0c9" stroke="#9cc093" strokeWidth="0.6" />

        {/* City dots for context */}
        {showCities &&
          CITIES.map((city) => {
            const p = projectToMap(city);
            return <circle key={city.name} cx={p.x} cy={p.y} r="0.7" fill="#7c9a72" />;
          })}

        {/* Route line */}
        {a && b && (
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
        )}

        {/* Pickup marker */}
        {a && <Marker x={a.x} y={a.y} color="#16a34a" />}
        {/* Delivery marker */}
        {b && <Marker x={b.x} y={b.y} color="#e11d48" />}

        {/* Live vehicle */}
        {c && (
          <g>
            <circle cx={c.x} cy={c.y} r="2.6" fill="#ff9500" opacity="0.25" className="animate-pulse-dot" />
            <circle cx={c.x} cy={c.y} r="1.4" fill="#ff9500" stroke="white" strokeWidth="0.5" />
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className="pointer-events-none absolute bottom-2 left-2 flex flex-col gap-1 rounded-lg bg-white/85 px-2 py-1.5 text-[10px] font-medium shadow-sm backdrop-blur">
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
