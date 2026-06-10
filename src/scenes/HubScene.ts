import Phaser from 'phaser';
import { ParallaxBackground } from '../systems/ParallaxBackground';
import { ParticleSystem } from '../systems/ParticleSystem';
import { getSfx } from '../systems/Sfx';
import { RunState } from '../data/RunState';
import { START_ROOM } from '../data/levelGraph';
import { GRACES, deriveUpgrades } from '../data/upgrades';
import { Palette } from '../data/palette';
import { Assets } from '../data/assetManifest';

/** [HUB-01] THE PLACE OF RETURN — the respawn hub (DESIGN.md). Every run begins
 *  and every death ends here: the light-beam reappearance, the cloaked figure
 *  resting in the beam, the ALTAR for kindling persistent graces, and DESCEND to
 *  walk the route again. Death is not a checkpoint reload — it's a return: the
 *  run restarts, but everything permanent (graces, pacts, unlocked moves) and the
 *  souls you carried are kept. "Grace refuses to let the story end there." */
export class HubScene extends Phaser.Scene {
  private parallax!: ParallaxBackground;
  private particles!: ParticleSystem;
  private sfx = getSfx();
  private run!: RunState;
  private root!: HTMLDivElement;
  private drift = 0;
  private leaving = false;

  constructor() {
    super('HubScene');
  }

  create(data: { died?: boolean }): void {
    this.leaving = false;
    this.run = new RunState(this.registry);
    this.run.ensure(START_ROOM);
    this.scene.stop('UIScene');
    document.getElementById('boot')?.remove();

    this.parallax = new ParallaxBackground(this, 'depths');
    this.particles = new ParticleSystem(this);
    this.particles.startAmbient(this.scale.width * 2, this.scale.height * 2);

    this.addBeamAndFigure(!!data?.died);
    this.cameras.main.fadeIn(data?.died ? 700 : 450, 0, 0, 0);

    this.injectStyle();
    document.getElementById('hub')?.remove();
    this.root = document.createElement('div');
    this.root.id = 'hub';
    document.body.appendChild(this.root);
    this.render(!!data?.died);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.root.remove());
  }

  /** The light-beam reappearance: a standing pillar of grace, the figure resting
   *  inside it. Arriving from a death, the beam flares bright and settles. */
  private addBeamAndFigure(died: boolean): void {
    const x = Math.round(this.scale.width * 0.16);
    const baseY = Math.round(this.scale.height * 0.88);
    const mk = (w: number, tint: number, alpha: number, depth: number) =>
      this.add
        .rectangle(x, baseY, w, baseY, tint, alpha)
        .setOrigin(0.5, 1)
        .setScrollFactor(0)
        .setDepth(depth)
        .setBlendMode(Phaser.BlendModes.ADD);
    const beam = mk(22, Palette.grace, 0.16, 7);
    const core = mk(7, Palette.bloom, 0.3, 8);
    this.tweens.add({ targets: beam, alpha: 0.24, scaleX: 1.18, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: core, alpha: 0.42, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // a soft pool where the beam lands
    this.add
      .image(x, baseY, Assets.dot.key)
      .setScale(14, 3)
      .setTint(Palette.grace)
      .setAlpha(0.22)
      .setScrollFactor(0)
      .setDepth(7)
      .setBlendMode(Phaser.BlendModes.ADD);
    // the cloaked figure, resting in the light
    const figure = this.add.sprite(x, baseY + 1, Assets.player.key).setOrigin(0.5, 1).setScrollFactor(0).setDepth(9).setScale(0.68);
    if (this.anims.exists('player-rest')) figure.play('player-rest');
    if (died) {
      // the arrival flare — grace setting you down
      figure.setAlpha(0);
      this.tweens.add({ targets: figure, alpha: 1, duration: 900, delay: 350 });
      const flare = mk(34, Palette.bloom, 0.5, 10);
      this.tweens.add({ targets: flare, alpha: 0, scaleX: 0.2, duration: 1100, ease: 'Quad.easeOut', onComplete: () => flare.destroy() });
      this.time.delayedCall(120, () => this.sfx.grace());
      this.particles.graceMotes(x, baseY - 20, 30);
    }
  }

  private render(died: boolean): void {
    const g = this.run.graces;
    const dots = (lvl: number, max: number) =>
      Array.from({ length: max }, (_, i) => `<span class="dot ${i < lvl ? 'on' : ''}"></span>`).join('');
    const graceRows = GRACES.map((def) => {
      const lvl = (g as Record<string, number>)[def.id];
      const maxed = lvl >= def.max;
      const cost = def.cost(lvl);
      const afford = this.run.souls >= cost;
      return `<div class="row">
        <div class="rmain"><div class="rname">${def.name} <span class="rdots">${dots(lvl, def.max)}</span></div>
          <div class="rblurb">${maxed ? 'fully kindled' : def.blurb(lvl)}</div></div>
        ${maxed ? '<div class="rmax">MAX</div>' : `<button class="buy ${afford ? '' : 'no'}" data-grace="${def.id}" data-cost="${cost}">${cost}◇</button>`}
      </div>`;
    }).join('');

    this.root.innerHTML = `
      <div class="panel">
        <div class="title">THE PLACE OF RETURN</div>
        <div class="sub">${died ? 'you fell. grace carried you home — go again.' : 'every journey begins, and begins again, here.'}</div>
        <div class="souls"><span class="gem"></span><span class="num">${this.run.souls}</span></div>
        <div class="col"><div class="h">THE ALTAR · kindle graces (kept forever)</div>${graceRows}</div>
        <button class="descend">DESCEND ▼</button>
        <div class="foot">the route is walked anew each return · what the altar gives is never taken back</div>
      </div>`;

    this.root.querySelectorAll<HTMLButtonElement>('button.buy').forEach((b) => b.addEventListener('click', () => this.onBuy(b)));
    this.root.querySelector<HTMLButtonElement>('button.descend')!.addEventListener('click', () => this.descend());
  }

  private onBuy(b: HTMLButtonElement): void {
    const cost = Number(b.dataset.cost);
    const grace = b.dataset.grace;
    if (!grace || this.run.souls < cost) {
      this.sfx.uiMove();
      return;
    }
    this.run.souls -= cost;
    (this.run.graces as Record<string, number>)[grace] += 1;
    this.sfx.uiSelect();
    this.render(false);
  }

  private descend(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.sfx.uiSelect();
    // A new descent: run-scoped state is already fresh (reset happened on death/
    // completion); renew the body to its full kindled measure.
    this.run.maxHealth = deriveUpgrades(this.run.graces, this.run.pacts).maxHealth;
    this.run.health = this.run.maxHealth;
    this.cameras.main.fadeOut(420, 0, 0, 0);
    this.time.delayedCall(440, () => this.scene.start('GameScene', { roomId: START_ROOM }));
  }

  update(_t: number, delta: number): void {
    this.drift += delta * 0.008;
    const cam = this.cameras.main;
    cam.scrollX = this.drift;
    cam.scrollY = Math.sin(this.drift * 0.01) * 6;
    this.parallax.update(cam, _t);
  }

  private injectStyle(): void {
    if (document.getElementById('hub-style')) return;
    const s = document.createElement('style');
    s.id = 'hub-style';
    s.textContent = `
      #hub{position:fixed;inset:0;z-index:70;display:grid;place-items:center;
        font-family:'Dash Horizon',ui-monospace,monospace;color:#eaf7ff;--cyan:#7ef0ff;}
      #hub .panel{width:min(480px,90vw);margin-left:14vw;background:rgba(8,12,20,.55);
        border:1px solid rgba(126,240,255,.22);border-radius:14px;padding:20px 24px;
        box-shadow:0 10px 40px rgba(0,0,0,.5);backdrop-filter:blur(2px);text-align:center;}
      #hub .title{font-size:20px;letter-spacing:.3em;color:var(--cyan);text-shadow:0 0 16px rgba(126,240,255,.5);}
      #hub .sub{font-size:10px;letter-spacing:.14em;opacity:.65;margin:6px 0 10px;}
      #hub .souls{display:flex;justify-content:center;align-items:center;gap:8px;margin-bottom:12px;font-size:16px;}
      #hub .gem{width:12px;height:12px;border-radius:2px;transform:rotate(45deg);
        background:linear-gradient(135deg,#cdf3ff,#2f78d2);box-shadow:0 0 7px rgba(126,240,255,.75);}
      #hub .col{text-align:left;}
      #hub .h{font-size:10px;letter-spacing:.18em;color:var(--cyan);opacity:.85;margin-bottom:8px;
        border-bottom:1px solid rgba(126,240,255,.15);padding-bottom:4px;}
      #hub .row{display:flex;align-items:center;gap:8px;margin:7px 0;}
      #hub .rmain{flex:1;min-width:0;}
      #hub .rname{font-size:12px;letter-spacing:.08em;display:flex;align-items:center;gap:6px;}
      #hub .rblurb{font-size:9.5px;opacity:.62;letter-spacing:.04em;margin-top:1px;}
      #hub .rdots{display:inline-flex;gap:3px;}
      #hub .dot{width:5px;height:5px;border-radius:50%;background:rgba(126,240,255,.2);}
      #hub .dot.on{background:var(--cyan);box-shadow:0 0 5px rgba(126,240,255,.7);}
      #hub .rmax{font-size:10px;letter-spacing:.1em;color:#9fe6c0;opacity:.8;}
      #hub button.buy{appearance:none;border:1px solid rgba(126,240,255,.4);background:rgba(10,16,24,.6);
        color:#cdeffb;border-radius:8px;padding:5px 9px;font:600 11px ui-monospace,monospace;cursor:pointer;white-space:nowrap;}
      #hub button.buy:hover{background:rgba(126,240,255,.18);}
      #hub button.buy.no{opacity:.35;border-color:rgba(255,120,140,.35);cursor:not-allowed;}
      #hub .descend{margin-top:16px;appearance:none;border:1.5px solid rgba(126,240,255,.6);
        background:rgba(10,16,24,.5);color:#eaf7ff;border-radius:999px;padding:10px 28px;
        font:600 13px ui-monospace,monospace;letter-spacing:.2em;cursor:pointer;}
      #hub .descend:hover{background:rgba(126,240,255,.22);}
      #hub .foot{font-size:8.5px;opacity:.4;letter-spacing:.08em;margin-top:12px;}
      @media (max-width: 760px){ #hub .panel{margin-left:0;} }
    `;
    document.head.appendChild(s);
  }
}
