import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth';
import { Button, Field, Input } from '@/components/ui';
import { Logo } from '@/components/Logo';
import { describeError } from './login';
import { colors, radius } from '@/theme';

type Role = 'SHIPPER' | 'CARRIER';

export default function Register() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const { register } = useAuth();
  const [role, setRole] = useState<Role>(params.role === 'CARRIER' ? 'CARRIER' : 'SHIPPER');
  const [form, setForm] = useState({ name: '', identifiant: '', password: '', confirm: '', companyName: '', city: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    setError('');
    if (form.name.trim().length < 2) return setError('Indiquez votre nom complet.');
    if (form.identifiant.trim().length < 3) return setError('Choisissez un identifiant (3 caractères min.).');
    if (form.password.length < 6) return setError('Mot de passe : 6 caractères minimum.');
    if (form.password !== form.confirm) return setError('Les deux mots de passe ne correspondent pas.');
    setLoading(true);
    try {
      await register({
        role,
        name: form.name.trim(),
        identifiant: form.identifiant.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        companyName: form.companyName.trim() || undefined,
        city: form.city.trim() || undefined,
      });
      router.replace('/(app)/home');
    } catch (e: any) {
      setError(describeError(e));
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Logo size={22} />
        <Text style={styles.title}>Créer un compte</Text>

        <View style={styles.roleRow}>
          {(['SHIPPER', 'CARRIER'] as Role[]).map((r) => (
            <Pressable key={r} onPress={() => setRole(r)} style={[styles.roleBtn, role === r && styles.roleBtnActive]}>
              <Ionicons name={r === 'SHIPPER' ? 'cube' : 'car'} size={20} color={role === r ? colors.brand700 : colors.inkMuted} />
              <Text style={[styles.roleText, role === r && { color: colors.brand700 }]}>{r === 'SHIPPER' ? 'Chargeur' : 'Transporteur'}</Text>
            </Pressable>
          ))}
        </View>

        <Field label="Nom complet"><Input value={form.name} onChangeText={set('name')} placeholder="Hery Rakoto" /></Field>
        <Field label="Identifiant (nom d'utilisateur)"><Input value={form.identifiant} onChangeText={set('identifiant')} autoCapitalize="none" placeholder="ex : hery.rakoto" /></Field>
        <Field label="Mot de passe"><Input value={form.password} onChangeText={set('password')} secureTextEntry placeholder="6 caractères minimum" /></Field>
        <Field label="Confirmer le mot de passe"><Input value={form.confirm} onChangeText={set('confirm')} secureTextEntry placeholder="ressaisissez le mot de passe" /></Field>

        <Text style={styles.optional}>Facultatif</Text>
        <Field label={role === 'CARRIER' ? 'Société / Flotte' : 'Société'}><Input value={form.companyName} onChangeText={set('companyName')} placeholder="Trans Express Mada" /></Field>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="Ville"><Input value={form.city} onChangeText={set('city')} placeholder="Antananarivo" /></Field></View>
          <View style={{ flex: 1 }}><Field label="Téléphone"><Input value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" placeholder="+261…" /></Field></View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Créer mon compte" onPress={submit} loading={loading} />
        <Button title="J'ai déjà un compte" variant="ghost" onPress={() => router.replace('/login')} style={{ marginTop: 8 }} />
        <Text style={styles.legal}>Aucun email ni numéro requis. En continuant, vous acceptez les conditions générales de ONE WAY.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 64, backgroundColor: colors.bg },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink, marginTop: 20, marginBottom: 16 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  roleBtn: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  roleBtnActive: { borderColor: colors.brand500, backgroundColor: colors.brand50 },
  roleText: { fontWeight: '700', color: colors.inkMuted },
  optional: { color: colors.inkMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: 6, marginBottom: 8, letterSpacing: 0.5 },
  error: { color: colors.red, marginBottom: 10 },
  legal: { color: colors.inkMuted, fontSize: 11, textAlign: 'center', marginTop: 12, lineHeight: 16 },
});
