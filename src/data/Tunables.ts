// ALL game-feel constants live here. One file tunes the whole game.
// Units: pixels and px/second (Arcade physics). Internal res is 480x270.

export const World = {
  gravity: 900, // px/s^2
  internalWidth: 480,
  internalHeight: 270,
  tile: 16,
};

export const PlayerTune = {
  // Frame / body
  frameW: 24,
  frameH: 32,
  bodyW: 10, // collision width (~feet/torso) — narrower than art (forgiving)
  bodyH: 24, // collision height (feet to shoulders)
  bodyOffsetX: 7, // (frameW - bodyW)/2
  bodyOffsetY: 8, // art has ~8px of headroom above the body

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
  frameW: 24,
  frameH: 24,
  bodyW: 12,
  bodyH: 16,
  bodyOffsetX: 6,
  bodyOffsetY: 8,

  maxHealth: 40,
  patrolSpeed: 36,
  chaseSpeed: 138, // faster than the player's run — you must dash/commit
  aggroRange: 130, // detects the player within this horizontal distance
  aggroVertical: 56,
  windupMs: 160, // brief telegraph before it lunges
  contactDamage: 18,
  knockbackTaken: 180,
  edgeCheck: true, // turn at ledges/walls while patrolling
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
