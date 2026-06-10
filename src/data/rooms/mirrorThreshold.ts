import { RoomData } from '../roomData';
import { Room } from './build';

// BIO-02 pre-boss — the threshold of the Untrue Image. A Hollow Striker bars the
// climb to the ↑ door into the boss hall. Closed shell. Floor feet row = h-4 (16).
export function mirrorThreshold(): RoomData {
  const r = new Room('THRESHOLD OF THE UNTRUE', 44, 20).biome('mirrors').fill();
  r.carve(2, 3, 40, 14); // carved chamber (closed; rock walls/floor/ceiling)

  // ── seamless entrance: a hole you climb up out of the Ascending Glass into ──
  r.carve(5, 17, 3, 3); //   bottom-edge hole (x5-7), flanked by floor
  r.platform(13, 12, 5);
  r.solid(21, 13, 7, 2); //  top 13
  r.solid(30, 9, 8, 2); //   top 9 — the climb ledge into the shaft
  // ── seamless exit UP into the Hall of the Untrue Image ──
  r.climbShaft(34, 0, 8); //  ladders rows 0..8 above the row-9 ledge → open top edge

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
  r.link('down', 'mirror-rise'); //   seamless stack: up from the Ascending Glass…
  r.link('up', 'untrue-image'); //    …and up into the boss hall
  return r.build('mirror-threshold');
}
