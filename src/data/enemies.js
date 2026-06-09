// Enemy templates. Each defines stats, drops, a `palette` of named colors,
// and a `draw(ctx, e)` that renders at (0,0) in its local frame.
//
// Variants (palette swaps with boosted stats) reuse the same draw function
// — they just provide a different palette plus stronger numbers.

// ---- SLIME ------------------------------------------------------------------

const SLIME_PALETTE = {
  body: '#7adaa1', shade: '#2a4a32', highlight: '#d8fff0',
  eye: '#ff3b3b', eyeGlow: '#ff5050', pupil: '#1a0608',
  drip: '#7adaa1', fang: '#ffffff',
};

function drawSlime(ctx, e) {
  const r = e.radius;
  const p = e.palette || SLIME_PALETTE;
  const bob = Math.sin(e.t * 4) * 2.2;
  const squash = 1 + Math.sin(e.t * 4) * 0.06;
  const halfW = r * squash;
  const halfH = r / squash;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(0, r + 4, r * 0.95, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body — radial gradient gives it volume
  const grad = ctx.createRadialGradient(-r * 0.25, -r * 0.35 + bob, r * 0.05, 0, bob, halfW);
  grad.addColorStop(0, p.highlight);
  grad.addColorStop(0.55, p.body);
  grad.addColorStop(1, p.shade);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-halfW, halfH * 0.55 + bob);
  ctx.bezierCurveTo(-halfW, -halfH * 0.95 + bob, halfW, -halfH * 0.95 + bob, halfW, halfH * 0.55 + bob);
  // Wavy bottom edge
  ctx.quadraticCurveTo(halfW * 0.7, halfH * 0.75 + bob, halfW * 0.45, halfH * 0.55 + bob);
  ctx.quadraticCurveTo(halfW * 0.2, halfH * 0.78 + bob, 0, halfH * 0.55 + bob);
  ctx.quadraticCurveTo(-halfW * 0.2, halfH * 0.78 + bob, -halfW * 0.45, halfH * 0.55 + bob);
  ctx.quadraticCurveTo(-halfW * 0.7, halfH * 0.75 + bob, -halfW, halfH * 0.55 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = p.shade;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Top sheen
  ctx.fillStyle = 'rgba(255,255,255,0.32)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.25, -r * 0.5 + bob, r * 0.28, r * 0.12, -0.35, 0, Math.PI * 2);
  ctx.fill();

  // Inner bubbles (3 rising)
  for (let i = 0; i < 3; i++) {
    const phase = ((e.t * 0.7 + i * 0.33) % 1);
    const bx = -r * 0.3 + i * r * 0.3;
    const by = r * 0.35 - phase * r * 0.85 + bob;
    ctx.fillStyle = `rgba(255,255,255,${0.4 * (1 - phase)})`;
    ctx.beginPath();
    ctx.arc(bx, by, 2 + (1 - phase) * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sinister glowing eyes — red orb with a vertical slit pupil
  const eyeY = -r * 0.14 + bob;
  const eyePulse = 0.85 + 0.15 * Math.sin(e.t * 5);
  ctx.fillStyle = p.eye;
  ctx.shadowColor = p.eyeGlow || p.eye;
  ctx.shadowBlur = 9 + eyePulse * 4;
  ctx.beginPath();
  ctx.arc(-r * 0.30, eyeY, 4.2 * eyePulse, 0, Math.PI * 2);
  ctx.arc(r * 0.30, eyeY, 4.2 * eyePulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Vertical slit pupil — reptilian, predatory
  ctx.fillStyle = p.pupil || p.shade;
  ctx.beginPath();
  ctx.ellipse(-r * 0.30, eyeY, 0.9, 3.2, 0, 0, Math.PI * 2);
  ctx.ellipse(r * 0.30, eyeY, 0.9, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Tiny inner highlight at top of each eye — gives them life
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.arc(-r * 0.31, eyeY - 1.6, 0.7, 0, Math.PI * 2);
  ctx.arc(r * 0.29, eyeY - 1.6, 0.7, 0, Math.PI * 2);
  ctx.fill();
  // Sharp brow lines above the eyes — angry V
  ctx.strokeStyle = p.shade;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-r * 0.42, eyeY - r * 0.18);
  ctx.lineTo(-r * 0.20, eyeY - r * 0.08);
  ctx.moveTo(r * 0.42, eyeY - r * 0.18);
  ctx.lineTo(r * 0.20, eyeY - r * 0.08);
  ctx.stroke();

  // Jagged gaping maw — downward zigzag with prominent fangs and drool
  const mouthY = r * 0.16 + bob;
  // Dark gaping interior
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.moveTo(-r * 0.28, mouthY);
  ctx.lineTo(-r * 0.20, mouthY + r * 0.08);
  ctx.lineTo(-r * 0.10, mouthY + r * 0.04);
  ctx.lineTo(0,           mouthY + r * 0.18);
  ctx.lineTo(r * 0.10,  mouthY + r * 0.04);
  ctx.lineTo(r * 0.20,  mouthY + r * 0.08);
  ctx.lineTo(r * 0.28,  mouthY);
  ctx.closePath();
  ctx.fill();
  // Outline
  ctx.strokeStyle = p.shade;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  // Four jagged fangs hanging from the upper edge
  ctx.fillStyle = p.fang;
  ctx.strokeStyle = p.shade;
  ctx.lineWidth = 0.9;
  const fang = (cx, w, h) => {
    ctx.beginPath();
    ctx.moveTo(cx - w, mouthY);
    ctx.lineTo(cx,     mouthY + h);
    ctx.lineTo(cx + w, mouthY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };
  fang(-r * 0.20, r * 0.04, r * 0.16);
  fang(-r * 0.07, r * 0.035, r * 0.13);
  fang(r * 0.07,  r * 0.035, r * 0.13);
  fang(r * 0.20,  r * 0.04, r * 0.16);
  // Drool — single string dripping from the lower jaw, pulses slowly
  const droolPhase = (e.t * 0.45) % 1;
  const droolLen = r * 0.18 + droolPhase * r * 0.12;
  ctx.strokeStyle = 'rgba(216,255,232,0.85)';
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, mouthY + r * 0.18);
  ctx.lineTo(0, mouthY + r * 0.18 + droolLen);
  ctx.stroke();
  // Drool bead at the tip
  ctx.fillStyle = 'rgba(216,255,232,0.9)';
  ctx.beginPath();
  ctx.arc(0, mouthY + r * 0.18 + droolLen, 1.6, 0, Math.PI * 2);
  ctx.fill();
}

// ---- BAT --------------------------------------------------------------------

const BAT_PALETTE = {
  wing: '#5e4575', wingShade: '#2a1a3a', body: '#2a1a3a',
  eye: '#ff3b6e', eyeGlow: '#ff3b6e', fang: '#ffffff',
};

function drawBat(ctx, e) {
  const r = e.radius;
  const p = e.palette || BAT_PALETTE;
  const flap = Math.sin(e.t * 10);
  const pulse = 0.5 + 0.5 * Math.sin(e.t * 6);

  // Shadow (subtle, since it flies)
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.85, r * 0.55, r * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  const wY = -r * 0.05;
  // Wings with visible bone structure
  for (const side of [-1, 1]) {
    const sx = side;
    const wingGrad = ctx.createLinearGradient(0, wY, sx * r * 1.6, wY);
    wingGrad.addColorStop(0, p.wing);
    wingGrad.addColorStop(1, p.wingShade);
    ctx.fillStyle = wingGrad;
    ctx.strokeStyle = p.wingShade;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, wY);
    // Outer bone curve, flap affects the tip height
    ctx.quadraticCurveTo(sx * r * 1.0, wY - r * 0.5 + flap * r * 0.5, sx * r * 1.6, wY + flap * r * 0.4);
    // Lower edge with scalloped membrane
    ctx.quadraticCurveTo(sx * r * 1.2, wY + r * 0.05, sx * r * 0.95, wY + r * 0.25);
    ctx.quadraticCurveTo(sx * r * 0.7, wY + r * 0.1, sx * r * 0.55, wY + r * 0.3);
    ctx.quadraticCurveTo(sx * r * 0.35, wY + r * 0.15, sx * r * 0.2, wY + r * 0.25);
    ctx.lineTo(0, wY + r * 0.1);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Bone struts
    ctx.strokeStyle = p.wingShade;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, wY);
    ctx.lineTo(sx * r * 0.55, wY + r * 0.3);
    ctx.moveTo(0, wY);
    ctx.lineTo(sx * r * 0.95, wY + r * 0.25);
    ctx.moveTo(0, wY);
    ctx.lineTo(sx * r * 1.4, wY + flap * r * 0.4);
    ctx.stroke();
  }

  // Body
  ctx.fillStyle = p.body;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, wY, r * 0.32, r * 0.42, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  // Body fur tufts (top)
  ctx.fillStyle = p.body;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.arc(i * r * 0.12, wY - r * 0.38, r * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
  // Ears (pointed)
  for (const side of [-1, 1]) {
    ctx.fillStyle = p.body;
    ctx.beginPath();
    ctx.moveTo(side * r * 0.08, wY - r * 0.38);
    ctx.lineTo(side * r * 0.22, wY - r * 0.65);
    ctx.lineTo(side * r * 0.26, wY - r * 0.32);
    ctx.closePath();
    ctx.fill();
    // Inner ear (lighter)
    ctx.fillStyle = '#d04060';
    ctx.beginPath();
    ctx.moveTo(side * r * 0.13, wY - r * 0.4);
    ctx.lineTo(side * r * 0.21, wY - r * 0.58);
    ctx.lineTo(side * r * 0.23, wY - r * 0.36);
    ctx.closePath();
    ctx.fill();
  }
  // Glowing eyes (pulse)
  ctx.fillStyle = p.eye;
  ctx.shadowColor = p.eyeGlow;
  ctx.shadowBlur = 6 + pulse * 6;
  ctx.beginPath();
  ctx.arc(-r * 0.12, wY - r * 0.08, 2.6, 0, Math.PI * 2);
  ctx.arc(r * 0.12, wY - r * 0.08, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Tiny fangs
  ctx.fillStyle = p.fang;
  ctx.beginPath();
  ctx.moveTo(-r * 0.06, wY + r * 0.18);
  ctx.lineTo(-r * 0.04, wY + r * 0.28);
  ctx.lineTo(-r * 0.02, wY + r * 0.18);
  ctx.closePath();
  ctx.moveTo(r * 0.02, wY + r * 0.18);
  ctx.lineTo(r * 0.04, wY + r * 0.28);
  ctx.lineTo(r * 0.06, wY + r * 0.18);
  ctx.closePath();
  ctx.fill();
}

// ---- WOLF -------------------------------------------------------------------

const WOLF_PALETTE = {
  body: '#6a5040', under: '#3a2820', mane: '#5a3828',
  eye: '#ffe46b', eyeGlow: '#ffe46b', fang: '#ffffff', claw: '#1a0d0d',
};

function drawWolf(ctx, e) {
  const r = e.radius;
  const p = e.palette || WOLF_PALETTE;
  const breath = Math.sin(e.t * 3) * 1.2;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.78, r * 1.0, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hind legs
  ctx.fillStyle = p.body;
  ctx.fillRect(-r * 0.8, r * 0.4, r * 0.18, r * 0.45);
  ctx.fillStyle = p.claw;
  ctx.fillRect(-r * 0.82, r * 0.78, r * 0.22, r * 0.08);

  // Tail (bushy, behind)
  ctx.save();
  ctx.translate(-r * 0.85, r * 0.0);
  ctx.rotate(-0.4 + Math.sin(e.t * 2.5) * 0.15);
  ctx.fillStyle = p.body;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-r * 0.35, -r * 0.25, -r * 0.55, -r * 0.5);
  ctx.lineTo(-r * 0.6, -r * 0.3);
  ctx.quadraticCurveTo(-r * 0.3, -r * 0.1, 0, r * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = p.under;
  ctx.beginPath();
  ctx.arc(-r * 0.5, -r * 0.45, r * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Body (main mass)
  const bodyGrad = ctx.createLinearGradient(0, -r * 0.3, 0, r * 0.5);
  bodyGrad.addColorStop(0, p.body);
  bodyGrad.addColorStop(0.7, p.body);
  bodyGrad.addColorStop(1, p.under);
  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = '#1a0808';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, breath * 0.4, r * 0.92, r * 0.58, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  // Mane (raised hackles down the back)
  ctx.fillStyle = p.mane;
  ctx.beginPath();
  ctx.moveTo(-r * 0.6, -r * 0.4);
  for (let i = 0; i <= 8; i++) {
    const x = -r * 0.6 + (i / 8) * r * 1.0;
    const yOff = (i % 2 === 0) ? -r * 0.55 : -r * 0.45;
    ctx.lineTo(x, yOff);
  }
  ctx.lineTo(r * 0.4, -r * 0.3);
  ctx.closePath();
  ctx.fill();

  // Front legs
  ctx.fillStyle = p.body;
  ctx.fillRect(r * 0.25, r * 0.4, r * 0.18, r * 0.45);
  ctx.fillStyle = p.claw;
  ctx.fillRect(r * 0.23, r * 0.78, r * 0.22, r * 0.08);

  // Head
  ctx.fillStyle = p.body;
  ctx.strokeStyle = '#1a0808';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(r * 0.6, -r * 0.22, r * 0.45, r * 0.36, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  // Snout
  ctx.fillStyle = p.body;
  ctx.beginPath();
  ctx.moveTo(r * 0.85, -r * 0.05);
  ctx.lineTo(r * 1.1, -r * 0.05);
  ctx.lineTo(r * 1.05, r * 0.12);
  ctx.lineTo(r * 0.82, r * 0.1);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  // Nose
  ctx.fillStyle = '#1a0808';
  ctx.beginPath();
  ctx.arc(r * 1.07, -r * 0.02, r * 0.05, 0, Math.PI * 2);
  ctx.fill();
  // Snarl with fangs
  ctx.fillStyle = p.fang;
  ctx.beginPath();
  ctx.moveTo(r * 0.85, r * 0.05);
  ctx.lineTo(r * 0.88, r * 0.16);
  ctx.lineTo(r * 0.92, r * 0.05);
  ctx.closePath();
  ctx.moveTo(r * 0.96, r * 0.05);
  ctx.lineTo(r * 0.99, r * 0.18);
  ctx.lineTo(r * 1.03, r * 0.05);
  ctx.closePath();
  ctx.fill();
  // Ears
  ctx.fillStyle = p.body;
  ctx.beginPath();
  ctx.moveTo(r * 0.55, -r * 0.5);
  ctx.lineTo(r * 0.4, -r * 0.85);
  ctx.lineTo(r * 0.7, -r * 0.6);
  ctx.closePath();
  ctx.moveTo(r * 0.78, -r * 0.5);
  ctx.lineTo(r * 0.85, -r * 0.8);
  ctx.lineTo(r * 0.95, -r * 0.5);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  // Inner ears
  ctx.fillStyle = '#5a2828';
  ctx.beginPath();
  ctx.moveTo(r * 0.52, -r * 0.55);
  ctx.lineTo(r * 0.45, -r * 0.78);
  ctx.lineTo(r * 0.65, -r * 0.62);
  ctx.closePath();
  ctx.fill();

  // Glowing eye
  ctx.fillStyle = p.eye;
  ctx.shadowColor = p.eyeGlow; ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(r * 0.72, -r * 0.28, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(r * 0.72, -r * 0.28, 0.8, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ---- WRAITH -----------------------------------------------------------------

const WRAITH_PALETTE = {
  body: '#7a3bff', shade: '#2a0d4d', glow: 'rgba(150,80,255,', skull: '#e8d8ff', eye: '#ffffff',
};

function drawWraith(ctx, e) {
  const r = e.radius;
  const p = e.palette || WRAITH_PALETTE;
  const wob = Math.sin(e.t * 3) * 4;

  // Outer glow aura
  ctx.save();
  const g = ctx.createRadialGradient(0, wob, 0, 0, wob, r * 1.9);
  g.addColorStop(0, p.glow + '0.55)');
  g.addColorStop(1, p.glow + '0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, wob, r * 1.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Trailing ribbons (sub-bodies behind). Save/restore the alpha so the
  // caller's globalAlpha (used for death fade) survives this block.
  const baseAlpha = ctx.globalAlpha;
  for (let i = 1; i <= 3; i++) {
    const ribbonR = r * (1 - i * 0.2);
    const offsetY = wob + i * r * 0.15;
    ctx.fillStyle = p.shade;
    ctx.globalAlpha = baseAlpha * (0.4 / i);
    ctx.beginPath();
    ctx.moveTo(0, -ribbonR + offsetY);
    ctx.bezierCurveTo(ribbonR * 1.1, -ribbonR * 0.4 + offsetY, ribbonR * 0.9, ribbonR * 0.6 + offsetY, ribbonR * 0.4, ribbonR + offsetY);
    ctx.lineTo(-ribbonR * 0.4, ribbonR + offsetY);
    ctx.bezierCurveTo(-ribbonR * 0.9, ribbonR * 0.6 + offsetY, -ribbonR * 1.1, -ribbonR * 0.4 + offsetY, 0, -ribbonR + offsetY);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = baseAlpha;
  }

  // Body — wispy with frayed edges
  const bodyGrad = ctx.createLinearGradient(0, -r + wob, 0, r + wob);
  bodyGrad.addColorStop(0, p.body);
  bodyGrad.addColorStop(1, p.shade);
  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = p.shade;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -r + wob);
  ctx.bezierCurveTo(r * 1.15, -r * 0.4 + wob, r * 0.95, r * 0.6 + wob, r * 0.5, r + wob);
  // Frayed bottom
  ctx.lineTo(r * 0.35, r * 0.85 + wob);
  ctx.lineTo(r * 0.18, r * 1.05 + wob);
  ctx.lineTo(0, r * 0.85 + wob);
  ctx.lineTo(-r * 0.18, r * 1.05 + wob);
  ctx.lineTo(-r * 0.35, r * 0.85 + wob);
  ctx.lineTo(-r * 0.5, r + wob);
  ctx.bezierCurveTo(-r * 0.95, r * 0.6 + wob, -r * 1.15, -r * 0.4 + wob, 0, -r + wob);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Skull face hint — multiply with caller alpha so the death fade carries.
  ctx.fillStyle = p.skull;
  ctx.globalAlpha = baseAlpha * 0.55;
  ctx.beginPath();
  ctx.arc(0, -r * 0.25 + wob, r * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = baseAlpha;
  // Hollow eye sockets with glow
  ctx.shadowColor = p.eye; ctx.shadowBlur = 12;
  ctx.fillStyle = p.eye;
  ctx.beginPath();
  ctx.arc(-r * 0.18, -r * 0.28 + wob, r * 0.09, 0, Math.PI * 2);
  ctx.arc(r * 0.18, -r * 0.28 + wob, r * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Nasal cavity
  ctx.fillStyle = p.shade;
  ctx.beginPath();
  ctx.moveTo(-r * 0.05, -r * 0.1 + wob);
  ctx.lineTo(r * 0.05, -r * 0.1 + wob);
  ctx.lineTo(0, r * 0.02 + wob);
  ctx.closePath();
  ctx.fill();
  // Jaw teeth
  ctx.strokeStyle = p.shade;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-r * 0.18, r * 0.1 + wob);
  ctx.lineTo(r * 0.18, r * 0.1 + wob);
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const tx = -r * 0.15 + i * r * 0.075;
    ctx.beginPath();
    ctx.moveTo(tx, r * 0.1 + wob);
    ctx.lineTo(tx, r * 0.18 + wob);
    ctx.stroke();
  }
}

// ---- CHAPTER 2 BOSSES ------------------------------------------------------
// Bespoke draw functions for the Rotcrown (mid-boss) and the Bloom of Decay
// (final boss). Both are deliberately distinct from the regular Treant so the
// silhouette reads as "this is a different creature, not a recolor."

const ROTCROWN_PALETTE = {
  bark: '#3a2018', shade: '#0a0608', fungus: '#a87030',
  cap: '#c0445a', capDark: '#601a28', spore: '#d8c060', eye: '#ff5a3b',
};
function drawRotcrown(ctx, e) {
  const r = e.radius;
  const breathe = Math.sin(e.t * 0.9) * 1.6;
  const swayL = Math.sin(e.t * 1.3) * 0.05;
  const swayR = Math.sin(e.t * 1.3 + 0.5) * 0.05;

  // Ground shadow — wide and oblong, suggesting a heavy creature with roots.
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.98, r * 1.15, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tangled root base — much heavier than a normal treant
  ctx.fillStyle = ROTCROWN_PALETTE.shade;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * r * 0.5, r * 0.85);
    ctx.bezierCurveTo(side * r * 0.95, r * 0.92, side * r * 0.85, r * 0.6, side * r * 0.6, r * 0.5);
    ctx.bezierCurveTo(side * r * 0.7, r * 0.7, side * r * 0.75, r * 0.85, side * r * 0.45, r * 0.85);
    ctx.closePath();
    ctx.fill();
    // Secondary root tendril
    ctx.beginPath();
    ctx.moveTo(side * r * 0.35, r * 0.9);
    ctx.bezierCurveTo(side * r * 0.55, r * 1.0, side * r * 0.45, r * 0.78, side * r * 0.3, r * 0.7);
    ctx.bezierCurveTo(side * r * 0.4, r * 0.85, side * r * 0.5, r * 0.95, side * r * 0.32, r * 0.92);
    ctx.closePath();
    ctx.fill();
  }

  // Trunk — wider and shorter than a normal treant; ridged with rot lines
  const trunkGrad = ctx.createLinearGradient(-r, 0, r, 0);
  trunkGrad.addColorStop(0, ROTCROWN_PALETTE.shade);
  trunkGrad.addColorStop(0.45, ROTCROWN_PALETTE.bark);
  trunkGrad.addColorStop(0.6, '#5a3024');
  trunkGrad.addColorStop(1, ROTCROWN_PALETTE.shade);
  ctx.fillStyle = trunkGrad;
  ctx.strokeStyle = '#0a0408';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, breathe + r * 0.05, r * 0.85, r * 0.78, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  // Rot fissures (jagged dark lines)
  ctx.strokeStyle = '#0a0202';
  ctx.lineWidth = 1.6;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    const x = i * r * 0.18;
    ctx.moveTo(x, -r * 0.4);
    ctx.lineTo(x - 3, -r * 0.15 + Math.sin(i) * 4);
    ctx.lineTo(x + 4, r * 0.1);
    ctx.lineTo(x - 2, r * 0.4);
    ctx.stroke();
  }
  // Fungal shelves on the trunk (ear-like)
  ctx.fillStyle = ROTCROWN_PALETTE.fungus;
  for (const [bx, by] of [[-r * 0.5, -r * 0.15], [r * 0.55, r * 0.1], [-r * 0.55, r * 0.35]]) {
    ctx.beginPath();
    ctx.ellipse(bx, by, r * 0.18, r * 0.08, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5a3818';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx - r * 0.16, by);
    ctx.lineTo(bx + r * 0.16, by);
    ctx.stroke();
  }

  // The CROWN — a wreath of fungal toadstools across the top, identifying mark
  const capCenters = [
    [-r * 0.55, -r * 0.5, r * 0.18],
    [-r * 0.18, -r * 0.7, r * 0.22],
    [r * 0.2,  -r * 0.72, r * 0.2],
    [r * 0.55, -r * 0.5, r * 0.18],
    [0,        -r * 0.85, r * 0.16],
  ];
  for (const [cx, cy, cr] of capCenters) {
    // Stalk
    ctx.fillStyle = '#d8c8a0';
    ctx.beginPath();
    ctx.moveTo(cx - cr * 0.2, cy + cr * 0.1);
    ctx.lineTo(cx + cr * 0.2, cy + cr * 0.1);
    ctx.lineTo(cx + cr * 0.15, cy - cr * 0.15);
    ctx.lineTo(cx - cr * 0.15, cy - cr * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#6a5a30';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Cap (red dome)
    const cg = ctx.createRadialGradient(cx, cy - cr * 0.2, 0, cx, cy - cr * 0.2, cr);
    cg.addColorStop(0, '#ff8090');
    cg.addColorStop(0.6, ROTCROWN_PALETTE.cap);
    cg.addColorStop(1, ROTCROWN_PALETTE.capDark);
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(cx, cy - cr * 0.2, cr, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#3a0a14';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // White wart-dots on the cap
    ctx.fillStyle = '#fff5d8';
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI + (i + 1) * Math.PI / 5;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * cr * 0.6, cy - cr * 0.2 + Math.sin(a) * cr * 0.6, cr * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Twin branch arms with grasping clawed fingers
  for (const side of [-1, 1]) {
    const sway = side < 0 ? swayL : swayR;
    ctx.save();
    ctx.translate(side * r * 0.7, -r * 0.05);
    ctx.rotate(side * (0.3 + sway));
    // Branch arm
    ctx.strokeStyle = ROTCROWN_PALETTE.shade;
    ctx.lineWidth = r * 0.16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(r * 0.2, r * 0.2, r * 0.55, r * 0.05);
    ctx.stroke();
    // Three claw-fingers at the end
    ctx.strokeStyle = '#1a0a04';
    ctx.lineWidth = r * 0.06;
    for (let f = -1; f <= 1; f++) {
      ctx.beginPath();
      ctx.moveTo(r * 0.55, r * 0.05);
      ctx.quadraticCurveTo(r * 0.7, r * 0.05 + f * r * 0.1, r * 0.85, r * 0.1 + f * r * 0.2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Hollow face — sunken eye sockets glowing red
  ctx.fillStyle = '#0a0204';
  ctx.beginPath();
  ctx.ellipse(-r * 0.22, -r * 0.18, r * 0.13, r * 0.1, 0, 0, Math.PI * 2);
  ctx.ellipse(r * 0.22, -r * 0.18, r * 0.13, r * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eye embers (pulsing)
  const eyePulse = 0.7 + Math.sin(e.t * 3) * 0.3;
  ctx.fillStyle = ROTCROWN_PALETTE.eye;
  ctx.shadowColor = ROTCROWN_PALETTE.eye; ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(-r * 0.22, -r * 0.18, r * 0.05 * eyePulse, 0, Math.PI * 2);
  ctx.arc(r * 0.22, -r * 0.18, r * 0.05 * eyePulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Jagged knothole mouth — angry split, with teeth-like splinters
  ctx.strokeStyle = '#0a0202';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-r * 0.18, r * 0.18);
  ctx.lineTo(-r * 0.06, r * 0.12);
  ctx.lineTo(0, r * 0.22);
  ctx.lineTo(r * 0.06, r * 0.14);
  ctx.lineTo(r * 0.18, r * 0.2);
  ctx.stroke();
  // Spores drifting up from the mouth
  for (let i = 0; i < 3; i++) {
    const phase = (e.t * 0.6 + i * 0.31) % 1;
    const sy = r * 0.1 - phase * r * 0.4;
    const sa = Math.max(0, 1 - phase) * 0.7;
    ctx.fillStyle = 'rgba(216,192,96,' + sa + ')';
    ctx.beginPath();
    ctx.arc((i - 1) * r * 0.05 + Math.sin(e.t + i) * 2, sy, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Bloom of Decay — the chapter 2 final boss. A giant violet flower-creature
// crowning a corrupted leyline knot. Five distinct face-petals, each almost
// human, with Vael's face visible through one. Twin tendril-arms below.
const BLOOM_PALETTE = {
  petalLight: '#a060ff', petalDark: '#3a0a6a', petalEdge: '#ff60ff',
  core: '#ff60ff', faceSkin: '#d8a8c8', vein: '#5a0a6a',
  rootBark: '#2a0830', rootShade: '#0a0210',
};
function drawBloom(ctx, e) {
  const r = e.radius;
  const breathe = Math.sin(e.t * 0.8) * 2.5;
  const flicker = 0.85 + Math.sin(e.t * 2.5) * 0.15;

  // Vast ground shadow — much wider than other enemies
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.ellipse(0, r * 1.05, r * 1.35, r * 0.36, 0, 0, Math.PI * 2);
  ctx.fill();

  // Knotted root cluster at the base (the leyline-knot itself)
  ctx.fillStyle = BLOOM_PALETTE.rootShade;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * r * 0.45, r * 0.9);
    ctx.bezierCurveTo(side * r * 1.1, r * 1.0, side * r * 1.0, r * 0.55, side * r * 0.55, r * 0.45);
    ctx.bezierCurveTo(side * r * 0.85, r * 0.7, side * r * 0.9, r * 0.95, side * r * 0.4, r * 0.9);
    ctx.closePath();
    ctx.fill();
  }
  // Knot stem rising — black-violet, with veins glowing inside
  const stemGrad = ctx.createLinearGradient(0, 0, 0, r);
  stemGrad.addColorStop(0, BLOOM_PALETTE.rootBark);
  stemGrad.addColorStop(1, BLOOM_PALETTE.rootShade);
  ctx.fillStyle = stemGrad;
  ctx.beginPath();
  ctx.moveTo(-r * 0.32, r * 0.95);
  ctx.bezierCurveTo(-r * 0.45, r * 0.5, -r * 0.4, r * 0.0, -r * 0.32, -r * 0.25);
  ctx.lineTo(r * 0.32, -r * 0.25);
  ctx.bezierCurveTo(r * 0.4, r * 0.0, r * 0.45, r * 0.5, r * 0.32, r * 0.95);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  // Glowing aether veins inside the stem
  ctx.strokeStyle = BLOOM_PALETTE.petalEdge;
  ctx.lineWidth = 1.4;
  ctx.shadowColor = BLOOM_PALETTE.core; ctx.shadowBlur = 8 * flicker;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * r * 0.12, r * 0.9);
    ctx.bezierCurveTo(i * r * 0.18, r * 0.4, i * r * 0.16, r * 0.1, i * r * 0.1, -r * 0.2);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // Five face-petals arranged around the bloom head. Each petal has a faint
  // human face etched into it; one (the front, index 2) is Vael — sharper.
  ctx.save();
  ctx.translate(0, breathe - r * 0.25);
  const petalCount = 5;
  const radius = r * 1.0;
  for (let i = 0; i < petalCount; i++) {
    const angle = -Math.PI / 2 + (i - 2) * 0.55;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius * 0.75;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle + Math.PI / 2);
    // Petal body — teardrop with gradient
    const pg = ctx.createRadialGradient(0, -r * 0.05, 0, 0, 0, r * 0.65);
    pg.addColorStop(0, BLOOM_PALETTE.petalLight);
    pg.addColorStop(0.6, BLOOM_PALETTE.petalDark);
    pg.addColorStop(1, '#1a0030');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.85);
    ctx.bezierCurveTo(r * 0.55, -r * 0.6, r * 0.55, r * 0.3, 0, r * 0.5);
    ctx.bezierCurveTo(-r * 0.55, r * 0.3, -r * 0.55, -r * 0.6, 0, -r * 0.85);
    ctx.closePath();
    ctx.fill();
    // Petal edge — magenta rim
    ctx.strokeStyle = BLOOM_PALETTE.petalEdge;
    ctx.lineWidth = 1.6;
    ctx.shadowColor = BLOOM_PALETTE.petalEdge; ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;
    // Vein lines
    ctx.strokeStyle = BLOOM_PALETTE.vein;
    ctx.lineWidth = 1;
    for (let v = -1; v <= 1; v++) {
      ctx.beginPath();
      ctx.moveTo(0, r * 0.4);
      ctx.bezierCurveTo(v * r * 0.18, r * 0.1, v * r * 0.2, -r * 0.3, v * r * 0.05, -r * 0.7);
      ctx.stroke();
    }
    // Ghostly face etched into petal — pale, eyes closed except for Vael's
    ctx.fillStyle = 'rgba(216,168,200,0.55)';
    ctx.beginPath();
    ctx.arc(0, -r * 0.2, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
    // Eyes — closed (just thin slits) on the side petals, OPEN on Vael (centre, i==2)
    ctx.strokeStyle = '#1a0010';
    ctx.lineWidth = 1.2;
    if (i === 2) {
      // Vael's face — open eyes, magenta inside, slightly distressed
      ctx.fillStyle = '#1a0010';
      ctx.beginPath();
      ctx.arc(-r * 0.07, -r * 0.22, r * 0.04, 0, Math.PI * 2);
      ctx.arc(r * 0.07, -r * 0.22, r * 0.04, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = BLOOM_PALETTE.core;
      ctx.shadowColor = BLOOM_PALETTE.core; ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(-r * 0.07, -r * 0.22, r * 0.018, 0, Math.PI * 2);
      ctx.arc(r * 0.07, -r * 0.22, r * 0.018, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // A small sorrowful mouth — slight downturn
      ctx.beginPath();
      ctx.moveTo(-r * 0.06, -r * 0.1);
      ctx.quadraticCurveTo(0, -r * 0.07, r * 0.06, -r * 0.1);
      ctx.stroke();
    } else {
      // Closed eyes (other petals are echo-faces of dead Order members)
      ctx.beginPath();
      ctx.moveTo(-r * 0.1, -r * 0.22);
      ctx.lineTo(-r * 0.04, -r * 0.22);
      ctx.moveTo(r * 0.04, -r * 0.22);
      ctx.lineTo(r * 0.1, -r * 0.22);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Central pistil — glowing magenta heart of the bloom
  const cg = ctx.createRadialGradient(0, -r * 0.15, 0, 0, -r * 0.15, r * 0.4);
  cg.addColorStop(0, '#ffffff');
  cg.addColorStop(0.25, BLOOM_PALETTE.core);
  cg.addColorStop(0.75, '#7020aa');
  cg.addColorStop(1, '#2a0040');
  ctx.fillStyle = cg;
  ctx.shadowColor = BLOOM_PALETTE.core; ctx.shadowBlur = 22 * flicker;
  ctx.beginPath();
  ctx.arc(0, -r * 0.15, r * 0.34 * flicker, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Inner ring of small stamen-spikes
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + e.t * 0.3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.22, -r * 0.15 + Math.sin(a) * r * 0.22);
    ctx.lineTo(Math.cos(a) * r * 0.34, -r * 0.15 + Math.sin(a) * r * 0.34);
    ctx.stroke();
  }
  ctx.restore();

  // Twin tendril-arms below, drifting like seaweed
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * r * 0.55, r * 0.0);
    const wave = Math.sin(e.t * 1.2 + side) * 0.18;
    ctx.strokeStyle = BLOOM_PALETTE.rootBark;
    ctx.lineWidth = r * 0.1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(side * r * 0.4, r * 0.2 + wave * 30, side * r * 0.55, r * 0.6 + wave * 20, side * r * 0.4, r * 0.85);
    ctx.stroke();
    // Glowing magenta tip
    ctx.fillStyle = BLOOM_PALETTE.core;
    ctx.shadowColor = BLOOM_PALETTE.core; ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(side * r * 0.4, r * 0.85, r * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Floating ash / aether motes around the bloom (always-on ambient)
  for (let i = 0; i < 6; i++) {
    const phase = (e.t * 0.4 + i * 0.17) % 1;
    const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
    const dist = r * 1.1 + phase * r * 0.4;
    const x = Math.cos(a + e.t * 0.15) * dist;
    const y = Math.sin(a + e.t * 0.15) * dist * 0.7 - r * 0.2;
    const alpha = Math.max(0, 1 - phase) * 0.7;
    ctx.fillStyle = 'rgba(192,96,255,' + alpha + ')';
    ctx.shadowColor = '#a060ff'; ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// ---- VERDANT REACH (chapter 2 tier 3) ---------------------------------------

const TREANT_PALETTE = { bark: '#5a3a18', shade: '#2a1a08', moss: '#3a7a3b', eye: '#ffd84d' };
function drawTreant(ctx, e) {
  const r = e.radius;
  const breathe = Math.sin(e.t * 1.2) * 1.2;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(0, r * 0.95, r * 0.95, r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  // Roots
  ctx.fillStyle = TREANT_PALETTE.shade;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * r * 0.45, r * 0.85);
    ctx.lineTo(side * r * 0.75, r * 0.95);
    ctx.lineTo(side * r * 0.6, r * 0.7);
    ctx.closePath(); ctx.fill();
  }
  // Trunk
  const grad = ctx.createLinearGradient(-r, 0, r, 0);
  grad.addColorStop(0, TREANT_PALETTE.shade);
  grad.addColorStop(0.5, TREANT_PALETTE.bark);
  grad.addColorStop(1, TREANT_PALETTE.shade);
  ctx.fillStyle = grad;
  ctx.strokeStyle = '#1a0d04';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, breathe, r * 0.72, r * 0.88, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // Bark texture
  ctx.strokeStyle = '#1a0d04';
  ctx.lineWidth = 1;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * r * 0.22, -r * 0.55);
    ctx.lineTo(i * r * 0.22 + Math.sin(i + e.t) * 3, r * 0.5);
    ctx.stroke();
  }
  // Moss patches
  ctx.fillStyle = TREANT_PALETTE.moss;
  ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.4, r * 0.28, r * 0.16, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r * 0.25, r * 0.15, r * 0.22, r * 0.13, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a3a1a';
  ctx.beginPath(); ctx.arc(-r * 0.25, -r * 0.4, r * 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.3, r * 0.2, r * 0.06, 0, Math.PI * 2); ctx.fill();
  // Branch arms with leaves
  ctx.strokeStyle = TREANT_PALETTE.shade;
  ctx.lineWidth = r * 0.13;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, -r * 0.15);
  ctx.lineTo(-r * 1.05, -r * 0.55);
  ctx.moveTo(r * 0.5, -r * 0.15);
  ctx.lineTo(r * 1.05, -r * 0.55);
  ctx.stroke();
  for (const [bx, by] of [[-r * 1.05, -r * 0.55], [r * 1.05, -r * 0.55]]) {
    ctx.fillStyle = TREANT_PALETTE.moss;
    ctx.beginPath(); ctx.arc(bx, by, r * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a3a1a';
    ctx.beginPath(); ctx.arc(bx + 4, by - 4, r * 0.11, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(bx - 5, by + 3, r * 0.09, 0, Math.PI * 2); ctx.fill();
  }
  // Eyes
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(-r * 0.18, -r * 0.32, r * 0.09, 0, Math.PI * 2);
  ctx.arc(r * 0.18, -r * 0.32, r * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = TREANT_PALETTE.eye;
  ctx.shadowColor = TREANT_PALETTE.eye; ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(-r * 0.18, -r * 0.32, r * 0.045, 0, Math.PI * 2);
  ctx.arc(r * 0.18, -r * 0.32, r * 0.045, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Knothole mouth
  ctx.strokeStyle = '#1a0d04';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.05, r * 0.08);
  ctx.lineTo(r * 0.05, r * 0.32);
  ctx.stroke();
}

const SPRITE_PALETTE = { body: '#3a7a3b', glow: 'rgba(160,255,120,', thorn: '#1a3a1a' };
function drawSprite(ctx, e) {
  const r = e.radius;
  const wob = Math.sin(e.t * 4) * 3;
  // Floating shadow (offset, no contact)
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(0, r * 1.2, r * 0.55, r * 0.15, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.translate(0, wob);
  // Outer aura
  const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.3);
  aura.addColorStop(0, SPRITE_PALETTE.glow + '0.55)');
  aura.addColorStop(1, SPRITE_PALETTE.glow + '0)');
  ctx.fillStyle = aura;
  ctx.beginPath(); ctx.arc(0, 0, r * 1.3, 0, Math.PI * 2); ctx.fill();
  // Body (elongated leaf-seed)
  ctx.fillStyle = SPRITE_PALETTE.body;
  ctx.strokeStyle = SPRITE_PALETTE.thorn;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.bezierCurveTo(r * 0.65, -r * 0.3, r * 0.65, r * 0.3, 0, r);
  ctx.bezierCurveTo(-r * 0.65, r * 0.3, -r * 0.65, -r * 0.3, 0, -r);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  // Center vein
  ctx.strokeStyle = SPRITE_PALETTE.thorn;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.85);
  ctx.lineTo(0, r * 0.85);
  ctx.stroke();
  // Thorns radiating out
  ctx.strokeStyle = SPRITE_PALETTE.thorn;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + e.t * 0.3;
    const dx = Math.cos(a), dy = Math.sin(a);
    const x0 = dx * r * 0.6, y0 = dy * r * 0.6;
    const x1 = dx * r * 1.0, y1 = dy * r * 1.0;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  }
  // Eyes (glowing)
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#a8ffc8'; ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(-r * 0.16, -r * 0.12, r * 0.11, 0, Math.PI * 2);
  ctx.arc(r * 0.16, -r * 0.12, r * 0.11, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(-r * 0.14, -r * 0.12, r * 0.04, 0, Math.PI * 2);
  ctx.arc(r * 0.18, -r * 0.12, r * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const WSTAG_PALETTE = { body: '#3a1a08', shade: '#1a0a04', ember: '#ff5a3b', antler: '#5a2010' };
function drawWitheredStag(ctx, e) {
  const r = e.radius;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath(); ctx.ellipse(0, r * 0.72, r * 1.05, r * 0.28, 0, 0, Math.PI * 2); ctx.fill();
  // Legs
  ctx.fillStyle = WSTAG_PALETTE.shade;
  ctx.fillRect(-r * 0.7, r * 0.35, r * 0.12, r * 0.5);
  ctx.fillRect(-r * 0.42, r * 0.35, r * 0.12, r * 0.5);
  ctx.fillRect(r * 0.2, r * 0.35, r * 0.12, r * 0.5);
  ctx.fillRect(r * 0.5, r * 0.35, r * 0.12, r * 0.5);
  // Body
  const bg = ctx.createLinearGradient(0, -r * 0.3, 0, r * 0.5);
  bg.addColorStop(0, WSTAG_PALETTE.body);
  bg.addColorStop(1, WSTAG_PALETTE.shade);
  ctx.fillStyle = bg;
  ctx.strokeStyle = '#0a0402';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 0, r * 0.95, r * 0.55, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // Ember cracks on body
  ctx.strokeStyle = WSTAG_PALETTE.ember;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = WSTAG_PALETTE.ember; ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(-r * 0.45, -r * 0.25); ctx.lineTo(-r * 0.2, -r * 0.05); ctx.lineTo(-r * 0.35, r * 0.15);
  ctx.moveTo(r * 0.15, -r * 0.2); ctx.lineTo(r * 0.45, r * 0.0); ctx.lineTo(r * 0.3, r * 0.18);
  ctx.moveTo(-r * 0.1, r * 0.0); ctx.lineTo(r * 0.05, r * 0.25);
  ctx.stroke();
  ctx.shadowBlur = 0;
  // Head
  ctx.fillStyle = WSTAG_PALETTE.shade;
  ctx.strokeStyle = '#0a0402';
  ctx.beginPath(); ctx.ellipse(r * 0.7, -r * 0.22, r * 0.42, r * 0.34, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // Snout
  ctx.beginPath();
  ctx.moveTo(r * 0.95, -r * 0.13);
  ctx.lineTo(r * 1.18, -r * 0.1);
  ctx.lineTo(r * 1.13, r * 0.08);
  ctx.lineTo(r * 0.9, r * 0.03);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // Antlers (multi-tined)
  ctx.strokeStyle = WSTAG_PALETTE.antler;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  // Near antler
  ctx.moveTo(r * 0.7, -r * 0.5);
  ctx.lineTo(r * 0.58, -r * 0.95);
  ctx.moveTo(r * 0.6, -r * 0.75);
  ctx.lineTo(r * 0.45, -r * 0.85);
  ctx.moveTo(r * 0.58, -r * 0.95);
  ctx.lineTo(r * 0.7, -r * 1.15);
  ctx.moveTo(r * 0.58, -r * 0.95);
  ctx.lineTo(r * 0.45, -r * 1.05);
  // Far antler
  ctx.moveTo(r * 0.85, -r * 0.5);
  ctx.lineTo(r * 0.95, -r * 0.92);
  ctx.moveTo(r * 0.9, -r * 0.7);
  ctx.lineTo(r * 1.08, -r * 0.8);
  ctx.moveTo(r * 0.95, -r * 0.92);
  ctx.lineTo(r * 0.85, -r * 1.1);
  ctx.stroke();
  // Ember tips
  ctx.fillStyle = '#ffae3b';
  ctx.shadowColor = WSTAG_PALETTE.ember; ctx.shadowBlur = 10;
  for (const [x, y] of [[r * 0.7, -r * 1.15], [r * 0.45, -r * 1.05], [r * 0.45, -r * 0.85], [r * 0.85, -r * 1.1], [r * 1.08, -r * 0.8]]) {
    ctx.beginPath(); ctx.arc(x, y, r * 0.07, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0;
  // Burning eye
  ctx.fillStyle = '#ffd84d';
  ctx.shadowColor = WSTAG_PALETTE.ember; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.arc(r * 0.78, -r * 0.3, r * 0.07, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(r * 0.78, -r * 0.3, 1.5, 4, 0, 0, Math.PI * 2); ctx.fill();
}

const MOTH_PALETTE = { wing: '#5a4a78', wingShade: '#2a1a3a', body: '#3a2a1a', spot: '#ffd84d', eye: '#ff3b6e' };
function drawChoirmoth(ctx, e) {
  const r = e.radius;
  const flap = Math.sin(e.t * 4) * 0.4;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(0, r * 0.8, r * 0.55, r * 0.15, 0, 0, Math.PI * 2); ctx.fill();
  // Wings (left + right symmetric)
  for (const side of [-1, 1]) {
    const sx = side;
    // Upper wing
    ctx.fillStyle = MOTH_PALETTE.wing;
    ctx.strokeStyle = MOTH_PALETTE.wingShade;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.05);
    ctx.bezierCurveTo(sx * r * 1.25, -r * 1.05 + flap * r * 0.35, sx * r * 1.35, -r * 0.15 + flap * r * 0.25, 0, -r * 0.2);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Lower wing
    ctx.beginPath();
    ctx.moveTo(0, r * 0.0);
    ctx.bezierCurveTo(sx * r * 1.0, r * 0.7 - flap * r * 0.25, sx * r * 0.65, r * 0.55 - flap * r * 0.2, 0, r * 0.25);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Eye spot on upper wing
    ctx.fillStyle = MOTH_PALETTE.spot;
    ctx.shadowColor = MOTH_PALETTE.spot; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(sx * r * 0.75, -r * 0.55, r * 0.14, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = MOTH_PALETTE.wingShade;
    ctx.beginPath(); ctx.arc(sx * r * 0.75, -r * 0.55, r * 0.07, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(sx * r * 0.75, -r * 0.55, r * 0.03, 0, Math.PI * 2); ctx.fill();
    // Wing pattern lines
    ctx.strokeStyle = MOTH_PALETTE.wingShade;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.15);
    ctx.lineTo(sx * r * 0.55, -r * 0.4);
    ctx.moveTo(0, r * 0.05);
    ctx.lineTo(sx * r * 0.55, r * 0.25);
    ctx.stroke();
  }
  // Body
  ctx.fillStyle = MOTH_PALETTE.body;
  ctx.beginPath(); ctx.ellipse(0, 0, r * 0.18, r * 0.42, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#1a0d04';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Fuzz tufts on body
  ctx.fillStyle = '#5a4030';
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath(); ctx.arc(0, i * r * 0.18, r * 0.07, 0, Math.PI * 2); ctx.fill();
  }
  // Antennae
  ctx.strokeStyle = '#5a3a18';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-r * 0.05, -r * 0.36);
  ctx.lineTo(-r * 0.18, -r * 0.6);
  ctx.moveTo(r * 0.05, -r * 0.36);
  ctx.lineTo(r * 0.18, -r * 0.6);
  ctx.stroke();
  ctx.fillStyle = '#7a5028';
  ctx.beginPath(); ctx.arc(-r * 0.18, -r * 0.6, 1.6, 0, Math.PI * 2); ctx.arc(r * 0.18, -r * 0.6, 1.6, 0, Math.PI * 2); ctx.fill();
  // Eyes
  ctx.fillStyle = MOTH_PALETTE.eye;
  ctx.shadowColor = MOTH_PALETTE.eye; ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.arc(-r * 0.07, -r * 0.25, 1.6, 0, Math.PI * 2);
  ctx.arc(r * 0.07, -r * 0.25, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

// ---- BOSS: HOLLOW WARDEN ----------------------------------------------------
// A Rift construct Vael sends to stop Lyra from leaving the Hollow. Visually
// fragmented — five jagged shards orbit a violet core with multiple eyes,
// crackling chains of light arcing between them.

const WARDEN_PALETTE = {
  core: '#3a1a6a', edge: '#1a0a3a', shard: '#a060ff', glow: '#a060ff',
};

function drawWarden(ctx, e) {
  const r = e.radius;
  // Phase-aware mutations:
  //   P1: 5 shards, white eyes, slow orbit, calm aura
  //   P2: 7 shards, faster orbit, eyes red-tinted, more chaotic wobble
  //   P3: 9 shards orbiting irregularly, all-red eyes, jagged extra fragments
  //       drifting from the core, violent aura pulse
  const phase = e._phase || 1;
  const shardCount = phase === 3 ? 9 : phase === 2 ? 7 : 5;
  const orbitSpeed = phase === 3 ? 1.4 : phase === 2 ? 0.95 : 0.6;
  const eyeColor = phase === 3 ? '#ff5a5a'
                 : phase === 2 ? '#ffb070' : '#ffffff';
  const auraStrength = phase === 3 ? 0.85 : phase === 2 ? 0.70 : 0.55;
  const wobAmp = phase === 3 ? 7 : phase === 2 ? 5 : 4;
  const wob = Math.sin(e.t * (phase === 3 ? 3.2 : 2)) * wobAmp;
  const fragPhase = e.t * orbitSpeed;
  const p = e.palette || WARDEN_PALETTE;

  // Big outer aura — intensifies with phase
  ctx.save();
  const aura = ctx.createRadialGradient(0, wob, 0, 0, wob, r * 2.2);
  const aHi = Math.round(auraStrength * 255);
  aura.addColorStop(0, `rgba(170,80,255,${auraStrength})`);
  aura.addColorStop(0.5, `rgba(120,60,200,${auraStrength * 0.5})`);
  aura.addColorStop(1, 'rgba(60,30,120,0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, wob, r * 2.2, 0, Math.PI * 2);
  ctx.fill();
  // P3: add a violent red-violet pulse halo on top of the standard aura
  if (phase === 3) {
    const pulse = 0.5 + 0.5 * Math.sin(e.t * 5);
    const halo = ctx.createRadialGradient(0, wob, r * 1.2, 0, wob, r * 2.4);
    halo.addColorStop(0, `rgba(255,80,120,0)`);
    halo.addColorStop(0.5, `rgba(255,80,120,${0.18 + pulse * 0.18})`);
    halo.addColorStop(1, `rgba(255,80,120,0)`);
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, wob, r * 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Chains of violet light linking shards to the core. In P3 the chains
  // start to break — only every other shard is connected, the rest float free.
  ctx.save();
  ctx.strokeStyle = 'rgba(220,180,255,0.55)';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = p.glow; ctx.shadowBlur = 10;
  for (let i = 0; i < shardCount; i++) {
    // P3: skip every other chain so half the shards drift unbound.
    if (phase === 3 && (i % 2 === 1)) continue;
    const a = (i / shardCount) * Math.PI * 2 + fragPhase;
    const x1 = Math.cos(a) * r * 0.3;
    const y1 = Math.sin(a) * r * 0.3 + wob;
    const x2 = Math.cos(a) * r * 0.95;
    const y2 = Math.sin(a) * r * 0.95 + wob;
    const mx = (x1 + x2) / 2 + Math.sin(e.t * 7 + i) * 6;
    const my = (y1 + y2) / 2 + Math.cos(e.t * 7 + i) * 6;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(mx, my);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();

  // Floating jagged shards — count + speed scales with phase
  for (let i = 0; i < shardCount; i++) {
    const a = (i / shardCount) * Math.PI * 2 + fragPhase;
    // P2+ shards orbit at irregular distance for a more chaotic silhouette.
    const distJitter = phase >= 2 ? Math.sin(e.t * 2.4 + i * 1.7) * 0.12 : 0.06;
    const dist = r * (0.85 + Math.sin(e.t * 1.5 + i) * distJitter);
    const fx = Math.cos(a) * dist;
    const fy = Math.sin(a) * dist + wob;
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(a + e.t * orbitSpeed);
    const grad = ctx.createLinearGradient(0, -r * 0.32, 0, r * 0.32);
    grad.addColorStop(0, p.shard);
    grad.addColorStop(1, p.edge);
    ctx.fillStyle = grad;
    ctx.strokeStyle = p.edge;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = p.glow; ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.32);
    ctx.lineTo(r * 0.14, 0);
    ctx.lineTo(0, r * 0.32);
    ctx.lineTo(-r * 0.14, 0);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  // P3: jagged extra fragments drifting just outside the core — debris from
  // a self-tearing form. Visually distinct from the orbiting shards.
  if (phase === 3) {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + e.t * 0.3;
      const dist = r * (1.20 + Math.sin(e.t * 1.8 + i) * 0.08);
      const fx = Math.cos(a) * dist;
      const fy = Math.sin(a) * dist + wob;
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(a * 1.5 + e.t * 0.4);
      ctx.fillStyle = '#ff5a8a';
      ctx.strokeStyle = '#3a0a1a';
      ctx.lineWidth = 1;
      ctx.shadowColor = '#ff5a8a'; ctx.shadowBlur = 7;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.10);
      ctx.lineTo(r * 0.07, 0);
      ctx.lineTo(0, r * 0.10);
      ctx.lineTo(-r * 0.07, 0);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }

  // Central core — irregular dark mass with multiple eyes
  ctx.save();
  ctx.translate(0, wob);
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.55);
  core.addColorStop(0, p.core);
  core.addColorStop(1, '#0a0420');
  ctx.fillStyle = core;
  ctx.strokeStyle = p.edge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.6);
  ctx.lineTo(r * 0.45, -r * 0.18);
  ctx.lineTo(r * 0.58, r * 0.25);
  ctx.lineTo(r * 0.22, r * 0.55);
  ctx.lineTo(-r * 0.22, r * 0.55);
  ctx.lineTo(-r * 0.58, r * 0.25);
  ctx.lineTo(-r * 0.45, -r * 0.18);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Five glowing eyes that pulse — color shifts with phase
  const eyePulse = 0.8 + 0.2 * Math.sin(e.t * 4);
  ctx.fillStyle = eyeColor;
  ctx.shadowColor = eyeColor; ctx.shadowBlur = phase === 3 ? 14 : 10;
  const eyes = [
    [-r * 0.22, -r * 0.18], [r * 0.22, -r * 0.18],
    [0, -r * 0.02],
    [-r * 0.2, r * 0.22], [r * 0.2, r * 0.22],
  ];
  for (const [ex, ey] of eyes) {
    ctx.beginPath();
    ctx.arc(ex, ey, r * 0.07 * eyePulse, 0, Math.PI * 2);
    ctx.fill();
  }
  // P3: two extra eyes open on the core, suggesting the form is splintering
  // into something with more awareness — and more hate.
  if (phase === 3) {
    for (const [ex, ey] of [[-r * 0.32, r * 0.05], [r * 0.32, r * 0.05]]) {
      ctx.beginPath();
      ctx.arc(ex, ey, r * 0.06 * eyePulse, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;
  ctx.restore();

  // Trailing wisps emerging below
  for (let i = 0; i < 5; i++) {
    const wp = ((e.t * 0.6 + i * 0.2) % 1);
    const wx = Math.sin(e.t * 0.8 + i * 1.1) * r * 0.5;
    const wy = r * 0.55 + wp * r * 0.9 + wob;
    ctx.fillStyle = `rgba(170,80,255,${0.55 * (1 - wp)})`;
    ctx.beginPath();
    ctx.arc(wx, wy, r * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---- CHAPTER 1 REDESIGN ENEMIES --------------------------------------------
// Six bespoke chapter-1 enemies. Each gets its own silhouette — no palette
// swaps of wolf/wraith/bat. Tier 1 reads "stray young animal", tier 2 reads
// "pre-boss menace". Wraith variants get sleep-on-hit, beast variants get
// might-core drops.

const WOLFLING_PALETTE = {
  body: '#7a6c5e', under: '#3a3028', ear: '#8a7a6a',
  eye: '#7adaff', eyeGlow: '#cfeaff', fang: '#ffffff', nose: '#1a0d0d',
};

// Variant used in Cal's rescue — gaunter, darker, hungry blood-red eyes so the
// "big ones — starving" line in his dialog has visual weight.
const STARVING_WOLFLING_PALETTE = {
  body: '#5a4838', under: '#2a1a10', ear: '#6a5040',
  eye: '#ff5a5a', eyeGlow: '#ffaaaa', fang: '#f0e4c8', nose: '#0a0404',
};

function drawWolfling(ctx, e) {
  const r = e.radius;
  const p = e.palette || WOLFLING_PALETTE;
  const breath = Math.sin(e.t * 2.6) * 1.4;
  const earTwitch = Math.sin(e.t * 5.3) * 0.18;
  const tailWag = Math.sin(e.t * 3.4) * 0.35;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.78, r * 0.88, r * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();

  // Skinny hind leg
  ctx.fillStyle = p.under;
  ctx.fillRect(-r * 0.7, r * 0.42, r * 0.13, r * 0.42);
  ctx.fillStyle = p.nose;
  ctx.fillRect(-r * 0.72, r * 0.78, r * 0.17, r * 0.06);

  // Tail — thin, wags side-to-side
  ctx.save();
  ctx.translate(-r * 0.7, r * 0.05);
  ctx.rotate(-0.55 + tailWag);
  ctx.fillStyle = p.body;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-r * 0.25, -r * 0.18, -r * 0.45, -r * 0.32);
  ctx.lineTo(-r * 0.48, -r * 0.18);
  ctx.quadraticCurveTo(-r * 0.2, -r * 0.05, 0, r * 0.08);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Body — lean, slightly tapered
  const bodyGrad = ctx.createLinearGradient(0, -r * 0.3, 0, r * 0.45);
  bodyGrad.addColorStop(0, p.body);
  bodyGrad.addColorStop(1, p.under);
  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = '#1a1208';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, breath * 0.4, r * 0.78, r * 0.48, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  // Visible ribs — young, underfed
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 1;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.arc(i * r * 0.18, breath * 0.4 + r * 0.05, r * 0.22, 0.4, Math.PI - 0.4);
    ctx.stroke();
  }

  // Front leg
  ctx.fillStyle = p.under;
  ctx.fillRect(r * 0.22, r * 0.4, r * 0.13, r * 0.44);
  ctx.fillStyle = p.nose;
  ctx.fillRect(r * 0.2, r * 0.78, r * 0.17, r * 0.06);

  // Head — small, rounded
  ctx.fillStyle = p.body;
  ctx.strokeStyle = '#1a1208';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(r * 0.55, -r * 0.2, r * 0.4, r * 0.34, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  // Short snout
  ctx.fillStyle = p.body;
  ctx.beginPath();
  ctx.moveTo(r * 0.8, -r * 0.05);
  ctx.lineTo(r * 0.98, -r * 0.02);
  ctx.lineTo(r * 0.95, r * 0.1);
  ctx.lineTo(r * 0.78, r * 0.08);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  // Nose
  ctx.fillStyle = p.nose;
  ctx.beginPath();
  ctx.arc(r * 0.96, 0, r * 0.045, 0, Math.PI * 2);
  ctx.fill();

  // Oversized ears — twitch, with pink inner
  for (const side of [0, 1]) {
    const baseX = r * (0.42 + side * 0.32);
    ctx.save();
    ctx.translate(baseX, -r * 0.4);
    ctx.rotate(earTwitch + (side ? 0.15 : -0.15));
    ctx.fillStyle = p.ear;
    ctx.strokeStyle = '#1a1208';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-r * 0.08, 0);
    ctx.lineTo(0, -r * 0.55);
    ctx.lineTo(r * 0.1, 0);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c89aaa';
    ctx.beginPath();
    ctx.moveTo(-r * 0.04, -r * 0.05);
    ctx.lineTo(0, -r * 0.42);
    ctx.lineTo(r * 0.05, -r * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Big round innocent blue eye — round pupil, not slit
  ctx.fillStyle = p.eye;
  ctx.shadowColor = p.eyeGlow; ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(r * 0.65, -r * 0.26, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Round black pupil
  ctx.fillStyle = '#0a0a18';
  ctx.beginPath();
  ctx.arc(r * 0.66, -r * 0.25, r * 0.045, 0, Math.PI * 2);
  ctx.fill();
  // Catchlight — sells the "young/innocent" read
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(r * 0.64, -r * 0.28, r * 0.022, 0, Math.PI * 2);
  ctx.fill();

  // Two small fangs, barely peeking
  ctx.fillStyle = p.fang;
  ctx.beginPath();
  ctx.moveTo(r * 0.83, r * 0.06);
  ctx.lineTo(r * 0.85, r * 0.12);
  ctx.lineTo(r * 0.87, r * 0.06);
  ctx.closePath();
  ctx.moveTo(r * 0.9, r * 0.06);
  ctx.lineTo(r * 0.92, r * 0.12);
  ctx.lineTo(r * 0.94, r * 0.06);
  ctx.closePath();
  ctx.fill();
}

// ---- BRAMBLE PUP ------------------------------------------------------------

const BRAMBLEPUP_PALETTE = {
  body: '#4a3a2a', under: '#2a1f18', bristle: '#6a3a7a',
  bristleTip: '#5aff8a', eye: '#ff6abf', eyeGlow: '#ff8acf',
  vine: '#3a6a3a', mist: 'rgba(170,80,200,',
};

function drawBramblePup(ctx, e) {
  const r = e.radius;
  const p = e.palette || BRAMBLEPUP_PALETTE;
  const breath = Math.sin(e.t * 2.8) * 1.2;
  const mistPulse = 0.5 + 0.5 * Math.sin(e.t * 1.7);

  // Violet mist halo
  ctx.save();
  const halo = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.6);
  halo.addColorStop(0, p.mist + (0.35 + 0.15 * mistPulse) + ')');
  halo.addColorStop(1, p.mist + '0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Shadow
  ctx.fillStyle = 'rgba(20,5,30,0.4)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.78, r * 0.82, r * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hind leg with vine wrap
  ctx.fillStyle = p.under;
  ctx.fillRect(-r * 0.6, r * 0.42, r * 0.14, r * 0.4);
  ctx.strokeStyle = p.vine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.62, r * 0.46);
  ctx.quadraticCurveTo(-r * 0.5, r * 0.55, -r * 0.46, r * 0.65);
  ctx.quadraticCurveTo(-r * 0.6, r * 0.7, -r * 0.5, r * 0.8);
  ctx.stroke();

  // Body — squat pup shape
  const bodyGrad = ctx.createLinearGradient(0, -r * 0.3, 0, r * 0.5);
  bodyGrad.addColorStop(0, p.body);
  bodyGrad.addColorStop(1, p.under);
  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = '#1a0a0a';
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.ellipse(0, breath * 0.4, r * 0.78, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  // Spine bristles — rot-bristles down the back
  for (let i = -3; i <= 3; i++) {
    const bx = i * r * 0.18;
    const bh = r * (0.35 + 0.08 * Math.sin(e.t * 2 + i));
    ctx.fillStyle = p.bristle;
    ctx.strokeStyle = p.bristleTip;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bx - r * 0.05, -r * 0.35);
    ctx.lineTo(bx, -r * 0.35 - bh);
    ctx.lineTo(bx + r * 0.05, -r * 0.35);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // glowing tip
    ctx.fillStyle = p.bristleTip;
    ctx.shadowColor = p.bristleTip;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(bx, -r * 0.35 - bh, r * 0.02, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Front leg with vine wrap
  ctx.fillStyle = p.under;
  ctx.fillRect(r * 0.2, r * 0.42, r * 0.14, r * 0.4);
  ctx.strokeStyle = p.vine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(r * 0.22, r * 0.46);
  ctx.quadraticCurveTo(r * 0.34, r * 0.55, r * 0.3, r * 0.65);
  ctx.quadraticCurveTo(r * 0.2, r * 0.7, r * 0.3, r * 0.8);
  ctx.stroke();

  // Head — small with rot-vine wreath
  ctx.fillStyle = p.body;
  ctx.strokeStyle = '#1a0a0a';
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.ellipse(r * 0.52, -r * 0.18, r * 0.4, r * 0.36, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  // Vine wrap around head
  ctx.strokeStyle = p.vine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(r * 0.18, -r * 0.32);
  ctx.quadraticCurveTo(r * 0.5, -r * 0.5, r * 0.85, -r * 0.28);
  ctx.stroke();
  // Tiny leaves on the vine
  ctx.fillStyle = p.bristleTip;
  ctx.beginPath();
  ctx.ellipse(r * 0.35, -r * 0.45, r * 0.06, r * 0.025, -0.4, 0, Math.PI * 2);
  ctx.ellipse(r * 0.62, -r * 0.48, r * 0.06, r * 0.025, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Snout
  ctx.fillStyle = p.body;
  ctx.beginPath();
  ctx.moveTo(r * 0.8, -r * 0.05);
  ctx.lineTo(r * 0.98, -r * 0.02);
  ctx.lineTo(r * 0.95, r * 0.14);
  ctx.lineTo(r * 0.78, r * 0.12);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Glowing pink-rot pit eyes
  ctx.fillStyle = p.eye;
  ctx.shadowColor = p.eyeGlow;
  ctx.shadowBlur = 10 + mistPulse * 4;
  ctx.beginPath();
  ctx.arc(r * 0.45, -r * 0.24, r * 0.08, 0, Math.PI * 2);
  ctx.arc(r * 0.7, -r * 0.22, r * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Pit-eye black centers
  ctx.fillStyle = '#1a0010';
  ctx.beginPath();
  ctx.arc(r * 0.46, -r * 0.22, r * 0.035, 0, Math.PI * 2);
  ctx.arc(r * 0.71, -r * 0.2, r * 0.035, 0, Math.PI * 2);
  ctx.fill();

  // Sickly fangs
  ctx.fillStyle = p.bristleTip;
  ctx.beginPath();
  ctx.moveTo(r * 0.82, r * 0.1);
  ctx.lineTo(r * 0.85, r * 0.2);
  ctx.lineTo(r * 0.88, r * 0.1);
  ctx.closePath();
  ctx.moveTo(r * 0.91, r * 0.1);
  ctx.lineTo(r * 0.94, r * 0.18);
  ctx.lineTo(r * 0.96, r * 0.1);
  ctx.closePath();
  ctx.fill();

  // Floating violet mist motes
  for (let i = 0; i < 4; i++) {
    const phase = ((e.t * 0.4 + i * 0.25) % 1);
    const mx = -r * 0.6 + i * r * 0.4 + Math.sin(e.t + i) * r * 0.15;
    const my = r * 0.2 - phase * r * 1.2;
    ctx.fillStyle = `rgba(170,80,200,${0.55 * (1 - phase)})`;
    ctx.beginPath();
    ctx.arc(mx, my, r * 0.04, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---- CORRUPTED OTTER --------------------------------------------------------

const CORRUPTOTTER_PALETTE = {
  body: '#3a4a6a', under: '#5a7a9a', belly: '#a8c8d8',
  glow: '#3affff', glowSoft: 'rgba(58,255,255,',
  eye: '#cfeaff', eyeGlow: '#9adfff', whisker: '#cdd8e0', nose: '#0a0a10',
};

function drawCorruptedOtter(ctx, e) {
  const r = e.radius;
  const p = e.palette || CORRUPTOTTER_PALETTE;
  const breath = Math.sin(e.t * 2.3) * 1.5;
  const sway = Math.sin(e.t * 1.8) * 0.2;
  const dripPulse = (e.t * 0.6) % 1;

  // Cyan glow aura
  ctx.save();
  const halo = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 1.8);
  halo.addColorStop(0, p.glowSoft + '0.35)');
  halo.addColorStop(1, p.glowSoft + '0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Shadow
  ctx.fillStyle = 'rgba(0,10,30,0.4)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.78, r * 1.0, r * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sinuous body — elongated S-curve
  ctx.save();
  ctx.rotate(sway * 0.15);
  const bodyGrad = ctx.createLinearGradient(0, -r * 0.3, 0, r * 0.45);
  bodyGrad.addColorStop(0, p.body);
  bodyGrad.addColorStop(0.6, p.under);
  bodyGrad.addColorStop(1, p.belly);
  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = '#0a1020';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-r * 0.9, r * 0.1 + breath * 0.3);
  ctx.bezierCurveTo(-r * 0.7, -r * 0.4 + breath, r * 0.3, -r * 0.45 + breath, r * 0.5, -r * 0.2);
  ctx.bezierCurveTo(r * 0.8, 0, r * 0.85, r * 0.25, r * 0.55, r * 0.4);
  ctx.bezierCurveTo(r * 0.1, r * 0.5, -r * 0.5, r * 0.45, -r * 0.9, r * 0.1 + breath * 0.3);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();

  // Cyan corruption glow line along spine
  ctx.save();
  ctx.strokeStyle = p.glow;
  ctx.shadowColor = p.glow;
  ctx.shadowBlur = 8;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.8, r * 0.05);
  ctx.bezierCurveTo(-r * 0.5, -r * 0.3, r * 0.1, -r * 0.35, r * 0.45, -r * 0.15);
  ctx.stroke();
  ctx.shadowBlur = 0;
  // Spine glow nodes
  ctx.fillStyle = p.glow;
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const nx = -r * 0.8 + t * r * 1.25;
    const ny = -r * 0.05 - Math.sin(t * Math.PI) * r * 0.28;
    const pulse = 0.6 + 0.4 * Math.sin(e.t * 2 + i);
    ctx.shadowColor = p.glow;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(nx, ny, r * 0.04 * pulse, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.restore();

  // Tail — long & fluid, drifts behind
  ctx.save();
  ctx.translate(-r * 0.85, r * 0.1);
  ctx.rotate(-0.2 + sway);
  ctx.fillStyle = p.body;
  ctx.strokeStyle = '#0a1020';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-r * 0.4, -r * 0.05, -r * 0.7, r * 0.15);
  ctx.quadraticCurveTo(-r * 0.4, r * 0.18, 0, r * 0.12);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  // Tail tip glow
  ctx.fillStyle = p.glow;
  ctx.shadowColor = p.glow; ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(-r * 0.7, r * 0.15, r * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Head — rounded otter face
  ctx.fillStyle = p.body;
  ctx.strokeStyle = '#0a1020';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(r * 0.5, -r * 0.25, r * 0.34, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  // Snout / muzzle
  ctx.fillStyle = p.belly;
  ctx.beginPath();
  ctx.ellipse(r * 0.72, -r * 0.12, r * 0.16, r * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0a1020';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Nose
  ctx.fillStyle = p.nose;
  ctx.beginPath();
  ctx.arc(r * 0.82, -r * 0.18, r * 0.04, 0, Math.PI * 2);
  ctx.fill();

  // Round ears (small)
  ctx.fillStyle = p.body;
  ctx.beginPath();
  ctx.arc(r * 0.38, -r * 0.5, r * 0.07, 0, Math.PI * 2);
  ctx.arc(r * 0.62, -r * 0.5, r * 0.07, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  // Sad, downturned luminous eyes
  ctx.fillStyle = p.eye;
  ctx.shadowColor = p.eyeGlow; ctx.shadowBlur = 7;
  ctx.beginPath();
  ctx.ellipse(r * 0.4, -r * 0.27, r * 0.07, r * 0.06, 0.4, 0, Math.PI * 2);
  ctx.ellipse(r * 0.6, -r * 0.27, r * 0.07, r * 0.06, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Pupils — round, soft (bittersweet, not menacing)
  ctx.fillStyle = '#0a1830';
  ctx.beginPath();
  ctx.arc(r * 0.4, -r * 0.26, r * 0.028, 0, Math.PI * 2);
  ctx.arc(r * 0.6, -r * 0.26, r * 0.028, 0, Math.PI * 2);
  ctx.fill();
  // Catchlights
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(r * 0.39, -r * 0.28, r * 0.015, 0, Math.PI * 2);
  ctx.arc(r * 0.59, -r * 0.28, r * 0.015, 0, Math.PI * 2);
  ctx.fill();
  // Sad brow arches
  ctx.strokeStyle = '#0a1020';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(r * 0.32, -r * 0.37);
  ctx.quadraticCurveTo(r * 0.4, -r * 0.34, r * 0.46, -r * 0.36);
  ctx.moveTo(r * 0.54, -r * 0.36);
  ctx.quadraticCurveTo(r * 0.6, -r * 0.34, r * 0.68, -r * 0.37);
  ctx.stroke();

  // Whiskers — drifting
  ctx.strokeStyle = p.whisker;
  ctx.lineWidth = 0.8;
  for (let i = -1; i <= 1; i++) {
    const wy = -r * 0.14 + i * r * 0.04;
    const drift = Math.sin(e.t * 1.5 + i) * r * 0.02;
    ctx.beginPath();
    ctx.moveTo(r * 0.78, wy);
    ctx.quadraticCurveTo(r * 0.95, wy + drift, r * 1.05, wy + drift * 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r * 0.62, wy + r * 0.02);
    ctx.quadraticCurveTo(r * 0.45, wy + drift + r * 0.04, r * 0.32, wy + drift + r * 0.06);
    ctx.stroke();
  }

  // Dripping cyan aether droplets
  for (let i = 0; i < 3; i++) {
    const phase = ((dripPulse + i * 0.33) % 1);
    const dx = -r * 0.3 + i * r * 0.3;
    const dy = r * 0.4 + phase * r * 0.5;
    ctx.fillStyle = `rgba(58,255,255,${0.85 * (1 - phase)})`;
    ctx.shadowColor = p.glow; ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.ellipse(dx, dy, r * 0.03, r * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// ---- WRAITH WISP ------------------------------------------------------------

const WISP_PALETTE = {
  body: '#9a5cff', shade: '#3a1a6a', glow: 'rgba(170,120,255,',
  eye: '#ffffff', eyeGlow: '#cfaaff', skull: '#d8c4ff', tail: '#5a2a8a',
};

function drawWraithWisp(ctx, e) {
  const r = e.radius;
  const p = e.palette || WISP_PALETTE;
  const float = Math.sin(e.t * 2.4) * 5;
  const pulse = 0.5 + 0.5 * Math.sin(e.t * 3.2);
  const blink = (Math.sin(e.t * 1.3) > 0.95) ? 0.2 : 1;

  // Outer glow aura
  ctx.save();
  const g = ctx.createRadialGradient(0, float, 0, 0, float, r * 1.8);
  g.addColorStop(0, p.glow + (0.45 + 0.15 * pulse) + ')');
  g.addColorStop(1, p.glow + '0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, float, r * 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Wispy tail — trails downward into nothing
  ctx.save();
  const tailGrad = ctx.createLinearGradient(0, float, 0, r * 1.4 + float);
  tailGrad.addColorStop(0, p.tail);
  tailGrad.addColorStop(1, 'rgba(90,42,138,0)');
  ctx.fillStyle = tailGrad;
  ctx.beginPath();
  const swirl = Math.sin(e.t * 1.5) * r * 0.15;
  ctx.moveTo(-r * 0.3, r * 0.3 + float);
  ctx.bezierCurveTo(-r * 0.4 + swirl, r * 0.7 + float, -r * 0.2 - swirl, r * 1.0 + float, swirl * 0.5, r * 1.4 + float);
  ctx.bezierCurveTo(r * 0.2 + swirl, r * 1.0 + float, r * 0.4 - swirl, r * 0.7 + float, r * 0.3, r * 0.3 + float);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Body — softer, smaller wraith
  const bodyGrad = ctx.createLinearGradient(0, -r * 0.7 + float, 0, r * 0.4 + float);
  bodyGrad.addColorStop(0, p.body);
  bodyGrad.addColorStop(1, p.shade);
  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = p.shade;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.7 + float);
  ctx.bezierCurveTo(r * 0.85, -r * 0.3 + float, r * 0.7, r * 0.3 + float, r * 0.3, r * 0.4 + float);
  ctx.lineTo(-r * 0.3, r * 0.4 + float);
  ctx.bezierCurveTo(-r * 0.7, r * 0.3 + float, -r * 0.85, -r * 0.3 + float, 0, -r * 0.7 + float);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Faint inner skull hint
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = p.skull;
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.2 + float, r * 0.32, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  // Tiny nasal cavity
  ctx.fillStyle = p.shade;
  ctx.beginPath();
  ctx.moveTo(-r * 0.04, -r * 0.1 + float);
  ctx.lineTo(r * 0.04, -r * 0.1 + float);
  ctx.lineTo(0, r * 0.0 + float);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Two big staring eyes — round, white, dominant. Multiply blink against
  // caller alpha so the death fade still applies.
  const wispBaseAlpha = ctx.globalAlpha;
  ctx.fillStyle = p.eye;
  ctx.shadowColor = p.eyeGlow;
  ctx.shadowBlur = 10 + pulse * 4;
  ctx.globalAlpha = wispBaseAlpha * blink;
  ctx.beginPath();
  ctx.ellipse(-r * 0.18, -r * 0.22 + float, r * 0.12, r * 0.14, 0, 0, Math.PI * 2);
  ctx.ellipse(r * 0.18, -r * 0.22 + float, r * 0.12, r * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = wispBaseAlpha;
  ctx.shadowBlur = 0;

  // Tiny dark pupils — the staring intensity
  ctx.fillStyle = '#1a0033';
  ctx.beginPath();
  ctx.arc(-r * 0.16, -r * 0.2 + float, r * 0.03, 0, Math.PI * 2);
  ctx.arc(r * 0.2, -r * 0.2 + float, r * 0.03, 0, Math.PI * 2);
  ctx.fill();
}

// ---- ALPHA SCOUT ------------------------------------------------------------

const ALPHASCOUT_PALETTE = {
  body: '#4a3024', under: '#1a0d08', mane: '#9a2010',
  eye: '#ffb43a', eyeGlow: '#ffc46a', fang: '#fff8e0',
  claw: '#0a0408', scar: '#d4b896', stitch: '#2a1008',
};

function drawAlphaScout(ctx, e) {
  const r = e.radius;
  const p = e.palette || ALPHASCOUT_PALETTE;
  const breath = Math.sin(e.t * 2.8) * 1.3;
  const tailLash = Math.sin(e.t * 3.5) * 0.35;
  const eyeFlare = 0.85 + 0.15 * Math.sin(e.t * 4);

  // Heavy shadow — bigger beast
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.82, r * 1.1, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hind legs — muscular
  ctx.fillStyle = p.body;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(-r * 0.7, r * 0.55, r * 0.13, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  // Claws on hind
  ctx.fillStyle = p.claw;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.75 + i * r * 0.06, r * 0.82);
    ctx.lineTo(-r * 0.74 + i * r * 0.06, r * 0.94);
    ctx.lineTo(-r * 0.71 + i * r * 0.06, r * 0.82);
    ctx.closePath();
    ctx.fill();
  }

  // Tail — bigger, lashing
  ctx.save();
  ctx.translate(-r * 0.92, -r * 0.05);
  ctx.rotate(-0.3 + tailLash);
  const tailGrad = ctx.createLinearGradient(0, 0, -r * 0.6, -r * 0.5);
  tailGrad.addColorStop(0, p.body);
  tailGrad.addColorStop(1, p.mane);
  ctx.fillStyle = tailGrad;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-r * 0.4, -r * 0.35, -r * 0.65, -r * 0.55);
  ctx.lineTo(-r * 0.72, -r * 0.32);
  ctx.quadraticCurveTo(-r * 0.35, -r * 0.1, 0, r * 0.12);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  // Red tail tip
  ctx.fillStyle = p.mane;
  ctx.beginPath();
  ctx.arc(-r * 0.65, -r * 0.5, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Body — bigger, broader
  const bodyGrad = ctx.createLinearGradient(0, -r * 0.4, 0, r * 0.55);
  bodyGrad.addColorStop(0, p.body);
  bodyGrad.addColorStop(0.6, p.body);
  bodyGrad.addColorStop(1, p.under);
  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(0, breath * 0.4, r * 1.0, r * 0.62, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  // Deep red mane — bigger, more pronounced
  ctx.fillStyle = p.mane;
  ctx.strokeStyle = '#3a0808';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-r * 0.7, -r * 0.42);
  for (let i = 0; i <= 10; i++) {
    const x = -r * 0.7 + (i / 10) * r * 1.15;
    const yOff = (i % 2 === 0) ? -r * 0.7 : -r * 0.52;
    ctx.lineTo(x, yOff);
  }
  ctx.lineTo(r * 0.45, -r * 0.3);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  // Mane sheen
  ctx.strokeStyle = '#ff6a3a';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, -r * 0.55);
  ctx.lineTo(r * 0.3, -r * 0.45);
  ctx.stroke();

  // Front legs
  ctx.fillStyle = p.body;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(r * 0.32, r * 0.55, r * 0.13, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  // Front claws
  ctx.fillStyle = p.claw;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(r * 0.28 + i * r * 0.06, r * 0.82);
    ctx.lineTo(r * 0.29 + i * r * 0.06, r * 0.96);
    ctx.lineTo(r * 0.32 + i * r * 0.06, r * 0.82);
    ctx.closePath();
    ctx.fill();
  }

  // Head — bigger, meaner
  ctx.fillStyle = p.body;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(r * 0.65, -r * 0.22, r * 0.5, r * 0.4, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  // Snout — broader, stronger
  ctx.fillStyle = p.body;
  ctx.beginPath();
  ctx.moveTo(r * 0.9, -r * 0.05);
  ctx.lineTo(r * 1.18, -r * 0.02);
  ctx.lineTo(r * 1.15, r * 0.15);
  ctx.lineTo(r * 0.86, r * 0.13);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  // Nose
  ctx.fillStyle = '#0a0408';
  ctx.beginPath();
  ctx.arc(r * 1.13, -r * 0.0, r * 0.06, 0, Math.PI * 2);
  ctx.fill();

  // SCAR — diagonal across snout with stitches
  ctx.strokeStyle = p.scar;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(r * 0.55, -r * 0.4);
  ctx.lineTo(r * 1.0, r * 0.05);
  ctx.stroke();
  // Stitches across the scar
  ctx.strokeStyle = p.stitch;
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const sx = r * 0.55 + t * r * 0.45;
    const sy = -r * 0.4 + t * r * 0.45;
    ctx.beginPath();
    ctx.moveTo(sx - r * 0.05, sy - r * 0.04);
    ctx.lineTo(sx + r * 0.05, sy + r * 0.04);
    ctx.stroke();
  }

  // Four bared fangs in a snarl
  ctx.fillStyle = p.fang;
  ctx.strokeStyle = '#3a1010';
  ctx.lineWidth = 0.8;
  const drawFang = (x, w, h) => {
    ctx.beginPath();
    ctx.moveTo(x - w, r * 0.06);
    ctx.lineTo(x, r * 0.06 + h);
    ctx.lineTo(x + w, r * 0.06);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  };
  drawFang(r * 0.92, r * 0.025, r * 0.18);
  drawFang(r * 0.99, r * 0.022, r * 0.15);
  drawFang(r * 1.06, r * 0.022, r * 0.15);
  drawFang(r * 1.12, r * 0.025, r * 0.18);

  // Ears — torn (notched)
  ctx.fillStyle = p.body;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(r * 0.55, -r * 0.5);
  ctx.lineTo(r * 0.38, -r * 0.92);
  ctx.lineTo(r * 0.5, -r * 0.78);
  ctx.lineTo(r * 0.58, -r * 0.88);
  ctx.lineTo(r * 0.72, -r * 0.6);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(r * 0.78, -r * 0.5);
  ctx.lineTo(r * 0.85, -r * 0.88);
  ctx.lineTo(r * 0.9, -r * 0.7);
  ctx.lineTo(r * 1.0, -r * 0.5);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Amber slit-pupil eye — predatory
  ctx.fillStyle = p.eye;
  ctx.shadowColor = p.eyeGlow;
  ctx.shadowBlur = 10 + eyeFlare * 4;
  ctx.beginPath();
  ctx.arc(r * 0.78, -r * 0.3, r * 0.07 * eyeFlare, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Vertical slit pupil
  ctx.fillStyle = '#0a0408';
  ctx.beginPath();
  ctx.ellipse(r * 0.78, -r * 0.3, r * 0.012, r * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
  // Brow furrow
  ctx.strokeStyle = '#0a0408';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(r * 0.62, -r * 0.45);
  ctx.lineTo(r * 0.85, -r * 0.36);
  ctx.stroke();
}

// ---- WRAITH ECHO ------------------------------------------------------------

const WRAITHECHO_PALETTE = {
  body: '#4a1a8a', shade: '#1a0033', glow: 'rgba(120,60,220,',
  eye: '#e8caff', eyeGlow: '#caa6ff', ribbon: '#3a1070',
  inner: 'rgba(232,202,255,', crown: '#caa6ff',
};

function drawWraithEcho(ctx, e) {
  const r = e.radius;
  const p = e.palette || WRAITHECHO_PALETTE;
  const float = Math.sin(e.t * 2.0) * 6;
  const pulse = 0.5 + 0.5 * Math.sin(e.t * 2.8);

  // Deep violet glow aura
  ctx.save();
  const g = ctx.createRadialGradient(0, float, 0, 0, float, r * 2.1);
  g.addColorStop(0, p.glow + (0.55 + 0.2 * pulse) + ')');
  g.addColorStop(0.6, p.glow + '0.2)');
  g.addColorStop(1, p.glow + '0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, float, r * 2.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Three trailing ribbons behind
  for (let i = 0; i < 3; i++) {
    ctx.save();
    const ribbonPhase = e.t * 0.8 + i * 1.2;
    const rx = Math.sin(ribbonPhase) * r * 0.5;
    const offsetY = float + r * 0.4 + i * r * 0.15;
    ctx.fillStyle = p.ribbon;
    ctx.globalAlpha = 0.55 - i * 0.12;
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, offsetY);
    ctx.bezierCurveTo(rx - r * 0.3, offsetY + r * 0.3, rx + r * 0.3, offsetY + r * 0.55, rx, offsetY + r * 0.9);
    ctx.bezierCurveTo(rx + r * 0.3, offsetY + r * 0.55, rx - r * 0.3, offsetY + r * 0.3, r * 0.4, offsetY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Main wraith body — bigger
  const bodyGrad = ctx.createLinearGradient(0, -r + float, 0, r * 0.5 + float);
  bodyGrad.addColorStop(0, p.body);
  bodyGrad.addColorStop(1, p.shade);
  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = p.shade;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, -r + float);
  ctx.bezierCurveTo(r * 1.2, -r * 0.5 + float, r * 1.0, r * 0.4 + float, r * 0.5, r * 0.6 + float);
  // Frayed bottom
  ctx.lineTo(r * 0.32, r * 0.45 + float);
  ctx.lineTo(r * 0.15, r * 0.7 + float);
  ctx.lineTo(0, r * 0.5 + float);
  ctx.lineTo(-r * 0.15, r * 0.7 + float);
  ctx.lineTo(-r * 0.32, r * 0.45 + float);
  ctx.lineTo(-r * 0.5, r * 0.6 + float);
  ctx.bezierCurveTo(-r * 1.0, r * 0.4 + float, -r * 1.2, -r * 0.5 + float, 0, -r + float);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // INNER Hollow-Warden silhouette — jagged crown + many eyes hint
  ctx.save();
  ctx.globalAlpha = 0.35;
  // Crown spike silhouette
  ctx.fillStyle = p.crown;
  ctx.beginPath();
  ctx.moveTo(-r * 0.32, -r * 0.3 + float);
  ctx.lineTo(-r * 0.25, -r * 0.55 + float);
  ctx.lineTo(-r * 0.15, -r * 0.35 + float);
  ctx.lineTo(-r * 0.05, -r * 0.62 + float);
  ctx.lineTo(r * 0.05, -r * 0.35 + float);
  ctx.lineTo(r * 0.15, -r * 0.62 + float);
  ctx.lineTo(r * 0.25, -r * 0.35 + float);
  ctx.lineTo(r * 0.32, -r * 0.55 + float);
  ctx.lineTo(r * 0.38, -r * 0.3 + float);
  ctx.lineTo(r * 0.38, -r * 0.15 + float);
  ctx.lineTo(-r * 0.38, -r * 0.15 + float);
  ctx.closePath();
  ctx.fill();
  // Many tiny silhouette eyes
  ctx.fillStyle = p.shade;
  for (let i = 0; i < 6; i++) {
    const ix = -r * 0.25 + (i % 3) * r * 0.18;
    const iy = -r * 0.25 + Math.floor(i / 3) * r * 0.08 + float;
    ctx.beginPath();
    ctx.arc(ix, iy, r * 0.022, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Four orbiting eye-lights
  for (let i = 0; i < 4; i++) {
    const ang = e.t * 1.2 + i * (Math.PI / 2);
    const ox = Math.cos(ang) * r * 0.55;
    const oy = Math.sin(ang) * r * 0.32 - r * 0.1 + float;
    const eyePulse = 0.7 + 0.3 * Math.sin(e.t * 3 + i);
    ctx.fillStyle = p.eye;
    ctx.shadowColor = p.eyeGlow;
    ctx.shadowBlur = 12 + eyePulse * 5;
    ctx.beginPath();
    ctx.arc(ox, oy, r * 0.075 * eyePulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Tiny dark center
    ctx.fillStyle = '#1a0033';
    ctx.beginPath();
    ctx.arc(ox, oy, r * 0.025, 0, Math.PI * 2);
    ctx.fill();
  }

  // Trailing motes
  for (let i = 0; i < 6; i++) {
    const phase = ((e.t * 0.5 + i * 0.18) % 1);
    const mx = Math.sin(e.t * 0.7 + i * 1.3) * r * 0.7;
    const my = -r * 0.3 + phase * r * 1.4 + float;
    ctx.fillStyle = `rgba(202,166,255,${0.6 * (1 - phase)})`;
    ctx.beginPath();
    ctx.arc(mx, my, r * 0.04, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---- ENEMY TEMPLATES --------------------------------------------------------

export const ENEMIES = [
  // ----- TIER 1 (meadow) --------------------------------------------------
  {
    id: 'slime', name: 'Slime', tier: 1, level: 1,
    maxHp: 22, atk: 6, def: 2, spd: 4,
    xp: 10, gold: 5,
    drops: [{ kind: 'consumable', id: 'potion', chance: 0.18 }],
    radius: 28, color: SLIME_PALETTE.body, palette: SLIME_PALETTE,
    // Watery body — conducts current; fire just steams off it.
    weak: ['thunder'], resist: ['fire'],
    draw: drawSlime,
  },
  {
    id: 'bat', name: 'Bat', tier: 1, level: 2,
    maxHp: 16, atk: 8, def: 1, spd: 9,
    xp: 12, gold: 5,
    drops: [{ kind: 'consumable', id: 'ether', chance: 0.1 }],
    radius: 22, color: BAT_PALETTE.body, palette: BAT_PALETTE,
    // Small flying creature — lightning catches them in mid-air.
    weak: ['thunder'],
    draw: drawBat,
  },
  {
    id: 'wolf', name: 'Wolf', tier: 1, level: 3,
    maxHp: 38, atk: 11, def: 4, spd: 7,
    xp: 22, gold: 10,
    drops: [
      { kind: 'consumable', id: 'potion', chance: 0.25 },
      { kind: 'equipment', id: 'leatherArmor', chance: 0.05 },
      { kind: 'gem', id: 'mightCore', chance: 0.06 },
      { kind: 'gem', id: 'vigorStone', chance: 0.04 },
    ],
    radius: 32, color: WOLF_PALETTE.body, palette: WOLF_PALETTE,
    // Beasts shy from open flame.
    weak: ['fire'],
    draw: drawWolf,
  },
  {
    id: 'wolfling', name: 'Wolfling', tier: 1, level: 1,
    maxHp: 30, atk: 8, def: 2, mag: 0, spd: 8,
    xp: 10, gold: 5,
    drops: [
      { kind: 'consumable', id: 'potion', chance: 0.2 },
      { kind: 'gem', id: 'mightCore', chance: 0.08 },
    ],
    radius: 22, color: WOLFLING_PALETTE.body, palette: WOLFLING_PALETTE,
    // Young pup — thin coat singes easily, but a little tougher than a slime.
    resist: ['fire'],
    draw: drawWolfling,
  },
  {
    // Rescue-fight variant. Used in `meadow:rescueCal`. Bigger, hungrier,
    // bites harder — the dialog calls them out as "big ones, starving" so
    // the player should feel the difference. ~2.3x base HP, +25% ATK.
    id: 'starvingWolfling', name: 'Starving Wolfling', tier: 1, level: 2,
    maxHp: 175, atk: 10, def: 2, mag: 0, spd: 8,
    xp: 18, gold: 7,
    drops: [
      { kind: 'consumable', id: 'potion', chance: 0.30 },
      { kind: 'gem', id: 'mightCore', chance: 0.10 },
    ],
    radius: 24, color: STARVING_WOLFLING_PALETTE.body, palette: STARVING_WOLFLING_PALETTE,
    resist: ['fire'],
    draw: drawWolfling,
  },
  {
    id: 'bramblePup', name: 'Bramble Pup', tier: 1, level: 2,
    maxHp: 38, atk: 9, def: 3, mag: 5, spd: 7,
    xp: 14, gold: 4,
    drops: [
      { kind: 'consumable', id: 'potion', chance: 0.22 },
      { kind: 'gem', id: 'venomFang', chance: 0.06 },
    ],
    radius: 22, color: BRAMBLEPUP_PALETTE.body, palette: BRAMBLEPUP_PALETTE,
    // Rot-bristles ignite; the corruption IS nature — feeds it.
    weak: ['fire'], resist: ['nature'],
    attackStatus: { id: 'poison', chance: 0.25 },
    draw: drawBramblePup,
  },
  {
    id: 'corruptedOtter', name: 'Corrupted Otter', tier: 1, level: 3,
    maxHp: 42, atk: 10, def: 3, mag: 8, spd: 9,
    xp: 16, gold: 6,
    drops: [
      { kind: 'consumable', id: 'potion', chance: 0.22 },
      { kind: 'gem', id: 'wardStone', chance: 0.06 },
    ],
    radius: 24, color: CORRUPTOTTER_PALETTE.body, palette: CORRUPTOTTER_PALETTE,
    // Aether-soaked river-body — thunder arcs through it; water is its medium.
    weak: ['thunder'], resist: ['water'],
    draw: drawCorruptedOtter,
  },

  // ----- TIER 2 (cave / Echoing Hollow) ----------------------------------
  {
    id: 'bogSlime', name: 'Bog Slime', tier: 2, level: 4,
    maxHp: 44, atk: 10, def: 4, spd: 5,
    xp: 24, gold: 12,
    drops: [
      { kind: 'consumable', id: 'potion', chance: 0.3 },
      { kind: 'gem', id: 'vigorStone', chance: 0.05 },
    ],
    radius: 30, color: '#9a6ad8',
    palette: { body: '#9a6ad8', shade: '#3a1a5a', highlight: '#e8d4ff', eye: '#fff', drip: '#9a6ad8', fang: '#cffff0' },
    // Acidic water-body — conducts current; fire steams off; ice slows it.
    weak: ['thunder'], resist: ['fire', 'ice'],
    attackStatus: { id: 'poison', chance: 0.3 },
    draw: drawSlime,
  },
  {
    id: 'frostBat', name: 'Frost Bat', tier: 2, level: 5,
    maxHp: 32, atk: 12, def: 2, spd: 11,
    xp: 30, gold: 9,
    drops: [
      { kind: 'consumable', id: 'ether', chance: 0.18 },
      { kind: 'gem', id: 'tideShard', chance: 0.05 },
    ],
    radius: 24,
    color: '#7adaff', palette: { wing: '#7adaff', wingShade: '#2a4a7a', body: '#2a4a7a', eye: '#cfeaff', eyeGlow: '#dff2ff', fang: '#ffffff' },
    // Ice creature — fire melts it apart; ice does nothing at all.
    weak: ['fire'], immune: ['ice'],
    attackStatus: { id: 'freeze', chance: 0.25 },
    draw: drawBat,
  },
  {
    id: 'direWolf', name: 'Dire Wolf', tier: 2, level: 6,
    maxHp: 72, atk: 16, def: 5, spd: 9,
    xp: 42, gold: 20,
    drops: [
      { kind: 'consumable', id: 'hipotion', chance: 0.18 },
      { kind: 'equipment', id: 'leatherArmor', chance: 0.08 },
      { kind: 'gem', id: 'mightCore', chance: 0.1 },
      { kind: 'gem', id: 'wardStone', chance: 0.07 },
    ],
    radius: 34,
    color: '#2a2228', palette: { body: '#2a2228', under: '#0a0608', mane: '#1a0608', eye: '#ff3b6e', eyeGlow: '#ff3b6e', fang: '#ffffff', claw: '#000000' },
    // Hardened cave-beast — still fears flame.
    weak: ['fire'],
    draw: drawWolf,
  },
  {
    id: 'alphaScout', name: 'Alpha Scout', tier: 2, level: 4,
    maxHp: 70, atk: 13, def: 4, mag: 0, spd: 10,
    xp: 32, gold: 14,
    drops: [
      { kind: 'consumable', id: 'potion', chance: 1.0 },
      { kind: 'gem', id: 'mightCore', chance: 0.3 },
    ],
    radius: 30, color: ALPHASCOUT_PALETTE.body, palette: ALPHASCOUT_PALETTE,
    // Scarred pre-boss: thick pelt shrugs off ordinary flame, but no immunity.
    resist: ['fire'],
    draw: drawAlphaScout,
  },
  // ----- TIER 3 (Verdant Reach) ------------------------------------------
  {
    id: 'mossback', name: 'Mossback Treant', tier: 3, level: 9,
    maxHp: 181, atk: 25, def: 12, mag: 6, spd: 5,
    xp: 76, gold: 30,
    drops: [
      { kind: 'consumable', id: 'hipotion', chance: 0.22 },
      { kind: 'gem', id: 'vigorStone', chance: 0.06 },
      { kind: 'gem', id: 'brandOfCinders', chance: 0.05 },
    ],
    radius: 38, color: TREANT_PALETTE.bark, palette: TREANT_PALETTE,
    // Wooden body — flammable, deflects blades; nature is its own substance.
    weak: ['fire'], resist: ['phys'], immune: ['nature'],
    draw: drawTreant,
  },
  {
    id: 'brambleSprite', name: 'Bramble Sprite', tier: 3, level: 8,
    maxHp: 60, atk: 20, def: 4, spd: 14,
    xp: 60, gold: 19,
    drops: [
      { kind: 'consumable', id: 'ether', chance: 0.22 },
      { kind: 'gem', id: 'venomFang', chance: 0.07 },
    ],
    radius: 20, color: SPRITE_PALETTE.body, palette: SPRITE_PALETTE,
    // Living thorn — fire scorches it; nature spells feed it instead.
    weak: ['fire'], resist: ['nature'],
    attackStatus: { id: 'poison', chance: 0.4 },
    draw: drawSprite,
  },
  {
    id: 'witheredStag', name: 'Withered Stag', tier: 3, level: 9,
    maxHp: 146, atk: 24, def: 8, spd: 10,
    xp: 73, gold: 27,
    drops: [
      { kind: 'consumable', id: 'hipotion', chance: 0.18 },
      { kind: 'gem', id: 'brandOfCinders', chance: 0.06 },
      { kind: 'gem', id: 'stagShard', chance: 0.02 },
    ],
    radius: 34, color: WSTAG_PALETTE.body, palette: WSTAG_PALETTE,
    // Cinder-corrupted antler-beast — ice shocks it apart, dawn-light unmakes
    // its corruption; fire feeds it.
    weak: ['ice', 'holy'], resist: ['fire'],
    attackStatus: { id: 'burn', chance: 0.28 },
    draw: drawWitheredStag,
  },
  {
    id: 'choirmoth', name: 'Choirmoth', tier: 3, level: 8,
    maxHp: 94, atk: 19, def: 5, mag: 18, spd: 12,
    xp: 68, gold: 22,
    drops: [
      { kind: 'consumable', id: 'ether', chance: 0.25 },
      { kind: 'gem', id: 'sandmanBell', chance: 0.06 },
    ],
    radius: 26, color: MOTH_PALETTE.wing, palette: MOTH_PALETTE,
    // Wings are tinder; thunder catches it mid-air.
    weak: ['fire', 'thunder'],
    attackStatus: { id: 'sleep', chance: 0.3 },
    draw: drawChoirmoth,
  },

  // ----- MINI-BOSS (meadow gate) -----------------------------------------
  {
    id: 'packAlpha', name: 'Pack Alpha', tier: 2, level: 4, boss: true,
    maxHp: 110, atk: 14, def: 5, mag: 0, spd: 11,
    xp: 70, gold: 40,
    drops: [
      { kind: 'consumable', id: 'hipotion', chance: 1.0 },
      { kind: 'equipment', id: 'ironSword', chance: 1.0 },
      { kind: 'gem',       id: 'mightCore', chance: 0.5 },
    ],
    radius: 36,
    color: '#8a3a18',
    palette: { body: '#8a3a18', under: '#3a1808', mane: '#5a1a08', eye: '#ff5a20', eyeGlow: '#ff5a20', fang: '#ffffff', claw: '#1a0d04' },
    // Boss: no exploitable weakness — just a hard fight. Pelt is thick enough
    // that ordinary fire isn't a shortcut, but lightning carries through fur.
    resist: ['fire'],
    draw: drawWolf,
    ai(battle, self) {
      // ~30% Savage Bite (heavy), otherwise basic
      return Math.random() < 0.32 ? { kind: 'sunderedStrike' } : { kind: 'basic' };
    },
  },
  // ----- BOSS (Echoing Hollow) -------------------------------------------
  {
    id: 'hollowWarden', name: 'Hollow Warden', tier: 3, level: 7, boss: true,
    // HP weighted toward later phases so each phase feels incrementally
    // tougher — P1 ~25% (175), P2 ~35% (245), P3 ~40% (280). Total 700.
    // SPD bumped from 6 → 11 so the boss actually gets turns to use its
    // phase-locked attacks (Shard Volley, Rift Cataclysm).
    maxHp: 700, atk: 17, def: 6, mag: 15, spd: 11,
    // XP tuned so a Lv7 party going straight to the boss lands at Lv8 with
    // some leftover — not vaulting to Lv9. Each party member gets the full
    // amount (FF1-style), so 200 + a couple cave random encounters keeps
    // them in the right bracket for chapter 2.
    xp: 200, gold: 130,
    drops: [
      { kind: 'consumable', id: 'hipotion', chance: 1.0 },
      { kind: 'gem',        id: 'wardStone', chance: 1.0 },
      { kind: 'equipment',  id: 'silverRing', chance: 0.7 },
    ],
    radius: 48, color: WARDEN_PALETTE.shard, palette: WARDEN_PALETTE,
    // Rift-construct boss: jagged shards deflect blades, the Sundered itself
    // is dark — fire and ice land as normal but nothing is super-effective.
    resist: ['phys'], immune: ['dark'],
    draw: drawWarden,
    // Three phases — boundaries chosen so each phase has incrementally more
    // HP than the last:
    //   P1 (100→75%): Bound Form, ~25% of max HP. Mostly basic + Sundered.
    //   P2 (75→40%): Fractured Form, ~35% of max HP. Adds Shard Volley.
    //   P3 (40→0%):  Unbound Form, ~40% of max HP. Adds Rift Cataclysm.
    // Phase transitions return a `phaseTransition` action that battle.js plays
    // as a short cinematic (aura collapse + visual mutation + log dialog) and
    // burns the boss's turn — the player gets a free beat to set up.
    ai(battle, self) {
      const ratio = self.hp / self.maxHp;
      // Phase boundary detection — take priority over normal attack rolls so
      // the cutscene plays the first turn after the threshold is crossed.
      if (ratio <= 0.40 && !self._p3) {
        self._p3 = true;
        self._phase = 3;
        return { kind: 'phaseTransition', toPhase: 3 };
      }
      if (ratio <= 0.75 && !self._p2) {
        self._p2 = true;
        self._phase = 2;
        return { kind: 'phaseTransition', toPhase: 2 };
      }
      const roll = Math.random();
      if (self._p3) {
        // Unbound: heavy on Cataclysm + Shard Volley, less basic.
        if (roll < 0.30) return { kind: 'riftCataclysm' };
        if (roll < 0.60) return { kind: 'shardVolley' };
        if (roll < 0.85) return { kind: 'sunderedStrike' };
        return { kind: 'veilPulse' };
      }
      if (self._p2) {
        // Fractured: Shard Volley enters the rotation, Veil Pulse stronger.
        if (roll < 0.30) return { kind: 'shardVolley' };
        if (roll < 0.55) return { kind: 'veilPulse' };
        if (roll < 0.85) return { kind: 'sunderedStrike' };
        return { kind: 'basic' };
      }
      // Bound: original opening behavior.
      if (roll < 0.25) return { kind: 'veilPulse' };
      if (roll < 0.55) return { kind: 'sunderedStrike' };
      return { kind: 'basic' };
    },
  },
  // ----- CHAPTER 2 BOSS (Bloom of Decay) ---------------------------------
  {
    id: 'bloomOfDecay', name: 'Bloom of Decay', tier: 5, level: 13, boss: true,
    maxHp: 694, atk: 29, def: 14, mag: 22, spd: 7,
    xp: 480, gold: 280,
    drops: [
      { kind: 'consumable', id: 'hipotion', chance: 1.0 },
      { kind: 'consumable', id: 'ether',    chance: 1.0 },
      { kind: 'gem',        id: 'lifebloom', chance: 1.0 },
      { kind: 'equipment',  id: 'cinderRobe', chance: 0.5 },
    ],
    radius: 72,
    color: '#a060ff',
    palette: BLOOM_PALETTE,
    // Chapter boss: the Bloom IS the leyline knot. Physical attacks pass
    // through petal-flesh; it eats dark; it is rot incarnate so nature does
    // nothing. Fire, ice, and thunder are the honest options — and they all
    // do normal damage. No shortcut, only persistence.
    resist: ['phys', 'dark'], immune: ['nature'],
    draw: drawBloom,
    ai(battle, self) {
      const ratio = self.hp / self.maxHp;
      const phase2 = ratio <= 0.65;
      const phase3 = ratio <= 0.3;
      if (phase2 && !self._p2) {
        self._p2 = true;
        battle._addLog(`The Bloom\'s petals split — Vael\'s face flickers through the rot.`);
      }
      if (phase3 && !self._p3) {
        self._p3 = true;
        battle._addLog(`The Bloom unbinds. The song bleeds out of it like light from a wound.`);
      }
      const roll = Math.random();
      if (phase3) {
        if (roll < 0.35) return { kind: 'aetherWail' };
        if (roll < 0.65) return { kind: 'sporeBloom' };
        if (roll < 0.85) return { kind: 'thornLash' };
        return { kind: 'basic' };
      }
      if (phase2) {
        if (roll < 0.25) return { kind: 'aetherWail' };
        if (roll < 0.55) return { kind: 'sporeBloom' };
        if (roll < 0.80) return { kind: 'thornLash' };
        return { kind: 'basic' };
      }
      if (roll < 0.30) return { kind: 'sporeBloom' };
      if (roll < 0.55) return { kind: 'thornLash' };
      return { kind: 'basic' };
    },
  },
  // ----- MID-BOSS (Deep Reach) -------------------------------------------
  {
    id: 'rotcrownTreant', name: 'Rotcrown Treant', tier: 4, level: 10, boss: true,
    maxHp: 403, atk: 24, def: 11, mag: 14, spd: 5,
    xp: 220, gold: 130,
    drops: [
      { kind: 'consumable', id: 'hipotion', chance: 1.0 },
      { kind: 'consumable', id: 'ether',    chance: 1.0 },
      { kind: 'gem',        id: 'venomFang', chance: 1.0 },
      { kind: 'equipment',  id: 'flameBrand', chance: 0.5 },
    ],
    radius: 56,
    color: '#2a1a14',
    palette: ROTCROWN_PALETTE,
    // Mid-boss: bark is too saturated with rot to burn quickly — fire only
    // does normal damage. Frozen wood doesn't shatter; corrupted nature
    // feeds it. Thunder and ordinary blades land for full.
    resist: ['phys', 'ice'], immune: ['nature'],
    draw: drawRotcrown,
    ai(battle, self) {
      const phase2 = self.hp / self.maxHp <= 0.5;
      if (phase2 && !self._phaseShouted) {
        self._phaseShouted = true;
        battle._addLog(`The Rotcrown's bark splits. Sporeswarms boil from inside.`);
      }
      const roll = Math.random();
      if (phase2) {
        if (roll < 0.40) return { kind: 'sporeBloom' };
        if (roll < 0.75) return { kind: 'thornLash' };
        return { kind: 'basic' };
      }
      if (roll < 0.30) return { kind: 'sporeBloom' };
      if (roll < 0.60) return { kind: 'thornLash' };
      return { kind: 'basic' };
    },
  },
  {
    id: 'wraith', name: 'Wraith', tier: 2, level: 5,
    maxHp: 60, atk: 14, def: 3, spd: 8,
    xp: 36, gold: 18,
    drops: [
      { kind: 'consumable', id: 'hipotion', chance: 0.2 },
      { kind: 'consumable', id: 'ether', chance: 0.2 },
      { kind: 'equipment', id: 'silverRing', chance: 0.08 },
      { kind: 'equipment', id: 'flameBrand', chance: 0.02 },
      { kind: 'gem', id: 'tideShard', chance: 0.06 },
      { kind: 'gem', id: 'wardStone', chance: 0.06 },
      { kind: 'gem', id: 'stormPearl', chance: 0.04 },
      { kind: 'gem', id: 'vigorStone', chance: 0.04 },
      { kind: 'gem', id: 'lifebloom', chance: 0.04 },
      { kind: 'gem', id: 'mightCore', chance: 0.04 },
    ],
    radius: 36, color: WRAITH_PALETTE.body, palette: WRAITH_PALETTE,
    // Untethered spirit — purifying fire and dawn-light burn it. Blades pass
    // through; ice means nothing to a thing that doesn't have a body to chill.
    resist: ['phys'], weak: ['fire', 'holy'], immune: ['ice'],
    attackStatus: { id: 'sleep', chance: 0.18 },
    draw: drawWraith,
  },
  {
    id: 'wraithWisp', name: 'Wraith Wisp', tier: 1, level: 3,
    maxHp: 50, atk: 11, def: 2, mag: 12, spd: 8,
    xp: 22, gold: 8,
    drops: [
      { kind: 'consumable', id: 'ether', chance: 0.25 },
      { kind: 'gem', id: 'sandmanBell', chance: 0.08 },
    ],
    radius: 26, color: WISP_PALETTE.body, palette: WISP_PALETTE,
    // Lesser untethered spirit — fire and dawn-light burn it; blades phase
    // through; ice means nothing to a thing without a body.
    resist: ['phys'], weak: ['fire', 'holy'], immune: ['ice'],
    attackStatus: { id: 'sleep', chance: 0.20 },
    draw: drawWraithWisp,
  },
  {
    id: 'wraithEcho', name: 'Wraith Echo', tier: 2, level: 4,
    maxHp: 75, atk: 12, def: 3, mag: 14, spd: 9,
    xp: 36, gold: 16,
    drops: [
      { kind: 'consumable', id: 'ether', chance: 1.0 },
      { kind: 'gem', id: 'sandmanBell', chance: 0.3 },
      { kind: 'gem', id: 'voidshard', chance: 0.15 },
    ],
    radius: 32, color: WRAITHECHO_PALETTE.body, palette: WRAITHECHO_PALETTE,
    // Echo of the Hollow Warden — a wraith that learned shape. Dark spells
    // wash off; phys still phases; fire and dawn still cut.
    resist: ['phys', 'dark'], weak: ['fire', 'holy'], immune: ['ice'],
    attackStatus: { id: 'sleep', chance: 0.30 },
    draw: drawWraithEcho,
  },
  // Tier 3 variant — a wraith that drifted out of the Echoing Hollow and
  // soaked up the Reach's corruption. Sour-green halo, deeper purple body,
  // stronger sleep on hit. Used in Deep Reach encounters.
  {
    id: 'hollowWraith', name: 'Hollow Wraith', tier: 3, level: 9,
    maxHp: 112, atk: 21, def: 4, mag: 18, spd: 9,
    xp: 70, gold: 28,
    drops: [
      { kind: 'consumable', id: 'hipotion', chance: 0.22 },
      { kind: 'consumable', id: 'ether', chance: 0.22 },
      { kind: 'gem', id: 'voidshard', chance: 0.06 },
      { kind: 'gem', id: 'sandmanBell', chance: 0.06 },
      { kind: 'gem', id: 'lifebloom', chance: 0.04 },
    ],
    radius: 38,
    color: '#5a1aaa',
    palette: { body: '#5a1aaa', shade: '#1a0033', glow: 'rgba(170,255,140,', skull: '#cdffae', eye: '#c8e060' },
    // Same elemental profile as the base wraith — the corruption didn't
    // change WHAT it is, just made it stronger.
    resist: ['phys'], weak: ['fire', 'holy'], immune: ['ice'],
    attackStatus: { id: 'sleep', chance: 0.30 },
    draw: drawWraith,
  },
];

export const ENEMY_BY_ID = Object.fromEntries(ENEMIES.map(e => [e.id, e]));

export function createEnemyInstance(id) {
  const tmpl = ENEMY_BY_ID[id];
  if (!tmpl) return null;
  return {
    id,
    template: tmpl,
    name: tmpl.name,
    level: tmpl.level ?? 1,
    mag: tmpl.mag ?? 0,
    boss: !!tmpl.boss,
    hp: tmpl.maxHp, maxHp: tmpl.maxHp,
    // Enemies have a small MP pool so Osmose/drain spells have something to
    // pull. Bosses get scaled MP via template `maxMp`; regulars fall back to
    // a default scaled to magic stat.
    mp: tmpl.maxMp ?? Math.max(0, (tmpl.mag ?? 0) * 4),
    maxMp: tmpl.maxMp ?? Math.max(0, (tmpl.mag ?? 0) * 4),
    atk: tmpl.atk, def: tmpl.def, spd: tmpl.spd,
    radius: tmpl.radius, color: tmpl.color,
    palette: tmpl.palette,
    weak: tmpl.weak ?? [], resist: tmpl.resist ?? [], immune: tmpl.immune ?? [],
    xp: tmpl.xp, gold: tmpl.gold,
    ai: tmpl.ai || null,
    attackStatus: tmpl.attackStatus || null,
    t: 0, atb: 0,
    dead: false,
    statuses: [],
    hitFlash: 0,
    shake: 0,
  };
}
