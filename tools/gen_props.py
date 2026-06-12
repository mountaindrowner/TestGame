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
    """An OSSUARY JAR — dark carved stone with a faint grace-rune band, not bright
    clay. It belongs to the catacombs: ash inside, the dead remembered."""
    w, h = 14, 18
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    stone = (58, 56, 70)
    stone_hi = (92, 92, 110)
    stone_lo = (36, 35, 46)
    rune = (96, 190, 215)
    # body (rounded), neck, lip
    d.ellipse([1, 5, w - 2, h - 1], fill=stone)
    d.rectangle([4, 2, w - 5, 6], fill=stone)         # neck
    d.rectangle([3, 1, w - 4, 3], fill=stone_hi)      # lip
    # shading
    d.line([(3, 8), (3, h - 4)], fill=stone_hi)       # lit left
    d.line([(w - 4, 9), (w - 4, h - 3)], fill=stone_lo)  # shaded right
    d.line([(2, 12), (w - 3, 12)], fill=stone_lo)     # band shadow
    # the rune band — three faint grace marks circling the shoulder
    for x, ch in [(4, 0), (7, 1), (10, 0)]:
        d.point((x, 9), fill=rune + (170,))
        d.point((x, 10), fill=rune + (90,))
        if ch:
            d.point((x + 1, 9), fill=rune + (110,))
    # chipped lip + a hairline crack (it's old)
    d.point((w - 5, 1), fill=(0, 0, 0, 0))
    d.line([(9, 13), (11, 16)], fill=stone_lo)
    _save(im, "urn.png")


def torch():
    """A real WALL TORCH (12x26, 4-frame strip): iron sconce + wood shaft + a
    layered living flame. The engine animates the strip + adds the light halo;
    this finally makes the lights read as OBJECTS, not floating dots."""
    fw, fh, frames = 12, 26, 4
    im = Image.new("RGBA", (fw * frames, fh), (0, 0, 0, 0))
    iron = (62, 64, 74)
    iron_hi = (108, 112, 126)
    wood = (84, 62, 42)
    wood_hi = (118, 90, 62)
    fl_core = (255, 236, 160)
    fl_mid = (255, 160, 60)
    fl_out = (200, 72, 24)
    for f in range(frames):
        fr = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
        d = ImageDraw.Draw(fr)
        cx = fw // 2
        # shaft + binding + sconce cup
        d.line([(cx, 12), (cx, 24)], fill=wood, width=2)
        d.line([(cx - 1, 13), (cx - 1, 23)], fill=wood_hi)
        d.rectangle([cx - 2, 20, cx + 1, 21], fill=iron)      # wall band
        d.rectangle([cx - 3, 10, cx + 2, 12], fill=iron)      # cup
        d.line([(cx - 3, 10), (cx + 2, 10)], fill=iron_hi)
        # layered flame — shape shifts per frame (lick left/right, taller/shorter)
        sway = [-1, 0, 1, 0][f]
        tall = [0, 1, 0, -1][f]
        d.polygon([(cx - 3, 10), (cx + sway, 2 - tall), (cx + 3, 10)], fill=fl_out + (235,))
        d.polygon([(cx - 2, 10), (cx + sway, 4 - tall), (cx + 2, 10)], fill=fl_mid + (255,))
        d.polygon([(cx - 1, 10), (cx + sway, 6 - tall), (cx + 1, 10)], fill=fl_core + (255,))
        d.point((cx + sway, 1 - tall), fill=fl_mid + (160,))  # a spark licking off
        im.alpha_composite(fr, (f * fw, 0))
    _save(im, "torch.png")


def gavel():
    """The Court's VERDICT-CRUSHER (26x22): a massive square stone gavel-head on a
    short iron shaft — hangs from the ceiling, telegraphs, slams. Carved scales of
    judgment on its face so it reads as a JUDGMENT, not a generic crusher."""
    w, h = 26, 22
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    stone = (74, 72, 88)
    stone_hi = (112, 110, 130)
    stone_lo = (44, 42, 56)
    iron = (58, 60, 70)
    # the shaft into the ceiling
    d.rectangle([11, 0, 14, 5], fill=iron)
    d.line([(11, 0), (11, 5)], fill=(96, 100, 112))
    # the head — a heavy block with a beveled face
    d.rounded_rectangle([1, 5, w - 2, h - 1], radius=2, fill=stone)
    d.line([(2, 6), (w - 3, 6)], fill=stone_hi)        # top bevel
    d.line([(2, 7), (2, h - 3)], fill=stone_hi)        # lit left
    d.line([(w - 3, 8), (w - 3, h - 2)], fill=stone_lo)  # shaded right
    d.rectangle([1, h - 3, w - 2, h - 1], fill=stone_lo)  # striking face
    # carved scales of judgment
    cx = w // 2
    d.line([(cx, 9), (cx, 13)], fill=stone_lo)
    d.line([(cx - 5, 10), (cx + 5, 10)], fill=stone_lo)
    d.arc([cx - 7, 11, cx - 3, 14], 0, 180, fill=stone_lo)
    d.arc([cx + 3, 11, cx + 7, 14], 0, 180, fill=stone_lo)
    _save(im, "gavel.png")


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
    torch()
    gavel()
    critter()
    cobweb()


if __name__ == "__main__":
    build()
