import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth';
import { Card, Button, Badge, Avatar, Stars } from '@/components/ui';
import { ROLE_LABEL, KYC_LABEL } from '@/lib/labels';
import { SUBSCRIPTION_PLANS } from '@/data/catalog';
import { money } from '@/lib/format';
import { colors } from '@/theme';

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();
  if (!user) return null;

  const plans = SUBSCRIPTION_PLANS.filter(
    (p) => p.key === 'FREE' || (user.role === 'CARRIER' && p.key === 'CARRIER_PRO') || (user.role === 'SHIPPER' && p.key === 'SHIPPER_BUSINESS'),
  );

  async function doLogout() {
    await logout();
    router.replace('/welcome');
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Card style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <Avatar name={user.companyName ?? user.name} color={user.avatarColor} size={56} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.name}>{user.companyName ?? user.name}</Text>
              {user.premium && <Badge tone="amber">Premium</Badge>}
            </View>
            <Text style={styles.muted}>{ROLE_LABEL[user.role]} · {user.name}</Text>
            {user.ratingCount > 0 && <Stars value={user.rating} count={user.ratingCount} />}
          </View>
        </View>
        <View style={styles.info}>
          <Row icon="mail-outline" text={user.email} />
          <Row icon="call-outline" text={user.phone} />
          {user.city ? <Row icon="location-outline" text={user.city} /> : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.inkMuted} />
            <Text style={styles.muted}>Vérification KYC :</Text>
            <Badge tone={KYC_LABEL[user.kycStatus].tone}>{KYC_LABEL[user.kycStatus].label}</Badge>
          </View>
        </View>
      </Card>

      {user.role !== 'ADMIN' && (
        <>
          <Text style={styles.section}>Abonnement</Text>
          {plans.map((p) => {
            const current = (p.key === 'FREE' && !user.premium) || (user.premium && p.key !== 'FREE');
            return (
              <Card key={p.key} style={[styles.plan, current && { borderColor: colors.brand500, borderWidth: 2 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.planName}>{p.name}</Text>
                  {current && <Badge tone="blue">Actuel</Badge>}
                </View>
                <Text style={styles.planPrice}>{p.priceMonthly === 0 ? 'Gratuit' : `${money(p.priceMonthly)}/mois`}</Text>
                {p.features.map((f) => (
                  <View key={f} style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                    <Ionicons name="checkmark-circle" size={15} color={colors.green} />
                    <Text style={styles.muted}>{f}</Text>
                  </View>
                ))}
              </Card>
            );
          })}
        </>
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
  section: { fontSize: 16, fontWeight: '800', color: colors.ink, marginTop: 20, marginBottom: 8 },
  plan: { padding: 14, marginBottom: 10 },
  planName: { fontWeight: '800', color: colors.ink, fontSize: 15 },
  planPrice: { fontSize: 20, fontWeight: '900', color: colors.ink, marginTop: 4 },
});
