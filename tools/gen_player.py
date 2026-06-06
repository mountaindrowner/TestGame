"""Generate the player sprite sheet: a cloaked, rim-lit figure with a glowing
blade. Near-black silhouette + auto rim light + bloomed cyan blade.

Strip layout (24x32 each), order must match src/data/Animations.ts:
  idle 0-3 | run 4-9 | jump 10 | fall 11 | dash 12-13 | attack1 14-16 |
  attack2 17-19 | hurt 20      (21 frames)
"""
from __future__ import annotations
import math
from PIL import Image, ImageDraw
from common import BODY, GRACE, BLOOM, RIM, add_rim_light, apply_bloom, new, save, rgba

FW, FH = 24, 32
CX = 12          # center x
FEET = 31        # feet baseline


def cloak(d: ImageDraw.ImageDraw, lean: float, bob: float, hood_dx: float = 0.0):
    """Draw hood + flowing cloak silhouette. Returns the (hand_x, hand_y)."""
    top = 4 + bob
    # Hood: ellipse head + a slight peak
    hx = CX + hood_dx + lean * 0.6
    d.ellipse([hx - 3.5, top, hx + 3.5, top + 7], fill=rgba(BODY))
    d.polygon([(hx - 3.2, top + 3), (hx, top - 2.2), (hx + 3.2, top + 3)], fill=rgba(BODY))
    # Shoulders
    sy = top + 7
    sx = CX + lean
    # Cloak body: shoulders -> tattered hem near the feet
    hem = FEET - 1
    tat = [
        (sx - 5, sy + 1),
        (sx - 6.5, hem - 6),
        (sx - 7, hem),       # tatter
        (sx - 4.5, hem - 2),
        (sx - 2, hem),       # tatter
        (sx + 0.5, hem - 2),
        (sx + 3, hem),       # tatter
        (sx + 5.5, hem - 2),
        (sx + 7, hem),       # tatter
        (sx + 6.5, hem - 6),
        (sx + 5, sy + 1),
    ]
    d.polygon([(int(round(px)), int(round(py))) for px, py in tat], fill=rgba(BODY))
    return (sx + 4.5, sy + 4)  # sword hand near right shoulder


def legs(d: ImageDraw.ImageDraw, phase: float, spread: float = 1.0):
    """Two legs peeking below the hem, cycling for a run."""
    a = math.sin(phase)
    b = math.sin(phase + math.pi)
    y0 = FEET - 5
    for off, sw in ((-2.2, a), (2.2, b)):
        lx = CX + off + sw * 2.0 * spread
        d.line([(CX + off, y0), (lx, FEET)], fill=rgba(BODY), width=2)


def blade(img: Image.Image, hand, ang_deg: float, length: float = 12.0, glow=True):
    """A glowing cyan blade from the hand at the given angle (0 = forward/right)."""
    d = ImageDraw.Draw(img)
    a = math.radians(ang_deg)
    hx, hy = hand
    tx, ty = hx + math.cos(a) * length, hy + math.sin(a) * length
    # hilt (dark)
    d.line([(hx - math.cos(a) * 2, hy - math.sin(a) * 2), (hx, hy)], fill=rgba(BODY), width=3)
    # blade core + edge
    d.line([(hx, hy), (tx, ty)], fill=rgba(GRACE), width=2)
    d.line([(hx, hy), (tx, ty)], fill=rgba(BLOOM), width=1)
    d.ellipse([tx - 1.2, ty - 1.2, tx + 1.2, ty + 1.2], fill=rgba(BLOOM))


def slash(img: Image.Image, hand, a0: float, a1: float, radius: float = 13.0):
    """A bright crescent arc for an attack swing."""
    d = ImageDraw.Draw(img)
    hx, hy = hand
    box = [hx - radius, hy - radius, hx + radius, hy + radius]
    d.arc(box, a0, a1, fill=rgba(GRACE), width=2)
    d.arc([hx - radius + 1, hy - radius + 1, hx + radius - 1, hy + radius - 1], a0, a1, fill=rgba(BLOOM), width=1)
    # leading tip spark
    a = math.radians(a1)
    tx, ty = hx + math.cos(a) * radius, hy + math.sin(a) * radius
    d.ellipse([tx - 1.6, ty - 1.6, tx + 1.6, ty + 1.6], fill=rgba(BLOOM))


def frame(kind: str, i: int) -> Image.Image:
    img = new(FW, FH)
    d = ImageDraw.Draw(img)
    if kind == "idle":
        bob = [0, 0.6, 1.0, 0.6][i]
        hand = cloak(d, lean=0, bob=bob)
        legs(d, 0, spread=0.0)
        add_rim_light(img)
        blade(img, hand, ang_deg=70 - bob * 4, length=11)  # held low, point down-forward
    elif kind == "run":
        ph = i / 6 * math.tau
        lean = 1.6 + math.sin(ph) * 0.4
        bob = (abs(math.sin(ph)) * 1.2)
        hand = cloak(d, lean=lean, bob=-bob)
        legs(d, ph)
        add_rim_light(img)
        blade(img, hand, ang_deg=40 + math.sin(ph) * 12, length=11)
    elif kind == "jump":
        hand = cloak(d, lean=1.2, bob=-1)
        legs(d, math.pi * 0.5, spread=0.4)
        add_rim_light(img)
        blade(img, hand, ang_deg=-30, length=12)  # blade up
    elif kind == "fall":
        hand = cloak(d, lean=0.6, bob=0.5)
        legs(d, -math.pi * 0.5, spread=0.7)
        add_rim_light(img)
        blade(img, hand, ang_deg=55, length=12)
    elif kind == "dash":
        # near-horizontal streak pose, blade trailing back
        lean = 3.2 + i * 0.6
        hand = cloak(d, lean=lean, bob=1.2)
        legs(d, math.pi * (0.5 + i), spread=1.4)
        add_rim_light(img, sides=("left", "top", "bottom"))
        blade(img, hand, ang_deg=150, length=13)  # trailing
        # motion streaks
        dd = ImageDraw.Draw(img)
        for yy in (12, 17, 22):
            dd.line([(2 + i * 2, yy), (8 + i * 2, yy)], fill=rgba(GRACE, 120), width=1)
    elif kind == "attack1":
        lean = 1.0 + i * 0.5
        hand = cloak(d, lean=lean, bob=0)
        legs(d, 0, spread=0.2)
        add_rim_light(img)
        if i == 0:
            blade(img, hand, ang_deg=-110, length=12)        # wind up (raised back)
        elif i == 1:
            slash(img, hand, a0=-80, a1=40, radius=13)        # swing across
        else:
            blade(img, hand, ang_deg=55, length=12)           # follow-through (down-forward)
    elif kind == "attack2":
        lean = 1.4 + i * 0.4
        hand = cloak(d, lean=lean, bob=0.4)
        legs(d, 0, spread=0.3)
        add_rim_light(img)
        if i == 0:
            blade(img, hand, ang_deg=120, length=12)          # wind up low-back
        elif i == 1:
            slash(img, hand, a0=60, a1=-70, radius=14)         # rising swing
        else:
            blade(img, hand, ang_deg=-20, length=13)          # up-forward
    elif kind == "hurt":
        hand = cloak(d, lean=-2.0, bob=1.5)
        legs(d, math.pi, spread=0.6)
        add_rim_light(img, sides=("right", "top"))
        blade(img, hand, ang_deg=80, length=10)
    return apply_bloom(img, threshold=140, radius=2.0, gain=1.1)


def build():
    seq = (
        [("idle", i) for i in range(4)]
        + [("run", i) for i in range(6)]
        + [("jump", 0), ("fall", 0)]
        + [("dash", i) for i in range(2)]
        + [("attack1", i) for i in range(3)]
        + [("attack2", i) for i in range(3)]
        + [("hurt", 0)]
    )
    sheet = new(FW * len(seq), FH)
    for idx, (kind, i) in enumerate(seq):
        sheet.alpha_composite(frame(kind, i), (idx * FW, 0))
    save(sheet, "sprites", "player.png")
    print(f"  player frames: {len(seq)}  (idle4 run6 jump1 fall1 dash2 atk1x3 atk2x3 hurt1)")


if __name__ == "__main__":
    build()
