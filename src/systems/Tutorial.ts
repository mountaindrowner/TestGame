import Phaser from 'phaser';
import { InputManager } from './InputManager';

/** First-room onboarding. A small DOM legend (keyboard or touch, by device) that
 *  fades once the player has actually moved, jumped, dashed and attacked — so it
 *  teaches by doing, then gets out of the way. Mounts only in the opener. */
export class Tutorial {
  private root?: HTMLDivElement;
  private done = { move: false, jump: false, dash: false, attack: false };
  private dismissed = false;

  constructor(private scene: Phaser.Scene, private input: InputManager, active: boolean) {
    if (!active) return;
    this.mount();
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.tick, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
    scene.events.once(Phaser.Scenes.Events.DESTROY, () => this.destroy());
    // hard timeout so it never lingers
    scene.time.delayedCall(14000, () => this.dismiss());
  }

  private touch(): boolean {
    return (
      window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window || navigator.maxTouchPoints > 0
    );
  }

  private mount(): void {
    document.getElementById('tutorial')?.remove();
    const style = document.createElement('style');
    style.textContent = `
      #tutorial{position:fixed;left:50%;bottom:max(env(safe-area-inset-bottom,0px),12px);
        transform:translateX(-50%);z-index:9000;pointer-events:none;opacity:0;
        transition:opacity 0.5s;font-family:'Dash Horizon',ui-monospace,monospace;}
      #tutorial.show{opacity:0.82;}
      #tutorial .card{display:flex;gap:14px;padding:8px 14px;border-radius:10px;
        background:rgba(10,16,24,0.55);border:1px solid rgba(126,240,255,0.3);
        color:#cdeffb;font-size:11px;letter-spacing:0.06em;backdrop-filter:blur(2px);white-space:nowrap;}
      #tutorial b{color:#7ef0ff;font-weight:700;}
      #tutorial .x{opacity:0.45;}
    `;
    document.head.appendChild(style);
    const el = document.createElement('div');
    el.id = 'tutorial';
    const rows = this.touch()
      ? ['<b>◀ ▶</b> move', '<b>JUMP</b> (×2)', '<b>DASH</b> dodges', '<b>ATK</b> strike']
      : ['<b>A D</b> move', '<b>SPACE</b> jump ×2', '<b>SHIFT</b> dash', '<b>J/X</b> attack', '<b>↑</b> doors'];
    el.innerHTML = `<div class="card">${rows.map((r) => `<span class="r">${r}</span>`).join('')}</div>`;
    document.body.appendChild(el);
    this.root = el;
    requestAnimationFrame(() => el.classList.add('show'));
  }

  private tick(): void {
    if (this.dismissed || !this.root) return;
    if (this.input.axisX() !== 0) this.markDone('move');
    if (this.input.isDown('jump')) this.markDone('jump');
    if (this.input.isDown('dash')) this.markDone('dash');
    if (this.input.isDown('attack')) this.markDone('attack');
    if (this.done.move && this.done.jump && this.done.dash && this.done.attack) {
      this.scene.time.delayedCall(900, () => this.dismiss());
      this.dismissed = true; // schedule once
    }
  }

  private markDone(k: keyof typeof this.done): void {
    if (this.done[k]) return;
    this.done[k] = true;
    const span = this.root?.querySelectorAll('.r')[['move', 'jump', 'dash', 'attack'].indexOf(k)];
    span?.classList.add('x');
  }

  private dismiss(): void {
    if (!this.root) return;
    this.root.classList.remove('show');
    const el = this.root;
    this.scene.time.delayedCall(600, () => el.remove());
    this.root = undefined;
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.tick, this);
  }

  destroy(): void {
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.tick, this);
    this.root?.remove();
    this.root = undefined;
  }
}
