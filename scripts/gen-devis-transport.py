#!/usr/bin/env python3
"""
Génère le classeur ONE WAY « OneWay_Devis_Transport.xlsx ».

Points clés du modèle :
  * Logo officiel ONE WAY embarqué dans l'en-tête du devis.
  * Carburant explicite, calculé selon la consommation propre à CHAQUE type de
    transport et le prix courant du gasoil / essence (modifiable).
  * Le trajet se fait en ALLER-RETOUR : le véhicule doit revenir. Le retour
    (souvent à vide) est facturé au prix de l'aller × un coefficient « retour à
    vide » paramétrable (0,7 par défaut).
  * Désignations enrichies (arrimage, suivi GPS, douane, gardiennage…).

Source de vérité de l'Excel ; mêmes chiffres dans `src/data/catalog.ts`.

Régénérer :  python3 scripts/gen-devis-transport.py
Dépendances :  pip install openpyxl Pillow
"""
from __future__ import annotations

import os
from openpyxl import Workbook
from openpyxl.drawing.image import Image as XLImage
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------------------------------------------------------------------------
# Données de référence (miroir de src/data/catalog.ts)
# ---------------------------------------------------------------------------
FUEL = {"DIESEL": 4_900, "ESSENCE": 5_100}  # Ariary / litre
RETURN_RATE = 0.7  # coefficient « retour à vide » (aller-retour)

# (label, capacité, tarif/km HORS carburant, type carburant, conso L/100km,
#  forfait base, majoration véhicule)
VEHICLES = [
    ("🛵 Moto-taxi / Tricycle", "< 200 kg", 800, "ESSENCE", 3, 15_000, 0.00),
    ("🚐 Camionnette légère", "200 – 800 kg", 1_200, "DIESEL", 10, 30_000, 0.10),
    ("🚚 Camion 3 tonnes", "800 kg – 3 T", 1_900, "DIESEL", 18, 60_000, 0.15),
    ("🚚 Camion 5 tonnes", "3 T – 5 T", 2_800, "DIESEL", 25, 100_000, 0.20),
    ("🚛 Camion 10 tonnes", "5 T – 10 T", 3_900, "DIESEL", 32, 180_000, 0.25),
    ("🚛 Semi-remorque 20 T", "10 T – 20 T", 5_600, "DIESEL", 38, 300_000, 0.30),
    ("❄️ Camion frigorifique 5 T", "3 T – 5 T frigo", 3_800, "DIESEL", 28, 150_000, 0.20),
    ("🚜 Camion benne", "Jusqu'à 15 T", 4_300, "DIESEL", 35, 200_000, 0.25),
    ("📦 Conteneur 20 pieds", "Max 24 T", 4_600, "DIESEL", 38, 250_000, 0.35),
    ("📦 Conteneur 40 pieds", "Max 28 T", 6_300, "DIESEL", 45, 400_000, 0.40),
]

ROUTES = [
    ("Antananarivo → Toamasina", 357, "5h30"),
    ("Antananarivo → Antsirabe", 167, "3h00"),
    ("Antananarivo → Mahajanga", 472, "8h00"),
    ("Antananarivo → Fianarantsoa", 404, "7h00"),
    ("Antananarivo → Toliara", 756, "13h00"),
    ("Antananarivo → Ambositra", 258, "4h30"),
    ("Antananarivo → Moramanga", 109, "2h00"),
    ("Antananarivo → Antalaha", 820, "15h00"),
    ("Antananarivo → Fort-Dauphin", 950, "18h00"),
    ("Toamasina → Mahajanga", 720, "14h00"),
    ("Antsirabe → Fianarantsoa", 237, "4h30"),
    ("Mahajanga → Antsiranana", 620, "11h30"),
]

COEFFS = [
    ("Marchandises générales (référence)", "×1.00", 0, "Tarif de base"),
    ("Produits périssables / alimentaires", "×1.35", 20_000, "Urgence + conditionnement"),
    ("Marchandises fragiles / électroniques", "×1.25", 15_000, "Emballage soigné"),
    ("Matériaux lourds (ciment, ferraille)", "×1.15", 10_000, "Renforcement camion"),
    ("Produits dangereux (ADR homologués)", "×1.80", 50_000, "Conformité réglementaire"),
    ("Conteneur chargé (FCL)", "×2.10", 80_000, "Équipement spécial"),
    ("Convoi exceptionnel (>48T)", "×3.00", 120_000, "Escorte police obligatoire"),
    ("Animaux vivants", "×1.60", 35_000, "Conditions spéciales"),
    ("Service express (J+1)", "+30%", 25_000, "Majoration urgence"),
    ("Livraison de nuit (22h-6h)", "+20%", 18_000, "Majoration horaire"),
    ("Zones rurales / pistes dégradées", "+25%", 22_000, "Usure + surconsommation"),
    ("Transport frigorifique", "+40%", 45_000, "Groupe froid (carburant compté à part)"),
]

ROUTE_VEH = {"3T": 2, "5T": 3, "SEMI": 5}


def route_total(dist: int, vidx: int) -> int:
    """Prix de référence ALLER-RETOUR (général) — arrondi au millier."""
    _, _, rate, ftype, conso, base, sur = VEHICLES[vidx]
    haulage = dist * rate * (1 + sur)
    fuel = dist * conso / 100 * FUEL[ftype]
    return round((base + (haulage + fuel) * (1 + RETURN_RATE)) / 1000) * 1000


# ---------------------------------------------------------------------------
# Styles
# ---------------------------------------------------------------------------
NAVY = "1E3A5F"; NAVY2 = "2A4A72"; ORANGE = "E07B20"
LIGHT = "EAF0F7"; LIGHT2 = "F4F7FB"; ZEBRA = "F7F9FC"; LINE = "C9D4E0"
WHITE = "FFFFFF"; INK = "1F2937"; MUTED = "5B6B7F"

AR = '#,##0" Ar"'; ARKM = '#,##0" Ar"'; LCONS = '0" L/100"'; PCT = '"+ "0%'

thin = Side(style="thin", color=LINE)
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)

LEFT = Alignment(horizontal="left", vertical="center")
CENTER = Alignment(horizontal="center", vertical="center", wrap_text=True)
RIGHT = Alignment(horizontal="right", vertical="center")
LEFTW = Alignment(horizontal="left", vertical="center", wrap_text=True)


def fill(hex_):
    return PatternFill("solid", fgColor=hex_)


def font(size=10, bold=False, color=INK, italic=False):
    return Font(name="Calibri", size=size, bold=bold, color=color, italic=italic)


def setcell(ws, coord, value=None, *, f=None, fl=None, al=None, b=False, nf=None):
    c = ws[coord]
    if value is not None:
        c.value = value
    if f: c.font = f
    if fl: c.fill = fl
    if al: c.alignment = al
    if b: c.border = BORDER
    if nf: c.number_format = nf
    return c


def section_bar(ws, row, c0, c1, text):
    a, b = get_column_letter(c0), get_column_letter(c1)
    ws.merge_cells(f"{a}{row}:{b}{row}")
    setcell(ws, f"{a}{row}", text, f=font(11, True, WHITE), fl=fill(NAVY), al=LEFT)
    ws.row_dimensions[row].height = 22


def table_header(ws, row, cols):
    for letter, text, al in cols:
        setcell(ws, f"{letter}{row}", text, f=font(9.5, True, WHITE), fl=fill(NAVY2), al=al, b=True)
    ws.row_dimensions[row].height = 26


def fill_block(ws, r0, r1, c0, c1, hexcolor):
    for r in range(r0, r1 + 1):
        for c in range(c0, c1 + 1):
            ws.cell(row=r, column=c).fill = fill(hexcolor)


# ---------------------------------------------------------------------------
wb = Workbook()

# ===========================================================================
# Onglet 1 — 📋 Devis Client
# ===========================================================================
ws = wb.active
ws.title = "📋 Devis Client"
ws.sheet_view.showGridLines = False
ws.sheet_properties.tabColor = NAVY
for col, w in {"A": 3, "B": 30, "C": 20, "D": 12, "E": 10, "F": 11,
               "G": 16, "H": 16, "I": 14, "J": 3}.items():
    ws.column_dimensions[col].width = w

# En-tête blanc avec logo officiel + titre
for r in range(2, 10):
    ws.row_dimensions[r].height = 18
logo_path = os.path.join(ROOT, "public", "logo.png")
if os.path.exists(logo_path):
    try:
        img = XLImage(logo_path)
        img.width, img.height = 150, 150
        ws.add_image(img, "B2")
    except Exception as exc:  # pragma: no cover
        print("⚠️  logo non embarqué:", exc)
ws.merge_cells("E3:I4")
setcell(ws, "E3", "DEVIS DE TRANSPORT", f=font(22, True, NAVY),
        al=Alignment(horizontal="right", vertical="center"))
ws.merge_cells("E5:I6")
setcell(ws, "E5", "Transport · Livraison · Suivi Digital",
        f=font(11, False, ORANGE), al=Alignment(horizontal="right", vertical="center"))
# filet orange + navy
for c in range(2, 10):
    ws.cell(row=9, column=c).fill = fill(ORANGE)
ws.row_dimensions[9].height = 4

ws.row_dimensions[10].height = 6
setcell(ws, "B11", "N° DEVIS :", f=font(9, True, MUTED), al=LEFT)
setcell(ws, "C11", '="OW-"&TEXT(\'⚙️ Paramètres\'!C9,"0000")&"-"&TEXT(TODAY(),"MMYYYY")',
        f=font(10, True, NAVY), al=LEFT)
setcell(ws, "E11", "DATE :", f=font(9, True, MUTED), al=LEFT)
setcell(ws, "F11", "=TODAY()", f=font(10, True, INK), al=LEFT, nf="DD/MM/YYYY")
setcell(ws, "G11", "VALIDE JUSQU'AU :", f=font(9, True, MUTED), al=RIGHT)
setcell(ws, "H11", "=TODAY()+'⚙️ Paramètres'!C13", f=font(10, True, INK), al=RIGHT, nf="DD/MM/YYYY")
ws.row_dimensions[11].height = 20
ws.row_dimensions[12].height = 6

ws.merge_cells("B13:E13")
setcell(ws, "B13", "  👤  INFORMATIONS CLIENT", f=font(10, True, WHITE), fl=fill(NAVY2), al=LEFT)
ws.merge_cells("F13:I13")
setcell(ws, "F13", "  🚛  ONE WAY — TRANSPORT", f=font(10, True, WHITE), fl=fill(ORANGE), al=LEFT)
ws.row_dimensions[13].height = 20
client = [
    ("Nom / Société :", "Nom du client", "Société :", "One Way SARL"),
    ("Adresse :", "Adresse complète", "Adresse :", "Antananarivo, Madagascar"),
    ("Ville :", "Antananarivo", "Téléphone :", "+261 XX XXX XX XX"),
    ("Téléphone :", "+261 XX XXX XX XX", "Email :", "contact@oneway.mg"),
    ("Email :", "client@email.mg", "MVola :", "0XX XX XXX XX"),
    ("N° Client :", "OW-CLI-001", "NIF / STAT :", "XXX XXX XXX"),
]
for i, (lc, vc, lo, vo) in enumerate(client):
    r = 14 + i
    setcell(ws, f"B{r}", lc, f=font(9, True, MUTED), al=LEFT)
    ws.merge_cells(f"C{r}:E{r}"); setcell(ws, f"C{r}", vc, f=font(10, color=INK), al=LEFT)
    setcell(ws, f"F{r}", lo, f=font(9, True, MUTED), al=LEFT)
    ws.merge_cells(f"G{r}:I{r}"); setcell(ws, f"G{r}", vo, f=font(10, color=INK), al=LEFT)
    ws.row_dimensions[r].height = 18

ws.row_dimensions[20].height = 6
section_bar(ws, 21, 2, 9, "  📍  PARAMÈTRES DU TRANSPORT")
trans = [
    ("Point de chargement :", "Antananarivo", "Point de livraison :", "Toamasina"),
    ("Distance estimée (km) :", 357, "Trajet :", "Aller-retour"),
    ("Type de véhicule :", "Camion 5 tonnes", "Type de marchandise :", "Générale"),
    ("Date de transport :", "—", "Durée estimée :", "5h30 (aller)"),
    ("Type de route :", "Route nationale", "Conditions particulières :", "—"),
]
for i, (lc, vc, lo, vo) in enumerate(trans):
    r = 22 + i
    setcell(ws, f"B{r}", lc, f=font(9, True, MUTED), al=LEFT)
    ws.merge_cells(f"C{r}:E{r}"); setcell(ws, f"C{r}", vc, f=font(10, color=INK), al=LEFT)
    setcell(ws, f"F{r}", lo, f=font(9, True, MUTED), al=LEFT)
    ws.merge_cells(f"G{r}:I{r}"); setcell(ws, f"G{r}", vo, f=font(10, color=INK), al=LEFT)
    ws.row_dimensions[r].height = 18

ws.row_dimensions[27].height = 6
section_bar(ws, 28, 2, 9, "  📦  DÉTAIL DES PRESTATIONS")
hdr = 29
for letter, text, al in [("B", "N°", CENTER), ("C", "DÉSIGNATION / DESCRIPTION", LEFT),
                         ("E", "TYPE", CENTER), ("F", "QTÉ", CENTER), ("G", "UNITÉ", CENTER),
                         ("H", "P.U. (Ar)", CENTER), ("I", "TOTAL (Ar)", CENTER)]:
    setcell(ws, f"{letter}{hdr}", text, f=font(9, True, WHITE), fl=fill(NAVY2), al=al, b=True)
ws.merge_cells(f"C{hdr}:D{hdr}"); ws[f"D{hdr}"].fill = fill(NAVY2); ws[f"D{hdr}"].border = BORDER
ws.row_dimensions[hdr].height = 24

start = 30
# (désignation, type, qté, unité, P.U.)  — exemple : Camion 5T, 357 km, A/R, général
PRESTA = [
    ("Transport marchandises — aller (chargé), tarif km", "Transport", 357, "km", 2_800),
    ("Carburant aller (gasoil) — selon véhicule", "Carburant", 89, "litre", "='⚙️ Paramètres'!C18"),
    ("Retour véhicule à vide (repositionnement)", "Aller-retour", 1, "forfait",
     "=ROUND((I30+I31)*'⚙️ Paramètres'!C15,0)"),
    ("Forfait prise en charge / frais fixes de base", "Transport", 1, "forfait", 100_000),
    ("Majoration type de marchandise (coefficient)", "Supplément", 0, "forfait", 0),
    ("Manutention au chargement", "Main d'œuvre", 1, "forfait", 15_000),
    ("Manutention au déchargement", "Main d'œuvre", 1, "forfait", 15_000),
    ("Arrimage / sanglage / bâchage", "Sécurité", 1, "forfait", 25_000),
    ("Suivi GPS temps réel (plateforme ONE WAY)", "Digital", 1, "forfait", 15_000),
    ("Assurance marchandise (% valeur déclarée)", "Assurance", 0, "% valeur", 0),
    ("Accompagnement douane / portuaire", "Administratif", 0, "dossier", 50_000),
    ("Gardiennage / stationnement de nuit", "Sécurité", 0, "nuit", 30_000),
    ("Heure(s) d'attente (>2h offert)", "Attente", 0, "heure", 20_000),
    ("Supplément frigorifique (groupe froid / jour)", "Supplément", 0, "jour", 60_000),
    ("Escorte / convoi exceptionnel", "Supplément", 0, "forfait", 120_000),
    ("Service express (J+1, majoré)", "Supplément", 0, "forfait", 0),
    ("Frais administratifs / documentation", "Administratif", 0, "dossier", 15_000),
]
for i, (desig, typ, qte, unit, pu) in enumerate(PRESTA):
    r = start + i
    z = fill(ZEBRA) if i % 2 else fill(WHITE)
    highlight = typ in ("Carburant", "Aller-retour", "Digital")
    if highlight:
        z = fill(LIGHT)
    setcell(ws, f"B{r}", i + 1, f=font(9, color=MUTED), fl=z, al=CENTER, b=True)
    ws.merge_cells(f"C{r}:D{r}")
    setcell(ws, f"C{r}", desig, f=font(9.5, highlight, NAVY if highlight else INK), fl=z, al=LEFT, b=True)
    ws[f"D{r}"].fill = z; ws[f"D{r}"].border = BORDER
    setcell(ws, f"E{r}", typ, f=font(8.5, color=MUTED), fl=z, al=CENTER, b=True)
    setcell(ws, f"F{r}", qte, f=font(9.5, color=INK), fl=z, al=CENTER, b=True)
    setcell(ws, f"G{r}", unit, f=font(8.5, color=MUTED), fl=z, al=CENTER, b=True)
    setcell(ws, f"H{r}", pu, f=font(9.5, color=INK), fl=z, al=RIGHT, b=True, nf=AR)
    setcell(ws, f"I{r}", f"=F{r}*H{r}", f=font(9.5, True, INK), fl=z, al=RIGHT, b=True, nf=AR)
    ws.row_dimensions[r].height = 19
last = start + len(PRESTA) - 1


def total_row(r, label, value_formula, *, big=False, accent=False):
    ws.merge_cells(f"B{r}:F{r}")
    bgc = NAVY if accent else LIGHT2
    setcell(ws, f"B{r}", label, f=font(12 if big else 10, True, WHITE if accent else INK), fl=fill(bgc), al=RIGHT)
    for col in "BCDEF":
        ws[f"{col}{r}"].fill = fill(bgc)
    ws.merge_cells(f"G{r}:I{r}")
    setcell(ws, f"G{r}", value_formula, f=font(13 if big else 11, True, WHITE if accent else NAVY),
            fl=fill(bgc), al=RIGHT, nf=AR)
    ws.row_dimensions[r].height = 24 if big else 20


r = last + 1
total_row(r, "SOUS-TOTAL H.T.", f"=SUM(I{start}:I{last})")
setcell(ws, f"B{r+1}", "Remise commerciale (%)  →", f=font(10, color=MUTED), al=RIGHT)
ws.merge_cells(f"B{r+1}:E{r+1}")
setcell(ws, f"F{r+1}", 0, f=font(10, True, INK), al=CENTER, nf="0")
ws.merge_cells(f"G{r+1}:I{r+1}")
setcell(ws, f"G{r+1}", f"=-ROUND(G{r}*F{r+1}/100,0)", f=font(10, True, "C0392B"), al=RIGHT, nf=AR)
ws.row_dimensions[r + 1].height = 20
total_row(r + 2, "Base imposable (après remise)", f"=G{r}+G{r+1}")
setcell(ws, f"B{r+3}", "TVA (Oui / Non)  →", f=font(10, color=MUTED), al=RIGHT)
ws.merge_cells(f"B{r+3}:E{r+3}")
setcell(ws, f"F{r+3}", "Non", f=font(10, True, INK), al=CENTER)
ws.merge_cells(f"G{r+3}:I{r+3}")
setcell(ws, f"G{r+3}", f'=IF(F{r+3}="Oui",ROUND(G{r+2}*0.2,0),0)', f=font(10, True, INK), al=RIGHT, nf=AR)
ws.row_dimensions[r + 3].height = 20
total_row(r + 4, "💰  TOTAL À PAYER (TTC)", f"=G{r+2}+G{r+3}", big=True, accent=True)

cr = r + 6
section_bar(ws, cr, 2, 9, "  💳  CONDITIONS DE PAIEMENT")
pay = [
    ("Mode de paiement :", "MVola / Orange Money / Airtel Money / Virement / Espèces"),
    ("Acompte requis :", "50% à la commande — 50% à la livraison"),
    ("N° MVola One Way :", "0XX XX XXX XX"),
    ("Délai de paiement :", "Paiement à réception ou selon accord"),
    ("Pénalités de retard :", "2% par semaine de retard"),
]
for i, (lab, val) in enumerate(pay):
    rr = cr + 1 + i
    setcell(ws, f"B{rr}", lab, f=font(9, True, MUTED), al=LEFT)
    ws.merge_cells(f"C{rr}:I{rr}"); setcell(ws, f"C{rr}", val, f=font(9.5, color=INK), al=LEFT)
    ws.row_dimensions[rr].height = 18

gr = cr + 7
section_bar(ws, gr, 2, 9, "  📝  CONDITIONS GÉNÉRALES")
cg = [
    "• Ce devis est valable 30 jours à compter de la date d'émission.",
    "• Prix en Ariary (MGA) HT sauf mention contraire. Trajet facturé ALLER-RETOUR (le véhicule revient à son point de départ).",
    "• Le carburant est facturé au prix réel de la pompe ; un avenant s'applique en cas de forte variation du cours du gasoil.",
    "• Force majeure (météo, route coupée) : avenant tarifaire applicable.",
    "• Responsabilité limitée à la valeur déclarée des marchandises.",
    "• Pour toute modification, contactez-nous 48h avant le transport.",
]
for i, line in enumerate(cg):
    rr = gr + 1 + i
    ws.merge_cells(f"B{rr}:I{rr}"); setcell(ws, f"B{rr}", line, f=font(9, color=MUTED), al=LEFTW)
    ws.row_dimensions[rr].height = 16

sg = gr + 8
ws.merge_cells(f"B{sg}:E{sg}"); setcell(ws, f"B{sg}", "Signature & Cachet Client", f=font(9, True, MUTED), al=CENTER)
ws.merge_cells(f"F{sg}:I{sg}"); setcell(ws, f"F{sg}", "Pour One Way", f=font(9, True, MUTED), al=CENTER)
ws.row_dimensions[sg].height = 50

ftr = sg + 3
ws.merge_cells(f"B{ftr}:I{ftr}")
setcell(ws, f"B{ftr}", "One Way SARL  ·  Transport · Livraison · Suivi Digital  ·  Antananarivo, Madagascar 🇲🇬",
        f=font(9, True, WHITE), fl=fill(NAVY), al=CENTER)
ws.row_dimensions[ftr].height = 22
ws.print_area = f"A1:J{ftr}"
ws.page_setup.orientation = "portrait"; ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0
ws.sheet_properties.pageSetUpPr.fitToPage = True

# ===========================================================================
# Onglet 2 — ⚙️ Paramètres   (anchors en variables)
# ===========================================================================
ws = wb.create_sheet("⚙️ Paramètres")
ws.sheet_view.showGridLines = False
ws.sheet_properties.tabColor = NAVY2
for col, w in {"A": 3, "B": 30, "C": 16, "D": 17, "E": 14, "F": 16,
               "G": 15, "H": 13, "I": 3}.items():
    ws.column_dimensions[col].width = w

ws.merge_cells("B2:H5")
setcell(ws, "B2", "⚙️  PARAMÈTRES & TARIFS DE RÉFÉRENCE — ONE WAY",
        f=font(15, True, WHITE), fl=fill(NAVY), al=Alignment("center", "center"))
fill_block(ws, 2, 5, 2, 8, NAVY)
ws.row_dimensions[6].height = 8

section_bar(ws, 8, 2, 8, "  🏢  INFORMATIONS GÉNÉRALES")
gen = [
    ("Numéro séquence devis", 1, "N°", "Auto-incrémenté"),                 # C9  (SEQ)
    ("Remise commerciale défaut", 0, "%", "0 si aucune remise"),            # C10
    ("TVA applicable par défaut", "Non", "", "Oui ou Non"),                 # C11
    ("Devise", "Ariary (MGA)", "", "Toutes valeurs en Ar"),                 # C12
    ("Validité du devis", 30, "jours", "Délai d'engagement du prix"),       # C13 (VALID)
    ("Trajet par défaut", "Aller-retour", "", "Le véhicule revient"),       # C14 (TRIP)
    ("Coefficient retour à vide", RETURN_RATE, "×", "0 = aller simple · 1 = retour plein"),  # C15 (RET)
]
for i, (lab, val, unit, note) in enumerate(gen):
    r = 9 + i
    setcell(ws, f"B{r}", lab, f=font(10, True, INK), al=LEFT)
    nf = "0.00" if lab.startswith("Coefficient") else None
    setcell(ws, f"C{r}", val, f=font(10, True, NAVY if i < 5 else ORANGE), al=CENTER, nf=nf)
    setcell(ws, f"D{r}", unit, f=font(9, color=MUTED), al=LEFT)
    ws.merge_cells(f"E{r}:H{r}"); setcell(ws, f"E{r}", note, f=font(9, italic=True, color=MUTED), al=LEFT)
    ws.row_dimensions[r].height = 20
RET_CELL = "C15"

ws.row_dimensions[16].height = 8
section_bar(ws, 17, 2, 8, "  ⛽  PRIX DU CARBURANT  (modifiable selon le cours)")
GASOIL_ROW, ESSENCE_ROW = 18, 19
for i, (lab, val) in enumerate([("Gasoil (diesel)", FUEL["DIESEL"]), ("Essence (sans plomb)", FUEL["ESSENCE"])]):
    r = 18 + i
    setcell(ws, f"B{r}", lab, f=font(10, True, INK), al=LEFT, b=True)
    setcell(ws, f"C{r}", val, f=font(11, True, ORANGE), al=CENTER, b=True, nf=AR)
    setcell(ws, f"D{r}", "/ litre", f=font(9, color=MUTED), al=LEFT, b=True)
    ws.merge_cells(f"E{r}:H{r}")
    setcell(ws, f"E{r}", "Tous les frais de carburant se recalculent à partir de cette valeur.",
            f=font(9, italic=True, color=MUTED), al=LEFT, b=True)
    ws.row_dimensions[r].height = 20

ws.row_dimensions[20].height = 8
section_bar(ws, 21, 2, 8, "  🛣️  GRILLE TARIFAIRE KILOMÉTRIQUE  (tarif km HORS carburant + carburant par type)")
GRID_HDR = 22
table_header(ws, GRID_HDR, [
    ("B", "TYPE DE VÉHICULE", LEFT), ("C", "CAPACITÉ", CENTER),
    ("D", "TARIF/km\n(hors carburant)", CENTER), ("E", "CONSO\n(L/100km)", CENTER),
    ("F", "CARBURANT/km", CENTER), ("G", "FORFAIT BASE", CENTER), ("H", "MAJORATION", CENTER),
])
GRID_FIRST = GRID_HDR + 1  # 23
for i, (label, cap, rate, ftype, conso, base, sur) in enumerate(VEHICLES):
    r = GRID_FIRST + i
    z = fill(ZEBRA) if i % 2 else fill(WHITE)
    price_cell = f"$C${ESSENCE_ROW}" if ftype == "ESSENCE" else f"$C${GASOIL_ROW}"
    setcell(ws, f"B{r}", label, f=font(9.5, color=INK), fl=z, al=LEFT, b=True)
    setcell(ws, f"C{r}", cap, f=font(9, color=MUTED), fl=z, al=CENTER, b=True)
    setcell(ws, f"D{r}", rate, f=font(9.5, True, INK), fl=z, al=CENTER, b=True, nf=ARKM)
    setcell(ws, f"E{r}", conso, f=font(9.5, color=INK), fl=z, al=CENTER, b=True, nf=LCONS)
    setcell(ws, f"F{r}", f"=ROUND(E{r}*{price_cell}/100,0)", f=font(9.5, True, ORANGE), fl=z, al=CENTER, b=True, nf=ARKM)
    setcell(ws, f"G{r}", base, f=font(9.5, color=INK), fl=z, al=CENTER, b=True, nf=AR)
    setcell(ws, f"H{r}", sur, f=font(9.5, color=MUTED), fl=z, al=CENTER, b=True, nf=PCT)
    ws.row_dimensions[r].height = 19
GRID_LAST = GRID_FIRST + len(VEHICLES) - 1  # 32

ws.row_dimensions[GRID_LAST + 1].height = 8
ROUTE_SEC = GRID_LAST + 2  # 34
section_bar(ws, ROUTE_SEC, 2, 8, "  🗺️  ROUTES PRINCIPALES MADAGASCAR  (ALLER-RETOUR, général, carburant inclus)")
ROUTE_HDR = ROUTE_SEC + 1
table_header(ws, ROUTE_HDR, [
    ("B", "ROUTE", LEFT), ("C", "DISTANCE", CENTER), ("D", "CAMION 3T", CENTER),
    ("E", "CAMION 5T", CENTER), ("F", "SEMI-REM. 20T", CENTER), ("G", "DURÉE MOY.", CENTER),
])
ws.merge_cells(f"G{ROUTE_HDR}:H{ROUTE_HDR}")
ws[f"H{ROUTE_HDR}"].fill = fill(NAVY2); ws[f"H{ROUTE_HDR}"].border = BORDER
for i, (name, dist, dur) in enumerate(ROUTES):
    r = ROUTE_HDR + 1 + i
    z = fill(ZEBRA) if i % 2 else fill(WHITE)
    setcell(ws, f"B{r}", name, f=font(9.5, color=INK), fl=z, al=LEFT, b=True)
    setcell(ws, f"C{r}", f"{dist} km", f=font(9, color=MUTED), fl=z, al=CENTER, b=True)
    setcell(ws, f"D{r}", route_total(dist, ROUTE_VEH["3T"]), f=font(9.5, color=INK), fl=z, al=RIGHT, b=True, nf=AR)
    setcell(ws, f"E{r}", route_total(dist, ROUTE_VEH["5T"]), f=font(9.5, True, NAVY), fl=z, al=RIGHT, b=True, nf=AR)
    setcell(ws, f"F{r}", route_total(dist, ROUTE_VEH["SEMI"]), f=font(9.5, color=INK), fl=z, al=RIGHT, b=True, nf=AR)
    ws.merge_cells(f"G{r}:H{r}")
    setcell(ws, f"G{r}", dur, f=font(9, color=MUTED), fl=z, al=CENTER, b=True)
    ws[f"H{r}"].fill = z; ws[f"H{r}"].border = BORDER
    ws.row_dimensions[r].height = 18

CF_SEC = ROUTE_HDR + len(ROUTES) + 2
ws.row_dimensions[CF_SEC - 1].height = 8
section_bar(ws, CF_SEC, 2, 8, "  📊  COEFFICIENTS DE MAJORATION  (marchandise / situation)")
CF_HDR = CF_SEC + 1
table_header(ws, CF_HDR, [
    ("B", "TYPE / SITUATION", LEFT), ("C", "COEFF.", CENTER), ("D", "SURCHARGE", CENTER), ("E", "NOTES", LEFT),
])
ws.merge_cells(f"E{CF_HDR}:H{CF_HDR}")
for c in "FGH":
    ws[f"{c}{CF_HDR}"].fill = fill(NAVY2); ws[f"{c}{CF_HDR}"].border = BORDER
for i, (lab, coeff, surch, note) in enumerate(COEFFS):
    r = CF_HDR + 1 + i
    z = fill(ZEBRA) if i % 2 else fill(WHITE)
    setcell(ws, f"B{r}", lab, f=font(9.5, color=INK), fl=z, al=LEFT, b=True)
    setcell(ws, f"C{r}", coeff, f=font(9.5, True, NAVY), fl=z, al=CENTER, b=True)
    setcell(ws, f"D{r}", surch, f=font(9.5, color=INK), fl=z, al=CENTER, b=True, nf=AR)
    ws.merge_cells(f"E{r}:H{r}"); setcell(ws, f"E{r}", note, f=font(9, italic=True, color=MUTED), fl=z, al=LEFT, b=True)
    for c in "FGH":
        ws[f"{c}{r}"].fill = z; ws[f"{c}{r}"].border = BORDER
    ws.row_dimensions[r].height = 18

ws.page_setup.orientation = "landscape"; ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0
ws.sheet_properties.pageSetUpPr.fitToPage = True

# Plages utilisées par le Calculateur
PARAMS = "⚙️ Paramètres"
D_RNG = f"'{PARAMS}'!$D${GRID_FIRST}:$D${GRID_LAST}"
E_RNG = f"'{PARAMS}'!$E${GRID_FIRST}:$E${GRID_LAST}"
F_RNG = f"'{PARAMS}'!$F${GRID_FIRST}:$F${GRID_LAST}"
G_RNG = f"'{PARAMS}'!$G${GRID_FIRST}:$G${GRID_LAST}"
H_RNG = f"'{PARAMS}'!$H${GRID_FIRST}:$H${GRID_LAST}"
B_RNG = f"'{PARAMS}'!$B${GRID_FIRST}:$B${GRID_LAST}"
RET_REF = f"'{PARAMS}'!${RET_CELL[0]}${RET_CELL[1:]}"

# ===========================================================================
# Onglet 3 — 🧮 Calculateur Rapide
# ===========================================================================
ws = wb.create_sheet("🧮 Calculateur Rapide")
ws.sheet_view.showGridLines = False
ws.sheet_properties.tabColor = ORANGE
for col, w in {"A": 3, "B": 38, "C": 22, "D": 18, "E": 6, "F": 16, "G": 14, "H": 3}.items():
    ws.column_dimensions[col].width = w

ws.merge_cells("B2:G5")
setcell(ws, "B2", "🧮  CALCULATEUR DE PRIX RAPIDE — ONE WAY",
        f=font(15, True, WHITE), fl=fill(ORANGE), al=Alignment("center", "center"))
fill_block(ws, 2, 5, 2, 7, ORANGE)
ws.row_dimensions[6].height = 8

section_bar(ws, 8, 2, 7, "  📝  PARAMÈTRES DE LA DEMANDE")
inputs = [
    ("Distance du trajet — aller (km)", 357, "km"),          # C9
    ("Type véhicule (1=Moto → 10=Cont40')", 4, "1 à 10"),    # C10
    ("Poids de la marchandise", 4_000, "kg"),                 # C11
    ("Valeur déclarée marchandise", 20_000_000, "Ar"),        # C12
    ("Manutention chargement ?", "Oui", "Oui/Non"),           # C13
    ("Manutention déchargement ?", "Oui", "Oui/Non"),         # C14
    ("Aller-retour ?", "Oui", "Oui/Non"),                     # C15
    ("Remise à appliquer", 0, "%"),                           # C16
    ("TVA ?", "Non", "Oui/Non"),                              # C17
]
for i, (lab, val, unit) in enumerate(inputs):
    r = 9 + i
    setcell(ws, f"B{r}", lab, f=font(10, True, INK), al=LEFT)
    setcell(ws, f"C{r}", val, f=font(11, True, NAVY), al=CENTER, fl=fill(LIGHT), b=True, nf=AR if unit == "Ar" else None)
    setcell(ws, f"D{r}", unit, f=font(9, color=MUTED), al=LEFT)
    ws.row_dimensions[r].height = 21
setcell(ws, "F9", "Véhicule :", f=font(9, True, MUTED), al=RIGHT)
ws.merge_cells("F10:G10")
setcell(ws, "F10", f"=INDEX({B_RNG},C10)", f=font(10, True, NAVY), al=LEFT)

ws.row_dimensions[18].height = 8
section_bar(ws, 19, 2, 7, "  💰  RÉSULTAT DU CALCUL AUTOMATIQUE")
base_row = 20
calc = [
    ("Frais kilométriques aller (hors carburant)", f"=ROUND(C9*INDEX({D_RNG},C10)*(1+INDEX({H_RNG},C10)),0)"),
    ("Carburant aller (selon type de véhicule)", f"=ROUND(C9*INDEX({F_RNG},C10),0)"),
    ("Retour véhicule à vide (repositionnement)", f'=IF(C15="Oui",ROUND((C{base_row}+C{base_row+1})*{RET_REF},0),0)'),
    ("Forfait de base véhicule", f"=INDEX({G_RNG},C10)"),
    ("Manutention chargement", f'=IF(C13="Oui",ROUND(INDEX({G_RNG},C10)*0.15,0),0)'),
    ("Manutention déchargement", f'=IF(C14="Oui",ROUND(INDEX({G_RNG},C10)*0.15,0),0)'),
    ("Assurance (0,5% valeur déclarée)", "=ROUND(C12*0.005,0)"),
    ("Frais divers (péages, 3% du transport)", f"=ROUND((C{base_row}+C{base_row+2})*0.03,0)"),
]
for i, (lab, formula) in enumerate(calc):
    r = base_row + i
    hot = lab.startswith("Carburant") or lab.startswith("Retour")
    z = fill(LIGHT) if hot else (fill(ZEBRA) if i % 2 else fill(WHITE))
    setcell(ws, f"B{r}", lab, f=font(9.5, hot, NAVY if hot else INK), fl=z, al=LEFT, b=True)
    ws.merge_cells(f"C{r}:D{r}")
    setcell(ws, f"C{r}", formula, f=font(10, hot, ORANGE if hot else INK), fl=z, al=RIGHT, b=True, nf=AR)
    ws[f"D{r}"].fill = z; ws[f"D{r}"].border = BORDER
    ws.row_dimensions[r].height = 20
sub = base_row + len(calc)
setcell(ws, f"B{sub}", "SOUS-TOTAL H.T.", f=font(10, True, INK), fl=fill(LIGHT2), al=LEFT, b=True)
ws.merge_cells(f"C{sub}:D{sub}")
setcell(ws, f"C{sub}", f"=SUM(C{base_row}:C{sub-1})", f=font(11, True, NAVY), fl=fill(LIGHT2), al=RIGHT, b=True, nf=AR)
ws[f"D{sub}"].fill = fill(LIGHT2); ws[f"D{sub}"].border = BORDER
ws.row_dimensions[sub].height = 22
setcell(ws, f"B{sub+1}", "Remise commerciale", f=font(9.5, color=MUTED), al=LEFT)
ws.merge_cells(f"C{sub+1}:D{sub+1}")
setcell(ws, f"C{sub+1}", f"=-ROUND(C{sub}*C16/100,0)", f=font(10, True, "C0392B"), al=RIGHT, nf=AR)
setcell(ws, f"B{sub+2}", "TVA 20% (si applicable)", f=font(9.5, color=MUTED), al=LEFT)
ws.merge_cells(f"C{sub+2}:D{sub+2}")
setcell(ws, f"C{sub+2}", f'=IF(C17="Oui",ROUND((C{sub}+C{sub+1})*0.2,0),0)', f=font(10, color=INK), al=RIGHT, nf=AR)
tot = sub + 3
setcell(ws, f"B{tot}", "💰  TOTAL ESTIMÉ TTC", f=font(13, True, WHITE), fl=fill(NAVY), al=LEFT)
ws.merge_cells(f"C{tot}:D{tot}")
setcell(ws, f"C{tot}", f"=C{sub}+C{sub+1}+C{sub+2}", f=font(14, True, WHITE), fl=fill(NAVY), al=RIGHT, nf=AR)
ws.row_dimensions[tot].height = 30
setcell(ws, f"B{tot+1}", "Prix moyen / km (aller)", f=font(9.5, color=MUTED), al=LEFT)
ws.merge_cells(f"C{tot+1}:D{tot+1}")
setcell(ws, f"C{tot+1}", f"=IF(C9>0,ROUND(C{tot}/C9,0),0)", f=font(10, True, NAVY), al=RIGHT, nf=ARKM)
ws.row_dimensions[tot + 1].height = 20
ws.page_setup.orientation = "portrait"; ws.page_setup.fitToWidth = 1
ws.sheet_properties.pageSetUpPr.fitToPage = True

# ===========================================================================
# Onglet 4 — 📊 Historique Devis
# ===========================================================================
ws = wb.create_sheet("📊 Historique Devis")
ws.sheet_view.showGridLines = False
ws.sheet_properties.tabColor = "C86A10"
for col, w in {"A": 3, "B": 16, "C": 13, "D": 24, "E": 18, "F": 18, "G": 11,
               "H": 16, "I": 14, "J": 14, "K": 13, "L": 18, "M": 3}.items():
    ws.column_dimensions[col].width = w
ws.merge_cells("B2:L4")
setcell(ws, "B2", "📊  HISTORIQUE DES DEVIS — ONE WAY (aller-retour)",
        f=font(15, True, WHITE), fl=fill("C86A10"), al=Alignment("center", "center"))
fill_block(ws, 2, 4, 2, 12, "C86A10")
ws.row_dimensions[5].height = 8
table_header(ws, 6, [
    ("B", "N° DEVIS", CENTER), ("C", "DATE", CENTER), ("D", "CLIENT", LEFT),
    ("E", "DÉPART", LEFT), ("F", "ARRIVÉE", LEFT), ("G", "DISTANCE", CENTER),
    ("H", "VÉHICULE", LEFT), ("I", "HT (Ar)", CENTER), ("J", "TTC (Ar)", CENTER),
    ("K", "STATUT", CENTER), ("L", "NOTES", LEFT),
])
HIST = [
    ("OW-0001", "15/05/2026", "Société ABC Import", "Analakely, Tanà", "Toamasina Port", 357, 3, "✅ Accepté", "Livraison OK"),
    ("OW-0002", "18/05/2026", "Marie Rakoto", "Ivandry, Tanà", "Antsirabe Centre", 167, 2, "✅ Accepté", "Marchandises générales"),
    ("OW-0003", "20/05/2026", "Export Mada SARL", "Tsaralalàna", "Mahajanga Port", 472, 3, "✅ Accepté", "Périssables urgents"),
    ("OW-0004", "21/05/2026", "Fara Rasolofo", "67 Ha, Tanà", "Fianarantsoa", 404, 5, "✅ Accepté", "Semi-remorque"),
    ("OW-0005", "23/05/2026", "Solo Andria", "Ambohimangakely", "Moramanga", 109, 1, "⏳ En attente", "En cours"),
    ("OW-0006", "24/05/2026", "Haja Rabe", "Port Toamasina", "Ambositra", 460, 3, "❌ Refusé", "Prix refusé"),
    ("OW-0007", "25/05/2026", "Tanà Distribution", "Analakely, Tanà", "Antsirabe", 167, 2, "⏳ En attente", "Devis émis"),
]
veh_short = {1: "Moto-tricycle", 2: "Camionnette", 3: "Camion 5T", 5: "Semi-remorque"}
for i, (num, date, client, dep, arr, dist, vidx, statut, notes) in enumerate(HIST):
    r = 7 + i
    z = fill(ZEBRA) if i % 2 else fill(WHITE)
    total = route_total(dist, vidx)
    setcell(ws, f"B{r}", num, f=font(9.5, True, NAVY), fl=z, al=CENTER, b=True)
    setcell(ws, f"C{r}", date, f=font(9, color=MUTED), fl=z, al=CENTER, b=True)
    setcell(ws, f"D{r}", client, f=font(9.5, color=INK), fl=z, al=LEFT, b=True)
    setcell(ws, f"E{r}", dep, f=font(9, color=MUTED), fl=z, al=LEFT, b=True)
    setcell(ws, f"F{r}", arr, f=font(9, color=MUTED), fl=z, al=LEFT, b=True)
    setcell(ws, f"G{r}", f"{dist} km", f=font(9, color=MUTED), fl=z, al=CENTER, b=True)
    setcell(ws, f"H{r}", veh_short[vidx], f=font(9, color=INK), fl=z, al=LEFT, b=True)
    setcell(ws, f"I{r}", total, f=font(9.5, color=INK), fl=z, al=RIGHT, b=True, nf=AR)
    setcell(ws, f"J{r}", total, f=font(9.5, True, NAVY), fl=z, al=RIGHT, b=True, nf=AR)
    setcell(ws, f"K{r}", statut, f=font(9, color=INK), fl=z, al=CENTER, b=True)
    setcell(ws, f"L{r}", notes, f=font(9, italic=True, color=MUTED), fl=z, al=LEFT, b=True)
    ws.row_dimensions[r].height = 19
tr = 7 + len(HIST)
ws.merge_cells(f"B{tr}:H{tr}")
setcell(ws, f"B{tr}", "TOTAL (devis acceptés)", f=font(10, True, WHITE), fl=fill(NAVY), al=RIGHT)
fill_block(ws, tr, tr, 2, 8, NAVY)
setcell(ws, f"I{tr}", f'=SUMIF(K7:K{tr-1},"✅ Accepté",I7:I{tr-1})', f=font(10, True, WHITE), fl=fill(NAVY), al=RIGHT, nf=AR)
setcell(ws, f"J{tr}", f'=COUNTIF(K7:K{tr-1},"✅ Accepté")&" acceptés"', f=font(10, True, WHITE), fl=fill(NAVY), al=RIGHT)
ws[f"K{tr}"].fill = fill(NAVY); ws[f"L{tr}"].fill = fill(NAVY)
ws.row_dimensions[tr].height = 22
st = tr + 2
ws.merge_cells(f"B{st}:L{st}")
setcell(ws, f"B{st}", "  📈  STATISTIQUES RAPIDES", f=font(11, True, WHITE), fl=fill("C86A10"), al=LEFT)
ws.row_dimensions[st].height = 22
stats = [
    ("Devis émis", f"=COUNTA(B7:B{tr-1})", "0"),
    ("Devis acceptés", f'=COUNTIF(K7:K{tr-1},"✅ Accepté")', "0"),
    ("Taux de conversion", f'=IFERROR(COUNTIF(K7:K{tr-1},"✅ Accepté")/COUNTA(B7:B{tr-1}),0)', "0%"),
    ("CA total (acceptés)", f'=SUMIF(K7:K{tr-1},"✅ Accepté",I7:I{tr-1})', AR),
    ("Montant moyen / devis", f"=IFERROR(AVERAGE(I7:I{tr-1}),0)", AR),
]
for i, (lab, formula, nf) in enumerate(stats):
    r = st + 1 + i
    setcell(ws, f"B{r}", lab, f=font(10, True, INK), al=LEFT)
    setcell(ws, f"C{r}", formula, f=font(10, True, NAVY), al=LEFT, nf=nf)
    ws.row_dimensions[r].height = 19
ws.page_setup.orientation = "landscape"; ws.page_setup.fitToWidth = 1
ws.sheet_properties.pageSetUpPr.fitToPage = True

# ---------------------------------------------------------------------------
OUT = os.path.join(ROOT, "OneWay_Devis_Transport.xlsx")
wb.save(OUT)
print(f"✅ Classeur généré : {OUT}")
