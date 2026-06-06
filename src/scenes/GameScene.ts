import Phaser from 'phaser';
import { RoomData, Spawn } from '../data/roomData';
import { buildRoom, START_ROOM } from '../data/levelGraph';
import { Assets, Vis, VIS_SOLID_MAX } from '../data/assetManifest';
import { Palette } from '../data/palette';
import { World, Grace } from '../data/Tunables';
import { RunState } from '../data/RunState';
import { ENEMY_REGISTRY, EnemyKind, isEnemyKind } from '../data/enemyRegistry';
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
import { Projectile } from '../entities/Projectile';

interface DoorRef {
  x: number;
  y: number;
  to: string;
  toEntry?: string;
}

interface EnterData {
  roomId?: string;
  entryDoorId?: string;
}

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
  private enemyProjectiles!: Phaser.Physics.Arcade.Group;
  private graceSpawn = new Phaser.Math.Vector2();
  private respawning = false;
  private fadeRect!: Phaser.GameObjects.Rectangle;
  private run!: RunState;

  // multi-room
  private entryDoorId?: string;
  private doors: DoorRef[] = [];
  private gate?: { x: number; y: number; visual: Phaser.GameObjects.Graphics; glow: Phaser.GameObjects.Rectangle };
  private transitioning = false;
  private interactReadyAt = 0;
  private won = false;
  private bound = false; // scene.restart reuses this instance + its event emitter
  // key pickup
  private keyObj?: Phaser.GameObjects.Container;
  private keyPos = new Phaser.Math.Vector2();

  constructor() {
    super('GameScene');
  }

  create(data: EnterData): void {
    const roomId = data?.roomId ?? START_ROOM;
    this.entryDoorId = data?.entryDoorId;
    const fadeIn = data?.roomId !== undefined; // arriving via a transition

    this.doors = [];
    this.gate = undefined;
    this.keyObj = undefined;
    this.transitioning = false;
    this.won = false;
    this.respawning = false;

    this.room = buildRoom(roomId);
    const roomW = this.room.w * World.tile;
    const roomH = this.room.h * World.tile;

    // Per-run state that persists across room transitions (lives in the registry).
    this.run = new RunState(this.registry);
    this.run.ensure(roomId);
    this.run.data.currentRoomId = roomId;

    // Systems
    this.sfx = new Sfx();
    this.juice = new JuiceSystem(this);
    this.parallax = new ParallaxBackground(this);
    this.particles = new ParticleSystem(this);
    this.particles.startAmbient(roomW, roomH);
    this.actions = new InputManager(this);
    new TouchControls(this, this.actions);

    this.buildTilemap();
    this.decorations = new Decorations(this, this.room);
    this.physics.world.setBounds(0, 0, roomW, roomH);

    // Entities
    this.enemies = this.add.group({ runChildUpdate: true });
    this.enemyProjectiles = this.physics.add.group({ classType: Projectile, maxSize: 24 });
    this.spawnFromData();

    // Restore carried-over health and persist changes back to the run.
    this.player.health = this.run.health;
    this.events.emit('player-health', this.player.health, this.run.data.maxHealth);
    // The scene's event emitter survives scene.restart, so bind these exactly once.
    if (!this.bound) {
      this.bound = true;
      this.events.on('player-health', (h: number) => {
        this.run.health = h;
      });
      this.events.on('player-died', this.startGraceRespawn, this);
      this.events.on('guardian-defeated', this.onGuardianDefeated, this);
    }

    // Combat wiring
    new CombatSystem(this, this.player, this.enemies, this.sfx, this.juice, this.particles);
    this.physics.add.collider(this.player, this.layer);
    this.physics.add.collider(this.enemies, this.layer);
    this.wireProjectiles();

    // Camera
    const cam = this.cameras.main;
    cam.setBounds(0, 0, roomW, roomH);
    cam.setRoundPixels(true);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.setDeadzone(64, 44);

    // Death/transition fade overlay (screen-fixed, above world, below HUD)
    this.fadeRect = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x05050a, 1)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(200)
      .setAlpha(fadeIn ? 1 : 0);
    if (fadeIn) this.tweens.add({ targets: this.fadeRect, alpha: 0, duration: 260 });

    // Parallel HUD
    this.scene.launch('UIScene');
    this.events.emit('room-name', this.room.name);
    this.events.emit('key-state', this.run.hasBrokenMemory);

    this.interactReadyAt = this.time.now + 300; // avoid re-triggering the door we just used

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

  private tileToWorld(s: Spawn): { x: number; y: number } {
    return { x: s.tx * World.tile + World.tile / 2, y: s.ty * World.tile + World.tile };
  }

  private spawnFromData(): void {
    // 1) Player: at the door we entered from, else the room's player spawn.
    const entryDoor = this.entryDoorId
      ? this.room.spawns.find((s) => s.type === 'door' && s.id === this.entryDoorId)
      : undefined;
    const pSpawn = this.room.spawns.find((s) => s.type === 'player');
    const p = entryDoor ?? pSpawn;
    const pos = p ? this.tileToWorld(p) : { x: World.tile * 4, y: World.tile * 5 };
    this.graceSpawn.set(pos.x, pos.y);
    this.player = new Player(this, pos.x, pos.y, {
      input: this.actions,
      sfx: this.sfx,
      juice: this.juice,
      particles: this.particles,
    });

    // 2) Everything else.
    for (const s of this.room.spawns) {
      if (s.type === 'player') continue;
      this.placeSpawn(s);
    }
  }

  private placeSpawn(s: Spawn): void {
    const { x, y } = this.tileToWorld(s);
    switch (s.type) {
      case 'door':
        this.makeDoor(x, y, s);
        break;
      case 'torch':
        this.makeTorch(x, y - 8);
        break;
      case 'key':
        if (!this.run.hasBrokenMemory) this.makeKey(x, y - 12);
        break;
      case 'gate':
        this.makeGate(x, y);
        break;
      default:
        if (isEnemyKind(s.type)) this.spawnEnemy(s.type, x, y);
    }
  }

  private spawnEnemy(kind: EnemyKind, x: number, y: number): void {
    if (kind === 'guardian' && this.run.guardianDefeated) return; // stays dead
    this.enemies.add(
      new Enemy(
        this,
        x,
        y,
        {
          player: this.player,
          sfx: this.sfx,
          juice: this.juice,
          particles: this.particles,
          groundCheck: (gx, gy) => {
            const t = this.layer.getTileAtWorldXY(gx, gy);
            return !!t && t.index >= 0 && t.index <= Vis.PLATFORM; // solid or platform
          },
          fireProjectile: (px, py, vx, vy, dmg, life) => {
            const pr = this.enemyProjectiles.get() as Projectile | null;
            if (pr) pr.fire(px, py, vx, vy, dmg, life);
          },
        },
        ENEMY_REGISTRY[kind],
      ),
    );
  }

  private wireProjectiles(): void {
    this.physics.add.overlap(this.player, this.enemyProjectiles, (_p, prObj) => {
      const pr = prObj as Projectile;
      if (!pr.active) return;
      this.player.takeDamage(pr.damage, pr.x);
      pr.kill();
    });
    this.physics.add.overlap(this.player.hitbox, this.enemyProjectiles, (_hb, prObj) => {
      (prObj as Projectile).kill(); // the blade pops projectiles
    });
    this.physics.add.collider(this.enemyProjectiles, this.layer, (prObj) => {
      (prObj as Projectile).kill();
    });
  }

  private makeDoor(x: number, y: number, _s: Spawn): void {
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
    // a faint "↑" prompt above the doorway
    this.add
      .text(x, y - 36, '↑', { fontFamily: 'monospace', fontSize: '9px', color: '#7ef0ff' })
      .setOrigin(0.5)
      .setAlpha(0.5)
      .setDepth(9);
    this.doors.push({ x, y, to: _s.to ?? START_ROOM, toEntry: _s.toEntry });
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

  private makeKey(x: number, y: number): void {
    // The Broken Memory: a shard of cyan light. Auto-collected on contact.
    const halo = this.add
      .image(0, 0, Assets.dot.key)
      .setScale(5)
      .setTint(Palette.grace)
      .setAlpha(0.35)
      .setBlendMode(Phaser.BlendModes.ADD);
    const core = this.add.image(0, 0, Assets.dot.key).setScale(2).setTint(Palette.bloom).setBlendMode(Phaser.BlendModes.ADD);
    const c = this.add.container(x, y, [halo, core]).setDepth(49);
    this.tweens.add({ targets: c, y: y - 5, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: halo, scale: 6.2, alpha: 0.5, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.keyObj = c;
    this.keyPos.set(x, y);
  }

  private collectKey(): void {
    if (!this.keyObj || this.run.hasBrokenMemory) return;
    this.run.hasBrokenMemory = true;
    this.sfx.grace();
    this.particles.graceMotes(this.keyPos.x, this.keyPos.y, 28);
    this.juice.flash(Palette.grace, 120);
    this.events.emit('key-state', true);
    this.keyObj.destroy();
    this.keyObj = undefined;
  }

  private makeGate(x: number, y: number): void {
    const open = this.run.hasBrokenMemory && this.run.guardianDefeated;
    const visual = this.add.graphics().setDepth(9);
    const glow = this.add
      .rectangle(x, y - 17, 16, 32, open ? Palette.grace : Palette.stoneHi, open ? 0.5 : 0.25)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(9);
    this.gate = { x, y, visual, glow };
    this.drawGate();
    this.tweens.add({ targets: glow, alpha: open ? 0.85 : 0.4, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  private drawGate(): void {
    if (!this.gate) return;
    const { x, y, visual } = this.gate;
    const open = this.run.hasBrokenMemory && this.run.guardianDefeated;
    visual.clear();
    visual.fillStyle(Palette.shadow, 1).fillRect(x - 11, y - 34, 22, 34);
    if (open) {
      visual.fillStyle(Palette.grace, 0.5).fillRect(x - 8, y - 31, 16, 31);
    } else {
      // bars
      visual.fillStyle(Palette.stoneHi, 1);
      for (let i = -8; i <= 8; i += 5) visual.fillRect(x + i, y - 32, 2, 32);
      visual.fillStyle(Palette.stone, 1).fillRect(x - 11, y - 34, 22, 3);
    }
  }

  // ----------------------------------------------------------------------
  update(time: number, _delta: number): void {
    this.actions.update(time);
    this.juice.update(time);
    this.parallax.update(this.cameras.main, time);
    this.decorations.update(time);
    if (this.juice.frozen) return;
    this.checkHazards();
    this.checkPickups();
    this.checkInteractions(time);
  }

  private checkPickups(): void {
    if (this.keyObj && !this.run.hasBrokenMemory) {
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y - 8, this.keyPos.x, this.keyPos.y) < 18) {
        this.collectKey();
      }
    }
  }

  private checkInteractions(time: number): void {
    if (this.transitioning || this.respawning || this.won || time < this.interactReadyAt) return;
    if (!this.actions.justPressed('up')) return;
    const px = this.player.x;
    const py = this.player.y;
    for (const d of this.doors) {
      if (Math.abs(px - d.x) < 14 && Math.abs(py - d.y) < 30) {
        this.transitionTo(d.to, d.toEntry);
        return;
      }
    }
    if (this.gate && Math.abs(px - this.gate.x) < 18 && Math.abs(py - this.gate.y) < 32) {
      this.tryGate();
    }
  }

  private transitionTo(roomId: string, entryDoorId?: string): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.run.health = this.player.health;
    this.player.controllable = false;
    this.tweens.add({
      targets: this.fadeRect,
      alpha: 1,
      duration: 240,
      onComplete: () => this.scene.restart({ roomId, entryDoorId }),
    });
  }

  private tryGate(): void {
    if (this.run.hasBrokenMemory && this.run.guardianDefeated) {
      this.onLevelComplete();
    } else {
      const need = !this.run.hasBrokenMemory && !this.run.guardianDefeated
        ? 'A MEMORY, AND THE GUARDIAN.'
        : !this.run.hasBrokenMemory
          ? 'A MEMORY IS MISSING.'
          : 'THE GUARDIAN STILL STANDS.';
      this.events.emit('hint', need);
    }
  }

  private onGuardianDefeated(): void {
    this.run.guardianDefeated = true;
    this.juice.flash(Palette.grace, 140);
    if (this.gate) {
      this.drawGate();
      this.events.emit('hint', this.run.hasBrokenMemory ? 'THE GATE OPENS.' : 'THE GUARDIAN FALLS. A MEMORY REMAINS.');
    }
  }

  private onLevelComplete(): void {
    if (this.won) return;
    this.won = true;
    this.player.controllable = false;
    this.player.body.setVelocity(0, 0);
    this.sfx.grace();
    this.particles.graceMotes(this.player.x, this.player.y - 14, 40);
    this.tweens.add({ targets: this.fadeRect, alpha: 0.78, duration: 700 });
    this.events.emit('level-complete');
    this.showWinOverlay();
  }

  private showWinOverlay(): void {
    const id = 'win-overlay';
    document.getElementById(id)?.remove();
    const el = document.createElement('div');
    el.id = id;
    el.innerHTML = `
      <style>
        #${id}{position:fixed;inset:0;display:grid;place-items:center;z-index:9998;
          font-family:ui-monospace,monospace;color:#eaf7ff;text-align:center;
          background:radial-gradient(ellipse at center, rgba(10,16,24,0.2), rgba(5,5,10,0.86));}
        #${id} .ttl{font-size:22px;letter-spacing:0.35em;color:#7ef0ff;margin-bottom:10px;}
        #${id} .sub{font-size:12px;opacity:0.8;letter-spacing:0.2em;margin-bottom:22px;}
        #${id} button{pointer-events:auto;appearance:none;border:1.5px solid rgba(126,240,255,0.6);
          background:rgba(10,16,24,0.5);color:#cdeffb;border-radius:999px;padding:10px 22px;
          font:600 12px ui-monospace,monospace;letter-spacing:0.15em;cursor:pointer;}
        #${id} button:hover{background:rgba(126,240,255,0.25);}
      </style>
      <div>
        <div class="ttl">THE FIRST FALL — COMPLETE</div>
        <div class="sub">YOU GOT BACK UP. &nbsp;·&nbsp; TO BE CONTINUED</div>
        <button id="${id}-again">RETURN TO THE FALL</button>
      </div>`;
    document.body.appendChild(el);
    const again = document.getElementById(`${id}-again`);
    again?.addEventListener('pointerup', () => {
      el.remove();
      this.run.reset(START_ROOM);
      this.scene.restart({ roomId: START_ROOM });
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => el.remove());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => el.remove());
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
    this.enemyProjectiles.clear(true, true);
    for (const s of this.room.spawns) {
      if (!isEnemyKind(s.type)) continue;
      const { x, y } = this.tileToWorld(s);
      this.spawnEnemy(s.type, x, y);
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
