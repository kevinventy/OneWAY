import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Linking, Share, Alert, Modal, TextInput, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth';
import { Card, Button, Badge } from '@/components/ui';
import { OsmMap } from '@/components/OsmMap';
import { PodModal } from '@/components/PodModal';
import { Stepper } from '@/components/app';
import {
  subscribeCourse, subscribeEvents, subscribeOwnerDrivers,
  assignCourse, advanceCourse, cancelCourse, updateCoursePrice,
} from '@/firebase/db';
import { useDriverLocation } from '@/lib/useDriverLocation';
import { openNavigation } from '@/lib/maps';
import { shareCourseDocument } from '@/lib/invoice';
import { COURSE_STATUS } from '@/lib/labels';
import { STATUS_ACTION, nextStatus } from '@/lib/flow';
import { cargoByKey, vehicleByKey } from '@/data/catalog';
import { money, km, dateTimeFr } from '@/lib/format';
import { kmRemaining, type Course, type Driver, type TrackingEvent } from '@/lib/types';
import { colors } from '@/theme';

export default function CourseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [busy, setBusy] = useState(false);
  const [priceModal, setPriceModal] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [podOpen, setPodOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const u1 = subscribeCourse(id, setCourse);
    const u2 = subscribeEvents(id, setEvents);
    return () => { u1(); u2(); };
  }, [id]);

  useEffect(() => {
    if (!user || user.role !== 'GERANT') return;
    return subscribeOwnerDrivers(user.id, setDrivers);
  }, [user?.id]);

  // Le chauffeur affecté partage sa position GPS en direct pendant la mission.
  const shareGps =
    !!course && !!user && user.role === 'CHAUFFEUR' && course.driverUserId === user.id &&
    !['LIVREE', 'ANNULEE', 'NOUVELLE'].includes(course.status);
  useDriverLocation(course, shareGps);

  if (!user) return null;
  if (!course) return <View style={styles.center}><Text style={styles.muted}>Chargement…</Text></View>;

  const isOwner = user.role === 'GERANT' && course.ownerId === user.id;
  const isDriver = user.role === 'CHAUFFEUR' && course.driverUserId === user.id;
  if (!isOwner && !isDriver) {
    return <View style={styles.center}><Text style={styles.muted}>Course introuvable.</Text></View>;
  }

  const st = COURSE_STATUS[course.status];
  const active = !['LIVREE', 'ANNULEE'].includes(course.status);
  const remaining = kmRemaining(course);
  const next = nextStatus(course.status);

  async function advance() {
    // La confirmation de livraison passe par la preuve de livraison (POD).
    if (nextStatus(course!.status) === 'LIVREE') { setPodOpen(true); return; }
    setBusy(true);
    try { await advanceCourse(course!, user!.id); } catch (e: any) { Alert.alert('Erreur', e?.message ?? 'Action impossible'); } finally { setBusy(false); }
  }
  function navigate() {
    const goPickup = ['ASSIGNEE', 'EN_ROUTE_RAMASSAGE'].includes(course!.status);
    const t = goPickup ? course!.pickup : course!.delivery;
    openNavigation(t.lat, t.lng);
  }
  async function shareDoc() {
    try {
      await shareCourseDocument(course!, course!.status === 'LIVREE' ? 'RECU' : 'FACTURE', Date.now());
    } catch (e: any) { Alert.alert('Erreur', e?.message ?? 'Génération PDF impossible'); }
  }
  async function assign(driver: Driver) {
    setBusy(true);
    try { await assignCourse(course!, driver); } catch (e: any) { Alert.alert('Erreur', e?.message ?? 'Affectation impossible'); } finally { setBusy(false); }
  }
  function confirmCancel() {
    Alert.alert('Annuler la course', `Confirmer l'annulation de ${course!.reference} ?`, [
      { text: 'Retour', style: 'cancel' },
      { text: 'Annuler la course', style: 'destructive', onPress: async () => { setBusy(true); try { await cancelCourse(course!); } finally { setBusy(false); } } },
    ]);
  }
  function shareCode() {
    Share.share({ message: `Suivez votre livraison ONE WAY ${course!.reference} en temps réel.\nCode de suivi : ${course!.code}` });
  }
  function openPriceModal() {
    setPriceInput(String(course!.price ?? ''));
    setPriceModal(true);
  }
  async function savePrice() {
    const value = Number(priceInput.replace(/[^\d]/g, '')) || 0;
    setPriceModal(false);
    try { await updateCoursePrice(course!.id, value); } catch (e: any) { Alert.alert('Erreur', e?.message ?? 'Prix non enregistré'); }
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.headRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.ref}>{course.reference}</Text>
          <Text style={styles.route}>{course.pickup.city} → {course.delivery.city}</Text>
        </View>
        <Badge tone={st.tone}>{st.label}</Badge>
      </View>

      {/* Km restants — gros (utile chauffeur & gérant) */}
      <Card style={styles.kmCard}>
        <View>
          <Text style={styles.kmCardLabel}>Kilomètres restants</Text>
          <Text style={styles.kmCardValue}>{course.status === 'LIVREE' ? '0' : remaining} km</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.kmCardLabel}>Distance</Text>
          <Text style={styles.kmCardSub}>{km(course.distanceKm)}</Text>
        </View>
      </Card>

      <OsmMap
        height={230}
        route={course.routeGeometry}
        from={{ lat: course.pickup.lat, lng: course.pickup.lng, label: course.pickup.city }}
        to={{ lat: course.delivery.lat, lng: course.delivery.lng, label: course.delivery.city }}
        current={active && course.currentLat != null ? { lat: course.currentLat, lng: course.currentLng! } : null}
        kmRemaining={active ? remaining : undefined}
      />
      {shareGps && (
        <View style={styles.gpsHint}>
          <Ionicons name="navigate-circle" size={16} color={colors.green} />
          <Text style={styles.gpsHintText}>Position GPS partagée en direct — continue même écran verrouillé</Text>
        </View>
      )}

      <Card style={{ padding: 14 }}><Stepper status={course.status} /></Card>

      {/* Action principale */}
      {course.status === 'NOUVELLE' && isOwner && (
        <Card style={{ padding: 14 }}>
          <Text style={styles.h}>Affecter un chauffeur</Text>
          {drivers.length === 0 ? (
            <Text style={styles.muted}>Aucun chauffeur. Ils peuvent rejoindre via votre code entreprise (Flotte).</Text>
          ) : drivers.map((d) => (
            <Pressable key={d.id} onPress={() => assign(d)} disabled={busy} style={styles.driverRow}>
              <Ionicons name="person-circle-outline" size={26} color={colors.brand600} />
              <View style={{ flex: 1 }}>
                <Text style={styles.driverName}>{d.name}</Text>
                <Text style={styles.muted}>{d.status === 'DISPONIBLE' ? 'Disponible' : d.status === 'EN_MISSION' ? 'En mission' : 'Hors ligne'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.inkMuted} />
            </Pressable>
          ))}
        </Card>
      )}

      {course.status !== 'NOUVELLE' && next && (
        <Button title={STATUS_ACTION[course.status] ?? 'Étape suivante'} icon="chevron-forward-circle" onPress={advance} loading={busy} style={{ paddingVertical: 16 }} />
      )}
      {course.status === 'LIVREE' && (
        <Card style={styles.doneCard}><Ionicons name="checkmark-circle" size={20} color={colors.green} /><Text style={styles.doneText}>Livraison confirmée</Text></Card>
      )}

      {/* Preuve de livraison */}
      {course.status === 'LIVREE' && (course.podRecipient || course.podSignature || course.podPhotoUrl) && (
        <Card style={{ padding: 14 }}>
          <Text style={styles.h}>Preuve de livraison</Text>
          {course.podRecipient ? (
            <Text style={styles.muted}>Reçu par <Text style={{ fontWeight: '700', color: colors.ink }}>{course.podRecipient}</Text>{course.podAt ? ` · ${dateTimeFr(course.podAt)}` : ''}</Text>
          ) : null}
          {course.podPhotoUrl ? <Image source={{ uri: course.podPhotoUrl }} style={styles.podPhoto} /> : null}
          {course.podSignature ? (
            <View style={styles.podSigWrap}><Image source={{ uri: course.podSignature }} style={styles.podSig} resizeMode="contain" /></View>
          ) : null}
        </Card>
      )}

      {/* Document PDF (gérant) */}
      {isOwner && course.status !== 'ANNULEE' && (
        <Button title={course.status === 'LIVREE' ? 'Reçu PDF — partager' : 'Facture PDF — partager'} icon="document-text-outline" variant="outline" onPress={shareDoc} />
      )}

      {/* Navigation GPS (chauffeur) */}
      {isDriver && active && (
        <Button
          title={['ASSIGNEE', 'EN_ROUTE_RAMASSAGE'].includes(course.status) ? 'Naviguer vers le chargement' : 'Naviguer vers la livraison'}
          icon="navigate"
          variant="outline"
          onPress={navigate}
        />
      )}

      {/* Appeler le client */}
      <Button title={`Appeler ${course.client.name}`} icon="call" variant="primary" onPress={() => Linking.openURL(`tel:${course.client.phone}`)} style={{ backgroundColor: colors.green }} />

      {/* Partage code (gérant) */}
      {isOwner && course.status !== 'ANNULEE' && (
        <Card style={styles.codeCard}>
          <Text style={styles.codeLabel}>Code de suivi client</Text>
          <Text style={styles.code}>{course.code}</Text>
          <Button title="Partager au client" icon="share-social" variant="outline" onPress={shareCode} style={{ marginTop: 8 }} />
        </Card>
      )}

      {/* Détails */}
      <Card style={{ padding: 14 }}>
        <Detail icon="person-outline" label="Client" main={course.client.name} sub={course.client.phone} />
        <Detail icon="location-outline" label="Chargement" main={course.pickup.address} sub={course.pickup.city} />
        <Detail icon="flag-outline" label="Livraison" main={course.delivery.address} sub={course.delivery.city} />
        <Detail icon="cube-outline" label="Marchandise" main={cargoByKey(course.cargoType).label} sub={`${course.weightKg.toLocaleString('fr-FR')} kg · ${course.cargoDescription}`} />
        <Detail icon="car-outline" label="Véhicule" main={vehicleByKey(course.vehicleType).label} sub={vehicleByKey(course.vehicleType).capacityLabel} last />
        {isOwner && (
          <Pressable onPress={openPriceModal} style={styles.priceRow}>
            <Text style={styles.muted}>Prix</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.price}>{money(course.price)}</Text>
              <Ionicons name="create-outline" size={18} color={colors.brand600} />
            </View>
          </Pressable>
        )}
      </Card>

      {/* Historique */}
      {events.length > 0 && (
        <Card style={{ padding: 14 }}>
          <Text style={styles.h}>Historique</Text>
          {[...events].reverse().map((e) => (
            <View key={e.id} style={styles.evRow}>
              <View style={styles.evDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.evLabel}>{e.label}</Text>
                <Text style={styles.muted}>{dateTimeFr(e.createdAt)}</Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* Annulation (gérant) */}
      {isOwner && active && (
        <Button title="Annuler la course" icon="ban-outline" variant="outline" onPress={confirmCancel} style={{ borderColor: colors.red }} />
      )}

      {/* Preuve de livraison (chauffeur/gérant) */}
      <PodModal visible={podOpen} course={course} by={user.id} onClose={() => setPodOpen(false)} onDone={() => setPodOpen(false)} />

      {/* Modifier le prix (gérant) */}
      <Modal visible={priceModal} transparent animationType="fade" onRequestClose={() => setPriceModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPriceModal(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Modifier le prix</Text>
            <Text style={styles.muted}>Prix de la course {course.reference} (Ar)</Text>
            <TextInput
              value={priceInput}
              onChangeText={setPriceInput}
              keyboardType="numeric"
              autoFocus
              placeholder="Ex. 1 650 000"
              placeholderTextColor={colors.inkMuted}
              style={styles.modalInput}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <Button title="Annuler" variant="outline" onPress={() => setPriceModal(false)} style={{ flex: 1 }} />
              <Button title="Enregistrer" icon="checkmark" onPress={savePrice} style={{ flex: 1 }} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

function Detail({ icon, label, main, sub, last }: { icon: any; label: string; main: string; sub: string; last?: boolean }) {
  return (
    <View style={[styles.detail, !last && styles.detailBorder]}>
      <Ionicons name={icon} size={18} color={colors.inkMuted} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailMain}>{main}</Text>
        <Text style={styles.muted}>{sub}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  ref: { fontSize: 20, fontWeight: '900', color: colors.ink },
  route: { color: colors.inkSoft, fontWeight: '600', marginTop: 2 },
  muted: { color: colors.inkMuted, fontSize: 13 },
  kmCard: { padding: 18, backgroundColor: colors.brand600, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderColor: colors.brand600 },
  kmCardLabel: { color: colors.brand100, fontSize: 12, fontWeight: '600' },
  kmCardValue: { color: '#fff', fontSize: 32, fontWeight: '900' },
  kmCardSub: { color: '#fff', fontSize: 16, fontWeight: '700' },
  h: { fontSize: 14, fontWeight: '800', color: colors.ink, marginBottom: 10 },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.slateBg },
  driverName: { fontWeight: '700', color: colors.ink },
  doneCard: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', padding: 14, backgroundColor: colors.greenBg, borderColor: colors.greenBg },
  doneText: { color: colors.green, fontWeight: '800' },
  codeCard: { padding: 14, alignItems: 'center', borderColor: colors.brand100 },
  codeLabel: { color: colors.inkMuted, fontSize: 12, fontWeight: '600' },
  code: { fontSize: 26, fontWeight: '900', color: colors.brand700, letterSpacing: 3, marginTop: 4 },
  detail: { flexDirection: 'row', gap: 10, paddingVertical: 10 },
  detailBorder: { borderBottomWidth: 1, borderBottomColor: colors.slateBg },
  detailLabel: { fontSize: 11, color: colors.inkMuted, fontWeight: '600', textTransform: 'uppercase' },
  detailMain: { fontSize: 14, fontWeight: '700', color: colors.ink, marginTop: 1 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 },
  price: { fontSize: 18, fontWeight: '900', color: colors.ink },
  podPhoto: { width: '100%', height: 180, borderRadius: 10, marginTop: 10, backgroundColor: colors.slateBg },
  podSigWrap: { marginTop: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: '#fff', padding: 6 },
  podSig: { width: '100%', height: 90 },
  gpsHint: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.greenBg, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: -4 },
  gpsHintText: { color: colors.green, fontSize: 12, fontWeight: '700', flexShrink: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', backgroundColor: colors.white, borderRadius: 16, padding: 18 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: colors.ink, marginBottom: 4 },
  modalInput: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 18, fontWeight: '700', color: colors.ink, marginTop: 10 },
  evRow: { flexDirection: 'row', gap: 10, paddingVertical: 6 },
  evDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.brand500, marginTop: 5 },
  evLabel: { fontWeight: '600', color: colors.ink },
});
