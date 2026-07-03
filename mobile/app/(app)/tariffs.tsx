import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth';
import { Card, Button, Badge, Field, Input, EmptyState, SectionTitle } from '@/components/ui';
import { subscribeOwnerTariffs, saveTariff, deleteTariff } from '@/firebase/db';
import { TONNAGE_BRACKETS, filledBrackets, type Tariff } from '@/lib/tariffs';
import { CITIES } from '@/lib/geo';
import { money } from '@/lib/format';
import { colors, radius } from '@/theme';

const CITY_NAMES = CITIES.map((c) => c.name);

export default function Tariffs() {
  const { user } = useAuth();
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Tariff | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'GERANT') return;
    return subscribeOwnerTariffs(user.id, setTariffs);
  }, [user?.id]);

  if (!user) return null;
  if (user.role !== 'GERANT') {
    return <View style={styles.center}><Text style={styles.muted}>Réservé au gérant.</Text></View>;
  }

  function confirmDelete(t: Tariff) {
    Alert.alert('Supprimer l’axe', `Supprimer le tarif ${t.fromCity} → ${t.toCity} ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteTariff(t.id).catch((e: any) => Alert.alert('Erreur', e?.message ?? 'Suppression impossible')) },
    ]);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.introCard}>
          <View style={styles.introIcon}><Ionicons name="pricetags" size={22} color={colors.brand600} /></View>
          <Text style={styles.introText}>
            Fixez vos prix par <Text style={styles.b}>axe</Text> (ville → ville) et par <Text style={styles.b}>tonnage</Text>.
            À la création d’une course, le tarif correspondant est proposé automatiquement.
          </Text>
        </Card>

        <SectionTitle right={<Pressable onPress={() => { setAdding((a) => !a); setEditing(null); }}><Text style={styles.add}>{adding ? 'Fermer' : '+ Ajouter'}</Text></Pressable>}>
          Mes axes ({tariffs.length})
        </SectionTitle>

        {adding && <TariffEditor ownerId={user.id} onDone={() => setAdding(false)} />}

        {tariffs.length === 0 && !adding ? (
          <EmptyState icon="pricetags-outline" title="Aucun axe défini" description="Ajoutez un premier axe (ex. Antananarivo → Toamasina) et ses prix par tonnage." />
        ) : (
          tariffs.map((t) =>
            editing?.id === t.id ? (
              <TariffEditor key={t.id} ownerId={user.id} existing={t} onDone={() => setEditing(null)} />
            ) : (
              <Card key={t.id} style={styles.tariffCard}>
                <View style={styles.tariffHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tariffRoute}>{t.fromCity} <Text style={styles.arrow}>{t.bidirectional ? '⇄' : '→'}</Text> {t.toCity}</Text>
                    <Text style={styles.muted}>{filledBrackets(t)} tranche{filledBrackets(t) > 1 ? 's' : ''} renseignée{filledBrackets(t) > 1 ? 's' : ''}{t.bidirectional ? ' · aller-retour' : ''}</Text>
                  </View>
                  <Pressable onPress={() => { setEditing(t); setAdding(false); }} hitSlop={8} style={styles.iconBtn}><Ionicons name="create-outline" size={20} color={colors.brand600} /></Pressable>
                  <Pressable onPress={() => confirmDelete(t)} hitSlop={8} style={styles.iconBtn}><Ionicons name="trash-outline" size={19} color={colors.red} /></Pressable>
                </View>
                <View style={styles.priceGrid}>
                  {TONNAGE_BRACKETS.map((b) => {
                    const p = t.prices?.[b.key] ?? 0;
                    return (
                      <View key={b.key} style={[styles.priceChip, p > 0 ? styles.priceChipOn : styles.priceChipOff]}>
                        <Text style={styles.priceChipLabel}>{b.label}</Text>
                        <Text style={[styles.priceChipValue, p <= 0 && { color: colors.inkMuted }]}>{p > 0 ? money(p) : '—'}</Text>
                      </View>
                    );
                  })}
                </View>
              </Card>
            ),
          )
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function TariffEditor({ ownerId, existing, onDone }: { ownerId: string; existing?: Tariff; onDone: () => void }) {
  const [fromCity, setFromCity] = useState(existing?.fromCity ?? 'Antananarivo');
  const [toCity, setToCity] = useState(existing?.toCity ?? 'Toamasina');
  const [bidirectional, setBidirectional] = useState(existing?.bidirectional ?? true);
  const [prices, setPrices] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const b of TONNAGE_BRACKETS) init[b.key] = existing?.prices?.[b.key] ? String(existing.prices[b.key]) : '';
    return init;
  });
  const [loading, setLoading] = useState(false);

  const setPrice = (key: string) => (v: string) => setPrices((s) => ({ ...s, [key]: v.replace(/[^\d]/g, '') }));
  const filledCount = useMemo(() => TONNAGE_BRACKETS.filter((b) => Number(prices[b.key]) > 0).length, [prices]);

  async function submit() {
    if (fromCity === toCity) return Alert.alert('Axe invalide', 'Le départ et l’arrivée doivent être différents.');
    if (filledCount === 0) return Alert.alert('Prix requis', 'Renseignez au moins une tranche de tonnage.');
    const cleaned: Record<string, number> = {};
    for (const b of TONNAGE_BRACKETS) {
      const n = Number(prices[b.key]);
      if (n > 0) cleaned[b.key] = Math.round(n);
    }
    setLoading(true);
    try {
      await saveTariff(ownerId, { id: existing?.id, fromCity, toCity, bidirectional, prices: cleaned });
      onDone();
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Enregistrement impossible');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card style={styles.editorCard}>
      <Text style={styles.editorTitle}>{existing ? 'Modifier l’axe' : 'Nouvel axe'}</Text>
      <Field label="Ville de départ"><CityChips value={fromCity} onSelect={setFromCity} /></Field>
      <Field label="Ville d’arrivée"><CityChips value={toCity} onSelect={setToCity} /></Field>

      <Pressable onPress={() => setBidirectional((b) => !b)} style={styles.checkRow}>
        <Text style={[styles.check, bidirectional && styles.checkOn]}>{bidirectional ? '☑' : '☐'}</Text>
        <Text style={styles.muted}>Appliquer aussi dans le sens inverse (aller-retour)</Text>
      </Pressable>

      <Text style={styles.pricesHeading}>Prix par tonnage (Ar)</Text>
      {TONNAGE_BRACKETS.map((b) => (
        <View key={b.key} style={styles.priceRow}>
          <Text style={styles.priceRowLabel}>{b.label}</Text>
          <Input
            value={prices[b.key]}
            onChangeText={setPrice(b.key)}
            keyboardType="numeric"
            placeholder="—"
            style={styles.priceInput}
          />
        </View>
      ))}

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <Button title="Annuler" variant="outline" onPress={onDone} style={{ flex: 1 }} />
        <Button title={existing ? 'Enregistrer' : 'Ajouter l’axe'} icon="checkmark" onPress={submit} loading={loading} style={{ flex: 1.4 }} />
      </View>
    </Card>
  );
}

function CityChips({ value, onSelect }: { value: string; onSelect: (v: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
      {CITY_NAMES.map((name) => {
        const active = name === value;
        return (
          <Pressable key={name} onPress={() => onSelect(name)} style={[styles.chip, active && styles.chipOn]}>
            <Text style={[styles.chipText, active && { color: '#fff' }]}>{name}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.inkMuted, fontSize: 12.5 },
  b: { fontWeight: '800', color: colors.ink },
  add: { color: colors.brand600, fontWeight: '700' },

  introCard: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, borderColor: colors.brand100, marginBottom: 4 },
  introIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.brand50, alignItems: 'center', justifyContent: 'center' },
  introText: { flex: 1, color: colors.inkSoft, fontSize: 13, lineHeight: 18 },

  tariffCard: { padding: 14, marginBottom: 10 },
  tariffHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tariffRoute: { fontWeight: '800', color: colors.ink, fontSize: 15 },
  arrow: { color: colors.amber500, fontWeight: '900' },
  iconBtn: { padding: 4 },
  priceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  priceChip: { width: '31%', flexGrow: 1, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1 },
  priceChipOn: { backgroundColor: colors.brand50, borderColor: colors.brand100 },
  priceChipOff: { backgroundColor: colors.slateBg, borderColor: colors.border },
  priceChipLabel: { fontSize: 10.5, color: colors.inkMuted, fontWeight: '700' },
  priceChipValue: { fontSize: 13, fontWeight: '800', color: colors.brand700, marginTop: 2 },

  editorCard: { padding: 14, marginBottom: 10, borderColor: colors.brand100 },
  editorTitle: { fontSize: 15, fontWeight: '800', color: colors.ink, marginBottom: 8 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2, marginBottom: 6 },
  check: { fontSize: 18, color: colors.inkMuted },
  checkOn: { color: colors.brand600 },
  pricesHeading: { fontSize: 13, fontWeight: '800', color: colors.ink, marginTop: 8, marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  priceRowLabel: { width: 78, fontSize: 13, fontWeight: '700', color: colors.inkSoft },
  priceInput: { flex: 1 },

  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  chipOn: { backgroundColor: colors.brand600, borderColor: colors.brand600 },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.inkSoft },
});
