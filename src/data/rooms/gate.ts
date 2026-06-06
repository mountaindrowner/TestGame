import { RoomData } from '../roomData';
import { Room } from './build';

// Spine end — open to the west (crossroads); the sealed gate caps the east wall.
// The Guardian holds it; pass only with the Broken Memory AND the Guardian down.
export function gate(): RoomData {
  const r = new Room('THE SEALED GATE', 56, 20).frame({ left: true, right: false });
  r.platform(16, 13, 6);
  r.platform(34, 13, 6);

  r.at('guardian', 28, 16);
  r.at('gate', 50, 16, { id: 'final' });
  r.at('torch', 6, 16);
  r.at('torch', 50, 8);

  r.link('west', 'crossroads');
  return r.build('gate');
}
