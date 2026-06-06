import Phaser from 'phaser';
import { Palette } from '../data/palette';
import { PlayerTune } from '../data/Tunables';
import { FONT } from '../data/ui';

/** Parallel HUD scene — health, the current area name, the Broken Memory
 *  indicator, transient hints, and the defiant line on death. Runs above
 *  GameScene so it never scrolls or shakes with the world camera. */
export class UIScene extends Phaser.Scene {
  private bar!: Phaser.GameObjects.Graphics;
  private health = PlayerTune.maxHealth;
  private maxHealth = PlayerTune.maxHealth;
  private defiant!: Phaser.GameObjects.Text;
  private areaText!: Phaser.GameObjects.Text;
  private keyPip!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private bossBar!: Phaser.GameObjects.Graphics;
  private bossName!: Phaser.GameObjects.Text;
  private bossMax = 1;
  private bossDisp = 0;
  private bossShown = false;

  constructor() {
    super('UIScene');
  }

  create(): void {
    this.bar = this.add.graphics();
    this.drawHealth();

    this.areaText = this.add
      .text(8, 18, 'THE FIRST FALL', { fontFamily: FONT, fontSize: '7px', color: '#7ef0ff' })
      .setAlpha(0.55);

    // Build stamp, top-center — tiny, so we know which build is live.
    this.add
      .text(this.scale.width / 2, 4, __BUILD_ID__, { fontFamily: FONT, fontSize: '6px', color: '#7ef0ff' })
      .setOrigin(0.5, 0)
      .setAlpha(0.4);

    // Broken Memory indicator — dim until found, then bright.
    this.keyPip = this.add
      .text(8, 30, '◇ MEMORY', { fontFamily: FONT, fontSize: '7px', color: '#7ef0ff' })
      .setAlpha(0.25);

    // Transient contextual hint (e.g. at the sealed gate).
    this.hintText = this.add
      .text(this.scale.width / 2, this.scale.height - 24, '', {
        fontFamily: FONT,
        fontSize: '8px',
        color: '#eaf7ff',
        align: 'center',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // The world says you failed; the game says get back up.
    this.defiant = this.add
      .text(this.scale.width / 2, this.scale.height / 2, '', {
        fontFamily: FONT,
        fontSize: '11px',
        color: '#eaf7ff',
        align: 'center',
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(10);

    // Boss health bar (top-center) + name — revealed Mega-Man-style on intro.
    this.bossBar = this.add.graphics().setScrollFactor(0).setDepth(11).setAlpha(0);
    this.bossName = this.add
      .text(this.scale.width / 2, 24, '', { fontFamily: FONT, fontSize: '8px', color: '#ffd0d8' })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(11);

    const game = this.scene.get('GameScene');
    game.events.on('boss-spawn', (_name: string, _hp: number, max: number) => {
      this.bossMax = max;
    });
    game.events.on('boss-intro', (name: string) => {
      this.bossShown = true;
      this.bossName.setText(name).setAlpha(0);
      this.bossBar.setAlpha(1);
      this.tweens.add({ targets: this.bossName, alpha: 0.95, duration: 300 });
      this.bossDisp = 0;
      this.tweens.add({ targets: this, bossDisp: this.bossMax, duration: 700, ease: 'Quad.easeOut', onUpdate: () => this.drawBossBar() });
    });
    game.events.on('boss-health', (hp: number, max: number) => {
      this.bossMax = max;
      this.bossDisp = hp;
      this.drawBossBar();
    });
    game.events.on('boss-defeated', () => {
      this.bossShown = false;
      this.tweens.add({ targets: [this.bossBar, this.bossName], alpha: 0, duration: 500 });
    });
    game.events.on('player-health', (h: number, max: number) => {
      this.health = h;
      this.maxHealth = max;
      this.drawHealth();
    });
    game.events.on('player-died', () => this.showDefiant());
    game.events.on('player-reborn', () => this.defiant.setAlpha(0));
    game.events.on('room-name', (name: string) => this.areaText.setText(name));
    game.events.on('key-state', (has: boolean) => {
      this.keyPip.setText(has ? '◆ MEMORY' : '◇ MEMORY').setAlpha(has ? 0.9 : 0.25);
    });
    game.events.on('hint', (msg: string) => this.showHint(msg));
    game.events.on('level-complete', () => {
      this.hintText.setAlpha(0);
      this.defiant.setAlpha(0);
    });
  }

  private drawBossBar(): void {
    const w = 200;
    const h = 7;
    const x = (this.scale.width - w) / 2;
    const y = 14;
    this.bossBar.clear();
    if (!this.bossShown) return;
    const pct = Phaser.Math.Clamp(this.bossDisp / this.bossMax, 0, 1);
    this.bossBar.fillStyle(Palette.shadow, 0.85).fillRect(x - 2, y - 2, w + 4, h + 4);
    this.bossBar.fillStyle(Palette.stoneHi, 0.4).fillRect(x, y, w, h);
    this.bossBar.fillStyle(Palette.blood, 1).fillRect(x, y, w * pct, h);
    this.bossBar.fillStyle(Palette.moltenHi, 0.7).fillRect(x, y, w * pct, 1);
    this.bossBar.lineStyle(1, Palette.blood, 0.6).strokeRect(x - 2, y - 2, w + 4, h + 4);
  }

  private showHint(msg: string): void {
    this.hintText.setText(msg).setAlpha(0);
    this.tweens.killTweensOf(this.hintText);
    this.tweens.add({ targets: this.hintText, alpha: 0.95, duration: 220, yoyo: true, hold: 1300 });
  }

  // Health as a row of neon rune-blocks (each ≈ a fifth of max), color-shifting
  // from blood → molten → grace as you carry more life.
  private drawHealth(): void {
    const runeVal = 20;
    const maxRunes = Math.max(1, Math.round(this.maxHealth / runeVal));
    const pct = Phaser.Math.Clamp(this.health / this.maxHealth, 0, 1);
    const col = this.healthColor(pct);
    const cw = 12;
    this.bar.clear();
    for (let i = 0; i < maxRunes; i++) {
      const f = Phaser.Math.Clamp(this.health / runeVal - i, 0, 1);
      this.drawRune(8 + i * cw, 8, i, f, col);
    }
  }

  private healthColor(pct: number): number {
    const toC = Phaser.Display.Color.IntegerToColor;
    const seg =
      pct < 0.5
        ? Phaser.Display.Color.Interpolate.ColorWithColor(toC(Palette.blood), toC(Palette.molten), 100, pct * 200)
        : Phaser.Display.Color.Interpolate.ColorWithColor(toC(Palette.molten), toC(Palette.grace), 100, (pct - 0.5) * 200);
    return Phaser.Display.Color.GetColor(seg.r, seg.g, seg.b);
  }

  /** A small abstract rune glyph (varies by index — like bundled runes). `f` = fill 0..1. */
  private drawRune(x: number, y: number, i: number, f: number, col: number): void {
    const g = this.bar;
    if (f > 0.05) g.fillStyle(col, 0.22 * f).fillRect(x - 1, y - 1, 10, 12); // neon halo
    const c = f > 0.05 ? col : Palette.stoneHi;
    g.lineStyle(2, c, f > 0.05 ? 0.5 + 0.5 * f : 0.22);
    const seg = (x1: number, y1: number, x2: number, y2: number) => {
      g.beginPath();
      g.moveTo(x + x1, y + y1);
      g.lineTo(x + x2, y + y2);
      g.strokePath();
    };
    switch (i % 4) {
      case 0:
        seg(4, 0, 4, 9);
        seg(2, 1, 6, 1);
        seg(4, 4, 6, 4);
        break;
      case 1:
        seg(3, 0, 3, 9);
        seg(3, 3, 6, 6);
        seg(3, 9, 6, 9);
        break;
      case 2: // two strokes bound together
        seg(2, 1, 2, 9);
        seg(6, 1, 6, 9);
        seg(2, 4, 6, 4);
        break;
      default:
        seg(4, 0, 4, 9);
        seg(2, 0, 4, 3);
        seg(6, 0, 4, 3);
        seg(2, 9, 6, 9);
    }
  }

  private showDefiant(): void {
    const lines = ['THE WORLD SAYS YOU FAILED.', 'GET BACK UP.'];
    this.defiant.setText(lines).setAlpha(0);
    this.tweens.add({ targets: this.defiant, alpha: 0.9, duration: 500, yoyo: true, hold: 900 });
  }
}
