import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth';
import { Card, Button, Badge, Avatar, SectionTitle } from '@/components/ui';
import { RouteMap } from '@/components/RouteMap';
import { RouteLine } from '@/components/app';
import { subscribeDoc, getDrivers, assignToDriver } from '@/firebase/db';
import { money, km } from '@/lib/format';
import { vehicleByKey, VEHICLE_TYPES } from '@/data/catalog';
import { colors } from '@/theme';
import type { Driver, Freight } from '@/lib/types';

export default function Assign() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [freight, setFreight] = useState<Freight | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const u = subscribeDoc<Freight>('freights', id, setFreight);
    getDrivers().then(setDrivers);
    return () => u();
  }, [id]);

  if (!user || user.role !== 'ADMIN') return null;
  if (!freight) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  async function assign(driver: Driver) {
    if (!freight) return;
    setLoadingId(driver.id);
    try {
      const s = await assignToDriver(freight, driver);
      router.replace(`/(app)/tracking/${s.id}`);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Assignation impossible');
      setLoadingId(null);
    }
  }

  const v = vehicleByKey(freight.vehicleType);
  const available = drivers.filter((d) => d.status === 'AVAILABLE');
  const busy = drivers.filter((d) => d.status !== 'AVAILABLE');

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.ref}>{freight.reference}</Text>
      <Text style={styles.title}>{freight.title}</Text>

      <RouteMap from={{ ...freight.pickup, label: freight.pickup.city }} to={{ ...freight.delivery, label: freight.delivery.city }} height={170} />

      <Card style={{ padding: 14, marginTop: 12 }}>
        <RouteLine from={freight.pickup.city} to={freight.delivery.city} />
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{v.emoji} {v.label}</Text>
          <Text style={styles.meta}>{km(freight.distanceKm)}</Text>
          <Text style={styles.meta}>{(freight.weightKg / 1000).toLocaleString('fr-FR')} t</Text>
          <Text style={[styles.meta, { fontWeight: '800', color: colors.ink }]}>{money(freight.budget)}</Text>
        </View>
      </Card>

      <SectionTitle>Choisir un chauffeur</SectionTitle>
      {drivers.length === 0 && (
        <Card style={{ padding: 14 }}><Text style={styles.muted}>Aucun chauffeur enregistré. Ajoutez-en (seed FIREBASE_SETUP.md ou console Firebase, collection « drivers »).</Text></Card>
      )}

      {available.map((d) => (
        <DriverPick key={d.id} driver={d} loading={loadingId === d.id} disabled={loadingId !== null} onAssign={() => assign(d)} />
      ))}
      {busy.length > 0 && <Text style={styles.busyLabel}>Occupés</Text>}
      {busy.map((d) => (
        <DriverPick key={d.id} driver={d} loading={loadingId === d.id} disabled={loadingId !== null} onAssign={() => assign(d)} />
      ))}
    </ScrollView>
  );
}

function DriverPick({ driver, loading, disabled, onAssign }: { driver: Driver; loading: boolean; disabled: boolean; onAssign: () => void }) {
  const vlabel = driver.vehicleId ? '🚚' : '';
  return (
    <Card style={styles.driverCard}>
      <Avatar name={driver.name} size={40} />
      <View style={{ flex: 1 }}>
        <Text style={styles.driverName}>{driver.name} {vlabel}</Text>
        <Text style={styles.muted}>Permis {driver.licenseNumber}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <Badge tone={driver.status === 'AVAILABLE' ? 'green' : 'amber'}>{driver.status === 'AVAILABLE' ? 'Dispo' : 'En mission'}</Badge>
        <Button title="Assigner" icon="arrow-forward" onPress={onAssign} loading={loading} disabled={disabled} style={{ paddingVertical: 8, paddingHorizontal: 12 }} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  ref: { fontSize: 13, fontWeight: '800', color: colors.brand600 },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink, marginTop: 4, marginBottom: 12 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 10 },
  meta: { fontSize: 13, color: colors.inkMuted },
  muted: { color: colors.inkMuted, fontSize: 13 },
  driverCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, marginBottom: 10 },
  driverName: { fontWeight: '700', color: colors.ink, fontSize: 15 },
  busyLabel: { color: colors.inkMuted, fontWeight: '700', fontSize: 12, textTransform: 'uppercase', marginTop: 8, marginBottom: 8, letterSpacing: 0.5 },
});
