import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button, Badge, Input } from '@/components/ui';
import { LogoMark } from '@/components/Logo';
import { RouteMap } from '@/components/RouteMap';
import { subscribePublicTracking } from '@/firebase/db';
import { COURSE_STATUS } from '@/lib/labels';
import { km, duration, dateTimeFr } from '@/lib/format';
import { colors, radius } from '@/theme';
import type { PublicTracking } from '@/lib/types';

export default function Track() {
  const params = useLocalSearchParams<{ code?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState((params.code ?? '').toUpperCase());
  const [data, setData] = useState<PublicTracking | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!code) { setLoaded(true); return; }
    setLoaded(false);
    const unsub = subscribePublicTracking(code, (d) => { setData(d); setLoaded(true); });
    return () => unsub();
  }, [code]);

  const remainingH = data ? Math.max(0, data.durationH * (1 - data.progress)) : 0;

  return (
    <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]} style={{ backgroundColor: colors.bg }}>
      <View style={styles.top}>
        <Pressable onPress={() => router.replace('/welcome')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <LogoMark size={26} />
          <Text style={styles.brand}>ONE WAY</Text>
        </Pressable>
      </View>

      {/* Recherche */}
      <Card style={{ padding: 14 }}>
        <Text style={styles.h}>📦 Suivre une livraison</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <Input value={input} onChangeText={(t) => setInput(t.toUpperCase())} autoCapitalize="characters" placeholder="Code (ex. OWTOA01)" style={{ flex: 1 }} />
          <Button title="" icon="search" onPress={() => input.trim() && setCode(input.trim())} style={{ paddingHorizontal: 18 }} />
        </View>
      </Card>

      {code && loaded && !data && (
        <Card style={styles.notFound}>
          <Ionicons name="search" size={32} color={colors.red} />
          <Text style={styles.nfTitle}>Code introuvable</Text>
          <Text style={styles.muted}>Le code « {code} » ne correspond à aucune livraison.</Text>
        </Card>
      )}

      {data && (
        <>
          <View style={styles.headRow}>
            <View>
              <Text style={styles.muted}>Course {data.reference}</Text>
              <Text style={styles.codeBig}>{data.code}</Text>
            </View>
            <Badge tone={COURSE_STATUS[data.status].tone}>{data.statusLabel}</Badge>
          </View>

          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.round(data.progress * 100)}%` }]} /></View>
          <View style={styles.cityRow}><Text style={styles.muted}>{data.pickup.city}</Text><Text style={styles.muted}>{data.delivery.city}</Text></View>

          <RouteMap
            height={250}
            route={data.routeGeometry}
            from={{ lat: data.pickup.lat, lng: data.pickup.lng, label: data.pickup.city }}
            to={{ lat: data.delivery.lat, lng: data.delivery.lng, label: data.delivery.city }}
            current={data.current}
            progress={data.progress}
            kmRemaining={data.kmRemaining}
          />

          <View style={styles.metrics}>
            <Metric label="Km restants" value={data.delivered ? '0 km' : km(data.kmRemaining)} highlight />
            <Metric label="Distance" value={km(data.distanceKm)} />
            <Metric label={data.delivered ? 'Livrée' : 'Temps restant'} value={data.delivered ? '✓' : `~${duration(remainingH)}`} />
          </View>

          <Card style={{ padding: 14 }}>
            <Row icon="cube-outline" label="Marchandise" value={`${data.cargoLabel} · ${data.weightKg.toLocaleString('fr-FR')} kg`} />
            <Row icon="car-outline" label="Véhicule" value={data.vehicleLabel} />
            <Row icon="business-outline" label="Transporteur" value={data.company} last />
          </Card>

          {data.contactPhone && !data.cancelled && (
            <Button title={`Appeler le transporteur${data.driverName ? ` (${data.driverName})` : ''}`} icon="call" onPress={() => Linking.openURL(`tel:${data.contactPhone}`)} />
          )}

          {data.timeline.length > 0 && (
            <Card style={{ padding: 14 }}>
              <Text style={styles.h}>Historique</Text>
              {[...data.timeline].reverse().map((e, i) => (
                <View key={i} style={styles.evRow}>
                  <View style={styles.evDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.evLabel}>{e.label}</Text>
                    <Text style={styles.muted}>{dateTimeFr(e.at)}</Text>
                  </View>
                </View>
              ))}
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card style={{ flex: 1, padding: 12, alignItems: 'center' }}>
      <Text style={styles.mLabel}>{label}</Text>
      <Text style={[styles.mValue, highlight && { color: colors.brand700 }]}>{value}</Text>
    </Card>
  );
}

function Row({ icon, label, value, last }: { icon: any; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Ionicons name={icon} size={18} color={colors.inkMuted} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  top: { marginBottom: 2 },
  brand: { fontWeight: '900', color: colors.ink, fontSize: 16 },
  h: { fontSize: 14, fontWeight: '800', color: colors.ink },
  muted: { color: colors.inkMuted, fontSize: 13 },
  notFound: { padding: 24, alignItems: 'center', gap: 6 },
  nfTitle: { fontWeight: '800', color: colors.ink, fontSize: 16 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  codeBig: { fontSize: 22, fontWeight: '900', color: colors.ink, letterSpacing: 2 },
  progressTrack: { height: 8, backgroundColor: colors.slateBg, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.brand500, borderRadius: 4 },
  cityRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 },
  metrics: { flexDirection: 'row', gap: 10 },
  mLabel: { fontSize: 11, color: colors.inkMuted },
  mValue: { fontSize: 16, fontWeight: '800', color: colors.ink, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.slateBg },
  rowLabel: { fontSize: 13, color: colors.inkMuted, width: 96 },
  rowValue: { fontSize: 14, fontWeight: '700', color: colors.ink, flex: 1, textAlign: 'right' },
  evRow: { flexDirection: 'row', gap: 10, paddingVertical: 6, marginTop: 4 },
  evDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.brand500, marginTop: 5 },
  evLabel: { fontWeight: '600', color: colors.ink },
});
