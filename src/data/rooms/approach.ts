import { RoomData } from '../roomData';
import { Room } from './build';

// Spine room 3.5 — THE LONG APPROACH: BIO-01's breather/set-piece (LEVEL_DESIGN §3.6,
// LEVEL_GRAMMAR `breather`). Between the crossroads and the Warden sits a quiet,
// torch-lit vaulted hall with NO enemies — the trough of the tension wave, downtime
// to breathe before the peak. The torch colonnade breadcrumbs east toward the light
// (the signal language: "this way, and it's safe"); urns pay a little for the walk.
// Feet row at the edges = 16, matching crossroads/gate.
export function approach(): RoomData {
  const r = new Room('THE LONG APPROACH', 36, 20).fill();

  r.carve(0, 12, 36, 5); //  the corridor (rows 12-16), open at both side edges
  r.carve(8, 4, 20, 9); //   the vault: a tall hollow over the middle — the set-piece
  r.solid(13, 4, 2, 6); //   two rock columns hang into the vault (ancient colonnade)
  r.solid(21, 4, 2, 6);

  // the torch line — walking toward the light
  r.at('torch', 4, 16);
  r.at('torch', 11, 16);
  r.at('torch', 18, 16);
  r.at('torch', 25, 16);
  r.at('torch', 32, 16);
  r.at('jar', 9, 16);
  r.at('jar', 27, 16);

  r.link('west', 'crossroads');
  r.link('east', 'gate');
  return r.build('approach');
}
