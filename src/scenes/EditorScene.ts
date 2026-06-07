import Phaser from 'phaser';
import { World } from '../data/Tunables';
import { Palette } from '../data/palette';
import { FONT } from '../data/ui';
import { Assets, Sem } from '../data/assetManifest';
import { autotile } from '../systems/Autotiler';
import { ENEMY_REGISTRY, isEnemyKind } from '../data/enemyRegistry';
import type { RoomData, Spawn, SpawnType } from '../data/roomData';
import { buildRoom, ROOM_IDS, START_ROOM } from '../data/levelGraph';
import { saveRoomOverride, clearRoomOverride, hasRoomOverride } from '../data/roomStore';

type Tool = 'paint' | 'entity' | 'select';

const TILE_BRUSHES: { label: string; code: number }[] = [
  { label: 'Solid', code: Sem.SOLID },
  { label: 'Platform', code: Sem.PLATFORM },
  { label: 'Molten', code: Sem.MOLTEN },
  { label: 'Cracked', code: Sem.CRACKED },
  { label: 'Erase', code: Sem.EMPTY },
];

const SPAWN_TYPES: SpawnType[] = ['player', 'door', 'gate', 'key', 'torch', 'runner', 'crawler', 'spark', 'striker', 'guardian'];

// Non-sprite markers (drawn as a lettered chip).
const ICON: Partial<Record<SpawnType, { color: number; label: string }>> = {
  player: { color: 0x7ef0ff, label: 'P' },
  door: { color: 0x7ef0ff, label: 'D' },
  gate: { color: 0xff9d3a, label: 'G' },
  key: { color: 0x9ad7ff, label: 'K' },
  torch: { color: 0xffb060, label: 'T' },
};

/** The in-engine level editor (BIO-01 dev-kit). Opened with ?edit. Renders a
 *  room WYSIWYG via the same Autotiler/tileset the game uses, lets you paint
 *  terrain + place/move/delete entities, saves a browser-local override that
 *  buildRoom() prefers, and exports JSON to fold into the repo. No physics/AI —
 *  it's a pure data editor over RoomData. */
export class EditorScene extends Phaser.Scene {
  private room!: RoomData;
  private roomId!: string;
  private map?: Phaser.Tilemaps.Tilemap;
  private layer?: Phaser.Tilemaps.TilemapLayer;
  private grid!: Phaser.GameObjects.Graphics;
  private sel!: Phaser.GameObjects.Graphics;
  private markers: { go: Phaser.GameObjects.GameObject & { destroy(): void }; spawn: Spawn }[] = [];

  private tool: Tool = 'paint';
  private paintCode: number = Sem.SOLID;
  private entityType: SpawnType = 'runner';
  private selected?: Spawn;
  private painting = false;
  private dragging = false;
  private dirty = false;

  // DOM
  private panel?: HTMLDivElement;
  private inspector?: HTMLDivElement;
  private status?: HTMLDivElement;

  constructor() {
    super('EditorScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0a0a12');
    this.grid = this.add.graphics().setDepth(11);
    this.sel = this.add.graphics().setDepth(30);
    this.roomId = (this.registry.get('editRoom') as string | undefined) ?? START_ROOM;
    this.loadRoom(this.roomId);

    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerup', this.onUp, this);
    this.input.on('pointerupoutside', this.onUp, this);
    this.input.on('wheel', (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
      const cam = this.cameras.main;
      cam.setZoom(Phaser.Math.Clamp(cam.zoom * (dy > 0 ? 0.9 : 1.1), 0.25, 4));
    });
    this.input.keyboard?.on('keydown-DELETE', () => this.deleteSelected());
    this.input.keyboard?.on('keydown-BACKSPACE', () => this.deleteSelected());

    this.mountPanel();
    const boot = document.getElementById('boot'); // clear the loading splash
    if (boot) {
      boot.style.opacity = '0';
      setTimeout(() => boot.remove(), 400);
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unmountPanel());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.unmountPanel());
  }

  // --- room load / render ------------------------------------------------
  private loadRoom(id: string): void {
    this.roomId = id;
    this.registry.set('editRoom', id);
    // Deep copy so edits never mutate the built-in builders' data.
    this.room = JSON.parse(JSON.stringify(buildRoom(id))) as RoomData;
    this.room.id = id;
    this.selected = undefined;
    this.dirty = false;
    this.buildLayer();
    this.buildMarkers();
    if (this.grid) this.drawGrid();
    if (this.sel) this.sel.clear();
    this.fitCamera();
  }

  private buildLayer(): void {
    this.layer?.destroy();
    this.map?.destroy();
    const visual = autotile(this.room);
    this.map = this.make.tilemap({ data: visual, tileWidth: World.tile, tileHeight: World.tile });
    const tileset = this.map.addTilesetImage('depths', Assets.tileset.key, World.tile, World.tile, 0, 0)!;
    this.layer = this.map.createLayer(0, tileset, 0, 0)!;
    this.layer.setDepth(10);
  }

  /** Re-autotile and rewrite the existing layer (edges depend on neighbours). */
  private refreshTiles(): void {
    if (!this.layer) return;
    const v = autotile(this.room);
    for (let y = 0; y < this.room.h; y++) for (let x = 0; x < this.room.w; x++) this.layer.putTileAt(v[y][x], x, y);
  }

  private drawGrid(): void {
    const g = this.grid;
    g.clear();
    const w = this.room.w * World.tile;
    const h = this.room.h * World.tile;
    g.lineStyle(1, 0x7ef0ff, 0.08);
    for (let x = 0; x <= this.room.w; x++) g.lineBetween(x * World.tile, 0, x * World.tile, h);
    for (let y = 0; y <= this.room.h; y++) g.lineBetween(0, y * World.tile, w, y * World.tile);
    g.lineStyle(1.5, 0x7ef0ff, 0.5); // room bounds
    g.strokeRect(0, 0, w, h);
  }

  private buildMarkers(): void {
    for (const m of this.markers) m.go.destroy();
    this.markers = [];
    for (const s of this.room.spawns) this.markers.push({ go: this.markerFor(s), spawn: s });
    this.drawSelection();
  }

  private markerFor(s: Spawn): Phaser.GameObjects.GameObject & { destroy(): void } {
    const cx = s.tx * World.tile + World.tile / 2;
    // Real enemy/player art where we have it.
    let key: string | undefined;
    let scale = 1;
    if (s.type === 'player') key = Assets.player.key;
    else if (isEnemyKind(s.type)) {
      const cfg = ENEMY_REGISTRY[s.type];
      key = cfg.spriteKey;
      scale = cfg.scale ?? 1;
    }
    if (key && this.textures.exists(key)) {
      const img = this.add.image(cx, s.ty * World.tile + World.tile, key, 0).setOrigin(0.5, 1).setDepth(20);
      img.setScale(scale);
      return img;
    }
    const icon = ICON[s.type] ?? { color: 0xffffff, label: '?' };
    const c = this.add.container(cx, s.ty * World.tile + World.tile / 2).setDepth(20);
    const r = this.add.rectangle(0, 0, 14, 14, icon.color, 0.9).setStrokeStyle(1, 0x05050a);
    const t = this.add.text(0, 0, icon.label, { fontFamily: FONT, fontSize: '9px', color: '#05050a' }).setOrigin(0.5);
    c.add([r, t]);
    return c;
  }

  private drawSelection(): void {
    const g = this.sel;
    g.clear();
    if (!this.selected) return;
    const s = this.selected;
    g.lineStyle(1.5, 0xff5af0, 0.95);
    g.strokeRect(s.tx * World.tile - 1, s.ty * World.tile - 1, World.tile + 2, World.tile + 2);
  }

  private fitCamera(): void {
    const w = this.room.w * World.tile;
    const h = this.room.h * World.tile;
    const cam = this.cameras.main;
    cam.setBounds(-220, -160, w + 440, h + 320);
    cam.setZoom(Math.min(World.internalWidth / w, World.internalHeight / h) * 0.94);
    cam.centerOn(w / 2, h / 2);
  }

  // --- pointer ----------------------------------------------------------
  private tileUnder(p: Phaser.Input.Pointer): { tx: number; ty: number } {
    const wp = this.cameras.main.getWorldPoint(p.x, p.y);
    return { tx: Math.floor(wp.x / World.tile), ty: Math.floor(wp.y / World.tile) };
  }
  private inb(tx: number, ty: number): boolean {
    return tx >= 0 && tx < this.room.w && ty >= 0 && ty < this.room.h;
  }

  private onDown(p: Phaser.Input.Pointer): void {
    if (p.rightButtonDown()) return; // right-drag pans (handled in onMove)
    const { tx, ty } = this.tileUnder(p);
    if (!this.inb(tx, ty)) return;
    if (this.tool === 'paint') {
      this.painting = true;
      this.paintAt(tx, ty);
    } else if (this.tool === 'entity') {
      this.stampEntity(tx, ty);
    } else {
      const hit = [...this.room.spawns].reverse().find((s) => s.tx === tx && s.ty === ty);
      this.selected = hit;
      this.dragging = !!hit;
      this.drawSelection();
      this.refreshInspector();
    }
  }

  private onMove(p: Phaser.Input.Pointer): void {
    if (p.rightButtonDown() && p.isDown) {
      const cam = this.cameras.main;
      cam.scrollX -= (p.x - p.prevPosition.x) / cam.zoom;
      cam.scrollY -= (p.y - p.prevPosition.y) / cam.zoom;
      return;
    }
    const { tx, ty } = this.tileUnder(p);
    if (!this.inb(tx, ty)) return;
    if (this.painting && this.tool === 'paint') this.paintAt(tx, ty);
    else if (this.dragging && this.selected) {
      if (this.selected.tx !== tx || this.selected.ty !== ty) {
        this.selected.tx = tx;
        this.selected.ty = ty;
        this.markDirty();
        this.buildMarkers();
        this.drawSelection();
        this.refreshInspector();
      }
    }
  }

  private onUp(): void {
    this.painting = false;
    this.dragging = false;
  }

  private paintAt(tx: number, ty: number): void {
    if (this.room.tiles[ty][tx] === this.paintCode) return;
    this.room.tiles[ty][tx] = this.paintCode;
    this.refreshTiles();
    this.markDirty();
  }

  private stampEntity(tx: number, ty: number): void {
    const spawn: Spawn = { type: this.entityType, tx, ty };
    if (this.entityType === 'door') {
      spawn.id = `door-${this.room.spawns.filter((s) => s.type === 'door').length + 1}`;
      spawn.to = '';
      spawn.toEntry = '';
    } else if (this.entityType === 'gate') {
      spawn.id = 'gate';
    }
    this.room.spawns.push(spawn);
    this.selected = spawn;
    this.markDirty();
    this.buildMarkers();
    this.drawSelection();
    this.refreshInspector();
  }

  private deleteSelected(): void {
    if (!this.selected) return;
    const i = this.room.spawns.indexOf(this.selected);
    if (i >= 0) this.room.spawns.splice(i, 1);
    this.selected = undefined;
    this.markDirty();
    this.buildMarkers();
    this.refreshInspector();
  }

  private markDirty(): void {
    this.dirty = true;
    this.updateStatus();
  }

  // --- actions ----------------------------------------------------------
  private save(): void {
    saveRoomOverride(this.roomId, this.room);
    this.dirty = false;
    this.updateStatus();
  }
  private revert(): void {
    clearRoomOverride(this.roomId);
    this.loadRoom(this.roomId);
    this.refreshInspector();
    this.updateStatus();
  }
  private exportJson(): void {
    const json = JSON.stringify(this.room, null, 2);
    navigator.clipboard?.writeText(json).catch(() => {});
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${this.roomId}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  private play(): void {
    this.save(); // play the live edit
    this.unmountPanel();
    this.scene.start('GameScene', { roomId: this.roomId, fromEditor: true });
  }

  // --- DOM panel --------------------------------------------------------
  private mountPanel(): void {
    document.getElementById('editor-panel')?.remove();
    const style = document.createElement('style');
    style.id = 'editor-panel-style';
    style.textContent = `
      #editor-panel { position: fixed; top: 8px; left: 8px; z-index: 10000; width: 188px;
        font: 11px/1.45 ui-monospace, monospace; color: #cdeffb; background: rgba(8,12,20,0.9);
        border: 1px solid rgba(126,240,255,0.45); border-radius: 8px; padding: 9px 10px;
        -webkit-user-select: none; user-select: none; backdrop-filter: blur(2px); max-height: 94vh; overflow:auto; }
      #editor-panel h4 { margin: 0 0 6px; font-size: 11px; letter-spacing: .1em; color: #7ef0ff; }
      #editor-panel .sec { margin-top: 7px; padding-top: 6px; border-top: 1px solid rgba(126,240,255,.18); }
      #editor-panel .row { display:flex; flex-wrap:wrap; gap:4px; }
      #editor-panel button { cursor:pointer; color:#cdeffb; background:rgba(126,240,255,.1);
        border:1px solid rgba(126,240,255,.45); border-radius:5px; padding:3px 6px; font:inherit; }
      #editor-panel button.on { background:rgba(126,240,255,.32); color:#fff; border-color:rgba(126,240,255,.9); }
      #editor-panel select, #editor-panel input { width:100%; box-sizing:border-box; font:inherit;
        color:#cdeffb; background:rgba(10,16,24,.7); border:1px solid rgba(126,240,255,.4); border-radius:4px; padding:2px 4px; margin-top:3px; }
      #editor-panel .big { width:100%; margin-top:4px; }
      #editor-panel label { display:block; margin-top:4px; color:#9fd9ec; }
      #editor-panel .st { margin-top:7px; padding-top:6px; border-top:1px solid rgba(126,240,255,.18); color:#9fd9ec; white-space:pre-line; }
    `;
    document.head.appendChild(style);

    const root = document.createElement('div');
    root.id = 'editor-panel';
    this.panel = root;

    root.appendChild(this.h('LEVEL EDITOR'));

    // Room picker
    const roomSel = document.createElement('select');
    for (const id of ROOM_IDS) {
      const o = document.createElement('option');
      o.value = id;
      o.textContent = id;
      if (id === this.roomId) o.selected = true;
      roomSel.appendChild(o);
    }
    roomSel.addEventListener('change', () => {
      if (this.dirty && !confirm('Discard unsaved changes?')) {
        roomSel.value = this.roomId;
        return;
      }
      this.loadRoom(roomSel.value);
      this.refreshInspector();
      this.updateStatus();
    });
    root.appendChild(roomSel);

    // Tools
    const toolSec = this.sec();
    const toolRow = this.row();
    (['paint', 'entity', 'select'] as Tool[]).forEach((t) => {
      const b = document.createElement('button');
      b.textContent = t;
      b.className = t === this.tool ? 'on' : '';
      b.addEventListener('click', () => {
        this.tool = t;
        toolRow.querySelectorAll('button').forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
        this.syncToolRows();
      });
      toolRow.appendChild(b);
    });
    toolSec.appendChild(toolRow);
    root.appendChild(toolSec);

    // Tile brushes
    const tileSec = this.sec('tiles');
    tileSec.id = 'ed-tiles';
    const tileRow = this.row();
    TILE_BRUSHES.forEach((br) => {
      const b = document.createElement('button');
      b.textContent = br.label;
      b.className = br.code === this.paintCode ? 'on' : '';
      b.addEventListener('click', () => {
        this.paintCode = br.code;
        tileRow.querySelectorAll('button').forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
      });
      tileRow.appendChild(b);
    });
    tileSec.appendChild(tileRow);
    root.appendChild(tileSec);

    // Entity type
    const entSec = this.sec('entity');
    entSec.id = 'ed-entity';
    const entSel = document.createElement('select');
    for (const t of SPAWN_TYPES) {
      const o = document.createElement('option');
      o.value = t;
      o.textContent = t;
      if (t === this.entityType) o.selected = true;
      entSel.appendChild(o);
    }
    entSel.addEventListener('change', () => (this.entityType = entSel.value as SpawnType));
    entSec.appendChild(entSel);
    root.appendChild(entSec);

    // Selected-entity inspector
    this.inspector = this.sec();
    this.inspector.id = 'ed-inspector';
    root.appendChild(this.inspector);

    // Actions
    const act = this.sec();
    const ar = this.row();
    ar.appendChild(this.btn('Save', () => this.save()));
    ar.appendChild(this.btn('Revert', () => this.revert()));
    ar.appendChild(this.btn('Export', () => this.exportJson()));
    act.appendChild(ar);
    act.appendChild(this.btn('▶ Play-test', () => this.play(), 'big'));
    root.appendChild(act);

    this.status = document.createElement('div');
    this.status.className = 'st';
    root.appendChild(this.status);

    document.body.appendChild(root);
    this.syncToolRows();
    this.refreshInspector();
    this.updateStatus();
  }

  private h(t: string): HTMLHeadingElement {
    const e = document.createElement('h4');
    e.textContent = t;
    return e;
  }
  private sec(label?: string): HTMLDivElement {
    const d = document.createElement('div');
    d.className = 'sec';
    if (label) {
      const l = document.createElement('label');
      l.textContent = label;
      d.appendChild(l);
    }
    return d;
  }
  private row(): HTMLDivElement {
    const d = document.createElement('div');
    d.className = 'row';
    return d;
  }
  private btn(label: string, fn: () => void, cls = ''): HTMLButtonElement {
    const b = document.createElement('button');
    b.textContent = label;
    if (cls) b.className = cls;
    b.addEventListener('click', fn);
    return b;
  }

  private syncToolRows(): void {
    const tiles = document.getElementById('ed-tiles');
    const ent = document.getElementById('ed-entity');
    if (tiles) tiles.style.display = this.tool === 'paint' ? '' : 'none';
    if (ent) ent.style.display = this.tool === 'entity' ? '' : 'none';
  }

  private refreshInspector(): void {
    const ins = this.inspector;
    if (!ins) return;
    ins.innerHTML = '';
    const s = this.selected;
    if (!s) {
      const l = document.createElement('label');
      l.textContent = 'select an entity to edit';
      ins.appendChild(l);
      return;
    }
    ins.appendChild(this.h(`${s.type} @ ${s.tx},${s.ty}`));
    const field = (label: string, val: string, set: (v: string) => void) => {
      const l = document.createElement('label');
      l.textContent = label;
      const i = document.createElement('input');
      i.value = val;
      i.addEventListener('change', () => {
        set(i.value);
        this.markDirty();
      });
      ins.appendChild(l);
      ins.appendChild(i);
    };
    if (s.type === 'door') {
      field('id', s.id ?? '', (v) => (s.id = v));
      field('to (room id)', s.to ?? '', (v) => (s.to = v));
      field('toEntry (door id)', s.toEntry ?? '', (v) => (s.toEntry = v));
    } else if (s.type === 'gate') {
      field('id', s.id ?? 'gate', (v) => (s.id = v));
    }
    ins.appendChild(this.btn('Delete', () => this.deleteSelected(), 'big'));
  }

  private updateStatus(): void {
    if (!this.status) return;
    const ov = hasRoomOverride(this.roomId) ? 'saved-override' : 'built-in';
    this.status.textContent = `room ${this.roomId} (${this.room.w}×${this.room.h})\nsource ${ov}\n${this.dirty ? '● unsaved edits' : '○ clean'}\n[right-drag pan · wheel zoom · Del removes]`;
  }

  private unmountPanel(): void {
    this.panel?.remove();
    this.panel = undefined;
    document.getElementById('editor-panel-style')?.remove();
  }
}
