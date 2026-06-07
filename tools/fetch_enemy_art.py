"""Download generated PixelLab enemy/boss frames into art_src/.

Run on a network with access to api.pixellab.ai (the per-character download zip
endpoint is reachable; the raw CDN is not). One-time / on-demand; NOT part of
`npm run assets`. Lays out the EAST frames as art_src/<kind>/<role>/frame_NNN.png
so tools/pack_enemy.py can pack them. See docs/ENEMY_ART_SPEC.md.
"""
from __future__ import annotations
import io, os, re, shutil, urllib.request, zipfile

HERE = os.path.dirname(__file__)
ART = os.path.join(HERE, "..", "art_src")
URL = "https://api.pixellab.ai/mcp/characters/{}/download"

# kind -> (character_id, { engine_anim_role: keyword-in-action-slug })
ENEMIES = {
    "player": ("d6e11e94-d526-46f8-a306-92181692a41a", {
        "idle": "sway", "run": "strides", "jump": "leap", "runjump": "running_jump",
        "fall": "billow", "dash": "lunge", "hurt": "snapping",
        # 3-hit combo = the newer, richer hand-made swings:
        #   1 light  -> fast overhead broken-sword chop (7f)
        #   2 heavy  -> pull the glowing blade back, big horizontal slash (17f)
        #   3 finish -> explosive crouch->leap forward thrust + follow-through (9f)
        "attack1": "broken_sword", "attack2": "glowing_blue", "attack3": "animating-433",
        "death": "collapsing",
        # long-idle "waits" poses: rest (healthy) + weary (below half HP)
        "rest": "propped", "weary": "weary",
    }),
    "crawler": ("e69cc50e-451e-4e02-ae1d-8111c2931e02", {"run": "crawling", "hurt": "recoiling"}),
    "spark": ("7d0aa99c-c02c-400e-b494-03146403a4a1", {"run": "floating", "windup": "flaring", "hurt": "flickering"}),
    "striker": ("074b1852-528c-4722-b217-2c52ede76b9a", {"run": "walking", "windup": "rearing", "strike": "swinging", "hurt": "staggering"}),
    "warden": ("1b45195b-92f1-45f7-a2de-75da99e081a9", {
        "run": "walking", "windup": "telegraphing", "strike": "charging",
        "recovery": "staggering", "hurt": "reeling",
        # new boss animations (v3, east):
        "idle": "breathing", "taunt": "roaring", "slam": "smashing", "death": "collapsing",
    }),
}


def fetch(kind: str, cid: str, mapping: dict[str, str]) -> None:
    data = urllib.request.urlopen(URL.format(cid), timeout=90).read()
    zf = zipfile.ZipFile(io.BytesIO(data))
    by_dir: dict[str, list[str]] = {}
    for n in zf.namelist():
        m = re.search(r"/animations/([^/]+)/east/frame_(\d+)\.png$", n)
        if m:
            by_dir.setdefault(m.group(1), []).append(n)
    print(kind)
    for role, kw in mapping.items():
        cand = sorted(d for d in by_dir if kw.lower() in d.lower())
        if not cand:
            print(f"  [{role:8s}] MISSING (no anim dir matching '{kw}')")
            continue
        d = cand[0]
        outdir = os.path.join(ART, kind, role)
        shutil.rmtree(outdir, ignore_errors=True)
        os.makedirs(outdir, exist_ok=True)
        files = sorted(by_dir[d])
        for i, f in enumerate(files):
            with open(os.path.join(outdir, f"frame_{i:03d}.png"), "wb") as o:
                o.write(zf.read(f))
        print(f"  [{role:8s}] {len(files)} frames  <- {d}")


if __name__ == "__main__":
    for kind, (cid, mapping) in ENEMIES.items():
        fetch(kind, cid, mapping)
    print("Done. Now run: npm run assets  (packs art_src -> public/assets)")
