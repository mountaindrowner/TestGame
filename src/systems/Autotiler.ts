import { Sem, Vis } from '../data/assetManifest';
import { RoomData } from '../data/roomData';

// Treat these as "solid" for edge-masking (molten sits on stone, so stone under
// it shouldn't grow a lit lip). Platforms are thin & separate — not mask-solid.
function maskSolid(code: number): boolean {
  return code === Sem.SOLID || code === Sem.CRACKED || code === Sem.MOLTEN;
}

function hash(x: number, y: number): number {
  let n = (x * 374761393 + y * 668265263) & 0xffffffff;
  n = Math.imul(n ^ (n >>> 13), 1274126177) & 0xffffffff;
  return ((n ^ (n >>> 16)) >>> 0) % 1000;
}

/** Convert the room's semantic grid into VISUAL tile indices: each solid cell
 *  becomes a wall keyed by which orthogonal sides are exposed (edges + rounded
 *  convex corners), and big interiors scatter across a few variants so the fill
 *  never looks stamped. Out-of-bounds counts as solid (room border stays clean). */
export function autotile(room: RoomData): number[][] {
  const { w, h, tiles } = room;
  const at = (x: number, y: number): number =>
    x < 0 || y < 0 || x >= w || y >= h ? Sem.SOLID : tiles[y][x];

  const out: number[][] = [];
  for (let y = 0; y < h; y++) {
    const row: number[] = [];
    for (let x = 0; x < w; x++) {
      const c = tiles[y][x];
      if (c === Sem.EMPTY) {
        row.push(-1);
      } else if (c === Sem.PLATFORM) {
        row.push(Vis.PLATFORM);
      } else if (c === Sem.MOLTEN) {
        row.push(Vis.MOLTEN);
      } else {
        // SOLID or CRACKED -> mask of exposed orthogonal sides
        let mask = 0;
        if (!maskSolid(at(x, y - 1))) mask |= 1; // top
        if (!maskSolid(at(x + 1, y))) mask |= 2; // right
        if (!maskSolid(at(x, y + 1))) mask |= 4; // bottom
        if (!maskSolid(at(x - 1, y))) mask |= 8; // left
        if (mask === 0) {
          if (c === Sem.CRACKED) row.push(Vis.CRACK);
          else {
            const r = hash(x, y) % 10;
            row.push(r < 2 ? Vis.INT_A : r < 4 ? Vis.INT_B : 0); // mostly base, some variants
          }
        } else {
          row.push(mask); // 1..15 -> edge/corner tiles
        }
      }
    }
    out.push(row);
  }
  return out;
}
