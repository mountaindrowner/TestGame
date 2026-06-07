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

// PLAYER strip (48x44), packed by tools/pack_player.py from PixelLab frames:
// PLAYER strip (41x40 original Revenant, emotive rework), packed by pack_player.py:
//   idle 0-8 | run 9-19 | jump 20-34 | fall 35-41 | dash 42-48 | hurt 49-57 |
//   attack1 58-68 | attack2 69-81 | attack3 82-94 | death 95-105
// Full expressive clips; jump is a 15-frame energetic launch→stretch→tuck.
export const PlayerAnims: AnimDef[] = [
  { key: 'player-idle', sheet: 'player', start: 0, end: 8, frameRate: 8, repeat: -1 },
  { key: 'player-run', sheet: 'player', start: 9, end: 19, frameRate: 16, repeat: -1 },
  { key: 'player-jump', sheet: 'player', start: 20, end: 34, frameRate: 20, repeat: 0 },
  { key: 'player-fall', sheet: 'player', start: 35, end: 41, frameRate: 12, repeat: -1 },
  { key: 'player-dash', sheet: 'player', start: 42, end: 48, frameRate: 22, repeat: 0 },
  { key: 'player-hurt', sheet: 'player', start: 49, end: 57, frameRate: 18, repeat: 0 },
  { key: 'player-attack1', sheet: 'player', start: 58, end: 68, frameRate: 34, repeat: 0 },
  { key: 'player-attack2', sheet: 'player', start: 69, end: 81, frameRate: 32, repeat: 0 },
  { key: 'player-attack3', sheet: 'player', start: 82, end: 94, frameRate: 28, repeat: 0 },
  { key: 'player-death', sheet: 'player', start: 95, end: 105, frameRate: 12, repeat: 0 },
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
export const WardenAnims: AnimDef[] = [
  { key: 'warden-run', sheet: 'warden', start: 0, end: 8, frameRate: 10, repeat: -1 },
  { key: 'warden-windup', sheet: 'warden', start: 9, end: 17, frameRate: 12, repeat: 0 },
  { key: 'warden-strike', sheet: 'warden', start: 18, end: 26, frameRate: 18, repeat: 0 },
  { key: 'warden-recovery', sheet: 'warden', start: 27, end: 33, frameRate: 12, repeat: 0 },
  { key: 'warden-hurt', sheet: 'warden', start: 34, end: 40, frameRate: 14, repeat: 0 },
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
