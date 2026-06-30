# Devis de transport — One Way 🇲🇬

Classeur Excel de devis pour **One Way SARL** (transport · livraison · suivi digital, Antananarivo).

## Fichiers

| Fichier | Rôle |
|---|---|
| `OneWay_Devis_Transport.xlsx` | **Devis final** (version améliorée — à utiliser) |
| `OneWay_Devis_Transport.base.xlsx` | Dernière source fournie (provenance) |
| `../../scripts/devis-carburant-vehicule.py` | Étape 1 : carburant auto par véhicule + nettoyage |
| `../../scripts/devis-montant-lettres.py` | Étape 2 : montant total en toutes lettres |
| `../../scripts/devis-recu-paiement.py` | Étape 3 : feuille « Reçu de paiement » |
| `../../scripts/historique-paiements.py` | Étape 4 : suivi des paiements dans l'historique |
| `../../scripts/ameliore-devis.py` | Utilitaire historique : ajout de désignations |

## ⚙️ Feuille masquée « Lettres »

Le classeur contient une feuille **masquée** `Lettres` : c'est la table de
conversion *nombre → français* (0 à 999, avec les pluriels « cent/cents » et
« quatre-vingt/quatre-vingts »). **Ne pas la supprimer ni la modifier** — elle
alimente le montant en toutes lettres.

## Feuilles

- **📋 Devis Client** — devis imprimable (en-tête, infos client, paramètres transport, tableau des prestations, totaux, conditions, signatures).
- **⚙️ Paramètres** — tarifs de référence : prix carburant (gasoil / essence), grille kilométrique par véhicule (tarif/km, conso L/100km, carburant/km, forfait), routes de Madagascar, coefficients de majoration.
- **🧮 Calculateur Rapide** — estimation automatique d'un prix.
- **📊 Historique Devis** — suivi des devis **et des paiements** (voir ci-dessous).
- **🧾 Reçu de paiement** — quittance / facturation finale (voir ci-dessous).

## 🧾 Reçu de paiement (quittance)

Feuille reçu qui reprend **automatiquement** les infos du devis (n°, client,
total TTC) et enregistre un encaissement :

- **Nature du paiement** (liste déroulante) : *Acompte 50 % (à la commande)*,
  *Solde 50 % (à la livraison)*, *Paiement intégral (100 %)* ou *Montant libre*.
- **Mode de paiement** (liste déroulante) : MVola, Orange Money, Airtel Money,
  Virement, Espèces.
- Calcule le **montant reçu**, le **reste à payer** et le **statut**
  (✅ SOLDÉ / ⏳ reste à payer), et écrit le **montant reçu en toutes lettres**
  (Ariary), automatiquement.

Il suffit de remplir le devis, puis de choisir la nature et le mode de paiement
sur la feuille reçu : tout se calcule seul.

## 📊 Suivi des paiements (Historique)

Le tableau de l'historique suit aussi les **règlements** de chaque devis :

- colonnes **ACOMPTE (Ar)** et **SOLDE (Ar)** à saisir ;
- **ENCAISSÉ**, **RESTE** et **PAIEMENT** (✅ Soldé / ⏳ Partiel / ❌ Impayé,
  « — » si le devis n'est pas accepté) calculés **automatiquement** ;
- statistiques d'encaissement : total facturé, total encaissé, reste à
  encaisser, **taux d'encaissement**, nombre de devis soldés / partiels.

## Carburant automatique selon le véhicule

Le champ **« Type de véhicule »** (cellule `C25`) est une **liste déroulante**
(plage nommée `Vehicules` = grille des 10 véhicules de la feuille Paramètres).
Quand on choisit un véhicule, le devis se recalcule tout seul :

- **Ligne transport** — tarif/km = tarif du véhicule sélectionné
  (`INDEX/MATCH` sur la grille) ; quantité = distance aller (`C24`).
- **Ligne carburant** — *« Carburant aller-retour (selon véhicule) »* :
  - quantité = **litres de l'aller-retour** = `distance × 2 × conso(véhicule) / 100` ;
  - prix au litre (**gasoil ou essence** selon le véhicule) déduit automatiquement
    de la grille → le montant change dès qu'on change de véhicule.

> La ligne **« Retour véhicule à vide (repositionnement) »** a été supprimée :
> le retour est désormais couvert par le carburant aller-retour.

## Montant total en toutes lettres (automatique)

Juste sous **« TOTAL À PAYER (TTC) »**, une ligne affiche le montant en toutes
lettres et **se met à jour automatiquement** avec le total :

> *Arrêté le présent devis à la somme de deux millions trente et un mille sept cents Ariary.*

La conversion est faite **uniquement par formules** (aucune macro), via la feuille
masquée `Lettres`. Le classeur est réglé pour **recalculer à l'ouverture**.

Pour faire varier les prix : modifiez le **prix du carburant** ou la **grille
kilométrique** dans la feuille **⚙️ Paramètres** — tout le devis se met à jour.

## Autres caractéristiques

- Tableau des prestations à désignations multiples (numérotation `N°`
  auto-incrémentée), lignes optionnelles à quantité 0.
- Formules de totaux (SOUS-TOTAL, remise, base imposable, TVA, TTC) et zone
  d'impression recalculées automatiquement.
- Listes déroulantes Oui/Non (TVA, options du Calculateur) et choix guidé du véhicule.
- Mise en forme soignée conservée (zébrure, format Ariary, fusions) ; logo d'en-tête préservé.

## Régénérer le fichier

```bash
pip install openpyxl Pillow   # Pillow indispensable pour conserver le logo

# Étape 1 : carburant auto par véhicule + suppression du retour à vide
python3 scripts/devis-carburant-vehicule.py \
  docs/devis/OneWay_Devis_Transport.base.xlsx /tmp/devis-etape1.xlsx

# Étape 2 : ligne « montant en toutes lettres »
python3 scripts/devis-montant-lettres.py \
  /tmp/devis-etape1.xlsx /tmp/devis-etape2.xlsx

# Étape 3 : feuille « Reçu de paiement »
python3 scripts/devis-recu-paiement.py \
  /tmp/devis-etape2.xlsx /tmp/devis-etape3.xlsx

# Étape 4 : suivi des paiements dans l'historique
python3 scripts/historique-paiements.py \
  /tmp/devis-etape3.xlsx docs/devis/OneWay_Devis_Transport.xlsx
```

> Tous les montants sont en Ariary (MGA).
