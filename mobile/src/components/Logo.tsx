import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect, Path } from 'react-native-svg';
import { colors } from '@/theme';

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Rect x={1} y={1} width={30} height={30} rx={9} fill={colors.brand950} />
      <Path d="M16 6l6 6h-4v14h-4V12h-4l6-6z" fill={colors.amber500} transform="rotate(90 16 16)" />
    </Svg>
  );
}

export function Logo({ size = 20, light = false }: { size?: number; light?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <LogoMark size={size * 1.4} />
      <Text style={{ fontSize: size, fontWeight: '900', color: light ? colors.white : colors.ink }}>
        ONE<Text style={{ color: colors.amber500 }}> WAY</Text>
      </Text>
    </View>
  );
}
