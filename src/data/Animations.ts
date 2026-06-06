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
// PLAYER strip (48x44 original). idle 0-3 | run 4-9 | jump 10-18 | fall 19-23 |
// attack1 24-30 | hurt 31-36 | death 37-43 | dash 44-45 | attack2 46-52.
// (Restored original; emotive rework is regenerated onto this character next.)
export const PlayerAnims: AnimDef[] = [
  { key: 'player-idle', sheet: 'player', start: 0, end: 3, frameRate: 6, repeat: -1 },
  { key: 'player-run', sheet: 'player', start: 4, end: 9, frameRate: 13, repeat: -1 },
  { key: 'player-jump', sheet: 'player', start: 14, end: 14, frameRate: 1, repeat: 0 },
  { key: 'player-fall', sheet: 'player', start: 22, end: 22, frameRate: 1, repeat: 0 },
  { key: 'player-dash', sheet: 'player', start: 44, end: 45, frameRate: 14, repeat: 0 },
  { key: 'player-attack1', sheet: 'player', start: 24, end: 30, frameRate: 26, repeat: 0 },
  { key: 'player-attack2', sheet: 'player', start: 46, end: 52, frameRate: 26, repeat: 0 },
  { key: 'player-hurt', sheet: 'player', start: 31, end: 36, frameRate: 24, repeat: 0 },
  { key: 'player-death', sheet: 'player', start: 37, end: 43, frameRate: 10, repeat: 0 },
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
