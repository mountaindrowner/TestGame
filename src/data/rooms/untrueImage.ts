import { RoomData } from '../roomData';
import { Room } from './build';

// BIO-02 finale — the Hall of the Untrue Image. Entering seals the room (arena) and
// plays the boss intro; defeating THE UNTRUE IMAGE (your reflection at its worst)
// completes the House of Mirrors. Mirrors ring the hall — you fight yourself.
// Floor feet row = h-4 (14).
export function untrueImage(): RoomData {
  const r = new Room('HALL OF THE UNTRUE IMAGE', 48, 18).biome('mirrors').fill();
  r.carve(2, 3, 44, 12); // carved boss hall (closed; rock walls/floor/ceiling)
  r.carve(5, 15, 3, 3); //  seamless entrance: a hole you climb up into (sealed while the boss lives)

  r.platform(13, 10, 6);
  r.platform(29, 10, 6);

  r.at('door', 6, 14, { id: 'from-threshold', to: 'mirror-threshold', toEntry: 'thresh-up' });
  r.at('mirrorboss', 32, 14);

  // a full ring of mirrors — every wall shows the reflection
  r.at('mirror', 10, 9, { scale: 0.3 });
  r.at('mirror', 19, 7, { scale: 0.24 });
  r.at('mirror', 28, 7, { scale: 0.24 });
  r.at('mirror', 38, 9, { scale: 0.3 });
  r.at('mirror', 44, 11, { scale: 0.22 });

  r.at('torch', 6, 14);
  r.at('torch', 44, 8);
  r.link('down', 'mirror-threshold'); // seamless stack: climb up from the threshold
  return r.build('untrue-image');
}
