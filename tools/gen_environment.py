"""Generate the ENVIRONMENT DECOR set — 24 small standing/wall pieces that scatter
across floors and walls to make the catacombs feel inhabited and ancient: bones,
rubble, grave markers, candles, relics, growth. All share the depths palette so
they sit INTO the scene (restrained highlights, no saturated noise), and every
piece is feet-anchored (bottom-center) except the wall plaques (center).

Output: sprites/env/<name>.png   (loaded by PreloadScene, placed by GroundDecor)
Run via `npm run assets`.
"""
from __future__ import annotations
import math
from PIL import Image, ImageDraw
from common import (STONE, STONE_HI, STONE_LO, MOLTEN, MOLTEN_HI, GRACE, BLOOM,
                    BG_DEEP, apply_bloom, new, save, rgba, lerp)

BONE = (168, 158, 134)
BONE_LO = (110, 102, 84)
BONE_HI = (214, 206, 184)
IRON = (62, 64, 74)
IRON_HI = (108, 112, 126)
WOOD = (74, 56, 40)
ASH = (52, 50, 54)
MOSS = (52, 96, 74)
MOSS_HI = (96, 160, 122)


def _d(img):
    return ImageDraw.Draw(img)


# ── bones ────────────────────────────────────────────────────────────────────
def skull():
    img = new(10, 9)
    d = _d(img)
    d.ellipse([1, 0, 8, 6], fill=rgba(BONE))
    d.rectangle([3, 6, 6, 8], fill=rgba(BONE_LO))  # jaw
    d.point((3, 3), fill=rgba(BG_DEEP)); d.point((6, 3), fill=rgba(BG_DEEP))  # sockets
    d.point((2, 1), fill=rgba(BONE_HI))
    return img


def bone_pile():
    img = new(16, 7)
    d = _d(img)
    for (x0, y0, x1, y1) in [(1, 4, 9, 5), (6, 2, 14, 3), (3, 5, 12, 6)]:
        d.line([(x0, y0), (x1, y1)], fill=rgba(BONE), width=1)
        d.ellipse([x0 - 1, y0 - 1, x0 + 1, y0 + 1], fill=rgba(BONE_LO))
        d.ellipse([x1 - 1, y1 - 1, x1 + 1, y1 + 1], fill=rgba(BONE_LO))
    d.point((7, 2), fill=rgba(BONE_HI))
    return img


def ribcage():
    img = new(14, 10)
    d = _d(img)
    for i in range(4):
        x = 2 + i * 3
        d.arc([x - 2, 1, x + 4, 9], 250, 60, fill=rgba(BONE if i % 2 else BONE_LO))
    d.line([(2, 2), (12, 2)], fill=rgba(BONE_LO))  # spine
    return img


def bone_heap():
    img = new(18, 11)
    d = _d(img)
    d.ellipse([1, 6, 16, 10], fill=rgba(BONE_LO))
    d.line([(3, 7), (10, 5)], fill=rgba(BONE))
    d.line([(8, 8), (15, 6)], fill=rgba(BONE))
    # the skull crowning it
    d.ellipse([9, 1, 15, 6], fill=rgba(BONE))
    d.point((11, 3), fill=rgba(BG_DEEP)); d.point((13, 3), fill=rgba(BG_DEEP))
    d.point((10, 2), fill=rgba(BONE_HI))
    return img


# ── stone / ruin ─────────────────────────────────────────────────────────────
def rubble_small():
    img = new(12, 6)
    d = _d(img)
    for (x, y, s) in [(2, 3, 2), (6, 2, 3), (9, 4, 1)]:
        d.polygon([(x, y + s), (x + s, y), (x + 2 * s, y + s)], fill=rgba(STONE_LO))
        d.point((x + s, y + 1), fill=rgba(STONE))
    return img


def rubble_large():
    img = new(18, 10)
    d = _d(img)
    d.polygon([(1, 9), (4, 3), (9, 5), (8, 9)], fill=rgba(STONE_LO))
    d.polygon([(8, 9), (11, 2), (16, 6), (15, 9)], fill=rgba(lerp(STONE_LO, STONE, 0.5)))
    d.line([(4, 4), (8, 6)], fill=rgba(STONE))
    d.point((11, 3), fill=rgba(STONE_HI))
    return img


def pillar_stump():
    img = new(14, 14)
    d = _d(img)
    d.rectangle([2, 4, 11, 13], fill=rgba(STONE_LO))
    d.line([(3, 4), (3, 13)], fill=rgba(STONE))
    d.line([(5, 4), (5, 13)], fill=rgba(STONE_LO))
    # jagged broken top
    d.polygon([(2, 4), (5, 1), (8, 4), (11, 2), (11, 4)], fill=rgba(STONE))
    d.rectangle([1, 12, 12, 13], fill=rgba(STONE))  # base plinth
    d.point((6, 2), fill=rgba(STONE_HI))
    return img


def fallen_column():
    img = new(22, 8)
    d = _d(img)
    d.rounded_rectangle([1, 2, 20, 7], radius=2, fill=rgba(STONE_LO))
    for x in (5, 10, 15):
        d.line([(x, 2), (x, 7)], fill=rgba(lerp(STONE_LO, BG_DEEP, 0.4)))
    d.line([(2, 3), (19, 3)], fill=rgba(STONE))
    d.point((3, 3), fill=rgba(STONE_HI))
    return img


def statue_head():
    img = new(12, 12)
    d = _d(img)
    d.rounded_rectangle([2, 1, 9, 10], radius=3, fill=rgba(STONE_LO))
    d.line([(4, 4), (4, 6)], fill=rgba(BG_DEEP))  # closed eye lines
    d.line([(7, 4), (7, 6)], fill=rgba(BG_DEEP))
    d.line([(5, 8), (6, 8)], fill=rgba(lerp(STONE_LO, BG_DEEP, 0.5)))
    d.point((3, 2), fill=rgba(STONE))
    d.polygon([(8, 10), (11, 11), (8, 11)], fill=rgba(STONE_LO))  # rubble at chin
    return img


def stalagmite():
    img = new(10, 14)
    d = _d(img)
    d.polygon([(1, 13), (4, 2), (6, 13)], fill=rgba(STONE_LO))
    d.polygon([(5, 13), (7, 6), (9, 13)], fill=rgba(lerp(STONE_LO, BG_DEEP, 0.3)))
    d.line([(4, 3), (4, 12)], fill=rgba(STONE))
    return img


# ── grave / faith ────────────────────────────────────────────────────────────
def gravestone_round():
    img = new(12, 14)
    d = _d(img)
    d.rounded_rectangle([2, 1, 9, 13], radius=3, fill=rgba(STONE_LO))
    d.line([(3, 2), (3, 11)], fill=rgba(STONE))
    d.line([(5, 5), (7, 5)], fill=rgba(BG_DEEP))  # worn epitaph lines
    d.line([(4, 7), (8, 7)], fill=rgba(BG_DEEP))
    return img


def gravestone_cross():
    img = new(12, 16)
    d = _d(img)
    d.rectangle([5, 1, 7, 15], fill=rgba(STONE_LO))
    d.rectangle([2, 4, 10, 6], fill=rgba(STONE_LO))
    d.line([(5, 2), (5, 14)], fill=rgba(STONE))
    d.line([(3, 4), (3, 5)], fill=rgba(STONE))
    d.polygon([(2, 15), (10, 15), (9, 14), (3, 14)], fill=rgba(lerp(STONE_LO, BG_DEEP, 0.4)))
    return img


def candle_cluster():
    img = new(12, 9)
    d = _d(img)
    for (x, h) in [(2, 4), (5, 6), (9, 3)]:
        d.rectangle([x - 1, 8 - h, x + 1, 8], fill=rgba(BONE_HI))
        d.line([(x - 1, 8 - h), (x - 1, 8)], fill=rgba(BONE))
        d.point((x, 8 - h - 1), fill=rgba(MOLTEN_HI))  # flame
        d.point((x, 8 - h - 2), fill=rgba(BLOOM))
    return apply_bloom(img, threshold=140, radius=1.4, gain=0.9)


def candelabra():
    img = new(14, 20)
    d = _d(img)
    d.line([(7, 4), (7, 17)], fill=rgba(IRON), width=1)
    d.arc([2, 2, 12, 9], 200, 340, fill=rgba(IRON))
    d.rectangle([4, 17, 10, 19], fill=rgba(IRON))  # foot
    for x in (2, 7, 12):
        d.point((x, 3), fill=rgba(IRON_HI))
        d.point((x, 2), fill=rgba(MOLTEN_HI))
        d.point((x, 1), fill=rgba(BLOOM))
    return apply_bloom(img, threshold=140, radius=1.4, gain=0.9)


# ── relics ───────────────────────────────────────────────────────────────────
def broken_shield():
    img = new(11, 12)
    d = _d(img)
    d.polygon([(1, 1), (9, 1), (9, 6), (5, 11), (1, 6)], fill=rgba(IRON))
    d.line([(2, 2), (8, 2)], fill=rgba(IRON_HI))
    d.line([(5, 2), (5, 9)], fill=rgba(IRON_HI))
    d.line([(6, 4), (9, 8)], fill=rgba(BG_DEEP), width=1)  # the crack
    return img


def stuck_sword():
    img = new(10, 17)
    d = _d(img)
    d.line([(5, 1), (5, 13)], fill=rgba(IRON_HI), width=1)  # blade
    d.line([(4, 2), (4, 11)], fill=rgba(IRON))
    d.line([(2, 11), (8, 11)], fill=rgba(WOOD), width=1)  # guard
    d.point((5, 13), fill=rgba(IRON))
    d.rectangle([4, 8, 6, 9], fill=rgba(IRON))  # nick
    d.polygon([(2, 16), (8, 16), (7, 14), (3, 14)], fill=rgba(STONE_LO))  # mound
    return img


def rusted_helmet():
    img = new(11, 9)
    d = _d(img)
    d.ellipse([1, 1, 9, 8], fill=rgba(IRON))
    d.rectangle([3, 5, 7, 7], fill=rgba(BG_DEEP))  # visor void
    d.line([(2, 2), (5, 1)], fill=rgba(IRON_HI))
    d.point((8, 6), fill=rgba(MOLTEN))  # a rust fleck
    return img


def chain_coil():
    img = new(13, 7)
    d = _d(img)
    for i, (cx, cy) in enumerate([(3, 4), (6, 3), (9, 4), (11, 5)]):
        d.ellipse([cx - 2, cy - 1, cx + 2, cy + 2], outline=rgba(IRON if i % 2 else IRON_HI), width=1)
    return img


def pot_shards():
    img = new(14, 6)
    d = _d(img)
    clay = (96, 74, 58)
    d.arc([1, 1, 7, 8], 180, 320, fill=rgba(clay))
    d.polygon([(8, 5), (11, 2), (12, 5)], fill=rgba(clay))
    d.point((4, 2), fill=rgba(lerp(clay, BONE_HI, 0.4)))
    return img


def ash_heap():
    img = new(14, 6)
    d = _d(img)
    d.ellipse([1, 2, 12, 5], fill=rgba(ASH))
    d.point((5, 2), fill=rgba(MOLTEN))  # dying embers
    d.point((9, 3), fill=rgba(MOLTEN_HI))
    return apply_bloom(img, threshold=150, radius=1.2, gain=0.7)


# ── growth ───────────────────────────────────────────────────────────────────
def mushrooms():
    img = new(13, 9)
    d = _d(img)
    for (x, h, r) in [(3, 4, 3), (8, 6, 2), (11, 3, 2)]:
        d.line([(x, 8 - h + 2), (x, 8)], fill=rgba(BONE_LO))
        d.ellipse([x - r, 8 - h, x + r, 8 - h + 3], fill=rgba(lerp(GRACE, BG_DEEP, 0.45)))
        d.point((x, 8 - h + 1), fill=rgba(GRACE))
    return apply_bloom(img, threshold=120, radius=1.4, gain=0.6)


def crystals():
    img = new(12, 11)
    d = _d(img)
    for (x, h, w_) in [(3, 8, 2), (7, 10, 3), (10, 5, 2)]:
        d.polygon([(x - w_ // 2, 10), (x, 10 - h), (x + w_ // 2 + 1, 10)],
                  fill=rgba(lerp(GRACE, BG_DEEP, 0.35)))
        d.line([(x, 10 - h + 1), (x, 9)], fill=rgba(GRACE))
    return apply_bloom(img, threshold=110, radius=1.6, gain=0.8)


def moss_clump():
    img = new(14, 5)
    d = _d(img)
    d.ellipse([0, 1, 13, 4], fill=rgba(MOSS))
    for x in (2, 5, 8, 11):
        d.point((x, 1), fill=rgba(MOSS_HI))
    return img


def roots_patch():
    img = new(16, 8)
    d = _d(img)
    for i in range(4):
        x0 = 2 + i * 4
        pts = [(x0 + math.sin(y * 0.8 + i) * 1.5, 7 - y) for y in range(0, 7)]
        d.line(pts, fill=rgba(lerp(WOOD, STONE_LO, 0.3)), width=1)
    d.point((6, 2), fill=rgba(MOSS_HI))
    return img


# ── wall pieces (origin center; mounted ON wall faces) ───────────────────────
def wall_relief():
    img = new(14, 14)
    d = _d(img)
    d.rectangle([0, 0, 13, 13], fill=rgba(lerp(STONE_LO, BG_DEEP, 0.25)))
    d.rectangle([1, 1, 12, 12], outline=rgba(STONE), width=1)
    # a kneeling figure carved in relief (the penitent)
    d.ellipse([5, 3, 8, 6], outline=rgba(STONE), width=1)
    d.arc([3, 6, 10, 12], 180, 360, fill=rgba(STONE))
    d.point((6, 4), fill=rgba(STONE_HI))
    return img


def wall_plaque():
    img = new(16, 10)
    d = _d(img)
    d.rectangle([0, 0, 15, 9], fill=rgba(lerp(STONE_LO, BG_DEEP, 0.3)))
    d.rectangle([1, 1, 14, 8], outline=rgba(STONE_LO), width=1)
    for y in (3, 5, 7):
        d.line([(3, y), (12 if y != 5 else 9, y)], fill=rgba(STONE))
    d.line([(10, 2), (13, 7)], fill=rgba(BG_DEEP))  # cracked corner
    return img


PIECES = {
    "skull": skull, "bone-pile": bone_pile, "ribcage": ribcage, "bone-heap": bone_heap,
    "rubble-small": rubble_small, "rubble-large": rubble_large, "pillar-stump": pillar_stump,
    "fallen-column": fallen_column, "statue-head": statue_head, "stalagmite-floor": stalagmite,
    "gravestone-round": gravestone_round, "gravestone-cross": gravestone_cross,
    "candle-cluster": candle_cluster, "candelabra": candelabra,
    "broken-shield": broken_shield, "stuck-sword": stuck_sword, "rusted-helmet": rusted_helmet,
    "chain-coil": chain_coil, "pot-shards": pot_shards, "ash-heap": ash_heap,
    "mushrooms": mushrooms, "crystals": crystals, "moss-clump": moss_clump, "roots-patch": roots_patch,
    "wall-relief": wall_relief, "wall-plaque": wall_plaque,
}


def build():
    for name, fn in PIECES.items():
        save(fn(), "sprites/env", f"{name}.png")
    print(f"  environment decor set: {len(PIECES)} pieces (sprites/env/)")


if __name__ == "__main__":
    build()
