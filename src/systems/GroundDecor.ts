import Phaser from 'phaser';
import { Sem, decorSetFor, envKey } from '../data/assetManifest';
import { World } from '../data/Tunables';
import { vhash, chance, pick } from '../data/variation';
import type { RoomData } from '../data/roomData';

/** Scatter a biome's environment-decor set across the room so the catacombs feel
 *  inhabited and ancient: rubble/bones/relics (depths) or glass/false-faces
 *  (mirrors) settle on FLOOR TOPS, carved reliefs hang on exposed WALL faces.
 *  Placement follows docs/ART_VARIATION.md — logical (things sit where
 *  gravity/structure puts them) and deterministic (a pure function of tile
 *  position; the same room always dresses the same). Pure cosmetics: depth sits
 *  behind gameplay, nothing collides. */
export class GroundDecor {
  constructor(scene: Phaser.Scene, room: RoomData, biome?: string) {
    // Every biome now gets a set (depths bone-and-grave, mirrors glass-and-mask;
    // Court reuses depths). decorSetFor() resolves which pieces to scatter.
    const { ground, wall } = decorSetFor(biome);
    const { w, h, tiles } = room;
    const solidish = (c: number) => c === Sem.SOLID || c === Sem.CRACKED;
    // Things settle on any standable surface — rock floors AND one-way shelves
    // (so the mirror tower's many ledges get dressed, not just its few wide floors).
    const standOn = (c: number) => solidish(c) || c === Sem.PLATFORM;
    const T = World.tile;

    let lastX = -10;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 2; x < w - 2; x++) {
        // FLOOR TOP: an open cell with a surface below = somewhere things settle.
        const open = tiles[y][x] === Sem.EMPTY;
        const floorBelow = standOn(tiles[y + 1]?.[x]);
        if (open && floorBelow && chance(x, y, 0.27, 31) && x - lastX >= 2) {
          lastX = x;
          const name = pick(x, y, ground, 17);
          const px = x * T + T / 2 + Math.round((vhash(x, y, 41) - 0.5) * 6); // slight settle jitter
          const py = (y + 1) * T;
          scene.add
            .image(px, py, envKey(name))
            .setOrigin(0.5, 1)
            .setFlipX(vhash(x, y, 53) > 0.5)
            .setDepth(8) // behind enemies/player/props, in front of the wall art
            .setAlpha(0.96);
        }
        // WALL FACE: a solid cell whose EAST or WEST side is exposed to open air,
        // with solid above+below (a real wall, not a ledge lip) → a carved relief.
        if (solidish(tiles[y][x]) && solidish(tiles[y - 1]?.[x]) && solidish(tiles[y + 1]?.[x]) && chance(x, y, 0.085, 67)) {
          const east = tiles[y][x + 1] === Sem.EMPTY;
          const west = tiles[y][x - 1] === Sem.EMPTY;
          if (east || west) {
            const name = pick(x, y, wall, 71);
            const px = x * T + (east ? T + 1 : -1);
            scene.add
              .image(px, y * T + T / 2, envKey(name))
              .setOrigin(east ? 0 : 1, 0.5)
              .setDepth(7)
              .setAlpha(0.85);
          }
        }
      }
    }
  }
}
