import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth';
import { Card, Button, Badge, SectionTitle, Input } from '@/components/ui';
import { LiveMap } from '@/components/LiveMap';
import { RouteLine } from '@/components/app';
import { subscribeDoc, subscribeTracking, getFreight, getUser, advanceShipment, leaveReview, reportIncident, saveSignature } from '@/firebase/db';
import { generateDocumentPdf } from '@/lib/pdf';
import { captureGeoPhoto, uploadPhoto, gpsLabel, type GeoPhoto } from '@/lib/capture';
import { SignaturePad, SignatureView } from '@/components/SignaturePad';
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

      <LiveMap
        from={{ ...freight.pickup, label: freight.pickup.city }}
        to={{ ...freight.delivery, label: freight.delivery.city }}
        current={{ lat: shipment.currentLat ?? freight.pickup.lat, lng: shipment.currentLng ?? freight.pickup.lng }}
        height={260}
      />

      <Card style={{ padding: 14, marginTop: 12 }}>
        <RouteLine from={freight.pickup.city} to={freight.delivery.city} />
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.round(shipment.progress * 100)}%` }]} /></View>
        <Text style={styles.muted}>{Math.round(shipment.progress * 100)} % · code {shipment.trackingCode} · {km(freight.distanceKm)}</Text>
      </Card>

      {canAdvance && <AdvanceCard shipment={shipment} by={user.id} />}
      {canAdvance && <IncidentButton shipment={shipment} by={user.id} />}

      {delivered && shipment.signature ? (
        <Card style={{ padding: 14, marginTop: 12 }}>
          <SectionTitle>Preuve de livraison</SectionTitle>
          <Text style={styles.muted}>Signature du destinataire</Text>
          <SignatureView d={shipment.signature} />
        </Card>
      ) : null}

      {counterpart && (
        <Card style={{ padding: 14, marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={styles.muted}>{isShipper ? 'Transporteur' : 'Chargeur'}</Text>
            <Text style={styles.cardName}>{counterpart.companyName ?? counterpart.name}</Text>
          </View>
          <Text style={{ fontWeight: '800', color: colors.ink }}>{money(shipment.price)}</Text>
        </Card>
      )}

      <Card style={{ padding: 14, marginTop: 12 }}>
        <SectionTitle>Documents</SectionTitle>
        <InvoiceButton freight={freight} shipment={shipment} client={isShipper ? user : counterpart} delivered={delivered} />
      </Card>

      <SectionTitle>Historique de suivi</SectionTitle>
      <Card style={{ padding: 14 }}>
        {events.length === 0 ? <Text style={styles.muted}>Aucun événement.</Text> : events.map((e, i) => (
          <View key={e.id} style={styles.event}>
            <View style={[styles.eventDot, { backgroundColor: i === events.length - 1 ? colors.amber500 : colors.brand600 }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.eventLabel}>{e.label}</Text>
              {e.note ? <Text style={styles.muted}>{e.note}</Text> : null}
              {e.photoUrl?.startsWith('http') ? (
                <Image source={{ uri: e.photoUrl }} style={styles.eventThumb} />
              ) : e.photoUrl ? (
                <Text style={{ color: colors.brand600, fontSize: 12 }}>📷 Photo jointe</Text>
              ) : null}
              <Text style={styles.eventTime}>{dateTimeFr(e.createdAt)}</Text>
            </View>
          </View>
        ))}
      </Card>

      {delivered && isShipper && counterpart && <ReviewCard shipment={shipment} toUser={counterpart} fromUserId={user.id} />}
    </ScrollView>
  );
}

function InvoiceButton({ freight, shipment, client, delivered }: { freight: Freight; shipment: Shipment; client: User | null; delivered: boolean }) {
  const [loading, setLoading] = useState(false);
  async function run() {
    setLoading(true);
    try {
      await generateDocumentPdf({ freight, shipment, client, type: delivered ? 'INVOICE' : 'QUOTE' });
    } catch (e: any) {
      Alert.alert('PDF', e?.message ?? 'Génération impossible');
    } finally {
      setLoading(false);
    }
  }
  return (
    <Button
      title={delivered ? 'Télécharger la facture (PDF)' : 'Télécharger le devis (PDF)'}
      icon="document-text-outline"
      variant="outline"
      onPress={run}
      loading={loading}
    />
  );
}

function AdvanceCard({ shipment, by }: { shipment: Shipment; by: string }) {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<GeoPhoto | null>(null);
  const [signature, setSignature] = useState('');
  const next = nextStatus(shipment.status);
  const isDelivery = next === 'DELIVERED';

  async function takePhoto() {
    const p = await captureGeoPhoto();
    if (p) setPhoto(p);
  }

  async function go() {
    if (!next) return;
    if (isDelivery && !signature) {
      Alert.alert('Signature requise', 'Faites signer le destinataire avant de confirmer la livraison.');
      return;
    }
    setLoading(true);
    try {
      let photoUrl: string | undefined;
      if (photo) photoUrl = await uploadPhoto(photo.uri);
      const fullNote = [note, gpsLabel(photo)].filter(Boolean).join(' · ') || undefined;
      if (isDelivery && signature) await saveSignature(shipment.id, signature);
      await advanceShipment(shipment, by, { note: fullNote, photoUrl });
      setNote(''); setPhoto(null); setSignature('');
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Action impossible');
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

      <Pressable onPress={takePhoto} style={[styles.photoBtn, photo && styles.photoActive]}>
        <Ionicons name="camera" size={16} color={photo ? colors.green : colors.inkMuted} />
        <Text style={[styles.muted, photo && { color: colors.green }]}>
          {photo ? `Photo jointe ✓${photo.lat != null ? ' · GPS' : ''}` : 'Prendre une photo géolocalisée'}
        </Text>
      </Pressable>
      {photo && <Image source={{ uri: photo.uri }} style={styles.thumb} />}

      {isDelivery && (
        <View style={{ marginTop: 12 }}>
          <Text style={[styles.muted, { marginBottom: 6 }]}>Signature du destinataire (preuve de livraison)</Text>
          <SignaturePad onChange={setSignature} />
        </View>
      )}

      <Button title={STATUS_ACTION[shipment.status] ?? `Passer à : ${STATUS_LABEL[next]}`} icon="checkmark-circle" variant="accent" onPress={go} loading={loading} style={{ marginTop: 10 }} />
    </Card>
  );
}

function IncidentButton({ shipment, by }: { shipment: Shipment; by: string }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<GeoPhoto | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!note.trim()) return Alert.alert('Incident', 'Décrivez l’incident.');
    setLoading(true);
    try {
      let photoUrl: string | undefined;
      if (photo) photoUrl = await uploadPhoto(photo.uri, 'incidents');
      await reportIncident(shipment, by, { note: note.trim(), photoUrl, lat: photo?.lat, lng: photo?.lng });
      setOpen(false); setNote(''); setPhoto(null);
      Alert.alert('Incident signalé', 'L’admin et le client ont été notifiés.');
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Envoi impossible');
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return <Button title="Signaler un incident" icon="warning-outline" variant="outline" onPress={() => setOpen(true)} style={{ marginTop: 12 }} />;
  }
  return (
    <Card style={{ padding: 14, marginTop: 12, borderColor: colors.red, borderWidth: 1 }}>
      <SectionTitle>Signaler un incident</SectionTitle>
      <Input value={note} onChangeText={setNote} placeholder="Ex : panne, route coupée, marchandise endommagée…" multiline />
      <Pressable onPress={async () => { const p = await captureGeoPhoto(); if (p) setPhoto(p); }} style={[styles.photoBtn, photo && styles.photoActive]}>
        <Ionicons name="camera" size={16} color={photo ? colors.green : colors.inkMuted} />
        <Text style={[styles.muted, photo && { color: colors.green }]}>{photo ? 'Photo jointe ✓' : 'Joindre une photo (optionnel)'}</Text>
      </Pressable>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <Button title="Annuler" variant="ghost" onPress={() => setOpen(false)} style={{ flex: 1 }} />
        <Button title="Envoyer" icon="send" onPress={submit} loading={loading} style={{ flex: 1 }} />
      </View>
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
  thumb: { width: '100%', height: 160, borderRadius: 10, marginTop: 8, backgroundColor: colors.slateBg },
  eventThumb: { width: 90, height: 64, borderRadius: 8, marginTop: 4, backgroundColor: colors.slateBg },
});
