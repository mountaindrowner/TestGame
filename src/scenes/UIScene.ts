import Phaser from 'phaser';
import { Palette } from '../data/palette';
import { PlayerTune } from '../data/Tunables';

/** Parallel HUD scene — health + the area name + the defiant line on death.
 *  Runs above GameScene so it never scrolls or shakes with the world camera. */
export class UIScene extends Phaser.Scene {
  private bar!: Phaser.GameObjects.Graphics;
  private health = PlayerTune.maxHealth;
  private maxHealth = PlayerTune.maxHealth;
  private defiant!: Phaser.GameObjects.Text;

  constructor() {
    super('UIScene');
  }

  create(): void {
    this.bar = this.add.graphics();
    this.drawHealth();

    this.add
      .text(8, 18, 'THE FIRST FALL', {
        fontFamily: 'monospace',
        fontSize: '7px',
        color: '#7ef0ff',
      })
      .setAlpha(0.55);

    // The world says you failed; the game says get back up.
    this.defiant = this.add
      .text(this.scale.width / 2, this.scale.height / 2, '', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#eaf7ff',
        align: 'center',
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(10);

    const game = this.scene.get('GameScene');
    game.events.on('player-health', (h: number, max: number) => {
      this.health = h;
      this.maxHealth = max;
      this.drawHealth();
    });
    game.events.on('player-died', () => this.showDefiant());
    game.events.on('player-reborn', () => this.defiant.setAlpha(0));
  }

  private drawHealth(): void {
    const x = 8;
    const y = 8;
    const w = 92;
    const h = 6;
    const pct = Phaser.Math.Clamp(this.health / this.maxHealth, 0, 1);
    this.bar.clear();
    this.bar.fillStyle(Palette.shadow, 0.8).fillRect(x - 1, y - 1, w + 2, h + 2);
    this.bar.fillStyle(Palette.stoneHi, 0.4).fillRect(x, y, w, h);
    this.bar.fillStyle(Palette.grace, 1).fillRect(x, y, w * pct, h);
    this.bar.fillStyle(Palette.bloom, 0.6).fillRect(x, y, w * pct, 1);
    this.bar.lineStyle(1, Palette.grace, 0.5).strokeRect(x - 1, y - 1, w + 2, h + 2);
  }

  private showDefiant(): void {
    const lines = [
      'THE WORLD SAYS YOU FAILED.',
      'GET BACK UP.',
    ];
    this.defiant.setText(lines).setAlpha(0);
    this.tweens.add({ targets: this.defiant, alpha: 0.9, duration: 500, yoyo: true, hold: 900 });
  }
}
