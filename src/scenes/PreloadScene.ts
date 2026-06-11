import Phaser from 'phaser';
import { Assets, ENV_GROUND, ENV_WALL, envKey, envPath } from '../data/assetManifest';
import { Palette } from '../data/palette';
import {
  PlayerAnims,
  RunnerAnims,
  CrawlerAnims,
  SparkAnims,
  StrikerAnims,
  WardenAnims,
  GlassWitchAnims,
  ReflectionHoundAnims,
  FalseFaceAnims,
  FractureWispAnims,
  LookingGlassAnims,
  ArcherAnims,
  BomberAnims,
  StrangerAnims,
  PropAnims,
  registerAnims,
} from '../data/Animations';
import { FONT } from '../data/ui';

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
    for (const a of [
      Assets.crawler, Assets.spark, Assets.striker, Assets.warden,
      Assets.glassWitch, Assets.reflectionHound, Assets.falseFace, Assets.fractureWisp, Assets.lookingGlass,
      Assets.archer, Assets.bomber, Assets.stranger,
    ]) {
      this.load.spritesheet(a.key, a.path, { frameWidth: a.frameW, frameHeight: a.frameH });
    }
    for (const ts of [Assets.tileset, Assets.tilesetMirrors]) {
      this.load.spritesheet(ts.key, ts.path, { frameWidth: ts.frameW, frameHeight: ts.frameH });
    }
    this.load.image(Assets.bgFar.key, Assets.bgFar.path);
    this.load.image(Assets.bgMid.key, Assets.bgMid.path);
    this.load.image(Assets.bgNear.key, Assets.bgNear.path);
    this.load.image(Assets.fog.key, Assets.fog.path);
    this.load.image(Assets.bgFarMirror.key, Assets.bgFarMirror.path);
    this.load.image(Assets.bgMidMirror.key, Assets.bgMidMirror.path);
    this.load.image(Assets.bgNearMirror.key, Assets.bgNearMirror.path);
    this.load.image(Assets.fogMirror.key, Assets.fogMirror.path);
    this.load.image(Assets.dot.key, Assets.dot.path);
    this.load.image(Assets.chain.key, Assets.chain.path);
    this.load.image(Assets.vine.key, Assets.vine.path);
    this.load.image(Assets.root.key, Assets.root.path);
    this.load.image(Assets.banner.key, Assets.banner.path);
    this.load.image(Assets.moss.key, Assets.moss.path);
    this.load.image(Assets.fern.key, Assets.fern.path);
    this.load.image(Assets.stalactite.key, Assets.stalactite.path);
    this.load.image(Assets.mirror.key, Assets.mirror.path);
    this.load.image(Assets.soul.key, Assets.soul.path);
    this.load.image(Assets.heal.key, Assets.heal.path);
    this.load.image(Assets.urn.key, Assets.urn.path);
    this.load.image(Assets.critter.key, Assets.critter.path);
    this.load.image(Assets.cobweb.key, Assets.cobweb.path);
    this.load.spritesheet(Assets.torch.key, Assets.torch.path, {
      frameWidth: Assets.torch.frameW,
      frameHeight: Assets.torch.frameH,
    });
    for (const name of [...ENV_GROUND, ...ENV_WALL]) this.load.image(envKey(name), envPath(name));
  }

  create(): void {
    registerAnims(this, PlayerAnims);
    registerAnims(this, RunnerAnims);
    registerAnims(this, CrawlerAnims);
    registerAnims(this, SparkAnims);
    registerAnims(this, StrikerAnims);
    registerAnims(this, WardenAnims);
    registerAnims(this, GlassWitchAnims);
    registerAnims(this, ReflectionHoundAnims);
    registerAnims(this, FalseFaceAnims);
    registerAnims(this, FractureWispAnims);
    registerAnims(this, LookingGlassAnims);
    registerAnims(this, ArcherAnims);
    registerAnims(this, BomberAnims);
    registerAnims(this, StrangerAnims);
    registerAnims(this, PropAnims);
    // Make sure the display font is ready before any text is drawn (canvas text
    // bakes the font at creation; loading it late would show a fallback flash).
    // Boot flow: Title menu by default; ?edit → editor; ?play → straight to the
    // game (used by the screenshot/test harness so it never waits on the menu).
    const params = new URLSearchParams(location.search);
    const target = params.has('edit') ? 'EditorScene' : params.has('play') ? 'GameScene' : 'TitleScene';
    // Explicit hand-off: run the target, then shut THIS loader down (calling
    // scene.start from a late promise tick was leaving the loader rendering behind).
    const start = () => {
      this.scene.run(target);
      this.scene.stop();
    };
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.load) {
      Promise.all([fonts.load('16px "Dash Horizon"'), fonts.load('600 16px "Dash Horizon"')])
        .then(() => fonts.ready)
        .then(start)
        .catch(start);
    } else {
      start();
    }
  }

  private drawLoader(): void {
    const { width, height } = this.scale;
    const g = this.add.graphics();
    const barW = 180;
    const x = (width - barW) / 2;
    const y = height / 2;
    const pct = this.add
      .text(width / 2, y + 12, 'LOADING…', { fontFamily: FONT, fontSize: '8px', color: '#7ef0ff' })
      .setOrigin(0.5)
      .setAlpha(0.7);
    this.load.on('progress', (p: number) => {
      g.clear();
      g.fillStyle(Palette.stoneHi, 0.3).fillRect(x, y, barW, 3);
      g.fillStyle(Palette.grace, 1).fillRect(x, y, barW * p, 3);
      pct.setText(`LOADING… ${Math.round(p * 100)}%`);
    });
    // Belt-and-suspenders: guarantee the loader UI is gone when this scene ends.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      g.destroy();
      pct.destroy();
    });
  }
}
