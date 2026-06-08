// Declarative animation table. Frame indices are positions in the horizontal
// sprite strips produced by the Python packers — keep these in lockstep with
// tools/gen_player.py and tools/gen_enemy.py (which print their layouts).
import Phaser from 'phaser';

export interface AnimDef {
  key: string;
  sheet: string;
  start: number;
  end: number;
  frameRate: number;
  repeat: number; // -1 = loop
}

// PLAYER strip (45x43), packed by tools/pack_player.py:
//   idle 0-8 | run 9-19 | jump 20-34 | runjump 35-42 | fall 43-49 | dash 50-56 |
//   hurt 57-65 | attack1 66-72 | attack2 73-89 | attack3 90-98 | death 99-109 |
//   rest 110-118 | weary 119-129
// jump = standstill leap (15f); runjump = user-made running jump (8f, used when moving).
// rest/weary = long-idle "waits" poses (blade on shoulder; weary = below half HP).
// 3-hit combo = the hand-made swings: 1 fast overhead broken-sword chop (7f),
// 2 heavy pull-back glowing horizontal slash (17f), 3 leap-thrust finisher (9f).
// Frame rates chosen so each swing plays ~start-to-finish across its combo step.
export const PlayerAnims: AnimDef[] = [
  { key: 'player-idle', sheet: 'player', start: 0, end: 8, frameRate: 8, repeat: -1 },
  { key: 'player-run', sheet: 'player', start: 9, end: 19, frameRate: 16, repeat: -1 },
  { key: 'player-jump', sheet: 'player', start: 20, end: 34, frameRate: 20, repeat: 0 },
  { key: 'player-runjump', sheet: 'player', start: 35, end: 42, frameRate: 16, repeat: 0 },
  { key: 'player-fall', sheet: 'player', start: 43, end: 49, frameRate: 12, repeat: -1 },
  { key: 'player-dash', sheet: 'player', start: 50, end: 56, frameRate: 22, repeat: 0 },
  { key: 'player-hurt', sheet: 'player', start: 57, end: 65, frameRate: 18, repeat: 0 },
  { key: 'player-attack1', sheet: 'player', start: 66, end: 72, frameRate: 32, repeat: 0 },
  { key: 'player-attack2', sheet: 'player', start: 73, end: 89, frameRate: 39, repeat: 0 },
  { key: 'player-attack3', sheet: 'player', start: 90, end: 98, frameRate: 21, repeat: 0 },
  { key: 'player-death', sheet: 'player', start: 99, end: 109, frameRate: 12, repeat: 0 },
  // Long-idle "waits" poses (blade on shoulder). Ranges/size confirmed by the packer.
  { key: 'player-rest', sheet: 'player', start: 110, end: 118, frameRate: 7, repeat: -1 },
  { key: 'player-weary', sheet: 'player', start: 119, end: 129, frameRate: 6, repeat: -1 },
];

// RUNNER strip (48x44), packed by tools/pack_enemy.py from PixelLab frames:
//   run 0-4 | windup 5-9 (crouch-coil telegraph) | hurt 10-15
export const RunnerAnims: AnimDef[] = [
  { key: 'runner-run', sheet: 'runner', start: 0, end: 4, frameRate: 12, repeat: -1 },
  { key: 'runner-windup', sheet: 'runner', start: 5, end: 9, frameRate: 16, repeat: 0 },
  { key: 'runner-hurt', sheet: 'runner', start: 10, end: 15, frameRate: 18, repeat: 0 },
];

// The rest of the BIO-01 family (real PixelLab art). Ranges MUST match the strip
// layout printed by tools/pack_enemy.py. timeScale (in Enemy) modulates run speed.
export const CrawlerAnims: AnimDef[] = [
  { key: 'crawler-run', sheet: 'crawler', start: 0, end: 8, frameRate: 12, repeat: -1 },
  { key: 'crawler-hurt', sheet: 'crawler', start: 9, end: 15, frameRate: 16, repeat: 0 },
];
export const SparkAnims: AnimDef[] = [
  { key: 'spark-run', sheet: 'spark', start: 0, end: 6, frameRate: 10, repeat: -1 },
  { key: 'spark-windup', sheet: 'spark', start: 7, end: 13, frameRate: 14, repeat: 0 },
  { key: 'spark-hurt', sheet: 'spark', start: 14, end: 18, frameRate: 16, repeat: 0 },
];
export const StrikerAnims: AnimDef[] = [
  { key: 'striker-run', sheet: 'striker', start: 0, end: 8, frameRate: 10, repeat: -1 },
  { key: 'striker-windup', sheet: 'striker', start: 9, end: 15, frameRate: 12, repeat: 0 },
  { key: 'striker-strike', sheet: 'striker', start: 16, end: 24, frameRate: 18, repeat: 0 },
  { key: 'striker-hurt', sheet: 'striker', start: 25, end: 31, frameRate: 16, repeat: 0 },
];
// WARDEN strip (70x71), packed by tools/pack_enemy.py in this order. The new
// poses (taunt arms-out, slam overhead) widened the union frame 44x68 -> 70x71.
// slam runs slow enough that its overhead-smash impact lands at the windup->
// strike boundary (where Enemy emits the ground shockwave).
export const WardenAnims: AnimDef[] = [
  { key: 'warden-run', sheet: 'warden', start: 0, end: 8, frameRate: 10, repeat: -1 },
  { key: 'warden-windup', sheet: 'warden', start: 9, end: 17, frameRate: 12, repeat: 0 },
  { key: 'warden-strike', sheet: 'warden', start: 18, end: 26, frameRate: 18, repeat: 0 },
  { key: 'warden-recovery', sheet: 'warden', start: 27, end: 33, frameRate: 12, repeat: 0 },
  { key: 'warden-hurt', sheet: 'warden', start: 34, end: 40, frameRate: 14, repeat: 0 },
  { key: 'warden-idle', sheet: 'warden', start: 41, end: 49, frameRate: 6, repeat: -1 },
  { key: 'warden-taunt', sheet: 'warden', start: 50, end: 62, frameRate: 14, repeat: 0 },
  { key: 'warden-slam', sheet: 'warden', start: 63, end: 79, frameRate: 14, repeat: 0 },
  { key: 'warden-death', sheet: 'warden', start: 80, end: 96, frameRate: 16, repeat: 0 },
];

// BIO-02 House of Mirrors roster (real PixelLab art). Ranges MUST match the strip
// layout printed by tools/pack_enemy.py.
export const GlassWitchAnims: AnimDef[] = [
  { key: 'glassWitch-run', sheet: 'glassWitch', start: 0, end: 5, frameRate: 10, repeat: -1 },
  { key: 'glassWitch-fire', sheet: 'glassWitch', start: 6, end: 11, frameRate: 12, repeat: 0 },
  { key: 'glassWitch-hurt', sheet: 'glassWitch', start: 12, end: 17, frameRate: 16, repeat: 0 },
];
export const ReflectionHoundAnims: AnimDef[] = [
  { key: 'reflectionHound-run', sheet: 'reflectionHound', start: 0, end: 5, frameRate: 13, repeat: -1 },
  { key: 'reflectionHound-hurt', sheet: 'reflectionHound', start: 6, end: 12, frameRate: 16, repeat: 0 },
];
export const FalseFaceAnims: AnimDef[] = [
  { key: 'falseFace-run', sheet: 'falseFace', start: 0, end: 5, frameRate: 11, repeat: -1 },
  { key: 'falseFace-strike', sheet: 'falseFace', start: 6, end: 11, frameRate: 16, repeat: 0 },
  { key: 'falseFace-hurt', sheet: 'falseFace', start: 12, end: 17, frameRate: 16, repeat: 0 },
];
export const FractureWispAnims: AnimDef[] = [
  { key: 'fractureWisp-run', sheet: 'fractureWisp', start: 0, end: 6, frameRate: 10, repeat: -1 },
  { key: 'fractureWisp-hurt', sheet: 'fractureWisp', start: 7, end: 13, frameRate: 14, repeat: 0 },
];
export const LookingGlassAnims: AnimDef[] = [
  { key: 'lookingGlass-run', sheet: 'lookingGlass', start: 0, end: 5, frameRate: 9, repeat: -1 },
  { key: 'lookingGlass-strike', sheet: 'lookingGlass', start: 6, end: 11, frameRate: 14, repeat: 0 },
  { key: 'lookingGlass-hurt', sheet: 'lookingGlass', start: 12, end: 17, frameRate: 16, repeat: 0 },
];

export function registerAnims(scene: Phaser.Scene, defs: AnimDef[]): void {
  for (const d of defs) {
    if (scene.anims.exists(d.key)) continue;
    scene.anims.create({
      key: d.key,
      frames: scene.anims.generateFrameNumbers(d.sheet, { start: d.start, end: d.end }),
      frameRate: d.frameRate,
      repeat: d.repeat,
    });
  }
}
