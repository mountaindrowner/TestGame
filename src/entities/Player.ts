import Phaser from 'phaser';
import { PlayerTune as P } from '../data/Tunables';
import { Palette } from '../data/palette';
import { Assets } from '../data/assetManifest';
import { InputManager } from '../systems/InputManager';
import { Sfx } from '../systems/Sfx';
import { JuiceSystem } from '../systems/JuiceSystem';
import { ParticleSystem } from '../systems/ParticleSystem';
import { AttackHitbox } from './AttackHitbox';

export interface PlayerDeps {
  input: InputManager;
  sfx: Sfx;
  juice: JuiceSystem;
  particles: ParticleSystem;
}

type State = 'idle' | 'run' | 'jump' | 'fall' | 'dash' | 'attack' | 'hurt' | 'dead' | 'reborn';

export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  public health = P.maxHealth;
  public readonly hitbox: AttackHitbox;
  public controllable = true;

  private controls: InputManager;
  private sfx: Sfx;
  private juice: JuiceSystem;
  private particles: ParticleSystem;

  private facing = 1;
  private mode: State = 'idle';
  private lastGroundedAt = 0;
  private airJumpsUsed = 0;
  private wasOnGround = false;

  // dash
  private dashing = false;
  private dashEndAt = 0;
  private dashReadyAt = 0;
  private lastAfterimageAt = 0;
  // i-frames
  private invulnUntil = 0;
  // attack
  private attacking = false;
  private attackPhaseEndAt = 0;
  private attackActiveEndAt = 0;
  private attackStartedActive = false;
  private comboStep = 0;
  private comboWindowEnd = 0;
  private attackStartAt = 0;
  // hurt/stun
  private stunUntil = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, deps: PlayerDeps) {
    super(scene, x, y, Assets.player.key, 0);
    this.controls = deps.input;
    this.sfx = deps.sfx;
    this.juice = deps.juice;
    this.particles = deps.particles;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1); // feet anchor (bottom-center)
    this.setDepth(50);
    this.body.setSize(P.bodyW, P.bodyH);
    this.body.setOffset(P.bodyOffsetX, P.bodyOffsetY);
    this.body.setMaxVelocityY(P.maxFall);
    this.setCollideWorldBounds(true);

    this.hitbox = new AttackHitbox(scene);
    this.play('player-idle');
  }

  isInvulnerable(): boolean {
    return this.scene.time.now < this.invulnUntil || this.mode === 'reborn';
  }

  // ----------------------------------------------------------------------
  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.mode === 'dead' || this.mode === 'reborn') {
      this.body.setVelocityX(0);
      return;
    }
    if (this.juice.frozen) return; // hitstop: hold the pose

    const onGround = this.body.blocked.down;
    if (onGround) {
      this.lastGroundedAt = time;
      this.airJumpsUsed = 0;
      if (!this.wasOnGround && this.body.velocity.y >= 0) this.onLand();
    }
    this.wasOnGround = onGround;

    const stunned = time < this.stunUntil;
    if (!stunned && this.mode === 'hurt') this.mode = 'idle';

    if (this.controllable && !stunned) {
      this.handleDash(time);
      if (!this.dashing) {
        this.handleAttack(time);
        this.handleMovement(time, delta, onGround);
        this.handleJump(time, onGround);
      }
    }

    this.updateDash(time);
    this.updateAttack(time);
    this.clampFall();
    this.updateAnimation(onGround);
  }

  private handleMovement(time: number, delta: number, onGround: boolean): void {
    const dt = delta / 1000;
    const axis = this.controls.axisX();
    if (axis !== 0 && !this.attacking) this.facing = axis as 1 | -1;

    const v = this.body.velocity.x;
    const accel = onGround ? P.runAccel : P.airAccel;
    const decel = onGround ? P.runDecel : P.airDecel;

    if (axis !== 0) {
      // snappier turns when reversing direction
      const turning = Math.sign(axis) !== Math.sign(v) && v !== 0;
      const a = accel * (turning ? P.turnBonus : 1) * dt;
      let nv = v + axis * a;
      nv = Phaser.Math.Clamp(nv, -P.runSpeed, P.runSpeed);
      this.body.setVelocityX(nv);
    } else {
      // friction toward 0
      const sign = Math.sign(v);
      let nv = v - sign * decel * dt;
      if (Math.sign(nv) !== sign) nv = 0;
      this.body.setVelocityX(nv);
    }
  }

  private handleJump(time: number, onGround: boolean): void {
    const canCoyote = time - this.lastGroundedAt <= P.coyoteMs;
    const wantJump = this.controls.consumeBuffered('jump', P.jumpBufferMs);

    if (wantJump) {
      if (onGround || canCoyote) {
        this.body.setVelocityY(P.jumpVelocity);
        this.lastGroundedAt = 0; // consume coyote
        this.sfx.jump();
        this.particles.dust(this.x, this.y, 5);
      } else if (this.airJumpsUsed < P.maxAirJumps) {
        this.airJumpsUsed++;
        this.body.setVelocityY(P.doubleJumpVelocity);
        this.sfx.doubleJump();
        this.particles.sparks(this.x, this.y - 12, 6);
      }
    }
    // variable height: release early -> cut the rise short
    if (this.controls.justReleased('jump') && this.body.velocity.y < 0) {
      this.body.setVelocityY(this.body.velocity.y * P.jumpCutMultiplier);
    }
  }

  private handleDash(time: number): void {
    if (this.dashing) return;
    if (this.controls.justPressed('dash') && time >= this.dashReadyAt) {
      this.dashing = true;
      this.attacking = false; // dash cancels a swing
      this.hitbox.disable();
      this.setRotation(0);
      this.dashEndAt = time + P.dashDurationMs;
      this.dashReadyAt = time + P.dashCooldownMs;
      this.invulnUntil = Math.max(this.invulnUntil, time + P.dashIFrameMs);
      this.body.setAllowGravity(false);
      this.body.setVelocity(this.facing * P.dashSpeed, 0);
      this.mode = 'dash';
      this.sfx.dash();
      this.juice.shakeDash();
      this.lastAfterimageAt = 0;
    }
  }

  private updateDash(time: number): void {
    if (!this.dashing) return;
    this.body.setVelocityX(this.facing * P.dashSpeed);
    this.body.setVelocityY(0);
    if (time - this.lastAfterimageAt >= P.dashAfterimageEveryMs) {
      this.spawnAfterimage();
      this.lastAfterimageAt = time;
    }
    if (time >= this.dashEndAt || this.body.blocked.left || this.body.blocked.right) {
      this.dashing = false;
      this.body.setAllowGravity(true);
      this.body.setVelocityX(this.facing * P.runSpeed * 0.6); // gentle exit momentum
    }
  }

  private handleAttack(time: number): void {
    if (!this.controls.justPressed('attack')) return;
    if (this.attacking && time > this.comboWindowEnd) return;
    // start or chain
    this.comboStep = this.attacking ? (this.comboStep + 1) % 2 : 0;
    this.attacking = true;
    this.attackStartAt = time;
    this.attackStartedActive = false;
    this.attackActiveEndAt = time + P.attackWindupMs + P.attackActiveMs;
    this.attackPhaseEndAt = time + P.attackWindupMs + P.attackActiveMs + P.attackRecoveryMs;
    this.comboWindowEnd = this.attackPhaseEndAt + P.comboWindowMs;
    this.mode = 'attack';
    this.play(this.comboStep === 0 ? 'player-attack1' : 'player-attack2', true);
    this.sfx.slash();
    // small forward lunge
    this.body.setVelocityX(this.facing * P.attackLungeSpeed);
    // schedule the active window
    this.scene.time.delayedCall(P.attackWindupMs, () => this.openHitbox(), undefined, this);
  }

  private openHitbox(): void {
    if (!this.attacking) return;
    const cx = this.x + this.facing * (P.attackReach * 0.5);
    const cy = this.y - P.bodyH * 0.55;
    this.hitbox.fire(cx, cy, P.attackReach, P.attackHeight);
    this.attackStartedActive = true;
    this.spawnSlash(cx, cy);
  }

  /** A bright crescent that sweeps through the swing — sells the arc of the blade. */
  private spawnSlash(cx: number, cy: number): void {
    const dir = this.comboStep === 0 ? 1 : -1; // overhead vs rising
    const r = P.attackReach * 1.15;
    const g = this.scene.add.graphics({ x: cx, y: cy }).setDepth(52).setBlendMode(Phaser.BlendModes.ADD);
    g.lineStyle(3, Palette.bloom, 0.9);
    g.beginPath();
    g.arc(0, 0, r, Phaser.Math.DegToRad(-58), Phaser.Math.DegToRad(58), false);
    g.strokePath();
    g.lineStyle(1.5, Palette.grace, 0.7);
    g.beginPath();
    g.arc(0, 0, r - 3, Phaser.Math.DegToRad(-50), Phaser.Math.DegToRad(50), false);
    g.strokePath();
    g.setScale(this.facing, dir);
    g.setRotation(Phaser.Math.DegToRad(-70));
    this.scene.tweens.add({
      targets: g,
      rotation: Phaser.Math.DegToRad(70),
      alpha: 0,
      duration: 140,
      ease: 'Quad.easeOut',
      onComplete: () => g.destroy(),
    });
  }

  private updateAttack(time: number): void {
    if (!this.attacking) return;
    // Whole-body swing: lean through the strike (pivot at the feet) + motion-smear
    // ghosts so the attack reads as a full-body lunge, not just a sword waggle.
    const dur = Math.max(1, this.attackPhaseEndAt - this.attackStartAt);
    const t = Phaser.Math.Clamp((time - this.attackStartAt) / dur, 0, 1);
    const dir = this.comboStep === 0 ? 1 : -1;
    this.setRotation(this.facing * dir * Math.sin(t * Math.PI) * 0.22);
    if (this.hitbox.live && time - this.lastAfterimageAt >= 24) {
      this.spawnAfterimage();
      this.lastAfterimageAt = time;
    }
    if (this.hitbox.live) {
      // keep hitbox glued in front of the player during the active window
      const cx = this.x + this.facing * (P.attackReach * 0.5);
      const cy = this.y - P.bodyH * 0.55;
      this.hitbox.setPosition(cx - P.attackReach / 2, cy - P.attackHeight / 2);
      this.hitbox.body.reset(cx - P.attackReach / 2, cy - P.attackHeight / 2);
      if (time >= this.attackActiveEndAt) this.hitbox.disable();
    }
    if (time >= this.attackPhaseEndAt) {
      this.attacking = false;
      this.hitbox.disable();
      this.setRotation(0);
    }
  }

  private spawnAfterimage(): void {
    const img = this.scene.add
      .image(this.x, this.y, Assets.player.key, this.frame.name)
      .setOrigin(0.5, 1)
      .setFlipX(this.flipX)
      .setTint(Palette.grace)
      .setAlpha(0.5)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(48);
    this.scene.tweens.add({ targets: img, alpha: 0, duration: 220, onComplete: () => img.destroy() });
  }

  private onLand(): void {
    this.sfx.land();
    this.particles.dust(this.x, this.y, 8);
  }

  private clampFall(): void {
    if (this.body.velocity.y > P.maxFall) this.body.setVelocityY(P.maxFall);
  }

  private updateAnimation(onGround: boolean): void {
    this.setFlipX(this.facing < 0);
    if (!this.attacking) this.setRotation(0); // clear any swing lean once the strike is done
    // Gate on the `attacking` flag (not mode) so the body returns to run/idle after
    // a swing — mirrors how dash recovers via its boolean.
    if (this.attacking || this.dashing || this.mode === 'hurt') return;
    const vy = this.body.velocity.y;
    let next: string;
    if (!onGround) next = vy < -10 ? 'player-jump' : 'player-fall';
    else next = Math.abs(this.body.velocity.x) > 12 ? 'player-run' : 'player-idle';
    this.mode = onGround ? (next === 'player-run' ? 'run' : 'idle') : vy < 0 ? 'jump' : 'fall';
    if (this.anims.currentAnim?.key !== next) this.play(next, true);
  }

  // ----------------------------------------------------------------------
  takeDamage(amount: number, sourceX: number): void {
    if (this.isInvulnerable() || this.mode === 'dead' || this.mode === 'reborn') return;
    this.health -= amount;
    this.scene.events.emit('player-health', this.health, P.maxHealth);
    if (this.health <= 0) {
      this.die();
      return;
    }
    this.mode = 'hurt';
    this.invulnUntil = this.scene.time.now + P.invulnMsAfterHit;
    this.stunUntil = this.scene.time.now + 220;
    const dir = this.x < sourceX ? -1 : 1;
    this.body.setVelocity(dir * P.hurtKnockback, P.hurtKnockbackUp);
    this.dashing = false;
    this.attacking = false;
    this.hitbox.disable();
    this.setRotation(0);
    this.body.setAllowGravity(true);
    this.play('player-hurt', true);
    this.sfx.hurt();
    this.juice.shakeHurt();
    this.juice.flash(Palette.blood, 90);
    this.particles.sparks(this.x, this.y - 14, 6);
    // invuln blink
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 70,
      yoyo: true,
      repeat: Math.floor(P.invulnMsAfterHit / 140),
      onComplete: () => this.setAlpha(1),
    });
  }

  private die(): void {
    this.mode = 'dead';
    this.controllable = false;
    this.body.setVelocity(0, 0);
    this.body.setAllowGravity(false);
    this.hitbox.disable();
    this.play('player-death', true);
    this.sfx.death();
    this.scene.events.emit('player-died', this.x, this.y);
  }

  /** Called by the grace-burst cinematic to begin reassembly at a point. */
  beginReborn(x: number, y: number): void {
    this.mode = 'reborn';
    this.controllable = false;
    this.setPosition(x, y);
    this.body.reset(x, y);
    this.body.setAllowGravity(false);
    this.setAlpha(0);
    this.health = P.maxHealth;
    this.scene.events.emit('player-health', this.health, P.maxHealth);
  }

  /** Control returns; brief grace i-frames. */
  finishReborn(): void {
    this.mode = 'idle';
    this.controllable = true;
    this.body.setAllowGravity(true);
    this.setAlpha(1);
    this.setRotation(0);
    this.invulnUntil = this.scene.time.now + 900;
    this.play('player-idle', true);
  }
}
