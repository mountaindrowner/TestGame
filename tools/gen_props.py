"""Generate small gameplay PROP sprites: dropped currency (soul), a heal orb, and a
breakable urn. Neutral catacomb clay so they read in both biomes. Run via
`npm run assets`.

Outputs:
  sprites/props/soul.png  9x9    floating soul-gem (currency)
  sprites/props/heal.png  9x9    life orb
  sprites/props/urn.png   14x18  breakable urn
"""
from __future__ import annotations
import os
from PIL import Image, ImageDraw

OUT = os.path.join("public", "assets", "sprites", "props")


def _save(im: Image.Image, name: str) -> None:
    os.makedirs(OUT, exist_ok=True)
    im.save(os.path.join(OUT, name))
    print(f"  wrote sprites/props/{name}  ({im.width}x{im.height})")


def gem(core, edge, name):
    s = 9
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = s // 2
    # a faceted diamond
    d.polygon([(c, 0), (s - 1, c), (c, s - 1), (0, c)], fill=edge + (255,))
    d.polygon([(c, 2), (s - 3, c), (c, s - 3), (2, c)], fill=core + (255,))
    d.point((c, c - 1), fill=(255, 255, 255, 255))  # specular glint
    d.point((c - 1, c - 1), fill=(255, 255, 255, 220))
    _save(im, name)


def urn():
    w, h = 14, 18
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    clay = (120, 92, 70)
    clay_hi = (158, 126, 96)
    clay_lo = (78, 58, 44)
    # body (rounded), neck, lip
    d.ellipse([1, 5, w - 2, h - 1], fill=clay)
    d.rectangle([4, 2, w - 5, 6], fill=clay)         # neck
    d.rectangle([3, 1, w - 4, 3], fill=clay_hi)       # lip
    # shading
    d.line([(3, 8), (3, h - 4)], fill=clay_hi)        # lit left
    d.line([(w - 4, 9), (w - 4, h - 3)], fill=clay_lo)  # shaded right
    d.line([(2, 11), (w - 3, 11)], fill=clay_lo)      # banding
    _save(im, "urn.png")


def critter():
    """A tiny scuttling beetle (faces +x; engine flips for the other way)."""
    w, h = 8, 5
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    body = (38, 33, 52)
    body_hi = (62, 56, 82)
    d.ellipse([1, 1, 6, 3], fill=body)       # carapace
    d.point((3, 1), fill=body_hi)             # back glint
    d.point((6, 1), fill=(120, 200, 255))     # eye glint (cyan, catches the light)
    for lx in (2, 4, 5):                       # legs
        d.point((lx, 4), fill=body)
    d.point((7, 2), fill=body)                 # antenna nub
    im.save(os.path.join(OUT, "critter.png"))
    print(f"  wrote sprites/props/critter.png  ({w}x{h})  [scuttling critter]")


def cobweb():
    """A faint corner web (anchored at the top-left corner; engine flips for the
    right). Radial threads + a few connecting strands."""
    import math
    s = 26
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    col = (176, 200, 220, 70)
    hi = (210, 232, 245, 110)
    angs = [math.radians(a) for a in (8, 26, 45, 64, 82)]
    ends = [(math.cos(a) * (s - 2), math.sin(a) * (s - 2)) for a in angs]
    for ex, ey in ends:                       # radial spokes from the corner
        d.line([(0, 0), (ex, ey)], fill=col)
    for r in (0.34, 0.62, 0.9):               # connecting strands between spokes
        pts = [(ex * r, ey * r) for ex, ey in ends]
        d.line(pts, fill=hi if r < 0.5 else col)
    im.save(os.path.join(OUT, "cobweb.png"))
    print(f"  wrote sprites/props/cobweb.png  ({s}x{s})  [corner cobweb]")


def build() -> None:
    gem((120, 220, 255), (40, 120, 210), "soul.png")  # cold cyan currency
    gem((150, 255, 170), (40, 170, 90), "heal.png")   # green life orb
    urn()
    critter()
    cobweb()


if __name__ == "__main__":
    build()
