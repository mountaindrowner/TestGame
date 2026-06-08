"""Generate the House of Mirrors (BIO-02) parallax layers + fog.

Reuses gen_backgrounds.py's depth-graded haze/placement, but reskins the palette
to violet/indigo and swaps the grave silhouettes for tall arched MIRROR FRAMES
(reflective glass interior + a silver sheen), so the backdrop reads as a receding
hall of mirrors rather than a necropolis.

NOTE: overrides live INSIDE build() (not at import) so importing never disturbs
gen_backgrounds' depths palette. gen_all runs the depths backgrounds first.
Run via `npm run assets`. Outputs: backgrounds/mirror-{far,mid,near,fog}.png
"""
from __future__ import annotations
import gen_backgrounds as gb
from common import save, rgba, lerp


def _mirror_frame(d, cx, base, h, w, col):
    """A tall arched mirror: frame, darker reflective glass, a silver sheen line."""
    x0, x1 = int(cx - w / 2), int(cx + w / 2)
    top = int(base - h)
    body_top = top + max(3, w // 2)
    d.rectangle([x0, body_top, x1, int(base + 10)], fill=rgba(col))            # frame body
    d.pieslice([x0, top, x1, top + w], 180, 360, fill=rgba(col))                # arched head
    glass = lerp(col, gb.BG_DEEP, 0.42)
    gx0, gx1 = x0 + 2, x1 - 2
    if gx1 > gx0:
        d.rectangle([gx0, body_top, gx1, int(base + 6)], fill=rgba(glass))      # reflective interior
        d.pieslice([gx0, top + 2, gx1, top + w - 2], 180, 360, fill=rgba(glass))
        d.line([(gx0 + 1, body_top + 2), (int(cx), int(base - 6))], fill=rgba(lerp(gb.STONE_HI, gb.GRACE, 0.5)))  # sheen
    gb._lit(d, x0, body_top, base, col)


def build() -> None:
    # Mirror palette + shape swap, applied here (not at import) so depths is safe.
    gb.BG_DEEP = (12, 10, 22)
    gb.BG_MID = (24, 20, 42)
    gb.STONE = (44, 38, 70)
    gb.STONE_LO = (26, 22, 44)
    gb.STONE_HI = (108, 100, 150)
    gb.MOLTEN = (196, 72, 184)
    gb.MOLTEN_HI = (255, 142, 236)
    gb.GRACE = (176, 208, 255)
    gb.BLOOM = (255, 255, 255)
    gb.tombstone = _mirror_frame
    gb.obelisk = lambda d, cx, base, h, w, col: _mirror_frame(d, cx, base, h, max(4, w - 2), col)
    gb.vault = _mirror_frame
    gb.crossgrave = _mirror_frame

    save(gb.far_layer(), "backgrounds", "mirror-far.png")
    save(gb.mid_layer(), "backgrounds", "mirror-mid.png")
    save(gb.near_layer(), "backgrounds", "mirror-near.png")
    save(gb.fog_layer(), "backgrounds", "mirror-fog.png")
    print("  mirror backgrounds: far/mid/near + fog (House of Mirrors)")


if __name__ == "__main__":
    build()
