// ALL game-feel constants live here. One file tunes the whole game.
// Units: pixels and px/second (Arcade physics). Internal res is 480x270.

export const World = {
  gravity: 900, // px/s^2
  internalWidth: 480,
  internalHeight: 270,
  tile: 16,
};

export const PlayerTune = {
  // Frame / body  (78x70 PixelLab HD art, drawn at `scale` so it's ~46px tall on
  // screen but far more detailed). Body is texture-space and scales with the sprite.
  frameW: 78,
  frameH: 70,
  scale: 0.66, // detailed model scaled down
  bodyW: 18, // collision width (texture px; *scale on screen ≈ 12)
  bodyH: 40, // collision height (texture px; *scale on screen ≈ 26)
  bodyOffsetX: 30, // (frameW - bodyW)/2 -> centred
  bodyOffsetY: 30, // body spans rows 30..70 (feet at frame bottom)

  // Horizontal movement
  // Feel intent (Game-Feel rule #2): TIGHT on the ground (precision/penitence),
  // a touch LOOSE/floaty in the air (the grace of getting back up); dash = crisp burst.
  runSpeed: 132,
  runAccel: 1400,
  runDecel: 1700, // friction when no input on ground
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

  // Attack — base/fallback values; the live 3-hit combo lives in PlayerCombo below.
  comboWindowMs: 320, // press again within this (after recovery) to chain the next hit
  attackReach: 22, // hitbox extends this far in front of the body center
  attackHeight: 26,
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

  // Survivability
  maxHealth: 100,
  hurtKnockback: 150,
  hurtKnockbackUp: -120,
  invulnMsAfterHit: 700,
};

// The 3-hit blade combo. Chain one→two→three within comboWindowMs for the payoff:
// a light swipe, a heavier swing, then a big committed forward cleave that hits
// hardest but is slow to recover (whiff = punishable). Damage roughly 1 : 1.5 : 2.6.
export const PlayerCombo = [
  { dmg: 20, reach: 22, height: 26, windupMs: 30, activeMs: 80, recoveryMs: 110, lunge: 90, anim: 'player-attack1', arc: 1.0, lean: 0.16 },
  { dmg: 30, reach: 27, height: 30, windupMs: 45, activeMs: 95, recoveryMs: 150, lunge: 120, anim: 'player-attack2', arc: 1.3, lean: 0.22 },
  { dmg: 52, reach: 34, height: 34, windupMs: 70, activeMs: 115, recoveryMs: 240, lunge: 240, anim: 'player-attack3', arc: 1.7, lean: 0.32 },
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
  chaseSpeed: 80,
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
