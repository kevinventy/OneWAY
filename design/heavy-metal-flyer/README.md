# Affiche Heavy Metal — SERPENT THRONE (fictif)

Affiche/flyer de concert Heavy Metal au format **PowerPoint entièrement éditable**.
Événement, groupes, salle, tarifs et contacts sont **fictifs**, créés pour la démonstration graphique.

**Fichier livré : [`AFFICHE-SERPENT-THRONE-LYON-2026.pptx`](AFFICHE-SERPENT-THRONE-LYON-2026.pptx)** — A4 portrait (210 × 297 mm), 3 diapositives.

| # | Diapositive | Contenu |
|---|---|---|
| 1 | **Recto — l'affiche** | Emblème, tête d'affiche, premières parties, date, salle, 3 tarifs, billetterie, mentions légales, partenaires |
| 2 | **Verso — infos pratiques** | Déroulé horaire complet, tarifs détaillés, accès & transports, règlement, merch & meet, sécurité/PMR, contacts |
| 3 | **Kit de marque** | Palette hexadécimale, règles typographiques, mode d'emploi, checklist avant impression, formats d'export |

## L'événement (fiction)

**SERPENT THRONE** (Oslo) — *The Molten Crown Tour MMXXVI*
Samedi 24 octobre 2026 · Halle Vulcain, 12 quai des Forges, 69007 Lyon
Portes 18h30 · premier riff 19h15 · couvre-feu 01h00 · jauge 4 800
Premières parties : NIGHTFORGE (Sheffield), ASHEN CROWN (Göteborg), VULTURE MASS (Montréal), SŒURS DE FER (Lyon)
Prévente 39 € · sur place 45 € · fosse VIP « Ordre du Crâne » 89 €
Production : Black Anvil Concerts — partenaire radio : Radio Vulcain 101.7 FM

## Direction artistique

| Rôle | Hex | Nom |
|---|---|---|
| Fond dominant (~65 %) | `08070A` | Noir de forge |
| Appui | `9E0B12` | Sang séché |
| Accent | `FF5A1F` | Braise |
| Accent secondaire | `F2B43A` | Or fondu |
| Texte principal | `F2ECE0` | Os |
| Texte secondaire | `9A8F85` | Cendre |

Motif répété : le losange de braise (sceau, ornements, intertitres, cartouches).
Typographie : **Arial Black** (titres, prix, heures) + **Arial** (courant) — deux polices présentes sur toute
installation Office, donc aucun risque de substitution chez l'imprimeur.

## Régénérer le fichier

Les textures (fonds braise, sceau, rayons, ornement) sont générées par code, pas dessinées à la main.

```bash
cd design/heavy-metal-flyer/build
python3 make_assets.py     # -> assets/*.jpg|png   (Pillow + numpy)
node make_flyer.js         # -> ../AFFICHE-SERPENT-THRONE-LYON-2026.pptx   (pptxgenjs)
```

Modifier la palette ou la mise en page : les constantes sont en tête de `make_flyer.js`
(couleurs, polices, marges), celles des textures en tête de `make_assets.py`.

## Impression

Exporter depuis PowerPoint : *Fichier ▸ Exporter ▸ PDF*, qualité « Impression ».
Pour un fond perdu de 3 mm, agrandir les images de fond de 3 mm sur chaque bord avant export.
Supprimer la diapositive 3 (kit de marque) avant envoi à l'imprimeur.
