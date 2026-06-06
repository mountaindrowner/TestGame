import { RoomData } from '../roomData';
import { Room } from './build';

// Branch (closed) — face what you buried: a Striker guards the Broken Memory key.
// Reached/left via the ↑ door back to the crossroads. Floor feet row 14.
export function memory(): RoomData {
  const r = new Room('A BURIED MEMORY', 40, 18).shell();
  r.solid(18, 11, 4, 1); // pedestal under the key

  r.at('door', 5, 14, { id: 'from-cross', to: 'crossroads', toEntry: 'cross-mem' });
  r.at('striker', 28, 14);
  r.at('key', 20, 10); // the Broken Memory, floating over the pedestal
  r.at('torch', 6, 14);
  r.at('torch', 34, 14);
  return r.build('memory');
}
