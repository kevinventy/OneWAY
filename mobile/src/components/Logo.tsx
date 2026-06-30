import React from 'react';
import { View, Text, Image } from 'react-native';
import { colors } from '@/theme';

/** Emblème officiel ONE WAY (anneau + route en perspective + flèche orange). */
const EMBLEM = require('../../assets/OneWay_embleme.png');

/**
 * Marque ONE WAY (emblème seul, sans le texte).
 * `badge` : pastille blanche derrière l'emblème (lisibilité sur fond foncé,
 * car l'emblème contient des éléments bleu marine).
 */
export function LogoMark({ size = 32, badge = false }: { size?: number; badge?: boolean }) {
  if (badge) {
    const pad = Math.round(size * 0.14);
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.white,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image source={EMBLEM} style={{ width: size - pad * 2, height: size - pad * 2 }} resizeMode="contain" />
      </View>
    );
  }
  return <Image source={EMBLEM} style={{ width: size, height: size }} resizeMode="contain" />;
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
