import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth';
import { Button, Field, Input } from '@/components/ui';
import { Logo } from '@/components/Logo';
import { humanError } from './login';
import { colors, radius } from '@/theme';

type Role = 'SHIPPER' | 'CARRIER';

export default function Register() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const { register } = useAuth();
  const [role, setRole] = useState<Role>(params.role === 'CARRIER' ? 'CARRIER' : 'SHIPPER');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', companyName: '', city: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    setError('');
    if (form.name.length < 2 || !form.email || form.password.length < 6) {
      setError('Vérifiez le nom, l’email et le mot de passe (6 caractères min.).');
      return;
    }
    setLoading(true);
    try {
      await register({ role, ...form });
      router.replace('/(app)/home');
    } catch (e: any) {
      setError(humanError(e?.code) ?? 'Inscription impossible');
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
        <Field label="Email"><Input value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" placeholder="vous@email.mg" /></Field>
        <Field label="Téléphone"><Input value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" placeholder="+261 34 00 000 00" /></Field>
        <Field label={role === 'CARRIER' ? 'Société / Flotte' : 'Société (optionnel)'}><Input value={form.companyName} onChangeText={set('companyName')} placeholder="Trans Express Mada" /></Field>
        <Field label="Ville"><Input value={form.city} onChangeText={set('city')} placeholder="Antananarivo" /></Field>
        <Field label="Mot de passe"><Input value={form.password} onChangeText={set('password')} secureTextEntry placeholder="6 caractères minimum" /></Field>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Créer mon compte" onPress={submit} loading={loading} />
        <Button title="J'ai déjà un compte" variant="ghost" onPress={() => router.replace('/login')} style={{ marginTop: 8 }} />
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
  error: { color: colors.red, marginBottom: 10 },
});
