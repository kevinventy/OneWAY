import { useEffect, useState } from 'react';
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { checkForUpdate, type UpdateInfo } from '@/lib/updates';
import { colors } from '@/theme';

/** Bandeau « mise à jour disponible » — vérifie au démarrage, propose le téléchargement. */
export function UpdateBanner() {
  const insets = useSafeAreaInsets();
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    checkForUpdate().then(setInfo);
  }, []);

  if (!info || closed) return null;

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom + 10 }]}>
      <Ionicons name="rocket" size={20} color="#fff" />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Mise à jour disponible (v{info.version})</Text>
        {info.notes ? <Text style={styles.notes} numberOfLines={1}>{info.notes}</Text> : null}
      </View>
      <Pressable onPress={() => Linking.openURL(info.apkUrl)} style={styles.btn}>
        <Text style={styles.btnText}>Mettre à jour</Text>
      </Pressable>
      <Pressable onPress={() => setClosed(true)} hitSlop={8} style={{ padding: 2 }}>
        <Ionicons name="close" size={18} color="rgba(255,255,255,0.85)" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.brand700,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  title: { color: '#fff', fontWeight: '800', fontSize: 13 },
  notes: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 1 },
  btn: { backgroundColor: colors.amber500, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  btnText: { color: colors.ink, fontWeight: '800', fontSize: 13 },
});
