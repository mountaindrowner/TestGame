"""Pack the Impulse Runner sprite sheet from PixelLab-generated frames.

Like the player, the enemy is AI-authored pixel art — PixelLab character
"Impulse Runner" (5a730e59): a low shadow-imp with red eyes and a molten ember
core. Source frames live in `art_src/enemy/<anim>/frame_*.png` (committed).

Source frames are 48x48 with the figure centred and feet at row ~43; we crop the
bottom padding to 48x44 so the feet sit on the frame's bottom edge (origin 0.5,1).

Strip layout (48x44 each), order MUST match src/data/Animations.ts:
  run 0-4 | windup 5-9 | hurt 10-15      (16 frames)
"""
from __future__ import annotations
import os
from PIL import Image

HERE = os.path.dirname(__file__)
SRC = os.path.join(HERE, "..", "art_src", "enemy")
OUT = os.path.join(HERE, "..", "public", "assets", "sprites", "runner.png")

FW, FH = 48, 44
CROP_BOTTOM = 4

ORDER = [
    ("run", 5),
    ("windup", 5),
    ("hurt", 6),
]


def _frames(anim: str) -> list[Image.Image]:
    d = os.path.join(SRC, anim)
    out = []
    for f in sorted(x for x in os.listdir(d) if x.endswith(".png")):
        im = Image.open(os.path.join(d, f)).convert("RGBA")
        if im.size != (48, 48):
            raise SystemExit(f"{anim}/{f}: expected 48x48, got {im.size}")
        out.append(im.crop((0, 0, FW, 48 - CROP_BOTTOM)))
    return out


def build() -> None:
    strips: list[Image.Image] = []
    idx = 0
    for anim, expected in ORDER:
        fr = _frames(anim)
        if len(fr) != expected:
            raise SystemExit(f"{anim}: expected {expected} frames, found {len(fr)}")
        print(f"  {anim:7s} {idx:2d}-{idx + len(fr) - 1:<2d} ({len(fr)} frames)")
        strips.extend(fr)
        idx += len(fr)

    sheet = Image.new("RGBA", (FW * len(strips), FH), (0, 0, 0, 0))
    for i, im in enumerate(strips):
        sheet.paste(im, (i * FW, 0))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    sheet.save(OUT)
    print(f"  -> {os.path.relpath(OUT, os.path.join(HERE, '..'))}  "
          f"({sheet.width}x{sheet.height}, {len(strips)} frames @ {FW}x{FH})")


if __name__ == "__main__":
    build()
