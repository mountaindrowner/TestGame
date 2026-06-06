import Phaser from 'phaser';
import { Assets, Sem } from '../data/assetManifest';
import { RoomData } from '../data/roomData';
import { World } from '../data/Tunables';

interface Deco {
  spr: Phaser.GameObjects.Image;
  amp: number; // sway amplitude (radians)
  speed: number; // sway speed
  phase: number;
}

const KINDS = [
  { key: Assets.vine.key, weight: 26, amp: 0.08, depth: 13 },
  { key: Assets.moss.key, weight: 26, amp: 0.05, depth: 13 },
  { key: Assets.stalactite.key, weight: 20, amp: 0.0, depth: 12 }, // stone — no sway
  { key: Assets.fern.key, weight: 16, amp: 0.06, depth: 13 },
  { key: Assets.chain.key, weight: 16, amp: 0.10, depth: 12 },
  { key: Assets.root.key, weight: 12, amp: 0.05, depth: 12 },
  { key: Assets.banner.key, weight: 8, amp: 0.06, depth: 9 },
];

/** Purely-aesthetic props that hang from ledge undersides and sway. Deterministic
 *  placement (seeded) so the room is stable. Behind the player, never blocking it. */
export class Decorations {
  private items: Deco[] = [];

  constructor(scene: Phaser.Scene, room: RoomData) {
    const rng = new Phaser.Math.RandomDataGenerator(['repentance-first-fall']);
    const { w, h, tiles } = room;
    const solidish = (c: number) => c === Sem.SOLID || c === Sem.CRACKED || c === Sem.PLATFORM;

    let lastX = -10;
    const totalCap = 46;
    for (let y = 2; y < h - 1 && this.items.length < totalCap; y++) {
      for (let x = 2; x < w - 2; x++) {
        const c = tiles[y][x];
        const below = tiles[y + 1][x];
        if (!solidish(c) || below !== Sem.EMPTY) continue; // need a ledge underside
        if (rng.frac() > 0.22) continue; // sparse
        if (x - lastX < 2) continue; // don't cluster horizontally
        lastX = x;

        const kind = this.pick(rng);
        const px = x * World.tile + World.tile / 2;
        const py = (y + 1) * World.tile; // bottom edge of the solid cell
        const spr = scene.add
          .image(px, py, kind.key)
          .setOrigin(0.5, 0) // pivot at the attach point so it swings naturally
          .setDepth(kind.depth)
          .setScale(1, rng.realInRange(0.8, 1.35))
          .setAlpha(0.92);
        this.items.push({
          spr,
          amp: kind.amp * rng.realInRange(0.6, 1.2),
          speed: rng.realInRange(0.0008, 0.0016),
          phase: rng.realInRange(0, Math.PI * 2),
        });
      }
    }
  }

  private pick(rng: Phaser.Math.RandomDataGenerator) {
    const total = KINDS.reduce((s, k) => s + k.weight, 0);
    let r = rng.frac() * total;
    for (const k of KINDS) {
      if ((r -= k.weight) <= 0) return k;
    }
    return KINDS[0];
  }

  update(time: number): void {
    for (const d of this.items) {
      d.spr.setRotation(Math.sin(time * d.speed + d.phase) * d.amp);
    }
  }
}
