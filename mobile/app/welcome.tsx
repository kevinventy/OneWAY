import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/auth';
import { Button } from '@/components/ui';
import { LogoMark } from '@/components/Logo';
import { COMPANY } from '@/data/company';
import { useExitConfirm } from '@/lib/useExitConfirm';
import { colors } from '@/theme';

export default function Welcome() {
  const router = useRouter();
  const { configured } = useAuth();
  useExitConfirm();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <LogoMark size={104} badge />
        <Text style={styles.brand}>ONE WAY</Text>
        <Text style={styles.tagline}>Transport · Livraison · Suivi digital</Text>
        <Text style={styles.sub}>Votre marchandise, suivie en temps réel — Madagascar 🇲🇬</Text>
      </View>

      {!configured && (
        <View style={styles.warn}>
          <Text style={styles.warnText}>
            ⚙️ Firebase non configuré (mobile/FIREBASE_SETUP.md) pour activer l'authentification et les données.
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <Button title="Se connecter" icon="log-in" variant="accent" onPress={() => router.push('/login')} />

        <Text style={styles.or}>Nouveau sur ONE WAY ? Créez un compte</Text>
        <Button title="Je suis client" icon="person" variant="primary" onPress={() => router.push('/register?role=CLIENT')} />
        <Button title="Je suis gérant" icon="briefcase" variant="outline" onPress={() => router.push('/register?role=GERANT')} />
        <Button title="Je suis chauffeur" icon="car" variant="outline" onPress={() => router.push('/register?role=CHAUFFEUR')} />
      </View>

      <Text style={styles.footer}>{COMPANY.legalName} · {COMPANY.city}, {COMPANY.country} 🇲🇬</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 80, backgroundColor: colors.brand950 },
  hero: { alignItems: 'center', gap: 6 },
  brand: { color: colors.white, fontSize: 32, fontWeight: '900', marginTop: 10, letterSpacing: 1 },
  tagline: { color: colors.amber500, fontSize: 13, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  sub: { color: colors.brand100, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  warn: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, marginTop: 28 },
  warnText: { color: '#ffe8c2', fontSize: 13, lineHeight: 19 },
  actions: { gap: 10, marginTop: 40 },
  or: { color: colors.brand100, textAlign: 'center', fontSize: 13, marginTop: 16, marginBottom: 2 },
  footer: { color: colors.brand100, textAlign: 'center', fontSize: 12, marginTop: 'auto', paddingTop: 36 },
});
