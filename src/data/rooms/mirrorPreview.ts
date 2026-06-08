import { Room } from './build';
import { RoomData } from '../roomData';

/** BIO-02 tech preview (NOT the real House of Mirrors layout). A tall mirror-biome
 *  sandbox to (a) show the new tileset + background and (b) test Grace Burst: the
 *  high ledge is only reachable by air-dashing the wide gap. Reached via
 *  window.__gotoRoom('mirror-preview'); GameScene grants Grace Burst on entry. */
export function mirrorPreview(): RoomData {
  const W = 46;
  const H = 30;
  const r = new Room('HOUSE OF MIRRORS — PREVIEW', W, H).biome('mirrors').frame();

  r.solid(2, H - 6, 11, 2); //  start ledge (player spawns here)
  r.solid(17, H - 11, 7, 2); //  mid platform — a normal jump up-and-across
  r.platform(28, H - 16, 4); //  a one-way glass step higher
  r.solid(36, H - 22, 8, 2); //  HIGH ledge — the gap to it needs the air-dash
  r.molten(13, H - 4, 31); //    shard hazard along the floor (signals "don't fall")

  r.at('player', 5, H - 7);
  r.at('torch', 6, H - 7);
  r.at('torch', 39, H - 23); // marks the air-dash reward ledge

  return r.build('mirror-preview');
}
