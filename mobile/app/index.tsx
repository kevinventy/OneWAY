import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/store/auth';
import { colors } from '@/theme';

export default function Index() {
  const { loading, user, configured } = useAuth();

  if (configured && loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brand950 }}>
        <ActivityIndicator color={colors.amber500} size="large" />
      </View>
    );
  }
  if (!user) return <Redirect href="/welcome" />;
  return <Redirect href="/(app)/home" />;
}
