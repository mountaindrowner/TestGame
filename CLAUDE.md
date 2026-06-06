# REPENTANCE — Session Handover

> **New session: read this first.** Only what's pushed to git survives. Update this file as
> major work lands. Branch: `claude/repentance-roguevania-dev-Zq3QP`. Verify reality against
> files — don't trust memory.

## What this is
A Dead Cells–inspired **roguevania** that is a **playable metaphor for repentance** (art
project). You play a non-gendered cloaked figure; the loop *is* the message —
*fail → return in grace → fight again → learn → go deeper*. Not preachy, not overtly
religious. The world says "you failed"; the game says "get back up."
Full design bible: `docs/Repentance_Overworld_Map.pdf` notes summarized in `docs/DESIGN.md`.

## Where we are
- **Milestone 1 — BIO-01 "The First Fall": now a COMPLETE 5-room level**, beatable end-to-end.
  Hosted live on GitHub Pages (`https://mountaindrowner.github.io/TestGame/`; `?edit` reserved
  for the future editor). Web-first + on-screen touch controls (`TouchControls`).
- **Rooms & flow:** one reusable `GameScene` loads a room by id and re-inits on transition
  (`scene.restart`); per-run state (health, key, guardian) lives in `RunState` (Phaser registry)
  so it survives transitions. Rooms in `src/data/rooms/*` + `src/data/levelGraph.ts`, linked by
  door spawns (`door.to`/`toEntry`). Path: first-fall → descent → crossroads → {memory, gate}.
  Press **↑** at a door; hard-fade transition; you arrive at the matching entry door.
- **Finale:** the sealed **gate** opens only with the **Broken Memory** key (pickup in `memory`)
  AND the **Guardian** elite down (in `gate`). Completing it → DOM win overlay ("THE FIRST FALL
  — COMPLETE / TO BE CONTINUED" + restart via `RunState.reset`).
- **Enemy family (config-driven):** `src/data/enemyRegistry.ts` is the single source — runner
  (lunger, molten core-break), crawler (relentless pursuer), spark (flying ranged; `Projectile`),
  striker (heavy telegraph→strike→punishable recovery), guardian (elite striker). `Enemy` is
  decoupled from globals; per-type tune in `Tunables.ts`; CombatSystem reads `enemy.coreBonusMult`.
  **This registry is the seam the planned level editor reuses.**
- **Player art:** AI (PixelLab "Hollow Revenant"), 48×44, 9 anims. `art_src/player/` → `tools/pack_player.py`.
- **Enemy art:** ONLY the Impulse Runner has real PixelLab art (`art_src/enemy/`, `tools/pack_enemy.py`).
  Crawler/spark/striker/guardian currently **reuse the runner sheet with a tint+scale** as interim
  identity (see `enemyRegistry` `tint`). ⚠️ Real PixelLab sheets are pending: this remote sandbox's
  egress is **GitHub-only**, so generated frames on PixelLab's CDN can't be downloaded here —
  generate them in a session/locally with open network, drop into `art_src/<kind>/`, generalize
  `pack_enemy.py` (multi-enemy), add `*Anims` in `Animations.ts`, swap `spriteKey`/`anims` + drop
  the tint in `enemyRegistry`.
- **Polish:** tutorial legend (keyboard/touch, opener only, `Tutorial`); sparse procedural music +
  enemy SFX (`Sfx` is now a `getSfx()` singleton — one AudioContext across reloads); HUD shows
  area name + Broken Memory pip + contextual gate hints. Tileset/decor enriched with moss
  overgrowth + hanging moss/fern (`gen_tileset.py`/`gen_decor.py`), within the 21-tile Vis contract.
- **Dev hooks:** `window.__gotoRoom(id)` jumps rooms; `__poseScene`, `__GAME_READY` as before.
- **Next milestone:** the in-engine **level-editor / dev-kit** (plan already designed: biome/content
  registry + data-driven levels + editor scene; the enemy registry + per-room data are its
  foundation). Then **BIO-02** (PixelLab sidescroller tileset, DECISIONS.md).

## Stack & conventions
See `DECISIONS.md`. Headlines: Phaser 3 + Vite + TS; 480×270 internal, pixelArt, FIT;
tiles 16×16; player 48×44 feet-anchor; all feel constants in `src/data/Tunables.ts`;
parallax baked + scrolled (never repainted); procedural assets via `tools/*.py` → `public/assets/`.

## Organic variation (asset look)
`docs/ART_VARIATION.md` is the grammar for keeping level assets organic = **logical**
placement (gravity/water/light/structure) + **deterministically unique** (a pure
function of position, never `Math.random`). Executable: `src/data/variation.ts`
(`vhash`/`chance`/`pick`/`range`/`wave`/`dampness`) with a parity `vhash` in
`tools/common.py`. Autotiler, the cave-roof builder, and (incrementally) the Python
generators draw their variation from it.

## Commands
- `npm run dev` — Vite dev server (http://localhost:5173)
- `npm run assets` — regenerate all PNG assets (Python/Pillow)
- `npm run build` — typecheck + production build
- `npm run shot` — Playwright headless screenshot → `shots/` (needs dev server running)

## Architecture
`src/main.ts` (Phaser config only) → scenes Boot→Preload→Game(+parallel UI). Entities
(`Player`, `Enemy`, `AttackHitbox`) own their body/state. Systems (`InputManager`,
`CombatSystem`, `JuiceSystem`, `ParticleSystem`, `ParallaxBackground`, `Decorations`, `Sfx`)
act on entities. `window.__GAME_READY` + `window.__poseScene()` are the screenshot hooks.

## Tile system (the "tile family" leg of each theme)
Rooms store SEMANTIC codes (`Sem.*` in roomData). `Autotiler.autotile()` converts them to
edge-aware VISUAL tiles (`Vis.*`): walls keyed by a 4-bit exposed-edge mask → lit bevels +
rounded convex corners; big interiors scatter across variants so fills don't look stamped.
`tools/gen_tileset.py` packs 16 wall-masks + interior variants + cracked + platform + molten.
`Decorations` hangs swaying props (chains/vines/roots/banners from `tools/gen_decor.py`) off
ledge undersides. To add a biome: new palette + `gen_tileset`/`gen_decor` variant → same engine.

## Gotchas (don't relearn the hard way)
- Audio is gesture-gated (browser autoplay) — `Sfx` resumes the AudioContext on first input.
- Feet-anchor vs Arcade body offset must match or the player floats/sinks.
- Hitstop = manual flag, not world pause (avoids tween/anim stalls + resume velocity spikes).
- Cap dash speed / keep floors ≥1 tile thick to avoid Arcade tunneling.
- Phaser 3.60+ particle API: `this.add.particles(x,y,texture,config)`; create emitters once.
