import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth';
import { Button, Field, Input } from '@/components/ui';
import { Logo } from '@/components/Logo';
import { getSavedLogin, saveLogin, clearSavedLogin } from '@/lib/credentials';
import { colors } from '@/theme';

export default function Login() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [identifiant, setIdentifiant] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Pré-remplit l'écran si des identifiants ont été mémorisés (trousseau chiffré).
  useEffect(() => {
    getSavedLogin().then((s) => {
      if (s) { setIdentifiant(s.identifiant); setPassword(s.password); setRemember(true); }
    });
  }, []);

  // On attend que le profil soit chargé (auth state) AVANT de naviguer : sinon
  // le garde de route renvoie vers /welcome (cause de l'ancien « connexion ×2 »).
  useEffect(() => {
    if (loading && user) router.replace('/(app)/home');
  }, [loading, user]);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => {
      setLoading(false);
      setError('Connexion établie mais profil introuvable. Vérifiez les règles Firestore.');
    }, 9000);
    return () => clearTimeout(t);
  }, [loading]);

  async function submit() {
    setError('');
    if (!identifiant.trim() || !password) {
      setError('Renseignez votre identifiant et votre mot de passe.');
      return;
    }
    setLoading(true);
    try {
      await login(identifiant, password);
      // Mémorise (trousseau chiffré) ou efface selon le choix de l'utilisateur.
      if (remember) await saveLogin(identifiant.trim(), password);
      else await clearSavedLogin();
      // La navigation se fait via l'effet ci-dessus, une fois `user` chargé.
    } catch (e: any) {
      setError(describeError(e));
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
          <Field label="Identifiant">
            <Input
              value={identifiant}
              onChangeText={setIdentifiant}
              autoCapitalize="none"
              autoComplete="username"
              textContentType="username"
              importantForAutofill="yes"
              autoCorrect={false}
              placeholder="votre nom d'utilisateur"
            />
          </Field>
          <Field label="Mot de passe">
            <Input
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              importantForAutofill="yes"
              onSubmitEditing={submit}
              returnKeyType="go"
              placeholder="••••••••"
            />
          </Field>
          <Pressable onPress={() => setRemember((r) => !r)} style={styles.rememberRow} hitSlop={6}>
            <Ionicons name={remember ? 'checkbox' : 'square-outline'} size={22} color={remember ? colors.brand600 : colors.inkMuted} />
            <Text style={styles.rememberText}>Se souvenir de moi</Text>
          </Pressable>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Se connecter" onPress={submit} loading={loading} style={{ marginTop: 6 }} />
          <Button title="Créer un compte" variant="ghost" onPress={() => router.replace('/register')} style={{ marginTop: 8 }} />
        </View>

        <View style={styles.hint}>
          <Text style={styles.hintText}>
            💡 Première utilisation ? Aucun compte n'existe encore — touchez « Créer un compte ».
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const ERROR_MAP: Record<string, string> = {
  'auth/invalid-email': 'Identifiant invalide',
  'auth/user-not-found': 'Identifiant ou mot de passe incorrect',
  'auth/wrong-password': 'Identifiant ou mot de passe incorrect',
  'auth/invalid-credential': 'Identifiant ou mot de passe incorrect',
  'auth/email-already-in-use': 'Cet identifiant est déjà pris',
  'auth/weak-password': 'Mot de passe trop faible (6 caractères min.)',
  'auth/network-request-failed': 'Problème réseau — vérifiez votre connexion',
  'auth/operation-not-allowed': 'Activez « E-mail/Mot de passe » dans Firebase → Authentication → Sign-in method.',
  'auth/admin-restricted-operation': 'Activez « E-mail/Mot de passe » dans Firebase → Authentication → Sign-in method.',
  'auth/configuration-not-found': 'Authentication non configuré dans Firebase (activez E-mail/Mot de passe).',
  'auth/api-key-not-valid': 'Clé API Firebase invalide — vérifiez la Variable EXPO_PUBLIC_FIREBASE_API_KEY.',
  'auth/invalid-api-key': 'Clé API Firebase invalide — vérifiez la Variable EXPO_PUBLIC_FIREBASE_API_KEY.',
  'permission-denied': 'Firestore bloque l’écriture. Passez la base en « mode test » ou déployez les règles (mobile/firestore.rules).',
  'unavailable': 'Firestore indisponible — réessayez dans un instant.',
};

/** Message clair pour l'utilisateur ; affiche le code brut si inconnu (diagnostic). */
export function describeError(e: any): string {
  const code: string | undefined = e?.code;
  if (code && ERROR_MAP[code]) return ERROR_MAP[code];
  const raw = code || e?.message || 'inconnue';
  return `Erreur : ${raw}`;
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 72, backgroundColor: colors.bg },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink, marginTop: 24 },
  sub: { color: colors.inkMuted, marginTop: 4 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 12, paddingVertical: 2 },
  rememberText: { color: colors.inkSoft, fontSize: 14, fontWeight: '600' },
  error: { color: colors.red, marginBottom: 10 },
  hint: { marginTop: 24, backgroundColor: colors.brand50, borderRadius: 12, padding: 12 },
  hintText: { color: colors.brand700, fontSize: 13, lineHeight: 19 },
});
