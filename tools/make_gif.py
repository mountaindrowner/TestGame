"""Stitch /tmp/play/f*.png into a GIF. Usage: python3 tools/make_gif.py [out.gif] [fps]"""
import sys, glob
from PIL import Image

out = sys.argv[1] if len(sys.argv) > 1 else "/tmp/play/gameplay.gif"
fps = int(sys.argv[2]) if len(sys.argv) > 2 else 16
W = 480  # downscale from 960 for a reasonable file size

frames = sorted(glob.glob("/tmp/play/f*.png"))
ims = []
for f in frames:
    im = Image.open(f).convert("RGB")
    im = im.resize((W, int(im.height * W / im.width)), Image.LANCZOS)
    ims.append(im.convert("P", palette=Image.ADAPTIVE, colors=128))
ims[0].save(out, save_all=True, append_images=ims[1:], duration=int(1000 / fps), loop=0)
print(f"{out}  ({len(ims)} frames @ {fps}fps, {ims[0].size})")
