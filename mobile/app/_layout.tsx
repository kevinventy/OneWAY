import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/store/auth';
import { UpdateBanner } from '@/components/UpdateBanner';
// Enregistre la tâche GPS de fond dès le démarrage (y compris relance headless).
import '@/lib/locationTask';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f6f8fc' } }} />
        <UpdateBanner />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
