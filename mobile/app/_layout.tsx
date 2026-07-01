import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/store/auth';
import { UpdateBanner } from '@/components/UpdateBanner';
import { useNotificationBanners } from '@/lib/notify';
// Enregistre la tâche GPS de fond dès le démarrage (y compris relance headless).
import '@/lib/locationTask';

/** Convertit les notifications Firestore en bannières système (app ouverte/en fond). */
function NotificationBridge() {
  const { user } = useAuth();
  useNotificationBanners(user?.id);
  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f6f8fc' } }} />
        <UpdateBanner />
        <NotificationBridge />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
