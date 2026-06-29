import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth';
import { Card, Button, Badge, Field, Input, SectionTitle, Avatar, Stars } from '@/components/ui';
import { RouteMap } from '@/components/RouteMap';
import { RouteLine } from '@/components/app';
import {
  subscribeDoc, subscribeBids, subscribeShipmentByFreight, placeBid, acceptBid, matchCarriers, getUser,
  type MatchSuggestion,
} from '@/firebase/db';
import { computeQuote, quickEstimate } from '@/lib/pricing';
import { money, km, dateFr } from '@/lib/format';
import { vehicleByKey, cargoByKey } from '@/data/catalog';
import { FREIGHT_STATUS } from '@/lib/labels';
import { colors, radius } from '@/theme';
import type { Bid, Freight, Shipment, User } from '@/lib/types';

export default function FreightDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [freight, setFreight] = useState<Freight | null>(null);
  const [shipment, setShipment] = useState<Shipment | null>(null);

  useEffect(() => {
    if (!id) return;
    const u1 = subscribeDoc<Freight>('freights', id, setFreight);
    const u2 = subscribeShipmentByFreight(id, setShipment);
    return () => { u1(); u2(); };
  }, [id]);

  if (!freight || !user) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  const v = vehicleByKey(freight.vehicleType);
  const c = cargoByKey(freight.cargoType);
  const isOwner = user.id === freight.shipperId;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.headRow}>
        <Text style={styles.ref}>{freight.reference}</Text>
        <Badge tone={FREIGHT_STATUS[freight.status].tone}>{FREIGHT_STATUS[freight.status].label}</Badge>
      </View>
      <Text style={styles.title}>{freight.title}</Text>

      <RouteMap
        from={{ ...freight.pickup, label: freight.pickup.city }}
        to={{ ...freight.delivery, label: freight.delivery.city }}
        current={shipment && shipment.status !== 'DELIVERED' ? { lat: shipment.currentLat!, lng: shipment.currentLng! } : null}
        progress={shipment?.progress ?? 0}
        height={200}
      />

      <Card style={{ padding: 14, marginTop: 12 }}>
        <RouteLine from={`${freight.pickup.city} — ${freight.pickup.address}`} to={`${freight.delivery.city} — ${freight.delivery.address}`} />
        <View style={styles.grid}>
          <Info label="Distance" value={km(freight.distanceKm)} />
          <Info label="Durée" value={freight.durationH ? `${freight.durationH} h` : '—'} />
          <Info label="Poids" value={`${(freight.weightKg / 1000).toLocaleString('fr-FR')} t`} />
          <Info label="Véhicule" value={`${v.emoji} ${v.label}`} />
          <Info label="Marchandise" value={`${c.emoji} ${c.label}`} />
          <Info label="Chargement" value={dateFr(freight.pickupDate)} />
        </View>
      </Card>

      <Card style={{ padding: 14, marginTop: 12, backgroundColor: colors.brand950 }}>
        <Text style={{ color: colors.brand100, fontSize: 12 }}>{freight.pricingMode === 'AUCTION' ? 'Enchère · départ' : 'Prix proposé'}</Text>
        <Text style={{ color: colors.white, fontSize: 26, fontWeight: '900' }}>{money(freight.budget)}</Text>
      </Card>

      {shipment && (
        <Button title="Suivre l'expédition" icon="navigate" onPress={() => router.push(`/(app)/tracking/${shipment.id}`)} style={{ marginTop: 12 }} />
      )}

      {isOwner ? <ShipperView freight={freight} canAccept={freight.status === 'PUBLISHED'} /> : <CarrierBid freight={freight} user={user} />}
    </ScrollView>
  );
}

function ShipperView({ freight, canAccept }: { freight: Freight; canAccept: boolean }) {
  const router = useRouter();
  const [bids, setBids] = useState<Bid[]>([]);
  const [carriers, setCarriers] = useState<Record<string, User>>({});
  const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => subscribeBids(freight.id, setBids), [freight.id]);
  useEffect(() => { if (canAccept) matchCarriers(freight).then(setSuggestions); }, [freight.id]);
  useEffect(() => {
    const missing = [...new Set(bids.map((b) => b.carrierId))].filter((id) => !carriers[id]);
    Promise.all(missing.map(getUser)).then((res) => {
      const map = { ...carriers };
      res.forEach((u) => { if (u) map[u.id] = u; });
      setCarriers(map);
    });
  }, [bids]);

  async function accept(bid: Bid) {
    setAcceptingId(bid.id);
    try {
      const s = await acceptBid(freight, bid);
      router.replace(`/(app)/tracking/${s.id}`);
    } catch {
      setAcceptingId(null);
    }
  }

  const best = bids.filter((b) => b.status === 'PENDING').reduce((m, b) => Math.min(m, b.amount), Infinity);

  return (
    <View>
      {suggestions.length > 0 && (
        <>
          <SectionTitle>Matching intelligent</SectionTitle>
          {suggestions.map((s) => (
            <Card key={s.carrierId} style={styles.suggest}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{s.companyName} {s.premium && <Ionicons name="checkmark-circle" size={13} color={colors.brand600} />}</Text>
                <Stars value={s.rating} />
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.cardPrice}>{money(s.estimatedPrice)}</Text>
                <Badge tone="blue">⚡ {Math.round(s.score * 100)}%</Badge>
              </View>
            </Card>
          ))}
        </>
      )}

      <SectionTitle>Offres reçues ({bids.length})</SectionTitle>
      {bids.length === 0 ? (
        <Card style={{ padding: 16 }}><Text style={styles.muted}>Aucune offre pour l'instant. Les transporteurs sont notifiés.</Text></Card>
      ) : (
        bids.map((b) => {
          const carrier = carriers[b.carrierId];
          return (
            <Card key={b.id} style={{ padding: 14, marginBottom: 10 }}>
              <View style={styles.headRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Avatar name={b.carrierName ?? carrier?.name ?? '?'} color={carrier?.avatarColor ?? colors.brand600} size={38} />
                  <View>
                    <Text style={styles.cardName}>{b.carrierName ?? carrier?.name}</Text>
                    {carrier && <Stars value={carrier.rating} count={carrier.ratingCount} />}
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.cardPrice}>{money(b.amount)}</Text>
                  {b.amount === best && b.status === 'PENDING' && <Badge tone="green">Meilleure offre</Badge>}
                </View>
              </View>
              <Text style={[styles.muted, { marginTop: 6 }]}>Délai {b.etaHours} h</Text>
              {b.message ? <Text style={styles.quote}>“{b.message}”</Text> : null}
              {canAccept && b.status === 'PENDING' && (
                <Button title="Accepter cette offre" icon="checkmark" loading={acceptingId === b.id} onPress={() => accept(b)} style={{ marginTop: 10 }} />
              )}
              {b.status === 'ACCEPTED' && <Badge tone="green">Acceptée</Badge>}
            </Card>
          );
        })
      )}
    </View>
  );
}

function CarrierBid({ freight, user }: { freight: Freight; user: User }) {
  const router = useRouter();
  const suggested = quickEstimate(freight.distanceKm, freight.vehicleType, freight.cargoType);
  const [amount, setAmount] = useState(String(suggested));
  const [eta, setEta] = useState(String(Math.round(freight.durationH || 6)));
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await placeBid(freight, user, { amount: Number(amount), etaHours: Number(eta), message });
      setDone(true);
      setTimeout(() => router.replace('/(app)/home'), 800);
    } finally {
      setLoading(false);
    }
  }

  if (freight.status !== 'PUBLISHED') {
    return <Card style={{ padding: 16, marginTop: 14 }}><Text style={styles.muted}>Cette annonce n'accepte plus d'offres.</Text></Card>;
  }

  return (
    <Card style={{ padding: 14, marginTop: 14 }}>
      <SectionTitle>Proposer un prix</SectionTitle>
      {done ? (
        <Text style={{ color: colors.green, fontWeight: '700' }}>✅ Offre envoyée ! Le chargeur en est notifié.</Text>
      ) : (
        <>
          <Field label="Votre prix (Ar)"><Input value={amount} onChangeText={setAmount} keyboardType="numeric" /></Field>
          <Text style={styles.muted}>Estimation ONE WAY : {money(suggested)}</Text>
          <Field label="Délai de livraison (heures)"><Input value={eta} onChangeText={setEta} keyboardType="numeric" /></Field>
          <Field label="Message (optionnel)"><Input value={message} onChangeText={setMessage} placeholder="Disponibilité, expérience sur l'axe…" multiline /></Field>
          <Button title="Envoyer l'offre" icon="send" onPress={submit} loading={loading} />
        </>
      )}
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ width: '33%', marginBottom: 12 }}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ref: { fontSize: 13, fontWeight: '800', color: colors.brand600 },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink, marginTop: 4, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  infoLabel: { fontSize: 11, color: colors.inkMuted },
  infoValue: { fontWeight: '700', color: colors.ink },
  muted: { color: colors.inkMuted, fontSize: 13 },
  suggest: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, marginBottom: 8 },
  cardName: { fontWeight: '700', color: colors.ink },
  cardPrice: { fontWeight: '800', color: colors.ink, fontSize: 16 },
  quote: { backgroundColor: colors.slateBg, borderRadius: radius.md, padding: 10, marginTop: 8, color: colors.inkSoft },
});
