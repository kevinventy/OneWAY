# -*- coding: utf-8 -*-
"""
=====================================================================
  "Je t'aime Anjoanina"  ecrit par UNE SEULE fonction mathematique
  (serie de Fourier complexe = epicycles / vecteurs qui tournent)

        f(t) = somme_{n=-N}^{N}  c_n * exp(i * n * t)       t dans [0, 2*pi]

  -> Copie-colle tout ce fichier dans une IA (ChatGPT, Claude...) en
     disant "execute ce code Python", ou lance-le :  python jetaime.py
  -> Change juste la variable TEXTE pour ecrire ce que tu veux.
=====================================================================
Dependances :  pip install numpy matplotlib
"""

import os
import urllib.request
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.font_manager import FontProperties
from matplotlib.textpath import TextPath
from matplotlib.collections import LineCollection

# ----------------------- REGLAGES -----------------------------------
TEXTE       = "Je t'aime Anjoanina"   # <-- change le texte ici
N_HARMONIQUES = 900                   # + grand = + net (plus lourd)
FICHIER_SORTIE = "jetaime.png"
# --------------------------------------------------------------------


def charger_police():
    """Telecharge une belle police cursive (Great Vibes, licence libre).
    Si pas d'internet, on retombe sur une police par defaut en italique."""
    chemin = "GreatVibes-Regular.ttf"
    url = "https://fonts.gstatic.com/s/greatvibes/v21/RWmMoKWR9v4ksMfaWd_JN-XC.ttf"
    if not os.path.exists(chemin):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "python"})
            with urllib.request.urlopen(req, timeout=30) as r:
                open(chemin, "wb").write(r.read())
        except Exception as e:
            print("  (pas de police cursive, repli sur police par defaut) :", e)
            return FontProperties(style="italic", weight="bold")
    return FontProperties(fname=chemin)


def resample(poly, pas):
    """Re-echantillonne un contour ferme a pas d'arc ~constant."""
    p = np.vstack([poly, poly[0]])
    d = np.hypot(*np.diff(p, axis=0).T)
    s = np.concatenate([[0], np.cumsum(d)])
    if s[-1] == 0:
        return poly[:1]
    n = max(10, int(s[-1] / pas))
    si = np.linspace(0, s[-1], n, endpoint=False)
    return np.column_stack([np.interp(si, s, p[:, 0]),
                            np.interp(si, s, p[:, 1])])


def construire_chemin(texte, police, pas=0.004):
    """Contours des lettres -> UN seul chemin ferme (x(t), y(t))."""
    tp = TextPath((0, 0), texte, size=1, prop=police)
    contours = [resample(np.asarray(p, float), pas)
                for p in tp.to_polygons() if len(p) >= 3]

    reste = contours[:]
    ordre = [reste.pop(int(np.argmin([c[:, 0].min() for c in reste])))]
    while reste:                      # ordre plus-proche-voisin
        fin = ordre[-1][-1]
        j = int(np.argmin([min(np.hypot(*(c[0] - fin)), np.hypot(*(c[-1] - fin)))
                           for c in reste]))
        nxt = reste.pop(j)
        if np.hypot(*(nxt[-1] - fin)) < np.hypot(*(nxt[0] - fin)):
            nxt = nxt[::-1]
        ordre.append(nxt)

    morceaux, conn = [], []
    def relier(a, b):
        m = max(2, int(np.hypot(*(a - b)) / pas))
        morceaux.append(np.column_stack([np.linspace(a[0], b[0], m),
                                         np.linspace(a[1], b[1], m)]))
        conn.append(np.ones(m, bool))
    for k, c in enumerate(ordre):
        if k > 0:
            relier(ordre[k - 1][-1], c[0])
        morceaux.append(c)
        conn.append(np.zeros(len(c), bool))
    relier(ordre[-1][-1], ordre[0][0])          # fermeture de la boucle

    chemin = np.vstack(morceaux)
    return chemin[:, 0] + 1j * chemin[:, 1], np.concatenate(conn)


def main():
    police = charger_police()
    z, is_conn = construire_chemin(TEXTE, police)
    M = len(z)

    # --- coefficients de Fourier par FFT ---
    C = np.fft.fft(z) / M
    freqs = np.fft.fftfreq(M, d=1.0 / M).astype(int)
    garde = np.argsort(np.abs(freqs))[: 2 * N_HARMONIQUES + 1]

    # --- reconstruction  f(t) = somme c_n e^{i n t} ---
    t = np.linspace(0, 2 * np.pi, 9000)
    zt = sum(C[k] * np.exp(1j * freqs[k] * t) for k in garde)

    # --- rendu ---
    idx = np.clip((t / (2 * np.pi) * M).astype(int), 0, M - 1)
    ct = is_conn[idx]
    pts = np.array([zt.real, zt.imag]).T.reshape(-1, 1, 2)
    segs = np.concatenate([pts[:-1], pts[1:]], axis=1)
    sc = ct[:-1] | ct[1:]

    fig, ax = plt.subplots(figsize=(15, 5.5))
    fig.patch.set_facecolor("#12060f")
    ax.set_facecolor("#12060f")
    ax.add_collection(LineCollection(segs[sc], colors="#5a4a52",
                                     linewidth=0.5, alpha=0.35))
    lc = LineCollection(segs[~sc], cmap="spring", linewidth=2.3)
    lc.set_array(t[:-1][~sc])
    ax.add_collection(lc)
    ax.set_aspect("equal")
    ax.set_xlim(zt.real.min() - 0.1, zt.real.max() + 0.1)
    ax.set_ylim(zt.imag.min() - 0.4, zt.imag.max() + 0.4)
    ax.axis("off")
    fig.tight_layout()
    fig.savefig(FICHIER_SORTIE, dpi=150)
    print("Image enregistree :", FICHIER_SORTIE)


if __name__ == "__main__":
    main()
