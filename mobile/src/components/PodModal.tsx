import { useRef, useState } from 'react';
import { View, Text, Modal, StyleSheet, Pressable, TextInput, Alert, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Button } from '@/components/ui';
import { SignaturePad, type SignaturePadHandle } from '@/components/SignaturePad';
import { advanceCourse } from '@/firebase/db';
import { uploadPodPhoto } from '@/lib/pod';
import { colors } from '@/theme';
import type { Course } from '@/lib/types';

/** Capture de la preuve de livraison puis confirmation (statut → LIVRÉE). */
export function PodModal({ visible, course, by, onClose, onDone }: {
  visible: boolean;
  course: Course;
  by: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [recipient, setRecipient] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pad = useRef<SignaturePadHandle>(null);
  const pending = useRef(false);

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert('Autorisation requise', 'Autorisez la caméra pour la photo de livraison.');
    const r = await ImagePicker.launchCameraAsync({ quality: 0.5 });
    if (!r.canceled && r.assets[0]) setPhotoUri(r.assets[0].uri);
  }

  function confirm() {
    if (recipient.trim().length < 2) return Alert.alert('Nom requis', 'Indiquez le nom de la personne qui réceptionne.');
    pending.current = true;
    setBusy(true);
    pad.current?.capture(); // → onCapture ci-dessous
  }

  async function onCapture(signature: string | null) {
    if (!pending.current) return;
    pending.current = false;
    try {
      let photoUrl: string | undefined;
      if (photoUri) {
        const url = await uploadPodPhoto(course.id, photoUri, Date.now());
        if (url) photoUrl = url;
      }
      let lat: number | undefined, lng: number | undefined;
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lat = pos.coords.latitude; lng = pos.coords.longitude;
      } catch { /* géoloc facultative */ }
      await advanceCourse(course, by, { recipient: recipient.trim(), signature: signature ?? undefined, photoUrl, lat, lng });
      onDone();
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Livraison impossible');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.head}>
            <Text style={styles.title}>Preuve de livraison</Text>
            <Pressable onPress={onClose} hitSlop={8}><Ionicons name="close" size={22} color={colors.inkMuted} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
            <View>
              <Text style={styles.label}>Nom du destinataire</Text>
              <TextInput value={recipient} onChangeText={setRecipient} placeholder="Ex. M. Rakoto" placeholderTextColor={colors.inkMuted} style={styles.input} />
            </View>

            <View>
              <Text style={styles.label}>Photo (facultative)</Text>
              {photoUri ? (
                <Pressable onPress={takePhoto}><Image source={{ uri: photoUri }} style={styles.photo} /></Pressable>
              ) : (
                <Pressable onPress={takePhoto} style={styles.photoBtn}>
                  <Ionicons name="camera" size={22} color={colors.brand600} />
                  <Text style={styles.photoBtnText}>Prendre une photo</Text>
                </Pressable>
              )}
            </View>

            <View>
              <View style={styles.sigHead}>
                <Text style={styles.label}>Signature</Text>
                <Pressable onPress={() => pad.current?.clear()}><Text style={styles.clear}>Effacer</Text></Pressable>
              </View>
              <View style={styles.padWrap}>
                <SignaturePad ref={pad} onCapture={onCapture} style={{ flex: 1, backgroundColor: '#fff' }} />
              </View>
              <Text style={styles.hint}>Faites signer le destinataire ci-dessus.</Text>
            </View>

            <Button title="Confirmer la livraison" icon="checkmark-circle" onPress={confirm} loading={busy} style={{ paddingVertical: 15 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, maxHeight: '92%' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '900', color: colors.ink },
  label: { fontSize: 13, fontWeight: '600', color: colors.inkSoft, marginBottom: 6 },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.ink },
  photoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 16 },
  photoBtnText: { color: colors.brand600, fontWeight: '700' },
  photo: { width: '100%', height: 160, borderRadius: 10, backgroundColor: colors.slateBg },
  sigHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clear: { color: colors.brand600, fontWeight: '700', fontSize: 13 },
  padWrap: { height: 180, borderWidth: 1, borderColor: colors.border, borderRadius: 10, overflow: 'hidden', backgroundColor: '#fff' },
  hint: { color: colors.inkMuted, fontSize: 12, marginTop: 6 },
});
