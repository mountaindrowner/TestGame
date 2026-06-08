import Phaser from 'phaser';
import { Assets, biomeOf } from '../data/assetManifest';
import { Palette } from '../data/palette';

// Per-biome sky gradient + far "light" tints (depths = warm flame; mirrors = cold glass).
const THEME: Record<string, { sky: [number, number, number]; light: [number, number, number] }> = {
  depths: { sky: [0x07070d, Palette.bgDeep, 0x1a0f1c], light: [Palette.molten, Palette.moltenHi, Palette.bloom] },
  mirrors: { sky: [0x05060f, 0x0d0a1e, 0x160a26], light: [0x6a4fff, 0xb9a8ff, 0xffffff] },
};

interface Layer {
  ts: Phaser.GameObjects.TileSprite;
  rx: number;
  ry: number;
}

/** Multi-layer parallax. Layers are baked PNGs shown as viewport-sized TileSprites
 *  with scrollFactor 0; we scroll only the texture (tilePosition) by the camera
 *  offset times each layer's rate. No per-frame repaint. */
export class ParallaxBackground {
  private layers: Layer[] = [];
  private fog!: Phaser.GameObjects.TileSprite;
  private vw: number;
  private vh: number;
  private flame: Phaser.GameObjects.Image[] = []; // [wide glow, inner glow, core]

  constructor(private scene: Phaser.Scene, biome?: string) {
    this.vw = scene.scale.width;
    this.vh = scene.scale.height;
    const theme = THEME[biome ?? 'depths'] ?? THEME.depths;
    const bg = biomeOf(biome).bg;

    // Sky gradient: a deep void fading to a faint themed glow at the floor.
    const sky = scene.add.graphics().setScrollFactor(0).setDepth(0);
    const top = Phaser.Display.Color.IntegerToColor(theme.sky[0]); // near-black void
    const mid = Phaser.Display.Color.IntegerToColor(theme.sky[1]);
    const bot = Phaser.Display.Color.IntegerToColor(theme.sky[2]);
    sky.fillGradientStyle(top.color, top.color, mid.color, mid.color, 1);
    sky.fillRect(0, 0, this.vw, this.vh * 0.6);
    sky.fillGradientStyle(mid.color, mid.color, bot.color, bot.color, 1);
    sky.fillRect(0, this.vh * 0.6, this.vw, this.vh * 0.4);

    // The one far light at the end of the dark — a warm flame in the depths, a
    // cold pale glass-light in the House of Mirrors. Flickers in update().
    this.makeFlame(this.vw / 2, this.vh * 0.44, theme.light);

    this.addLayer(bg.far, 2, 0.1, 0.05);
    this.addLayer(bg.mid, 4, 0.28, 0.12);
    this.addLayer(bg.near, 6, 0.55, 0.28);

    // Foreground fog drifting in front of the world.
    this.fog = scene.add
      .tileSprite(0, 0, this.vw, this.vh, bg.fog)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(115)
      .setAlpha(0.55)
      .setBlendMode(Phaser.BlendModes.SCREEN);
  }

  private makeFlame(x: number, y: number, light: [number, number, number]): void {
    const mk = (tint: number, alpha: number, sx: number, sy: number, dy = 0) =>
      this.scene.add
        .image(x, y + dy, Assets.dot.key)
        .setScrollFactor(0.03) // barely parallaxes — it's at the end of the world
        .setDepth(1)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setTint(tint)
        .setAlpha(alpha)
        .setScale(sx, sy);
    this.flame = [
      mk(light[0], 0.2, 30, 22), // wide halo
      mk(light[1], 0.5, 9, 9), // inner glow
      mk(light[2], 0.9, 1.6, 2.4, -1), // the core
    ];
  }

  private addLayer(key: string, depth: number, rx: number, ry: number): void {
    const ts = this.scene.add
      .tileSprite(0, 0, this.vw, this.vh, key)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth);
    this.layers.push({ ts, rx, ry });
  }

  update(cam: Phaser.Cameras.Scene2D.Camera, time: number): void {
    for (const l of this.layers) {
      l.ts.tilePositionX = cam.scrollX * l.rx;
      l.ts.tilePositionY = cam.scrollY * l.ry;
    }
    this.fog.tilePositionX = cam.scrollX * 1.1 + time * 0.004;
    this.fog.tilePositionY = cam.scrollY * 0.5;

    // Flame flicker — slow breathing plus a faint quicker waver.
    const f = 0.82 + 0.13 * Math.sin(time * 0.006) + 0.05 * Math.sin(time * 0.019);
    if (this.flame.length) {
      this.flame[0].setAlpha(0.2 * f).setScale(30 * (0.96 + 0.06 * Math.sin(time * 0.004)), 22);
      this.flame[1].setAlpha(0.5 * f);
      this.flame[2].setAlpha(0.9 * f);
    }
  }
}
