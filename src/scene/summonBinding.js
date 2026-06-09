// First-summon binding cinematic — Ash-Crowned Stag.
// Triggered once, after the bloomArena epilogue. Full-screen, ~33s, skippable.

import { Effects } from '../effects.js';
import { audio } from '../audio.js';

const PHASES = [
  { id: 'stillness',     dur: 3.0 },
  { id: 'antlerClack',   dur: 3.0 },
  { id: 'silhouette',    dur: 4.0 },
  { id: 'rises',         dur: 4.0 },
  { id: 'sableLine',     dur: 3.5, text: 'Sable: "The Bloom was caging it. One of the old keepers — bound when the leyline broke."' },
  { id: 'lyraLine',      dur: 3.5, text: 'Lyra (quiet): "It is choosing you."' },
  { id: 'charge',        dur: 5.0 },
  { id: 'bind',          dur: 4.0 },
  { id: 'banner',        dur: 3.0 },
];

const TOTAL = PHASES.reduce((s, p) => s + p.dur, 0);

export class SummonBinding {
  constructor(canvas, ctx, input, onDone) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.input = input;
    this.onDone = onDone;
    this.t = 0;
    this.lastT = 0;
    this.running = false;
    this.fx = new Effects();
    this._beats = new Set();
    this._prevOnTap = null;
    this._shake = 0;
  }

  start() {
    this.running = true;
    this.t = 0;
    this.lastT = performance.now();
    this._prevOnTap = this.input.onTap;
    this.input.onTap = () => this._skip();
    audio.stopMusic();
    audio.stopAmbient();
    requestAnimationFrame((t) => this._tick(t));
  }

  stop() {
    this.running = false;
    if (this._prevOnTap !== null) this.input.onTap = this._prevOnTap;
  }

  _skip() { if (this.running) this._complete(); }

  _complete() {
    if (!this.running) return;
    this.stop();
    this.fx.clearSceneTints();
    if (this.onDone) setTimeout(this.onDone, 350);
  }

  _tick(now) {
    if (!this.running) return;
    let dt = Math.min(0.05, (now - this.lastT) / 1000);
    this.lastT = now;
    // Hold to fast-forward (>350ms press) — quick taps still skip via onTap.
    if (this.input.active) {
      this._pressT = (this._pressT || 0) + dt;
      if (this._pressT > 0.35) { dt *= 4; this._ffActive = true; }
    } else {
      this._pressT = 0;
      this._ffActive = false;
    }
    this.t += dt;
    this._shake = Math.max(0, this._shake - dt * 28);
    this.fx.update(dt);
    this._draw();
    if (this.t >= TOTAL) { this._complete(); return; }
    requestAnimationFrame((t) => this._tick(t));
  }

  _once(key, fn) {
    if (!this._beats.has(key)) { this._beats.add(key); fn(); }
  }

  _phaseAt(t) {
    let acc = 0;
    for (const p of PHASES) {
      if (t < acc + p.dur) return { phase: p, start: acc, k: (t - acc) / p.dur };
      acc += p.dur;
    }
    const last = PHASES[PHASES.length - 1];
    return { phase: last, start: acc - last.dur, k: 1 };
  }

  _draw() {
    const ctx = this.ctx;
    const W = this.canvas.clientWidth;
    const H = this.canvas.clientHeight;
    const { phase, k } = this._phaseAt(this.t);

    // Optional shake offset.
    let ox = 0, oy = 0;
    if (this._shake > 0) {
      ox = (Math.random() - 0.5) * this._shake;
      oy = (Math.random() - 0.5) * this._shake;
    }
    ctx.save();
    ctx.translate(ox, oy);

    this._drawBackground(ctx, W, H, phase, k);

    // Ambient violet ash drifting through every phase except the very last fade.
    this._spawnAsh(W, H, phase, k);

    switch (phase.id) {
      case 'stillness':   this._drawStillness(ctx, W, H, k); break;
      case 'antlerClack': this._drawAntlerClack(ctx, W, H, k); break;
      case 'silhouette':  this._drawSilhouetteForming(ctx, W, H, k); break;
      case 'rises':       this._drawRises(ctx, W, H, k); break;
      case 'sableLine':   this._drawStagStanding(ctx, W, H, k, 1); break;
      case 'lyraLine':    this._drawStagStanding(ctx, W, H, k, 1); break;
      case 'charge':      this._drawCharge(ctx, W, H, k); break;
      case 'bind':        this._drawBind(ctx, W, H, k); break;
      case 'banner':      this._drawBanner(ctx, W, H, k); break;
    }

    this.fx.draw(ctx);

    if (phase.text) this._drawNarration(ctx, W, H, phase.text, k);

    ctx.restore();

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

  // ---- Background per phase ------------------------------------------------

  _drawBackground(ctx, W, H, phase, k) {
    // Start violet (continuation of the Bloom arena), warm to amber as the
    // Stag rises, then back to a dim ember-glow for the bind + banner.
    let top, bot;
    switch (phase.id) {
      case 'stillness':
      case 'antlerClack':
        top = '#1a0626'; bot = '#0a0212'; break;
      case 'silhouette': {
        // Cross-fade violet → warmer dark
        const r = 26 + 30 * k, g = 6 + 6 * k, b = 38 - 14 * k;
        top = `rgb(${r},${g},${b})`; bot = '#0a0210'; break;
      }
      case 'rises': {
        // Amber wash floods up from the bottom as the Stag's eyes open.
        const aR = 60 + 80 * k, aG = 16 + 30 * k, aB = 24 - 14 * k;
        top = `rgb(${40 + 30 * k},${10 + 8 * k},${30 - 18 * k})`;
        bot = `rgb(${aR},${aG},${Math.max(8, aB)})`; break;
      }
      case 'sableLine':
      case 'lyraLine':
        top = '#3a1410'; bot = '#1a0608'; break;
      case 'charge':
        top = '#4a1a08'; bot = '#1a0404'; break;
      case 'bind': {
        // Soften back toward warm dark.
        top = `rgb(${40 - 20 * k},${14 - 6 * k},${10 + 4 * k})`;
        bot = `rgb(${20 - 10 * k},${6 - 2 * k},${8 + 4 * k})`; break;
      }
      case 'banner':
        top = '#0e0612'; bot = '#0a0410'; break;
      default:
        top = '#0a0a18'; bot = '#0a0414';
    }
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, top);
    g.addColorStop(1, bot);
    ctx.fillStyle = g;
    ctx.fillRect(-50, -50, W + 100, H + 100);
  }

  _spawnAsh(W, H, phase, k) {
    // Slow violet ash through the early phases; ember motes after the Stag rises.
    const ember = ['rises', 'sableLine', 'lyraLine', 'charge', 'bind'].includes(phase.id);
    if (Math.random() < 0.55) {
      this.fx.spawn({
        x: Math.random() * W,
        y: -10,
        vx: (Math.random() - 0.5) * 8,
        vy: 14 + Math.random() * 18,
        gravity: 2, drag: 0.5,
        size: 1.2 + Math.random() * 1.2,
        color: ember
          ? (Math.random() < 0.5 ? '#ff8a3b' : '#ffd84d')
          : 'rgba(120,80,180,0.85)',
        life: 4.5, shrink: false, glow: ember ? 6 : 2,
      });
    }
  }

  // ---- Stag silhouette draw -----------------------------------------------
  // Centered antlered silhouette. eyeGlow 0..1 controls flame-eye intensity,
  // bodyAlpha 0..1 fades the shape. headBowed lowers the head pose slightly.
  _drawStag(ctx, cx, cy, scale, opts = {}) {
    const { bodyAlpha = 1, eyeGlow = 0, headBowed = false, rimGlow = 0.5 } = opts;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.globalAlpha = bodyAlpha;

    // Body
    ctx.fillStyle = '#0d0405';
    ctx.beginPath();
    ctx.ellipse(0, 28, 56, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    // Neck — angle varies by pose.
    const neckAngle = headBowed ? 0.25 : -0.3;
    const headY = headBowed ? 24 : -8;
    const headX = headBowed ? -22 : -22;
    ctx.beginPath();
    ctx.ellipse(-12, 6, 18, 28, neckAngle, 0, Math.PI * 2);
    ctx.fill();
    // Head
    ctx.beginPath();
    ctx.ellipse(headX, headY, 22, 16, headBowed ? 0.4 : -0.2, 0, Math.PI * 2);
    ctx.fill();
    // Legs
    ctx.fillRect(-32, 50, 8, 42);
    ctx.fillRect(-14, 52, 8, 42);
    ctx.fillRect(20, 52, 8, 42);
    ctx.fillRect(38, 50, 8, 42);
    // Antlers — branching, lit by rim glow.
    const drawAntler = (side, strokeColor, lineWidth, blur) => {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      if (blur) { ctx.shadowColor = '#ff5a20'; ctx.shadowBlur = blur; }
      const s = side;
      // Antlers point up when bowed too — visual signature stays visible.
      const baseY = headBowed ? 12 : -16;
      const baseX = -22 + (headBowed ? -2 : 0);
      ctx.beginPath();
      ctx.moveTo(baseX + s * 6, baseY);
      ctx.lineTo(baseX + s * 22, baseY - 30);
      ctx.lineTo(baseX + s * 18, baseY - 56);
      ctx.moveTo(baseX + s * 22, baseY - 30);
      ctx.lineTo(baseX + s * 40, baseY - 38);
      ctx.lineTo(baseX + s * 46, baseY - 60);
      ctx.moveTo(baseX + s * 22, baseY - 30);
      ctx.lineTo(baseX + s * 34, baseY - 22);
      ctx.stroke();
      if (blur) { ctx.shadowBlur = 0; }
    };
    drawAntler(-1, '#1a0408', 6, 0);
    drawAntler(1, '#1a0408', 6, 0);
    if (rimGlow > 0) {
      ctx.globalAlpha = bodyAlpha * rimGlow;
      drawAntler(-1, '#ff8a3b', 3, 18);
      drawAntler(1, '#ff8a3b', 3, 18);
    }
    // Eye glow
    if (eyeGlow > 0) {
      ctx.globalAlpha = bodyAlpha;
      ctx.fillStyle = `rgba(255,210,80,${eyeGlow})`;
      ctx.shadowColor = '#ff8a3b';
      ctx.shadowBlur = 20 * eyeGlow;
      ctx.beginPath();
      const eyeX = headX + (headBowed ? 4 : -4);
      const eyeY = headY + (headBowed ? -2 : -2);
      ctx.arc(eyeX, eyeY, 3 + 1.5 * eyeGlow, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  // ---- Phase scenes --------------------------------------------------------

  _drawStillness(ctx, W, H, k) {
    // Bloom arena aftermath — three party silhouettes at the bottom, swaying.
    this._once('stillness:audio', () => audio.play('rift'));
    this._drawPartySilhouettes(ctx, W, H, 0.55 + 0.15 * Math.sin(this.t * 1.2));
    // Centre lit faintly to suggest something there.
    const cx = W / 2, cy = H * 0.55;
    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, 220);
    halo.addColorStop(0, `rgba(120,60,160,${0.15 + 0.05 * k})`);
    halo.addColorStop(1, 'rgba(120,60,160,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);
  }

  _drawAntlerClack(ctx, W, H, k) {
    this._once('clack:audio', () => { audio.play('bossThump'); audio.play('ember'); });
    this._once('clack:shake', () => { this._shake = 12; });
    // Three antler clacks land at 0.3, 0.6, 0.9 of phase — small shakes + sparks.
    for (const beat of [0.3, 0.6, 0.9]) {
      const key = `clack:${beat}`;
      if (k >= beat && !this._beats.has(key)) {
        this._beats.add(key);
        audio.play('ember');
        this._shake = 14;
        const cx = W / 2 + (Math.random() - 0.5) * 80;
        const cy = H * 0.55 + (Math.random() - 0.5) * 40;
        for (let i = 0; i < 24; i++) {
          const ang = Math.random() * Math.PI * 2;
          const sp = 80 + Math.random() * 140;
          this.fx.spawn({
            x: cx, y: cy,
            vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
            gravity: 60, drag: 0.6,
            size: 1.6 + Math.random() * 1.6,
            color: '#ff8a3b', life: 1.0, shrink: true, glow: 10,
          });
        }
      }
    }
    this._drawPartySilhouettes(ctx, W, H, 0.55);
    // Convergence wisps pulling toward the centre.
    const cx = W / 2, cy = H * 0.55;
    for (let i = 0; i < 3; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 300 + Math.random() * 200;
      this.fx.spawn({
        x: cx + Math.cos(ang) * dist, y: cy + Math.sin(ang) * dist,
        vx: -Math.cos(ang) * 110, vy: -Math.sin(ang) * 110,
        gravity: 0, drag: 0.25,
        size: 1.4 + Math.random() * 1.4,
        color: 'rgba(180,120,220,0.9)',
        life: 1.8, shrink: true, glow: 6,
      });
    }
  }

  _drawSilhouetteForming(ctx, W, H, k) {
    this._once('form:audio', () => { audio.play('rift'); audio.play('aetherWail'); });
    this._drawPartySilhouettes(ctx, W, H, 0.5);
    const cx = W / 2, cy = H * 0.55;
    // Antlered silhouette coalescing — head bowed, scale grows, glow fades in.
    const scale = 1.4 + 0.8 * k;
    this._drawStag(ctx, cx, cy + 20, scale, {
      bodyAlpha: k * 0.9,
      eyeGlow: 0,
      headBowed: true,
      rimGlow: 0.3 + 0.4 * k,
    });
    // Embers leaking from antler tines.
    for (let i = 0; i < 2; i++) {
      this.fx.spawn({
        x: cx + (Math.random() - 0.5) * 80,
        y: cy - 50 + Math.random() * 20,
        vx: (Math.random() - 0.5) * 18,
        vy: -10 - Math.random() * 24,
        gravity: -4, drag: 0.4,
        size: 1.4 + Math.random(),
        color: ['#ff8a3b', '#ffd84d', '#ff5a20'][Math.floor(Math.random() * 3)],
        life: 1.6, shrink: true, glow: 10,
      });
    }
  }

  _drawRises(ctx, W, H, k) {
    this._once('rises:audio', () => { audio.play('aetherWail'); audio.play('doomKnell'); this._shake = 18; });
    this._once('rises:flash', () => { this.fx.screenFlash('#ff8a3b', 0.45, 0.6); this.fx.sceneTint('#ff7a3b', 0.30, 3.0, 0.2, 0.5); });
    this._drawPartySilhouettes(ctx, W, H, 0.4);
    const cx = W / 2, cy = H * 0.55;
    const scale = 2.2 + 0.6 * k;
    // Head lifts through k: bowed → upright by k=0.45.
    const bowed = k < 0.45;
    this._drawStag(ctx, cx, cy + 20 - k * 30, scale, {
      bodyAlpha: 1,
      eyeGlow: Math.min(1, (k - 0.3) * 2.6),
      headBowed: bowed,
      rimGlow: 0.6 + 0.4 * k,
    });
    // Amber wash floods up from the ground when the eyes open.
    if (k > 0.3) {
      const w = Math.min(1, (k - 0.3) * 2);
      const flood = ctx.createLinearGradient(0, H, 0, H * 0.4);
      flood.addColorStop(0, `rgba(255,138,59,${0.35 * w})`);
      flood.addColorStop(1, 'rgba(255,138,59,0)');
      ctx.fillStyle = flood;
      ctx.fillRect(0, 0, W, H);
    }
  }

  _drawStagStanding(ctx, W, H, k, intensity) {
    this._drawPartySilhouettes(ctx, W, H, 0.4);
    const cx = W / 2, cy = H * 0.55;
    const breathBob = Math.sin(this.t * 1.8) * 4;
    this._drawStag(ctx, cx, cy - 10 + breathBob, 2.8, {
      bodyAlpha: 1,
      eyeGlow: 1.0,
      headBowed: false,
      rimGlow: 1.0,
    });
    // Steady ember rain on the body.
    for (let i = 0; i < 2; i++) {
      this.fx.spawn({
        x: cx + (Math.random() - 0.5) * 200,
        y: cy - 130 + Math.random() * 30,
        vx: (Math.random() - 0.5) * 14,
        vy: 20 + Math.random() * 30,
        gravity: 8, drag: 0.4,
        size: 1.2 + Math.random(),
        color: ['#ff8a3b', '#ffd84d'][Math.floor(Math.random() * 2)],
        life: 2.2, shrink: true, glow: 8,
      });
    }
  }

  _drawCharge(ctx, W, H, k) {
    this._once('charge:audio', () => { audio.play('doomKnell'); audio.play('ember'); this._shake = 20; });
    this._once('charge:wave', () => {
      const cx = W / 2, cy = H * 0.55;
      this.fx.shockwave(cx, cy, '#ff8a3b', 280, 0.8);
      this.fx.shockwave(cx, cy, '#ffd84d', 160, 0.6);
    });
    // Stag runs left→right across the screen, slow-mo. Position tracks k.
    const cy = H * 0.55;
    const startX = -200, endX = W + 200;
    const x = startX + (endX - startX) * k;
    // Fire trail behind it.
    if (k < 0.95) {
      for (let i = 0; i < 4; i++) {
        this.fx.spawn({
          x: x - 30 + Math.random() * 20,
          y: cy + 20 + (Math.random() - 0.5) * 60,
          vx: -80 + Math.random() * 40,
          vy: (Math.random() - 0.5) * 30,
          gravity: -12, drag: 0.3,
          size: 2 + Math.random() * 2,
          color: ['#ff5a20', '#ff8a3b', '#ffd84d'][Math.floor(Math.random() * 3)],
          life: 1.2, shrink: true, glow: 14,
        });
      }
    }
    // Ember sigil glows under each hoof-step.
    if (Math.random() < 0.4) {
      this.fx.spawn({
        x: x + (Math.random() - 0.5) * 50,
        y: cy + 80,
        vx: 0, vy: -8,
        gravity: 0, drag: 0.5,
        size: 4 + Math.random() * 2,
        color: '#ffd84d',
        life: 0.7, shrink: true, glow: 20,
      });
    }
    // Galloping stag — head forward, legs splayed.
    const scale = 2.4;
    ctx.save();
    ctx.translate(x, cy + Math.sin(this.t * 18) * 4);
    ctx.scale(scale, scale);
    // Body stretched horizontally for gallop.
    ctx.fillStyle = '#0d0405';
    ctx.beginPath();
    ctx.ellipse(0, 20, 48, 22, 0.05, 0, Math.PI * 2);
    ctx.fill();
    // Head extended forward.
    ctx.beginPath();
    ctx.ellipse(36, 8, 18, 12, 0.1, 0, Math.PI * 2);
    ctx.fill();
    // Legs — alternating splay
    const splay = Math.sin(this.t * 22);
    ctx.fillRect(-26, 32, 6, 38 + splay * 6);
    ctx.fillRect(-10, 34, 6, 38 - splay * 6);
    ctx.fillRect(18, 34, 6, 38 + splay * 6);
    ctx.fillRect(34, 32, 6, 38 - splay * 6);
    // Antlers forward
    ctx.strokeStyle = '#1a0408';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(40, 0); ctx.lineTo(52, -22); ctx.lineTo(48, -42);
    ctx.moveTo(52, -22); ctx.lineTo(70, -28);
    ctx.moveTo(52, -22); ctx.lineTo(64, -12);
    ctx.stroke();
    // Rim glow
    ctx.strokeStyle = '#ff8a3b';
    ctx.shadowColor = '#ff5a20'; ctx.shadowBlur = 18;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
    // Eye
    ctx.fillStyle = '#ffd84d';
    ctx.shadowColor = '#ff8a3b'; ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(48, 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  _drawBind(ctx, W, H, k) {
    this._once('bind:audio', () => { audio.play('choirSwell'); audio.play('chime'); });
    this._drawPartySilhouettes(ctx, W, H, 0.4);
    const cx = W / 2, cy = H * 0.55;
    // Stag stands, lowers crown (head bowed), then dissolves into a shard.
    const phaseA = Math.min(1, k / 0.45);  // 0..1 head lowers
    const phaseB = k > 0.55 ? Math.min(1, (k - 0.55) / 0.45) : 0; // 0..1 dissolve
    if (phaseB < 0.95) {
      this._drawStag(ctx, cx, cy - 10, 2.8, {
        bodyAlpha: 1 - phaseB,
        eyeGlow: 1 - phaseB * 0.5,
        headBowed: phaseA > 0.3,
        rimGlow: 1 - phaseB * 0.3,
      });
    }
    // Dissolution embers pouring upward.
    if (phaseB > 0 && phaseB < 1) {
      for (let i = 0; i < 8; i++) {
        this.fx.spawn({
          x: cx + (Math.random() - 0.5) * 120,
          y: cy + (Math.random() - 0.5) * 100,
          vx: (Math.random() - 0.5) * 24,
          vy: -40 - Math.random() * 50,
          gravity: -8, drag: 0.4,
          size: 1.8 + Math.random() * 1.4,
          color: ['#ff8a3b', '#ffd84d', '#ff5a20'][Math.floor(Math.random() * 3)],
          life: 1.6, shrink: true, glow: 12,
        });
      }
    }
    // After the dissolve, an antler-shard drifts down toward the party.
    if (k > 0.7) {
      const dk = (k - 0.7) / 0.3;
      const sx = cx;
      const sy = cy - 40 + dk * 200;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(this.t * 1.5);
      // Antler-shard: angular, glowing amber.
      ctx.fillStyle = '#ff8a3b';
      ctx.shadowColor = '#ffd84d'; ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(8, -4);
      ctx.lineTo(4, 14);
      ctx.lineTo(-4, 14);
      ctx.lineTo(-8, -4);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  _drawBanner(ctx, W, H, k) {
    this._once('banner:audio', () => { audio.play('levelup'); audio.play('confirm'); });
    this._drawPartySilhouettes(ctx, W, H, 0.4);
    // Banner slides in from above, then fades out at end.
    const slide = Math.min(1, k * 3);
    const fade = k > 0.7 ? Math.max(0, 1 - (k - 0.7) / 0.3) : 1;
    const yTop = H * 0.32 - 40 * (1 - slide);
    ctx.save();
    ctx.globalAlpha = fade;
    // Banner background
    const grad = ctx.createLinearGradient(0, yTop, 0, yTop + 110);
    grad.addColorStop(0, 'rgba(120,40,12,0.85)');
    grad.addColorStop(1, 'rgba(40,10,4,0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, yTop, W, 110);
    ctx.fillStyle = 'rgba(255,138,59,0.9)';
    ctx.fillRect(0, yTop, W, 2);
    ctx.fillRect(0, yTop + 108, W, 2);
    // Text
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd884';
    ctx.font = 'bold 16px system-ui';
    ctx.fillText('RECEIVED', W / 2, yTop + 38);
    ctx.fillStyle = '#fff5b0';
    ctx.font = 'bold 26px system-ui';
    ctx.fillText('ASH-CROWNED STAG', W / 2, yTop + 76);
    ctx.restore();
  }

  // ---- Party silhouettes (bottom of screen) -------------------------------

  _drawPartySilhouettes(ctx, W, H, alpha) {
    const baseY = H * 0.88;
    const spacing = 50;
    const cx = W / 2;
    ctx.save();
    ctx.globalAlpha = alpha;
    for (let i = -1; i <= 1; i++) {
      const px = cx + i * spacing;
      const bob = Math.sin(this.t * 1.5 + i) * 1.5;
      ctx.fillStyle = '#000';
      // Body
      ctx.beginPath();
      ctx.ellipse(px, baseY + bob, 14, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.beginPath();
      ctx.arc(px, baseY - 22 + bob, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ---- Narration text ------------------------------------------------------

  _drawNarration(ctx, W, H, text, k) {
    const fadeIn = Math.min(1, k * 3);
    const fadeOut = k > 0.85 ? Math.max(0, 1 - (k - 0.85) / 0.15) : 1;
    const alpha = fadeIn * fadeOut;
    ctx.save();
    ctx.globalAlpha = alpha;
    // Box at bottom
    const boxY = H - 130;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(20, boxY, W - 40, 70);
    ctx.strokeStyle = 'rgba(255,138,59,0.6)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(20, boxY, W - 40, 70);
    // Text
    ctx.fillStyle = '#fff5e6';
    ctx.font = '15px system-ui';
    ctx.textAlign = 'center';
    this._wrapText(ctx, text, W / 2, boxY + 32, W - 80, 20);
    ctx.restore();
  }

  _wrapText(ctx, text, x, y, maxW, lineH) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x, y + i * lineH);
    }
  }
}
