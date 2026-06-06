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

// PLAYER strip (24x32): idle 0-3 | run 4-9 | jump 10 | fall 11 | dash 12-13 |
//                        attack1 14-16 | attack2 17-19 | hurt 20
export const PlayerAnims: AnimDef[] = [
  { key: 'player-idle', sheet: 'player', start: 0, end: 3, frameRate: 6, repeat: -1 },
  { key: 'player-run', sheet: 'player', start: 4, end: 9, frameRate: 13, repeat: -1 },
  { key: 'player-jump', sheet: 'player', start: 10, end: 10, frameRate: 1, repeat: 0 },
  { key: 'player-fall', sheet: 'player', start: 11, end: 11, frameRate: 1, repeat: 0 },
  { key: 'player-dash', sheet: 'player', start: 12, end: 13, frameRate: 14, repeat: 0 },
  { key: 'player-attack1', sheet: 'player', start: 14, end: 16, frameRate: 22, repeat: 0 },
  { key: 'player-attack2', sheet: 'player', start: 17, end: 19, frameRate: 22, repeat: 0 },
  { key: 'player-hurt', sheet: 'player', start: 20, end: 20, frameRate: 1, repeat: 0 },
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
