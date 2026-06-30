#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Devis One Way — version .xlsm avec macro + bouton « Enregistrer le paiement ».

- Ajoute une feuille « 📒 Journal des paiements » (journal d'encaissements).
- Injecte un projet VBA (Module1) avec la macro EnregistrerPaiement qui reporte
  le contenu du reçu en cours dans le journal (une ligne par clic).
- Place un bouton de formulaire sur la feuille « Reçu de paiement », relié à la
  macro, et enregistre le classeur au format .xlsm (macros activées).

openpyxl ne sait pas écrire de VBA : le vbaProject.bin est construit à la main
(voir scripts/_vba_builder.py) puis injecté dans le paquet OOXML.

Dépendances : pip install openpyxl Pillow
Usage :
    python3 scripts/devis-macro-xlsm.py <source.xlsx> <sortie.xlsm>
"""
import importlib.util
import os
import re
import sys
import zipfile

import openpyxl
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.properties import PageSetupProperties

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("_vba_builder", os.path.join(HERE, "_vba_builder.py"))
vb = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(vb)

JOURNAL = "📒 Journal des paiements"
DARK, NAVY, GRAY, INK = "001E3A5F", "002A4A72", "005B6B7F", "001F2937"
LIGHT, LINE = "00F4F7FB", "00D9E1EC"
MONEY = '#,##0" Ar"'
thin = Side(style="thin", color=LINE)
BOX = Border(left=thin, right=thin, top=thin, bottom=thin)

# ── Source VBA (cp1252-compatible : pas d'emoji dans le code) ───────────────────
VBA_SOURCE = '''Attribute VB_Name = "Module1"
Option Explicit

Private Function Feuille(motif As String) As Worksheet
    Dim ws As Worksheet
    For Each ws In ThisWorkbook.Worksheets
        If InStr(1, ws.Name, motif, vbTextCompare) > 0 Then
            Set Feuille = ws
            Exit Function
        End If
    Next ws
End Function

Sub EnregistrerPaiement()
    Dim wsR As Worksheet, wsJ As Worksheet
    Dim r As Long, montant As Double
    On Error GoTo Gestion
    Set wsR = Feuille("Re" & Chr(231) & "u de paiement")
    Set wsJ = Feuille("Journal")
    If wsR Is Nothing Or wsJ Is Nothing Then
        MsgBox "Feuille Recu ou Journal introuvable.", vbExclamation, "One Way"
        Exit Sub
    End If
    montant = 0
    On Error Resume Next
    montant = wsR.Range("G28").Value
    On Error GoTo Gestion
    If montant <= 0 Then
        If MsgBox("Le montant recu est nul. Enregistrer quand meme ?", _
                  vbYesNo + vbQuestion, "One Way") = vbNo Then Exit Sub
    End If
    r = wsJ.Cells(wsJ.Rows.Count, 2).End(xlUp).Row + 1
    If r < 7 Then r = 7
    wsJ.Cells(r, 2).Value = Date
    wsJ.Cells(r, 3).Value = wsR.Range("C8").Value
    wsJ.Cells(r, 4).Value = wsR.Range("H8").Value
    wsJ.Cells(r, 5).Value = wsR.Range("C11").Value
    wsJ.Cells(r, 6).Value = wsR.Range("G23").Value
    wsJ.Cells(r, 7).Value = wsR.Range("G24").Value
    wsJ.Cells(r, 8).Value = montant
    wsJ.Cells(r, 9).Value = wsR.Range("G25").Value
    wsJ.Cells(r, 2).NumberFormat = "dd/mm/yyyy"
    wsJ.Cells(r, 8).NumberFormat = "#,##0"" Ar"""
    MsgBox "Paiement enregistre dans le journal (ligne " & r & ").", _
           vbInformation, "One Way"
    Exit Sub
Gestion:
    MsgBox "Erreur : " & Err.Description, vbCritical, "One Way"
End Sub
'''

VML = '''<xml xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
 <o:shapelayout v:ext="edit"><o:idmap v:ext="edit" data="1"/></o:shapelayout>
 <v:shapetype id="_x0000_t201" coordsize="21600,21600" o:spt="201" path="m,l,21600r21600,l21600,xe">
  <v:stroke joinstyle="miter"/>
  <v:path shadowok="f" o:extrusionok="f" strokeok="f" fillok="f" o:connecttype="rect"/>
  <o:lock v:ext="edit" shapetype="t"/>
 </v:shapetype>
 <v:shape id="_x0000_s1025" type="#_x0000_t201" style="position:absolute;margin-left:545pt;margin-top:330pt;width:175pt;height:34pt;z-index:1;mso-wrap-style:tight" o:button="t" fillcolor="#1e3a5f" strokecolor="#13294a">
  <v:fill color2="#1e3a5f" o:detectmouseclick="t"/>
  <o:lock v:ext="edit" rotation="t"/>
  <v:textbox style="mso-direction-alt:auto" o:singleclick="f"><div style="text-align:center"><font face="Calibri" size="220" color="#FFFFFF"><b>Enregistrer le paiement</b></font></div></v:textbox>
  <x:ClientData ObjectType="Button">
   <x:Anchor>10, 8, 21, 2, 13, 40, 22, 16</x:Anchor>
   <x:PrintObject>False</x:PrintObject>
   <x:AutoFill>False</x:AutoFill>
   <x:FmlaMacro>EnregistrerPaiement</x:FmlaMacro>
   <x:TextHAlign>Center</x:TextHAlign>
   <x:TextVAlign>Center</x:TextVAlign>
  </x:ClientData>
 </v:shape>
</xml>'''


def add_journal(wb):
    if JOURNAL in wb.sheetnames:
        del wb[JOURNAL]
    ws = wb.create_sheet(JOURNAL)
    ws.sheet_view.showGridLines = False
    ws.sheet_properties.tabColor = "00128A4B"
    for col, w in {"A": 3, "B": 13, "C": 16, "D": 16, "E": 24,
                   "F": 24, "G": 14, "H": 16, "I": 18, "J": 3}.items():
        ws.column_dimensions[col].width = w
    ws.merge_cells("B2:I4")
    t = ws["B2"]
    t.value = "📒  JOURNAL DES PAIEMENTS — ONE WAY"
    t.font = Font(name="Calibri", size=16, bold=True, color="00FFFFFF")
    t.fill = PatternFill("solid", fgColor=DARK)
    t.alignment = Alignment(horizontal="left", vertical="center")
    for r in (2, 3, 4):
        ws.row_dimensions[r].height = 16
    ws.row_dimensions[5].height = 8
    headers = ["DATE", "N° REÇU", "RÉF. DEVIS", "CLIENT", "NATURE",
               "MODE", "MONTANT REÇU", "RÉFÉRENCE"]
    ws.row_dimensions[6].height = 24
    for i, h in enumerate(headers):
        c = ws.cell(row=6, column=2 + i, value=h)
        c.font = Font(name="Calibri", size=9, bold=True, color="00FFFFFF")
        c.fill = PatternFill("solid", fgColor=NAVY)
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        c.border = BOX
    # lignes pré-stylées (le bouton macro les remplit)
    for r in range(7, 31):
        ws.row_dimensions[r].height = 18
        zebra = "00FFFFFF" if (r - 7) % 2 == 0 else "00F7F9FC"
        for col in range(2, 10):
            c = ws.cell(row=r, column=col)
            c.fill = PatternFill("solid", fgColor=zebra)
            c.border = BOX
            c.font = Font(name="Calibri", size=9.5, color=INK)
            if col == 8:
                c.alignment = Alignment(horizontal="right", vertical="center")
                c.number_format = MONEY
            elif col == 2:
                c.alignment = Alignment(horizontal="center", vertical="center")
                c.number_format = "dd/mm/yyyy"
            else:
                c.alignment = Alignment(horizontal="left", vertical="center")
    ws.merge_cells("B32:I32")
    note = ws["B32"]
    note.value = ("Astuce : sur la feuille « Reçu de paiement », remplissez le règlement "
                  "puis cliquez sur le bouton « Enregistrer le paiement » — la ligne "
                  "s'ajoute ici automatiquement.")
    note.font = Font(name="Calibri", size=8.5, italic=True, color=GRAY)
    note.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
    ws.row_dimensions[32].height = 26
    ws.print_area = "A1:J31"
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True)


def find_recu_sheet_target(z):
    wbxml = z.read("xl/workbook.xml").decode("utf-8")
    m = re.search(r'<sheet\b[^>]*?name="[^"]*Reçu de paiement[^"]*"[^>]*?>', wbxml)
    if not m:
        raise RuntimeError("Feuille Reçu introuvable dans workbook.xml")
    rid = re.search(r'r:id="([^"]+)"', m.group(0)).group(1)
    rels = z.read("xl/_rels/workbook.xml.rels").decode("utf-8")
    relm = re.search(r'<Relationship\b[^>]*?Id="%s"[^>]*?/?>' % re.escape(rid), rels)
    target = re.search(r'Target="([^"]+)"', relm.group(0)).group(1)
    return target.lstrip("/") if target.startswith("/") else "xl/" + target


def main(src, dst):
    try:
        import PIL  # noqa: F401
    except ImportError:
        print("⚠️  Pillow absent (logo).", file=sys.stderr)

    wb = openpyxl.load_workbook(src)
    add_journal(wb)
    wb.calculation.fullCalcOnLoad = True
    tmp = dst + ".tmp.xlsx"
    wb.save(tmp)

    vba_bin = vb.build_vbaproject(VBA_SOURCE)

    with zipfile.ZipFile(tmp) as z:
        names = z.namelist()
        data = {n: z.read(n) for n in names}
        recu_part = find_recu_sheet_target(z)

    sheet_num = re.search(r"sheet(\d+)\.xml", recu_part).group(1)
    rels_part = f"xl/worksheets/_rels/sheet{sheet_num}.xml.rels"
    vml_part = "xl/drawings/vmlDrawing1.vml"

    # 1) vbaProject.bin
    data["xl/vbaProject.bin"] = vba_bin
    # 2) VML
    data[vml_part] = VML.encode("utf-8")

    # 3) [Content_Types].xml
    ct = data["[Content_Types].xml"].decode("utf-8")
    ct = ct.replace(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml",
        "application/vnd.ms-excel.sheet.macroEnabled.main+xml")
    add_ct = ""
    if 'Extension="vml"' not in ct:
        add_ct += '<Default Extension="vml" ContentType="application/vnd.openxmlformats-officedocument.vmlDrawing"/>'
    add_ct += '<Override PartName="/xl/vbaProject.bin" ContentType="application/vnd.ms-office.vbaProject"/>'
    ct = ct.replace("</Types>", add_ct + "</Types>")
    data["[Content_Types].xml"] = ct.encode("utf-8")

    # 4) relation workbook -> vbaProject
    wbrels = data["xl/_rels/workbook.xml.rels"].decode("utf-8")
    if "vbaProject" not in wbrels:
        rel = ('<Relationship Id="rIdVBA" '
               'Type="http://schemas.microsoft.com/office/2006/relationships/vbaProject" '
               'Target="vbaProject.bin"/>')
        wbrels = wbrels.replace("</Relationships>", rel + "</Relationships>")
    data["xl/_rels/workbook.xml.rels"] = wbrels.encode("utf-8")

    # 5) relation feuille Reçu -> vmlDrawing
    if rels_part in data:
        sr = data[rels_part].decode("utf-8")
    else:
        sr = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
              '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
              '</Relationships>')
    vml_rel = ('<Relationship Id="rIdVML" '
               'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/vmlDrawing" '
               'Target="../drawings/vmlDrawing1.vml"/>')
    sr = sr.replace("</Relationships>", vml_rel + "</Relationships>")
    data[rels_part] = sr.encode("utf-8")

    # 6) <legacyDrawing> dans la feuille Reçu (après <drawing.../>)
    sx = data[recu_part].decode("utf-8")
    leg = ('<legacyDrawing xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
           ' r:id="rIdVML"/>')
    if "<drawing " in sx:
        sx = re.sub(r'(<drawing [^>]*/>)', r'\1' + leg, sx, count=1)
    else:
        sx = sx.replace("</worksheet>", leg + "</worksheet>")
    data[recu_part] = sx.encode("utf-8")

    # 7) réécrire le paquet en .xlsm
    with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as z:
        for n, b in data.items():
            z.writestr(n, b)
    os.remove(tmp)
    print(f"OK — {dst} créé (.xlsm, macro EnregistrerPaiement + bouton).")
    print(f"Feuille Reçu = {recu_part}.")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("Usage: python3 scripts/devis-macro-xlsm.py <source.xlsx> <sortie.xlsm>")
    main(sys.argv[1], sys.argv[2])
