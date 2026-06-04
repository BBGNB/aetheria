// A pile of particles and short-lived "shape" effects (radial flashes,
// lightning bolts, magic circles, shockwaves). Each scene owns its own
// Effects instance and calls update(dt) then draw(ctx).
//
// Two primitives:
//   particles[] — simple round dots with vx/vy/gravity/drag/life
//   shapes[]    — arbitrary closures with their own draw, time-bounded
//
// Effect helpers below compose both into rich one-shot animations.

export class Effects {
  constructor() {
    this.particles = [];
    this.shapes = [];
  }

  clear() { this.particles.length = 0; this.shapes.length = 0; }

  update(dt) {
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.drag) {
        const f = Math.max(0, 1 - p.drag * dt);
        p.vx *= f; p.vy *= f;
      }
      if (p.gravity) p.vy += p.gravity * dt;
      if (p.rot != null) p.rot += (p.rotVel || 0) * dt;
    }
    this.particles = this.particles.filter(p => p.life > 0);
    for (const s of this.shapes) s.t += dt;
    this.shapes = this.shapes.filter(s => s.t < s.dur);
  }

  draw(ctx) {
    // Particles first (under shape flashes for layering).
    for (const p of this.particles) {
      const k = Math.max(0, p.life / p.max);
      const a = p.fadeIn ? Math.min(1, (1 - k) * 4) * k : k;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      if (p.glow) { ctx.shadowColor = p.color; ctx.shadowBlur = p.glow; }
      const sz = p.size * (p.shrink ? Math.max(0.2, k) : 1);
      if (p.shape === 'rect') {
        ctx.translate(p.x, p.y);
        if (p.rot != null) ctx.rotate(p.rot);
        ctx.fillRect(-sz, -sz * 0.4, sz * 2, sz * 0.8);
      } else if (p.shape === 'diamond') {
        ctx.translate(p.x, p.y);
        if (p.rot != null) ctx.rotate(p.rot);
        ctx.beginPath();
        ctx.moveTo(0, -sz);
        ctx.lineTo(sz * 0.6, 0);
        ctx.lineTo(0, sz);
        ctx.lineTo(-sz * 0.6, 0);
        ctx.closePath();
        ctx.fill();
      } else if (p.shape === 'star') {
        ctx.translate(p.x, p.y);
        if (p.rot != null) ctx.rotate(p.rot);
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = i * Math.PI * 2 / 5 - Math.PI / 2;
          ctx.lineTo(Math.cos(a) * sz, Math.sin(a) * sz);
          const b = a + Math.PI / 5;
          ctx.lineTo(Math.cos(b) * sz * 0.45, Math.sin(b) * sz * 0.45);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    for (const s of this.shapes) s.draw(ctx, s.t / s.dur, s.t);
  }

  // ---- Low-level spawners --------------------------------------------------

  spawn(p) { p.max = p.life; this.particles.push(p); return p; }
  shape(dur, drawFn) { this.shapes.push({ t: 0, dur, draw: drawFn }); }

  // ---- Effect compositions -------------------------------------------------

  // Fire bloom — orange explosion at (x, y), with embers and a radial flash.
  fireBloom(x, y, scale = 1) {
    const s = scale;
    // Central radial flash
    this.shape(0.35, (ctx, k) => {
      const r = (30 + k * 110) * s;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255,210,120,${0.7 * (1 - k)})`);
      g.addColorStop(0.6, `rgba(255,120,40,${0.45 * (1 - k)})`);
      g.addColorStop(1, 'rgba(255,80,20,0)');
      ctx.save();
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Embers fly out
    const palette = ['#ff5a3b', '#ff8a3b', '#ffd84d', '#ffc070'];
    for (let i = 0; i < 36; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = (60 + Math.random() * 180) * s;
      this.spawn({
        x, y,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 40 * s,
        gravity: 120 * s, drag: 1.6,
        size: (3 + Math.random() * 4) * s,
        color: palette[Math.floor(Math.random() * palette.length)],
        life: 0.5 + Math.random() * 0.5,
        shrink: true,
        glow: 6 * s,
      });
    }
    // Rising smoke
    for (let i = 0; i < 10; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
      const sp = (20 + Math.random() * 30) * s;
      this.spawn({
        x: x + (Math.random() - 0.5) * 20, y: y + 5,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        gravity: -30 * s, drag: 0.5,
        size: (8 + Math.random() * 8) * s,
        color: 'rgba(120,90,80,0.6)',
        life: 0.9 + Math.random() * 0.6,
        max: 1,
        shrink: false,
      });
    }
  }

  // Ice shards crystallize on target then shatter outward.
  iceShards(x, y, scale = 1) {
    const s = scale;
    // Crystallization ring (forms inward)
    this.shape(0.45, (ctx, k) => {
      ctx.save();
      const r = (60 - k * 30) * s;
      ctx.strokeStyle = `rgba(170,220,255,${0.6 * (1 - k)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
      // Hex shards forming
      const ringR = r * 0.85;
      const blades = 6;
      for (let i = 0; i < blades; i++) {
        const a = i * Math.PI * 2 / blades + k * 0.4;
        const sx = x + Math.cos(a) * ringR;
        const sy = y + Math.sin(a) * ringR;
        const len = 14 * s * (1 - k);
        ctx.strokeStyle = `rgba(220,240,255,${0.9 * (1 - k)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(a) * len, sy + Math.sin(a) * len);
        ctx.stroke();
      }
      ctx.restore();
    });
    // Central frost burst
    this.shape(0.3, (ctx, k) => {
      const r = (10 + k * 90) * s;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(220,240,255,${0.7 * (1 - k)})`);
      g.addColorStop(1, 'rgba(120,180,240,0)');
      ctx.save();
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Shards fly out as diamond particles
    for (let i = 0; i < 18; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = (80 + Math.random() * 140) * s;
      const rot = ang + Math.PI / 2;
      this.spawn({
        x, y,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        gravity: 60 * s, drag: 1.2,
        size: (4 + Math.random() * 3) * s,
        color: ['#cfeaff', '#a0d4ff', '#dff2ff', '#ffffff'][Math.floor(Math.random() * 4)],
        life: 0.55 + Math.random() * 0.35,
        shrink: true,
        glow: 6 * s,
        shape: 'diamond',
        rot, rotVel: 2 + Math.random() * 4,
      });
    }
    // Sparkle motes settling down
    for (let i = 0; i < 12; i++) {
      this.spawn({
        x: x + (Math.random() - 0.5) * 50 * s,
        y: y + (Math.random() - 0.5) * 50 * s,
        vx: (Math.random() - 0.5) * 20, vy: 20 + Math.random() * 30,
        size: 1.6, color: '#dff2ff',
        life: 0.7 + Math.random() * 0.4,
        shrink: false, glow: 4, drag: 1,
      });
    }
  }

  // Lightning — jagged bolt from a high point to target, plus impact sparks
  // and a brief screen flash.
  lightningBolt(toX, toY, fromY = -20, opts = {}) {
    const branchCount = opts.branches ?? 1;
    const color = opts.color ?? '#dff2ff';
    // Generate the bolt's polyline once
    const segs = 14;
    const xs = [toX], ys = [fromY];
    for (let i = 1; i < segs; i++) {
      const k = i / segs;
      const baseX = toX + (toX - toX) * k; // straight line; jitter below
      const baseY = fromY + (toY - fromY) * k;
      xs.push(baseX + (Math.random() - 0.5) * 60 * (1 - k));
      ys.push(baseY);
    }
    xs.push(toX); ys.push(toY);
    // Screen flash
    this.shape(0.18, (ctx, k) => {
      ctx.save();
      ctx.fillStyle = `rgba(255,255,255,${0.45 * (1 - k)})`;
      ctx.fillRect(-2000, -2000, 6000, 6000);
      ctx.restore();
    });
    // Main bolt
    this.shape(0.28, (ctx, k) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 5 * (1 - k);
      ctx.shadowColor = color;
      ctx.shadowBlur = 18 * (1 - k);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(xs[0], ys[0]);
      for (let i = 1; i < xs.length; i++) ctx.lineTo(xs[i], ys[i]);
      ctx.stroke();
      // Bright core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 * (1 - k);
      ctx.shadowBlur = 8 * (1 - k);
      ctx.stroke();
      // Branches
      for (let b = 0; b < branchCount; b++) {
        const i = 4 + b * 3;
        if (i >= xs.length - 1) continue;
        ctx.beginPath();
        ctx.moveTo(xs[i], ys[i]);
        const bx = xs[i] + (Math.random() - 0.5) * 80;
        const by = ys[i] + 30 + Math.random() * 30;
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
      ctx.restore();
    });
    // Impact burst
    for (let i = 0; i < 20; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 80 + Math.random() * 220;
      this.spawn({
        x: toX, y: toY,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        gravity: 80, drag: 2,
        size: 2 + Math.random() * 2,
        color: ['#dff2ff', '#ffd84d', '#ffffff'][Math.floor(Math.random() * 3)],
        life: 0.4 + Math.random() * 0.3,
        shrink: true, glow: 8,
      });
    }
  }

  // Healing motes — soft green/white glow on target, plus rising sparkles.
  healingMotes(x, y, scale = 1) {
    const s = scale;
    // Soft inner glow that swells
    this.shape(0.7, (ctx, k) => {
      const r = (30 + k * 30) * s;
      const a = Math.sin(k * Math.PI);
      const g = ctx.createRadialGradient(x, y - 4, 0, x, y - 4, r);
      g.addColorStop(0, `rgba(180,255,200,${0.5 * a})`);
      g.addColorStop(1, 'rgba(120,255,180,0)');
      ctx.save();
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y - 4, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Rising motes (spiraling)
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2;
      const ringR = 18 * s;
      this.spawn({
        x: x + Math.cos(ang) * ringR,
        y: y + Math.sin(ang) * ringR * 0.4,
        vx: -Math.cos(ang) * 12 * s,
        vy: -40 - Math.random() * 30,
        gravity: -8 * s,
        size: 2.5,
        color: ['#a8ffc8', '#ffffff', '#d4ffd4'][Math.floor(Math.random() * 3)],
        life: 0.9 + Math.random() * 0.4,
        shrink: false, glow: 8,
      });
    }
    // Cross flash sigil
    this.shape(0.45, (ctx, k) => {
      ctx.save();
      ctx.globalAlpha = (1 - k) * 0.8;
      ctx.strokeStyle = '#d4ffd4';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#7aff8a'; ctx.shadowBlur = 12;
      const r = 16 * s + k * 10;
      ctx.beginPath();
      ctx.moveTo(x - r, y - 6); ctx.lineTo(x + r, y - 6);
      ctx.moveTo(x, y - 6 - r); ctx.lineTo(x, y - 6 + r);
      ctx.stroke();
      ctx.restore();
    });
  }

  // Slash — fast diagonal streak with a couple of impact specks.
  slashHit(x, y, angle = -Math.PI / 4) {
    this.shape(0.18, (ctx, k) => {
      const len = 70 * (1 - k * 0.3);
      const half = len / 2;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4 * (1 - k);
      ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-half, 0);
      ctx.lineTo(half, 0);
      ctx.stroke();
      ctx.restore();
    });
    for (let i = 0; i < 8; i++) {
      const ang = angle + (Math.random() - 0.5) * 1.2;
      const sp = 80 + Math.random() * 120;
      this.spawn({
        x, y,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        gravity: 200, drag: 2,
        size: 2, color: '#ffd84d',
        life: 0.3 + Math.random() * 0.2,
        shrink: true, glow: 4,
      });
    }
  }

  // A quick radial shockwave ring — useful generic accent.
  shockwave(x, y, color = '#ffffff', radius = 80, dur = 0.4) {
    this.shape(dur, (ctx, k) => {
      ctx.save();
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3 * (1 - k);
      ctx.beginPath();
      ctx.arc(x, y, radius * k, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  // Ground sigil — a far richer cast-windup pattern under the caster's feet.
  // Two counter-rotating rings, a hexagram, eight short rune-ticks, an
  // element-specific central glyph, and rising motes. Designed to LOOK like
  // serious magic. Drawn flat to the ground (oblong ellipse, not a circle).
  groundSigil(x, y, color = '#ffd84d', element = 'phys', dur = 0.55, scale = 1) {
    const baseR = 56 * scale;
    this.shape(dur, (ctx, k, t) => {
      ctx.save();
      // Ground projection — squash so it reads as drawn on the floor
      ctx.translate(x, y + 18 * scale);
      ctx.scale(1, 0.36);
      const breathe = Math.sin(k * Math.PI);
      // Outer dark backing — burns the sigil into the floor briefly.
      ctx.globalAlpha = 0.45 * breathe;
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.beginPath();
      ctx.arc(0, 0, baseR * 1.05, 0, Math.PI * 2);
      ctx.fill();
      // Pulsing glow disc
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, baseR);
      g.addColorStop(0, this._withAlpha(color, 0.45 * breathe));
      g.addColorStop(0.6, this._withAlpha(color, 0.18 * breathe));
      g.addColorStop(1, this._withAlpha(color, 0));
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, baseR, 0, Math.PI * 2);
      ctx.fill();
      // Outer ring rotating one way
      ctx.globalAlpha = breathe;
      ctx.strokeStyle = color;
      ctx.shadowColor = color; ctx.shadowBlur = 12 * scale;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, baseR, 0, Math.PI * 2);
      ctx.stroke();
      // Outer tick marks
      ctx.save();
      ctx.rotate(t * 1.4);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const r1 = baseR * 0.92, r2 = baseR * 1.04;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
        ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
        ctx.stroke();
      }
      ctx.restore();
      // Inner ring rotating the other way
      ctx.beginPath();
      ctx.arc(0, 0, baseR * 0.72, 0, Math.PI * 2);
      ctx.stroke();
      // Inner rune-ticks (longer marks)
      ctx.save();
      ctx.rotate(-t * 2.0);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const r1 = baseR * 0.55, r2 = baseR * 0.72;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
        ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
        ctx.stroke();
        // Tiny diamond at outer end of each tick
        ctx.save();
        ctx.translate(Math.cos(a) * r2, Math.sin(a) * r2);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(0, -3);
        ctx.lineTo(4, 0);
        ctx.lineTo(0, 3);
        ctx.lineTo(-4, 0);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      // Hexagram (six-pointed star) inside the inner ring
      ctx.save();
      ctx.rotate(t * 0.6);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let tri = 0; tri < 2; tri++) {
        const off = tri * Math.PI / 3;
        for (let i = 0; i <= 3; i++) {
          const a = off + (i % 3) * (Math.PI * 2 / 3) - Math.PI / 2;
          const px = Math.cos(a) * baseR * 0.55;
          const py = Math.sin(a) * baseR * 0.55;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
      ctx.restore();
      // Element glyph in the centre
      ctx.save();
      ctx.rotate(t * 0.4);
      ctx.lineWidth = 2;
      this._drawElementGlyph(ctx, element, baseR * 0.32, color);
      ctx.restore();
      ctx.restore();
    });
    // Rising motes from the sigil — these stay un-squashed so they read in 3D.
    for (let i = 0; i < 18; i++) {
      const ang = (i / 18) * Math.PI * 2 + Math.random() * 0.2;
      const dist = baseR * 0.6 + Math.random() * baseR * 0.4;
      const delay = Math.random() * 0.2;
      // delay via spawning slightly later wouldn't fit our particle model;
      // approximate by adjusting initial life.
      this.spawn({
        x: x + Math.cos(ang) * dist, y: y + 14 + Math.sin(ang) * dist * 0.36,
        vx: Math.cos(ang) * 12, vy: -50 - Math.random() * 30,
        gravity: -8, drag: 0.5,
        size: 1.8 + Math.random() * 1.0,
        color,
        life: 0.7 + Math.random() * 0.3 - delay,
        shrink: false, glow: 8,
      });
    }
  }

  // Element-specific centre glyph for the ground sigil. Draws into the
  // already-rotated/scaled context. Stroke + fill colors use the passed color.
  _drawElementGlyph(ctx, element, r, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    if (element === 'fire') {
      // Triangle flame
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.bezierCurveTo(r * 0.7, -r * 0.2, r * 0.5, r * 0.7, 0, r);
      ctx.bezierCurveTo(-r * 0.5, r * 0.7, -r * 0.7, -r * 0.2, 0, -r);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.4);
      ctx.lineTo(r * 0.3, r * 0.3);
      ctx.lineTo(-r * 0.3, r * 0.3);
      ctx.closePath();
      ctx.fill();
    } else if (element === 'ice') {
      // Six-armed snowflake
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        // little side branches
        ctx.moveTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6);
        ctx.lineTo(Math.cos(a) * r * 0.6 + Math.cos(a + Math.PI / 3) * r * 0.25,
                    Math.sin(a) * r * 0.6 + Math.sin(a + Math.PI / 3) * r * 0.25);
        ctx.moveTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6);
        ctx.lineTo(Math.cos(a) * r * 0.6 + Math.cos(a - Math.PI / 3) * r * 0.25,
                    Math.sin(a) * r * 0.6 + Math.sin(a - Math.PI / 3) * r * 0.25);
        ctx.stroke();
      }
    } else if (element === 'thunder') {
      // Zigzag bolt
      ctx.beginPath();
      ctx.moveTo(-r * 0.4, -r);
      ctx.lineTo(r * 0.15, -r * 0.2);
      ctx.lineTo(-r * 0.15, 0);
      ctx.lineTo(r * 0.35, r);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.15, 0, Math.PI * 2);
      ctx.fill();
    } else if (element === 'water') {
      // Wave droplet
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.bezierCurveTo(r * 0.7, -r * 0.2, r * 0.5, r * 0.6, 0, r * 0.85);
      ctx.bezierCurveTo(-r * 0.5, r * 0.6, -r * 0.7, -r * 0.2, 0, -r);
      ctx.stroke();
      // Wave line through middle
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, r * 0.2);
      ctx.bezierCurveTo(-r * 0.3, -r * 0.1, r * 0.3, r * 0.5, r * 0.7, r * 0.2);
      ctx.stroke();
    } else if (element === 'dark') {
      // Void cross — a + with a black-hole circle in the middle
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(0, r);
      ctx.moveTo(-r, 0);
      ctx.lineTo(r, 0);
      ctx.stroke();
    } else if (element === 'nature') {
      // Leaf with vein
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.bezierCurveTo(r * 0.9, -r * 0.3, r * 0.4, r * 0.7, 0, r);
      ctx.bezierCurveTo(-r * 0.4, r * 0.7, -r * 0.9, -r * 0.3, 0, -r);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(0, r);
      ctx.moveTo(0, -r * 0.4); ctx.lineTo(r * 0.4, -r * 0.1);
      ctx.moveTo(0, -r * 0.4); ctx.lineTo(-r * 0.4, -r * 0.1);
      ctx.moveTo(0, 0); ctx.lineTo(r * 0.5, r * 0.3);
      ctx.moveTo(0, 0); ctx.lineTo(-r * 0.5, r * 0.3);
      ctx.stroke();
    } else if (element === 'holy') {
      // Radiant sun — central disc + rays
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5);
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.stroke();
      }
    } else if (element === 'poison') {
      // Triple-drop trefoil
      for (let i = 0; i < 3; i++) {
        const a = i * Math.PI * 2 / 3 - Math.PI / 2;
        ctx.save();
        ctx.rotate(a + Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.85);
        ctx.bezierCurveTo(r * 0.45, -r * 0.3, r * 0.35, r * 0.1, 0, r * 0.1);
        ctx.bezierCurveTo(-r * 0.35, r * 0.1, -r * 0.45, -r * 0.3, 0, -r * 0.85);
        ctx.stroke();
        ctx.restore();
      }
    } else if (element === 'nonelemental') {
      // A radiant compass — diamond + circle
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r, 0);
      ctx.lineTo(0, r);
      ctx.lineTo(-r, 0);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Default — sword cross
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(0, r);
      ctx.moveTo(-r * 0.6, -r * 0.3);
      ctx.lineTo(r * 0.6, -r * 0.3);
      ctx.stroke();
    }
  }

  // Particles streaming from the air *into* the caster — sets the cast up.
  castCharge(x, y, color = '#ffd84d', scale = 1) {
    for (let i = 0; i < 14; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = (90 + Math.random() * 60) * scale;
      const sp = dist / 0.32;
      this.spawn({
        x: x + Math.cos(ang) * dist, y: y + Math.sin(ang) * dist,
        vx: -Math.cos(ang) * sp, vy: -Math.sin(ang) * sp,
        gravity: 0, drag: 1.4,
        size: 1.8 + Math.random() * 1.0,
        color, glow: 9,
        life: 0.32, shrink: true,
      });
    }
  }

  // Projectile that travels from one point to another over `dur` seconds,
  // leaving an element-tinted trail. Calls `onArrive` when it lands.
  castProjectile(fromX, fromY, toX, toY, color = '#ffd84d', dur = 0.32, onArrive = null) {
    const dx = toX - fromX, dy = toY - fromY;
    const speed = Math.hypot(dx, dy) / dur;
    const ang = Math.atan2(dy, dx);
    this.shape(dur, (ctx, k) => {
      const x = fromX + dx * k;
      const y = fromY + dy * k - Math.sin(k * Math.PI) * 18;
      // Glow comet
      ctx.save();
      const grad = ctx.createRadialGradient(x, y, 0, x, y, 22);
      grad.addColorStop(0, this._withAlpha('#ffffff', 0.9));
      grad.addColorStop(0.3, this._withAlpha(color, 0.85));
      grad.addColorStop(1, this._withAlpha(color, 0));
      ctx.fillStyle = grad;
      ctx.shadowColor = color; ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();
      // Direction streak
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.fillStyle = this._withAlpha(color, 0.65);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-22, 6);
      ctx.lineTo(-30, 0);
      ctx.lineTo(-22, -6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // Trail motes
      if (Math.random() < 0.85) {
        this.spawn({
          x, y, vx: (Math.random() - 0.5) * 18, vy: (Math.random() - 0.5) * 18 + 4,
          gravity: 10, drag: 1.6,
          size: 1.5 + Math.random(), color, glow: 6,
          life: 0.25 + Math.random() * 0.15, shrink: true,
        });
      }
    });
    if (onArrive) setTimeout(onArrive, dur * 1000);
  }

  // Element-impact effects beyond the existing fire/ice/lightning.
  waterColumn(x, y, scale = 1) {
    const s = scale;
    // Rising water column
    this.shape(0.45, (ctx, k) => {
      ctx.save();
      const h = 90 * s * (1 - Math.abs(k - 0.4) / 0.6);
      const g = ctx.createLinearGradient(x, y - h, x, y + 20);
      g.addColorStop(0, `rgba(180,230,250,${0.85 * (1 - k)})`);
      g.addColorStop(0.5, `rgba(80,170,220,${0.7 * (1 - k)})`);
      g.addColorStop(1, `rgba(40,100,160,0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y - h * 0.4, 26 * s, h * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Splash droplets out
    for (let i = 0; i < 24; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
      const sp = (80 + Math.random() * 140) * s;
      this.spawn({
        x, y: y - 10,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        gravity: 240, drag: 0.8,
        size: 2.4 + Math.random() * 1.4,
        color: ['#a0d0ee', '#cfeaff', '#3b9adb', '#ffffff'][Math.floor(Math.random() * 4)],
        life: 0.55 + Math.random() * 0.3, shrink: true, glow: 6,
      });
    }
    // Wet ring
    this.shockwave(x, y, '#7adaff', 90 * s, 0.5);
  }

  darkRift(x, y, scale = 1) {
    const s = scale;
    // Black-hole core pulses inward
    this.shape(0.5, (ctx, k) => {
      ctx.save();
      const r = (60 - k * 22) * s;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(0.55, `rgba(60,20,90,${1 - k})`);
      g.addColorStop(1, `rgba(160,80,255,${0.4 * (1 - k)})`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      // Violet rim
      ctx.strokeStyle = `rgba(192,96,255,${(1 - k)})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = '#a060ff'; ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
    // Particles being pulled in
    for (let i = 0; i < 28; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = (80 + Math.random() * 70) * s;
      this.spawn({
        x: x + Math.cos(ang) * dist, y: y + Math.sin(ang) * dist,
        vx: -Math.cos(ang) * 180, vy: -Math.sin(ang) * 180,
        gravity: 0, drag: 1.8,
        size: 1.8 + Math.random() * 1.2,
        color: ['#a060ff', '#6020a0', '#d0a0ff', '#ffffff'][Math.floor(Math.random() * 4)],
        life: 0.45 + Math.random() * 0.2, shrink: true, glow: 9,
      });
    }
  }

  natureBurst(x, y, scale = 1) {
    const s = scale;
    // Thorned vines bursting up
    this.shape(0.55, (ctx, k) => {
      ctx.save();
      ctx.strokeStyle = '#3a7a3b';
      ctx.lineWidth = 3 * (1 - k);
      ctx.shadowColor = '#7aaa3a'; ctx.shadowBlur = 12 * (1 - k);
      ctx.lineCap = 'round';
      for (let v = 0; v < 6; v++) {
        const a = -Math.PI / 2 + (v - 2.5) * 0.35;
        const reach = (40 + 40 * k) * s;
        const ex = x + Math.cos(a) * reach;
        const ey = y + Math.sin(a) * reach * 1.1;
        ctx.beginPath();
        ctx.moveTo(x, y + 6);
        ctx.bezierCurveTo(
          x + (ex - x) * 0.4, y - 6,
          x + (ex - x) * 0.7, ey + 6,
          ex, ey,
        );
        ctx.stroke();
        // Thorn at tip
        ctx.fillStyle = '#1a3a1a';
        ctx.beginPath();
        ctx.arc(ex, ey, 3 * (1 - k), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    // Petal/leaf confetti
    for (let i = 0; i < 22; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
      const sp = (60 + Math.random() * 100) * s;
      this.spawn({
        x, y,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        gravity: 120, drag: 1.0,
        size: 2.2 + Math.random() * 1.4,
        color: ['#7aff8a', '#3a7a3b', '#a8d878', '#ffae3b'][Math.floor(Math.random() * 4)],
        life: 0.7 + Math.random() * 0.4, shrink: false, glow: 5,
        shape: 'diamond', rot: ang, rotVel: 2 + Math.random() * 3,
      });
    }
    this.shockwave(x, y, '#7aaa3a', 80 * s, 0.45);
  }

  holyPillar(x, y, scale = 1) {
    const s = scale;
    // Descending light pillar
    this.shape(0.55, (ctx, k) => {
      ctx.save();
      const w = 70 * s * (k < 0.4 ? k / 0.4 : 1 - (k - 0.4) / 0.6);
      const g = ctx.createLinearGradient(x, y - 300, x, y + 20);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.6, `rgba(255,240,180,${0.7 * (1 - k)})`);
      g.addColorStop(1, `rgba(255,210,90,${0.95 * (1 - k)})`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x - w / 2, y);
      ctx.lineTo(x + w / 2, y);
      ctx.lineTo(x + w / 6, y - 320);
      ctx.lineTo(x - w / 6, y - 320);
      ctx.closePath();
      ctx.fill();
      // Crown ring at impact
      const r = 40 * s + k * 40 * s;
      ctx.strokeStyle = `rgba(255,240,180,${1 - k})`;
      ctx.lineWidth = 3 * (1 - k);
      ctx.shadowColor = '#ffd884'; ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
    // Bright motes ascending
    for (let i = 0; i < 28; i++) {
      this.spawn({
        x: x + (Math.random() - 0.5) * 80 * s,
        y: y + (Math.random() - 0.5) * 30 * s,
        vx: (Math.random() - 0.5) * 20, vy: -70 - Math.random() * 80,
        gravity: -20, drag: 0.4,
        size: 1.8 + Math.random() * 1.6,
        color: ['#fff5d8', '#ffd884', '#ffffff', '#ffc0a0'][Math.floor(Math.random() * 4)],
        life: 0.8 + Math.random() * 0.5, shrink: false, glow: 10,
      });
    }
  }

  poisonCloud(x, y, scale = 1) {
    const s = scale;
    // Wide gas cloud blooming outward
    this.shape(0.6, (ctx, k) => {
      ctx.save();
      const r = (35 + k * 60) * s;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + k * 0.6;
        const cx = x + Math.cos(a) * r * 0.45;
        const cy = y + Math.sin(a) * r * 0.45;
        const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.7);
        gr.addColorStop(0, `rgba(154,170,59,${0.55 * (1 - k)})`);
        gr.addColorStop(1, `rgba(80,90,30,0)`);
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    // Bubble droplets
    for (let i = 0; i < 18; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = (30 + Math.random() * 70) * s;
      this.spawn({
        x, y,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 30,
        gravity: 90, drag: 0.8,
        size: 2.2 + Math.random() * 1.2,
        color: ['#9aaa3b', '#7a8a25', '#c0d860'][Math.floor(Math.random() * 3)],
        life: 0.6 + Math.random() * 0.3, shrink: false, glow: 7,
      });
    }
  }

  ultimaBurst(x, y, scale = 1) {
    const s = scale;
    // Triple concentric rings + multi-color rainbow flash
    this.shape(0.65, (ctx, k) => {
      ctx.save();
      const r = (60 + k * 220) * s;
      for (let i = 0; i < 3; i++) {
        const rr = r * (1 - i * 0.18);
        ctx.strokeStyle = ['#ffffff', '#c0a0ff', '#7adaff'][i];
        ctx.lineWidth = (4 - i) * (1 - k);
        ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(x, y, rr, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Central white flash
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 0.55);
      g.addColorStop(0, `rgba(255,255,255,${0.95 * (1 - k)})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Rainbow sparks bursting out
    const colors = ['#ff5a3b', '#ff8a3b', '#ffd84d', '#7aff8a', '#7adaff', '#a060ff', '#ffffff'];
    for (let i = 0; i < 60; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = (90 + Math.random() * 280) * s;
      this.spawn({
        x, y,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        gravity: 30, drag: 0.7,
        size: 2.4 + Math.random() * 2.0,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0.7 + Math.random() * 0.5, shrink: false, glow: 12,
      });
    }
  }

  // A bright halo + spiralling motes around a caster while a big spell builds.
  // The aura grows during cast, then snaps inward as the spell launches.
  casterAura(x, y, color = '#ffd84d', dur = 0.55, scale = 1) {
    this.shape(dur, (ctx, k) => {
      ctx.save();
      const r = (30 + Math.sin(k * Math.PI) * 18) * scale;
      // Soft body halo
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, this._withAlpha(color, 0.55 * Math.sin(k * Math.PI)));
      g.addColorStop(1, this._withAlpha(color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      // Two counter-spinning rings around the body
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.4;
      ctx.shadowColor = color; ctx.shadowBlur = 10;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(k * Math.PI * 4);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.85, r * 0.4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-k * Math.PI * 3 + Math.PI / 6);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.65, r * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      ctx.restore();
    });
    // Spiralling motes lifting off the caster
    for (let i = 0; i < 22; i++) {
      const ang = (i / 22) * Math.PI * 2;
      const dist = 30 * scale + Math.random() * 14;
      this.spawn({
        x: x + Math.cos(ang) * dist, y: y + Math.sin(ang) * dist,
        vx: Math.cos(ang + Math.PI / 2) * 36, vy: -45 - Math.random() * 30,
        gravity: -20, drag: 0.4,
        size: 1.8 + Math.random() * 1.0, color,
        life: 0.55 + Math.random() * 0.3, shrink: false, glow: 10,
      });
    }
  }

  // Predictive sigil under a target — appears moments before the projectile
  // arrives, marking the kill-zone. Same visual language as groundSigil but
  // smaller and reverse-rotation.
  targetSigil(x, y, color = '#ffd84d', element = 'phys', dur = 0.4, scale = 1) {
    const baseR = 42 * scale;
    this.shape(dur, (ctx, k, t) => {
      ctx.save();
      ctx.translate(x, y + 14 * scale);
      ctx.scale(1, 0.36);
      const fadein = k < 0.3 ? k / 0.3 : 1;
      const fadeout = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
      ctx.globalAlpha = fadein * fadeout;
      // Crimson danger halo
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, baseR);
      g.addColorStop(0, this._withAlpha(color, 0.45));
      g.addColorStop(1, this._withAlpha(color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, baseR, 0, Math.PI * 2);
      ctx.fill();
      // Inverted-rotation outer ring with tick marks
      ctx.strokeStyle = color;
      ctx.shadowColor = color; ctx.shadowBlur = 10;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, baseR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.save();
      ctx.rotate(-t * 3.0);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * baseR * 0.78, Math.sin(a) * baseR * 0.78);
        ctx.lineTo(Math.cos(a) * baseR * 1.02, Math.sin(a) * baseR * 1.02);
        ctx.stroke();
      }
      ctx.restore();
      // Central element glyph (smaller)
      ctx.save();
      ctx.rotate(t * 0.8);
      this._drawElementGlyph(ctx, element, baseR * 0.32, color);
      ctx.restore();
      ctx.restore();
    });
  }

  // A wide column of light descending from off-screen above into a target
  // point. The signature tier-3 cinematic gesture — used by Holyga/Firaga/etc.
  // The element parameter tints the column.
  skyBeam(x, y, color = '#ffd884', dur = 0.55, scale = 1) {
    this.shape(dur, (ctx, k) => {
      ctx.save();
      // Beam envelope grows then collapses
      const w = (28 + Math.sin(k * Math.PI) * 38) * scale;
      const top = y - 480;
      const grad = ctx.createLinearGradient(x, top, x, y);
      grad.addColorStop(0, this._withAlpha(color, 0));
      grad.addColorStop(0.55, this._withAlpha(color, 0.6 * Math.sin(k * Math.PI)));
      grad.addColorStop(1, this._withAlpha(color, 0.9 * Math.sin(k * Math.PI)));
      ctx.fillStyle = grad;
      ctx.beginPath();
      // Trapezoid widening toward the ground
      ctx.moveTo(x - w * 0.35, top);
      ctx.lineTo(x + w * 0.35, top);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x - w, y);
      ctx.closePath();
      ctx.fill();
      // Bright inner core
      const coreW = w * 0.45;
      const coreG = ctx.createLinearGradient(x, top, x, y);
      coreG.addColorStop(0, this._withAlpha('#ffffff', 0));
      coreG.addColorStop(1, this._withAlpha('#ffffff', 0.85 * Math.sin(k * Math.PI)));
      ctx.fillStyle = coreG;
      ctx.beginPath();
      ctx.moveTo(x - coreW * 0.3, top);
      ctx.lineTo(x + coreW * 0.3, top);
      ctx.lineTo(x + coreW, y);
      ctx.lineTo(x - coreW, y);
      ctx.closePath();
      ctx.fill();
      // Rim glow lines
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowColor = color; ctx.shadowBlur = 18;
      ctx.globalAlpha = Math.sin(k * Math.PI);
      ctx.beginPath();
      ctx.moveTo(x - w * 0.35, top); ctx.lineTo(x - w, y);
      ctx.moveTo(x + w * 0.35, top); ctx.lineTo(x + w, y);
      ctx.stroke();
      ctx.restore();
    });
    // Falling motes inside the beam column
    for (let i = 0; i < 26; i++) {
      this.spawn({
        x: x + (Math.random() - 0.5) * 50 * scale,
        y: y - 320 - Math.random() * 140,
        vx: 0, vy: 380 + Math.random() * 220,
        gravity: 80, drag: 0.4,
        size: 1.8 + Math.random() * 1.4,
        color, glow: 8,
        life: 0.55 + Math.random() * 0.25, shrink: false,
      });
    }
    // Splash at the landing
    setTimeout(() => {
      this.shockwave(x, y, color, 90 * scale, 0.45);
    }, dur * 600);
  }

  // A lingering scorch / glow at impact that stays for ~1.5s — gives weight
  // to tier-3 hits so the screen doesn't reset to neutral instantly.
  lingerScorch(x, y, color = '#ff5a3b', scale = 1, dur = 1.4) {
    this.shape(dur, (ctx, k) => {
      ctx.save();
      ctx.translate(x, y + 16 * scale);
      ctx.scale(1, 0.32);
      const r = 60 * scale * (1 - k * 0.25);
      const a = (1 - k);
      // Dark base
      ctx.globalAlpha = 0.55 * a;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
      ctx.fill();
      // Element-tinted glow
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0, this._withAlpha(color, 0.7 * a));
      g.addColorStop(1, this._withAlpha(color, 0));
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      // Faint cracks
      ctx.strokeStyle = this._withAlpha(color, 0.85 * a);
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 5; i++) {
        const ang = (i / 5) * Math.PI * 2 + 0.4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang) * r * 0.85, Math.sin(ang) * r * 0.85);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  // =====================================================================
  // SIGNATURE COMBO VISUALS — bespoke flourishes used by 2-gem and 3-gem
  // fusion spells. Layered ON TOP of the standard tier-3 cinematic stack
  // so combos always read as more spectacular than the base -ga spells.
  // =====================================================================

  // Dual staggered impact — two element-colored bursts at offset positions.
  // Used by Twin Pyre, Twin Glacier, Twin Sun, Twin Steam, etc.
  dualImpact(x, y, color1 = '#ff5a3b', color2 = '#7adaff', scale = 1) {
    for (const [dx, dy, c, delay] of [[-22, -10, color1, 0], [22, 10, color2, 0.18]]) {
      setTimeout(() => {
        this.shockwave(x + dx, y + dy, c, 90 * scale, 0.45);
        this.shape(0.4, (ctx, k) => {
          ctx.save();
          const r = 40 * scale * (1 - k);
          const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
          g.addColorStop(0, this._withAlpha('#ffffff', 0.9 * (1 - k)));
          g.addColorStop(0.4, this._withAlpha(c, 0.7 * (1 - k)));
          g.addColorStop(1, this._withAlpha(c, 0));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
        for (let i = 0; i < 22; i++) {
          const ang = Math.random() * Math.PI * 2;
          const sp = 70 + Math.random() * 140;
          this.spawn({
            x: x + dx, y: y + dy,
            vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
            gravity: 80, drag: 1.0,
            size: 2.2 + Math.random() * 1.4, color: c,
            life: 0.45 + Math.random() * 0.25, shrink: true, glow: 9,
          });
        }
      }, delay * 1000);
    }
  }

  // Shatter rain — descending shards from above, then settle and fade.
  // Glassy crystal feel; used by Glacial Field, Frost Tomb, etc.
  shatterRain(x, y, color = '#cfeaff', scale = 1) {
    for (let i = 0; i < 24; i++) {
      const sx = x + (Math.random() - 0.5) * 200 * scale;
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
      this.spawn({
        x: sx, y: y - 200 - Math.random() * 80,
        vx: Math.cos(ang) * 30, vy: 220 + Math.random() * 140,
        gravity: 220, drag: 0.4,
        size: 3 + Math.random() * 2.5, color,
        life: 0.6 + Math.random() * 0.3, shrink: true, glow: 8,
        shape: 'diamond', rot: ang, rotVel: 3 + Math.random() * 4,
      });
    }
    // Ground sparkle on landing
    setTimeout(() => {
      for (let i = 0; i < 14; i++) {
        const ang = (i / 14) * Math.PI * 2;
        this.spawn({
          x: x + Math.cos(ang) * 30 * scale, y: y + Math.sin(ang) * 10 * scale,
          vx: Math.cos(ang) * 40, vy: -20 - Math.random() * 40,
          gravity: 40, drag: 0.6,
          size: 1.8, color, glow: 8,
          life: 0.7, shrink: false,
        });
      }
    }, 400);
  }

  // Living tree — a growing tree silhouette of leaves/branches at the target.
  // Used by Worldtree's Bloom, Ashen Grove, Living Pyre.
  livingTree(x, y, trunkColor = '#5a3a18', leafColor = '#7aff8a', scale = 1) {
    this.shape(0.9, (ctx, k) => {
      ctx.save();
      const grow = Math.min(1, k * 1.3);
      const h = 120 * scale * grow;
      // Trunk
      ctx.strokeStyle = trunkColor;
      ctx.lineWidth = 8 * scale * (1 - k * 0.3);
      ctx.shadowColor = trunkColor; ctx.shadowBlur = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - h);
      ctx.stroke();
      // Branches
      const branchT = Math.min(1, (k - 0.2) * 1.5);
      if (branchT > 0) {
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(x, y - h * 0.5);
          ctx.lineTo(x + side * 40 * scale * branchT, y - h * 0.7);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x, y - h * 0.7);
          ctx.lineTo(x + side * 28 * scale * branchT, y - h * 0.92);
          ctx.stroke();
        }
      }
      // Canopy bloom
      const leafT = Math.min(1, (k - 0.4) * 1.6);
      if (leafT > 0) {
        const cw = 60 * scale * leafT;
        const lgrad = ctx.createRadialGradient(x, y - h, 0, x, y - h, cw);
        lgrad.addColorStop(0, this._withAlpha('#ffffff', 0.7 * leafT));
        lgrad.addColorStop(0.4, this._withAlpha(leafColor, 0.8 * leafT));
        lgrad.addColorStop(1, this._withAlpha(leafColor, 0));
        ctx.fillStyle = lgrad;
        ctx.beginPath();
        ctx.arc(x, y - h, cw, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    // Falling petals/leaves
    setTimeout(() => {
      for (let i = 0; i < 24; i++) {
        const sx = x + (Math.random() - 0.5) * 100 * scale;
        this.spawn({
          x: sx, y: y - 100 - Math.random() * 40,
          vx: (Math.random() - 0.5) * 30, vy: 40 + Math.random() * 30,
          gravity: 40, drag: 0.6,
          size: 2.2 + Math.random() * 1.4, color: leafColor,
          life: 1.2 + Math.random() * 0.5, shrink: false, glow: 6,
          shape: 'diamond', rot: Math.random() * Math.PI, rotVel: 2 + Math.random() * 3,
        });
      }
    }, 600);
  }

  // Black star — collapsing supernova of inverse light. Used by Twin Sun,
  // Voidlight, Cryomancer's Curse.
  blackStar(x, y, scale = 1) {
    // Implosion phase
    this.shape(0.55, (ctx, k) => {
      ctx.save();
      const phase = k < 0.5 ? k * 2 : 1; // implode first half, then hold
      const r = 90 * scale * (1 - phase * 0.6);
      // Outer dark
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(0.4, `rgba(40,10,80,${1 - phase * 0.3})`);
      g.addColorStop(0.8, `rgba(160,60,255,${0.6 - phase * 0.3})`);
      g.addColorStop(1, 'rgba(160,60,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      // White-hot core
      const cw = 14 * scale * (1 - phase);
      if (cw > 0.5) {
        ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 22;
        ctx.fillStyle = `rgba(255,255,255,${1 - phase * 0.6})`;
        ctx.beginPath();
        ctx.arc(x, y, cw, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    // After implosion: explosive outward burst
    setTimeout(() => {
      for (let i = 0; i < 48; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 100 + Math.random() * 240;
        this.spawn({
          x, y,
          vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
          gravity: 20, drag: 0.6,
          size: 2.4 + Math.random() * 1.8,
          color: ['#a060ff', '#ffffff', '#6020a0', '#d0a0ff'][Math.floor(Math.random() * 4)],
          life: 0.7 + Math.random() * 0.4, shrink: true, glow: 12,
        });
      }
      this.shockwave(x, y, '#a060ff', 160 * scale, 0.6);
      this.shockwave(x, y, '#ffffff', 80 * scale, 0.4);
    }, 350);
  }

  // Star burst — a radiating crystalline star pattern (8-pointed) at target.
  // Used by Day Star, Sunlit Sea, Verdant Sun.
  starBurst(x, y, color = '#ffd884', scale = 1) {
    this.shape(0.6, (ctx, k) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(k * 0.4);
      const a = 1 - k;
      ctx.strokeStyle = this._withAlpha(color, a);
      ctx.lineWidth = 4 * scale * a;
      ctx.shadowColor = color; ctx.shadowBlur = 24 * a;
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const len = (40 + k * 80) * scale;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
        ctx.stroke();
      }
      // Inner hot core
      ctx.fillStyle = this._withAlpha('#ffffff', a);
      ctx.beginPath();
      ctx.arc(0, 0, 14 * scale * a, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Particles radiating along the rays
    for (let i = 0; i < 32; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 80 + Math.random() * 160;
      this.spawn({
        x, y,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        gravity: 0, drag: 0.8,
        size: 2 + Math.random() * 1.4, color, glow: 12,
        life: 0.55 + Math.random() * 0.25, shrink: true,
      });
    }
  }

  // Musical notes — bright treble-clef-like glyphs rising from target.
  // Used by Lullsky, Lullsoot, Drowsing Tide (sleep-flavored fusions).
  musicalNotes(x, y, color = '#c0a0ff', scale = 1) {
    this.shape(0.7, (ctx, k) => {
      // The note glyphs themselves are drawn through particles; this shape
      // just provides the soft halo behind them.
      ctx.save();
      const r = 60 * scale * Math.sin(k * Math.PI);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, this._withAlpha(color, 0.35 * (1 - k)));
      g.addColorStop(1, this._withAlpha(color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Note glyphs rising
    const glyphs = ['♪', '♫', '♩', '♬'];
    for (let i = 0; i < 8; i++) {
      const offsetX = (Math.random() - 0.5) * 80 * scale;
      const glyph = glyphs[i % glyphs.length];
      const startTime = i * 60;
      setTimeout(() => {
        this.shape(1.2, (ctx, k) => {
          ctx.save();
          const py = y - k * 80 * scale;
          ctx.globalAlpha = 1 - k;
          ctx.fillStyle = color;
          ctx.shadowColor = color; ctx.shadowBlur = 12;
          ctx.font = `${Math.round(22 * scale)}px serif`;
          ctx.textAlign = 'center';
          ctx.fillText(glyph, x + offsetX + Math.sin(k * 6) * 4, py);
          ctx.restore();
        });
      }, startTime);
    }
  }

  // Rot mist — sickly green/violet cloud with dripping droplets.
  // Used by Necrotic Bloom, Eclipse Petal, Tideblight, Bog Curse.
  rotMist(x, y, scale = 1) {
    this.shape(0.8, (ctx, k) => {
      ctx.save();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + k * 0.4;
        const r = (40 + k * 50) * scale;
        const cx = x + Math.cos(a) * r * 0.5;
        const cy = y + Math.sin(a) * r * 0.5;
        const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.55);
        gr.addColorStop(0, `rgba(110,140,50,${0.5 * (1 - k)})`);
        gr.addColorStop(0.6, `rgba(60,40,110,${0.35 * (1 - k)})`);
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    // Dripping rot droplets
    for (let i = 0; i < 18; i++) {
      const sx = x + (Math.random() - 0.5) * 100 * scale;
      this.spawn({
        x: sx, y: y - 20 - Math.random() * 20,
        vx: (Math.random() - 0.5) * 8, vy: 30 + Math.random() * 50,
        gravity: 120, drag: 0.4,
        size: 2.4 + Math.random() * 1.2,
        color: ['#7a8a25', '#9aaa3b', '#6020a0', '#3a5a2a'][Math.floor(Math.random() * 4)],
        life: 0.9 + Math.random() * 0.4, shrink: false, glow: 6,
      });
    }
  }

  // Inferno vortex — swirling spiral of fire. Used by Pyre Sky, Steam Geyser,
  // Living Pyre, Hellfire Decay, Twin Pyre.
  infernoVortex(x, y, color = '#ff8a3b', scale = 1) {
    this.shape(0.7, (ctx, k) => {
      ctx.save();
      ctx.translate(x, y);
      const rotations = 3;
      for (let arm = 0; arm < 3; arm++) {
        ctx.beginPath();
        ctx.strokeStyle = ['#ffd84d', '#ff8a3b', '#ff5a3b'][arm];
        ctx.lineWidth = 4 * scale * (1 - k * 0.5);
        ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 14;
        const startA = arm * Math.PI * 2 / 3 + k * rotations * Math.PI;
        for (let t = 0; t < 1; t += 0.04) {
          const r = (80 - t * 70) * scale * (1 - k * 0.3);
          const a = startA + t * Math.PI * 2;
          const px = Math.cos(a) * r, py = Math.sin(a) * r;
          if (t === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.restore();
    });
    // Rising ember column
    for (let i = 0; i < 30; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
      const sp = 60 + Math.random() * 80;
      this.spawn({
        x: x + (Math.random() - 0.5) * 30 * scale, y,
        vx: Math.cos(ang) * sp * 0.3, vy: Math.sin(ang) * sp,
        gravity: -30, drag: 0.5,
        size: 2 + Math.random() * 1.6,
        color: ['#ffd84d', '#ff8a3b', '#ff5a3b'][Math.floor(Math.random() * 3)],
        life: 0.7 + Math.random() * 0.4, shrink: false, glow: 8,
      });
    }
  }

  // Mirror strike — single impact that flashes briefly as if it were two.
  // Used by Twin Glacier (when not using dualImpact directly).
  mirrorStrike(x, y, color = '#7adaff', scale = 1) {
    // First strike
    this.fireBloom(x, y, scale);
    // Second ghosted strike after 0.12s
    setTimeout(() => {
      this.shockwave(x + 6, y + 4, color, 80 * scale, 0.45);
      this.shockwave(x - 6, y - 4, '#ffffff', 50 * scale, 0.35);
    }, 120);
  }

  // Brief full-screen tint flash (e.g., Ultima, Holyga, Meteor).
  screenFlash(color = '#ffffff', alpha = 0.45, dur = 0.22) {
    this.shape(dur, (ctx, k) => {
      ctx.save();
      ctx.fillStyle = this._withAlpha(color, alpha * (1 - k));
      ctx.fillRect(-2000, -2000, 6000, 6000);
      ctx.restore();
    });
  }

  // Sustained scene tint — fades in, holds at peak, fades out. Used for
  // cutscene mood lighting (corrupted forest, sacred sanctum, etc.). The
  // canvas tint sits beneath HTML dialog so dialog text stays readable.
  sceneTint(color = '#a060ff', peakAlpha = 0.28, dur = 4.5, fadeIn = 0.15, fadeOut = 0.25) {
    const shape = { t: 0, dur, _isSceneTint: true, draw: (ctx, k) => {
      let a;
      if (k < fadeIn) a = (k / fadeIn) * peakAlpha;
      else if (k > 1 - fadeOut) a = ((1 - k) / fadeOut) * peakAlpha;
      else a = peakAlpha;
      ctx.save();
      ctx.fillStyle = this._withAlpha(color, a);
      ctx.fillRect(-2000, -2000, 6000, 6000);
      ctx.restore();
    } };
    this.shapes.push(shape);
  }

  // Clear all active sceneTint shapes immediately. Used by skippable
  // cutscenes so the screen isn't left dark after the player taps through.
  clearSceneTints() {
    this.shapes = this.shapes.filter(s => !s._isSceneTint);
  }

  // Convert a hex / rgb-ish color to rgba with the given alpha.
  _withAlpha(color, alpha) {
    if (color.startsWith('rgba')) return color;
    if (color.startsWith('rgb(')) return color.replace('rgb(', 'rgba(').replace(')', ',' + alpha + ')');
    if (color.startsWith('#')) {
      const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color);
      if (m) return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${alpha})`;
    }
    return color;
  }

  // Magic circle — slow rotating runed disc, e.g., for cast windups.
  magicCircle(x, y, color = '#ffd84d', dur = 0.7, scale = 1) {
    this.shape(dur, (ctx, k) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(k * Math.PI * 2);
      ctx.globalAlpha = Math.sin(k * Math.PI);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowColor = color; ctx.shadowBlur = 10;
      const r = 40 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      // 6 runes around the ring
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78);
        ctx.lineTo(Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  // Damage hit-spark (small impact for physical hits without a slash arc).
  hitSpark(x, y, color = '#ffd84d') {
    for (let i = 0; i < 10; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 100;
      this.spawn({
        x, y,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        gravity: 200, drag: 2,
        size: 1.6, color,
        life: 0.3 + Math.random() * 0.2,
        shrink: true, glow: 4,
      });
    }
  }

  // Drifting ambient particles (e.g., embers in a cave).
  spawnAmbient({ x, y, color = '#ffd84d', vy = -10, life = 4, size = 1.6, drift = 30 }) {
    this.spawn({
      x, y, vx: (Math.random() - 0.5) * drift, vy: vy + (Math.random() - 0.5) * 10,
      gravity: 0, drag: 0.2,
      size, color, life, shrink: false, glow: 4,
    });
  }
}
