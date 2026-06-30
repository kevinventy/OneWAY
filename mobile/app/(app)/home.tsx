import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/auth';
import { AppHeader, CourseCard } from '@/components/app';
import { Button, EmptyState, SectionTitle, Stat } from '@/components/ui';
import { subscribeOwnerCourses, subscribeDriverCourses, subscribeNotifications } from '@/firebase/db';
import { moneyCompact } from '@/lib/format';
import { colors } from '@/theme';
import type { Course } from '@/lib/types';

export default function Home() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    return subscribeNotifications(user.id, (rows) => setUnread(rows.filter((n) => !n.read).length));
  }, [user?.id]);

  if (!user) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader name={user.name} color={user.avatarColor} unread={unread} />
      {user.role === 'GERANT' ? <GerantHome /> : <ChauffeurHome />}
    </View>
  );
}

function GerantHome() {
  const { user } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (!user) return;
    return subscribeOwnerCourses(user.id, setCourses);
  }, [user?.id]);

  const active = courses.filter((c) => !['LIVREE', 'ANNULEE'].includes(c.status));
  const toAssign = courses.filter((c) => c.status === 'NOUVELLE');
  const delivered = courses.filter((c) => c.status === 'LIVREE');
  const ca = delivered.reduce((s, c) => s + c.price, 0);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.greetRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greet}>Bonjour, {user!.name.split(' ')[0]} 👋</Text>
          <Text style={styles.muted}>{user!.companyName ?? 'Tableau de bord'}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button title="Nouvelle course" icon="add-circle" onPress={() => router.push('/(app)/new-course')} style={{ flex: 1 }} />
        <Button title="Flotte" icon="car-outline" variant="outline" onPress={() => router.push('/(app)/fleet')} />
      </View>

      <View style={styles.statRow}>
        <Stat label="Actives" value={active.length} tone="amber" />
        <Stat label="À assigner" value={toAssign.length} tone="red" />
        <Stat label="Livrées" value={delivered.length} tone="green" />
      </View>
      <View style={[styles.statRow, { marginTop: 0 }]}>
        <Stat label="CA livré (Ar)" value={moneyCompact(ca)} tone="blue" />
      </View>

      <SectionTitle>Courses en cours ({active.length})</SectionTitle>
      {active.length === 0 ? (
        <EmptyState icon="cube-outline" title="Aucune course active" description="Créez une course pour générer un code de suivi." />
      ) : (
        active.map((c) => <CourseCard key={c.id} course={c} onPress={() => router.push(`/(app)/course/${c.id}`)} />)
      )}

      {delivered.length > 0 && (
        <>
          <SectionTitle>Livrées récentes</SectionTitle>
          {delivered.slice(0, 5).map((c) => <CourseCard key={c.id} course={c} onPress={() => router.push(`/(app)/course/${c.id}`)} />)}
        </>
      )}
    </ScrollView>
  );
}

function ChauffeurHome() {
  const { user } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (!user) return;
    return subscribeDriverCourses(user.id, setCourses);
  }, [user?.id]);

  const active = courses.filter((c) => !['LIVREE', 'ANNULEE'].includes(c.status));
  const done = courses.filter((c) => ['LIVREE', 'ANNULEE'].includes(c.status));

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.greet}>Bonjour, {user!.name.split(' ')[0]} 🧑‍✈️</Text>
      <Text style={styles.muted}>
        {active.length > 0 ? `${active.length} mission${active.length > 1 ? 's' : ''} en cours` : 'Aucune mission en cours'}
      </Text>

      <SectionTitle>Mes missions</SectionTitle>
      {active.length === 0 && done.length === 0 ? (
        <EmptyState icon="map-outline" title="Pas de mission" description="Votre gérant vous affectera des courses ici." />
      ) : (
        <>
          {active.map((c) => <CourseCard key={c.id} course={c} showPrice={false} onPress={() => router.push(`/(app)/course/${c.id}`)} />)}
          {done.length > 0 && <SectionTitle>Terminées</SectionTitle>}
          {done.map((c) => <CourseCard key={c.id} course={c} showPrice={false} onPress={() => router.push(`/(app)/course/${c.id}`)} />)}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 4 },
  greetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  greet: { fontSize: 22, fontWeight: '800', color: colors.ink },
  muted: { color: colors.inkMuted, marginBottom: 8 },
  statRow: { flexDirection: 'row', gap: 10, marginVertical: 14 },
});
