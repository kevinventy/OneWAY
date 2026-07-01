import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Share, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth';
import { Card, EmptyState, SectionTitle } from '@/components/ui';
import { subscribeOwnerCourses, subscribeOwnerDrivers } from '@/firebase/db';
import { vehicleByKey } from '@/data/catalog';
import { money, moneyCompact } from '@/lib/format';
import { colors } from '@/theme';
import type { Course, Driver } from '@/lib/types';

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

export default function Dashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'GERANT') return;
    const u1 = subscribeOwnerCourses(user.id, setCourses);
    const u2 = subscribeOwnerDrivers(user.id, setDrivers);
    return () => { u1(); u2(); };
  }, [user?.id]);

  const stats = useMemo(() => {
    const delivered = courses.filter((c) => c.status === 'LIVREE');
    const active = courses.filter((c) => !['LIVREE', 'ANNULEE'].includes(c.status));
    const ca = delivered.reduce((s, c) => s + (c.price || 0), 0);
    const now = new Date();
    const thisKey = monthKey(now);
    const caMonth = delivered.filter((c) => monthKey(new Date(c.deliveredAt ?? c.createdAt)) === thisKey).reduce((s, c) => s + (c.price || 0), 0);
    const avg = delivered.length ? Math.round(ca / delivered.length) : 0;

    // 6 derniers mois
    const months: { label: string; revenue: number; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = monthKey(d);
      const rows = delivered.filter((c) => monthKey(new Date(c.deliveredAt ?? c.createdAt)) === k);
      months.push({ label: MONTHS[d.getMonth()], revenue: rows.reduce((s, c) => s + (c.price || 0), 0), count: rows.length });
    }

    // Par type de véhicule
    const byVehicle = new Map<string, number>();
    delivered.forEach((c) => byVehicle.set(c.vehicleType, (byVehicle.get(c.vehicleType) || 0) + (c.price || 0)));
    const vehicles = [...byVehicle.entries()].sort((a, b) => b[1] - a[1]);

    // Par chauffeur
    const byDriver = new Map<string, number>();
    delivered.forEach((c) => { if (c.driverId) byDriver.set(c.driverId, (byDriver.get(c.driverId) || 0) + (c.price || 0)); });

    // Top clients
    const byClient = new Map<string, { name: string; total: number; count: number }>();
    delivered.forEach((c) => {
      const key = c.client.phone || c.client.name;
      const cur = byClient.get(key) || { name: c.client.name, total: 0, count: 0 };
      cur.total += c.price || 0; cur.count += 1;
      byClient.set(key, cur);
    });
    const clients = [...byClient.values()].sort((a, b) => b.total - a.total).slice(0, 5);

    return { delivered, active, ca, caMonth, avg, months, vehicles, byDriver, clients, total: courses.length };
  }, [courses]);

  if (!user) return null;
  if (user.role !== 'GERANT') return <View style={styles.center}><Text style={styles.muted}>Réservé au gérant.</Text></View>;

  const driverName = (id: string) => drivers.find((d) => d.id === id)?.name ?? 'Chauffeur';
  const maxRev = Math.max(1, ...stats.months.map((m) => m.revenue));

  function shareRecap() {
    const lines = [
      `📊 Récap ONE WAY — ${user!.companyName ?? ''}`,
      `CA livré total : ${money(stats.ca)}`,
      `CA ce mois : ${money(stats.caMonth)}`,
      `Courses livrées : ${stats.delivered.length} · Actives : ${stats.active.length}`,
      `Panier moyen : ${money(stats.avg)}`,
      '',
      'Top clients :',
      ...stats.clients.map((c, i) => `${i + 1}. ${c.name} — ${money(c.total)} (${c.count})`),
    ];
    Share.share({ message: lines.join('\n') });
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.blob1} pointerEvents="none" />
        <Text style={styles.heroLabel}>Chiffre d'affaires livré</Text>
        <Text style={styles.heroValue}>{money(stats.ca)}</Text>
        <Text style={styles.heroSub}>Ce mois : {money(stats.caMonth)} · Panier moyen {money(stats.avg)}</Text>
      </View>

      <View style={styles.row}>
        <Mini label="Courses" value={stats.total} tone={colors.brand600} />
        <Mini label="Livrées" value={stats.delivered.length} tone={colors.green} />
        <Mini label="Actives" value={stats.active.length} tone={colors.amber600} />
      </View>

      {/* Graphe 6 mois */}
      <SectionTitle right={<Pressable onPress={shareRecap}><Text style={styles.share}>Partager</Text></Pressable>}>CA sur 6 mois</SectionTitle>
      <Card style={{ padding: 14 }}>
        {stats.ca === 0 ? (
          <Text style={styles.muted}>Aucune course livrée pour l'instant.</Text>
        ) : (
          <View style={styles.chart}>
            {stats.months.map((m, i) => (
              <View key={i} style={styles.barCol}>
                <Text style={styles.barVal}>{m.revenue > 0 ? moneyCompact(m.revenue).replace(' Ar', '') : ''}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.bar, { height: `${Math.round((m.revenue / maxRev) * 100)}%` }]} />
                </View>
                <Text style={styles.barLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* Par véhicule */}
      {stats.vehicles.length > 0 && (
        <>
          <SectionTitle>Revenus par véhicule</SectionTitle>
          <Card style={{ padding: 6 }}>
            {stats.vehicles.map(([key, total]) => (
              <Row key={key} icon="car-outline" label={vehicleByKey(key as any).label} value={money(total)} />
            ))}
          </Card>
        </>
      )}

      {/* Par chauffeur */}
      {stats.byDriver.size > 0 && (
        <>
          <SectionTitle>Revenus par chauffeur</SectionTitle>
          <Card style={{ padding: 6 }}>
            {[...stats.byDriver.entries()].sort((a, b) => b[1] - a[1]).map(([id, total]) => (
              <Row key={id} icon="person-outline" label={driverName(id)} value={money(total)} />
            ))}
          </Card>
        </>
      )}

      {/* Top clients */}
      <SectionTitle>Top clients</SectionTitle>
      {stats.clients.length === 0 ? (
        <EmptyState icon="people-outline" title="Aucun client livré" description="Les meilleurs clients apparaîtront ici." />
      ) : (
        <Card style={{ padding: 6 }}>
          {stats.clients.map((c, i) => (
            <Row key={i} icon="ribbon-outline" label={`${c.name}`} sub={`${c.count} course${c.count > 1 ? 's' : ''}`} value={money(c.total)} />
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

function Mini({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Card style={styles.mini}>
      <Text style={[styles.miniValue, { color: tone }]}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </Card>
  );
}

function Row({ icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <View style={styles.rowItem}>
      <Ionicons name={icon} size={18} color={colors.brand600} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel} numberOfLines={1}>{label}</Text>
        {sub ? <Text style={styles.muted}>{sub}</Text> : null}
      </View>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 44, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.inkMuted, fontSize: 13 },
  hero: { backgroundColor: colors.brand950, borderRadius: 20, padding: 20, overflow: 'hidden', position: 'relative' },
  blob1: { position: 'absolute', width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(240,125,26,0.18)', top: -55, right: -35 },
  heroLabel: { color: colors.brand100, fontSize: 13, fontWeight: '600' },
  heroValue: { color: colors.white, fontSize: 30, fontWeight: '900', marginTop: 4 },
  heroSub: { color: colors.brand100, fontSize: 12, marginTop: 6 },
  row: { flexDirection: 'row', gap: 10 },
  mini: { flex: 1, padding: 14, alignItems: 'center' },
  miniValue: { fontSize: 24, fontWeight: '900' },
  miniLabel: { fontSize: 11, color: colors.inkMuted, fontWeight: '600', marginTop: 2 },
  share: { color: colors.brand600, fontWeight: '700', fontSize: 13 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 160, gap: 6 },
  barCol: { flex: 1, alignItems: 'center' },
  barTrack: { width: '70%', flex: 1, justifyContent: 'flex-end', backgroundColor: colors.slateBg, borderRadius: 6, marginTop: 4, overflow: 'hidden' },
  bar: { width: '100%', backgroundColor: colors.brand600, borderRadius: 6, minHeight: 3 },
  barVal: { fontSize: 9, color: colors.inkMuted, fontWeight: '700', height: 12 },
  barLabel: { fontSize: 10, color: colors.inkMuted, marginTop: 4 },
  rowItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: colors.slateBg },
  rowLabel: { fontWeight: '700', color: colors.ink, fontSize: 14 },
  rowValue: { fontWeight: '800', color: colors.brand700, fontSize: 14 },
});
