import { View, Text, ScrollView, StyleSheet, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth';
import { Card, Button, Badge, Avatar } from '@/components/ui';
import { ROLE_LABEL } from '@/lib/labels';
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
      <Card style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <Avatar name={user.companyName ?? user.name} color={user.avatarColor} size={56} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user.companyName ?? user.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Badge tone="blue">{ROLE_LABEL[user.role]}</Badge>
              <Text style={styles.muted}>{user.name}</Text>
            </View>
          </View>
        </View>
        <View style={styles.info}>
          <Row icon="person-outline" text={`@${user.identifiant}`} />
          {user.phone ? <Row icon="call-outline" text={user.phone} /> : null}
        </View>
      </Card>

      {user.role === 'GERANT' && user.companyCode && (
        <Card style={styles.codeCard}>
          <Text style={styles.codeLabel}>Code entreprise (à donner aux chauffeurs)</Text>
          <Text style={styles.code}>{user.companyCode}</Text>
          <Button title="Partager le code" icon="share-social-outline" variant="outline" onPress={shareCode} style={{ marginTop: 10 }} />
        </Card>
      )}

      <Button title="Se déconnecter" variant="outline" icon="log-out-outline" onPress={doLogout} style={{ marginTop: 18 }} />
    </ScrollView>
  );
}

function Row({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Ionicons name={icon} size={16} color={colors.inkMuted} />
      <Text style={styles.muted}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  name: { fontSize: 18, fontWeight: '800', color: colors.ink },
  muted: { color: colors.inkMuted },
  info: { marginTop: 14, gap: 8 },
  codeCard: { padding: 16, marginTop: 14, alignItems: 'center', borderColor: colors.brand100, borderWidth: 1 },
  codeLabel: { color: colors.inkMuted, fontSize: 12, fontWeight: '600' },
  code: { fontSize: 28, fontWeight: '900', color: colors.brand700, letterSpacing: 4, marginTop: 6 },
});
