import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth';
import { Button, Field, Input } from '@/components/ui';
import { Logo } from '@/components/Logo';
import { describeError } from './login';
import { colors, radius } from '@/theme';
import type { Role } from '@/lib/types';

export default function Register() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const { register } = useAuth();
  const [role, setRole] = useState<Role>(params.role === 'CHAUFFEUR' ? 'CHAUFFEUR' : 'GERANT');
  const [form, setForm] = useState({ name: '', identifiant: '', password: '', confirm: '', companyName: '', companyCode: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    setError('');
    if (form.name.trim().length < 2) return setError('Indiquez votre nom complet.');
    if (form.identifiant.trim().length < 3) return setError('Choisissez un identifiant (3 caractères min.).');
    if (form.password.length < 6) return setError('Mot de passe : 6 caractères minimum.');
    if (form.password !== form.confirm) return setError('Les deux mots de passe ne correspondent pas.');
    if (role === 'GERANT' && form.companyName.trim().length < 2) return setError("Indiquez le nom de l'entreprise.");
    if (role === 'CHAUFFEUR' && form.companyCode.trim().length < 4) return setError("Entrez le code entreprise donné par votre gérant.");
    setLoading(true);
    try {
      await register({
        role,
        name: form.name.trim(),
        identifiant: form.identifiant.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        companyName: role === 'GERANT' ? form.companyName.trim() : undefined,
        companyCode: role === 'CHAUFFEUR' ? form.companyCode.trim() : undefined,
      });
      router.replace('/(app)/home');
    } catch (e: any) {
      setError(e?.message && !e?.code ? e.message : describeError(e));
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Logo size={22} />
        <Text style={styles.title}>Créer un compte</Text>

        <View style={styles.roleRow}>
          {(['GERANT', 'CHAUFFEUR'] as Role[]).map((r) => (
            <Pressable key={r} onPress={() => setRole(r)} style={[styles.roleBtn, role === r && styles.roleBtnActive]}>
              <Ionicons name={r === 'GERANT' ? 'briefcase' : 'car'} size={20} color={role === r ? colors.brand700 : colors.inkMuted} />
              <Text style={[styles.roleText, role === r && { color: colors.brand700 }]}>{r === 'GERANT' ? 'Gérant' : 'Chauffeur'}</Text>
            </Pressable>
          ))}
        </View>

        <Field label="Nom complet"><Input value={form.name} onChangeText={set('name')} placeholder="Hery Rakoto" /></Field>
        <Field label="Identifiant (nom d'utilisateur)"><Input value={form.identifiant} onChangeText={set('identifiant')} autoCapitalize="none" placeholder="ex : hery.rakoto" /></Field>
        <Field label="Mot de passe"><Input value={form.password} onChangeText={set('password')} secureTextEntry placeholder="6 caractères minimum" /></Field>
        <Field label="Confirmer le mot de passe"><Input value={form.confirm} onChangeText={set('confirm')} secureTextEntry placeholder="ressaisissez le mot de passe" /></Field>

        {role === 'GERANT' ? (
          <Field label="Nom de l'entreprise"><Input value={form.companyName} onChangeText={set('companyName')} placeholder="One Way SARL" /></Field>
        ) : (
          <Field label="Code entreprise">
            <Input value={form.companyCode} onChangeText={(v) => set('companyCode')(v.toUpperCase())} autoCapitalize="characters" placeholder="donné par votre gérant (ex. OWAB12)" />
          </Field>
        )}
        <Field label="Téléphone (facultatif)"><Input value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" placeholder="+261…" /></Field>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Créer mon compte" onPress={submit} loading={loading} />
        <Button title="J'ai déjà un compte" variant="ghost" onPress={() => router.replace('/login')} style={{ marginTop: 8 }} />
        <Text style={styles.legal}>
          {role === 'GERANT'
            ? 'Vous recevrez un code entreprise à partager avec vos chauffeurs.'
            : 'Demandez le code entreprise à votre gérant pour rejoindre sa flotte.'}
        </Text>
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
  legal: { color: colors.inkMuted, fontSize: 12, textAlign: 'center', marginTop: 12, lineHeight: 17 },
});
