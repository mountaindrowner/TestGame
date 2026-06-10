import Phaser from 'phaser';
import { ParallaxBackground } from '../systems/ParallaxBackground';
import { ParticleSystem } from '../systems/ParticleSystem';
import { getSfx } from '../systems/Sfx';
import { RunState } from '../data/RunState';
import { GRACES, PACTS, PACT_CAP, deriveUpgrades } from '../data/upgrades';

/** The interim SANCTUARY between areas (you ride the lift in). Not a shop of greed
 *  but a place of grace: at the ALTAR you offer gathered souls to kindle persistent
 *  graces; the STRANGER grants a few one-time pacts (lifetime-capped). Then DEPART
 *  into the next area. Crisp DOM UI over a drifting backdrop. */
export class SanctuaryScene extends Phaser.Scene {
  private parallax!: ParallaxBackground;
  private sfx = getSfx();
  private run!: RunState;
  private root!: HTMLDivElement;
  private next = 'first-fall';
  private entry?: string;
  private drift = 0;

  constructor() {
    super('SanctuaryScene');
  }

  create(data: { next?: string; entry?: string }): void {
    this.next = data?.next ?? 'first-fall';
    this.entry = data?.entry;
    this.run = new RunState(this.registry);
    this.scene.stop('UIScene'); // hide the in-game HUD while here
    document.getElementById('boot')?.remove();

    this.parallax = new ParallaxBackground(this, 'depths');
    new ParticleSystem(this).startAmbient(this.scale.width * 2, this.scale.height * 2);
    this.addStranger();
    this.cameras.main.fadeIn(450, 0, 0, 0);

    this.injectStyle();
    document.getElementById('sanctuary')?.remove();
    this.root = document.createElement('div');
    this.root.id = 'sanctuary';
    document.body.appendChild(this.root);
    this.render();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.root.remove());
  }

  private souls(): number {
    return this.run.souls;
  }

  /** The pact-giver in the flesh: a hooded figure who stands to one side of the
   *  altar panel, breathing quietly. Screen-fixed (scrollFactor 0) so the drifting
   *  backdrop moves behind it; a soft violet aura marks its presence. */
  private addStranger(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const sx = Math.round(w * 0.1); // clear of the centred altar panel
    const sy = Math.round(h * 0.86);
    // a soft violet backlight makes the dark figure read against the dark backdrop
    const halo = this.add
      .ellipse(sx, sy - 22, 64, 84, 0x6a4cff, 0.14)
      .setScrollFactor(0)
      .setDepth(7)
      .setBlendMode(Phaser.BlendModes.ADD);
    const glow = this.add
      .ellipse(sx, sy - 20, 34, 58, 0x9a7cff, 0.22)
      .setScrollFactor(0)
      .setDepth(8)
      .setBlendMode(Phaser.BlendModes.ADD);
    const s = this.add
      .sprite(sx, sy, 'stranger')
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(9)
      .setScale(1.5);
    if (this.anims.exists('stranger-idle')) s.play('stranger-idle');
    // a slow breath of the aura, in sympathy with the idle
    this.tweens.add({ targets: [halo, glow], scaleX: 1.08, scaleY: 1.04, alpha: '+=0.06', duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  private render(): void {
    const g = this.run.graces;
    const pacts = this.run.pacts;
    const dots = (lvl: number, max: number) =>
      Array.from({ length: max }, (_, i) => `<span class="dot ${i < lvl ? 'on' : ''}"></span>`).join('');

    const graceRows = GRACES.map((def) => {
      const lvl = (g as Record<string, number>)[def.id];
      const maxed = lvl >= def.max;
      const cost = def.cost(lvl);
      const afford = this.souls() >= cost;
      return `<div class="row">
        <div class="rmain"><div class="rname">${def.name} <span class="rdots">${dots(lvl, def.max)}</span></div>
          <div class="rblurb">${maxed ? 'fully kindled' : def.blurb(lvl)}</div></div>
        ${maxed ? '<div class="rmax">MAX</div>' : `<button class="buy ${afford ? '' : 'no'}" data-grace="${def.id}" data-cost="${cost}">${cost}◇</button>`}
      </div>`;
    }).join('');

    const full = pacts.length >= PACT_CAP;
    const offered = PACTS.filter((p) => !pacts.includes(p.id)).slice(0, 3);
    const pactRows = full
      ? `<div class="rblurb spent">The stranger has nothing more to give.</div>`
      : offered
          .map((p) => {
            const afford = this.souls() >= p.cost;
            return `<div class="row"><div class="rmain"><div class="rname">${p.name}</div><div class="rblurb">${p.blurb}</div></div>
            <button class="buy pact ${afford ? '' : 'no'}" data-pact="${p.id}" data-cost="${p.cost}">${p.cost}◇</button></div>`;
          })
          .join('');
    const taken = pacts.length ? `<div class="taken">kept: ${pacts.map((id) => PACTS.find((p) => p.id === id)?.name ?? id).join(' · ')}</div>` : '';

    this.root.innerHTML = `
      <div class="panel">
        <div class="title">THE SANCTUARY</div>
        <div class="sub">rest a moment · offer what you carried out of the dark</div>
        <div class="souls"><span class="gem"></span><span class="num">${this.souls()}</span></div>
        <div class="cols">
          <div class="col"><div class="h">THE ALTAR · graces</div>${graceRows}</div>
          <div class="col"><div class="h">THE STRANGER · pacts (${pacts.length}/${PACT_CAP})</div>${pactRows}${taken}</div>
        </div>
        <button class="depart">DEPART ▶</button>
      </div>`;

    this.root.querySelectorAll<HTMLButtonElement>('button.buy').forEach((b) =>
      b.addEventListener('click', () => this.onBuy(b)),
    );
    this.root.querySelector<HTMLButtonElement>('button.depart')!.addEventListener('click', () => this.depart());
  }

  private onBuy(b: HTMLButtonElement): void {
    const cost = Number(b.dataset.cost);
    if (this.souls() < cost) {
      this.sfx.uiMove();
      return;
    }
    const grace = b.dataset.grace;
    const pact = b.dataset.pact;
    if (grace) {
      this.run.souls -= cost;
      (this.run.graces as Record<string, number>)[grace] += 1;
    } else if (pact) {
      if (this.run.pacts.length >= PACT_CAP) return;
      this.run.souls -= cost;
      this.run.pacts.push(pact);
    } else return;
    this.sfx.uiSelect();
    this.render();
  }

  private depart(): void {
    this.sfx.uiSelect();
    // Leaving the Sanctuary restores you fully (grace renews) at your new max.
    this.run.maxHealth = deriveUpgrades(this.run.graces, this.run.pacts).maxHealth;
    this.run.health = this.run.maxHealth;
    this.cameras.main.fadeOut(360, 0, 0, 0);
    this.time.delayedCall(380, () => this.scene.start('GameScene', { roomId: this.next, entryDoorId: this.entry }));
  }

  update(_t: number, delta: number): void {
    this.drift += delta * 0.01;
    const cam = this.cameras.main;
    cam.scrollX = this.drift;
    cam.scrollY = Math.sin(this.drift * 0.01) * 8;
    this.parallax.update(cam, _t);
  }

  private injectStyle(): void {
    if (document.getElementById('sanc-style')) return;
    const s = document.createElement('style');
    s.id = 'sanc-style';
    s.textContent = `
      #sanctuary{position:fixed;inset:0;z-index:70;display:grid;place-items:center;
        font-family:'Dash Horizon',ui-monospace,monospace;color:#eaf7ff;--cyan:#7ef0ff;}
      #sanctuary .panel{width:min(640px,92vw);background:rgba(8,12,20,.5);
        border:1px solid rgba(126,240,255,.22);border-radius:14px;padding:22px 26px;
        box-shadow:0 10px 40px rgba(0,0,0,.5);backdrop-filter:blur(2px);text-align:center;}
      #sanctuary .title{font-size:22px;letter-spacing:.34em;color:var(--cyan);text-shadow:0 0 16px rgba(126,240,255,.5);}
      #sanctuary .sub{font-size:10px;letter-spacing:.16em;opacity:.6;margin:6px 0 12px;}
      #sanctuary .souls{display:flex;justify-content:center;align-items:center;gap:8px;margin-bottom:16px;font-size:16px;}
      #sanctuary .gem{width:12px;height:12px;border-radius:2px;transform:rotate(45deg);
        background:linear-gradient(135deg,#cdf3ff,#2f78d2);box-shadow:0 0 7px rgba(126,240,255,.75);}
      #sanctuary .cols{display:flex;gap:16px;text-align:left;}
      #sanctuary .col{flex:1;min-width:0;}
      #sanctuary .h{font-size:10px;letter-spacing:.18em;color:var(--cyan);opacity:.85;margin-bottom:8px;border-bottom:1px solid rgba(126,240,255,.15);padding-bottom:4px;}
      #sanctuary .row{display:flex;align-items:center;gap:8px;margin:7px 0;}
      #sanctuary .rmain{flex:1;min-width:0;}
      #sanctuary .rname{font-size:12px;letter-spacing:.08em;display:flex;align-items:center;gap:6px;}
      #sanctuary .rblurb{font-size:9.5px;opacity:.62;letter-spacing:.04em;margin-top:1px;}
      #sanctuary .rblurb.spent{opacity:.5;font-style:italic;}
      #sanctuary .rdots{display:inline-flex;gap:3px;}
      #sanctuary .dot{width:5px;height:5px;border-radius:50%;background:rgba(126,240,255,.2);}
      #sanctuary .dot.on{background:var(--cyan);box-shadow:0 0 5px rgba(126,240,255,.7);}
      #sanctuary .rmax{font-size:10px;letter-spacing:.1em;color:#9fe6c0;opacity:.8;}
      #sanctuary button.buy{appearance:none;border:1px solid rgba(126,240,255,.4);background:rgba(10,16,24,.6);
        color:#cdeffb;border-radius:8px;padding:5px 9px;font:600 11px ui-monospace,monospace;cursor:pointer;white-space:nowrap;}
      #sanctuary button.buy:hover{background:rgba(126,240,255,.18);}
      #sanctuary button.buy.no{opacity:.35;border-color:rgba(255,120,140,.35);cursor:not-allowed;}
      #sanctuary button.pact{border-color:rgba(255,200,120,.5);color:#ffe2b8;}
      #sanctuary .taken{font-size:9px;opacity:.55;margin-top:8px;letter-spacing:.05em;}
      #sanctuary .depart{margin-top:18px;appearance:none;border:1.5px solid rgba(126,240,255,.6);
        background:rgba(10,16,24,.5);color:#eaf7ff;border-radius:999px;padding:10px 26px;
        font:600 13px ui-monospace,monospace;letter-spacing:.18em;cursor:pointer;}
      #sanctuary .depart:hover{background:rgba(126,240,255,.22);}
    `;
    document.head.appendChild(s);
  }
}
