#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Amélioration du classeur « Devis Transport — One Way ».

Ajoute de nouvelles désignations de prestations au tableau de la feuille
« Devis Client » (en préservant exactement la mise en forme : zébrure,
polices, bordures, formats Ariary, fusions), décale proprement le bloc
totaux / conditions / pied de page, corrige les formules (sous-total,
remise, TVA, total) et la zone d'impression, puis ajoute quelques listes
déroulantes (Oui/Non, type de véhicule) pour faciliter la saisie.

Usage :
    python3 scripts/ameliore-devis.py <fichier_source.xlsx> <fichier_sortie.xlsx>

Dépendances :
    pip install openpyxl Pillow
    (Pillow est INDISPENSABLE : sans lui, openpyxl supprime silencieusement le
     logo de l'en-tête lors de l'enregistrement.)
"""
import copy
import io
import sys
import zipfile

import openpyxl
from openpyxl.drawing.image import Image as XLImage
from openpyxl.utils import range_boundaries
from openpyxl.worksheet.datavalidation import DataValidation

SHEET = "📋 Devis Client"

# ── Nouvelles désignations (n°, libellé, TYPE, QTÉ déf., UNITÉ, P.U. Ar, style) ──
# style : "white" (fond blanc) · "alt" (fond gris-bleu) · "hl" (mise en avant)
NEW_ITEMS = [
    (18, "Frais de bac / traversée fluviale",                 "Transport",      0, "traversée", 80000,  "alt"),
    (19, "Ristournes / frais de barrière communale",          "Administratif",  0, "forfait",   25000,  "white"),
    (20, "Emballage / palettisation / film étirable",         "Conditionnement",0, "forfait",   20000,  "alt"),
    (21, "Hayon élévateur / transpalette (livraison)",        "Manutention",    0, "forfait",   25000,  "white"),
    (22, "Livraison à l'étage / portage manuel",              "Main d'œuvre",   0, "étage",     10000,  "alt"),
    (23, "Stockage / entreposage temporaire",                 "Logistique",     0, "jour",      20000,  "white"),
    (24, "Chauffeur supplémentaire (longue distance)",        "Main d'œuvre",   0, "jour",      50000,  "alt"),
    (25, "Frais de mission chauffeur (nuitée + repas)",       "Frais",          0, "nuitée",    40000,  "white"),
    (26, "Point de chargement / livraison supplémentaire",    "Transport",      0, "point",     30000,  "alt"),
    (27, "Relivraison (destinataire absent)",                 "Transport",      0, "forfait",   35000,  "white"),
    (28, "Preuve de livraison numérique (photos + e-signature)", "Digital",     1, "forfait",   0,      "hl"),
    (29, "Encaissement à la livraison (Mobile Money / COD)",  "Financier",      0, "forfait",   15000,  "white"),
    (30, "Surestaries / immobilisation conteneur",            "Supplément",     0, "jour",      60000,  "alt"),
    (31, "Empotage / dépotage conteneur",                     "Main d'œuvre",   0, "forfait",   80000,  "white"),
    (32, "Nettoyage / désinfection caisse (denrées, animaux)","Entretien",      0, "forfait",   20000,  "alt"),
    (33, "Supplément saison des pluies / piste dégradée",     "Supplément",     0, "forfait",   30000,  "white"),
]

# Lignes-modèles existantes (n'ont pas bougé : elles sont au-dessus du point d'insertion)
TEMPLATE_ROW = {"white": 30, "alt": 33, "hl": 38}

INSERT_AT = 47          # 1ʳᵉ ligne libre juste après la dernière prestation (item 17 = ligne 46)
LAST_COL = 10           # A..J


def main(src, dst):
    try:
        import PIL  # noqa: F401
    except ImportError:
        print("⚠️  Pillow absent : le logo de l'en-tête risque d'être perdu. "
              "Installez-le avec `pip install Pillow`.", file=sys.stderr)
    wb = openpyxl.load_workbook(src)
    ws = wb[SHEET]
    n = len(NEW_ITEMS)
    max_row = ws.max_row

    # 1) Mémoriser fusions et hauteurs de lignes du bloc à décaler ----------------
    merges = [str(m) for m in ws.merged_cells.ranges]
    old_heights = {r: ws.row_dimensions[r].height
                   for r in range(INSERT_AT, max_row + 1)
                   if r in ws.row_dimensions and ws.row_dimensions[r].height is not None}

    for m in merges:
        ws.unmerge_cells(m)

    # 2) Décaler les cellules vers le bas (de bas en haut pour ne rien écraser) ----
    for r in range(max_row, INSERT_AT - 1, -1):
        for col in range(1, LAST_COL + 1):
            src_cell = ws.cell(row=r, column=col)
            tgt_cell = ws.cell(row=r + n, column=col)
            tgt_cell.value = src_cell.value
            if src_cell.has_style:
                tgt_cell._style = copy.copy(src_cell._style)
            src_cell.value = None
            src_cell._style = copy.copy(ws.cell(row=1, column=1)._style)

    # 3) Hauteurs de lignes -------------------------------------------------------
    for r in range(INSERT_AT, max_row + n + 1):
        if r in ws.row_dimensions:
            ws.row_dimensions[r].height = None
    for r, h in old_heights.items():
        ws.row_dimensions[r + n].height = h
    for r in range(INSERT_AT, INSERT_AT + n):
        ws.row_dimensions[r].height = 19

    # 4) Restaurer les fusions (décalées si sous le point d'insertion) ------------
    for m in merges:
        min_col, min_row, max_col, max_r = range_boundaries(m)
        if min_row >= INSERT_AT:
            min_row += n
            max_r += n
        ws.merge_cells(start_row=min_row, start_column=min_col,
                       end_row=max_r, end_column=max_col)
    # Fusion C:D de chaque nouvelle ligne (comme les lignes de prestations)
    for r in range(INSERT_AT, INSERT_AT + n):
        ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=4)

    # 5) Écrire les nouvelles désignations ---------------------------------------
    r = INSERT_AT
    for num, desig, typ, qte, unite, pu, kind in NEW_ITEMS:
        t = TEMPLATE_ROW[kind]
        for col in range(2, 10):  # B..I (D inclus pour la fusion)
            tgt = ws.cell(row=r, column=col)
            tgt._style = copy.copy(ws.cell(row=t, column=col)._style)
        ws.cell(row=r, column=2).value = num
        ws.cell(row=r, column=3).value = desig
        ws.cell(row=r, column=5).value = typ
        ws.cell(row=r, column=6).value = qte
        ws.cell(row=r, column=7).value = unite
        ws.cell(row=r, column=8).value = pu
        ws.cell(row=r, column=9).value = f"=F{r}*H{r}"
        r += 1

    # 6) Corriger les formules du bloc totaux (décalé de n lignes) ----------------
    last_data = 46 + n          # dernière ligne de prestation
    sub = INSERT_AT + n         # SOUS-TOTAL H.T.
    rem = sub + 1               # Remise commerciale
    base = sub + 2              # Base imposable
    tva = sub + 3               # TVA
    ttc = sub + 4               # TOTAL TTC
    ws.cell(row=sub,  column=7).value = f"=SUM(I30:I{last_data})"
    ws.cell(row=rem,  column=7).value = f"=-ROUND(G{sub}*F{rem}/100,0)"
    ws.cell(row=base, column=7).value = f"=G{sub}+G{rem}"
    ws.cell(row=tva,  column=7).value = f'=IF(F{tva}="Oui",ROUND(G{base}*0.2,0),0)'
    ws.cell(row=ttc,  column=7).value = f"=G{base}+G{tva}"

    # 7) Liste déroulante Oui/Non sur la cellule TVA -----------------------------
    dv_yn = DataValidation(type="list", formula1='"Oui,Non"', allow_blank=True)
    ws.add_data_validation(dv_yn)
    dv_yn.add(ws.cell(row=tva, column=6))  # F{tva}

    # 8) Étendre la zone d'impression au nouveau bas de page ---------------------
    new_max = max_row + n
    ws.print_area = f"A1:J{new_max}"

    # 8 bis) Garantir la présence du logo -----------------------------------------
    # openpyxl conserve normalement l'image d'origine (ancrée en B2). Par sécurité,
    # on la réinjecte uniquement si elle a été perdue au chargement.
    if not ws._images:
        with zipfile.ZipFile(src) as z:
            media = [m for m in z.namelist() if m.startswith("xl/media/")]
            if media:
                logo = XLImage(io.BytesIO(z.read(media[0])))
                logo.width = 150   # px (= 1428750 EMU, taille d'origine)
                logo.height = 150
                ws.add_image(logo, "B2")

    # 9) Améliorations d'usage sur la feuille Calculateur ------------------------
    calc = wb["🧮 Calculateur Rapide"]
    dv_yn2 = DataValidation(type="list", formula1='"Oui,Non"', allow_blank=True)
    calc.add_data_validation(dv_yn2)
    for cell in ("C13", "C14", "C15", "C17"):
        dv_yn2.add(calc[cell])
    dv_veh = DataValidation(type="whole", operator="between",
                            formula1="1", formula2="10", allow_blank=False,
                            error="Choisir un type de véhicule de 1 (moto) à 10 (conteneur 40').",
                            errorTitle="Type de véhicule")
    calc.add_data_validation(dv_veh)
    dv_veh.add(calc["C10"])

    wb.save(dst)
    print(f"OK — {n} désignations ajoutées (n° 18 à {17 + n}). Tableau : lignes 30 à {last_data}.")
    print(f"Totaux : SOUS-TOTAL ligne {sub}, TTC ligne {ttc}. Zone d'impression A1:J{new_max}.")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("Usage: python3 scripts/ameliore-devis.py <source.xlsx> <sortie.xlsx>")
    main(sys.argv[1], sys.argv[2])
