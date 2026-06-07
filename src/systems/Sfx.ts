/** Procedural SFX via Web Audio — zero audio files. Lazy AudioContext, resumed
 *  on first user gesture (browser autoplay policy). All sounds are a few lines. */
export class Sfx {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private muted = false;
  private musicTimer: number | null = null;
  private musicStep = 0;

  constructor() {
    // Resume on the first gesture (Sfx may be constructed before any input).
    const resume = () => this.ensure();
    window.addEventListener('pointerdown', resume, { once: false });
    window.addEventListener('keydown', resume, { once: false });
  }

  private ensure(): AudioContext | null {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  setMuted(m: boolean): void {
    this.muted = m;
  }

  private tone(
    freq: number,
    dur: number,
    type: OscillatorType = 'square',
    vol = 0.3,
    slideTo?: number,
  ): void {
    const ctx = this.ensure();
    if (!ctx || this.muted) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noise(dur: number, vol = 0.25, hp = 600): void {
    const ctx = this.ensure();
    if (!ctx || this.muted) return;
    const t = ctx.currentTime;
    const frames = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'highpass';
    filt.frequency.value = hp;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filt).connect(g).connect(this.master);
    src.start(t);
  }

  // --- the vocabulary ---------------------------------------------------
  jump(): void {
    this.tone(280, 0.16, 'square', 0.22, 520);
  }
  doubleJump(): void {
    this.tone(420, 0.16, 'triangle', 0.2, 760);
  }
  dash(): void {
    this.noise(0.16, 0.22, 900);
    this.tone(620, 0.14, 'sawtooth', 0.12, 240);
  }
  slash(): void {
    this.noise(0.1, 0.18, 1800);
    this.tone(880, 0.08, 'triangle', 0.12, 1400);
  }
  hit(): void {
    this.tone(180, 0.12, 'square', 0.28, 90);
    this.noise(0.08, 0.2, 500);
  }
  enemyDie(): void {
    this.tone(140, 0.32, 'sawtooth', 0.26, 50);
    this.noise(0.28, 0.2, 300);
  }
  hurt(): void {
    this.tone(220, 0.22, 'sawtooth', 0.3, 110);
  }
  land(): void {
    this.noise(0.06, 0.12, 400);
  }
  death(): void {
    this.tone(200, 0.7, 'sawtooth', 0.3, 40);
  }
  /** The renewal chime — bright, ascending, hopeful. */
  grace(): void {
    const notes = [523, 659, 784, 1047]; // C E G C — major, rising
    notes.forEach((n, i) => setTimeout(() => this.tone(n, 0.5, 'triangle', 0.22), i * 90));
  }

  // --- enemy vocabulary -------------------------------------------------
  /** Heavy enemy winding up a committed strike. */
  telegraph(): void {
    this.tone(150, 0.26, 'sawtooth', 0.16, 110);
  }
  /** Heavy enemy's strike landing. */
  slam(): void {
    this.tone(90, 0.2, 'square', 0.3, 50);
    this.noise(0.12, 0.22, 300);
  }
  /** Shame Spark firing a mote. */
  shoot(): void {
    this.tone(900, 0.12, 'sawtooth', 0.12, 1500);
    this.noise(0.06, 0.1, 2000);
  }
  /** A heavy armored footfall — deep, short, with a dusty thud. */
  stomp(): void {
    this.tone(58, 0.16, 'square', 0.34, 28);
    this.noise(0.1, 0.16, 200);
  }
  /** The Warden's intro roar — deep, dread. */
  roar(): void {
    this.tone(70, 0.75, 'sawtooth', 0.34, 38);
    this.tone(46, 0.95, 'square', 0.18, 28);
    this.noise(0.5, 0.18, 180);
  }

  // --- ambient music ----------------------------------------------------
  /** A sparse, low procedural drone — somber but not hopeless. Idempotent. */
  startMusic(): void {
    if (this.musicTimer != null) return;
    const chords = [
      [110, 165], // A2 + E3
      [98, 147], // G2 + D3
      [131, 196], // C3 + G3
      [87, 131], // F2 + C3
    ];
    const motes = [392, 440, 330, 294];
    const tick = (): void => {
      if (this.muted) return;
      const c = chords[this.musicStep % chords.length];
      c.forEach((f) => this.tone(f, 3.4, 'sine', 0.05)); // soft sustained fifth
      if (this.musicStep % 2 === 1) this.tone(motes[this.musicStep % motes.length], 1.6, 'triangle', 0.03);
      this.musicStep++;
    };
    tick();
    this.musicTimer = window.setInterval(tick, 3200);
  }
  stopMusic(): void {
    if (this.musicTimer != null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

// Single shared instance: the AudioContext + gesture listeners must persist
// across scene.restart (a new Sfx per room would leak contexts + music timers).
let _instance: Sfx | null = null;
export function getSfx(): Sfx {
  return (_instance ??= new Sfx());
}
