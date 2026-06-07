import Phaser from 'phaser';
import type { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import type { Sfx } from './Sfx';

/** What the overlay needs from the scene. Getters return live values so the
 *  overlay reflects the current room after a scene.restart. */
export interface DebugRefs {
  player: Player;
  enemies: Phaser.GameObjects.Group;
  bossHazards: Phaser.Physics.Arcade.Group;
  doors: () => { x: number; y: number }[];
  gate: () => { x: number; y: number } | undefined;
  spawns: () => { type: string; tx: number; ty: number }[];
  tile: number;
  worldW: number;
  worldH: number;
  edgeZone: number; // px from each side that arms an edge transition
  roomId: string;
  sfx: Sfx;
}

type Cat = 'bodies' | 'attacks' | 'triggers' | 'spawns' | 'bounds';

const COLOR = {
  playerBody: 0x49ff8a,
  attack: 0xffa030,
  enemy: 0xffe64d,
  danger: 0xff5a5a,
  vulnerable: 0x7ef0ff,
  hazard: 0xff3030,
  trigger: 0xff5af0,
  spawn: 0x9aa0ff,
  spawnEnemy: 0xffb060,
  bounds: 0x4060ff,
};

const ENEMY_SPAWNS = new Set(['runner', 'crawler', 'spark', 'striker', 'guardian']);

/** Dev-only "x-ray" view: draws the normally-invisible collision boxes (the
 *  three boxes per actor — body / attack / hazard), trigger zones, spawn points
 *  and room bounds, plus a toggle panel + readout. Off by default; never shown
 *  to players. Toggle via the ` key, ?debug, or window.__debug(). This is the
 *  seam the level editor reuses (it already visualizes spawns + zones). */
export class DebugOverlay {
  public enabled = false;
  private g: Phaser.GameObjects.Graphics;
  private cats: Record<Cat, boolean> = { bodies: true, attacks: true, triggers: true, spawns: true, bounds: true };
  private panel?: HTMLDivElement;
  private readout?: HTMLDivElement;
  private muteBtn?: HTMLButtonElement;
  private lastReadoutAt = 0;

  constructor(private scene: Phaser.Scene, private refs: DebugRefs) {
    this.g = scene.add.graphics().setDepth(240).setScrollFactor(1).setVisible(false);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
    scene.events.once(Phaser.Scenes.Events.DESTROY, () => this.destroy());
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    this.g.setVisible(on);
    if (on) this.mountPanel();
    else this.unmountPanel();
    if (!on) this.g.clear();
  }

  toggle(): void {
    this.setEnabled(!this.enabled);
  }

  update(timeMs: number): void {
    if (!this.enabled) return;
    this.draw();
    if (timeMs - this.lastReadoutAt > 150) {
      this.lastReadoutAt = timeMs;
      this.updateReadout();
    }
  }

  // --- drawing -----------------------------------------------------------
  private draw(): void {
    const g = this.g;
    g.clear();
    const r = this.refs;

    if (this.cats.bounds) {
      g.lineStyle(1, COLOR.bounds, 0.7);
      g.strokeRect(0.5, 0.5, r.worldW - 1, r.worldH - 1);
    }

    if (this.cats.triggers) {
      // Edge-transition zones (full height, both sides).
      g.lineStyle(1, COLOR.trigger, 0.5);
      g.strokeRect(0, 0, r.edgeZone, r.worldH);
      g.strokeRect(r.worldW - r.edgeZone, 0, r.edgeZone, r.worldH);
      // Door (±14 x, 30 tall up from the foot) + gate (±18 x, 32 tall) windows.
      for (const d of r.doors()) this.strokeBox(d.x - 14, d.y - 30, 28, 30, COLOR.trigger);
      const gate = r.gate();
      if (gate) this.strokeBox(gate.x - 18, gate.y - 32, 36, 32, COLOR.trigger);
    }

    if (this.cats.spawns) {
      for (const s of r.spawns()) {
        const x = s.tx * r.tile + r.tile / 2;
        const y = s.ty * r.tile + r.tile;
        this.cross(x, y, ENEMY_SPAWNS.has(s.type) ? COLOR.spawnEnemy : COLOR.spawn);
      }
    }

    if (this.cats.bodies) {
      this.body(r.player.body, COLOR.playerBody);
      for (const obj of r.enemies.getChildren()) {
        const e = obj as Enemy;
        if (!e.active || !e.isAlive?.()) continue;
        const info = e.debugInfo();
        const c = info.danger ? COLOR.danger : info.vulnerable ? COLOR.vulnerable : COLOR.enemy;
        this.body(e.body as Phaser.Physics.Arcade.Body, c);
      }
    }

    if (this.cats.attacks) {
      if (r.player.hitbox.live) this.body(r.player.hitbox.body, COLOR.attack, 0.18);
      for (const obj of r.bossHazards.getChildren()) {
        const h = obj as Phaser.Physics.Arcade.Image;
        if (h.active && h.body) this.body(h.body as Phaser.Physics.Arcade.Body, COLOR.hazard, 0.18);
      }
    }
  }

  private body(b: Phaser.Physics.Arcade.Body, color: number, fill = 0.1): void {
    this.g.fillStyle(color, fill);
    this.g.lineStyle(1, color, 0.9);
    this.g.fillRect(b.x, b.y, b.width, b.height);
    this.g.strokeRect(b.x, b.y, b.width, b.height);
  }

  private strokeBox(x: number, y: number, w: number, h: number, color: number): void {
    this.g.lineStyle(1, color, 0.8);
    this.g.strokeRect(x, y, w, h);
  }

  private cross(x: number, y: number, color: number): void {
    this.g.lineStyle(1, color, 0.95);
    this.g.beginPath();
    this.g.moveTo(x - 3, y);
    this.g.lineTo(x + 3, y);
    this.g.moveTo(x, y - 3);
    this.g.lineTo(x, y + 3);
    this.g.strokePath();
    this.g.lineStyle(1, color, 0.5);
    this.g.strokeCircle(x, y, 3);
  }

  // --- DOM panel ---------------------------------------------------------
  private mountPanel(): void {
    if (this.panel) return;
    document.getElementById('debug-panel')?.remove();

    const style = document.createElement('style');
    style.id = 'debug-panel-style';
    style.textContent = `
      #debug-panel {
        position: fixed; top: 8px; right: 8px; z-index: 10000;
        font: 11px/1.4 ui-monospace, monospace; color: #cdeffb;
        background: rgba(8,12,20,0.82); border: 1px solid rgba(126,240,255,0.4);
        border-radius: 8px; padding: 8px 10px; min-width: 152px;
        -webkit-user-select: none; user-select: none; backdrop-filter: blur(2px);
      }
      #debug-panel h4 { margin: 0 0 6px; font-size: 11px; letter-spacing: 0.08em; color: #7ef0ff; }
      #debug-panel label { display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 1px 0; }
      #debug-panel .swatch { width: 9px; height: 9px; border-radius: 2px; display: inline-block; }
      #debug-panel button {
        margin-top: 6px; width: 100%; cursor: pointer; color: #cdeffb;
        background: rgba(126,240,255,0.12); border: 1px solid rgba(126,240,255,0.5);
        border-radius: 5px; padding: 3px 0; font: inherit;
      }
      #debug-panel .ro { margin-top: 7px; padding-top: 6px; border-top: 1px solid rgba(126,240,255,0.2); color: #9fd9ec; white-space: pre; }
    `;
    document.head.appendChild(style);

    const root = document.createElement('div');
    root.id = 'debug-panel';
    root.innerHTML = '<h4>DEBUG ` </h4>';

    const rows: [Cat, string, number][] = [
      ['bodies', 'bodies', COLOR.enemy],
      ['attacks', 'attack/hazard', COLOR.attack],
      ['triggers', 'triggers', COLOR.trigger],
      ['spawns', 'spawns', COLOR.spawn],
      ['bounds', 'bounds', COLOR.bounds],
    ];
    for (const [key, label, color] of rows) {
      const l = document.createElement('label');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = this.cats[key];
      cb.addEventListener('change', () => (this.cats[key] = cb.checked));
      const sw = document.createElement('span');
      sw.className = 'swatch';
      sw.style.background = '#' + color.toString(16).padStart(6, '0');
      l.append(cb, sw, document.createTextNode(label));
      root.appendChild(l);
    }

    const mute = document.createElement('button');
    mute.textContent = this.refs.sfx.isMuted() ? 'unmute' : 'mute';
    mute.addEventListener('click', () => {
      const m = this.refs.sfx.toggleMute();
      mute.textContent = m ? 'unmute' : 'mute';
    });
    root.appendChild(mute);
    this.muteBtn = mute;

    const ro = document.createElement('div');
    ro.className = 'ro';
    root.appendChild(ro);
    this.readout = ro;

    document.body.appendChild(root);
    this.panel = root;
    this.updateReadout();
  }

  private updateReadout(): void {
    if (!this.readout) return;
    const r = this.refs;
    const fps = Math.round(this.scene.game.loop.actualFps);
    const live = r.enemies.getChildren().filter((o) => (o as Enemy).isAlive?.()).length;
    const anim = r.player.anims.currentAnim?.key ?? '—';
    this.readout.textContent = `room ${r.roomId}\nfps  ${fps}\nfoes ${live}\nclip ${anim}`;
  }

  private unmountPanel(): void {
    this.panel?.remove();
    this.panel = undefined;
    document.getElementById('debug-panel-style')?.remove();
  }

  destroy(): void {
    this.unmountPanel();
    this.g.destroy();
  }
}
