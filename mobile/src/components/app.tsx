import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Badge, Avatar } from './ui';
import { LogoMark } from './Logo';
import { FREIGHT_STATUS, SHIPMENT_STATUS, URGENCY } from '@/lib/labels';
import { money, km } from '@/lib/format';
import { vehicleByKey, cargoByKey } from '@/data/catalog';
import { colors, radius } from '@/theme';
import type { Freight, Shipment } from '@/lib/types';

export function AppHeader({ name, color, unread }: { name: string; color: string; unread: number }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <LogoMark size={30} />
      <Text style={styles.brand}>ONE<Text style={{ color: colors.amber500 }}> WAY</Text></Text>
      <View style={{ flex: 1 }} />
      <Pressable onPress={() => router.push('/(app)/notifications')} style={styles.bell}>
        <Ionicons name="notifications-outline" size={22} color={colors.inkSoft} />
        {unread > 0 && <View style={styles.dot}><Text style={styles.dotText}>{unread}</Text></View>}
      </Pressable>
      <Pressable onPress={() => router.push('/(app)/profile')}>
        <Avatar name={name} color={color} size={34} />
      </Pressable>
    </View>
  );
}

export function RouteLine({ from, to }: { from: string; to: string }) {
  return (
    <View style={styles.routeLine}>
      <View style={[styles.rdot, { backgroundColor: colors.green }]} />
      <Text style={styles.routeCity} numberOfLines={1}>{from}</Text>
      <Ionicons name="arrow-forward" size={13} color={colors.inkMuted} />
      <View style={[styles.rdot, { backgroundColor: colors.red }]} />
      <Text style={styles.routeCity} numberOfLines={1}>{to}</Text>
    </View>
  );
}

export function FreightCard({ freight, onPress, bidsCount, right }: { freight: Freight; onPress: () => void; bidsCount?: number; right?: React.ReactNode }) {
  const v = vehicleByKey(freight.vehicleType);
  const c = cargoByKey(freight.cargoType);
  const st = FREIGHT_STATUS[freight.status];
  return (
    <Pressable onPress={onPress}>
      <Card style={{ padding: 14, marginBottom: 10 }}>
        <View style={styles.row}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.ref}>{freight.reference}</Text>
            <Badge tone={URGENCY[freight.urgency].tone}>{URGENCY[freight.urgency].label}</Badge>
          </View>
          <Badge tone={st.tone}>{st.label}</Badge>
        </View>
        <Text style={styles.title} numberOfLines={1}>{freight.title}</Text>
        <View style={{ marginTop: 8 }}><RouteLine from={freight.pickup.city} to={freight.delivery.city} /></View>
        <View style={styles.metaRow}>
          <Meta icon="navigate-outline" text={km(freight.distanceKm)} />
          <Meta icon="scale-outline" text={`${(freight.weightKg / 1000).toLocaleString('fr-FR')} t`} />
          <Text style={styles.meta}>{v.emoji} {v.label}</Text>
        </View>
        <View style={styles.footer}>
          <View>
            <Text style={styles.muted}>{freight.pricingMode === 'AUCTION' ? 'Enchère · à partir de' : 'Prix fixe'}</Text>
            <Text style={styles.price}>{money(freight.budget)}</Text>
          </View>
          {bidsCount != null ? <Badge tone={bidsCount > 0 ? 'blue' : 'slate'}>{bidsCount} offre{bidsCount > 1 ? 's' : ''}</Badge> : right}
        </View>
      </Card>
    </Pressable>
  );
}

export function ShipmentCard({ shipment, freight, onPress, subtitle }: { shipment: Shipment; freight: Freight; onPress: () => void; subtitle?: string }) {
  const st = SHIPMENT_STATUS[shipment.status];
  return (
    <Pressable onPress={onPress}>
      <Card style={{ padding: 14, marginBottom: 10 }}>
        <View style={styles.row}>
          <Text style={styles.ref}>{shipment.reference}</Text>
          <Badge tone={st.tone}>{st.label}</Badge>
        </View>
        <Text style={styles.title} numberOfLines={1}>{freight.title}</Text>
        <View style={{ marginTop: 8 }}><RouteLine from={freight.pickup.city} to={freight.delivery.city} /></View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(shipment.progress * 100)}%` }]} />
        </View>
        <View style={[styles.row, { marginTop: 6 }]}>
          <Text style={styles.muted}>{subtitle ?? `Code · ${shipment.trackingCode}`}</Text>
          <Text style={{ fontWeight: '700', color: colors.ink }}>{money(shipment.price)}</Text>
        </View>
      </Card>
    </Pressable>
  );
}

function Meta({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Ionicons name={icon} size={13} color={colors.inkMuted} />
      <Text style={styles.meta}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  brand: { fontSize: 18, fontWeight: '900', color: colors.ink },
  bell: { padding: 6 },
  dot: { position: 'absolute', top: 0, right: 0, backgroundColor: colors.red, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  dotText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ref: { fontSize: 12, fontWeight: '800', color: colors.brand600 },
  title: { fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: 4 },
  routeLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rdot: { width: 8, height: 8, borderRadius: 4 },
  routeCity: { fontWeight: '700', color: colors.ink, fontSize: 13, maxWidth: 110 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  meta: { fontSize: 12, color: colors.inkMuted },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, borderTopWidth: 1, borderTopColor: colors.slateBg, paddingTop: 10 },
  muted: { fontSize: 12, color: colors.inkMuted },
  price: { fontSize: 17, fontWeight: '800', color: colors.ink },
  progressTrack: { height: 6, backgroundColor: colors.slateBg, borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.amber500, borderRadius: 3 },
});
