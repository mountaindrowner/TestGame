import { Sem } from './assetManifest';
import { RoomData, Spawn } from './roomData';
import { buildRoom } from './levelGraph';

/** A room's placement inside the composited world (tile-space offset + size).
 *  Used for entity ownership, arena bounds, and the entry lookup. */
export interface Placement {
  id: string;
  name: string; // the sub-room's name (for per-region HUD flavor as you roam)
  ox: number; // tile-space offset of this room's (0,0) within the world
  oy: number;
  w: number;
  h: number;
}

/** A whole ENVIRONMENT composited into ONE big map. Same shape as RoomData (so
 *  GameScene builds it like any room), plus the per-room placements and the seam
 *  connectors carved between linked openings. Rooms of the SAME biome reachable by
 *  edge links from the start are merged; cross-biome links stay as transitions. */
export interface WorldData extends RoomData {
  placements: Placement[];
  startId: string;
  /** A sensible world-tile spawn for each composed room (its player spawn, else a
   *  door, else just inside its floor) — so a dev jump to any sub-area lands there. */
  entries: Record<string, { tx: number; ty: number }>;
}

type Dir = 'east' | 'west' | 'up' | 'down';
const DIRS: Dir[] = ['east', 'west', 'up', 'down'];
const OPP: Record<Dir, Dir> = { east: 'west', west: 'east', up: 'down', down: 'up' };
const DELTA: Record<Dir, { dx: number; dy: number }> = {
  east: { dx: 1, dy: 0 },
  west: { dx: -1, dy: 0 },
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
};

const isOpen = (c: number | undefined) => c === Sem.EMPTY; // carved passage

/** The contiguous OPEN span along one edge of a room, in the perpendicular axis,
 *  plus the room dimension along the edge. For east/west the span is rows; for
 *  up/down it's columns. Returns the largest open run (the doorway). */
function edgeOpening(tiles: number[][], w: number, h: number, dir: Dir): { lo: number; hi: number } | null {
  const runs: Array<{ lo: number; hi: number }> = [];
  let cur: { lo: number; hi: number } | null = null;
  const scan = (n: number, open: (i: number) => boolean) => {
    for (let i = 0; i < n; i++) {
      if (open(i)) cur = cur ? { lo: cur.lo, hi: i } : { lo: i, hi: i };
      else if (cur) {
        runs.push(cur);
        cur = null;
      }
    }
    if (cur) runs.push(cur);
    cur = null;
  };
  if (dir === 'east') scan(h, (y) => isOpen(tiles[y]?.[w - 1]));
  else if (dir === 'west') scan(h, (y) => isOpen(tiles[y]?.[0]));
  else if (dir === 'up') scan(w, (x) => isOpen(tiles[0]?.[x]));
  else scan(w, (x) => isOpen(tiles[h - 1]?.[x]));
  if (!runs.length) return null;
  return runs.sort((a, b) => b.hi - b.lo - (a.hi - a.lo))[0]; // widest run
}

/** Compose the environment reachable from `startId` (same-biome edge links only)
 *  into one big WorldData. Each linked neighbour is offset so the two rooms abut
 *  on the linked side and their doorway openings line up (floors for horizontal
 *  links, opening-centres for vertical). Non-composed links (cross-biome, or
 *  door spawns) are preserved on the merged room as ordinary transitions. */
export function composeWorld(startId: string): WorldData {
  const start = buildRoom(startId);
  const biome = start.biome; // undefined === depths; compose within one biome only
  const place = new Map<string, Placement>();
  const rooms = new Map<string, RoomData>();
  rooms.set(startId, start);
  place.set(startId, { id: startId, name: start.name, ox: 0, oy: 0, w: start.w, h: start.h });

  // BFS over edge links, computing aligned tile offsets.
  const queue = [startId];
  while (queue.length) {
    const id = queue.shift()!;
    const room = rooms.get(id)!;
    const p = place.get(id)!;
    const links = room.links ?? {};
    for (const dir of DIRS) {
      const to = links[dir];
      if (!to || place.has(to)) continue;
      const nb = buildRoom(to);
      if ((nb.biome ?? undefined) !== (biome ?? undefined)) continue; // stop at biome seams
      // The two openings we must align: this room's `dir` edge ↔ neighbour's opposite edge.
      const a = edgeOpening(room.tiles, room.w, room.h, dir);
      const b = edgeOpening(nb.tiles, nb.w, nb.h, OPP[dir]);
      if (!a || !b) continue; // can't seam without a shared opening — leave as a door/transition
      const { dx, dy } = DELTA[dir];
      let ox = p.ox;
      let oy = p.oy;
      if (dir === 'east') ox = p.ox + room.w;
      if (dir === 'west') ox = p.ox - nb.w;
      if (dir === 'up') oy = p.oy - nb.h;
      if (dir === 'down') oy = p.oy + room.h; // place neighbour below by THIS room's height
      if (dx !== 0) {
        // horizontal seam → align the floor (row below each opening) in world space
        const aFloor = p.oy + a.hi + 1;
        oy = aFloor - (b.hi + 1);
      } else {
        // vertical seam → align the opening centres in world space
        const aMid = p.ox + (a.lo + a.hi) / 2;
        ox = Math.round(aMid - (b.lo + b.hi) / 2);
      }
      rooms.set(to, nb);
      place.set(to, { id: to, name: nb.name, ox, oy, w: nb.w, h: nb.h });
      queue.push(to);
    }
  }

  // Normalise so the world's min offset is (0,0), then size the merged grid.
  const placements = [...place.values()];
  const minx = Math.min(...placements.map((q) => q.ox));
  const miny = Math.min(...placements.map((q) => q.oy));
  for (const q of placements) {
    q.ox -= minx;
    q.oy -= miny;
  }
  const W = Math.max(...placements.map((q) => q.ox + q.w));
  const H = Math.max(...placements.map((q) => q.oy + q.h));

  // Stamp each room's tiles into the merged grid (solid rock default fills gaps).
  const tiles: number[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => Sem.SOLID as number));
  const spawns: Spawn[] = [];
  // Exactly one player spawn: the start room's if it has one, else the first found
  // (so composing from any room in the component still yields a valid spawn).
  let playerSpawn: Spawn | undefined;
  for (const q of placements) {
    const r = rooms.get(q.id)!;
    for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) tiles[q.oy + y][q.ox + x] = r.tiles[y][x];
    for (const s of r.spawns) {
      const world = { ...s, tx: s.tx + q.ox, ty: s.ty + q.oy };
      if (s.type === 'player') {
        if (q.id === startId) playerSpawn = world;
        else if (!playerSpawn) playerSpawn = world;
        continue; // added once, after the loop
      }
      spawns.push(world);
    }
  }
  if (playerSpawn) spawns.unshift(playerSpawn);

  // A per-room default spawn (world tiles) for dev jumps to a specific sub-area.
  const entries: Record<string, { tx: number; ty: number }> = {};
  for (const q of placements) {
    const r = rooms.get(q.id)!;
    // Prefer the room's player spawn; else the first STANDABLE floor tile (open with
    // solid just below) — never a door or a climb-up hole you'd fall through.
    const ps = r.spawns.find((s) => s.type === 'player');
    let local = ps ? { tx: ps.tx, ty: ps.ty } : { tx: 3, ty: r.h - 4 };
    if (!ps) {
      // Open tile with SAFE floor directly below (solid/cracked/platform, never the
      // molten lake or a climb-up hole). Scan columns L→R, rows near the floor.
      const safe = (c: number | undefined) => c === Sem.SOLID || c === Sem.CRACKED || c === Sem.PLATFORM;
      outer: for (let x = 2; x < r.w - 2; x++) {
        for (let y = r.h - 5; y <= r.h - 2; y++) {
          if (r.tiles[y]?.[x] === Sem.EMPTY && safe(r.tiles[y + 1]?.[x])) {
            local = { tx: x, ty: y };
            break outer;
          }
        }
      }
    }
    entries[q.id] = { tx: local.tx + q.ox, ty: local.ty + q.oy };
  }

  // Keep only links/doors that LEAVE the composed world (e.g. cross-biome ascent).
  // Intra-world edge links are now just walkable seams, so drop them.
  const links: RoomData['links'] = {};
  for (const dir of DIRS) {
    const to = start.links?.[dir];
    if (to && !place.has(to)) (links as Record<string, string>)[dir] = to;
  }
  // Door spawns pointing at composed rooms are dropped (you simply walk there now);
  // doors leaving the world are kept (handled in the stamping loop above already).
  const keptSpawns = spawns.filter((s) => !(s.type === 'door' && s.to && place.has(s.to)));

  return {
    name: start.name,
    id: startId,
    w: W,
    h: H,
    tiles,
    spawns: keptSpawns,
    links,
    biome: start.biome,
    placements,
    startId,
    entries,
  };
}
