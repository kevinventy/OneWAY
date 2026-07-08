"""
Fonction polaire d'un coeur parfait :

    r(theta) = 2 - 2*sin(theta) + ( sin(theta) * sqrt(|cos(theta)|) )
                                   / ( sin(theta) + 1.4 )

theta in [0, 2*pi].  On compare aussi avec la cardioide simple
r = 1 - sin(theta) (coeur "basique" avec creux).
"""
import numpy as np
import matplotlib.pyplot as plt

def r_coeur(theta):
    return (2.0 - 2.0 * np.sin(theta)
            + (np.sin(theta) * np.sqrt(np.abs(np.cos(theta))))
            / (np.sin(theta) + 1.4))

def r_cardioide(theta):
    return 1.0 - np.sin(theta)

plt.rcParams.update({
    "figure.facecolor": "#0d1117",
    "axes.facecolor":   "#0d1117",
    "savefig.facecolor": "#0d1117",
    "text.color":       "#c9d1d9",
})

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 6.8))

# --- Coeur parfait ---------------------------------------------------------
theta = np.linspace(0, 2 * np.pi, 4000)
r = r_coeur(theta)
x = r * np.cos(theta)
y = r * np.sin(theta)
ax1.plot(x, y, color="#ff4d6d", lw=2.6)
ax1.fill(x, y, color="#ff4d6d", alpha=0.22)
ax1.set_aspect("equal")
ax1.axis("off")
ax1.set_title(r"$r=2-2\sin\theta+\dfrac{\sin\theta\,\sqrt{|\cos\theta|}}{\sin\theta+1.4}$",
              color="#f0f6fc", fontsize=14, pad=16)

# --- Cardioide simple pour comparaison ------------------------------------
rc = r_cardioide(theta)
xc = rc * np.cos(theta)
yc = rc * np.sin(theta)
ax2.plot(xc, yc, color="#8b949e", lw=2.2)
ax2.fill(xc, yc, color="#8b949e", alpha=0.18)
ax2.set_aspect("equal")
ax2.axis("off")
ax2.set_title(r"cardioide simple : $r = 1 - \sin\theta$" "\n(le coeur 'basique', creux marque)",
              color="#8b949e", fontsize=12, pad=16)

fig.suptitle("Coeur parfait en coordonnees polaires",
             color="#f0f6fc", fontsize=16, y=0.99)
fig.tight_layout()
fig.savefig("coeur.png", dpi=150)
print("Saved coeur.png")
print(f"coeur parfait : r in [{r.min():.3f}, {r.max():.3f}]")
