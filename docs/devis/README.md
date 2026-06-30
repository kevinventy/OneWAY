# Devis de transport — One Way 🇲🇬

Classeur Excel de devis pour **One Way SARL** (transport · livraison · suivi digital, Antananarivo).

## Fichiers

| Fichier | Rôle |
|---|---|
| `OneWay_Devis_Transport.xlsx` | **Devis final** (version améliorée — à utiliser) |
| `OneWay_Devis_Transport.base.xlsx` | Dernière source fournie (provenance) |
| `../../scripts/devis-carburant-vehicule.py` | Transformation appliquée à la base (reproductible) |
| `../../scripts/ameliore-devis.py` | Utilitaire historique : ajout de désignations |

## Feuilles

- **📋 Devis Client** — devis imprimable (en-tête, infos client, paramètres transport, tableau des prestations, totaux, conditions, signatures).
- **⚙️ Paramètres** — tarifs de référence : prix carburant (gasoil / essence), grille kilométrique par véhicule (tarif/km, conso L/100km, carburant/km, forfait), routes de Madagascar, coefficients de majoration.
- **🧮 Calculateur Rapide** — estimation automatique d'un prix.
- **📊 Historique Devis** — suivi des devis et statistiques.

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
python3 scripts/devis-carburant-vehicule.py \
  docs/devis/OneWay_Devis_Transport.base.xlsx \
  docs/devis/OneWay_Devis_Transport.xlsx
```

> Tous les montants sont en Ariary (MGA).
