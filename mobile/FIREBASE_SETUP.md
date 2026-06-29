# 🔥 Configuration Firebase — ONE WAY (Expo)

L'app mobile utilise **Firebase Authentication** (email/mot de passe) et
**Cloud Firestore**. Sans configuration, l'app démarre mais affiche « Firebase
non configuré ». Voici comment l'activer (≈ 5 min).

## 1. Créer un projet Firebase

1. [console.firebase.google.com](https://console.firebase.google.com) → **Ajouter un projet**.
2. Dans **Build → Authentication → Sign-in method**, activez **E-mail/Mot de passe**.
3. Dans **Build → Firestore Database**, créez une base (mode production).
4. **Project settings (⚙️) → Vos applications → Web (</>)** : enregistrez une app
   web et copiez l'objet `firebaseConfig` (apiKey, authDomain, projectId, etc.).

## 2. Renseigner les clés dans l'app

Deux options (au choix) :

**A. Variables d'environnement** (recommandé, ne committez pas les clés) — créez
`mobile/.env` :

```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

**B. `app.json`** — remplissez `expo.extra.firebase` avec les mêmes valeurs.

## 3. Déployer les règles de sécurité

```
npm i -g firebase-tools && firebase login
firebase deploy --only firestore:rules   # utilise mobile/firestore.rules
```

## 4. (Optionnel) Seed des données de démonstration

```
cd mobile
npm i -D firebase-admin tsx
# Project settings → Comptes de service → Générer une clé privée → serviceAccount.json
export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json
node --import tsx scripts/seed.ts
```

Crée 6 comptes (mot de passe **`oneway123`**) : `chargeur@`, `transporteur@`,
`chauffeur@`, `marie@boutique.mg`, `fitateza@`, `admin@oneway.mg`, plus un fret
de démonstration avec offres.

## 5. Lancer l'app

```
cd mobile
npm install
npm start        # puis 'a' pour Android (Expo Go) ou un build de dev
```

> Pour l'APK installable, voir la section CI dans le README racine (workflow
> **Expo APK**) : il faut fournir les variables `EXPO_PUBLIC_FIREBASE_*` comme
> *Variables* de dépôt GitHub pour qu'elles soient embarquées dans le build.
