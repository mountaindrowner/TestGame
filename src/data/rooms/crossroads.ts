import { RoomData } from '../roomData';
import { Room } from './build';

// Room 3 — the branch hub. Down-left to the buried memory; right to the gate.
export function crossroads(): RoomData {
  const r = new Room('THE CROSSROADS', 50, 28).shell();
  r.solid(21, 16, 8, 2); // central entry ledge (drop down to choose a way)
  r.platform(14, 20, 5); // step back up toward the entry
  r.platform(31, 20, 5);

  r.at('door', 25, 15, { id: 'from-descent', to: 'descent', toEntry: 'to-cross' });
  r.at('door', 7, 24, { id: 'to-memory', to: 'memory', toEntry: 'from-cross' });
  r.at('door', 43, 24, { id: 'to-gate', to: 'gate', toEntry: 'from-cross' });
  r.at('spark', 25, 9); // airborne, harasses from above the hub
  r.at('runner', 14, 24);
  r.at('torch', 4, 24);
  r.at('torch', 46, 24);
  return r.build('crossroads');
}
