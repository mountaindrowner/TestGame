import Phaser from 'phaser';

// Tiny scene: anything that must be configured before the loader runs goes here.
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    this.scene.start('PreloadScene');
  }
}
