"""Generate the Impulse Runner sprite sheet — a low, fast shadow-form with a hot
glowing core (its weak point). Molten-red glow contrasts the player's cyan grace.

Strip (24x24), order matches src/data/Animations.ts:
  run 0-3 | windup 4-5 | hurt 6   (7 frames)
"""
from __future__ import annotations
import math
from PIL import Image, ImageDraw
from common import BODY, MOLTEN, MOLTEN_HI, BLOOM, add_rim_light, apply_bloom, new, save, rgba

FW, FH = 24, 24
CX = 12
FEET = 23


def body(d: ImageDraw.ImageDraw, lean: float, crouch: float, bob: float):
    """Hunched, forward-leaning teardrop shadow with spindly legs + back wisps."""
    cy = 13 + bob + crouch
    # main mass: leaning teardrop
    pts = [
        (CX - 6 + lean, cy + 2),
        (CX - 7 + lean, cy - 2),
        (CX - 3 + lean * 1.4, cy - 6 + crouch * 0.5),  # raised back hump
        (CX + 3 + lean * 1.6, cy - 5),
        (CX + 7 + lean, cy - 1),                       # snout/forward point
        (CX + 5 + lean, cy + 3),
    ]
    d.polygon([(int(round(x)), int(round(y))) for x, y in pts], fill=rgba(BODY))
    # trailing wisps (behind = left)
    for k, yy in enumerate((cy - 3, cy + 1)):
        x0 = CX - 6 + lean
        d.line([(x0, yy), (x0 - 4 - k, yy - 1 + k * 2)], fill=rgba(BODY), width=2)
    return (CX + 2 + lean, cy - 1)  # core position


def legs(d: ImageDraw.ImageDraw, phase: float):
    a = math.sin(phase)
    b = math.sin(phase + math.pi)
    for off, sw in ((-3, a), (1, b)):
        x = CX + off
        d.line([(x, FEET - 5), (x + sw * 3, FEET)], fill=rgba(BODY), width=2)
    # a forward claw leg
    d.line([(CX + 5, FEET - 5), (CX + 6 + b * 2, FEET)], fill=rgba(BODY), width=2)


def core(img: Image.Image, pos, intensity: float):
    d = ImageDraw.Draw(img)
    x, y = pos
    r = 2.2 + intensity * 1.6
    d.ellipse([x - r, y - r, x + r, y + r], fill=rgba(MOLTEN))
    d.ellipse([x - r * 0.5, y - r * 0.5, x + r * 0.5, y + r * 0.5], fill=rgba(MOLTEN_HI))
    d.point((int(x), int(y)), fill=rgba(BLOOM))
    # two faint eye-sparks
    d.point((int(x + 3), int(y - 1)), fill=rgba(MOLTEN_HI))


def frame(kind: str, i: int) -> Image.Image:
    img = new(FW, FH)
    d = ImageDraw.Draw(img)
    if kind == "run":
        ph = i / 4 * math.tau
        c = body(d, lean=1.6 + math.sin(ph) * 0.5, crouch=0, bob=-abs(math.sin(ph)))
        legs(d, ph)
        add_rim_light(img, sides=("top", "right"), strength=170)
        core(img, c, 0.4 + 0.3 * (math.sin(ph) * 0.5 + 0.5))
    elif kind == "windup":
        # i=0 coil back, i=1 lean forward ready to lunge
        lean = -1.5 if i == 0 else 2.6
        crouch = 1.5 if i == 0 else -0.5
        c = body(d, lean=lean, crouch=crouch, bob=0)
        legs(d, math.pi * 0.5)
        add_rim_light(img, sides=("top", "right"), strength=200)
        core(img, c, 0.9 if i == 1 else 0.6)
    else:  # hurt
        c = body(d, lean=-2.0, crouch=1.0, bob=1.2)
        legs(d, math.pi)
        add_rim_light(img, sides=("left", "top"), strength=255)
        core(img, c, 0.2)
    return apply_bloom(img, threshold=120, radius=2.2, gain=1.2)


def build():
    seq = (
        [("run", i) for i in range(4)]
        + [("windup", i) for i in range(2)]
        + [("hurt", 0)]
    )
    sheet = new(FW * len(seq), FH)
    for idx, (kind, i) in enumerate(seq):
        sheet.alpha_composite(frame(kind, i), (idx * FW, 0))
    save(sheet, "sprites", "runner.png")
    print(f"  runner frames: {len(seq)}  (run4 windup2 hurt1)")


if __name__ == "__main__":
    build()
