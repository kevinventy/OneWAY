import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth';
import { Button, Input, Card } from '@/components/ui';
import { Logo, LogoMark } from '@/components/Logo';
import { COMPANY, SERVICES, telHref, whatsappHref } from '@/data/company';
import { VEHICLE_TYPES } from '@/data/catalog';
import { colors, radius } from '@/theme';

const DEVIS_MSG = 'Bonjour ONE WAY, je souhaite un devis pour un transport de marchandises.';

export default function Welcome() {
  const router = useRouter();
  const { configured } = useAuth();
  const [code, setCode] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.container} style={{ backgroundColor: colors.bg }}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <LogoMark size={84} />
          <Text style={styles.brand}>ONE WAY</Text>
          <Text style={styles.tagline}>Transport · Livraison · Suivi digital</Text>
          <Text style={styles.sub}>Votre marchandise, suivie en temps réel — partout à Madagascar 🇲🇬</Text>
        </View>

        {/* Suivi public — sans compte */}
        <Card style={styles.trackBox}>
          <Text style={styles.trackTitle}>📦 Suivre une livraison</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <Input value={code} onChangeText={(t) => setCode(t.toUpperCase())} autoCapitalize="characters" placeholder="Code (ex. OWTOA01)" style={{ flex: 1 }} />
            <Button title="" icon="search" onPress={() => code.trim() && router.push(`/track?code=${encodeURIComponent(code.trim())}`)} style={{ paddingHorizontal: 18 }} />
          </View>
        </Card>

        {/* CTA pub */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <Button title="Devis WhatsApp" icon="logo-whatsapp" onPress={() => Linking.openURL(whatsappHref(COMPANY.whatsapp, DEVIS_MSG))} style={{ flex: 1, backgroundColor: colors.green }} />
          <Button title="Appeler" icon="call" variant="outline" onPress={() => Linking.openURL(telHref(COMPANY.phoneIntl))} />
        </View>
      </View>

      {/* Services */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nos services</Text>
        {SERVICES.map((s) => (
          <Card key={s.title} style={styles.serviceRow}>
            <View style={styles.serviceIcon}><Ionicons name={s.icon as any} size={20} color={colors.brand600} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceTitle}>{s.title}</Text>
              <Text style={styles.muted}>{s.desc}</Text>
            </View>
          </Card>
        ))}
      </View>

      {/* Bandeau promo */}
      <View style={styles.promo}>
        <Text style={styles.promoTitle}>Devis gratuit en 2 minutes</Text>
        <Text style={styles.promoSub}>Mobile Money accepté (MVola, Orange Money, Airtel Money). Réponse rapide sur WhatsApp.</Text>
        <Pressable onPress={() => Linking.openURL(whatsappHref(COMPANY.whatsapp, DEVIS_MSG))} style={styles.promoBtn}>
          <Ionicons name="logo-whatsapp" size={18} color={colors.white} />
          <Text style={styles.promoBtnText}>Demander un devis</Text>
        </Pressable>
      </View>

      {/* Flotte */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Une flotte pour chaque besoin</Text>
        <View style={styles.fleet}>
          {VEHICLE_TYPES.slice(0, 8).map((v) => (
            <View key={v.key} style={styles.vehicle}>
              <Text style={{ fontSize: 26 }}>{v.emoji}</Text>
              <Text style={styles.vehicleName} numberOfLines={1}>{v.label}</Text>
              <Text style={styles.vehicleCap}>{v.capacityLabel}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.muted, { textAlign: 'center', marginTop: 8 }]}>📍 Couverture nationale — Antananarivo, Toamasina, Mahajanga, Fianarantsoa, Toliara, Antsiranana…</Text>
      </View>

      {!configured && (
        <View style={styles.warn}>
          <Text style={styles.warnText}>⚙️ Firebase non configuré (mobile/FIREBASE_SETUP.md) pour activer comptes & données.</Text>
        </View>
      )}

      {/* Comptes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Créer un compte</Text>
        <View style={{ gap: 10 }}>
          <Button title="Je suis client (suivre mes livraisons)" icon="person" variant="accent" onPress={() => router.push('/register?role=CLIENT')} />
          <Button title="Je suis gérant" icon="briefcase" variant="primary" onPress={() => router.push('/register?role=GERANT')} />
          <Button title="Je suis chauffeur" icon="car" variant="outline" onPress={() => router.push('/register?role=CHAUFFEUR')} />
          <Button title="J'ai déjà un compte" variant="ghost" onPress={() => router.push('/login')} />
        </View>
      </View>

      <View style={styles.footer}>
        <Logo size={16} />
        <Text style={styles.footerText}>{COMPANY.legalName} · {COMPANY.city}, {COMPANY.country} 🇲🇬</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingBottom: 32 },
  hero: { backgroundColor: colors.brand950, paddingTop: 64, paddingHorizontal: 20, paddingBottom: 22, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  brand: { color: colors.white, fontSize: 30, fontWeight: '900', marginTop: 4, letterSpacing: 1 },
  tagline: { color: colors.amber500, fontSize: 13, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  sub: { color: colors.brand100, textAlign: 'center', marginTop: 6, lineHeight: 20, paddingHorizontal: 10 },
  trackBox: { padding: 14, marginTop: 20 },
  trackTitle: { fontWeight: '800', color: colors.ink, fontSize: 14 },
  section: { paddingHorizontal: 16, marginTop: 22 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: colors.ink, marginBottom: 12 },
  serviceRow: { flexDirection: 'row', gap: 12, padding: 14, marginBottom: 10, alignItems: 'center' },
  serviceIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.brand50, alignItems: 'center', justifyContent: 'center' },
  serviceTitle: { fontWeight: '800', color: colors.ink, fontSize: 15 },
  muted: { color: colors.inkMuted, fontSize: 13, marginTop: 2 },
  promo: { marginHorizontal: 16, marginTop: 22, backgroundColor: colors.amber500, borderRadius: radius.lg, padding: 18 },
  promoTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  promoSub: { color: '#3a2a10', marginTop: 4, lineHeight: 19 },
  promoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.brand950, borderRadius: radius.md, paddingVertical: 12, marginTop: 12 },
  promoBtnText: { color: colors.white, fontWeight: '800' },
  fleet: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  vehicle: { width: '47%', backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 12, alignItems: 'center', gap: 2 },
  vehicleName: { fontWeight: '700', color: colors.ink, fontSize: 12, textAlign: 'center' },
  vehicleCap: { color: colors.inkMuted, fontSize: 11 },
  warn: { backgroundColor: colors.amberBg, borderRadius: 12, padding: 12, marginHorizontal: 16, marginTop: 20 },
  warnText: { color: '#7c5a10', fontSize: 13, lineHeight: 19 },
  footer: { alignItems: 'center', gap: 6, marginTop: 28 },
  footerText: { color: colors.inkMuted, fontSize: 12 },
});
