// BIO-01 "The First Fall" — Milestone 1 room.
// "Down and across": a descending, winding path of ledges over a molten floor,
// ending at a door. Built from primitives (not a giant ASCII grid) for precise,
// readable control. Tile codes match assetManifest.ts.
import { Tile } from './assetManifest';

export interface Spawn {
  type: 'player' | 'runner' | 'door' | 'torch';
  tx: number;
  ty: number;
}

export interface RoomData {
  name: string;
  w: number; // tiles
  h: number; // tiles
  tiles: number[][]; // [y][x], -1 empty
  spawns: Spawn[];
}

const W = 54;
const H = 38;

function blank(): number[][] {
  return Array.from({ length: H }, () => Array.from({ length: W }, () => Tile.EMPTY));
}

function inb(x: number, y: number): boolean {
  return x >= 0 && x < W && y >= 0 && y < H;
}

export function buildFirstFall(): RoomData {
  const t = blank();

  const solid = (x: number, y: number, w: number, h: number, code: number = Tile.STONE) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (inb(i, j)) t[j][i] = code;
  };
  const platform = (x: number, y: number, w: number) => {
    for (let i = x; i < x + w; i++) if (inb(i, y)) t[y][i] = Tile.PLATFORM;
  };
  const molten = (x: number, y: number, w: number) => {
    for (let i = x; i < x + w; i++) if (inb(i, y)) t[y][i] = Tile.MOLTEN;
  };

  // --- Outer shell: walls + ceiling + deep floor -------------------------
  solid(0, 0, W, 2); // ceiling
  solid(0, 0, 2, H); // left wall
  solid(W - 2, 0, 2, H); // right wall
  solid(0, H - 3, W, 3); // bedrock floor

  // --- Descending, winding ledges (down AND across) ----------------------
  // start high-left, step down-right, swing back left, etc.
  solid(2, 8, 9, 2); //  A  start ledge (player spawns here)
  platform(14, 11, 5); //  B  one-way hop
  solid(21, 14, 9, 2); //  C  ledge (runner patrols)
  platform(32, 12, 5); //  D  "across" — a step back up
  solid(40, 16, 10, 2); // E  long ledge to the right (runner patrols)
  solid(30, 20, 9, 2); //  F  back left and down
  solid(19, 24, 8, 2); //  G  (runner patrols)
  platform(11, 27, 6); //  H  one-way
  solid(3, 29, 8, 2); //   I  low-left ledge

  // crumbled pillar nub for silhouette interest
  solid(46, 24, 2, 6, Tile.CRACKED);
  solid(24, 30, 2, 5, Tile.CRACKED);

  // --- The molten basin + safe crossing to the door ----------------------
  // Deep floor top row becomes molten across the middle; stone is safe at the
  // edges. Stepping stones let you cross without burning.
  molten(13, H - 4, 28); //   hazard surface spanning the basin
  solid(41, H - 6, 11, 1); //  safe ledge on the right (the exit shelf)
  solid(2, H - 6, 9, 1); //    safe ledge on the left (landing from above)
  platform(17, H - 8, 4); //   stepping stone 1
  platform(24, H - 10, 4); //  stepping stone 2 (higher — the "across")
  platform(32, H - 8, 4); //   stepping stone 3

  // --- Top-edge lighting pass: any solid with empty above becomes STONE_TOP
  for (let y = 1; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (t[y][x] === Tile.STONE && t[y - 1][x] === Tile.EMPTY) t[y][x] = Tile.STONE_TOP;
    }
  }

  const spawns: Spawn[] = [
    { type: 'player', tx: 5, ty: 7 },
    { type: 'runner', tx: 26, ty: 13 },
    { type: 'runner', tx: 45, ty: 15 },
    { type: 'runner', tx: 23, ty: 23 },
    { type: 'door', tx: 49, ty: H - 7 }, // on the right exit shelf
    { type: 'torch', tx: 4, ty: 7 },
    { type: 'torch', tx: 48, ty: 15 },
    { type: 'torch', tx: 6, ty: 29 },
  ];

  return { name: 'THE FIRST FALL', w: W, h: H, tiles: t, spawns };
}
