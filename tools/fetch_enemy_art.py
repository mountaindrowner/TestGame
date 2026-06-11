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
    # Hollow Revenant HD (v3, 64px source) — the high-quality re-roll. Full emotive
    # v3 animation pass (east). Keywords match the action-slug dir names in the zip.
    "player": ("2a16dbc2-badc-412a-8da4-9640577bb4c0", {
        # Mark's playtest re-rolls: idle = angled heavy-breathing stance ("heaving"),
        # jump = explosive coil+spring ("skyward"), fall = windswept drop; new
        # "climb" = the ledge-grab mantle (wired to Player.beginClimb).
        "idle": "three-quarter", "run": "determination", "jump": "explosive_vertical",
        "runjump": "running_leap", "fall": "dropping_fast", "dash": "dashing",
        "climb": "mantling",
        "hurt": "recoiling",
        # 3-hit combo (richer v3 swings):
        #   1 light  -> fast overhead broken-sword chop
        #   2 heavy  -> pull the glowing blade back, big horizontal slash
        #   3 finish -> explosive crouch->leap forward thrust + follow-through
        "attack1": "overhead_chop", "attack2": "pulling_the_glowing", "attack3": "explosive_finisher",
        "death": "collapsing",
        # long-idle "waits" poses: rest (healthy) + weary (below half HP)
        "rest": "propping", "weary": "hunched",
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
    # BIO-02 House of Mirrors roster (standard side-view characters; east frames).
    "glassWitch": ("423c3c3b-1853-40c8-9ac5-01c03c2f81a0", {"run": "animating", "fire": "casting", "hurt": "taking"}),
    "reflectionHound": ("f350dea0-7783-4406-9cd8-1a0e93045d6c", {"run": "running", "hurt": "flinching"}),
    "falseFace": ("2fcfa995-7b17-4cbb-bd5d-3df471c75978", {"run": "animating", "strike": "cross", "hurt": "taking"}),
    "fractureWisp": ("45e29f72-32a7-4418-8bbc-eb3139ee3bf3", {"run": "drifting", "hurt": "recoiling"}),
    "lookingGlass": ("5f852c46-54f5-4e44-9e0f-6c4e097273b6", {"run": "animating", "strike": "cross", "hurt": "taking"}),
    # Ranged archetypes — real PixelLab side-view sheets (east frames). run/fire(draw or throw)/hurt.
    "archer": ("39c2b805-956c-41d3-b4a4-9e64c23fd240", {"run": "running", "fire": "drawing", "hurt": "taking"}),
    "bomber": ("bcd1d41b-a249-4e59-8fef-1da8f3bf766f", {"run": "running", "fire": "hurling", "hurt": "taking"}),
    # The Sanctuary's pact-giver — a single idle pose for the SanctuaryScene.
    "stranger": ("3eb3aa7a-cc4c-40a8-90d0-e39738e82b81", {"idle": "animating"}),
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
