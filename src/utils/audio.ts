// Moteur audio synthétisé (Web Audio API) + narration optionnelle (Web Speech API)

class QuizAudioEngine {
  private ctx: AudioContext | null = null;
  private sfxEnabled = true;
  private musicEnabled = false;
  private voiceEnabled = false;
  private musicInterval: number | null = null;
  private stepIndex = 0;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }

  public setVoiceEnabled(enabled: boolean) {
    this.voiceEnabled = enabled;
    if (!enabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (enabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'triangle',
    gainLevel = 0.08,
    delay = 0
  ) {
    const ctx = this.getContext();
    if (!ctx) return;

    const startTime = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(gainLevel, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  public playStartFanfare() {
    if (!this.sfxEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => this.playTone(n, 0.22, 'triangle', 0.1, idx * 0.08));
  }

  public playTick(urgent: boolean) {
    if (!this.sfxEnabled) return;
    this.playTone(urgent ? 980 : 640, 0.055, 'sine', urgent ? 0.07 : 0.04);
  }

  public playReveal() {
    if (!this.sfxEnabled) return;
    this.playTone(587.33, 0.12, 'triangle', 0.07, 0);
    this.playTone(880, 0.2, 'triangle', 0.08, 0.07);
  }

  public playCorrect() {
    if (!this.sfxEnabled) return;
    this.playTone(523.25, 0.14, 'triangle', 0.1, 0);
    this.playTone(659.25, 0.14, 'triangle', 0.1, 0.09);
    this.playTone(783.99, 0.18, 'triangle', 0.11, 0.18);
    this.playTone(1046.5, 0.3, 'triangle', 0.12, 0.27);
  }

  public playWrong() {
    if (!this.sfxEnabled) return;
    this.playTone(349.23, 0.18, 'sine', 0.08, 0);
    this.playTone(293.66, 0.28, 'sine', 0.08, 0.14);
  }

  public playVictoryFanfare() {
    if (!this.sfxEnabled) return;
    const melody = [
      { f: 523.25, d: 0.15, t: 0 },
      { f: 659.25, d: 0.15, t: 0.12 },
      { f: 783.99, d: 0.15, t: 0.24 },
      { f: 1046.5, d: 0.35, t: 0.36 },
      { f: 783.99, d: 0.14, t: 0.58 },
      { f: 1046.5, d: 0.55, t: 0.72 },
    ];
    melody.forEach((m) => this.playTone(m.f, m.d, 'triangle', 0.11, m.t));
  }

  public startMusic() {
    if (!this.musicEnabled || typeof window === 'undefined') return;
    if (this.musicInterval !== null) return;

    // Boucle marimba joyeuse en Do majeur
    const pattern = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 392.0];
    this.musicInterval = window.setInterval(() => {
      if (!this.musicEnabled) return;
      const freq = pattern[this.stepIndex % pattern.length];
      this.playTone(freq, 0.22, 'sine', 0.025);
      this.stepIndex += 1;
    }, 340);
  }

  public stopMusic() {
    if (this.musicInterval !== null && typeof window !== 'undefined') {
      window.clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  public speakHost(text: string) {
    if (!this.voiceEnabled || typeof window === 'undefined') return;
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 1.04;
      utterance.pitch = 1.06;
      const voices = window.speechSynthesis.getVoices();
      const frVoice = voices.find((v) => v.lang.toLowerCase().startsWith('fr'));
      if (frVoice) {
        utterance.voice = frVoice;
      }
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech synthesis errors on restricted browsers
    }
  }

  public stopSpeech() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const audioEngine = new QuizAudioEngine();
