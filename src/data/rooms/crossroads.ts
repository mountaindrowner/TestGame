import { RoomData } from '../roomData';
import { Room } from './build';

// Spine room 3 — THE CROSSROADS, carved catacomb rock. The true branch hub: a
// through-passage (west ↔ descent, east ↔ gate), a taller central vault for the
// airborne spark, a ↑ door down to the buried memory, and — in the upper nook — a
// VISIBLE sealed door to THE HIDDEN VAULT, whose molten lake inside needs the
// Grace Burst (earned from the Warden): the planted "come back here" gate.
// Feet row at the edges = 16.
export function crossroads(): RoomData {
  const r = new Room('THE CROSSROADS', 58, 20).fill();

  r.carve(0, 12, 58, 5); //  through-passage rows 12-16, reaches both side edges (floor row17)
  r.carve(18, 6, 22, 6); //  central vault (rows 6-11) above it — airspace for the spark
  r.carve(46, 7, 8, 4); //   the upper-right nook…
  r.solid(46, 11, 5, 1); //  …reached by a wall shelf

  r.at('runner', 16, 16);
  r.at('archer', 48, 16); // ranged: looses bolts down the passage
  r.at('spark', 28, 9); //   harasses from the central vault
  r.at('door', 29, 16, { id: 'cross-mem', to: 'memory', toEntry: 'from-cross' });
  // the tease: a door you can REACH early — what's behind it, you can't cross yet
  r.at('door', 51, 10, { id: 'cross-vault', to: 'vault', toEntry: 'vault-in' });
  r.at('torch', 6, 16);
  r.at('torch', 52, 16);
  r.at('torch', 30, 11);
  r.at('jar', 10, 16);
  r.at('jar', 47, 9); // in the nook
  r.at('jar', 44, 16);

  r.link('west', 'descent');
  r.link('east', 'gate');
  return r.build('crossroads');
}
