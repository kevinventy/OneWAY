import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth';
import { Button, Card, Field, Input } from '@/components/ui';
import { createCourse, markQuoteHandled, subscribeClientCoursesForOwner } from '@/firebase/db';
import { CITIES, buildCourseRoute } from '@/lib/geo';
import { fetchRoadRoute } from '@/lib/routing';
import { quickEstimate } from '@/lib/pricing';
import { countDelivered, LOYALTY } from '@/lib/loyalty';
import { CARGO_TYPES, VEHICLE_TYPES, suggestVehicle, cargoByKey, type CargoTypeKey, type VehicleTypeKey } from '@/data/catalog';
import { money, km } from '@/lib/format';
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
    fromLat: '', fromLng: '',
    toCity: knownCity(p.toCity) ?? 'Toamasina', toAddr: '', toLat: '', toLng: '', cargoType: knownCargo(p.cargoType) ?? ('GENERAL' as CargoTypeKey),
    description: p.description ?? '', weight: p.weight ?? '', vehicleType: 'CAMION_3T' as VehicleTypeKey, autoVehicle: true,
  });
  const set = (k: keyof typeof f) => (v: any) => setF((s) => ({ ...s, [k]: v }));

  // Coordonnées GPS saisies à la main (facultatif) : priment sur le centre-ville.
  const parseCoord = (s: string) => { const n = parseFloat((s || '').replace(',', '.')); return Number.isFinite(n) ? n : NaN; };
  const inMada = (lat: number, lng: number) => lat >= -26 && lat <= -11 && lng >= 43 && lng <= 51;
  const effPoint = (city: { lat: number; lng: number }, latS: string, lngS: string) => {
    const la = parseCoord(latS), ln = parseCoord(lngS);
    return !isNaN(la) && !isNaN(ln) && inMada(la, ln) ? { lat: la, lng: ln } : { lat: city.lat, lng: city.lng };
  };
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Prix modifiable : pré-rempli avec l'estimation, éditable par le gérant.
  const [priceInput, setPriceInput] = useState('');
  const [priceTouched, setPriceTouched] = useState(false);

  // Fidélité : livraisons déjà terminées pour ce client chez ce gérant.
  const [clientDelivered, setClientDelivered] = useState(0);
  useEffect(() => {
    const phone = f.clientPhone.trim();
    if (!user || user.role !== 'GERANT' || phone.length < 6) { setClientDelivered(0); return; }
    return subscribeClientCoursesForOwner(user.id, phone, (rows) => setClientDelivered(countDelivered(rows)));
  }, [f.clientPhone, user?.id]);

  const weight = Number(f.weight) || 0;
  const vehicleType = f.autoVehicle && weight > 0 ? suggestVehicle(weight).key : f.vehicleType;

  // Estimation instantanée (axes RN) pour un retour immédiat.
  const base = useMemo(() => {
    const from = cityByName(f.fromCity);
    const to = cityByName(f.toCity);
    if (!from || !to || from.name === to.name) return null;
    const fromPt = effPoint(from, f.fromLat, f.fromLng);
    const toPt = effPoint(to, f.toLat, f.toLng);
    return buildCourseRoute(from.name, fromPt, to.name, toPt);
  }, [f.fromCity, f.toCity, f.fromLat, f.fromLng, f.toLat, f.toLng]);

  // Affinage par routage routier réel (OSRM) — suit exactement les routes.
  const [roadKm, setRoadKm] = useState<number | null>(null);
  const [routing, setRouting] = useState(false);
  useEffect(() => {
    const from = cityByName(f.fromCity);
    const to = cityByName(f.toCity);
    if (!from || !to || from.name === to.name) { setRoadKm(null); return; }
    const fromPt = effPoint(from, f.fromLat, f.fromLng);
    const toPt = effPoint(to, f.toLat, f.toLng);
    setRoadKm(null);
    setRouting(true);
    let cancelled = false;
    const h = setTimeout(async () => {
      const r = await fetchRoadRoute(fromPt, toPt);
      if (!cancelled) { setRoadKm(r ? r.distanceKm : null); setRouting(false); }
    }, 500);
    return () => { cancelled = true; clearTimeout(h); };
  }, [f.fromCity, f.toCity, f.fromLat, f.fromLng, f.toLat, f.toLng]);

  const distanceKm = roadKm ?? base?.distanceKm ?? 0;
  const price = base ? quickEstimate(distanceKm, vehicleType, f.cargoType) : 0;

  // Client fidèle : au moins un palier de livraisons atteint.
  const loyal = clientDelivered >= LOYALTY.milestone;
  function applyLoyaltyDiscount() {
    setPriceTouched(true);
    setPriceInput(String(Math.round(price * (1 - LOYALTY.discountPct / 100))));
  }

  // Tant que le gérant n'a pas modifié le prix, il suit l'estimation automatique.
  useEffect(() => {
    if (!priceTouched && base) setPriceInput(String(price));
  }, [price, priceTouched, base]);

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
        pickup: { address: f.fromAddr.trim() || from.name, city: from.name, ...effPoint(from, f.fromLat, f.fromLng) },
        delivery: { address: f.toAddr.trim() || to.name, city: to.name, ...effPoint(to, f.toLat, f.toLng) },
        price: Number(priceInput.replace(/[^\d]/g, '')) || undefined,
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
          <Field label="Coordonnées GPS de chargement (facultatif)">
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Input value={f.fromLat} onChangeText={set('fromLat')} keyboardType="numbers-and-punctuation" placeholder="Latitude −18.8792" style={{ flex: 1 }} />
              <Input value={f.fromLng} onChangeText={set('fromLng')} keyboardType="numbers-and-punctuation" placeholder="Longitude 47.5079" style={{ flex: 1 }} />
            </View>
          </Field>
          <Field label="Ville d’arrivée"><Chips items={CITIES.map((c) => c.name)} value={f.toCity} onSelect={set('toCity')} /></Field>
          <Field label="Adresse de livraison"><Input value={f.toAddr} onChangeText={set('toAddr')} placeholder="Quartier, repère" /></Field>
          <Field label="Coordonnées GPS de livraison (facultatif)">
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Input value={f.toLat} onChangeText={set('toLat')} keyboardType="numbers-and-punctuation" placeholder="Latitude −18.1499" style={{ flex: 1 }} />
              <Input value={f.toLng} onChangeText={set('toLng')} keyboardType="numbers-and-punctuation" placeholder="Longitude 49.4023" style={{ flex: 1 }} />
            </View>
          </Field>
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

        {base && (
          <Card style={[styles.card, { borderColor: colors.brand100 }]}>
            <Text style={[styles.h, { color: colors.brand700 }]}>Tarif de la course</Text>
            <View style={[styles.estRow, { marginBottom: 6 }]}>
              <Est label="Distance" value={km(distanceKm)} />
              <Est label="Estimation auto" value={money(price)} />
            </View>
            <Text style={styles.routeNote}>
              {routing ? '🛣️ Calcul de l’itinéraire routier…' : roadKm != null ? '🛣️ Distance routière réelle (suit les routes)' : '🛣️ Distance selon axes RN (itinéraire précisé à la création)'}
            </Text>

            {loyal && (
              <View style={styles.loyalBanner}>
                <Ionicons name="ribbon" size={18} color={colors.amber600} />
                <Text style={styles.loyalText}>Client fidèle · {clientDelivered} livraisons — remise −{LOYALTY.discountPct} % conseillée</Text>
                <Pressable onPress={applyLoyaltyDiscount} style={styles.loyalBtn}><Text style={styles.loyalBtnText}>Appliquer</Text></Pressable>
              </View>
            )}

            <Field label="Prix facturé (Ar) — modifiable">
              <Input
                value={priceInput}
                onChangeText={(v) => { setPriceTouched(true); setPriceInput(v); }}
                keyboardType="numeric"
                placeholder={String(price)}
              />
            </Field>
            {priceTouched && (
              <Pressable onPress={() => { setPriceTouched(false); setPriceInput(String(price)); }}>
                <Text style={styles.resetPrice}>↺ Revenir à l’estimation automatique ({money(price)})</Text>
              </Pressable>
            )}
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
  routeNote: { color: colors.inkMuted, fontSize: 11.5, marginBottom: 12 },
  resetPrice: { color: colors.brand600, fontSize: 12, fontWeight: '600', marginTop: 2 },
  loyalBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.amberBg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 12 },
  loyalText: { flex: 1, color: colors.amber600, fontSize: 12, fontWeight: '700' },
  loyalBtn: { backgroundColor: colors.amber500, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  loyalBtnText: { color: colors.white, fontWeight: '800', fontSize: 12 },
  error: { color: colors.red },
});
