import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { CITIES, projectToMap } from '@/lib/geo';
import { MADAGASCAR_OUTLINE } from '@/data/madagascar';
import type { LatLng } from '@/data/roads';
import { colors, radius } from '@/theme';

export interface MapPoint {
  lat: number;
  lng: number;
  label?: string;
}

const ISLAND_PATH =
  MADAGASCAR_OUTLINE.map(([lat, lng], i) => {
    const { x, y } = projectToMap({ lat, lng });
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ') + ' Z';

/**
 * Carte réaliste de Madagascar (vrai contour) avec l'itinéraire suivant les
 * vrais axes RN (polyligne), le véhicule en position réelle et les km restants.
 */
export function RouteMap({
  from,
  to,
  current,
  route,
  progress = 0,
  kmRemaining,
  height = 220,
  showCities = true,
}: {
  from?: MapPoint;
  to?: MapPoint;
  current?: MapPoint | null;
  route?: LatLng[];
  progress?: number;
  kmRemaining?: number;
  height?: number;
  showCities?: boolean;
}) {
  const a = from ? projectToMap(from) : null;
  const b = to ? projectToMap(to) : null;
  const c = current ? projectToMap(current) : null;

  const routePath =
    route && route.length > 1
      ? route.map(([lat, lng], i) => {
          const { x, y } = projectToMap({ lat, lng });
          return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
        }).join(' ')
      : null;

  return (
    <View style={[styles.wrap, { height }]}>
      <Svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <Path d={ISLAND_PATH} fill="#e7efe1" stroke="#a9c39a" strokeWidth={0.5} />
        {showCities &&
          CITIES.map((city) => {
            const p = projectToMap(city);
            return <Circle key={city.name} cx={p.x} cy={p.y} r={0.6} fill="#7c9a72" />;
          })}
        {routePath && (
          <>
            <Path d={routePath} fill="none" stroke="#ffffff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            <Path d={routePath} fill="none" stroke={colors.brand600} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {a && <Marker x={a.x} y={a.y} color={colors.green} />}
        {b && <Marker x={b.x} y={b.y} color={colors.red} />}
        {c && (
          <G>
            <Circle cx={c.x} cy={c.y} r={2.6} fill={colors.amber500} opacity={0.25} />
            <Circle cx={c.x} cy={c.y} r={1.4} fill={colors.amber500} stroke="white" strokeWidth={0.5} />
          </G>
        )}
      </Svg>

      {kmRemaining != null && (
        <View style={styles.kmBadge}>
          <Text style={styles.kmLabel}>Km restants</Text>
          <Text style={styles.kmValue}>{Math.max(0, Math.round(kmRemaining))} km</Text>
        </View>
      )}

      <View style={styles.legend}>
        {from?.label && <Legend color={colors.green} text={from.label} />}
        {to?.label && <Legend color={colors.red} text={to.label} />}
        {current && <Legend color={colors.amber500} text={`Véhicule · ${Math.round(progress * 100)}%`} />}
      </View>
    </View>
  );
}

function Marker({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <G>
      <Path
        d={`M${x} ${y} c -1.6 -2.4 -2.4 -3.6 -2.4 -5 a 2.4 2.4 0 1 1 4.8 0 c 0 1.4 -0.8 2.6 -2.4 5 z`}
        fill={color}
        stroke="white"
        strokeWidth={0.4}
      />
      <Circle cx={x} cy={y - 5} r={0.9} fill="white" />
    </G>
  );
}

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#dbecf7', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  legend: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, gap: 3 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, fontWeight: '600', color: colors.ink },
  kmBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'flex-end' },
  kmLabel: { fontSize: 9, color: colors.inkMuted, fontWeight: '600' },
  kmValue: { fontSize: 15, fontWeight: '800', color: colors.brand700 },
});
