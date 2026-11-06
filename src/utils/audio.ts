// Web Audio API & HTML5 Audio Player for Wedding Atmosphere
import { loadCustomAudioFile, saveCustomAudioFile } from './audioStorage';
import { fetchCustomAudioFromSupabase } from '../services/supabaseWeddingService';
// Supports:
// 1. Built-in Romantic Web Audio Celesta / Harp synthesis (zero bandwidth, instant, 100% reliable)
// 2. Custom MP3/Audio URLs (paste any audio link)
// 3. Local Audio file uploads (.mp3, .wav, .m4a from computer/phone)
// 4. Curated romantic wedding presets

export interface WeddingAudioPreset {
  id: string;
  title: string;
  category: 'synthesized' | 'stream' | 'orchestral' | 'piano';
  description: string;
  url?: string;
  isBuiltIn?: boolean;
}

export const WEDDING_AUDIO_PRESETS: WeddingAudioPreset[] = [
  {
    id: 'builtin-harp',
    title: 'Dreamy Harp & Celesta (Built-in Web Audio)',
    category: 'synthesized',
    description: 'Soft romantic F-major harp arpeggio chords. Instant, runs 100% offline with zero lag.',
    isBuiltIn: true,
  },
  {
    id: 'canon-in-d',
    title: "Pachelbel's Canon in D (Acoustic Strings)",
    category: 'orchestral',
    description: 'Timeless classical wedding processional with warm cello, violins & harpsichord.',
    url: 'https://archive.org/download/anonymouspachelbelcanon/Anonymous%20-%20Pachelbel%20Canon.mp3',
  },
  {
    id: 'clair-de-lune',
    title: 'Debussy - Clair de Lune (Gentle Piano)',
    category: 'piano',
    description: 'Intimate, emotional French impressionist grand piano performance.',
    url: 'https://archive.org/download/debussy_clairdelune_thiollier/debussy_clairdelune_thiollier.mp3',
  },
  {
    id: 'air-on-g',
    title: 'Bach - Air on the G String (Soft Strings)',
    category: 'orchestral',
    description: 'Serene baroque string ensemble, perfect for romantic vows and receptions.',
    url: 'https://archive.org/download/aironthegstring_201911/Air%20on%20the%20G%20String.mp3',
  },
  {
    id: 'acoustic-guitar-soundhelix',
    title: 'Acoustic Serenade (Guitar & Piano Instrumental)',
    category: 'stream',
    description: 'Modern uplifting instrumental accompaniment with gentle acoustics.',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
];

class WeddingAudioPlayer {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private timerId: number | null = null;
  private currentStep: number = 0;

  // HTMLAudioElement for custom audio files or stream presets
  private audioElement: HTMLAudioElement | null = null;
  private musicUrl: string = '';
  private isBuiltInOnly: boolean = true;
  private volume: number = 0.7; // 0.0 to 1.0

  // Romantic chord progression arpeggios (in F major / D minor, dreamy & gentle)
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

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudioElement();
    }
  }

  private readonly SILENT_AUDIO_UNLOCK =
    'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

  private initAudioElement() {
    if (this.audioElement) return;
    this.audioElement = new Audio();
    this.audioElement.loop = true;
    this.audioElement.volume = this.volume;
    this.audioElement.preload = 'auto';
    (this.audioElement as any).playsInline = true;
    (this.audioElement as any).setAttribute?.('playsinline', 'true');
    (this.audioElement as any).setAttribute?.('webkit-playsinline', 'true');

    // Fallback gracefully to synthesized harp only if a real track was attempted and failed,
    // and never during silent pre-unlocking or while custom audio is actively downloading from cloud.
    this.audioElement.addEventListener('error', (e) => {
      const currentSrc = this.audioElement?.src || '';
      if (!currentSrc || currentSrc.startsWith('data:audio/wav')) {
        return;
      }
      if (this.loadingCustomPromise) {
        return;
      }
      console.warn('Custom audio playback error, falling back to Web Audio harp melody:', e);
      if (this.isPlaying) {
        this.stopAudioElement();
        this.startSynthesizedMusic();
      }
    });
  }

  private activeBlobUrl: string | null = null;
  private loadingCustomPromise: Promise<string | null> | null = null;

  public configure(config: {
    musicUrl?: string;
    musicType?: 'builtin' | 'custom' | 'preset';
    musicVolume?: number;
    musicTitle?: string;
    customBlobUrl?: string;
  }) {
    if (config.musicVolume !== undefined) {
      this.setVolume(config.musicVolume);
    }

    const wasPlaying = this.isPlaying;
    const isBuiltin = config.musicType === 'builtin' || (!config.musicUrl && !config.customBlobUrl);

    this.isBuiltInOnly = isBuiltin;
    this.musicUrl = config.musicUrl ? config.musicUrl.trim() : '';

    this.initAudioElement();
    if (!this.audioElement) return;

    if (isBuiltin) {
      this.audioElement.removeAttribute('src');
      if (wasPlaying) {
        this.stopMusic();
        this.startMusic();
      }
      return;
    }

    // 1. Direct Blob URL provided (immediate upload)
    if (config.customBlobUrl) {
      this.activeBlobUrl = config.customBlobUrl;
      this.audioElement.src = config.customBlobUrl;
      this.audioElement.load();
      if (wasPlaying) {
        this.stopMusic();
        this.startMusic();
      }
      return;
    }

    // 2. Regular HTTP/HTTPS URL
    if (this.musicUrl.startsWith('http://') || this.musicUrl.startsWith('https://')) {
      if (this.audioElement.src !== this.musicUrl) {
        this.audioElement.src = this.musicUrl;
        this.audioElement.load();
      }
      if (wasPlaying) {
        this.stopMusic();
        this.startMusic();
      }
      return;
    }

    // 3. Custom audio stored in Supabase cloud or IndexedDB (syncs across devices)
    if (
      config.musicType === 'custom' ||
      this.musicUrl.startsWith('indexeddb://') ||
      this.musicUrl.startsWith('supabase://') ||
      this.musicUrl.startsWith('blob:')
    ) {
      // If we already have the active blob url loaded, keep playing it
      if (this.activeBlobUrl && this.audioElement.src === this.activeBlobUrl) {
        if (wasPlaying) {
          this.stopMusic();
          this.startMusic();
        }
        return;
      }

      this.loadingCustomPromise = (async () => {
        // Step A: Check local IndexedDB first, ensuring title matches desired song
        try {
          const localSaved = await loadCustomAudioFile(config.musicTitle);
          if (localSaved && localSaved.url && this.audioElement) {
            this.activeBlobUrl = localSaved.url;
            this.audioElement.src = localSaved.url;
            this.audioElement.load();
            this.loadingCustomPromise = null;
            if (this.isPlaying) {
              this.stopSynthesizedMusic();
              this.audioElement.play().catch(() => {});
            }
            return localSaved.url;
          }
        } catch {}

        // Step B: Cache miss or on another device (e.g. phone), fetch from Supabase!
        try {
          const remoteAudio = await fetchCustomAudioFromSupabase();
          if (remoteAudio && remoteAudio.url && this.audioElement) {
            this.activeBlobUrl = remoteAudio.url;
            this.audioElement.src = remoteAudio.url;
            this.audioElement.load();
            // Cache in IndexedDB for subsequent visits on this device
            saveCustomAudioFile(remoteAudio.blob, remoteAudio.name).catch(() => {});
            this.loadingCustomPromise = null;
            if (this.isPlaying) {
              this.stopSynthesizedMusic();
              this.audioElement.play().catch(() => {});
            }
            return remoteAudio.url;
          }
        } catch (err) {
          console.warn('Could not load custom audio from Supabase:', err);
        }

        this.loadingCustomPromise = null;
        return null;
      })();
      return;
    }

    if (wasPlaying) {
      this.stopMusic();
      this.startMusic();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
  }

  public getVolume(): number {
    return this.volume;
  }

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

      const targetGain = 0.08 * (this.volume / 0.7);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(targetGain, now + 0.04);
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
    this.initAudioElement();

    // Resume AudioContext if suspended (standard requirement on mobile Safari & Chrome)
    try {
      const ctx = this.getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    } catch {}

    // If custom/preset is configured and not built-in, play the HTML5 audio element
    if (!this.isBuiltInOnly && this.audioElement) {
      const hasValidSrc =
        this.audioElement.src &&
        !this.audioElement.src.startsWith('data:audio/wav') &&
        this.audioElement.src !== window.location.href;

      if (hasValidSrc) {
        try {
          this.stopSynthesizedMusic();
          this.audioElement.volume = this.volume;
          const playPromise = this.audioElement.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.warn('Audio play prevented or failed, fallback to synth:', err);
              this.startSynthesizedMusic();
            });
          }
          return;
        } catch (err) {
          console.warn('Audio element error, fallback to synth:', err);
        }
      } else if (this.loadingCustomPromise) {
        // Unlock mobile iOS Safari / WebKit audio pipeline during user touch gesture using silent audio
        try {
          this.audioElement.src = this.SILENT_AUDIO_UNLOCK;
          this.audioElement.play().catch(() => {});
        } catch {}

        this.loadingCustomPromise.then((url) => {
          if (this.isPlaying && url && this.audioElement) {
            this.stopSynthesizedMusic();
            this.audioElement.src = url;
            this.audioElement.volume = this.volume;
            this.audioElement.play().catch((err) => {
              console.warn('Playback error after unlock:', err);
              this.startSynthesizedMusic();
            });
          } else if (this.isPlaying && !url) {
            this.startSynthesizedMusic();
          }
        });
        return;
      }
    }

    // Otherwise play synthesized harp chords
    this.startSynthesizedMusic();
  }

  private startSynthesizedMusic() {
    this.stopAudioElement();
    this.currentStep = 0;
    this.scheduleNextNote();
  }

  private stopAudioElement() {
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch {}
    }
  }

  private stopSynthesizedMusic() {
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public stopMusic() {
    this.isPlaying = false;
    this.stopAudioElement();
    this.stopSynthesizedMusic();
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
