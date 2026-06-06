"""Generate the NECROPOLIS parallax layers + fog + a soft particle dot.

The world is the deep crypt of the ancient forgotten — vaults, tombs and
tombstones of wildly varying height receding into haze, scrawled with worn
runes, as far as the eye can see. The only light is a single far flame at the
very end of the dark (added in-engine so it never tile-repeats). The figure
rises from the dead here; the scale is meant to dwarf them.

Layers are TRANSPARENT (the sky gradient + the distant flame live in-engine),
drawn with depth-graded haze + a ground fade so graves are rooted and recede
logically rather than float. All horizontally tileable (content kept off the
x=0/W seam, with a central gap so the far flame shows through).

Outputs:
  backgrounds/far.png  480x270  immense, hazed vaults far in the dark
  backgrounds/mid.png  480x270  nearer tombs + obelisks, faint runes
  backgrounds/near.png 480x270  great foreground vaults framing the floor
  backgrounds/fog.png  256x160  soft drifting fog (tileable both axes)
  sprites/dot.png      12x12    soft round particle (motes / sparks / glow)
"""
from __future__ import annotations
import math
from PIL import Image, ImageDraw, ImageFilter
from common import (BG_DEEP, BG_MID, STONE, STONE_LO, STONE_HI, MOLTEN, MOLTEN_HI,
                    GRACE, BLOOM, new, save, rgba, lerp)

W, H = 480, 270


def hsh(x, s=0):
    n = (int(x) * 374761393 + int(s) * 668265263) & 0xFFFFFFFF
    n = (n ^ (n >> 13)) * 1274126177 & 0xFFFFFFFF
    return ((n ^ (n >> 16)) & 0xFFFF) / 0xFFFF


def _lit(d, x, y0, y1, col):
    d.line([(int(x), int(y0)), (int(x), int(y1))], fill=rgba(lerp(col, GRACE, 0.16)))


# --- grave shapes (rooted at base_y, extend a little below into the ground) ----
def tombstone(d, cx, base, h, w, col):
    x0, x1 = int(cx - w / 2), int(cx + w / 2)
    top = int(base - h)
    d.rectangle([x0, top + w // 2, x1, int(base + 12)], fill=rgba(col))
    d.ellipse([x0, top, x1, top + w], fill=rgba(col))  # rounded head
    _lit(d, x0, top + w // 2, base, col)


def obelisk(d, cx, base, h, w, col):
    top = int(base - h)
    d.polygon(
        [(int(cx - w / 2), int(base + 12)), (int(cx - w / 4), top + 8), (int(cx), top),
         (int(cx + w / 4), top + 8), (int(cx + w / 2), int(base + 12))],
        fill=rgba(col),
    )
    _lit(d, int(cx - w / 2) + 1, top + 10, base, col)


def vault(d, cx, base, h, w, col):
    x0, x1 = int(cx - w / 2), int(cx + w / 2)
    top = int(base - h)
    body_top = top + w // 2
    d.rectangle([x0, body_top, x1, int(base + 12)], fill=rgba(col))  # body
    d.polygon([(x0 - 2, body_top), (int(cx), top), (x1 + 2, body_top)], fill=rgba(col))  # peaked roof
    # dark arched doorway (the open tomb)
    dw = max(5, w // 3)
    dy = int(base - h * 0.42)
    dark = lerp(col, BG_DEEP, 0.62)
    d.rectangle([int(cx - dw / 2), dy, int(cx + dw / 2), int(base + 12)], fill=rgba(dark))
    d.pieslice([int(cx - dw / 2), dy - dw, int(cx + dw / 2), dy + dw], 180, 360, fill=rgba(dark))
    _lit(d, x0, body_top, base, col)


def crossgrave(d, cx, base, h, w, col):
    top = int(base - h)
    d.rectangle([int(cx - w / 2), top + 8, int(cx + w / 2), int(base + 12)], fill=rgba(col))
    d.rectangle([int(cx - 1), top - 6, int(cx + 1), top + 10], fill=rgba(col))  # cross stem
    d.rectangle([int(cx - 4), top - 1, int(cx + 4), top + 1], fill=rgba(col))  # cross arm
    _lit(d, int(cx - w / 2), top + 8, base, col)


def runes(d, x0, y0, x1, y1, col, seed):
    """Worn scrawl — rows of short marks in a forgotten tongue."""
    x0, y0, x1, y1 = int(x0), int(y0), int(x1), int(y1)
    r = 0
    ry = y0 + 4
    while ry < y1 - 2:
        x = x0 + 2
        while x < x1 - 2:
            g = hsh(x * 3 + r, seed)
            if g > 0.55:
                if g > 0.84:
                    d.line([(x, ry - 2), (x, ry + 2)], fill=rgba(col))
                    d.line([(x, ry), (x + 2, ry)], fill=rgba(col))
                else:
                    d.point((x, ry), fill=rgba(col))
                    if g > 0.7:
                        d.point((x + 1, ry - 1), fill=rgba(col))
            x += 3
        ry += 7
        r += 1


def ground_fade(img, horizon, dark, max_a):
    """Fade the lower portion into darkness so grave bases are rooted, not floating."""
    g = new(W, H)
    gd = ImageDraw.Draw(g)
    span = max(1, H - horizon)
    for y in range(horizon, H):
        t = (y - horizon) / span
        gd.line([(0, y), (W, y)], fill=rgba(dark, int(max_a * (t ** 1.3))))
    img.alpha_composite(g)


def scatter(d, base, n, palette, hmin, hmax, wmin, wmax, seed, with_runes=False, rune_col=None):
    used = []
    for i in range(n):
        x = int(10 + hsh(i, seed) * (W - 20))
        if abs(x - W // 2) < 18:  # central gap so the far flame shows through
            continue
        if any(abs(x - u) < wmin for u in used):
            continue
        used.append(x)
        # bias toward shorter, with a few that loom massive
        h = int(hmin + (hsh(i, seed + 1) ** 1.7) * (hmax - hmin))
        w = int(wmin + hsh(i, seed + 2) * (wmax - wmin))
        col = palette[i % len(palette)]
        kind = hsh(i, seed + 3)
        if kind < 0.34:
            tombstone(d, x, base, h, w, col)
        elif kind < 0.6:
            obelisk(d, x, base, h, max(4, w - 2), col)
        elif kind < 0.85:
            vault(d, x, base, h, w + 2, col)
        else:
            crossgrave(d, x, base, h, w, col)
        if with_runes and h > 44 and rune_col is not None:
            runes(d, x - w / 2 + 2, base - h * 0.6, x + w / 2 - 2, base - 6, rune_col, seed + i)


def far_layer():
    img = new(W, H)
    base = int(H * 0.72)
    pal = [lerp(BG_MID, (46, 50, 82), 0.5), lerp(BG_MID, (34, 36, 62), 0.6)]
    d = ImageDraw.Draw(img)
    scatter(d, base, 28, pal, 24, 236, 6, 16, seed=11)  # tiny → immense
    img = img.filter(ImageFilter.GaussianBlur(1.1))  # distance haze softens silhouettes
    ground_fade(img, int(H * 0.56), BG_MID, 150)
    return img


def mid_layer():
    img = new(W, H)
    base = int(H * 0.85)
    pal = [lerp(BG_MID, STONE_LO, 0.85), lerp(BG_MID, STONE_LO, 0.65)]
    d = ImageDraw.Draw(img)
    scatter(d, base, 15, pal, 40, 178, 10, 26, seed=31, with_runes=True, rune_col=lerp(STONE_HI, GRACE, 0.22))
    ground_fade(img, int(H * 0.7), BG_DEEP, 175)
    return img


def near_layer():
    img = new(W, H)
    base = H
    col = (10, 9, 18)  # near-black foreground
    d = ImageDraw.Draw(img)
    for x in (36, 150, 360):
        h = 72 + int(hsh(x, 5) * 64)
        vault(d, x, base, h, 38, col)
        runes(d, x - 14, base - h * 0.6, x + 14, base - 14, lerp(STONE_LO, GRACE, 0.16), x)
    # low rubble strip along the very bottom
    for x in range(0, W, 7):
        hh = 4 + int(4 * (0.5 + 0.5 * math.sin(x * 0.3)))
        d.rectangle([x, base - hh, x + 6, base], fill=rgba(col))
    return img


def fog_layer():
    fw, fh = 256, 160
    img = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
    p = img.load()
    for y in range(fh):
        for x in range(fw):
            v = 0.0
            for fx, fy, amp in ((2, 1, 0.5), (3, 2, 0.3), (5, 3, 0.2)):
                v += amp * math.sin(2 * math.pi * fx * x / fw) * math.sin(2 * math.pi * fy * y / fh)
            v = max(0.0, v)
            a = int(min(60, v * 90))
            if a > 0:
                col = lerp(BG_MID, GRACE, 0.15)
                p[x, y] = rgba(col, a)
    return img.filter(ImageFilter.GaussianBlur(3))


def dot():
    s = 12
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    p = img.load()
    c = (s - 1) / 2
    for y in range(s):
        for x in range(s):
            dist = math.hypot(x - c, y - c) / c
            a = max(0.0, 1.0 - dist)
            p[x, y] = rgba(BLOOM, int((a ** 1.6) * 255))
    return img


def build():
    save(far_layer(), "backgrounds", "far.png")
    save(mid_layer(), "backgrounds", "mid.png")
    save(near_layer(), "backgrounds", "near.png")
    save(fog_layer(), "backgrounds", "fog.png")
    save(dot(), "sprites", "dot.png")


if __name__ == "__main__":
    build()
