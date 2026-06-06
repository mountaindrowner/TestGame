# DECISIONS — REPENTANCE

> Locked constraints. Per the Super Dude Adventures handoff: decide these on day 1, document
> them, never argue about them again. Changing a day-1 decision is cheap; changing it at v1.0
> is a multi-file refactor.

## Stack
- **Engine:** Phaser 3 + **Vite** + **TypeScript** (strict).
- **Physics:** Arcade (AABB-on-tilemap). No slopes for now.
- **Assets:** generated procedurally — Python 3 + Pillow → PNG sheets/tilesets in
  `public/assets/`. SFX synthesized at runtime via Web Audio. No external art tools yet.
- **Host:** web-first. `base: './'` so a later Capacitor iOS wrap works unchanged.

## Render
- **Internal resolution:** 480×270 (16:9). Author everything at native res.
- **Scale mode:** `Phaser.Scale.FIT` + `CENTER_BOTH`. Do NOT use `zoom` (double-scales).
- **pixelArt:** true, **roundPixels:** true, antialias off. Camera `roundPixels` on.

## Grid & anchors
- **Tile size:** 16×16.
- **Player frame:** 48×44 (PixelLab art; figure ~36px tall). **Anchor:** bottom-center
  (origin 0.5, 1); Arcade body 12×28 at offset (18,16) so feet sit on the floor.
  (Was 24×32 procedural; see "Player art" below.)
- **Entity anchor convention:** bottom-center for actors, top-left for tiles. Never mix per-entity.
- **Collision box:** ~80% of the visual — what you see ≠ what you hit (forgiving = fun).

## Palette (dark + neon grace)
- bg deep `#0a0a12` / `#12101f`
- stone `#2a2740` / `#3a3556`
- molten `#ff5a2c` / `#ff9d3a`
- grace/light cyan `#7ef0ff` + white bloom
- Rule: dark silhouettes, neon accents only. ≤5 hue families per scene.

## Conventions
- All feel constants live in `src/data/Tunables.ts` — one file tunes the whole game.
- Sprite-sheet frame order is a contract: the Python packer, `assetManifest.ts`, and
  `Animations.ts` must agree. The packer prints its layout.
- Parallax is baked once to textures and scrolled via `tilePositionX` — NEVER repainted per frame.
- Hitstop is a manual timer flag, not `physics.world.pause()`.
- If a designer might tweak it per-room, it's **data** (room/level config), not code.

## Why these
- 480×270 (vs SDA's 320×180): more density for the high-detail atmospheric look requested,
  still cheap to render and an integer-friendly scale target.
- Procedural art: deterministic, palette-locked, re-runnable — sidesteps the #1 SDA pain
  ("every AI sprite needs cleanup, palette drifts"). Enemy/tileset/decor/backgrounds stay
  procedural for this reason.

## Player art (exception to "everything procedural")
- The **player** is AI-authored pixel art — PixelLab character "Hollow Revenant" (white
  bone-skeleton + cyan circuit glow + tattered cape + broken sword), id `d6e11e94`.
  Side view, 7 anims authored on the `east` rotation (engine mirrors for west).
- **Source frames committed** under `art_src/player/<anim>/` so the build needs no API.
  `tools/pack_player.py` crops the 4px bottom padding (48×48 → 48×44) and packs the strip
  `idle 0-3 | run 4-9 | jump 10-18 | fall 19-23 | attack 24-30 | hurt 31-36 | death 37-43`.
  Runs as part of `npm run assets` (replaced the old `gen_player.py`).
- Engine holds jump/fall/dash as single poses (physics drives the arc); attack1/attack2
  reuse the one slash clip for now. TODO (cheap, 1 PixelLab gen each): bespoke dash + 2nd
  combo swing if the feel wants them.

## Environment art — second biome (planned)
- **BIO-02 will use PixelLab's `create_sidescroller_tileset`** rather than a new procedural
  palette. Plan: prompt the terrain look, then a build step slices to 16×16, quantizes to
  our locked palette, and remaps into the 21-slot Vis contract; the Autotiler, one-way
  platform / molten / cracked specials, and `gen_decor` props stay as-is. BIO-01 (depths)
  remains the procedural `gen_tileset.py`.
