"""Pack the player sprite sheet from PixelLab-generated frames.

The player ("Hollow Revenant") is AI-authored pixel art (PixelLab character
d6e11e94), unlike the procedural enemy/tileset/decor. Source frames live in
`art_src/player/<anim>/frame_*.png` (committed, so the build needs no API).

Each source frame is 48x48 with the figure horizontally centred and the feet
resting at row ~44 (≈4px of empty padding below). We crop that bottom padding
so the feet sit on the frame's bottom edge — preserving the engine's
bottom-centre feet-anchor convention (origin 0.5,1).

Strip layout (48x44 each), order MUST match src/data/Animations.ts:
  idle 0-3 | run 4-9 | jump 10-18 | fall 19-23 | attack 24-30 |
  hurt 31-36 | death 37-43      (44 frames)
"""
from __future__ import annotations
import os
from PIL import Image

HERE = os.path.dirname(__file__)
SRC = os.path.join(HERE, "..", "art_src", "player")
OUT = os.path.join(HERE, "..", "public", "assets", "sprites", "player.png")

FW, FH = 48, 44          # packed frame size (source 48x48, bottom 4px cropped)
CROP_BOTTOM = 4          # rows of empty padding removed beneath the feet

# (anim, expected_frame_count) in strip order — the frame-order contract.
ORDER = [
    ("idle", 4),
    ("run", 6),
    ("jump", 9),
    ("fall", 5),
    ("attack", 7),
    ("hurt", 6),
    ("death", 7),
]


def _frames(anim: str) -> list[Image.Image]:
    d = os.path.join(SRC, anim)
    files = sorted(f for f in os.listdir(d) if f.endswith(".png"))
    out = []
    for f in files:
        im = Image.open(os.path.join(d, f)).convert("RGBA")
        if im.size != (48, 48):
            raise SystemExit(f"{anim}/{f}: expected 48x48, got {im.size}")
        out.append(im.crop((0, 0, FW, 48 - CROP_BOTTOM)))  # -> 48x44
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
