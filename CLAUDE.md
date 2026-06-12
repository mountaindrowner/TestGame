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
- **Dodge-roll (Dead Cells-style evade):** the dash IS the roll — we didn't add a second evade
  button. The ground/air dash now (a) drops to a **low-profile hurtbox** (`PlayerTune.dashBodyH`)
  so high/overhead attacks whiff mid-dodge, (b) keeps its i-frames, (c) already cancels a swing,
  and (d) supports **dodge-offset**: dash out of an attack and the next strike **resumes the combo**
  where you left off (within `dashDurationMs + dodgeOffsetMs`; `Player.dodgeStep/dodgeUntil`). Air
  dash stays the Grace Burst. Touch button relabeled DODGE. (First of the Phase-1 combat-feel pass.)
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
- **Player art (HD upgrade — DONE):** the rigid old sprite was the problem — the original
  "Hollow Revenant" (`d6e11e94`, 48px **standard-mode** = template-skeleton clips → stiff). It's
  now the **"Hollow Revenant HD"** (PixelLab id `2a16dbc2-…`, **v3** highest-quality, **64px source
  → packed 98×68**, `PlayerTune.scale 0.68`). Identity held (same cloaked figure, glowing broken
  blade, dark + cyan neon); Mark chose the dynamic/flowing-cape candidate over the somber one. A
  **full emotive v3 animation pass** (1 ref + N animated, east only, ~31 gens): idle/run/jump/
  **runjump**/fall/dash/hurt + **3 attack swings** + death + rest/weary. The **3-hit combo**: 1 =
  fast overhead chop, 2 = pull-back heavy horizontal slash, 3 = explosive crouch→leap forward-thrust
  finisher (wired in `PlayerCombo`/`PlayerAnims`). The long-idle "waits" poses (`player-rest`;
  `player-weary` below half HP) are gated in `Player.updateAnimation` via `idleSince`.
  `__poseScene({anim,progress})` poses any clip.
  - **scale 0.68 is deliberate**: keeps the on-screen size AND world collision body identical to the
    old 45×43 sprite (`bodyW/H` in *frame* px chosen so px·scale ≈ old 12×28 world), so **no room/
    physics retuning** — a pure fidelity bump. The Mirror Double inherits the new sprite automatically.
  - **GOTCHA (mobile texture cap):** `pack_player.py` lays the sheet as a **grid** (40×3, 3920×204),
    NOT one long strip. A single-row HD strip is ~10.8k px wide — past `GL_MAX_TEXTURE_SIZE` on many
    mobile GPUs (4096) and the headless renderer; the texture silently fails to upload and the player
    renders as a **black quad**. Keep both sheet dims < 4096. Phaser numbers spritesheet frames
    row-major, so `PlayerAnims` ranges are layout-agnostic.
  - **GOTCHA (v3 reference frame):** every v3 animation ships a shared neutral `frame_000` (identical
    across all clips) — `pack_player.py` **drops it** so looping clips don't hitch and one-shots start
    on motion.
  - Pulled via `tools/fetch_enemy_art.py` (`player` entry: new id + action-slug keywords), packed by
    `tools/pack_player.py` (union-bbox, feet-anchored, grid). Run cadence speed-coupled; squash via
    `PlayerTune.*Squash`. (Old `d6e11e94` kept in PixelLab for provenance, no longer referenced.)
- **Player hit/attack boxes (improved):** the **hurtbox** is a slim, fair, chest-height body (~12×28
  world, forgiving vs the ~39px-wide figure). The **attack boxes are generous weapon-arcs** — sized a
  touch LONGER than the drawn blade (measured ~24/33/33px → boxes **32/44/54** reach, finisher
  longest to sell the heavy cleave), centred at chest height (`PlayerTune.attackCyFactor`) with a
  small **back-margin** (`attackBack`) so point-blank foes still connect. `Player.attackBox()` is the
  shared seam (fire + per-frame reposition); the crescent visual scales with `PlayerCombo[].arc` to
  match. Verify live with the debug overlay (\` key) — orange = attack box, green = hurtbox.
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
- **HUD is a crisp DOM/CSS overlay** (`UIScene` builds `#hud`, not drawn in the pixel canvas, so text
  is sharp + cohesive): a health bar that color-shifts blood→molten→grace, a souls gem + tally, the
  area name + Broken Memory pip, a centered boss bar + name, transient hints (pill), the defiant death
  line, and a tiny build stamp. Driven by the same GameScene events (which survive `scene.restart`);
  removed on UIScene shutdown. (The in-canvas Tutorial legend is still pixel-art — opener only.)
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
- **Home-screen access + minimap (DONE):** the title menu now offers **BEGIN / MAP EDITOR / SOUND**
  (`TitleScene.openEditor` → `EditorScene`; the editor's **← MENU** button returns). *(Gotcha fixed:
  `TitleScene` reuses its scene instance, so `create()` now resets `items/options/index/...` — else
  stale destroyed Text objects lingered and `refresh()`'s `setColor` threw `drawImage` on a freed
  texture.)* A **fog-of-war minimap** lives top-right (`UIScene` `#hud .hud-map` canvas): GameScene
  emits `map` (world model: per-sub-room rects + discovered set + current) on entering a new region
  and a throttled `map-pos` (player dot); it draws only **discovered** sub-rooms at their true
  composed-world positions (so the shape grows as you explore), current room lit, player a gold dot.
  Discovery lives in `RunState.discovered` (persists across runs — metroidvania map memory; revealed
  via `checkSubRoom`/`run.discover`). Ducks during boss fights; **M** folds it; souls counter moved
  below it.
- **Level editor (`EditorScene`, open with `?edit` or the title's MAP EDITOR):** an in-engine dev-kit that renders any room
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
  `Enemy.ts`.
- **Roster art is now REAL PixelLab art** (no longer tinted placeholders) — each of the five
  non-headliner enemies is its own side-view PixelLab character baked from the concept sheet, packed
  by `pack_enemy.py` like the BIO-01 family: **glassWitch** (48×52: run/fire/hurt — a hooded violet
  caster with a glowing-blue cast), **reflectionHound** (65×35 quadruped: run/hurt — a spiked
  crystalline beast), **falseFace** (51×52: run/strike/hurt — bladed duelist), **fractureWisp**
  (34×44: run/hurt — pale teal spirit; its `fractureShard` children reuse this sheet, paler+tiny),
  **lookingGlass** (62×65: run/strike/hurt — bulky **mirror-shield** sentinel). IDs in
  `docs/ENEMY_ART_SPEC.md`; pulled by `fetch_enemy_art.py` (east frames), sizes in `assetManifest`,
  ranges in `Animations.ts`, wired in `enemyRegistry` (tints dropped). The Mirror Double still wears
  the player sprite (its identity).
- **Preview sandbox** `mirror-preview` (`__gotoRoom`) still grants Grace Burst over an air-dash gap.
  **Next:** the mirror **gimmicks** (reflective floors, breakable/shattered mirrors, gravity arches,
  distortion fog, obelisks, hanging mirrors); and reskinning The Untrue Image to a true
  player-reflection sprite. Build against the concept sheet + `docs/LEVEL_DESIGN.md`. Dev hooks
  `__setRun(partial)` / `__killBoss()` help test gated paths.

## Phase 1 — the roguelite loop (DONE, this pass)
The "combat-feel + run-structure" pass. The dodge-roll (earlier) was its first beat; the rest:
- **Grace Nova — the active skill** (`L`/`C`, touch **NOVA**): a radiant burst that staggers,
  damages and repels every foe in `Skill.novaRadius` + pops projectiles (`GameScene.castNova`).
  9s cooldown shown as a HUD pip (`skill-cd` event → `UIScene` refill+glow). Reuses the elite
  `takeDamage(core=true)` long-stagger. Punches the camera on release.
- **Grace Embers — in-level run-scoped boosts** (the Dead-Cells "scroll"): an `'ember'` spawn is a
  floating flame; touch it and a paused DOM overlay (`showEmberChoice`) lets you CHOOSE EDGE OF GRACE
  (+15% blade) / BREATH OF LIFE (+25 max life, restored) / KINDLED SPIRIT (nova −25% cd). Stored in
  `RunState.embers` (+ `embersTaken` so a taken ember stays gone for the run), folded by
  `deriveUpgrades(graces, pacts, embers)`, re-applied live. Placed: first-fall outcrop, descent climb,
  the Hidden Vault. Tunables in `Tunables.ts` (`Skill`/`Ember`).
- **THE PLACE OF RETURN — the hub** (`HubScene`): every run begins and every death ends here — the
  grace-beam, the cloaked figure resting in the light, the **ALTAR** (the persistent graces moved here),
  **DESCEND**. Death no longer respawns in place: world darkens → the defiant line → you wake at the hub.
  **`RunState.reset` now KEEPS the permanent** (graces, pacts, unlocked moves) **and banks souls**;
  run-scoped state (key, felled wardens, embers, health) resets and the route is walked again. Title
  BEGIN → hub; area-complete → hub. Dev hooks `__hub(died?)`, `__die()`, `__ember()`, `__zoom()`.
- **BIO-01 rebuilt to dramatize the signature beat** — the run now **opens on the FALL**: you wake
  mid-air atop a 40-tile carved shaft and drop past torches to land among a **broken altar** (collapse
  made literal), then a teaching corridor east (runner → molten scar taught small+lit then escalated to
  a real jump → an optional double-jump ember perch). New **THE HIDDEN VAULT** = the planted Grace-Burst
  gate (its crossroads door is reachable turn one; a wide molten lake under a dropped ceiling bars the
  prize until you return with the air-dash). Crossroads shows that sealed door (the "come back" tease);
  A Buried Memory gained a **shortcut door** to the gate (loop, not dead-end); the Sealed Gate is now a
  torch-lit western approach opening into the Warden's arena. All rooms pass the editor validator.
  (`buildFirstFall()`'s dead grid removed from `roomData.ts`; `rooms/firstFall.ts` owns it.)
- **Vibe pass — the crunch:** `JuiceSystem.zoomPunch()` (fast dolly-in, slow settle, tracks rest zoom,
  never stacks) fires on the **combo finisher** + big hits (core/kill/elite, `Player.isFinisher`) and on
  the Nova; heavy hits also take the longer hitstop.

## BIO-01 re-cut WINDING (Dead-Cells metroidvania pass)
Mark: "make this like a metroidvania — winding passages like a Dead Cells playthrough." The flat
spine corridors are now SWITCHBACK ASCENTS through carved catacomb tunnels, verified by the
traversal gate (reachable, no traps, real elevation), the spine net-CLIMBING toward the light:
- **descent (THE LOWER VAULTS)** 54×30 — three offset tiers: arrive low west → fight east → climb
  a laddered shaft → switch BACK west along the middle tier → climb again → run east along the top
  to a higher exit, with a high GRACE-EMBER pocket above. Mandatory climb (48% vertical journey).
- **crossroads (THE CROSSROADS)** 56×26 — a winding branch HUB: climb in from the low west into a
  central junction where three ways open — **down** THE PIT to the buried memory, **up** the nook
  shaft to the Hidden Vault, **east** over the pit to the approach. The through-path ascends.
- **approach (THE LONG APPROACH)** 40×22 — the breather, now a gentle 3-up colonnade climb (no
  combat) up toward the gate, east mouth higher than west.
Composes 260×58, all 7 rooms, the spine profile climbing (descent oy28 low → gate oy4 high). KEY
RULE learned: seam mouths must reach the room EDGE (a mouth at x8-51 in a 56-wide room never seams
— approach/gate silently dropped from the compose until the hub carve reached x55). The east/west
mouths can sit at DIFFERENT heights (the compositor aligns each seam independently) → that's how the
spine ascends. NEXT: same winding pass on the Court (court.ts) + BIO-02 mirror rooms.

## The grasping depths (lava → a pit of skeletal hands) + map = playability inspector
Mark's playtest of the whole-map view: "I don't like that the lava sits on top, and I don't like
that it's lava — it should be a pit of skeletal hands trying to drag the player down." Plus: use the
map to find flaws (inaccessible spots, too-high jumps) + fill empty space.
- **THE GRASPING DEPTHS** — the molten HAZARD is re-themed (still `Sem.MOLTEN`, so every level/
  traversal rule is unchanged): the depths `molten()` tile (`gen_tileset.py`) is now a dark grave-pit
  (near-black void, pale bone shards, finger-bones clawing at the surface, cold necrotic seam). A new
  **`GraspPit` system** (`src/systems/GraspPit.ts`) scans a room's molten band and swarms animated
  **skeletal arms** (`gen_props.py` `hand`, 6-frame reach/claw/sink, `hand-reach` anim) along it,
  desynced; when the figure passes over a pit the nearest arms LUNGE up + claw faster (the world
  reaching to drag the penitent down — cosmetic; the pit's contact damage is unchanged). Wired in
  GameScene like GroundDecor (depths/court biome). **first-fall** no longer has surface scars — the
  two hazards are now recessed PITS (`carve` down 3, molten at the bottom) you leap or fall into.
- **Map = playability inspector** — `tools/render_map.py` now overlays REACHABILITY from the
  traversal gate (`reachMap(env,assumed)` in `traverseValidate.ts`): every reachable standable cell
  gets a faint green wash (the playable area), and any **DEAD standable cell** (open floor no movement
  reaches = inaccessible/empty flaw) a red wash — so the map shows at a glance that the playable space
  covers all the content with no dead zones. Hazard (molten) cells are excluded from `dead`. `npm run
  map` regenerates `/tmp/map-<env>.png`. STILL OPEN from Mark's notes: fill sparse/empty rooms with
  more content (a density pass) — the map shows where.

## The TRAVERSAL GATE (3rd validator — the one that walks the tiles)
Mark's playtest exposed the gap: the logic gates validated the PLAN + the GRAPH, never the
GEOMETRY — he softlocked in a sealed ember nook in THE LOWER VAULTS and called the spine "a
flat walk to the boss." `src/data/traverseValidate.ts` → `validateTraversal(env, assumed)` now
simulates real movement over the composed world (flood fill: walk/step, jump-up ≤6 = double-jump
5.9 + auto-mantle, gaps ≤5 base / ≤8 grace-burst, rising diagonals, fall-landing; molten = passable
support — burns never kills; one-way platforms passable from below). Checks: **unreachable**
required spawns (keys/gates/doors/elites 🔴#4) + embers (burst kit, 🔴#5) · **TRAP POCKETS**
(reachable, no way back — softlock) · **sealed pockets** (mantle-traps/dead space, notes) ·
**JOURNEY metrics** (BFS the critical path: % elevation, longest flat stroll — the "boring
corridor" detector). Wired into `describeScore` (a `terrain` line; passes the score's `assumed`).
**It found ~12 real bugs on first run** (then fixed): the descent nook (sealed + mantle-trap),
the crossroads→vault chain (nook 6-up unreachable, shaft started 14 rows up → `climbShaft(51,0,15)`
to the floor), both 5-wide pits forcing 6-tile max-jumps (→ 4-wide), court-dock/evidence shafts
starting 10-11 rows up (real softlock trap → laddered to the floor), mirror-rise's exit approach
OVERHUNG with 1-row headroom (unstandable → ledge shifted east + clear step), mirror-hall's east
platform out of reach, court spine 0% elevation over 185 tiles (→ plinth/dais/trench/dip carved in).
All three envs now pass ✓ clean. Model gotchas: StaticBody-style wrap bug in the path BFS (negative
x wraps a row — bounds-clamp), `pathMetrics` counts gap-jumps as non-flat. `debugJourney(env)`
returns the measured path for visualization. NEXT: editor overlay of reach/journey; run on `gb:*`
greyboxes at scaffold time.

## Seamless world (loadless environments — IN PROGRESS)
Mark's direction: **no fading at all, a camera that just follows the player, each environment
one massive map that requires no loading.** Approach = **compose each environment's rooms into
ONE big map at build time** (the whole area is only ~5 rooms, so it's all resident — no streaming).
- **`src/data/worldComposer.ts` → `composeWorld(roomId): WorldData`** — BFS over the SAME-biome
  **edge links** from any room (links are reciprocal, so BFS from anywhere covers the component);
  each neighbour is offset so the linked openings abut — **floors aligned** for east/west seams,
  **opening-centres aligned** for up/down. Stamps every room's tiles into one merged grid (solid
  rock fills gaps), offsets all spawns, keeps exactly one player spawn, and returns `placements`
  (per-sub-room bounds + name) + `entries` (a spawn per sub-room for dev jumps). Cross-biome links
  and **door** spawns pointing outside the composed set are preserved as transitions.
- **`GameScene` loads the composed world** (`composeWorld(roomId)`; the editor Play-test still loads
  the single room via `fromEditor`). Intra-world edge links are dropped → **walking across a seam is
  seamless, zero fade** (verified: ~39 tiles of continuous travel descent→ across seams, `__loads`
  counter never bumps). Camera follows, bounds = the whole world.
- **Boss arena is world-space now:** don't arm on load — `checkArena()` arms (seal + Mega-Man intro)
  the moment the figure enters the elite's `placement`; the seal is a **physical invisible wall**
  (`arenaWall`) at that sub-room's western edge so you can't walk back out (verified: pushing west
  holds you in; kill lifts it). `placementAt(x,y)` is the world→sub-room lookup.
- **Per-region HUD name:** `checkSubRoom()` re-emits `room-name` as you cross between sub-regions, so
  the one map still names its places (THE FIRST FALL → THE LOWER VAULTS → THE CROSSROADS → …).
- **Vertical seams now compose too (DONE — every branch is seamless, no fades anywhere).** The
  door-linked branches were re-authored as real walkable openings + up/down edge links, stitched by
  `Room.climbShaft(cx,yTop,yBottom)` — a vertical shaft laddered with **2-wide footholds alternating
  every 3 rows** (a single base jump ~3.4 tiles clears each; you climb the zigzag diagonally, open air
  above each nub → no head-bonk), top/bottom edges left clear so the compositor reads the opening.
  • **BIO-02 = one vertical tower:** mirror-hall+gallery (horizontal base) → **climb up** rise →
    threshold → untrue-image (173×94). Each lower room got a top climb-shaft over its old up-ledge +
    a bottom entrance hole (flanked by floor); Grace Burst is granted throughout so the climbs are
    forgiving. • **BIO-01 = spine + two vertical branches** (228×66): crossroads `down`→**memory**
    (a **5-wide floor PIT** — walk in to drop to the buried memory, or jump it to pass; verified the
    drop AND the no-Grace-Burst climb-out both work) and crossroads `up`→**vault** (climb the nook
    shaft up into the Hidden Vault; its molten lake still needs Grace Burst). The old memory→gate
    shortcut + all the branch doors were removed (the spine is already continuous).
- **Arena seal is edge-aware** (`sealArena` + `openSpanRow/Col`): seals whichever edge the figure
  entered by — a vertical wall at an open WEST edge (the gate) OR a floor across an open BOTTOM hole
  (untrue-image, climbed up into). **Compositor down-link fix:** place the neighbour below by THIS
  room's height (not the neighbour's). Dev: `__loads` counts scene builds; `__gotoRoom(id)` spawns
  on safe floor (a standable-tile finder, never a hole/lake) at that sub-room.
- **STILL A SEAM:** only **cross-environment** transitions remain (BIO-01 gate → Sanctuary → BIO-02),
  which are deliberate set-pieces (the lift cinematic), not in-environment loads. Within an
  environment there are now **zero fades**.

## Level Score system — intentful levels as a checkable timeline (DONE, this pass)
The "engineer a level philosophy (Castlevania-style) with a logic gate for exploration + payoff"
ask. Levels are now authored as a **declared timeline of beats** built toward an outcome, and a
**logic gate** proves the timeline delivers before art. Pipeline: **declare → validate → visualize →
scaffold → refine → build.** Full philosophy: `docs/LEVEL_GRAMMAR.md` (the engineered layer over
`LEVEL_DESIGN.md`; the gate's warnings cite that doc's §/#).
- **Schema `src/data/levelScore.ts`** — a `LevelScore` per environment = an ordered `Beat[]` (the
  timeline of MOMENTS). Each `Beat`: `{ room, role, intent, emotion, elevation, tension(0–1),
  teaches[], tests[], lock?, grants?, payoff?, optional? }`. Roles = `arrival·teach·escalate·branch·
  gauntlet·breather·gate·reward·finale`; emotions = `collapse→stalked→choice→struggle→grace→mastery→
  ascent`. Facets are the teach→escalate atoms (jump/combo/molten/grace-burst/telegraph-heavy/…);
  lock+grant model lock-and-key (an OPTIONAL beat locked behind a key granted LATER = the planted
  come-back, §4.2). **Both shipped areas are authored as scores** (`firstFallScore`,
  `houseOfMirrorsScore`) — the worked examples to copy.
- **Logic gate `src/data/scoreValidate.ts` → `validateScore`** — the experiential counterpart to
  `roomValidate` (structural). Composes the real world and checks: coverage (every sub-room has a
  beat), **teach-before-test** (a facet's debut is a teach, never a test, #8), **lock-and-key
  solvability** (walk the critical beats banking keys → no softlock #4; planted come-backs must pay
  off; no unobtainable lock), **payoff** for every detour/reward (#5), **wave pacing** (arrival
  gentlest, finale peak, the path climbs, long levels need a breather, no 4-in-a-row slog, §3.2/§3.6),
  one-new-facet-per-room (§5.3), and emotional-arc coherence. `error`=🔴 broken, `note`=advisory.
  Both areas pass ✓ with **0 notes**.
- **Timeline readout `describeScore`** — renders the score as a strip: ordered beats + a tension
  **sparkline** + the key/lock graph (`*`=planted come-back) + the verdict. The "timeline of moments"
  made visible. `__score(env)` prints one; `__score()` prints all.
- **Scaffolder `src/data/scoreScaffold.ts` → `scaffoldScore`/`scaffoldToStore`** — intent → GREYBOX.
  Each beat becomes a blocky catacomb room seeded with role/facet markers (the taught enemy on solid
  ground, the hazard over a pit, the Grace-Burst lake, the key on a pedestal, the elite+gate); critical
  beats chain **east** into a spine, optional beats hang **below** as drop-branches (pit + climbShaft) —
  the same shape as our hand-built areas, so it composes via `composeWorld`. `__scaffold(env)` writes
  them to the override store under `gb:<env>:<room>` ids (never touches shipped rooms); then
  `__gotoRoom('gb:<env>:<first-room>')` walks the skeleton and `?edit` refines it. Greybox-before-art
  (§0.3) automated — a playable first pass to prove the *sequence* is fun, then shape by hand.
- **Editor integration (DONE):** the Map view (`?edit` → 🗺) now mounts a **LEVEL SCORE panel**
  (right side): pick an environment → the full timeline readout renders live, and **⚒ Scaffold
  greybox** writes the `gb:*` rooms and drops the editor straight into the first beat for refining.
- **BIO-01 breather (DONE — the gate's own advisory, answered):** new room **THE LONG APPROACH**
  (`approach`, `src/data/rooms/approach.ts`) between crossroads and gate — a quiet vaulted
  torch-colonnade hall, zero enemies, the trough of the wave (§3.6) before the Warden. Spine links
  re-routed (crossroads east→approach→gate); the crossroads archer moved west of the seam so the
  hall stays quiet; the `approach` breather beat added to `firstFallScore` (7 beats, ▂▃▄▅▅▂█).
  BIO-01 now composes 264×66/7 sub-rooms.
- **Verified:** both scores pass the gate with 0 notes; the editor panel + Scaffold button work
  end-to-end (panel renders the timeline; scaffold → 7 `gb:` rooms → editor opens the first);
  the hall plays seamlessly in the composed world; no console errors.
- **BIO-03 "The Court of Condemnation" — authored SCORE-FIRST (the pipeline's first level):**
  `courtOfCondemnationScore` (Shame route 3rd: First Fall → House of Mirrors → Court → The Accuser).
  Declared as an 8-beat timeline BEFORE any room exists; the logic gate passes it (✓ 0 errors,
  tension ▂▃▄▅▅▆▂█), and `__scaffold('court-gate')` greyboxes all 8 rooms (composes 204×32, plays
  clean). Signature gimmicks GAVEL (timed verdict-crusher) + VERDICT-GAZE (judging spotlight); key
  = **Witness Mark** (opens the High Tribunal); boss **THE ACCUSER** grants **Quiet Flame** (back-
  unlocks the planted Sealed Evidence vault). Full room table in `docs/WORLD_PLAN.md` (BIO-03).
  `validateScore` now skips coverage for a not-yet-built env (declare→scaffold→build).
- **BIO-03 is now BUILT + WIRED (this pass):** the 8 rooms are real code (`rooms/court.ts`,
  seamless 192×52; witness stand above the dock, sealed evidence below the gauntlet) and the gate
  passes with FULL coverage (0E/0N). **Signature gimmicks implemented** as data-driven spawns:
  `gavel` (hold→tremble telegraph→slam→rest→rise; `period`/`phase` extras; damages only while
  falling) and `gaze` (roaming spotlight; catch→620ms gold lock→verdict bolt at the locked column;
  `range` extra) — both in GameScene (`makeGavel/makeGaze/updateCourtHazards`). `flameseal` spawn =
  the Quiet-Flame barrier (full-passage static wall + hint; opens silently when `run.quietFlame`).
  `key` spawns take `grant:'memory'|'witness'` → `RunState.witnessMark`. **THE ACCUSER** =
  `accuser` elite kind (warden kit, verdict-gold tint, slower/harder windups, own
  `accuserDefeated`); its fall grants the PERMANENT `quietFlame` (kept by `RunState.reset`).
  Gates declare their needs by id (`gateNeeds`): `final`=memory+warden, `mirror-final` (NEW, in
  untrue-image — opens on the Untrue Image's fall → lift → Sanctuary → court) and `court-final`
  (witness-mark+accuser → THE COURT OF CONDEMNATION — COMPLETE overlay).
  **GOTCHAS fixed en route:** (1) `StaticBody.updateFromGameObject()` AFTER `setSize` resets the
  body to the GO's 2×2 dot — the arena seals + flameseal were silently tiny; setSize LAST. (2) the
  restart-teardown checklist strikes again: `bossActive/arenaSeals/gavels/gazes/pendingArena/...`
  must reset in create() (stale `bossActive` from a prior arena stopped the next one arming).
  (3) UIScene clears the boss bar on `room-name` (dev-jumps out of an armed arena left it stuck).
  Dev hooks: `__run()` (read run state), `__tp(x,y)` (teleport), `__arena()` (seal probe).
  NEXT for the Court: its own roster + tileset/parallax art (Bailiff = tinted Striker today).

## Presentation & economy (Dead-Cells-inspired pass, from Mark's playtest notes)
- **Boot flow:** Boot → Preload (a real **LOADING** screen: bar + %) → **TitleScene** (the menu)
  → GameScene. `TitleScene` drifts the depths parallax behind a glowing **REPENTANCE** title +
  tagline, a keyboard/pointer menu (BEGIN / SOUND toggle) with **menu-move + select SFX**
  (`Sfx.uiMove/uiSelect`), and a brief "ENTERING THE FALL…" loading beat; **BEGIN resets the run**.
  `?play` skips straight to GameScene (the screenshot harness + `npm run shot` use it); `?edit` →
  editor. The DOM `#boot` splash is cleared by whichever scene shows first (now TitleScene too).
- **Tighter camera:** internal res is now **384×216** (was 480×270) — a ~1.25× zoom, framing the
  action closer. Everything keys off `World.internal*` / `scene.scale.*`, so it was a one-spot change.
- **Currency + breakables + healing** (a real reward loop): foes **drop souls** on death (the elite a
  small fountain + a life orb; `Enemy` emits `enemy-killed` → `GameScene` spawns drops), which **magnet
  to the player** and tally in a **HUD soul counter** (`RunState.souls`, top-right gem). Breakable
  **urns** (`jar` spawn type; `GameScene.makeUrn`/`breakUrn`, shattered by the blade hitbox) shed souls
  + sometimes a **life orb** (`Player.heal`). Prop art from `tools/gen_props.py` (soul/heal/urn). SFX:
  `Sfx.pickup/heal/shatter`. Urns placed across mirror rooms + crossroads.
- **Attack-only damage (DONE):** touch no longer hurts — an enemy damages the player only during the
  committed frames of an attack (`Enemy.isAttacking()`: lunger=chase, heavy=strike, mirror_double=leap,
  flyers=projectiles only). `CombatSystem.onContact` gates on it. To keep chasers dangerous, the
  **pursuer** (crawler / Reflection Hound) gained a telegraphed **lunge-bite** (windup→strike→recover;
  `attackRange` in tune, defaults in code). Verified: idle/touch = 0 dmg; attacks still land.
- **Boss → next area (DONE):** the gate is a stone **PORTCULLIS** (frame + lintel + bars; `drawGate`)
  that glows grace + shows a pulsing **"↑ ASCEND"** prompt once unlocked (Memory + Warden down).
  Pressing ↑ runs `rideLift()`: the **bars grind up** and a **stone lift carries the figure up and out
  of frame**, then it travels to the next area (a cinematic, not the instant fade). Hints are directive
  (post-Warden, sequenced after the Grace Burst hint; locked = where to find the Broken Memory).
  `__health()` dev hook reads HP.
- **The Sanctuary (DONE) — interim upgrade space between areas** (`SanctuaryScene`, a crisp DOM panel
  over a drifting backdrop; the lift rises INTO it — `rideLift` → `SanctuaryScene{next}` → the area).
  Two halves (`src/data/upgrades.ts` is the catalog): the **ALTAR** kindles persistent, leveled
  **graces** with souls — **Vigor** (+max life), **Edge** (+strength), **Grace** (+air-dash/leap),
  **Gather** (soul magnet + bonus); the **STRANGER** grants one-time **pacts** (% boons: Fury/Swift/
  Hunger/Fortune/Bulwark/Resolve), **lifetime-capped at 4**. `deriveUpgrades(graces,pacts)` folds them
  into concrete stats; `Player.applyUpgrades` (maxHealth/damageMult/moveMult/airDashes) + GameScene
  (magnet range, +souls, leech-on-kill) apply each room. Stored in `RunState.graces/pacts`; **DEPART**
  full-heals (grace renews) and continues. Theme = grace *given* for what you carried out, not power
  bought. Dev hook `__sanctuary(next?)`.
- **Ambient life (DONE, partial):** `src/systems/Ambience.ts` — a faint screen-fixed **surface-dust**
  haze drifting up top + a few **critters** (a tiny beetle, `prop-critter`) scuttling along the lowest
  ledges (deterministic per room, rest/dart states, clamped to their ledge span; depth 15, cosmetic).
  Created per room in `GameScene`; `ambience.update(time, delta)`. **Cobwebs** (`prop-cobweb`) hang in
  the two upper corners (Ambience scans an interior column for the ceiling underside; faint, depth 12).
- **Lighting + deep shadow (DONE):** `src/systems/Lighting.ts` — a screen-space shadow layer
  (a `RenderTexture`, depth 85, re-filled each frame, biome-tinted warm/cold) that light POOLS erase
  back out of: the figure always carries a readable pool; torches + the gate are warm/static lights
  (gentle flicker). So the near edges are lit and the depths recede into shadow. `lighting.update(cam,
  px, py)` per frame, world→screen via `cam.scroll`. Cheap (one fill + a few erases).
- **Ledge-grab / auto-mantle (DONE):** airborne + falling beside a solid ledge lip (pressing toward,
  or flush against, the wall), the figure grabs the edge and climbs up onto it (`Player.handleLedge`
  scans a small hand-height band for a lip = solid at hand + open just above + clear landing;
  `beginClimb` disables the body and tweens a grab→pull-up; `solidAt` query from GameScene, solid
  WALLS only — one-way platforms you land on). It fires wherever a wall/ledge top is at the edge of a
  jump; it'll shine once the **catacomb** grammar gives grab-height architecture. `mirror-preview` has
  a grab-test wall; dev hook `__ppos()` reads player position. NOTE: variable jump height means a
  *tapped* jump barely rises (cut short) — hold jump to reach a lip.
- **Catacomb level grammar (ROLLED OUT across both areas):** the Room builder has `fill()` +
  `carve(x,y,w,h)` — a room starts as **solid rock** and the path is **carved** out (the autotiler then
  walls/floors/ceilings the passages). Proof: `catacombs` (`__gotoRoom`). **BIO-01 fully re-authored as
  carved catacombs:** `first-fall` (now its own file `src/data/rooms/firstFall.ts` — a carved
  descending switchback with a molten scar + east exit), `descent` (humped through-passage, validated
  2-tile steps traversable), `crossroads` (carved passage + central vault for the spark + ↑door to
  memory), `memory` (closed chamber, Memory on a rock pedestal), `gate` (carved flat-floor Warden
  ARENA, portcullis on the solid east wall). **BIO-02 mirror rooms** converted `frame()/shell()` →
  `fill()`+`carve()` (thin-walled frame → thick carved rock) keeping their working shelf/door layouts.
  Verified: first-fall→descent transition fires; gate + untrue-image arenas still arm; all
  links/doors/keys preserved; build green; no console errors. (Some BIO-02 shelves are still
  block-ledges in rock rather than fully wall-attached — a later polish.)
- **Ranged enemy archetypes (DONE — now REAL PixelLab art):** two grounded ranged foes that kite to a
  standoff, telegraph, then strike. **Bone Archer** (`archer` behavior) looses a fast straight bolt
  (reuses `fireProjectile` → `enemyProjectiles`) — a gaunt pale-green skeletal undead whose `fire` clip
  draws and looses a bow (47×52). **Cinder Bomber** (`bomber` behavior) **lobs an arcing timed bomb**
  (`EnemyDeps.lobBomb` → `GameScene` spawns a gravity bomb with a ~1.5s fuse → `explodeBomb` fires an
  expanding blast into `bossHazards`, which already damages the player) — a flame-wreathed charred demon
  whose `fire` clip winds up and hurls the bomb (53×57). Both are attack-only (no contact dmg).
  `updateRangedGround(time, bomb)` drives both (plays only run/fire/hurt, so the registry maps
  `windup`→the `fire` clip); `groundAtDir` keeps them from kiting off a ledge. Placed in `catacombs`
  (test) + an archer on the crossroads spine. Sheets pulled via the proven mirror-roster pipeline (ids
  in `docs/ENEMY_ART_SPEC.md` → `fetch_enemy_art.py` → `pack_enemy.py` → `assetManifest`/`Animations`/
  `PreloadScene`/`enemyRegistry`, tints dropped).
- **The Stranger now has a face (DONE):** the Sanctuary's pact-giver is a real PixelLab figure — a
  hooded grey/violet cloaked figure (16×50, a 4-frame breathing idle) standing in a soft violet halo to
  the left of the altar panel (`SanctuaryScene.addStranger()`, screen-fixed so the backdrop drifts
  behind it). Id in `docs/ENEMY_ART_SPEC.md`.
- **Tutorial legend:** already a crisp DOM overlay (`src/systems/Tutorial.ts` mounts `#tutorial`, Dash
  Horizon font) — the old "in-canvas pixel-art" note was stale. Done.
- **Roadmap remaining (all PixelLab-art, opt-in — cost generations; Mark to greenlit before spending):**
  the archer/bomber sheets + the Stranger are now DONE (real art, integrated — see above). The only
  art item left is a **higher-res player** (~20+ gens + heavy re-integration; a prior HD player re-roll
  was *rejected* — recommend deferring). Plus optional, non-art: full wall-attached re-layout of the
  BIO-02 mirror rooms. (Generation budget: hard floor 500 remaining; ~1030 left after this art pass.)

## PC playtest pass (Mark, 2026-06-11) — landed this session
- **Crisp rendering:** Scale mode NONE + integer-snapped zoom (desktop ≥2× floors to whole
  multiples — 1080p = exact 5×; small screens keep fractional fill); `applyZoom` in `main.ts`.
  **TitleScene is a DOM overlay now** (canvas text upscales blocky — same lesson as the hub).
  Title menu: BEGIN / CONTROLS / MAP EDITOR / SOUND.
- **Player anim re-rolls (PixelLab, ~14 gens):** idle = angled ¾ heavy-breathing stance, jump =
  coil→explosive spring, fall = windswept drop, + NEW `player-climb` ledge-mantle (wired in
  `beginClimb`). Frame grew 98×68→**98×79** (grid 40×4) — manifest + `PlayerTune.frameH/bodyOffsetY`
  updated (formulas: offX=(fw-bodyW)/2, offY=fh-bodyH). Fetch keywords match the zip's
  action-DESCRIPTION slugs (not names): three-quarter/explosive_vertical/dropping_fast/mantling.
- **Real torches** (`gen_props.torch`, 12×26 4-frame strip + `torch-burn` anim + halo; desynced),
  **real lava** (molten tile = bright body + dark crust plates + white-hot surface), **ossuary urn**
  (dark stone + grace runes). **26-piece env decor set** (`tools/gen_environment.py` → `sprites/env/`,
  `ENV_GROUND`/`ENV_WALL` in manifest) scattered by **`systems/GroundDecor.ts`** (deterministic,
  floor-tops + wall faces, depths-only).
- **Flyers catchable:** lazy repositioning (gain 1.5, chase 66) + `lingerMs` post-shot drift window
  (~1s) — aggression closes the gap (SparkTune; all flyers inherit).
- **Gamepad** (standard mapping in `InputManager.readPad`; `input.gamepad` in config) + CONTROLS
  sheet on the title.
- **Still open from Mark's notes:** walking anim polish (minor), more obvious torch purpose via
  Lighting strength, BIO-02 decor set (mirrors biome gets no GroundDecor yet).

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
