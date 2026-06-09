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
  lobBomb?: (x: number, y: number, vx: number, vy: number, damage: number) => void; // arcing timed bomb
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
  private attackType: 'charge' | 'slam' = 'charge'; // heavy_telegraph: which attack this cycle
  private coreGlow?: Phaser.GameObjects.Image; // burning ember weak point (runner only)
  public introHold = false; // frozen during the boss intro cinematic

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
    if (cfg.elite) {
      scene.events.emit('boss-spawn', cfg.displayName, this.health, cfg.tune.maxHealth);
      // Heavy footfalls: when the walk clip plants a foot while it's stalking
      // in, shake the stage a little (GameScene listens for 'boss-stomp').
      this.on(Phaser.Animations.Events.ANIMATION_UPDATE, (anim: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
        if (this.mode !== 'patrol' || this.introHold || anim.key !== cfg.anims.run) return;
        if (Math.abs(this.body.velocity.x) < 1) return; // only when actually stepping
        if (frame.index === 3 || frame.index === 7) scene.events.emit('boss-stomp', this.x, this.y);
      });
    }
  }

  isAlive(): boolean {
    return this.mode !== 'dead';
  }

  /** Debug overlay: current threat state for box coloring (no behavior impact). */
  debugInfo(): { danger: boolean; vulnerable: boolean } {
    return {
      danger: this.mode === 'windup' || this.mode === 'strike',
      vulnerable: this.mode === 'recover' || this.mode === 'hurt',
    };
  }

  private fromBehind(ax: number): boolean {
    return (this.facing === 1 && ax < this.x) || (this.facing === -1 && ax > this.x);
  }

  /** Touch alone no longer hurts — an enemy only damages the player during the
   *  active, committed frames of an attack (its lunge / charge / strike). Flyers
   *  deal damage only through their projectiles. */
  isAttacking(): boolean {
    switch (this.cfg.behavior) {
      case 'lunger':
        return this.mode === 'chase'; // the committed lunge
      case 'pursuer':
        return this.mode === 'strike'; // the lunge-bite
      case 'heavy_telegraph':
        return this.mode === 'strike'; // the charge / slam swing
      case 'mirror_double':
        return this.mode === 'strike'; // the leap
      default:
        return false; // flyers: projectiles only
    }
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
      case 'mirror_double':
        return this.mode === 'windup' || this.fromBehind(attackerX);
      default:
        return false;
    }
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.mode === 'dead') return;
    if (this.coreGlow) this.updateCoreGlow(time);
    if (this.deps.juice.frozen) return;
    if (this.introHold) {
      this.body.setVelocityX(0);
      this.setFlipX(this.facing < 0);
      return;
    }

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
        this.updatePursuer(time);
        break;
      case 'heavy_telegraph':
        this.updateHeavy(time);
        break;
      case 'flyer_ranged':
        this.updateFlyer(time);
        break;
      case 'mirror_double':
        this.updateMirror(time);
        break;
      case 'archer':
        this.updateRangedGround(time, false);
        break;
      case 'bomber':
        this.updateRangedGround(time, true);
        break;
    }

    // Tie ground-anim speed to actual movement so slow foes don't sprint in place
    // (the "wild" run). Floored so they never fully freeze.
    if (!this.cfg.flying) {
      this.anims.timeScale = Phaser.Math.Clamp(Math.abs(this.body.velocity.x) / 90, 0.5, 1.6);
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

  private updatePursuer(time: number): void {
    const onGround = this.body.blocked.down;
    const p = this.deps.player;
    const dx = p.x - this.x;
    const dy = Math.abs(p.y - this.y);
    if (Math.abs(dx) < this.t.aggroRange && dy < this.t.aggroVertical) this.latched = true;
    if (!this.latched) {
      this.patrol(onGround);
      return;
    }
    this.facing = dx < 0 ? -1 : 1;
    const biteRange = this.t.attackRange ?? 30;

    switch (this.mode) {
      case 'patrol': // relentless chase, with a telegraphed lunge-bite up close
        if (Math.abs(dx) < biteRange && dy < 40 && time >= this.nextFireAt) {
          this.mode = 'windup';
          this.windupEndAt = time + (this.t.windupMs || 170);
          this.body.setVelocityX(0);
          this.play(this.cfg.anims.windup, true);
          this.deps.sfx.telegraph();
        } else if (onGround && !this.groundAhead()) {
          this.body.setVelocityX(0); // won't walk into the void
        } else {
          this.body.setVelocityX(this.facing * this.t.chaseSpeed);
        }
        break;
      case 'windup':
        this.body.setVelocityX(0);
        if (time >= this.windupEndAt) {
          this.mode = 'strike';
          this.strikeEndAt = time + (this.t.strikeMs ?? 150);
          this.body.setVelocityX(this.facing * this.t.chaseSpeed * 1.7); // the bite-lunge
          this.play(this.cfg.anims.strike ?? this.cfg.anims.run, true);
          this.deps.sfx.slam();
        }
        break;
      case 'strike':
        if (onGround && !this.groundAhead()) this.body.setVelocityX(0);
        if (time >= this.strikeEndAt) {
          this.mode = 'recover';
          this.recoverEndAt = time + (this.t.recoveryMs ?? 240);
          this.body.setVelocityX(0);
        }
        break;
      case 'recover':
        this.body.setVelocityX(0);
        if (time >= this.recoverEndAt) {
          this.mode = 'patrol';
          this.nextFireAt = time + 700; // beat before the next bite
        }
        break;
    }
  }

  private updateHeavy(time: number): void {
    const onGround = this.body.blocked.down;
    const p = this.deps.player;
    const dx = p.x - this.x;
    const dy = Math.abs(p.y - this.y);
    const inRange = Math.abs(dx) < this.t.aggroRange && dy < this.t.aggroVertical;

    switch (this.mode) {
      case 'patrol': {
        const atk = this.t.attackRange;
        if (inRange && atk !== undefined && Math.abs(dx) > atk) {
          // Stalk in with heavy stomping steps (footfalls shake the stage —
          // see the ANIMATION_UPDATE hook) until close enough to commit.
          this.facing = dx < 0 ? -1 : 1;
          if (onGround && !this.groundAhead()) this.body.setVelocityX(0);
          else this.body.setVelocityX(this.facing * (this.t.walkSpeed ?? this.t.patrolSpeed));
          this.play(this.cfg.anims.run, true);
        } else if (inRange) {
          // Crowd it and it smashes; give it room and it charges.
          this.attackType =
            this.cfg.anims.slam && Math.abs(dx) < (this.t.slamRange ?? 0) ? 'slam' : 'charge';
          this.mode = 'windup';
          this.windupEndAt =
            time + (this.attackType === 'slam' ? (this.t.slamWindupMs ?? this.t.windupMs) : this.t.windupMs);
          this.facing = dx < 0 ? -1 : 1;
          this.body.setVelocityX(0);
          this.play(this.attackType === 'slam' ? this.cfg.anims.slam! : this.cfg.anims.windup, true);
          this.deps.sfx.telegraph();
        } else if (this.cfg.anims.idle) {
          // A boss with an idle clip looms in place when out of reach (no pacing).
          this.body.setVelocityX(0);
          this.play(this.cfg.anims.idle, true);
        } else {
          this.patrol(onGround); // lesser heavy foes still patrol
        }
        break;
      }
      case 'windup':
        this.body.setVelocityX(0);
        if (time >= this.windupEndAt) {
          this.mode = 'strike';
          this.facing = dx < 0 ? -1 : 1;
          if (this.attackType === 'slam') {
            // Planted overhead smash -> a shockwave the scene races along the floor.
            this.strikeEndAt = time + (this.t.slamMs ?? 200);
            this.body.setVelocityX(0);
            this.scene.events.emit('boss-slam', this.x, this.y, this.facing, this.t.slamDamage ?? this.contactDamage);
            this.deps.sfx.slam();
          } else {
            this.strikeEndAt = time + (this.t.strikeMs ?? 250);
            this.body.setVelocityX(this.facing * this.t.chaseSpeed);
            this.play(this.cfg.anims.strike ?? this.cfg.anims.run, true);
            this.deps.sfx.slam();
          }
        }
        break;
      case 'strike':
        if (this.attackType === 'slam') this.body.setVelocityX(0);
        else if (onGround && !this.groundAhead()) this.body.setVelocityX(0);
        if (time >= this.strikeEndAt) {
          this.mode = 'recover';
          this.recoverEndAt =
            time + (this.attackType === 'slam' ? (this.t.slamRecoveryMs ?? this.t.recoveryMs ?? 500) : (this.t.recoveryMs ?? 500));
          this.body.setVelocityX(0);
          // The slam clip already sinks into a low crouch — let it finish as the
          // recovery pose; the charge swaps to the dedicated stagger clip.
          if (this.attackType !== 'slam') this.play(this.cfg.anims.recovery ?? this.cfg.anims.run, true);
        }
        break;
      case 'recover':
        this.body.setVelocityX(0);
        if (time >= this.recoverEndAt) this.mode = 'patrol';
        break;
    }
    this.applyTelegraphTint();
  }

  /** Readability for heavy foes: danger flush as it winds up / charges, then a
   *  cool "vulnerable" glow during the punishable recovery — the weave window. */
  private applyTelegraphTint(): void {
    const tell =
      this.mode === 'windup'
        ? 0xffd2d2
        : this.mode === 'strike'
          ? 0xff6a6a
          : this.mode === 'recover'
            ? Palette.grace
            : (this.cfg.tint ?? 0xffffff);
    this.setTint(tell);
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

  /** THE MIRROR DOUBLE — your reflection. Always facing you, it shadows you at a
   *  punishing pace and, when it closes, leaps with your own finisher. Glass-frail. */
  private updateMirror(time: number): void {
    const onGround = this.body.blocked.down;
    const p = this.deps.player;
    const dx = p.x - this.x;
    this.facing = dx < 0 ? -1 : 1;
    const lungeRange = this.t.aggroRange * 0.34;

    switch (this.mode) {
      case 'patrol': // (for the Double, "patrol" = the relentless shadow chase)
        if (onGround && !this.groundAhead()) this.body.setVelocityX(0);
        else this.body.setVelocityX(this.facing * this.t.chaseSpeed);
        if (this.anims.currentAnim?.key !== this.cfg.anims.run) this.play(this.cfg.anims.run, true);
        if (Math.abs(dx) < lungeRange && Math.abs(p.y - this.y) < this.t.aggroVertical && time >= this.nextFireAt) {
          this.mode = 'windup';
          this.windupEndAt = time + this.t.windupMs;
          this.body.setVelocityX(0);
          this.play(this.cfg.anims.windup, true);
          this.deps.sfx.telegraph();
        }
        break;
      case 'windup':
        this.body.setVelocityX(0);
        if (time >= this.windupEndAt) {
          this.mode = 'strike';
          this.strikeEndAt = time + (this.t.strikeMs ?? 200);
          this.body.setVelocity(this.facing * this.t.chaseSpeed * 1.5, -150); // a leaping lunge
          this.play(this.cfg.anims.strike ?? this.cfg.anims.run, true);
          this.deps.sfx.slam();
        }
        break;
      case 'strike':
        if (onGround && !this.groundAhead()) this.body.setVelocityX(0);
        if (time >= this.strikeEndAt) {
          this.mode = 'patrol';
          this.nextFireAt = time + 650; // brief beat before the next leap
        }
        break;
    }
  }

  /** Grounded ranged foe: holds a standoff distance, faces you, telegraphs, then
   *  either looses a fast arrow (archer) or lobs an arcing timed bomb (bomber). */
  private updateRangedGround(time: number, bomb: boolean): void {
    const onGround = this.body.blocked.down;
    const p = this.deps.player;
    const dx = p.x - this.x;
    const dy = Math.abs(p.y - this.y);
    const inRange = Math.abs(dx) < this.t.aggroRange && dy < this.t.aggroVertical;

    switch (this.mode) {
      case 'patrol': {
        if (!inRange) {
          this.patrol(onGround);
          break;
        }
        this.facing = dx < 0 ? -1 : 1;
        const dist = Math.abs(dx);
        const stand = this.t.standoff ?? 130;
        let vx = 0;
        if (dist < stand * 0.7) vx = -this.facing * this.t.patrolSpeed; // back away (kite)
        else if (dist > stand * 1.4) vx = this.facing * this.t.patrolSpeed; // close in
        if (vx !== 0 && onGround && !this.groundAtDir(Math.sign(vx))) vx = 0; // never kite off a ledge
        this.body.setVelocityX(vx);
        if (this.anims.currentAnim?.key !== this.cfg.anims.run) this.play(this.cfg.anims.run, true);
        if (time >= this.nextFireAt) {
          this.mode = 'windup';
          this.windupEndAt = time + this.t.windupMs;
          this.body.setVelocityX(0);
          this.play(this.cfg.anims.fire ?? this.cfg.anims.windup, true);
          this.deps.sfx.telegraph();
        }
        break;
      }
      case 'windup':
        this.body.setVelocityX(0);
        this.facing = dx < 0 ? -1 : 1;
        if (time >= this.windupEndAt) {
          if (bomb) this.lobBomb(p);
          else this.fire(p);
          this.mode = 'patrol';
          this.nextFireAt = time + (this.t.fireEveryMs ?? 1800);
          this.play(this.cfg.anims.run, true);
        }
        break;
    }
  }

  private lobBomb(p: Player): void {
    if (!this.deps.lobBomb) return;
    const dx = p.x - this.x;
    const vx = Phaser.Math.Clamp(dx * 1.15, -210, 210); // arc toward where you are
    this.deps.lobBomb(this.x + this.facing * 8, this.y - 18, vx, -270, this.t.projectile?.damage ?? 24);
    this.deps.sfx.slam();
  }

  private groundAtDir(dir: number): boolean {
    return this.deps.groundCheck(this.x + dir * (this.cfg.body.w / 2 + 3), this.y + 4);
  }

  private fire(p: Player): void {
    const pr = this.t.projectile;
    if (!this.deps.fireProjectile || !pr) return;
    this.deps.sfx.shoot();
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
    // Looking-Glass Sentinel: blades glance off its mirrored face. Its guard only
    // drops when staggered (recover/hurt) — otherwise flank it (a hit from behind).
    if (this.cfg.frontImmune && !core && this.mode !== 'recover' && this.mode !== 'hurt' && !this.fromBehind(fromX)) {
      this.deps.particles.sparks(this.x + this.facing * 8, this.y - 16, 8);
      this.setTintFill(0xcfe0ff);
      this.scene.time.delayedCall(50, () => {
        this.clearTint();
        if (this.cfg.tint !== undefined) this.setTint(this.cfg.tint);
      });
      return;
    }
    this.health -= amount * (1 - (this.t.damageReduction ?? 0));
    if (this.cfg.elite) this.scene.events.emit('boss-health', Math.max(0, this.health), this.cfg.tune.maxHealth);
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
    this.deps.juice.flash(this.cfg.shatter ? Palette.grace : Palette.molten, this.cfg.elite ? 120 : 60);
    this.body.setVelocity(0, 0);
    this.body.enable = false;

    // Glass foes burst into a spray of shards (the Mirror Double, the Wisp).
    if (this.cfg.shatter) this.deps.particles.sparks(this.x, this.y - 14, 22);
    // The Fracture Wisp scatters into smaller foes the scene spawns around it.
    if (this.cfg.splitInto) {
      this.scene.events.emit('enemy-split', this.cfg.splitInto.kind, this.cfg.splitInto.count, this.x, this.y - 10);
    }
    if (this.cfg.elite) {
      this.scene.events.emit('guardian-defeated', this.cfg.kind); // kind routes which elite fell
      this.scene.events.emit('boss-defeated');
    }
    // Sheds currency (the scene spawns the drops).
    this.scene.events.emit('enemy-killed', this.x, this.y - 8, this.cfg.elite ?? false, this.cfg.kind);

    // Foes with a death clip (the boss) buckle and collapse, then fade out once
    // the animation finishes; everyone else keeps the quick squash-pop.
    if (this.cfg.anims.death) {
      this.clearTint();
      if (this.cfg.tint !== undefined) this.setTint(this.cfg.tint);
      this.anims.timeScale = 1;
      this.play(this.cfg.anims.death, true);
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        if (!this.scene) return;
        this.scene.tweens.add({ targets: this, alpha: 0, duration: 480, ease: 'Sine.easeIn', onComplete: () => this.destroy() });
      });
      return;
    }

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
