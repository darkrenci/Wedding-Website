// Web Audio API romantic melody generator & sound effects
// 100% self-contained, no external mp3 files that can fail or get blocked

class WeddingAudioPlayer {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private timerId: number | null = null;
  private currentStep: number = 0;

  // Romantic chord progression arpeggios (in F major / D minor, dreamy & gentle)
  // Frequencies for a soft celesta/harp sound
  private melodyNotes = [
    // Fmaj9
    349.23, 440.0, 523.25, 659.25, 523.25, 440.0,
    // C/E
    329.63, 392.0, 523.25, 659.25, 523.25, 392.0,
    // Dm7
    293.66, 349.23, 440.0, 523.25, 440.0, 349.23,
    // Bbmaj7
    233.08, 349.23, 440.0, 466.16, 440.0, 349.23,
    // F/A
    220.0, 349.23, 440.0, 523.25, 440.0, 349.23,
    // Gm7
    196.0, 293.66, 349.23, 440.0, 349.23, 293.66,
    // C7sus4 -> C7
    261.63, 349.23, 392.0, 523.25, 493.88, 392.0,
    // Fmaj7 resolution
    349.23, 440.0, 523.25, 698.46, 523.25, 440.0,
  ];

  private getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public playWaxSealCrack() {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // Audio autoplay restrictions or unsupported
    }
  }

  public playNote(freq: number, duration: number = 1.2) {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // Primary tone (warm sine/triangle)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      // Soft harmonic shimmer
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration);
      osc2.stop(now + duration);
    } catch {
      // ignore
    }
  }

  public toggleMusic(onStateChange?: (playing: boolean) => void): boolean {
    if (this.isPlaying) {
      this.stopMusic();
      if (onStateChange) onStateChange(false);
      return false;
    } else {
      this.startMusic();
      if (onStateChange) onStateChange(true);
      return true;
    }
  }

  public startMusic() {
    this.isPlaying = true;
    this.currentStep = 0;
    this.scheduleNextNote();
  }

  public stopMusic() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private scheduleNextNote = () => {
    if (!this.isPlaying) return;

    const freq = this.melodyNotes[this.currentStep % this.melodyNotes.length];
    this.playNote(freq, 1.4);

    this.currentStep++;
    // Tempo around 75 bpm (approx 400ms per note)
    this.timerId = window.setTimeout(this.scheduleNextNote, 420);
  };
}

export const weddingAudio = new WeddingAudioPlayer();
