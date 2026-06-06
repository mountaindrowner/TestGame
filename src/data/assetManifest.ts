// Single source of truth for asset keys, paths, and tile contracts.
// The Python packers (tools/*.py) MUST produce sheets matching these.

export const Assets = {
  player: { key: 'player', path: 'assets/sprites/player.png', frameW: 48, frameH: 44 },
  runner: { key: 'runner', path: 'assets/sprites/runner.png', frameW: 48, frameH: 44 },
  tileset: { key: 'tileset', path: 'assets/tilesets/depths.png', frameW: 16, frameH: 16 },
  bgFar: { key: 'bg-far', path: 'assets/backgrounds/far.png' },
  bgMid: { key: 'bg-mid', path: 'assets/backgrounds/mid.png' },
  bgNear: { key: 'bg-near', path: 'assets/backgrounds/near.png' },
  fog: { key: 'fog', path: 'assets/backgrounds/fog.png' },
  dot: { key: 'dot', path: 'assets/sprites/dot.png' },
  // Aesthetic hanging decorations (origin top-center; swayed in the engine).
  chain: { key: 'decor-chain', path: 'assets/sprites/decor/chain.png' },
  vine: { key: 'decor-vine', path: 'assets/sprites/decor/vine.png' },
  root: { key: 'decor-root', path: 'assets/sprites/decor/root.png' },
  banner: { key: 'decor-banner', path: 'assets/sprites/decor/banner.png' },
  moss: { key: 'decor-moss', path: 'assets/sprites/decor/moss.png' },
  fern: { key: 'decor-fern', path: 'assets/sprites/decor/fern.png' },
} as const;

// SEMANTIC tile codes — what a room cell *means* (used by roomData).
export const Sem = {
  EMPTY: -1,
  SOLID: 0,
  PLATFORM: 1,
  MOLTEN: 2,
  CRACKED: 3,
} as const;

// VISUAL tile indices in depths.png (the autotiler's output).
//   0..15  wall by exposed-edge bitmask (bit0 top, bit1 right, bit2 bottom, bit3 left)
//   16 INT_A | 17 INT_B | 18 CRACK | 19 PLATFORM | 20 MOLTEN
export const Vis = {
  WALL_MIN: 0,
  WALL_MAX: 15,
  INT_A: 16,
  INT_B: 17,
  CRACK: 18,
  PLATFORM: 19,
  MOLTEN: 20,
} as const;

export const VIS_SOLID_MAX = 18; // indices 0..18 are solid walls (incl. variants + cracked)
