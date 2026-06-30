import { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/store/auth';
import { Button, Card, Field, Input } from '@/components/ui';
import { createCourse, markQuoteHandled } from '@/firebase/db';
import { CITIES, buildCourseRoute } from '@/lib/geo';
import { quickEstimate } from '@/lib/pricing';
import { CARGO_TYPES, VEHICLE_TYPES, suggestVehicle, cargoByKey, type CargoTypeKey, type VehicleTypeKey } from '@/data/catalog';
import { money, km, duration } from '@/lib/format';
import { colors, radius } from '@/theme';

const cityByName = (n: string) => CITIES.find((c) => c.name === n);
const knownCity = (n?: string) => (n && cityByName(n) ? n : undefined);
const knownCargo = (k?: string): CargoTypeKey | undefined => (k && CARGO_TYPES.some((c) => c.key === k) ? (k as CargoTypeKey) : undefined);

export default function NewCourse() {
  const router = useRouter();
  const { user } = useAuth();
  // Pré-remplissage depuis une demande de devis (gérant).
  const p = useLocalSearchParams<{ clientName?: string; clientPhone?: string; fromCity?: string; toCity?: string; cargoType?: string; weight?: string; description?: string; requestId?: string }>();
  const [f, setF] = useState({
    clientName: p.clientName ?? '', clientPhone: p.clientPhone ?? '', fromCity: knownCity(p.fromCity) ?? 'Antananarivo', fromAddr: '',
    toCity: knownCity(p.toCity) ?? 'Toamasina', toAddr: '', cargoType: knownCargo(p.cargoType) ?? ('GENERAL' as CargoTypeKey),
    description: p.description ?? '', weight: p.weight ?? '', vehicleType: 'CAMION_3T' as VehicleTypeKey, autoVehicle: true,
  });
  const set = (k: keyof typeof f) => (v: any) => setF((s) => ({ ...s, [k]: v }));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const weight = Number(f.weight) || 0;
  const vehicleType = f.autoVehicle && weight > 0 ? suggestVehicle(weight).key : f.vehicleType;

  const preview = useMemo(() => {
    const from = cityByName(f.fromCity);
    const to = cityByName(f.toCity);
    if (!from || !to || from.name === to.name) return null;
    const route = buildCourseRoute(from.name, from, to.name, to);
    return { ...route, price: quickEstimate(route.distanceKm, vehicleType, f.cargoType) };
  }, [f.fromCity, f.toCity, vehicleType, f.cargoType]);

  async function submit() {
    setError('');
    const from = cityByName(f.fromCity);
    const to = cityByName(f.toCity);
    if (!from || !to) return setError('Choisissez le départ et l’arrivée.');
    if (from.name === to.name) return setError('Le départ et l’arrivée doivent être différents.');
    if (f.clientName.trim().length < 2) return setError('Nom du client requis.');
    if (f.clientPhone.trim().length < 6) return setError('Téléphone du client requis.');
    if (weight <= 0) return setError('Indiquez le poids de la marchandise.');
    if (f.description.trim().length < 2) return setError('Décrivez la marchandise.');
    if (!user) return;
    setLoading(true);
    try {
      const course = await createCourse(user, {
        client: { name: f.clientName.trim(), phone: f.clientPhone.trim() },
        cargoType: f.cargoType,
        cargoDescription: f.description.trim(),
        weightKg: weight,
        vehicleType,
        pickup: { address: f.fromAddr.trim() || from.name, city: from.name, lat: from.lat, lng: from.lng },
        delivery: { address: f.toAddr.trim() || to.name, city: to.name, lat: to.lat, lng: to.lng },
      });
      if (p.requestId) await markQuoteHandled(p.requestId).catch(() => {});
      router.replace(`/(app)/course/${course.id}`);
    } catch (e: any) {
      setError(e?.message ?? 'Création impossible.');
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <Text style={styles.h}>Client</Text>
          <Field label="Nom du client"><Input value={f.clientName} onChangeText={set('clientName')} placeholder="Société ABC" /></Field>
          <Field label="Téléphone"><Input value={f.clientPhone} onChangeText={set('clientPhone')} keyboardType="phone-pad" placeholder="+261 34 …" /></Field>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.h}>Trajet</Text>
          <Field label="Ville de départ"><Chips items={CITIES.map((c) => c.name)} value={f.fromCity} onSelect={set('fromCity')} /></Field>
          <Field label="Adresse de chargement"><Input value={f.fromAddr} onChangeText={set('fromAddr')} placeholder="Quartier, repère" /></Field>
          <Field label="Ville d’arrivée"><Chips items={CITIES.map((c) => c.name)} value={f.toCity} onSelect={set('toCity')} /></Field>
          <Field label="Adresse de livraison"><Input value={f.toAddr} onChangeText={set('toAddr')} placeholder="Quartier, repère" /></Field>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.h}>Marchandise</Text>
          <Field label="Type"><Chips items={CARGO_TYPES.map((c) => c.key)} labels={CARGO_TYPES.map((c) => `${c.emoji} ${c.label}`)} value={f.cargoType} onSelect={set('cargoType')} /></Field>
          <Field label="Poids (kg)"><Input value={f.weight} onChangeText={set('weight')} keyboardType="numeric" placeholder="4200" /></Field>
          <Field label="Description"><Input value={f.description} onChangeText={set('description')} placeholder="12 palettes, sacs de ciment…" /></Field>
          <Pressable onPress={() => set('autoVehicle')(!f.autoVehicle)} style={styles.checkRow}>
            <Text style={[styles.check, f.autoVehicle && styles.checkOn]}>{f.autoVehicle ? '☑' : '☐'}</Text>
            <Text style={styles.muted}>Choisir le véhicule automatiquement selon le poids</Text>
          </Pressable>
          {!f.autoVehicle && (
            <Field label="Véhicule"><Chips items={VEHICLE_TYPES.map((v) => v.key)} labels={VEHICLE_TYPES.map((v) => `${v.emoji} ${v.label}`)} value={f.vehicleType} onSelect={set('vehicleType')} /></Field>
          )}
        </Card>

        {preview && (
          <Card style={[styles.card, { borderColor: colors.brand100 }]}>
            <Text style={[styles.h, { color: colors.brand700 }]}>Estimation automatique</Text>
            <View style={styles.estRow}>
              <Est label="Distance" value={km(preview.distanceKm)} />
              <Est label="Durée" value={duration(preview.durationH)} />
              <Est label="Prix" value={money(preview.price)} highlight />
            </View>
          </Card>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Créer la course & générer le code" icon="send" onPress={submit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Chips({ items, labels, value, onSelect }: { items: string[]; labels?: string[]; value: string; onSelect: (v: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
      {items.map((it, i) => {
        const active = it === value;
        return (
          <Pressable key={it} onPress={() => onSelect(it)} style={[styles.chip, active && styles.chipOn]}>
            <Text style={[styles.chipText, active && { color: '#fff' }]}>{labels ? labels[i] : it}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function Est({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={styles.estLabel}>{label}</Text>
      <Text style={[styles.estValue, highlight && { color: colors.brand700 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 14 },
  card: { padding: 14 },
  h: { fontSize: 14, fontWeight: '800', color: colors.ink, marginBottom: 10 },
  muted: { color: colors.inkMuted, fontSize: 13, flexShrink: 1 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  chipOn: { backgroundColor: colors.brand600, borderColor: colors.brand600 },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.inkSoft },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  check: { fontSize: 18, color: colors.inkMuted },
  checkOn: { color: colors.brand600 },
  estRow: { flexDirection: 'row', gap: 8 },
  estLabel: { fontSize: 11, color: colors.inkMuted },
  estValue: { fontSize: 16, fontWeight: '800', color: colors.ink, marginTop: 2 },
  error: { color: colors.red },
});
