# REPENTANCE — Session Handover

> **New session: read this first.** Only what's pushed to git survives. Update this file as
> major work lands. Branch: `claude/html5-phaser-comparison-xzqQ3`. Verify reality against
> files — don't trust memory.

## What this is
A Dead Cells–inspired **roguevania** that is a **playable metaphor for repentance** (art
project). You play a non-gendered cloaked figure; the loop *is* the message —
*fail → return in grace → fight again → learn → go deeper*. Not preachy, not overtly
religious. The world says "you failed"; the game says "get back up."
Full design bible: `docs/Repentance_Overworld_Map.pdf` notes summarized in `docs/DESIGN.md`.

## Where we are
- **Milestone 1:** "The First Fall" (BIO-01), ONE room, full game-feel + full grace-burst
  respawn + one enemy (Impulse Runner). Web-first playable. (In progress.)

## Stack & conventions
See `DECISIONS.md`. Headlines: Phaser 3 + Vite + TS; 480×270 internal, pixelArt, FIT;
tiles 16×16; player 24×32 feet-anchor; all feel constants in `src/data/Tunables.ts`;
parallax baked + scrolled (never repainted); procedural assets via `tools/*.py` → `public/assets/`.

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
