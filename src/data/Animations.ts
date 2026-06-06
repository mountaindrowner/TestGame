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
//   hurt 31-36 | death 37-43 | dash 44-45 | attack2 46-52
// The engine holds jump/fall as single poses (physics drives the arc), so those
// keys point at one representative airborne frame rather than a sequence. dash is
// a 2-frame lunge hold; attack1 is an overhead downward slash and attack2 a
// rising upward slash (the combo's 2nd swing); death is the fail-beat clip.
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
