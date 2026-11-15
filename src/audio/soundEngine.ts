/**
 * Procedural Web Audio synthesizer for The Last Footprint.
 * Generates an Interstellar-inspired warm harmonic pad, subtle cosmic radio noise,
 * and interactive carrier-signal lock audio with zero external audio assets.
 */
class SpaceAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private staticGain: GainNode | null = null;
  private carrierGain: GainNode | null = null;
  private carrierOsc: OscillatorNode | null = null;
  private isMuted = true;
  private initialized = false;

  public init(): void {
    if (this.initialized) return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    this.masterGain = master;

    // 1. Subtle Interstellar-inspired organ/pad drone (D1, A1, E2)
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 260;
    droneFilter.Q.value = 0.7;

    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.22;
    droneFilter.connect(droneGain);
    droneGain.connect(master);
    this.droneGain = droneGain;

    const freqs = [55, 82.41, 110.0]; // A1, E2, A2 subtle fifths
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.value = f;

      const oscGain = ctx.createGain();
      oscGain.gain.value = idx === 0 ? 0.45 : 0.16;
      osc.connect(oscGain);
      oscGain.connect(droneFilter);
      osc.start();
    });

    // Slow breathing LFO on drone filter cutoff
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 75;
    lfo.connect(lfoGain);
    lfoGain.connect(droneFilter.frequency);
    lfo.start();

    // 2. Faint cosmic radio static (bandpass noise)
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      output[i] = (b0 + b1 + white * 0.04) * 0.5;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1150;
    bandpass.Q.value = 1.4;

    const staticGain = ctx.createGain();
    staticGain.gain.value = 0.045;
    noiseSource.connect(bandpass);
    bandpass.connect(staticGain);
    staticGain.connect(master);
    noiseSource.start();
    this.staticGain = staticGain;

    // 3. Narrowband carrier tone for the Signal Tuner
    const carrierOsc = ctx.createOscillator();
    carrierOsc.type = 'sine';
    carrierOsc.frequency.value = 528;
    const carrierGain = ctx.createGain();
    carrierGain.gain.value = 0;
    carrierOsc.connect(carrierGain);
    carrierGain.connect(master);
    carrierOsc.start();
    this.carrierOsc = carrierOsc;
    this.carrierGain = carrierGain;

    this.initialized = true;
  }

  public setMuted(muted: boolean): boolean {
    this.isMuted = muted;
    if (!muted && !this.initialized) {
      this.init();
    }
    if (this.ctx && this.masterGain) {
      if (this.ctx.state === 'suspended' && !muted) {
        this.ctx.resume().catch(() => {});
      }
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.42, now, 0.35);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Modulates static & carrier pitch during Signal Tuner interaction.
   * proximity: 0 (off-frequency) -> 1 (locked onto carrier)
   */
  public setSignalTuning(active: boolean, proximity: number): void {
    if (!this.ctx || !this.staticGain || !this.carrierGain || !this.carrierOsc) return;
    const now = this.ctx.currentTime;
    if (!active) {
      this.carrierGain.gain.setTargetAtTime(0, now, 0.15);
      this.staticGain.gain.setTargetAtTime(0.04, now, 0.2);
      if (this.droneGain) this.droneGain.gain.setTargetAtTime(0.22, now, 0.25);
      return;
    }

    const clamped = Math.max(0, Math.min(1, proximity));
    // Static dips as carrier locks in
    this.staticGain.gain.setTargetAtTime(0.095 * (1 - clamped * 0.72), now, 0.08);
    // Carrier frequency converges smoothly onto 440Hz harmonic
    this.carrierOsc.frequency.setTargetAtTime(370 + clamped * 70, now, 0.06);
    this.carrierGain.gain.setTargetAtTime(clamped > 0.15 ? clamped * 0.06 : 0, now, 0.08);
  }

  public playLockChime(): void {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.22);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.07, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.8);
  }

  public playRelayClick(): void {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.035);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playCautionBeep(): void {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(740, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.055, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playSuccessTone(): void {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    [440, 659.25].forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + idx * 0.14;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.06, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.65);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.7);
    });
  }
}

export const soundEngine = new SpaceAudioEngine();
