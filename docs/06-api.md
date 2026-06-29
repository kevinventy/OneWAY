# ONE WAY — Référence API REST

> Base : `/api`. Toutes les réponses suivent l'enveloppe :
> **Succès** `{ "ok": true, "data": <T> }` · **Erreur** `{ "ok": false, "error": "<message>" }`
> (cf. `src/lib/api.ts`). Montants en **Ariary (MGA)**, entiers, arrondis à 100 Ar.

---

## 1. Conventions

### Enveloppe de réponse
```json
// succès
{ "ok": true, "data": { /* ... */ } }
// erreur
{ "ok": false, "error": "Message lisible" }
// erreur de validation (422) — champ supplémentaire `issues`
{ "ok": false, "error": "Données invalides", "issues": { "email": ["Email invalide"] } }
```

### Authentification
- Session par cookie **`oneway_session`** (JWT HS256, `httpOnly`, `sameSite=lax`, `secure` en prod, 7 jours), posé par `register`/`login`.
- Gardes : `requireUser()` → `401 Authentification requise` ; `requireRole(...)` → `403 Accès non autorisé`.

### Codes d'erreur transverses
| Code | Signification |
|------|---------------|
| `401` | Non authentifié (`Authentification requise`) ou identifiants invalides. |
| `403` | Rôle insuffisant ou action non autorisée sur l'objet. |
| `404` | Ressource introuvable. |
| `409` | Conflit (ex. email déjà utilisé). |
| `422` | Données invalides (Zod), avec `issues`. |
| `500` | Erreur serveur. |

---

## 2. Endpoints implémentés ✅

### 2.1 Authentification

#### `POST /api/auth/register` — Inscription
- **Rôle requis** : aucun (public).
- **Corps** :
```json
{
  "role": "SHIPPER",          // "SHIPPER" | "CARRIER"
  "name": "Rina Rakoto",
  "email": "rina@negoce.mg",
  "phone": "0340000000",
  "password": "secret123",
  "companyName": "Négoce Rina",  // optionnel
  "city": "Antananarivo"          // optionnel
}
```
- **Réponse `201`** : `data` = utilisateur public (sans `passwordHash`) + cookie de session.
```json
{ "ok": true, "data": { "id": "u_ab12", "role": "SHIPPER", "name": "Rina Rakoto", "email": "rina@negoce.mg", "kycStatus": "NONE", "rating": 0, "premium": false, "createdAt": "2026-06-29T08:00:00.000Z" } }
```
- **Erreurs** : `409` email déjà utilisé · `422` validation.

#### `POST /api/auth/login` — Connexion
- **Corps** : `{ "email": "rina@negoce.mg", "password": "secret123" }`
- **Réponse `200`** : utilisateur public + cookie. **Erreur** `401 Email ou mot de passe incorrect`.

#### `POST /api/auth/logout` — Déconnexion
- **Réponse `200`** : `{ "ok": true, "data": { "loggedOut": true } }` (cookie effacé).

#### `GET /api/auth/me` — Utilisateur courant
- **Réponse `200`** : `data` = utilisateur public **ou** `null` si non connecté.

---

### 2.2 Devis & itinéraire (public)

#### `POST /api/quote` — Calculateur de prix
- **Rôle requis** : aucun (public). Powering `/calculateur`.
- **Corps** (`quoteSchema`) :
```json
{
  "distanceKm": 357,
  "vehicleType": "CAMION_3T",
  "cargoType": "GENERAL",
  "weightKg": 2400,
  "declaredValue": 5000000,
  "handlingPickup": true,
  "handlingDelivery": true,
  "express": false,
  "night": false,
  "ruralRoad": false,
  "insurance": true,
  "discountPct": 0,
  "vat": false
}
```
- **Réponse `200`** :
```json
{
  "ok": true,
  "data": {
    "lines": [
      { "key": "km", "label": "Frais kilométriques", "amount": 1026400 },
      { "key": "forfait", "label": "Forfait de base véhicule", "amount": 60000 },
      { "key": "man_charg", "label": "Manutention chargement", "amount": 9000 },
      { "key": "man_dech", "label": "Manutention déchargement", "amount": 9000 },
      { "key": "assurance", "label": "Assurance marchandise (0,5 %)", "amount": 25000 },
      { "key": "divers", "label": "Frais divers (péages, etc.)", "amount": 30800 }
    ],
    "subtotalHT": 1160200,
    "discountPct": 0, "discountAmount": 0,
    "taxableBase": 1160200,
    "vatRate": 0, "vatAmount": 0,
    "totalTTC": 1160200,
    "pricePerKm": 3250,
    "commission": 139200,
    "currency": "MGA",
    "meta": { "vehicleLabel": "Camion 3 tonnes", "cargoLabel": "Marchandises générales", "coefficient": 1 }
  }
}
```
> Montants illustratifs ; la valeur exacte dépend du moteur (`computeQuote`). Voir `08-monetisation-kpis.md` pour un calcul détaillé pas à pas.

#### `GET /api/quote?from=&to=` — Estimation d'itinéraire
- **Réponse `200`** : `{ distanceKm, durationH, from?, to?, source: "known"|"estimated" }`.
```json
{ "ok": true, "data": { "distanceKm": 357, "durationH": 5.5, "source": "known" } }
```

---

### 2.3 Fret (marketplace)

#### `GET /api/freight` — Lister les frets
- **Rôle requis** : aucun strict, mais comportement selon session.
  - `SHIPPER` connecté → **ses** annonces (tous statuts).
  - Sinon → feed public des frets `PUBLISHED`.
- **Query** : `status`, `cargo`, `vehicle`, `q` (recherche titre/ville).
- **Réponse `200`** : `data` = `Freight[]` (tri par date décroissante).

#### `POST /api/freight` — Publier un fret
- **Rôle requis** : `SHIPPER`.
- **Corps** (`freightSchema`) :
```json
{
  "title": "Palettes de riz",
  "cargoType": "GENERAL",
  "weightKg": 2400,
  "volumeM3": 6,
  "dimensions": "120x100x150",
  "photos": [],
  "pickup":  { "address": "Andraharo", "city": "Antananarivo", "lat": -18.8792, "lng": 47.5079 },
  "delivery":{ "address": "Port", "city": "Toamasina", "lat": -18.1499, "lng": 49.4023 },
  "pickupDate": "2026-07-02",
  "deliveryDate": "2026-07-03",
  "urgency": "STANDARD",
  "pricingMode": "FIXED",
  "vehicleType": "CAMION_3T",
  "declaredValue": 5000000,
  "insurance": true,
  "budget": 0
}
```
- **Notes** : distance/durée calculées auto ; `budget = 0` → estimé via `quickEstimate`. Génère un document `QUOTE`. Référence `OW-XXXX`, statut `PUBLISHED`.
- **Réponse `201`** : `data` = `Freight`. **Erreurs** : `403` (non `SHIPPER`) · `422`.

#### `GET /api/freight/[id]/bids` — Offres d'un fret
- **Réponse `200`** : `data` = `Bid[]` trié par **montant croissant**.

#### `POST /api/freight/[id]/bids` — Placer une offre
- **Rôle requis** : `CARRIER`.
- **Corps** (`bidSchema`) :
```json
{ "amount": 1200000, "etaHours": 6, "message": "Disponible immédiatement", "vehicleId": "v_001" }
```
- **Comportement** : si une offre `PENDING` du même transporteur existe → **mise à jour**. Notifie le chargeur.
- **Réponse `201`** : `data` = `Bid`. **Erreurs** : `403` · fret non `PUBLISHED` → message `Cette annonce n'accepte plus d'offres` (via `500` du handler métier) · `422`.

#### `GET /api/freight/[id]/match` — Matching intelligent
- **Rôle requis** : authentifié (`requireUser`).
- **Réponse `200`** : `data` = top 5 `MatchSuggestion[]` :
```json
{ "ok": true, "data": [
  { "carrierId": "u_c1", "companyName": "Faly Transit", "city": "Antananarivo", "rating": 4.7, "premium": true, "vehicleType": "CAMION_3T", "estimatedPrice": 1135200, "distanceToPickupKm": 0, "score": 0.842 }
] }
```
- **Erreur** : `404 Annonce introuvable`.

---

### 2.4 Offres → mission

#### `POST /api/bids/[id]/accept` — Accepter une offre
- **Rôle requis** : `SHIPPER` **propriétaire** du fret.
- **Corps** : aucun.
- **Effets** : offre `ACCEPTED` (autres `REJECTED`), fret `ASSIGNED`, création `Shipment` `EXP-XXXX` (`ASSIGNED`), commission figée (8 %/12 %), transaction `ESCROW`, document `BL`, affectation chauffeur, notification transporteur.
- **Réponse `201`** : `data` = `Shipment`. **Erreurs** : `404 Offre introuvable` · `403 Action non autorisée`.

---

### 2.5 Expéditions (suivi)

#### `POST /api/shipments/[id]/advance` — Faire avancer la mission
- **Rôle requis** : authentifié **et** autorisé sur l'objet : transporteur assigné, son chauffeur (`driver.userId`), membre rattaché (`carrierId`), ou `ADMIN`.
- **Corps** (`advanceSchema`, tout optionnel) :
```json
{ "status": "IN_TRANSIT", "note": "Départ Tana", "photoUrl": "https://.../pod.jpg" }
```
  - Sans `status` → passe à l'étape suivante du flux `ASSIGNED → … → DELIVERED`.
- **Réponse `200`** : `data` = `{ shipment, event }`.
```json
{ "ok": true, "data": {
  "shipment": { "id": "s_1", "reference": "EXP-0042", "status": "IN_TRANSIT", "progress": 0.67, "currentLat": -18.4, "currentLng": 48.3 },
  "event": { "id": "t_9", "status": "IN_TRANSIT", "label": "En transit", "by": "u_c1", "createdAt": "2026-06-29T11:30:00.000Z" }
} }
```
- **Effets `DELIVERED`** : transaction `RELEASED`, documents `POD` + `INVOICE`, chauffeur `AVAILABLE`, fret `DELIVERED`.
- **Erreurs** : `404 Expédition introuvable` · `403 Action non autorisée` · `422`.

---

### 2.6 Notifications

#### `GET /api/notifications` — Mes notifications
- **Rôle requis** : authentifié. **Réponse `200`** : `Notification[]` (plus récentes d'abord).

#### `PATCH /api/notifications` — Tout marquer comme lu
- **Réponse `200`** : `{ "ok": true, "data": { "updated": true } }`.

---

### 2.7 Notation

#### `POST /api/reviews` — Noter après livraison
- **Rôle requis** : authentifié, **partie** de l'expédition (chargeur ou transporteur).
- **Corps** (`reviewSchema`) :
```json
{ "shipmentId": "s_1", "rating": 5, "comment": "Ponctuel et soigneux" }
```
- **Réponse `201`** : `data` = `Review` (la note moyenne de la cible est recalculée).
- **Erreurs** : `404 Expédition introuvable` · `400 La livraison n'est pas encore confirmée` · `403 Action non autorisée` · `422` (rating hors 1..5).

---

### 2.8 Administration

#### `PATCH /api/admin/kyc/[id]` — Valider/rejeter un KYC
- **Rôle requis** : `ADMIN`.
- **Corps** : `{ "status": "VERIFIED" }` (`"VERIFIED" | "REJECTED" | "PENDING"`).
- **Effet** : met à jour le document et **resynchronise** `User.kycStatus` (rejeté si au moins un rejet, sinon vérifié si au moins un vérifié, sinon en attente).
- **Réponse `200`** : `data` = document KYC. **Erreur** : `404 Document KYC introuvable`.

---

## 3. Endpoints planifiés (roadmap) 🛣️

> Non implémentés ; respecteront la même enveloppe `{ ok, data }` / `{ ok, error }`.

### 3.1 Messagerie
| Méthode | Chemin | Rôle | Description |
|---------|--------|------|-------------|
| `GET` | `/api/messages?threadId=` | authentifié (partie du fil) | Messages d'un fil (`threadId` = freightId/shipmentId). |
| `POST` | `/api/messages` | authentifié | Envoyer `{ threadId, toUserId, body }`. |
| `PATCH` | `/api/messages/[id]/read` | destinataire | Marquer lu. |

### 3.2 Paiements & webhooks
| Méthode | Chemin | Rôle | Description |
|---------|--------|------|-------------|
| `POST` | `/api/payments/intent` | `SHIPPER` | Créer une intention de paiement (méthode, montant) → passage `PENDING`/`ESCROW`. |
| `POST` | `/api/payments/webhook/mvola` | PSP signé | Confirmation MVola (idempotent). |
| `POST` | `/api/payments/webhook/orange` | PSP signé | Orange Money. |
| `POST` | `/api/payments/webhook/airtel` | PSP signé | Airtel Money. |
| `POST` | `/api/payments/webhook/wave` | PSP signé | Wave. |
| `POST` | `/api/payments/webhook/stripe` | PSP signé | Carte (Europe). |
| `POST` | `/api/transactions/[id]/release` | `ADMIN`/système | Libérer le séquestre (`RELEASED`). |
| `POST` | `/api/transactions/[id]/refund` | `ADMIN` | Remboursement (`REFUNDED`). |

### 3.3 Upload de documents & KYC
| Méthode | Chemin | Rôle | Description |
|---------|--------|------|-------------|
| `POST` | `/api/kyc` | `CARRIER`/`SHIPPER` | Téléverser une pièce (`ID`/`LICENSE`/`VEHICLE_REG`/`INSURANCE`/`COMPANY_REG`) → `PENDING`. |
| `GET` | `/api/kyc` | utilisateur/`ADMIN` | Lister les pièces (les siennes / file d'attente admin). |
| `POST` | `/api/uploads` | authentifié | Obtenir une URL S3 signée (photos fret, POD). |
| `GET` | `/api/documents/[id]/pdf` | partie liée | Rendu PDF (devis, BL, facture, POD). |

### 3.4 Abonnements
| Méthode | Chemin | Rôle | Description |
|---------|--------|------|-------------|
| `GET` | `/api/subscriptions` | authentifié | Plan courant. |
| `POST` | `/api/subscriptions` | authentifié | Souscrire `FREE`/`CARRIER_PRO`/`SHIPPER_BUSINESS` (bascule `premium`). |
| `DELETE` | `/api/subscriptions` | authentifié | Résilier. |

### 3.5 Gestion de flotte
| Méthode | Chemin | Rôle | Description |
|---------|--------|------|-------------|
| `GET`/`POST` | `/api/vehicles` | `CARRIER` | Lister/ajouter un véhicule. |
| `PATCH`/`DELETE` | `/api/vehicles/[id]` | `CARRIER` | Éditer (dispo, position)/supprimer. |
| `GET`/`POST` | `/api/drivers` | `CARRIER` | Lister/créer un chauffeur (sous-compte). |
| `PATCH`/`DELETE` | `/api/drivers/[id]` | `CARRIER` | Éditer (statut, véhicule)/supprimer. |
| `POST` | `/api/shipments/[id]/assign-driver` | `CARRIER` | Affecter un chauffeur à une mission. |

---

## 4. Récapitulatif des routes implémentées

| Méthode | Chemin | Rôle |
|---------|--------|------|
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| POST | `/api/auth/logout` | public |
| GET | `/api/auth/me` | public |
| POST | `/api/quote` | public |
| GET | `/api/quote` | public |
| GET | `/api/freight` | public/SHIPPER |
| POST | `/api/freight` | SHIPPER |
| GET | `/api/freight/[id]/bids` | public |
| POST | `/api/freight/[id]/bids` | CARRIER |
| GET | `/api/freight/[id]/match` | authentifié |
| POST | `/api/bids/[id]/accept` | SHIPPER (propriétaire) |
| POST | `/api/shipments/[id]/advance` | autorisé (carrier/driver/admin) |
| GET | `/api/notifications` | authentifié |
| PATCH | `/api/notifications` | authentifié |
| POST | `/api/reviews` | authentifié (partie) |
| PATCH | `/api/admin/kyc/[id]` | ADMIN |
