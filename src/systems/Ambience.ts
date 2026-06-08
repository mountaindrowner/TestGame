import Phaser from 'phaser';
import { Assets, Sem } from '../data/assetManifest';
import { RoomData } from '../data/roomData';
import { World } from '../data/Tunables';

interface Critter {
  spr: Phaser.GameObjects.Image;
  minX: number;
  maxX: number;
  dir: number;
  speed: number;
  state: 'rest' | 'run';
  until: number;
}

/** Little signs of life: a faint surface-dust haze drifting over everything, and a
 *  few critters scuttling along the lowest ledges. Purely cosmetic, deterministic
 *  placement, behind the player. Reads in any biome. */
export class Ambience {
  private critters: Critter[] = [];

  constructor(scene: Phaser.Scene, room: RoomData) {
    // Foreground surface dust — a very light, slow haze, screen-fixed near the top.
    scene.add
      .particles(0, 0, Assets.dot.key, {
        x: { min: 0, max: scene.scale.width },
        y: { min: 0, max: scene.scale.height * 0.55 },
        lifespan: { min: 4200, max: 8000 },
        speedY: { min: 2, max: 9 },
        speedX: { min: -6, max: 6 },
        scale: { start: 0.22, end: 0.05 },
        alpha: { start: 0, end: 0.16, ease: 'Sine.easeInOut' },
        tint: 0xc2cad8,
        frequency: 240,
        quantity: 1,
        blendMode: Phaser.BlendModes.ADD,
      })
      .setScrollFactor(0)
      .setDepth(110);

    // Critters: pick a few of the LOWEST flat surfaces and set a beetle scuttling.
    const { w, h, tiles } = room;
    const rng = new Phaser.Math.RandomDataGenerator([`ambience-${room.id ?? 'x'}`]);
    const solid = (c: number) => c === Sem.SOLID || c === Sem.CRACKED || c === Sem.PLATFORM;
    const surfaces: { x: number; y: number }[] = [];
    for (let y = h - 5; y < h - 1; y++) {
      for (let x = 3; x < w - 3; x++) {
        if (tiles[y]?.[x] === Sem.EMPTY && solid(tiles[y + 1]?.[x] ?? Sem.SOLID)) surfaces.push({ x, y });
      }
    }
    Phaser.Utils.Array.Shuffle(surfaces);
    const n = Math.min(surfaces.length, 3 + Math.floor(rng.frac() * 2));
    for (let i = 0; i < n; i++) {
      const s = surfaces[i];
      // extend the walkable span left/right so it never scuttles off the ledge
      let lx = s.x;
      let rx = s.x;
      while (lx > 1 && tiles[s.y]?.[lx - 1] === Sem.EMPTY && solid(tiles[s.y + 1]?.[lx - 1] ?? Sem.SOLID)) lx--;
      while (rx < w - 2 && tiles[s.y]?.[rx + 1] === Sem.EMPTY && solid(tiles[s.y + 1]?.[rx + 1] ?? Sem.SOLID)) rx++;
      if (rx - lx < 2) continue;
      const spr = scene.add
        .image(s.x * World.tile + World.tile / 2, (s.y + 1) * World.tile, Assets.critter.key)
        .setOrigin(0.5, 1)
        .setDepth(15)
        .setAlpha(0.85);
      this.critters.push({
        spr,
        minX: lx * World.tile + 3,
        maxX: (rx + 1) * World.tile - 3,
        dir: rng.frac() < 0.5 ? -1 : 1,
        speed: rng.realInRange(26, 42),
        state: 'rest',
        until: 400 + rng.frac() * 1600,
      });
    }
  }

  update(time: number, deltaMs: number): void {
    const dt = deltaMs / 1000;
    for (const c of this.critters) {
      if (time < c.until) {
        if (c.state === 'run') {
          c.spr.x = Phaser.Math.Clamp(c.spr.x + c.dir * c.speed * dt, c.minX, c.maxX);
          c.spr.setFlipX(c.dir < 0);
          c.spr.y += Math.sin(time * 0.04) * 0.12; // a tiny scuttle bob
          if (c.spr.x <= c.minX || c.spr.x >= c.maxX) c.dir *= -1;
        }
        continue;
      }
      // flip state
      if (c.state === 'rest') {
        c.state = 'run';
        c.dir = c.spr.x <= c.minX ? 1 : c.spr.x >= c.maxX ? -1 : c.dir;
        c.until = time + 350 + Math.random() * 700; // a short dart
      } else {
        c.state = 'rest';
        c.until = time + 600 + Math.random() * 2200; // a longer pause
      }
    }
  }
}
