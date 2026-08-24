# -*- coding: utf-8 -*-
"""Génère le planning Gantt étendu au 05/09/2026 (extension proportionnelle 21 j -> 30 j)."""
from datetime import date, timedelta

START = date(2026, 8, 7)
N_DAYS = 30  # 07/08 -> 05/09 inclus
K = 30 / 21

DOW_FR = {0: "LU", 1: "MA", 2: "ME", 3: "JE", 4: "VE", 5: "SA", 6: "DI"}

# (num, lot, désignation, début_j, fin_j) — jours d'origine, jour 1 = 07/08/26
TASKS = [
    ("1.1", "T1", "Mise en place du reste de caillasse", 1, 2),
    ("1.2", "T1", "Mise en oeuvre du béton de forme", 3, 6),
    ("1.3", "T1", "Armatures et joints de dilatation - avancement par zones", 5, 6),
    ("1.4", "T1", "Coulage du béton Q350 du terrain multisports", 7, 11),
    ("1.5", "T1", "Mini-gradin - maçonnerie de moellons", 7, 17),
    ("1.6", "T1", "Mini-gradin - coffrage, armatures et petite dalle en béton armé", 18, 21),
    ("1.7", "T1", "Cure, protection et contrôle du béton Q350 du terrain", 12, 15),
    ("1.8", "T1", "Peinture et marquage du terrain selon charte graphique MVola", 16, 18),
    ("1.9", "T1", "Pose de 2 panneaux et cerceaux de basketball", 19, 21),
    ("1.10", "T1", "Pose des panneaux de clôture en périphérie - zones libérées", 19, 21),
    ("2.1", "V1", "Plomberie WC/douches et raccordement à la fosse septique", 1, 7),
    ("2.2", "V1", "Pose des appareils sanitaires : 2 WC anglais + 2 colonnes de douche", 8, 9),
    ("2.3", "V1", "Installation électrique complète", 10, 14),
    ("2.4", "V1", "Finition plinthes, carrelage mural et 2 siphons de sol", 15, 17),
    ("2.5", "V1", "Peinture de finition suivant charte graphique MVola", 18, 19),
    ("2.6", "V1", "Essais plomberie/électricité, retouches et nettoyage", 20, 21),
    ("R.1", "R", "Visite technique / OPR - constat et relevé des réserves", 21, 21),
]

def scale(s, e):
    ns = round((s - 1) * K) + 1
    ne = round(e * K)
    return ns, ne

def day_date(d):
    return START + timedelta(days=d - 1)

def fmt(d):
    return day_date(d).strftime("%d/%m/%y")

LOT_COLORS = {"T1": "#1f7a4d", "V1": "#1d5fa8", "R": "#c0392b"}
LOT_TITLES = [
    ("T1", "T1 - TERRAIN MULTISPORTS"),
    ("V1", "V1 - VESTIAIRES"),
    ("R", "R - VISITE TECHNIQUE ET OPR"),
]

days = [day_date(d) for d in range(1, N_DAYS + 1)]

# En-tête calendrier : groupes par mois
head_month = ""
aug = sum(1 for d in days if d.month == 8)
sep = N_DAYS - aug
head_month += f'<th class="mois" colspan="{aug}">AOÛT 2026</th>'
head_month += f'<th class="mois" colspan="{sep}">SEPTEMBRE 2026</th>'

head_days = ""
for d in days:
    we = ' we' if d.weekday() >= 5 else ''
    head_days += f'<th class="jour{we}"><div>{d.day:02d}</div><div class="dw">{DOW_FR[d.weekday()]}</div></th>'

rows = ""
for lot, title in LOT_TITLES:
    rows += (
        f'<tr class="section"><td colspan="6" style="color:{LOT_COLORS[lot]}">'
        f'&#9632;&nbsp; {title}</td><td colspan="{N_DAYS}"></td></tr>\n'
    )
    for num, l, desc, s, e in TASKS:
        if l != lot:
            continue
        ns, ne = scale(s, e)
        dur = ne - ns + 1
        cells = ""
        for d in range(1, N_DAYS + 1):
            we = ' we' if day_date(d).weekday() >= 5 else ''
            if ns <= d <= ne:
                cells += f'<td class="c{we}"><div class="bar" style="background:{LOT_COLORS[lot]}"></div></td>'
            else:
                cells += f'<td class="c{we}"></td>'
        rows += (
            f'<tr><td class="num">{num}</td><td class="lot">{l}</td>'
            f'<td class="des">{desc}</td><td class="dur">{dur} j</td>'
            f'<td class="dt">{fmt(ns)}</td><td class="dt">{fmt(ne)}</td>{cells}</tr>\n'
        )

html = f"""<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8">
<title>Planning CEG Antanimbarinandriana - 07/08/2026 au 05/09/2026</title>
<style>
  @page {{ size: A3 landscape; margin: 8mm; }}
  * {{ box-sizing: border-box; }}
  body {{ font-family: "Helvetica Neue", Arial, sans-serif; color: #222; margin: 0; font-size: 8.5px; }}
  h1 {{ font-size: 15px; margin: 0 0 2px; color: #14324f; }}
  .sub {{ font-size: 10px; font-weight: 600; color: #1d5fa8; margin-bottom: 6px; }}
  .meta {{ display: flex; gap: 8px; margin-bottom: 8px; }}
  .meta div {{ flex: 1; border: 1px solid #c9d4e0; border-radius: 4px; padding: 4px 8px; background: #f4f7fb; }}
  .meta .k {{ font-size: 7px; letter-spacing: .08em; color: #5b708a; font-weight: 700; }}
  .meta .v {{ font-size: 9px; font-weight: 600; }}
  table {{ border-collapse: collapse; width: 100%; table-layout: fixed; }}
  th, td {{ border: 1px solid #d5dde6; padding: 1px 3px; }}
  th {{ background: #14324f; color: #fff; font-size: 8px; }}
  th.mois {{ background: #1d5fa8; letter-spacing: .1em; }}
  th.jour {{ width: 17px; padding: 1px 0; }}
  th.jour .dw {{ font-size: 6.5px; font-weight: 400; opacity: .85; }}
  th.jour.we {{ background: #3a5a7a; }}
  col.c-num {{ width: 24px; }} col.c-lot {{ width: 22px; }} col.c-des {{ width: 300px; }}
  col.c-dur {{ width: 28px; }} col.c-dt {{ width: 52px; }}
  td.num, td.lot, td.dur {{ text-align: center; }}
  td.dt {{ text-align: center; white-space: nowrap; }}
  td.des {{ overflow: hidden; }}
  tr.section td {{ background: #eef2f7; font-weight: 700; font-size: 9px; padding: 3px; border-top: 2px solid #9fb2c6; }}
  td.c {{ padding: 0; height: 14px; }}
  td.c.we {{ background: #f0f3f7; }}
  .bar {{ height: 10px; margin: 2px 0; border-radius: 2px; }}
  .hyp {{ margin-top: 8px; border: 1px solid #c9d4e0; border-radius: 4px; padding: 5px 8px; background: #f4f7fb; font-size: 8.5px; }}
  .hyp b {{ font-size: 8px; letter-spacing: .08em; color: #5b708a; }}
  .foot {{ margin-top: 6px; font-size: 7.5px; color: #5b708a; text-align: center; }}
</style></head><body>
<h1>GANTT JOURNALIER DÉTAILLÉ - CEG ANTANIMBARINANDRIANA</h1>
<div class="sub">&#128197; PLANNING CALENDAIRE DU 07/08/2026 AU 05/09/2026 - DATE DE DÉMARRAGE : 07/08/2026</div>
<div class="meta">
  <div><div class="k">SITE</div><div class="v">CEG Antanimbarinandriana</div></div>
  <div><div class="k">PÉRIODE</div><div class="v">Du 07/08/2026 au 05/09/2026</div></div>
  <div><div class="k">OBJECTIF</div><div class="v">Achèvement en 30 jours - au 05/09/2026</div></div>
  <div><div class="k">ORGANISATION</div><div class="v">2 fronts principaux + équipes spécialisées</div></div>
</div>
<table>
  <colgroup>
    <col class="c-num"><col class="c-lot"><col class="c-des"><col class="c-dur"><col class="c-dt"><col class="c-dt">
    {''.join('<col>' for _ in range(N_DAYS))}
  </colgroup>
  <tr>
    <th rowspan="2">N°</th><th rowspan="2">Lot</th>
    <th rowspan="2">Désignation détaillée des travaux</th>
    <th rowspan="2">Dur.</th><th rowspan="2">Début</th><th rowspan="2">Fin</th>
    {head_month}
  </tr>
  <tr>{head_days}</tr>
  {rows}
</table>
<div class="hyp">
  <b>HYPOTHÈSES DE PLANIFICATION</b><br>
  &bull; Planning étendu proportionnellement du 27/08/2026 au 05/09/2026 (21 jours &rarr; 30 jours, facteur &times;10/7) ; les enchaînements entre tâches sont conservés.<br>
  &bull; Calendrier continu. Le mini-gradin démarre le même jour que le coulage Q350.<br>
  &bull; Pour tenir le délai, armatures, peinture et clôture avancent par zones libérées avec des équipes dédiées.
</div>
<div class="foot">CEG ANTANIMBARINANDRIANA &nbsp;|&nbsp; Planning provisoire d'exécution - révision du 24/08/2026 (extension au 05/09/2026) &nbsp;|&nbsp; Émission initiale le 05/08/2026</div>
</body></html>"""

import sys
out = sys.argv[1]
with open(out, "w", encoding="utf-8") as f:
    f.write(html)

# Récapitulatif console
for num, l, desc, s, e in TASKS:
    ns, ne = scale(s, e)
    print(f"{num:<6}{fmt(s)}-{fmt(e)}  ({e-s+1:>2} j)  ->  {fmt(ns)}-{fmt(ne)}  ({ne-ns+1:>2} j)")
