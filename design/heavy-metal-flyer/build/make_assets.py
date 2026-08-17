#!/usr/bin/env python3
"""Génère les textures de l'affiche SERPENT THRONE (fonds braise, emblème,
rayons, ornements). Sorties : build/assets/*.jpg|png, réutilisées par make_flyer.js."""

import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
os.makedirs(OUT, exist_ok=True)

# A4 portrait @ 200 dpi
W, H = 1654, 2339
rng = np.random.default_rng(2610)

INK = np.array([9.0, 8.0, 11.0])
BLOOD = np.array([158.0, 14.0, 20.0])
EMBER = np.array([255.0, 92.0, 26.0])
GOLD = np.array([242.0, 180.0, 58.0])


def clouds(w, h, octaves=(6, 14, 34, 80), weights=(0.5, 0.28, 0.15, 0.07), seed=0):
    """Bruit fractal lissé (fumée) normalisé 0..1."""
    r = np.random.default_rng(seed)
    acc = np.zeros((h, w), np.float32)
    for o, wt in zip(octaves, weights):
        small = r.random((max(2, o), max(2, int(o * w / h)))).astype(np.float32)
        up = np.asarray(
            Image.fromarray((small * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC),
            np.float32,
        ) / 255.0
        acc += wt * up
    acc -= acc.min()
    acc /= max(acc.max(), 1e-6)
    return acc


def radial(x, y, cx, cy, rx, ry, power):
    d = np.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2)
    return np.clip(1.0 - d, 0.0, 1.0) ** power


def make_background(path, glow_cx=0.5, glow_cy=1.02, seed=7, intensity=1.0, shafts=True):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    img = np.zeros((H, W, 3), np.float32)
    img[:] = INK

    smoke = clouds(W, H, seed=seed)
    smoke = 0.55 + 0.75 * smoke  # module les halos

    cx, cy = W * glow_cx, H * glow_cy
    # halo large sang
    g1 = radial(xx, yy, cx, cy, W * 0.95, H * 0.62, 2.1) * smoke
    img += (g1 * intensity * 0.85)[..., None] * BLOOD
    # coeur incandescent
    g2 = radial(xx, yy, cx, cy, W * 0.46, H * 0.28, 2.8) * smoke
    img += (g2 * intensity * 0.75)[..., None] * EMBER
    # contre-jour froid en haut
    g3 = radial(xx, yy, W * 0.12, -H * 0.05, W * 0.9, H * 0.45, 3.0)
    img += (g3 * 0.30)[..., None] * np.array([70.0, 82.0, 110.0])

    # colonnes de lumière / poussière dans les faisceaux
    if shafts:
        band = (np.sin(xx / W * np.pi * 7.0 + 0.9) * 0.5 + 0.5) ** 3.0
        fall = np.clip(1.0 - yy / (H * 0.95), 0, 1) ** 1.6
        img += (band * fall * 12.0 * clouds(W, H, seed=seed + 31))[..., None] * np.array(
            [1.0, 0.72, 0.5]
        )

    # rayures / usure verticales
    scratch = (rng.random((1, W)) > 0.994).astype(np.float32)
    scratch = np.repeat(scratch, H, axis=0) * (clouds(W, H, seed=seed + 5) > 0.55)
    img += scratch[..., None] * np.array([26.0, 20.0, 16.0])

    # vignettage
    vig = 1.0 - 0.72 * np.clip(
        np.sqrt(((xx - W / 2) / (W * 0.72)) ** 2 + ((yy - H / 2) / (H * 0.74)) ** 2) - 0.35, 0, 1
    ) ** 1.4
    img *= vig[..., None]

    # grain argentique
    img += rng.normal(0.0, 6.5, (H, W, 1)) + rng.normal(0.0, 2.0, (H, W, 3))

    Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(path, quality=92, subsampling=1)
    print("wrote", path)


def make_rays(path, size=(2000, 1400)):
    """Éclat radial chaud, alpha faible, à poser derrière le titre."""
    w, h = size
    ss = 2
    img = Image.new("L", (w * ss, h * ss), 0)
    d = ImageDraw.Draw(img)
    cx, cy = w * ss / 2, h * ss / 2
    R = max(w, h) * ss
    n = 44
    for i in range(n):
        a0 = (i / n) * 2 * np.pi
        wdt = (0.008 + 0.016 * ((i * 7) % 5) / 4.0) * 2 * np.pi
        p = [
            (cx, cy),
            (cx + R * np.cos(a0 - wdt), cy + R * np.sin(a0 - wdt)),
            (cx + R * np.cos(a0 + wdt), cy + R * np.sin(a0 + wdt)),
        ]
        d.polygon(p, fill=110 + (i % 3) * 30)
    img = img.resize((w, h), Image.LANCZOS).filter(ImageFilter.GaussianBlur(9))

    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    fade = radial(xx, yy, w / 2, h / 2, w * 0.52, h * 0.52, 1.7)
    a = (np.asarray(img, np.float32) * fade * 0.85).astype(np.uint8)

    rgb = np.zeros((h, w, 3), np.float32)
    rgb[:] = EMBER
    rgb += (fade ** 2)[..., None] * (GOLD - EMBER) * 0.9
    out = np.dstack([np.clip(rgb, 0, 255).astype(np.uint8), a])
    Image.fromarray(out, "RGBA").save(path)
    print("wrote", path)


def _star(d, cx, cy, r_in, r_out, teeth, fill, phase=0.0, sharp=1.0):
    pts = []
    for i in range(teeth * 2):
        a = phase + i * np.pi / teeth
        r = r_out if i % 2 == 0 else r_in + (r_out - r_in) * (1 - sharp) * 0.0
        r = r if i % 2 == 0 else r_in
        pts.append((cx + r * np.cos(a), cy + r * np.sin(a)))
    d.polygon(pts, fill=fill)


def make_emblem(path, px=900):
    """Sceau « couronne fondue » : couronne d'épines + double anneau + couronne."""
    ss = 3
    S = px * ss
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = S / 2
    gold = (242, 180, 58, 255)
    ember = (255, 106, 34, 255)

    # couronne d'épines extérieure (longues / courtes alternées)
    for i in range(56):
        a = i * 2 * np.pi / 56
        long_ = i % 2 == 0
        r0, r1 = S * 0.375, S * (0.478 if long_ else 0.425)
        wdt = 0.020 if long_ else 0.014
        p = [
            (c + r1 * np.cos(a), c + r1 * np.sin(a)),
            (c + r0 * np.cos(a - wdt), c + r0 * np.sin(a - wdt)),
            (c + r0 * np.cos(a + wdt), c + r0 * np.sin(a + wdt)),
        ]
        d.polygon(p, fill=ember if long_ else gold)

    d.ellipse([c - S * 0.376, c - S * 0.376, c + S * 0.376, c + S * 0.376],
              outline=gold, width=int(S * 0.014))
    d.ellipse([c - S * 0.330, c - S * 0.330, c + S * 0.330, c + S * 0.330],
              outline=gold, width=int(S * 0.006))
    d.ellipse([c - S * 0.300, c - S * 0.300, c + S * 0.300, c + S * 0.300],
              outline=ember, width=int(S * 0.018))

    # perles sur l'anneau
    for i in range(24):
        a = i * 2 * np.pi / 24 + np.pi / 24
        r = S * 0.353
        rr = S * 0.011
        px_, py_ = c + r * np.cos(a), c + r * np.sin(a)
        d.ellipse([px_ - rr, py_ - rr, px_ + rr, py_ + rr], fill=gold)

    # étoile derrière la couronne
    _star(d, c, c - S * 0.075, S * 0.052, S * 0.150, 8, (255, 236, 190, 235), phase=np.pi / 8)

    # couronne centrale
    bw, bh = S * 0.30, S * 0.062
    by = c + S * 0.115
    d.rectangle([c - bw, by, c + bw, by + bh], fill=gold)
    d.rectangle([c - bw, by + bh * 1.55, c + bw, by + bh * 2.35], fill=ember)
    peaks = [-1.0, -0.5, 0.0, 0.5, 1.0]
    for k, f in enumerate(peaks):
        hgt = S * (0.235 if k == 2 else (0.185 if k in (1, 3) else 0.150))
        x0 = c + f * bw
        wdt = bw * 0.235
        d.polygon([(x0 - wdt, by), (x0 + wdt, by), (x0, by - hgt)], fill=gold)
        rr = S * (0.028 if k == 2 else 0.020)
        d.ellipse([x0 - rr, by - hgt - rr * 1.5, x0 + rr, by - hgt + rr * 0.5], fill=ember)

    img = img.resize((px, px), Image.LANCZOS)
    img.save(path)
    print("wrote", path)


def make_divider(path, w=1600, h=140):
    ss = 3
    img = Image.new("RGBA", (w * ss, h * ss), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    W_, H_ = w * ss, h * ss
    cy = H_ / 2
    gold = (242, 180, 58, 255)
    ember = (255, 106, 34, 255)

    # deux traits effilés
    for sign in (-1, 1):
        x_out = W_ * (0.5 + sign * 0.47)
        x_in = W_ * (0.5 + sign * 0.075)
        d.polygon([(x_out, cy), (x_in, cy - H_ * 0.030), (x_in, cy + H_ * 0.030)], fill=gold)
        d.polygon(
            [(W_ * (0.5 + sign * 0.30), cy - H_ * 0.115),
             (W_ * (0.5 + sign * 0.24), cy - H_ * 0.030),
             (W_ * (0.5 + sign * 0.36), cy - H_ * 0.030)],
            fill=ember,
        )
        d.polygon(
            [(W_ * (0.5 + sign * 0.30), cy + H_ * 0.115),
             (W_ * (0.5 + sign * 0.24), cy + H_ * 0.030),
             (W_ * (0.5 + sign * 0.36), cy + H_ * 0.030)],
            fill=ember,
        )
    # losange central
    r = H_ * 0.30
    d.polygon([(W_ / 2, cy - r), (W_ / 2 + r * 0.55, cy), (W_ / 2, cy + r), (W_ / 2 - r * 0.55, cy)],
              fill=ember)
    r2 = r * 0.42
    d.polygon([(W_ / 2, cy - r2), (W_ / 2 + r2 * 0.55, cy), (W_ / 2, cy + r2),
               (W_ / 2 - r2 * 0.55, cy)], fill=(255, 240, 205, 255))

    img.resize((w, h), Image.LANCZOS).save(path)
    print("wrote", path)


def make_spark(path, w=1400, h=900):
    """Braises / étincelles flottantes, alpha, à poser en haut de l'affiche."""
    r = np.random.default_rng(99)
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for _ in range(420):
        x, y = r.random() * w, r.random() ** 1.6 * h
        rad = r.random() * 2.6 + 0.6
        a = int(60 + 170 * (1 - y / h) * r.random())
        col = (255, int(150 + 90 * r.random()), int(40 + 60 * r.random()), a)
        d.ellipse([x - rad, y - rad, x + rad, y + rad], fill=col)
    img = img.filter(ImageFilter.GaussianBlur(0.7))
    img.save(path)
    print("wrote", path)


if __name__ == "__main__":
    make_background(os.path.join(OUT, "bg-recto.jpg"), glow_cx=0.5, glow_cy=1.02, seed=7,
                    intensity=1.0)
    make_background(os.path.join(OUT, "bg-verso.jpg"), glow_cx=0.86, glow_cy=-0.06, seed=23,
                    intensity=0.62, shafts=False)
    make_background(os.path.join(OUT, "bg-kit.jpg"), glow_cx=0.10, glow_cy=1.08, seed=41,
                    intensity=0.45, shafts=False)
    make_rays(os.path.join(OUT, "rays.png"))
    make_emblem(os.path.join(OUT, "emblem.png"))
    make_divider(os.path.join(OUT, "divider.png"))
    make_spark(os.path.join(OUT, "sparks.png"))
