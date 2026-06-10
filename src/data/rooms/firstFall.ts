import { RoomData } from '../roomData';
import { Room } from './build';

// BIO-01 opener — THE FIRST FALL, carved catacomb rock. You wake high in a vertical
// shaft and descend a switchback of wall-attached rock shelves (drops, no floating
// islands) to a molten-scarred floor, then out the east edge into the Lower Vaults.
// Feet floor row = 34 (h-4); east edge open for the walk-through link.
export function firstFall(): RoomData {
  const r = new Room('THE FIRST FALL', 54, 38).fill();

  r.carve(2, 3, 52, 32); // the shaft (left wall stays; open to the east edge; floor rows 35-37)

  // descending switchback shelves, each attached to a wall + overlapping so the
  // drop to the next is short and forgiving (the tutorial plays out here).
  r.solid(2, 8, 18, 2); //   L1 — you wake here
  r.solid(16, 13, 18, 2); // R2
  r.solid(2, 18, 18, 2); //  L3
  r.solid(16, 23, 18, 2); // R4
  r.solid(2, 28, 18, 2); //  L5 → drop to the floor (left, clear of the molten)

  r.molten(24, 35, 5); // a molten scar across the floor — jump it on the way east

  r.at('player', 6, 7);
  r.at('runner', 26, 12); // on R2
  r.at('runner', 26, 22); // on R4
  r.at('runner', 42, 34); // on the floor before the exit
  r.at('torch', 4, 7);
  r.at('torch', 30, 13);
  r.at('torch', 46, 34);
  r.at('jar', 10, 34);

  r.link('east', 'descent');
  return r.build('first-fall');
}
