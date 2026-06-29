import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase/config';

const imgId = () => 'img_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export interface GeoPhoto {
  uri: string;
  lat?: number;
  lng?: number;
}

/** Prend une photo (appareil) et capture la position GPS. */
export async function captureGeoPhoto(): Promise<GeoPhoto | null> {
  const cam = await ImagePicker.requestCameraPermissionsAsync();
  let result: ImagePicker.ImagePickerResult;
  if (cam.granted) {
    result = await ImagePicker.launchCameraAsync({ quality: 0.5, allowsEditing: false });
  } else {
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!lib.granted) return null;
    result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5 });
  }
  if (result.canceled || !result.assets?.length) return null;
  const uri = result.assets[0].uri;

  let lat: number | undefined;
  let lng: number | undefined;
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.granted) {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    }
  } catch {
    /* GPS indisponible — photo conservée sans coordonnées */
  }
  return { uri, lat, lng };
}

/**
 * Upload best-effort vers Firebase Storage → URL publique.
 * Si Storage n'est pas configuré (règles), on retombe sur l'URI local
 * (visible au moins sur l'appareil ayant pris la photo).
 */
export async function uploadPhoto(uri: string, folder = 'proofs'): Promise<string> {
  try {
    const blob = await (await fetch(uri)).blob();
    const r = storageRef(storage, `${folder}/${imgId()}.jpg`);
    await uploadBytes(r, blob);
    return await getDownloadURL(r);
  } catch {
    return uri; // repli local
  }
}

export function gpsLabel(p?: GeoPhoto | null): string | undefined {
  if (p?.lat == null || p?.lng == null) return undefined;
  return `📍 ${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`;
}
