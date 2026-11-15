/**
 * Minimal Web Audio API audio engine for The Last Footprint.
 * Features background ambient drone, destination mood crossfading,
 * synthesized sound effects, session mute memory, and visibility pausing.
 */
class SpaceAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  private droneGain: GainNode | null = null;
  private isMuted = false;
  private initialized = false;
  private currentMood: 'moon' | 'mars' | 'deep-space' = 'moon';

  constructor() {
    try {
      const saved = sessionStorage.getItem('last-footprint-muted');
      if (saved !== null) {
        this.isMuted = JSON.parse(saved);
      }
    } catch {
      // ignore
    }
  }

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

    if (!this.isMuted) {
      master.gain.setValueAtTime(0, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 3.0);
    }

    // Synthetic feedback delay network for synthetic 4s reverb
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.35;

    // Dark ambient drone: 3 detuned oscillators (55 Hz, 82.41 Hz, 110 Hz)
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 220;
    droneFilter.Q.value = 0.8;
    this.droneFilter = droneFilter;

    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.28;
    this.droneGain = droneGain;

    droneFilter.connect(droneGain);
    droneGain.connect(master);
    droneGain.connect(reverbGain);

    const freqs = [55.0, 82.41, 110.0];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.value = f;
      const oGain = ctx.createGain();
      oGain.gain.value = idx === 0 ? 0.42 : 0.18;
      osc.connect(oGain);
      oGain.connect(droneFilter);
      osc.start();
    });

    // Slow LFO (~0.05 Hz) on lowpass filter
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 55;
    lfo.connect(lfoGain);
    lfoGain.connect(droneFilter.frequency);
    lfo.start();

    // Periodic soft pad swell every 20-30 seconds
    const scheduleSwell = () => {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const swellDuration = 10;
      const targetGain = 0.45;
      droneGain.gain.setTargetAtTime(targetGain, now, 3.0);
      droneGain.gain.setTargetAtTime(0.28, now + swellDuration, 5.0);
      const nextTime = (20 + Math.random() * 10) * 1000;
      setTimeout(scheduleSwell, nextTime);
    };
    setTimeout(scheduleSwell, 15000);

    // Reverb feedback network
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.38;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.7;
    reverbGain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(master);

    // Pause audio when tab hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.ctx && this.masterGain) {
        this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4);
      } else if (!document.hidden && !this.isMuted && this.ctx && this.masterGain) {
        this.masterGain.gain.setTargetAtTime(0.35, this.ctx.currentTime, 1.0);
      }
    });

    this.initialized = true;
  }

  public setMood(mood: 'moon' | 'mars' | 'deep-space'): void {
    this.currentMood = mood;
    if (!this.ctx || !this.droneFilter) return;
    const now = this.ctx.currentTime;
    if (mood === 'moon') {
      this.droneFilter.frequency.setTargetAtTime(170, now, 1.5);
    } else if (mood === 'mars') {
      this.droneFilter.frequency.setTargetAtTime(310, now, 1.5);
    } else {
      this.droneFilter.frequency.setTargetAtTime(135, now, 2.0);
    }
  }

  public play(effect: 'hover' | 'select' | 'travel' | 'beat' | 'chime'): void {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    if (!this.initialized) this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    const now = this.ctx.currentTime;

    if (effect === 'hover') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.012, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.035);
    } else if (effect === 'select') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (effect === 'travel') {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) return;
      const bufferSize = this.ctx.sampleRate * 1.5;
      const buf = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(180, now);
      filter.frequency.exponentialRampToValueAtTime(1600, now + 0.75);
      filter.frequency.exponentialRampToValueAtTime(180, now + 1.5);
      filter.Q.value = 2.8;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      src.start(now);
      src.stop(now + 1.5);
    } else if (effect === 'beat') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(90, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (effect === 'chime') {
      [587.33, 880].forEach((f, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const start = now + idx * 0.18;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.07, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.9);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(start);
        osc.stop(start + 1.0);
      });
    }
  }

  public setMuted(muted: boolean): boolean {
    this.isMuted = muted;
    if (!muted && !this.initialized) {
      this.init();
    }
    try {
      sessionStorage.setItem('last-footprint-muted', JSON.stringify(muted));
    } catch {
      // ignore
    }
    if (this.ctx && this.masterGain) {
      if (this.ctx.state === 'suspended' && !muted) {
        this.ctx.resume().catch(() => {});
      }
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.35, now, 0.3);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Legacy compatibility helpers
  public setSignalTuning(active: boolean, proximity: number) {}
  public playLockChime() {
    this.play('chime');
  }
  public playRelayClick() {
    this.play('select');
  }
  public playCautionBeep() {
    this.play('beat');
  }
  public playSuccessTone() {
    this.play('chime');
  }
}

export const soundEngine = new SpaceAudioEngine();
export function useAudio() {
  return soundEngine;
}
