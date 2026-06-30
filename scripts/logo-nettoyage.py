#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Logo One Way — nettoyage : retire la ligne de texte du bas
(« TRANSPORT, LIVRAISON, SUIVI DIGITAL ») tout en gardant « ONE WAY » et
l'emblème (cercle = O, flèche en W, route en perspective).

Produit, à partir du logo source (avec tagline) :
  - OneWay_logo.png              logo nettoyé, recentré, fond blanc (1024²)
  - OneWay_logo_transparent.png  même logo, fond transparent
  - OneWay_embleme.png           emblème seul (sans texte), transparent (512²)

Dépendances : pip install Pillow numpy
Usage :
    python3 scripts/logo-nettoyage.py <source.png> <dossier_sortie>
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

MARKER = (255, 0, 254)          # couleur temporaire pour le détourage


def bbox_nonwhite(arr, thr=235):
    nb = (arr[:, :, :3] < thr).any(axis=2)
    ys, xs = np.where(nb)
    return xs.min(), ys.min(), xs.max(), ys.max()


def to_transparent(img, side, seeds, thresh=40):
    """Rend transparent le fond blanc connecté aux bords (flood-fill)."""
    d = img.convert("RGB")
    for s in seeds:
        ImageDraw.floodfill(d, s, MARKER, thresh=thresh)
    arr = np.asarray(d)
    bg = (arr[:, :, 0] == 255) & (arr[:, :, 1] == 0) & (arr[:, :, 2] == 254)
    out = np.asarray(img.convert("RGBA")).copy()
    out[bg, 3] = 0
    return Image.fromarray(out, "RGBA")


def main(src, outdir):
    os.makedirs(outdir, exist_ok=True)
    im = Image.open(src).convert("RGB")
    a = np.asarray(im).copy()
    H, W, _ = a.shape

    # Détecter automatiquement la bande de texte du bas (tagline) et l'effacer.
    nonwhite = (a < 235).any(axis=2)
    rc = nonwhite.sum(axis=1) > 5
    bands, start = [], None
    for y in range(H):
        if rc[y] and start is None:
            start = y
        elif not rc[y] and start is not None:
            bands.append((start, y - 1)); start = None
    if start is not None:
        bands.append((start, H - 1))
    # la dernière bande = tagline ; on blanchit à partir de son haut (avec marge)
    if len(bands) >= 3:
        cut = bands[-1][0] - 8
        a[cut:, :, :] = 255
    cleaned = Image.fromarray(a)

    # Recomposer centré, fond blanc (sans rééchantillonnage)
    x0, y0, x1, y1 = bbox_nonwhite(a)
    pad = 24
    crop = cleaned.crop((max(0, x0 - pad), max(0, y0 - pad),
                         min(W, x1 + pad + 1), min(H, y1 + pad + 1)))
    cw, ch = crop.size
    side = max(1024, cw + 80, ch + 80)
    canvas = Image.new("RGB", (side, side), (255, 255, 255))
    canvas.paste(crop, ((side - cw) // 2, (side - ch) // 2))
    canvas = canvas.resize((1024, 1024))
    canvas.save(os.path.join(outdir, "OneWay_logo.png"))

    seeds = [(0, 0), (1023, 0), (0, 1023), (1023, 1023),
             (512, 0), (0, 512), (1023, 512), (512, 1023)]
    to_transparent(canvas, 1024, seeds).save(
        os.path.join(outdir, "OneWay_logo_transparent.png"))

    # Emblème seul (au-dessus de « ONE WAY ») : 2 premières bandes = emblème
    emb = np.asarray(im).copy()
    emb_bottom = bands[0][1] + 6 if bands else H
    emb[emb_bottom:, :, :] = 255
    ex0, ey0, ex1, ey1 = bbox_nonwhite(emb)
    ec = Image.fromarray(emb).crop((ex0 - 10, ey0 - 10, ex1 + 11, ey1 + 11))
    s = max(ec.size)
    sq = Image.new("RGB", (s, s), (255, 255, 255))
    sq.paste(ec, ((s - ec.size[0]) // 2, (s - ec.size[1]) // 2))
    sq = sq.resize((512, 512))
    to_transparent(sq, 512, [(0, 0), (511, 0), (0, 511), (511, 511)]).save(
        os.path.join(outdir, "OneWay_embleme.png"))

    print("OK — logo nettoyé (tagline retirée) :")
    print("  OneWay_logo.png, OneWay_logo_transparent.png, OneWay_embleme.png")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("Usage: python3 scripts/logo-nettoyage.py <source.png> <dossier_sortie>")
    main(sys.argv[1], sys.argv[2])
