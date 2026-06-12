"""tools/render_map.py — render a composed environment's merged tiles to an
inspectable MAP image: rock vs passages, molten + one-way platforms, each sub-room
outlined and named, the key spawns marked (player/key/gate/boss/ember/enemies), and
the actual critical-path route traced through it.

Reads /tmp/world-<env>.json (written by tools/dump_world.mjs); writes
/tmp/map-<env>.png. Usage:  python3 tools/render_map.py
"""
from __future__ import annotations
import json
import os
from PIL import Image, ImageDraw, ImageFont

S = 7          # pixels per tile
PAD = 16       # outer margin
TOP = 30       # title bar
LEGEND = 26    # legend strip

# Sem codes (mirror assetManifest.Sem)
EMPTY, SOLID, PLATFORM, MOLTEN, CRACKED = -1, 0, 1, 2, 3

BG = (8, 10, 16)
ROCK = (30, 34, 48)          # solid wall
ROCK_HI = (44, 50, 68)       # cracked (slightly lighter)
PASSAGE = (96, 120, 150)     # walkable negative space (the part you SEE as "the map")
MOLTEN_C = (210, 90, 36)
PLATFORM_C = (90, 200, 210)
GRID = (60, 80, 100)

# spawn type -> (color, radius, kind)  kind: 'dot'|'ring'|'star'|'diamond'|'square'
ELITES = {'guardian', 'mirrorboss', 'accuser'}
ENEMIES = {'runner', 'crawler', 'spark', 'striker', 'archer', 'bomber', 'mirrorDouble',
           'reflectionHound', 'glassWitch', 'falseFace', 'fractureWisp', 'lookingGlass'}
HAZARDS = {'gavel', 'gaze', 'flameseal'}


def font(sz):
    for path in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
                 '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        if os.path.exists(path):
            return ImageFont.truetype(path, sz)
    return ImageFont.load_default()


def render(env: str) -> str:
    with open(f'/tmp/world-{env}.json') as f:
        d = json.load(f)
    w, h, tiles = d['w'], d['h'], d['tiles']
    W = PAD * 2 + w * S
    H = TOP + PAD + h * S + LEGEND
    img = Image.new('RGB', (W, H), BG)
    dr = ImageDraw.Draw(img, 'RGBA')

    ox0, oy0 = PAD, TOP
    def px(tx, ty):
        return ox0 + tx * S, oy0 + ty * S

    # ── tiles ────────────────────────────────────────────────────────────────
    for ty in range(h):
        row = tiles[ty]
        for tx in range(w):
            c = row[tx]
            if c == EMPTY:
                col = PASSAGE
            elif c == MOLTEN:
                col = MOLTEN_C
            elif c == CRACKED:
                col = ROCK_HI
            elif c == PLATFORM:
                col = PLATFORM_C
            else:
                col = ROCK
            x, y = px(tx, ty)
            dr.rectangle([x, y, x + S - 1, y + S - 1], fill=col)

    # passage shading: a faint inner glow so corridors read as space, not noise
    # (skip — flat reads clean at this scale)

    # ── the critical-path journey (the winding route) ─────────────────────────
    if d.get('journey'):
        pts = [(ox0 + (q['x'] + 0.5) * S, oy0 + (q['y'] + 0.5) * S) for q in d['journey']]
        for i in range(1, len(pts)):
            dr.line([pts[i - 1], pts[i]], fill=(255, 216, 120, 230), width=max(2, S // 3))
        for q in pts:
            dr.ellipse([q[0] - 2, q[1] - 2, q[0] + 2, q[1] + 2], fill=(255, 230, 150, 255))

    # ── room outlines + names ─────────────────────────────────────────────────
    f_room = font(11)
    for r in d['placements']:
        x, y = px(r['ox'], r['oy'])
        x2, y2 = px(r['ox'] + r['w'], r['oy'] + r['h'])
        dr.rectangle([x, y, x2 - 1, y2 - 1], outline=(126, 240, 255, 150), width=1)
        label = r['name'] or r['id']
        dr.rectangle([x + 1, y + 1, x + 7 + len(label) * 6, y + 13], fill=(8, 12, 20, 200))
        dr.text((x + 3, y + 2), label, fill=(190, 235, 250), font=f_room)

    # ── spawn markers ─────────────────────────────────────────────────────────
    def marker(tx, ty, color, kind, rad):
        cx, cy = ox0 + (tx + 0.5) * S, oy0 + (ty + 0.5) * S
        a = color + (255,)
        if kind == 'ring':
            dr.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], outline=a, width=2)
        elif kind == 'square':
            dr.rectangle([cx - rad, cy - rad, cx + rad, cy + rad], fill=a)
        elif kind == 'diamond':
            dr.polygon([(cx, cy - rad), (cx + rad, cy), (cx, cy + rad), (cx - rad, cy)], fill=a)
        elif kind == 'star':
            dr.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=a)
            dr.ellipse([cx - rad - 2, cy - rad - 2, cx + rad + 2, cy + rad + 2], outline=a, width=1)
        else:
            dr.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=a)

    for s in d['spawns']:
        t = s['type']
        if t in ('torch', 'jar', 'mirror'):
            continue  # decor — skip to keep the map readable
        if t == 'player':
            marker(s['tx'], s['ty'], (126, 240, 255), 'star', 5)
        elif t == 'key':
            marker(s['tx'], s['ty'], (255, 210, 70), 'diamond', 5)
        elif t == 'gate':
            marker(s['tx'], s['ty'], (120, 240, 120), 'square', 5)
        elif t == 'door':
            marker(s['tx'], s['ty'], (90, 160, 255), 'square', 4)
        elif t == 'ember':
            marker(s['tx'], s['ty'], (255, 160, 60), 'diamond', 4)
        elif t in ELITES:
            marker(s['tx'], s['ty'], (255, 80, 90), 'ring', 7)
        elif t in HAZARDS:
            marker(s['tx'], s['ty'], (176, 106, 255), 'dot', 3)
        elif t in ENEMIES:
            marker(s['tx'], s['ty'], (235, 90, 95), 'dot', 3)

    # ── title + legend ────────────────────────────────────────────────────────
    f_title = font(15)
    title = f"{env}   ·   {w}×{h} tiles   ·   {len(d['placements'])} rooms"
    dr.text((PAD, 8), title, fill=(126, 240, 255), font=f_title)

    f_leg = font(11)
    lx = PAD
    ly = H - LEGEND + 7
    items = [('player', (126, 240, 255)), ('key', (255, 210, 70)), ('boss', (255, 80, 90)),
             ('gate/door', (120, 240, 120)), ('ember', (255, 160, 60)), ('enemy', (235, 90, 95)),
             ('hazard', (176, 106, 255)), ('passage', PASSAGE), ('molten', MOLTEN_C),
             ('one-way', PLATFORM_C), ('route', (255, 216, 120))]
    for name, col in items:
        dr.ellipse([lx, ly + 1, lx + 9, ly + 10], fill=col + (255,))
        dr.text((lx + 13, ly), name, fill=(180, 200, 215), font=f_leg)
        lx += 16 + len(name) * 7 + 14

    out = f'/tmp/map-{env}.png'
    img.save(out)
    print(f'  wrote {out}  ({W}x{H})')
    return out


if __name__ == '__main__':
    for env in ('first-fall', 'mirror-hall', 'court-gate'):
        if os.path.exists(f'/tmp/world-{env}.json'):
            render(env)
