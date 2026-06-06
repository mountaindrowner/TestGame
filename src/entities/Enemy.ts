import Phaser from 'phaser';
import { Palette } from '../data/palette';
import { Assets } from '../data/assetManifest';
import { Sfx } from '../systems/Sfx';
import { JuiceSystem } from '../systems/JuiceSystem';
import { ParticleSystem } from '../systems/ParticleSystem';
import { Player } from './Player';
import type { EnemyConfig, EnemyTuneBase } from '../data/enemyRegistry';

export interface EnemyDeps {
  player: Player;
  sfx: Sfx;
  juice: JuiceSystem;
  particles: ParticleSystem;
  groundCheck: (x: number, y: number) => boolean; // solid tile present?
  fireProjectile?: (x: number, y: number, vx: number, vy: number, damage: number, lifespanMs: number) => void;
}

type State = 'patrol' | 'windup' | 'chase' | 'strike' | 'recover' | 'hurt' | 'dead';

/** One config-driven enemy. Behaviour is selected by `cfg.behavior`; tune values,
 *  art, body and weak-point rules all come from the enemy registry so the family
 *  grows by data, not by new classes. The Impulse Runner ('lunger') is the
 *  original implementation, preserved beat-for-beat. */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  public health: number;
  public readonly contactDamage: number;
  public readonly coreBonusMult: number;
  public readonly cfg: EnemyConfig;

  private deps: EnemyDeps;
  private t: EnemyTuneBase;
  private facing = -1;
  private mode: State = 'patrol';
  private windupEndAt = 0;
  private strikeEndAt = 0;
  private recoverEndAt = 0;
  private stunUntil = 0;
  private nextFireAt = 0;
  private latched = false; // pursuer aggro, once on never off
  private coreGlow?: Phaser.GameObjects.Image; // burning ember weak point (runner only)

  constructor(scene: Phaser.Scene, x: number, y: number, deps: EnemyDeps, cfg: EnemyConfig) {
    super(scene, x, y, cfg.spriteKey, 0);
    this.deps = deps;
    this.cfg = cfg;
    this.t = cfg.tune;
    this.health = cfg.tune.maxHealth;
    this.contactDamage = cfg.tune.contactDamage;
    this.coreBonusMult = cfg.coreBonusMult;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setDepth(cfg.depth ?? 46);
    if (cfg.scale) this.setScale(cfg.scale);
    this.body.setSize(cfg.body.w, cfg.body.h);
    this.body.setOffset(cfg.body.offX, cfg.body.offY);
    this.setCollideWorldBounds(true);
    if (cfg.flying) this.body.setAllowGravity(false);
    if (cfg.tint !== undefined) this.setTint(cfg.tint); // interim identity (placeholder art)
    this.play(cfg.anims.run);

    if (cfg.hasCore) {
      this.coreGlow = scene.add
        .image(x, y, Assets.dot.key)
        .setTint(Palette.moltenHi)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth((cfg.depth ?? 46) + 1)
        .setScale(2.4);
    }
    if (cfg.behavior === 'flyer_ranged') this.nextFireAt = scene.time.now + (this.t.fireEveryMs ?? 1500);
  }

  isAlive(): boolean {
    return this.mode !== 'dead';
  }

  private fromBehind(ax: number): boolean {
    return (this.facing === 1 && ax < this.x) || (this.facing === -1 && ax > this.x);
  }

  /** Per-behaviour weak point: the high-reward punish window. See CombatSystem. */
  isCoreHit(attackerX: number): boolean {
    switch (this.cfg.behavior) {
      case 'lunger':
        return this.mode === 'windup' || this.fromBehind(attackerX);
      case 'pursuer':
        return this.fromBehind(attackerX);
      case 'heavy_telegraph':
        return this.mode === 'recover' || this.fromBehind(attackerX);
      default:
        return false;
    }
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.mode === 'dead') return;
    if (this.coreGlow) this.updateCoreGlow(time);
    if (this.deps.juice.frozen) return;

    const stunned = time < this.stunUntil;
    if (!stunned && this.mode === 'hurt') this.mode = 'patrol';
    if (stunned) {
      this.setFlipX(this.facing < 0);
      return;
    }

    switch (this.cfg.behavior) {
      case 'lunger':
        this.updateLunger(time);
        break;
      case 'pursuer':
        this.updatePursuer();
        break;
      case 'heavy_telegraph':
        this.updateHeavy(time);
        break;
      case 'flyer_ranged':
        this.updateFlyer(time);
        break;
    }

    this.setFlipX(this.facing < 0); // art faces right by default (snout points +x)
  }

  // --- behaviours -------------------------------------------------------
  private updateLunger(time: number): void {
    const onGround = this.body.blocked.down;
    const p = this.deps.player;
    const dx = p.x - this.x;
    const dy = Math.abs(p.y - this.y);
    const inRange = Math.abs(dx) < this.t.aggroRange && dy < this.t.aggroVertical;

    switch (this.mode) {
      case 'patrol':
        this.patrol(onGround);
        if (inRange) {
          this.mode = 'windup';
          this.windupEndAt = time + this.t.windupMs;
          this.facing = dx < 0 ? -1 : 1;
          this.body.setVelocityX(0);
          this.play(this.cfg.anims.windup, true);
        }
        break;
      case 'windup':
        this.body.setVelocityX(0);
        if (time >= this.windupEndAt) {
          this.mode = 'chase';
          this.play(this.cfg.anims.run, true);
        }
        break;
      case 'chase':
        this.facing = dx < 0 ? -1 : 1;
        this.body.setVelocityX(this.facing * this.t.chaseSpeed);
        if (!inRange && Math.abs(dx) > this.t.aggroRange * 1.3) this.mode = 'patrol';
        if (onGround && !this.groundAhead()) this.body.setVelocityX(0);
        break;
    }
  }

  private updatePursuer(): void {
    const onGround = this.body.blocked.down;
    const p = this.deps.player;
    const dx = p.x - this.x;
    const dy = Math.abs(p.y - this.y);
    if (Math.abs(dx) < this.t.aggroRange && dy < this.t.aggroVertical) this.latched = true;

    if (this.latched) {
      this.facing = dx < 0 ? -1 : 1;
      if (onGround && !this.groundAhead()) this.body.setVelocityX(0); // won't walk into the void
      else this.body.setVelocityX(this.facing * this.t.chaseSpeed);
    } else {
      this.patrol(onGround);
    }
  }

  private updateHeavy(time: number): void {
    const onGround = this.body.blocked.down;
    const p = this.deps.player;
    const dx = p.x - this.x;
    const dy = Math.abs(p.y - this.y);
    const inRange = Math.abs(dx) < this.t.aggroRange && dy < this.t.aggroVertical;

    switch (this.mode) {
      case 'patrol':
        this.patrol(onGround);
        if (inRange) {
          this.mode = 'windup';
          this.windupEndAt = time + this.t.windupMs;
          this.facing = dx < 0 ? -1 : 1;
          this.body.setVelocityX(0);
          this.play(this.cfg.anims.windup, true);
        }
        break;
      case 'windup':
        this.body.setVelocityX(0);
        if (time >= this.windupEndAt) {
          this.mode = 'strike';
          this.strikeEndAt = time + (this.t.strikeMs ?? 250);
          this.facing = dx < 0 ? -1 : 1;
          this.body.setVelocityX(this.facing * this.t.chaseSpeed);
          this.play(this.cfg.anims.strike ?? this.cfg.anims.run, true);
        }
        break;
      case 'strike':
        if (onGround && !this.groundAhead()) this.body.setVelocityX(0);
        if (time >= this.strikeEndAt) {
          this.mode = 'recover';
          this.recoverEndAt = time + (this.t.recoveryMs ?? 500);
          this.body.setVelocityX(0);
          this.play(this.cfg.anims.run, true);
        }
        break;
      case 'recover':
        this.body.setVelocityX(0);
        if (time >= this.recoverEndAt) this.mode = 'patrol';
        break;
    }
  }

  private updateFlyer(time: number): void {
    const p = this.deps.player;
    const dx = p.x - this.x;
    const inRange = Math.abs(dx) < this.t.aggroRange && Math.abs(p.y - this.y) < this.t.aggroVertical;
    const speed = this.t.chaseSpeed;

    if (inRange) {
      this.facing = dx < 0 ? -1 : 1;
      const targetX = p.x - this.facing * (this.t.standoff ?? 120); // hover on the player's side
      const targetY = p.y - (this.t.hoverOffset ?? 60);
      this.body.setVelocityX(Phaser.Math.Clamp((targetX - this.x) * 4, -speed, speed));
      this.body.setVelocityY(Phaser.Math.Clamp((targetY - this.y) * 4, -speed, speed));

      if (this.mode !== 'windup' && time >= this.nextFireAt) {
        this.mode = 'windup';
        this.windupEndAt = time + this.t.windupMs;
        this.play(this.cfg.anims.fire ?? this.cfg.anims.windup, true);
      } else if (this.mode === 'windup' && time >= this.windupEndAt) {
        this.fire(p);
        this.mode = 'patrol';
        this.nextFireAt = time + (this.t.fireEveryMs ?? 1500);
        this.play(this.cfg.anims.run, true);
      }
    } else {
      this.body.setVelocityX(this.body.velocity.x * 0.9);
      this.body.setVelocityY(Math.sin(time * 0.003) * 12); // idle bob
    }
  }

  private fire(p: Player): void {
    const pr = this.t.projectile;
    if (!this.deps.fireProjectile || !pr) return;
    const ang = Math.atan2(p.y - this.y, p.x - this.x);
    const spread = Phaser.Math.DegToRad(pr.spreadDeg);
    for (let i = 0; i < pr.count; i++) {
      const a = ang + (pr.count > 1 ? (i / (pr.count - 1) - 0.5) * spread : 0);
      this.deps.fireProjectile(this.x, this.y - 14, Math.cos(a) * pr.speed, Math.sin(a) * pr.speed, pr.damage, pr.lifespanMs);
    }
  }

  // --- shared helpers ---------------------------------------------------
  private patrol(onGround: boolean): void {
    this.body.setVelocityX(this.facing * this.t.patrolSpeed);
    if (this.body.blocked.left) this.facing = 1;
    else if (this.body.blocked.right) this.facing = -1;
    else if (onGround && this.t.edgeCheck && !this.groundAhead()) this.facing *= -1;
  }

  private groundAhead(): boolean {
    const ax = this.x + this.facing * (this.cfg.body.w / 2 + 3);
    const ay = this.y + 4;
    return this.deps.groundCheck(ax, ay);
  }

  private updateCoreGlow(time: number): void {
    if (!this.coreGlow) return;
    const committed = this.mode === 'windup'; // about to lunge -> core flares open
    const pulse = 0.85 + 0.15 * Math.sin(time * 0.008);
    this.coreGlow.setPosition(this.x + this.facing, this.y - 17);
    this.coreGlow.setScale((committed ? 3.2 : 2.2) * pulse);
    this.coreGlow.setAlpha((committed ? 0.95 : 0.7) * pulse);
  }

  private coreFlare(): void {
    if (!this.coreGlow) return;
    this.deps.particles.debris(this.x + this.facing, this.y - 17, 12);
    this.scene.tweens.add({
      targets: this.coreGlow,
      scale: 6,
      duration: 90,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  takeDamage(amount: number, fromX: number, core = false): void {
    if (this.mode === 'dead') return;
    this.health -= amount * (1 - (this.t.damageReduction ?? 0));
    const dir = this.x < fromX ? -1 : 1;
    this.body.setVelocity(dir * this.t.knockbackTaken, this.cfg.flying ? 0 : -80);
    this.stunUntil = this.scene.time.now + (core ? this.t.coreStunMs : 140); // core hit interrupts + staggers
    this.mode = 'hurt'; // cancels any windup/lunge in progress
    this.play(this.cfg.anims.hurt, true);
    this.setTintFill(core ? Palette.moltenHi : Palette.bloom);
    this.scene.time.delayedCall(60, () => {
      this.clearTint();
      if (this.cfg.tint !== undefined) this.setTint(this.cfg.tint);
    });
    if (core) this.coreFlare();
    this.deps.particles.sparks(this.x, this.y - 8, 6);
    if (this.health <= 0) this.die();
  }

  private die(): void {
    this.mode = 'dead';
    if (this.coreGlow) {
      this.scene.tweens.killTweensOf(this.coreGlow);
      this.coreGlow.destroy();
    }
    this.deps.sfx.enemyDie();
    this.deps.particles.debris(this.x, this.y - 8, this.cfg.elite ? 30 : 16);
    this.deps.juice.flash(Palette.molten, this.cfg.elite ? 120 : 60);
    this.body.enable = false;
    if (this.cfg.elite) this.scene.events.emit('guardian-defeated');
    const sx = this.scaleX;
    const sy = this.scaleY;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: sx * 1.4,
      scaleY: sy * 0.6,
      duration: 160,
      onComplete: () => this.destroy(),
    });
  }
}
