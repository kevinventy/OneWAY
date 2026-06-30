Attribute VB_Name = "Module1"
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
