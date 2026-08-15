import { Stack, Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/store/auth';
import { Button } from '@/components/ui';
import { colors } from '@/theme';

export default function AppLayout() {
  const { user, loading, configured, firebaseUser, profileMissing, profileError, logout } = useAuth();
  const router = useRouter();

  // Compte connecté mais profil illisible/absent : sans issue de secours, l'app
  // tournait indéfiniment sur son spinner à chaque lancement.
  if (configured && firebaseUser && !user && (profileMissing || profileError)) {
    return (
      <View style={styles.recover}>
        <Text style={styles.recoverTitle}>Profil incomplet</Text>
        <Text style={styles.recoverText}>
          {profileError
            ? `Votre profil n’a pas pu être chargé (${profileError}). Vérifiez votre connexion puis réessayez.`
            : 'Votre compte existe, mais son profil n’a jamais été enregistré — une inscription a dû être interrompue. Recréez le compte avec les mêmes identifiants : l’inscription reprendra où elle s’est arrêtée.'}
        </Text>
        <Button
          title="Revenir à l’accueil"
          icon="arrow-back"
          onPress={async () => { await logout().catch(() => {}); router.replace('/welcome'); }}
          style={{ marginTop: 18, alignSelf: 'stretch' }}
        />
      </View>
    );
  }

  // Pendant la connexion, `firebaseUser` est défini avant que le profil arrive :
  // on affiche un spinner plutôt que de renvoyer vers /welcome (anti « ×2 »).
  if (configured && (loading || (firebaseUser && !user))) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.brand600} size="large" />
      </View>
    );
  }
  if (!user) return <Redirect href="/welcome" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.white },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="new-course" options={{ title: 'Nouvelle course' }} />
      <Stack.Screen name="new-quote" options={{ title: 'Demander un devis' }} />
      <Stack.Screen name="quick-price" options={{ title: 'Calcul rapide' }} />
      <Stack.Screen name="dashboard" options={{ title: 'Tableau de bord' }} />
      <Stack.Screen name="course/[id]" options={{ title: 'Course' }} />
      <Stack.Screen name="fleet" options={{ title: 'Ma flotte' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="profile" options={{ title: 'Mon compte' }} />
      <Stack.Screen name="edit-profile" options={{ title: 'Modifier le profil' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  recover: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: colors.bg },
  recoverTitle: { fontSize: 20, fontWeight: '900', color: colors.ink, marginBottom: 10 },
  recoverText: { color: colors.inkMuted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
