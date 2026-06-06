/** Procedural SFX via Web Audio — zero audio files. Lazy AudioContext, resumed
 *  on first user gesture (browser autoplay policy). All sounds are a few lines. */
export class Sfx {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private muted = false;

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
}
