# 📱 ONE WAY — App mobile (Expo + Firebase)

Application mobile native (React Native / **Expo SDK 52** + **expo-router**) de la
marketplace de transport ONE WAY, avec backend **Firebase** (Auth + Firestore).
Réutilise tout le domaine métier de la version web (moteur de prix, catalogue
véhicules, routes Madagascar, machine à états de livraison).

## Fonctionnalités

- Authentification Firebase (email/mot de passe), rôles Chargeur / Transporteur / Chauffeur.
- Chargeur : publication de fret (carte + devis live), matching, offres, acceptation, suivi, avis.
- Transporteur : feed du fret disponible, proposition de prix, missions.
- Chauffeur : avancement de mission (GPS, notes, photos), timeline temps réel.
- Données **temps réel** via les abonnements Firestore (`onSnapshot`).

## Démarrage

```bash
cd mobile
npm install
# Configurez Firebase (voir FIREBASE_SETUP.md), puis :
npm start            # 'a' = Android, 'w' = web
```

> Sans clés Firebase, l'app démarre en mode « non configuré ». Voir
> [`FIREBASE_SETUP.md`](FIREBASE_SETUP.md).

## Structure

```
mobile/
├── app/                       # Écrans (expo-router)
│   ├── _layout.tsx  index.tsx  welcome / login / register
│   └── (app)/                 # zone authentifiée
│       ├── home.tsx           # dashboard par rôle
│       ├── new-freight.tsx    freight/[id]  tracking/[id]
│       └── notifications  profile
├── src/
│   ├── firebase/              # config, auth, db (Firestore)
│   ├── store/auth.tsx         # contexte d'authentification
│   ├── components/            # ui, RouteMap (svg), cartes
│   ├── data/  lib/            # domaine réutilisé (catalog, pricing, geo, types…)
│   └── theme.ts
├── scripts/                   # gen-assets, seed Firestore
├── firestore.rules            # règles de sécurité
├── eas.json  app.json
```

## APK

- **CI (recommandé)** : le workflow GitHub Actions **« Expo APK »** compile un
  APK release (JS embarqué) via `expo prebuild` + Gradle. Téléchargez-le dans
  *Actions → Artifacts* (`oneway-expo-apk`) ou *Releases*.
- **EAS** : `npx eas build -p android --profile preview` (compte Expo requis).
- **Local** : `npm run prebuild && cd android && ./gradlew assembleRelease`
  (Android SDK requis).
