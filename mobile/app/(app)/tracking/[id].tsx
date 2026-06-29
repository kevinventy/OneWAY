import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth';
import { Card, Button, Badge, SectionTitle, Input } from '@/components/ui';
import { RouteMap } from '@/components/RouteMap';
import { RouteLine } from '@/components/app';
import { subscribeDoc, subscribeTracking, getFreight, getUser, advanceShipment, leaveReview } from '@/firebase/db';
import { SHIPMENT_STATUS } from '@/lib/labels';
import { STATUS_ACTION, STATUS_LABEL, nextStatus } from '@/lib/flow';
import { money, dateTimeFr, km } from '@/lib/format';
import { colors, radius } from '@/theme';
import type { Freight, Shipment, TrackingEvent, User } from '@/lib/types';

export default function Tracking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [freight, setFreight] = useState<Freight | null>(null);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [counterpart, setCounterpart] = useState<User | null>(null);

  useEffect(() => {
    if (!id) return;
    const u1 = subscribeDoc<Shipment>('shipments', id, setShipment);
    const u2 = subscribeTracking(id, setEvents);
    return () => { u1(); u2(); };
  }, [id]);

  useEffect(() => {
    if (!shipment || !user) return;
    if (!freight) getFreight(shipment.freightId).then(setFreight);
    const otherId = user.id === shipment.shipperId ? shipment.carrierId : shipment.shipperId;
    getUser(otherId).then(setCounterpart);
  }, [shipment?.id]);

  if (!shipment || !freight || !user) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  const delivered = shipment.status === 'DELIVERED';
  const isShipper = user.id === shipment.shipperId;
  const canAdvance = !delivered && (user.id === shipment.carrierId || user.role === 'DRIVER' || user.role === 'CARRIER');

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.headRow}>
        <Text style={styles.ref}>{shipment.reference}</Text>
        <Badge tone={SHIPMENT_STATUS[shipment.status].tone}>{SHIPMENT_STATUS[shipment.status].label}</Badge>
      </View>
      <Text style={styles.title}>{freight.title}</Text>

      <RouteMap
        from={{ ...freight.pickup, label: freight.pickup.city }}
        to={{ ...freight.delivery, label: freight.delivery.city }}
        current={!delivered ? { lat: shipment.currentLat!, lng: shipment.currentLng! } : null}
        progress={shipment.progress}
        height={200}
      />

      <Card style={{ padding: 14, marginTop: 12 }}>
        <RouteLine from={freight.pickup.city} to={freight.delivery.city} />
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.round(shipment.progress * 100)}%` }]} /></View>
        <Text style={styles.muted}>{Math.round(shipment.progress * 100)} % · code {shipment.trackingCode} · {km(freight.distanceKm)}</Text>
      </Card>

      {canAdvance && <AdvanceCard shipment={shipment} by={user.id} />}

      {counterpart && (
        <Card style={{ padding: 14, marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={styles.muted}>{isShipper ? 'Transporteur' : 'Chargeur'}</Text>
            <Text style={styles.cardName}>{counterpart.companyName ?? counterpart.name}</Text>
          </View>
          <Text style={{ fontWeight: '800', color: colors.ink }}>{money(shipment.price)}</Text>
        </Card>
      )}

      <SectionTitle>Historique de suivi</SectionTitle>
      <Card style={{ padding: 14 }}>
        {events.length === 0 ? <Text style={styles.muted}>Aucun événement.</Text> : events.map((e, i) => (
          <View key={e.id} style={styles.event}>
            <View style={[styles.eventDot, { backgroundColor: i === events.length - 1 ? colors.amber500 : colors.brand600 }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.eventLabel}>{e.label}</Text>
              {e.note ? <Text style={styles.muted}>{e.note}</Text> : null}
              {e.photoUrl ? <Text style={{ color: colors.brand600, fontSize: 12 }}>📷 Photo jointe</Text> : null}
              <Text style={styles.eventTime}>{dateTimeFr(e.createdAt)}</Text>
            </View>
          </View>
        ))}
      </Card>

      {delivered && isShipper && counterpart && <ReviewCard shipment={shipment} toUser={counterpart} fromUserId={user.id} />}
    </ScrollView>
  );
}

function AdvanceCard({ shipment, by }: { shipment: Shipment; by: string }) {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState(false);
  const next = nextStatus(shipment.status);

  async function go() {
    setLoading(true);
    try {
      await advanceShipment(shipment, by, { note: note || undefined, photoUrl: photo ? 'photo://capture.jpg' : undefined });
      setNote(''); setPhoto(false);
    } finally {
      setLoading(false);
    }
  }

  if (!next) return null;
  return (
    <Card style={{ padding: 14, marginTop: 12 }}>
      <SectionTitle>Avancement de la mission</SectionTitle>
      <Text style={styles.muted}>État actuel : {STATUS_LABEL[shipment.status]}</Text>
      <Input value={note} onChangeText={setNote} placeholder="Note (optionnel)" style={{ marginTop: 10 }} />
      <Pressable onPress={() => setPhoto((p) => !p)} style={[styles.photoBtn, photo && styles.photoActive]}>
        <Ionicons name="camera" size={16} color={photo ? colors.green : colors.inkMuted} />
        <Text style={[styles.muted, photo && { color: colors.green }]}>{photo ? 'Photo jointe ✓' : 'Joindre une photo'}</Text>
      </Pressable>
      <Button title={STATUS_ACTION[shipment.status] ?? `Passer à : ${STATUS_LABEL[next]}`} icon="checkmark-circle" variant="accent" onPress={go} loading={loading} style={{ marginTop: 10 }} />
    </Card>
  );
}

function ReviewCard({ shipment, toUser, fromUserId }: { shipment: Shipment; toUser: User; fromUserId: string }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await leaveReview(shipment, fromUserId, toUser.id, rating, comment);
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (done) return <Card style={{ padding: 14, marginTop: 12 }}><Text style={{ color: colors.green }}>Merci ! Votre évaluation a été enregistrée. ⭐</Text></Card>;
  return (
    <Card style={{ padding: 14, marginTop: 12 }}>
      <SectionTitle>Évaluer {toUser.companyName ?? toUser.name}</SectionTitle>
      <View style={{ flexDirection: 'row', gap: 6, marginVertical: 8 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)}>
            <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={28} color={colors.amber500} />
          </Pressable>
        ))}
      </View>
      <Input value={comment} onChangeText={setComment} placeholder="Votre commentaire (optionnel)" multiline />
      <Button title="Envoyer l'évaluation" onPress={submit} loading={loading} style={{ marginTop: 10 }} />
    </Card>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ref: { fontSize: 13, fontWeight: '800', color: colors.brand600 },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink, marginTop: 4, marginBottom: 12 },
  muted: { color: colors.inkMuted, fontSize: 13 },
  cardName: { fontWeight: '700', color: colors.ink, fontSize: 15 },
  progressTrack: { height: 8, backgroundColor: colors.slateBg, borderRadius: 4, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.amber500, borderRadius: 4 },
  event: { flexDirection: 'row', gap: 12, paddingVertical: 8, borderLeftWidth: 0 },
  eventDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  eventLabel: { fontWeight: '700', color: colors.ink },
  eventTime: { color: colors.inkMuted, fontSize: 11, marginTop: 2 },
  photoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginTop: 8 },
  photoActive: { borderColor: colors.green, backgroundColor: colors.greenBg },
});
