// ALL game-feel constants live here. One file tunes the whole game.
// Units: pixels and px/second (Arcade physics).

export const World = {
  gravity: 900, // px/s^2
  // Internal render res — a tighter 384x216 (16:9) frames the action closer (a
  // ~1.25x zoom vs the old 480x270), Dead-Cells-style; everything keys off this.
  internalWidth: 384,
  internalHeight: 216,
  tile: 16,
};

export const PlayerTune = {
  // Frame / body  (98x68 Hollow Revenant HD — the v3, 64px-source re-roll; richer
  // emotive clips, bbox-packed feet-anchored, character centred at x=49). scale 0.68
  // keeps the on-screen size AND the world collision body identical to the old 45x43
  // sprite (visual ~41px, body ~12x28 world), so no room/physics retuning is needed
  // — a pure fidelity upgrade. Body px chosen so px*scale matches the old world body.
  frameW: 98,
  frameH: 68,
  scale: 0.68,
  bodyW: 18, //  18 * 0.68 ≈ 12.2 world  (old 12)
  bodyH: 41, //  41 * 0.68 ≈ 27.9 world  (old 28)
  bodyOffsetX: 40, // (frameW - bodyW)/2 -> centred under the figure (cx=49)
  bodyOffsetY: 27, // body spans rows 27..68 (feet at frame bottom; frameH - bodyH)

  // Horizontal movement
  // Feel intent (Game-Feel rule #2): TIGHT on the ground (precision/penitence),
  // a touch LOOSE/floaty in the air (the grace of getting back up); dash = crisp burst.
  runSpeed: 140,
  runAccel: 1700, // snappy off-the-line response (Game-Feel rule #1)
  runDecel: 1800, // friction when no input on ground
  airAccel: 1000,
  airDecel: 600,
  turnBonus: 1.7, // accel multiplier when reversing (snappy turns)

  // Jump
  jumpVelocity: -312,
  doubleJumpVelocity: -270,
  maxFall: 440,
  coyoteMs: 90, // grace after walking off a ledge
  jumpBufferMs: 110, // press jump slightly early and it still fires on land
  jumpCutMultiplier: 0.42, // release jump early -> shorter hop (variable height)
  maxAirJumps: 1, // double jump (grows later via unlocks)

  // Dash
  dashSpeed: 300,
  dashDurationMs: 150,
  dashCooldownMs: 360,
  dashIFrameMs: 170, // invulnerable window during/just-after dash
  dashAfterimageEveryMs: 18,
  // Dodge-roll qualities layered onto the dash (Dead Cells-style evade):
  dashBodyH: 22, //    low-profile hurtbox (frame px) during the dash -> ducks high/overhead attacks
  dodgeOffsetMs: 240, // after a dash cancels a swing, press attack within this to RESUME the combo

  // Attack — base/fallback values; the live 3-hit combo lives in PlayerCombo below.
  comboWindowMs: 320, // press again within this (after recovery) to chain the next hit
  attackReach: 32, // hitbox extends this far in front of the body center
  attackHeight: 30,
  attackBack: 7, // the box also reaches this far BEHIND centre so point-blank foes still land
  attackCyFactor: 0.62, // hitbox vertical centre = bodyH*scale*this above the feet (chest height)
  attackDamage: 26, // fallback if combo config is unavailable

  // Squash & stretch (feet-anchored micro-animation; origin 0.5,1 keeps the base
  // planted). Pure scale tweaks — no new art. Decay = ease-back per frame.
  squashDecay: 0.18,
  jumpSquashX: 0.86,
  jumpSquashY: 1.16,
  airJumpSquashX: 0.9,
  airJumpSquashY: 1.1,
  landSquashX: 1.18,
  landSquashY: 0.82,
  pivotSquashX: 1.12,
  pivotSquashY: 0.9,

  // Stand still this long and the figure rests the blade on his shoulder and
  // waits (a "long idle"); below half health it's the weary, battered variant.
  restDelayMs: 2600,

  // Survivability
  maxHealth: 100,
  hurtKnockback: 150,
  hurtKnockbackUp: -120,
  invulnMsAfterHit: 700,
};

// Grace Nova — the active "skill slot" (kindled at the Place of Return): a burst
// of grace that staggers + knocks back everything near the figure. Run-scoped
// KINDLED SPIRIT embers shorten the cooldown (see Ember below).
export const Skill = {
  novaRadius: 72, // world px around the figure
  novaDamage: 22, // scaled by the live damageMult
  novaCooldownMs: 9000,
};

// Grace Embers — in-level pickups (the Scrolls-of-Power beat): found in secret
// nooks / risky detours, each grants ONE chosen boost for the current run.
export const Ember = {
  blade: 0.15, // EDGE OF GRACE: +15% blade damage per ember
  life: 25, //   BREATH OF LIFE: +25 max life (and restores that much)
  spirit: 0.25, // KINDLED SPIRIT: nova cooldown -25% per ember (multiplicative)
};

// The 3-hit blade combo. Chain one→two→three within comboWindowMs for the payoff:
// a light swipe, a heavier swing, then a big committed forward cleave that hits
// hardest but is slow to recover (whiff = punishable). Damage roughly 1 : 1.5 : 2.6.
// reach/height = the attack BOX (world px). Deliberately a touch LONGER than the
// drawn blade (measured ~24/33/33px) — a generous weapon-arc like other action games,
// the finisher longest to sell the heavy cleave. The crescent visual scales with `arc`.
export const PlayerCombo = [
  { dmg: 20, reach: 32, height: 30, windupMs: 30, activeMs: 80, recoveryMs: 110, lunge: 90, anim: 'player-attack1', arc: 1.25, lean: 0.16 },
  { dmg: 30, reach: 44, height: 36, windupMs: 60, activeMs: 110, recoveryMs: 250, lunge: 130, anim: 'player-attack2', arc: 1.7, lean: 0.24 },
  { dmg: 52, reach: 54, height: 42, windupMs: 70, activeMs: 115, recoveryMs: 240, lunge: 240, anim: 'player-attack3', arc: 2.1, lean: 0.32 },
] as const;

export const EnemyTune = {
  // Impulse Runner — fast, rushes you, punishes hesitation.
  // 48x44 PixelLab art (shadow-imp ~37px tall; feet at frame bottom).
  frameW: 48,
  frameH: 44,
  bodyW: 14,
  bodyH: 24,
  bodyOffsetX: 17, // (frameW - bodyW)/2 -> centred at x=24
  bodyOffsetY: 20, // body spans rows 20..44 (feet at frame bottom)

  maxHealth: 40,
  patrolSpeed: 36,
  chaseSpeed: 138, // faster than the player's run — you must dash/commit
  aggroRange: 130, // detects the player within this horizontal distance
  aggroVertical: 56,
  windupMs: 230, // crouch-coil telegraph before it lunges (matches the 5-frame windup anim)
  contactDamage: 18,
  knockbackTaken: 180,
  coreBonusMult: 2.0, // blade-damage multiplier when striking the exposed molten core
  coreStunMs: 320, // longer stagger when the core is struck (vs 140 normal)
  edgeCheck: true, // turn at ledges/walls while patrolling
};

// --- BIO-01 enemy family (gameplay numbers only; body dims + art live in the
//     enemy registry). Each maps to a behavior tag in src/data/enemyRegistry.ts.

// Regret Crawler — slow, relentless ground pursuer; once it sees you it never
// disengages. "Regret won't let go — turn and face it." Weak point: from behind.
export const CrawlerTune = {
  maxHealth: 70,
  patrolSpeed: 26,
  chaseSpeed: 64, // slower than the player's run; you can create space
  aggroRange: 160,
  aggroVertical: 44,
  windupMs: 0,
  contactDamage: 14,
  knockbackTaken: 90,
  coreStunMs: 160,
  edgeCheck: true,
  stickyAggro: true,
};

// Shame Spark — airborne, keeps its distance, flares then fires a burst; fragile
// up close. "Shame flares from afar, strikes when you're not looking."
export const SparkTune = {
  maxHealth: 22,
  patrolSpeed: 0,
  chaseSpeed: 66, // lazy repositioning — committed pursuit CAN close the gap
  aggroRange: 210,
  aggroVertical: 170,
  windupMs: 280, // flare telegraph before firing
  contactDamage: 12,
  knockbackTaken: 220,
  coreStunMs: 120,
  edgeCheck: false,
  hoverOffset: 64, // floats this far above the player
  standoff: 130, // tries to keep this much horizontal distance
  fireEveryMs: 1700,
  lingerMs: 1050, // post-shot drift — THE window to close in and punish a flyer
  projectile: { speed: 150, damage: 12, count: 1, spreadDeg: 0, lifespanMs: 2200 },
};

// Hollow Striker — heavy, armored; long telegraph, a committed strike, then a
// punishable recovery. "Survive by patience, not aggression." Weak in recovery.
export const StrikerTune = {
  maxHealth: 90,
  patrolSpeed: 26,
  chaseSpeed: 150, // strike lunge speed
  aggroRange: 124,
  aggroVertical: 52,
  windupMs: 600,
  contactDamage: 22,
  knockbackTaken: 70,
  coreStunMs: 380,
  edgeCheck: true,
  strikeMs: 260,
  recoveryMs: 520,
  damageReduction: 0.35, // armor: chip damage reduced
};

// The Guardian — the area's elite: an armored, hulking kin of the Impulse Runner.
// Heavily telegraphed charges with a long, punishable recovery so the fight is a
// read-and-weave dance (Elden Ring / Dead Cells flavour). Armoured (chip reduced),
// but its recovery window is the opening — strike it then (coreBonusMult in registry).
export const GuardianTune = {
  maxHealth: 220,
  patrolSpeed: 20,
  chaseSpeed: 210, // the charge is fast and scary — you must commit to a dodge
  aggroRange: 230,
  aggroVertical: 100,
  windupMs: 720, // long, readable tell (rear back) before the charge
  contactDamage: 26,
  knockbackTaken: 24,
  coreStunMs: 360,
  edgeCheck: false,
  strikeMs: 360, // the committed charge
  recoveryMs: 680, // big punish window after it overcommits
  damageReduction: 0.5, // armoured plating
  // Slam: when you crowd it, it stops charging and smashes the ground — a long
  // overhead telegraph, then a shockwave that races along the floor (jump it).
  slamRange: 78, // closer than this -> it slams instead of charging
  slamWindupMs: 600, // overhead raise (readable); impact lands ~frame 8 of the slam clip

  slamMs: 180, // the impact
  slamRecoveryMs: 620, // punish window after the smash
  slamDamage: 24,
  // Approach: it stalks you with heavy stomping steps until it's close enough
  // to commit (then it charges, or slams if you're right on top of it).
  walkSpeed: 46, // slow, weighty gait
  attackRange: 150, // within this it commits to charge/slam; beyond it walks in
};

export const Juice = {
  hitstopMs: 70, // freeze on landing a hit (manual flag, not world.pause)
  hitstopHeavyMs: 110,
  shakeHit: { duration: 90, intensity: 0.006 },
  shakeHurt: { duration: 220, intensity: 0.012 },
  shakeDash: { duration: 60, intensity: 0.0035 },
  shakeRespawn: { duration: 300, intensity: 0.01 },
};

export const Grace = {
  // Death -> renewal cinematic timings (ms)
  deathFadeMs: 650, // world darkens
  beamDelayMs: 350, // pause in darkness before the light descends
  beamGrowMs: 500, // beam of light descends and widens
  reformMs: 550, // figure reassembles in the light
  riseMs: 350, // figure stands; control returns
  postIFrameMs: 900,
};
