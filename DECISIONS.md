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
- **Player frame:** 24×32. **Anchor:** bottom-center (origin 0.5, 1); Arcade body sized/offset
  to the silhouette so feet sit on the floor.
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
  ("every AI sprite needs cleanup, palette drifts"). Character is a rim-lit silhouette
  because that's the high-quality look code can actually deliver.
