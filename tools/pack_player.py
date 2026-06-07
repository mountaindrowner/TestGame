"""Pack the player sprite sheet from PixelLab frames in art_src/player/<role>/.

The player ("Hollow Revenant HD", 64px source) is AI-authored pixel art. Frames
come on a big varied canvas, so — like the enemy family — we crop every frame to
the union non-transparent bounding box across all the player's frames: a tight,
feet-anchored (origin 0.5,1) sheet. Prints frame size + strip layout; keep those
in lockstep with src/data/Animations.ts PlayerAnims. Run via `npm run assets`.
"""
from __future__ import annotations
import glob
import os
from PIL import Image

HERE = os.path.dirname(__file__)
SRC = os.path.join(HERE, "..", "art_src", "player")
OUT = os.path.join(HERE, "..", "public", "assets", "sprites", "player.png")

ORDER = ["idle", "run", "jump", "runjump", "fall", "dash", "hurt", "attack1", "attack2", "attack3", "death", "rest", "weary"]


def _frames(role: str) -> list[Image.Image]:
    return [Image.open(f).convert("RGBA") for f in sorted(glob.glob(os.path.join(SRC, role, "*.png")))]


def build() -> None:
    by = {r: _frames(r) for r in ORDER}
    missing = [r for r in ORDER if not by[r]]
    if missing:
        raise SystemExit(f"player: missing frames for {missing} (run tools/fetch_enemy_art.py)")
    box = None
    for im in (im for r in ORDER for im in by[r]):
        b = im.getchannel("A").getbbox()
        if b is None:
            continue
        box = list(b) if box is None else [
            min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3])
        ]
    x0, y0, x1, y1 = box  # type: ignore[misc]
    fw, fh = x1 - x0, y1 - y0
    strips: list[Image.Image] = []
    layout: list[tuple[str, int, int]] = []
    idx = 0
    for r in ORDER:
        for im in by[r]:
            strips.append(im.crop((x0, y0, x1, y1)))
        n = len(by[r])
        layout.append((r, idx, idx + n - 1))
        idx += n
    sheet = Image.new("RGBA", (fw * len(strips), fh), (0, 0, 0, 0))
    for i, im in enumerate(strips):
        sheet.paste(im, (i * fw, 0))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    sheet.save(OUT)
    print(f"  player   {fw}x{fh}, {len(strips)} frames  [" + " | ".join(f"{r} {a}-{b}" for r, a, b in layout) + "]")


if __name__ == "__main__":
    build()
