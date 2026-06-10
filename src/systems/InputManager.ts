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

/** Single abstraction between devices and the game. Funnels keyboard (now) and
 *  later touch/gamepad into a unified action API with edge + buffer timing. */
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
