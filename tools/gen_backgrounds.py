"""Generate atmospheric parallax layers + fog + a soft particle dot.

Outputs (all horizontally tileable so TileSprite scroll is seamless):
  backgrounds/far.png  480x270  distant cathedral spires, hazed + molten underglow
  backgrounds/mid.png  480x270  broken pillars / arches
  backgrounds/near.png 480x270  close columns framing the bottom (sparse)
  backgrounds/fog.png  256x160  soft drifting fog (tileable both axes)
  sprites/dot.png      12x12    soft round particle (motes / sparks / dash trail)
"""
from __future__ import annotations
import math
from PIL import Image, ImageDraw, ImageFilter
from common import (BG_DEEP, BG_MID, STONE, STONE_LO, STONE_HI, MOLTEN, MOLTEN_HI,
                    GRACE, BLOOM, new, save, rgba, lerp)

W, H = 480, 270


def vgrad(img, top, bottom):
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / (H - 1)
        d.line([(0, y), (W, y)], fill=rgba(lerp(top, bottom, t)))


def molten_underglow(img, intensity=1.0):
    """Soft warm glow rising from the bottom (the core below)."""
    glow = new(W, H)
    gp = glow.load()
    for y in range(H):
        t = max(0.0, (y - H * 0.62) / (H * 0.38))
        if t <= 0:
            continue
        a = int(90 * (t ** 2) * intensity)
        col = lerp(MOLTEN, MOLTEN_HI, t)
        for x in range(0, W, 1):
            # gentle horizontal undulation
            a2 = a * (0.7 + 0.3 * (0.5 + 0.5 * math.sin(x * 0.05 + y * 0.02)))
            gp[x, y] = rgba(col, int(min(120, a2)))
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(6)))


def spire(d, cx, base_y, top_y, half_w, color):
    """A cathedral spire: tapered tower + pointed cap + a cross/finial."""
    d.polygon(
        [(cx - half_w, base_y), (cx - half_w * 0.6, top_y + 6),
         (cx, top_y), (cx + half_w * 0.6, top_y + 6), (cx + half_w, base_y)],
        fill=rgba(color),
    )
    d.line([(cx, top_y), (cx, top_y - 5)], fill=rgba(color), width=1)
    d.line([(cx - 2, top_y - 3), (cx + 2, top_y - 3)], fill=rgba(color), width=1)


def far_layer():
    img = new(W, H)
    vgrad(img, BG_DEEP, BG_MID)
    molten_underglow(img, 0.7)
    d = ImageDraw.Draw(img)
    col = lerp(BG_MID, (44, 48, 78), 0.7)  # hazed, low contrast
    base = int(H * 0.78)
    # periodic spires (period 96 -> 5 across, tileable)
    for k in range(6):
        cx = k * 96 + 30
        hh = 60 + int(36 * (0.5 + 0.5 * math.sin(k * 1.7)))
        spire(d, cx, base, base - hh, 9, col)
        spire(d, cx + 48, base, base - (hh - 22), 6, lerp(col, BG_MID, 0.4))
    # haze band over the bases
    haze = new(W, H)
    hd = ImageDraw.Draw(haze)
    hd.rectangle([0, base - 24, W, base + 8], fill=rgba(BG_MID, 90))
    img.alpha_composite(haze.filter(ImageFilter.GaussianBlur(5)))
    return img


def mid_layer():
    img = new(W, H)
    d = ImageDraw.Draw(img)
    col = lerp(BG_MID, STONE_LO, 0.8)
    hi = lerp(col, GRACE, 0.12)
    base = int(H * 0.86)
    # broken pillars + arches, period 120 (4 across)
    for k in range(5):
        x = k * 120 + 24
        ph = 90 + int(28 * math.sin(k * 2.1))
        # pillar
        d.rectangle([x, base - ph, x + 14, base], fill=rgba(col))
        d.line([(x, base - ph), (x, base)], fill=rgba(hi))  # lit left edge
        # broken top
        d.polygon([(x - 2, base - ph), (x + 7, base - ph - 6), (x + 16, base - ph + 2)], fill=rgba(col))
        # an arch springing to the next pillar
        d.arc([x + 14, base - ph - 10, x + 120 - 24, base - ph + 60], 180, 360, fill=rgba(col), width=4)
    return img


def near_layer():
    img = new(W, H)
    d = ImageDraw.Draw(img)
    col = (12, 11, 22)  # near-black
    base = H
    # heavy broken columns framing the bottom corners (period 240 so sparse)
    for x in (10, 250):
        d.rectangle([x, base - 70, x + 26, base], fill=rgba(col))
        d.polygon([(x - 3, base - 70), (x + 13, base - 84), (x + 29, base - 66)], fill=rgba(col))
        d.line([(x, base - 70), (x, base)], fill=rgba(lerp(col, GRACE, 0.18)))
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
            # tileable value noise via sines (integer cycles)
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
