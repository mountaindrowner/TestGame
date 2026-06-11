import Phaser from 'phaser';
import { World } from './data/Tunables';
import { Palette } from './data/palette';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { TitleScene } from './scenes/TitleScene';
import { HubScene } from './scenes/HubScene';
import { SanctuaryScene } from './scenes/SanctuaryScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { EditorScene } from './scenes/EditorScene';

// Phaser config only. See DECISIONS.md for why each field matters.
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: Palette.shadow,
  scale: {
    // NONE + a manual zoom: on desktop we SNAP to an integer multiple of the
    // internal resolution so upscaled pixels stay perfectly square (FIT's
    // fractional scale made every other pixel column a different width — the
    // "blurry/uneven" look). Small screens fall back to fractional fill.
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: World.internalWidth,
    height: World.internalHeight,
  },
  render: {
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    powerPreference: 'high-performance',
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: World.gravity },
      debug: false,
    },
  },
  input: { gamepad: true }, // PC controller support (standard mapping)
  fps: { target: 60, min: 30 },
  scene: [BootScene, PreloadScene, TitleScene, HubScene, SanctuaryScene, GameScene, UIScene, EditorScene],
};

// eslint-disable-next-line no-new
const game = new Phaser.Game(config);

/** Crisp-pixel zoom: the largest INTEGER multiple that fits the window (desktop),
 *  or the exact fractional fit when even 1× doesn't fit / barely fits (small
 *  screens, where letterboxing would waste too much space). */
function applyZoom(): void {
  const sx = window.innerWidth / World.internalWidth;
  const sy = window.innerHeight / World.internalHeight;
  const s = Math.min(sx, sy);
  const zoom = s >= 2 ? Math.floor(s) : s;
  game.scale.setZoom(zoom);
}
applyZoom();
window.addEventListener('resize', applyZoom);
