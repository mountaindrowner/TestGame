"""Generate the 'mirrors' AUTOTILE tileset (House of Mirrors / BIO-02).

Same 21-slot Vis contract as depths (gen_tileset.py) — we reuse all of its
edge-aware geometry and just reskin the palette to violet/indigo marble with a
silver mirror sheen, a glass platform, a cracked-mirror CRACK slot and a magenta
"shard" hazard (the MOLTEN-equivalent). Informed by a PixelLab sidescroller
tileset reference (obsidian + violet marble + silver glass); the raw CDN image
isn't fetchable from this sandbox, so the look is matched by design.

NOTE: the palette overrides live INSIDE build() (not at import) so importing this
module never disturbs gen_tileset's depths palette. gen_all runs depths first.
Run via `npm run assets`. Strip order must match src/data/assetManifest.ts Vis.
"""
from __future__ import annotations
import gen_tileset as g
from common import new, save, rgba, lerp

T = g.T


def _sheen(d, seed, length_bias=1.0):
    """Replace 'moss' on exposed tops with sparse silver glints (light on glass)."""
    for x in range(1, T - 1):
        if g.hsh(x, seed, 23) > 0.82:
            d.point((x, 2), fill=rgba(lerp(g.STONE_HI, g.GRACE, 0.6)))


def build() -> None:
    # Reskin gen_tileset's module globals to the mirror palette (its functions read
    # these by name at call time). Applied here, not at import, so depths is safe.
    g.BG_DEEP = (12, 10, 22)
    g.STONE_LO = (26, 22, 44)
    g.STONE = (44, 38, 70)
    g.STONE_HI = (108, 100, 150)
    g.MOLTEN = (196, 72, 184)      # magenta shard-glow (hazard)
    g.MOLTEN_HI = (255, 142, 236)
    g.GRACE = (176, 208, 255)      # cold silver-cyan sheen
    g.BLOOM = (255, 255, 255)
    g.LEAF = (70, 64, 110)
    g.LEAF_HI = (150, 150, 200)
    g.CALCITE = (150, 156, 184)
    g.CALCITE_HI = (228, 232, 250)
    g.DAMP = (18, 14, 30)
    g.add_moss = _sheen            # wall()/platform()/interior_variant() pick this up

    tiles = [g.wall(m) for m in range(16)]
    tiles.append(g.interior_variant(1))   # 16
    tiles.append(g.interior_variant(2))   # 17
    tiles.append(g.cracked())             # 18  (reads as cracked mirror)
    tiles.append(g.platform())            # 19  (glass plate)
    tiles.append(g.molten())              # 20  (magenta shard hazard)
    sheet = new(T * len(tiles), T)
    for i, im in enumerate(tiles):
        sheet.alpha_composite(im, (i * T, 0))
    save(sheet, "tilesets", "mirrors.png")
    print(f"  mirrors autotile: 16 wall-masks + 2 interior + cracked-glass + glass platform + shard hazard ({len(tiles)} tiles)")


if __name__ == "__main__":
    build()
