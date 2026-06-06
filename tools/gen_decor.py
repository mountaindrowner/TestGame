"""Generate aesthetic hanging decorations — chains, vines, roots, banners.

Each is a single image with the attach point at TOP-CENTER, so the engine can
hang it from a ledge underside and sway it by rotating around that pivot.
Output: sprites/decor/<name>.png
"""
from __future__ import annotations
import math
from PIL import Image, ImageDraw
from common import (BODY, STONE, STONE_HI, STONE_LO, MOLTEN, MOLTEN_HI, GRACE,
                    BLOOM, apply_bloom, new, save, rgba, lerp)

LEAF = (46, 92, 78)
LEAF_HI = (108, 184, 150)
ROOT = (60, 44, 36)
CLOTH = (52, 30, 44)


def chain():
    w, h = 7, 46
    img = new(w, h)
    d = ImageDraw.Draw(img)
    cx = w // 2
    y = 1
    while y < h - 4:
        vert = (y // 5) % 2 == 0
        if vert:
            d.ellipse([cx - 1.5, y, cx + 1.5, y + 6], outline=rgba(STONE), width=1)
            d.line([(cx - 1, y + 1), (cx - 1, y + 5)], fill=rgba(STONE_HI))  # rim
        else:
            d.ellipse([cx - 2.5, y + 1, cx + 2.5, y + 4], outline=rgba(STONE_LO), width=1)
        y += 5
    # a small ring at the very top (the anchor)
    d.ellipse([cx - 2, 0, cx + 2, 3], outline=rgba(STONE_HI), width=1)
    return img


def vine():
    w, h = 14, 56
    img = new(w, h)
    d = ImageDraw.Draw(img)
    cx = w / 2
    # wavy stem
    pts = []
    for y in range(0, h - 2):
        x = cx + math.sin(y * 0.18) * 2.2
        pts.append((x, y))
    d.line(pts, fill=rgba(lerp(LEAF, STONE_LO, 0.3)), width=2)
    d.line([(p[0] - 0.6, p[1]) for p in pts], fill=rgba(lerp(LEAF, GRACE, 0.12)), width=1)
    # leaves along the stem
    for i in range(6, h - 4, 7):
        sx = cx + math.sin(i * 0.18) * 2.2
        side = 1 if (i // 7) % 2 == 0 else -1
        lx = sx + side * 3
        d.polygon(
            [(sx, i), (lx, i - 2), (lx + side * 2, i + 1), (lx, i + 3)],
            fill=rgba(LEAF),
        )
        d.point((lx, i), fill=rgba(LEAF_HI))
    # a glowing bud at the tip (hope, even down here)
    d.ellipse([cx - 1.5, h - 5, cx + 1.5, h - 2], fill=rgba(GRACE))
    return apply_bloom(img, threshold=160, radius=1.4, gain=0.8)


def root():
    w, h = 11, 40
    img = new(w, h)
    d = ImageDraw.Draw(img)
    cx = w / 2
    pts = [(cx, 0)]
    x = cx
    for y in range(2, h - 1, 2):
        x += math.sin(y * 0.5) * 1.2
        pts.append((x, y))
    d.line(pts, fill=rgba(ROOT), width=3)
    d.line([(p[0] - 0.8, p[1]) for p in pts], fill=rgba(lerp(ROOT, STONE_HI, 0.3)), width=1)
    # a couple of forking tendrils
    for sy in (14, 26):
        bx = cx + math.sin(sy * 0.5) * 1.2
        d.line([(bx, sy), (bx + 4, sy + 6)], fill=rgba(ROOT), width=2)
        d.line([(bx, sy), (bx - 3, sy + 5)], fill=rgba(ROOT), width=1)
    return img


def banner():
    w, h = 16, 44
    img = new(w, h)
    d = ImageDraw.Draw(img)
    # pole crossbar
    d.line([(2, 1), (w - 2, 1)], fill=rgba(STONE_HI), width=1)
    # cloth body with a tattered, forked bottom
    d.polygon(
        [(3, 2), (w - 3, 2), (w - 3, h - 8), (w - 5, h - 2), (w / 2, h - 7),
         (4, h - 2), (3, h - 8)],
        fill=rgba(CLOTH),
    )
    d.line([(3, 2), (3, h - 8)], fill=rgba(lerp(CLOTH, GRACE, 0.18)))  # lit edge
    # a faint sigil — a downward then upward mark (a fall, then a rising)
    d.line([(6, 10), (9, 20)], fill=rgba(lerp(CLOTH, BLOOM, 0.4)), width=1)
    d.line([(9, 20), (11, 12)], fill=rgba(lerp(CLOTH, GRACE, 0.5)), width=1)
    return img


def moss():
    """A dangling clump of moss strands (attach at top-center)."""
    w, h = 12, 15
    img = new(w, h)
    d = ImageDraw.Draw(img)
    for sx in range(2, w - 1, 2):
        strands = 5 + (sx * 7 % 5)
        for y in range(strands):
            col = lerp(LEAF, LEAF_HI, y / strands)
            d.point((sx + (1 if y % 3 == 0 else 0), y + 1), fill=rgba(col))
    for sx in (3, 7, 9):
        d.point((sx, 1), fill=rgba(LEAF_HI))
    return img


def fern():
    """A drooping fern frond hanging from a ledge underside."""
    w, h = 14, 26
    img = new(w, h)
    d = ImageDraw.Draw(img)
    cx = w / 2
    pts = [(cx, 0)]
    x = cx
    for y in range(1, h - 1):
        x += math.sin(y * 0.25) * 0.8
        pts.append((x, y))
    d.line(pts, fill=rgba(lerp(LEAF, STONE_LO, 0.2)), width=1)
    for i in range(2, h - 3, 3):
        sx = cx + math.sin(i * 0.25) * 0.8
        for side in (-1, 1):
            d.line([(sx, i), (sx + side * 4, i + 2)], fill=rgba(LEAF), width=1)
            d.point((sx + side * 4, i + 2), fill=rgba(LEAF_HI))
    d.ellipse([cx - 1, h - 3, cx + 1, h - 1], fill=rgba(GRACE))  # a small hopeful bud
    return apply_bloom(img, threshold=170, radius=1.2, gain=0.7)


def build():
    save(chain(), "sprites", "decor", "chain.png")
    save(vine(), "sprites", "decor", "vine.png")
    save(root(), "sprites", "decor", "root.png")
    save(banner(), "sprites", "decor", "banner.png")
    save(moss(), "sprites", "decor", "moss.png")
    save(fern(), "sprites", "decor", "fern.png")


if __name__ == "__main__":
    build()
