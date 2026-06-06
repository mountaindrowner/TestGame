import { Sem } from '../assetManifest';
import { RoomData, Spawn, SpawnType } from '../roomData';

export type Dir = 'east' | 'west' | 'up' | 'down';

/** Tiny fluent helper for hand-authoring rooms from primitives. Cells hold
 *  SEMANTIC codes; the Autotiler turns them into edge-aware visual tiles.
 *  `frame({left,right})` leaves a side OPEN (no wall) so the player can walk off
 *  that edge into the linked neighbour; `link(dir,to)` records the neighbour. */
export class Room {
  private t: number[][];
  private spawns: Spawn[] = [];
  private _links: Partial<Record<Dir, string>> = {};

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
  /** Ceiling (2) + bedrock floor (3) always; side walls unless that side is open. */
  frame(open: { left?: boolean; right?: boolean } = {}): this {
    this.solid(0, 0, this.w, 2);
    this.solid(0, this.h - 3, this.w, 3);
    if (!open.left) this.solid(0, 0, 2, this.h);
    if (!open.right) this.solid(this.w - 2, 0, 2, this.h);
    return this;
  }
  /** Fully closed room (a dead-end branch). */
  shell(): this {
    return this.frame();
  }
  link(dir: Dir, to: string): this {
    this._links[dir] = to;
    return this;
  }
  at(type: SpawnType, tx: number, ty: number, extra: Partial<Spawn> = {}): this {
    this.spawns.push({ type, tx, ty, ...extra });
    return this;
  }
  build(id: string): RoomData {
    return { name: this.name, id, w: this.w, h: this.h, tiles: this.t, spawns: this.spawns, links: this._links };
  }
}
