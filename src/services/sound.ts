// Professional Web Audio Synthesizer for Color Prediction Game
// Zero-latency, zero-dependency, works completely offline and without external MP3 assets

class SoundService {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private listeners: Set<(enabled: boolean) => void> = new Set();
  private initialized: boolean = false;

  constructor() {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('app_sound_enabled') : null;
      this.enabled = stored !== null ? stored === 'true' : true;
    } catch {
      this.enabled = true;
    }

    // Unlock on first user gesture
    if (typeof window !== 'undefined') {
      const unlock = () => {
        try {
          this.initContext();
        } catch {}
        window.removeEventListener('click', unlock);
        window.removeEventListener('touchstart', unlock);
        window.removeEventListener('keydown', unlock);
      };
      window.addEventListener('click', unlock, { once: true, passive: true });
      window.addEventListener('touchstart', unlock, { once: true, passive: true });
      window.addEventListener('keydown', unlock, { once: true, passive: true });
    }
  }

  private initContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
          this.initialized = true;
        }
      } catch (e) {
        console.warn('AudioContext not supported or restricted in this environment:', e);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        this.ctx.resume().catch(() => {});
      } catch {}
    }
    return this.ctx;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean): void {
    this.enabled = val;
    try {
      localStorage.setItem('app_sound_enabled', String(val));
    } catch {}
    this.listeners.forEach((fn) => fn(val));
  }

  public toggle(): boolean {
    const next = !this.enabled;
    this.setEnabled(next);
    if (next) {
      this.playBeep(660, 0.08, 'sine', 0.15);
    }
    return next;
  }

  public subscribe(callback: (enabled: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Base tone synthesizer with smooth gain envelope
  private playBeep(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.2,
    delay: number = 0
  ) {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const startTime = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  /**
   * Subtle tick for second-by-second countdown
   */
  public playTick() {
    if (!this.enabled) return;
    this.playBeep(1200, 0.03, 'sine', 0.04);
  }

  /**
   * Countdown warning beep for final 5 seconds
   */
  public playCountdownBeep(secondsLeft: number) {
    if (!this.enabled) return;

    if (secondsLeft >= 1 && secondsLeft <= 5) {
      // High alert beep that raises in pitch as time runs out
      const freqs: Record<number, number> = {
        5: 750,
        4: 820,
        3: 880,
        2: 960,
        1: 1080,
      };
      const freq = freqs[secondsLeft] || 880;
      this.playBeep(freq, 0.12, 'sine', 0.28);
    } else if (secondsLeft === 0) {
      // Locking / Settlement double chime
      this.playBeep(587.33, 0.14, 'triangle', 0.25, 0);
      this.playBeep(880, 0.25, 'triangle', 0.28, 0.1);
    }
  }

  /**
   * Celebratory multi-tone winning fanfare
   */
  public playWin() {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    // Fast cheerful ascending fanfare arpeggio: C5 -> E5 -> G5 -> C6 -> E6
    const notes = [
      { f: 523.25, t: 0.0, d: 0.1, v: 0.22 },
      { f: 659.25, t: 0.09, d: 0.1, v: 0.24 },
      { f: 783.99, t: 0.18, d: 0.12, v: 0.26 },
      { f: 1046.5, t: 0.28, d: 0.35, v: 0.3 },
      { f: 1318.51, t: 0.45, d: 0.45, v: 0.25 },
    ];

    notes.forEach((n) => {
      this.playBeep(n.f, n.d, 'triangle', n.v, n.t);
    });
  }

  /**
   * Gentle descending tone for loss
   */
  public playLoss() {
    if (!this.enabled) return;
    // Two gentle descending notes: E4 -> C4
    this.playBeep(329.63, 0.18, 'sine', 0.2, 0);
    this.playBeep(261.63, 0.35, 'sine', 0.22, 0.15);
  }

  /**
   * Coin / Bet placed sound effect
   */
  public playBetPlaced() {
    if (!this.enabled) return;
    this.playBeep(987.77, 0.08, 'triangle', 0.2, 0);
    this.playBeep(1318.51, 0.15, 'triangle', 0.22, 0.06);
  }

  /**
   * Selection / chip click sound
   */
  public playChipSelect() {
    if (!this.enabled) return;
    this.playBeep(800, 0.04, 'sine', 0.12);
  }
}

export const sound = new SoundService();
