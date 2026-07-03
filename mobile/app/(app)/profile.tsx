import { View, Text, ScrollView, StyleSheet, Share, Linking, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth';
import { Card, Button, Badge, Avatar } from '@/components/ui';
import { ROLE_LABEL } from '@/lib/labels';
import { COMPANY, telHref, whatsappHref, emailHref } from '@/data/company';
import { colors } from '@/theme';

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();
  if (!user) return null;

  async function doLogout() {
    await logout();
    router.replace('/welcome');
  }

  function shareCode() {
    if (!user!.companyCode) return;
    Share.share({ message: `Rejoignez ${user!.companyName ?? 'ONE WAY'} sur l'app ONE WAY avec le code entreprise : ${user!.companyCode}` });
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {/* En-tête de marque */}
      <View style={styles.hero}>
        <View style={styles.blob1} pointerEvents="none" />
        <View style={styles.blob2} pointerEvents="none" />
        <View style={styles.heroAvatar}><Avatar name={user.companyName ?? user.name} color={user.avatarColor} size={68} /></View>
        <Text style={styles.hName}>{user.companyName ?? user.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <Badge tone="amber">{ROLE_LABEL[user.role]}</Badge>
          <Text style={styles.hSub}>@{user.identifiant}</Text>
        </View>
        {user.name !== (user.companyName ?? user.name) && <Text style={styles.hSub}>{user.name}</Text>}
        {user.phone ? <Text style={styles.hSub}>📞 {user.phone}</Text> : null}
        {user.contactEmail ? <Text style={styles.hSub}>✉️ {user.contactEmail}</Text> : null}
      </View>

      <Button title="Modifier le profil" icon="create-outline" variant="outline" onPress={() => router.push('/(app)/edit-profile')} style={{ marginTop: 14 }} />

      {user.role === 'GERANT' && user.companyCode && (
        <Card style={styles.codeCard}>
          <Text style={styles.codeLabel}>Code entreprise (à donner aux chauffeurs)</Text>
          <Text style={styles.code}>{user.companyCode}</Text>
          <Button title="Partager le code" icon="share-social-outline" variant="outline" onPress={shareCode} style={{ marginTop: 10 }} />
        </Card>
      )}

      {/* Nous contacter */}
      <Card style={styles.contactCard}>
        <Text style={styles.contactTitle}>Nous contacter</Text>
        <ContactRow icon="logo-whatsapp" color={colors.green} label="WhatsApp" value={COMPANY.phone} onPress={() => Linking.openURL(whatsappHref(COMPANY.whatsapp, 'Bonjour ONE WAY,'))} />
        <ContactRow icon="call" color={colors.brand600} label="Appeler" value={COMPANY.phone} onPress={() => Linking.openURL(telHref(COMPANY.phoneIntl))} />
        <ContactRow icon="mail" color={colors.amber600} label="Email" value={COMPANY.email} onPress={() => Linking.openURL(emailHref(COMPANY.email, 'Contact — ONE WAY'))} last />
      </Card>

      <Button title="Se déconnecter" variant="outline" icon="log-out-outline" onPress={doLogout} style={{ marginTop: 18 }} />
    </ScrollView>
  );
}

function ContactRow({ icon, color, label, value, onPress, last }: { icon: any; color: string; label: string; value: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.contactRow, !last && styles.contactBorder]}>
      <Ionicons name={icon} size={20} color={color} />
      <View style={{ flex: 1 }}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={styles.contactValue}>{value}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.inkMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  muted: { color: colors.inkMuted },
  hero: { backgroundColor: colors.brand950, borderRadius: 20, padding: 22, alignItems: 'center', overflow: 'hidden', position: 'relative' },
  blob1: { position: 'absolute', width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(240,125,26,0.16)', top: -60, right: -40 },
  blob2: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(63,92,192,0.35)', bottom: -60, left: -30 },
  heroAvatar: { borderRadius: 40, borderWidth: 3, borderColor: 'rgba(255,255,255,0.35)' },
  hName: { color: colors.white, fontSize: 20, fontWeight: '900', marginTop: 12, textAlign: 'center' },
  hSub: { color: colors.brand100, fontSize: 13, fontWeight: '600', marginTop: 4 },
  codeCard: { padding: 16, marginTop: 14, alignItems: 'center', borderColor: colors.brand100, borderWidth: 1 },
  codeLabel: { color: colors.inkMuted, fontSize: 12, fontWeight: '600' },
  code: { fontSize: 28, fontWeight: '900', color: colors.brand700, letterSpacing: 4, marginTop: 6 },
  contactCard: { padding: 16, marginTop: 14 },
  contactTitle: { fontSize: 14, fontWeight: '800', color: colors.ink, marginBottom: 4 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  contactBorder: { borderBottomWidth: 1, borderBottomColor: colors.slateBg },
  contactLabel: { fontSize: 11, color: colors.inkMuted, fontWeight: '600', textTransform: 'uppercase' },
  contactValue: { fontSize: 15, fontWeight: '700', color: colors.ink },
});
