import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/auth';
import { AppHeader, FreightCard, ShipmentCard } from '@/components/app';
import { Button, EmptyState, SectionTitle, Stat, Badge, Avatar, Card } from '@/components/ui';
import {
  subscribeOpenFreights,
  subscribeShipperFreights,
  subscribeShipperShipments,
  subscribeCarrierShipments,
  subscribeDriverShipments,
  subscribeAllShipments,
  subscribeAllFreights,
  subscribeDrivers,
  subscribeBids,
  subscribeNotifications,
  getDriverByUser,
  getFreight,
  acceptMission,
  refuseMission,
} from '@/firebase/db';
import { money, quickEstimateLabel } from '@/lib/uihelpers';
import { moneyCompact } from '@/lib/format';
import { SHIPMENT_STATUS } from '@/lib/labels';
import { colors } from '@/theme';
import type { Bid, Driver, Freight, Shipment } from '@/lib/types';

export default function Home() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    return subscribeNotifications(user.id, (rows) => setUnread(rows.filter((n) => !n.read).length));
  }, [user?.id]);

  if (!user) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader name={user.name} color={user.avatarColor} unread={unread} />
      {user.role === 'SHIPPER' && <ShipperHome />}
      {user.role === 'CARRIER' && <CarrierHome />}
      {user.role === 'DRIVER' && <DriverHome />}
      {user.role === 'ADMIN' && <AdminHome />}
    </View>
  );
}

function ShipperHome() {
  const { user } = useAuth();
  const router = useRouter();
  const [freights, setFreights] = useState<Freight[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [freightById, setFreightById] = useState<Record<string, Freight>>({});

  useEffect(() => {
    if (!user) return;
    const u1 = subscribeShipperFreights(user.id, setFreights);
    const u2 = subscribeShipperShipments(user.id, setShipments);
    return () => { u1(); u2(); };
  }, [user?.id]);

  useEffect(() => {
    const map: Record<string, Freight> = {};
    freights.forEach((f) => (map[f.id] = f));
    const missing = shipments.map((s) => s.freightId).filter((id) => !map[id]);
    Promise.all(missing.map(getFreight)).then((res) => {
      res.forEach((f) => { if (f) map[f.id] = f; });
      setFreightById({ ...map });
    });
  }, [freights, shipments]);

  const active = shipments.filter((s) => !['DELIVERED', 'CANCELLED'].includes(s.status));
  const open = freights.filter((f) => f.status === 'PUBLISHED');
  const delivered = shipments.filter((s) => s.status === 'DELIVERED');

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.greetRow}>
        <View>
          <Text style={styles.greet}>Bonjour, {user!.name.split(' ')[0]} 👋</Text>
          <Text style={styles.muted}>{user!.companyName ?? 'Tableau de bord chargeur'}</Text>
        </View>
      </View>
      <Button title="Publier un fret" icon="add-circle" onPress={() => router.push('/(app)/new-freight')} />

      <View style={styles.statRow}>
        <Stat label="Ouvertes" value={open.length} />
        <Stat label="En cours" value={active.length} tone="amber" />
        <Stat label="Livrées" value={delivered.length} tone="green" />
      </View>

      {active.length > 0 && (
        <>
          <SectionTitle>Expéditions en cours</SectionTitle>
          {active.map((s) => freightById[s.freightId] && (
            <ShipmentCard key={s.id} shipment={s} freight={freightById[s.freightId]} onPress={() => router.push(`/(app)/tracking/${s.id}`)} />
          ))}
        </>
      )}

      <SectionTitle>Mes annonces</SectionTitle>
      {freights.length === 0 ? (
        <EmptyState icon="cube-outline" title="Aucune annonce" description="Publiez votre premier fret pour recevoir des offres." />
      ) : (
        freights.map((f) => <FreightCardWithBids key={f.id} freight={f} />)
      )}
    </ScrollView>
  );
}

function FreightCardWithBids({ freight }: { freight: Freight }) {
  const router = useRouter();
  const [bids, setBids] = useState<Bid[]>([]);
  useEffect(() => subscribeBids(freight.id, setBids), [freight.id]);
  const pending = bids.filter((b) => b.status === 'PENDING').length;
  return <FreightCard freight={freight} onPress={() => router.push(`/(app)/freight/${freight.id}`)} bidsCount={freight.status === 'PUBLISHED' ? pending : undefined} />;
}

function CarrierHome() {
  const { user } = useAuth();
  const router = useRouter();
  const [freights, setFreights] = useState<Freight[]>([]);
  const [missions, setMissions] = useState<Shipment[]>([]);
  const [freightById, setFreightById] = useState<Record<string, Freight>>({});

  useEffect(() => {
    if (!user) return;
    const u1 = subscribeOpenFreights(setFreights);
    const u2 = subscribeCarrierShipments(user.id, setMissions);
    return () => { u1(); u2(); };
  }, [user?.id]);

  useEffect(() => {
    const missing = missions.map((s) => s.freightId).filter((id) => !freightById[id]);
    if (!missing.length) return;
    Promise.all(missing.map(getFreight)).then((res) => {
      const map = { ...freightById };
      res.forEach((f) => { if (f) map[f.id] = f; });
      setFreightById(map);
    });
  }, [missions]);

  const active = missions.filter((s) => !['DELIVERED', 'CANCELLED'].includes(s.status));

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.greet}>Fret disponible</Text>
      <Text style={styles.muted}>Trouvez un chargement et proposez votre prix.</Text>

      <View style={styles.statRow}>
        <Stat label="Annonces" value={freights.length} />
        <Stat label="Missions actives" value={active.length} tone="amber" />
      </View>

      {active.length > 0 && (
        <>
          <SectionTitle>Mes missions en cours</SectionTitle>
          {active.map((s) => freightById[s.freightId] && (
            <ShipmentCard key={s.id} shipment={s} freight={freightById[s.freightId]} onPress={() => router.push(`/(app)/tracking/${s.id}`)} />
          ))}
        </>
      )}

      <SectionTitle>Annonces ouvertes</SectionTitle>
      {freights.length === 0 ? (
        <EmptyState icon="cube-outline" title="Aucun fret disponible" description="De nouvelles annonces arrivent en continu." />
      ) : (
        freights.map((f) => (
          <FreightCard key={f.id} freight={f} onPress={() => router.push(`/(app)/freight/${f.id}`)} right={<Text style={styles.est}>{quickEstimateLabel(f)}</Text>} />
        ))
      )}
    </ScrollView>
  );
}

function DriverHome() {
  const { user } = useAuth();
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [freightById, setFreightById] = useState<Record<string, Freight>>({});

  useEffect(() => {
    if (!user) return;
    let unsub: (() => void) | undefined;
    getDriverByUser(user.id).then((d) => {
      if (d) unsub = subscribeDriverShipments(d.id, setShipments);
    });
    return () => unsub?.();
  }, [user?.id]);

  useEffect(() => {
    const missing = shipments.map((s) => s.freightId).filter((id) => !freightById[id]);
    if (!missing.length) return;
    Promise.all(missing.map(getFreight)).then((res) => {
      const map = { ...freightById };
      res.forEach((f) => { if (f) map[f.id] = f; });
      setFreightById(map);
    });
  }, [shipments]);

  const active = shipments.filter((s) => !['DELIVERED', 'CANCELLED'].includes(s.status));

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.greet}>Bonjour, {user!.name.split(' ')[0]} 🧑‍✈️</Text>
      <Text style={styles.muted}>Vos missions de transport</Text>
      <SectionTitle>Missions en cours</SectionTitle>
      {active.length === 0 ? (
        <EmptyState icon="map-outline" title="Aucune mission active" description="L'admin vous affectera des courses ici." />
      ) : (
        active.map((s) => freightById[s.freightId] && (
          <DriverMissionItem key={s.id} shipment={s} freight={freightById[s.freightId]} driverUserId={user!.id} />
        ))
      )}
    </ScrollView>
  );
}

function AdminHome() {
  const router = useRouter();
  const [freights, setFreights] = useState<Freight[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    const u1 = subscribeAllFreights(setFreights);
    const u2 = subscribeAllShipments(setShipments);
    const u3 = subscribeDrivers(setDrivers);
    return () => { u1(); u2(); u3(); };
  }, []);

  const pending = freights.filter((f) => f.status === 'PUBLISHED');
  const active = shipments.filter((s) => !['DELIVERED', 'CANCELLED'].includes(s.status));
  const delivered = shipments.filter((s) => s.status === 'DELIVERED');
  const ca = shipments.filter((s) => s.status !== 'CANCELLED').reduce((sum, s) => sum + s.price, 0);
  const onTime = delivered.length; // proxy ponctualité (à affiner avec délais réels)
  const freightById: Record<string, Freight> = {};
  freights.forEach((f) => (freightById[f.id] = f));

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.greet}>Dispatch ONE WAY</Text>
      <Text style={styles.muted}>Assignez les courses et pilotez la flotte</Text>

      <View style={styles.statRow}>
        <Stat label="CA (Ar)" value={moneyCompact(ca)} tone="green" />
        <Stat label="Courses actives" value={active.length} tone="amber" />
      </View>
      <View style={styles.statRow}>
        <Stat label="À assigner" value={pending.length} tone="red" />
        <Stat label="Livrées" value={delivered.length} tone="blue" />
        <Stat label="Chauffeurs" value={drivers.length} />
      </View>

      <SectionTitle>Demandes à assigner ({pending.length})</SectionTitle>
      {pending.length === 0 ? (
        <EmptyState icon="checkmark-done-outline" title="Aucune demande en attente" description="Toutes les demandes clients sont assignées." />
      ) : (
        pending.map((f) => (
          <FreightCard key={f.id} freight={f} onPress={() => router.push(`/(app)/assign/${f.id}`)} right={<Badge tone="amber">Assigner →</Badge>} />
        ))
      )}

      <SectionTitle>Courses en cours ({active.length})</SectionTitle>
      {active.length === 0 ? (
        <Card style={{ padding: 14 }}><Text style={styles.muted}>Aucune course active.</Text></Card>
      ) : (
        active.map((s) => freightById[s.freightId] && (
          <ShipmentCard key={s.id} shipment={s} freight={freightById[s.freightId]} onPress={() => router.push(`/(app)/tracking/${s.id}`)} subtitle={s.accepted ? `Code · ${s.trackingCode}` : '⏳ En attente d’acceptation chauffeur'} />
        ))
      )}

      <SectionTitle>Flotte — chauffeurs ({drivers.length})</SectionTitle>
      {drivers.length === 0 ? (
        <Card style={{ padding: 14 }}><Text style={styles.muted}>Aucun chauffeur. Ajoutez-en via le seed (FIREBASE_SETUP.md) ou la console.</Text></Card>
      ) : (
        drivers.map((d) => (
          <Card key={d.id} style={styles.driverRow}>
            <Avatar name={d.name} size={36} />
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{d.name}</Text>
              <Text style={styles.muted}>Permis {d.licenseNumber}</Text>
            </View>
            <Badge tone={d.status === 'AVAILABLE' ? 'green' : d.status === 'ON_MISSION' ? 'amber' : 'slate'}>
              {d.status === 'AVAILABLE' ? 'Disponible' : d.status === 'ON_MISSION' ? 'En mission' : 'Hors ligne'}
            </Badge>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

function DriverMissionItem({ shipment, freight, driverUserId }: { shipment: Shipment; freight: Freight; driverUserId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<'accept' | 'refuse' | null>(null);
  const pending = !shipment.accepted;

  async function accept() {
    setLoading('accept');
    try { await acceptMission(shipment, driverUserId); router.push(`/(app)/tracking/${shipment.id}`); }
    finally { setLoading(null); }
  }
  async function refuse() {
    setLoading('refuse');
    try { await refuseMission(shipment, driverUserId); } finally { setLoading(null); }
  }

  return (
    <View>
      <ShipmentCard shipment={shipment} freight={freight} onPress={() => router.push(`/(app)/tracking/${shipment.id}`)} subtitle={pending ? '🆕 Nouvelle course — à accepter' : 'Appuyez pour piloter la mission'} />
      {pending && (
        <View style={{ flexDirection: 'row', gap: 10, marginTop: -2, marginBottom: 12 }}>
          <Button title="Refuser" variant="outline" icon="close" onPress={refuse} loading={loading === 'refuse'} style={{ flex: 1 }} />
          <Button title="Accepter" variant="accent" icon="checkmark" onPress={accept} loading={loading === 'accept'} style={{ flex: 1 }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 4 },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, marginBottom: 8 },
  driverName: { fontWeight: '700', color: colors.ink },
  greetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  greet: { fontSize: 22, fontWeight: '800', color: colors.ink },
  muted: { color: colors.inkMuted, marginBottom: 8 },
  statRow: { flexDirection: 'row', gap: 10, marginVertical: 14 },
  est: { fontSize: 12, fontWeight: '700', color: colors.brand700, backgroundColor: colors.brand50, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
});
