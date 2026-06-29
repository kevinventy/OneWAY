# Devis de transport — One Way 🇲🇬

Classeur Excel de devis pour **One Way SARL** (transport · livraison · suivi digital, Antananarivo).

## Fichiers

| Fichier | Rôle |
|---|---|
| `OneWay_Devis_Transport.xlsx` | **Devis final** (version améliorée — à utiliser) |
| `OneWay_Devis_Transport.base.xlsx` | Version source v2 (provenance) |
| `../../scripts/ameliore-devis.py` | Script de transformation (reproductible) |

## Feuilles

- **📋 Devis Client** — devis imprimable (en-tête, infos client, paramètres transport, tableau des prestations, totaux, conditions, signatures).
- **⚙️ Paramètres** — tarifs de référence : prix carburant, grille kilométrique par véhicule, routes principales de Madagascar, coefficients de majoration.
- **🧮 Calculateur Rapide** — estimation automatique d'un prix à partir de la distance, du véhicule et des options.
- **📊 Historique Devis** — suivi des devis émis et statistiques (taux de conversion, CA).

## Améliorations apportées

### Désignations ajoutées au tableau des prestations (n° 18 à 33)

Le tableau passe de 17 à **33 désignations**. Les nouvelles lignes sont
optionnelles (quantité 0 par défaut) et constituent un catalogue de services
adapté au contexte malgache :

| N° | Désignation | Type | Unité | P.U. (Ar) |
|---:|---|---|---|---:|
| 18 | Frais de bac / traversée fluviale | Transport | traversée | 80 000 |
| 19 | Ristournes / frais de barrière communale | Administratif | forfait | 25 000 |
| 20 | Emballage / palettisation / film étirable | Conditionnement | forfait | 20 000 |
| 21 | Hayon élévateur / transpalette (livraison) | Manutention | forfait | 25 000 |
| 22 | Livraison à l'étage / portage manuel | Main d'œuvre | étage | 10 000 |
| 23 | Stockage / entreposage temporaire | Logistique | jour | 20 000 |
| 24 | Chauffeur supplémentaire (longue distance) | Main d'œuvre | jour | 50 000 |
| 25 | Frais de mission chauffeur (nuitée + repas) | Frais | nuitée | 40 000 |
| 26 | Point de chargement / livraison supplémentaire | Transport | point | 30 000 |
| 27 | Relivraison (destinataire absent) | Transport | forfait | 35 000 |
| 28 | Preuve de livraison numérique (photos + e-signature) | Digital | forfait | **offert** |
| 29 | Encaissement à la livraison (Mobile Money / COD) | Financier | forfait | 15 000 |
| 30 | Surestaries / immobilisation conteneur | Supplément | jour | 60 000 |
| 31 | Empotage / dépotage conteneur | Main d'œuvre | forfait | 80 000 |
| 32 | Nettoyage / désinfection caisse (denrées, animaux) | Entretien | forfait | 20 000 |
| 33 | Supplément saison des pluies / piste dégradée | Supplément | forfait | 30 000 |

### Autres améliorations

- Formules de totaux (SOUS-TOTAL, remise, base imposable, TVA, TTC) et zone
  d'impression mises à jour automatiquement pour intégrer les nouvelles lignes.
- Mise en forme (zébrure, polices, bordures, format Ariary, fusions) conservée à
  l'identique ; la prestation digitale n° 28 est mise en avant comme le suivi GPS.
- **Listes déroulantes** ajoutées : Oui/Non sur la TVA (Devis) et sur les options
  du Calculateur, et choix guidé du type de véhicule (1 → 10).

## Régénérer le fichier

```bash
python3 scripts/ameliore-devis.py \
  docs/devis/OneWay_Devis_Transport.base.xlsx \
  docs/devis/OneWay_Devis_Transport.xlsx
```

> Dépendances : `pip install openpyxl Pillow` (Pillow est indispensable pour
> conserver le logo de l'en-tête). Tous les montants sont en Ariary (MGA) ;
> ajustez le prix du carburant dans la feuille **⚙️ Paramètres** pour recalculer
> automatiquement tous les frais de carburant.
