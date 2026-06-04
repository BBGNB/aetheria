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
  { id: 'titleBloom',    dur: 5.5 },
  { id: 'starfield',     dur: 5.0, text: 'Long before the kingdoms of men, the world was new.' },
  { id: 'leylines',      dur: 5.5, text: 'It was woven from a single thread —\nAether, the song running through stone and sky and soul.' },
  { id: 'keepers',       dur: 5.5, text: 'Seven were chosen to keep that song in tune.\nThe Aetherial Order.' },
  { id: 'corruption',    dur: 6.0, text: 'Until one — Vael, the eldest — reached too far.\nHe sought not to keep the song, but to wield it.' },
  { id: 'rift',          dur: 5.0, text: 'The Aether did not bend.\nIt tore.' },
  { id: 'sundered',      dur: 6.0, text: 'The Rift took him. What walked back wore his face\nbut answered to no name. The people called it — The Sundered.' },
  { id: 'orderFell',     dur: 5.5, text: 'The Order rose to mend what was broken.\nSix of them fell.' },
  { id: 'lyraAlone',     dur: 5.5, text: 'Lyra, the youngest, refused to surrender.\nShe walked into the Hollow seeking the source. She did not return.' },
  { id: 'worldFraying',  dur: 5.5, text: 'Seasons passed. The circle stayed broken.\nRifts opened wherever the leylines ran thin.' },
  { id: 'heroEnter',     dur: 5.5, text: 'From a province torn by the bleed, you came east —\ndrawn by rumor of a town that still remembered the song.' },
  { id: 'callToAction',  dur: 4.5, text: 'You are no keeper. No mage of legend.\nBut the song still needs a voice — and a sword.' },
  { id: 'closingLine',   dur: 4.5, text: 'Begin where the youngest fell.\nThe work of seven now falls to one.' },
  { id: 'titleReprise',  dur: 4.0 },
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
    const dt = Math.min(0.05, (now - this.lastT) / 1000);
    this.lastT = now;
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
      case 'corruption':   this._drawCorruption(ctx, W, H, k); break;
      case 'rift':         this._drawRift(ctx, W, H, k); break;
      case 'sundered':     this._drawSundered(ctx, W, H, k); break;
      case 'orderFell':    this._drawOrderFell(ctx, W, H, k); break;
      case 'lyraAlone':    this._drawLyraAlone(ctx, W, H, k); break;
      case 'worldFraying': this._drawWorldFraying(ctx, W, H, k); break;
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

    // Skip hint (always shown; fades after first 6 seconds)
    const hintAlpha = Math.max(0.15, 0.7 - this.t / 8);
    ctx.fillStyle = `rgba(255,255,255,${hintAlpha})`;
    ctx.font = '11px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText('tap to skip', W - 14, H - 14);
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
      case 'corruption':
      case 'rift':
        top = `rgb(${10 + 30 * k},5,${20 + 40 * k})`;
        bot = `rgb(${20 + 50 * k},5,${40 + 60 * k})`;
        break;
      case 'sundered':
        top = '#16082a'; bot = '#0a0418'; break;
      case 'orderFell':
        top = '#08081a'; bot = '#04020a'; break;
      case 'lyraAlone':
        top = '#080a20'; bot = '#0a0824'; break;
      case 'worldFraying':
        top = '#1a0e1e'; bot = '#080414'; break;
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
    // Smooth fade in/out at the phase edges
    const a = k < 0.18 ? k / 0.18 : k > 0.82 ? Math.max(0, (1 - k) / 0.18) : 1;
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
    // Five flowing leyline curves crisscrossing the screen, with motes streaming.
    const t = this.t;
    if (Math.random() < 0.7) {
      const y0 = H * (0.18 + Math.random() * 0.6);
      this.fx.spawn({
        x: -10, y: y0,
        vx: 60 + Math.random() * 80, vy: (Math.random() - 0.5) * 14,
        size: 2.0, color: '#ffd84d', glow: 10,
        life: 4, shrink: false, drag: 0,
      });
    }
    const alpha = 0.45 * this._bell(k, 0.5);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ffd84d';
    ctx.lineWidth = 1.6;
    ctx.shadowColor = '#ffd84d'; ctx.shadowBlur = 10;
    for (let i = 0; i < 5; i++) {
      const y0 = H * (0.2 + i * 0.14);
      const wave = Math.sin(t * 1.2 + i) * 30;
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.bezierCurveTo(W * 0.3, y0 - 50 + wave, W * 0.7, y0 + 50 - wave, W, y0);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawKeepers(ctx, W, H, k, corruption = false) {
    const cx = W / 2, cy = H * 0.42;
    const radius = Math.min(W, H) * 0.22;
    // Subtle heptagon connecting the glyphs
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

    // Seven glyphs
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * radius;
      const y = cy + Math.sin(a) * radius;
      const appear = this._easeIn(k, 0.1 + i * 0.06, 0.3 + i * 0.06);
      this._drawGlyph(ctx, x, y, 18, '#ffd84d', appear * (0.8 + 0.2 * Math.sin(this.t * 3 + i)));
    }
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
    // The rift opens horizontally
    const len = 60 + k * 360;
    const aura = ctx.createRadialGradient(cx, cy, 0, cx, cy, len);
    aura.addColorStop(0, `rgba(180,80,255,${0.55 * Math.min(1, k * 2)})`);
    aura.addColorStop(1, 'rgba(60,20,120,0)');
    ctx.save();
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, W, H);
    // Jagged crack
    ctx.translate(cx, cy);
    ctx.rotate(-0.15);
    ctx.strokeStyle = '#e8c8ff';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#a060ff'; ctx.shadowBlur = 26;
    ctx.beginPath();
    let x = -len / 2;
    ctx.moveTo(x, 0);
    const segs = 14;
    for (let i = 1; i <= segs; i++) {
      const tt = i / segs;
      x = -len / 2 + tt * len;
      const y = (Math.random() - 0.5) * 26 * Math.sin(tt * Math.PI);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    // Continuously belch dark particles
    if (Math.random() < 0.4 + k * 0.4) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 180;
      this.fx.spawn({
        x: cx, y: cy,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        gravity: 30, drag: 0.5,
        size: 2 + Math.random() * 3,
        color: ['#a060ff','#6020a0','#d0a0ff'][Math.floor(Math.random() * 3)],
        life: 1.4 + Math.random() * 0.8, shrink: true, glow: 9,
      });
    }
    // One huge shockwave at peak
    this._once('rift-shock', () => null);
    if (k > 0.35 && !this._spawnedBeats.has('rift-bang')) {
      this._spawnedBeats.add('rift-bang');
      this.fx.shockwave(cx, cy, '#a060ff', Math.max(W, H), 1.1);
      audio.play('magic');
    }
  }

  _drawSundered(ctx, W, H, k) {
    // Silhouette of Vael becoming the Sundered: a robed figure at center that
    // splits into floating shards as k advances.
    const cx = W / 2, cy = H * 0.55;
    // Floor glow
    ctx.save();
    const fg = ctx.createRadialGradient(cx, cy + 80, 0, cx, cy + 80, 200);
    fg.addColorStop(0, `rgba(170,80,255,${0.4 * this._bell(k, 0.6)})`);
    fg.addColorStop(1, 'rgba(170,80,255,0)');
    ctx.fillStyle = fg;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // Body of Vael — a tall hooded silhouette
    const split = this._easeIn(k, 0.3, 0.85);
    ctx.save();
    ctx.translate(cx, cy);
    // Hooded body
    ctx.fillStyle = `rgba(20,8,30,${1 - split * 0.5})`;
    ctx.strokeStyle = '#a060ff';
    ctx.lineWidth = 1.2;
    ctx.shadowColor = '#a060ff'; ctx.shadowBlur = 12 + split * 8;
    const r = 60;
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, -r * 1.0);
    ctx.bezierCurveTo(-r * 0.55, -r * 0.3, -r * 0.9, r * 0.5, -r * 1.05, r * 1.1);
    ctx.lineTo(r * 1.05, r * 1.1);
    ctx.bezierCurveTo(r * 0.9, r * 0.5, r * 0.55, -r * 0.3, r * 0.4, -r * 1.0);
    ctx.quadraticCurveTo(0, -r * 1.3, -r * 0.4, -r * 1.0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Two glowing eyes inside the hood
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(-r * 0.16, -r * 0.85, 3, 0, Math.PI * 2);
    ctx.arc(r * 0.16, -r * 0.85, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // As split rises, shards drift outward from the body
    if (split > 0.05 && Math.random() < split * 0.9) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 20 + split * 80;
      this.fx.spawn({
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + (Math.random() - 0.5) * 80,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 20,
        gravity: 6, drag: 0.4,
        size: 3.2, color: '#a060ff', glow: 10,
        life: 1.6, shrink: true, shape: 'diamond',
        rot: ang, rotVel: 1 + Math.random() * 3,
      });
    }
  }

  _drawOrderFell(ctx, W, H, k) {
    const cx = W / 2, cy = H * 0.42;
    const radius = Math.min(W, H) * 0.22;
    // Vael's glyph stays violet (the top one). Six others fall one by one.
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * radius;
      const y = cy + Math.sin(a) * radius;
      if (i === 0) {
        // Vael — violet, distant
        this._drawGlyph(ctx, x, y, 18, '#a060ff', 0.85);
        continue;
      }
      const idx = i - 1; // 0..5
      const fallStart = idx / 6 * 0.85;
      const fallEnd   = fallStart + 0.15;
      const lifespan = 1 - this._easeIn(k, fallStart, fallEnd);
      if (lifespan > 0) {
        this._drawGlyph(ctx, x, y, 18, '#ffd84d', lifespan);
      } else {
        // Drift sparks from the fallen glyph
        if (Math.random() < 0.4) {
          this.fx.spawn({
            x, y, vx: (Math.random() - 0.5) * 20, vy: -20 - Math.random() * 20,
            gravity: 10, drag: 0.3,
            size: 1.6, color: '#ffd84d', glow: 6,
            life: 1.0, shrink: true,
          });
        }
      }
    }
  }

  _drawLyraAlone(ctx, W, H, k) {
    const cx = W / 2, cy = H * 0.42;
    const radius = Math.min(W, H) * 0.22;
    // Vael at top (violet), Lyra somewhere else (south-east position, glowing white)
    // Original heptagon angles: i=0 is top (Vael). Let i=4 be Lyra (lower-right).
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * radius;
      const y = cy + Math.sin(a) * radius;
      if (i === 0) {
        this._drawGlyph(ctx, x, y, 18, '#a060ff', 0.7);
      } else if (i === 4) {
        // Lyra still glowing, pulsing brighter
        const pulse = 0.7 + 0.3 * Math.sin(this.t * 2);
        this._drawGlyph(ctx, x, y, 20, '#e8ffe8', pulse);
        // Lyra walks slowly toward Vael (towards top)
        const walk = this._easeIn(k, 0.4, 0.95);
        const wx = x + (cx - Math.cos(-Math.PI / 2) * radius - x) * walk - x + x;
        const startX = x, startY = y;
        const endX = cx + Math.cos(-Math.PI / 2) * radius;
        const endY = cy + Math.sin(-Math.PI / 2) * radius;
        const lx = startX + (endX - startX) * walk;
        const ly = startY + (endY - startY) * walk;
        if (walk > 0.05) {
          // Tiny white silhouette
          ctx.save();
          ctx.translate(lx, ly);
          drawHero(ctx, 'white', this.t, 10, { facing: Math.atan2(endY - startY, endX - startX), walking: true });
          ctx.restore();
          // Trail of healing motes
          if (Math.random() < 0.5) {
            this.fx.spawn({
              x: lx, y: ly + 4, vx: 0, vy: -10,
              size: 1.4, color: '#a8ffc8', glow: 6,
              life: 1.2, shrink: false, drag: 0.2,
            });
          }
        }
      } else {
        // dark
      }
    }
  }

  _drawWorldFraying(ctx, W, H, k) {
    // A landscape silhouette with cracks of violet light leaking through.
    this._drawLandscape(ctx, W, H, 0.62, '#06030a');
    // Cracks
    const crackSeeds = [
      [W * 0.18, H * 0.72, W * 0.28, H * 0.95],
      [W * 0.45, H * 0.7, W * 0.4, H * 0.95],
      [W * 0.7, H * 0.74, W * 0.78, H * 0.95],
      [W * 0.88, H * 0.7, W * 0.95, H * 0.92],
    ];
    ctx.save();
    ctx.strokeStyle = `rgba(170,80,255,${0.6 * this._bell(k, 0.55)})`;
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
    // Hero centered, looking up. A faint golden glow gathers above.
    this._drawLandscape(ctx, W, H, 0.7, '#0a0612');
    const cx = W / 2, cy = H * 0.66;
    // Aura
    const ag = ctx.createRadialGradient(cx, cy - 20, 0, cx, cy - 20, 160);
    ag.addColorStop(0, `rgba(255,210,120,${0.45 * this._bell(k, 0.55)})`);
    ag.addColorStop(1, 'rgba(255,210,120,0)');
    ctx.fillStyle = ag;
    ctx.fillRect(0, 0, W, H);
    // Cloaked wanderer
    ctx.save();
    ctx.translate(cx, cy);
    this._drawCloakedTraveler(ctx, this.t * 0.6, 26, false);
    ctx.restore();
    // Drifting golden motes
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
  }

  _drawTitleReprise(ctx, W, H, k) {
    const cx = W / 2, cy = H * 0.45;
    // Title shows again, smaller, with subtle pulse
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
    ctx.shadowColor = '#ffae3b'; ctx.shadowBlur = 24;
    ctx.fillText('AETHERIA', cx, cy);
    ctx.shadowBlur = 8;
    ctx.font = 'bold 13px system-ui';
    ctx.fillStyle = '#cdd6e0';
    ctx.fillText('Your story begins.', cx, cy + 36);
    ctx.restore();
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
