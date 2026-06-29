# 🚀 Déploiement ONE WAY

Trois cibles, dans l'ordre recommandé :

1. **Web / PWA** (Vercel) — pour utiliser et **installer l'app** sur téléphone.
2. **Base de données de production** (PostgreSQL + Prisma) — données durables.
3. **APK Android** (Capacitor) — un vrai paquet installable, enrobant la PWA.

---

## 1) Déploiement web (Vercel) → installer la PWA

### Étapes

1. Poussez le dépôt (déjà fait : branche `claude/freight-marketplace-app-ymffso`).
2. Sur [vercel.com](https://vercel.com) → **Add New… → Project** → importez
   `kevinventy/OneWAY` → sélectionnez la branche.
3. Framework détecté : **Next.js** (rien à configurer, voir `vercel.json`).
4. **Variables d'environnement** (Project Settings → Environment Variables) :

   | Variable | Valeur | Obligatoire |
   |---|---|---|
   | `AUTH_SECRET` | chaîne aléatoire ≥ 32 caractères | ✅ |
   | `DATABASE_URL` | URL PostgreSQL (voir §2) | recommandé en prod |
   | `ONEWAY_DATA_DIR` | *(laisser vide)* | non |

   Générer un secret : `openssl rand -base64 32`.

5. **Deploy**. Vous obtenez `https://oneway-xxx.vercel.app`.
6. Ouvrez l'URL **sur le téléphone** et installez :
   - **Android (Chrome)** : ⋮ → *Installer l'application* (ou le bouton *Installer l'app*).
   - **iOS (Safari)** : *Partager* → *Sur l'écran d'accueil*.

> **Note couche de données.** Sans `DATABASE_URL`, l'app tourne avec sa couche
> JSON de démonstration. Sur Vercel (système de fichiers en lecture seule), les
> écritures retombent sur le dossier temporaire : **les données sont
> réinitialisées au démarrage à froid**. C'est parfait pour une démo ; pour des
> données durables, passez à PostgreSQL (§2).

---

## 2) Base de données de production (PostgreSQL + Prisma)

Le schéma canonique est déjà écrit : [`prisma/schema.prisma`](prisma/schema.prisma).
Un seed Prisma autonome est fourni : [`prisma/seed.ts`](prisma/seed.ts).

> ⚠️ Prisma télécharge un moteur natif à l'installation — à faire dans un
> environnement où `binaries.prisma.sh` est joignable (votre machine, Vercel,
> un CI). Ce n'est pas le cas du bac à sable de développement de ce dépôt,
> raison pour laquelle la démo utilise la couche JSON.

### Mise en place

```bash
# 1. Provisionner une base (Neon / Supabase / Railway / RDS) et récupérer l'URL
export DATABASE_URL="postgresql://user:pass@host:5432/oneway?schema=public"

# 2. Installer Prisma
npm i -D prisma tsx && npm i @prisma/client

# 3. Créer le schéma + le client
npx prisma migrate dev --name init     # (ou `prisma db push` en dev)

# 4. Seed des données de démonstration
npx tsx prisma/seed.ts
```

### Brancher l'app sur PostgreSQL

L'application n'accède au stockage qu'à **un seul endroit** : `src/lib/db.ts`
(et `write()`/`db()`). Deux approches :

- **Option A — minimal (snapshot en mémoire, hydraté depuis Postgres).**
  Remplacez `load()`/`persist()` de `src/lib/db.ts` : au démarrage, lisez toutes
  les tables via Prisma dans l'objet `DB` ; sur `write()`, persistez les entités
  modifiées via `prisma.*.upsert`. Aucun composant/route à changer (ils lisent
  un instantané synchrone). Convient à un trafic modéré.

- **Option B — scalable (requêtes async par requête).** Transformez `queries.ts`
  et `services.ts` en fonctions `async` appelant Prisma directement, et `await`
  dans les Server Components / route handlers. Plus de travail, meilleure montée
  en charge. Recommandé au-delà du MVP (voir [`docs/04-architecture.md`](docs/04-architecture.md)).

---

## 3) APK Android (Capacitor)

Le projet natif est déjà généré dans [`android/`](android/) et configuré pour
charger votre PWA déployée ([`capacitor.config.ts`](capacitor.config.ts)).

### Prérequis (sur votre machine, pas le bac à sable)

- **Android Studio** + Android SDK (Platform 34, Build-Tools), **JDK 17+**.
- Variable `ANDROID_HOME` pointant vers le SDK.

### Générer l'APK

```bash
# 1. Pointer l'app vers votre URL déployée puis synchroniser
ONEWAY_APP_URL="https://oneway-xxx.vercel.app" npm run cap:sync

# 2a. APK de debug (installable directement, non signé pour le Store)
npm run android:apk
# → android/app/build/outputs/apk/debug/app-debug.apk

# 2b. …ou ouvrir Android Studio pour un build signé (release / Play Store)
npm run android:open
#    Build → Generate Signed Bundle / APK
```

Installer l'APK de debug sur un téléphone (mode développeur activé) :

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Personnalisation

- **Nom & package** : `capacitor.config.ts` (`appName`, `appId = mg.oneway.app`).
- **Icône** : déjà aux couleurs ONE WAY (`npm run icons` régénère web + Android).
- **Splash / thème** : `android/app/src/main/res`.

> Cette approche (WebView pointant vers l'URL déployée) est équivalente à une
> *Trusted Web Activity*. Pour une app 100 % hors-ligne ou avec des modules
> natifs (GPS background, notifications push natives), voir la roadmap
> [`docs/07-roadmap.md`](docs/07-roadmap.md) (app React Native/Expo dédiée).
