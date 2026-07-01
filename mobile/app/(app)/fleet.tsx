import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Share, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth';
import { Card, Button, Badge, Field, Input, EmptyState, SectionTitle } from '@/components/ui';
import { subscribeOwnerVehicles, subscribeOwnerDrivers, addVehicle, setDriverVehicle } from '@/firebase/db';
import { VEHICLE_TYPES, vehicleByKey, type VehicleTypeKey } from '@/data/catalog';
import { colors, radius } from '@/theme';
import type { Driver, Vehicle } from '@/lib/types';

export default function Fleet() {
  const { user } = useAuth();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'GERANT') return;
    const u1 = subscribeOwnerVehicles(user.id, setVehicles);
    const u2 = subscribeOwnerDrivers(user.id, setDrivers);
    return () => { u1(); u2(); };
  }, [user?.id]);

  if (!user) return null;
  if (user.role !== 'GERANT') {
    return <View style={styles.center}><Text style={styles.muted}>Réservé au gérant.</Text></View>;
  }

  const freeCount = vehicles.filter((v) => v.available).length;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {/* Résumé flotte */}
      <View style={styles.statsRow}>
        <StatCell value={vehicles.length} label="Véhicules" fg={colors.brand600} />
        <StatCell value={freeCount} label="Disponibles" fg={colors.green} />
        <StatCell value={drivers.length} label="Chauffeurs" fg={colors.amber600} />
      </View>

      {/* Code entreprise */}
      <Card style={styles.codeCard}>
        <Text style={styles.codeLabel}>Code entreprise — à donner aux chauffeurs</Text>
        <Text style={styles.code}>{user.companyCode ?? '—'}</Text>
        <Text style={styles.muted}>Le chauffeur crée un compte « Chauffeur » et saisit ce code pour rejoindre votre flotte.</Text>
        {user.companyCode ? (
          <Button title="Partager le code" icon="share-social-outline" variant="outline" style={{ marginTop: 8 }}
            onPress={() => Share.share({ message: `Rejoignez ${user.companyName ?? 'ONE WAY'} sur l'app ONE WAY avec le code : ${user.companyCode}` })} />
        ) : null}
      </Card>

      {/* Véhicules */}
      <SectionTitle right={<Pressable onPress={() => setAdding((a) => !a)}><Text style={styles.add}>{adding ? 'Fermer' : '+ Ajouter'}</Text></Pressable>}>
        Véhicules ({vehicles.length})
      </SectionTitle>
      {adding && <AddVehicle ownerId={user.id} onDone={() => setAdding(false)} />}
      {vehicles.length === 0 && !adding ? (
        <EmptyState icon="car-outline" title="Aucun véhicule" description="Ajoutez vos camions pour les affecter aux courses." />
      ) : vehicles.map((v) => (
        <Card key={v.id} style={styles.vRow}>
          <Text style={{ fontSize: 26 }}>{vehicleByKey(v.type).emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.vName}>{v.name}</Text>
            <Text style={styles.muted}>{v.plate} · {(v.capacityKg / 1000).toLocaleString('fr-FR')} T</Text>
          </View>
          <Badge tone={v.available ? 'green' : 'amber'}>{v.available ? 'Libre' : 'Occupé'}</Badge>
        </Card>
      ))}

      {/* Chauffeurs */}
      <SectionTitle>Chauffeurs ({drivers.length})</SectionTitle>
      {drivers.length === 0 ? (
        <EmptyState icon="people-outline" title="Aucun chauffeur" description="Partagez votre code entreprise pour qu'ils rejoignent la flotte." />
      ) : drivers.map((d) => (
        <DriverRow key={d.id} driver={d} vehicles={vehicles} />
      ))}
    </ScrollView>
  );
}

function StatCell({ value, label, fg }: { value: number; label: string; fg: string }) {
  return (
    <Card style={styles.statCell}>
      <Text style={[styles.statValue, { color: fg }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

function AddVehicle({ ownerId, onDone }: { ownerId: string; onDone: () => void }) {
  const [type, setType] = useState<VehicleTypeKey>('CAMION_5T');
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [cap, setCap] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (name.trim().length < 2 || plate.trim().length < 2) return Alert.alert('Champs requis', 'Nom et immatriculation requis.');
    setLoading(true);
    try {
      await addVehicle(ownerId, { type, name: name.trim(), plate: plate.trim(), capacityKg: (Number(cap) || vehicleByKey(type).maxKg) });
      onDone();
    } catch (e: any) { Alert.alert('Erreur', e?.message ?? 'Ajout impossible'); } finally { setLoading(false); }
  }

  return (
    <Card style={{ padding: 14, marginBottom: 10 }}>
      <Field label="Type">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {VEHICLE_TYPES.map((v) => (
            <Pressable key={v.key} onPress={() => setType(v.key)} style={[styles.chip, type === v.key && styles.chipOn]}>
              <Text style={[styles.chipText, type === v.key && { color: '#fff' }]}>{v.emoji} {v.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Field>
      <Field label="Nom"><Input value={name} onChangeText={setName} placeholder="Isuzu NQR" /></Field>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><Field label="Immatriculation"><Input value={plate} onChangeText={setPlate} placeholder="1234 TBB" /></Field></View>
        <View style={{ flex: 1 }}><Field label="Capacité (kg)"><Input value={cap} onChangeText={setCap} keyboardType="numeric" placeholder="5000" /></Field></View>
      </View>
      <Button title="Ajouter le véhicule" icon="add" onPress={submit} loading={loading} />
    </Card>
  );
}

function DriverRow({ driver, vehicles }: { driver: Driver; vehicles: Vehicle[] }) {
  const current = vehicles.find((v) => v.id === driver.vehicleId);
  return (
    <Card style={{ padding: 14, marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={styles.vName}>{driver.name}</Text>
        <Badge tone={driver.status === 'DISPONIBLE' ? 'green' : driver.status === 'EN_MISSION' ? 'amber' : 'slate'}>
          {driver.status === 'DISPONIBLE' ? 'Disponible' : driver.status === 'EN_MISSION' ? 'En mission' : 'Hors ligne'}
        </Badge>
      </View>
      {driver.phone ? <Text style={styles.muted}>{driver.phone}</Text> : null}
      <Text style={[styles.muted, { marginTop: 8, fontWeight: '700' }]}>Véhicule : {current ? `${current.name} · ${current.plate}` : 'aucun'}</Text>
      {vehicles.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 8 }}>
          {vehicles.map((v) => (
            <Pressable key={v.id} onPress={() => setDriverVehicle(driver.id, v.id === driver.vehicleId ? null : v.id)} style={[styles.chip, v.id === driver.vehicleId && styles.chipOn]}>
              <Text style={[styles.chipText, v.id === driver.vehicleId && { color: '#fff' }]}>{vehicleByKey(v.type).emoji} {v.plate}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.inkMuted, fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCell: { flex: 1, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: 11, color: colors.inkMuted, fontWeight: '600', marginTop: 2 },
  codeCard: { padding: 16, alignItems: 'center', borderColor: colors.brand100, marginBottom: 6 },
  codeLabel: { color: colors.inkMuted, fontSize: 12, fontWeight: '600' },
  code: { fontSize: 30, fontWeight: '900', color: colors.brand700, letterSpacing: 4, marginVertical: 6 },
  add: { color: colors.brand600, fontWeight: '700' },
  vRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, marginBottom: 8 },
  vName: { fontWeight: '800', color: colors.ink, fontSize: 15 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  chipOn: { backgroundColor: colors.brand600, borderColor: colors.brand600 },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.inkSoft },
});
