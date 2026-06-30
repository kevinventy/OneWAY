import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth';
import { Button, Input } from '@/components/ui';
import { LogoMark } from '@/components/Logo';
import { colors, radius } from '@/theme';

export default function Welcome() {
  const router = useRouter();
  const { configured } = useAuth();
  const [code, setCode] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <LogoMark size={60} />
        <Text style={styles.brand}>ONE WAY</Text>
        <Text style={styles.tagline}>Votre marchandise, suivie en temps réel.</Text>
        <Text style={styles.sub}>
          Transport routier de marchandises à Madagascar. Suivez chaque livraison en direct, avec
          les kilomètres restants.
        </Text>
      </View>

      {/* Suivi public — sans compte */}
      <View style={styles.trackBox}>
        <Text style={styles.trackTitle}>📦 Suivre une livraison</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <Input
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            autoCapitalize="characters"
            placeholder="Code (ex. OWTOA01)"
            style={{ flex: 1 }}
          />
          <Button
            title=""
            icon="search"
            onPress={() => code.trim() && router.push(`/track?code=${encodeURIComponent(code.trim())}`)}
            style={{ paddingHorizontal: 18 }}
          />
        </View>
      </View>

      <View style={styles.features}>
        {[
          ['navigate', 'Km restants en direct'],
          ['shield-checkmark', 'Accès sécurisé par rôle'],
          ['cellular', 'Pensé pour le mobile (Mobile Money)'],
        ].map(([icon, label]) => (
          <View key={label} style={styles.feat}>
            <Ionicons name={icon as any} size={18} color={colors.amber500} />
            <Text style={styles.featText}>{label}</Text>
          </View>
        ))}
      </View>

      {!configured && (
        <View style={styles.warn}>
          <Text style={styles.warnText}>
            ⚙️ Firebase non configuré. Renseignez vos clés (mobile/FIREBASE_SETUP.md) pour activer
            l'authentification et les données.
          </Text>
        </View>
      )}

      <View style={{ gap: 10, marginTop: 18 }}>
        <Text style={styles.proLabel}>Espace pro</Text>
        <Button title="Je suis gérant" icon="briefcase" variant="accent" onPress={() => router.push('/register?role=GERANT')} />
        <Button title="Je suis chauffeur" icon="car" variant="primary" onPress={() => router.push('/register?role=CHAUFFEUR')} />
        <Button title="J'ai déjà un compte" variant="ghost" onPress={() => router.push('/login')} />
      </View>

      <Text style={styles.footer}>One Way SARL · Antananarivo, Madagascar 🇲🇬</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 64, backgroundColor: colors.brand950 },
  hero: { alignItems: 'center', gap: 6 },
  brand: { color: colors.white, fontSize: 32, fontWeight: '900', marginTop: 8, letterSpacing: 1 },
  tagline: { color: colors.amber500, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  sub: { color: colors.brand100, textAlign: 'center', marginTop: 8, lineHeight: 21 },
  trackBox: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 14, marginTop: 24 },
  trackTitle: { fontWeight: '800', color: colors.ink, fontSize: 14 },
  features: { marginTop: 22, gap: 12 },
  feat: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featText: { color: colors.brand100, fontSize: 15 },
  warn: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, marginTop: 18 },
  warnText: { color: '#ffe8c2', fontSize: 13, lineHeight: 19 },
  proLabel: { color: colors.brand100, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  footer: { color: colors.brand100, textAlign: 'center', fontSize: 12, marginTop: 28 },
});
