import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/auth';
import { Card, Button, EmptyState } from '@/components/ui';
import { subscribeNotifications, markNotificationsRead } from '@/firebase/db';
import { timeAgo } from '@/lib/format';
import { colors } from '@/theme';
import type { Notification } from '@/lib/types';

const EMOJI: Record<string, string> = { BID: '⚖️', MISSION: '🚛', TRACKING: '📍', FREIGHT: '📦', MESSAGE: '💬' };

export default function Notifications() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    return subscribeNotifications(user.id, setItems);
  }, [user?.id]);

  function open(n: Notification) {
    if (!n.href) return;
    const path = n.href.replace(/^\/(shipper|carrier|driver)/, '/(app)');
    router.push(path as any);
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {items.some((n) => !n.read) && (
        <Button title="Tout marquer comme lu" variant="ghost" icon="checkmark-done" onPress={() => user && markNotificationsRead(user.id)} />
      )}
      {items.length === 0 ? (
        <EmptyState icon="notifications-outline" title="Aucune notification" />
      ) : (
        items.map((n) => (
          <Pressable key={n.id} onPress={() => open(n)}>
            <Card style={[styles.item, !n.read && { backgroundColor: '#f5f8ff' }]}>
              <Text style={{ fontSize: 20 }}>{EMOJI[n.type] ?? '🔔'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{n.title}</Text>
                <Text style={styles.body}>{n.body}</Text>
                <Text style={styles.time}>{timeAgo(n.createdAt)}</Text>
              </View>
              {!n.read && <View style={styles.dot} />}
            </Card>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 10 },
  item: { flexDirection: 'row', gap: 12, padding: 14, alignItems: 'flex-start' },
  title: { fontWeight: '700', color: colors.ink },
  body: { color: colors.inkMuted, marginTop: 2 },
  time: { color: colors.inkMuted, fontSize: 11, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand600, marginTop: 6 },
});
