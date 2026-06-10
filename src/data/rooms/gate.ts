import { RoomData } from '../roomData';
import { Room } from './build';

// Spine end — THE SEALED GATE, a carved catacomb arena. Open to the west (crossroads);
// the sealed PORTCULLIS caps the solid east wall. The Warden holds it; pass only with
// the Broken Memory AND the Warden down → the lift rises into the House of Mirrors.
// Floor kept flat (feet row 16) so the Warden's charge/slam has room.
export function gate(): RoomData {
  const r = new Room('THE SEALED GATE', 56, 20).fill();

  r.carve(0, 9, 54, 8); //   the arena: open rows 9-16 from the west edge to the east WALL (x54-55 solid)
  r.solid(2, 10, 8, 1); //   a low rock shelf (texture; out of the Warden's lane)
  r.solid(44, 10, 8, 1);

  r.at('guardian', 28, 16);
  // Opened (Warden down + Memory), the gate climbs UP into BIO-02 (the House of Mirrors).
  r.at('gate', 52, 16, { id: 'final', to: 'mirror-hall', toEntry: 'from-gate' });
  r.at('torch', 6, 16);
  r.at('torch', 48, 16);

  r.link('west', 'crossroads');
  r.link('up', 'mirror-hall'); // reciprocal with mirror-hall's down-link (the gate climbs into BIO-02)
  return r.build('gate');
}
