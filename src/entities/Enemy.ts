import Phaser from 'phaser';
import { EnemyTune as E } from '../data/Tunables';
import { Palette } from '../data/palette';
import { Assets } from '../data/assetManifest';
import { Sfx } from '../systems/Sfx';
import { JuiceSystem } from '../systems/JuiceSystem';
import { ParticleSystem } from '../systems/ParticleSystem';
import { Player } from './Player';

export interface EnemyDeps {
  player: Player;
  sfx: Sfx;
  juice: JuiceSystem;
  particles: ParticleSystem;
  groundCheck: (x: number, y: number) => boolean; // solid tile present?
}

type State = 'patrol' | 'windup' | 'chase' | 'hurt' | 'dead';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  public health = E.maxHealth;
  public readonly contactDamage = E.contactDamage;

  private deps: EnemyDeps;
  private facing = -1;
  private mode: State = 'patrol';
  private windupEndAt = 0;
  private stunUntil = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, deps: EnemyDeps) {
    super(scene, x, y, Assets.runner.key, 0);
    this.deps = deps;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setDepth(46);
    this.body.setSize(E.bodyW, E.bodyH);
    this.body.setOffset(E.bodyOffsetX, E.bodyOffsetY);
    this.setCollideWorldBounds(true);
    this.play('runner-run');
  }

  isAlive(): boolean {
    return this.mode !== 'dead';
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.mode === 'dead') return;
    if (this.deps.juice.frozen) return;

    const onGround = this.body.blocked.down;
    const stunned = time < this.stunUntil;
    if (!stunned && this.mode === 'hurt') this.mode = 'patrol';

    if (!stunned) {
      const p = this.deps.player;
      const dx = p.x - this.x;
      const dy = Math.abs(p.y - this.y);
      const inRange = Math.abs(dx) < E.aggroRange && dy < E.aggroVertical;

      switch (this.mode) {
        case 'patrol':
          this.patrol(onGround);
          if (inRange) {
            this.mode = 'windup';
            this.windupEndAt = time + E.windupMs;
            this.facing = dx < 0 ? -1 : 1;
            this.body.setVelocityX(0);
            this.play('runner-windup', true);
          }
          break;
        case 'windup':
          this.body.setVelocityX(0);
          if (time >= this.windupEndAt) {
            this.mode = 'chase';
            this.play('runner-run', true);
          }
          break;
        case 'chase':
          this.facing = dx < 0 ? -1 : 1;
          this.body.setVelocityX(this.facing * E.chaseSpeed);
          if (!inRange && Math.abs(dx) > E.aggroRange * 1.3) this.mode = 'patrol';
          // don't run off a ledge blindly while chasing
          if (onGround && !this.groundAhead()) this.body.setVelocityX(0);
          break;
      }
    }

    this.setFlipX(this.facing < 0); // art faces right by default (snout points +x)
  }

  private patrol(onGround: boolean): void {
    this.body.setVelocityX(this.facing * E.patrolSpeed);
    if (this.body.blocked.left) this.facing = 1;
    else if (this.body.blocked.right) this.facing = -1;
    else if (onGround && E.edgeCheck && !this.groundAhead()) this.facing *= -1;
  }

  private groundAhead(): boolean {
    const ax = this.x + this.facing * (E.bodyW / 2 + 3);
    const ay = this.y + 4;
    return this.deps.groundCheck(ax, ay);
  }

  takeDamage(amount: number, fromX: number): void {
    if (this.mode === 'dead') return;
    this.health -= amount;
    const dir = this.x < fromX ? -1 : 1;
    this.body.setVelocity(dir * E.knockbackTaken, -80);
    this.stunUntil = this.scene.time.now + 140;
    this.mode = 'hurt';
    this.play('runner-hurt', true);
    this.setTintFill(Palette.bloom);
    this.scene.time.delayedCall(60, () => this.clearTint());
    this.deps.particles.sparks(this.x, this.y - 8, 6);
    if (this.health <= 0) this.die();
  }

  private die(): void {
    this.mode = 'dead';
    this.deps.sfx.enemyDie();
    this.deps.particles.debris(this.x, this.y - 8, 16);
    this.deps.juice.flash(Palette.molten, 60);
    this.body.enable = false;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 1.4,
      scaleY: 0.6,
      duration: 160,
      onComplete: () => this.destroy(),
    });
  }
}
