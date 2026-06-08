"""Generate the House of Mirrors (BIO-02) parallax background: GIANT PANES OF
BROKEN MIRROR.

Replaces the earlier arched-mirror-hall backdrop. The world is now literally a
wall of enormous shattered mirror panes: dark reflective glass in lavender frames,
spiderweb fracture cracks lit electric-blue, and shards punched clean out
(transparent) so the cold glass-light behind bleeds through the breaks. Palette
continues the established look (lavender + electric-blue + near-black) so it reads
as the same world the depths ascends into.

Layers are full-screen TileSprites scrolled on BOTH axes (see ParallaxBackground),
so every PNG must tile seamlessly horizontally AND vertically — the pane grid puts
its frame mullions exactly on the x=0/W and y=0/H seams, and all cracks/shards stay
inside pane interiors.

Outputs: backgrounds/mirror-{far,mid,near,fog}.png
"""
from __future__ import annotations
import math
from PIL import Image, ImageDraw, ImageFilter
from common import new, save, rgba, lerp

W, H = 480, 270

VOID = (8, 6, 20)            # near-black behind the glass (mullion gaps / breaks)
GLASS_TOP = (58, 50, 92)     # cool reflective glass, lit toward the top
GLASS_BOT = (24, 19, 44)
FRAME = (126, 100, 170)      # lavender mirror frame / mullion
FRAME_HI = (174, 148, 208)
CRACK = (10, 8, 22)          # fracture shadow
LIT = (120, 178, 255)        # electric-blue lit crack edge
GLINT = (210, 232, 255)      # bright crack/impact glint
BLUE = (96, 156, 255)


def hsh(x, y=0, s=0):
    n = (int(x) * 374761393 + int(y) * 668265263 + int(s) * 2246822519) & 0xFFFFFFFF
    n = (n ^ (n >> 13)) * 1274126177 & 0xFFFFFFFF
    return ((n ^ (n >> 16)) & 0xFFFF) / 0xFFFF


def _ray_box(cx, cy, ang, x0, y0, x1, y1):
    """First hit of a ray from (cx,cy) at angle on the box edge."""
    dx, dy = math.cos(ang), math.sin(ang)
    ts = []
    if dx > 1e-6:
        ts.append((x1 - cx) / dx)
    elif dx < -1e-6:
        ts.append((x0 - cx) / dx)
    if dy > 1e-6:
        ts.append((y1 - cy) / dy)
    elif dy < -1e-6:
        ts.append((y0 - cy) / dy)
    t = min([t for t in ts if t > 0] or [0])
    return cx + dx * t, cy + dy * t


def _glass(d, x0, y0, x1, y1, dim=1.0):
    """Reflective glass: vertical gradient + a bright specular sweep so it reads as
    a mirror surface, not a black hole."""
    for y in range(y0, y1):
        t = (y - y0) / max(1, y1 - y0)
        col = lerp(lerp(GLASS_TOP, GLASS_BOT, t), VOID, 1 - dim)
        d.line([(x0, y), (x1, y)], fill=rgba(col))
    bw, bh = x1 - x0, y1 - y0
    # broad specular sweep (the mirror catching the cold light) — a few graded bands
    for k, a in enumerate((0.45, 0.28, 0.16)):
        off = 0.30 + k * 0.05
        xt = x0 + bw * off
        d.line([(xt, y0), (xt + bw * 0.55, y1)], fill=rgba(lerp(GLASS_TOP, BLUE, a * dim)), width=6 - k * 2)
    # faint secondary reflection
    xt = x0 + bw * 0.72
    d.line([(xt, y0), (xt + bw * 0.4, y1)], fill=rgba(lerp(GLASS_TOP, BLUE, 0.14 * dim)))


def _shatter(d, img, x0, y0, x1, y1, seed, dim=1.0, punch=True):
    """A spiderweb fracture from one impact: radial + concentric cracks, lit
    electric-blue, with a couple of shards punched out (transparent)."""
    cx = x0 + (x1 - x0) * (0.32 + 0.36 * hsh(seed, 1))
    cy = y0 + (y1 - y0) * (0.30 + 0.40 * hsh(seed, 2))
    n = 6 + int(hsh(seed, 3) * 3)   # fewer radials -> bigger broken shards
    crack = rgba(CRACK)
    lit = rgba(lerp(VOID, LIT, dim))
    bpts, ring = [], [[], []]
    rings = (0.46, 0.78)
    for i in range(n):
        ang = (i / n) * 2 * math.pi + (hsh(seed, i, 4) - 0.5) * 0.55
        ex, ey = _ray_box(cx, cy, ang, x0 + 1, y0 + 1, x1 - 1, y1 - 1)
        d.line([(cx, cy), (ex, ey)], fill=crack)
        d.line([(cx, cy - 1), (ex, ey - 1)], fill=lit)  # lit edge just above the crack
        bpts.append((ex, ey))
        for ri, rf in enumerate(rings):
            j = 0.82 + 0.34 * hsh(seed, i * 7 + ri, 5)
            ring[ri].append((cx + (ex - cx) * rf * j, cy + (ey - cy) * rf * j))
    for rp in ring:                                   # concentric web rings
        d.line(rp + [rp[0]], fill=crack)
        d.line([(p[0], p[1] - 1) for p in rp] + [(rp[0][0], rp[0][1] - 1)], fill=lit)
    # punch a couple of outer wedges clean out -> light bleeds through the breaks
    if punch:
        for k in range(2):
            i = int(hsh(seed, k, 6) * n)
            poly = [ring[1][i], bpts[i], bpts[(i + 1) % n], ring[1][(i + 1) % n]]
            d.polygon(poly, fill=(0, 0, 0, 0))
            d.line([poly[0], poly[1]], fill=lit)       # lit broken edge
            d.line([poly[3], poly[2]], fill=lit)
    d.point((cx, cy), fill=rgba(GLINT))               # impact spark
    d.point((cx + 1, cy), fill=rgba(LIT))


def _frame_border(d, x0, y0, x1, y1):
    """Lavender mirror frame around a pane (lit on top/left)."""
    d.rectangle([x0, y0, x1, y1], outline=rgba(FRAME), width=2)
    d.line([(x0 + 1, y0 + 1), (x1 - 1, y0 + 1)], fill=rgba(FRAME_HI))
    d.line([(x0 + 1, y0 + 1), (x0 + 1, y1 - 1)], fill=rgba(FRAME_HI))


def _pane(d, img, x0, y0, x1, y1, seed, dim=1.0, punch=True):
    _glass(d, x0, y0, x1, y1, dim)
    _shatter(d, img, x0, y0, x1, y1, seed, dim, punch)
    _frame_border(d, x0, y0, x1, y1)


def _grid_wall(cols, rows, seed, dim=1.0):
    """A seamless wall of giant broken panes; frame mullions sit on the seams."""
    img = Image.new("RGBA", (W, H), rgba(VOID))
    d = ImageDraw.Draw(img)
    cw, ch = W / cols, H / rows
    m = 3  # half the mullion gap between panes (the seam falls in this gap)
    for r in range(rows):
        for c in range(cols):
            x0, x1 = int(c * cw) + m, int((c + 1) * cw) - m
            y0, y1 = int(r * ch) + m, int((r + 1) * ch) - m
            _pane(d, img, x0, y0, x1, y1, seed + r * 17 + c * 3, dim)
    return img


def _sparkles(img, seed, n, lo, hi):
    d = ImageDraw.Draw(img)
    bright = rgba(GLINT)
    soft = rgba(BLUE, 150)
    for i in range(n):
        x = 6 + int(hsh(i, seed) * (W - 12))
        y = int(lo + hsh(i, seed + 1) * (hi - lo))
        d.point((x, y - 1), fill=soft); d.point((x, y + 1), fill=soft)
        d.point((x - 1, y), fill=soft); d.point((x + 1, y), fill=soft)
        d.point((x, y), fill=bright)


def far_layer():
    """The dominant backdrop: two giant tall panes, hazed and dimmed by distance."""
    img = _grid_wall(2, 1, seed=11, dim=0.92)
    img = img.filter(ImageFilter.GaussianBlur(0.4))
    return img


def mid_layer():
    """Parallax life only — bright drifting reflection shafts + sparkles, mostly
    transparent so the giant far panes stay legible (no second grid)."""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for i in range(5):                       # cold light shafts raking the glass
        x = int(hsh(i, 91) * W)
        d.line([(x, 0), (x + 70, H)], fill=rgba(lerp(VOID, BLUE, 0.22), 90), width=2)
        d.line([(x + 1, 0), (x + 71, H)], fill=rgba(BLUE, 60))
    _sparkles(img, seed=71, n=16, lo=24, hi=H - 30)
    return img


def near_layer():
    """Foreground: a huge dark shard jutting from each lower corner (they meet at
    the x-seam to tile), a hard diagonal crack, the reflective floor band."""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    glass = rgba(lerp(GLASS_BOT, VOID, 0.3))
    # corner shards (left + right halves share the seam -> seamless wrap)
    d.polygon([(0, H), (0, H - 150), (96, H), ], fill=glass)
    d.polygon([(W, H), (W, H - 124), (W - 84, H)], fill=glass)
    for poly in (((0, H - 150), (96, H)), ((W, H - 124), (W - 84, H))):
        d.line([poly[0], poly[1]], fill=rgba(LIT))           # lit shard edge
    # a hard fracture across the foreground
    d.line([(150, H), (300, H - 200)], fill=rgba(CRACK))
    d.line([(151, H), (301, H - 200)], fill=rgba(lerp(VOID, LIT, 0.9)))
    # reflective floor band
    floor = H - 7
    for x in range(W):
        a = int(38 + 30 * (0.5 + 0.5 * math.sin(x * 0.20)))
        d.line([(x, floor), (x, H)], fill=rgba(lerp(VOID, BLUE, 0.16), a))
    _sparkles(img, seed=73, n=9, lo=40, hi=H - 40)
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
            a = int(min(58, v * 90))
            if a > 0:
                p[x, y] = rgba(lerp(VOID, BLUE, 0.4), a)
    return img.filter(ImageFilter.GaussianBlur(3))


def build() -> None:
    save(far_layer(), "backgrounds", "mirror-far.png")
    save(mid_layer(), "backgrounds", "mirror-mid.png")
    save(near_layer(), "backgrounds", "mirror-near.png")
    save(fog_layer(), "backgrounds", "mirror-fog.png")
    print("  mirror backgrounds: giant broken-mirror panes (far wall + mid panes + foreground shards)")


if __name__ == "__main__":
    build()
