import Phaser from 'phaser';
import { Assets } from '../data/assetManifest';
import { RoomData } from '../data/roomData';
import { World } from '../data/Tunables';

interface Light {
  x: number;
  y: number;
  radius: number;
  strength: number;
}

/** Cheap, moody lighting: a screen-space shadow layer that light POOLS erase back
 *  out of — so you see what's lit (around the figure + torches) and the depths
 *  recede into shadow. No Light2D pipeline; just a RenderTexture we re-fill + erase
 *  each frame. Reads in any biome (the shadow is tinted to match). */
export class Lighting {
  private rt: Phaser.GameObjects.RenderTexture;
  private brush: Phaser.GameObjects.Image;
  private statics: Light[] = [];
  private dark: number;
  private alpha: number;

  constructor(scene: Phaser.Scene, room: RoomData, biome?: string) {
    const w = scene.scale.width;
    const h = scene.scale.height;
    this.rt = scene.add.renderTexture(0, 0, w, h).setOrigin(0, 0).setScrollFactor(0).setDepth(85);
    // soft round brush (the dot sprite), off the display list — used only to erase
    this.brush = scene.make.image({ key: Assets.dot.key, add: false }).setOrigin(0.5);
    const cold = biome && biome !== 'depths';
    this.dark = cold ? 0x070a16 : 0x0a0610; // cold violet-black vs warm-black
    this.alpha = 0.6;

    // Torches are warm light sources; molten surfaces glow too.
    const T = World.tile;
    for (const s of room.spawns) {
      if (s.type === 'torch') this.statics.push({ x: s.tx * T + T / 2, y: s.ty * T + T / 2 - 8, radius: 92, strength: 0.95 });
      if (s.type === 'gate') this.statics.push({ x: s.tx * T + T / 2, y: s.ty * T, radius: 70, strength: 0.8 });
    }
  }

  update(cam: Phaser.Cameras.Scene2D.Camera, playerX: number, playerY: number): void {
    this.rt.clear();
    this.rt.fill(this.dark, this.alpha);
    // the figure always carries a pool of light (keeps gameplay readable)
    this.erase(cam, playerX, playerY - 8, 132, 1);
    for (const l of this.statics) this.erase(cam, l.x, l.y, l.radius, l.strength);
  }

  private erase(cam: Phaser.Cameras.Scene2D.Camera, wx: number, wy: number, radius: number, strength: number): void {
    const sx = wx - cam.scrollX;
    const sy = wy - cam.scrollY;
    if (sx < -radius || sy < -radius || sx > this.rt.width + radius || sy > this.rt.height + radius) return; // off-screen
    // a little flicker so torch pools breathe
    const flick = strength * (0.9 + 0.1 * Math.sin(this.rt.scene.time.now * 0.006 + wx));
    this.brush.setScale((radius * 2) / this.brush.width).setAlpha(flick);
    this.rt.erase(this.brush, sx, sy);
  }
}
