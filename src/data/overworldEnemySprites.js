// Overworld enemy sprites for Aetheria's chapter 1. Each draw fn renders the
// creature centered at (0,0), at the given overworld radius r (~18-22).
// Self-contained — no project imports. Match the detail bar of drawSable in
// npcSprites.js (multi-layer gradient body, shading, distinct silhouette).

export function drawOverworldEnemy(ctx, oe, t, r) {
  switch (oe.spriteId) {
    case 'wolfling':       drawWolfling(ctx, t, r); break;
    case 'bramblePup':     drawBramblePup(ctx, t, r); break;
    case 'corruptedOtter': drawCorruptedOtter(ctx, t, r); break;
    case 'wraithWisp':     drawWraithWisp(ctx, t, r); break;
    case 'alphaScout':     drawAlphaScout(ctx, t, r); break;
    case 'wraithEcho':     drawWraithEcho(ctx, t, r); break;
    default: throw new Error('unknown overworld enemy sprite: ' + oe.spriteId);
  }
}

// --- Shared helpers ----------------------------------------------------------

function drawShadow(ctx, r, opts = {}) {
  const { wide = 1.0, alpha = 0.4 } = opts;
  ctx.fillStyle = 'rgba(0,0,0,' + alpha + ')';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.95, r * 0.85 * wide, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawWraithGlow(ctx, r, rgb) {
  const g = ctx.createRadialGradient(0, r * 0.95, 0, 0, r * 0.95, r * 0.9);
  g.addColorStop(0, 'rgba(' + rgb + ',0.45)');
  g.addColorStop(0.55, 'rgba(' + rgb + ',0.18)');
  g.addColorStop(1, 'rgba(' + rgb + ',0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.95, r * 0.9, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
}

// --- Wolfling ----------------------------------------------------------------
// Lean muddy-grey young wolf — oversized ears, glassy round blue eyes, small
// fangs, swaying tail. Hungry but innocent.

function drawWolfling(ctx, t, r) {
  const bob = Math.sin(t * 2.4) * 0.9;
  const earTwitch = Math.sin(t * 3.1) * 0.08;
  const tailWag = Math.sin(t * 3.6) * 0.3;
  drawShadow(ctx, r);
  ctx.save();
  ctx.translate(0, bob);

  // Tail — curling behind, sways
  ctx.save();
  ctx.translate(-r * 0.55, r * 0.25);
  ctx.rotate(-0.4 + tailWag);
  ctx.strokeStyle = '#3a3a40';
  ctx.lineWidth = Math.max(2, r * 0.12);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-r * 0.2, -r * 0.2, -r * 0.3, -r * 0.5);
  ctx.stroke();
  // Tail tip lighter
  ctx.strokeStyle = '#5a5a64';
  ctx.lineWidth = Math.max(1.5, r * 0.08);
  ctx.beginPath();
  ctx.moveTo(-r * 0.27, -r * 0.42);
  ctx.lineTo(-r * 0.3, -r * 0.5);
  ctx.stroke();
  ctx.restore();

  // Hind leg (back, slight)
  ctx.fillStyle = '#3a3a44';
  ctx.beginPath();
  ctx.ellipse(-r * 0.35, r * 0.7, r * 0.16, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body — lean ovoid with gradient
  const bodyGrad = ctx.createLinearGradient(0, -r * 0.1, 0, r * 0.7);
  bodyGrad.addColorStop(0, '#5a5a64');
  bodyGrad.addColorStop(0.55, '#3a3a44');
  bodyGrad.addColorStop(1, '#1e1e26');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.35, r * 0.5, r * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#10101a';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Front legs
  ctx.fillStyle = '#2e2e38';
  ctx.beginPath();
  ctx.ellipse(-r * 0.18, r * 0.78, r * 0.1, r * 0.18, 0, 0, Math.PI * 2);
  ctx.ellipse(r * 0.18, r * 0.78, r * 0.1, r * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  // Paws — dirty tan
  ctx.fillStyle = '#6a5040';
  ctx.beginPath();
  ctx.ellipse(-r * 0.18, r * 0.92, r * 0.11, r * 0.05, 0, 0, Math.PI * 2);
  ctx.ellipse(r * 0.18, r * 0.92, r * 0.11, r * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head — pointed snout to camera-right
  ctx.save();
  ctx.translate(r * 0.35, r * 0.05);
  // Skull lump
  const headGrad = ctx.createRadialGradient(-r * 0.05, -r * 0.05, 0, 0, 0, r * 0.36);
  headGrad.addColorStop(0, '#6a6a74');
  headGrad.addColorStop(1, '#2a2a32');
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.32, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#10101a';
  ctx.lineWidth = 1.1;
  ctx.stroke();

  // Snout (forward bump)
  ctx.fillStyle = '#3a3a44';
  ctx.beginPath();
  ctx.moveTo(r * 0.18, -r * 0.06);
  ctx.quadraticCurveTo(r * 0.42, r * 0.0, r * 0.36, r * 0.14);
  ctx.quadraticCurveTo(r * 0.22, r * 0.18, r * 0.12, r * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#10101a';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Nose
  ctx.fillStyle = '#0a0a10';
  ctx.beginPath();
  ctx.arc(r * 0.38, r * 0.04, r * 0.04, 0, Math.PI * 2);
  ctx.fill();

  // Small fangs peeking
  ctx.fillStyle = '#f0e8d0';
  ctx.beginPath();
  ctx.moveTo(r * 0.28, r * 0.13);
  ctx.lineTo(r * 0.3, r * 0.18);
  ctx.lineTo(r * 0.32, r * 0.13);
  ctx.closePath();
  ctx.moveTo(r * 0.22, r * 0.13);
  ctx.lineTo(r * 0.24, r * 0.17);
  ctx.lineTo(r * 0.26, r * 0.13);
  ctx.closePath();
  ctx.fill();

  // Oversized ears — perked, slight twitch
  ctx.save();
  ctx.rotate(-0.2 + earTwitch);
  ctx.fillStyle = '#3a3a44';
  ctx.beginPath();
  ctx.moveTo(-r * 0.1, -r * 0.18);
  ctx.lineTo(-r * 0.16, -r * 0.55);
  ctx.lineTo(r * 0.04, -r * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#10101a';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Inner ear pink
  ctx.fillStyle = '#a06070';
  ctx.beginPath();
  ctx.moveTo(-r * 0.1, -r * 0.22);
  ctx.lineTo(-r * 0.13, -r * 0.45);
  ctx.lineTo(-r * 0.02, -r * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // Second (rear) ear
  ctx.save();
  ctx.rotate(-0.1 - earTwitch);
  ctx.fillStyle = '#2a2a32';
  ctx.beginPath();
  ctx.moveTo(-r * 0.22, -r * 0.16);
  ctx.lineTo(-r * 0.3, -r * 0.5);
  ctx.lineTo(-r * 0.1, -r * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#10101a';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Glassy blue round eyes — innocent
  const eyePulse = 0.85 + Math.sin(t * 2.0) * 0.05;
  ctx.fillStyle = '#0a0a14';
  ctx.beginPath();
  ctx.arc(-r * 0.02, -r * 0.05, r * 0.075, 0, Math.PI * 2);
  ctx.arc(r * 0.14, -r * 0.05, r * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(120,180,240,' + eyePulse + ')';
  ctx.beginPath();
  ctx.arc(-r * 0.02, -r * 0.05, r * 0.055, 0, Math.PI * 2);
  ctx.arc(r * 0.14, -r * 0.05, r * 0.045, 0, Math.PI * 2);
  ctx.fill();
  // Round pupils — innocent
  ctx.fillStyle = '#10182a';
  ctx.beginPath();
  ctx.arc(-r * 0.02, -r * 0.04, r * 0.025, 0, Math.PI * 2);
  ctx.arc(r * 0.14, -r * 0.04, r * 0.02, 0, Math.PI * 2);
  ctx.fill();
  // Eye highlights
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-r * 0.035, -r * 0.06, r * 0.012, 0, Math.PI * 2);
  ctx.arc(r * 0.128, -r * 0.06, r * 0.01, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  ctx.restore();
}

// --- BramblePup --------------------------------------------------------------
// Small pup-sized rot creature — green-violet thorny bristles down the spine,
// glowing pink-rot pit-eyes, vines wrapping its legs, violet mist halo.

function drawBramblePup(ctx, t, r) {
  const bob = Math.sin(t * 2.4) * 0.7;
  const bristleSway = Math.sin(t * 3.2) * 0.12;
  drawShadow(ctx, r);
  ctx.save();
  ctx.translate(0, bob);

  // Violet mist halo behind
  const haloG = ctx.createRadialGradient(0, r * 0.2, 0, 0, r * 0.2, r * 1.05);
  haloG.addColorStop(0, 'rgba(150,80,180,0.28)');
  haloG.addColorStop(0.5, 'rgba(120,60,160,0.12)');
  haloG.addColorStop(1, 'rgba(80,40,120,0)');
  ctx.fillStyle = haloG;
  ctx.beginPath();
  ctx.arc(0, r * 0.2, r * 1.05, 0, Math.PI * 2);
  ctx.fill();

  // Body — hunched, mottled green-grey
  const bodyGrad = ctx.createLinearGradient(0, -r * 0.05, 0, r * 0.7);
  bodyGrad.addColorStop(0, '#5a6a48');
  bodyGrad.addColorStop(0.5, '#3a4a30');
  bodyGrad.addColorStop(1, '#1a221a');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(-r * 0.4, r * 0.7);
  ctx.quadraticCurveTo(-r * 0.55, r * 0.25, -r * 0.35, r * 0.05);
  ctx.quadraticCurveTo(-r * 0.1, -r * 0.05, r * 0.25, -r * 0.0);
  ctx.quadraticCurveTo(r * 0.55, r * 0.15, r * 0.55, r * 0.55);
  ctx.quadraticCurveTo(r * 0.4, r * 0.75, 0, r * 0.75);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#10180e';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Hunched-back shading streak
  ctx.fillStyle = 'rgba(20,30,18,0.5)';
  ctx.beginPath();
  ctx.moveTo(-r * 0.3, r * 0.6);
  ctx.quadraticCurveTo(0, r * 0.7, r * 0.4, r * 0.5);
  ctx.quadraticCurveTo(0, r * 0.78, -r * 0.3, r * 0.6);
  ctx.closePath();
  ctx.fill();

  // Legs (4) with vines wrapped
  for (const [lx, ly] of [[-r * 0.28, r * 0.7], [r * 0.32, r * 0.72], [-r * 0.08, r * 0.78], [r * 0.16, r * 0.78]]) {
    ctx.fillStyle = '#2a2a1c';
    ctx.beginPath();
    ctx.ellipse(lx, ly, r * 0.08, r * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    // Vine wrap
    ctx.strokeStyle = '#3a5a28';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(lx - r * 0.07, ly - r * 0.08);
    ctx.quadraticCurveTo(lx, ly - r * 0.04, lx + r * 0.07, ly - r * 0.05);
    ctx.moveTo(lx - r * 0.08, ly + r * 0.02);
    ctx.quadraticCurveTo(lx, ly + r * 0.06, lx + r * 0.08, ly + r * 0.0);
    ctx.stroke();
    // Tiny thorn on the vine
    ctx.fillStyle = '#7a3a90';
    ctx.beginPath();
    ctx.arc(lx + r * 0.06, ly - r * 0.02, r * 0.018, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bristles down the spine — alternating green & violet thorns
  for (let i = 0; i < 7; i++) {
    const px = -r * 0.3 + i * r * 0.13;
    const py = r * 0.05 + Math.sin(i * 0.9) * r * 0.04;
    const sway = bristleSway + i * 0.05;
    const len = r * (0.25 + (i % 2) * 0.08);
    const col = i % 2 === 0 ? '#6a9038' : '#9040b0';
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(sway - 0.1);
    // Thorn shape
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(-r * 0.04, 0);
    ctx.lineTo(0, -len);
    ctx.lineTo(r * 0.04, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1a1208';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    // Glow at tip
    if (i % 2 === 1) {
      ctx.fillStyle = 'rgba(255,140,220,0.7)';
      ctx.shadowColor = '#ff6acc';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(0, -len, r * 0.025, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  // Head — hunched forward (left-camera)
  ctx.save();
  ctx.translate(-r * 0.3, r * 0.15);
  const headGrad = ctx.createRadialGradient(-r * 0.05, -r * 0.05, 0, 0, 0, r * 0.32);
  headGrad.addColorStop(0, '#5a6a48');
  headGrad.addColorStop(1, '#1a221a');
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.28, r * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#10180e';
  ctx.lineWidth = 1.1;
  ctx.stroke();

  // Pink-rot pit eyes — pulsing, no pupils
  const ePulse = 0.7 + Math.sin(t * 2.8) * 0.25;
  ctx.shadowColor = '#ff6acc';
  ctx.shadowBlur = 10;
  ctx.fillStyle = 'rgba(255,120,200,' + ePulse + ')';
  ctx.beginPath();
  ctx.arc(-r * 0.1, -r * 0.04, r * 0.055, 0, Math.PI * 2);
  ctx.arc(r * 0.06, -r * 0.04, r * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Eye-socket darkness inside
  ctx.fillStyle = 'rgba(60,10,40,0.5)';
  ctx.beginPath();
  ctx.arc(-r * 0.1, -r * 0.03, r * 0.025, 0, Math.PI * 2);
  ctx.arc(r * 0.06, -r * 0.03, r * 0.022, 0, Math.PI * 2);
  ctx.fill();

  // Tiny tooth row
  ctx.fillStyle = '#d8c8a0';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.1 + i * r * 0.05, r * 0.12);
    ctx.lineTo(-r * 0.08 + i * r * 0.05, r * 0.17);
    ctx.lineTo(-r * 0.06 + i * r * 0.05, r * 0.12);
    ctx.closePath();
    ctx.fill();
  }
  // Snout vine wrap
  ctx.strokeStyle = '#3a5a28';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.18, r * 0.06);
  ctx.quadraticCurveTo(-r * 0.05, r * 0.16, r * 0.14, r * 0.04);
  ctx.stroke();
  ctx.restore();

  // Drifting violet rot motes around it
  for (let i = 0; i < 4; i++) {
    const phase = (t * 0.45 + i * 0.31) % 1;
    const mx = Math.cos(t * 0.8 + i * 1.7) * r * 0.7;
    const my = -r * 0.2 - phase * r * 0.55;
    const ma = Math.max(0, 1 - phase) * 0.6;
    ctx.fillStyle = 'rgba(200,120,220,' + ma + ')';
    ctx.beginPath();
    ctx.arc(mx, my, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// --- CorruptedOtter ---------------------------------------------------------
// Sinuous river creature lying along the ground. Cyan corruption seam glows
// down the spine. Sad luminous eyes. Dripping aether droplets.

function drawCorruptedOtter(ctx, t, r) {
  const bob = Math.sin(t * 2.0) * 0.5;
  const ripple = Math.sin(t * 1.6) * 0.06;
  drawShadow(ctx, r, { wide: 1.25, alpha: 0.45 });
  ctx.save();
  ctx.translate(0, bob);

  // Body — long sinuous bezier (lying creature)
  const bodyGrad = ctx.createLinearGradient(0, -r * 0.1, 0, r * 0.6);
  bodyGrad.addColorStop(0, '#5a6a78');
  bodyGrad.addColorStop(0.5, '#3a4a58');
  bodyGrad.addColorStop(1, '#1a222a');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  // Head bump on the right
  ctx.moveTo(r * 0.85, r * 0.2);
  ctx.bezierCurveTo(r * 1.0, r * 0.05, r * 0.95, -r * 0.15, r * 0.7, -r * 0.15);
  // Top spine — sinuous
  ctx.bezierCurveTo(r * 0.4, -r * 0.05 + ripple * r, r * 0.0, -r * 0.18 + ripple * r, -r * 0.4, -r * 0.05);
  ctx.bezierCurveTo(-r * 0.7, r * 0.05, -r * 0.95, r * 0.0, -r * 1.0, r * 0.25);
  // Tail tip
  ctx.bezierCurveTo(-r * 1.05, r * 0.45, -r * 0.85, r * 0.5, -r * 0.7, r * 0.4);
  // Belly
  ctx.bezierCurveTo(-r * 0.35, r * 0.6, r * 0.3, r * 0.65, r * 0.6, r * 0.55);
  ctx.bezierCurveTo(r * 0.78, r * 0.5, r * 0.85, r * 0.4, r * 0.85, r * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#0a1018';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Belly highlight (lighter underside)
  ctx.fillStyle = 'rgba(180,200,220,0.18)';
  ctx.beginPath();
  ctx.moveTo(-r * 0.55, r * 0.5);
  ctx.bezierCurveTo(-r * 0.2, r * 0.58, r * 0.3, r * 0.62, r * 0.55, r * 0.52);
  ctx.bezierCurveTo(r * 0.3, r * 0.55, -r * 0.2, r * 0.5, -r * 0.55, r * 0.5);
  ctx.closePath();
  ctx.fill();

  // Cyan corruption seam down the spine — glowing
  ctx.save();
  ctx.shadowColor = '#3aeaff';
  ctx.shadowBlur = 12;
  ctx.strokeStyle = 'rgba(120,240,255,0.95)';
  ctx.lineWidth = Math.max(1.5, r * 0.06);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(r * 0.65, -r * 0.05);
  ctx.bezierCurveTo(r * 0.35, r * 0.0 + ripple * r, -r * 0.05, -r * 0.1 + ripple * r, -r * 0.4, r * 0.05);
  ctx.bezierCurveTo(-r * 0.7, r * 0.15, -r * 0.85, r * 0.15, -r * 0.95, r * 0.3);
  ctx.stroke();
  // Inner bright vein
  ctx.strokeStyle = 'rgba(220,250,255,0.85)';
  ctx.lineWidth = Math.max(0.8, r * 0.025);
  ctx.stroke();
  ctx.shadowBlur = 0;
  // Seam node bumps along the spine
  for (let i = 0; i < 5; i++) {
    const tt = i / 4;
    const sx = r * 0.65 - tt * r * 1.55;
    const sy = -r * 0.05 + Math.sin(tt * 3 + t * 1.3) * r * 0.05;
    const np = 0.6 + Math.sin(t * 3 + i) * 0.4;
    ctx.fillStyle = 'rgba(220,250,255,' + np + ')';
    ctx.shadowColor = '#3aeaff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(sx, sy, r * 0.035, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.restore();

  // Tail-tip flick
  ctx.fillStyle = '#1a222a';
  ctx.beginPath();
  ctx.ellipse(-r * 0.92, r * 0.42, r * 0.12, r * 0.06, -0.3 + ripple, 0, Math.PI * 2);
  ctx.fill();

  // Small paws peeking from belly
  ctx.fillStyle = '#2a3240';
  ctx.beginPath();
  ctx.ellipse(-r * 0.3, r * 0.62, r * 0.08, r * 0.04, 0, 0, Math.PI * 2);
  ctx.ellipse(r * 0.15, r * 0.62, r * 0.08, r * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head detail (camera-right)
  ctx.save();
  ctx.translate(r * 0.75, r * 0.02);
  // Sad luminous eye (large)
  const epulse = 0.75 + Math.sin(t * 1.8) * 0.15;
  ctx.shadowColor = '#3aeaff';
  ctx.shadowBlur = 8;
  ctx.fillStyle = 'rgba(180,240,255,' + epulse + ')';
  ctx.beginPath();
  ctx.arc(0, -r * 0.02, r * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Downturned sad outline above eye
  ctx.strokeStyle = '#0a1018';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, r * 0.01, r * 0.08, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
  // Tiny pupil
  ctx.fillStyle = '#0a1018';
  ctx.beginPath();
  ctx.arc(0, r * 0.0, r * 0.022, 0, Math.PI * 2);
  ctx.fill();
  // Highlight
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-r * 0.012, -r * 0.012, r * 0.012, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#10141a';
  ctx.beginPath();
  ctx.arc(r * 0.18, r * 0.12, r * 0.035, 0, Math.PI * 2);
  ctx.fill();

  // Whiskers
  ctx.strokeStyle = 'rgba(200,220,240,0.7)';
  ctx.lineWidth = 0.8;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(r * 0.15, r * 0.12 + i * r * 0.03);
    ctx.quadraticCurveTo(r * 0.25, r * 0.14 + i * r * 0.04, r * 0.32, r * 0.13 + i * r * 0.06);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r * 0.15, r * 0.14 + i * r * 0.03);
    ctx.quadraticCurveTo(r * 0.05, r * 0.18 + i * r * 0.04, -r * 0.05, r * 0.2 + i * r * 0.05);
    ctx.stroke();
  }

  // Small rounded ear
  ctx.fillStyle = '#2a3240';
  ctx.beginPath();
  ctx.arc(-r * 0.05, -r * 0.13, r * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0a1018';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Dripping aether droplets — every ~0.6s, two droplets in flight
  for (let i = 0; i < 2; i++) {
    const phase = ((t / 0.6 + i * 0.5) % 1);
    const dx = r * 0.78 + Math.cos(i * 1.3) * r * 0.04;
    const dy = r * 0.22 + phase * r * 0.7;
    const da = Math.max(0, 1 - phase) * 0.85;
    ctx.fillStyle = 'rgba(160,235,255,' + da + ')';
    ctx.shadowColor = '#3aeaff';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.ellipse(dx, dy, r * 0.025, r * 0.045, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Splash ring when near ground
    if (phase > 0.85) {
      const sr = (phase - 0.85) * r * 0.6;
      ctx.strokeStyle = 'rgba(160,235,255,' + (1 - (phase - 0.85) / 0.15) * 0.6 + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(dx, r * 0.92, sr, sr * 0.3, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.restore();
}

// --- WraithWisp --------------------------------------------------------------
// Small floating violet specter — no ground shadow, just a wraith glow disc.
// Two big staring eyes, wispy ribbon-tail, faint inner skull silhouette.

function drawWraithWisp(ctx, t, r) {
  const hover = Math.sin(t * 1.5) * 3.5;
  drawWraithGlow(ctx, r, '160,90,200');
  ctx.save();
  ctx.translate(0, hover - r * 0.1);

  // Trailing ribbon tail — sinks into nothing below
  ctx.save();
  ctx.strokeStyle = 'rgba(150,80,200,0.6)';
  ctx.lineWidth = Math.max(2, r * 0.18);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, r * 0.4);
  ctx.bezierCurveTo(
    Math.sin(t * 2.1) * r * 0.15, r * 0.65,
    Math.sin(t * 1.7 + 1) * r * 0.2, r * 0.95,
    Math.sin(t * 1.4 + 2) * r * 0.1, r * 1.2,
  );
  ctx.stroke();
  // Fade-out tip
  ctx.strokeStyle = 'rgba(150,80,200,0.0)';
  ctx.lineWidth = Math.max(1, r * 0.08);
  ctx.stroke();
  ctx.restore();

  // Body — soft violet teardrop with glow gradient
  const bodyGrad = ctx.createRadialGradient(0, -r * 0.1, 0, 0, 0, r * 0.6);
  bodyGrad.addColorStop(0, 'rgba(220,180,255,0.9)');
  bodyGrad.addColorStop(0.45, 'rgba(170,100,220,0.75)');
  bodyGrad.addColorStop(1, 'rgba(90,40,140,0.3)');
  ctx.fillStyle = bodyGrad;
  ctx.shadowColor = '#a060ff';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.55);
  ctx.bezierCurveTo(r * 0.55, -r * 0.5, r * 0.55, r * 0.3, 0, r * 0.45);
  ctx.bezierCurveTo(-r * 0.55, r * 0.3, -r * 0.55, -r * 0.5, 0, -r * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // Faint inner skull silhouette
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#1a0820';
  // Skull cap
  ctx.beginPath();
  ctx.arc(0, -r * 0.15, r * 0.28, 0, Math.PI * 2);
  ctx.fill();
  // Jaw bump
  ctx.beginPath();
  ctx.ellipse(0, r * 0.12, r * 0.22, r * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  // Inner socket darks
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(-r * 0.1, -r * 0.18, r * 0.06, 0, Math.PI * 2);
  ctx.arc(r * 0.1, -r * 0.18, r * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Big staring eyes
  const epulse = 0.8 + Math.sin(t * 2.4) * 0.2;
  ctx.fillStyle = '#10081a';
  ctx.beginPath();
  ctx.arc(-r * 0.13, -r * 0.18, r * 0.11, 0, Math.PI * 2);
  ctx.arc(r * 0.13, -r * 0.18, r * 0.11, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = '#d8a8ff';
  ctx.shadowBlur = 8;
  ctx.fillStyle = 'rgba(240,210,255,' + epulse + ')';
  ctx.beginPath();
  ctx.arc(-r * 0.13, -r * 0.18, r * 0.07, 0, Math.PI * 2);
  ctx.arc(r * 0.13, -r * 0.18, r * 0.07, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Tiny pupil dots
  ctx.fillStyle = '#3a1060';
  ctx.beginPath();
  ctx.arc(-r * 0.13, -r * 0.17, r * 0.025, 0, Math.PI * 2);
  ctx.arc(r * 0.13, -r * 0.17, r * 0.025, 0, Math.PI * 2);
  ctx.fill();

  // Wispy aura strands
  for (let i = 0; i < 3; i++) {
    const phase = (t * 0.6 + i * 0.31) % 1;
    const ax = Math.cos(t * 1.2 + i * 2.1) * r * 0.5;
    const ay = -r * 0.5 - phase * r * 0.4;
    const aa = Math.max(0, 1 - phase) * 0.5;
    ctx.fillStyle = 'rgba(200,140,240,' + aa + ')';
    ctx.beginPath();
    ctx.arc(ax, ay, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// --- AlphaScout --------------------------------------------------------------
// Brawnier wolf — broad shoulders, deep red mane, scarred snout with stitches,
// glowing amber slit-pupil eyes, bared fangs, claw tips. Pre-boss menace.

function drawAlphaScout(ctx, t, r) {
  const bob = Math.sin(t * 2.0) * 0.7;
  const earTwitch = Math.sin(t * 2.7) * 0.05;
  const tailWag = Math.sin(t * 2.2) * 0.18;
  drawShadow(ctx, r, { wide: 1.15, alpha: 0.5 });
  ctx.save();
  ctx.translate(0, bob);

  // Bushy tail — held high, slow flick
  ctx.save();
  ctx.translate(-r * 0.65, r * 0.1);
  ctx.rotate(-0.7 + tailWag);
  // Tail body
  ctx.fillStyle = '#2a2028';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-r * 0.05, -r * 0.35, -r * 0.18, -r * 0.65);
  ctx.quadraticCurveTo(-r * 0.05, -r * 0.55, r * 0.1, -r * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#10080a';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Red mane streak in tail
  ctx.fillStyle = '#aa2818';
  ctx.beginPath();
  ctx.moveTo(-r * 0.05, -r * 0.1);
  ctx.quadraticCurveTo(-r * 0.08, -r * 0.3, -r * 0.14, -r * 0.55);
  ctx.quadraticCurveTo(-r * 0.04, -r * 0.4, r * 0.0, -r * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Hind leg (back)
  ctx.fillStyle = '#1a1218';
  ctx.beginPath();
  ctx.ellipse(-r * 0.4, r * 0.78, r * 0.18, r * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body — broad-shouldered ovoid, gradient
  const bodyGrad = ctx.createLinearGradient(0, -r * 0.2, 0, r * 0.8);
  bodyGrad.addColorStop(0, '#4a3a40');
  bodyGrad.addColorStop(0.5, '#2a2028');
  bodyGrad.addColorStop(1, '#10080c');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.3, r * 0.6, r * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#08040a';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Shoulder hump — heavy muscle
  ctx.fillStyle = '#3a2a30';
  ctx.beginPath();
  ctx.ellipse(r * 0.05, -r * 0.05, r * 0.4, r * 0.22, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // Front legs — sturdier
  ctx.fillStyle = '#1a1218';
  ctx.beginPath();
  ctx.ellipse(-r * 0.22, r * 0.82, r * 0.13, r * 0.22, 0, 0, Math.PI * 2);
  ctx.ellipse(r * 0.22, r * 0.82, r * 0.13, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  // Paws + claw tips
  ctx.fillStyle = '#5a3a30';
  for (const px of [-r * 0.22, r * 0.22]) {
    ctx.beginPath();
    ctx.ellipse(px, r * 0.98, r * 0.15, r * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
    // 3 claw tips
    ctx.fillStyle = '#d8c0a0';
    for (let k = -1; k <= 1; k++) {
      ctx.beginPath();
      ctx.moveTo(px + k * r * 0.045, r * 1.0);
      ctx.lineTo(px + k * r * 0.045 + r * 0.01, r * 1.07);
      ctx.lineTo(px + k * r * 0.045 - r * 0.012, r * 1.0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#5a3a30';
  }

  // Deep red mane around neck
  ctx.save();
  ctx.translate(r * 0.18, -r * 0.08);
  const maneG = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.45);
  maneG.addColorStop(0, '#dc3820');
  maneG.addColorStop(0.6, '#8a1808');
  maneG.addColorStop(1, '#3a0808');
  ctx.fillStyle = maneG;
  ctx.beginPath();
  // Jagged mane edge
  const spikes = 11;
  for (let i = 0; i <= spikes; i++) {
    const a = -Math.PI * 0.95 + (i / spikes) * Math.PI * 1.55;
    const rr = r * (0.4 + (i % 2 === 0 ? 0.08 : 0.0));
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr * 0.78;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#3a0808';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Inner mane shading
  ctx.fillStyle = 'rgba(60,8,8,0.55)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.08, r * 0.3, r * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Head — turned camera-right, broader
  ctx.save();
  ctx.translate(r * 0.4, r * 0.0);
  const headGrad = ctx.createRadialGradient(-r * 0.06, -r * 0.06, 0, 0, 0, r * 0.4);
  headGrad.addColorStop(0, '#5a4048');
  headGrad.addColorStop(1, '#1a1014');
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.36, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#08040a';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Snout (broader than wolfling)
  ctx.fillStyle = '#2a2028';
  ctx.beginPath();
  ctx.moveTo(r * 0.18, -r * 0.08);
  ctx.quadraticCurveTo(r * 0.46, r * 0.0, r * 0.42, r * 0.18);
  ctx.quadraticCurveTo(r * 0.24, r * 0.22, r * 0.12, r * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#08040a';
  ctx.lineWidth = 1;
  ctx.stroke();

  // SCAR diagonal across snout with stitches
  ctx.strokeStyle = '#7a3020';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(r * 0.1, -r * 0.04);
  ctx.lineTo(r * 0.44, r * 0.18);
  ctx.stroke();
  // Stitches — small perpendicular X marks
  ctx.strokeStyle = '#10080a';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const tt = i / 4;
    const sx = r * 0.1 + tt * r * 0.34;
    const sy = -r * 0.04 + tt * r * 0.22;
    ctx.beginPath();
    ctx.moveTo(sx - r * 0.02, sy - r * 0.025);
    ctx.lineTo(sx + r * 0.02, sy + r * 0.025);
    ctx.moveTo(sx - r * 0.02, sy + r * 0.025);
    ctx.lineTo(sx + r * 0.02, sy - r * 0.025);
    ctx.stroke();
  }

  // Nose
  ctx.fillStyle = '#0a0408';
  ctx.beginPath();
  ctx.arc(r * 0.44, r * 0.06, r * 0.05, 0, Math.PI * 2);
  ctx.fill();

  // 4 bared fangs (top + bottom)
  ctx.fillStyle = '#f0e8c8';
  // Upper canines
  ctx.beginPath();
  ctx.moveTo(r * 0.22, r * 0.16);
  ctx.lineTo(r * 0.245, r * 0.25);
  ctx.lineTo(r * 0.27, r * 0.16);
  ctx.closePath();
  ctx.moveTo(r * 0.32, r * 0.17);
  ctx.lineTo(r * 0.345, r * 0.25);
  ctx.lineTo(r * 0.37, r * 0.17);
  ctx.closePath();
  ctx.fill();
  // Lower canines (upward)
  ctx.beginPath();
  ctx.moveTo(r * 0.26, r * 0.22);
  ctx.lineTo(r * 0.285, r * 0.14);
  ctx.lineTo(r * 0.31, r * 0.22);
  ctx.closePath();
  ctx.moveTo(r * 0.36, r * 0.22);
  ctx.lineTo(r * 0.385, r * 0.14);
  ctx.lineTo(r * 0.41, r * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5a3020';
  ctx.lineWidth = 0.6;
  ctx.stroke();
  // Snarl line
  ctx.strokeStyle = '#10080a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(r * 0.16, r * 0.16);
  ctx.quadraticCurveTo(r * 0.3, r * 0.12, r * 0.42, r * 0.18);
  ctx.stroke();

  // Ears — perked, scarred notch on one
  ctx.save();
  ctx.rotate(-0.15 + earTwitch);
  ctx.fillStyle = '#2a2028';
  ctx.beginPath();
  ctx.moveTo(-r * 0.05, -r * 0.22);
  ctx.lineTo(-r * 0.1, -r * 0.55);
  ctx.lineTo(r * 0.1, -r * 0.32);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#08040a';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Notch
  ctx.fillStyle = '#1a1014';
  ctx.beginPath();
  ctx.moveTo(-r * 0.085, -r * 0.42);
  ctx.lineTo(-r * 0.05, -r * 0.38);
  ctx.lineTo(-r * 0.07, -r * 0.32);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // Back ear
  ctx.save();
  ctx.rotate(-0.1 - earTwitch);
  ctx.fillStyle = '#1a1014';
  ctx.beginPath();
  ctx.moveTo(-r * 0.2, -r * 0.18);
  ctx.lineTo(-r * 0.28, -r * 0.5);
  ctx.lineTo(-r * 0.08, -r * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#08040a';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Glowing amber slit-pupil eyes
  const epulse = 0.85 + Math.sin(t * 3.2) * 0.12;
  ctx.shadowColor = '#ffae3b';
  ctx.shadowBlur = 8;
  ctx.fillStyle = 'rgba(255,180,60,' + epulse + ')';
  ctx.beginPath();
  ctx.arc(-r * 0.04, -r * 0.06, r * 0.075, 0, Math.PI * 2);
  ctx.arc(r * 0.18, -r * 0.04, r * 0.07, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Slit pupils — vertical
  ctx.fillStyle = '#1a0808';
  ctx.beginPath();
  ctx.ellipse(-r * 0.04, -r * 0.05, r * 0.012, r * 0.055, 0, 0, Math.PI * 2);
  ctx.ellipse(r * 0.18, -r * 0.03, r * 0.012, r * 0.055, 0, 0, Math.PI * 2);
  ctx.fill();
  // Brow ridge (angry)
  ctx.strokeStyle = '#08040a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-r * 0.12, -r * 0.18);
  ctx.lineTo(r * 0.04, -r * 0.12);
  ctx.moveTo(r * 0.1, -r * 0.13);
  ctx.lineTo(r * 0.26, -r * 0.17);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

// --- WraithEcho --------------------------------------------------------------
// Bigger menacing wraith — 4 orbiting eye-lights around the head, 3 trailing
// ribbons, faint Hollow-Warden silhouette (jagged crown + many eyes) inside.

function drawWraithEcho(ctx, t, r) {
  const hover = Math.sin(t * 1.5) * 4.5;
  drawWraithGlow(ctx, r, '180,90,220');
  ctx.save();
  ctx.translate(0, hover - r * 0.05);

  // Three trailing ribbons
  for (let k = 0; k < 3; k++) {
    const offset = (k - 1) * 0.45;
    ctx.save();
    ctx.strokeStyle = 'rgba(160,80,210,' + (0.55 - Math.abs(k - 1) * 0.12) + ')';
    ctx.lineWidth = Math.max(2, r * (0.16 - Math.abs(k - 1) * 0.03));
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(offset * r * 0.25, r * 0.45);
    ctx.bezierCurveTo(
      Math.sin(t * 1.9 + k * 1.7) * r * 0.25 + offset * r * 0.3, r * 0.75,
      Math.sin(t * 1.5 + k * 2.1) * r * 0.3 + offset * r * 0.35, r * 1.1,
      Math.sin(t * 1.2 + k * 2.7) * r * 0.2 + offset * r * 0.4, r * 1.45,
    );
    ctx.stroke();
    ctx.restore();
  }

  // Body — larger violet specter
  const bodyGrad = ctx.createRadialGradient(0, -r * 0.15, 0, 0, 0, r * 0.85);
  bodyGrad.addColorStop(0, 'rgba(230,190,255,0.95)');
  bodyGrad.addColorStop(0.4, 'rgba(180,100,230,0.82)');
  bodyGrad.addColorStop(1, 'rgba(70,30,120,0.35)');
  ctx.fillStyle = bodyGrad;
  ctx.shadowColor = '#b070ff';
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.75);
  ctx.bezierCurveTo(r * 0.78, -r * 0.7, r * 0.82, r * 0.35, 0, r * 0.55);
  ctx.bezierCurveTo(-r * 0.82, r * 0.35, -r * 0.78, -r * 0.7, 0, -r * 0.75);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // Faint Hollow-Warden silhouette inside — jagged crown + many eyes
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#1a0828';
  // Skull mass
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.1, r * 0.4, r * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  // Jagged crown (5 spikes)
  ctx.beginPath();
  ctx.moveTo(-r * 0.36, -r * 0.3);
  for (let i = 0; i <= 8; i++) {
    const tt = i / 8;
    const x = -r * 0.36 + tt * r * 0.72;
    const y = -r * 0.3 + (i % 2 === 0 ? -r * 0.18 : 0);
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  // Many eye pits inside the silhouette
  ctx.fillStyle = '#000000';
  const pits = [
    [-r * 0.18, -r * 0.18], [r * 0.18, -r * 0.18],
    [-r * 0.08, -r * 0.05], [r * 0.08, -r * 0.05],
    [-r * 0.22, r * 0.05], [r * 0.22, r * 0.05],
    [0, r * 0.16],
  ];
  for (const [px, py] of pits) {
    ctx.beginPath();
    ctx.arc(px, py, r * 0.035, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 4 orbiting eye-lights around the head (animated)
  const orbitR = r * 0.65;
  for (let k = 0; k < 4; k++) {
    const a = t * 0.9 + (k * Math.PI) / 2;
    const ox = Math.cos(a) * orbitR;
    const oy = Math.sin(a) * orbitR * 0.55 - r * 0.1;
    const op = 0.7 + Math.sin(t * 2.5 + k) * 0.3;
    // Trail behind each
    ctx.fillStyle = 'rgba(255,200,255,' + (op * 0.25) + ')';
    ctx.beginPath();
    ctx.arc(Math.cos(a - 0.3) * orbitR, Math.sin(a - 0.3) * orbitR * 0.55 - r * 0.1, r * 0.05, 0, Math.PI * 2);
    ctx.fill();
    // The eye-light
    ctx.shadowColor = '#e0a0ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = 'rgba(250,220,255,' + op + ')';
    ctx.beginPath();
    ctx.arc(ox, oy, r * 0.075, 0, Math.PI * 2);
    ctx.fill();
    // Inner pupil-dot
    ctx.fillStyle = '#3a1060';
    ctx.beginPath();
    ctx.arc(ox, oy, r * 0.025, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Two big primary staring eyes
  const epulse = 0.85 + Math.sin(t * 2.1) * 0.15;
  ctx.fillStyle = '#10081a';
  ctx.beginPath();
  ctx.arc(-r * 0.17, -r * 0.22, r * 0.14, 0, Math.PI * 2);
  ctx.arc(r * 0.17, -r * 0.22, r * 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = '#ffa0ff';
  ctx.shadowBlur = 10;
  ctx.fillStyle = 'rgba(255,210,255,' + epulse + ')';
  ctx.beginPath();
  ctx.arc(-r * 0.17, -r * 0.22, r * 0.09, 0, Math.PI * 2);
  ctx.arc(r * 0.17, -r * 0.22, r * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Vertical slit pupils
  ctx.fillStyle = '#2a0840';
  ctx.beginPath();
  ctx.ellipse(-r * 0.17, -r * 0.22, r * 0.018, r * 0.07, 0, 0, Math.PI * 2);
  ctx.ellipse(r * 0.17, -r * 0.22, r * 0.018, r * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  // Highlights
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-r * 0.19, -r * 0.25, r * 0.015, 0, Math.PI * 2);
  ctx.arc(r * 0.15, -r * 0.25, r * 0.015, 0, Math.PI * 2);
  ctx.fill();

  // Wispy strands rising from the body
  for (let i = 0; i < 5; i++) {
    const phase = (t * 0.55 + i * 0.22) % 1;
    const ax = Math.cos(t * 1.1 + i * 1.4) * r * 0.65;
    const ay = -r * 0.6 - phase * r * 0.55;
    const aa = Math.max(0, 1 - phase) * 0.55;
    ctx.fillStyle = 'rgba(220,160,255,' + aa + ')';
    ctx.beginPath();
    ctx.arc(ax, ay, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
