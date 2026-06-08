import { RoomData } from '../roomData';
import { Room } from './build';

// Spine end — open to the west (crossroads); the sealed gate caps the east wall.
// The Guardian holds it; pass only with the Broken Memory AND the Guardian down.
export function gate(): RoomData {
  const r = new Room('THE SEALED GATE', 56, 20).frame({ left: true, right: false });
  r.platform(16, 13, 6);
  r.platform(34, 13, 6);

  r.at('guardian', 28, 16);
  // Opened (Warden down + Memory), the gate no longer ends the game — it climbs UP
  // into BIO-02, the House of Mirrors (the Shame route).
  r.at('gate', 52, 16, { id: 'final', to: 'mirror-hall', toEntry: 'from-gate' });
  r.at('torch', 6, 16);
  r.at('torch', 50, 8);

  r.link('west', 'crossroads');
  r.link('up', 'mirror-hall'); // reciprocal with mirror-hall's down-link (the gate climbs into BIO-02)
  return r.build('gate');
}
