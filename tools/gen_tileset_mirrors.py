"""Generate the 'mirrors' AUTOTILE tileset (House of Mirrors / BIO-02).

Same 21-slot Vis contract as depths (gen_tileset.py) — reuses its edge-aware
geometry and reskins to match Mark's reference (art_src/ref/house_of_mirrors_vibe.png):
LAVENDER-PURPLE BRICK masonry (base ~(86,62,122) lit to ~(138,114,176)) on
near-black, with an ELECTRIC-BLUE mirror sheen on lit edges, a glass platform,
cracked-glass, and a magenta shard hazard (danger reads against the blue).

The walls get a real running-bond BRICK fill (overriding gen_tileset.stone_fill)
to match the reference's masonry. Palette/overrides live INSIDE build() so depths
regenerates byte-identical. Strip order must match assetManifest.ts Vis.
"""
from __future__ import annotations
from PIL import ImageDraw
import gen_tileset as g
from common import new, save, rgba, lerp

T = g.T


def _brick_fill(img, seed):
    """Running-bond lavender brick: base + staggered mortar joints + lit brick tops."""
    px = img.load()
    for y in range(T):
        for x in range(T):
            v = g.hsh(x, y, seed)
            px[x, y] = rgba(lerp(g.STONE_LO, g.STONE, 0.45 + v * 0.55))
    d = ImageDraw.Draw(img)
    mortar = rgba(lerp(g.STONE_LO, g.BG_DEEP, 0.5))
    lit = rgba(lerp(g.STONE, g.STONE_HI, 0.55))
    bands = [(0, 4), (6, 9), (11, 15)]            # three courses per 16px tile
    joints = {0: (8,), 1: (0, 12), 2: (4,)}        # staggered -> running bond
    for my in (5, 10):                             # horizontal mortar + lit brick-top below
        d.line([(0, my), (T - 1, my)], fill=mortar)
        d.line([(0, my + 1), (T - 1, my + 1)], fill=lit)
    for bi, (y0, y1) in enumerate(bands):
        for jx in joints[bi]:
            d.line([(jx, y0), (jx, y1)], fill=mortar)


def _sheen(d, seed, length_bias=1.0):
    """Electric-blue glints on exposed tops (light catching the glass/mirror trim)."""
    for x in range(1, T - 1):
        if g.hsh(x, seed, 23) > 0.82:
            d.point((x, 2), fill=rgba(lerp(g.STONE_HI, g.GRACE, 0.7)))


def build() -> None:
    # Mirror palette (sampled from the reference). Applied here, not at import, so
    # gen_tileset's depths palette is untouched (gen_all runs depths first).
    g.BG_DEEP = (8, 6, 20)
    g.STONE_LO = (50, 38, 82)
    g.STONE = (86, 62, 122)        # lavender-purple brick
    g.STONE_HI = (140, 116, 178)   # lit lavender highlight
    g.MOLTEN = (212, 70, 182)      # magenta shard-glow (hazard; reads as danger)
    g.MOLTEN_HI = (255, 150, 236)
    g.GRACE = (96, 156, 255)       # electric-blue mirror sheen
    g.BLOOM = (255, 255, 255)
    g.LEAF = (84, 70, 130)
    g.LEAF_HI = (150, 150, 200)
    g.CALCITE = (150, 156, 188)
    g.CALCITE_HI = (220, 232, 255)
    g.DAMP = (24, 16, 40)
    g.stone_fill = _brick_fill     # wall()/interior_variant() pick these up by name
    g.add_moss = _sheen

    tiles = [g.wall(m) for m in range(16)]
    tiles.append(g.interior_variant(1))   # 16
    tiles.append(g.interior_variant(2))   # 17
    tiles.append(g.cracked())             # 18  (cracked mirror)
    tiles.append(g.platform())            # 19  (glass plate)
    tiles.append(g.molten())              # 20  (magenta shard hazard)
    sheet = new(T * len(tiles), T)
    for i, im in enumerate(tiles):
        sheet.alpha_composite(im, (i * T, 0))
    save(sheet, "tilesets", "mirrors.png")
    print(f"  mirrors autotile: lavender brick + electric-blue sheen, 21 tiles")


if __name__ == "__main__":
    build()
