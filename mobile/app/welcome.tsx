import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth';
import { Button } from '@/components/ui';
import { LogoMark } from '@/components/Logo';
import { colors } from '@/theme';

export default function Welcome() {
  const router = useRouter();
  const { configured } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <LogoMark size={64} />
        <Text style={styles.brand}>ONE WAY</Text>
        <Text style={styles.tagline}>Le fret, en un sens.</Text>
        <Text style={styles.sub}>
          La marketplace qui connecte chargeurs et transporteurs. Publiez un fret, recevez des
          offres, suivez la livraison en temps réel et payez en toute sécurité.
        </Text>
      </View>

      <View style={styles.features}>
        {[
          ['radio', 'Suivi GPS en temps réel'],
          ['shield-checkmark', 'Paiement sécurisé & assurance'],
          ['star', 'Transporteurs vérifiés et notés'],
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
            ⚙️ Firebase non configuré. Renseignez vos clés Firebase (mobile/FIREBASE_SETUP.md) pour
            activer l'authentification et les données.
          </Text>
        </View>
      )}

      <View style={{ gap: 10, marginTop: 8 }}>
        <Button title="J'expédie une marchandise" icon="cube" variant="accent" onPress={() => router.push('/register?role=SHIPPER')} />
        <Button title="Je transporte" icon="car" variant="primary" onPress={() => router.push('/register?role=CARRIER')} />
        <Button title="J'ai déjà un compte" variant="ghost" onPress={() => router.push('/login')} />
      </View>

      <Text style={styles.footer}>One Way SARL · Antananarivo, Madagascar 🇲🇬</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 72, backgroundColor: colors.brand950 },
  hero: { alignItems: 'center', gap: 8 },
  brand: { color: colors.white, fontSize: 34, fontWeight: '900', marginTop: 8, letterSpacing: 1 },
  tagline: { color: colors.amber500, fontSize: 18, fontWeight: '700' },
  sub: { color: colors.brand100, textAlign: 'center', marginTop: 8, lineHeight: 21 },
  features: { marginTop: 28, gap: 12 },
  feat: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featText: { color: colors.brand100, fontSize: 15 },
  warn: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, marginTop: 24 },
  warnText: { color: '#ffe8c2', fontSize: 13, lineHeight: 19 },
  footer: { color: colors.brand100, textAlign: 'center', fontSize: 12, marginTop: 'auto', paddingTop: 32 },
});
