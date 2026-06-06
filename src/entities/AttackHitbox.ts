import Phaser from 'phaser';

/** An invisible, short-lived Arcade zone enabled only during a swing's active
 *  frames. Tracks who it already hit so one swing deals damage once per enemy. */
export class AttackHitbox extends Phaser.GameObjects.Zone {
  declare body: Phaser.Physics.Arcade.Body;
  public live = false;
  public hitSet = new Set<Phaser.GameObjects.GameObject>();

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 1, 1);
    this.setOrigin(0, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.disable();
  }

  /** Enable centered on (cx, cy) with size w x h. */
  fire(cx: number, cy: number, w: number, h: number): void {
    const x = cx - w / 2;
    const y = cy - h / 2;
    this.setPosition(x, y);
    this.setSize(w, h);
    this.body.setSize(w, h);
    this.body.reset(x, y);
    this.body.enable = true;
    this.live = true;
    this.hitSet.clear();
  }

  disable(): void {
    this.live = false;
    this.body.enable = false;
  }
}
