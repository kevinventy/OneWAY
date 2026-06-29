# ONE WAY — Monétisation & KPIs

> Chiffres en **Ariary (MGA)**. Les exemples sont calculés avec le moteur réel
> (`src/lib/pricing.ts`, `src/data/catalog.ts`) : montants arrondis à 100 Ar.

---

## 1. Sources de revenus

| Source | Base | Statut |
|--------|------|--------|
| **Commission transactionnelle** | 12 % (8 % Premium transporteur) du montant de la course | ✅ logique |
| **Abonnements** | Transporteur Pro 49 000 Ar/mois · Chargeur Business 89 000 Ar/mois | ✅ catalogue / 🛣️ facturation |
| **Assurance marchandise** | 0,5 % de la valeur déclarée (commission d'apport) | 🛣️ |
| **Mise en avant** | Boost d'annonces / profils transporteurs | 🛣️ |
| **Financement / avance** | Avance de trésorerie au transporteur (frais) | 🛣️ |
| **Frais de paiement** | Marge sur encaissements mobile money / carte | 🛣️ |

---

## 2. Commission — le moteur de revenu principal

Paramètres (`MARKETPLACE`) : `commissionRate = 12 %`, `commissionRatePremiumCarrier = 8 %`.
La commission est figée à l'acceptation : `commission = round(montant_course × taux)`.

### 2.1 Décomposition d'un prix (exemple détaillé)

**Course : Antananarivo → Toamasina, 357 km, Camion 3 T, marchandises générales, manutention chargement + déchargement, assurance sur 5 000 000 Ar, hors TVA.**

| Ligne | Calcul | Montant (Ar) |
|-------|--------|-------------:|
| Frais kilométriques | 357 × 2 500 × (1 + 0,15) × 1,0 × (1 + 0) → arrondi | **1 026 400** |
| Forfait de base véhicule | baseFee Camion 3 T | **60 000** |
| Manutention chargement | 15 % × 60 000 | **9 000** |
| Manutention déchargement | 15 % × 60 000 | **9 000** |
| Assurance (0,5 %) | 0,5 % × 5 000 000 | **25 000** |
| Frais divers (péages…) | 3 % × frais km | **30 800** |
| **Sous-total HT** | | **1 160 200** |
| TVA (désactivée ici) | 0 % | 0 |
| **Total TTC** | | **1 160 200** |
| Prix / km | | 3 250 |

**Revenu ONE WAY sur cette course :**

| Cas | Taux | Commission (Ar) | Net transporteur (Ar) |
|-----|-----:|----------------:|----------------------:|
| Transporteur standard | 12 % | **139 200** | 1 021 000 |
| Transporteur Premium | 8 % | **92 800** | 1 067 400 |

> Le Premium fait gagner ~46 400 Ar au transporteur sur cette seule course — l'abonnement Pro (49 000 Ar/mois) est rentabilisé dès **2 courses de cette taille par mois** (voir §4).

### 2.2 Autres exemples de courses (commission standard 12 %)

| Course | Véhicule / cargo | Distance | Total TTC (Ar) | Commission 12 % (Ar) | Commission 8 % (Ar) |
|--------|------------------|---------:|---------------:|---------------------:|--------------------:|
| Tana → Moramanga | Moto / Générales | 109 km | 109 400 | 13 100 | 8 800 |
| Tana → Toamasina | Camion 3 T / Générales *(avec assurance)* | 357 km | 1 160 200 | 139 200 | 92 800 |
| Tana → Mahajanga | Frigo 5 T / Périssable, **express**, assurance 8 M | 472 km | 4 842 300 | 581 100 | 387 400 |

*(Valeurs issues du moteur réel ; les paramètres de chaque scénario sont reproductibles via `POST /api/quote`.)*

---

## 3. Abonnements (`SUBSCRIPTION_PLANS`)

| Plan | Prix / mois | Cible | Valeur |
|------|------------:|-------|--------|
| **Gratuit** | 0 Ar | Tous | Accès complet à la marketplace, commission 12 %. |
| **Transporteur Pro** | **49 000 Ar** | Transporteurs | Commission **8 %**, alertes prioritaires, mise en avant, flotte illimitée. |
| **Chargeur Business** | **89 000 Ar** | Chargeurs | Facturation centralisée, multi-utilisateurs, tarifs négociés, support/SLA. |

### Point d'équilibre du Pro (transporteur)
Économie de commission = `montant_course × (12 % − 8 %) = 4 % × montant`.
Le Pro (49 000 Ar) est rentable dès que le **volume mensuel de courses dépasse `49 000 / 0,04 = 1 225 000 Ar`** de chiffre d'affaires transport.
→ Soit **~2 courses Camion 3 T** régionales, ou une dizaine de petites courses Moto.

---

## 4. Services additionnels (roadmap monétisation)

| Service | Modèle de prix proposé | Exemple chiffré |
|---------|------------------------|-----------------|
| **Assurance marchandise** | 0,5 % valeur déclarée, marge d'apport ONE WAY 20–30 % | Valeur 5 M → prime 25 000 Ar → marge 5 000–7 500 Ar/course. |
| **Mise en avant** | Forfait boost annonce / mois | Boost annonce : 20 000 Ar ; profil Pro en tête : inclus au Pro. |
| **Avance de trésorerie** | Frais 2–3 % du montant avancé | Avance 1 160 200 Ar à 2,5 % → 29 000 Ar de frais. |
| **Frais de paiement** | Marge sur encaissement mobile money | ~1 % du montant transité (selon accords PSP). |

---

## 5. KPIs clés

### 5.1 Acquisition & activation

| KPI | Définition | Cible de départ (T3 2026) |
|-----|------------|---------------------------|
| **Inscriptions** | Nouveaux comptes (chargeurs + transporteurs) / mois | 300 / mois |
| **Activation chargeur** | % de chargeurs ayant publié ≥ 1 fret sous 7 j | ≥ 40 % |
| **Activation transporteur** | % de transporteurs ayant placé ≥ 1 offre sous 7 j | ≥ 50 % |
| **KYC vérifiés** | % de transporteurs avec `kycStatus = VERIFIED` | ≥ 70 % |
| **CAC** | Coût d'acquisition par utilisateur actif | < 30 000 Ar |

### 5.2 Liquidité de la marketplace (vital)

| KPI | Définition | Cible |
|-----|------------|-------|
| **Taux de couverture (fill rate)** | % de frets `PUBLISHED` recevant ≥ 1 offre | ≥ 75 % |
| **Offres par fret** | Nombre moyen de `Bid` par fret | ≥ 3 |
| **Délai jusqu'à 1ʳᵉ offre** | Temps médian publication → 1ʳᵉ offre | < 2 h |
| **Taux de matching** | % de frets passant à `ASSIGNED` | ≥ 60 % |
| **Ratio offre/demande** | Transporteurs actifs / frets ouverts | équilibré (0,8–1,5) |

### 5.3 Exécution & qualité

| KPI | Définition | Cible |
|-----|------------|-------|
| **Taux de complétion** | % d'expéditions atteignant `DELIVERED` | ≥ 90 % |
| **Taux d'annulation** | % de courses annulées | < 8 % |
| **Ponctualité** | % de livraisons dans l'ETA annoncé | ≥ 80 % |
| **NPS** | Net Promoter Score (chargeurs & transporteurs) | ≥ 40 |
| **Note moyenne** | `User.rating` moyen | ≥ 4,3 / 5 |

### 5.4 Revenus & monétisation

| KPI | Définition | Cible |
|-----|------------|-------|
| **GMV** | Volume brut de marchandises transactées (Σ `Shipment.price`) | voir projection §6 |
| **Take rate** | Revenu plateforme / GMV (commission moyenne effective) | 10–12 % |
| **Revenu net** | Commissions + abonnements + services | — |
| **Pénétration Premium** | % de transporteurs abonnés Pro | ≥ 15 % |
| **ARPU transporteur** | Revenu moyen par transporteur actif / mois | croissant |

### 5.5 Rétention & valeur

| KPI | Définition | Cible |
|-----|------------|-------|
| **Rétention M1** | % d'utilisateurs actifs le mois suivant | ≥ 50 % |
| **Fréquence chargeur** | Frets publiés / chargeur actif / mois | ≥ 3 |
| **Réutilisation transporteur** | Courses / transporteur actif / mois | ≥ 4 |
| **LTV** | Valeur vie d'un utilisateur (revenu cumulé) | — |
| **LTV / CAC** | Ratio de rentabilité d'acquisition | ≥ 3 |

---

## 6. Projection simple (illustrative)

Hypothèses prudentes pour la 1ʳᵉ année post-lancement payant (corridors Madagascar), panier moyen ≈ **800 000 Ar** par course livrée, take rate ≈ **11 %** (mix standard/Premium).

| Mois | Courses livrées / mois | GMV (Ar) | Revenu commission (Ar) | Abonnés Pro+Business | Revenu abos (Ar) | **Revenu total (Ar)** |
|------|----------------------:|---------:|-----------------------:|---------------------:|-----------------:|----------------------:|
| M1 | 150 | 120 000 000 | 13 200 000 | 10 | ~600 000 | **~13 800 000** |
| M3 | 400 | 320 000 000 | 35 200 000 | 35 | ~2 100 000 | **~37 300 000** |
| M6 | 900 | 720 000 000 | 79 200 000 | 90 | ~5 500 000 | **~84 700 000** |
| M12 | 2 200 | 1 760 000 000 | 193 600 000 | 220 | ~13 500 000 | **~207 100 000** |

> Calculs : `commission = GMV × 11 %` ; abonnements estimés sur un mix ~60 % Pro (49 000 Ar) / 40 % Business (89 000 Ar) → ~65 000 Ar moyens par abonné. Chiffres **indicatifs** servant à dimensionner objectifs et coûts ; à recalibrer avec les données réelles des premiers pilotes.

### Leviers de croissance du revenu
1. **Densifier la liquidité** par corridor → hausse du fill rate → plus de GMV.
2. **Pousser le Premium** (commission 8 %) : baisse le take rate unitaire mais augmente le volume et le revenu d'abonnement.
3. **Activer les services** (assurance, avance, boost) : revenu additionnel à forte marge sans dépendre du volume seul.
4. **Réduire le retour à vide** : plus de courses par véhicule → plus de GMV à parc constant.

---

## 7. Tableau de bord recommandé (pilotage)

| Bloc | KPI à afficher en continu |
|------|---------------------------|
| **Croissance** | Inscriptions, activation, CAC |
| **Liquidité** | Fill rate, offres/fret, délai 1ʳᵉ offre, taux de matching |
| **Exécution** | Taux de complétion, annulation, ponctualité, note moyenne |
| **Revenu** | GMV, take rate, revenu commission, revenu abonnements, pénétration Premium |
| **Rétention** | Rétention M1, fréquence, LTV/CAC |

> Ces métriques se calculent directement à partir des entités du modèle (`Freight`, `Bid`, `Shipment`, `Transaction`, `Review`, `Subscription`) — voir `05-database.md`.
