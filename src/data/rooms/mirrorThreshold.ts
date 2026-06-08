import { RoomData } from '../roomData';
import { Room } from './build';

// BIO-02 pre-boss — the threshold of the Untrue Image. A Hollow Striker bars the
// climb to the ↑ door into the boss hall. Closed shell. Floor feet row = h-4 (16).
export function mirrorThreshold(): RoomData {
  const r = new Room('THRESHOLD OF THE UNTRUE', 44, 20).biome('mirrors').shell();

  r.platform(13, 12, 5);
  r.solid(21, 13, 7, 2); //  top 13
  r.solid(30, 9, 8, 2); //   top 9 — the up-door ledge

  r.at('door', 6, 16, { id: 'from-rise', to: 'mirror-rise', toEntry: 'rise-up' });
  r.at('door', 34, 8, { id: 'thresh-up', to: 'untrue-image', toEntry: 'from-threshold' });

  r.at('mirror', 10, 11, { scale: 0.28 });
  r.at('mirror', 26, 8, { scale: 0.22 });
  r.at('mirror', 40, 12, { scale: 0.3 });

  r.at('lookingGlass', 26, 15); // armoured — flank it or punish its recovery
  r.at('falseFace', 15, 15); //    a quick duelist
  r.at('torch', 6, 16);
  r.at('torch', 40, 12);
  r.at('jar', 11, 16);
  r.at('jar', 16, 16);
  return r.build('mirror-threshold');
}
