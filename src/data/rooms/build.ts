import { Sem } from '../assetManifest';
import { RoomData, Spawn, SpawnType } from '../roomData';
import { vhash, wave } from '../variation';

export type Dir = 'east' | 'west' | 'up' | 'down';

/** Tiny fluent helper for hand-authoring rooms from primitives. Cells hold
 *  SEMANTIC codes; the Autotiler turns them into edge-aware visual tiles.
 *  `frame({left,right})` leaves a side OPEN (no wall) so the player can walk off
 *  that edge into the linked neighbour; `link(dir,to)` records the neighbour. */
export class Room {
  private t: number[][];
  private spawns: Spawn[] = [];
  private _links: Partial<Record<Dir, string>> = {};
  private _biome?: string;

  constructor(private name: string, private w: number, private h: number) {
    this.t = Array.from({ length: h }, () => Array.from({ length: w }, () => Sem.EMPTY as number));
  }

  private inb(x: number, y: number): boolean {
    return x >= 0 && x < this.w && y >= 0 && y < this.h;
  }

  solid(x: number, y: number, w: number, h: number, code: number = Sem.SOLID): this {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (this.inb(i, j)) this.t[j][i] = code;
    return this;
  }
  platform(x: number, y: number, w: number): this {
    for (let i = x; i < x + w; i++) if (this.inb(i, y)) this.t[y][i] = Sem.PLATFORM;
    return this;
  }
  molten(x: number, y: number, w: number): this {
    for (let i = x; i < x + w; i++) if (this.inb(i, y)) this.t[y][i] = Sem.MOLTEN;
    return this;
  }
  /** Fill the whole room with solid rock — the catacomb grammar starts solid and
   *  CARVES the walkable negative space out (so every ledge/passage is part of the
   *  rock mass, never a floating island). */
  fill(code: number = Sem.SOLID): this {
    for (let j = 0; j < this.h; j++) for (let i = 0; i < this.w; i++) this.t[j][i] = code;
    return this;
  }
  /** Dig a rectangular passage/chamber out of the rock (sets cells empty). */
  carve(x: number, y: number, w: number, h: number): this {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (this.inb(i, j)) this.t[j][i] = Sem.EMPTY;
    return this;
  }
  /** Ceiling (organic cave roof) + bedrock floor (3) always; side walls unless open. */
  frame(open: { left?: boolean; right?: boolean } = {}): this {
    this.caveCeiling();
    this.solid(0, 0, this.w, 1); // thin solid cap so the very top never has gaps
    this.solid(0, this.h - 3, this.w, 3);
    if (!open.left) this.solid(0, 0, 2, this.h);
    if (!open.right) this.solid(this.w - 2, 0, 2, this.h);
    return this;
  }

  /** An irregular, ancient-cave roof: depth varies per column + occasional
   *  hanging stalactite nubs, so the underside reads jagged, never boxed. */
  private caveCeiling(): void {
    const phase = this.w * 0.37 + this.h * 0.13; // each room flows a little differently
    for (let x = 0; x < this.w; x++) {
      // Smooth flow (wave) + fine grain (vhash). Kept shallow (≤4) so hanging
      // geometry never clips a head on a high ledge; long dripstones come from the
      // non-colliding stalactite decor instead. (ART_VARIATION §3, §5)
      const d = Math.min(4, 2 + Math.floor(wave(x, phase) * 2.5 + vhash(x, 0, 7) * 1.5));
      this.solid(x, 0, 1, d);
      if (vhash(x, 0, 13) > 0.9) this.solid(x, d, 1, 1, Sem.CRACKED); // small stalactite nub
    }
  }
  /** Fully closed room (a dead-end branch). */
  shell(): this {
    return this.frame();
  }
  link(dir: Dir, to: string): this {
    this._links[dir] = to;
    return this;
  }
  biome(name: string): this {
    this._biome = name;
    return this;
  }
  at(type: SpawnType, tx: number, ty: number, extra: Partial<Spawn> = {}): this {
    this.spawns.push({ type, tx, ty, ...extra });
    return this;
  }
  build(id: string): RoomData {
    return { name: this.name, id, w: this.w, h: this.h, tiles: this.t, spawns: this.spawns, links: this._links, biome: this._biome };
  }
}
