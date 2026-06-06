import { RoomData } from '../roomData';
import { Room } from './build';

// Room 5 — the finale. The Guardian holds the sealed gate. Beat it AND carry the
// Broken Memory to pass. Completing the gate ends the level.
export function gate(): RoomData {
  const r = new Room('THE SEALED GATE', 52, 30).shell();
  r.platform(14, 20, 5); // dodge perches
  r.platform(33, 20, 5);

  r.at('door', 5, 26, { id: 'from-cross', to: 'crossroads', toEntry: 'to-gate' });
  r.at('guardian', 26, 26);
  r.at('gate', 48, 26, { id: 'final' });
  r.at('torch', 4, 26);
  r.at('torch', 48, 8);
  return r.build('gate');
}
