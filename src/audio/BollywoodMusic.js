/**
 * BollywoodMusic.js - Authentic Bollywood Action Music & Audio Engine
 * Features official Bollywood action soundtracks (Dhoom, Don, Salaame) with Web Audio Equalizer
 * and procedural Punjabi Dhol/Sitar synthesizer fallback + Bollywood dialogue engine.
 */
export class BollywoodMusic {
  constructor(soundManager) {
    this.sound = soundManager;
    this.ctx = null;
    this.gainNode = null;
    this.analyser = null;
    this.mediaSource = null;
    this.audioEl = null;
    this.isPlaying = false;
    this.volume = 0.75;
    this.isMuted = false;

    // Track metadata with authentic Bollywood soundtracks
    this.tracks = [
      {
        id: 0,
        title: "DHOOM MACHALE (TITLE ANTHEM)",
        file: "/assets/music/dhoom-machale.mp3",
        bpm: 134,
        scale: [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392.0, 440],
        melodyPattern: [0, 2, 4, 3, 2, 0, 4, 5, 4, 3, 2, 0, 3, 2, 0, -1]
      },
      {
        id: 1,
        title: "DON - THE THEME (SRK ACTION)",
        file: "/assets/music/don-theme.mp3",
        bpm: 128,
        scale: [220, 246.94, 277.18, 293.66, 329.63, 369.99, 392.0, 440],
        melodyPattern: [0, 4, 2, 4, 0, 5, 4, 2, 0, 0, 2, 3, 2, 0, -1, 4]
      },
      {
        id: 2,
        title: "DHOOM ACTION (CHASE BEATS)",
        file: "/assets/music/dhoom-action.mp3",
        bpm: 140,
        scale: [196, 220, 233.08, 261.63, 293.66, 311.13, 349.23, 392],
        melodyPattern: [0, 0, 3, 4, 3, 0, 1, 0, 4, 4, 5, 6, 5, 4, 3, 1]
      },
      {
        id: 3,
        title: "SALAAME SALAAME (WAR CELEBRATION)",
        file: "/assets/music/salaame-salaame.mp3",
        bpm: 132,
        scale: [261.63, 293.66, 329.63, 349.23, 392.0, 440, 493.88, 523.25],
        melodyPattern: [0, 2, 4, 0, 2, 4, 5, 4, 2, 4, 2, 0, 4, 2, 0, 2]
      }
    ];

    this.currentTrackIndex = 0;
    this.step = 0;
    this.proceduralTimer = null;
    this.useProcedural = false;
    this.audioVisualizerData = new Uint8Array(16);

    // Dialogue quotes for announcer
    this.quotes = {
      start: ["Aata Majhi Satakli! Battle Begins!", "Picture abhi baaki hai mere dost!"],
      kill: ["Dhamaka!", "Dishyum!", "Khatam! Tata! Bye-Bye!", "Fataak!"],
      boost: ["Dhoom Speed!", "Shah Rukh Drift!"],
      boss: ["Mogambo Khush Hua! Titan Boss is here!", "Don ko pakadna mushkil hi nahi, namumkin hai!"],
      victory: ["Bole toh ekdum jhakaas! Victory!", "Don always wins!"],
      defeat: ["Haar kar jeetne waale ko Baazigar kehte hain!"]
    };
  }

  init(audioCtx) {
    if (this.ctx) return;
    this.ctx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = this.volume;

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 64;

    this.gainNode.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Create native audio element for MP3 streaming
    this.audioEl = new Audio();
    this.audioEl.crossOrigin = 'anonymous';
    this.audioEl.loop = true;

    try {
      this.mediaSource = this.ctx.createMediaElementSource(this.audioEl);
      this.mediaSource.connect(this.gainNode);
    } catch (e) {
      console.warn('MediaElementSource creation warning:', e);
    }
  }

  play() {
    if (!this.ctx) this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    this.isPlaying = true;
    const track = this.getCurrentTrack();

    if (this.audioEl && track.file && !this.useProcedural) {
      if (this.audioEl.src !== window.location.origin + track.file && !this.audioEl.src.endsWith(track.file)) {
        this.audioEl.src = track.file;
      }
      this.audioEl.play().catch((err) => {
        console.warn('Audio play error, falling back to procedural synthesizer:', err);
        this.useProcedural = true;
        this.startProcedural();
      });
    } else {
      this.startProcedural();
    }
  }

  pause() {
    this.isPlaying = false;
    if (this.audioEl) {
      this.audioEl.pause();
    }
    if (this.proceduralTimer) {
      clearTimeout(this.proceduralTimer);
      this.proceduralTimer = null;
    }
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
    return this.isPlaying;
  }

  nextTrack() {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
    this.useProcedural = false;
    if (this.isPlaying) {
      if (this.audioEl) this.audioEl.pause();
      if (this.proceduralTimer) {
        clearTimeout(this.proceduralTimer);
        this.proceduralTimer = null;
      }
      this.play();
    }
    return this.getCurrentTrack();
  }

  setTrack(index) {
    if (index >= 0 && index < this.tracks.length) {
      this.currentTrackIndex = index;
      this.useProcedural = false;
      if (this.isPlaying) {
        if (this.audioEl) this.audioEl.pause();
        if (this.proceduralTimer) {
          clearTimeout(this.proceduralTimer);
          this.proceduralTimer = null;
        }
        this.play();
      }
    }
    return this.getCurrentTrack();
  }

  getCurrentTrack() {
    return this.tracks[this.currentTrackIndex];
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx ? this.ctx.currentTime : 0);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // --- Real-time Equalizer Visualizer ---
  getVisualizerLevels() {
    if (!this.analyser || !this.isPlaying) {
      return [0.08, 0.12, 0.09, 0.15, 0.1, 0.08, 0.14, 0.11];
    }
    this.analyser.getByteFrequencyData(this.audioVisualizerData);
    const levels = [];
    for (let i = 0; i < 8; i++) {
      const v = this.audioVisualizerData[i * 2] / 255;
      levels.push(Math.max(0.08, Math.min(1.0, v * 1.35)));
    }
    return levels;
  }

  // --- Procedural Synth Fallback ---
  startProcedural() {
    this.step = 0;
    this.scheduleNextBeat();
  }

  scheduleNextBeat() {
    if (!this.isPlaying || !this.ctx || !this.useProcedural) return;

    const track = this.tracks[this.currentTrackIndex];
    const sixteenthTime = (60 / track.bpm) / 4;

    this.playStep(this.step, track);
    this.step = (this.step + 1) % 32;

    this.proceduralTimer = setTimeout(() => {
      this.scheduleNextBeat();
    }, sixteenthTime * 1000);
  }

  playStep(step, track) {
    const t = this.ctx.currentTime;

    // 1. Punjabi Dhol Bass Drum
    if (step === 0 || step === 6 || step === 10 || step === 14 || step === 16 || step === 22 || step === 26) {
      this.playDholBass(t, step === 0 || step === 16 ? 1.0 : 0.85);
    }

    // 2. Dholak Sharp Slap
    if (step === 4 || step === 12 || step === 20 || step === 28 || step === 15 || step === 31) {
      this.playDholSlap(t, step === 4 || step === 20 ? 0.9 : 0.7);
    }

    // 3. Tabla Tick
    if (step % 2 === 1) {
      this.playTablaTick(t, 0.35);
    }

    // 4. Brass Stabs
    if (step === 0 || step === 8 || step === 16 || step === 24) {
      const rootFreq = track.scale[0] / 2;
      this.playBrassStab(t, rootFreq, 0.45);
    }

    // 5. Bollywood Sitar Melody
    const noteIdx = track.melodyPattern[step % track.melodyPattern.length];
    if (noteIdx >= 0 && noteIdx < track.scale.length) {
      const freq = track.scale[noteIdx] * (step > 16 ? 1.5 : 1.0);
      this.playSitarPluck(t, freq, 0.4);
    }
  }

  playDholBass(time, intensity = 1.0) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.14);
    gain.gain.setValueAtTime(0.8 * intensity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
    osc.connect(gain);
    gain.connect(this.gainNode);
    osc.start(time);
    osc.stop(time + 0.25);
  }

  playDholSlap(time, intensity = 0.8) {
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(650, time);
    osc.frequency.exponentialRampToValueAtTime(180, time + 0.08);
    oscGain.gain.setValueAtTime(0.4 * intensity, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
    osc.connect(oscGain);
    oscGain.connect(this.gainNode);
    osc.start(time);
    osc.stop(time + 0.1);

    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, time);
    filter.Q.value = 3.0;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6 * intensity, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.gainNode);
    noise.start(time);
    noise.stop(time + 0.09);
  }

  playTablaTick(time, intensity = 0.3) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, time);
    osc.frequency.exponentialRampToValueAtTime(320, time + 0.04);
    gain.gain.setValueAtTime(0.3 * intensity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    osc.connect(gain);
    gain.connect(this.gainNode);
    osc.start(time);
    osc.stop(time + 0.06);
  }

  playBrassStab(time, freq, intensity = 0.4) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, time);
    filter.frequency.exponentialRampToValueAtTime(500, time + 0.22);
    gain.gain.setValueAtTime(0.4 * intensity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode);
    osc.start(time);
    osc.stop(time + 0.28);
  }

  playSitarPluck(time, freq, intensity = 0.4) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.35 * intensity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.26);
    osc.connect(gain);
    gain.connect(this.gainNode);
    osc.start(time);
    osc.stop(time + 0.28);
  }

  // --- Bollywood Dialogue Announcer ---
  speakQuote(category) {
    const quoteList = this.quotes[category] || this.quotes.kill;
    const text = quoteList[Math.floor(Math.random() * quoteList.length)];

    if ('speechSynthesis' in window && Math.random() < 0.6) {
      try {
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 1.15;
        utter.pitch = 1.25;
        utter.volume = 0.85;
        window.speechSynthesis.speak(utter);
      } catch (e) {}
    }
    return text;
  }
}
