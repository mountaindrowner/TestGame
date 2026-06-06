"""Shared helpers for REPENTANCE procedural art.

Philosophy: dark silhouettes + neon grace accents. We draw near-black shapes,
then derive a rim light automatically from the alpha edge, and add bloom by
compositing a blurred copy of the bright pixels. Deterministic + palette-locked.
"""
from __future__ import annotations
import os
from PIL import Image, ImageDraw, ImageFilter

# --- Palette (matches src/data/palette.ts) --------------------------------
BG_DEEP = (10, 10, 18)
BG_MID = (18, 16, 31)
STONE = (42, 39, 64)
STONE_HI = (58, 53, 86)
STONE_LO = (24, 22, 40)
MOLTEN = (255, 90, 44)
MOLTEN_HI = (255, 157, 58)
GRACE = (126, 240, 255)
BLOOM = (234, 247, 255)
BODY = (12, 11, 22)      # near-black silhouette
RIM = GRACE
SHADOW = (5, 5, 10)

ASSET_ROOT = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "assets")


def ensure(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def rgba(c, a=255):
    return (c[0], c[1], c[2], a)


def new(w: int, h: int):
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def vhash(x, y, salt=0):
    """Parity with src/data/variation.ts vhash → float in [0,1). Position-seeded
    determinism is the prime art-variation rule (see docs/ART_VARIATION.md)."""
    n = (int(x) * 374761393 + int(y) * 668265263 + int(salt) * 2246822519) & 0xFFFFFFFF
    n = ((n ^ (n >> 13)) * 1274126177) & 0xFFFFFFFF
    return ((n ^ (n >> 16)) & 0xFFFFFFFF) / 4294967296


def add_rim_light(img: Image.Image, color=RIM, sides=("left", "top"), strength=255):
    """Tint the outer edge pixels (on the chosen sides) of an opaque silhouette.

    Reads the alpha channel; any opaque pixel whose neighbour on a chosen side is
    transparent becomes the rim colour. Cheap fake-lighting that reads as 'lit
    from the upper-left' and makes any silhouette pop.
    """
    px = img.load()
    w, h = img.size
    edge = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    epx = edge.load()
    offs = []
    if "left" in sides:
        offs.append((-1, 0))
    if "right" in sides:
        offs.append((1, 0))
    if "top" in sides:
        offs.append((0, -1))
    if "bottom" in sides:
        offs.append((0, 1))
    for y in range(h):
        for x in range(w):
            if px[x, y][3] < 40:
                continue
            for dx, dy in offs:
                nx, ny = x + dx, y + dy
                if nx < 0 or ny < 0 or nx >= w or ny >= h or px[nx, ny][3] < 40:
                    epx[x, y] = rgba(color, strength)
                    break
    img.alpha_composite(edge)


def bloom(img: Image.Image, threshold=150, radius=2.2, gain=1.0):
    """Return a soft glow layer from the brightest pixels of img."""
    w, h = img.size
    src = img.load()
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gp = glow.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = src[x, y]
            if a > 0 and (r + g + b) >= threshold * 3 // 2 and max(r, g, b) > threshold:
                gp[x, y] = (r, g, b, int(min(255, a * gain)))
    return glow.filter(ImageFilter.GaussianBlur(radius))


def apply_bloom(img: Image.Image, threshold=150, radius=2.2, gain=1.0):
    """Composite a bloom layer *under* the original so highlights glow."""
    g = bloom(img, threshold, radius, gain)
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.alpha_composite(g)
    out.alpha_composite(img)
    return out


def save(img: Image.Image, *parts: str) -> str:
    path = os.path.join(ASSET_ROOT, *parts)
    ensure(os.path.dirname(path))
    img.save(path)
    print(f"  wrote {os.path.relpath(path, ASSET_ROOT)}  ({img.width}x{img.height})")
    return path
