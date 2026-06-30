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

## 3. Déployer les règles de sécurité + index

Le projet est déjà câblé : `mobile/firebase.json`, `mobile/.firebaserc`
(projet **oneway-77f85**) et `mobile/firestore.indexes.json` sont fournis.

**Prérequis** : la base **Firestore doit déjà exister** (étape 1.3, mode production).

**Option A — en local (1 commande)** :

```
cd mobile
npm i -g firebase-tools && firebase login
firebase deploy --only firestore        # règles + index, projet oneway-77f85
```

**Option B — via GitHub Actions** (aucune install locale) :

1. Génère un jeton : `firebase login:ci` (en local, une fois).
2. GitHub → **Settings → Secrets and variables → Actions → New repository secret** :
   nom `FIREBASE_TOKEN`, valeur = le jeton.
   *(ou `FIREBASE_SERVICE_ACCOUNT` = le JSON d'une clé de compte de service)*
3. **Actions → Firebase Deploy (Firestore) → Run workflow**.

## 4. (Optionnel) Seed des données de démonstration

```
cd mobile
npm i -D firebase-admin tsx
# Project settings → Comptes de service → Générer une clé privée → serviceAccount.json
export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json
node --import tsx scripts/seed.ts
```

Crée le gérant **`gerant`**, les chauffeurs **`chauffeur`** et **`koto`**, un
client **`client`** (identifiants, mot de passe **`oneway123`**), la flotte, et
3 courses de démonstration avec leur suivi public (codes **OWTOA01** en route,
**OWANT02** livrée, **OWMAH03** à assigner). Code entreprise de démo : **OWDEMO**.
Le compte `client` (tél. +261330000001) voit la course OWTOA01 dans « Mes livraisons ».

## 4 bis. (Optionnel) Storage pour les photos

Les photos géolocalisées (chargement/déchargement, incidents) sont **uploadées
vers Firebase Storage** ; sans Storage configuré, l'app retombe sur l'image
locale (visible sur l'appareil). Pour activer l'upload cross-appareils :

1. **Build → Storage → Commencer** (mode test pour démarrer).
2. Onglet **Règles** :

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} { allow read, write: if request.auth != null; }
  }
}
```

> Mode hors-ligne : le SDK JS Firebase met en cache les écoutes en mémoire et
> met les écritures en file d'attente pendant la session. La persistance disque
> complète nécessite `@react-native-firebase` (natif) — voir roadmap.

## 5. Lancer l'app

```
cd mobile
npm install
npm start        # puis 'a' pour Android (Expo Go) ou un build de dev
```

> Pour l'APK installable, voir la section CI dans le README racine (workflow
> **Expo APK**) : il faut fournir les variables `EXPO_PUBLIC_FIREBASE_*` comme
> *Variables* de dépôt GitHub pour qu'elles soient embarquées dans le build.
