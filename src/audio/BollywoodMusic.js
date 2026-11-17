/**
 * CombatAudioEngine - Aggressive Phonk, Russian Drift Phonk & Action Soundtrack Engine
 * Features high-octane combat tracks (Middle of the Night, DVRST, Kordhell, Interworld, MoonDeity)
 * with real-time Web Audio Equalizer and procedural 808 Phonk Cowbell / Bass synthesizer fallback.
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
    this.volume = 0.85;
    this.isMuted = false;

    // Track metadata with aggressive Phonk and action soundtracks
    this.tracks = [
      {
        id: 0,
        title: "ELLEY DUHÉ - MIDDLE OF THE NIGHT",
        file: "/assets/music/middle-of-the-night.mp3",
        bpm: 145,
        scale: [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392.0, 440],
        melodyPattern: [0, 2, 4, 3, 2, 0, 4, 5, 4, 3, 2, 0, 3, 2, 0, -1]
      },
      {
        id: 1,
        title: "DVRST - CLOSE EYES (RUSSIAN PHONK)",
        file: "/assets/music/dvrst-close-eyes.mp3",
        bpm: 130,
        scale: [164.81, 185.00, 196.00, 220.00, 246.94, 261.63, 293.66, 329.63],
        melodyPattern: [0, 2, 3, 2, 0, 5, 4, 3, 2, 3, 5, 4, 2, 0, 2, 3]
      },
      {
        id: 2,
        title: "KORDHELL - MURDER IN MY MIND",
        file: "/assets/music/kordhell-murder-in-my-mind.mp3",
        bpm: 140,
        scale: [130.81, 146.83, 155.56, 174.61, 196.00, 207.65, 233.08, 261.63],
        melodyPattern: [0, 0, 3, 4, 3, 0, 1, 0, 4, 4, 5, 6, 5, 4, 3, 1]
      },
      {
        id: 3,
        title: "INTERWORLD - METAMORPHOSIS",
        file: "/assets/music/interworld-metamorphosis.mp3",
        bpm: 135,
        scale: [146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63, 293.66],
        melodyPattern: [0, 2, 4, 0, 2, 4, 5, 4, 2, 4, 2, 0, 4, 2, 0, 2]
      },
      {
        id: 4,
        title: "MOONDEITY X INTERWORLD - ONE CHANCE",
        file: "/assets/music/moondeity-one-chance.mp3",
        bpm: 138,
        scale: [110.00, 123.47, 130.81, 146.83, 164.81, 174.61, 196.00, 220.00],
        melodyPattern: [0, 3, 5, 3, 0, 4, 3, 0, 5, 4, 3, 2, 0, 3, 2, 0]
      }
    ];

    this.currentTrackIndex = 0;
    this.step = 0;
    this.proceduralTimer = null;
    this.useProcedural = false;
    this.audioVisualizerData = new Uint8Array(16);

    // Dialogue quotes for announcer
    this.quotes = {
      start: ["BATTLE ENGAGED! CRANK THE PHONK!", "LOCK AND LOAD! DEMOLISH EVERYTHING!", "WAR ENGINE ONLINE!"],
      kill: ["TARGET DEMOLISHED!", "FATALITY!", "OBLITERATED!", "CLEAN KILL!", "DHAMAKA!"],
      boost: ["NITRO OVERDRIVE!", "PHONK DRIFT ACTIVATED!", "MAXIMUM THRUST!"],
      boss: ["WARNING: TITAN MK-IV HAS ENTERED THE ARENA!", "BOSS BATTLE IMMINENT! ENGAGE!"],
      victory: ["SECTOR DOMINATED! TOTAL VICTORY!", "APEX PREDATOR OF THE BATTLEFIELD!"],
      defeat: ["SYSTEM OFFLINE! REGROUP AND STRIKE BACK!"]
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

    // 1. Phonk Distorted 808 Sub-Bass
    if (step === 0 || step === 6 || step === 10 || step === 14 || step === 16 || step === 22 || step === 26) {
      this.play808Bass(t, step === 0 || step === 16 ? 1.0 : 0.85);
    }

    // 2. Phonk Snare / Clap
    if (step === 4 || step === 12 || step === 20 || step === 28) {
      this.playPhonkSnare(t, 0.8);
    }

    // 3. Phonk Hi-Hat rolls
    if (step % 2 === 1 || step % 4 === 3) {
      this.playHiHat(t, 0.25);
    }

    // 4. Heavy Brass / Synth Stabs
    if (step === 0 || step === 8 || step === 16 || step === 24) {
      const rootFreq = track.scale[0];
      this.playSynthStab(t, rootFreq, 0.45);
    }

    // 5. Roland 808 Phonk Cowbell Lead
    const noteIdx = track.melodyPattern[step % track.melodyPattern.length];
    if (noteIdx >= 0 && noteIdx < track.scale.length) {
      const freq = track.scale[noteIdx] * (step > 16 ? 2.0 : 1.5);
      this.playPhonkCowbell(t, freq, 0.45);
    }
  }

  play808Bass(time, intensity = 1.0) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const distortion = this.ctx.createWaveShaper();

    // Subtle distortion curve for crunchy 808
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = (Math.PI + 4) * x / (Math.PI + 4 * Math.abs(x));
    }
    distortion.curve = curve;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.18);
    gain.gain.setValueAtTime(0.9 * intensity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.32);

    osc.connect(distortion);
    distortion.connect(gain);
    gain.connect(this.gainNode);
    osc.start(time);
    osc.stop(time + 0.35);
  }

  playPhonkSnare(time, intensity = 0.8) {
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, time);
    osc.frequency.exponentialRampToValueAtTime(90, time + 0.08);
    oscGain.gain.setValueAtTime(0.4 * intensity, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
    osc.connect(oscGain);
    oscGain.connect(this.gainNode);
    osc.start(time);
    osc.stop(time + 0.1);

    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(900, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6 * intensity, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.gainNode);
    noise.start(time);
    noise.stop(time + 0.12);
  }

  playHiHat(time, intensity = 0.25) {
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(intensity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode);
    noise.start(time);
    noise.stop(time + 0.04);
  }

  playSynthStab(time, freq, intensity = 0.45) {
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, time);
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq * 1.01, time); // slight detune

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, time);
    filter.frequency.exponentialRampToValueAtTime(400, time + 0.2);

    gain.gain.setValueAtTime(0.4 * intensity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode);
    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.26);
    osc2.stop(time + 0.26);
  }

  // Authentic 808 Phonk Cowbell (dual square waves + bandpass filter)
  playPhonkCowbell(time, freq, intensity = 0.45) {
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const bandpass = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'square';
    osc1.frequency.setValueAtTime(freq, time);
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(freq * 1.48, time); // Roland 808 cowbell ratio

    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(freq * 1.2, time);
    bandpass.Q.value = 4.0;

    gain.gain.setValueAtTime(0.5 * intensity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

    osc1.connect(bandpass);
    osc2.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.gainNode);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.32);
    osc2.stop(time + 0.32);
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
