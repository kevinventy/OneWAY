"""
Tracé en coordonnées polaires (butterfly curve) :
    r(theta) = e^cos(theta) - 2*cos(4*theta) + sin^5((2*theta - pi)/24)

On convertit en cartesien  x = r*cos(theta), y = r*sin(theta)
pour rendre correctement les valeurs de r negatives.
"""
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection

def r_of(theta):
    return (np.exp(np.cos(theta))
            - 2.0 * np.cos(4.0 * theta)
            + np.sin((2.0 * theta - np.pi) / 24.0) ** 5)

# balayage : periode du terme lent = 24*pi  ->  papillon complet
theta = np.linspace(0.0, 24.0 * np.pi, 120000)
r = r_of(theta)
x = r * np.cos(theta)
y = r * np.sin(theta)

# --- Style sombre ----------------------------------------------------------
plt.rcParams.update({
    "figure.facecolor": "#0d1117",
    "axes.facecolor":   "#0d1117",
    "savefig.facecolor": "#0d1117",
    "text.color":       "#c9d1d9",
})

fig, ax = plt.subplots(figsize=(10, 10))
ax.set_facecolor("#0d1117")

# ligne coloree selon l'angle parcouru (degrade arc-en-ciel)
points = np.array([x, y]).T.reshape(-1, 1, 2)
segments = np.concatenate([points[:-1], points[1:]], axis=1)
lc = LineCollection(segments, cmap="turbo", linewidth=0.7, alpha=0.9)
lc.set_array(theta[:-1])
ax.add_collection(lc)

ax.set_aspect("equal")
m = 1.15 * max(np.abs(x).max(), np.abs(y).max())
ax.set_xlim(-m, m)
ax.set_ylim(-m, m)
ax.axis("off")
ax.set_title(r"$r(\theta)=e^{\cos\theta}-2\cos(4\theta)+\sin^{5}\!\left(\dfrac{2\theta-\pi}{24}\right)$"
             "\n" r"coordonnees polaires  —  $\theta\in[0,\,24\pi]$",
             color="#f0f6fc", fontsize=15, pad=18)

fig.tight_layout()
fig.savefig("courbe_polaire.png", dpi=150)
print("Saved courbe_polaire.png")
print(f"r  : min = {r.min():.4f}  max = {r.max():.4f}")
print(f"|xy| max = {max(np.abs(x).max(), np.abs(y).max()):.4f}")
