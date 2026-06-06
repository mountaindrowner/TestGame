import Phaser from 'phaser';
import { Assets } from '../data/assetManifest';
import { Palette } from '../data/palette';

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

  constructor(private scene: Phaser.Scene) {
    this.vw = scene.scale.width;
    this.vh = scene.scale.height;

    // Sky gradient: a deep void fading to a barely-warm dark at the crypt floor.
    const sky = scene.add.graphics().setScrollFactor(0).setDepth(0);
    const top = Phaser.Display.Color.IntegerToColor(0x07070d); // near-black void
    const mid = Phaser.Display.Color.IntegerToColor(Palette.bgDeep);
    const bot = Phaser.Display.Color.IntegerToColor(0x1a0f1c); // faint warm deep
    sky.fillGradientStyle(top.color, top.color, mid.color, mid.color, 1);
    sky.fillRect(0, 0, this.vw, this.vh * 0.6);
    sky.fillGradientStyle(mid.color, mid.color, bot.color, bot.color, 1);
    sky.fillRect(0, this.vh * 0.6, this.vw, this.vh * 0.4);

    // The one far light: a tiny flame at the very end of the dark, its glow the
    // only illumination down here. Screen-fixed (infinitely distant), behind the
    // far graves so they silhouette against it; flickers in update().
    this.makeFlame(this.vw / 2, this.vh * 0.44);

    this.addLayer(Assets.bgFar.key, 2, 0.1, 0.05);
    this.addLayer(Assets.bgMid.key, 4, 0.28, 0.12);
    this.addLayer(Assets.bgNear.key, 6, 0.55, 0.28);

    // Foreground fog drifting in front of the world.
    this.fog = scene.add
      .tileSprite(0, 0, this.vw, this.vh, Assets.fog.key)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(115)
      .setAlpha(0.55)
      .setBlendMode(Phaser.BlendModes.SCREEN);
  }

  private makeFlame(x: number, y: number): void {
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
      mk(Palette.molten, 0.2, 30, 22), // wide warm halo
      mk(Palette.moltenHi, 0.5, 9, 9), // inner glow
      mk(Palette.bloom, 0.9, 1.6, 2.4, -1), // the flame core
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
