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

ORDER = ["idle", "run", "jump", "runjump", "fall", "dash", "hurt", "attack1", "attack2", "attack3", "death", "rest", "weary", "climb"]


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
        # v3 animations ship a shared neutral "reference" as frame_000 (identical
        # across every clip) — drop it so looping clips don't hitch on a stray
        # standing frame and one-shots start on real motion.
        frames = by[r][1:] if len(by[r]) > 1 else by[r]
        for im in frames:
            strips.append(im.crop((x0, y0, x1, y1)))
        n = len(frames)
        layout.append((r, idx, idx + n - 1))
        idx += n
    # Lay the frames out as a GRID, not one long strip: a single-row sheet of the
    # HD frames is ~10.8k px wide, past the GL_MAX_TEXTURE_SIZE on many mobile GPUs
    # (commonly 4096) and the headless renderer — the texture silently fails to
    # upload and the sprite renders as a black quad. Wrapping keeps both dimensions
    # well under 4096. Phaser numbers spritesheet frames row-major (left→right,
    # top→bottom), so the global frame indices — and thus PlayerAnims ranges — are
    # identical to the single-row layout.
    import math
    cols = max(1, 4000 // fw)  # 40 cols at fw=98 -> sheet width 3920 (<4096)
    rows = math.ceil(len(strips) / cols)
    sheet = Image.new("RGBA", (fw * cols, fh * rows), (0, 0, 0, 0))
    for i, im in enumerate(strips):
        sheet.paste(im, ((i % cols) * fw, (i // cols) * fh))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    sheet.save(OUT)
    print(f"  player   frame {fw}x{fh}, {len(strips)} frames, grid {cols}x{rows} "
          f"(sheet {fw*cols}x{fh*rows})  [" + " | ".join(f"{r} {a}-{b}" for r, a, b in layout) + "]")


if __name__ == "__main__":
    build()
