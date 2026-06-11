import Phaser from 'phaser';
import { ParallaxBackground } from '../systems/ParallaxBackground';
import { ParticleSystem } from '../systems/ParticleSystem';
import { getSfx } from '../systems/Sfx';
import { RunState } from '../data/RunState';
import { START_ROOM } from '../data/levelGraph';

/** Boot menu — the journey drifts behind the title (the depths backdrop, slowly
 *  panning, dust adrift). The title + menu are a crisp DOM overlay (like the hub —
 *  canvas text upscales blocky; DOM text renders at native resolution). Arrow/WASD
 *  to move, Enter/Space/Z to choose; menu blips on move + select. */
export class TitleScene extends Phaser.Scene {
  private parallax!: ParallaxBackground;
  private sfx = getSfx();
  private options: { label: () => string; act: () => void }[] = [];
  private items: HTMLDivElement[] = [];
  private root?: HTMLDivElement;
  private index = 0;
  private drift = 0;
  private starting = false;

  constructor() {
    super('TitleScene');
  }

  create(): void {
    // The scene instance is reused (Boot→Title, editor→Title), so reset per-create
    // state — else stale destroyed objects linger from the prior visit.
    this.items = [];
    this.options = [];
    this.index = 0;
    this.starting = false;
    this.drift = 0;
    // Clear the DOM pre-boot splash (#boot) — the title is the first scene now, so
    // it owns that hand-off (GameScene/EditorScene do it on their own entry).
    const boot = document.getElementById('boot');
    if (boot) {
      boot.style.opacity = '0';
      setTimeout(() => boot.remove(), 450);
    }
    const w = this.scale.width;
    const h = this.scale.height;

    this.parallax = new ParallaxBackground(this, 'depths');
    new ParticleSystem(this).startAmbient(w * 2, h * 2); // drifting dust/motes

    this.options = [
      { label: () => 'BEGIN', act: () => this.begin() },
      { label: () => 'CONTROLS', act: () => this.toggleControls() },
      { label: () => 'MAP EDITOR', act: () => this.openEditor() },
      { label: () => (this.sfx.isMuted() ? 'SOUND: OFF' : 'SOUND: ON'), act: () => this.toggleSound() },
    ];
    this.mountDom();

    const k = this.input.keyboard!;
    k.on('keydown-UP', () => this.move(this.index - 1));
    k.on('keydown-W', () => this.move(this.index - 1));
    k.on('keydown-DOWN', () => this.move(this.index + 1));
    k.on('keydown-S', () => this.move(this.index + 1));
    for (const key of ['ENTER', 'SPACE', 'Z', 'J']) k.on(`keydown-${key}`, () => this.choose());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unmountDom());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.unmountDom());
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  // --- crisp DOM overlay (title + menu + credit) -------------------------
  private mountDom(): void {
    this.unmountDom();
    if (!document.getElementById('title-style')) {
      const s = document.createElement('style');
      s.id = 'title-style';
      s.textContent = `
        #title{position:fixed;inset:0;z-index:70;display:flex;flex-direction:column;align-items:center;
          font-family:'Dash Horizon',ui-monospace,monospace;color:#eaf7ff;
          -webkit-user-select:none;user-select:none;}
        #title .head{margin-top:24vh;text-align:center;}
        #title .name{font-size:clamp(34px,7vw,64px);letter-spacing:.22em;text-indent:.22em;color:#eaf7ff;
          text-shadow:0 0 24px rgba(126,240,255,.45),0 2px 0 rgba(5,5,10,.8);animation:titlepulse 4.4s ease-in-out infinite;}
        @keyframes titlepulse{0%,100%{opacity:.82;}50%{opacity:1;}}
        #title .tag{margin-top:10px;font-size:clamp(9px,1.4vw,13px);letter-spacing:.34em;text-indent:.34em;
          color:#7ef0ff;opacity:.62;}
        #title .menu{margin-top:auto;margin-bottom:18vh;display:flex;flex-direction:column;gap:14px;align-items:center;}
        #title .opt{font-size:clamp(13px,1.9vw,18px);letter-spacing:.26em;text-indent:.26em;color:#8fb2c0;
          opacity:.72;cursor:pointer;padding:4px 26px;transition:color .15s,opacity .15s,transform .15s;}
        #title .opt.on{color:#eaf7ff;opacity:1;transform:scale(1.07);text-shadow:0 0 14px rgba(126,240,255,.55);}
        #title .opt.on::before{content:'▸ ';color:#7ef0ff;}
        #title .credit{position:absolute;bottom:14px;width:100%;text-align:center;
          font-size:clamp(8px,1vw,11px);letter-spacing:.22em;color:#7ef0ff;opacity:.4;}
        #title .controls{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:flex;gap:42px;
          background:rgba(8,12,20,.92);border:1px solid rgba(126,240,255,.35);border-radius:10px;
          padding:22px 30px;cursor:pointer;z-index:5;}
        #title .ctl-h{color:#7ef0ff;letter-spacing:.3em;font-size:clamp(10px,1.2vw,13px);margin-bottom:10px;}
        #title .ctl-col div{font-size:clamp(9px,1.1vw,12px);letter-spacing:.12em;color:#8fb2c0;margin:5px 0;}
        #title .ctl-col b{color:#eaf7ff;font-weight:normal;}
        #title .ctl-col i{opacity:.5;font-style:normal;font-size:.85em;}
        #title .veil{position:fixed;inset:0;background:#05050a;opacity:0;transition:opacity .42s;pointer-events:none;
          display:grid;place-items:center;}
        #title .veil.show{opacity:1;}
        #title .veil span{font-size:clamp(11px,1.5vw,15px);letter-spacing:.3em;color:#7ef0ff;}
      `;
      document.head.appendChild(s);
    }
    const root = document.createElement('div');
    root.id = 'title';
    root.innerHTML = `
      <div class="head"><div class="name">REPENTANCE</div>
      <div class="tag">FAIL · RETURN IN GRACE · GO DEEPER</div></div>
      <div class="menu"></div>
      <div class="credit">an art project · the crossroads</div>
      <div class="veil"><span>RETURNING…</span></div>`;
    const menu = root.querySelector('.menu') as HTMLDivElement;
    this.options.forEach((_, i) => {
      const d = document.createElement('div');
      d.className = 'opt';
      d.addEventListener('pointerenter', () => this.move(i));
      d.addEventListener('click', () => {
        this.move(i);
        this.choose();
      });
      menu.appendChild(d);
      this.items.push(d);
    });
    document.body.appendChild(root);
    this.root = root;
    this.refresh();
  }

  private unmountDom(): void {
    this.root?.remove();
    this.root = undefined;
  }

  private refresh(): void {
    this.items.forEach((d, i) => {
      d.textContent = this.options[i].label();
      d.classList.toggle('on', i === this.index);
    });
  }

  private move(i: number): void {
    const n = this.options.length;
    const ni = ((i % n) + n) % n;
    if (ni === this.index) return;
    this.index = ni;
    this.sfx.uiMove();
    this.refresh();
  }

  private choose(): void {
    if (this.starting) return;
    this.sfx.uiSelect();
    this.options[this.index].act();
  }

  private toggleSound(): void {
    this.sfx.toggleMute();
    this.refresh();
  }

  /** The CONTROLS sheet — keyboard + gamepad bindings, PC-platformer style. */
  private toggleControls(): void {
    const existing = this.root?.querySelector('.controls');
    if (existing) {
      existing.remove();
      return;
    }
    const d = document.createElement('div');
    d.className = 'controls';
    d.innerHTML = `
      <div class="ctl-col"><div class="ctl-h">KEYBOARD</div>
        <div>MOVE <b>← → / A D</b></div>
        <div>JUMP <b>SPACE / Z</b> <i>(hold = higher)</i></div>
        <div>DODGE <b>SHIFT</b></div>
        <div>ATTACK <b>J / X</b></div>
        <div>NOVA <b>L / C</b></div>
        <div>DOORS <b>↑ / W</b> · MAP <b>M</b></div>
      </div>
      <div class="ctl-col"><div class="ctl-h">GAMEPAD</div>
        <div>MOVE <b>STICK / D-PAD</b></div>
        <div>JUMP <b>A</b></div>
        <div>DODGE <b>B / RB</b></div>
        <div>ATTACK <b>X</b></div>
        <div>NOVA <b>Y / LB</b></div>
      </div>`;
    d.addEventListener('click', () => d.remove());
    this.root?.appendChild(d);
  }

  /** Open the in-engine level editor (the same dev-kit as `?edit`), reachable from
   *  the menu. The editor's own "← MENU" button returns here. */
  private openEditor(): void {
    if (this.starting) return;
    this.registry.set('editRoom', START_ROOM);
    this.scene.start('EditorScene');
  }

  private begin(): void {
    if (this.starting) return;
    this.starting = true;
    new RunState(this.registry).reset(START_ROOM); // a new run (permanent graces/moves kept)
    this.sfx.startMusic();
    this.root?.querySelector('.veil')?.classList.add('show');
    // Every journey begins at the Place of Return — the hub owns the descent.
    this.time.delayedCall(900, () => this.scene.start('HubScene', {}));
  }

  update(_time: number, delta: number): void {
    // Slow drift gives the backdrop a little life.
    this.drift += delta * 0.012;
    const cam = this.cameras.main;
    cam.scrollX = this.drift;
    cam.scrollY = Math.sin(this.drift * 0.01) * 10;
    this.parallax.update(cam, _time);
  }
}
