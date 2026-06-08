import Phaser from 'phaser';
import { PlayerTune as P, PlayerCombo } from '../data/Tunables';
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
  public attackDamage: number = PlayerCombo[0].dmg; // damage of the current combo hit (read by CombatSystem)

  private controls: InputManager;
  private sfx: Sfx;
  private juice: JuiceSystem;
  private particles: ParticleSystem;

  private facing = 1;
  private mode: State = 'idle';
  private lastGroundedAt = 0;
  private airJumpsUsed = 0;
  private airDashUsed = false; // one Grace Burst air-dash per airtime
  public graceBurst = false; // Grace Burst air-dash unlocked (set from RunState)
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
  private curAttack: (typeof PlayerCombo)[number] = PlayerCombo[0];
  // hurt/stun
  private stunUntil = 0;
  // squash & stretch (eased back toward 1 each frame)
  private sqX = 1;
  private sqY = 1;
  private lastPivotAt = 0;
  private lastRunDustAt = 0;
  private jumpAnim = 'player-jump'; // 'player-runjump' when leaping while moving
  private idleSince = 0; // when the figure last started standing still (-> long idle)

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
    this.setScale(P.scale); // detailed HD sprite scaled down
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
      this.airDashUsed = false; // refresh the Grace Burst on landing
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
      // pivot micro-anim: a quick squish + dust when cutting hard the other way
      if (turning && onGround && Math.abs(v) > P.runSpeed * 0.55 && time - this.lastPivotAt > 220) {
        this.sqX = P.pivotSquashX;
        this.sqY = P.pivotSquashY;
        this.particles.dust(this.x, this.y, 4);
        this.lastPivotAt = time;
      }
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
      // running jump when there's real horizontal speed, else the standstill leap
      this.jumpAnim = Math.abs(this.body.velocity.x) > P.runSpeed * 0.4 ? 'player-runjump' : 'player-jump';
      if (onGround || canCoyote) {
        this.body.setVelocityY(P.jumpVelocity);
        this.lastGroundedAt = 0; // consume coyote
        this.sqX = P.jumpSquashX;
        this.sqY = P.jumpSquashY; // stretch up off the ground
        this.sfx.jump();
        this.particles.dust(this.x, this.y, 5);
      } else if (this.airJumpsUsed < P.maxAirJumps) {
        this.airJumpsUsed++;
        this.body.setVelocityY(P.doubleJumpVelocity);
        this.sqX = P.airJumpSquashX;
        this.sqY = P.airJumpSquashY;
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
      const onGround = this.body.blocked.down;
      if (!onGround) {
        // Air-dash is the Grace Burst — locked until earned, one per airtime.
        if (!this.graceBurst || this.airDashUsed) return;
        this.airDashUsed = true;
        this.juice.flash(Palette.grace, 60);
        this.particles.graceMotes?.(this.x, this.y - 14, 10);
      }
      this.dashing = true;
      this.attacking = false; // dash cancels a swing
      this.hitbox.disable();
      this.setRotation(0);
      this.resetSquash();
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
    // start, or chain to the next of the 3 hits (light → heavy → big forward cleave)
    this.comboStep = this.attacking ? (this.comboStep + 1) % PlayerCombo.length : 0;
    const c = PlayerCombo[this.comboStep];
    this.curAttack = c;
    this.attackDamage = c.dmg;
    this.attacking = true;
    this.resetSquash(); // attack uses body-lean, not squash
    this.attackStartAt = time;
    this.attackStartedActive = false;
    this.attackActiveEndAt = time + c.windupMs + c.activeMs;
    this.attackPhaseEndAt = time + c.windupMs + c.activeMs + c.recoveryMs;
    this.comboWindowEnd = this.attackPhaseEndAt + P.comboWindowMs;
    this.mode = 'attack';
    this.play(c.anim, true);
    this.sfx.slash();
    this.body.setVelocityX(this.facing * c.lunge); // step-in scales with the hit
    this.scene.time.delayedCall(c.windupMs, () => this.openHitbox(), undefined, this);
  }

  private openHitbox(): void {
    if (!this.attacking) return;
    const c = this.curAttack;
    const cx = this.x + this.facing * (c.reach * 0.5);
    const cy = this.y - P.bodyH * P.scale * 0.55;
    this.hitbox.fire(cx, cy, c.reach, c.height);
    this.attackStartedActive = true;
    this.spawnSlash(cx, cy, c.arc);
  }

  /** A bright crescent that sweeps through the swing — sells the arc of the blade.
   *  `arcScale` grows with the combo so the big finisher reads as a heavy cleave. */
  private spawnSlash(cx: number, cy: number, arcScale = 1): void {
    const dir = this.comboStep % 2 === 0 ? 1 : -1; // alternate swing direction
    const r = 22 * 1.15 * arcScale;
    const g = this.scene.add.graphics({ x: cx, y: cy }).setDepth(52).setBlendMode(Phaser.BlendModes.ADD);
    g.lineStyle(2 + arcScale, Palette.bloom, 0.9);
    g.beginPath();
    g.arc(0, 0, r, Phaser.Math.DegToRad(-58), Phaser.Math.DegToRad(58), false);
    g.strokePath();
    g.lineStyle(1 + arcScale * 0.4, Palette.grace, 0.7);
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
    const c = this.curAttack;
    const dur = Math.max(1, this.attackPhaseEndAt - this.attackStartAt);
    const t = Phaser.Math.Clamp((time - this.attackStartAt) / dur, 0, 1);
    const dir = this.comboStep % 2 === 0 ? 1 : -1;
    this.setRotation(this.facing * dir * Math.sin(t * Math.PI) * c.lean);
    if (this.hitbox.live && time - this.lastAfterimageAt >= 24) {
      this.spawnAfterimage();
      this.lastAfterimageAt = time;
    }
    if (this.hitbox.live) {
      // keep hitbox glued in front of the player during the active window
      const cx = this.x + this.facing * (c.reach * 0.5);
      const cy = this.y - P.bodyH * P.scale * 0.55;
      this.hitbox.setPosition(cx - c.reach / 2, cy - c.height / 2);
      this.hitbox.body.reset(cx - c.reach / 2, cy - c.height / 2);
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
      .setScale(this.scaleX, this.scaleY)
      .setFlipX(this.flipX)
      .setTint(Palette.grace)
      .setAlpha(0.5)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(48);
    this.scene.tweens.add({ targets: img, alpha: 0, duration: 220, onComplete: () => img.destroy() });
  }

  private onLand(): void {
    this.sqX = P.landSquashX;
    this.sqY = P.landSquashY; // squash on impact, eases back up
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
    const now = this.scene.time.now;
    if (this.attacking || this.dashing || this.mode === 'hurt') {
      this.idleSince = now; // any action resets the "waiting" timer
      return;
    }
    const vy = this.body.velocity.y;
    let next: string;
    if (!onGround) {
      next = vy < -10 ? this.jumpAnim : 'player-fall';
      this.idleSince = now;
    } else if (Math.abs(this.body.velocity.x) > 12) {
      next = 'player-run';
      this.idleSince = now;
    } else {
      // Standing still: after a beat he rests the blade on his shoulder and
      // waits — weary/battered once he's below half health.
      next =
        now - this.idleSince > P.restDelayMs
          ? this.health <= P.maxHealth * 0.5
            ? 'player-weary'
            : 'player-rest'
          : 'player-idle';
    }
    this.mode = onGround ? (next === 'player-run' ? 'run' : 'idle') : vy < 0 ? 'jump' : 'fall';
    if (this.anims.currentAnim?.key !== next) this.play(next, true);
    // couple the run cadence to actual speed so the gait never churns or drags
    this.anims.timeScale =
      next === 'player-run' ? Phaser.Math.Clamp(Math.abs(this.body.velocity.x) / (P.runSpeed * 0.8), 0.6, 1.5) : 1;
    // kicked-up dust while sprinting
    if (onGround && Math.abs(this.body.velocity.x) > P.runSpeed * 0.6 && this.scene.time.now - this.lastRunDustAt > 190) {
      this.particles.dust(this.x, this.y, 2);
      this.lastRunDustAt = this.scene.time.now;
    }
    // ease squash/stretch back toward neutral (feet stay planted: origin 0.5,1)
    this.sqX += (1 - this.sqX) * P.squashDecay;
    this.sqY += (1 - this.sqY) * P.squashDecay;
    this.setScale(P.scale * this.sqX, P.scale * this.sqY);
  }

  private resetSquash(): void {
    this.sqX = 1;
    this.sqY = 1;
    this.setScale(P.scale, P.scale);
    this.anims.timeScale = 1; // run-cadence coupling shouldn't bleed into other clips
  }

  // ----------------------------------------------------------------------
  /** Restore life (life orb). Clamped to max; emits the HUD update. */
  heal(amount: number): void {
    if (this.mode === 'dead') return;
    this.health = Math.min(P.maxHealth, this.health + amount);
    this.scene.events.emit('player-health', this.health, P.maxHealth);
  }

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
    this.resetSquash();
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
    this.resetSquash();
    this.invulnUntil = this.scene.time.now + 900;
    this.play('player-idle', true);
  }
}
