// Single source of truth for asset keys, paths, and tile contracts.
// The Python packers (tools/*.py) MUST produce sheets matching these.

export const Assets = {
  player: { key: 'player', path: 'assets/sprites/player.png', frameW: 98, frameH: 68 },
  runner: { key: 'runner', path: 'assets/sprites/runner.png', frameW: 48, frameH: 44 },
  // The BIO-01 enemy family — real PixelLab art (varied native frame sizes).
  crawler: { key: 'crawler', path: 'assets/sprites/crawler.png', frameW: 43, frameH: 49 },
  spark: { key: 'spark', path: 'assets/sprites/spark.png', frameW: 31, frameH: 45 },
  striker: { key: 'striker', path: 'assets/sprites/striker.png', frameW: 54, frameH: 53 },
  warden: { key: 'warden', path: 'assets/sprites/warden.png', frameW: 70, frameH: 71 },
  // BIO-02 House of Mirrors roster — real PixelLab art (varied native frame sizes).
  glassWitch: { key: 'glassWitch', path: 'assets/sprites/glassWitch.png', frameW: 48, frameH: 52 },
  reflectionHound: { key: 'reflectionHound', path: 'assets/sprites/reflectionHound.png', frameW: 65, frameH: 35 },
  falseFace: { key: 'falseFace', path: 'assets/sprites/falseFace.png', frameW: 51, frameH: 52 },
  fractureWisp: { key: 'fractureWisp', path: 'assets/sprites/fractureWisp.png', frameW: 34, frameH: 44 },
  lookingGlass: { key: 'lookingGlass', path: 'assets/sprites/lookingGlass.png', frameW: 62, frameH: 65 },
  // Ranged archetypes — real PixelLab side-view sheets (replace the tinted striker placeholders).
  archer: { key: 'archer', path: 'assets/sprites/archer.png', frameW: 47, frameH: 52 },
  bomber: { key: 'bomber', path: 'assets/sprites/bomber.png', frameW: 53, frameH: 57 },
  // The Sanctuary's pact-giver — a single idle clip, shown in SanctuaryScene.
  stranger: { key: 'stranger', path: 'assets/sprites/stranger.png', frameW: 16, frameH: 50 },
  tileset: { key: 'tileset', path: 'assets/tilesets/depths.png', frameW: 16, frameH: 16 },
  bgFar: { key: 'bg-far', path: 'assets/backgrounds/far.png' },
  bgMid: { key: 'bg-mid', path: 'assets/backgrounds/mid.png' },
  bgNear: { key: 'bg-near', path: 'assets/backgrounds/near.png' },
  fog: { key: 'fog', path: 'assets/backgrounds/fog.png' },
  // House of Mirrors (BIO-02) theme — tileset + parallax (same 21-slot Vis contract).
  tilesetMirrors: { key: 'tileset-mirrors', path: 'assets/tilesets/mirrors.png', frameW: 16, frameH: 16 },
  bgFarMirror: { key: 'bg-far-m', path: 'assets/backgrounds/mirror-far.png' },
  bgMidMirror: { key: 'bg-mid-m', path: 'assets/backgrounds/mirror-mid.png' },
  bgNearMirror: { key: 'bg-near-m', path: 'assets/backgrounds/mirror-near.png' },
  fogMirror: { key: 'fog-m', path: 'assets/backgrounds/mirror-fog.png' },
  dot: { key: 'dot', path: 'assets/sprites/dot.png' },
  // Aesthetic hanging decorations (origin top-center; swayed in the engine).
  chain: { key: 'decor-chain', path: 'assets/sprites/decor/chain.png' },
  vine: { key: 'decor-vine', path: 'assets/sprites/decor/vine.png' },
  root: { key: 'decor-root', path: 'assets/sprites/decor/root.png' },
  banner: { key: 'decor-banner', path: 'assets/sprites/decor/banner.png' },
  moss: { key: 'decor-moss', path: 'assets/sprites/decor/moss.png' },
  fern: { key: 'decor-fern', path: 'assets/sprites/decor/fern.png' },
  stalactite: { key: 'decor-stalactite', path: 'assets/sprites/decor/stalactite.png' },
  // House of Mirrors — an ornate broken mirror pane (PixelLab), placed as wall decor.
  mirror: { key: 'decor-mirror', path: 'assets/sprites/decor/mirror.png' },
  // Gameplay props — dropped currency (soul), heal orb, breakable urn.
  soul: { key: 'prop-soul', path: 'assets/sprites/props/soul.png' },
  heal: { key: 'prop-heal', path: 'assets/sprites/props/heal.png' },
  urn: { key: 'prop-urn', path: 'assets/sprites/props/urn.png' },
  critter: { key: 'prop-critter', path: 'assets/sprites/props/critter.png' },
  cobweb: { key: 'prop-cobweb', path: 'assets/sprites/props/cobweb.png' },
  // A real wall torch (4-frame flame strip) — the lights are objects now.
  torch: { key: 'prop-torch', path: 'assets/sprites/props/torch.png', frameW: 12, frameH: 26 },
} as const;

/** The environment-decor scatter set (tools/gen_environment.py): 24 ground pieces
 *  + 2 wall pieces that populate floors/walls deterministically (GroundDecor).
 *  Keys are `env-<name>`; ground pieces are feet-anchored, wall pieces centered. */
export const ENV_GROUND = [
  'skull', 'bone-pile', 'ribcage', 'bone-heap', 'rubble-small', 'rubble-large',
  'pillar-stump', 'fallen-column', 'statue-head', 'stalagmite-floor',
  'gravestone-round', 'gravestone-cross', 'candle-cluster', 'candelabra',
  'broken-shield', 'stuck-sword', 'rusted-helmet', 'chain-coil', 'pot-shards',
  'ash-heap', 'mushrooms', 'crystals', 'moss-clump', 'roots-patch',
] as const;
export const ENV_WALL = ['wall-relief', 'wall-plaque'] as const;
export const envKey = (name: string) => `env-${name}`;
export const envPath = (name: string) => `assets/sprites/env/${name}.png`;

// Per-biome theme lookup: a room's `biome` resolves to its tileset + parallax
// layers here. Same autotiler/Vis contract for every biome — only the art differs.
export const Biomes: Record<string, { tilesetKey: string; bg: { far: string; mid: string; near: string; fog: string } }> = {
  depths: {
    tilesetKey: Assets.tileset.key,
    bg: { far: Assets.bgFar.key, mid: Assets.bgMid.key, near: Assets.bgNear.key, fog: Assets.fog.key },
  },
  mirrors: {
    tilesetKey: Assets.tilesetMirrors.key,
    bg: { far: Assets.bgFarMirror.key, mid: Assets.bgMidMirror.key, near: Assets.bgNearMirror.key, fog: Assets.fogMirror.key },
  },
};

export function biomeOf(id?: string) {
  return Biomes[id ?? 'depths'] ?? Biomes.depths;
}

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
