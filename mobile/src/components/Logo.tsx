import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '@/theme';

/** Marque ONE WAY : cercle marine + route (pointillés) + flèche orange « sens unique ». */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Circle cx={16} cy={16} r={15} fill={colors.brand950} />
      {/* route : marquages centraux */}
      <Rect x={15.1} y={22} width={1.8} height={3.4} rx={0.9} fill="#ffffff" opacity={0.9} />
      <Rect x={15.2} y={18} width={1.6} height={2.6} rx={0.8} fill="#ffffff" opacity={0.6} />
      {/* flèche orange vers le haut */}
      <Path d="M16 5.5 L22.5 13 H18.6 V21 H13.4 V13 H9.5 Z" fill={colors.amber500} />
    </Svg>
  );
}

export function Logo({ size = 20, light = false }: { size?: number; light?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <LogoMark size={size * 1.4} />
      <Text style={{ fontSize: size, fontWeight: '900', color: light ? colors.white : colors.ink, letterSpacing: 0.5 }}>
        ONE<Text style={{ color: colors.amber500 }}> WAY</Text>
      </Text>
    </View>
  );
}
