import { RoomData } from '../roomData';
import { Room } from './build';

// Spine end — THE SEALED GATE, carved catacomb. Re-authored for the build-up: a
// long torch-lit western APPROACH corridor opens into the arena proper, the Warden
// looming far east with the sealed portcullis visible behind it — you walk toward
// the fight. A west-side door is the shortcut loop back from A BURIED MEMORY.
// Arena floor kept flat (feet row 16) so the charge/slam has room.
export function gate(): RoomData {
  const r = new Room('THE SEALED GATE', 64, 20).fill();

  r.carve(0, 12, 18, 5); //  the approach: a tight corridor (rows 12-16) from the west edge
  r.carve(16, 8, 46, 9); //  the arena: open rows 8-16 to the east WALL (x62-63 solid)
  r.solid(20, 9, 6, 1); //   low rock shelves for silhouette, out of the Warden's lane
  r.solid(52, 9, 6, 1);

  r.at('guardian', 44, 16); // the Warden looms deep in the arena, before its gate
  // Opened (Warden down + Memory), the gate climbs UP into BIO-02 (the House of Mirrors).
  r.at('gate', 60, 16, { id: 'final', to: 'mirror-hall', toEntry: 'from-gate' });
  // torch breadcrumbs kindle along the approach — walking toward the light
  r.at('torch', 3, 16);
  r.at('torch', 9, 16);
  r.at('torch', 15, 16);
  r.at('torch', 22, 16);
  r.at('torch', 56, 16);

  r.link('west', 'crossroads');
  r.link('up', 'mirror-hall'); // reciprocal with mirror-hall's down-link (the gate climbs into BIO-02)
  return r.build('gate');
}
