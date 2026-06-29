# 🚚 ONE WAY — Marketplace de transport de marchandises

> **Le fret, en un sens.** ONE WAY connecte les **chargeurs** (expéditeurs) et les
> **transporteurs** routiers, façon *Uber Freight / Convoy / Trans.eu*, pour
> l'Afrique francophone, l'Europe et le Maghreb — avec un premier marché à
> **Madagascar** (One Way SARL, Antananarivo).

Publiez une annonce de fret → recevez des offres (prix fixe ou enchères) →
suivez la livraison en temps réel → payez en toute sécurité (MVola, Orange
Money, Airtel Money, Wave, carte). Le tout **mobile-first**.

Cette application est une **démonstration full-stack fonctionnelle** des flux
cœur de la marketplace, avec une vraie logique métier (matching, séquestre,
machine à états de livraison, moteur de prix ONE WAY).

---

## ✨ Fonctionnalités (MVP livré)

| Domaine | Détail |
|---|---|
| **4 rôles** | Chargeur, Transporteur, Chauffeur (sous-compte), Administrateur |
| **Annonces de fret** | Publication en 3 étapes, carte interactive, devis instantané |
| **Matching intelligent** | Classement des transporteurs (proximité, capacité, prix, réputation) |
| **Offres / enchères** | Prix fixe ou enchères, acceptation → création de mission |
| **Suivi temps réel** | Position simulée, machine à états, timeline, rafraîchissement live |
| **App chauffeur** | Avancement de mission, notes, photos, GPS, appels |
| **Documents** | Devis, Bordereau de livraison, Facture, Preuve de livraison (imprimables) |
| **Paiement** | Séquestre (escrow) → libération à la livraison, commission auto |
| **Notation & avis** | Évaluation bidirectionnelle, note moyenne |
| **Chat** | Messagerie chargeur ↔ transporteur |
| **KYC & flotte** | Vérification admin, gestion véhicules & chauffeurs |
| **Back-office** | KPIs, GMV/revenus, graphiques, utilisateurs, KYC |
| **Calculateur public** | Grille tarifaire ONE WAY (issue de l'Excel `OneWay_Devis_Transport`) |

---

## 🧰 Stack technique

- **Next.js 14** (App Router) + **TypeScript** + **React 18**
- **Tailwind CSS** (design system mobile-first)
- **Zod** (validation), **jose** (JWT), **bcryptjs** (mots de passe)
- **Recharts** (analytics admin), **lucide-react** (icônes)
- **Carte** : composant SVG embarqué (Madagascar) — **sans clé API** ; point de
  bascule unique vers Mapbox / Google Maps en production
- **Données** : couche JSON locale sans dépendance native (`src/lib/db.ts`).
  Le **schéma de production** (PostgreSQL + Prisma) est dans
  [`prisma/schema.prisma`](prisma/schema.prisma). L'API ne touche le stockage
  qu'à un seul endroit → bascule vers Prisma sans changer les routes.

---

## 🚀 Démarrage

```bash
npm install
npm run dev
# → http://localhost:3000
```

La base de démonstration est **seedée automatiquement** au premier lancement
(`.data/oneway.json`). Pour la réinitialiser : `npm run db:reset`.

### Comptes de démonstration

> Mot de passe commun : **`oneway123`** (boutons de connexion rapide sur `/login`)

| Rôle | Email |
|---|---|
| Chargeur | `chargeur@oneway.mg` |
| Transporteur | `transporteur@oneway.mg` |
| Chauffeur | `chauffeur@oneway.mg` |
| Administrateur | `admin@oneway.mg` |

### Parcours de démonstration conseillé

1. **Chargeur** → *Publier un fret* (3 étapes) → l'annonce reçoit des offres.
2. **Transporteur** (`transporteur@oneway.mg`) → *Fret disponible* → proposer un prix.
3. **Chargeur** → ouvrir l'annonce → *Accepter l'offre* → une expédition est créée (paiement sous séquestre).
4. **Chauffeur** → *Missions* → faire avancer la livraison étape par étape.
5. **Chargeur** → *Suivi* en temps réel → à la livraison, laisser un avis.
6. **Admin** → KPIs, validation KYC, utilisateurs.

---

## 📱 Installation mobile (PWA)

ONE WAY est une **Progressive Web App installable** : pas besoin du Play Store.
Une fois l'app servie en **HTTPS** (voir déploiement ci-dessous), elle s'ajoute
à l'écran d'accueil et s'ouvre en plein écran, comme une app native.

- **Android (Chrome)** : menu ⋮ → *« Installer l'application »* / *« Ajouter à
  l'écran d'accueil »* (ou le bouton **« Installer l'app »** affiché sur l'accueil).
- **iOS (Safari)** : bouton *Partager* → *« Sur l'écran d'accueil »*.

Inclus : `manifest.webmanifest`, service worker (`public/sw.js`, cache + repli
hors-ligne sur `/offline`), icônes (`public/icons/`, régénérables via
`node scripts/gen-icons.mjs`).

> **Pourquoi pas de fichier `.apk` ?** Un APK natif nécessite le SDK Android +
> un backend déployé. La PWA offre la même expérience « app installée » sans
> passer par un store. Pour générer un vrai APK plus tard, on peut envelopper
> la PWA déployée avec **Capacitor** ou une **Trusted Web Activity** (Bubblewrap)
> — voir [`docs/07-roadmap.md`](docs/07-roadmap.md).

### Déploiement (pour installer sur un vrai téléphone)

Le plus simple : **Vercel** (`vercel` ou import du dépôt GitHub). En production,
remplacez la couche de données démo par PostgreSQL + Prisma
(`prisma/schema.prisma`) et définissez `AUTH_SECRET` + `DATABASE_URL`.

## 📚 Documentation produit & technique

Tout est dans [`docs/`](docs/) :

| Document | Contenu |
|---|---|
| [`01-vision-produit.md`](docs/01-vision-produit.md) | Vision, naming, personas, modèle économique, concurrence |
| [`02-user-stories.md`](docs/02-user-stories.md) | User stories détaillées par rôle (US-001…) |
| [`03-user-flows.md`](docs/03-user-flows.md) | Parcours, wireframes, machines à états (Mermaid) |
| [`04-architecture.md`](docs/04-architecture.md) | Architecture, stack, intégrations, sécurité/RGPD, scalabilité |
| [`05-database.md`](docs/05-database.md) | Schéma de données (ERD), tables, migration |
| [`06-api.md`](docs/06-api.md) | Référence API REST (endpoints réels + roadmap) |
| [`07-roadmap.md`](docs/07-roadmap.md) | MVP + roadmap v1.1 / v2.0 |
| [`08-monetisation-kpis.md`](docs/08-monetisation-kpis.md) | Monétisation chiffrée & KPIs |

---

## 🗂️ Structure du projet

```
OneWAY/
├── prisma/schema.prisma        # Schéma PostgreSQL de production (référence)
├── docs/                       # Documentation produit & technique
├── scripts/reset-db.mjs        # Réinitialisation de la base démo
└── src/
    ├── app/                    # Next.js App Router
    │   ├── page.tsx            # Landing marketing
    │   ├── calculateur/        # Calculateur de prix public
    │   ├── (auth)/             # login / register
    │   ├── app/                # Espace authentifié (shell + rôles)
    │   │   ├── shipper/        # Chargeur : dashboard, new, freight, tracking
    │   │   ├── carrier/        # Transporteur : feed, freight, missions, fleet
    │   │   ├── driver/         # Chauffeur : missions
    │   │   ├── admin/          # Back-office : KPIs, KYC, users
    │   │   ├── documents/      # Devis / BL / Facture / POD imprimables
    │   │   ├── messages/       # Chat
    │   │   └── notifications/
    │   └── api/                # API REST (auth, freight, bids, shipments…)
    ├── components/             # UI, cartes, formulaires, charts
    ├── data/catalog.ts         # Grille tarifaire & coefficients ONE WAY
    └── lib/                    # db, auth, pricing, services, queries, geo…
```

---

## 🔐 Sécurité & conformité

- Sessions **JWT httpOnly** signées (`jose`), mots de passe **bcrypt**.
- **RBAC** : chaque route et page vérifie le rôle (`requireRole`).
- Paiement en **séquestre** libéré à la livraison.
- Conçu **RGPD-ready** (minimisation, droit à l'effacement) — voir
  [`docs/04-architecture.md`](docs/04-architecture.md).

> ⚠️ Démo : la couche de données et les paiements sont simulés. Voir la
> [roadmap](docs/07-roadmap.md) pour le passage en production (Postgres, Stripe,
> agrégateurs mobile money, FCM/SMS, S3).

---

*One Way SARL · Transport · Livraison · Suivi Digital · Antananarivo, Madagascar 🇲🇬*
