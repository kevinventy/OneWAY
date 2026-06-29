#!/usr/bin/env python3
"""
Décline le logo officiel ONE WAY en tous les assets de la marque :
  * public/logo.png        — logo complet (fond blanc)
  * public/logo-mark.png   — emblème seul, carré (badge)
  * public/icons/*.png      — icônes PWA (any + maskable) + apple-touch
  * src/app/icon.png        — favicon (onglet navigateur, App Router)
  * src/app/apple-icon.png  — icône iOS

Source : scripts/oneway-logo-source.jpg (logo fourni par le client).
Régénérer :  python3 scripts/gen-brand-assets.py   (nécessite Pillow)
"""
from __future__ import annotations
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "scripts", "oneway-logo-source.jpg")
NAVY = (20, 26, 87)        # #141a57 (theme_color)
WHITE = (255, 255, 255)


def emblem_bbox(im: Image.Image) -> tuple[int, int, int, int]:
    """Boîte englobante de l'emblème (tiers supérieur, hors texte du bas)."""
    W, H = im.size
    px = im.convert("RGB").load()
    minx, miny, maxx, maxy = W, H, 0, 0
    for y in range(0, int(H * 0.66)):
        for x in range(0, W):
            r, g, b = px[x, y]
            if not (r > 238 and g > 238 and b > 238):
                minx, miny = min(minx, x), min(miny, y)
                maxx, maxy = max(maxx, x), max(maxy, y)
    return minx, miny, maxx, maxy


def square_emblem(im: Image.Image, pad: float = 1.16) -> Image.Image:
    """Découpe l'emblème AU PLUS JUSTE puis le centre sur un carré blanc.

    On ne ré-étend jamais le découpage dans la source (sinon le texte
    « ONE WAY » du bas remonterait dans le badge) : on prend la boîte
    englobante exacte et on l'entoure de blanc.
    """
    minx, miny, maxx, maxy = emblem_bbox(im)
    crop = im.crop((minx, miny, maxx, maxy))  # emblème seul, sans le texte
    side = int(max(crop.size) * pad)
    canvas = Image.new("RGB", (side, side), WHITE)
    canvas.paste(crop, ((side - crop.width) // 2, (side - crop.height) // 2))
    return canvas


def rounded(im: Image.Image, radius_frac: float = 0.18) -> Image.Image:
    """Coins arrondis avec transparence."""
    im = im.convert("RGBA")
    w, h = im.size
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w, h], radius=int(w * radius_frac), fill=255)
    im.putalpha(mask)
    return im


def icon_on(emblem: Image.Image, size: int, bg, pad_frac: float) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), bg + (255,) if len(bg) == 3 else bg)
    inner = int(size * (1 - 2 * pad_frac))
    e = emblem.convert("RGBA").resize((inner, inner), Image.LANCZOS)
    canvas.paste(e, ((size - inner) // 2, (size - inner) // 2), e)
    return canvas


def main() -> None:
    src = Image.open(SRC).convert("RGB")

    # 1) logo complet (PNG)
    src.save(os.path.join(ROOT, "public", "logo.png"))

    # 2) emblème carré (badge, fond blanc)
    emblem = square_emblem(src)
    emblem.resize((512, 512), Image.LANCZOS).save(os.path.join(ROOT, "public", "logo-mark.png"))

    icons = os.path.join(ROOT, "public", "icons")
    os.makedirs(icons, exist_ok=True)

    # 3) icônes "any" : emblème sur fond blanc, léger padding
    for size in (192, 512):
        icon_on(emblem, size, WHITE, 0.06).convert("RGB").save(
            os.path.join(icons, f"icon-{size}.png"))
    # 4) icônes maskable : emblème sur plaque navy, zone de sécurité 16 %
    for size in (192, 512):
        icon_on(emblem, size, NAVY, 0.16).convert("RGB").save(
            os.path.join(icons, f"icon-maskable-{size}.png"))
    # 5) apple-touch (fond blanc, pas de transparence)
    icon_on(emblem, 180, WHITE, 0.06).convert("RGB").save(
        os.path.join(icons, "apple-touch-icon.png"))

    # 6) favicon + apple-icon (App Router : src/app/icon.png, apple-icon.png)
    app = os.path.join(ROOT, "src", "app")
    icon_on(emblem, 64, WHITE, 0.04).convert("RGB").save(os.path.join(app, "icon.png"))
    icon_on(emblem, 180, WHITE, 0.06).convert("RGB").save(os.path.join(app, "apple-icon.png"))

    print("✅ Assets de marque générés (logo, emblème, icônes PWA, favicon).")


if __name__ == "__main__":
    main()
