import Phaser from 'phaser';
import { buildFirstFall, RoomData, Spawn } from '../data/roomData';
import { Assets, Vis, VIS_SOLID_MAX } from '../data/assetManifest';
import { Palette } from '../data/palette';
import { World, Grace } from '../data/Tunables';
import { InputManager } from '../systems/InputManager';
import { TouchControls } from '../systems/TouchControls';
import { Sfx } from '../systems/Sfx';
import { JuiceSystem } from '../systems/JuiceSystem';
import { ParticleSystem } from '../systems/ParticleSystem';
import { ParallaxBackground } from '../systems/ParallaxBackground';
import { CombatSystem } from '../systems/CombatSystem';
import { autotile } from '../systems/Autotiler';
import { Decorations } from '../systems/Decorations';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';

export class GameScene extends Phaser.Scene {
  private actions!: InputManager;
  private sfx!: Sfx;
  private juice!: JuiceSystem;
  private particles!: ParticleSystem;
  private parallax!: ParallaxBackground;

  private room!: RoomData;
  private layer!: Phaser.Tilemaps.TilemapLayer;
  private decorations!: Decorations;
  private player!: Player;
  private enemies!: Phaser.GameObjects.Group;
  private graceSpawn = new Phaser.Math.Vector2();
  private respawning = false;
  private fadeRect!: Phaser.GameObjects.Rectangle;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.room = buildFirstFall();
    const roomW = this.room.w * World.tile;
    const roomH = this.room.h * World.tile;

    // Systems that don't need the world yet
    this.sfx = new Sfx();
    this.juice = new JuiceSystem(this);
    this.parallax = new ParallaxBackground(this);
    this.particles = new ParticleSystem(this);
    this.particles.startAmbient(roomW, roomH);
    this.actions = new InputManager(this);
    new TouchControls(this, this.actions); // on-screen controls on touch devices

    this.buildTilemap();
    this.decorations = new Decorations(this, this.room);
    this.physics.world.setBounds(0, 0, roomW, roomH);

    // Entities
    this.enemies = this.add.group({ runChildUpdate: true });
    this.spawnFromData();

    // Combat wiring
    new CombatSystem(this, this.player, this.enemies, this.sfx, this.juice, this.particles);
    this.physics.add.collider(this.player, this.layer);
    this.physics.add.collider(this.enemies, this.layer);

    // Camera
    const cam = this.cameras.main;
    cam.setBounds(0, 0, roomW, roomH);
    cam.setRoundPixels(true);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.setDeadzone(64, 44);

    // Death-fade overlay (screen-fixed, above world, below HUD)
    this.fadeRect = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x05050a, 1)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(200)
      .setAlpha(0);

    // Parallel HUD
    this.scene.launch('UIScene');
    this.events.on('player-died', this.startGraceRespawn, this);

    this.installDebugHooks();
    this.time.delayedCall(60, () => {
      window.__GAME_READY = true;
      const boot = document.getElementById('boot');
      if (boot) {
        boot.style.opacity = '0';
        setTimeout(() => boot.remove(), 450);
      }
    });
  }

  // ----------------------------------------------------------------------
  private buildTilemap(): void {
    const visual = autotile(this.room); // semantic cells -> edge-aware visual tiles
    const map = this.make.tilemap({
      data: visual,
      tileWidth: World.tile,
      tileHeight: World.tile,
    });
    const tileset = map.addTilesetImage('depths', Assets.tileset.key, World.tile, World.tile, 0, 0)!;
    this.layer = map.createLayer(0, tileset, 0, 0)!;
    this.layer.setDepth(10);

    this.layer.setCollisionBetween(Vis.WALL_MIN, VIS_SOLID_MAX); // 0..18 walls are solid
    this.layer.setCollision(Vis.PLATFORM);
    // One-way platforms: collide only on the top face.
    this.layer.forEachTile((t) => {
      if (t.index === Vis.PLATFORM) t.setCollision(false, false, true, false);
    });
  }

  private spawnFromData(): void {
    for (const s of this.room.spawns) {
      const x = s.tx * World.tile + World.tile / 2;
      const y = s.ty * World.tile + World.tile; // feet at tile bottom
      this.spawnOne(s, x, y);
    }
  }

  private spawnOne(s: Spawn, x: number, y: number): void {
    switch (s.type) {
      case 'player':
        this.graceSpawn.set(x, y);
        this.player = new Player(this, x, y, {
          input: this.actions,
          sfx: this.sfx,
          juice: this.juice,
          particles: this.particles,
        });
        break;
      case 'runner':
        this.enemies.add(
          new Enemy(this, x, y, {
            player: this.player,
            sfx: this.sfx,
            juice: this.juice,
            particles: this.particles,
            groundCheck: (gx, gy) => {
              const t = this.layer.getTileAtWorldXY(gx, gy);
              return !!t && t.index >= 0 && t.index <= Vis.PLATFORM; // solid or platform
            },
          }),
        );
        break;
      case 'door':
        this.makeDoor(x, y);
        break;
      case 'torch':
        this.makeTorch(x, y - 8);
        break;
    }
  }

  private makeDoor(x: number, y: number): void {
    // A doorway of grace-light: the exit toward House of Mirrors / Market of Want.
    const g = this.add.graphics().setDepth(9);
    g.fillStyle(Palette.shadow, 1).fillRect(x - 9, y - 30, 18, 30);
    const glow = this.add
      .rectangle(x, y - 15, 12, 26, Palette.grace, 0.5)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(9);
    this.tweens.add({ targets: glow, alpha: 0.85, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.add
      .image(x, y - 15, Assets.dot.key)
      .setScale(4)
      .setTint(Palette.grace)
      .setAlpha(0.25)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(8);
  }

  private makeTorch(x: number, y: number): void {
    const flame = this.add
      .image(x, y, Assets.dot.key)
      .setScale(2.4)
      .setTint(Palette.moltenHi)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(47);
    this.tweens.add({
      targets: flame,
      scale: 2.9,
      alpha: 0.7,
      duration: 320,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // ----------------------------------------------------------------------
  update(time: number, _delta: number): void {
    this.actions.update(time);
    this.juice.update(time);
    this.parallax.update(this.cameras.main, time);
    this.decorations.update(time);
    if (!this.juice.frozen) this.checkHazards();
  }

  private checkHazards(): void {
    if (this.respawning || this.player.isInvulnerable()) return;
    const t = this.layer.getTileAtWorldXY(this.player.x, this.player.y - 3);
    if (t && t.index === Vis.MOLTEN) {
      this.player.takeDamage(40, this.player.x);
      this.player.body.setVelocity(0, -240); // pop up out of the fire
      this.particles.debris(this.player.x, this.player.y, 8);
    }
  }

  // ----------------------------------------------------------------------
  // Death -> renewal. The emotional centerpiece: grace refuses to let it end here.
  private startGraceRespawn(deathX: number, deathY: number): void {
    if (this.respawning) return;
    this.respawning = true;
    const cam = this.cameras.main;

    this.particles.sparks(deathX, deathY - 12, 14);
    this.tweens.add({ targets: this.player, alpha: 0, duration: Grace.deathFadeMs * 0.7 });

    // 1) world darkens
    this.tweens.add({ targets: this.fadeRect, alpha: 0.92, duration: Grace.deathFadeMs });

    // 2) in the darkness, move focus to the place of return and rebuild the room
    this.time.delayedCall(Grace.deathFadeMs + Grace.beamDelayMs, () => {
      cam.stopFollow();
      cam.centerOn(this.graceSpawn.x, this.graceSpawn.y - 30);
      this.resetEnemies();
      this.player.beginReborn(this.graceSpawn.x, this.graceSpawn.y);
      this.sfx.grace();
      this.juice.shakeRespawn();
      this.castGraceBeam(this.graceSpawn.x, this.graceSpawn.y);
      // lift the darkness as the light arrives
      this.tweens.add({ targets: this.fadeRect, alpha: 0, duration: Grace.beamGrowMs });
    });

    // 3) the figure reforms in the light, then stands and runs again
    const reformAt = Grace.deathFadeMs + Grace.beamDelayMs + Grace.beamGrowMs;
    this.time.delayedCall(reformAt, () => {
      this.particles.graceMotes(this.graceSpawn.x, this.graceSpawn.y - 14, 30);
      this.tweens.add({
        targets: this.player,
        alpha: 1,
        duration: Grace.reformMs,
        onComplete: () => {
          this.time.delayedCall(Grace.riseMs, () => {
            this.player.finishReborn();
            this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
            this.respawning = false;
          });
        },
      });
    });
  }

  private castGraceBeam(x: number, y: number): void {
    const top = y - 220;
    const beam = this.add
      .rectangle(x, y, 16, 220, Palette.grace, 0.0)
      .setOrigin(0.5, 1)
      .setDepth(118)
      .setBlendMode(Phaser.BlendModes.ADD);
    beam.setScale(0.2, 1);
    this.tweens.add({ targets: beam, fillAlpha: 0.7, scaleX: 1, duration: Grace.beamGrowMs, ease: 'Quad.easeOut' });
    const core = this.add
      .rectangle(x, y, 5, 220, Palette.bloom, 0.0)
      .setOrigin(0.5, 1)
      .setDepth(119)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: core, fillAlpha: 0.9, duration: Grace.beamGrowMs });
    // fade the beam after the figure has risen
    this.tweens.add({
      targets: [beam, core],
      fillAlpha: 0,
      delay: Grace.beamGrowMs + Grace.reformMs,
      duration: 500,
      onComplete: () => {
        beam.destroy();
        core.destroy();
      },
    });
    void top;
  }

  private resetEnemies(): void {
    this.enemies.clear(true, true);
    for (const s of this.room.spawns) {
      if (s.type !== 'runner') continue;
      const x = s.tx * World.tile + World.tile / 2;
      const y = s.ty * World.tile + World.tile;
      this.spawnOne(s, x, y);
    }
    this.physics.add.collider(this.enemies, this.layer);
    new CombatSystem(this, this.player, this.enemies, this.sfx, this.juice, this.particles);
  }

  // ----------------------------------------------------------------------
  private installDebugHooks(): void {
    window.__poseScene = (opts) => this.poseScene(opts?.pose ?? 'default');
  }

  private poseScene(pose: string): void {
    this.physics.world.pause();
    const tileX = (tx: number) => tx * World.tile + World.tile / 2;
    const tileY = (ty: number) => ty * World.tile + World.tile;
    if (pose === 'dash') {
      this.player.setPosition(tileX(24), tileY(13));
      this.player.setFlipX(false);
      this.player.play('player-dash', true);
      this.cameras.main.centerOn(tileX(26), tileY(14));
    } else if (pose === 'attack' || pose === 'combat') {
      this.player.setPosition(tileX(24), tileY(15));
      this.player.setFlipX(false);
      this.player.play('player-attack1', true);
      this.player.anims.setProgress(0.5);
      this.particles.sparks(tileX(26), tileY(14) - 10, 10);
      this.cameras.main.centerOn(tileX(26), tileY(13));
    } else if (pose === 'grace') {
      this.cameras.main.stopFollow();
      this.cameras.main.centerOn(this.graceSpawn.x, this.graceSpawn.y - 30);
      this.castGraceBeam(this.graceSpawn.x, this.graceSpawn.y);
      this.particles.graceMotes(this.graceSpawn.x, this.graceSpawn.y - 14, 30);
    }
  }
}
