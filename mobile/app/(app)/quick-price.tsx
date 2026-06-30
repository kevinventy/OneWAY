import { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Field, Input, SectionTitle } from '@/components/ui';
import { QUICK_VEHICLES, computeQuickPrice, type QuickInput } from '@/lib/quickPrice';
import { KNOWN_ROUTES } from '@/lib/geo';
import { money } from '@/lib/format';
import { colors, radius } from '@/theme';

const num = (s: string) => Number(s.replace(/[^\d]/g, '')) || 0;

export default function QuickPrice() {
  const [distance, setDistance] = useState('357');
  const [vehicleIndex, setVehicleIndex] = useState(4); // Camion 5 T
  const [declaredValue, setDeclaredValue] = useState('20000000');
  const [loadHandling, setLoadHandling] = useState(true);
  const [unloadHandling, setUnloadHandling] = useState(true);
  const [roundTrip, setRoundTrip] = useState(true);
  const [vat, setVat] = useState(false);
  const [discount, setDiscount] = useState('0');

  const input: QuickInput = {
    distanceKm: num(distance),
    vehicleIndex,
    declaredValue: num(declaredValue),
    loadHandling,
    unloadHandling,
    roundTrip,
    discountPct: num(discount),
    vat,
  };

  const res = useMemo(() => computeQuickPrice(input), [
    input.distanceKm, input.vehicleIndex, input.declaredValue,
    input.loadHandling, input.unloadHandling, input.roundTrip, input.discountPct, input.vat,
  ]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>Estimez en quelques secondes le prix d’une course à présenter au client.</Text>

        {/* Paramètres */}
        <Card style={styles.card}>
          <Field label="Distance — aller (km)">
            <Input value={distance} onChangeText={setDistance} keyboardType="numeric" placeholder="357" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 10 }}>
              {KNOWN_ROUTES.map((r) => (
                <Pressable key={`${r.from}-${r.to}`} onPress={() => setDistance(String(r.distanceKm))} style={styles.routeChip}>
                  <Text style={styles.routeChipText}>{r.from.slice(0, 4)}→{r.to.slice(0, 4)} · {r.distanceKm}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Field>

          <Field label="Type de véhicule">
            <View style={styles.vehGrid}>
              {QUICK_VEHICLES.map((v) => {
                const on = v.index === vehicleIndex;
                return (
                  <Pressable key={v.key} onPress={() => setVehicleIndex(v.index)} style={[styles.veh, on && styles.vehOn]}>
                    <Text style={styles.vehEmoji}>{v.emoji}</Text>
                    <Text style={[styles.vehLabel, on && { color: colors.brand700 }]} numberOfLines={1}>{v.label}</Text>
                    <Text style={styles.vehCap}>{v.capacity}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          <Field label="Valeur déclarée de la marchandise (Ar)">
            <Input value={declaredValue} onChangeText={setDeclaredValue} keyboardType="numeric" placeholder="20 000 000" />
          </Field>

          <ToggleRow label="Manutention au chargement" value={loadHandling} onChange={setLoadHandling} />
          <ToggleRow label="Manutention au déchargement" value={unloadHandling} onChange={setUnloadHandling} />
          <ToggleRow label="Aller-retour (retour à vide)" value={roundTrip} onChange={setRoundTrip} />
          <ToggleRow label="Appliquer la TVA 20 %" value={vat} onChange={setVat} />

          <Field label="Remise commerciale (%)">
            <Input value={discount} onChangeText={setDiscount} keyboardType="numeric" placeholder="0" />
          </Field>
        </Card>

        {/* Total mis en avant */}
        <Card style={styles.totalCard}>
          <Text style={styles.totalLabel}>💰 Total estimé {vat ? 'TTC' : 'H.T.'}</Text>
          <Text style={styles.totalValue}>{money(res.total)}</Text>
          <Text style={styles.totalSub}>
            {res.vehicle.emoji} {res.vehicle.label} · {input.distanceKm.toLocaleString('fr-FR')} km · {money(res.pricePerKm)}/km
          </Text>
        </Card>

        {/* Détail du calcul */}
        <SectionTitle>Détail du calcul</SectionTitle>
        <Card style={{ padding: 14 }}>
          <Row label="Frais kilométriques aller (hors carburant)" value={res.kmFee} />
          <Row label="Carburant aller" value={res.fuel} />
          {res.returnEmpty > 0 && <Row label="Retour à vide (repositionnement)" value={res.returnEmpty} />}
          <Row label="Forfait de base véhicule" value={res.baseFee} />
          {res.loadFee > 0 && <Row label="Manutention chargement" value={res.loadFee} />}
          {res.unloadFee > 0 && <Row label="Manutention déchargement" value={res.unloadFee} />}
          <Row label="Assurance (0,5 % valeur déclarée)" value={res.insurance} />
          <Row label="Frais divers (péages, 3 %)" value={res.misc} />
          <View style={styles.sep} />
          <Row label="Sous-total H.T." value={res.subtotal} bold />
          {res.discount !== 0 && <Row label="Remise commerciale" value={res.discount} />}
          {res.vat > 0 && <Row label="TVA 20 %" value={res.vat} />}
          <View style={styles.sep} />
          <Row label="TOTAL ESTIMÉ" value={res.total} bold big />
        </Card>

        <Text style={styles.note}>
          ℹ️ Calcul basé sur la grille tarifaire officielle ONE WAY (gazole 4 900 Ar/L, essence 5 100 Ar/L,
          retour à vide 70 %). Ajustez le prix final selon l’état des routes et la négociation.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable onPress={() => onChange(!value)} style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.brand500 }}
        thumbColor={colors.white}
      />
    </Pressable>
  );
}

function Row({ label, value, bold, big }: { label: string; value: number; bold?: boolean; big?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && { fontWeight: '800', color: colors.ink }]} numberOfLines={2}>{label}</Text>
      <Text style={[styles.rowValue, bold && { fontWeight: '800', color: colors.ink }, big && { fontSize: 18, color: colors.brand700 }, value < 0 && { color: colors.green }]}>
        {money(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48, gap: 12 },
  intro: { color: colors.inkMuted, fontSize: 14, lineHeight: 20 },
  card: { padding: 14 },
  routeChip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  routeChipText: { fontSize: 12, fontWeight: '700', color: colors.inkSoft },
  vehGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  veh: { width: '31.5%', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', gap: 2 },
  vehOn: { borderColor: colors.brand500, backgroundColor: colors.brand50 },
  vehEmoji: { fontSize: 20 },
  vehLabel: { fontSize: 11, fontWeight: '700', color: colors.inkSoft, textAlign: 'center' },
  vehCap: { fontSize: 10, color: colors.inkMuted },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  toggleLabel: { flex: 1, fontSize: 14, color: colors.inkSoft, fontWeight: '600' },
  totalCard: { padding: 18, backgroundColor: colors.brand950, borderColor: colors.brand950, alignItems: 'center' },
  totalLabel: { color: colors.brand100, fontWeight: '700', fontSize: 13 },
  totalValue: { color: colors.white, fontWeight: '900', fontSize: 32, marginTop: 4, letterSpacing: 0.5 },
  totalSub: { color: colors.brand100, fontSize: 12, marginTop: 6, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, gap: 10 },
  rowLabel: { flex: 1, fontSize: 13, color: colors.inkMuted },
  rowValue: { fontSize: 14, fontWeight: '700', color: colors.inkSoft },
  sep: { height: 1, backgroundColor: colors.border, marginVertical: 6 },
  note: { color: colors.inkMuted, fontSize: 12, lineHeight: 18, marginTop: 4 },
});
