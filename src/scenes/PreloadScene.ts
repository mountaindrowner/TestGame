import Phaser from 'phaser';
import { Assets } from '../data/assetManifest';
import { Palette } from '../data/palette';
import { PlayerAnims, RunnerAnims, registerAnims } from '../data/Animations';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload(): void {
    this.drawLoader();

    this.load.spritesheet(Assets.player.key, Assets.player.path, {
      frameWidth: Assets.player.frameW,
      frameHeight: Assets.player.frameH,
    });
    this.load.spritesheet(Assets.runner.key, Assets.runner.path, {
      frameWidth: Assets.runner.frameW,
      frameHeight: Assets.runner.frameH,
    });
    this.load.spritesheet(Assets.tileset.key, Assets.tileset.path, {
      frameWidth: Assets.tileset.frameW,
      frameHeight: Assets.tileset.frameH,
    });
    this.load.image(Assets.bgFar.key, Assets.bgFar.path);
    this.load.image(Assets.bgMid.key, Assets.bgMid.path);
    this.load.image(Assets.bgNear.key, Assets.bgNear.path);
    this.load.image(Assets.fog.key, Assets.fog.path);
    this.load.image(Assets.dot.key, Assets.dot.path);
    this.load.image(Assets.chain.key, Assets.chain.path);
    this.load.image(Assets.vine.key, Assets.vine.path);
    this.load.image(Assets.root.key, Assets.root.path);
    this.load.image(Assets.banner.key, Assets.banner.path);
  }

  create(): void {
    registerAnims(this, PlayerAnims);
    registerAnims(this, RunnerAnims);
    // GameScene is the world; UIScene runs in parallel above it for the HUD.
    this.scene.start('GameScene');
  }

  private drawLoader(): void {
    const { width, height } = this.scale;
    const g = this.add.graphics();
    const barW = 180;
    const x = (width - barW) / 2;
    const y = height / 2;
    this.add
      .text(width / 2, y - 18, 'R E P E N T A N C E', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#7ef0ff',
      })
      .setOrigin(0.5)
      .setAlpha(0.7);
    this.load.on('progress', (p: number) => {
      g.clear();
      g.fillStyle(Palette.stoneHi, 0.3).fillRect(x, y, barW, 3);
      g.fillStyle(Palette.grace, 1).fillRect(x, y, barW * p, 3);
    });
  }
}
