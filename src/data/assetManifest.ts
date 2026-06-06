// Single source of truth for asset keys, paths, and frame dimensions.
// The Python packer (tools/*.py) MUST produce sheets matching these dims and the
// frame order declared in Animations.ts. The packer prints its layout to verify.

export const Assets = {
  player: {
    key: 'player',
    path: 'assets/sprites/player.png',
    frameW: 24,
    frameH: 32,
  },
  runner: {
    key: 'runner',
    path: 'assets/sprites/runner.png',
    frameW: 24,
    frameH: 24,
  },
  tileset: {
    key: 'tileset',
    path: 'assets/tilesets/depths.png',
    frameW: 16,
    frameH: 16,
  },
  bgFar: { key: 'bg-far', path: 'assets/backgrounds/far.png' },
  bgMid: { key: 'bg-mid', path: 'assets/backgrounds/mid.png' },
  bgNear: { key: 'bg-near', path: 'assets/backgrounds/near.png' },
  fog: { key: 'fog', path: 'assets/backgrounds/fog.png' },
  dot: { key: 'dot', path: 'assets/sprites/dot.png' }, // soft round particle
} as const;

// Tileset frame indices (must match tools/gen_tileset.py order).
export const Tile = {
  EMPTY: -1,
  STONE: 0, // solid body
  STONE_TOP: 1, // solid, lit top edge
  PLATFORM: 2, // one-way (collide from above)
  MOLTEN: 3, // hazard surface (damages, not solid)
  CRACKED: 4, // solid, visually fractured
} as const;

export const SOLID_TILES = [Tile.STONE, Tile.STONE_TOP, Tile.CRACKED];
export const ONEWAY_TILES = [Tile.PLATFORM];
export const HAZARD_TILES = [Tile.MOLTEN];
