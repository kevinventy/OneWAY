import { Linking, Platform } from 'react-native';

/**
 * Ouvre la navigation turn-by-turn vers un point (Google Maps / Waze natif).
 * Android : `google.navigation:` lance directement Maps en mode guidage.
 */
export function openNavigation(lat: number, lng: number) {
  const dest = `${lat},${lng}`;
  const web = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
  const primary = Platform.OS === 'android' ? `google.navigation:q=${dest}` : web;
  Linking.openURL(primary).catch(() => Linking.openURL(web).catch(() => {}));
}
