"""Generate the MIRRORS-biome ENVIRONMENT DECOR set — the House-of-Mirrors voice
of the floor/wall clutter, the way gen_environment.py is the depths' bone-and-grave
voice. Glass shards, toppled gilt mirror frames, porcelain "false-face" masks,
violet candelabra, electric-blue crystals — all in the lavender/electric-blue
palette sampled for the mirror tileset, so they sit INTO the scene.

Plus the mirror biome's HANGING props (Decorations): a silver chain, a hanging
shard cluster, a tattered violet drape, a swinging hand-mirror.

Output:
  sprites/env/m-<name>.png    ground/wall scatter (GroundDecor)
  sprites/decor/m-<name>.png  hanging props (Decorations)
Run via `npm run assets`.
"""
from __future__ import annotations
import math
from PIL import Image, ImageDraw
from common import apply_bloom, new, save, rgba, lerp, BG_DEEP

# ── mirror palette (sampled to match gen_tileset_mirrors) ────────────────────
LAV = (86, 62, 122)        # lavender-purple brick
LAV_HI = (140, 116, 178)
LAV_LO = (50, 38, 82)
GLASS = (96, 156, 255)     # electric-blue mirror sheen
GLASS_HI = (208, 228, 255)
GLASS_LO = (44, 64, 130)
VIOLET = (180, 120, 255)
VIOLET_HI = (224, 188, 255)
MAGENTA = (212, 70, 182)
GILT = (176, 146, 86)      # gold mirror-frame
GILT_HI = (234, 208, 136)
PORC = (228, 224, 234)     # porcelain mask
PORC_LO = (150, 146, 172)
SILVER = (172, 182, 204)
SILVER_HI = (224, 234, 248)
IRON = (58, 56, 74)
IRON_HI = (106, 110, 130)
BGD = (8, 6, 20)


def _d(img):
    return ImageDraw.Draw(img)


# ── glass ────────────────────────────────────────────────────────────────────
def glass_shards():
    """A scatter of small electric-blue shards on the ground."""
    img = new(14, 6)
    d = _d(img)
    for (x, y, s) in [(2, 4, 2), (6, 3, 3), (10, 5, 2), (8, 4, 1)]:
        d.polygon([(x, y + s), (x + s, y), (x + 2 * s, y + s)], fill=rgba(GLASS_LO))
        d.line([(x + s, y), (x + s, y + s)], fill=rgba(GLASS))
        d.point((x + s, y + 1), fill=rgba(GLASS_HI))
    return apply_bloom(img, threshold=180, radius=1.2, gain=0.5)


def shard_pile():
    """A heap of shattered mirror glass, points catching the light."""
    img = new(16, 9)
    d = _d(img)
    d.polygon([(1, 8), (5, 8), (3, 3)], fill=rgba(GLASS_LO))
    d.polygon([(4, 8), (10, 8), (8, 1), (6, 5)], fill=rgba(lerp(GLASS_LO, GLASS, 0.4)))
    d.polygon([(9, 8), (15, 8), (12, 2)], fill=rgba(GLASS_LO))
    d.line([(8, 1), (8, 8)], fill=rgba(GLASS))
    d.line([(12, 2), (12, 8)], fill=rgba(GLASS))
    d.point((8, 2), fill=rgba(GLASS_HI))
    d.point((12, 3), fill=rgba(GLASS_HI))
    return apply_bloom(img, threshold=180, radius=1.3, gain=0.6)


def fallen_frame():
    """A toppled, broken gilt mirror frame lying on the floor — dark glass within."""
    img = new(22, 9)
    d = _d(img)
    d.rounded_rectangle([1, 2, 20, 8], radius=2, outline=rgba(GILT), width=2)
    d.rectangle([3, 4, 18, 7], fill=rgba(lerp(GLASS_LO, BGD, 0.4)))   # dark backing glass
    d.line([(4, 4), (12, 6)], fill=rgba(GLASS), width=1)             # a streak of reflection
    d.line([(2, 2), (10, 2)], fill=rgba(GILT_HI))                    # lit top rail
    d.line([(15, 3), (19, 7)], fill=rgba(BGD))                       # a crack/break
    d.point((4, 3), fill=rgba(GILT_HI))
    return img


def leaning_pane():
    """A cracked mirror pane propped against the wall, blue light caught in it."""
    img = new(12, 17)
    d = _d(img)
    d.rectangle([1, 0, 9, 15], fill=rgba(GILT))                      # frame edge
    d.rectangle([2, 1, 8, 14], fill=rgba(lerp(GLASS_LO, BGD, 0.3)))  # glass
    d.line([(3, 2), (7, 9)], fill=rgba(GLASS))                       # reflection sweep
    d.line([(3, 2), (3, 13)], fill=rgba(lerp(GLASS, GLASS_HI, 0.5)))
    d.line([(7, 4), (4, 12)], fill=rgba(GLASS_HI))                   # the crack, lit
    d.line([(7, 4), (8, 7)], fill=rgba(GLASS_HI))
    d.rectangle([1, 15, 9, 16], fill=rgba(GILT_HI))                  # base
    return apply_bloom(img, threshold=190, radius=1.2, gain=0.5)


def blue_crystals():
    """An electric-blue crystal cluster growing from the floor."""
    img = new(12, 12)
    d = _d(img)
    for (x, h, w_) in [(3, 8, 2), (7, 11, 3), (10, 5, 2)]:
        d.polygon([(x - w_ // 2, 11), (x, 11 - h), (x + w_ // 2 + 1, 11)],
                  fill=rgba(lerp(GLASS, BGD, 0.35)))
        d.line([(x, 11 - h + 1), (x, 10)], fill=rgba(GLASS))
        d.point((x, 11 - h + 1), fill=rgba(GLASS_HI))
    return apply_bloom(img, threshold=150, radius=1.6, gain=0.8)


def glass_dust():
    """A low drift of glittering glass dust on the ground."""
    img = new(14, 4)
    d = _d(img)
    d.ellipse([1, 2, 12, 3], fill=rgba(lerp(GLASS_LO, BGD, 0.5)))
    for x in (3, 6, 8, 11):
        d.point((x, 2), fill=rgba(GLASS_HI))
    d.point((5, 1), fill=rgba(GLASS))
    return apply_bloom(img, threshold=180, radius=1.2, gain=0.5)


# ── false faces ──────────────────────────────────────────────────────────────
def false_face():
    """A porcelain mask resting on the ground — the gallery's 'false face'."""
    img = new(11, 10)
    d = _d(img)
    d.ellipse([1, 0, 9, 9], fill=rgba(PORC))
    d.ellipse([1, 0, 9, 9], outline=rgba(PORC_LO), width=1)
    d.line([(3, 3), (4, 4)], fill=rgba(BGD))     # eye holes (hollow)
    d.line([(6, 3), (7, 4)], fill=rgba(BGD))
    d.arc([3, 4, 7, 8], 200, 340, fill=rgba(PORC_LO))   # a faint serene mouth
    d.line([(5, 1), (4, 6)], fill=rgba(PORC_LO))         # hairline crack
    d.point((3, 2), fill=rgba((255, 255, 255)))          # a porcelain glint
    return img


def mask_shards():
    """Broken pieces of a porcelain mask."""
    img = new(14, 6)
    d = _d(img)
    d.polygon([(1, 5), (4, 5), (3, 1)], fill=rgba(PORC))
    d.line([(2, 3), (3, 3)], fill=rgba(BGD))            # a lone eye on a fragment
    d.polygon([(6, 5), (11, 5), (10, 2), (7, 3)], fill=rgba(PORC_LO))
    d.point((9, 4), fill=rgba(PORC))
    d.polygon([(11, 5), (13, 5), (12, 3)], fill=rgba(PORC))
    return img


# ── stone / ruin (lavender) ──────────────────────────────────────────────────
def toppled_pedestal():
    """A fallen ornate display pedestal (where a mirror once stood)."""
    img = new(18, 9)
    d = _d(img)
    d.rounded_rectangle([1, 3, 16, 8], radius=2, fill=rgba(LAV_LO))
    d.rectangle([1, 2, 5, 8], fill=rgba(LAV))            # the cap, now on its side
    d.rectangle([14, 3, 17, 8], fill=rgba(LAV))          # the base foot
    d.line([(2, 3), (15, 3)], fill=rgba(LAV_HI))         # lit top edge
    for x in (7, 10, 13):
        d.line([(x, 4), (x, 7)], fill=rgba(LAV_LO))      # fluting
    d.point((3, 3), fill=rgba(LAV_HI))
    return img


def shattered_bust():
    """A broken marble bust toppled on its side."""
    img = new(12, 11)
    d = _d(img)
    d.ellipse([2, 1, 9, 8], fill=rgba(lerp(PORC_LO, LAV, 0.4)))   # head
    d.line([(4, 3), (4, 5)], fill=rgba(BGD))                      # eye
    d.line([(6, 3), (6, 5)], fill=rgba(BGD))
    d.polygon([(2, 8), (10, 8), (11, 10), (1, 10)], fill=rgba(LAV_LO))  # broken neck/base
    d.line([(7, 5), (9, 8)], fill=rgba(BGD))                      # crack
    d.point((3, 2), fill=rgba(PORC))
    return img


def gilt_rubble():
    """Lavender brick rubble with a glint of broken gilt trim."""
    img = new(16, 8)
    d = _d(img)
    d.polygon([(1, 7), (4, 2), (8, 4), (7, 7)], fill=rgba(LAV_LO))
    d.polygon([(7, 7), (10, 1), (14, 5), (13, 7)], fill=rgba(lerp(LAV_LO, LAV, 0.5)))
    d.line([(10, 1), (12, 3)], fill=rgba(GILT))          # gold trim catching light
    d.point((10, 2), fill=rgba(GILT_HI))
    d.point((4, 3), fill=rgba(LAV_HI))
    return img


# ── faith / light (violet) ───────────────────────────────────────────────────
def violet_candelabra():
    """An iron candelabra burning with cold violet flame."""
    img = new(14, 20)
    d = _d(img)
    d.line([(7, 4), (7, 17)], fill=rgba(IRON), width=1)
    d.arc([2, 2, 12, 9], 200, 340, fill=rgba(IRON))
    d.rectangle([4, 17, 10, 19], fill=rgba(IRON))        # foot
    for x in (2, 7, 12):
        d.point((x, 3), fill=rgba(IRON_HI))
        d.point((x, 2), fill=rgba(VIOLET))
        d.point((x, 1), fill=rgba(VIOLET_HI))
    return apply_bloom(img, threshold=150, radius=1.6, gain=0.9)


def silver_chalice():
    """A tipped silver goblet, a thread of violet light in the bowl."""
    img = new(10, 11)
    d = _d(img)
    d.polygon([(2, 3), (8, 3), (7, 7), (3, 7)], fill=rgba(SILVER))   # bowl
    d.line([(3, 3), (7, 3)], fill=rgba(SILVER_HI))
    d.line([(5, 7), (5, 9)], fill=rgba(SILVER))                      # stem
    d.ellipse([2, 9, 8, 10], fill=rgba(SILVER))                      # foot
    d.point((4, 4), fill=rgba(VIOLET))
    d.point((5, 4), fill=rgba(VIOLET_HI))
    return apply_bloom(img, threshold=190, radius=1.2, gain=0.5)


def hand_mirror():
    """A dropped ornate hand-mirror, oval glass catching cold blue light."""
    img = new(9, 16)
    d = _d(img)
    d.ellipse([1, 0, 7, 8], fill=rgba(GILT))                         # frame
    d.ellipse([2, 1, 6, 7], fill=rgba(lerp(GLASS_LO, BGD, 0.2)))     # glass
    d.line([(3, 2), (5, 5)], fill=rgba(GLASS_HI))                    # reflection
    d.rectangle([3, 8, 5, 15], fill=rgba(GILT))                      # handle
    d.line([(4, 8), (4, 15)], fill=rgba(GILT_HI))
    return apply_bloom(img, threshold=200, radius=1.0, gain=0.4)


# ── wall pieces (origin center; mounted ON wall faces) ───────────────────────
def wall_mirror():
    """A small cracked mirror hung on the wall — the gallery motif, miniature."""
    img = new(14, 16)
    d = _d(img)
    d.rounded_rectangle([1, 1, 12, 14], radius=3, fill=rgba(GILT))   # gilt frame
    d.rounded_rectangle([3, 3, 10, 12], radius=2, fill=rgba(lerp(GLASS_LO, BGD, 0.25)))
    d.line([(4, 4), (9, 11)], fill=rgba(GLASS))                      # reflection sweep
    d.line([(8, 4), (5, 11)], fill=rgba(GLASS_HI))                   # crack, lit
    d.line([(8, 4), (10, 8)], fill=rgba(GLASS_HI))
    d.point((4, 3), fill=rgba(GILT_HI))
    return apply_bloom(img, threshold=190, radius=1.2, gain=0.5)


def wall_sconce():
    """An iron wall sconce with a cold violet flame."""
    img = new(8, 14)
    d = _d(img)
    d.line([(4, 4), (4, 12)], fill=rgba(IRON), width=1)
    d.arc([1, 2, 7, 7], 200, 340, fill=rgba(IRON))
    d.polygon([(2, 12), (6, 12), (5, 13), (3, 13)], fill=rgba(IRON_HI))  # bracket
    d.point((4, 2), fill=rgba(VIOLET))
    d.point((4, 1), fill=rgba(VIOLET_HI))
    d.point((3, 2), fill=rgba(VIOLET))
    return apply_bloom(img, threshold=150, radius=1.6, gain=0.9)


def wall_mask():
    """A porcelain false-face hung on the wall, watching the hall."""
    img = new(12, 14)
    d = _d(img)
    d.ellipse([1, 1, 10, 12], fill=rgba(PORC))
    d.ellipse([1, 1, 10, 12], outline=rgba(PORC_LO), width=1)
    d.line([(3, 4), (5, 5)], fill=rgba(BGD))            # hollow eyes
    d.line([(7, 4), (9, 5)], fill=rgba(BGD))
    d.arc([4, 6, 8, 11], 200, 340, fill=rgba(PORC_LO)) # serene mouth
    d.line([(6, 2), (5, 9)], fill=rgba(PORC_LO))        # crack
    return img


# ── hanging props (top-center anchor; for Decorations) ───────────────────────
def hang_chain():
    """A long silver chain hanging from a ledge underside."""
    w, h = 7, 40
    img = new(w, h)
    d = _d(img)
    cx = w // 2
    y = 1
    while y < h - 4:
        vert = (y // 5) % 2 == 0
        if vert:
            d.ellipse([cx - 1.5, y, cx + 1.5, y + 6], outline=rgba(SILVER), width=1)
            d.line([(cx - 1, y + 1), (cx - 1, y + 5)], fill=rgba(SILVER_HI))
        else:
            d.ellipse([cx - 2.5, y + 1, cx + 2.5, y + 4], outline=rgba(IRON_HI), width=1)
        y += 5
    d.ellipse([cx - 2, 0, cx + 2, 3], outline=rgba(SILVER_HI), width=1)
    return img


def hang_shard():
    """A glass shard cluster strung on a thread — turns cold blue light."""
    w, h = 10, 34
    img = new(w, h)
    d = _d(img)
    cx = w / 2
    d.line([(cx, 0), (cx, 16)], fill=rgba(IRON_HI))             # thread
    # a long teardrop shard
    d.polygon([(cx - 3, 16), (cx + 3, 16), (cx, 31)], fill=rgba(lerp(GLASS_LO, GLASS, 0.4)))
    d.line([(cx, 16), (cx, 30)], fill=rgba(GLASS))
    d.line([(cx - 2, 17), (cx, 28)], fill=rgba(GLASS_HI))
    # two smaller shards above
    d.polygon([(cx - 4, 10), (cx - 1, 10), (cx - 2, 16)], fill=rgba(GLASS_LO))
    d.polygon([(cx + 1, 12), (cx + 4, 12), (cx + 2, 17)], fill=rgba(GLASS_LO))
    d.point((cx, 18), fill=rgba(GLASS_HI))
    return apply_bloom(img, threshold=180, radius=1.4, gain=0.6)


def hang_drape():
    """A tattered violet drape hanging from a rail."""
    w, h = 16, 44
    img = new(w, h)
    d = _d(img)
    d.line([(2, 1), (w - 2, 1)], fill=rgba(SILVER_HI), width=1)   # rail
    d.polygon(
        [(3, 2), (w - 3, 2), (w - 3, h - 9), (w - 5, h - 3), (w / 2, h - 8),
         (5, h - 2), (3, h - 9)],
        fill=rgba(lerp(VIOLET, BGD, 0.55)),
    )
    d.line([(3, 2), (3, h - 9)], fill=rgba(lerp(VIOLET, VIOLET_HI, 0.4)))  # lit edge
    d.line([(8, 6), (8, h - 10)], fill=rgba(lerp(VIOLET, BGD, 0.7)))       # a fold
    d.line([(11, 8), (11, h - 12)], fill=rgba(lerp(VIOLET, BGD, 0.7)))
    return img


def hang_mirror():
    """A small round mirror swinging from a short chain."""
    w, h = 12, 30
    img = new(w, h)
    d = _d(img)
    cx = w / 2
    for yy in (1, 5, 9):                                          # short chain
        d.ellipse([cx - 1.5, yy, cx + 1.5, yy + 4], outline=rgba(SILVER), width=1)
    d.ellipse([1, 12, 10, 28], fill=rgba(GILT))                  # frame
    d.ellipse([3, 14, 8, 26], fill=rgba(lerp(GLASS_LO, BGD, 0.2)))  # glass
    d.line([(4, 16), (6, 22)], fill=rgba(GLASS_HI))              # reflection
    d.point((4, 15), fill=rgba(GILT_HI))
    return apply_bloom(img, threshold=200, radius=1.0, gain=0.4)


GROUND = {
    "glass-shards": glass_shards, "shard-pile": shard_pile, "fallen-frame": fallen_frame,
    "leaning-pane": leaning_pane, "blue-crystals": blue_crystals, "glass-dust": glass_dust,
    "false-face": false_face, "mask-shards": mask_shards, "toppled-pedestal": toppled_pedestal,
    "shattered-bust": shattered_bust, "gilt-rubble": gilt_rubble,
    "violet-candelabra": violet_candelabra, "silver-chalice": silver_chalice,
    "hand-mirror": hand_mirror,
}
WALL = {
    "wall-mirror": wall_mirror, "wall-sconce": wall_sconce, "wall-mask": wall_mask,
}
HANG = {
    "chain": hang_chain, "shard": hang_shard, "drape": hang_drape, "mirror": hang_mirror,
}


def build():
    for name, fn in {**GROUND, **WALL}.items():
        save(fn(), "sprites/env", f"m-{name}.png")
    for name, fn in HANG.items():
        save(fn(), "sprites", "decor", f"m-{name}.png")
    print(f"  mirror environment decor: {len(GROUND)} ground + {len(WALL)} wall "
          f"+ {len(HANG)} hanging (sprites/env/m-*, sprites/decor/m-*)")


if __name__ == "__main__":
    build()
