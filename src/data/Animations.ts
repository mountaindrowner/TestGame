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
//   idle 0-3 | run 4-9 | jump 10-18 | fall 19-23 | attack 24-30 |
//   hurt 31-36 | death 37-43
// The engine holds jump/fall/dash as single poses (physics drives the arc), so
// those keys point at one representative airborne frame rather than a sequence.
// attack1/attack2 reuse the one overhead-slash clip (a distinct 2nd swing can be
// added later — 1 PixelLab gen); death is the new fail-beat clip.
export const PlayerAnims: AnimDef[] = [
  { key: 'player-idle', sheet: 'player', start: 0, end: 3, frameRate: 6, repeat: -1 },
  { key: 'player-run', sheet: 'player', start: 4, end: 9, frameRate: 13, repeat: -1 },
  { key: 'player-jump', sheet: 'player', start: 14, end: 14, frameRate: 1, repeat: 0 },
  { key: 'player-fall', sheet: 'player', start: 22, end: 22, frameRate: 1, repeat: 0 },
  { key: 'player-dash', sheet: 'player', start: 22, end: 22, frameRate: 1, repeat: 0 },
  { key: 'player-attack1', sheet: 'player', start: 24, end: 30, frameRate: 26, repeat: 0 },
  { key: 'player-attack2', sheet: 'player', start: 24, end: 30, frameRate: 26, repeat: 0 },
  { key: 'player-hurt', sheet: 'player', start: 31, end: 36, frameRate: 24, repeat: 0 },
  { key: 'player-death', sheet: 'player', start: 37, end: 43, frameRate: 10, repeat: 0 },
];

// RUNNER strip (24x24): run 0-3 | windup 4-5 | hurt 6
export const RunnerAnims: AnimDef[] = [
  { key: 'runner-run', sheet: 'runner', start: 0, end: 3, frameRate: 16, repeat: -1 },
  { key: 'runner-windup', sheet: 'runner', start: 4, end: 5, frameRate: 10, repeat: 0 },
  { key: 'runner-hurt', sheet: 'runner', start: 6, end: 6, frameRate: 1, repeat: 0 },
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
