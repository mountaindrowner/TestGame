# Enemy & Boss Art Spec (BIO-01)

> **Status:** only the **Impulse Runner** has real PixelLab art today. The Crawler,
> Spark, Striker and Warden currently **reuse the Runner sheet with a tint+scale**
> placeholder (see `enemyRegistry.ts` `tint`), because this remote sandbox's network
> is **GitHub-only** and can't download PixelLab frames. This spec is what to
> generate when on an open network (or locally), so the look is intentional.

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
