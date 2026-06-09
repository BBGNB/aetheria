// Cinematic intro — runs once on New Game. Procedural, ~60s, skippable.
// Layered scenes: starfield, leylines, the seven keepers, Vael's corruption,
// the Rift, the Sundered, the Order falling, Lyra alone, a fraying world,
// and the hero's arrival at Hearthstone.

import { Effects } from '../effects.js';
import { drawHero } from '../heroSprites.js';
import { audio } from '../audio.js';

// --- Phase script ----------------------------------------------------------
// Each phase has an id, duration (seconds), and an optional narration line.
const PHASES = [
  { id: 'opening',       dur: 2.5 },
  { id: 'titleBloom',    dur: 4.5 },
  { id: 'starfield',     dur: 5.5, text: 'Before the kingdoms, before the names of stars,\nthe world was a single sound.' },
  { id: 'leylines',      dur: 7.5, text: 'Aether — the song that ran through stone and sky and breath.\nWhen it was kept in tune, the world remembered itself.' },
  { id: 'keepers',       dur: 6.5, text: 'Seven were chosen to keep it tuned.\nThey called themselves the Aetherial Order.' },
  { id: 'vaelGrief',     dur: 7.0, text: 'The eldest of them was Vael.\nHis wife was dying — and the song could mend her.' },
  { id: 'vaelReaches',   dur: 5.5, text: 'The Order forbade him to reach.\nHe reached anyway.' },
  { id: 'rift',          dur: 5.5, text: 'The Aether did not bend.\nIt tore — and it took him.' },
  { id: 'sundered',      dur: 7.5, text: 'What walked back wore his face.\nIt answered to no name. The people called it — The Sundered.' },
  { id: 'orderFell',     dur: 6.0, text: 'The Order rose to mend the wound.\nOne by one, the song claimed them back.' },
  { id: 'lyraAlone',     dur: 5.0, text: 'Only Lyra — the youngest — remained.' },
  { id: 'hollowTakes',   dur: 7.5, text: 'She walked into the Hollow with her staff\nand the silence behind her.\nShe did not come back.' },
  { id: 'worldFraying',  dur: 6.5, text: 'Seasons passed.\nThe leylines bled where the Order could not seal them.\nThe world quieted.' },
  { id: 'homeFalls',     dur: 6.5, text: 'In a province where the song had gone silent,\na door closed behind you for the last time.' },
  { id: 'heroEnter',     dur: 5.5, text: 'You came east —\ndrawn by rumor of a town that still remembered.' },
  { id: 'callToAction',  dur: 5.0, text: 'You are no mage of the Order.\nNo legend, no chosen child.' },
  { id: 'closingLine',   dur: 6.0, text: 'But the song still needs a voice.\nAnd a hand willing to lift the blade.' },
  { id: 'titleReprise',  dur: 3.5 },
  { id: 'fadeOut',       dur: 1.5 },
];

const TOTAL = PHASES.reduce((s, p) => s + p.dur, 0);

export class Intro {
  constructor(canvas, ctx, input, onDone) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.input = input;
    this.onDone = onDone;
    this.t = 0;
    this.lastT = 0;
    this.running = false;
    this.fx = new Effects();
    this._spawnedBeats = new Set();
    this._prevOnTap = null;
    this._stars = null;
  }

  start() {
    this.running = true;
    this.t = 0;
    this.lastT = performance.now();
    this._prevOnTap = this.input.onTap;
    this.input.onTap = () => this._skip();
    audio.startMusic('intro');
    requestAnimationFrame((t) => this._tick(t));
  }

  stop() {
    this.running = false;
    if (this._prevOnTap !== null) this.input.onTap = this._prevOnTap;
    audio.stopMusic();
  }

  _skip() { if (this.running) this._complete(); }

  _complete() {
    if (!this.running) return;
    this.stop();
    // Defer to swallow the synthetic post-tap "click" that would otherwise hit
    // a fresh button on the class picker overlay.
    if (this.onDone) setTimeout(this.onDone, 350);
  }

  _tick(now) {
    if (!this.running) return;
    let dt = Math.min(0.05, (now - this.lastT) / 1000);
    this.lastT = now;
    // Hold to fast-forward: any press held past 350ms (the input tap-threshold)
    // multiplies playback by 4× until released. Quick taps (<350ms) still fire
    // onTap → _skip via the input handler.
    if (this.input.active) {
      this._pressT = (this._pressT || 0) + dt;
      if (this._pressT > 0.35) {
        dt *= 4;
        this._ffActive = true;
      }
    } else {
      this._pressT = 0;
      this._ffActive = false;
    }
    this.t += dt;
    this.fx.update(dt);
    this._draw();
    if (this.t >= TOTAL) { this._complete(); return; }
    requestAnimationFrame((t) => this._tick(t));
  }

  _once(key, fn) {
    if (!this._spawnedBeats.has(key)) { this._spawnedBeats.add(key); fn(); }
  }

  // ---- Phase lookup --------------------------------------------------------

  _phaseAt(t) {
    let acc = 0;
    for (const p of PHASES) {
      if (t < acc + p.dur) {
        return { phase: p, start: acc, k: (t - acc) / p.dur };
      }
      acc += p.dur;
    }
    return { phase: PHASES[PHASES.length - 1], start: acc - PHASES[PHASES.length - 1].dur, k: 1 };
  }

  // ---- Draw ----------------------------------------------------------------

  _draw() {
    const ctx = this.ctx;
    const W = this.canvas.clientWidth;
    const H = this.canvas.clientHeight;
    const { phase, k } = this._phaseAt(this.t);

    // Background tinted per phase
    this._drawBackground(ctx, W, H, phase, k);

    // Persistent star layer (introduced from 'starfield' onward)
    if (this._phasePast('starfield', phase)) this._drawStars(ctx, W, H, phase);

    // Phase-specific scene
    switch (phase.id) {
      case 'opening':      this._drawOpening(ctx, W, H, k); break;
      case 'titleBloom':   this._drawTitle(ctx, W, H, k); break;
      case 'starfield':    /* stars handle it */ break;
      case 'leylines':     this._drawLeylines(ctx, W, H, k); break;
      case 'keepers':      this._drawKeepers(ctx, W, H, k, false); break;
      case 'vaelGrief':    this._drawVaelGrief(ctx, W, H, k); break;
      case 'vaelReaches':  this._drawVaelReaches(ctx, W, H, k); break;
      case 'rift':         this._drawRift(ctx, W, H, k); break;
      case 'sundered':     this._drawSundered(ctx, W, H, k); break;
      case 'orderFell':    this._drawOrderFell(ctx, W, H, k); break;
      case 'lyraAlone':    this._drawLyraAlone(ctx, W, H, k); break;
      case 'hollowTakes':  this._drawHollowTakes(ctx, W, H, k); break;
      case 'worldFraying': this._drawWorldFraying(ctx, W, H, k); break;
      case 'homeFalls':    this._drawHomeFalls(ctx, W, H, k); break;
      case 'heroEnter':    this._drawHeroEnter(ctx, W, H, k); break;
      case 'callToAction': this._drawCallToAction(ctx, W, H, k); break;
      case 'closingLine':  this._drawCallToAction(ctx, W, H, k); break;
      case 'titleReprise': this._drawTitleReprise(ctx, W, H, k); break;
      case 'fadeOut':      break;
    }

    // Particles always on top of scene
    this.fx.draw(ctx);

    // Narration (most phases)
    if (phase.text) this._drawNarration(ctx, W, H, phase.text, k);

    // Final fade out
    if (phase.id === 'fadeOut') {
      ctx.fillStyle = `rgba(0,0,0,${k})`;
      ctx.fillRect(0, 0, W, H);
    }

    // Skip / fast-forward hint
    if (this._ffActive) {
      ctx.fillStyle = 'rgba(255,216,77,0.95)';
      ctx.font = 'bold 13px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText('▶▶ fast-forward', W - 14, H - 14);
    } else {
      const hintAlpha = Math.max(0.15, 0.7 - this.t / 8);
      ctx.fillStyle = `rgba(255,255,255,${hintAlpha})`;
      ctx.font = '11px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText('tap to skip · hold to fast-forward', W - 14, H - 14);
    }
  }

  _phasePast(targetId, currentPhase) {
    const t = PHASES.findIndex(p => p.id === targetId);
    const c = PHASES.findIndex(p => p.id === currentPhase.id);
    return c >= t;
  }

  // ---- Background per phase -----------------------------------------------

  _drawBackground(ctx, W, H, phase, k) {
    // Pick a base color/gradient per phase, with cross-fades through k.
    let top, bot;
    switch (phase.id) {
      case 'opening':
      case 'titleBloom':
        top = '#0a0a18'; bot = '#0a0414'; break;
      case 'starfield':
        top = '#020412'; bot = '#06081e'; break;
      case 'leylines':
        top = '#08152a'; bot = '#0a1a3a'; break;
      case 'keepers':
        top = '#0a0a20'; bot = '#0a0826'; break;
      case 'vaelGrief':
        // Candle-warm sickroom, golds + sepia + sorrow.
        top = '#1a0c08'; bot = '#3a1a08'; break;
      case 'vaelReaches':
        // Tense — gold tipping into violet.
        top = `rgb(${20 + 30 * k},${10 - 8 * k},${10 + 60 * k})`;
        bot = `rgb(${40 + 60 * k},${18 - 10 * k},${20 + 80 * k})`;
        break;
      case 'rift':
        top = `rgb(${10 + 40 * k},5,${20 + 60 * k})`;
        bot = `rgb(${20 + 70 * k},5,${40 + 90 * k})`;
        break;
      case 'sundered':
        top = '#16082a'; bot = '#0a0418'; break;
      case 'orderFell':
        top = '#08081a'; bot = '#04020a'; break;
      case 'lyraAlone':
        top = '#080a20'; bot = '#0a0824'; break;
      case 'hollowTakes':
        // Cool blue-violet, swallowing toward the centre.
        top = '#0a0820'; bot = '#16082a'; break;
      case 'worldFraying':
        top = '#1a0e1e'; bot = '#080414'; break;
      case 'homeFalls':
        // Late evening: a last warm window light against deep dusk.
        top = '#08081a'; bot = '#180a14'; break;
      case 'heroEnter':
        // Dawn-ish: deep purple top, warm horizon below
        top = '#0a0822'; bot = '#3a1820'; break;
      case 'callToAction':
      case 'closingLine':
        top = '#0a0820'; bot = '#1a0a28'; break;
      case 'titleReprise':
      case 'fadeOut':
        top = '#0a0a18'; bot = '#0a0414'; break;
      default:
        top = '#0a0a18'; bot = '#0a0414';
    }
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, top);
    g.addColorStop(1, bot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  // ---- Stars (persistent, twinkle + slow drift) ---------------------------

  _initStars(W, H) {
    if (this._stars) return;
    const n = 140;
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.75,
        size: Math.random() < 0.85 ? 1 : 1.8,
        twinkle: Math.random() * Math.PI * 2,
        speed: 0.15 + Math.random() * 0.35,
        vx: -2 - Math.random() * 4,
      });
    }
    this._stars = arr;
  }

  _drawStars(ctx, W, H, phase) {
    this._initStars(W, H);
    const stars = this._stars;
    // Stars dim during the brightest phases (titleReprise) but stay alive otherwise.
    const baseAlpha = phase.id === 'titleReprise' || phase.id === 'titleBloom' ? 0.35 : 0.9;
    for (const s of stars) {
      s.x += s.vx * 0.016;
      if (s.x < -5) s.x = W + 5;
      s.twinkle += 0.016 * s.speed * 4;
      const a = baseAlpha * (0.5 + 0.5 * Math.sin(s.twinkle));
      ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---- Narration ----------------------------------------------------------

  _drawNarration(ctx, W, H, text, k) {
    // Tight fade in/out — most of each phase shows the text at full alpha so
    // long lines stay on-screen long enough to read comfortably.
    const a = k < 0.10 ? k / 0.10 : k > 0.90 ? Math.max(0, (1 - k) / 0.10) : 1;
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.textAlign = 'center';
    // Scale font with screen width so it doesn't overflow on narrow phones.
    const fontSize = Math.max(13, Math.min(17, W * 0.045));
    ctx.font = `${fontSize}px system-ui`;
    ctx.fillStyle = '#f4eecf';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 8;
    // Word-wrap each authored line to fit within 88% of the screen width.
    const wrapped = this._wrap(ctx, text, W * 0.88);
    const lineH = fontSize * 1.45;
    const baseY = H * 0.84 - (wrapped.length - 1) * lineH;
    for (let i = 0; i < wrapped.length; i++) ctx.fillText(wrapped[i], W / 2, baseY + i * lineH);
    ctx.restore();
  }

  _wrap(ctx, text, maxWidth) {
    const out = [];
    for (const line of text.split('\n')) {
      const words = line.split(' ');
      let cur = '';
      for (const w of words) {
        const test = cur ? cur + ' ' + w : w;
        if (ctx.measureText(test).width > maxWidth && cur) {
          out.push(cur);
          cur = w;
        } else {
          cur = test;
        }
      }
      if (cur) out.push(cur);
    }
    return out;
  }

  // ---- Per-phase scene draws ----------------------------------------------

  _drawOpening(ctx, W, H, k) {
    // A single point of golden light grows at center.
    const cx = W / 2, cy = H / 2;
    const r = 8 + k * 70;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2);
    g.addColorStop(0, `rgba(255,210,120,${0.85 * k})`);
    g.addColorStop(0.5, `rgba(255,160,60,${0.3 * k})`);
    g.addColorStop(1, 'rgba(255,160,60,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = `rgba(255,255,255,${k})`;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawTitle(ctx, W, H, k) {
    const cx = W / 2, cy = H * 0.42;
    const fadeIn = this._easeIn(k, 0, 0.22);
    const fadeOut = this._easeIn(k, 0.78, 1);
    const alpha = Math.max(0, fadeIn - fadeOut);
    if (alpha <= 0) return;
    // Glow behind
    const glowR = 240 * Math.min(1, k * 3);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
    g.addColorStop(0, `rgba(255,200,80,${0.32 * alpha})`);
    g.addColorStop(1, 'rgba(255,180,40,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // Letters with stagger
    ctx.save();
    const titleSize = Math.max(36, Math.min(64, W * 0.13));
    ctx.font = `bold ${titleSize}px system-ui`;
    ctx.textAlign = 'center';
    const letters = 'AETHERIA';
    const totalW = ctx.measureText(letters).width;
    let x = cx - totalW / 2;
    for (let i = 0; i < letters.length; i++) {
      const lw = ctx.measureText(letters[i]).width;
      const lf = this._easeIn(k, 0.05 + i * 0.05, 0.2 + i * 0.05);
      const yOff = (1 - lf) * 22;
      const grad = ctx.createLinearGradient(0, cy - 30, 0, cy + 20);
      grad.addColorStop(0, '#ffd84d');
      grad.addColorStop(1, '#ff7a3b');
      ctx.fillStyle = grad;
      ctx.shadowColor = '#ffae3b'; ctx.shadowBlur = 24;
      ctx.globalAlpha = alpha * lf;
      ctx.fillText(letters[i], x + lw / 2, cy + yOff);
      x += lw;
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = alpha * this._easeIn(k, 0.5, 0.75);
    ctx.fillStyle = '#cdd6e0';
    ctx.font = '14px system-ui';
    ctx.fillText('— a song forgotten —', cx, cy + 44);
    ctx.restore();

    this._once('title-bloom', () => {
      for (let i = 0; i < 26; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 40 + Math.random() * 90;
        this.fx.spawn({
          x: cx, y: cy,
          vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
          gravity: 0, drag: 1.0,
          size: 2.4, color: '#ffd84d', glow: 8,
          life: 1.4 + Math.random() * 0.7, shrink: true,
        });
      }
    });
  }

  _drawLeylines(ctx, W, H, k) {
    // SEVEN flowing leyline curves — one per element/keeper-to-come. Each its
    // own color, woven across the screen with mote streams matching the line.
    const t = this.t;
    const COLORS = ['#ffd84d','#ff8a3b','#7adaff','#ffd884','#a8ffc8','#a060ff','#9aaa5b'];
    for (let i = 0; i < 7; i++) {
      if (Math.random() < 0.35) {
        const y0 = H * (0.16 + i * 0.10);
        this.fx.spawn({
          x: -10, y: y0,
          vx: 60 + Math.random() * 80, vy: (Math.random() - 0.5) * 14,
          size: 2.0, color: COLORS[i], glow: 10,
          life: 4, shrink: false, drag: 0,
        });
      }
    }
    const alpha = 0.55 * this._bell(k, 0.5);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 1.8;
    for (let i = 0; i < 7; i++) {
      const y0 = H * (0.18 + i * 0.10);
      const wave = Math.sin(t * 1.2 + i * 0.8) * 32;
      const wave2 = Math.cos(t * 1.5 + i) * 24;
      ctx.strokeStyle = COLORS[i];
      ctx.shadowColor = COLORS[i]; ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.bezierCurveTo(W * 0.30, y0 - 50 + wave, W * 0.70, y0 + 50 - wave2, W, y0);
      ctx.stroke();
    }
    ctx.restore();
    // A subtle weaving central node — where the threads cross at the title's
    // resting height — pulses softly.
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
    const nodeAlpha = 0.18 * pulse * this._bell(k, 0.6);
    const ng = ctx.createRadialGradient(W / 2, H * 0.52, 0, W / 2, H * 0.52, 80);
    ng.addColorStop(0, `rgba(255,235,180,${nodeAlpha})`);
    ng.addColorStop(1, 'rgba(255,235,180,0)');
    ctx.fillStyle = ng;
    ctx.fillRect(0, 0, W, H);
  }

  _drawKeepers(ctx, W, H, k, corruption = false) {
    const cx = W / 2, cy = H * 0.46;
    const radius = Math.min(W, H) * 0.24;
    // Subtle heptagon connecting the keepers
    const ringAlpha = 0.32 * this._bell(k, 0.55);
    ctx.save();
    ctx.globalAlpha = ringAlpha;
    ctx.strokeStyle = '#ffd84d';
    ctx.lineWidth = 1;
    ctx.shadowColor = '#ffd84d'; ctx.shadowBlur = 6;
    ctx.beginPath();
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * radius;
      const y = cy + Math.sin(a) * radius;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    // The Order — seven robed figures, one per leyline color. Vael (top) is
    // the eldest; Lyra (lower-right at i=4) is the youngest. Each holds their
    // own implement: staff, blade, lyre, bow, censer, tome, lantern.
    const COLORS = ['#ffd84d','#ff8a3b','#7adaff','#ffd884','#a8ffc8','#a060ff','#9aaa5b'];
    const IMPL  = ['staff','blade','lyre','bow','censer','tome','lantern'];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * radius;
      const y = cy + Math.sin(a) * radius;
      const appear = this._easeIn(k, 0.10 + i * 0.06, 0.32 + i * 0.06);
      if (appear <= 0) continue;
      // Each keeper faces the center (Vael at the top, others around)
      const facing = a + Math.PI;
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = appear;
      this._drawKeeper(ctx, COLORS[i], IMPL[i], facing, this.t + i * 0.4, i === 0);
      ctx.restore();
    }
  }

  // A single keeper — robed silhouette with a colored aura and a unique
  // implement. `eldest` (Vael) is a taller silhouette.
  _drawKeeper(ctx, color, impl, facing, t, eldest = false) {
    const bob = Math.sin(t * 1.6) * 1.2;
    const h = eldest ? 26 : 22;
    // Halo behind the keeper — colored to their leyline
    const hg = ctx.createRadialGradient(0, -h * 0.3, 0, 0, -h * 0.3, h * 1.5);
    hg.addColorStop(0, this._withAlpha(color, 0.42));
    hg.addColorStop(1, this._withAlpha(color, 0));
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(0, -h * 0.3, h * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(0, bob);
    // Robe body
    ctx.fillStyle = '#08060c';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.shadowColor = color; ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(-h * 0.34, -h * 0.55);
    ctx.quadraticCurveTo(-h * 0.5, 0, -h * 0.85, h);
    ctx.lineTo(h * 0.85, h);
    ctx.quadraticCurveTo(h * 0.5, 0, h * 0.34, -h * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Hood — slight indication of cowl
    ctx.fillStyle = '#04030a';
    ctx.beginPath();
    ctx.moveTo(-h * 0.36, -h * 0.55);
    ctx.quadraticCurveTo(-h * 0.45, -h * 1.0, 0, -h * 1.05);
    ctx.quadraticCurveTo(h * 0.45, -h * 1.0, h * 0.36, -h * 0.55);
    ctx.closePath();
    ctx.fill();
    // Two faint eyes
    ctx.fillStyle = this._withAlpha(color, 0.85);
    ctx.shadowColor = color; ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(-h * 0.10, -h * 0.78, 1.4, 0, Math.PI * 2);
    ctx.arc( h * 0.10, -h * 0.78, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Implement held to the side
    const ix = Math.cos(facing) > 0 ? -h * 0.55 : h * 0.55;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.shadowColor = color; ctx.shadowBlur = 6;
    if (impl === 'staff') {
      ctx.beginPath();
      ctx.moveTo(ix, -h * 1.1);
      ctx.lineTo(ix, h * 0.5);
      ctx.stroke();
      // Crystal at the top
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(ix, -h * 1.15, 2.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (impl === 'blade') {
      ctx.beginPath();
      ctx.moveTo(ix, -h * 0.05);
      ctx.lineTo(ix, -h * 1.15);
      ctx.stroke();
      // Hilt crossbar
      ctx.beginPath();
      ctx.moveTo(ix - 4, -h * 0.05);
      ctx.lineTo(ix + 4, -h * 0.05);
      ctx.stroke();
    } else if (impl === 'lyre') {
      ctx.beginPath();
      ctx.arc(ix, -h * 0.25, 5, Math.PI, 0);
      ctx.stroke();
      // Strings
      for (let s = -2; s <= 2; s++) {
        ctx.beginPath();
        ctx.moveTo(ix + s * 1.2, -h * 0.25);
        ctx.lineTo(ix + s * 1.2, -h * 0.05);
        ctx.stroke();
      }
    } else if (impl === 'bow') {
      ctx.beginPath();
      ctx.arc(ix, -h * 0.25, 6, -1.4, 1.4);
      ctx.stroke();
      // String
      ctx.beginPath();
      ctx.moveTo(ix + 1.5, -h * 0.25 - 6);
      ctx.lineTo(ix + 1.5, -h * 0.25 + 6);
      ctx.stroke();
    } else if (impl === 'censer') {
      // A small dangling orb
      ctx.beginPath();
      ctx.moveTo(ix, -h * 0.5);
      ctx.lineTo(ix, -h * 0.05);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(ix, h * 0.05, 3, 0, Math.PI * 2);
      ctx.fill();
      // Smoke wisps
      if (Math.random() < 0.5) {
        this.fx.spawn({
          x: ix + (this.canvas.clientWidth / 2 + Math.cos(facing) * 0), y: 0,
          vx: 0, vy: -16, size: 1.2, color, glow: 4, life: 0.7, shrink: true,
        });
      }
    } else if (impl === 'tome') {
      // A small flat rectangle
      ctx.fillStyle = '#08060c';
      ctx.strokeStyle = color;
      ctx.fillRect(ix - 4, -h * 0.2, 8, 5);
      ctx.strokeRect(ix - 4, -h * 0.2, 8, 5);
      // Page glow
      ctx.fillStyle = color;
      ctx.fillRect(ix - 3, -h * 0.16, 6, 1);
    } else if (impl === 'lantern') {
      // Square lantern dangling
      ctx.beginPath();
      ctx.moveTo(ix, -h * 0.55);
      ctx.lineTo(ix, -h * 0.20);
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.strokeRect(ix - 3, -h * 0.20, 6, 6);
      // Inner glow
      const lg = ctx.createRadialGradient(ix, -h * 0.20 + 3, 0, ix, -h * 0.20 + 3, 8);
      lg.addColorStop(0, this._withAlpha(color, 0.9));
      lg.addColorStop(1, this._withAlpha(color, 0));
      ctx.fillStyle = lg;
      ctx.fillRect(ix - 8, -h * 0.20 - 3, 16, 16);
    }
    ctx.restore();
  }

  _withAlpha(hex, a) {
    const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
    if (!m) return hex;
    return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})`;
  }

  _drawCorruption(ctx, W, H, k) {
    const cx = W / 2, cy = H * 0.42;
    const radius = Math.min(W, H) * 0.22;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * radius;
      const y = cy + Math.sin(a) * radius;
      const isVael = i === 0;
      // Vael (top) corrupts; others stay gold.
      let color = '#ffd84d';
      let alpha = 0.85 + 0.15 * Math.sin(this.t * 3 + i);
      if (isVael) {
        const corrupt = this._easeIn(k, 0.25, 0.65);
        color = `rgb(${Math.floor(255 - 95 * corrupt)},${Math.floor(216 - 156 * corrupt)},${Math.floor(77 + 178 * corrupt)})`;
      }
      this._drawGlyph(ctx, x, y, 18, color, alpha);
    }
    // Snap sparks when corruption peaks
    this._once('corrupt-snap', () => null); // placeholder
    if (k > 0.3 && k < 0.55 && Math.random() < 0.45) {
      const a = -Math.PI / 2;
      const vx = cx + Math.cos(a) * radius;
      const vy = cy + Math.sin(a) * radius;
      const ang = Math.random() * Math.PI * 2;
      const sp = 30 + Math.random() * 90;
      this.fx.spawn({
        x: vx, y: vy,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        size: 1.6, color: '#a060ff', glow: 8,
        life: 0.7 + Math.random() * 0.4, shrink: true, drag: 1.5,
      });
    }
    if (k > 0.55) {
      // Cracks of darkness creep outward from Vael's glyph to the others
      const a0 = -Math.PI / 2;
      const vx = cx + Math.cos(a0) * radius;
      const vy = cy + Math.sin(a0) * radius;
      ctx.save();
      ctx.strokeStyle = `rgba(160,80,255,${(k - 0.55) * 1.2})`;
      ctx.lineWidth = 1.2;
      ctx.shadowColor = '#a060ff'; ctx.shadowBlur = 8;
      for (let i = 1; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(a) * radius;
        const y = cy + Math.sin(a) * radius;
        ctx.beginPath();
        ctx.moveTo(vx, vy);
        ctx.lineTo((vx + x) / 2 + (Math.random() - 0.5) * 6, (vy + y) / 2 + (Math.random() - 0.5) * 6);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawRift(ctx, W, H, k) {
    const cx = W / 2, cy = H * 0.46;
    // Camera shake at peak — translate the whole context
    const shake = k < 0.55 ? (k - 0.30) * 60 : (0.55 - 0.30) * 60 * Math.max(0, 1 - (k - 0.55) / 0.35);
    const sx = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    const sy = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    ctx.save();
    ctx.translate(sx, sy);
    // The rift opens horizontally — bigger this time, fills almost the screen
    const len = 80 + k * Math.max(W, H) * 0.9;
    const aura = ctx.createRadialGradient(cx, cy, 0, cx, cy, len);
    aura.addColorStop(0, `rgba(200,120,255,${0.75 * Math.min(1, k * 2)})`);
    aura.addColorStop(0.5, `rgba(100,40,180,${0.4 * Math.min(1, k * 2)})`);
    aura.addColorStop(1, 'rgba(40,10,80,0)');
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, W, H);
    // Main jagged crack — wider, longer, with branching forks
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.12);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.shadowColor = '#a060ff'; ctx.shadowBlur = 34;
    ctx.beginPath();
    let x = -len / 2;
    ctx.moveTo(x, 0);
    const segs = 22;
    const verts = [];
    for (let i = 1; i <= segs; i++) {
      const tt = i / segs;
      x = -len / 2 + tt * len;
      const y = (Math.random() - 0.5) * 36 * Math.sin(tt * Math.PI);
      verts.push([x, y]);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    // Inner glow — second pass with thinner brighter stroke
    ctx.strokeStyle = '#f4e8ff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(-len / 2, 0);
    for (const [vx, vy] of verts) ctx.lineTo(vx, vy);
    ctx.stroke();
    // Branching forks coming off the main crack
    if (k > 0.45) {
      ctx.strokeStyle = `rgba(208,160,255,${(k - 0.45) * 1.4})`;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 18;
      for (let f = 0; f < 5; f++) {
        const base = verts[Math.floor(Math.random() * verts.length)];
        const bx = base[0], by = base[1];
        const dir = Math.random() < 0.5 ? -1 : 1;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        let fx = bx, fy = by;
        for (let s = 0; s < 5; s++) {
          fx += (Math.random() - 0.5) * 20;
          fy += dir * (8 + Math.random() * 12);
          ctx.lineTo(fx, fy);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
    // Continuously belch dark particles
    if (Math.random() < 0.6 + k * 0.4) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 220;
      this.fx.spawn({
        x: cx, y: cy,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        gravity: 30, drag: 0.5,
        size: 2 + Math.random() * 3,
        color: ['#a060ff','#6020a0','#d0a0ff','#ffffff'][Math.floor(Math.random() * 4)],
        life: 1.4 + Math.random() * 0.8, shrink: true, glow: 9,
      });
    }
    // One huge shockwave at peak + a deep audio chord
    if (k > 0.32 && !this._spawnedBeats.has('rift-bang')) {
      this._spawnedBeats.add('rift-bang');
      this.fx.shockwave(cx, cy, '#a060ff', Math.max(W, H), 1.2);
      this.fx.shockwave(cx, cy, '#ffffff', Math.max(W, H) * 0.6, 0.9);
      audio.play('doomKnell');
      audio.play('magic');
    }
    // A second secondary shockwave near the end — the tearing aftershock
    if (k > 0.65 && !this._spawnedBeats.has('rift-after')) {
      this._spawnedBeats.add('rift-after');
      this.fx.shockwave(cx, cy, '#6020a0', Math.max(W, H) * 0.7, 0.9);
      audio.play('aetherWail');
    }
    ctx.restore();
  }

  _drawSundered(ctx, W, H, k) {
    // Silhouette of Vael becoming the Sundered — robed figure at center
    // fragments into orbiting shards. Bigger violent split this time.
    const cx = W / 2, cy = H * 0.55;
    // Hard floor glow (the Sundered's signature)
    ctx.save();
    const fg = ctx.createRadialGradient(cx, cy + 90, 0, cx, cy + 90, 260);
    fg.addColorStop(0, `rgba(170,80,255,${0.5 * this._bell(k, 0.6)})`);
    fg.addColorStop(1, 'rgba(170,80,255,0)');
    ctx.fillStyle = fg;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    // Tall column of violet light behind the figure — they're not quite of
    // this world anymore.
    const colAlpha = 0.42 * this._bell(k, 0.55);
    const colG = ctx.createLinearGradient(cx, 0, cx, H);
    colG.addColorStop(0, `rgba(120,40,180,0)`);
    colG.addColorStop(0.5, `rgba(170,80,255,${colAlpha})`);
    colG.addColorStop(1, `rgba(80,20,160,0)`);
    ctx.save();
    ctx.fillStyle = colG;
    ctx.fillRect(cx - 60, 0, 120, H);
    ctx.restore();
    // Body of Vael — fragmenting silhouette
    const split = this._easeIn(k, 0.20, 0.85);
    const wobble = Math.sin(this.t * 6) * (0.3 + split * 1.2);
    ctx.save();
    ctx.translate(cx + wobble, cy);
    // Hooded body
    ctx.fillStyle = `rgba(20,8,30,${1 - split * 0.45})`;
    ctx.strokeStyle = '#a060ff';
    ctx.lineWidth = 1.4;
    ctx.shadowColor = '#a060ff'; ctx.shadowBlur = 16 + split * 14;
    const r = 70;
    ctx.beginPath();
    ctx.moveTo(-r * 0.40, -r * 1.0);
    ctx.bezierCurveTo(-r * 0.55, -r * 0.3, -r * 0.95, r * 0.5, -r * 1.10, r * 1.1);
    ctx.lineTo(r * 1.10, r * 1.1);
    ctx.bezierCurveTo(r * 0.95, r * 0.5, r * 0.55, -r * 0.3, r * 0.40, -r * 1.0);
    ctx.quadraticCurveTo(0, -r * 1.35, -r * 0.40, -r * 1.0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Glitchy slashes through the body — gaps where it's already breaking
    if (split > 0.15) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      const slashes = Math.floor(2 + split * 5);
      for (let s = 0; s < slashes; s++) {
        const sy = -r * 0.8 + Math.random() * r * 1.8;
        ctx.fillStyle = '#000';
        ctx.fillRect(-r * 1.1, sy, r * 2.2, 1.5 + Math.random() * 2);
      }
      ctx.restore();
    }
    // Two burning eyes inside the hood — pulse stronger as it splits
    const eyeGlow = 0.7 + 0.3 * Math.sin(this.t * 8) + split * 0.4;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#a060ff'; ctx.shadowBlur = 18 + split * 18;
    ctx.beginPath();
    ctx.arc(-r * 0.16, -r * 0.85, 3 + split, 0, Math.PI * 2);
    ctx.arc(r * 0.16, -r * 0.85, 3 + split, 0, Math.PI * 2);
    ctx.fill();
    // A third eye opens midway through the split — the Sundered is no longer
    // limited to one face.
    if (split > 0.55) {
      const ta = (split - 0.55) / 0.45;
      ctx.globalAlpha = ta;
      ctx.beginPath();
      ctx.arc(0, -r * 1.05, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    // As split rises, shards drift outward — bigger and more numerous now
    if (split > 0.05 && Math.random() < split * 1.2) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 30 + split * 140;
      this.fx.spawn({
        x: cx + (Math.random() - 0.5) * 60,
        y: cy + (Math.random() - 0.5) * 110,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 24,
        gravity: 8, drag: 0.4,
        size: 3.4, color: '#a060ff', glow: 12,
        life: 1.8, shrink: true, shape: 'diamond',
        rot: ang, rotVel: 1 + Math.random() * 3,
      });
    }
    // A few rare WHITE shards — the broken song fragments
    if (split > 0.4 && Math.random() < 0.18) {
      const ang = Math.random() * Math.PI * 2;
      this.fx.spawn({
        x: cx, y: cy - r * 0.4,
        vx: Math.cos(ang) * 90, vy: Math.sin(ang) * 90 - 30,
        gravity: 10, drag: 0.5,
        size: 2.4, color: '#f4e8ff', glow: 14,
        life: 1.6, shrink: true, shape: 'diamond',
        rot: ang, rotVel: 2 + Math.random() * 4,
      });
    }
    // One-shot sundering audio at peak
    if (split > 0.5 && !this._spawnedBeats.has('sundered-emerge')) {
      this._spawnedBeats.add('sundered-emerge');
      audio.play('voidHum');
      audio.play('doomKnell');
    }
  }

  _drawOrderFell(ctx, W, H, k) {
    const cx = W / 2, cy = H * 0.46;
    const radius = Math.min(W, H) * 0.24;
    const COLORS = ['#ffd84d','#ff8a3b','#7adaff','#ffd884','#a8ffc8','#a060ff','#9aaa5b'];
    const IMPL  = ['staff','blade','lyre','bow','censer','tome','lantern'];
    // Vael's glyph stays violet at the top. Six others fall one by one with
    // a flash of light and a downward streak — they're being CLAIMED by the
    // wound they're trying to mend, not just dimming.
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * radius;
      const y = cy + Math.sin(a) * radius;
      if (i === 0) {
        // Vael — distant violet silhouette, the wound at the top of the circle
        const facing = a + Math.PI;
        ctx.save();
        ctx.translate(x, y);
        this._drawKeeper(ctx, '#a060ff', 'staff', facing, this.t, true);
        ctx.restore();
        continue;
      }
      // Falling order — start with i=4 (Lyra's slot) at the END so she's the
      // last to fall, but we ALSO want to NOT kill her in this phase. Skip
      // i=4 here so she survives into the next phase.
      if (i === 4) {
        // Lyra still alive — drawn as a small white-glowing keeper
        const facing = a + Math.PI;
        ctx.save();
        ctx.translate(x, y);
        this._drawKeeper(ctx, COLORS[i], IMPL[i], facing, this.t, false);
        ctx.restore();
        continue;
      }
      // 5 keepers fall — indices 1, 2, 3, 5, 6. Re-map to a fall order so
      // the closest-to-Vael falls first.
      const fallOrder = { 1: 0, 6: 1, 2: 2, 5: 3, 3: 4 };
      const idx = fallOrder[i];
      const fallStart = idx / 5 * 0.78;
      const fallEnd   = fallStart + 0.12;
      const lifespan = 1 - this._easeIn(k, fallStart, fallEnd);
      const facing = a + Math.PI;
      if (lifespan > 0.04) {
        ctx.save();
        ctx.translate(x, y);
        ctx.globalAlpha = lifespan;
        this._drawKeeper(ctx, COLORS[i], IMPL[i], facing, this.t, false);
        ctx.restore();
      } else if (lifespan > -0.05) {
        // Flash of light at the exact moment of fall — once-per-keeper
        const key = 'fall-' + i;
        if (!this._spawnedBeats.has(key)) {
          this._spawnedBeats.add(key);
          this.fx.shockwave(x, y, COLORS[i], 70, 0.6);
          for (let s = 0; s < 14; s++) {
            const ang = Math.random() * Math.PI * 2;
            const sp = 40 + Math.random() * 110;
            this.fx.spawn({
              x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 20,
              gravity: 30, drag: 0.4,
              size: 1.8, color: COLORS[i], glow: 10,
              life: 1.4, shrink: true,
            });
          }
          audio.play('hurt');
          audio.play('crit');
        }
      }
      // Drift dust upward from the empty spot afterward
      if (lifespan <= 0 && Math.random() < 0.25) {
        this.fx.spawn({
          x, y, vx: (Math.random() - 0.5) * 16, vy: -16 - Math.random() * 16,
          gravity: 4, drag: 0.3,
          size: 1.4, color: COLORS[i], glow: 6,
          life: 1.0, shrink: true,
        });
      }
    }
    // Dim heptagon ring with violet creeping into it as keepers fall
    const ringAlpha = 0.18 * (1 - k * 0.5);
    ctx.save();
    ctx.globalAlpha = ringAlpha;
    ctx.strokeStyle = '#a060ff';
    ctx.lineWidth = 1;
    ctx.shadowColor = '#a060ff'; ctx.shadowBlur = 6;
    ctx.beginPath();
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * radius;
      const y = cy + Math.sin(a) * radius;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  _drawLyraAlone(ctx, W, H, k) {
    const cx = W / 2, cy = H * 0.42;
    // Just Vael's distant violet glyph at the top — a single point of corruption
    // in the dark.
    this._drawGlyph(ctx, cx, cy - Math.min(W, H) * 0.32, 11, '#a060ff', 0.45);

    // BUST PORTRAIT — head + shoulders + upper chest only. The frame cuts off
    // just below the collarbone so the robe doesn't dominate.
    const fade = this._easeIn(k, 0.05, 0.45);
    // hr = head radius, the unit everything scales from.
    const hr = Math.min(W, H) * 0.075;
    const lcx = cx;
    const lcy = cy + Math.min(W, H) * 0.04;
    ctx.save();
    ctx.globalAlpha = fade;

    // Halo behind her shoulders — soft white-green pulse.
    const pulse = 0.5 + 0.5 * Math.sin(this.t * 2.2);
    const halo = ctx.createRadialGradient(lcx, lcy + hr, 0, lcx, lcy + hr, hr * 5.5);
    halo.addColorStop(0, `rgba(200,255,220,${0.35 * pulse})`);
    halo.addColorStop(1, 'rgba(200,255,220,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);

    // ---- White Mage hood — draped cowl, drawn FIRST so face sits on top ---
    // Soft off-white, distinguished from the robe's brighter white by a faint
    // warm cast so the hood reads as its own garment layer.
    const hoodG = ctx.createLinearGradient(0, lcy - hr * 1.5, 0, lcy + hr * 4.5);
    hoodG.addColorStop(0, '#fbf8ee');
    hoodG.addColorStop(1, '#bcb8ac');
    ctx.fillStyle = hoodG;
    ctx.beginPath();
    // Bottom-left of left drape (covered by robe shoulder below)
    ctx.moveTo(lcx - hr * 1.85, lcy + hr * 4.50);
    // Up the outside of the left drape, narrowing toward the head
    ctx.bezierCurveTo(
      lcx - hr * 1.95, lcy + hr * 2.40,
      lcx - hr * 1.55, lcy + hr * 0.80,
      lcx - hr * 1.40, lcy - hr * 0.20
    );
    // Up over the head — fitted cowl dome that hugs the crown (peak just
    // above the head ellipse top at -1.00hr) instead of standing tall like
    // a tomb. Wider temple endpoints frame the face naturally.
    ctx.quadraticCurveTo(lcx, lcy - hr * 1.20, lcx + hr * 1.40, lcy - hr * 0.20);
    // Down the right drape, widening to shoulder
    ctx.bezierCurveTo(
      lcx + hr * 1.55, lcy + hr * 0.80,
      lcx + hr * 1.95, lcy + hr * 2.40,
      lcx + hr * 1.85, lcy + hr * 4.50
    );
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#7a7a88';
    ctx.lineWidth = 1.0;
    ctx.stroke();
    // Inner shadow along the face opening — soft warm shadow ring tight to
    // the (smaller) face inset so the hood reads as recessed around the face.
    const cowlShade = ctx.createRadialGradient(lcx, lcy + hr * 0.08, hr * 0.62, lcx, lcy + hr * 0.08, hr * 1.10);
    cowlShade.addColorStop(0, 'rgba(60, 50, 40, 0.55)');
    cowlShade.addColorStop(1, 'rgba(60, 50, 40, 0)');
    ctx.fillStyle = cowlShade;
    ctx.beginPath();
    ctx.ellipse(lcx, lcy + hr * 0.08, hr * 1.05, hr * 1.15, 0, 0, Math.PI * 2);
    ctx.fill();
    // Soft gold trim along the face opening — top half of an ellipse just
    // outside the face inset (radii 0.60/0.72) so the trim sits flush at the
    // hood-meets-face boundary.
    ctx.strokeStyle = '#ffd884';
    ctx.lineWidth = 1.6;
    ctx.shadowColor = '#ffd884'; ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.ellipse(lcx, lcy + hr * 0.08, hr * 0.68, hr * 0.82, 0, Math.PI, Math.PI * 2, false);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // ---- Shoulders + upper chest — bust crop, robe just at frame edge -----
    const robeG = ctx.createLinearGradient(0, lcy + hr * 1.6, 0, lcy + hr * 5.0);
    robeG.addColorStop(0, '#f0f0f4');
    robeG.addColorStop(1, '#6a6a78');
    ctx.fillStyle = robeG;
    ctx.beginPath();
    // Left shoulder slope
    ctx.moveTo(lcx - hr * 1.70, lcy + hr * 4.50);
    ctx.bezierCurveTo(lcx - hr * 1.80, lcy + hr * 2.80, lcx - hr * 1.30, lcy + hr * 1.85, lcx - hr * 0.85, lcy + hr * 1.65);
    // Neckline up-and-V
    ctx.quadraticCurveTo(lcx - hr * 0.50, lcy + hr * 1.50, lcx - hr * 0.30, lcy + hr * 1.55);
    ctx.lineTo(lcx, lcy + hr * 2.20);
    ctx.lineTo(lcx + hr * 0.30, lcy + hr * 1.55);
    ctx.quadraticCurveTo(lcx + hr * 0.50, lcy + hr * 1.50, lcx + hr * 0.85, lcy + hr * 1.65);
    // Right shoulder slope
    ctx.bezierCurveTo(lcx + hr * 1.30, lcy + hr * 1.85, lcx + hr * 1.80, lcy + hr * 2.80, lcx + hr * 1.70, lcy + hr * 4.50);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#3a3a48';
    ctx.lineWidth = 1.0;
    ctx.stroke();
    // Pale gold collar trim along the V
    ctx.strokeStyle = '#ffd884';
    ctx.lineWidth = 1.4;
    ctx.shadowColor = '#ffd884'; ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.moveTo(lcx - hr * 0.30, lcy + hr * 1.55);
    ctx.lineTo(lcx, lcy + hr * 2.20);
    ctx.lineTo(lcx + hr * 0.30, lcy + hr * 1.55);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // ---- Neck ---------------------------------------------------------------
    ctx.fillStyle = '#e8c0a0';
    ctx.beginPath();
    ctx.moveTo(lcx - hr * 0.30, lcy + hr * 0.65);
    ctx.lineTo(lcx - hr * 0.36, lcy + hr * 1.55);
    ctx.lineTo(lcx + hr * 0.36, lcy + hr * 1.55);
    ctx.lineTo(lcx + hr * 0.30, lcy + hr * 0.65);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#9a6a3a';
    ctx.lineWidth = 0.6;
    ctx.stroke();
    // Shadow under chin
    ctx.fillStyle = 'rgba(110,70,40,0.35)';
    ctx.beginPath();
    ctx.ellipse(lcx, lcy + hr * 0.70, hr * 0.34, hr * 0.10, 0, 0, Math.PI * 2);
    ctx.fill();

    // ---- Face inset — smaller oval peering out from inside the hood, so the
    // hood silhouette frames the face and there's no "head" geometry above
    // the bangs to leak through as bald skin. Mirrors the in-game White-Mage
    // pattern (drawWhiteMage in heroSprites.js).
    ctx.fillStyle = '#f4d8b8';
    ctx.beginPath();
    ctx.ellipse(lcx, lcy + hr * 0.08, hr * 0.60, hr * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#9a6a3a';
    ctx.lineWidth = 0.6;
    ctx.stroke();
    // Brown hair wisps peeking out at the temples — visible under the hood
    // edge so she clearly has hair, not a bare scalp.
    ctx.fillStyle = '#6a4a30';
    ctx.beginPath();
    ctx.ellipse(lcx - hr * 0.58, lcy - hr * 0.05, hr * 0.10, hr * 0.22, -0.35, 0, Math.PI * 2);
    ctx.ellipse(lcx + hr * 0.58, lcy - hr * 0.05, hr * 0.10, hr * 0.22, 0.35, 0, Math.PI * 2);
    ctx.fill();

    // ---- Eyes — almond shape, pale green, calm ----------------------------
    const blink = Math.sin(this.t * 0.6) > 0.985 ? 0.1 : 1;
    // Whites
    ctx.fillStyle = '#f4e8e0';
    ctx.beginPath();
    ctx.ellipse(lcx - hr * 0.28, lcy - hr * 0.05, hr * 0.16, hr * 0.10 * blink, 0, 0, Math.PI * 2);
    ctx.ellipse(lcx + hr * 0.28, lcy - hr * 0.05, hr * 0.16, hr * 0.10 * blink, 0, 0, Math.PI * 2);
    ctx.fill();
    // Iris
    ctx.fillStyle = '#3a6a4a';
    ctx.beginPath();
    ctx.ellipse(lcx - hr * 0.28, lcy - hr * 0.05, hr * 0.09, hr * 0.10 * blink, 0, 0, Math.PI * 2);
    ctx.ellipse(lcx + hr * 0.28, lcy - hr * 0.05, hr * 0.09, hr * 0.10 * blink, 0, 0, Math.PI * 2);
    ctx.fill();
    // Pupil
    if (blink > 0.5) {
      ctx.fillStyle = '#0a1a0a';
      ctx.beginPath();
      ctx.arc(lcx - hr * 0.28, lcy - hr * 0.05, hr * 0.04, 0, Math.PI * 2);
      ctx.arc(lcx + hr * 0.28, lcy - hr * 0.05, hr * 0.04, 0, Math.PI * 2);
      ctx.fill();
      // Catchlight
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(lcx - hr * 0.26, lcy - hr * 0.07, hr * 0.018, 0, Math.PI * 2);
      ctx.arc(lcx + hr * 0.30, lcy - hr * 0.07, hr * 0.018, 0, Math.PI * 2);
      ctx.fill();
    }
    // Brow lines — gently arched
    ctx.strokeStyle = '#5a4a38';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(lcx - hr * 0.42, lcy - hr * 0.30);
    ctx.quadraticCurveTo(lcx - hr * 0.28, lcy - hr * 0.36, lcx - hr * 0.12, lcy - hr * 0.30);
    ctx.moveTo(lcx + hr * 0.12, lcy - hr * 0.30);
    ctx.quadraticCurveTo(lcx + hr * 0.28, lcy - hr * 0.36, lcx + hr * 0.42, lcy - hr * 0.30);
    ctx.stroke();
    // Nose
    ctx.strokeStyle = 'rgba(120,80,40,0.50)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(lcx, lcy + hr * 0.10);
    ctx.quadraticCurveTo(lcx + hr * 0.04, lcy + hr * 0.20, lcx + hr * 0.05, lcy + hr * 0.28);
    ctx.stroke();
    // Mouth — slight curve, set but not severe
    ctx.strokeStyle = '#9a4a28';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(lcx - hr * 0.13, lcy + hr * 0.50);
    ctx.quadraticCurveTo(lcx, lcy + hr * 0.54, lcx + hr * 0.13, lcy + hr * 0.50);
    ctx.stroke();

    // ---- Staff — diagonal across the right shoulder, partly behind hair ---
    ctx.strokeStyle = '#c8d0d8';
    ctx.lineWidth = 2.8;
    ctx.shadowColor = '#ffd884'; ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(lcx + hr * 2.30, lcy - hr * 1.40);
    ctx.lineTo(lcx + hr * 1.30, lcy + hr * 4.50);
    ctx.stroke();
    // Gem at top
    ctx.fillStyle = '#a8ffc8';
    ctx.shadowColor = '#a8ffc8'; ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(lcx + hr * 2.30, lcy - hr * 1.40, hr * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
    // Slow ambient healing motes drifting AROUND her, not pooling at feet.
    // Spawn from random positions on a ring around her so they don't form a
    // floor puddle that reads as a pedestal.
    if (Math.random() < 0.5) {
      const hr = Math.min(W, H) * 0.075;
      const ang = Math.random() * Math.PI * 2;
      const radius = hr * (1.4 + Math.random() * 3.0);
      this.fx.spawn({
        x: lcx + Math.cos(ang) * radius,
        y: lcy + Math.sin(ang) * radius * 0.7,
        vx: (Math.random() - 0.5) * 8, vy: -10 - Math.random() * 14,
        gravity: -2, drag: 0.4,
        size: 1.4, color: '#a8ffc8', glow: 6,
        life: 1.6, shrink: false,
      });
    }
  }

  _drawWorldFraying(ctx, W, H, k) {
    // A landscape silhouette with cracks of violet light leaking through.
    this._drawLandscape(ctx, W, H, 0.62, '#06030a');
    // Cracks grow over time — start short, lengthen toward end.
    const grow = this._easeIn(k, 0.05, 0.85);
    const crackSeeds = [
      [W * 0.18, H * 0.72, W * 0.28, H * (0.72 + 0.23 * grow)],
      [W * 0.45, H * 0.70, W * 0.40, H * (0.70 + 0.25 * grow)],
      [W * 0.70, H * 0.74, W * 0.78, H * (0.74 + 0.21 * grow)],
      [W * 0.88, H * 0.70, W * 0.95, H * (0.70 + 0.22 * grow)],
      // Two extras that grow in later — sky cracks visible above the horizon.
      [W * 0.32, H * 0.40, W * 0.36, H * (0.40 - 0.30 * grow)],
      [W * 0.62, H * 0.42, W * 0.58, H * (0.42 - 0.28 * grow)],
    ];
    ctx.save();
    ctx.strokeStyle = `rgba(170,80,255,${0.65 * this._bell(k, 0.55)})`;
    ctx.shadowColor = '#a060ff'; ctx.shadowBlur = 12;
    ctx.lineWidth = 2;
    for (const [x1, y1, x2, y2] of crackSeeds) {
      const segs = 6;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      for (let i = 1; i <= segs; i++) {
        const tt = i / segs;
        const mx = x1 + (x2 - x1) * tt + (Math.random() - 0.5) * 12;
        const my = y1 + (y2 - y1) * tt;
        ctx.lineTo(mx, my);
      }
      ctx.stroke();
    }
    ctx.restore();
    // Far distant rift glow on the horizon
    const rx = W * 0.6, ry = H * 0.55;
    const rg = ctx.createRadialGradient(rx, ry, 0, rx, ry, 90);
    rg.addColorStop(0, `rgba(170,80,255,${0.55 * this._bell(k, 0.6)})`);
    rg.addColorStop(1, 'rgba(60,20,120,0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(rx, ry, 90, 0, Math.PI * 2);
    ctx.fill();
    // Falling embers from the cracks
    if (Math.random() < 0.6) {
      const i = Math.floor(Math.random() * crackSeeds.length);
      const [x1, y1] = crackSeeds[i];
      this.fx.spawn({
        x: x1 + (Math.random() - 0.5) * 20, y: y1,
        vx: 0, vy: -10 - Math.random() * 20,
        gravity: 0, drag: 0.4,
        size: 1.4, color: '#d0a0ff', glow: 8,
        life: 1.6, shrink: true,
      });
    }
  }

  // Vael at his wife's bedside — a single candle, a figure under a blanket,
  // Vael's shoulders slumped beside her. The Aether tempts him from above
  // as a downward stream of gold motes.
  _drawVaelGrief(ctx, W, H, k) {
    const cx = W / 2, cy = H * 0.55;
    // Stone-cottage interior silhouette: floor + a window frame in the back.
    ctx.fillStyle = '#0a0610';
    ctx.fillRect(0, H * 0.78, W, H);
    // Window with a faint cold sky outside (back wall hint).
    const winW = W * 0.18, winH = H * 0.16;
    const winX = cx - winW / 2, winY = H * 0.32;
    ctx.fillStyle = '#1a1828';
    ctx.fillRect(winX, winY, winW, winH);
    // Window grid bars
    ctx.strokeStyle = '#04030a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(winX + winW / 2, winY); ctx.lineTo(winX + winW / 2, winY + winH);
    ctx.moveTo(winX, winY + winH / 2); ctx.lineTo(winX + winW, winY + winH / 2);
    ctx.stroke();
    // The bed — a flat horizontal slab.
    const bedY = H * 0.72;
    const bedX = cx - W * 0.20;
    const bedW = W * 0.40;
    ctx.fillStyle = '#1a1018';
    ctx.fillRect(bedX, bedY, bedW, H * 0.06);
    // The dying figure under a blanket — a soft hump.
    ctx.fillStyle = '#3a2218';
    ctx.beginPath();
    ctx.ellipse(cx, bedY + H * 0.005, bedW * 0.42, H * 0.025, 0, 0, Math.PI * 2);
    ctx.fill();
    // Her head on the pillow — pale.
    ctx.fillStyle = '#d8b8a0';
    ctx.beginPath();
    ctx.arc(cx + bedW * 0.32, bedY + H * 0.005, 7, 0, Math.PI * 2);
    ctx.fill();
    // Vael — a kneeling silhouette beside the bed, shoulders bowed.
    const vx = cx - bedW * 0.34, vy = bedY + H * 0.005;
    const breathe = Math.sin(this.t * 1.4) * 0.6;
    ctx.save();
    ctx.translate(vx, vy + breathe);
    // Body: hunched, head bowed deeply.
    ctx.fillStyle = '#06040c';
    ctx.beginPath();
    ctx.moveTo(-12, -2);
    ctx.bezierCurveTo(-22, -14, -16, -38, -2, -42);
    ctx.bezierCurveTo(12, -38, 18, -14, 12, -2);
    ctx.lineTo(14, 6);
    ctx.lineTo(-14, 6);
    ctx.closePath();
    ctx.fill();
    // Head — bowed, almost touching her hand.
    ctx.beginPath();
    ctx.arc(0, -44, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Candle on a small table behind Vael — flickering warm glow.
    const candX = cx - W * 0.32, candY = bedY - H * 0.04;
    const flicker = 0.85 + 0.15 * Math.sin(this.t * 14 + Math.random());
    const cg = ctx.createRadialGradient(candX, candY, 0, candX, candY, 110 * flicker);
    cg.addColorStop(0, `rgba(255,200,90,${0.55 * flicker})`);
    cg.addColorStop(0.5, `rgba(255,140,60,${0.18 * flicker})`);
    cg.addColorStop(1, 'rgba(255,140,60,0)');
    ctx.fillStyle = cg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = `rgba(255,220,140,${flicker})`;
    ctx.beginPath();
    ctx.ellipse(candX, candY, 2.2, 4 * flicker, 0, 0, Math.PI * 2);
    ctx.fill();
    // Aether tempts him — a downward stream of gold motes from the window
    // pooling toward Vael, growing more insistent through the phase.
    const tempt = this._easeIn(k, 0.15, 0.95);
    if (Math.random() < 0.55 + tempt * 0.4) {
      const sx = winX + Math.random() * winW;
      const sy = winY + winH * 0.6;
      this.fx.spawn({
        x: sx, y: sy,
        vx: (vx + 0 - sx) * 0.4 / 1, vy: (vy - sy) * 0.6 / 1,
        gravity: 0, drag: 0.4,
        size: 1.6, color: '#ffd84d', glow: 8,
        life: 1.3, shrink: true,
      });
    }
    // Brief once-off lyrical sting at the temptation peak.
    if (tempt > 0.45 && !this._spawnedBeats.has('grief-sting')) {
      this._spawnedBeats.add('grief-sting');
      audio.play('chime');
    }
  }

  // Vael reaches into the song — his silhouette stands; one hand lifts; a
  // golden thread comes down into his palm; the thread brightens, then begins
  // to fray and turn violet. The fracture point of the whole intro.
  _drawVaelReaches(ctx, W, H, k) {
    const cx = W / 2, cy = H * 0.62;
    // Hard floor shadow
    ctx.fillStyle = '#04030a';
    ctx.fillRect(0, H * 0.84, W, H);
    // Vael stands, arms slightly raised. Tall, defiant silhouette.
    const stand = this._easeIn(k, 0.0, 0.35);
    const armUp = this._easeIn(k, 0.18, 0.55);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(stand, stand);
    // Body
    ctx.fillStyle = '#06040c';
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.bezierCurveTo(-28, -20, -22, -68, -4, -76);
    ctx.bezierCurveTo(18, -70, 26, -22, 16, 0);
    ctx.lineTo(20, 60);
    ctx.lineTo(-20, 60);
    ctx.closePath();
    ctx.fill();
    // Head
    ctx.beginPath();
    ctx.arc(0, -84, 14, 0, Math.PI * 2);
    ctx.fill();
    // Reaching arm — rises with armUp
    const armX = 18 - armUp * 4;
    const armY = -36 - armUp * 60;
    ctx.strokeStyle = '#06040c';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(8, -52);
    ctx.lineTo(armX, armY);
    ctx.stroke();
    // Hand (a small open dot)
    ctx.fillStyle = '#06040c';
    ctx.beginPath();
    ctx.arc(armX, armY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // The thread coming down from above into his hand. Gold at first, then
    // fraying into violet at the catch point.
    const reach = this._easeIn(k, 0.18, 0.55);
    const corrupt = this._easeIn(k, 0.55, 0.95);
    const handX = cx + (18 - armUp * 4);
    const handY = cy + (-36 - armUp * 60);
    if (reach > 0) {
      ctx.save();
      ctx.lineWidth = 2.2 + 1.6 * reach;
      ctx.lineCap = 'round';
      const grad = ctx.createLinearGradient(handX, 0, handX, handY);
      grad.addColorStop(0, '#ffd84d');
      grad.addColorStop(1, corrupt > 0.05
        ? `rgba(${Math.floor(255 - 95 * corrupt)},${Math.floor(216 - 156 * corrupt)},${Math.floor(77 + 178 * corrupt)},1)`
        : '#ffd84d');
      ctx.strokeStyle = grad;
      ctx.shadowColor = corrupt > 0.5 ? '#a060ff' : '#ffd84d';
      ctx.shadowBlur = 18 + 14 * reach;
      ctx.beginPath();
      // Jittered descent to suggest tension.
      const segs = 18;
      ctx.moveTo(handX + (Math.random() - 0.5) * 2 * corrupt, 0);
      for (let i = 1; i <= segs; i++) {
        const tt = i / segs;
        const x = handX + Math.sin(tt * 8 + this.t * 4) * (1.5 + corrupt * 6) * tt;
        const y = handY * tt;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }
    // Sparks at the catch point — gold turning violet.
    if (reach > 0.4 && Math.random() < 0.7) {
      const col = corrupt > 0.5
        ? ['#a060ff','#6020a0','#d0a0ff'][Math.floor(Math.random() * 3)]
        : '#ffd84d';
      const ang = Math.random() * Math.PI * 2;
      const sp = 30 + Math.random() * 80;
      this.fx.spawn({
        x: handX, y: handY,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 20,
        gravity: 8, drag: 0.5,
        size: 1.6, color: col, glow: 8,
        life: 0.8, shrink: true,
      });
    }
    // The moment of defiance — a held audio note that drops into rumble.
    if (corrupt > 0.4 && !this._spawnedBeats.has('reach-rumble')) {
      this._spawnedBeats.add('reach-rumble');
      audio.play('rift');
      audio.play('aetherWail');
    }
  }

  // Lyra walks alone into the Hollow — a wide violet doorway (the rift) opens
  // and she steps into it. The screen darkens as she enters.
  _drawHollowTakes(ctx, W, H, k) {
    const cx = W / 2, cy = H * 0.56;
    // The Hollow — a tall ovoid violet portal at center, growing through the phase.
    const open = this._easeIn(k, 0.0, 0.4);
    const swallow = this._easeIn(k, 0.65, 1.0);
    const r = 30 + open * 110;
    const portalAlpha = 0.4 + 0.4 * open;
    const portalG = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    portalG.addColorStop(0, `rgba(120,40,180,${portalAlpha})`);
    portalG.addColorStop(0.7, `rgba(60,20,100,${0.6 * portalAlpha})`);
    portalG.addColorStop(1, 'rgba(20,8,40,0)');
    ctx.save();
    ctx.fillStyle = portalG;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.7, r, 0, 0, Math.PI * 2);
    ctx.fill();
    // Faint violet halo behind it
    const halo = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 1.6);
    halo.addColorStop(0, `rgba(170,80,255,${0.3 * open})`);
    halo.addColorStop(1, 'rgba(170,80,255,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    // Jagged violet edge runes around the portal lip
    ctx.save();
    ctx.strokeStyle = `rgba(208,160,255,${0.5 * open})`;
    ctx.lineWidth = 1.6;
    ctx.shadowColor = '#a060ff'; ctx.shadowBlur = 10;
    ctx.beginPath();
    for (let i = 0; i < 32; i++) {
      const ang = (i / 32) * Math.PI * 2 + Math.sin(this.t * 0.6 + i) * 0.04;
      const rr = r * (0.95 + Math.sin(i * 1.3 + this.t * 2) * 0.05);
      const x = cx + Math.cos(ang) * rr * 0.7;
      const y = cy + Math.sin(ang) * rr;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    // Lyra walks in from the left, approaches the portal, then is swallowed.
    const walk = this._easeIn(k, 0.10, 0.70);
    const lx = W * 0.15 + (cx - W * 0.15) * walk;
    const ly = cy + 60;
    if (walk > 0.02 && swallow < 0.95) {
      const fade = 1 - swallow;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(lx, ly);
      // Slight pause at the lip before stepping in
      const facing = walk > 0.85 ? -Math.PI / 2 : 0;
      drawHero(ctx, 'white', this.t, 12, { facing, walking: walk < 0.85 });
      ctx.restore();
      // Healing motes trailing her
      if (Math.random() < 0.55) {
        this.fx.spawn({
          x: lx, y: ly + 4, vx: 0, vy: -10,
          size: 1.4, color: '#a8ffc8', glow: 6,
          life: 1.2, shrink: false, drag: 0.2,
        });
      }
    }
    // At swallow peak, violet motes pour OUT for a moment — the Hollow tasting her.
    if (swallow > 0 && swallow < 0.6 && Math.random() < 0.7) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
      const sp = 40 + Math.random() * 80;
      this.fx.spawn({
        x: cx, y: cy,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        gravity: 20, drag: 0.6,
        size: 1.8, color: '#a060ff', glow: 10,
        life: 1.0, shrink: true,
      });
    }
    // One mournful chord at swallow.
    if (swallow > 0.2 && !this._spawnedBeats.has('hollow-take')) {
      this._spawnedBeats.add('hollow-take');
      audio.play('choirSwell');
      audio.play('voidHum');
    }
  }

  // Hero's home: a small cottage in the dark, its lit window slowly dims as
  // the door closes and the candle goes out. A small figure (the hero) walks
  // away from the camera into the wider dark.
  _drawHomeFalls(ctx, W, H, k) {
    this._drawLandscape(ctx, W, H, 0.7, '#05030a');
    const cx = W * 0.5, cy = H * 0.66;
    // Cottage silhouette
    const houseW = 80, houseH = 50;
    const hx = cx - houseW / 2, hy = cy - houseH;
    ctx.fillStyle = '#0a0610';
    ctx.fillRect(hx, hy, houseW, houseH);
    // Roof
    ctx.fillStyle = '#06040c';
    ctx.beginPath();
    ctx.moveTo(hx - 8, hy);
    ctx.lineTo(cx, hy - 26);
    ctx.lineTo(hx + houseW + 8, hy);
    ctx.closePath();
    ctx.fill();
    // Window — light dims through the phase
    const winLight = Math.max(0, 1 - this._easeIn(k, 0.05, 0.7));
    const winColor = `rgba(255,200,${100 + 40 * winLight},${0.8 * winLight + 0.1})`;
    ctx.fillStyle = winColor;
    ctx.fillRect(cx + 8, hy + 8, 14, 14);
    // Window grid
    ctx.strokeStyle = '#04030a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + 15, hy + 8); ctx.lineTo(cx + 15, hy + 22);
    ctx.moveTo(cx + 8, hy + 15); ctx.lineTo(cx + 22, hy + 15);
    ctx.stroke();
    // Door — closes over the phase (slides shut from open).
    const open = Math.max(0, 1 - this._easeIn(k, 0.0, 0.45));
    const doorW = 14 * open;
    const doorX = cx - 18;
    ctx.fillStyle = `rgba(255,200,140,${0.7 * open})`;
    ctx.fillRect(doorX, hy + 26, doorW, 22);
    // Door frame stays
    ctx.strokeStyle = '#04030a';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(cx - 18, hy + 26, 14, 22);
    // Hero silhouette walking away (down the road, away from camera)
    const walk = this._easeIn(k, 0.10, 0.95);
    const heroX = cx + (W * 0.86 - cx) * walk * 0.4;
    const heroY = cy + 10 + walk * 4;
    const heroScale = 0.9 - walk * 0.45;
    ctx.save();
    ctx.translate(heroX, heroY);
    ctx.scale(heroScale, heroScale);
    this._drawCloakedTraveler(ctx, this.t, 18, walk > 0.05);
    ctx.restore();
    // The world around: a distant violet rift smear on the horizon — they're
    // leaving a fallen province.
    const rx = W * 0.18, ry = H * 0.50;
    const rg = ctx.createRadialGradient(rx, ry, 0, rx, ry, 80);
    rg.addColorStop(0, `rgba(170,80,255,${0.45})`);
    rg.addColorStop(1, 'rgba(170,80,255,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
    // Candle puff at close — small ember rise
    if (winLight < 0.05 && !this._spawnedBeats.has('candle-out')) {
      this._spawnedBeats.add('candle-out');
      for (let i = 0; i < 8; i++) {
        this.fx.spawn({
          x: cx + 15, y: hy + 14, vx: (Math.random() - 0.5) * 8, vy: -20 - Math.random() * 14,
          gravity: -4, drag: 0.4,
          size: 1.4, color: '#ff8a3b', glow: 8,
          life: 1.2, shrink: true,
        });
      }
      audio.play('ember');
    }
  }

  _drawHeroEnter(ctx, W, H, k) {
    // Hero walks across a dark ridge with warm dawn light behind
    this._drawLandscape(ctx, W, H, 0.66, '#0a0510');
    // Sun/dawn glow rising
    const sx = W * 0.78;
    const sy = H * 0.62 + 30 - this._easeIn(k, 0.2, 0.9) * 40;
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 160);
    sg.addColorStop(0, 'rgba(255,210,140,0.85)');
    sg.addColorStop(0.5, 'rgba(255,130,90,0.4)');
    sg.addColorStop(1, 'rgba(255,90,60,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, W, H);
    // Hearthstone silhouette far right
    if (k > 0.4) {
      const tx = W * 0.86, ty = H * 0.66;
      const ta = this._easeIn(k, 0.4, 0.85);
      ctx.save();
      ctx.globalAlpha = ta * 0.7;
      ctx.fillStyle = '#1a0810';
      ctx.fillRect(tx - 10, ty - 16, 20, 16);
      // Roof
      ctx.beginPath();
      ctx.moveTo(tx - 14, ty - 16);
      ctx.lineTo(tx, ty - 26);
      ctx.lineTo(tx + 14, ty - 16);
      ctx.closePath();
      ctx.fill();
      // Lit window
      ctx.fillStyle = `rgba(255,200,120,${ta * 0.8})`;
      ctx.fillRect(tx - 3, ty - 12, 6, 5);
      ctx.restore();
    }
    // Hero walking from left to right — cloaked, since class isn't chosen yet.
    const heroX = W * 0.15 + this._easeIn(k, 0.0, 1.0) * W * 0.55;
    const heroY = H * 0.66;
    ctx.save();
    ctx.translate(heroX, heroY);
    this._drawCloakedTraveler(ctx, this.t, 22, true);
    ctx.restore();
  }

  _drawCallToAction(ctx, W, H, k) {
    // Hero centered, drawing a blade up to catch the song. A golden thread
    // descends and lands on the blade — the world is offering them the song,
    // and they're answering.
    this._drawLandscape(ctx, W, H, 0.7, '#0a0612');
    const cx = W / 2, cy = H * 0.66;
    // Aura
    const ag = ctx.createRadialGradient(cx, cy - 20, 0, cx, cy - 20, 200);
    ag.addColorStop(0, `rgba(255,210,120,${0.55 * this._bell(k, 0.55)})`);
    ag.addColorStop(1, 'rgba(255,210,120,0)');
    ctx.fillStyle = ag;
    ctx.fillRect(0, 0, W, H);
    // Cloaked wanderer
    ctx.save();
    ctx.translate(cx, cy);
    this._drawCloakedTraveler(ctx, this.t * 0.6, 26, false);
    ctx.restore();
    // Blade rises from the hero's hand. Lift it through the phase.
    const lift = this._easeIn(k, 0.10, 0.65);
    const bladeTopY = cy - 26 - lift * 70;
    const hiltY = cy - 26 - lift * 14;
    ctx.save();
    ctx.strokeStyle = '#cdd8e8';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#ffd884'; ctx.shadowBlur = 14 + lift * 12;
    ctx.beginPath();
    ctx.moveTo(cx + 14, hiltY);
    ctx.lineTo(cx + 14, bladeTopY);
    ctx.stroke();
    // Crossguard
    ctx.beginPath();
    ctx.moveTo(cx + 8, hiltY);
    ctx.lineTo(cx + 20, hiltY);
    ctx.stroke();
    // Hilt grip
    ctx.strokeStyle = '#5a3a18';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx + 14, hiltY);
    ctx.lineTo(cx + 14, hiltY + 6);
    ctx.stroke();
    ctx.restore();
    // Golden thread descends from the sky to the blade tip
    if (lift > 0.3) {
      const threadStrength = this._easeIn(k, 0.30, 0.85);
      ctx.save();
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      const grad = ctx.createLinearGradient(cx + 14, 0, cx + 14, bladeTopY);
      grad.addColorStop(0, 'rgba(255,216,77,0)');
      grad.addColorStop(0.5, `rgba(255,216,77,${threadStrength * 0.6})`);
      grad.addColorStop(1, `rgba(255,255,255,${threadStrength})`);
      ctx.strokeStyle = grad;
      ctx.shadowColor = '#ffd884'; ctx.shadowBlur = 18;
      ctx.beginPath();
      const segs = 16;
      for (let i = 0; i <= segs; i++) {
        const tt = i / segs;
        const x = cx + 14 + Math.sin(tt * 6 + this.t * 3) * 1.5;
        const y = bladeTopY * tt;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
      // Sparks at the blade tip when the thread catches
      if (Math.random() < 0.6) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 30 + Math.random() * 80;
        this.fx.spawn({
          x: cx + 14, y: bladeTopY,
          vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 20,
          gravity: 8, drag: 0.4,
          size: 1.6, color: '#ffd884', glow: 10,
          life: 0.8, shrink: true,
        });
      }
    }
    // Drifting golden motes around the hero
    if (Math.random() < 0.7) {
      this.fx.spawn({
        x: cx + (Math.random() - 0.5) * 120,
        y: cy + 30,
        vx: (Math.random() - 0.5) * 10, vy: -25 - Math.random() * 15,
        gravity: -3, drag: 0.3,
        size: 1.6, color: '#ffd84d', glow: 8,
        life: 1.8, shrink: false,
      });
    }
    // Single rising note when the thread catches
    if (k > 0.55 && !this._spawnedBeats.has('cta-catch')) {
      this._spawnedBeats.add('cta-catch');
      audio.play('chime');
      audio.play('confirm');
    }
  }

  _drawTitleReprise(ctx, W, H, k) {
    const cx = W / 2, cy = H * 0.45;
    // A distant violet rift smear behind the title — the wound hasn't gone
    // anywhere; the player's just stepping toward it now.
    const riftAlpha = 0.5 * this._bell(k, 0.5);
    const rg = ctx.createRadialGradient(cx, cy + 20, 0, cx, cy + 20, Math.max(W, H) * 0.5);
    rg.addColorStop(0, `rgba(170,80,255,${0.18 * riftAlpha})`);
    rg.addColorStop(0.4, `rgba(100,40,180,${0.10 * riftAlpha})`);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
    // Faint horizontal rift line behind the title
    ctx.save();
    ctx.globalAlpha = riftAlpha * 0.5;
    ctx.strokeStyle = '#d0a0ff';
    ctx.lineWidth = 1.4;
    ctx.shadowColor = '#a060ff'; ctx.shadowBlur = 16;
    ctx.beginPath();
    const len = W * 0.6;
    let x = cx - len / 2;
    ctx.moveTo(x, cy + 4);
    for (let i = 1; i <= 18; i++) {
      const tt = i / 18;
      x = cx - len / 2 + tt * len;
      const y = cy + 4 + Math.sin(tt * 10 + this.t) * 3 * Math.sin(tt * Math.PI);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    // Title — same look as the bloom, slightly smaller
    const a = Math.min(1, k * 2);
    const titleSize = Math.max(28, Math.min(54, W * 0.11));
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = `bold ${titleSize}px system-ui`;
    ctx.textAlign = 'center';
    const grad = ctx.createLinearGradient(0, cy - 30, 0, cy + 20);
    grad.addColorStop(0, '#ffd84d');
    grad.addColorStop(1, '#ff7a3b');
    ctx.fillStyle = grad;
    ctx.shadowColor = '#ffae3b'; ctx.shadowBlur = 28;
    ctx.fillText('AETHERIA', cx, cy);
    ctx.shadowBlur = 10;
    ctx.font = 'bold 13px system-ui';
    ctx.fillStyle = '#cdd6e0';
    ctx.fillText('Your story begins.', cx, cy + 36);
    ctx.restore();
    // Rising motes from below toward the title — the world reaching up
    if (Math.random() < 0.6) {
      this.fx.spawn({
        x: cx + (Math.random() - 0.5) * W * 0.7,
        y: H * 0.95,
        vx: 0, vy: -40 - Math.random() * 30,
        gravity: -3, drag: 0.3,
        size: 1.4, color: '#ffd84d', glow: 8,
        life: 2.2, shrink: false,
      });
    }
  }

  // ---- Building blocks ----------------------------------------------------

  // A faceless cloaked traveler — used before the player has chosen a class.
  _drawCloakedTraveler(ctx, t, r, walking = false) {
    const bob = walking ? Math.sin(t * 8) * 1.5 : Math.sin(t * 2) * 0.7;
    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.95, r * 0.85, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(0, bob);
    // Cloak body — tapered tall robe
    ctx.fillStyle = '#0c0a18';
    ctx.strokeStyle = '#28235a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, -r * 0.55);
    ctx.quadraticCurveTo(-r * 0.6, 0, -r * 1.0, r);
    ctx.lineTo(r * 1.0, r);
    ctx.quadraticCurveTo(r * 0.6, 0, r * 0.4, -r * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Cloak seam down the front
    ctx.strokeStyle = '#1a1438';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.55);
    ctx.lineTo(0, r);
    ctx.stroke();
    // Hood — pointed cap covering the head
    ctx.fillStyle = '#06040c';
    ctx.strokeStyle = '#28235a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.45, -r * 0.55);
    ctx.quadraticCurveTo(-r * 0.5, -r * 1.05, 0, -r * 1.1);
    ctx.quadraticCurveTo(r * 0.5, -r * 1.05, r * 0.45, -r * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Inner hood shadow (so face is solidly dark)
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.78, r * 0.32, r * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    // Two faint glowing eyes (the only light from beneath the hood)
    ctx.fillStyle = 'rgba(210,220,255,0.8)';
    ctx.shadowColor = '#a0c0ff';
    ctx.shadowBlur = 7;
    ctx.beginPath();
    ctx.arc(-r * 0.10, -r * 0.78, 1.7, 0, Math.PI * 2);
    ctx.arc( r * 0.10, -r * 0.78, 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  _drawGlyph(ctx, x, y, r, color, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color; ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - r * 0.4, y - r * 0.4);
    ctx.lineTo(x + r * 0.4, y + r * 0.4);
    ctx.moveTo(x + r * 0.4, y - r * 0.4);
    ctx.lineTo(x - r * 0.4, y + r * 0.4);
    ctx.stroke();
    ctx.restore();
  }

  // A simple silhouette landscape — rolling hills with optional warm horizon glow.
  _drawLandscape(ctx, W, H, horizonFrac, hillColor) {
    // Distant mountain ridge (lighter)
    ctx.fillStyle = '#1a1228';
    ctx.beginPath();
    ctx.moveTo(0, H * (horizonFrac + 0.06));
    ctx.lineTo(W * 0.12, H * (horizonFrac));
    ctx.lineTo(W * 0.26, H * (horizonFrac + 0.04));
    ctx.lineTo(W * 0.4,  H * (horizonFrac - 0.05));
    ctx.lineTo(W * 0.55, H * (horizonFrac + 0.02));
    ctx.lineTo(W * 0.7,  H * (horizonFrac - 0.04));
    ctx.lineTo(W * 0.85, H * (horizonFrac + 0.01));
    ctx.lineTo(W, H * (horizonFrac + 0.05));
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    // Near hills (darker)
    ctx.fillStyle = hillColor;
    ctx.beginPath();
    ctx.moveTo(0, H * (horizonFrac + 0.16));
    ctx.lineTo(W * 0.18, H * (horizonFrac + 0.08));
    ctx.lineTo(W * 0.36, H * (horizonFrac + 0.13));
    ctx.lineTo(W * 0.52, H * (horizonFrac + 0.06));
    ctx.lineTo(W * 0.7,  H * (horizonFrac + 0.11));
    ctx.lineTo(W * 0.88, H * (horizonFrac + 0.07));
    ctx.lineTo(W, H * (horizonFrac + 0.12));
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
  }

  // ---- Easing helpers -----------------------------------------------------

  _easeIn(k, lo, hi) {
    if (k <= lo) return 0;
    if (k >= hi) return 1;
    return (k - lo) / (hi - lo);
  }

  _bell(k, peak = 0.5) {
    // 0 at k=0 or 1, 1 at k=peak.
    if (k <= 0 || k >= 1) return 0;
    const t = k <= peak ? k / peak : (1 - k) / (1 - peak);
    return Math.max(0, Math.min(1, t));
  }
}
