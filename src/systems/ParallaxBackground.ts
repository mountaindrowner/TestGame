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

  constructor(private scene: Phaser.Scene) {
    this.vw = scene.scale.width;
    this.vh = scene.scale.height;

    // Sky gradient (deep void above, warm core-glow below).
    const sky = scene.add.graphics().setScrollFactor(0).setDepth(0);
    const top = Phaser.Display.Color.IntegerToColor(Palette.bgDeep);
    const bot = Phaser.Display.Color.IntegerToColor(0x241228); // warm-ish deep
    sky.fillGradientStyle(top.color, top.color, bot.color, bot.color, 1);
    sky.fillRect(0, 0, this.vw, this.vh);

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
  }
}
