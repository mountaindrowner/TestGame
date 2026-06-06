import Phaser from 'phaser';
import type { Action, InputManager } from './InputManager';

/** On-screen touch controls for mobile. A DOM overlay (crisp at device
 *  resolution, real multitouch) that feeds the same virtual-action API the
 *  keyboard uses via InputManager.setVirtual(). Only mounts on touch devices;
 *  on desktop (fine pointer) it does nothing. */
export class TouchControls {
  private root?: HTMLDivElement;

  constructor(scene: Phaser.Scene, private input: InputManager) {
    if (!TouchControls.isTouch()) return;
    this.mount();
    // Tear down with the scene so a restart never stacks duplicate overlays.
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
    scene.events.once(Phaser.Scenes.Events.DESTROY, () => this.destroy());
  }

  private static isTouch(): boolean {
    return (
      window.matchMedia?.('(pointer: coarse)').matches ||
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0
    );
  }

  private mount(): void {
    // Avoid a second overlay if one somehow lingers.
    document.getElementById('touch-controls')?.remove();

    const style = document.createElement('style');
    style.textContent = `
      #touch-controls {
        position: fixed; inset: 0; z-index: 9999; pointer-events: none;
        font-family: ui-monospace, monospace; -webkit-user-select: none; user-select: none;
        touch-action: none;
      }
      #touch-controls .pad {
        position: absolute; bottom: calc(env(safe-area-inset-bottom, 0px) + 14px);
        display: flex; gap: 14px; align-items: flex-end;
      }
      #touch-controls .left { left: calc(env(safe-area-inset-left, 0px) + 14px); }
      #touch-controls .right { right: calc(env(safe-area-inset-right, 0px) + 14px); }
      #touch-controls button {
        pointer-events: auto; touch-action: none; -webkit-tap-highlight-color: transparent;
        appearance: none; border: 1.5px solid rgba(126,240,255,0.55);
        background: rgba(10,16,24,0.42); color: #cdeffb;
        border-radius: 999px; display: grid; place-items: center;
        font-weight: 700; letter-spacing: 0.05em; backdrop-filter: blur(2px);
        transition: background 0.06s, transform 0.06s;
      }
      #touch-controls button.move { width: 62px; height: 62px; font-size: 26px; }
      #touch-controls button.act  { width: 60px; height: 60px; font-size: 13px; }
      #touch-controls button.act.big { width: 74px; height: 74px; font-size: 15px; }
      #touch-controls button.pressed {
        background: rgba(126,240,255,0.30); color: #ffffff; transform: scale(0.94);
        border-color: rgba(126,240,255,0.9);
      }
    `;
    document.head.appendChild(style);

    const root = document.createElement('div');
    root.id = 'touch-controls';

    const left = document.createElement('div');
    left.className = 'pad left';
    left.appendChild(this.button('◀', 'left', 'move'));
    left.appendChild(this.button('▶', 'right', 'move'));

    const right = document.createElement('div');
    right.className = 'pad right';
    right.appendChild(this.button('DASH', 'dash', 'act'));
    right.appendChild(this.button('ATK', 'attack', 'act'));
    right.appendChild(this.button('JUMP', 'jump', 'act big'));

    root.appendChild(left);
    root.appendChild(right);
    document.body.appendChild(root);
    this.root = root;
  }

  /** A press-and-hold button bound to a virtual action. Pointer capture keeps
   *  the hold alive even if the finger slides off, and survives multitouch. */
  private button(label: string, action: Action, cls: string): HTMLButtonElement {
    const b = document.createElement('button');
    b.className = cls;
    b.textContent = label;
    b.setAttribute('aria-label', action);

    const set = (on: boolean) => {
      this.input.setVirtual(action, on);
      b.classList.toggle('pressed', on);
    };
    b.addEventListener(
      'pointerdown',
      (e) => {
        e.preventDefault();
        b.setPointerCapture(e.pointerId);
        set(true);
      },
      { passive: false }
    );
    const release = (e: PointerEvent) => {
      e.preventDefault();
      set(false);
    };
    b.addEventListener('pointerup', release, { passive: false });
    b.addEventListener('pointercancel', release, { passive: false });
    return b;
  }

  destroy(): void {
    this.root?.remove();
    this.root = undefined;
  }
}
