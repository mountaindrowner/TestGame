import { RoomData } from '../roomData';
import { Room } from './build';

// BIO-02 entry — you climb out of the Warden's gate into the first mirrored hall.
// Open to the east (→ the Gallery). The arrival door 'from-gate' matches the
// BIO-01 gate's destination. Floor feet row = h-4 (18).
export function mirrorHall(): RoomData {
  const r = new Room('HALL OF FIRST REFLECTIONS', 48, 22).biome('mirrors').frame({ right: true });

  r.solid(8, 14, 7, 2); //   first ledge up from the floor
  r.platform(19, 12, 5); //  one-way step across
  r.solid(28, 15, 7, 2); //  mid ledge (runner)
  r.platform(39, 12, 4); //  high step toward the east mouth

  r.at('door', 5, 18, { id: 'from-gate', to: 'gate' }); // arrival from the BIO-01 gate

  // mirrors set into the back wall — you meet your reflection at once
  r.at('mirror', 13, 13, { scale: 0.3 });
  r.at('mirror', 23, 10, { scale: 0.22 });
  r.at('mirror', 34, 13, { scale: 0.3 });
  r.at('mirror', 44, 9, { scale: 0.2 });

  r.at('runner', 22, 17);
  r.at('runner', 31, 14);
  r.at('torch', 4, 18);
  r.at('torch', 31, 14);

  r.link('east', 'mirror-gallery');
  r.link('down', 'gate'); // reciprocal with the gate's up-link (map/validation)
  return r.build('mirror-hall');
}
