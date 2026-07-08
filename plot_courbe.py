"""
Tracé de la courbe :
    f(x) = e^cos(x) - 2*cos(4x) + sin^5((2x - pi) / 24)
"""
import numpy as np
import matplotlib.pyplot as plt
from matplotlib import font_manager  # noqa: F401

def f(x):
    return np.exp(np.cos(x)) - 2.0 * np.cos(4.0 * x) + np.sin((2.0 * x - np.pi) / 24.0) ** 5

# --- Style sombre & propre -------------------------------------------------
plt.rcParams.update({
    "figure.facecolor": "#0d1117",
    "axes.facecolor":   "#0d1117",
    "savefig.facecolor": "#0d1117",
    "axes.edgecolor":   "#30363d",
    "axes.labelcolor":  "#c9d1d9",
    "text.color":       "#c9d1d9",
    "xtick.color":      "#8b949e",
    "ytick.color":      "#8b949e",
    "grid.color":       "#21262d",
    "font.size":        11,
})

fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(13, 9), constrained_layout=True)

# --- Panneau 1 : vue large (une modulation lente complète, periode 24*pi) --
x1 = np.linspace(0, 24 * np.pi, 40000)
ax1.plot(x1, f(x1), color="#58a6ff", lw=0.9)
ax1.set_title(r"$f(x)=e^{\cos x}-2\cos(4x)+\sin^{5}\!\left(\dfrac{2x-\pi}{24}\right)$"
              "\n" r"Vue large  —  $x \in [0,\;24\pi]$",
              color="#f0f6fc", fontsize=15, pad=14)
ax1.grid(True, lw=0.6, alpha=0.7)
ax1.set_xlabel("x")
ax1.set_ylabel("f(x)")
ax1.set_xlim(0, 24 * np.pi)

# repères en multiples de pi
ticks = np.arange(0, 25, 4) * np.pi
ax1.set_xticks(ticks)
ax1.set_xticklabels([f"{int(round(t/np.pi))}π" for t in ticks])

# --- Panneau 2 : zoom sur le detail des oscillations rapides ---------------
x2 = np.linspace(0, 4 * np.pi, 8000)
ax2.plot(x2, f(x2), color="#3fb950", lw=1.6)
ax2.fill_between(x2, f(x2), f(x2).min() - 0.3, color="#3fb950", alpha=0.08)
ax2.set_title(r"Zoom sur le motif  —  $x \in [0,\;4\pi]$",
              color="#f0f6fc", fontsize=13, pad=10)
ax2.grid(True, lw=0.6, alpha=0.7)
ax2.set_xlabel("x")
ax2.set_ylabel("f(x)")
ax2.set_xlim(0, 4 * np.pi)
ticks2 = np.arange(0, 5, 1) * np.pi
ax2.set_xticks(ticks2)
ax2.set_xticklabels(["0", "π", "2π", "3π", "4π"])

fig.savefig("courbe.png", dpi=150)
print("Saved courbe.png")
print(f"min = {f(x1).min():.4f}  |  max = {f(x1).max():.4f}")
