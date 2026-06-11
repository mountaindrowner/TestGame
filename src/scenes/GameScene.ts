import Phaser from 'phaser';
import { RoomData, Spawn } from '../data/roomData';
import { buildRoom, START_ROOM } from '../data/levelGraph';
import { composeWorld, Placement } from '../data/worldComposer';
import { allScoreEnvs, scoreFor } from '../data/levelScore';
import { describeScore } from '../data/scoreValidate';
import { scaffoldToStore } from '../data/scoreScaffold';
import { Assets, Vis, VIS_SOLID_MAX, biomeOf, Sem } from '../data/assetManifest';
import { Palette } from '../data/palette';
import { World, Grace, Skill, Ember } from '../data/Tunables';
import { RunState } from '../data/RunState';
import { deriveUpgrades, DerivedUpgrades } from '../data/upgrades';
import { FONT } from '../data/ui';
import { ENEMY_REGISTRY, EnemyKind, isEnemyKind } from '../data/enemyRegistry';
import { InputManager } from '../systems/InputManager';
import { TouchControls } from '../systems/TouchControls';
import { Sfx, getSfx } from '../systems/Sfx';
import { Tutorial } from '../systems/Tutorial';
import { DebugOverlay } from '../systems/DebugOverlay';
import { JuiceSystem } from '../systems/JuiceSystem';
import { ParticleSystem } from '../systems/ParticleSystem';
import { ParallaxBackground } from '../systems/ParallaxBackground';
import { CombatSystem } from '../systems/CombatSystem';
import { autotile } from '../systems/Autotiler';
import { Decorations } from '../systems/Decorations';
import { Ambience } from '../systems/Ambience';
import { Lighting } from '../systems/Lighting';
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
  entrySide?: 'east' | 'west';
  fromEditor?: boolean; // launched from the editor's Play-test — Esc returns there
}

export class GameScene extends Phaser.Scene {
  private actions!: InputManager;
  private sfx!: Sfx;
  private juice!: JuiceSystem;
  private particles!: ParticleSystem;
  private parallax!: ParallaxBackground;

  private room!: RoomData;
  // Composed-world support: an ENVIRONMENT is merged into one big map (no fades,
  // a following camera). `placements` are the sub-rooms within it; `entries` give
  // a spawn per sub-room for dev jumps.
  private placements: Placement[] = [];
  private worldEntries: Record<string, { tx: number; ty: number }> = {};
  private requestedRoomId = START_ROOM;
  private arenaSeals: Phaser.Physics.Arcade.Image[] = []; // physical seals on the arena's open edges while a boss lives
  private pendingArena?: Placement; // an undefeated elite's region; arms when the figure enters it
  private currentSubRoom = ''; // which composed sub-region the figure is in (for per-region HUD name)
  private layer!: Phaser.Tilemaps.TilemapLayer;
  private decorations!: Decorations;
  private ambience!: Ambience;
  private lighting!: Lighting;
  private player!: Player;
  private enemies!: Phaser.GameObjects.Group;
  private enemyProjectiles!: Phaser.Physics.Arcade.Group;
  private bossHazards!: Phaser.Physics.Arcade.Group; // ground shockwaves from the slam
  private pickups!: Phaser.Physics.Arcade.Group; // dropped souls / life orbs
  private urns!: Phaser.Physics.Arcade.Group; // breakable scenery
  private bombs!: Phaser.Physics.Arcade.Group; // lobbed timed bombs (bomber enemy)
  private graceSpawn = new Phaser.Math.Vector2();
  private respawning = false;
  private fadeRect!: Phaser.GameObjects.Rectangle;
  private run!: RunState;
  private up!: DerivedUpgrades; // Sanctuary-derived stats (magnet/souls/leech read here)

  // multi-room
  private entryDoorId?: string;
  private entrySide?: 'east' | 'west';
  private interactArmed = false; // must leave an edge zone before it can fire
  private doors: DoorRef[] = [];
  private gate?: { x: number; y: number; visual: Phaser.GameObjects.Graphics; glow: Phaser.GameObjects.Rectangle; to?: string; toEntry?: string; prompt?: Phaser.GameObjects.Text };
  private transitioning = false;
  private interactReadyAt = 0;
  private won = false;
  private bound = false; // scene.restart reuses this instance + its event emitter
  private debug!: DebugOverlay; // dev-only collision/zone x-ray (` to toggle)
  // boss arena
  private bossActive = false;
  private bossIntroPlayed = false;
  private guardianRef?: Enemy;
  private bossBarrier?: Phaser.GameObjects.Rectangle;
  // key pickup
  private keyObj?: Phaser.GameObjects.Container;
  private keyPos = new Phaser.Math.Vector2();
  // Grace Embers (run-scoped in-level boosts) + the Grace Nova skill
  private embers: { id: string; x: number; y: number; obj: Phaser.GameObjects.Container }[] = [];
  private novaReadyAt = 0;

  constructor() {
    super('GameScene');
  }

  create(data: EnterData): void {
    const roomId = data?.roomId ?? START_ROOM;
    this.entryDoorId = data?.entryDoorId;
    this.entrySide = data?.entrySide;
    const fadeIn = data?.roomId !== undefined; // arriving via a transition

    this.doors = [];
    this.gate = undefined;
    this.keyObj = undefined;
    this.embers = [];
    this.transitioning = false;
    this.won = false;
    this.respawning = false;
    this.interactArmed = false;

    // Compose the whole ENVIRONMENT (same-biome, edge-linked rooms) into ONE big
    // map so it plays as a single loadless world — a following camera, no fades on
    // the horizontal spine. The editor's Play-test loads the single edited room.
    this.requestedRoomId = roomId;
    if (data?.fromEditor) {
      this.room = buildRoom(roomId);
      this.placements = [{ id: roomId, name: this.room.name, ox: 0, oy: 0, w: this.room.w, h: this.room.h }];
      this.worldEntries = {};
    } else {
      const world = composeWorld(roomId);
      this.room = world;
      this.placements = world.placements;
      this.worldEntries = world.entries;
    }
    const roomW = this.room.w * World.tile;
    const roomH = this.room.h * World.tile;

    // Per-run state that persists across room transitions (lives in the registry).
    this.run = new RunState(this.registry);
    this.run.ensure(roomId);
    this.run.data.currentRoomId = roomId;

    // Systems
    this.sfx = getSfx(); // shared singleton (one AudioContext across room reloads)
    this.sfx.startMusic();
    this.juice = new JuiceSystem(this);
    this.parallax = new ParallaxBackground(this, this.room.biome);
    this.particles = new ParticleSystem(this);
    this.particles.startAmbient(roomW, roomH);
    this.actions = new InputManager(this);
    new TouchControls(this, this.actions);
    new Tutorial(this, this.actions, roomId === START_ROOM); // onboarding in the opener only

    this.buildTilemap();
    this.decorations = new Decorations(this, this.room, this.room.biome);
    this.ambience = new Ambience(this, this.room);
    this.lighting = new Lighting(this, this.room, this.room.biome);
    this.physics.world.setBounds(0, 0, roomW, roomH);

    // Entities
    this.enemies = this.add.group({ runChildUpdate: true });
    this.enemyProjectiles = this.physics.add.group({ classType: Projectile, maxSize: 24 });
    this.bossHazards = this.physics.add.group();
    this.pickups = this.physics.add.group();
    this.urns = this.physics.add.group();
    this.bombs = this.physics.add.group();
    this.spawnFromData();
    this.events.emit('souls', this.run.souls);

    // Sanctuary upgrades (graces + pacts) + run-scoped embers → concrete stats.
    this.up = deriveUpgrades(this.run.graces, this.run.pacts, this.run.data.embers);
    this.player.applyUpgrades(this.up);
    this.run.maxHealth = this.up.maxHealth;
    // Restore carried-over health and persist changes back to the run.
    this.player.health = Math.min(this.run.health, this.up.maxHealth);
    // The House of Mirrors is only ever reached after the Warden grants Grace Burst;
    // guarantee it here so the biome is never soft-locked (and is jumpable via __gotoRoom).
    if (this.room.biome === 'mirrors' && !this.run.graceBurst) this.run.graceBurst = true;
    this.player.graceBurst = this.run.graceBurst || this.room.id === 'mirror-preview'; // preview grants it

    this.events.emit('player-health', this.player.health, this.run.maxHealth);
    // The scene's event emitter survives scene.restart, so bind these exactly once.
    if (!this.bound) {
      this.bound = true;
      this.events.on('player-health', (h: number) => {
        this.run.health = h;
      });
      this.events.on('player-died', this.startGraceRespawn, this);
      this.events.on('guardian-defeated', this.onGuardianDefeated, this);
      this.events.on('boss-slam', this.onBossSlam, this);
      this.events.on('boss-stomp', this.onBossStomp, this);
      this.events.on('enemy-split', this.onEnemySplit, this);
      this.events.on('enemy-killed', this.onEnemyKilled, this);
    }

    // Combat wiring
    new CombatSystem(this, this.player, this.enemies, this.sfx, this.juice, this.particles);
    this.physics.add.collider(this.player, this.layer);
    this.physics.add.collider(this.enemies, this.layer);
    this.wireProjectiles();

    // Economy: dropped souls / life orbs settle on the ground + are collected on
    // touch; urns shatter when the blade sweeps them.
    this.physics.add.collider(this.pickups, this.layer);
    this.physics.add.collider(this.urns, this.layer);
    this.physics.add.overlap(this.player, this.pickups, (_p, obj) => this.collectPickup(obj as Phaser.Physics.Arcade.Image));
    this.physics.add.overlap(this.player.hitbox, this.urns, (_h, obj) => this.breakUrn(obj as Phaser.Physics.Arcade.Image));
    this.physics.add.collider(this.bombs, this.layer);
    this.physics.add.overlap(this.player, this.bossHazards, (_p, hz) => {
      const h = hz as Phaser.Physics.Arcade.Image;
      if (h.active) this.player.takeDamage((h.getData('dmg') as number) ?? 20, h.x);
    });

    // Camera
    const cam = this.cameras.main;
    cam.setBounds(0, 0, roomW, roomH);
    cam.setRoundPixels(true);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.setDeadzone(64, 44);

    // The arena is a sub-room of the composed world — don't arm on load; arm when
    // the figure actually walks into that region (see checkArena).
    const eliteSpawn = this.undefeatedEliteSpawn();
    this.pendingArena = eliteSpawn ? this.placementAt(eliteSpawn.tx * World.tile, eliteSpawn.ty * World.tile) : undefined;

    // Death/transition fade overlay (screen-fixed, above world, below HUD)
    this.fadeRect = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x05050a, 1)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(200)
      .setAlpha(fadeIn ? 1 : 0);
    if (fadeIn) this.tweens.add({ targets: this.fadeRect, alpha: 0, duration: 260 });

    // Parallel HUD — launch once; it persists across room reloads.
    if (!this.scene.isActive('UIScene')) this.scene.launch('UIScene');
    const syncHud = () => {
      this.events.emit('room-name', this.room.name);
      this.events.emit('key-state', this.run.hasBrokenMemory);
    };
    syncHud();
    this.time.delayedCall(30, syncHud); // also reach UIScene on its very first create

    this.interactReadyAt = this.time.now + 300; // avoid re-triggering the door we just used
    this.makeEdgeHints();

    if (data?.fromEditor) {
      this.registry.set('fromEditor', true);
    }
    if (this.registry.get('fromEditor')) {
      this.input.keyboard?.once('keydown-ESC', () => {
        this.registry.set('fromEditor', false);
        this.scene.stop('UIScene');
        this.scene.start('EditorScene');
      });
    }

    (window as { __loads?: number }).__loads = ((window as { __loads?: number }).__loads ?? 0) + 1;
    this.installDebugHooks();
    this.debug = new DebugOverlay(this, {
      player: this.player,
      enemies: this.enemies,
      bossHazards: this.bossHazards,
      doors: () => this.doors,
      gate: () => this.gate,
      spawns: () => this.room.spawns,
      tile: World.tile,
      worldW: roomW,
      worldH: roomH,
      edgeZone: 24,
      roomId,
      sfx: this.sfx,
    });
    // Persist the toggle across room reloads (the scene is rebuilt each time);
    // start on with ?debug. Players never see it — it's off by default.
    const startOn = (this.registry.get('debug') as boolean | undefined) ?? new URLSearchParams(location.search).has('debug');
    this.debug.setEnabled(!!startOn);
    this.input.keyboard?.on('keydown-BACKTICK', () => {
      this.debug.toggle();
      this.registry.set('debug', this.debug.enabled);
    });
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
    const biome = this.room.biome ?? 'depths';
    const tileset = map.addTilesetImage(biome, biomeOf(biome).tilesetKey, World.tile, World.tile, 0, 0)!;
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
    // 1) Player entry: a named door we came through > the edge we walked in from >
    //    the room's own player spawn > a safe fallback.
    const entryDoor = this.entryDoorId
      ? this.room.spawns.find((s) => s.type === 'door' && s.id === this.entryDoorId)
      : undefined;
    const subEntry = this.worldEntries[this.requestedRoomId]; // composed sub-room spawn
    let pos: { x: number; y: number };
    if (entryDoor) {
      pos = this.tileToWorld(entryDoor);
    } else if (this.entrySide) {
      const tx = this.entrySide === 'west' ? 3 : this.room.w - 4; // arrive just inside that edge
      pos = { x: tx * World.tile + World.tile / 2, y: (this.room.h - 4) * World.tile + World.tile };
    } else if (subEntry) {
      // Direct load / dev jump to a specific sub-area of the composed world.
      pos = this.tileToWorld({ type: 'player', tx: subEntry.tx, ty: subEntry.ty });
    } else {
      const pSpawn = this.room.spawns.find((s) => s.type === 'player');
      pos = pSpawn ? this.tileToWorld(pSpawn) : { x: World.tile * 4, y: World.tile * 5 };
    }
    this.graceSpawn.set(pos.x, pos.y);
    this.player = new Player(this, pos.x, pos.y, {
      input: this.actions,
      sfx: this.sfx,
      juice: this.juice,
      particles: this.particles,
      // solid WALLS only (≤ VIS_SOLID_MAX) — one-way platforms aren't grabbable.
      solidAt: (x, y) => {
        const t = this.layer.getTileAtWorldXY(x, y);
        return !!t && t.index >= 0 && t.index <= VIS_SOLID_MAX;
      },
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
      case 'mirror':
        this.makeMirror(x, y, s.scale ?? 0.28);
        break;
      case 'jar':
        this.makeUrn(x, y);
        break;
      case 'key':
        if (!this.run.hasBrokenMemory) this.makeKey(x, y - 12);
        break;
      case 'ember':
        this.makeEmber(x, y - 12, s);
        break;
      case 'gate':
        this.makeGate(x, y, s);
        break;
      default:
        if (isEnemyKind(s.type)) this.spawnEnemy(s.type, x, y);
    }
  }

  /** True once the elite of this kind has been beaten this run (stays dead). */
  private eliteDefeated(kind: EnemyKind): boolean {
    if (kind === 'guardian') return this.run.guardianDefeated;
    if (kind === 'mirrorboss') return this.run.untrueImageDefeated;
    return false;
  }

  /** The room's arena elite (Warden or Untrue Image) if it hasn't been beaten. */
  private undefeatedEliteSpawn(): Spawn | undefined {
    return this.room.spawns.find(
      (s) => (s.type === 'guardian' || s.type === 'mirrorboss') && !this.eliteDefeated(s.type as EnemyKind),
    );
  }

  // ── Economy: souls, life orbs, breakable urns ─────────────────────────
  /** A foe falls → it sheds souls (the elite a small fountain + a life orb). */
  private onEnemyKilled(x: number, y: number, elite: boolean, kind: EnemyKind): void {
    if (this.up.leechOnKill) this.player.heal(this.up.leechOnKill); // Pact of Hunger
    if (kind === 'fractureShard') return; // split shards don't drop (no fountain)
    const n = elite ? 10 : Phaser.Math.Between(1, 2);
    for (let i = 0; i < n; i++) this.spawnDrop(x + Phaser.Math.Between(-8, 8), y, 'soul');
    if (elite) this.spawnDrop(x, y, 'heal');
    else if (Phaser.Math.Between(0, 99) < 7) this.spawnDrop(x, y, 'heal');
  }

  private spawnDrop(x: number, y: number, kind: 'soul' | 'heal'): void {
    const p = this.pickups.create(x, y, kind === 'heal' ? Assets.heal.key : Assets.soul.key) as Phaser.Physics.Arcade.Image;
    p.setDepth(30).setBlendMode(Phaser.BlendModes.ADD).setData('kind', kind).setData('bornAt', this.time.now);
    const b = p.body as Phaser.Physics.Arcade.Body;
    b.setVelocity(Phaser.Math.Between(-55, 55), Phaser.Math.Between(-170, -90));
    b.setBounce(0.45, 0.45);
    b.setDragX(50);
    b.setCollideWorldBounds(true);
  }

  private collectPickup(p: Phaser.Physics.Arcade.Image): void {
    if (!p.active) return;
    if (this.time.now - (p.getData('bornAt') as number) < 280) return; // let it pop out first
    if (p.getData('kind') === 'heal') {
      this.player.heal(28);
      this.sfx.heal();
      this.particles.graceMotes(p.x, p.y, 12);
    } else {
      this.run.souls += 1 + this.up.soulBonus; // GATHER / Fortune
      this.sfx.pickup();
      this.particles.sparks(p.x, p.y, 4);
      this.events.emit('souls', this.run.souls);
    }
    p.destroy();
  }

  private makeUrn(x: number, y: number): void {
    const u = this.urns.create(x, y, Assets.urn.key) as Phaser.Physics.Arcade.Image;
    u.setOrigin(0.5, 1).setDepth(11);
    const b = u.body as Phaser.Physics.Arcade.Body;
    b.setSize(11, 15).setOffset(2, 3);
    b.setCollideWorldBounds(true);
  }

  private breakUrn(u: Phaser.Physics.Arcade.Image): void {
    if (!u.active || !this.player.hitbox.live || u.getData('broken')) return;
    u.setData('broken', true);
    this.sfx.shatter();
    this.particles.debris(u.x, u.y - 7, 12);
    const n = Phaser.Math.Between(1, 3);
    for (let i = 0; i < n; i++) this.spawnDrop(u.x + Phaser.Math.Between(-6, 6), u.y - 8, 'soul');
    if (Phaser.Math.Between(0, 99) < 35) this.spawnDrop(u.x, u.y - 8, 'heal');
    u.destroy();
  }

  // ── Bomber: a lobbed timed bomb that arcs in and bursts ───────────────
  private lobBomb(x: number, y: number, vx: number, vy: number, damage: number): void {
    const bomb = this.bombs.create(x, y, Assets.dot.key) as Phaser.Physics.Arcade.Image;
    bomb.setScale(2.6).setTint(0x2a2030).setDepth(44).setData('dmg', damage).setData('fuseAt', this.time.now + 1500);
    const b = bomb.body as Phaser.Physics.Arcade.Body;
    b.setCircle(4);
    b.setVelocity(vx, vy);
    b.setBounce(0.35);
    b.setCollideWorldBounds(true);
    // a sputtering fuse glow that quickens as it nears the blast
    const spark = this.add.image(x, y, Assets.dot.key).setScale(1).setTint(Palette.moltenHi).setBlendMode(Phaser.BlendModes.ADD).setDepth(45);
    bomb.setData('spark', spark);
    this.tweens.add({ targets: spark, scale: 1.7, alpha: 0.5, duration: 180, yoyo: true, repeat: -1 });
  }

  private updateBombs(time: number): void {
    for (const obj of this.bombs.getChildren()) {
      const bomb = obj as Phaser.Physics.Arcade.Image;
      if (!bomb.active) continue;
      const spark = bomb.getData('spark') as Phaser.GameObjects.Image | undefined;
      if (spark) spark.setPosition(bomb.x, bomb.y - 4);
      if (time >= (bomb.getData('fuseAt') as number)) this.explodeBomb(bomb);
    }
  }

  private explodeBomb(bomb: Phaser.Physics.Arcade.Image): void {
    const x = bomb.x;
    const y = bomb.y;
    const dmg = bomb.getData('dmg') as number;
    (bomb.getData('spark') as Phaser.GameObjects.Image | undefined)?.destroy();
    bomb.destroy();
    this.sfx.slam();
    this.juice.shake(220, 0.012);
    this.particles.debris(x, y, 20);
    // a brief expanding blast that hurts on contact (reuses the boss-hazard overlap)
    const blast = this.bossHazards.create(x, y, Assets.dot.key) as Phaser.Physics.Arcade.Image;
    blast.setTint(Palette.molten).setBlendMode(Phaser.BlendModes.ADD).setDepth(56).setScale(2).setData('dmg', dmg);
    (blast.body as Phaser.Physics.Arcade.Body).setAllowGravity(false).setCircle(16);
    this.tweens.add({
      targets: blast,
      scaleX: 7,
      scaleY: 7,
      alpha: 0,
      duration: 260,
      ease: 'Quad.easeOut',
      onComplete: () => blast.destroy(),
    });
  }

  /** A Fracture Wisp dies → scatter its shards in a little upward burst. */
  private onEnemySplit(kind: EnemyKind, count: number, x: number, y: number): void {
    for (let i = 0; i < count; i++) {
      const ox = (i - (count - 1) / 2) * 16;
      this.spawnEnemy(kind, x + ox, y - 6);
    }
  }

  private spawnEnemy(kind: EnemyKind, x: number, y: number): void {
    if (this.eliteDefeated(kind)) return; // a beaten elite stays dead
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
          lobBomb: (px, py, vx, vy, dmg) => this.lobBomb(px, py, vx, vy, dmg),
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

  /** The Warden's overhead smash: two molten shockwaves race outward along the
   *  floor from its feet. They sit low, so a well-timed jump clears them. */
  private onBossSlam(x: number, y: number, _facing: number, damage: number): void {
    this.juice.shake(220, 0.014);
    this.particles.debris(x, y - 4, 18);
    for (const dir of [-1, 1]) {
      const wave = this.bossHazards.create(x + dir * 14, y - 6, Assets.dot.key) as Phaser.Physics.Arcade.Image;
      wave
        .setTint(Palette.molten)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(45)
        .setScale(2.4, 1.3)
        .setData('dmg', damage);
      const body = wave.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setVelocityX(dir * 168);
      this.tweens.add({
        targets: wave,
        scaleX: 3.6,
        alpha: 0.25,
        duration: 720,
        ease: 'Quad.easeOut',
        onComplete: () => wave.destroy(),
      });
    }
  }

  /** A heavy boss footfall: a small stage shake, a puff of dust, a low thud. */
  private onBossStomp(x: number, y: number): void {
    this.juice.shake(80, 0.004);
    this.particles.dust(x, y, 4);
    this.sfx.stomp();
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

  /** An ornate broken-mirror pane set into the back wall (PixelLab art). Decorative;
   *  its glass catches a faint cold shimmer. Anchored bottom-center on the tile. */
  private makeMirror(x: number, y: number, scale: number): void {
    const mirror = this.add
      .image(x, y, Assets.mirror.key)
      .setOrigin(0.5, 1)
      .setScale(scale)
      .setDepth(8);
    const shimmer = this.add
      .image(x, y - mirror.displayHeight * 0.5, Assets.dot.key)
      .setScale(mirror.displayWidth * 0.06, mirror.displayHeight * 0.07)
      .setTint(0x9fc0ff)
      .setAlpha(0.0)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(9);
    this.tweens.add({ targets: shimmer, alpha: 0.18, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
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

  /** A Grace Ember — the in-level "scroll": a warm floating flame. Collected on
   *  contact; the player CHOOSES what it kindles (run-scoped). Once taken it stays
   *  gone for the run (tracked by room:tile id in RunState.embersTaken). */
  private makeEmber(x: number, y: number, s: Spawn): void {
    const id = `${this.room.id}:${s.tx},${s.ty}`;
    if (this.run.data.embersTaken.includes(id)) return;
    const halo = this.add
      .image(0, 0, Assets.dot.key)
      .setScale(6)
      .setTint(Palette.molten)
      .setAlpha(0.3)
      .setBlendMode(Phaser.BlendModes.ADD);
    const flame = this.add
      .image(0, 0, Assets.dot.key)
      .setScale(2.6)
      .setTint(Palette.moltenHi)
      .setBlendMode(Phaser.BlendModes.ADD);
    const core = this.add.image(0, -1, Assets.dot.key).setScale(1.2).setTint(Palette.bloom).setBlendMode(Phaser.BlendModes.ADD);
    const c = this.add.container(x, y, [halo, flame, core]).setDepth(49);
    this.tweens.add({ targets: c, y: y - 5, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: halo, scale: 7.4, alpha: 0.42, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.embers.push({ id, x, y, obj: c });
  }

  private collectEmber(e: { id: string; x: number; y: number; obj: Phaser.GameObjects.Container }): void {
    this.embers = this.embers.filter((q) => q !== e);
    e.obj.destroy();
    this.sfx.heal();
    this.particles.graceMotes(e.x, e.y, 18);
    this.juice.flash(Palette.moltenHi, 90);
    this.showEmberChoice(e.id);
  }

  /** Pause and let the player choose what the ember kindles (this run). */
  private showEmberChoice(emberId: string): void {
    const id = 'ember-overlay';
    document.getElementById(id)?.remove();
    const el = document.createElement('div');
    el.id = id;
    el.innerHTML = `
      <style>
        #${id}{position:fixed;inset:0;display:grid;place-items:center;z-index:9998;
          font-family:'Dash Horizon',ui-monospace,monospace;color:#eaf7ff;text-align:center;
          background:radial-gradient(ellipse at center, rgba(30,16,8,0.25), rgba(5,5,10,0.85));}
        #${id} .ttl{font-size:17px;letter-spacing:0.3em;color:#ffb46a;margin-bottom:6px;
          text-shadow:0 0 14px rgba(255,140,60,.5);}
        #${id} .sub{font-size:10px;opacity:0.7;letter-spacing:0.16em;margin-bottom:18px;}
        #${id} .opts{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}
        #${id} button{pointer-events:auto;appearance:none;border:1.5px solid rgba(126,240,255,0.5);
          background:rgba(10,16,24,0.72);color:#cdeffb;border-radius:12px;padding:14px 16px;width:150px;
          font-family:inherit;cursor:pointer;text-align:center;}
        #${id} button:hover{background:rgba(126,240,255,0.18);}
        #${id} .bn{font-size:12px;letter-spacing:0.12em;margin-bottom:6px;color:#eaf7ff;}
        #${id} .bb{font-size:9.5px;opacity:0.7;letter-spacing:0.04em;line-height:1.5;}
      </style>
      <div>
        <div class="ttl">A GRACE EMBER</div>
        <div class="sub">choose what it kindles — for this run</div>
        <div class="opts">
          <button data-k="blade"><div class="bn">EDGE OF GRACE</div><div class="bb">+${Math.round(Ember.blade * 100)}% blade damage</div></button>
          <button data-k="life"><div class="bn">BREATH OF LIFE</div><div class="bb">+${Ember.life} max life<br>and restore it</div></button>
          <button data-k="spirit"><div class="bn">KINDLED SPIRIT</div><div class="bb">grace nova recovers<br>${Math.round(Ember.spirit * 100)}% faster</div></button>
        </div>
      </div>`;
    document.body.appendChild(el);
    this.scene.pause();
    el.querySelectorAll<HTMLButtonElement>('button').forEach((b) =>
      b.addEventListener('pointerup', () => {
        const k = b.dataset.k as 'blade' | 'life' | 'spirit';
        this.run.data.embers[k] += 1;
        this.run.data.embersTaken.push(emberId);
        // re-derive and re-apply the live stats
        this.up = deriveUpgrades(this.run.graces, this.run.pacts, this.run.data.embers);
        this.player.applyUpgrades(this.up);
        this.run.maxHealth = this.up.maxHealth;
        if (k === 'life') this.player.heal(Ember.life);
        this.events.emit('player-health', this.player.health, this.up.maxHealth);
        this.sfx.uiSelect();
        el.remove();
        this.scene.resume();
      }),
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => el.remove());
  }

  /** Grace Nova — the active skill: a radiant burst that staggers and repels
   *  everything around the figure. The breath you take to make space. */
  private castNova(time: number): void {
    if (time < this.novaReadyAt || !this.player.controllable || this.respawning || this.won) return;
    const cd = Skill.novaCooldownMs * this.up.skillCdMult;
    this.novaReadyAt = time + cd;
    this.events.emit('skill-cd', cd);
    const px = this.player.x;
    const py = this.player.y - 10;
    this.sfx.nova();
    this.juice.flash(Palette.grace, 90);
    this.juice.shake(180, 0.008);
    this.juice.zoomPunch(1.05, 90, 300); // the gathered breath, released
    this.particles.graceMotes(px, py, 26);
    // the expanding ring
    const ring = this.add.graphics({ x: px, y: py }).setDepth(60).setBlendMode(Phaser.BlendModes.ADD);
    ring.lineStyle(3, Palette.grace, 0.9).strokeCircle(0, 0, 10);
    ring.lineStyle(1.5, Palette.bloom, 0.8).strokeCircle(0, 0, 7);
    this.tweens.add({
      targets: ring,
      scale: Skill.novaRadius / 10,
      alpha: 0,
      duration: 320,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
    // stagger + damage + repel everything in the radius; pop projectiles too
    for (const obj of this.enemies.getChildren()) {
      const e = obj as Enemy;
      if (!e.isAlive()) continue;
      if (Phaser.Math.Distance.Between(px, py, e.x, e.y) > Skill.novaRadius) continue;
      e.takeDamage(Math.round(Skill.novaDamage * this.up.damageMult), px, true); // core=true -> the long stagger
    }
    for (const obj of this.enemyProjectiles.getChildren()) {
      const pr = obj as Projectile;
      if (pr.active && Phaser.Math.Distance.Between(px, py, pr.x, pr.y) <= Skill.novaRadius) pr.kill();
    }
  }

  private makeGate(x: number, y: number, s?: Spawn): void {
    const open = this.run.hasBrokenMemory && this.run.guardianDefeated;
    const visual = this.add.graphics().setDepth(9);
    const glow = this.add
      .rectangle(x, y - 17, 16, 32, open ? Palette.grace : Palette.stoneHi, open ? 0.5 : 0.25)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(9);
    // A clear "↑ ASCEND" prompt above the gate — shown once it's open so it's
    // obvious how to leave for the next area.
    const prompt = this.add
      .text(x, y - 44, '↑ ASCEND', { fontFamily: FONT, fontSize: '7px', color: '#7ef0ff' })
      .setOrigin(0.5)
      .setDepth(48)
      .setAlpha(0);
    this.gate = { x, y, visual, glow, to: s?.to, toEntry: s?.toEntry, prompt };
    this.drawGate();
    this.tweens.add({ targets: glow, alpha: open ? 0.85 : 0.4, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    if (open) this.tweens.add({ targets: prompt, alpha: 0.95, y: y - 48, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  /** The gate as a stone PORTCULLIS — frame + lintel + bars. Unlocked (Memory +
   *  Warden down) the bars glow grace and the ascend prompt shows; activating it
   *  lifts the bars and rides a lift up (see rideLift). */
  private drawGate(): void {
    if (!this.gate) return;
    const { x, y, visual, prompt } = this.gate;
    const unlocked = this.run.hasBrokenMemory && this.run.guardianDefeated;
    visual.clear();
    // frame: lintel + side posts
    visual.fillStyle(Palette.shadow, 1).fillRect(x - 13, y - 38, 26, 5);
    visual.fillStyle(Palette.shadow, 0.95).fillRect(x - 13, y - 34, 3, 34);
    visual.fillStyle(Palette.shadow, 0.95).fillRect(x + 10, y - 34, 3, 34);
    // portcullis bars (these are what lift)
    const bar = unlocked ? Palette.grace : Palette.stoneHi;
    visual.fillStyle(bar, unlocked ? 0.95 : 1);
    for (let i = -8; i <= 8; i += 5) visual.fillRect(x + i, y - 32, 2, 32);
    visual.fillRect(x - 9, y - 25, 18, 2); // cross-bars
    visual.fillRect(x - 9, y - 13, 18, 2);
    if (unlocked && prompt && !this.tweens.isTweening(prompt)) {
      prompt.setAlpha(0);
      this.tweens.add({ targets: prompt, alpha: 0.95, y: y - 48, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  /** Activate an unlocked gate: the portcullis grinds up and a chain-hauled stone
   *  lift carries the figure up and out of frame into the next area — with weight. */
  private rideLift(): void {
    if (this.transitioning || !this.gate || !this.gate.to) return;
    const g = this.gate;
    this.transitioning = true;
    this.player.controllable = false;
    this.player.body.setVelocity(0, 0);
    this.player.x = g.x; // center on the lift
    g.prompt?.setVisible(false);
    this.tweens.killTweensOf(g.glow);
    g.glow.setAlpha(0.9);
    this.sfx.grind(); // stone machinery under load
    this.sfx.chain();
    this.juice.shake(300, 0.007);

    const slabY = this.player.y + 4;
    const chainTopY = slabY - 240; // chains run up off-frame, reeling the lift in
    // 1) the bars grind upward and fade.
    this.tweens.add({ targets: g.visual, y: -34, alpha: 0, duration: 600, ease: 'Quad.easeOut' });

    // 2) a stone lift slab (grace underglow) + a hauling chain on each side.
    const slab = this.add
      .rectangle(g.x, slabY, 30, 6, Palette.stoneHi)
      .setStrokeStyle(1, Palette.grace, 0.7)
      .setDepth(40);
    const glow = this.add
      .image(g.x, slabY - 2, Assets.dot.key)
      .setScale(9, 3)
      .setTint(Palette.grace)
      .setAlpha(0.0)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(39);
    const mkChain = (dx: number) =>
      this.add.tileSprite(g.x + dx, chainTopY, 6, slabY - chainTopY, Assets.chain.key).setOrigin(0.5, 0).setDepth(41);
    const chainL = mkChain(-12);
    const chainR = mkChain(12);

    // 3) once the bars are clear, the chains haul it up and out, then we travel on.
    this.time.delayedCall(480, () => {
      this.player.body.enable = false; // the tween drives position now
      this.sfx.clank();
      this.particles.dust(g.x, this.player.y, 6);
      this.tweens.add({ targets: glow, alpha: 0.4, duration: 300 });
      // rhythmic clanks as the links reel in — that's the weight.
      this.time.addEvent({ delay: 220, repeat: 6, callback: () => this.sfx.chain() });
      this.tweens.add({
        targets: [this.player, slab, glow],
        y: '-=176',
        duration: 1550,
        ease: 'Sine.easeIn',
        onUpdate: () => {
          const len = Math.max(0, slab.y - chainTopY);
          chainL.height = len;
          chainR.height = len;
        },
        onComplete: () => {
          this.cameras.main.fadeOut(320, 0, 0, 0);
          this.run.health = this.player.health;
          // The lift rises into the interim SANCTUARY; departing it continues to the area.
          this.time.delayedCall(340, () => {
            this.scene.stop('UIScene');
            this.scene.start('SanctuaryScene', { next: g.to, entry: g.toEntry });
          });
        },
      });
    });
  }

  // ----------------------------------------------------------------------
  update(time: number, _delta: number): void {
    this.debug.update(time); // x-ray draws even during hitstop
    this.actions.update(time);
    this.juice.update(time);
    this.parallax.update(this.cameras.main, time);
    this.decorations.update(time);
    this.ambience.update(time, _delta);
    this.lighting.update(this.cameras.main, this.player.x, this.player.y);
    if (this.juice.frozen) return;
    if (this.transitioning) return; // riding the lift / mid-transition — freeze world checks
    this.checkHazards();
    this.checkPickups();
    this.updateBombs(time);
    this.checkArena();
    this.checkSubRoom();
    this.checkInteractions(time);
    if (this.actions.justPressed('skill')) this.castNova(time);
  }

  /** Update the HUD area name as the figure roams between sub-regions of the one
   *  composed world (THE LOWER VAULTS → THE CROSSROADS → …) — the seamless map
   *  still names its places. */
  private checkSubRoom(): void {
    if (this.placements.length < 2) return;
    const here = this.placementAt(this.player.x, this.player.y);
    if (here && here.id !== this.currentSubRoom) {
      this.currentSubRoom = here.id;
      this.events.emit('room-name', here.name);
    }
  }

  /** Arm the arena (seal + Mega-Man intro) the moment the figure crosses into the
   *  undefeated elite's region of the composed world. */
  private checkArena(): void {
    if (this.bossActive || this.won || !this.pendingArena) return;
    const p = this.pendingArena;
    const tx = this.player.x / World.tile;
    const ty = this.player.y / World.tile;
    if (tx >= p.ox && tx < p.ox + p.w && ty >= p.oy && ty < p.oy + p.h) {
      this.pendingArena = undefined;
      this.armBoss(true);
    }
  }

  private checkPickups(): void {
    if (this.keyObj && !this.run.hasBrokenMemory) {
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y - 8, this.keyPos.x, this.keyPos.y) < 18) {
        this.collectKey();
      }
    }
    for (const e of this.embers) {
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y - 8, e.x, e.y) < 18) {
        this.collectEmber(e);
        break;
      }
    }
    // Souls/orbs drift toward the player once settled + near (a little magnetism).
    const px = this.player.x;
    const py = this.player.y - 8;
    for (const obj of this.pickups.getChildren()) {
      const p = obj as Phaser.Physics.Arcade.Image;
      if (!p.active || this.time.now - (p.getData('bornAt') as number) < 280) continue;
      const d = Phaser.Math.Distance.Between(px, py, p.x, p.y);
      if (d < this.up.magnetRange) {
        const b = p.body as Phaser.Physics.Arcade.Body;
        b.setAllowGravity(false);
        this.physics.velocityFromRotation(Math.atan2(py - p.y, px - p.x), 200, b.velocity);
      }
    }
  }

  private checkInteractions(time: number): void {
    if (this.transitioning || this.respawning || this.won || time < this.interactReadyAt) return;
    const px = this.player.x;
    const py = this.player.y;
    const roomW = this.room.w * World.tile;
    const L = this.room.links ?? {};
    const ax = this.actions.axisX();

    if (px > 24 && px < roomW - 24) this.interactArmed = true; // clear of the edge zones

    // Edges: just walk into them — the world keeps going. Quick fade.
    // (Sealed while the Warden lives — you can't leave the arena.)
    if (this.interactArmed && !this.bossActive) {
      if (L.east && px > roomW - 24 && ax > 0) return void this.transitionTo(L.east, { entrySide: 'west' });
      if (L.west && px < 24 && ax < 0) return void this.transitionTo(L.west, { entrySide: 'east' });
    }

    // Side doors + the gate are deliberate — press ↑. (Sealed while the arena boss lives.)
    if (!this.bossActive && this.actions.justPressed('up')) {
      for (const d of this.doors) {
        if (Math.abs(px - d.x) < 14 && Math.abs(py - d.y) < 30) return void this.transitionTo(d.to, { entryDoorId: d.toEntry });
      }
      if (this.gate && Math.abs(px - this.gate.x) < 30 && Math.abs(py - this.gate.y) < 34) this.tryGate();
    }
  }

  private transitionTo(roomId: string, opts: { entryDoorId?: string; entrySide?: 'east' | 'west' }): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.run.health = this.player.health;
    this.player.controllable = false;
    this.tweens.add({
      targets: this.fadeRect,
      alpha: 1,
      duration: 160,
      onComplete: () => this.scene.restart({ roomId, ...opts }),
    });
  }

  private makeEdgeHints(): void {
    const L = this.room.links ?? {};
    const roomW = this.room.w * World.tile;
    const y = (this.room.h - 4) * World.tile;
    const chevron = (x: number, ch: string) =>
      this.add
        .text(x, y, ch, { fontFamily: 'monospace', fontSize: '12px', color: '#7ef0ff' })
        .setOrigin(0.5)
        .setAlpha(0.35)
        .setDepth(9);
    if (L.west) chevron(16, '«');
    if (L.east) chevron(roomW - 16, '»');
  }

  private tryGate(): void {
    if (this.run.hasBrokenMemory && this.run.guardianDefeated) {
      // An opened gate that leads somewhere (BIO-01 → House of Mirrors) lifts + rides
      // a lift up to it; otherwise it's the end of the line (level complete).
      if (this.gate?.to) this.rideLift();
      else this.onLevelComplete();
    } else {
      const need = !this.run.hasBrokenMemory && !this.run.guardianDefeated
        ? 'SEALED — DEFEAT THE WARDEN AND BRING A BROKEN MEMORY.'
        : !this.run.hasBrokenMemory
          ? 'SEALED — A BROKEN MEMORY IS MISSING (DROP INTO THE PIT AT THE CROSSROADS, TO THE WEST).'
          : 'SEALED — THE WARDEN STILL STANDS.';
      this.events.emit('hint', need);
    }
  }

  /** Which composed sub-room contains this world point (tile-space lookup). */
  private placementAt(x: number, y: number): Placement | undefined {
    const tx = x / World.tile;
    const ty = y / World.tile;
    return this.placements.find((p) => tx >= p.ox && tx < p.ox + p.w && ty >= p.oy && ty < p.oy + p.h);
  }

  /** Largest contiguous open (EMPTY) run along a row of the merged grid, in [x0,x1). */
  private openSpanRow(row: number, x0: number, x1: number): { lo: number; hi: number } | null {
    let best: { lo: number; hi: number } | null = null;
    let cur: { lo: number; hi: number } | null = null;
    for (let x = x0; x < x1; x++) {
      if (this.room.tiles[row]?.[x] === Sem.EMPTY) cur = cur ? { lo: cur.lo, hi: x } : { lo: x, hi: x };
      else cur = null;
      if (cur && (!best || cur.hi - cur.lo > best.hi - best.lo)) best = cur;
    }
    return best;
  }

  /** Largest contiguous open run down a column of the merged grid, in [y0,y1). */
  private openSpanCol(col: number, y0: number, y1: number): { lo: number; hi: number } | null {
    let best: { lo: number; hi: number } | null = null;
    let cur: { lo: number; hi: number } | null = null;
    for (let y = y0; y < y1; y++) {
      if (this.room.tiles[y]?.[col] === Sem.EMPTY) cur = cur ? { lo: cur.lo, hi: y } : { lo: y, hi: y };
      else cur = null;
      if (cur && (!best || cur.hi - cur.lo > best.hi - best.lo)) best = cur;
    }
    return best;
  }

  /** Drop invisible static walls across the arena's open edges so the figure can't
   *  retreat out — a vertical wall at an open WEST edge, a floor across an open
   *  BOTTOM edge (the climb-up entrance). Lifted by unsealArena on the kill. */
  private sealArena(a: Placement): void {
    const T = World.tile;
    const addSeal = (cx: number, cy: number, w: number, h: number) => {
      const seal = this.physics.add.staticImage(cx, cy, Assets.dot.key).setVisible(false);
      const body = seal.body as Phaser.Physics.Arcade.StaticBody;
      body.setSize(w, h);
      body.updateFromGameObject();
      this.physics.add.collider(this.player, seal);
      this.arenaSeals.push(seal);
    };
    // West edge open (walked-in arena, e.g. the gate) → a tall wall just inside it.
    const west = this.openSpanCol(a.ox, a.oy, a.oy + a.h);
    if (west) addSeal((a.ox + 0.5) * T, ((west.lo + west.hi + 1) / 2) * T, 6, (west.hi - west.lo + 1) * T);
    // Bottom edge open (climbed-up arena, e.g. untrue-image) → a floor over the hole
    // at the arena's standing level so you can't drop back down the shaft.
    const bottom = this.openSpanRow(a.oy + a.h - 1, a.ox, a.ox + a.w);
    if (bottom) addSeal(((bottom.lo + bottom.hi + 1) / 2) * T, (a.oy + a.h - 4) * T, (bottom.hi - bottom.lo + 1) * T, 6);
    // The pulsing red barrier line marks the seal (west wall if any, else the floor).
    if (!this.bossBarrier) {
      const bx = west ? (a.ox + 0.5) * T : ((bottom?.lo ?? a.ox) + (bottom?.hi ?? a.ox + a.w) + 1) / 2 * T;
      const by = west ? a.oy * T : (a.oy + a.h - 4) * T;
      const bw = west ? 4 : (bottom ? (bottom.hi - bottom.lo + 1) * T : 4);
      const bh = west ? a.h * T : 4;
      this.bossBarrier = this.add
        .rectangle(bx, by, bw, bh, Palette.blood, 0.0)
        .setOrigin(west ? 0.5 : 0.5, west ? 0 : 0.5)
        .setDepth(60)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: this.bossBarrier, fillAlpha: 0.5, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  /** Seal the arena and (first time) play the Mega-Man-style intro. In a composed
   *  world the arena is one sub-room of the big map, so the seal is a PHYSICAL wall
   *  across whichever edge the figure entered through — the open WEST edge (gate,
   *  walked in) or the BOTTOM hole (untrue-image, climbed up into). */
  private armBoss(cinematic: boolean): void {
    const guardian = this.enemies.getChildren().find((e) => (e as Enemy).cfg?.elite) as Enemy | undefined;
    if (!guardian) return;
    this.bossActive = true;
    this.guardianRef = guardian;
    const arena = this.placementAt(guardian.x, guardian.y) ?? this.placements[0];
    if (arena) this.sealArena(arena);
    if (cinematic && !this.bossIntroPlayed) {
      this.bossIntroPlayed = true;
      this.bossIntro(guardian);
    } else {
      this.events.emit('boss-intro', guardian.cfg.displayName);
    }
  }

  private bossIntro(guardian: Enemy): void {
    const cam = this.cameras.main;
    this.player.controllable = false;
    this.player.body.setVelocity(0, 0);
    guardian.introHold = true;
    cam.stopFollow();
    cam.pan(guardian.x, guardian.y - 24, 600, 'Sine.easeInOut');
    this.time.delayedCall(680, () => {
      guardian.play(guardian.cfg.anims.taunt ?? guardian.cfg.anims.windup, true); // the roar
      this.sfx.roar();
      this.juice.shake(380, 0.012);
      this.events.emit('boss-intro', guardian.cfg.displayName); // bar draws in
    });
    this.time.delayedCall(2300, () => {
      cam.startFollow(this.player, true, 0.12, 0.12);
      this.player.controllable = true;
      guardian.introHold = false;
      guardian.play(guardian.cfg.anims.idle ?? guardian.cfg.anims.run, true);
    });
  }

  private onGuardianDefeated(kind?: EnemyKind): void {
    this.bossActive = false;
    const mirror = kind === 'mirrorboss';
    if (mirror) this.run.untrueImageDefeated = true;
    else this.run.guardianDefeated = true;

    // The Warden's fall grants Grace Burst — grace gives movement (DESIGN.md).
    if (!mirror && !this.run.graceBurst) {
      this.run.graceBurst = true;
      this.player.graceBurst = true;
      this.time.delayedCall(900, () => this.events.emit('hint', 'GRACE BURST — dash through the air (in the air)'));
    }
    // The Untrue Image is the end of the House of Mirrors — its fall completes the area.
    if (mirror) this.time.delayedCall(1200, () => this.onLevelComplete());
    if (this.bossBarrier) {
      this.tweens.killTweensOf(this.bossBarrier);
      this.tweens.add({
        targets: this.bossBarrier,
        fillAlpha: 0,
        duration: 400,
        onComplete: () => {
          this.bossBarrier?.destroy();
          this.bossBarrier = undefined;
        },
      });
    }
    this.arenaSeals.forEach((s) => s.destroy()); // lift the physical seal(s) — you may leave
    this.arenaSeals = [];
    this.juice.flash(Palette.grace, 140);
    if (this.gate) {
      this.drawGate();
      const msg = this.run.hasBrokenMemory
        ? 'THE WAY OPENS ABOVE — REACH THE GATE (EAST) AND PRESS ↑'
        : 'THE WARDEN FALLS — BUT THE GATE NEEDS A BROKEN MEMORY (BACK WEST).';
      // Let the Grace Burst hint play first, then leave the directional one lingering.
      this.time.delayedCall(2800, () => this.events.emit('hint', msg));
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
          font-family:'Dash Horizon',ui-monospace,monospace;color:#eaf7ff;text-align:center;
          background:radial-gradient(ellipse at center, rgba(10,16,24,0.2), rgba(5,5,10,0.86));}
        #${id} .ttl{font-size:22px;letter-spacing:0.35em;color:#7ef0ff;margin-bottom:10px;}
        #${id} .sub{font-size:12px;opacity:0.8;letter-spacing:0.2em;margin-bottom:22px;}
        #${id} button{pointer-events:auto;appearance:none;border:1.5px solid rgba(126,240,255,0.6);
          background:rgba(10,16,24,0.5);color:#cdeffb;border-radius:999px;padding:10px 22px;
          font:600 12px ui-monospace,monospace;letter-spacing:0.15em;cursor:pointer;}
        #${id} button:hover{background:rgba(126,240,255,0.25);}
      </style>
      <div>
        <div class="ttl">${this.room.biome === 'mirrors' ? 'THE HOUSE OF MIRRORS — COMPLETE' : 'THE FIRST FALL — COMPLETE'}</div>
        <div class="sub">${this.room.biome === 'mirrors' ? 'YOU FACED THE UNTRUE IMAGE.' : 'YOU GOT BACK UP.'} &nbsp;·&nbsp; TO BE CONTINUED</div>
        <button id="${id}-again">RETURN IN GRACE</button>
      </div>`;
    document.body.appendChild(el);
    const again = document.getElementById(`${id}-again`);
    again?.addEventListener('pointerup', () => {
      el.remove();
      this.run.reset(START_ROOM); // a new run — permanent graces/moves + souls kept
      this.scene.stop('UIScene');
      this.scene.start('HubScene', {});
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
  // Death -> the Place of Return. Grace does not leave you where you fell — it
  // carries you home, and the route is walked again (a new run; everything
  // permanent kept, souls banked). The defiant line lands in the darkness, then
  // you wake in the beam at the hub.
  private startGraceRespawn(deathX: number, deathY: number): void {
    if (this.respawning) return;
    this.respawning = true;
    this.particles.sparks(deathX, deathY - 12, 14);
    this.tweens.add({ targets: this.player, alpha: 0, duration: Grace.deathFadeMs * 0.7 });
    this.tweens.add({ targets: this.fadeRect, alpha: 1, duration: Grace.deathFadeMs });
    this.time.delayedCall(Grace.deathFadeMs + 1100, () => {
      this.run.reset(START_ROOM);
      this.scene.stop('UIScene');
      this.scene.start('HubScene', { died: true });
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

  // ----------------------------------------------------------------------
  private installDebugHooks(): void {
    window.__poseScene = (opts) => this.poseScene(opts?.pose ?? 'default', opts?.anim, opts?.progress);
    window.__gotoRoom = (id) => this.scene.restart({ roomId: id });
    window.__poseBoss = (opts) => {
      const boss = this.enemies.getChildren().find((e) => (e as Enemy).cfg?.elite) as Enemy | undefined;
      if (!boss) return;
      this.physics.world.pause();
      boss.introHold = true;
      boss.setFlipX(true); // face the incoming player (left)
      if (opts?.anim) boss.play(opts.anim, true);
      boss.anims.setProgress(opts?.progress ?? 0.5);
      this.cameras.main.stopFollow();
      this.cameras.main.centerOn(boss.x, boss.y - 20);
    };
    window.__debug = (on?: boolean) => {
      this.debug.setEnabled(on ?? !this.debug.enabled);
      this.registry.set('debug', this.debug.enabled);
    };
    window.__setRun = (partial) => {
      Object.assign(this.run.data, partial);
      this.scene.restart({ roomId: this.room.id });
    };
    window.__killBoss = () => {
      const boss = this.enemies.getChildren().find((e) => (e as Enemy).cfg?.elite) as Enemy | undefined;
      boss?.takeDamage(99999, boss.x);
    };
    window.__health = () => this.player.health;
    window.__ppos = () => ({ x: Math.round(this.player.x), y: Math.round(this.player.y) });
    window.__sanctuary = (next?: string) => {
      this.scene.stop('UIScene');
      this.scene.start('SanctuaryScene', { next: next ?? this.room.id });
    };
    (window as { __hub?: (died?: boolean) => void }).__hub = (died?: boolean) => {
      this.scene.stop('UIScene');
      this.scene.start('HubScene', { died: !!died });
    };
    (window as { __die?: () => void }).__die = () => this.player.takeDamage(99999, this.player.x);
    (window as { __zoom?: () => number }).__zoom = () => this.cameras.main.zoom;
    (window as { __ember?: () => void }).__ember = () => this.showEmberChoice(`dev:${Date.now()}`);
    // Level Score / logic gate / scaffolder dev hooks.
    const w = window as {
      __score?: (env?: string) => void;
      __scaffold?: (env?: string) => string | undefined;
    };
    w.__score = (env?: string) => {
      const envs = env ? [env] : allScoreEnvs();
      for (const e of envs) {
        const s = scoreFor(e);
        // eslint-disable-next-line no-console
        console.log(s ? describeScore(s) : `no score for '${e}'`);
      }
    };
    w.__scaffold = (env = 'first-fall') => {
      const s = scoreFor(env);
      if (!s) {
        // eslint-disable-next-line no-console
        console.log(`no score for '${env}'`);
        return undefined;
      }
      const { startId, ids } = scaffoldToStore(s);
      // eslint-disable-next-line no-console
      console.log(`scaffolded ${ids.length} greybox rooms for '${env}':\n  ${ids.join('\n  ')}\n→ __gotoRoom('${startId}') to walk it, or ?edit to refine.`);
      return startId;
    };
  }

  private poseScene(pose: string, anim?: string, progress?: number): void {
    this.physics.world.pause();
    const tileX = (tx: number) => tx * World.tile + World.tile / 2;
    const tileY = (ty: number) => ty * World.tile + World.tile;
    // Dev: pose an arbitrary player anim at a given progress (verifying clips).
    if (anim) {
      this.player.setPosition(tileX(24), tileY(15));
      this.player.setFlipX(false);
      this.player.play(anim, true);
      this.player.anims.setProgress(progress ?? 0.5);
      this.cameras.main.centerOn(tileX(26), tileY(13));
      return;
    }
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
