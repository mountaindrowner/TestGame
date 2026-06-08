"""Pack the PixelLab ornate broken-mirror pane (art_src/mirror/pane.png) into a
trimmed decor sprite for the House of Mirrors. Cropped to its content bbox so the
engine can scale/anchor it predictably. Run via `npm run assets`.

Output: public/assets/sprites/decor/mirror.png
"""
from __future__ import annotations
import os
from PIL import Image

SRC = os.path.join("art_src", "mirror", "pane.png")


def build() -> None:
    im = Image.open(SRC).convert("RGBA")
    im = im.crop(im.getbbox())  # trim transparent margin -> tight content sprite
    out = os.path.join("public", "assets", "sprites", "decor", "mirror.png")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out)
    print(f"  wrote sprites/decor/mirror.png  ({im.width}x{im.height})  [PixelLab ornate broken pane]")


if __name__ == "__main__":
    build()
