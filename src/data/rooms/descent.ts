import { RoomData } from '../roomData';
import { Room } from './build';

// Spine room 2 — THE LOWER VAULTS, now carved catacomb rock (no floating platforms):
// a humped passage that rises over a rock mass in the middle, open at both side edges
// (walk west ↔ first-fall, east ↔ crossroads). Feet row at the edges = 16 (h-4).
export function descent(): RoomData {
  const r = new Room('THE LOWER VAULTS', 60, 20).fill();

  // Humped corridor: west low (floor row17) → middle raised 2 tiles (floor row15) → east low.
  r.carve(0, 13, 22, 4); //  west passage  (open rows 13-16, reaches the west edge)
  r.carve(20, 11, 20, 4); // middle rise   (open rows 11-14; overlaps west at x20-21 = a step up)
  r.carve(38, 13, 22, 4); // east passage  (open rows 13-16, reaches the east edge)
  // a small carved nook above the middle, reached by a wall shelf — catacomb texture + a jar
  r.carve(26, 6, 9, 4);
  r.solid(26, 9, 5, 1); //   shelf up into the nook from the middle floor

  r.at('runner', 16, 16);
  r.at('crawler', 34, 14);
  r.at('runner', 52, 16);
  r.at('jar', 30, 8); //     tucked in the nook
  r.at('jar', 46, 16);
  r.at('torch', 8, 16);
  r.at('torch', 34, 14);
  r.at('torch', 52, 16);

  r.link('west', 'first-fall');
  r.link('east', 'crossroads');
  return r.build('descent');
}
