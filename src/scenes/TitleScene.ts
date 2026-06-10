import Phaser from 'phaser';
import { FONT } from '../data/ui';
import { ParallaxBackground } from '../systems/ParallaxBackground';
import { ParticleSystem } from '../systems/ParticleSystem';
import { getSfx } from '../systems/Sfx';
import { RunState } from '../data/RunState';
import { START_ROOM } from '../data/levelGraph';

/** Boot menu — the journey drifts behind the title (the depths backdrop, slowly
 *  panning, dust adrift). Arrow/WASD to move, Enter/Space/Z to choose; menu blips
 *  on move + select. BEGIN starts a fresh run (a brief "entering" loading beat). */
export class TitleScene extends Phaser.Scene {
  private parallax!: ParallaxBackground;
  private sfx = getSfx();
  private options: { label: () => string; act: () => void }[] = [];
  private items: Phaser.GameObjects.Text[] = [];
  private index = 0;
  private drift = 0;
  private starting = false;

  constructor() {
    super('TitleScene');
  }

  create(): void {
    // Clear the DOM pre-boot splash (#boot) — the title is the first scene now, so
    // it owns that hand-off (GameScene/EditorScene do it on their own entry).
    const boot = document.getElementById('boot');
    if (boot) {
      boot.style.opacity = '0';
      setTimeout(() => boot.remove(), 450);
    }
    const w = this.scale.width;
    const h = this.scale.height;

    this.parallax = new ParallaxBackground(this, 'depths');
    new ParticleSystem(this).startAmbient(w * 2, h * 2); // drifting dust/motes

    // Title — big, with a soft glow shadow. All title/menu UI is screen-fixed
    // (scrollFactor 0): the camera keeps drifting to animate the parallax, so any
    // scrollFactor-1 text would slide off-screen ("float away").
    this.add
      .text(w / 2 + 1, h * 0.32 + 1, 'REPENTANCE', { fontFamily: FONT, fontSize: '26px', color: '#0a0a12' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setAlpha(0.6);
    const title = this.add
      .text(w / 2, h * 0.32, 'REPENTANCE', { fontFamily: FONT, fontSize: '26px', color: '#eaf7ff' })
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.add
      .text(w / 2, h * 0.32 + 20, 'FAIL · RETURN IN GRACE · GO DEEPER', {
        fontFamily: FONT,
        fontSize: '7px',
        color: '#7ef0ff',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setAlpha(0.6);
    this.tweens.add({ targets: title, alpha: { from: 0.78, to: 1 }, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Menu.
    this.options = [
      { label: () => 'BEGIN', act: () => this.begin() },
      { label: () => (this.sfx.isMuted() ? 'SOUND: OFF' : 'SOUND: ON'), act: () => this.toggleSound() },
    ];
    this.options.forEach((_, i) => {
      const y = h * 0.62 + i * 18;
      const t = this.add
        .text(w / 2, y, '', { fontFamily: FONT, fontSize: '10px', color: '#eaf7ff' })
        .setOrigin(0.5)
        .setScrollFactor(0);
      this.items.push(t);
      // A generous, screen-fixed tap/click zone (the text itself is 0-width until
      // refresh() fills it, so an explicit zone is what makes touch reliable).
      this.add
        .zone(w / 2, y, Math.min(w * 0.8, 220), 16)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => this.move(i))
        .on('pointerdown', () => { this.move(i); this.choose(); });
    });
    this.refresh();

    // Studio / project credit (the "producers" line).
    this.add
      .text(w / 2, h - 10, 'an art project · the crossroads', { fontFamily: FONT, fontSize: '6px', color: '#7ef0ff' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setAlpha(0.4);

    const k = this.input.keyboard!;
    k.on('keydown-UP', () => this.move(this.index - 1));
    k.on('keydown-W', () => this.move(this.index - 1));
    k.on('keydown-DOWN', () => this.move(this.index + 1));
    k.on('keydown-S', () => this.move(this.index + 1));
    for (const key of ['ENTER', 'SPACE', 'Z', 'J']) k.on(`keydown-${key}`, () => this.choose());

    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  private refresh(): void {
    this.items.forEach((t, i) => {
      const on = i === this.index;
      t.setText((on ? '▸ ' : '  ') + this.options[i].label());
      t.setColor(on ? '#eaf7ff' : '#8fb2c0').setAlpha(on ? 1 : 0.7).setScale(on ? 1.08 : 1);
    });
  }

  private move(i: number): void {
    const n = this.options.length;
    const ni = ((i % n) + n) % n;
    if (ni === this.index) return;
    this.index = ni;
    this.sfx.uiMove();
    this.refresh();
  }

  private choose(): void {
    if (this.starting) return;
    this.sfx.uiSelect();
    this.options[this.index].act();
  }

  private toggleSound(): void {
    this.sfx.toggleMute();
    this.refresh();
  }

  private begin(): void {
    if (this.starting) return;
    this.starting = true;
    new RunState(this.registry).reset(START_ROOM); // a new run (permanent graces/moves kept)
    this.sfx.startMusic();
    const w = this.scale.width;
    const h = this.scale.height;
    const veil = this.add.rectangle(0, 0, w, h, 0x05050a).setOrigin(0).setScrollFactor(0).setDepth(200).setAlpha(0);
    const loading = this.add
      .text(w / 2, h / 2, 'RETURNING…', { fontFamily: FONT, fontSize: '9px', color: '#7ef0ff' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(201)
      .setAlpha(0);
    this.tweens.add({ targets: veil, alpha: 1, duration: 420 });
    this.tweens.add({ targets: loading, alpha: 0.9, duration: 420 });
    // Every journey begins at the Place of Return — the hub owns the descent.
    this.time.delayedCall(900, () => this.scene.start('HubScene', {}));
  }

  update(_time: number, delta: number): void {
    // Slow drift gives the backdrop a little life.
    this.drift += delta * 0.012;
    const cam = this.cameras.main;
    cam.scrollX = this.drift;
    cam.scrollY = Math.sin(this.drift * 0.01) * 10;
    this.parallax.update(cam, _time);
  }
}
