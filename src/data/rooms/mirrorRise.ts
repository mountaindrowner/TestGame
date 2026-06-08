import { RoomData } from '../roomData';
import { Room } from './build';

// BIO-02 traversal centerpiece — a tall climb that REQUIRES Grace Burst: one wide
// gap near the top is only crossable by air-dashing. Closed shell; in at the bottom
// (from-gallery), out at the top (rise-up). Floor feet row = h-4 (30).
export function mirrorRise(): RoomData {
  const r = new Room('THE ASCENDING GLASS', 40, 34).biome('mirrors').shell();

  r.solid(5, 26, 7, 2); //   top 26
  r.platform(14, 23, 5); //  23
  r.solid(21, 20, 7, 2); //  top 20
  r.platform(14, 17, 5); //  17
  r.solid(6, 14, 7, 2); //   top 14 — left high ledge
  // ── GRACE BURST GAP ──  ~8 tiles across to the right ledge (jump+air-dash)
  r.solid(20, 12, 8, 2); //  top 12
  r.platform(30, 9, 5); //   9
  r.solid(28, 6, 9, 2); //   top 6 — the exit ledge

  r.at('door', 6, 30, { id: 'from-gallery', to: 'mirror-gallery', toEntry: 'gallery-up' });
  r.at('door', 32, 5, { id: 'rise-up', to: 'mirror-threshold', toEntry: 'from-rise' });

  r.at('mirror', 11, 10, { scale: 0.24 });
  r.at('mirror', 25, 22, { scale: 0.26 });
  r.at('mirror', 34, 16, { scale: 0.24 });

  r.at('spark', 22, 17);
  r.at('spark', 30, 11);
  r.at('torch', 6, 29);
  r.at('torch', 33, 5);
  return r.build('mirror-rise');
}
