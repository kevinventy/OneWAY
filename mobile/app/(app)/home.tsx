import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth';
import { AppHeader, CourseCard } from '@/components/app';
import { Button, Card, EmptyState, SectionTitle, Stat, Badge, Input } from '@/components/ui';
import {
  subscribeOwnerCourses, subscribeDriverCourses, subscribeClientCourses,
  subscribeNotifications, subscribeQuoteRequests,
} from '@/firebase/db';
import { getFavorites } from '@/lib/favorites';
import { moneyCompact } from '@/lib/format';
import { cargoByKey } from '@/data/catalog';
import { SERVICES, COMPANY, telHref, whatsappHref, emailHref } from '@/data/company';
import { colors } from '@/theme';
import type { Course, QuoteRequest } from '@/lib/types';

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
      {user.role === 'GERANT' && <GerantHome />}
      {user.role === 'CHAUFFEUR' && <ChauffeurHome />}
      {user.role === 'CLIENT' && <ClientHome />}
    </View>
  );
}

function GerantHome() {
  const { user } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);

  useEffect(() => {
    if (!user) return;
    const u1 = subscribeOwnerCourses(user.id, setCourses);
    const u2 = subscribeQuoteRequests(setQuotes);
    return () => { u1(); u2(); };
  }, [user?.id]);

  const active = courses.filter((c) => !['LIVREE', 'ANNULEE'].includes(c.status));
  const toAssign = courses.filter((c) => c.status === 'NOUVELLE');
  const delivered = courses.filter((c) => c.status === 'LIVREE');
  const ca = delivered.reduce((s, c) => s + c.price, 0);

  function openQuote(q: QuoteRequest) {
    router.push({
      pathname: '/(app)/new-course',
      params: { clientName: q.clientName, clientPhone: q.clientPhone, fromCity: q.fromCity, toCity: q.toCity, cargoType: q.cargoType, weight: String(q.weightKg), description: q.description, requestId: q.id },
    });
  }

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

      {quotes.length > 0 && (
        <>
          <SectionTitle>Demandes de devis ({quotes.length})</SectionTitle>
          {quotes.map((q) => (
            <Pressable key={q.id} onPress={() => openQuote(q)}>
              <Card style={styles.quoteRow}>
                <Ionicons name="document-text-outline" size={22} color={colors.amber600} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.quoteName}>{q.clientName} · {q.clientPhone}</Text>
                  <Text style={styles.muted}>{q.fromCity} → {q.toCity} · {cargoByKey(q.cargoType).label} · {q.weightKg.toLocaleString('fr-FR')} kg</Text>
                </View>
                <Badge tone="amber">Créer →</Badge>
              </Card>
            </Pressable>
          ))}
        </>
      )}

      <SectionTitle>Courses en cours ({active.length})</SectionTitle>
      {active.length === 0 ? (
        <EmptyState icon="cube-outline" title="Aucune course active" description="Créez une course pour générer un code de suivi." />
      ) : active.map((c) => <CourseCard key={c.id} course={c} onPress={() => router.push(`/(app)/course/${c.id}`)} />)}

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
      <Text style={styles.muted}>{active.length > 0 ? `${active.length} mission${active.length > 1 ? 's' : ''} en cours` : 'Aucune mission en cours'}</Text>
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

function ClientHome() {
  const { user } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [code, setCode] = useState('');

  useEffect(() => {
    if (!user?.phone) return;
    return subscribeClientCourses(user.phone, setCourses);
  }, [user?.phone]);

  useEffect(() => { getFavorites().then(setFavorites); }, []);

  const active = courses.filter((c) => !['LIVREE', 'ANNULEE'].includes(c.status));
  const done = courses.filter((c) => ['LIVREE', 'ANNULEE'].includes(c.status));
  const track = (c: string) => router.push(`/track?code=${encodeURIComponent(c)}`);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.greet}>Bonjour, {user!.name.split(' ')[0]} 👋</Text>
      <Text style={styles.muted}>Vos livraisons, vos devis et nos services</Text>

      {/* Suivi par code */}
      <Card style={{ padding: 14, marginTop: 8 }}>
        <Text style={styles.cardH}>📦 Suivre par code</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <Input value={code} onChangeText={(t) => setCode(t.toUpperCase())} autoCapitalize="characters" placeholder="Code de suivi" style={{ flex: 1 }} />
          <Button title="" icon="search" onPress={() => code.trim() && track(code.trim())} style={{ paddingHorizontal: 18 }} />
        </View>
      </Card>

      <Button title="Demander un devis" icon="document-text" variant="accent" onPress={() => router.push('/(app)/new-quote')} style={{ marginTop: 12 }} />

      {/* Nos services */}
      <SectionTitle>Nos services</SectionTitle>
      {SERVICES.map((s) => (
        <Card key={s.title} style={styles.serviceRow}>
          <View style={styles.serviceIcon}><Ionicons name={s.icon as any} size={20} color={colors.brand600} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.serviceTitle}>{s.title}</Text>
            <Text style={styles.muted}>{s.desc}</Text>
          </View>
        </Card>
      ))}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
        <Button title="WhatsApp" icon="logo-whatsapp" onPress={() => Linking.openURL(whatsappHref(COMPANY.whatsapp, 'Bonjour ONE WAY, je souhaite un renseignement.'))} style={{ flex: 1, backgroundColor: colors.green }} />
        <Button title="Email" icon="mail" variant="outline" onPress={() => Linking.openURL(emailHref(COMPANY.email, 'Demande de renseignement — ONE WAY'))} />
        <Button title="" icon="call" variant="outline" onPress={() => Linking.openURL(telHref(COMPANY.phoneIntl))} />
      </View>

      <SectionTitle>Mes livraisons</SectionTitle>
      {!user!.phone ? (
        <EmptyState icon="call-outline" title="Ajoutez votre téléphone" description="Vos livraisons sont reliées à votre numéro." />
      ) : active.length === 0 && done.length === 0 ? (
        <EmptyState icon="cube-outline" title="Aucune livraison" description="Les courses créées à votre nom apparaîtront ici." />
      ) : (
        <>
          {active.map((c) => <CourseCard key={c.id} course={c} onPress={() => track(c.code)} />)}
          {done.length > 0 && <SectionTitle>Terminées</SectionTitle>}
          {done.map((c) => <CourseCard key={c.id} course={c} onPress={() => track(c.code)} />)}
        </>
      )}

      {favorites.length > 0 && (
        <>
          <SectionTitle>Mes suivis enregistrés</SectionTitle>
          {favorites.map((c) => (
            <Pressable key={c} onPress={() => track(c)}>
              <Card style={styles.favRow}>
                <Ionicons name="bookmark" size={18} color={colors.brand600} />
                <Text style={styles.favCode}>{c}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.inkMuted} />
              </Card>
            </Pressable>
          ))}
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
  cardH: { fontWeight: '800', color: colors.ink, fontSize: 14 },
  statRow: { flexDirection: 'row', gap: 10, marginVertical: 14 },
  quoteRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 10 },
  quoteName: { fontWeight: '700', color: colors.ink },
  favRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, marginBottom: 8 },
  favCode: { flex: 1, fontWeight: '800', color: colors.ink, letterSpacing: 1 },
  serviceRow: { flexDirection: 'row', gap: 12, padding: 14, marginBottom: 10, alignItems: 'center' },
  serviceIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.brand50, alignItems: 'center', justifyContent: 'center' },
  serviceTitle: { fontWeight: '800', color: colors.ink, fontSize: 14 },
});
