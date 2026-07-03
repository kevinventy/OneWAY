import { useEffect, useState, type ReactNode } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/store/auth';
import { AppHeader, CourseCard, DeliveryRecapCard } from '@/components/app';
import { Button, Card, EmptyState, SectionTitle, Badge, Input } from '@/components/ui';
import {
  subscribeOwnerCourses, subscribeDriverCourses, subscribeClientCourses,
  subscribeNotifications, subscribeQuoteRequests, deleteCourse,
} from '@/firebase/db';
import { getFavorites } from '@/lib/favorites';
import { money } from '@/lib/format';
import { cargoByKey } from '@/data/catalog';
import { SERVICES, COMPANY, telHref, whatsappHref, emailHref } from '@/data/company';
import { useExitConfirm } from '@/lib/useExitConfirm';
import { COURSE_STATUS } from '@/lib/labels';
import { colors } from '@/theme';
import { kmRemaining, type Course, type QuoteRequest } from '@/lib/types';

export default function Home() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  useExitConfirm();

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
  function confirmDelete(c: Course) {
    Alert.alert('Supprimer la livraison', `Supprimer définitivement ${c.reference} (${c.pickup.city} → ${c.delivery.city}) ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteCourse(c).catch((e: any) => Alert.alert('Erreur', e?.message ?? 'Suppression impossible')) },
    ]);
  }

  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <ScrollView contentContainerStyle={styles.clientScroll} showsVerticalScrollIndicator={false}>
      <Hero hello={`${hello}, ${user!.name.split(' ')[0]} 👋`} subtitle={user!.companyName ?? 'Tableau de bord'}>
        <View style={styles.heroStats}>
          <HeroStat value={active.length} label="Actives" />
          <View style={styles.heroDivider} />
          <HeroStat value={toAssign.length} label="À assigner" />
          <View style={styles.heroDivider} />
          <HeroStat value={delivered.length} label="Livrées" />
        </View>
      </Hero>

      {/* Chiffre d'affaires livré */}
      <View style={styles.caCard}>
        <View>
          <Text style={styles.caLabel}>Chiffre d'affaires livré</Text>
          <Text style={styles.caValue}>{money(ca)}</Text>
        </View>
        <View style={styles.caIcon}><Ionicons name="trending-up" size={22} color={colors.green} /></View>
      </View>

      {/* CTA principal */}
      <Pressable onPress={() => router.push('/(app)/new-course')} style={styles.ctaCard}>
        <View style={styles.ctaIcon}><Ionicons name="add-circle" size={24} color={colors.ink} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.ctaTitle}>Nouvelle course</Text>
          <Text style={styles.ctaSub}>Créer une course & générer le code de suivi</Text>
        </View>
        <Ionicons name="arrow-forward-circle" size={26} color={colors.ink} />
      </Pressable>

      {/* Raccourcis */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <ActionTile icon="calculator" label="Calcul rapide" bg={colors.brand50} fg={colors.brand600} onPress={() => router.push('/(app)/quick-price')} />
        <ActionTile icon="stats-chart" label="Tableau de bord" bg="#FDECD8" fg={colors.amber600} onPress={() => router.push('/(app)/dashboard')} />
        <ActionTile icon="car-outline" label="Ma flotte" bg={colors.greenBg} fg={colors.green} onPress={() => router.push('/(app)/fleet')} />
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
          <SectionTitle>Livraisons récentes</SectionTitle>
          {delivered.slice(0, 8).map((c) => (
            <DeliveryRecapCard key={c.id} course={c} onPress={() => router.push(`/(app)/course/${c.id}`)} onDelete={() => confirmDelete(c)} />
          ))}
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
  const activeTop = active.find((c) => c.status !== 'NOUVELLE') ?? active[0];

  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <ScrollView contentContainerStyle={styles.clientScroll} showsVerticalScrollIndicator={false}>
      <Hero
        hello={`${hello}, ${user!.name.split(' ')[0]} 🧑‍✈️`}
        subtitle={active.length > 0 ? `${active.length} mission${active.length > 1 ? 's' : ''} en cours` : 'Aucune mission en cours'}
      >
        <View style={styles.heroStats}>
          <HeroStat value={active.length} label="En cours" />
          <View style={styles.heroDivider} />
          <HeroStat value={done.length} label="Terminées" />
        </View>
      </Hero>

      {activeTop && (
        <ActiveDeliveryCard
          course={activeTop}
          onPress={() => router.push(`/(app)/course/${activeTop.id}`)}
          ctaLabel="Ouvrir la mission"
          ctaIcon="open-outline"
        />
      )}

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

const PROMO_KEY = 'oneway.promo.gps.v1';

/** Palette d'accent par service (cube / rocket / navigate). */
const SERVICE_ACCENTS = [
  { bg: colors.brand50, fg: colors.brand600 },
  { bg: '#FDECD8', fg: colors.amber600 },
  { bg: colors.greenBg, fg: colors.green },
];

function ClientHome() {
  const { user } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [code, setCode] = useState('');
  const [showPromo, setShowPromo] = useState(false);
  const [hidden, setHidden] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.phone) return;
    return subscribeClientCourses(user.phone, setCourses);
  }, [user?.phone]);

  useEffect(() => { getFavorites().then(setFavorites); }, []);
  useEffect(() => { AsyncStorage.getItem(PROMO_KEY).then((v) => setShowPromo(v !== '1')); }, []);
  useEffect(() => {
    if (!user) return;
    AsyncStorage.getItem(`oneway.hidden.${user.id}`).then((v) => setHidden(v ? JSON.parse(v) : [])).catch(() => {});
  }, [user?.id]);

  const dismissPromo = () => { setShowPromo(false); AsyncStorage.setItem(PROMO_KEY, '1').catch(() => {}); };
  function hideCourse(id: string) {
    Alert.alert('Supprimer de la liste', 'Retirer cette livraison de vos livraisons terminées ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => {
        const next = [...hidden, id];
        setHidden(next);
        if (user) AsyncStorage.setItem(`oneway.hidden.${user.id}`, JSON.stringify(next)).catch(() => {});
      } },
    ]);
  }

  const active = courses.filter((c) => !['LIVREE', 'ANNULEE'].includes(c.status));
  const done = courses.filter((c) => ['LIVREE', 'ANNULEE'].includes(c.status) && !hidden.includes(c.id));
  const activeTop = active.find((c) => c.status !== 'NOUVELLE') ?? active[0];
  const track = (c: string) => router.push(`/track?code=${encodeURIComponent(c)}`);

  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <ScrollView contentContainerStyle={styles.clientScroll} showsVerticalScrollIndicator={false}>
      {/* Héros de marque */}
      <Hero hello={`${hello}, ${user!.name.split(' ')[0]} 👋`} subtitle="Vos marchandises, suivies en temps réel 🇲🇬">
        <View style={styles.heroStats}>
          <HeroStat value={active.length} label="En cours" />
          <View style={styles.heroDivider} />
          <HeroStat value={done.length} label="Livrées" />
        </View>
      </Hero>

      {/* Bandeau nouveauté */}
      {showPromo && (
        <View style={styles.promo}>
          <Ionicons name="navigate-circle" size={20} color={colors.brand700} />
          <Text style={styles.promoText}>Nouveau : suivez votre camion en direct par GPS 🚚</Text>
          <Pressable onPress={dismissPromo} hitSlop={8}><Ionicons name="close" size={18} color={colors.inkMuted} /></Pressable>
        </View>
      )}

      {/* Livraison en cours — mise en avant */}
      {activeTop && <ActiveDeliveryCard course={activeTop} onPress={() => track(activeTop.code)} />}

      {/* CTA devis en vedette */}
      <Pressable onPress={() => router.push('/(app)/new-quote')} style={styles.ctaCard}>
        <View style={styles.ctaIcon}><Ionicons name="document-text" size={24} color={colors.ink} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.ctaTitle}>Demander un devis</Text>
          <Text style={styles.ctaSub}>Réponse rapide · gratuit · en 30 secondes</Text>
        </View>
        <Ionicons name="arrow-forward-circle" size={26} color={colors.ink} />
      </Pressable>

      {/* Suivre par code */}
      <Card style={{ padding: 14 }}>
        <Text style={styles.cardH}>📦 Suivre par code</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <Input value={code} onChangeText={(t) => setCode(t.toUpperCase())} autoCapitalize="characters" placeholder="Code de suivi (ex. OWTOA01)" style={{ flex: 1 }} />
          <Button title="" icon="search" onPress={() => code.trim() && track(code.trim())} style={{ paddingHorizontal: 18 }} />
        </View>
        {favorites.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 10 }}>
            {favorites.map((c) => (
              <Pressable key={c} onPress={() => track(c)} style={styles.favChip}>
                <Ionicons name="bookmark" size={13} color={colors.brand600} />
                <Text style={styles.favChipText}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </Card>

      {/* Nos services — liste verticale avec icônes */}
      <SectionTitle>Nos services</SectionTitle>
      {SERVICES.map((s, i) => {
        const accent = SERVICE_ACCENTS[i % SERVICE_ACCENTS.length];
        return (
          <Card key={s.title} style={styles.serviceRow}>
            <View style={[styles.serviceRowIcon, { backgroundColor: accent.bg }]}><Ionicons name={s.icon as any} size={24} color={accent.fg} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceRowTitle}>{s.title}</Text>
              <Text style={styles.serviceRowDesc}>{s.desc}</Text>
            </View>
          </Card>
        );
      })}

      {/* Bande de confiance */}
      <View style={styles.trust}>
        <TrustItem icon="navigate" text="Suivi GPS temps réel" />
        <TrustItem icon="cash-outline" text="Paiement à la livraison" />
        <TrustItem icon="map-outline" text="Toute l'île 🇲🇬" />
      </View>

      {/* Mes livraisons */}
      <SectionTitle>Mes livraisons</SectionTitle>
      {!user!.phone ? (
        <EmptyState icon="call-outline" title="Ajoutez votre téléphone" description="Vos livraisons sont reliées à votre numéro (Mon compte)." />
      ) : active.length === 0 && done.length === 0 ? (
        <EmptyState icon="cube-outline" title="Aucune livraison pour l'instant" description="Demandez un devis : vos courses apparaîtront ici avec leur suivi." />
      ) : (
        <>
          {active.map((c) => <CourseCard key={c.id} course={c} onPress={() => track(c.code)} />)}
          {done.length > 0 && <SectionTitle>Terminées</SectionTitle>}
          {done.map((c) => <DeliveryRecapCard key={c.id} course={c} onPress={() => track(c.code)} onDelete={() => hideCourse(c.id)} />)}
        </>
      )}

      {/* Besoin d'aide */}
      <Card style={styles.helpCard}>
        <Text style={styles.cardH}>Besoin d'aide ?</Text>
        <Text style={styles.muted}>Notre équipe vous répond rapidement.</Text>
        <Button title="Discuter sur WhatsApp" icon="logo-whatsapp" onPress={() => Linking.openURL(whatsappHref(COMPANY.whatsapp, 'Bonjour ONE WAY, je souhaite un renseignement.'))} style={{ marginTop: 12, backgroundColor: colors.green }} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <Button title="Appeler" icon="call" variant="outline" onPress={() => Linking.openURL(telHref(COMPANY.phoneIntl))} style={{ flex: 1 }} />
          <Button title="Email" icon="mail" variant="outline" onPress={() => Linking.openURL(emailHref(COMPANY.email, 'Demande de renseignement — ONE WAY'))} style={{ flex: 1 }} />
        </View>
      </Card>
    </ScrollView>
  );
}

/** En-tête « héros » de marque partagé (accueils client / gérant / chauffeur). */
function Hero({ hello, subtitle, children }: { hello: string; subtitle: string; children?: ReactNode }) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroBlob1} pointerEvents="none" />
      <View style={styles.heroBlob2} pointerEvents="none" />
      <Text style={styles.heroHello}>{hello}</Text>
      <Text style={styles.heroTagline}>{subtitle}</Text>
      {children}
    </View>
  );
}

function HeroStat({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

function ActionTile({ icon, label, bg, fg, onPress }: { icon: any; label: string; bg: string; fg: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.actionTile, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={22} color={fg} />
      <Text style={[styles.actionTileLabel, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

function TrustItem({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.trustItem}>
      <Ionicons name={icon} size={16} color={colors.brand600} />
      <Text style={styles.trustText} numberOfLines={2}>{text}</Text>
    </View>
  );
}

/** Carte « livraison en cours » : trajet + camion positionné selon l'avancement. */
function ActiveDeliveryCard({ course, onPress, ctaLabel = 'Suivre en direct', ctaIcon = 'navigate' }: { course: Course; onPress: () => void; ctaLabel?: string; ctaIcon?: any }) {
  const st = COURSE_STATUS[course.status];
  const remaining = kmRemaining(course);
  const pct = Math.max(6, Math.min(94, Math.round(course.progress * 100)));
  const isNew = course.status === 'NOUVELLE';
  return (
    <Pressable onPress={onPress} style={styles.activeCard}>
      <View style={styles.activeTop}>
        <Text style={styles.activeRef}>{course.reference}</Text>
        <Badge tone={st.tone}>{st.label}</Badge>
      </View>
      <Text style={styles.activeRoute}>{course.pickup.city} → {course.delivery.city}</Text>

      {/* Rail de progression avec camion */}
      <View style={styles.railWrap}>
        <View style={styles.rail} />
        <View style={[styles.railFill, { width: `${pct}%` }]} />
        <View style={[styles.railDot, styles.railStart]} />
        <View style={[styles.railDot, styles.railEnd]} />
        {!isNew && (
          <View style={[styles.truck, { left: `${pct}%` }]}>
            <Ionicons name="car" size={14} color={colors.white} />
          </View>
        )}
      </View>

      <View style={styles.activeBottom}>
        <View>
          <Text style={styles.activeKmLabel}>{isNew ? 'En préparation' : 'Km restants'}</Text>
          <Text style={styles.activeKmValue}>{isNew ? '—' : `${remaining} km`}</Text>
        </View>
        <View style={styles.suivreBtn}>
          <Ionicons name={ctaIcon} size={15} color={colors.white} />
          <Text style={styles.suivreText}>{ctaLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  clientScroll: { padding: 16, paddingBottom: 44, gap: 12 },
  muted: { color: colors.inkMuted, marginBottom: 8 },
  cardH: { fontWeight: '800', color: colors.ink, fontSize: 14 },
  quoteRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 10 },
  quoteName: { fontWeight: '700', color: colors.ink },

  // Héros
  hero: { backgroundColor: colors.brand950, borderRadius: 20, padding: 20, paddingTop: 22, overflow: 'hidden', position: 'relative' },
  heroBlob1: { position: 'absolute', width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(240,125,26,0.18)', top: -55, right: -35 },
  heroBlob2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(63,92,192,0.35)', bottom: -55, left: -25 },
  heroHello: { color: colors.white, fontSize: 22, fontWeight: '900' },
  heroTagline: { color: colors.brand100, fontSize: 13, marginTop: 4, fontWeight: '600' },
  heroStats: { flexDirection: 'row', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingVertical: 10, alignItems: 'center' },
  heroDivider: { width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.15)' },
  heroStatValue: { color: colors.white, fontSize: 22, fontWeight: '900' },
  heroStatLabel: { color: colors.brand100, fontSize: 11, fontWeight: '600', marginTop: 1 },

  // Promo
  promo: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.brand50, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.brand100 },
  promoText: { flex: 1, color: colors.brand700, fontSize: 13, fontWeight: '700' },

  // CTA devis
  ctaCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.amber500, borderRadius: 16, padding: 16 },
  ctaIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' },
  ctaTitle: { color: colors.ink, fontWeight: '900', fontSize: 16 },
  ctaSub: { color: colors.ink, opacity: 0.75, fontSize: 12, marginTop: 2, fontWeight: '600' },

  // Favoris (puces)
  favChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.brand50, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  favChipText: { color: colors.brand700, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },

  // Services (tuiles)
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  serviceRowIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  serviceRowTitle: { fontWeight: '800', color: colors.ink, fontSize: 15 },
  serviceRowDesc: { color: colors.inkMuted, fontSize: 12.5, lineHeight: 17, marginTop: 2 },

  // Confiance
  trust: { flexDirection: 'row', gap: 8 },
  trustItem: { flex: 1, alignItems: 'center', gap: 4, backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingVertical: 12, paddingHorizontal: 6 },
  trustText: { fontSize: 10.5, fontWeight: '700', color: colors.inkSoft, textAlign: 'center' },

  helpCard: { padding: 16, marginTop: 6 },

  // CA gérant + raccourcis
  caCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.brand100, padding: 16 },
  caLabel: { color: colors.inkMuted, fontSize: 12, fontWeight: '600' },
  caValue: { color: colors.ink, fontSize: 24, fontWeight: '900', marginTop: 2 },
  caIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.greenBg, alignItems: 'center', justifyContent: 'center' },
  actionTile: { flex: 1, alignItems: 'center', gap: 8, borderRadius: 16, paddingVertical: 18 },
  actionTileLabel: { fontWeight: '800', fontSize: 13 },

  // Livraison en cours
  activeCard: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.brand100, padding: 16 },
  activeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeRef: { fontWeight: '900', color: colors.brand700, fontSize: 14 },
  activeRoute: { fontWeight: '700', color: colors.ink, fontSize: 15, marginTop: 6 },
  railWrap: { height: 26, marginTop: 16, marginBottom: 2, justifyContent: 'center', position: 'relative' },
  rail: { position: 'absolute', left: 0, right: 0, height: 6, borderRadius: 3, backgroundColor: colors.slateBg },
  railFill: { position: 'absolute', left: 0, height: 6, borderRadius: 3, backgroundColor: colors.amber500 },
  railDot: { position: 'absolute', width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: colors.white, top: 7 },
  railStart: { left: 0, backgroundColor: colors.green },
  railEnd: { right: 0, backgroundColor: colors.red },
  truck: { position: 'absolute', width: 26, height: 26, borderRadius: 13, backgroundColor: colors.brand600, borderWidth: 2, borderColor: colors.white, alignItems: 'center', justifyContent: 'center', top: 0, marginLeft: -13 },
  activeBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 },
  activeKmLabel: { color: colors.inkMuted, fontSize: 11, fontWeight: '600' },
  activeKmValue: { color: colors.ink, fontSize: 24, fontWeight: '900' },
  suivreBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.brand600, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  suivreText: { color: colors.white, fontWeight: '800', fontSize: 13 },
});
