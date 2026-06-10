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
    mode: Phaser.Scale.FIT,
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
  fps: { target: 60, min: 30 },
  scene: [BootScene, PreloadScene, TitleScene, HubScene, SanctuaryScene, GameScene, UIScene, EditorScene],
};

// eslint-disable-next-line no-new
new Phaser.Game(config);
