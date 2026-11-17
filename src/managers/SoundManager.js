/**
 * SoundManager.js - Ultra-low latency Web Audio SFX Engine for Better Tanks
 */
export class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.buffers = new Map();
    this.isMuted = localStorage.getItem('better_tanks_muted') === 'true';
    this.initialized = false;
    this.playerPos = { x: 0, z: 0 };

    this.soundPaths = {
      'player-shoot': '/assets/audio/player-shoot.mp3',
      'player-move': '/assets/audio/player-move.mp3',
      'player-boost': '/assets/audio/player-boost.mp3',
      'player-hit': '/assets/audio/player-hit.mp3',
      'player-jump': '/assets/audio/player-jump.mp3',
      'player-landing': '/assets/audio/player-landing.mp3',
      'player-explode': '/assets/audio/player-explode.mp3',
      'fodder-shoot': '/assets/audio/fodder-shoot.mp3',
      'fodder-move': '/assets/audio/fodder-move-loop.mp3',
      'fodder-hit': '/assets/audio/fodder-hit.mp3',
      'fodder-explode': '/assets/audio/fodder-explode.mp3',
      'boss-shoot': '/assets/audio/boss-shoot.mp3',
      'boss-move': '/assets/audio/boss-move-loop.mp3',
      'boss-hit': '/assets/audio/boss-hit.mp3',
      'boss-explode': '/assets/audio/boss-explode.mp3'
    };

    this.loopNodes = new Map();
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.85;

      // Dynamics compressor to prevent clipping on multiple explosions
      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
      compressor.knee.setValueAtTime(30, this.ctx.currentTime);
      compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
      compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      compressor.release.setValueAtTime(0.2, this.ctx.currentTime);

      this.masterGain.connect(compressor);
      compressor.connect(this.ctx.destination);

      this.initialized = true;
      this.preloadAll();
    } catch (e) {
      console.warn('AudioContext init failed:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  async preloadAll() {
    const promises = Object.entries(this.soundPaths).map(async ([key, url]) => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuf = await res.arrayBuffer();
        const audioBuf = await this.ctx.decodeAudioData(arrayBuf);
        this.buffers.set(key, audioBuf);
      } catch (err) {
        console.warn(`Could not load audio '${key}':`, err.message);
      }
    });
    await Promise.allSettled(promises);
  }

  setPlayerPosition(x, z) {
    this.playerPos.x = x;
    this.playerPos.z = z;
  }

  play(name, options = {}) {
    if (this.isMuted || !this.ctx) return null;
    this.resume();

    const buffer = this.buffers.get(name);
    if (!buffer) {
      this.playSynthetic(name, options);
      return null;
    }

    try {
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;

      // Pitch variation for natural acoustics
      const pitchVar = options.pitchVar !== undefined ? options.pitchVar : 0.08;
      const baseRate = options.rate !== undefined ? options.rate : 1.0;
      source.playbackRate.value = Math.max(0.2, baseRate + (Math.random() * 2 - 1) * pitchVar);

      // Volume & 2D Spatial Distance attenuation
      const gainNode = this.ctx.createGain();
      let vol = options.volume !== undefined ? options.volume : 1.0;

      if (options.position) {
        const dx = options.position.x - this.playerPos.x;
        const dz = options.position.z - this.playerPos.z;
        const dist = Math.hypot(dx, dz);
        const maxDist = options.maxDist || 55;
        const falloff = Math.max(0, 1 - dist / maxDist);
        vol *= falloff * falloff; // Inverse square feel
      }

      if (vol <= 0.01) return null;

      gainNode.gain.setValueAtTime(vol, this.ctx.currentTime);
      source.connect(gainNode);
      gainNode.connect(this.masterGain);

      source.start(0);
      return source;
    } catch (e) {
      return null;
    }
  }

  startLoop(name, volume = 0.5) {
    if (!this.ctx || this.loopNodes.has(name)) return;
    const buffer = this.buffers.get(name);
    if (!buffer) return;

    try {
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const gainNode = this.ctx.createGain();
      gainNode.gain.value = this.isMuted ? 0 : volume;

      source.connect(gainNode);
      gainNode.connect(this.masterGain);
      source.start(0);

      this.loopNodes.set(name, { source, gainNode, targetVolume: volume });
    } catch (e) {}
  }

  updateLoop(name, volume, rate = 1.0) {
    const loop = this.loopNodes.get(name);
    if (!loop || !this.ctx) return;
    try {
      loop.gainNode.gain.setTargetAtTime(this.isMuted ? 0 : volume, this.ctx.currentTime, 0.05);
      loop.source.playbackRate.setTargetAtTime(rate, this.ctx.currentTime, 0.05);
    } catch (e) {}
  }

  stopLoop(name) {
    const loop = this.loopNodes.get(name);
    if (!loop) return;
    try {
      loop.source.stop();
      loop.source.disconnect();
    } catch (e) {}
    this.loopNodes.delete(name);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('better_tanks_muted', this.isMuted);
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  playSynthetic(name, options = {}) {
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.masterGain);

      let vol = options.volume || 0.4;
      if (name.includes('shoot')) {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
        gain.gain.setValueAtTime(vol * 0.7, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.start(t);
        osc.stop(t + 0.16);
      } else if (name.includes('explode')) {
        // Noise blast
        const bufferSize = this.ctx.sampleRate * 0.4;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, t);
        filter.frequency.linearRampToValueAtTime(60, t + 0.4);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(vol, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        whiteNoise.start(t);
        whiteNoise.stop(t + 0.4);
      } else if (name.includes('hit')) {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(90, t + 0.08);
        gain.gain.setValueAtTime(vol * 0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.start(t);
        osc.stop(t + 0.09);
      }
    } catch (e) {}
  }
}
