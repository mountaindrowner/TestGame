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

// PLAYER strip (98x68), Hollow Revenant HD (v3, 64px source), packed by tools/pack_player.py:
//   idle 0-7 | run 8-17 | jump 18-27 | runjump 28-35 | fall 36-41 | dash 42-47 |
//   hurt 48-53 | attack1 54-61 | attack2 62-73 | attack3 74-83 | death 84-93 |
//   rest 94-101 | weary 102-109
// jump = standstill leap; runjump = running jump (used when moving horizontally).
// rest/weary = long-idle "waits" poses (blade on shoulder; weary = below half HP).
// 3-hit combo = the v3 swings: 1 fast overhead broken-sword chop, 2 heavy pull-back
// glowing horizontal slash, 3 explosive crouch->leap forward-thrust finisher.
// Frame rates chosen so each swing plays ~start-to-finish across its combo step.
// (The shared v3 reference frame_000 is dropped by the packer — every clip starts on motion.)
export const PlayerAnims: AnimDef[] = [
  { key: 'player-idle', sheet: 'player', start: 0, end: 7, frameRate: 8, repeat: -1 },
  { key: 'player-run', sheet: 'player', start: 8, end: 17, frameRate: 16, repeat: -1 },
  { key: 'player-jump', sheet: 'player', start: 18, end: 27, frameRate: 18, repeat: 0 },
  { key: 'player-runjump', sheet: 'player', start: 28, end: 35, frameRate: 16, repeat: 0 },
  { key: 'player-fall', sheet: 'player', start: 36, end: 43, frameRate: 14, repeat: -1 },
  { key: 'player-dash', sheet: 'player', start: 44, end: 49, frameRate: 22, repeat: 0 },
  { key: 'player-hurt', sheet: 'player', start: 50, end: 55, frameRate: 18, repeat: 0 },
  { key: 'player-attack1', sheet: 'player', start: 56, end: 63, frameRate: 32, repeat: 0 },
  { key: 'player-attack2', sheet: 'player', start: 64, end: 75, frameRate: 30, repeat: 0 },
  { key: 'player-attack3', sheet: 'player', start: 76, end: 85, frameRate: 24, repeat: 0 },
  { key: 'player-death', sheet: 'player', start: 86, end: 95, frameRate: 12, repeat: 0 },
  // Long-idle "waits" poses (blade on shoulder). Ranges/size confirmed by the packer.
  { key: 'player-rest', sheet: 'player', start: 96, end: 103, frameRate: 7, repeat: -1 },
  { key: 'player-weary', sheet: 'player', start: 104, end: 111, frameRate: 6, repeat: -1 },
  // The ledge-grab mantle (hang -> haul up -> crouch), driven by Player.beginClimb.
  { key: 'player-climb', sheet: 'player', start: 112, end: 121, frameRate: 26, repeat: 0 },
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

// Ranged archetypes (real PixelLab art). Ranges MUST match tools/pack_enemy.py.
//   archer 47x52: run 0-5 | fire 6-14 (draw-and-loose) | hurt 15-20
//   bomber 53x57: run 0-5 | fire 6-14 (wind-up-and-hurl) | hurt 15-20
// fire is the telegraph the ranged-ground behaviour plays before it shoots.
export const ArcherAnims: AnimDef[] = [
  { key: 'archer-run', sheet: 'archer', start: 0, end: 5, frameRate: 11, repeat: -1 },
  { key: 'archer-fire', sheet: 'archer', start: 6, end: 14, frameRate: 16, repeat: 0 },
  { key: 'archer-hurt', sheet: 'archer', start: 15, end: 20, frameRate: 16, repeat: 0 },
];
export const BomberAnims: AnimDef[] = [
  { key: 'bomber-run', sheet: 'bomber', start: 0, end: 5, frameRate: 10, repeat: -1 },
  { key: 'bomber-fire', sheet: 'bomber', start: 6, end: 14, frameRate: 15, repeat: 0 },
  { key: 'bomber-hurt', sheet: 'bomber', start: 15, end: 20, frameRate: 16, repeat: 0 },
];
// The Stranger — a single looping breathing idle for the Sanctuary (16x50).
export const StrangerAnims: AnimDef[] = [
  { key: 'stranger-idle', sheet: 'stranger', start: 0, end: 3, frameRate: 6, repeat: -1 },
];
// Props — the wall torch's living flame (12x26, 4-frame strip).
export const PropAnims: AnimDef[] = [
  { key: 'torch-burn', sheet: 'prop-torch', start: 0, end: 3, frameRate: 7, repeat: -1 },
  // the grasping-depths arm: rise → claw → sink (the GraspPit desyncs each one)
  { key: 'hand-reach', sheet: 'prop-hand', start: 0, end: 5, frameRate: 7, repeat: -1 },
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
