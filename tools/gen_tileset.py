"""Generate the 'depths' tileset (16x16): gothic stone giving way to molten core.

Strip order matches assetManifest.ts Tile indices:
  0 STONE | 1 STONE_TOP | 2 PLATFORM | 3 MOLTEN | 4 CRACKED
"""
from __future__ import annotations
import math
from PIL import Image, ImageDraw
from common import (BG_DEEP, STONE, STONE_HI, STONE_LO, MOLTEN, MOLTEN_HI, GRACE,
                    BLOOM, apply_bloom, new, save, rgba, lerp)

T = 16


def h(x: int, y: int, s: int = 0) -> float:
    """Deterministic pseudo-noise in [0,1)."""
    n = (x * 374761393 + y * 668265263 + s * 2246822519) & 0xFFFFFFFF
    n = (n ^ (n >> 13)) * 1274126177 & 0xFFFFFFFF
    return ((n ^ (n >> 16)) & 0xFFFF) / 0xFFFF


def stone_body(img, seed=0, base=STONE, lo=STONE_LO, hi=STONE_HI):
    px = img.load()
    for y in range(T):
        for x in range(T):
            v = h(x, y, seed)
            c = lerp(lo, base, 0.5 + v * 0.5)
            if v > 0.86:
                c = lerp(base, hi, 0.5)
            px[x, y] = rgba(c)
    d = ImageDraw.Draw(img)
    # mortar lines (block masonry)
    for yy in (0, 8):
        d.line([(0, yy), (T - 1, yy)], fill=rgba(STONE_LO))
    d.line([(8, 0), (8, 7)], fill=rgba(STONE_LO))
    d.line([(4, 8), (4, 15)], fill=rgba(STONE_LO))
    d.line([(12, 8), (12, 15)], fill=rgba(STONE_LO))


def lit_top(img, color=GRACE, warm=False):
    d = ImageDraw.Draw(img)
    top = lerp(STONE_HI, color, 0.35)
    d.line([(0, 0), (T - 1, 0)], fill=rgba(top))
    d.line([(0, 1), (T - 1, 1)], fill=rgba(lerp(STONE_HI, STONE, 0.4)))
    # a couple of small rubble specks catching the light
    for x in (3, 9, 13):
        d.point((x, 2), fill=rgba(lerp(STONE_HI, color, 0.2)))


def tile_stone():
    img = new(T, T)
    stone_body(img, seed=1)
    return img


def tile_stone_top():
    img = new(T, T)
    stone_body(img, seed=1)
    lit_top(img)
    return img


def tile_platform():
    img = new(T, T)
    d = ImageDraw.Draw(img)
    # a thin ledge: 6px solid bar with a couple of hangers, transparent below
    for y in range(6):
        for x in range(T):
            v = h(x, y, 4)
            d.point((x, y), fill=rgba(lerp(STONE_LO, STONE, 0.4 + v * 0.5)))
    lit_top(img)
    d.line([(0, 5), (T - 1, 5)], fill=rgba(STONE_LO))
    for x in (3, 8, 12):
        d.line([(x, 6), (x, 7 + int(h(x, 0, 9) * 2))], fill=rgba(STONE_LO))
    return img


def tile_molten():
    img = new(T, T)
    px = img.load()
    # dark crust with glowing veins; brighter near the top surface
    for y in range(T):
        for x in range(T):
            v = h(x, y, 7)
            crust = lerp(STONE_LO, BG_DEEP, 0.4 + v * 0.4)
            px[x, y] = rgba(crust)
    d = ImageDraw.Draw(img)
    # molten cracks
    for x in range(T):
        glow = 0.5 + 0.5 * math.sin(x * 0.9 + 1.3)
        yy = 9 + int(glow * 3)
        d.point((x, yy), fill=rgba(lerp(MOLTEN, MOLTEN_HI, glow)))
        if h(x, yy, 3) > 0.6:
            d.point((x, yy + 1), fill=rgba(MOLTEN))
    # hot top surface
    for x in range(T):
        g = 0.5 + 0.5 * math.sin(x * 0.7)
        d.point((x, 0), fill=rgba(lerp(MOLTEN, BLOOM, g * 0.5)))
        d.point((x, 1), fill=rgba(MOLTEN))
    return apply_bloom(img, threshold=120, radius=1.6, gain=1.0)


def tile_cracked():
    img = new(T, T)
    stone_body(img, seed=1)
    d = ImageDraw.Draw(img)
    # jagged fracture
    pts = [(2, 1), (6, 6), (4, 9), (9, 12), (8, 15)]
    d.line(pts, fill=rgba(BG_DEEP), width=1)
    d.line([(10, 2), (12, 7), (15, 9)], fill=rgba(BG_DEEP), width=1)
    # a faint molten glint deep in the crack
    d.point((6, 6), fill=rgba(MOLTEN))
    d.point((9, 12), fill=rgba(MOLTEN))
    return img


def build():
    tiles = [tile_stone(), tile_stone_top(), tile_platform(), tile_molten(), tile_cracked()]
    sheet = new(T * len(tiles), T)
    for i, im in enumerate(tiles):
        sheet.alpha_composite(im, (i * T, 0))
    save(sheet, "tilesets", "depths.png")
    print("  tiles: STONE STONE_TOP PLATFORM MOLTEN CRACKED")


if __name__ == "__main__":
    build()
