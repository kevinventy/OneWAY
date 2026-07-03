import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Badge, Avatar } from './ui';
import { LogoMark } from './Logo';
import { COURSE_STATUS } from '@/lib/labels';
import { STATUS_FLOW } from '@/lib/flow';
import { money, km } from '@/lib/format';
import { cargoByKey } from '@/data/catalog';
import { kmRemaining, type Course, type CourseStatus } from '@/lib/types';
import { colors } from '@/theme';

export function AppHeader({ name, color, unread }: { name: string; color: string; unread: number }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <LogoMark size={30} />
      <Text style={styles.brand}>ONE<Text style={{ color: colors.amber500 }}> WAY</Text></Text>
      <View style={{ flex: 1 }} />
      <Pressable onPress={() => router.push('/(app)/notifications')} style={styles.bell}>
        <Ionicons name="notifications-outline" size={22} color={colors.inkSoft} />
        {unread > 0 && <View style={styles.dot}><Text style={styles.dotText}>{unread}</Text></View>}
      </Pressable>
      <Pressable onPress={() => router.push('/(app)/profile')}>
        <Avatar name={name} color={color} size={34} />
      </Pressable>
    </View>
  );
}

export function RouteLine({ from, to }: { from: string; to: string }) {
  return (
    <View style={styles.routeLine}>
      <View style={[styles.rdot, { backgroundColor: colors.green }]} />
      <Text style={styles.routeCity} numberOfLines={1}>{from}</Text>
      <Ionicons name="arrow-forward" size={13} color={colors.inkMuted} />
      <View style={[styles.rdot, { backgroundColor: colors.red }]} />
      <Text style={styles.routeCity} numberOfLines={1}>{to}</Text>
    </View>
  );
}

export function CourseCard({
  course,
  onPress,
  driverName,
  showPrice = true,
}: {
  course: Course;
  onPress: () => void;
  driverName?: string;
  showPrice?: boolean;
}) {
  const st = COURSE_STATUS[course.status];
  const active = !['LIVREE', 'ANNULEE', 'NOUVELLE'].includes(course.status);
  const remaining = kmRemaining(course);
  return (
    <Pressable onPress={onPress}>
      <Card style={{ padding: 14, marginBottom: 10 }}>
        <View style={styles.row}>
          <Text style={styles.ref}>{course.reference}</Text>
          <Badge tone={st.tone}>{st.label}</Badge>
        </View>
        <View style={{ marginTop: 8 }}><RouteLine from={course.pickup.city} to={course.delivery.city} /></View>
        {active && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(course.progress * 100)}%` }]} />
          </View>
        )}
        <View style={[styles.footer]}>
          <Text style={styles.muted} numberOfLines={1}>
            <Ionicons name="person-outline" size={12} color={colors.inkMuted} /> {driverName ?? course.client.name}
          </Text>
          {active ? (
            <Text style={styles.kmText}><Ionicons name="navigate" size={12} color={colors.brand600} /> {km(remaining)} restants</Text>
          ) : showPrice ? (
            <Text style={styles.price}>{money(course.price)}</Text>
          ) : (
            <Text style={styles.muted}>{km(course.distanceKm)}</Text>
          )}
        </View>
      </Card>
    </Pressable>
  );
}

/** Carte récapitulative d'une livraison terminée : réf · trajet · marchandise · client, avec suppression. */
export function DeliveryRecapCard({ course, onPress, onDelete }: { course: Course; onPress?: () => void; onDelete?: () => void }) {
  const st = COURSE_STATUS[course.status];
  return (
    <Card style={{ padding: 14, marginBottom: 10 }}>
      <View style={styles.recapTop}>
        <Text style={styles.ref}>{course.reference}</Text>
        <Badge tone={st.tone}>{st.label}</Badge>
        <View style={{ flex: 1 }} />
        {onDelete && (
          <Pressable onPress={onDelete} hitSlop={10} style={styles.recapDel}>
            <Ionicons name="trash-outline" size={18} color={colors.red} />
          </Pressable>
        )}
      </View>
      <Pressable onPress={onPress} disabled={!onPress}>
        <View style={{ marginTop: 8 }}><RouteLine from={course.pickup.city} to={course.delivery.city} /></View>
        <View style={styles.recapRow}>
          <Ionicons name="cube-outline" size={14} color={colors.inkMuted} />
          <Text style={styles.recapText} numberOfLines={1}>{cargoByKey(course.cargoType).label} · {course.weightKg.toLocaleString('fr-FR')} kg</Text>
        </View>
        <View style={styles.recapRow}>
          <Ionicons name="person-outline" size={14} color={colors.inkMuted} />
          <Text style={styles.recapText} numberOfLines={1}>{course.client.name}</Text>
        </View>
      </Pressable>
    </Card>
  );
}

/** Indicateur d'étapes (chargement → livraison). */
export function Stepper({ status }: { status: CourseStatus }) {
  if (status === 'ANNULEE') {
    return <View style={styles.cancelled}><Text style={styles.cancelledText}>Course annulée</Text></View>;
  }
  const activeIndex = status === 'NOUVELLE' ? -1 : STATUS_FLOW.indexOf(status);
  return (
    <View style={styles.stepper}>
      {STATUS_FLOW.map((s, i) => {
        const done = i < activeIndex || status === 'LIVREE';
        const isCurrent = i === activeIndex && status !== 'LIVREE';
        return (
          <View key={s} style={styles.step}>
            <View style={[styles.stepDot, done ? styles.stepDone : isCurrent ? styles.stepCurrent : styles.stepTodo]}>
              {done ? <Ionicons name="checkmark" size={11} color="#fff" /> : <Text style={[styles.stepNum, isCurrent && { color: colors.brand600 }]}>{i + 1}</Text>}
            </View>
            <Text style={[styles.stepLabel, isCurrent && { color: colors.brand700, fontWeight: '700' }]} numberOfLines={2}>
              {COURSE_STATUS[s].label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  brand: { fontSize: 18, fontWeight: '900', color: colors.ink },
  bell: { padding: 6 },
  dot: { position: 'absolute', top: 0, right: 0, backgroundColor: colors.red, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  dotText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ref: { fontSize: 13, fontWeight: '800', color: colors.brand600 },
  routeLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rdot: { width: 8, height: 8, borderRadius: 4 },
  routeCity: { fontWeight: '700', color: colors.ink, fontSize: 13, maxWidth: 120 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, borderTopWidth: 1, borderTopColor: colors.slateBg, paddingTop: 10 },
  muted: { fontSize: 12, color: colors.inkMuted, flexShrink: 1 },
  kmText: { fontSize: 13, fontWeight: '700', color: colors.brand700 },
  price: { fontSize: 15, fontWeight: '800', color: colors.ink },
  recapTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recapDel: { padding: 2 },
  recapRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  recapText: { flex: 1, fontSize: 13, color: colors.inkSoft, fontWeight: '600' },
  progressTrack: { height: 6, backgroundColor: colors.slateBg, borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.amber500, borderRadius: 3 },
  stepper: { flexDirection: 'row', justifyContent: 'space-between' },
  step: { flex: 1, alignItems: 'center', gap: 4 },
  stepDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  stepDone: { backgroundColor: colors.brand600, borderColor: colors.brand600 },
  stepCurrent: { backgroundColor: colors.white, borderColor: colors.brand600 },
  stepTodo: { backgroundColor: colors.white, borderColor: colors.border },
  stepNum: { fontSize: 10, fontWeight: '800', color: colors.inkMuted },
  stepLabel: { fontSize: 8.5, color: colors.inkMuted, textAlign: 'center' },
  cancelled: { backgroundColor: colors.slateBg, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  cancelledText: { color: colors.inkMuted, fontWeight: '700' },
});
