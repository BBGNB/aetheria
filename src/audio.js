// Procedural sound — Web Audio API only.
class Audio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.muted = false;
    this.volume = 0.45;
    this.musicVolume = 0.18;
    this.last = new Map();
    this._musicTimer = null;
    this._musicStep = 0;
    this._musicName = null;
    this._ambientTimer = null;
    this._ambientName = null;
  }

  init() {
    if (this.ctx) return;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    this.ctx = new C();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.ctx.destination);
    // Separate gain for music so SFX can be louder.
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicVolume;
    this.musicGain.connect(this.master);
    const len = Math.floor(this.ctx.sampleRate * 0.5);
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : this.volume;
  }

  // --- Music (procedural looping pattern) ---------------------------------

  startMusic(name) {
    if (!this.ctx) return;
    if (this._musicName === name) return;
    this.stopMusic();
    const m = MELODIES[name];
    if (!m) return;
    this._musicName = name;
    this._musicStep = 0;
    const beatMs = (60000 / m.bpm) / 2; // 8th notes
    this._musicTimer = setInterval(() => this._musicTick(), beatMs);
  }

  stopMusic() {
    if (this._musicTimer) clearInterval(this._musicTimer);
    this._musicTimer = null;
    this._musicName = null;
  }

  _musicTick() {
    const m = MELODIES[this._musicName];
    if (!m) return;
    const idx = this._musicStep % m.steps;
    const lead = m.lead?.[idx];
    const bass = m.bass?.[idx];
    if (lead) for (const n of lead) this._musicNote(n, 'triangle', m.leadDur ?? 0.3, 0.35);
    if (bass) for (const n of bass) this._musicNote(n, 'sine', m.bassDur ?? 0.5, 0.45);
    this._musicStep++;
  }

  _musicNote(freq, type, dur, peak) {
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.musicGain);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  // --- Ambient (rare random sounds) ---------------------------------------

  startAmbient(name) {
    if (this._ambientName === name) return;
    this.stopAmbient();
    this._ambientName = name;
    const schedule = () => {
      if (this._ambientName !== name) return;
      const delay = 2500 + Math.random() * 5500;
      this._ambientTimer = setTimeout(() => {
        if (this._ambientName === name) this._playAmbient(name);
        schedule();
      }, delay);
    };
    schedule();
  }

  stopAmbient() {
    if (this._ambientTimer) clearTimeout(this._ambientTimer);
    this._ambientTimer = null;
    this._ambientName = null;
  }

  _playAmbient(name) {
    if (!this.ctx || this.muted) return;
    if (name === 'forest') {
      // Bird chirp: short pitched warble.
      const t = this.ctx.currentTime;
      const notes = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < notes; i++) {
        const o = this.ctx.createOscillator();
        o.type = 'sine';
        const base = 1200 + Math.random() * 800;
        o.frequency.setValueAtTime(base, t + i * 0.06);
        o.frequency.exponentialRampToValueAtTime(base * (1 + Math.random() * 0.3 - 0.15), t + i * 0.06 + 0.05);
        const g = this.ctx.createGain();
        const tt = t + i * 0.06;
        g.gain.setValueAtTime(0.0001, tt);
        g.gain.exponentialRampToValueAtTime(0.08, tt + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.07);
        o.connect(g).connect(this.musicGain);
        o.start(tt);
        o.stop(tt + 0.09);
      }
    }
  }

  _throttle(name, gap) {
    const t = this.ctx.currentTime;
    if ((this.last.get(name) || 0) + gap > t) return false;
    this.last.set(name, t);
    return true;
  }

  _env(g, t0, a, d, peak, s = 0.0001, r = 0) {
    g.gain.cancelScheduledValues(t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(s, t0 + a + d);
    if (r > 0) g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d + r);
  }

  play(name) {
    if (!this.ctx || this.muted) return;
    const fn = SOUNDS[name];
    if (fn) fn.call(this);
  }
}

const SOUNDS = {
  menu() {
    if (!this._throttle('menu', 0.05)) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(); o.type = 'square'; o.frequency.value = 880;
    const g = this.ctx.createGain(); this._env(g, t, 0.001, 0.04, 0.12, 0.0001, 0.02);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + 0.08);
  },
  confirm() {
    const t = this.ctx.currentTime;
    [600, 900].forEach((f, i) => {
      const o = this.ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
      const g = this.ctx.createGain(); this._env(g, t + i * 0.04, 0.002, 0.06, 0.15, 0.0001, 0.04);
      o.connect(g).connect(this.master); o.start(t + i * 0.04); o.stop(t + i * 0.04 + 0.12);
    });
  },
  hit() {
    if (!this._throttle('hit', 0.04)) return;
    const t = this.ctx.currentTime;
    const n = this.ctx.createBufferSource(); n.buffer = this.noise;
    const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 1.6;
    const g = this.ctx.createGain(); this._env(g, t, 0.001, 0.07, 0.3, 0.0001, 0.02);
    n.connect(bp).connect(g).connect(this.master); n.start(t); n.stop(t + 0.1);
    const o = this.ctx.createOscillator(); o.type = 'square'; o.frequency.value = 180;
    const g2 = this.ctx.createGain(); this._env(g2, t, 0.001, 0.06, 0.18, 0.0001, 0.02);
    o.connect(g2).connect(this.master); o.start(t); o.stop(t + 0.1);
  },
  crit() {
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(1400, t);
    o.frequency.exponentialRampToValueAtTime(2400, t + 0.1);
    const g = this.ctx.createGain(); this._env(g, t, 0.001, 0.08, 0.25, 0.0001, 0.04);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + 0.14);
  },
  hurt() {
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(280, t);
    o.frequency.exponentialRampToValueAtTime(80, t + 0.18);
    const g = this.ctx.createGain(); this._env(g, t, 0.002, 0.12, 0.3, 0.0001, 0.04);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + 0.22);
  },
  heal() {
    const t = this.ctx.currentTime;
    [523, 659, 784].forEach((f, i) => {
      const o = this.ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = this.ctx.createGain(); this._env(g, t + i * 0.06, 0.005, 0.1, 0.18, 0.0001, 0.08);
      o.connect(g).connect(this.master); o.start(t + i * 0.06); o.stop(t + i * 0.06 + 0.2);
    });
  },
  magic() {
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(1400, t + 0.4);
    const g = this.ctx.createGain(); this._env(g, t, 0.005, 0.3, 0.18, 0.0001, 0.1);
    const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 800; bp.Q.value = 4;
    o.connect(bp).connect(g).connect(this.master); o.start(t); o.stop(t + 0.5);
  },
  victory() {
    const t = this.ctx.currentTime;
    [392, 523, 659, 880].forEach((f, i) => {
      const o = this.ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
      const g = this.ctx.createGain(); this._env(g, t + i * 0.1, 0.005, 0.18, 0.22, 0.0001, 0.12);
      o.connect(g).connect(this.master); o.start(t + i * 0.1); o.stop(t + i * 0.1 + 0.32);
    });
  },
  levelup() {
    const t = this.ctx.currentTime;
    [523, 659, 784, 1046, 1318].forEach((f, i) => {
      const o = this.ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
      const g = this.ctx.createGain(); this._env(g, t + i * 0.06, 0.003, 0.1, 0.22, 0.0001, 0.08);
      o.connect(g).connect(this.master); o.start(t + i * 0.06); o.stop(t + i * 0.06 + 0.2);
    });
  },
  encounter() {
    const t = this.ctx.currentTime;
    const n = this.ctx.createBufferSource(); n.buffer = this.noise;
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(1500, t);
    lp.frequency.exponentialRampToValueAtTime(300, t + 0.5);
    const g = this.ctx.createGain(); this._env(g, t, 0.005, 0.3, 0.4, 0.0001, 0.2);
    n.connect(lp).connect(g).connect(this.master); n.start(t); n.stop(t + 0.55);
    const o = this.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 90;
    const g2 = this.ctx.createGain(); this._env(g2, t, 0.005, 0.4, 0.3, 0.0001, 0.15);
    o.connect(g2).connect(this.master); o.start(t); o.stop(t + 0.55);
  },
  step() {
    if (!this._throttle('step', 0.18)) return;
    const t = this.ctx.currentTime;
    const n = this.ctx.createBufferSource(); n.buffer = this.noise;
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600;
    const g = this.ctx.createGain(); this._env(g, t, 0.002, 0.04, 0.08, 0.0001, 0.01);
    n.connect(lp).connect(g).connect(this.master); n.start(t); n.stop(t + 0.06);
  },
  defeat() {
    const t = this.ctx.currentTime;
    [523, 392, 311, 261, 207].forEach((f, i) => {
      const o = this.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
      const g = this.ctx.createGain(); this._env(g, t + i * 0.16, 0.01, 0.2, 0.22, 0.0001, 0.12);
      o.connect(g).connect(this.master); o.start(t + i * 0.16); o.stop(t + i * 0.16 + 0.34);
    });
  },

  // ---- Chapter 2 bespoke FX -------------------------------------------------

  // Sporeburst: hissing breath of fungus + low woody thud. Used by spore-bloom.
  sporeBurst() {
    const t = this.ctx.currentTime;
    // Hiss layer
    const n = this.ctx.createBufferSource(); n.buffer = this.noise;
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2400, t);
    lp.frequency.exponentialRampToValueAtTime(600, t + 0.45);
    const g = this.ctx.createGain(); this._env(g, t, 0.005, 0.18, 0.35, 0.0001, 0.18);
    n.connect(lp).connect(g).connect(this.master); n.start(t); n.stop(t + 0.55);
    // Body thud
    const o = this.ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.3);
    const g2 = this.ctx.createGain(); this._env(g2, t, 0.005, 0.12, 0.28, 0.0001, 0.1);
    o.connect(g2).connect(this.master); o.start(t); o.stop(t + 0.4);
  },

  // Thorn crack: short wood-snap with a high splinter ping.
  thornCrack() {
    const t = this.ctx.currentTime;
    const n = this.ctx.createBufferSource(); n.buffer = this.noise;
    const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 3;
    const g = this.ctx.createGain(); this._env(g, t, 0.001, 0.04, 0.4, 0.0001, 0.04);
    n.connect(bp).connect(g).connect(this.master); n.start(t); n.stop(t + 0.08);
    const o = this.ctx.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(3200, t);
    o.frequency.exponentialRampToValueAtTime(900, t + 0.12);
    const g2 = this.ctx.createGain(); this._env(g2, t, 0.001, 0.06, 0.18, 0.0001, 0.04);
    o.connect(g2).connect(this.master); o.start(t); o.stop(t + 0.15);
  },

  // Aether wail: long, ethereal high choir-like swell for the Bloom's signature.
  aetherWail() {
    const t = this.ctx.currentTime;
    // Detuned triangle pad sweeping up
    [220, 277, 330, 440].forEach((f, i) => {
      const o = this.ctx.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(f * 0.9, t);
      o.frequency.exponentialRampToValueAtTime(f * 1.6, t + 0.9);
      const g = this.ctx.createGain(); this._env(g, t, 0.08, 0.35, 0.22, 0.0001, 0.5);
      o.connect(g).connect(this.master); o.start(t); o.stop(t + 1.4);
    });
    // Inhaled noise layer
    const n = this.ctx.createBufferSource(); n.buffer = this.noise;
    const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass';
    bp.frequency.setValueAtTime(800, t); bp.frequency.exponentialRampToValueAtTime(2800, t + 0.9);
    bp.Q.value = 2;
    const ng = this.ctx.createGain(); this._env(ng, t, 0.1, 0.4, 0.18, 0.0001, 0.5);
    n.connect(bp).connect(ng).connect(this.master); n.start(t); n.stop(t + 1.4);
  },

  // Boss thump: heavy footfall for big enemies committing to a move.
  bossThump() {
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(80, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.25);
    const g = this.ctx.createGain(); this._env(g, t, 0.003, 0.1, 0.4, 0.0001, 0.18);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + 0.4);
    const n = this.ctx.createBufferSource(); n.buffer = this.noise;
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320;
    const g2 = this.ctx.createGain(); this._env(g2, t, 0.001, 0.04, 0.3, 0.0001, 0.04);
    n.connect(lp).connect(g2).connect(this.master); n.start(t); n.stop(t + 0.1);
  },

  // Ember crackle: warm wood-pop for Sable's recruit and cinder-flavored beats.
  ember() {
    const t = this.ctx.currentTime;
    for (let i = 0; i < 5; i++) {
      const delay = i * 0.08 + Math.random() * 0.03;
      const n = this.ctx.createBufferSource(); n.buffer = this.noise;
      const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800 + Math.random() * 1200; bp.Q.value = 5;
      const g = this.ctx.createGain(); this._env(g, t + delay, 0.002, 0.03, 0.35, 0.0001, 0.02);
      n.connect(bp).connect(g).connect(this.master); n.start(t + delay); n.stop(t + delay + 0.04);
    }
    // Warm undertone
    const o = this.ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 320;
    const g = this.ctx.createGain(); this._env(g, t, 0.02, 0.15, 0.15, 0.0001, 0.18);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + 0.4);
  },

  // Choir swell — bright sustained voiced harmonic, for holy/sacred fusions.
  choirSwell() {
    const t = this.ctx.currentTime;
    // Major triad sustained, slowly rising in pitch
    [523, 659, 784, 1046].forEach((f, i) => {
      const o = this.ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(f * 0.85, t);
      o.frequency.exponentialRampToValueAtTime(f, t + 0.6);
      const g = this.ctx.createGain(); this._env(g, t + i * 0.05, 0.15, 0.4, 0.22, 0.0001, 0.6);
      o.connect(g).connect(this.master); o.start(t); o.stop(t + 1.4);
    });
    // Sparkle layer
    const n = this.ctx.createBufferSource(); n.buffer = this.noise;
    const hp = this.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000;
    const ng = this.ctx.createGain(); this._env(ng, t, 0.1, 0.3, 0.12, 0.0001, 0.5);
    n.connect(hp).connect(ng).connect(this.master); n.start(t); n.stop(t + 1.4);
  },

  // Void hum — deep, slightly detuned resonating drone for dark fusions.
  voidHum() {
    const t = this.ctx.currentTime;
    [55, 55.8, 110].forEach((f, i) => {
      const o = this.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
      const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 280;
      const g = this.ctx.createGain(); this._env(g, t, 0.2, 0.3, 0.2, 0.0001, 0.8);
      o.connect(lp).connect(g).connect(this.master); o.start(t); o.stop(t + 1.6);
    });
    // Hint of dissonant overtone
    const o2 = this.ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = 466;
    const g2 = this.ctx.createGain(); this._env(g2, t + 0.4, 0.15, 0.3, 0.08, 0.0001, 0.5);
    o2.connect(g2).connect(this.master); o2.start(t + 0.4); o2.stop(t + 1.3);
  },

  // Glass shatter — sharp crystalline break, for ice/freeze fusions.
  glassShatter() {
    const t = this.ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const delay = i * 0.025 + Math.random() * 0.01;
      const o = this.ctx.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(2400 + Math.random() * 1800, t + delay);
      o.frequency.exponentialRampToValueAtTime(900 + Math.random() * 500, t + delay + 0.08);
      const g = this.ctx.createGain(); this._env(g, t + delay, 0.001, 0.04, 0.22, 0.0001, 0.04);
      o.connect(g).connect(this.master); o.start(t + delay); o.stop(t + delay + 0.12);
    }
    // High noise hiss
    const n = this.ctx.createBufferSource(); n.buffer = this.noise;
    const hp = this.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 4500;
    const ng = this.ctx.createGain(); this._env(ng, t, 0.001, 0.08, 0.3, 0.0001, 0.05);
    n.connect(hp).connect(ng).connect(this.master); n.start(t); n.stop(t + 0.15);
  },

  // Swarm hiss — insectoid layered swarm, for poison / nature fusions.
  swarmHiss() {
    const t = this.ctx.currentTime;
    const n = this.ctx.createBufferSource(); n.buffer = this.noise;
    const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1600, t);
    bp.frequency.linearRampToValueAtTime(2400, t + 0.5);
    bp.Q.value = 6;
    const g = this.ctx.createGain(); this._env(g, t, 0.02, 0.2, 0.35, 0.0001, 0.3);
    n.connect(bp).connect(g).connect(this.master); n.start(t); n.stop(t + 0.7);
    // Buzzing overtone
    const o = this.ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(120, t);
    o.frequency.linearRampToValueAtTime(200, t + 0.5);
    const og = this.ctx.createGain(); this._env(og, t, 0.02, 0.25, 0.15, 0.0001, 0.2);
    o.connect(og).connect(this.master); o.start(t); o.stop(t + 0.7);
  },

  // Thunderclap — sharp percussive crack, for thunder fusions.
  thunderclap() {
    const t = this.ctx.currentTime;
    // Initial crack: short white noise burst
    const n = this.ctx.createBufferSource(); n.buffer = this.noise;
    const hp = this.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1000;
    const g = this.ctx.createGain(); this._env(g, t, 0.001, 0.04, 0.6, 0.0001, 0.04);
    n.connect(hp).connect(g).connect(this.master); n.start(t); n.stop(t + 0.1);
    // Body: low rumble
    const o = this.ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(60, t);
    o.frequency.exponentialRampToValueAtTime(30, t + 0.4);
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 200;
    const og = this.ctx.createGain(); this._env(og, t + 0.02, 0.005, 0.15, 0.4, 0.0001, 0.25);
    o.connect(lp).connect(og).connect(this.master); o.start(t + 0.02); o.stop(t + 0.5);
  },

  // Chime — bright tuned bell, for healing / blessing fusions.
  chime() {
    const t = this.ctx.currentTime;
    [1318, 1568, 1976].forEach((f, i) => {
      const o = this.ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = this.ctx.createGain(); this._env(g, t + i * 0.04, 0.002, 0.06, 0.35, 0.0001, 0.4);
      o.connect(g).connect(this.master); o.start(t + i * 0.04); o.stop(t + i * 0.04 + 0.5);
    });
  },

  // Doom knell — deep bell toll, for the most ominous / ultimate fusions.
  doomKnell() {
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 110;
    const g = this.ctx.createGain(); this._env(g, t, 0.01, 0.5, 0.5, 0.0001, 1.0);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + 1.8);
    // Overtones
    [220, 330, 440].forEach((f, i) => {
      const o2 = this.ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f;
      const g2 = this.ctx.createGain(); this._env(g2, t, 0.05, 0.5, 0.18, 0.0001, 0.8);
      o2.connect(g2).connect(this.master); o2.start(t); o2.stop(t + 1.6);
    });
  },

  // Rift hum: low atmospheric drone for cutscene moments (epilogue, knot-mending).
  rift() {
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(55, t); o.frequency.exponentialRampToValueAtTime(40, t + 1.2);
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 200;
    const g = this.ctx.createGain(); this._env(g, t, 0.4, 0.5, 0.25, 0.0001, 0.8);
    o.connect(lp).connect(g).connect(this.master); o.start(t); o.stop(t + 2.0);
    // Distant overtone shimmer
    const o2 = this.ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 660;
    const g2 = this.ctx.createGain(); this._env(g2, t + 0.3, 0.2, 0.3, 0.12, 0.0001, 0.6);
    o2.connect(g2).connect(this.master); o2.start(t + 0.3); o2.stop(t + 1.6);
  },
};

// Notes (Hz) — C major scale family.
const N = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0,
  // minor / dissonant
  Eb3: 155.56, Eb4: 311.13, Ab3: 207.65, Ab4: 415.30, Bb3: 233.08, Bb4: 466.16, Gb4: 369.99,
};

const MELODIES = {
  // 16-step gentle pentatonic loop, slow tempo.
  overworld: {
    bpm: 88,
    steps: 16,
    leadDur: 0.55,
    bassDur: 0.9,
    lead: [
      [N.E4], null, [N.G4], null, [N.A4], null, [N.G4], null,
      [N.E4], null, [N.D4], null, [N.C4], null, [N.D4], null,
    ],
    bass: [
      [N.C3], null, null, null, [N.G3], null, null, null,
      [N.A3], null, null, null, [N.F3], null, null, null,
    ],
  },
  // 16-step minor key urgent loop, faster.
  battle: {
    bpm: 132,
    steps: 16,
    leadDur: 0.28,
    bassDur: 0.4,
    lead: [
      [N.A4], [N.C5], [N.E4], [N.A4], [N.C5], [N.E5], [N.D5], [N.C5],
      [N.A4], [N.C5], [N.E4], [N.A4], [N.G4], [N.Bb4], [N.A4], [N.G4],
    ],
    bass: [
      [N.A3], null, [N.E3], null, [N.A3], null, [N.E3], null,
      [N.F3], null, [N.C3], null, [N.G3], null, [N.D3], null,
    ],
  },
  // Slower minor for game over.
  defeat: {
    bpm: 60, steps: 8, leadDur: 0.9, bassDur: 1.4,
    lead: [[N.A4], null, [N.G4], null, [N.F4], null, [N.E4], null],
    bass: [[N.A3], null, [N.F3], null, [N.D3], null, [N.E3], null],
  },
  // Hushed, slow, mysterious — for the title intro cinematic.
  intro: {
    bpm: 56, steps: 16, leadDur: 1.6, bassDur: 2.4,
    lead: [
      null, null, [N.A4], null,    null, [N.E5], null, [N.D5],
      null, null, [N.G4], null,    null, [N.E4], null, [N.D4],
    ],
    bass: [
      [N.A3], null, null, null,    null, null, null, null,
      [N.F3], null, null, null,    [N.D3], null, null, null,
    ],
  },
};

export const audio = new Audio();
