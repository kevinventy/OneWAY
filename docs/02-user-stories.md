# ONE WAY — User Stories

> Format : **« En tant que … je veux … afin de … »** + critères d'acceptation.
> Stories regroupées par épopée (epic) et numérotées **US-XXX**.
> Rôles : `SHIPPER` (chargeur), `CARRIER` (transporteur), `DRIVER` (chauffeur, sous-compte du transporteur), `ADMIN` (back-office).
> ✅ = implémenté dans le code actuel · 🛣️ = roadmap.

---

## Épopée A — Inscription, comptes & KYC

### US-001 — Inscription chargeur ✅
**En tant que** chargeur, **je veux** créer un compte avec mon email, téléphone, mot de passe et ville, **afin de** publier des frets.
- **Critères d'acceptation**
  - Le rôle est `SHIPPER` ou `CARRIER` (`registerSchema`).
  - Email unique (sinon `409 Un compte existe déjà avec cet email`).
  - Mot de passe ≥ 6 caractères, haché en bcrypt.
  - À l'inscription réussie, une session (cookie JWT `oneway_session`, 7 jours) est ouverte et l'utilisateur public est renvoyé (`201`).
  - `kycStatus` initial = `NONE`.

### US-002 — Inscription transporteur ✅
**En tant que** transporteur, **je veux** m'inscrire avec ma raison sociale (`companyName`), **afin de** recevoir du fret.
- **Critères** : idem US-001 avec `role = CARRIER` ; `premium = false` par défaut.

### US-003 — Connexion / déconnexion ✅
**En tant qu'** utilisateur, **je veux** me connecter et me déconnecter, **afin de** sécuriser mon accès.
- **Critères**
  - `POST /api/auth/login` → `401 Email ou mot de passe incorrect` si invalide.
  - `POST /api/auth/logout` efface le cookie de session.
  - `GET /api/auth/me` renvoie l'utilisateur courant ou `null`.

### US-004 — Soumettre des documents KYC 🛣️
**En tant que** transporteur, **je veux** téléverser mes pièces (ID, permis, carte grise, assurance, registre du commerce), **afin d'**être vérifié et inspirer confiance.
- **Critères**
  - Types supportés : `ID`, `LICENSE`, `VEHICLE_REG`, `INSURANCE`, `COMPANY_REG` (`KycDocument.type`).
  - À la soumission, `kycStatus` utilisateur passe à `PENDING`.

### US-005 — Validation KYC (admin) ✅
**En tant qu'** admin, **je veux** valider ou rejeter un document KYC, **afin de** garantir la fiabilité du réseau.
- **Critères** (`PATCH /api/admin/kyc/[id]`, rôle `ADMIN`)
  - Statut accepté : `VERIFIED`, `REJECTED`, `PENDING`.
  - Synchronisation du statut utilisateur : `REJECTED` si au moins un doc rejeté, sinon `VERIFIED` si au moins un vérifié, sinon `PENDING`.
  - `404` si document introuvable.

---

## Épopée B — Tarification & devis

### US-006 — Devis instantané public ✅
**En tant que** visiteur, **je veux** obtenir un prix estimé sans me connecter, **afin de** juger l'intérêt de la plateforme.
- **Critères** (`POST /api/quote`, sans auth)
  - Entrées : distance, type véhicule, type marchandise, options (manutention, express, nuit, piste, assurance, valeur déclarée, remise, TVA).
  - Sortie : décomposition par lignes, sous-total HT, remise, base imposable, TVA, **total TTC**, prix/km, commission suggérée, devise `MGA`.
  - Montants arrondis à 100 Ar.

### US-007 — Estimation d'itinéraire ✅
**En tant qu'** utilisateur, **je veux** estimer distance et durée entre deux villes, **afin de** préparer mon annonce.
- **Critères** (`GET /api/quote?from=&to=`)
  - Utilise d'abord la table de routes réelles (`KNOWN_ROUTES`), sinon great-circle ×1,3 à 55 km/h.
  - Indique la source (`known` | `estimated`).

---

## Épopée C — Publication de fret (chargeur)

### US-008 — Publier un fret ✅
**En tant que** chargeur, **je veux** publier une annonce (titre, marchandise, poids, enlèvement/livraison, date, véhicule, mode de prix), **afin de** recevoir des offres.
- **Critères** (`POST /api/freight`, rôle `SHIPPER`)
  - Validation `freightSchema` (titre ≥ 4 car., poids > 0, points géo valides).
  - Distance/durée calculées automatiquement (`estimateRoute`).
  - Si `budget` non fourni, estimé via `quickEstimate`.
  - Génère un document `QUOTE` (`DEV-<référence>`).
  - Référence séquentielle `OW-XXXX` ; statut initial `PUBLISHED`.

### US-009 — Choisir prix fixe ou enchère ✅
**En tant que** chargeur, **je veux** choisir `FIXED` (prix fixe) ou `AUCTION` (enchère), **afin d'**adapter ma stratégie d'achat.
- **Critères** : `pricingMode` ∈ {`FIXED`, `AUCTION`} ; `budget` = prix fixe (FIXED) ou budget de départ (AUCTION).

### US-010 — Joindre photos, dimensions et valeur déclarée ✅
**En tant que** chargeur, **je veux** ajouter photos, dimensions, volume et valeur déclarée (assurance), **afin de** décrire précisément ma marchandise.
- **Critères** : champs `photos[]`, `dimensions`, `volumeM3`, `declaredValue`, `insurance` pris en compte.

### US-011 — Définir l'urgence ✅
**En tant que** chargeur, **je veux** indiquer l'urgence (`STANDARD`, `EXPRESS`, `FLEXIBLE`), **afin d'**influencer prix et priorité.

### US-012 — Suivre mes annonces ✅
**En tant que** chargeur, **je veux** voir mes propres annonces (tous statuts), **afin de** gérer mon portefeuille.
- **Critères** : `GET /api/freight` filtre sur `shipperId` pour un `SHIPPER` ; filtres `status`, `cargo`, `vehicle`, `q` (recherche texte ville/titre).

---

## Épopée D — Marketplace, matching & enchères

### US-013 — Consulter le feed de fret (transporteur) ✅
**En tant que** transporteur, **je veux** parcourir les annonces ouvertes, **afin de** trouver du fret (notamment pour mes trajets retour).
- **Critères** : `GET /api/freight` renvoie les frets `PUBLISHED` ; filtres cargo/véhicule/recherche disponibles.

### US-014 — Matching intelligent ✅
**En tant que** chargeur, **je veux** une liste classée de transporteurs adaptés, **afin de** gagner du temps.
- **Critères** (`GET /api/freight/[id]/match`, authentifié)
  - Filtre les transporteurs ayant un véhicule disponible compatible (classe demandée, sinon capacité ≥ poids).
  - Score = note (40 %) + proximité (30 %) + compétitivité prix (20 %) + Premium (10 %).
  - Retourne le top 5 trié, avec prix estimé et distance à l'enlèvement.

### US-015 — Placer une offre ✅
**En tant que** transporteur, **je veux** proposer un montant, un délai (ETA) et un message, **afin de** remporter le fret.
- **Critères** (`POST /api/freight/[id]/bids`, rôle `CARRIER`)
  - Refusé si le fret n'est pas `PUBLISHED` (`Cette annonce n'accepte plus d'offres`).
  - Une offre `PENDING` existante du même transporteur est **mise à jour** (pas de doublon).
  - Notifie le chargeur (`Nouvelle offre reçue`).
  - Statut initial de l'offre `PENDING`.

### US-016 — Lister les offres d'un fret ✅
**En tant que** chargeur, **je veux** voir toutes les offres reçues triées du moins cher au plus cher, **afin de** comparer.
- **Critères** : `GET /api/freight/[id]/bids` trié par montant croissant.

### US-017 — Accepter une offre ✅
**En tant que** chargeur, **je veux** accepter une offre, **afin de** réserver le transport.
- **Critères** (`POST /api/bids/[id]/accept`, rôle `SHIPPER`, propriétaire du fret)
  - `403` si l'utilisateur n'est pas le propriétaire du fret ; `404` si offre introuvable.
  - Crée une **expédition** (`Shipment`, réf. `EXP-XXXX`, statut `ASSIGNED`).
  - Marque l'offre `ACCEPTED`, les autres `REJECTED`, le fret `ASSIGNED`.
  - Calcule et fige la commission (8 % ou 12 % selon Premium transporteur).
  - Ouvre une **transaction en séquestre** (`ESCROW`, méthode `MVOLA` par défaut).
  - Affecte un chauffeur disponible du transporteur si présent (statut → `ON_MISSION`).
  - Génère un Bordereau de Livraison (`BL`).
  - Notifie le transporteur (`Offre acceptée 🎉`).

### US-018 — Enchère inversée 🛣️
**En tant que** chargeur, **je veux** lancer une enchère inversée à durée limitée, **afin d'**obtenir le meilleur prix automatiquement.
- **Critères** : fenêtre de temps, attribution automatique au meilleur score à l'échéance. *(Le mode `AUCTION` existe au niveau données ; l'automatisation est roadmap.)*

---

## Épopée E — Suivi temps réel & exécution

### US-019 — Faire avancer une mission ✅
**En tant que** transporteur ou chauffeur, **je veux** mettre à jour le statut de la mission, **afin de** tenir le chargeur informé.
- **Critères** (`POST /api/shipments/[id]/advance`)
  - Autorisé pour : le transporteur assigné, son chauffeur (`driver.userId`), un membre rattaché (`user.carrierId === shipment.carrierId`) ou un `ADMIN` ; sinon `403`.
  - Flux : `ASSIGNED → EN_ROUTE_PICKUP → AT_PICKUP → LOADED → IN_TRANSIT → AT_DELIVERY → DELIVERED`.
  - Sans `status`, avance à l'étape suivante automatiquement.
  - Met à jour `progress` (0..1) et la position simulée (`currentLat/Lng`) par interpolation.
  - Crée un `TrackingEvent` (avec `note`/`photoUrl` optionnels) et notifie le chargeur.

### US-020 — Suivre en direct (chargeur) ✅
**En tant que** chargeur, **je veux** voir la position et les événements de mon expédition, **afin de** rassurer mon client final.
- **Critères** : chaque avancement génère un événement horodaté et une notification `Suivi <réf>`.

### US-021 — Partager un code de suivi ✅ *(donnée)* / 🛣️ *(page publique)*
**En tant que** chargeur, **je veux** un code de suivi (`trackingCode` `OWxxxxxx`), **afin de** le transmettre.
- **Critères** : généré à la création de l'expédition. *(Page de tracking publique : roadmap.)*

### US-022 — Confirmer la livraison & POD ✅
**En tant que** chauffeur, **je veux** confirmer la livraison avec preuve photo, **afin de** clôturer la mission.
- **Critères** : au statut `DELIVERED` → `progress = 1`, `deliveredAt` renseigné, transaction passée de `ESCROW` à `RELEASED`, chauffeur repassé `AVAILABLE`, génération automatique de la **POD** et de la **facture (INVOICE)**.

---

## Épopée F — Documents & communication

### US-023 — Consulter mes documents ✅ *(donnée)* / 🛣️ *(UI/PDF)*
**En tant qu'** utilisateur, **je veux** accéder à mes documents (`QUOTE`, `BL`, `INVOICE`, `POD`, `CERTIFICATE`), **afin de** ma comptabilité.
- **Critères** : les documents sont créés automatiquement aux jalons clés. *(Rendu PDF téléchargeable : roadmap.)*

### US-024 — Messagerie chargeur ⇄ transporteur 🛣️
**En tant qu'** utilisateur, **je veux** discuter dans le fil d'un fret/d'une expédition, **afin de** coordonner l'enlèvement.
- **Critères** : entité `Message` (threadId = freightId ou shipmentId, `read`). *(Endpoints `/api/messages` : roadmap.)*

### US-025 — Notifications ✅
**En tant qu'** utilisateur, **je veux** être notifié (offre, mission, suivi), **afin de** réagir vite.
- **Critères** : `GET /api/notifications` (mes notifications, plus récentes d'abord) ; `PATCH /api/notifications` (tout marquer comme lu).

---

## Épopée G — Paiement & séquestre

### US-026 — Payer par mobile money ou carte 🛣️
**En tant que** chargeur, **je veux** payer via MVola / Orange Money / Airtel Money / Wave / carte / virement, **afin de** régler facilement.
- **Critères** : `PaymentMethod` ∈ {`MVOLA`, `ORANGE_MONEY`, `AIRTEL_MONEY`, `WAVE`, `CARD`, `TRANSFER`, `CASH`}. *(Intégration PSP & webhooks : roadmap ; cf. `06-api.md`.)*

### US-027 — Séquestre des fonds ✅ *(logique)*
**En tant que** chargeur, **je veux** que mon paiement soit séquestré jusqu'à livraison, **afin de** me protéger.
- **Critères** : à l'acceptation → transaction `ESCROW` ; à la livraison → `RELEASED`. Statuts possibles : `PENDING`, `ESCROW`, `RELEASED`, `REFUNDED`, `FAILED`.

### US-028 — Acompte & pénalités 🛣️
**En tant que** plateforme, **je veux** appliquer un acompte de 50 % et une pénalité de retard de 2 %/semaine, **afin de** sécuriser et inciter.
- **Critères** : paramètres `MARKETPLACE.depositRate = 0.5`, `lateFeeWeekly = 0.02`. *(Application automatique : roadmap.)*

---

## Épopée H — Notation & confiance

### US-029 — Noter après livraison ✅
**En tant que** chargeur ou transporteur, **je veux** noter l'autre partie (1–5 étoiles + commentaire), **afin d'**alimenter la confiance.
- **Critères** (`POST /api/reviews`)
  - Refusé si l'expédition n'est pas `DELIVERED` (`400`).
  - Seuls le chargeur ou le transporteur de l'expédition peuvent noter (`403` sinon).
  - La cible est l'autre partie ; la note moyenne (`rating`) et le compteur (`ratingCount`) sont recalculés.

---

## Épopée I — Gestion de flotte & app chauffeur

### US-030 — Gérer mes véhicules 🛣️
**En tant que** transporteur, **je veux** ajouter/éditer mes véhicules (type, plaque, capacité, frigo, disponibilité, position), **afin d'**alimenter le matching.
- **Critères** : entité `Vehicle` (déjà modélisée). *(CRUD flotte : roadmap.)*

### US-031 — Gérer mes chauffeurs 🛣️
**En tant que** transporteur, **je veux** créer des sous-comptes chauffeur (rattachés via `carrierId`), **afin de** leur affecter des missions.
- **Critères** : entité `Driver` (statut `AVAILABLE`/`ON_MISSION`/`OFFLINE`, permis, véhicule). *(CRUD chauffeurs : roadmap.)*

### US-032 — App chauffeur 🛣️
**En tant que** chauffeur, **je veux** une app simple (mission du jour, itinéraire, boutons de statut, photo POD), **afin de** travailler sans friction.
- **Critères** : s'appuie sur `POST /api/shipments/[id]/advance`. *(App native React Native/Expo : roadmap, cf. `04-architecture.md`.)*

---

## Épopée J — Back-office admin

### US-033 — Superviser les KYC ✅
Voir US-005.

### US-034 — Superviser frets, expéditions et litiges 🛣️
**En tant qu'** admin, **je veux** un tableau de bord (frets, expéditions, transactions, litiges), **afin de** piloter la marketplace.
- **Critères** : l'`ADMIN` peut faire avancer une expédition (`advanceShipment`). *(Dashboards & gestion de litiges : roadmap.)*

### US-035 — Gérer les abonnements 🛣️
**En tant qu'** admin, **je veux** gérer les plans d'abonnement et l'état Premium, **afin de** monétiser.
- **Critères** : entité `Subscription` (plan `FREE`/`CARRIER_PRO`/`SHIPPER_BUSINESS`, statut, renouvellement). *(Endpoints abonnements : roadmap.)*

---

## Récapitulatif de couverture

| Épopée | Implémenté ✅ | Roadmap 🛣️ |
|--------|--------------|------------|
| A — Inscription/KYC | US-001..003, 005 | US-004 |
| B — Tarification | US-006, 007 | — |
| C — Publication fret | US-008..012 | — |
| D — Matching/enchères | US-013..017 | US-018 |
| E — Suivi/exécution | US-019, 020, 022 | US-021 (page publique) |
| F — Documents/chat | US-023, 025 | US-024 |
| G — Paiement | US-027 | US-026, 028 |
| H — Notation | US-029 | — |
| I — Flotte/chauffeur | — | US-030..032 |
| J — Admin | US-033 | US-034, 035 |
