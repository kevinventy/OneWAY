import { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/auth';
import { Card, Button, Field, Input, SectionTitle } from '@/components/ui';
import { RouteMap } from '@/components/RouteMap';
import { CITIES, estimateRoute, findCity } from '@/lib/geo';
import { VEHICLE_TYPES, CARGO_TYPES, suggestVehicle, type VehicleTypeKey, type CargoTypeKey } from '@/data/catalog';
import { computeQuote } from '@/lib/pricing';
import { money, km } from '@/lib/format';
import { createFreight } from '@/firebase/db';
import { colors, radius } from '@/theme';

export default function NewFreight() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [cargoType, setCargoType] = useState<CargoTypeKey>('GENERAL');
  const [vehicleType, setVehicleType] = useState<VehicleTypeKey>('CAMION_3T');
  const [weightKg, setWeightKg] = useState('1000');
  const [declaredValue, setDeclaredValue] = useState('5000000');
  const [fromCity, setFromCity] = useState('Antananarivo');
  const [toCity, setToCity] = useState('Toamasina');
  const [fromAddr, setFromAddr] = useState('');
  const [toAddr, setToAddr] = useState('');
  const [pricingMode, setPricingMode] = useState<'FIXED' | 'AUCTION'>('FIXED');
  const [insurance, setInsurance] = useState(true);
  const [budget, setBudget] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const route = useMemo(() => estimateRoute(fromCity, toCity), [fromCity, toCity]);
  const quote = useMemo(
    () => computeQuote({ distanceKm: route.distanceKm, vehicleType, cargoType, weightKg: Number(weightKg) || 0, declaredValue: Number(declaredValue) || 0, handlingPickup: true, handlingDelivery: true, insurance, vat: false }),
    [route.distanceKm, vehicleType, cargoType, weightKg, declaredValue, insurance],
  );
  const effBudget = Number(budget) || quote.totalTTC;
  const suggested = suggestVehicle(Number(weightKg) || 0);

  async function submit() {
    setError('');
    if (title.trim().length < 4) return setError('Donnez un titre à votre annonce.');
    if (!user) return;
    setLoading(true);
    try {
      const from = findCity(fromCity) ?? CITIES[0];
      const to = findCity(toCity) ?? CITIES[1];
      const f = await createFreight(user.id, {
        title, cargoType, weightKg: Number(weightKg) || 0, declaredValue: Number(declaredValue) || 0,
        pickup: { address: fromAddr || from.name, city: from.name, lat: from.lat, lng: from.lng },
        delivery: { address: toAddr || to.name, city: to.name, lat: to.lat, lng: to.lng },
        pickupDate: Date.now() + 2 * 86400000, urgency: 'STANDARD', pricingMode, vehicleType,
        insurance, budget: effBudget,
      });
      router.replace(`/(app)/freight/${f.id}`);
    } catch (e: any) {
      setError(e?.message ?? 'Publication impossible');
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <RouteMap from={{ ...(route.from ?? CITIES[0]), label: fromCity }} to={{ ...(route.to ?? CITIES[1]), label: toCity }} height={180} />

      <Card style={{ padding: 14, marginTop: 14 }}>
        <SectionTitle>Marchandise</SectionTitle>
        <Field label="Titre de l'annonce"><Input value={title} onChangeText={setTitle} placeholder="Ex : Palettes marchandises générales" /></Field>
        <Field label="Type de marchandise">
          <ChipRow items={CARGO_TYPES.map((c) => ({ key: c.key, label: `${c.emoji} ${c.label}` }))} value={cargoType} onChange={(k) => setCargoType(k as CargoTypeKey)} />
        </Field>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="Poids (kg)"><Input value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" /></Field></View>
          <View style={{ flex: 1 }}><Field label="Valeur déclarée (Ar)"><Input value={declaredValue} onChangeText={setDeclaredValue} keyboardType="numeric" /></Field></View>
        </View>
      </Card>

      <Card style={{ padding: 14, marginTop: 12 }}>
        <SectionTitle>Itinéraire</SectionTitle>
        <Field label="Ville de chargement"><Input value={fromCity} onChangeText={setFromCity} /></Field>
        <CityChips onPick={setFromCity} />
        <Field label="Adresse de chargement"><Input value={fromAddr} onChangeText={setFromAddr} placeholder="Quartier, repère" /></Field>
        <Field label="Ville de livraison"><Input value={toCity} onChangeText={setToCity} /></Field>
        <CityChips onPick={setToCity} />
        <Field label="Adresse de livraison"><Input value={toAddr} onChangeText={setToAddr} placeholder="Quartier, repère" /></Field>
        <View style={styles.infoRow}><Text style={styles.infoLabel}>Distance estimée</Text><Text style={styles.infoVal}>{km(route.distanceKm)} · {route.durationH ? `${route.durationH} h` : '—'}</Text></View>
      </Card>

      <Card style={{ padding: 14, marginTop: 12 }}>
        <SectionTitle>Véhicule & prix</SectionTitle>
        <Field label="Véhicule requis">
          <ChipRow items={VEHICLE_TYPES.map((v) => ({ key: v.key, label: `${v.emoji} ${v.label}` }))} value={vehicleType} onChange={(k) => setVehicleType(k as VehicleTypeKey)} />
        </Field>
        {suggested.key !== vehicleType && (
          <Pressable onPress={() => setVehicleType(suggested.key)}><Text style={styles.link}>💡 Suggéré pour ce poids : {suggested.label}</Text></Pressable>
        )}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          {(['FIXED', 'AUCTION'] as const).map((m) => (
            <Pressable key={m} onPress={() => setPricingMode(m)} style={[styles.modeBtn, pricingMode === m && styles.modeActive]}>
              <Text style={[styles.modeText, pricingMode === m && { color: colors.brand700 }]}>{m === 'FIXED' ? '💰 Prix fixe' : '⚖️ Enchères'}</Text>
            </Pressable>
          ))}
        </View>
        <Field label={pricingMode === 'AUCTION' ? 'Budget de départ (Ar)' : 'Prix proposé (Ar)'}>
          <Input value={budget || String(effBudget)} onChangeText={setBudget} keyboardType="numeric" />
        </Field>
        <Text style={styles.muted}>Estimation ONE WAY : {money(quote.totalTTC)} ({money(quote.pricePerKm)}/km)</Text>
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Publier le fret" icon="cloud-upload" onPress={submit} loading={loading} style={{ marginTop: 14 }} />
    </ScrollView>
  );
}

function ChipRow({ items, value, onChange }: { items: { key: string; label: string }[]; value: string; onChange: (k: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
      {items.map((it) => (
        <Pressable key={it.key} onPress={() => onChange(it.key)} style={[styles.chip, value === it.key && styles.chipActive]}>
          <Text style={[styles.chipText, value === it.key && { color: colors.brand700 }]}>{it.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function CityChips({ onPick }: { onPick: (c: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 12 }}>
      {CITIES.map((c) => (
        <Pressable key={c.name} onPress={() => onPick(c.name)} style={styles.cityChip}><Text style={styles.cityChipText}>{c.name}</Text></Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.brand50, borderRadius: radius.md, padding: 10, marginTop: 4 },
  infoLabel: { color: colors.brand700 },
  infoVal: { color: colors.brand700, fontWeight: '800' },
  muted: { color: colors.inkMuted, fontSize: 12, marginTop: 4 },
  link: { color: colors.brand600, fontWeight: '600', marginTop: 4 },
  error: { color: colors.red, marginTop: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  chipActive: { borderColor: colors.brand500, backgroundColor: colors.brand50 },
  chipText: { color: colors.inkMuted, fontWeight: '600', fontSize: 13 },
  cityChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.slateBg },
  cityChipText: { color: colors.inkSoft, fontSize: 12, fontWeight: '600' },
  modeBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.white },
  modeActive: { borderColor: colors.brand500, backgroundColor: colors.brand50 },
  modeText: { fontWeight: '700', color: colors.inkMuted },
});
