# REPENTANCE — Roadmap (from Mark's Dead Cells playthrough notes, 2026-06-12)

> The working to-do list, kept in Mark's own structure. ✅ = already in the game,
> 🔶 = partly in, ⬜ = not started. Update statuses as work lands.

## 1. Overall feel — tight, snappy, fair
- ✅ Coyote time, jump buffering, variable jump height, dash i-frames — "I lost
  because of my choice" is the standing rule (GAME_FEEL_RULES.md).
- ⬜ **Sound effects pass** — quick, satisfying, Dead-Cells-sharp feedback for
  hits, jumps, landings, pickups. (Current SFX are procedural and soft.)

## 2. Player animation
- ✅ Ledge-grab mantle animation (hang → haul up → crouch).
- ✅ Standing jump vs moving jump are separate clips already; runjump exists.
- 🔶 **Idle** — new angled breathing stance is in; Mark's note: he should stay
  mostly still, NOT keep resetting to face the camera; minimal movement. Review
  against the new clip in play; tone down if it still feels busy.
- ⬜ **Walk/run polish** — smoother, more intentional walking; running should
  read differently from walking if possible.
- ⬜ **Double-jump animation** — its own clip (reuses jump today).

## 3. Platforming & movement variety
- ✅ Pass-through (one-way) platforms.
- ⬜ Crumbling platforms · climbable chains · climbable vines · **wall jump /
  kick-off-walls** · breakable doors/barriers.
- 🔶 Areas that feel like climbing buildings/shafts/mines — the winding pass
  (BIO-01 done; Court in progress; mirrors are a vertical tower).

## 4. Platforms: PC / controller / phone
- ✅ PC keyboard + gamepad (standard layout) + CONTROLS sheet.
- ✅ Touch controls exist.
- ⬜ **Mobile control study** — how Dead Cells mobile lays out buttons/abilities
  without clutter; apply the lessons (not a copy).

## 5. Mini map & overworld map
- ✅ Fog-of-war minimap — reveals as you explore, persists across runs.
- ⬜ **Overworld map in the pause menu** — opens up as the player progresses;
  give it visual personality. (The whole-map renderer is the seed for this.)

## 6. Level routes — at least two options per level
- 🔶 BIO-01 has optional branches (memory pit, hidden vault). The Court winding
  pass adds true parallel high/low roads. ⬜ Extend two-route choice everywhere.

## 7. Stage assets & environmental detail ("lived-in" rooms)
- ✅ 26-piece environment decor set scattered deterministically + urns/torches.
- ✅ **Mirrors decor set** — the House of Mirrors now has its own clutter (glass
  shards, broken frames, porcelain false-faces, violet candelabra, hanging
  shards/mirrors/drapes); both decor systems used to skip non-depths biomes.
- 🔶 **Density pass** — floor/wall coverage bumped + one-way shelves dressed
  (the playability maps showed where). ⬜ Larger set-piece props
  (crates/statues/machinery) and a Court-specific set still to come.

## 8. Foreground effects & atmosphere (per-map identity)
- 🔶 Drifting dust + fog layers exist (depths), mirror sparkle backdrop (BIO-02).
- ⬜ **Unique front-layer effect per map** — falling leaves, reflections, sparks,
  debris; one signature effect each.

## 9. Unique hazards per level
- ✅ Depths: the grasping skeletal-hand pits. Court: GAVEL crusher + VERDICT-GAZE.
- 🔶 Mirrors: gimmick set designed (breakable mirrors, reflective floors…) ⬜ build.

## 10. Metroidvania ability progression
- ✅ Grace Burst (air-dash) gates the Hidden Vault; Quiet Flame gates the Sealed
  Evidence — earn → return → unlock works today.
- ⬜ Future: wall jump, climbing, barrier-breaking, more come-back routes.

## 11. Loading screens & tooltips
- 🔶 A loading bar exists. ⬜ **Real loading screens** with artwork + rotating
  tips that mix gameplay help and lore ("Some old machines still hum beneath
  the ruins. Listen closely.").

## 12. Mid-level vendor / rest area
- 🔶 The Sanctuary (altar + Stranger) sits BETWEEN levels. ⬜ A small mid-level
  rest/vendor room inside larger levels — heal, buy, lore, breathe.

## 13. Healing system
- 🔶 Life orbs + Sanctuary heal exist. ⬜ **Flask-style limited healing** the
  player carries and spends carefully (Soulslike tension).

## 14. Boss rooms feel special
- 🔶 Arena seal + Mega-Man intro + boss bar exist. ⬜ Strong visual identity per
  arena: unique lighting/effects, environmental storytelling, more detail.

## 15. Interaction prompts
- 🔶 The gate shows "↑ ASCEND"; hints exist. ⬜ Systematize: every interactable
  shows its button clearly (doors, lifts, NPCs, lore objects).

## 16. Lore interactables
- ⬜ Statues, old machines, notes, memorials the player can read — needs the
  story fleshed out a step further (DESIGN.md is the seed).

## 17. Procedural / semi-random levels (study)
- ⬜ Study how Dead Cells assembles randomized-but-authored levels. (Our score →
  scaffold pipeline is the controlled half; runtime variation is the open half.)

## 18–19. Stage clutter & layered art status
- Layers today: parallax (far/mid/near/fog) ✅ · tile biomes: depths + mirrors ✅
  (Court reuses depths ⬜ needs its own) · decor: hanging set + 26-piece ground
  set ✅ · foreground FX 🔶 (see 8) · per-room unique details ⬜.

## 20. Communication preference
- **Keep explanations simple and readable. Avoid coding jargon unless needed;
  when a technical decision matters, teach it plainly.** (Recorded as a working
  agreement in CLAUDE.md.)
