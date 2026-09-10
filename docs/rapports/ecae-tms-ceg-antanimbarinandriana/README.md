# Rapport de compensation — TMS CEG Antanimbarinandriana

Réf. ECAE/TMS-ANT/2026-RC-01 — réception provisoire du terrain multisport et des
vestiaires du CEG Antanimbarinandriana (projet PE_MVOLA_14, Fondation AXIAN).

## Version v4

Reprise de la v3 (Word → « Microsoft: Print To PDF ») avec deux changements :

1. La section « 5. CONCLUSION ET DEMANDE » est supprimée. Elle est remplacée par
   un simple encadré **Remarque** : l'ECAE ne demande pas le règlement des
   plus-values, ces travaux ayant été exécutés uniquement parce qu'ils étaient
   nécessaires à la sécurité des élèves, à la solidité et à la durée de vie de
   l'ouvrage.
2. Le bloc de signatures ne conserve que le **cachet de l'ECAE** ; les cases
   CEG, Responsable de construction — MEN et CUA sont retirées.

Tout le reste (chiffres, tableaux, mise en page, en-tête, pied de page) est
identique à la v3.

## Fichiers

| Fichier | Rôle |
|---|---|
| `Rapport de compensation - TMS CEG Antanimbarinandriana - v4.docx` | document modifiable (Word) |
| `Rapport de compensation - TMS CEG Antanimbarinandriana - v4.pdf` | version imprimable |
| `build.js` | script de génération du .docx |
| `stamp.jpg` | cachet et signature du Directeur Général |

## Régénérer

```bash
npm install docx          # dépendance unique du script
node build.js             # -> Rapport_de_compensation_TMS_CEG_Antanimbarinandriana.docx
soffice --headless --convert-to pdf <fichier>.docx   # ou « Enregistrer au format PDF » depuis Word
```

Le document est composé en Calibri 9,5–16 pt sur A4, marges 1,9 cm. Palette :
marine `#123A4E`, bleu `#1F6F8B`, turquoise `#2E9CA6`, fonds `#DCEAF0` /
`#F2F7FA` / `#EAF6F7` / `#BFE3E6`, filets de tableau `#C9D8DF`.
