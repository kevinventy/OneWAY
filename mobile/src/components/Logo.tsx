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
      <Circle cx={50} cy={50} r={45} fill="none" stroke={colors.brand900} strokeWidth={6} />
      <Circle cx={50} cy={50} r={45} fill={colors.brand50} opacity={0.35} />

      {/* Route en perspective */}
      <Path d="M33 90 L67 90 L55 48 L45 48 Z" fill={colors.brand950} />
      {/* Bords orange de la route */}
      <Path d="M33 90 L45 48" stroke={colors.amber500} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d="M67 90 L55 48" stroke={colors.amber500} strokeWidth={2} fill="none" strokeLinecap="round" />
      {/* Pointillés centraux (perspective) */}
      <Polygon points="49.0,86 51.0,86 50.8,79 49.2,79" fill="#ffffff" />
      <Polygon points="49.3,75 50.7,75 50.55,69 49.45,69" fill="#ffffff" opacity={0.95} />
      <Polygon points="49.5,65 50.5,65 50.4,60 49.6,60" fill="#ffffff" opacity={0.85} />
      <Polygon points="49.65,56 50.35,56 50.28,52 49.72,52" fill="#ffffff" opacity={0.7} />

      {/* Flèche orange ascendante (↗) */}
      <G stroke={colors.amber500} strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <Path d="M44 58 L77 27" />
        <Path d="M64 25 L78 25 L78 39" />
      </G>
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
