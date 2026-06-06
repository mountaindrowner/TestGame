import { RoomData } from '../roomData';
import { Room } from './build';

// Room 4 — a dead-end branch: face the buried memory (a Striker guards it) and
// claim the Broken Memory key. "Face what you buried."
export function memory(): RoomData {
  const r = new Room('A BURIED MEMORY', 40, 26).shell();
  r.solid(18, 21, 4, 1); // small pedestal under the key

  r.at('door', 5, 22, { id: 'from-cross', to: 'crossroads', toEntry: 'to-memory' });
  r.at('striker', 28, 22);
  r.at('key', 20, 20); // the Broken Memory, floating over the pedestal
  r.at('torch', 6, 22);
  r.at('torch', 34, 22);
  return r.build('memory');
}
