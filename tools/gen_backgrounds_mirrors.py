"""Generate the House of Mirrors (BIO-02) parallax layers + fog.

Reuses gen_backgrounds.py's depth-graded haze/placement, reskinned to Mark's
reference (art_src/ref/house_of_mirrors_vibe.png): lavender-purple brick frames on
near-black, with bright ELECTRIC-BLUE diagonal mirror-glass streaks, scattered blue
diamond SPARKLES, and a faint reflective floor band. Overrides live INSIDE build()
so importing never disturbs gen_backgrounds' depths palette. gen_all runs depths
first. Outputs: backgrounds/mirror-{far,mid,near,fog}.png
"""
from __future__ import annotations
import math
import gen_backgrounds as gb
from common import save, rgba, lerp


def _mirror_frame(d, cx, base, h, w, col):
    """Ornate arched mirror: lit lavender frame, dark glass, contained electric-blue streaks."""
    x0, x1 = int(cx - w / 2), int(cx + w / 2)
    top = int(base - h)
    body_top = top + max(3, w // 2)
    frame = lerp(col, gb.STONE, 0.45)                                           # lift the frame so it reads
    d.rectangle([x0, body_top, x1, int(base + 10)], fill=rgba(frame))           # frame body
    d.pieslice([x0, top, x1, top + w], 180, 360, fill=rgba(frame))               # arched head
    glass = lerp(gb.BG_DEEP, col, 0.20)                                          # dark reflective glass
    gx0, gx1 = x0 + 2, x1 - 2
    if gx1 > gx0:
        d.rectangle([gx0, body_top, gx1, int(base + 6)], fill=rgba(glass))
        d.pieslice([gx0, top + 2, gx1, top + w - 2], 180, 360, fill=rgba(glass))
        # diagonal sheen streaks CONTAINED within the glass (a framed mirror, not rain)
        streak = rgba(gb.GRACE)
        core = rgba(lerp(gb.GRACE, (255, 255, 255), 0.55))
        bw = gx1 - gx0
        for off in (0.22, 0.55):
            xt = gx0 + bw * off
            xb = min(gx1, xt + bw * 0.32)
            d.line([(xt, body_top + 2), (xb, base - 4)], fill=streak)
            d.line([(min(gx1, xt + 1), body_top + 2), (min(gx1, xb + 1), base - 4)], fill=core)
    gb._lit(d, x0, body_top, base, frame)


def _sparkles(img, seed, n, ytop, ybot):
    """Small bright-blue diamond glints scattered through the hall."""
    d = gb.ImageDraw.Draw(img)
    bright = rgba(lerp(gb.GRACE, (255, 255, 255), 0.35))
    soft = rgba(gb.GRACE, 150)
    for i in range(n):
        x = int(gb.hsh(i, seed) * gb.W)
        y = int(ytop + gb.hsh(i, seed + 1) * (ybot - ytop))
        d.point((x, y - 1), fill=soft); d.point((x, y + 1), fill=soft)
        d.point((x - 1, y), fill=soft); d.point((x + 1, y), fill=soft)
        d.point((x, y), fill=bright)


def _reflective_floor(img):
    """A faint glossy reflection band along the very bottom (the mirror floor)."""
    d = gb.ImageDraw.Draw(img)
    floor = gb.H - 7
    for x in range(gb.W):
        a = int(40 + 30 * (0.5 + 0.5 * math.sin(x * 0.20)))
        d.line([(x, floor), (x, gb.H)], fill=rgba(lerp(gb.BG_DEEP, gb.GRACE, 0.18), a))


def build() -> None:
    # Mirror palette (sampled from the reference) + shape swap, applied here.
    gb.BG_DEEP = (8, 6, 20)
    gb.BG_MID = (20, 16, 40)
    gb.STONE = (86, 62, 122)
    gb.STONE_LO = (50, 38, 82)
    gb.STONE_HI = (140, 116, 178)
    gb.MOLTEN = (212, 70, 182)
    gb.MOLTEN_HI = (255, 150, 236)
    gb.GRACE = (96, 156, 255)
    gb.BLOOM = (255, 255, 255)
    gb.tombstone = _mirror_frame
    gb.obelisk = lambda d, cx, base, h, w, col: _mirror_frame(d, cx, base, h, max(5, w - 2), col)
    gb.vault = _mirror_frame
    gb.crossgrave = _mirror_frame

    far = gb.far_layer()
    mid = gb.mid_layer()
    near = gb.near_layer()
    _sparkles(far, seed=61, n=22, ytop=20, ybot=int(gb.H * 0.55))
    _sparkles(mid, seed=71, n=20, ytop=30, ybot=int(gb.H * 0.7))
    _sparkles(near, seed=73, n=12, ytop=40, ybot=int(gb.H * 0.85))
    _reflective_floor(near)
    save(far, "backgrounds", "mirror-far.png")
    save(mid, "backgrounds", "mirror-mid.png")
    save(near, "backgrounds", "mirror-near.png")
    save(gb.fog_layer(), "backgrounds", "mirror-fog.png")
    print("  mirror backgrounds: far/mid/near + fog (electric-blue hall of mirrors)")


if __name__ == "__main__":
    build()
