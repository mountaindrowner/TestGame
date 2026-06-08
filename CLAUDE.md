# REPENTANCE — Session Handover

> **New session: read this first.** Only what's pushed to git survives. Update this file as
> major work lands. Branch: `claude/repentance-roguevania-dev-Zq3QP`. Verify reality against
> files — don't trust memory.
>
> **Working agreement with the user (always):** whenever new art/animations are generated,
> **surface the actual render images** to the user (`SendUserFile` — contact strips and/or
> in-game shots, don't just describe them), and **always include the live link**
> (`https://mountaindrowner.github.io/TestGame/`) after pushing.

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
  striker (heavy telegraph→strike→punishable recovery), guardian = **The Warden of the Fall**,
  an armored telegraphing charger (Elden-Ring/Dead-Cells-ish; weave its windup→charge→recovery).
  `Enemy` is decoupled from globals; per-type tune in `Tunables.ts`; CombatSystem reads
  `enemy.coreBonusMult`. Enemy anim speed is coupled to movement (no more "wild" run); heavy
  foes flush red on windup/charge + glow cyan (vulnerable) in recovery.
  **This registry is the seam the planned level editor reuses.**
- **Player combat:** a **3-hit escalating combo** (`PlayerCombo` in `Tunables.ts`: light → heavy
  → big forward cleave, ~1:1.5:2.6 dmg; chain within `comboWindowMs`). `CombatSystem` reads the
  live `player.attackDamage`; swings lean the body + sweep a scaled slash arc.
- **Design direction:** `docs/LEVEL_DESIGN.md` is the **authority on player experience / layout /
  fairness / flow / the map** — our adapted "Level Design Bible" (non-negotiables, difficulty ramp,
  signaling, teach→escalate, lock-and-key via the planned Grace Burst, build workflow + checklists,
  real movement numbers). Read it before building/extending any room. `docs/WORLD_PLAN.md` gives
  every room a name/role/mood + the ascent-from-the-depths gradients (why assets go where).
  `docs/ENEMY_ART_SPEC.md` is the PixelLab spec/IDs for the enemy/boss sprites. `docs/GAME_FEEL_RULES.md`
  is the platformer game-feel charter (coyote/buffer/variable-jump ✅, squash-stretch micro-anims ✅,
  feel>…>art priority; flags the rules that don't fit a solo AI build, e.g. "≥5 live playtesters" →
  the user is the playtester). **The editor's live validation enforces the map-integrity rules**
  (dangling/one-way links, unreachable rooms, dead-ends — `src/data/roomValidate.ts`).
- **Game feel:** squash/stretch on jump/double-jump/land + a pivot squish on hard turns (feet-
  anchored scale, no new art; `PlayerTune.*Squash`), atop dash afterimages + attack body-lean/slash.
- **Player art:** the **original "Hollow Revenant"** (PixelLab id `d6e11e94`, 48px source → packed
  **45×43**, `PlayerTune.scale` 1) — the robot/HD re-rolls were rejected. Its stiff template clips
  were **re-animated emotively** (v3, 7–17 frames each, real wind-up/extension/follow-through):
  idle/run/jump/fall/dash/hurt + **3 distinct attack swings** + death, plus a user-made
  **running-jump** (`runjump`, used when leaping with horizontal speed; standstill uses the leap).
  The **3-hit combo** now uses the **newer hand-made swings**: 1 = fast overhead broken-sword chop
  (7f), 2 = pull-the-glowing-blade-back heavy horizontal slash (17f), 3 = explosive crouch→leap
  forward-thrust finisher (9f) — wired in `PlayerCombo`/`PlayerAnims` (the older slash/horizontal/
  cleave clips remain on the character but are no longer mapped). The leap finisher added 2px of
  union-bbox headroom (41→43 tall); `__poseScene({anim,progress})` poses any clip for verification.
  A **long-idle "waits" pose**: stand still > `PlayerTune.restDelayMs` and he props the blade on
  his shoulder (`player-rest`); below half HP it's the hunched, weary, blade-dragging variant
  (`player-weary`) — gated in `Player.updateAnimation` via an `idleSince` timer.
  Pulled via
  `tools/fetch_enemy_art.py` (player id + per-clip keywords there; note PixelLab keys animations by
  name, so emotive re-rolls of same-named clips need `delete_animation` first), packed by
  `tools/pack_player.py` (union-bbox, feet-anchored). Run cadence speed-coupled; squash/stretch via
  `PlayerTune.*Squash`.
- **Boss arena:** the gate room is the Warden's arena — entering **seals the exits** (barrier +
  edge-lock via `bossActive`) and plays a **Mega-Man-style intro** (camera to boss, a dedicated
  **roar taunt** clip + `Sfx.roar()` + shake, then the **boss health bar** draws in; `UIScene`
  listens to `boss-spawn/intro/health/defeated` from `Enemy` elites). Defeat lifts the lock +
  opens the gate. An ability reward (earmarked "Grace Burst" air-dash) is deferred until the
  hub/next biome.
- **Warden moveset (4 new clips):** beyond charge/recover the Warden now has **idle** (looms in
  place when you're out of reach + holds after the intro), **taunt** (the intro roar, arms-wide),
  a **ground slam** (a second, *close-range* attack — when you crowd it within `slamRange` it
  plants and smashes overhead instead of charging, emitting `boss-slam` → GameScene races two
  **jumpable molten shockwaves** along the floor; the slam clip's own low crouch is its vulnerable
  recovery), and a **death collapse** (elites with a `death` clip play it, then fade — see
  `Enemy.die()`). Slam tuning in `GuardianTune.slam*`; clips are `warden-idle/taunt/slam/death`.
  Dev hook `__poseBoss({anim,progress})` poses the elite for verification.
- **Warden approach (heavy stomps):** the elite no longer just looms — when it spots you beyond
  `GuardianTune.attackRange` it **stalks in** at `walkSpeed` (reusing the heavy walk clip), and an
  `ANIMATION_UPDATE` footfall hook emits `boss-stomp` on the planted-foot frames → GameScene gives
  a small stage **shake + dust + `Sfx.stomp()`**. Within `attackRange` it commits (charge, or slam
  inside `slamRange`). Generic heavy foes (striker) keep the old immediate-windup patrol.
- **HUD health:** neon **rune-block** glyphs (≈1 per 20 HP) that color-shift blood→molten→grace
  with current life (`UIScene.drawHealth`), replacing the old bar.
- **Enemy art:** ALL now real PixelLab art — runner (`art_src/enemy/`) + crawler/spark/striker/
  warden (`art_src/<kind>/`, varied native frame sizes). Pulled via `tools/fetch_enemy_art.py`
  (NOTE: the `api.pixellab.ai` per-character **download zip endpoint IS reachable** from this
  GitHub-only sandbox even though the raw CDN isn't — that's how). Packed by the generalized
  `tools/pack_enemy.py` (union-alpha-bbox crop → feet-anchored sheet; runner keeps its 48×44
  path). Frame sizes in `assetManifest`, ranges in `Animations.ts`, per-kind `anims`/`body`/
  `scale` in `enemyRegistry` (tints dropped). IDs/spec in `docs/ENEMY_ART_SPEC.md`.
- **Polish:** tutorial legend (keyboard/touch, opener only, `Tutorial`); sparse procedural music +
  enemy SFX (`Sfx` is now a `getSfx()` singleton — one AudioContext across reloads); HUD shows
  area name + Broken Memory pip + contextual gate hints. Tileset/decor enriched with moss
  overgrowth + hanging moss/fern (`gen_tileset.py`/`gen_decor.py`), within the 21-tile Vis contract.
- **Dev hooks:** `window.__gotoRoom(id)` jumps rooms; `__poseScene`/`__poseBoss` pose clips;
  `__GAME_READY` as before. **Debug overlay** (`src/systems/DebugOverlay.ts`): a dev-only
  collision/zone x-ray (three boxes + triggers + spawns + bounds, toggle panel, mute,
  FPS/room/clip readout) — toggle with the **` key**, `?debug`, or `window.__debug()`; off for
  players, persists across room reloads. It's the seam the level editor reuses. Conventions,
  the three-box combat-bias rule, the restart-teardown checklist, and our deliberate
  divergences from generic Phaser guides are recorded in `DECISIONS.md`.
- **Level editor (`EditorScene`, open with `?edit`):** an in-engine dev-kit that renders any room
  WYSIWYG via the same `autotile`/tileset, with a DOM tool palette. **Paint** terrain
  (solid/platform/molten/cracked/erase) and **place/move/delete** entities (drag in select mode;
  Del removes; door/gate get an id/to/toEntry inspector); right-drag pans, wheel zooms. **Save**
  writes a browser-local override (`src/data/roomStore.ts`) that `buildRoom()` prefers, so edits
  play instantly; **Revert** clears it; **Export** downloads/clipboards the room JSON to fold into
  the repo; **▶ Play-test** launches `GameScene` on the live edit (Esc returns to the editor).
  Reuses the enemy registry (markers/art) + the data-shaped `RoomData`. Overrides live only in the
  browser — production ships the built-in rooms until exported JSON is committed.
- **Editor v2 (done):** **＋ New room** / **🗑 Delete** (editor-made rooms are override-only, marked
  `*` in the picker; `allRoomIds`/`isBuiltInRoom` in `levelGraph`, `listOverrideRooms` in
  `roomStore`). **Edge-link editor** (east/west/up/down → room id). **Live validation**
  (`src/data/roomValidate.ts`, reusable by a future smoke test) flags dangling doors / unknown
  link targets in red. **🗺 Map view** — rooms laid out spatially by their edge-link directions
  (BFS), cyan link edges + orange door edges, current room highlighted; click a node to jump there.
  `fitTo()` reserves the left strip for the panel (free-pan camera, no bounds clamp).
- **BIO-02 "House of Mirrors" (in progress):** the next area (Shame route; gate exits up into it).
  Concept sheet: `docs/Repentance_HouseOfMirrors_concept.md`-equiv (Mark's image) — 6-enemy roster,
  mini-boss "The Untrue Image", 6 mirror gimmicks, violet palette. **Landed so far (mechanic + look):**
  • **Grace Burst** air-dash — the air-dash is now the unlockable (ground dash unchanged); one per
  airtime, earned on Warden defeat (`RunState.graceBurst`, granted in `onGuardianDefeated`,
  grace-tinted). • **Biome theming system** — `RoomData.biome` + `Biomes` map in `assetManifest`
  (tileset + parallax per biome); `GameScene`/`EditorScene` pick the tileset, `ParallaxBackground`/
  `Decorations` theme by biome. Depths unchanged (default). • **Mirror art** — `mirrors` tileset
  (`tools/gen_tileset_mirrors.py`, depths-reskin into the same 21-slot Vis contract) + mirror
  parallax (`gen_backgrounds_mirrors.py`). **Tileset tuned to Mark's reference image**
  (`art_src/ref/house_of_mirrors_vibe.png`): **lavender-purple BRICK masonry** + **electric-blue
  mirror sheen** + blue diamond sparkles on near-black. (Palette sampled from the ref; tileset
  overrides live inside `gen_tileset_mirrors.build()` so depths regenerates byte-identical.) The
  **background is GIANT PANES OF BROKEN MIRROR** (`gen_backgrounds_mirrors.py`, full rewrite): a
  seamless (both-axes) wall of two enormous shattered panes — reflective glass with a bright
  specular sweep, lavender frames, spiderweb fracture cracks lit electric-blue, and shards punched
  clean out (transparent) so the cold glass-light bleeds through the breaks; mid = drifting cold
  light-shafts + sparkles, near = foreground corner shards + a hard fracture + reflective floor
  band. Frame mullions sit on the x/y seams so it tiles as a TileSprite. (Continuity with the
  previous look = same lavender/electric-blue/near-black palette + the same cold central light.)
- **BIO-02 is now a PLAYABLE, BEATABLE 5-room area** (entered when the BIO-01 gate opens — the
  Warden's gate `to:'mirror-hall'`; opening it no longer ends the game, it climbs into the House of
  Mirrors). The chain: **mirror-hall** (HALL OF FIRST REFLECTIONS, entry) → east → **mirror-gallery**
  (THE GALLERY OF FALSE FACES) → ↑ → **mirror-rise** (THE ASCENDING GLASS — a vertical climb with a
  **Grace-Burst-required gap**) → ↑ → **mirror-threshold** (a Hollow Striker) → ↑ → **untrue-image**
  (HALL OF THE UNTRUE IMAGE — the mini-boss arena). Rooms in `src/data/rooms/mirror*.ts` +
  `untrueImage.ts`, registered in `levelGraph`. Grace Burst is force-granted on entering any `mirrors`
  room (`GameScene.create`) so the biome can never soft-lock + is jumpable via `__gotoRoom`.
- **Mini-boss "THE UNTRUE IMAGE"** (`enemyRegistry` kind `mirrorboss`, elite) — your reflection at
  its worst; reuses the Warden's armored telegraph kit (charge / overhead slam / punishable recovery)
  with an icy tint, but its **own** `RunState.untrueImageDefeated` flag so it's independent of the
  Warden. Felling it → the **"THE HOUSE OF MIRRORS — COMPLETE"** overlay (area-aware in
  `showWinOverlay`). The arena seal/intro generalized from `room.id==='gate'` to "any room with an
  undefeated elite" (`undefeatedEliteSpawn`); doors are sealed while `bossActive`; `Enemy` emits its
  `kind` with `guardian-defeated` so `onGuardianDefeated(kind)` routes Warden-vs-UntrueImage.
- **Wall mirrors are real PixelLab art** — an ornate gothic broken-mirror pane generated via
  `mcp__pixellab__create_1_direction_object` (id `20749124`, downloaded through the reachable
  `api.pixellab.ai/mcp/objects/<id>/download`), trimmed by `tools/pack_mirror.py` → `decor/mirror.png`,
  placed via a new decorative `mirror` spawn type (`Spawn.scale`; `GameScene.makeMirror`, depth 8 set
  into the back wall, faint shimmer). Source kept in `art_src/mirror/pane.png`. **PixelLab makes the
  mirror OBJECT; it can't make the parallax scene** — that stays procedural.
- **BIO-02 6-enemy roster (DONE)** — all in `enemyRegistry` + placed across the mirror rooms:
  • **Mirror Double** (`mirrorDouble`, behavior `mirror_double`) — THE headliner: wears the **player
  sprite** (icy tint, `player-run`/`-attack1`/`-attack3` anims) as your reflection; relentlessly
  shadows you and **leaps with your own finisher**, but is glass — `shatter:true` (one-two hits → a
  shard burst). • **Reflection Hound** (`pursuer`, fast). • **Glass Witch** (`flyer_ranged`, 3-shard
  fan). • **False-Face Duelist** (`heavy_telegraph`, quick punishable). • **Fracture Wisp**
  (`flyer_ranged`, `splitInto:{fractureShard,3}` — bursts into shards on death; scene spawns them via
  the `enemy-split` event). • **Looking-Glass Sentinel** (`heavy_telegraph`, `frontImmune` — blades
  glance off its face unless you flank it or catch its recovery; Grace-Burst-behind is the answer).
  New `EnemyConfig` flags `shatter`/`frontImmune`/`splitInto` + the `mirror_double` behavior in
  `Enemy.ts`; the non-headliner roster shares the existing PixelLab sheets (crawler/spark/striker)
  tinted per the documented placeholder approach — **distinct mechanics, shared art for now**.
- **Preview sandbox** `mirror-preview` (`__gotoRoom`) still grants Grace Burst over an air-dash gap.
  **Next:** the mirror **gimmicks** (reflective floors, breakable/shattered mirrors, gravity arches,
  distortion fog, obelisks, hanging mirrors); dedicated **art sheets** for the roster (they share
  tinted placeholders today); and reskinning The Untrue Image to a true player-reflection sprite.
  Build against the concept sheet + `docs/LEVEL_DESIGN.md`. Dev hooks `__setRun(partial)` /
  `__killBoss()` help test gated paths.

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
