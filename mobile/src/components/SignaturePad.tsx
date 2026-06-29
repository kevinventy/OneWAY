import React, { useRef, useState } from 'react';
import { View, Text, Pressable, PanResponder, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, radius } from '@/theme';

/**
 * Pad de signature léger (react-native-svg + PanResponder, sans WebView).
 * Émet le tracé (attribut `d` SVG concaténé) via onChange.
 */
export function SignaturePad({ onChange, height = 180 }: { onChange: (d: string) => void; height?: number }) {
  const [paths, setPaths] = useState<string[]>([]);
  const [live, setLive] = useState('');
  const liveRef = useRef('');

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        liveRef.current = `M${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
        setLive(liveRef.current);
      },
      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        liveRef.current += ` L${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
        setLive(liveRef.current);
      },
      onPanResponderRelease: () => {
        setPaths((prev) => {
          const next = [...prev, liveRef.current];
          onChange(next.join(' '));
          return next;
        });
        liveRef.current = '';
        setLive('');
      },
    }),
  ).current;

  function clear() {
    setPaths([]);
    setLive('');
    liveRef.current = '';
    onChange('');
  }

  return (
    <View>
      <View style={[styles.pad, { height }]} {...pan.panHandlers}>
        <Svg width="100%" height="100%">
          {paths.map((d, i) => (
            <Path key={i} d={d} stroke={colors.ink} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {live ? <Path d={live} stroke={colors.ink} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
        </Svg>
        {paths.length === 0 && !live && <Text style={styles.hint}>✍️ Signez ici</Text>}
      </View>
      <Pressable onPress={clear} style={styles.clear}>
        <Text style={styles.clearText}>Effacer</Text>
      </Pressable>
    </View>
  );
}

/** Affiche une signature enregistrée (tracé SVG) en lecture seule. */
export function SignatureView({ d, height = 120 }: { d: string; height?: number }) {
  return (
    <View style={[styles.pad, { height }]}>
      <Svg width="100%" height="100%">
        <Path d={d} stroke={colors.ink} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  hint: { position: 'absolute', color: colors.inkMuted },
  clear: { alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 10 },
  clearText: { color: colors.brand600, fontWeight: '700' },
});
