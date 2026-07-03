import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/auth';
import { Card, Button, Field, Input } from '@/components/ui';
import { updateUserProfile } from '@/firebase/db';
import { colors } from '@/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EditProfile() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.contactEmail ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  async function save() {
    setError('');
    if (name.trim().length < 2) return setError('Indiquez votre nom.');
    const em = email.trim();
    if (em && !EMAIL_RE.test(em)) return setError('Adresse email invalide.');
    setLoading(true);
    try {
      await updateUserProfile(user!.id, { name, phone, contactEmail: email });
      router.back();
    } catch (e: any) {
      setError(e?.message ?? 'Enregistrement impossible.');
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <Field label="Nom complet">
            <Input value={name} onChangeText={setName} placeholder="Votre nom" />
          </Field>
          <Field label="Adresse email (contact)">
            <Input value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholder="vous@exemple.com" />
          </Field>
          <Field label="Téléphone">
            <Input value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+261 34 …" />
          </Field>
          <Text style={styles.hint}>Votre identifiant de connexion (@{user.identifiant}) ne change pas.</Text>
        </Card>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Enregistrer les modifications" icon="checkmark" onPress={save} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 14 },
  card: { padding: 14 },
  hint: { color: colors.inkMuted, fontSize: 12, marginTop: 2, lineHeight: 17 },
  error: { color: colors.red },
});
