"""Pack enemy sprite sheets from PixelLab frames in art_src/<kind>/<role>/.

The Impulse Runner keeps its original 48x48->48x44 crop. The newer family
(crawler/spark/striker/warden) come on bigger, varied canvases (56/68/92), so we
crop every frame to the UNION non-transparent bounding box across all that
enemy's frames — a tight, consistently-aligned, feet-at-bottom sheet (origin
0.5,1). Each enemy prints its frame size + strip layout; keep those in lockstep
with src/data/Animations.ts. Run via `npm run assets`.
"""
from __future__ import annotations
import glob
import os
from PIL import Image

HERE = os.path.dirname(__file__)
SRC = os.path.join(HERE, "..", "art_src")
OUT = os.path.join(HERE, "..", "public", "assets", "sprites")


def _frames(kind: str, role: str) -> list[Image.Image]:
    d = os.path.join(SRC, kind, role)
    return [Image.open(f).convert("RGBA") for f in sorted(glob.glob(os.path.join(d, "*.png")))]


def _save(kind: str, strips: list[Image.Image], fw: int, fh: int, layout: list[tuple[str, int, int]]) -> None:
    sheet = Image.new("RGBA", (fw * len(strips), fh), (0, 0, 0, 0))
    for i, im in enumerate(strips):
        sheet.paste(im, (i * fw, 0))
    os.makedirs(OUT, exist_ok=True)
    sheet.save(os.path.join(OUT, f"{kind}.png"))
    desc = " | ".join(f"{r} {a}-{b}" for r, a, b in layout)
    print(f"  {kind:8s} {fw}x{fh}, {len(strips)} frames  [{desc}]")


def pack_runner() -> None:
    """Original Impulse Runner: 48x48 source, crop 4px bottom -> 48x44."""
    fw, fh, crop_b = 48, 44, 4
    order = [("run", 5), ("windup", 5), ("hurt", 6)]
    strips: list[Image.Image] = []
    layout: list[tuple[str, int, int]] = []
    idx = 0
    for role, expected in order:
        fr = _frames("enemy", role)
        if len(fr) != expected:
            raise SystemExit(f"runner {role}: expected {expected}, found {len(fr)}")
        for im in fr:
            if im.size != (48, 48):
                raise SystemExit(f"runner {role}: expected 48x48, got {im.size}")
            strips.append(im.crop((0, 0, fw, 48 - crop_b)))
        layout.append((role, idx, idx + len(fr) - 1))
        idx += len(fr)
    _save("runner", strips, fw, fh, layout)


def _union_alpha_bbox(frames: list[Image.Image]) -> tuple[int, int, int, int]:
    box = None
    for im in frames:
        b = im.getchannel("A").getbbox()  # tight box of visible pixels
        if b is None:
            continue
        box = list(b) if box is None else [
            min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3])
        ]
    if box is None:
        raise SystemExit("empty frames")
    return tuple(box)  # type: ignore[return-value]


def pack_bbox(kind: str, order: list[str]) -> None:
    """Crop every frame to the shared visible bbox -> uniform, feet-anchored sheet."""
    frames_by_role = {r: _frames(kind, r) for r in order}
    missing = [r for r in order if not frames_by_role[r]]
    if missing:
        raise SystemExit(f"{kind}: missing frames for {missing} (run fetch_enemy_art.py)")
    flat = [im for r in order for im in frames_by_role[r]]
    x0, y0, x1, y1 = _union_alpha_bbox(flat)
    fw, fh = x1 - x0, y1 - y0
    strips: list[Image.Image] = []
    layout: list[tuple[str, int, int]] = []
    idx = 0
    for role in order:
        for im in frames_by_role[role]:
            strips.append(im.crop((x0, y0, x1, y1)))
        n = len(frames_by_role[role])
        layout.append((role, idx, idx + n - 1))
        idx += n
    _save(kind, strips, fw, fh, layout)


def build() -> None:
    pack_runner()
    pack_bbox("crawler", ["run", "hurt"])
    pack_bbox("spark", ["run", "windup", "hurt"])
    pack_bbox("striker", ["run", "windup", "strike", "hurt"])
    pack_bbox("warden", ["run", "windup", "strike", "recovery", "hurt", "idle", "taunt", "slam", "death"])
    # BIO-02 House of Mirrors roster (real PixelLab art)
    pack_bbox("glassWitch", ["run", "fire", "hurt"])
    pack_bbox("reflectionHound", ["run", "hurt"])
    pack_bbox("falseFace", ["run", "strike", "hurt"])
    pack_bbox("fractureWisp", ["run", "hurt"])
    pack_bbox("lookingGlass", ["run", "strike", "hurt"])
    # Ranged archetypes (real PixelLab art) + the Sanctuary's Stranger.
    pack_bbox("archer", ["run", "fire", "hurt"])
    pack_bbox("bomber", ["run", "fire", "hurt"])
    pack_bbox("stranger", ["idle"])


if __name__ == "__main__":
    build()
