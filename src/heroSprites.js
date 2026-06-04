// Per-class hero sprites. Each draw routine renders at (0,0) with the actor's
// feet near y=+r; the caller translates to place the character. The optional
// `facing` (radians) is used to flip the sprite horizontally when looking
// left so weapons appear on the correct side.

export function drawHero(ctx, classId, t, r, opts = {}) {
  const { facing = 0, walking = false } = opts;
  // Mirror when facing leftward so all hand-held items sit on the correct side.
  const flip = Math.cos(facing) < -0.2;
  ctx.save();
  if (flip) ctx.scale(-1, 1);
  switch (classId) {
    case 'fighter':  drawFighter(ctx, t, r, walking); break;
    case 'black':    drawBlackMage(ctx, t, r, walking); break;
    case 'white':    drawWhiteMage(ctx, t, r, walking); break;
    case 'ranger':   drawRanger(ctx, t, r, walking); break;
    default:         drawFighter(ctx, t, r, walking);
  }
  ctx.restore();
}

function drawShadow(ctx, r) {
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.95, r * 0.85, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawFace(ctx, r, eyeYRel = -0.32) {
  ctx.fillStyle = '#f0c9a0';
  ctx.beginPath();
  ctx.arc(0, r * (eyeYRel + 0.05), r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a0d0d';
  ctx.beginPath();
  ctx.arc(-r * 0.1, r * eyeYRel, Math.max(1.4, r * 0.06), 0, Math.PI * 2);
  ctx.arc(r * 0.1, r * eyeYRel, Math.max(1.4, r * 0.06), 0, Math.PI * 2);
  ctx.fill();
}

// --- Fighter -----------------------------------------------------------------

function drawFighter(ctx, t, r, walking) {
  const bob = walking ? Math.sin(t * 9) * 1.5 : Math.sin(t * 2.2) * 0.8;
  drawShadow(ctx, r);
  ctx.save();
  ctx.translate(0, bob);

  // Legs (greaves)
  const stride = walking ? Math.sin(t * 9) * r * 0.08 : 0;
  ctx.fillStyle = '#3a4a70';
  ctx.fillRect(-r * 0.34, r * 0.4, r * 0.28, r * 0.5);
  ctx.fillRect(r * 0.06, r * 0.4, r * 0.28, r * 0.5);
  ctx.fillStyle = '#1a2a4a';
  ctx.fillRect(-r * 0.4, r * 0.82, r * 0.4, r * 0.15);  // left boot
  ctx.fillRect(r * 0.0,  r * 0.82, r * 0.4, r * 0.15);  // right boot

  // Torso plate
  const torsoGrad = ctx.createLinearGradient(0, -r * 0.1, 0, r * 0.5);
  torsoGrad.addColorStop(0, '#7a8ab0');
  torsoGrad.addColorStop(1, '#3a4a70');
  ctx.fillStyle = torsoGrad;
  ctx.beginPath();
  ctx.moveTo(-r * 0.55, -r * 0.1);
  ctx.lineTo( r * 0.55, -r * 0.1);
  ctx.lineTo( r * 0.45, r * 0.5);
  ctx.lineTo(-r * 0.45, r * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1a2a4a';
  ctx.lineWidth = Math.max(1, r * 0.06);
  ctx.stroke();
  // Plate edge highlight
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(-r * 0.5, -r * 0.05, r * 1.0, r * 0.04);

  // Belt
  ctx.fillStyle = '#4a3018';
  ctx.fillRect(-r * 0.5, r * 0.36, r * 1.0, r * 0.1);
  ctx.fillStyle = '#ffd84d';
  ctx.fillRect(-r * 0.07, r * 0.36, r * 0.14, r * 0.1);

  // Pauldrons
  ctx.fillStyle = '#8a9ac0';
  ctx.beginPath();
  ctx.ellipse(-r * 0.55, -r * 0.05, r * 0.22, r * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse( r * 0.55, -r * 0.05, r * 0.22, r * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1a2a4a';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Helmet
  ctx.fillStyle = '#8a9ac0';
  ctx.beginPath();
  ctx.arc(0, -r * 0.45, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1a2a4a';
  ctx.lineWidth = Math.max(1, r * 0.05);
  ctx.stroke();
  // Visor slot
  ctx.fillStyle = '#0a0508';
  ctx.fillRect(-r * 0.3, -r * 0.5, r * 0.6, r * 0.1);
  // Helmet centerline
  ctx.strokeStyle = '#6a7ab0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.9); ctx.lineTo(0, -r * 0.55);
  ctx.stroke();
  // Plume
  ctx.fillStyle = '#ff3b6e';
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.95);
  ctx.quadraticCurveTo(-r * 0.18, -r * 0.7, -r * 0.05, -r * 0.55);
  ctx.quadraticCurveTo(r * 0.05, -r * 0.7, r * 0.05, -r * 0.55);
  ctx.closePath();
  ctx.fill();

  // Shield (camera-side arm)
  ctx.save();
  ctx.translate(-r * 0.7, r * 0.1);
  const sg = ctx.createRadialGradient(-r * 0.05, -r * 0.05, 1, 0, 0, r * 0.4);
  sg.addColorStop(0, '#a85a3a');
  sg.addColorStop(1, '#5a2a18');
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.3, r * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2a1208';
  ctx.lineWidth = Math.max(1, r * 0.05);
  ctx.stroke();
  // Boss
  ctx.fillStyle = '#ffd84d';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8a6a18';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Sword (other arm)
  ctx.save();
  ctx.translate(r * 0.55, r * 0.05);
  ctx.rotate(-0.35 + Math.sin(t * 1.5) * 0.04);
  // Grip
  ctx.fillStyle = '#2a1a08';
  ctx.fillRect(-r * 0.06, 0, r * 0.12, r * 0.25);
  // Guard
  ctx.fillStyle = '#ffd84d';
  ctx.fillRect(-r * 0.28, -r * 0.06, r * 0.56, r * 0.1);
  // Blade
  const bladeGrad = ctx.createLinearGradient(0, 0, 0, -r * 1.4);
  bladeGrad.addColorStop(0, '#a0b0c8');
  bladeGrad.addColorStop(0.6, '#e0e8f0');
  bladeGrad.addColorStop(1, '#fff');
  ctx.fillStyle = bladeGrad;
  ctx.beginPath();
  ctx.moveTo(-r * 0.08, -r * 0.06);
  ctx.lineTo( r * 0.08, -r * 0.06);
  ctx.lineTo( r * 0.06, -r * 1.2);
  ctx.lineTo(0, -r * 1.4);
  ctx.lineTo(-r * 0.06, -r * 1.2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5a6a80';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Fuller (groove)
  ctx.strokeStyle = '#7a8aa0';
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.1); ctx.lineTo(0, -r * 1.18);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

// --- Black Mage --------------------------------------------------------------

function drawBlackMage(ctx, t, r, walking) {
  const bob = walking ? Math.sin(t * 6) * 1.2 : Math.sin(t * 2.5) * 0.8;
  drawShadow(ctx, r);
  ctx.save();
  ctx.translate(0, bob);

  // Robe (flowing trapezoid)
  const robeGrad = ctx.createLinearGradient(0, -r * 0.4, 0, r);
  robeGrad.addColorStop(0, '#5a3a8a');
  robeGrad.addColorStop(1, '#1a0a3a');
  ctx.fillStyle = robeGrad;
  ctx.beginPath();
  ctx.moveTo(-r * 0.28, -r * 0.35);
  ctx.lineTo( r * 0.28, -r * 0.35);
  ctx.bezierCurveTo( r * 0.5,  r * 0.05,  r * 0.85,  r * 0.55,  r * 1.0,  r);
  ctx.quadraticCurveTo(0, r * 1.05, -r * 1.0, r);
  ctx.bezierCurveTo(-r * 0.85, r * 0.55, -r * 0.5, r * 0.05, -r * 0.28, -r * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1a0a3a';
  ctx.lineWidth = Math.max(1, r * 0.07);
  ctx.stroke();
  // Robe trim
  ctx.fillStyle = '#ffd84d';
  ctx.beginPath();
  ctx.moveTo(-r * 1.0, r);
  ctx.quadraticCurveTo(0, r * 1.05, r * 1.0, r);
  ctx.lineTo(r * 0.95, r * 0.92);
  ctx.quadraticCurveTo(0, r * 0.96, -r * 0.95, r * 0.92);
  ctx.closePath();
  ctx.fill();

  // Hat brim (wide flat oval)
  ctx.fillStyle = '#1a0a2a';
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.35, r * 0.78, r * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0a0014';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Hat cone (drooping)
  ctx.fillStyle = '#2a1a3a';
  ctx.beginPath();
  ctx.moveTo(-r * 0.42, -r * 0.4);
  ctx.bezierCurveTo(-r * 0.2, -r * 1.0, r * 0.35, -r * 1.45, r * 0.55, -r * 1.15);
  ctx.lineTo(r * 0.42, -r * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#0a0014';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Hat band
  ctx.fillStyle = '#ffd84d';
  ctx.fillRect(-r * 0.4, -r * 0.5, r * 0.82, r * 0.08);
  // Buckle
  ctx.fillStyle = '#8a6a18';
  ctx.fillRect(-r * 0.06, -r * 0.5, r * 0.12, r * 0.08);

  // Glowing eyes (inside hat shadow)
  const eyeY = -r * 0.22;
  ctx.shadowColor = '#ffd84d'; ctx.shadowBlur = r * 0.5;
  ctx.fillStyle = '#ffd84d';
  ctx.beginPath();
  ctx.arc(-r * 0.14, eyeY, Math.max(1.6, r * 0.08), 0, Math.PI * 2);
  ctx.arc( r * 0.14, eyeY, Math.max(1.6, r * 0.08), 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Staff
  ctx.save();
  ctx.translate(r * 0.5, r * 0.15);
  ctx.rotate(-0.2 + Math.sin(t * 1.5) * 0.05);
  // Shaft
  ctx.strokeStyle = '#5a3a18';
  ctx.lineWidth = Math.max(2, r * 0.09);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, r * 0.35);
  ctx.lineTo(0, -r * 1.3);
  ctx.stroke();
  // Orb
  const orbGrad = ctx.createRadialGradient(-r * 0.04, -r * 1.38, 0, 0, -r * 1.35, r * 0.22);
  orbGrad.addColorStop(0, '#ffae9a');
  orbGrad.addColorStop(0.6, '#ff3b6e');
  orbGrad.addColorStop(1, '#5a0028');
  ctx.fillStyle = orbGrad;
  ctx.shadowColor = '#ff3b6e'; ctx.shadowBlur = r * 0.6;
  ctx.beginPath();
  ctx.arc(0, -r * 1.35, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Orb claws
  ctx.strokeStyle = '#3a2a18';
  ctx.lineWidth = 1.5;
  for (const ang of [-Math.PI / 3, -2 * Math.PI / 3, Math.PI]) {
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * r * 0.18, -r * 1.35 + Math.sin(ang) * r * 0.18);
    ctx.lineTo(Math.cos(ang) * r * 0.06, -r * 1.35 + Math.sin(ang) * r * 0.06);
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore();
}

// --- White Mage --------------------------------------------------------------

function drawWhiteMage(ctx, t, r, walking) {
  const bob = walking ? Math.sin(t * 6) * 1.2 : Math.sin(t * 2.5) * 0.8;
  drawShadow(ctx, r);
  ctx.save();
  ctx.translate(0, bob);

  // Robe
  const robeGrad = ctx.createLinearGradient(0, -r * 0.3, 0, r);
  robeGrad.addColorStop(0, '#ffffff');
  robeGrad.addColorStop(1, '#c8c8d0');
  ctx.fillStyle = robeGrad;
  ctx.beginPath();
  ctx.moveTo(-r * 0.3, -r * 0.25);
  ctx.lineTo( r * 0.3, -r * 0.25);
  ctx.bezierCurveTo(r * 0.5, r * 0.1, r * 0.85, r * 0.6, r * 1.0, r);
  ctx.quadraticCurveTo(0, r * 1.05, -r * 1.0, r);
  ctx.bezierCurveTo(-r * 0.85, r * 0.6, -r * 0.5, r * 0.1, -r * 0.3, -r * 0.25);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#9a9aa6';
  ctx.lineWidth = Math.max(1, r * 0.05);
  ctx.stroke();

  // Red triangle hem (classic white-mage trim)
  ctx.fillStyle = '#a82a2a';
  const triCount = 7;
  for (let i = 0; i < triCount; i++) {
    const x0 = -r * 0.95 + (i / triCount) * r * 1.9;
    const x1 = x0 + (r * 1.9) / triCount;
    ctx.beginPath();
    ctx.moveTo(x0, r * 0.95);
    ctx.lineTo(x1, r * 0.95);
    ctx.lineTo((x0 + x1) / 2, r * 0.7);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = '#601818';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-r * 0.95, r * 0.95);
  ctx.lineTo(r * 0.95, r * 0.95);
  ctx.stroke();

  // Hood
  ctx.fillStyle = '#f4f4fa';
  ctx.beginPath();
  ctx.moveTo(-r * 0.55, -r * 0.05);
  ctx.quadraticCurveTo(-r * 0.6, -r * 0.85, 0, -r * 0.85);
  ctx.quadraticCurveTo(r * 0.6, -r * 0.85, r * 0.55, -r * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#9a9aa6';
  ctx.lineWidth = Math.max(1, r * 0.05);
  ctx.stroke();
  // Red trim on hood edge
  ctx.strokeStyle = '#a82a2a';
  ctx.lineWidth = Math.max(1.5, r * 0.07);
  ctx.beginPath();
  ctx.moveTo(-r * 0.55, -r * 0.05);
  ctx.quadraticCurveTo(-r * 0.55, -r * 0.4, -r * 0.35, -r * 0.55);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(r * 0.55, -r * 0.05);
  ctx.quadraticCurveTo(r * 0.55, -r * 0.4, r * 0.35, -r * 0.55);
  ctx.stroke();

  // Face (inside hood)
  drawFace(ctx, r, -0.35);

  // Hair tuft peeking out
  ctx.fillStyle = '#dbb874';
  ctx.beginPath();
  ctx.arc(-r * 0.18, -r * 0.45, r * 0.07, 0, Math.PI * 2);
  ctx.arc( r * 0.18, -r * 0.45, r * 0.07, 0, Math.PI * 2);
  ctx.fill();

  // Staff
  ctx.save();
  ctx.translate(r * 0.5, r * 0.18);
  ctx.rotate(-0.18 + Math.sin(t * 1.5) * 0.04);
  // Shaft (golden)
  const shaftGrad = ctx.createLinearGradient(-r * 0.05, 0, r * 0.05, 0);
  shaftGrad.addColorStop(0, '#8a6a18');
  shaftGrad.addColorStop(0.5, '#ffd84d');
  shaftGrad.addColorStop(1, '#8a6a18');
  ctx.strokeStyle = shaftGrad;
  ctx.lineWidth = Math.max(2, r * 0.1);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, r * 0.35);
  ctx.lineTo(0, -r * 1.2);
  ctx.stroke();
  // Crystal at top (diamond)
  ctx.fillStyle = '#7aff8a';
  ctx.shadowColor = '#7aff8a'; ctx.shadowBlur = r * 0.7;
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.45);
  ctx.lineTo(r * 0.18, -r * 1.25);
  ctx.lineTo(0, -r * 1.05);
  ctx.lineTo(-r * 0.18, -r * 1.25);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#2a6a3a';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Crystal highlight
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.moveTo(-r * 0.05, -r * 1.35);
  ctx.lineTo(r * 0.04, -r * 1.32);
  ctx.lineTo(-r * 0.02, -r * 1.2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

// --- Ranger ------------------------------------------------------------------

function drawRanger(ctx, t, r, walking) {
  const bob = walking ? Math.sin(t * 9) * 1.5 : Math.sin(t * 2.5) * 0.8;
  drawShadow(ctx, r);
  ctx.save();
  ctx.translate(0, bob);

  // Legs (leather pants)
  ctx.fillStyle = '#5a3a18';
  ctx.fillRect(-r * 0.32, r * 0.4, r * 0.25, r * 0.5);
  ctx.fillRect( r * 0.07, r * 0.4, r * 0.25, r * 0.5);
  // Boots
  ctx.fillStyle = '#1a0d04';
  ctx.fillRect(-r * 0.36, r * 0.82, r * 0.32, r * 0.15);
  ctx.fillRect( r * 0.04, r * 0.82, r * 0.32, r * 0.15);

  // Tunic (forest green)
  const tunicGrad = ctx.createLinearGradient(0, -r * 0.1, 0, r * 0.5);
  tunicGrad.addColorStop(0, '#5a8a6a');
  tunicGrad.addColorStop(1, '#2a5a3a');
  ctx.fillStyle = tunicGrad;
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, -r * 0.1);
  ctx.lineTo( r * 0.5, -r * 0.1);
  ctx.lineTo( r * 0.6,  r * 0.55);
  ctx.lineTo(-r * 0.6,  r * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1a3a22';
  ctx.lineWidth = Math.max(1, r * 0.05);
  ctx.stroke();
  // Tunic V-neck
  ctx.strokeStyle = '#1a3a22';
  ctx.beginPath();
  ctx.moveTo(-r * 0.15, -r * 0.1);
  ctx.lineTo(0, r * 0.1);
  ctx.lineTo(r * 0.15, -r * 0.1);
  ctx.stroke();

  // Belt
  ctx.fillStyle = '#3a2a18';
  ctx.fillRect(-r * 0.55, r * 0.4, r * 1.1, r * 0.1);
  ctx.fillStyle = '#ffd84d';
  ctx.fillRect(-r * 0.05, r * 0.4, r * 0.1, r * 0.1);

  // Quiver strap across chest
  ctx.strokeStyle = '#3a2a18';
  ctx.lineWidth = Math.max(2, r * 0.09);
  ctx.beginPath();
  ctx.moveTo(-r * 0.45, -r * 0.05);
  ctx.lineTo( r * 0.35, r * 0.4);
  ctx.stroke();

  // Quiver behind right shoulder
  ctx.fillStyle = '#3a2a18';
  ctx.fillRect(r * 0.32, -r * 0.7, r * 0.16, r * 0.45);
  ctx.strokeStyle = '#1a0d04';
  ctx.strokeRect(r * 0.32, -r * 0.7, r * 0.16, r * 0.45);
  // Arrow fletching peeking
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = ['#ffd84d', '#ff5a6e', '#5aaaff'][i];
    ctx.beginPath();
    ctx.moveTo(r * (0.34 + i * 0.04), -r * 0.78);
    ctx.lineTo(r * (0.38 + i * 0.04), -r * 0.92);
    ctx.lineTo(r * (0.30 + i * 0.04), -r * 0.92);
    ctx.closePath();
    ctx.fill();
  }

  // Hood (short, doesn't cover whole face)
  ctx.fillStyle = '#3a6a4a';
  ctx.beginPath();
  ctx.moveTo(-r * 0.45, -r * 0.05);
  ctx.quadraticCurveTo(-r * 0.45, -r * 0.6, 0, -r * 0.7);
  ctx.quadraticCurveTo(r * 0.45, -r * 0.6, r * 0.45, -r * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1a3a22';
  ctx.lineWidth = Math.max(1, r * 0.05);
  ctx.stroke();
  // Hood point
  ctx.fillStyle = '#2a5a3a';
  ctx.beginPath();
  ctx.moveTo(-r * 0.05, -r * 0.65);
  ctx.lineTo( r * 0.25, -r * 0.85);
  ctx.lineTo( r * 0.05, -r * 0.55);
  ctx.closePath();
  ctx.fill();

  // Face (visible below hood)
  drawFace(ctx, r, -0.28);

  // Hair tuft
  ctx.fillStyle = '#5a3a18';
  ctx.beginPath();
  ctx.arc(0, -r * 0.5, r * 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Bow (diagonal across body)
  ctx.save();
  ctx.translate(r * 0.55, r * 0.05);
  ctx.rotate(-0.45 + Math.sin(t * 1.5) * 0.04);
  // Bow limb (curve)
  ctx.strokeStyle = '#5a3a18';
  ctx.lineWidth = Math.max(2, r * 0.1);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.7, -Math.PI * 0.42, Math.PI * 0.42);
  ctx.stroke();
  // Bowstring
  ctx.strokeStyle = '#e8e8e8';
  ctx.lineWidth = 1;
  const sx = r * 0.7 * Math.cos(-Math.PI * 0.42);
  const sy = r * 0.7 * Math.sin(-Math.PI * 0.42);
  const ex = r * 0.7 * Math.cos( Math.PI * 0.42);
  const ey = r * 0.7 * Math.sin( Math.PI * 0.42);
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  // Grip
  ctx.fillStyle = '#2a1a08';
  ctx.fillRect(-r * 0.07, -r * 0.1, r * 0.14, r * 0.2);
  ctx.restore();

  ctx.restore();
}
