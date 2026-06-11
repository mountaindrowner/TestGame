import Phaser from 'phaser';

export type Action = 'left' | 'right' | 'up' | 'down' | 'jump' | 'dash' | 'attack' | 'skill';

const ACTIONS: Action[] = ['left', 'right', 'up', 'down', 'jump', 'dash', 'attack', 'skill'];

// Maps physical keys -> actions. Keep the mapping here so rebinding is trivial
// and so gameplay code only ever asks about *actions*, never raw keys.
const KEY_MAP: Record<string, Action> = {
  LEFT: 'left',
  A: 'left',
  RIGHT: 'right',
  D: 'right',
  UP: 'up',
  W: 'up',
  DOWN: 'down',
  S: 'down',
  SPACE: 'jump',
  Z: 'jump',
  SHIFT: 'dash',
  J: 'attack',
  K: 'attack',
  X: 'attack',
  L: 'skill',
  C: 'skill',
};

/** Single abstraction between devices and the game. Funnels keyboard, touch and
 *  gamepad into a unified action API with edge + buffer timing. Gamepad follows
 *  the PC-platformer convention (Dead Cells / Hollow Knight): stick+dpad move,
 *  bottom face (A) jumps, left face (X) attacks, B / right shoulder dashes,
 *  top face (Y) / left shoulder casts. */
export class InputManager {
  private state: Record<Action, boolean>;
  private prev: Record<Action, boolean>;
  private virtual: Record<Action, boolean>;
  private bufferedAt: Partial<Record<Action, number>> = {};
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private time = 0;

  constructor(private scene: Phaser.Scene) {
    this.state = this.blank();
    this.prev = this.blank();
    this.virtual = this.blank();
    const kb = scene.input.keyboard;
    if (kb) {
      for (const name of Object.keys(KEY_MAP)) {
        this.keys[name] = kb.addKey(name, false);
      }
    }
  }

  /** Fold the first connected gamepad into `next` (standard mapping indices). */
  private readPad(next: Record<Action, boolean>): void {
    const pads = this.scene.input.gamepad;
    if (!pads || pads.total === 0) return;
    const pad = pads.getPad(0);
    if (!pad) return;
    const dead = 0.3;
    const lx = pad.axes.length > 0 ? pad.axes[0].getValue() : 0;
    const ly = pad.axes.length > 1 ? pad.axes[1].getValue() : 0;
    if (lx < -dead || pad.left) next.left = true;
    if (lx > dead || pad.right) next.right = true;
    if (ly < -dead || pad.up) next.up = true;
    if (ly > dead || pad.down) next.down = true;
    if (pad.A) next.jump = true; //                bottom face
    if (pad.X) next.attack = true; //              left face
    if (pad.B || pad.R1) next.dash = true; //      right face / right shoulder
    if (pad.Y || pad.L1) next.skill = true; //     top face / left shoulder
  }

  private blank(): Record<Action, boolean> {
    return { left: false, right: false, up: false, down: false, jump: false, dash: false, attack: false, skill: false };
  }

  /** Call once at the top of the scene update, before entities read input. */
  update(time: number): void {
    this.time = time;
    for (const a of ACTIONS) this.prev[a] = this.state[a];
    const next = this.blank();
    for (const [name, action] of Object.entries(KEY_MAP)) {
      const key = this.keys[name];
      if (key && key.isDown) next[action] = true;
    }
    this.readPad(next);
    for (const a of ACTIONS) {
      next[a] = next[a] || this.virtual[a];
      if (next[a] && !this.prev[a]) this.bufferedAt[a] = time; // record press edge
    }
    this.state = next;
  }

  isDown(a: Action): boolean {
    return this.state[a];
  }

  justPressed(a: Action): boolean {
    return this.state[a] && !this.prev[a];
  }

  justReleased(a: Action): boolean {
    return !this.state[a] && this.prev[a];
  }

  /** True if `a` was pressed within `ms` (and consumes the buffer). */
  consumeBuffered(a: Action, ms: number): boolean {
    const at = this.bufferedAt[a];
    if (at !== undefined && this.time - at <= ms) {
      this.bufferedAt[a] = undefined;
      return true;
    }
    return false;
  }

  /** Horizontal axis: -1 / 0 / +1. */
  axisX(): number {
    return (this.state.right ? 1 : 0) - (this.state.left ? 1 : 0);
  }

  /** For future on-screen touch buttons. */
  setVirtual(a: Action, on: boolean): void {
    this.virtual[a] = on;
  }
}
