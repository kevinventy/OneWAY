import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, G } from 'react-native-svg';
import { CITIES, projectToMap } from '@/lib/geo';
import { colors, radius } from '@/theme';

export interface MapPoint {
  lat: number;
  lng: number;
  label?: string;
}

const OUTLINE: [number, number][] = [
  [-11.95, 49.27], [-13.4, 50.0], [-15.3, 49.9], [-16.9, 49.8], [-18.15, 49.42],
  [-19.9, 48.8], [-21.5, 48.0], [-23.5, 47.4], [-24.9, 46.9], [-25.6, 45.2],
  [-25.0, 44.0], [-23.4, 43.65], [-22.0, 43.25], [-20.3, 44.3], [-18.0, 44.0],
  [-15.7, 45.9], [-14.3, 47.7], [-13.4, 48.6], [-12.3, 49.0],
];

function islandPath(): string {
  return (
    OUTLINE.map(([lat, lng], i) => {
      const { x, y } = projectToMap({ lat, lng });
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ') + ' Z'
  );
}

export function RouteMap({
  from,
  to,
  current,
  progress = 0,
  height = 220,
  showCities = true,
}: {
  from?: MapPoint;
  to?: MapPoint;
  current?: MapPoint | null;
  progress?: number;
  height?: number;
  showCities?: boolean;
}) {
  const a = from ? projectToMap(from) : null;
  const b = to ? projectToMap(to) : null;
  const c = current ? projectToMap(current) : null;

  return (
    <View style={[styles.wrap, { height }]}>
      <Svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <Path d={islandPath()} fill="#cfe0c9" stroke="#9cc093" strokeWidth={0.6} />
        {showCities &&
          CITIES.map((city) => {
            const p = projectToMap(city);
            return <Circle key={city.name} cx={p.x} cy={p.y} r={0.7} fill="#7c9a72" />;
          })}
        {a && b && (
          <Line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={colors.brand600} strokeWidth={1} strokeDasharray="2 1.5" strokeLinecap="round" />
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
  wrap: { backgroundColor: '#eaf1fb', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  legend: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, gap: 3 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, fontWeight: '600', color: colors.ink },
});
