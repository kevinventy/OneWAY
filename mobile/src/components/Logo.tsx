import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Path, Polygon, G } from 'react-native-svg';
import { colors } from '@/theme';

/**
 * Marque ONE WAY : cercle marine, route en perspective (ligne pointillée
 * centrale) et flèche orange ascendante « en avant, en un sens ».
 */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Anneau marine */}
      <Circle cx={50} cy={50} r={45} fill="none" stroke={colors.brand900} strokeWidth={5.5} />
      <Circle cx={50} cy={50} r={42} fill={colors.brand50} opacity={0.3} />

      {/* « W » : aile gauche marine, aile droite orange (+ flèche ascendante) */}
      <G strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <Path d="M24 34 L37 62 L46 46" stroke={colors.brand700} />
        <Path d="M55 46 L63 62 L78 26" stroke={colors.amber500} />
        {/* tête de flèche ↗ */}
        <Path d="M66 26 L79 26 L79 39" stroke={colors.amber500} />
      </G>

      {/* Route en perspective (au centre du W) */}
      <Path d="M37 90 L63 90 L54 52 L46 52 Z" fill={colors.brand950} />
      <Path d="M37 90 L46 52" stroke={colors.amber500} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Path d="M63 90 L54 52" stroke={colors.amber500} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      {/* Pointillés centraux (perspective) */}
      <Polygon points="49.0,86 51.0,86 50.8,80 49.2,80" fill="#ffffff" />
      <Polygon points="49.3,76 50.7,76 50.55,70 49.45,70" fill="#ffffff" opacity={0.95} />
      <Polygon points="49.5,66 50.5,66 50.4,61 49.6,61" fill="#ffffff" opacity={0.85} />
      <Polygon points="49.65,57 50.35,57 50.28,54 49.72,54" fill="#ffffff" opacity={0.7} />
    </Svg>
  );
}

export function Logo({ size = 20, light = false, tagline = false }: { size?: number; light?: boolean; tagline?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <LogoMark size={size * 1.7} />
      <View>
        <Text style={{ fontSize: size, fontWeight: '900', color: light ? colors.white : colors.ink, letterSpacing: 0.5 }}>
          ONE<Text style={{ color: colors.amber500 }}> WAY</Text>
        </Text>
        {tagline && (
          <Text style={{ fontSize: size * 0.42, fontWeight: '700', color: light ? colors.brand100 : colors.inkMuted, letterSpacing: 0.3, marginTop: 1 }}>
            Transport · Livraison · Suivi digital
          </Text>
        )}
      </View>
    </View>
  );
}
