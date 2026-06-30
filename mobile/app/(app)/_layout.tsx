import { Stack, Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/store/auth';
import { colors } from '@/theme';

export default function AppLayout() {
  const { user, loading, configured } = useAuth();

  if (configured && loading) {
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
      <Stack.Screen name="course/[id]" options={{ title: 'Course' }} />
      <Stack.Screen name="fleet" options={{ title: 'Ma flotte' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="profile" options={{ title: 'Mon compte' }} />
    </Stack>
  );
}
