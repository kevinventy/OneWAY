import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor — enrobe la PWA ONE WAY déployée dans une app Android (APK).
 *
 * L'app charge votre site déployé (HTTPS). Définissez l'URL avant le build :
 *   ONEWAY_APP_URL="https://votre-app.vercel.app" npx cap sync android
 *
 * Puis générez l'APK (machine avec Android Studio / SDK) :
 *   npm run android:apk        # APK de debug
 *   npm run android:open       # ouvre Android Studio pour un build signé
 */
const APP_URL = process.env.ONEWAY_APP_URL || 'https://oneway.vercel.app';

const config: CapacitorConfig = {
  appId: 'mg.oneway.app',
  appName: 'ONE WAY',
  webDir: 'www',
  server: {
    url: APP_URL,
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    backgroundColor: '#141a57',
  },
};

export default config;
