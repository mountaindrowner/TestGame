import { RoomData } from '../roomData';
import { Room } from './build';

// Branch (closed catacomb chamber) — face what you buried: a Striker guards the
// Broken Memory, set on a carved rock pedestal. In/out via the ↑ door to the
// crossroads. Feet row = 15 (floor solid rows 16-17).
export function memory(): RoomData {
  const r = new Room('A BURIED MEMORY', 40, 18).fill();

  r.carve(2, 6, 36, 10); //  the chamber (closed; 2-thick walls, floor rows 16-17, ceiling rows 0-5)
  r.solid(17, 12, 6, 1); //  a rock pedestal the Memory rests over

  r.at('door', 5, 15, { id: 'from-cross', to: 'crossroads', toEntry: 'cross-mem' });
  r.at('striker', 28, 15);
  r.at('key', 20, 10); // the Broken Memory, floating over the pedestal
  // the shortcut loop: a second passage straight to the gate approach, so the
  // detour pays a pickup AND a faster way onward (LEVEL_DESIGN §3.5)
  r.at('door', 35, 15, { id: 'mem-out', to: 'gate', toEntry: 'gate-west' });
  r.at('torch', 6, 15);
  r.at('torch', 33, 15);
  r.at('jar', 11, 15);
  return r.build('memory');
}
