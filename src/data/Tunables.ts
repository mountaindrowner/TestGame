// ALL game-feel constants live here. One file tunes the whole game.
// Units: pixels and px/second (Arcade physics). Internal res is 480x270.

export const World = {
  gravity: 900, // px/s^2
  internalWidth: 480,
  internalHeight: 270,
  tile: 16,
};

export const PlayerTune = {
  // Frame / body  (48x44 PixelLab art; figure ~36px tall, feet at frame bottom)
  frameW: 48,
  frameH: 44,
  bodyW: 12, // collision width (~feet/torso) — narrower than art (forgiving)
  bodyH: 28, // collision height (feet to shoulders)
  bodyOffsetX: 18, // (frameW - bodyW)/2 -> body centred at x=24
  bodyOffsetY: 16, // body spans rows 16..44 (feet at frame bottom; head above)

  // Horizontal movement
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

  // Attack (3-hit-ish combo of light slashes)
  attackWindupMs: 40,
  attackActiveMs: 90,
  attackRecoveryMs: 130,
  comboWindowMs: 320, // press again within this to chain
  attackReach: 22, // hitbox extends this far in front of the body center
  attackHeight: 26,
  attackDamage: 34,
  attackLungeSpeed: 70, // small forward push on swing (game feel)

  // Survivability
  maxHealth: 100,
  hurtKnockback: 150,
  hurtKnockbackUp: -120,
  invulnMsAfterHit: 700,
};

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

// The Guardian — an elite Striker at the gate. Bigger, far tankier, single-phase
// for now (a second telegraph can be added later).
export const GuardianTune = {
  maxHealth: 320,
  patrolSpeed: 22,
  chaseSpeed: 140,
  aggroRange: 220,
  aggroVertical: 90,
  windupMs: 680,
  contactDamage: 28,
  knockbackTaken: 26,
  coreStunMs: 300,
  edgeCheck: false,
  strikeMs: 300,
  recoveryMs: 560,
  damageReduction: 0.5,
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
