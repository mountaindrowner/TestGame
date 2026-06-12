import Phaser from 'phaser';
import { Sem, Assets } from '../data/assetManifest';
import { World } from '../data/Tunables';
import { vhash, chance, range } from '../data/variation';
import type { RoomData } from '../data/roomData';

interface Arm {
  spr: Phaser.GameObjects.Sprite;
  baseY: number; // the pit surface (arms reach UP from here)
  x: number;
}

/** THE GRASPING DEPTHS — over every hazard band (Sem.MOLTEN, re-themed from lava)
 *  a SWARM of skeletal arms claws up out of the dark, desynced so they writhe like
 *  a tide of the fallen. When the figure passes over/near a pit, the nearest arms
 *  LUNGE higher and faster — the world reaching to drag the penitent down. Pure
 *  cosmetic threat (the pit's contact damage already lives in GameScene); the
 *  reaching sells the danger. Deterministic placement (ART_VARIATION). */
export class GraspPit {
  private arms: Arm[] = [];
  private getPlayer: () => { x: number; y: number };

  constructor(scene: Phaser.Scene, room: RoomData, biome: string | undefined, getPlayer: () => { x: number; y: number }) {
    this.getPlayer = getPlayer;
    const { w, h, tiles } = room;
    const T = World.tile;
    const isPit = (x: number, y: number) => tiles[y]?.[x] === Sem.MOLTEN;
    // a hazard SURFACE cell = a pit tile that is open above (the reach lane)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!isPit(x, y)) continue;
        const above = tiles[y - 1]?.[x];
        if (above !== Sem.EMPTY && above !== undefined) continue; // need open air overhead
        // 1–2 arms per surface tile, deterministically jittered within the cell
        const n = chance(x, y, 0.55, 91) ? 2 : 1;
        for (let i = 0; i < n; i++) {
          const px = x * T + T / 2 + Math.round((vhash(x, y, 11 + i) - 0.5) * 10);
          const baseY = y * T + T - 1; // the pit surface (arm rises from just below it)
          const spr = scene.add
            .sprite(px, baseY, Assets.hand.key)
            .setOrigin(0.5, 1)
            .setDepth(9) // in front of the tile, behind the player (depth 50)
            .setAlpha(0.9)
            .setScale(0.9 + vhash(x, y, 23 + i) * 0.3)
            .setFlipX(vhash(x, y, 31 + i) > 0.5);
          spr.play({ key: 'hand-reach', startFrame: Math.floor(range(x, y, 0, 6, 7 + i)) }); // desync the swarm
          spr.anims.timeScale = 0.7 + vhash(x, y, 41 + i) * 0.5;
          this.arms.push({ spr, baseY, x: px });
        }
      }
    }
  }

  /** Lunge the arms near the figure (called each frame from GameScene). */
  update(_time: number, _delta: number): void {
    if (!this.arms.length) return;
    const p = this.getPlayer();
    for (const a of this.arms) {
      const near = Math.abs(p.x - a.x) < 40 && p.y < a.baseY + 8 && p.y > a.baseY - 56;
      // when crowded, the arm strains UP toward the prey + speeds its clawing
      const target = near ? a.baseY - 6 : a.baseY;
      a.spr.y += (target - a.spr.y) * 0.15;
      a.spr.anims.timeScale = near ? 1.8 : a.spr.anims.timeScale * 0.96 + 0.7 * 0.04;
      a.spr.setAlpha(near ? 1 : 0.9);
    }
  }
}
