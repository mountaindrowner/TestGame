// BIO-01 "The First Fall" — Milestone 1 room.
// "Down and across": a descending, winding path of ledges over a molten floor,
// ending at a door. Built from primitives (not a giant ASCII grid) for precise,
// readable control. Cells hold SEMANTIC codes; the Autotiler turns them into
// edge-aware visual tiles.
import { Sem } from './assetManifest';

export type SpawnType =
  | 'player'
  | 'door'
  | 'torch'
  | 'key' // the Broken Memory pickup
  | 'gate' // the locked exit gate (needs key + guardian down)
  | 'runner'
  | 'crawler'
  | 'spark'
  | 'striker'
  | 'guardian';

export interface Spawn {
  type: SpawnType;
  tx: number;
  ty: number;
  id?: string; // door/gate identity within this room
  to?: string; // door: destination room id
  toEntry?: string; // door: id of the door to arrive at in the destination room
}

export interface RoomData {
  name: string;
  id?: string; // room id (set by the level graph)
  w: number; // tiles
  h: number; // tiles
  tiles: number[][]; // [y][x] of Sem codes, -1 empty
  spawns: Spawn[];
  // Edge links: walking off this side enters the named room (seamless-ish travel).
  links?: { east?: string; west?: string; up?: string; down?: string };
}

const W = 54;
const H = 38;

function blank(): number[][] {
  return Array.from({ length: H }, () => Array.from({ length: W }, () => Sem.EMPTY as number));
}

function inb(x: number, y: number): boolean {
  return x >= 0 && x < W && y >= 0 && y < H;
}

export function buildFirstFall(): RoomData {
  const t = blank();

  const solid = (x: number, y: number, w: number, h: number, code: number = Sem.SOLID) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (inb(i, j)) t[j][i] = code;
  };
  const platform = (x: number, y: number, w: number) => {
    for (let i = x; i < x + w; i++) if (inb(i, y)) t[y][i] = Sem.PLATFORM;
  };
  const molten = (x: number, y: number, w: number) => {
    for (let i = x; i < x + w; i++) if (inb(i, y)) t[y][i] = Sem.MOLTEN;
  };

  // --- Outer shell: walls + ceiling + deep floor -------------------------
  // Right side is OPEN — walking off the right edge continues into THE DESCENT.
  solid(0, 0, W, 2); // ceiling
  solid(0, 0, 2, H); // left wall
  solid(0, H - 3, W, 3); // bedrock floor

  // --- Descending, winding ledges (down AND across) ----------------------
  solid(2, 8, 9, 2); //  A  start ledge (player spawns here)
  platform(14, 11, 5); //  B  one-way hop
  solid(21, 14, 9, 2); //  C  ledge (runner patrols)
  platform(32, 12, 5); //  D  "across" — a step back up
  solid(40, 16, 10, 2); // E  long ledge to the right (runner patrols)
  solid(30, 20, 9, 2); //  F  back left and down
  solid(19, 24, 8, 2); //  G  (runner patrols)
  platform(11, 27, 6); //  H  one-way
  solid(3, 29, 8, 2); //   I  low-left ledge

  // crumbled pillar nubs for silhouette interest
  solid(46, 24, 2, 6, Sem.CRACKED);
  solid(24, 30, 2, 5, Sem.CRACKED);

  // --- The molten basin + safe crossing to the door ----------------------
  molten(13, H - 4, 28); //   hazard surface spanning the basin
  solid(41, H - 6, 11, 1); //  safe ledge on the right (the exit shelf)
  solid(2, H - 6, 9, 1); //    safe ledge on the left (landing from above)
  platform(17, H - 8, 4); //   stepping stone 1
  platform(24, H - 10, 4); //  stepping stone 2 (higher — the "across")
  platform(32, H - 8, 4); //   stepping stone 3

  const spawns: Spawn[] = [
    { type: 'player', tx: 5, ty: 7 },
    { type: 'runner', tx: 26, ty: 13 },
    { type: 'runner', tx: 45, ty: 15 },
    { type: 'runner', tx: 23, ty: 23 },
    { type: 'torch', tx: 4, ty: 7 },
    { type: 'torch', tx: 48, ty: 15 },
    { type: 'torch', tx: 6, ty: 29 },
  ];

  return { name: 'THE FIRST FALL', w: W, h: H, tiles: t, spawns, links: { east: 'descent' } };
}
