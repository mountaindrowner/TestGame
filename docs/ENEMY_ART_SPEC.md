# Enemy & Boss Art Spec (BIO-01)

> **Status: DONE — all four are generated AND integrated in-game** (real art, not
> placeholders). The `api.pixellab.ai` download-zip endpoint turned out to be
> reachable from the sandbox, so `tools/fetch_enemy_art.py` pulled the east frames
> into `art_src/<kind>/` and `tools/pack_enemy.py` packed them. Re-run those two
> (then `npm run assets`) to refresh after re-rolling any clip in PixelLab.

## Generated PixelLab characters (account 076c964e…) — pull these in
| Kind | character_id | canvas | east animations (frames) |
|---|---|---|---|
| `crawler` Regret Crawler | `e69cc50e-451e-4e02-ae1d-8111c2931e02` | 68×68 | run(8), hurt(6) |
| `spark` Shame Spark | `7d0aa99c-c02c-400e-b494-03146403a4a1` | 56×56 | run(6), windup/flare(6), hurt(4) |
| `striker` Hollow Striker | `074b1852-528c-4722-b217-2c52ede76b9a` | 68×68 | run(8), windup(6), strike(8), hurt(6) |
| `guardian` Warden of the Fall (BOSS) | `1b45195b-92f1-45f7-a2de-75da99e081a9` | 92×92 | run(8), windup(8), strike/charge(8), recovery(6), hurt(6) |

*(Ignore the failed first Warden `f85b3d4b…` — PixelLab heavy-load failure.)*

## BIO-02 House of Mirrors roster (account 076c964e…) — DONE, integrated
Generated as standard side-view PixelLab characters from the concept sheet, east frames only
(`directions:['east']` keeps each animation at 1 generation). Packed sizes (union bbox) noted.
| Kind | character_id | packed | east animations |
|---|---|---|---|
| `glassWitch` Glass Witch | `423c3c3b-1853-40c8-9ac5-01c03c2f81a0` | 48×52 | run(6), fire(6), hurt(6) |
| `reflectionHound` (quadruped/lion) | `f350dea0-7783-4406-9cd8-1a0e93045d6c` | 65×35 | run(6), hurt(7) |
| `falseFace` False-Face Duelist | `2fcfa995-7b17-4cbb-bd5d-3df471c75978` | 51×52 | run(6), strike(6), hurt(6) |
| `fractureWisp` Fracture Wisp | `45e29f72-32a7-4418-8bbc-eb3139ee3bf3` | 34×44 | run(7), hurt(7) |
| `lookingGlass` Sentinel | `5f852c46-54f5-4e44-9e0f-6c4e097273b6` | 62×65 | run(6), strike(6), hurt(6) |

## Ranged archetypes + the Sanctuary's Stranger (account 076c964e…) — DONE, integrated
Standard side-view PixelLab characters, east frames only. The two ranged foes replace the
tinted-striker placeholders (tints dropped). The Stranger is a non-combat figure shown in
`SanctuaryScene`. Packed sizes (union bbox) noted.
| Kind | character_id | packed | east animations |
|---|---|---|---|
| `archer` Bone Archer | `39c2b805-956c-41d3-b4a4-9e64c23fd240` | 47×52 | run(6), fire(9, draw-and-loose), hurt(6) |
| `bomber` Cinder Bomber | `bcd1d41b-a249-4e59-8fef-1da8f3bf766f` | 53×57 | run(6), fire(9, wind-up-and-hurl), hurt(6) |
| `stranger` The Stranger | `3eb3aa7a-cc4c-40a8-90d0-e39738e82b81` | 16×50 | idle(4) |

Animation source = template clips (running-6-frames→`run`, taking-punch→`hurt`, breathing-idle→
stranger idle) + v3 custom for the `fire` telegraphs ("drawing back a bow and loosing an arrow" /
"hurling a bomb overhand forward"). The ranged-ground behaviour plays only run/fire/hurt, so `windup`
maps to the `fire` clip in the registry. Stranger wired into `SanctuaryScene.addStranger()`.

## BIO-02 roster animation source
Animation source = template clips (walking-6-frames→`run`, cross-punch→`strike`, taking-punch→`hurt`,
fireball→`fire`) + v3 custom (hound `flinching…`→hurt, wisp `drifting…`→run / `recoiling…`→hurt). The
`fetch_enemy_art.py` keyword map matches the action-slug folder names. The Mirror Double reuses the
**player** sheet (its whole point). *(First Fracture Wisp `559137a5…` + Sentinel `3eddb555…` were
heavy-load failures — re-rolled to the ids above.)*

### How to pull them in (open-network machine)
1. For each id, fetch the frames — either the zip
   `https://api.pixellab.ai/mcp/characters/<id>/download`, or via the PixelLab MCP
   `get_character(id)` which lists each frame URL
   (`…/animations/<animId>/east/<n>.png`). Take the **east** frames.
2. Drop them into `art_src/<kind>/<anim>/frame_*.png` (anim dirs: run, windup, hurt,
   strike, recovery, flare as applicable).
3. **Generalize `tools/pack_enemy.py`**: loop over an ENEMIES table, each with its
   own `src` dir, source frame size (68/56/92 — they differ!), and an ORDER table
   `(anim → count)`. Crop/scale each to our **48×44 feet-anchored** frame.
4. Add a `<Kind>Anims` table in `src/data/Animations.ts` (ranges must match the
   packer's printed strip layout), load each sheet in `PreloadScene` +
   `assetManifest.ts`, then in `enemyRegistry.ts` set `spriteKey`/`anims` for that
   kind and **delete its `tint`** (and adjust `scale`/`body` for the new sizes).

> Engine anim keys the registry expects: `run`, `windup`, `hurt`, plus `strike`
> (heavy/boss) and `fire` (spark → map to the flare/`windup` clip or a `fire` dir).
> Each id above is one character; mirroring east→west is automatic (setFlipX).

---

## Original spec (look + animation intent)

## Shared contract (match the Runner so packing/anchoring "just works")
- **PixelLab**: humanoid/creature, **side view**, author the **east** rotation (engine
  mirrors for west). Style: medium shading, selective outline — dark silhouette +
  neon accents, our locked palette.
- **Frame size**: 48×48 source, centered, feet ~row 43 → packer crops to **48×44**.
- **As many frames as feasible** (smoother than the current 5-frame run). Targets below.
- **Pipeline to integrate** (per kind): generate → drop frames in `art_src/<kind>/<anim>/`
  → generalize `tools/pack_enemy.py` (loop over enemies; ORDER table) → add a
  `<Kind>Anims` table in `src/data/Animations.ts` (ranges match the packer's printed
  layout) → add the sheet to `assetManifest.ts` + load in `PreloadScene` → set
  `spriteKey`/`anims` and **remove the `tint`** in `enemyRegistry.ts`.

## Per enemy

### Impulse Runner — `runner` (HAVE)
Low shadow-imp, red eyes, exposed molten **core** (its weak point). Reckless lunger.
Anims: run, windup (crouch-coil), hurt. *(Bump to run 6–8 frames when regenerating.)*

### Regret Crawler — `crawler` (placeholder: green)
Low, many-limbed, **clings to the ground**; sorrowful, dragging gait. Never lets go.
Anims: **crawl/run 8**, windup *(optional)* , hurt 4–6. Weak point: from behind.

### Shame Spark — `spark` (placeholder: yellow)
Small **airborne** ember/mote, flickering, eye-like; flares before it spits.
Anims: **hover/idle 6**, **fire/flare 4–6**, hurt 4. Fragile, evasive.

### Hollow Striker — `striker` (placeholder: steel)
Tall, **armored**, hollow knight-shell; heavy, deliberate. Long telegraph → big strike
→ stagger. Anims: **walk 6**, **windup 5–6** (rear back), **strike 6–8** (overhead/
thrust), **hurt/stagger 5**. Weak point: its **recovery** window.

### The Warden of the Fall — `guardian` / BOSS (placeholder: rose, scale 1.9)
**Elden Ring / Dead Cells-flavoured elite — an armored, hulking kin of the Impulse
Runner.** Same silhouette family as the Runner but **bigger, plated, scarred**, a
dim molten core showing through cracked armor. Reads as "the area, personified."
Fight = **telegraph → charge → punishable recovery**, weave in and out.
Anims (richest of all): **walk 6–8**, **windup/rear-back 6–8** (clear tell),
**charge 6–8**, **recovery/stagger 6** (the weave window, glows vulnerable),
**hurt 5**, optional **roar 6** for a phase tell. Bigger canvas (e.g. 64px source).

## Notes
- Behaviors/AI already exist and are tuned per characteristic (`enemyRegistry.ts`
  behavior tags + per-type `Tunables`): lunger / pursuer / flyer_ranged /
  heavy_telegraph. Art swaps in without touching AI.
- Keep the **telegraph readability** the engine adds (danger flush on windup/charge,
  cool "vulnerable" glow on recovery) — the new art should complement, not fight it.
