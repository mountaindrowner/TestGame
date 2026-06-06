import Phaser from 'phaser';
import { Assets } from '../data/assetManifest';
import { Palette } from '../data/palette';

type Emitter = Phaser.GameObjects.Particles.ParticleEmitter;

/** All particle emitters, created once. Bursts via explode(); ambient embers run
 *  continuously across the room. (Phaser 3.60+ particle API.) */
export class ParticleSystem {
  private dustE!: Emitter;
  private sparkE!: Emitter;
  private debrisE!: Emitter;
  private graceE!: Emitter;
  private trailE!: Emitter;
  private ambient?: Emitter;

  constructor(private scene: Phaser.Scene) {
    const tex = Assets.dot.key;

    this.dustE = scene.add.particles(0, 0, tex, {
      lifespan: 360,
      speed: { min: 20, max: 70 },
      angle: { min: 200, max: 340 },
      gravityY: 240,
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.7, end: 0 },
      tint: Palette.stoneHi,
      emitting: false,
    }).setDepth(40);

    this.sparkE = scene.add.particles(0, 0, tex, {
      lifespan: 260,
      speed: { min: 60, max: 180 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: Palette.grace,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    }).setDepth(60);

    this.debrisE = scene.add.particles(0, 0, tex, {
      lifespan: 520,
      speed: { min: 40, max: 160 },
      gravityY: 300,
      scale: { start: 0.7, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [Palette.molten, Palette.moltenHi],
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    }).setDepth(55);

    this.graceE = scene.add.particles(0, 0, tex, {
      lifespan: 900,
      speedY: { min: -120, max: -40 },
      speedX: { min: -30, max: 30 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [Palette.grace, Palette.bloom],
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    }).setDepth(120);

    this.trailE = scene.add.particles(0, 0, tex, {
      lifespan: 220,
      speed: 0,
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: Palette.grace,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    }).setDepth(58);
  }

  /** Continuous embers/motes rising through the whole room. */
  startAmbient(widthPx: number, heightPx: number): void {
    this.ambient = this.scene.add.particles(0, 0, Assets.dot.key, {
      x: { min: 0, max: widthPx },
      y: { min: 0, max: heightPx },
      lifespan: { min: 2600, max: 5200 },
      speedY: { min: -16, max: -4 },
      speedX: { min: -8, max: 8 },
      scale: { start: 0.32, end: 0 },
      alpha: { start: 0.0, end: 0.5, ease: 'Sine.easeInOut' },
      tint: [Palette.moltenHi, Palette.grace, Palette.stoneHi],
      blendMode: Phaser.BlendModes.ADD,
      frequency: 130,
      quantity: 1,
    });
    this.ambient.setDepth(45);
  }

  dust(x: number, y: number, n = 7): void {
    this.dustE.explode(n, x, y);
  }
  sparks(x: number, y: number, n = 8): void {
    this.sparkE.explode(n, x, y);
  }
  debris(x: number, y: number, n = 14): void {
    this.debrisE.explode(n, x, y);
  }
  graceMotes(x: number, y: number, n = 26): void {
    this.graceE.explode(n, x, y);
  }
  trail(x: number, y: number): void {
    this.trailE.explode(1, x, y);
  }
}
