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


def build() -> None:
    gem((120, 220, 255), (40, 120, 210), "soul.png")  # cold cyan currency
    gem((150, 255, 170), (40, 170, 90), "heal.png")   # green life orb
    urn()
    critter()


if __name__ == "__main__":
    build()
