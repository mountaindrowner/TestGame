"""Generate the 'depths' AUTOTILE tileset (16x16): gothic stone -> molten core.

Instead of one stamped block, walls are edge-aware: which sides are EXPOSED
(no solid neighbour) decides the tile, so edges get lit bevels and convex
corners get rounded. Interiors come in several scattered variants to kill the
repeating-pattern look.

Strip order (must match src/data/assetManifest.ts Vis indices):
  0..15  wall by exposed-edge bitmask  (bit0 top, bit1 right, bit2 bottom, bit3 left)
  16     interior variant A
  17     interior variant B
  18     cracked interior
  19     one-way platform
  20     molten surface
"""
from __future__ import annotations
import math
from PIL import Image, ImageDraw
from common import (BG_DEEP, STONE, STONE_HI, STONE_LO, MOLTEN, MOLTEN_HI, GRACE,
                    BLOOM, apply_bloom, new, save, rgba, lerp)

T = 16
R = 5  # rounded corner radius

TOP, RIGHT, BOTTOM, LEFT = 1, 2, 4, 8

LEAF = (46, 92, 78)
LEAF_HI = (108, 184, 150)


def hsh(x, y, s=0):
    n = (x * 374761393 + y * 668265263 + s * 2246822519) & 0xFFFFFFFF
    n = (n ^ (n >> 13)) * 1274126177 & 0xFFFFFFFF
    return ((n ^ (n >> 16)) & 0xFFFF) / 0xFFFF


def stone_fill(img, seed):
    px = img.load()
    for y in range(T):
        for x in range(T):
            v = hsh(x, y, seed)
            c = lerp(STONE_LO, STONE, 0.45 + v * 0.55)
            if v > 0.9:
                c = lerp(STONE, STONE_HI, 0.5)
            px[x, y] = rgba(c)


def carve_corner(img, corner, r=R):
    """Make a convex corner rounded by clearing the outside-of-disk pixels."""
    px = img.load()
    if corner == 'NE':
        ox, oy, cx, cy = T - r, 0, T - r, r
        xr, yr = range(T - r, T), range(0, r)
    elif corner == 'NW':
        ox, oy, cx, cy = 0, 0, r, r
        xr, yr = range(0, r), range(0, r)
    elif corner == 'SE':
        ox, oy, cx, cy = T - r, T - r, T - r, T - r
        xr, yr = range(T - r, T), range(T - r, T)
    else:  # SW
        ox, oy, cx, cy = 0, T - r, r, T - r
        xr, yr = range(0, r), range(T - r, T)
    for x in xr:
        for y in yr:
            if math.hypot(x + 0.5 - cx, y + 0.5 - cy) > r:
                px[x, y] = (0, 0, 0, 0)


def edge_rim(d, edge, lit, dark, a, b):
    """Draw a lit bevel + inner shadow along a straight exposed edge from a..b."""
    if edge == TOP:
        d.line([(a, 0), (b, 0)], fill=rgba(lit), width=1)
        d.line([(a, 1), (b, 1)], fill=rgba(lerp(lit, STONE, 0.5)), width=1)
        d.line([(a, 2), (b, 2)], fill=rgba(dark), width=1)
    elif edge == BOTTOM:
        d.line([(a, T - 1), (b, T - 1)], fill=rgba(lerp(lit, dark, 0.5)), width=1)
        d.line([(a, T - 2), (b, T - 2)], fill=rgba(dark), width=1)
    elif edge == LEFT:
        d.line([(0, a), (0, b)], fill=rgba(lit), width=1)
        d.line([(1, a), (1, b)], fill=rgba(dark), width=1)
    elif edge == RIGHT:
        d.line([(T - 1, a), (T - 1, b)], fill=rgba(lerp(lit, dark, 0.4)), width=1)
        d.line([(T - 2, a), (T - 2, b)], fill=rgba(dark), width=1)


def corner_rim(d, corner, lit, r=R):
    if corner == 'NE':
        d.arc([T - 2 * r, 0, T - 1, 2 * r - 1], 270, 360, fill=rgba(lit), width=1)
    elif corner == 'NW':
        d.arc([0, 0, 2 * r - 1, 2 * r - 1], 180, 270, fill=rgba(lit), width=1)
    elif corner == 'SE':
        d.arc([T - 2 * r, T - 2 * r, T - 1, T - 1], 0, 90, fill=rgba(lit), width=1)
    else:
        d.arc([0, T - 2 * r, 2 * r - 1, T - 1], 90, 180, fill=rgba(lit), width=1)


def add_moss(d, seed, length_bias=1.0):
    """Cool overgrowth clinging just under a lit top edge — organic ledge feel."""
    for x in range(1, T - 1):
        if hsh(x, seed, 23) > 0.6:
            ln = 1 + int(hsh(x, seed, 29) * 2 * length_bias)
            for k in range(ln):
                col = lerp(LEAF, LEAF_HI, hsh(x, k, 31))
                d.point((x, 2 + k), fill=rgba(col))
            if hsh(x, seed, 37) > 0.82:
                d.point((x, 2), fill=rgba(LEAF_HI))


def wall(mask, variant=0):
    img = new(T, T)
    stone_fill(img, seed=1 + variant)
    top, right, bottom, left = mask & TOP, mask & RIGHT, mask & BOTTOM, mask & LEFT

    # round convex corners (both adjacent edges exposed)
    if top and right:
        carve_corner(img, 'NE')
    if top and left:
        carve_corner(img, 'NW')
    if bottom and right:
        carve_corner(img, 'SE')
    if bottom and left:
        carve_corner(img, 'SW')

    d = ImageDraw.Draw(img)
    lit_top = lerp(STONE_HI, GRACE, 0.30)
    lit_side = STONE_HI
    lit_bot = lerp(STONE_HI, MOLTEN, 0.18)
    dark = STONE_LO

    if top:
        edge_rim(d, TOP, lit_top, dark, R if left else 0, T - R if right else T)
    if bottom:
        edge_rim(d, BOTTOM, lit_bot, dark, R if left else 0, T - R if right else T)
    if left:
        edge_rim(d, LEFT, lit_side, dark, R if top else 0, T - R if bottom else T)
    if right:
        edge_rim(d, RIGHT, lit_side, dark, R if top else 0, T - R if bottom else T)

    if top and right:
        corner_rim(d, 'NE', lit_top)
    if top and left:
        corner_rim(d, 'NW', lit_top)
    if bottom and right:
        corner_rim(d, 'SE', lit_bot)
    if bottom and left:
        corner_rim(d, 'SW', lit_bot)

    if top:
        add_moss(d, mask)  # overgrowth on any exposed-top ledge

    # interior masonry only where not exposed (suggests deeper blocks)
    if not top and not bottom:
        d.line([(0, 8), (T - 1, 8)], fill=rgba(STONE_LO))
    if mask == 0:
        d.line([(8, 0), (8, 7)], fill=rgba(STONE_LO))
        d.line([(4, 8), (4, 15)], fill=rgba(STONE_LO))
    return img


def interior_variant(seed):
    img = wall(0, variant=seed)
    d = ImageDraw.Draw(img)
    # scatter a few flecks: cool moss or a warm ember deep in the rock
    for _ in range(2):
        x = int(hsh(seed, _, 11) * 12) + 2
        y = int(hsh(_, seed, 17) * 12) + 2
        warm = hsh(x, y, seed) > 0.6
        d.point((x, y), fill=rgba(MOLTEN if warm else lerp(STONE_HI, GRACE, 0.3)))
    return img


def cracked():
    img = wall(0, variant=3)
    d = ImageDraw.Draw(img)
    d.line([(3, 1), (7, 6), (5, 9), (10, 13), (9, 15)], fill=rgba(BG_DEEP), width=1)
    d.line([(11, 2), (13, 7)], fill=rgba(BG_DEEP), width=1)
    d.point((7, 6), fill=rgba(MOLTEN))
    d.point((10, 13), fill=rgba(MOLTEN))
    return img


def platform():
    img = new(T, T)
    d = ImageDraw.Draw(img)
    for y in range(6):
        for x in range(T):
            v = hsh(x, y, 4)
            d.point((x, y), fill=rgba(lerp(STONE_LO, STONE, 0.4 + v * 0.5)))
    # rounded ends + lit top
    carve_corner(img, 'NW', 3)
    carve_corner(img, 'NE', 3)
    d = ImageDraw.Draw(img)
    d.line([(2, 0), (T - 3, 0)], fill=rgba(lerp(STONE_HI, GRACE, 0.3)))
    d.line([(0, 5), (T - 1, 5)], fill=rgba(STONE_LO))
    for x in (3, 8, 12):
        d.line([(x, 6), (x, 7 + int(hsh(x, 0, 9) * 2))], fill=rgba(STONE_LO))
    add_moss(d, 4, length_bias=0.6)  # a little overgrowth on platforms too
    return img


def molten():
    img = new(T, T)
    px = img.load()
    for y in range(T):
        for x in range(T):
            v = hsh(x, y, 7)
            px[x, y] = rgba(lerp(STONE_LO, BG_DEEP, 0.4 + v * 0.4))
    d = ImageDraw.Draw(img)
    for x in range(T):
        glow = 0.5 + 0.5 * math.sin(x * 0.9 + 1.3)
        d.point((x, 9 + int(glow * 3)), fill=rgba(lerp(MOLTEN, MOLTEN_HI, glow)))
        d.point((x, 0), fill=rgba(lerp(MOLTEN, BLOOM, glow * 0.5)))
        d.point((x, 1), fill=rgba(MOLTEN))
    return apply_bloom(img, threshold=120, radius=1.6, gain=1.0)


def build():
    tiles = [wall(m) for m in range(16)]
    tiles.append(interior_variant(1))   # 16
    tiles.append(interior_variant(2))   # 17
    tiles.append(cracked())             # 18
    tiles.append(platform())            # 19
    tiles.append(molten())              # 20
    sheet = new(T * len(tiles), T)
    for i, im in enumerate(tiles):
        sheet.alpha_composite(im, (i * T, 0))
    save(sheet, "tilesets", "depths.png")
    print(f"  depths autotile: 16 wall-masks + 2 interior variants + cracked + platform + molten ({len(tiles)} tiles)")


if __name__ == "__main__":
    build()
