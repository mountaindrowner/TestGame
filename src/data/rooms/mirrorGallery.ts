import { RoomData } from '../roomData';
import { Room } from './build';

// BIO-02 showpiece — a wide gallery lined with mirrors; the false faces watch.
// Open west (→ Hall). A central climb leads to the ↑ door into the Ascending Glass.
// Floor feet row = h-4 (18).
export function mirrorGallery(): RoomData {
  const r = new Room('THE GALLERY OF FALSE FACES', 56, 22).biome('mirrors').fill();
  r.carve(0, 3, 54, 16); // carved gallery: open west edge, right wall + rock floor/ceiling

  // a stepped climb to the central up-shaft
  r.platform(10, 15, 5);
  r.solid(17, 14, 6, 2); //  top 14
  r.solid(25, 12, 9, 2); //  top 12 — the climb ledge into the shaft
  r.platform(38, 15, 5); //  right-side wing
  r.solid(44, 14, 6, 2);
  // ── seamless climb UP into The Ascending Glass (carves through the ceiling) ──
  r.climbShaft(29, 0, 11); // ladders rows 0..11 above the row-12 ledge → open top edge

  r.at('door', 29, 11, { id: 'gallery-up', to: 'mirror-rise', toEntry: 'from-gallery' });

  // the gallery proper — a row of tall mirrors
  r.at('mirror', 8, 13, { scale: 0.34 });
  r.at('mirror', 15, 9, { scale: 0.24 });
  r.at('mirror', 29, 8, { scale: 0.22 });
  r.at('mirror', 41, 12, { scale: 0.32 });
  r.at('mirror', 50, 9, { scale: 0.26 });

  r.at('reflectionHound', 20, 17);
  r.at('glassWitch', 41, 8); //   floating caster, fans glass shards
  r.at('mirrorDouble', 31, 16); // YOUR REFLECTION — it shadows you and leaps with your finisher
  r.at('torch', 6, 18);
  r.at('torch', 52, 18);
  r.at('jar', 12, 18);
  r.at('jar', 33, 18);
  r.at('jar', 48, 18);

  r.link('west', 'mirror-hall');
  r.link('up', 'mirror-rise'); // composes into one seamless map (climb the shaft up)
  return r.build('mirror-gallery');
}
