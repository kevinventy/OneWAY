import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase/config';

/**
 * Envoie la photo de preuve de livraison vers Firebase Storage et renvoie son
 * URL. Renvoie `null` en cas d'échec (Storage non activé, hors-ligne) — la
 * livraison reste possible sans photo.
 */
export async function uploadPodPhoto(courseId: string, uri: string, stamp: number): Promise<string | null> {
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    const r = storageRef(storage, `pod/${courseId}/photo_${stamp}.jpg`);
    await uploadBytes(r, blob);
    return await getDownloadURL(r);
  } catch {
    return null;
  }
}
