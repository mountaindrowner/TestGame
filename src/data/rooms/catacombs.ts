import { RoomData } from '../roomData';
import { Room } from './build';

/** Catacomb-grammar PROOF room (depths). The whole room starts as solid rock and
 *  the path is CARVED out — a weaving switchback climb whose every shelf is part of
 *  the wall (attached to alternating sides), so nothing floats. Establishes the
 *  grammar (fill→carve, wall-attached shelves) before rolling it into the path.
 *  Reach it via window.__gotoRoom('catacombs'); plays with lighting + ledge-grab. */
export function catacombs(): RoomData {
  const W = 40;
  const H = 36;
  const r = new Room('THE CATACOMBS', W, H).fill();

  // Carve the main vertical chamber out of the rock (3-thick walls, floor rows
  // 34-35, ceiling rows 0-2).
  r.carve(3, 3, 34, 31);
  r.carve(3, 5, 10, 3); // a small weaving alcove off the upper-left (a nook)

  // Switchback shelves — each ATTACHED to a side wall (connected rock, ~3 rows
  // apart, overlapping past centre so each is a short up-and-across hop).
  r.solid(3, 31, 16, 2); //  L1
  r.solid(21, 28, 16, 2); // R2
  r.solid(3, 25, 16, 2); //  L3
  r.solid(21, 22, 16, 2); // R4
  r.solid(3, 19, 16, 2); //  L5
  r.solid(21, 16, 16, 2); // R6
  r.solid(3, 13, 16, 2); //  L7
  r.solid(21, 10, 16, 2); // R8 (near the top)

  r.at('player', 6, 33); // entry, on the floor (no door used when jumped-to)
  r.at('door', 6, 33, { id: 'cat-bottom', to: 'first-fall' }); // a way back

  // Light pools up the climb + a little life.
  r.at('torch', 10, 30);
  r.at('torch', 30, 27);
  r.at('torch', 8, 18);
  r.at('torch', 30, 9);
  r.at('jar', 32, 33);
  r.at('jar', 8, 6); // tucked in the alcove
  r.at('crawler', 28, 27);
  r.at('spark', 18, 20);
  return r.build('catacombs');
}
