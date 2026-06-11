import Phaser from 'phaser';

/** The explored-map model GameScene pushes to the minimap. */
interface MinimapModel {
  ww: number; // world size in tiles
  wh: number;
  rooms: { id: string; ox: number; oy: number; w: number; h: number }[];
  discovered: string[];
  current: string;
}

/** Parallel HUD scene. The HUD is a crisp DOM/CSS overlay (not drawn into the
 *  pixel canvas), so text is sharp and the styling is cohesive — health, souls,
 *  area + Broken Memory, transient hints, the boss bar, and the defiant death line.
 *  It listens to GameScene events (that emitter survives scene.restart). */
export class UIScene extends Phaser.Scene {
  private root!: HTMLDivElement;
  private hpFill!: HTMLDivElement;
  private soulNum!: HTMLSpanElement;
  private areaEl!: HTMLDivElement;
  private memEl!: HTMLSpanElement;
  private hintEl!: HTMLDivElement;
  private defiantEl!: HTMLDivElement;
  private bossWrap!: HTMLDivElement;
  private bossNameEl!: HTMLDivElement;
  private bossFill!: HTMLDivElement;
  private skillWrap!: HTMLDivElement;
  private skillFill!: HTMLSpanElement;
  private mapCanvas!: HTMLCanvasElement;
  private mapModel?: MinimapModel;
  private mapPos?: { x: number; y: number };
  private hintTimer = 0;
  private skillTimer = 0;

  constructor() {
    super('UIScene');
  }

  create(): void {
    this.injectStyle();
    document.getElementById('hud')?.remove();
    const root = document.createElement('div');
    root.id = 'hud';
    root.innerHTML = `
      <div class="hud-tl">
        <div class="hp-track"><div class="hp-fill"></div></div>
        <div class="hud-area"><span class="area">THE FIRST FALL</span><span class="mem">◇ MEMORY</span></div>
        <div class="hud-skill ready"><span class="sk-ico">✦</span><span class="sk-track"><span class="sk-fill"></span></span><span class="sk-name">NOVA</span></div>
      </div>
      <div class="hud-souls"><span class="gem"></span><span class="soul-num">0</span></div>
      <canvas class="hud-map" width="208" height="128"></canvas>
      <div class="hud-boss"><div class="boss-name"></div><div class="boss-track"><div class="boss-fill"></div></div></div>
      <div class="hud-hint"></div>
      <div class="hud-defiant"></div>
      <div class="hud-build">${__BUILD_ID__}</div>`;
    document.body.appendChild(root);
    this.root = root;
    const q = <T extends HTMLElement>(s: string) => root.querySelector(s) as T;
    this.hpFill = q('.hp-fill');
    this.soulNum = q('.soul-num');
    this.areaEl = q('.area');
    this.memEl = q('.mem');
    this.hintEl = q('.hud-hint');
    this.defiantEl = q('.hud-defiant');
    this.bossWrap = q('.hud-boss');
    this.bossNameEl = q('.boss-name');
    this.bossFill = q('.boss-fill');
    this.skillWrap = q('.hud-skill');
    this.skillFill = q('.sk-fill');
    this.mapCanvas = q('.hud-map');

    // Press M to fold/unfold the explored map.
    this.input.keyboard?.on('keydown-M', () => this.mapCanvas.classList.toggle('off'));

    this.wire();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.root.remove());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.root.remove());
  }

  private wire(): void {
    const game = this.scene.get('GameScene');
    game.events.on('player-health', (h: number, max: number) => this.setHealth(h, max));
    game.events.on('souls', (n: number) => {
      this.soulNum.textContent = String(n);
      this.soulNum.classList.remove('pop');
      void this.soulNum.offsetWidth; // restart the animation
      this.soulNum.classList.add('pop');
    });
    game.events.on('room-name', (name: string) => (this.areaEl.textContent = name));
    // The explored-map minimap (fog-of-war): the world model + the live player dot.
    game.events.on('map', (m: MinimapModel) => {
      this.mapModel = m;
      this.mapCanvas.classList.toggle('lit', m.rooms.length > 1);
      this.drawMinimap();
    });
    game.events.on('map-pos', (x: number, y: number) => {
      this.mapPos = { x, y };
      this.drawMinimap();
    });
    game.events.on('key-state', (has: boolean) => {
      this.memEl.textContent = has ? '◆ MEMORY' : '◇ MEMORY';
      this.memEl.classList.toggle('on', has);
    });
    game.events.on('hint', (msg: string) => this.showHint(msg));
    game.events.on('player-died', () => this.showDefiant());
    game.events.on('player-reborn', () => this.defiantEl.classList.remove('show'));
    game.events.on('level-complete', () => {
      this.hintEl.classList.remove('show');
      this.defiantEl.classList.remove('show');
    });
    // Boss bar — revealed Mega-Man-style on intro, drains with health.
    game.events.on('boss-intro', (name: string) => {
      this.bossNameEl.textContent = name;
      this.bossWrap.classList.add('show');
      this.mapCanvas.classList.add('duck'); // tuck the minimap away during the fight
      this.bossFill.style.transition = 'none';
      this.bossFill.style.width = '0%';
      requestAnimationFrame(() => {
        this.bossFill.style.transition = 'width 0.7s ease-out';
        this.bossFill.style.width = '100%';
      });
    });
    game.events.on('boss-health', (hp: number, max: number) => {
      this.bossFill.style.width = `${Phaser.Math.Clamp((hp / max) * 100, 0, 100)}%`;
    });
    game.events.on('boss-defeated', () => {
      this.bossWrap.classList.remove('show');
      this.mapCanvas.classList.remove('duck');
    });
    // Grace Nova cooldown — the track refills over the cooldown, then glows ready.
    game.events.on('skill-cd', (ms: number) => {
      this.skillWrap.classList.remove('ready');
      this.skillFill.style.transition = 'none';
      this.skillFill.style.width = '0%';
      requestAnimationFrame(() => {
        this.skillFill.style.transition = `width ${ms}ms linear`;
        this.skillFill.style.width = '100%';
      });
      window.clearTimeout(this.skillTimer);
      this.skillTimer = window.setTimeout(() => this.skillWrap.classList.add('ready'), ms);
    });
  }

  /** Draw the explored map: discovered sub-rooms at their true world positions
   *  (so the shape grows as you explore), the current room lit, the player a dot.
   *  Undiscovered rooms stay fogged (not drawn). */
  private drawMinimap(): void {
    const c = this.mapCanvas;
    const m = this.mapModel;
    if (!c || !m) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const W = c.width;
    const H = c.height;
    ctx.clearRect(0, 0, W, H);
    const pad = 14;
    const scale = Math.min((W - 2 * pad) / m.ww, (H - 2 * pad) / m.wh);
    const offx = (W - m.ww * scale) / 2;
    const offy = (H - m.wh * scale) / 2;
    const disc = new Set(m.discovered);
    for (const r of m.rooms) {
      if (!disc.has(r.id)) continue; // fog — only what we've discovered
      const cur = r.id === m.current;
      const x = offx + r.ox * scale;
      const y = offy + r.oy * scale;
      const w = Math.max(2, r.w * scale - 1);
      const h = Math.max(2, r.h * scale - 1);
      ctx.fillStyle = cur ? 'rgba(126,240,255,0.40)' : 'rgba(126,240,255,0.14)';
      ctx.fillRect(x + 0.5, y + 0.5, w, h);
      ctx.lineWidth = cur ? 2 : 1;
      ctx.strokeStyle = cur ? 'rgba(190,250,255,0.95)' : 'rgba(126,240,255,0.45)';
      ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    }
    if (this.mapPos && disc.has(m.current)) {
      const px = offx + this.mapPos.x * m.ww * scale;
      const py = offy + this.mapPos.y * m.wh * scale;
      ctx.fillStyle = '#ffe8a0';
      ctx.shadowColor = 'rgba(255,224,150,0.9)';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  private setHealth(h: number, max: number): void {
    const pct = Phaser.Math.Clamp(h / max, 0, 1);
    this.hpFill.style.width = `${pct * 100}%`;
    // blood -> molten -> grace as life rises
    const lo = [0xe8, 0x3a, 0x4a];
    const mid = [0xff, 0x8a, 0x3a];
    const hi = [0x7e, 0xf0, 0xff];
    const lerp = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
    const c = pct < 0.5 ? lerp(lo, mid, pct * 2) : lerp(mid, hi, (pct - 0.5) * 2);
    const css = `rgb(${c[0]},${c[1]},${c[2]})`;
    this.hpFill.style.background = `linear-gradient(180deg, ${css}, rgba(${c[0]},${c[1]},${c[2]},0.7))`;
    this.hpFill.style.boxShadow = `0 0 8px rgba(${c[0]},${c[1]},${c[2]},0.6)`;
  }

  private showHint(msg: string): void {
    this.hintEl.textContent = msg;
    this.hintEl.classList.add('show');
    window.clearTimeout(this.hintTimer);
    this.hintTimer = window.setTimeout(() => this.hintEl.classList.remove('show'), 2600);
  }

  private showDefiant(): void {
    this.defiantEl.innerHTML = '<div class="d1">THE WORLD SAYS YOU FAILED.</div><div class="d2">GET BACK UP.</div>';
    this.defiantEl.classList.add('show');
  }

  private injectStyle(): void {
    if (document.getElementById('hud-style')) return;
    const s = document.createElement('style');
    s.id = 'hud-style';
    s.textContent = `
      #hud{position:fixed;inset:0;z-index:60;pointer-events:none;
        font-family:'Dash Horizon',ui-monospace,monospace;color:#eaf7ff;
        --cyan:#7ef0ff;--ink:rgba(8,12,20,.62);}
      #hud .hud-tl{position:absolute;top:16px;left:18px;}
      #hud .hp-track{width:172px;height:11px;background:var(--ink);
        border:1px solid rgba(126,240,255,.35);border-radius:6px;overflow:hidden;
        box-shadow:0 1px 3px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.07);}
      #hud .hp-fill{height:100%;width:100%;border-radius:5px;
        background:linear-gradient(180deg,#7ef0ff,rgba(126,240,255,.7));transition:width .25s ease,background .3s;}
      #hud .hud-area{margin-top:7px;font-size:11px;letter-spacing:.22em;display:flex;gap:12px;align-items:center;}
      #hud .area{color:var(--cyan);opacity:.78;}
      #hud .mem{font-size:10px;letter-spacing:.18em;opacity:.32;color:var(--cyan);transition:opacity .3s;}
      #hud .mem.on{opacity:.95;text-shadow:0 0 8px rgba(126,240,255,.7);}
      #hud .hud-skill{margin-top:6px;display:flex;align-items:center;gap:6px;opacity:.6;transition:opacity .3s;}
      #hud .hud-skill.ready{opacity:1;}
      #hud .hud-skill .sk-ico{font-size:11px;color:var(--cyan);}
      #hud .hud-skill.ready .sk-ico{text-shadow:0 0 8px rgba(126,240,255,.9);}
      #hud .hud-skill .sk-track{width:64px;height:5px;background:var(--ink);border:1px solid rgba(126,240,255,.3);
        border-radius:3px;overflow:hidden;display:inline-block;}
      #hud .hud-skill .sk-fill{display:block;height:100%;width:100%;background:linear-gradient(180deg,#7ef0ff,rgba(126,240,255,.6));}
      #hud .hud-skill .sk-name{font-size:8px;letter-spacing:.18em;color:var(--cyan);opacity:.7;}
      #hud .hud-map{position:absolute;top:14px;right:14px;width:104px;height:64px;opacity:0;
        background:rgba(8,12,20,.6);border:1px solid rgba(126,240,255,.28);border-radius:8px;
        box-shadow:0 1px 4px rgba(0,0,0,.5);transition:opacity .35s;}
      #hud .hud-map.lit{opacity:1;}
      #hud .hud-map.duck,#hud .hud-map.off{opacity:0;}
      #hud .hud-souls{position:absolute;top:88px;right:20px;display:flex;align-items:center;gap:8px;}
      #hud .gem{width:12px;height:12px;border-radius:2px;transform:rotate(45deg);
        background:linear-gradient(135deg,#cdf3ff,#2f78d2);box-shadow:0 0 7px rgba(126,240,255,.75);}
      #hud .soul-num{font-size:15px;letter-spacing:.06em;min-width:14px;text-align:right;
        text-shadow:0 0 6px rgba(126,240,255,.5);display:inline-block;}
      #hud .soul-num.pop{animation:soulpop .24s ease-out;}
      @keyframes soulpop{from{transform:scale(1.45);color:#fff;}to{transform:scale(1);}}
      #hud .hud-boss{position:absolute;top:16px;left:50%;transform:translateX(-50%);
        width:260px;text-align:center;opacity:0;transition:opacity .4s;}
      #hud .hud-boss.show{opacity:1;}
      #hud .boss-name{font-size:11px;letter-spacing:.26em;color:#ffd0d8;margin-bottom:5px;
        text-shadow:0 0 10px rgba(255,90,120,.6);}
      #hud .boss-track{height:9px;background:var(--ink);border:1px solid rgba(255,120,140,.5);
        border-radius:5px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.5);}
      #hud .boss-fill{height:100%;width:100%;background:linear-gradient(180deg,#ff8aa0,#d23b54);
        box-shadow:0 0 9px rgba(255,80,110,.6);}
      #hud .hud-hint{position:absolute;bottom:12%;left:50%;transform:translate(-50%,8px);
        font-size:12px;letter-spacing:.12em;text-align:center;max-width:80%;
        padding:7px 16px;border-radius:999px;background:rgba(8,12,20,.6);
        border:1px solid rgba(126,240,255,.25);opacity:0;transition:opacity .25s,transform .25s;}
      #hud .hud-hint.show{opacity:.96;transform:translate(-50%,0);}
      #hud .hud-defiant{position:absolute;top:42%;left:50%;transform:translateX(-50%);
        text-align:center;opacity:0;transition:opacity .5s;}
      #hud .hud-defiant.show{opacity:.95;}
      #hud .hud-defiant .d1{font-size:13px;letter-spacing:.2em;opacity:.8;margin-bottom:8px;}
      #hud .hud-defiant .d2{font-size:20px;letter-spacing:.3em;color:var(--cyan);text-shadow:0 0 14px rgba(126,240,255,.6);}
      #hud .hud-build{position:absolute;left:8px;bottom:6px;font-size:9px;letter-spacing:.1em;color:var(--cyan);opacity:.28;}
    `;
    document.head.appendChild(s);
  }
}
