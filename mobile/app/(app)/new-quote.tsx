import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/auth';
import { Button, Card, Field, Input } from '@/components/ui';
import { createQuoteRequest } from '@/firebase/db';
import { CITIES } from '@/lib/geo';
import { CARGO_TYPES, type CargoTypeKey } from '@/data/catalog';
import { colors, radius } from '@/theme';

export default function NewQuote() {
  const router = useRouter();
  const { user } = useAuth();
  const [f, setF] = useState({ fromCity: 'Antananarivo', toCity: 'Toamasina', cargoType: 'GENERAL' as CargoTypeKey, weight: '', description: '' });
  const set = (k: keyof typeof f) => (v: any) => setF((s) => ({ ...s, [k]: v }));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError('');
    if (f.fromCity === f.toCity) return setError('Le départ et l’arrivée doivent être différents.');
    if ((Number(f.weight) || 0) <= 0) return setError('Indiquez le poids estimé.');
    if (f.description.trim().length < 2) return setError('Décrivez votre marchandise.');
    if (!user) return;
    if (!user.phone) return setError('Ajoutez un téléphone à votre compte pour être recontacté.');
    setLoading(true);
    try {
      await createQuoteRequest(user, { fromCity: f.fromCity, toCity: f.toCity, cargoType: f.cargoType, weightKg: Number(f.weight), description: f.description.trim() });
      Alert.alert('Demande envoyée ✅', 'ONE WAY a reçu votre demande et vous recontactera.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      setError(e?.message ?? 'Envoi impossible.');
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>Décrivez votre besoin : ONE WAY vous recontacte avec un prix.</Text>
        <Card style={styles.card}>
          <Field label="Ville de départ"><Chips items={CITIES.map((c) => c.name)} value={f.fromCity} onSelect={set('fromCity')} /></Field>
          <Field label="Ville d’arrivée"><Chips items={CITIES.map((c) => c.name)} value={f.toCity} onSelect={set('toCity')} /></Field>
          <Field label="Type de marchandise"><Chips items={CARGO_TYPES.map((c) => c.key)} labels={CARGO_TYPES.map((c) => `${c.emoji} ${c.label}`)} value={f.cargoType} onSelect={set('cargoType')} /></Field>
          <Field label="Poids estimé (kg)"><Input value={f.weight} onChangeText={set('weight')} keyboardType="numeric" placeholder="500" /></Field>
          <Field label="Description"><Input value={f.description} onChangeText={set('description')} placeholder="Meubles, marchandises…" /></Field>
        </Card>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Envoyer ma demande" icon="send" onPress={submit} loading={loading} />
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

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 14 },
  intro: { color: colors.inkMuted, fontSize: 14, lineHeight: 20 },
  card: { padding: 14 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  chipOn: { backgroundColor: colors.brand600, borderColor: colors.brand600 },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.inkSoft },
  error: { color: colors.red },
});
