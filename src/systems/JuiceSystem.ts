import Phaser from 'phaser';
import { Juice } from '../data/Tunables';

/** Owns the global "feel" knobs: hitstop + screenshake + flashes.
 *  Hitstop is a time-gated freeze toggled from update(), so overlapping hits
 *  extend cleanly and we never resume mid-frame with a velocity spike. */
export class JuiceSystem {
  private frozenUntil = 0;
  private zoomTween?: Phaser.Tweens.Tween;
  private baseZoom = 1;

  constructor(private scene: Phaser.Scene) {}

  update(now: number): void {
    this.scene.physics.world.isPaused = now < this.frozenUntil;
  }

  get frozen(): boolean {
    return this.scene.physics.world.isPaused;
  }

  hitstop(ms: number): void {
    const now = this.scene.time.now;
    this.frozenUntil = Math.max(this.frozenUntil, now + ms);
  }

  shake(duration: number, intensity: number): void {
    this.scene.cameras.main.shake(duration, intensity);
  }

  shakeHit(): void {
    this.shake(Juice.shakeHit.duration, Juice.shakeHit.intensity);
  }
  shakeHurt(): void {
    this.shake(Juice.shakeHurt.duration, Juice.shakeHurt.intensity);
  }
  shakeDash(): void {
    this.shake(Juice.shakeDash.duration, Juice.shakeDash.intensity);
  }
  shakeRespawn(): void {
    this.shake(Juice.shakeRespawn.duration, Juice.shakeRespawn.intensity);
  }

  flash(color: number, duration = 120): void {
    const c = Phaser.Display.Color.IntegerToColor(color);
    this.scene.cameras.main.flash(duration, c.red, c.green, c.blue);
  }

  /** A quick dolly-in then ease back — the "crunch" on a heavy/finisher impact.
   *  Tracks the camera's resting zoom so it composes with whatever the scene set,
   *  and never stacks (a new punch retargets the existing tween). */
  zoomPunch(amount = 1.06, inMs = 70, outMs = 240): void {
    const cam = this.scene.cameras.main;
    if (!this.zoomTween?.isPlaying()) this.baseZoom = cam.zoom; // capture rest, ignore mid-punch
    const rest = this.baseZoom;
    this.zoomTween?.stop();
    this.zoomTween = this.scene.tweens.add({
      targets: cam,
      zoom: rest * amount,
      duration: inMs,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.zoomTween = this.scene.tweens.add({
          targets: cam,
          zoom: rest,
          duration: outMs,
          ease: 'Sine.easeOut',
        });
      },
    });
  }
}
