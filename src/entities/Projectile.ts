import Phaser from 'phaser';
import { Assets } from '../data/assetManifest';
import { Palette } from '../data/palette';

/** A pooled enemy projectile (Shame Spark's burst). Lives in an Arcade group;
 *  killed on hit, on a wall, by the player's slash, or after its lifespan. */
export class Projectile extends Phaser.Physics.Arcade.Image {
  declare body: Phaser.Physics.Arcade.Body;
  public damage = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, Assets.dot.key);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false).setVisible(false);
    this.body.setAllowGravity(false);
    this.disableBody(true, true);
  }

  fire(x: number, y: number, vx: number, vy: number, damage: number, lifespanMs: number): void {
    this.enableBody(true, x, y, true, true);
    this.body.setAllowGravity(false);
    this.body.setVelocity(vx, vy);
    this.body.setCircle(3);
    this.damage = damage;
    this.setScale(2.4).setTint(Palette.moltenHi).setBlendMode(Phaser.BlendModes.ADD).setDepth(57);
    this.scene.time.delayedCall(lifespanMs, () => {
      if (this.active) this.kill();
    });
  }

  kill(): void {
    this.disableBody(true, true);
  }
}
