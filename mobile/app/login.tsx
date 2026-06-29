import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/auth';
import { Button, Field, Input } from '@/components/ui';
import { Logo } from '@/components/Logo';
import { colors } from '@/theme';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(app)/home');
    } catch (e: any) {
      setError(humanError(e?.code) ?? 'Connexion impossible');
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Logo size={22} />
        <Text style={styles.title}>Connexion</Text>
        <Text style={styles.sub}>Ravi de vous revoir sur ONE WAY.</Text>

        <View style={{ marginTop: 24 }}>
          <Field label="Email">
            <Input value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="vous@email.mg" />
          </Field>
          <Field label="Mot de passe">
            <Input value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
          </Field>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Se connecter" onPress={submit} loading={loading} style={{ marginTop: 6 }} />
          <Button title="Créer un compte" variant="ghost" onPress={() => router.replace('/register')} style={{ marginTop: 8 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function humanError(code?: string): string | undefined {
  switch (code) {
    case 'auth/invalid-email': return 'Email invalide';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Email ou mot de passe incorrect';
    case 'auth/email-already-in-use': return 'Un compte existe déjà avec cet email';
    case 'auth/weak-password': return 'Mot de passe trop faible (6 caractères min.)';
    case 'auth/network-request-failed': return 'Problème réseau';
    default: return undefined;
  }
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 72, backgroundColor: colors.bg },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink, marginTop: 24 },
  sub: { color: colors.inkMuted, marginTop: 4 },
  error: { color: colors.red, marginBottom: 10 },
});
