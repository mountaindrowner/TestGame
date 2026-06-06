# Game-Feel & Level-Design Rules

> Distilled from two platformer game-feel talks (user-provided) and adapted to
> REPENTANCE. **Prime directive: every change should make the game feel better to
> play and levels more fun.** Apply whenever you write/review/refactor gameplay,
> movement, camera, level layout, or feedback/animation code. If a rule conflicts
> with something we do on purpose, **flag it — don't silently override.**
> Companion docs: `WORLD_PLAN.md` (level direction), `ART_VARIATION.md` (asset logic).

## 1. Responsiveness — predict what the player *meant* to do
- The character does what the player intended even when timing is slightly off.
- **Coyote time**, **jump buffering**, **variable jump height**, and **buffer other
  core actions** (an input pressed while busy fires the moment the character is free).
- Guard against accidental inputs (don't fire actions players commonly mis-press).
- Everything tunable via **named, exposed variables — never hard-coded**.
- **Where we stand:** ✅ coyote `coyoteMs` (~0.09s), buffer `jumpBufferMs` (~0.11s),
  `jumpCutMultiplier` (variable height), all in `Tunables.ts`; jump uses
  `InputManager.consumeBuffered`. Combo chains within `comboWindowMs`. *Open:* could
  extend buffering to dash; minor.

## 2. Movement & momentum — make it intentional
- Tight (precise/immediate) vs loose (momentum-heavy/drifty) is a **deliberate,
  documented** choice per state, with *why*. Loose/fast = freedom/joy; tight = calm/
  precision. Keep accel/decel/max-speed/gravity/friction exposed, tunable per state.
- **Where we stand:** ✅ params exposed (`runAccel/runDecel/airAccel/airDecel/turnBonus
  /maxFall`). **Our intent (now documented in Tunables):** the cloaked figure is
  **tight on the ground** (precision/penitence) with a **slightly loose, floaty air**
  (the grace of getting back up); dash is a crisp committed burst.

## 3. Micro-animations — what makes it feel "premium"
- Small secondary animations on core actions do more for feel than almost anything,
  often reusing the same logic. Every core action/transition gets visible feedback:
  walk, pivot, **squash on jump, stretch on fall, squash on land**, etc.
- When something feels flat, **prefer adding micro-animation + small tweaks over
  rewriting the mechanic.**
- **Where we stand:** ✅ dash afterimages, attack body-lean + slash arc + smear,
  land dust, hurt flash, enemy telegraph tells. ✅ **NEW:** procedural feet-anchored
  **squash/stretch on jump/double-jump/land** + a **pivot squash** on hard turns
  (`Player`, tuned by `PlayerTune.*Squash`). No new art needed.

## 4. Atmosphere — make it feel like a place
- Test: *"does this feel like a real place, or just colors on a screen?"* Impact
  particles + ambient particles, parallax, lighting — a **feel feature**, but it
  still comes *after* mechanics and layout are fun.
- **Where we stand:** ✅ ambient + impact particles, 3-layer parallax necropolis,
  the lone far flame + torches/glows as faux lighting, fog.

## 5. Level-design workflow — order of operations
1. **Mechanics before levels** (a mechanic must feel good alone first).
2. **Ideas first, fast & cheap** — many rough obstacle ideas (~20+), as guidelines.
3. **Rank by difficulty**, order so difficulty ramps.
4. **Group into a cohesive flow** of related challenges.
5. **Greybox in engine** (blocky, placeholder), no final art yet.
6. **Playtest the greybox, tweak, repeat**; final art only once layout is near-final.
7. Stay open to obstacles that emerge while building — especially ones that break up
   repetitive flow.
- **Adapting an obstacle that isn't working** — change it for one of three reasons,
  always keeping the *spirit* of the original:
  - **Camera fit** — if it doesn't read on screen, pare it down / adjust the camera.
  - **Physics fit** — if the moves aren't clean within our real jump height/grid/
    physics, redesign to fit what the engine actually does.
  - **Fun fit** — if it's boring (player can sit safe until ready), add stakes that
    force commitment and tighten timing. Target **"looks hard, is genuinely doable."**
- **Where we stand:** `WORLD_PLAN.md` gives the cohesive flow + per-room intent.
  *Open:* difficulty-ramp is implicit — make it explicit per room; rooms are authored
  data (effectively greybox-with-style), so steps 5–6 collapse for us (see §8 flag).

## 6. Priority order (when trade-offs collide)
**Feel & fun > systems/mechanics correctness > level layout > atmosphere/particles >
final art.** Never let a later item block or *disguise* a problem in an earlier one
(don't paper over a flat mechanic with nicer art). ✅ This is already our order.

## 7. Playtesting — the validation loop
- Nothing is "done" until watched in someone else's hands. Test → adjust → test.
  Watch live; read expressions/hesitation. **Don't coach.** Problems are *our* fault,
  not the player's — if players act unexpectedly, fix the design. Separate what players
  *say* from what they *do*; solve the real pain for the largest share of the audience.
- **How this maps to us (see §8):** the **user is the playtester**; their reported
  feel is the source of truth and overrides our assumptions. Treat "it feels off" as a
  design bug to fix, never as the player being wrong.

## 8. Where these rules DON'T cleanly fit us — flagged, not ignored
- **"≥5 playtesters, watched live."** Not literally achievable for a solo, AI-built
  art project — and the build agent can't even open the live page (GitHub-only sandbox).
  **Adopt the spirit:** treat the user's hands-on feedback as truth, iterate fast, never
  coach or blame the player. The "5 testers" number is aspirational, not a gate.
- **"Add art last / final art only once layout is near-final."** Partly conflicts with
  our identity: assets are **procedural + re-runnable** (`tools/*.py`) and the aesthetic
  *is* the message — so art and greybox coexist cheaply. **Keep the real intent:** never
  let art paper over flat mechanics, and gate **expensive/bespoke** art (e.g. PixelLab
  characters) behind feel-validation — but don't withhold our cheap procedural style.
- **Wall-slide / specific examples** (head-turn on wall-slide, etc.): we have no
  wall-slide yet — apply the *principle* (every state gets feedback) if we add one.
- **"Lighting system."** We fake lighting (glows/tints/flame), no dynamic light engine.
  Fine for our look; revisit only if a scene needs it.

## Definition of done — checklist
- [ ] Core actions have coyote/buffer where relevant + a matching micro-animation.
- [ ] Movement feel (tight vs loose) is intentional and tunable via exposed params.
- [ ] Level greyboxed/authored first; difficulty ramps; flow is cohesive (WORLD_PLAN).
- [ ] Any changed obstacle still honors the spirit of the original.
- [ ] The space has some atmosphere — added only after it's fun.
- [ ] The **user has played it** and the feel is confirmed (our stand-in for §7).
