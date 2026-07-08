"""
"Je t'aime Anjoanina" tracee par une SEULE fonction (serie de Fourier /
epicycles) :

    f(t) = sum_{n=-N}^{N} c_n * exp(i n t)          t in [0, 2*pi]

Chaque terme c_n*exp(i n t) est un rayon polaire |c_n| qui tourne a la
vitesse n  ->  generalisation polaire d'un trace.

Pipeline :
  1. contours des lettres (police cursive Great Vibes) via TextPath
  2. rassembles en UN chemin ferme (plus proche voisin + connecteurs)
  3. z(t) = x(t) + i y(t)  ->  coefficients de Fourier par FFT
  4. reconstruction avec N harmoniques  ->  on retrace la phrase
"""
import sys
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.font_manager import FontProperties
from matplotlib.textpath import TextPath
from matplotlib.collections import LineCollection

TEXT = "Je t'aime Anjoanina"
FONT = "fonts/GreatVibes-Regular.ttf"
N_HARMONICS = int(sys.argv[1]) if len(sys.argv) > 1 else 900

# --- 1. contours de la phrase ---------------------------------------------
fp = FontProperties(fname=FONT)
tp = TextPath((0, 0), TEXT, size=1, prop=fp)
contours = [np.asarray(p, float) for p in tp.to_polygons() if len(p) >= 3]

def resample(poly, step):
    """re-echantillonne un contour ferme a pas d'arc ~constant."""
    p = np.vstack([poly, poly[0]])
    seg = np.diff(p, axis=0)
    d = np.hypot(seg[:, 0], seg[:, 1])
    s = np.concatenate([[0], np.cumsum(d)])
    L = s[-1]
    if L == 0:
        return poly[:1]
    n = max(10, int(L / step))
    si = np.linspace(0, L, n, endpoint=False)
    return np.column_stack([np.interp(si, s, p[:, 0]),
                            np.interp(si, s, p[:, 1])])

STEP = 0.004
contours = [resample(c, STEP) for c in contours]

# --- 2. UN seul chemin ferme : ordre plus-proche-voisin + connecteurs ------
def link_amount(a, b):
    """nb de points d'un connecteur proportionnel a la distance."""
    return max(2, int(np.hypot(*(a - b)) / STEP))

remaining = contours[:]
# depart : contour le plus a gauche
start_idx = int(np.argmin([c[:, 0].min() for c in remaining]))
order = [remaining.pop(start_idx)]
while remaining:
    tail = order[-1][-1]
    dists = [min(np.hypot(*(c[0] - tail)), np.hypot(*(c[-1] - tail)))
             for c in remaining]
    j = int(np.argmin(dists))
    nxt = remaining.pop(j)
    # oriente le contour pour commencer par l'extremite la plus proche
    if np.hypot(*(nxt[-1] - tail)) < np.hypot(*(nxt[0] - tail)):
        nxt = nxt[::-1]
    order.append(nxt)

path_parts = []
conn_flags = []          # True = point appartient a un connecteur (voyage du stylo)
for k, c in enumerate(order):
    if k > 0:
        a, b = order[k - 1][-1], c[0]
        m = link_amount(a, b)
        link = np.column_stack([np.linspace(a[0], b[0], m),
                                np.linspace(a[1], b[1], m)])
        path_parts.append(link)
        conn_flags.append(np.ones(m, bool))
    path_parts.append(c)
    conn_flags.append(np.zeros(len(c), bool))
# fermeture : retour au tout debut
a, b = order[-1][-1], order[0][0]
m = link_amount(a, b)
path_parts.append(np.column_stack([np.linspace(a[0], b[0], m),
                                   np.linspace(a[1], b[1], m)]))
conn_flags.append(np.ones(m, bool))

path = np.vstack(path_parts)
is_conn = np.concatenate(conn_flags)
z = path[:, 0] + 1j * path[:, 1]
M = len(z)

# --- 3. coefficients de Fourier (FFT) --------------------------------------
C = np.fft.fft(z) / M
freqs = np.fft.fftfreq(M, d=1.0 / M).astype(int)      # 0,1,2,...,-2,-1

# on garde les N harmoniques de plus basse frequence
keep = np.argsort(np.abs(freqs))[: 2 * N_HARMONICS + 1]

# --- 4. reconstruction f(t) = sum c_n e^{i n t} ----------------------------
t = np.linspace(0, 2 * np.pi, 9000)
zt = np.zeros_like(t, dtype=complex)
for k in keep:
    zt += C[k] * np.exp(1j * freqs[k] * t)

# --- rendu -----------------------------------------------------------------
plt.rcParams.update({
    "figure.facecolor": "#12060f",
    "savefig.facecolor": "#12060f",
    "text.color": "#ffd9e6",
})
fig, ax = plt.subplots(figsize=(15, 5.5))
ax.set_facecolor("#12060f")

# pour chaque t reconstruit, sait-on si on est sur un connecteur ?
idx = np.clip((t / (2 * np.pi) * M).astype(int), 0, M - 1)
conn_t = is_conn[idx]

pts = np.array([zt.real, zt.imag]).T.reshape(-1, 1, 2)
segs = np.concatenate([pts[:-1], pts[1:]], axis=1)
seg_conn = conn_t[:-1] | conn_t[1:]

# connecteurs (voyage du stylo) : gris, tres fins et discrets
ax.add_collection(LineCollection(segs[seg_conn], colors="#5a4a52",
                                 linewidth=0.5, alpha=0.35))
# le texte lui-meme : degrade rose/or, epais
lc = LineCollection(segs[~seg_conn], cmap="spring", linewidth=2.3)
lc.set_array(t[:-1][~seg_conn])
ax.add_collection(lc)

ax.set_aspect("equal")
xr = zt.real
yr = zt.imag
mx = 0.05 * (xr.max() - xr.min())
my = 0.25 * (yr.max() - yr.min())
ax.set_xlim(xr.min() - mx, xr.max() + mx)
ax.set_ylim(yr.min() - my, yr.max() + my)
ax.axis("off")
ax.set_title(r"$f(t)=\sum_{n=-N}^{N} c_n\,e^{\,i\,n\,t}$"
             f"   —   N = {N_HARMONICS} harmoniques,   {2*N_HARMONICS+1} vecteurs tournants",
             color="#ff7fb0", fontsize=13, pad=14)

fig.tight_layout()
out = "jetaime.png"
fig.savefig(out, dpi=150)
print(f"Saved {out}")
print(f"contours={len(contours)}  M={M}  N={N_HARMONICS}")
