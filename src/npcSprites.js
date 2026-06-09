// Role-specific NPC sprites. Dispatches by npc.id; falls back to the generic
// hooded villager when no specific match exists. Each sprite renders at (0,0).

export function drawNpc(ctx, npc, t, r) {
  switch (npc.id) {
    case 'shopkeeper':       drawMira(ctx, t, r); break;
    case 'innkeeper':        drawEdran(ctx, t, r); break;
    case 'elder':            drawVorrin(ctx, t, r); break;
    case 'hermit:sable':     drawSable(ctx, t, r); break;
    case 'recruit:sable':    drawSable(ctx, t, r); break;
    case 'tender:caretaker': drawCaretaker(ctx, t, r); break;
    case 'bren:dying':       drawBren(ctx, t, r); break;
    case 'cal:scout':        drawCal(ctx, t, r); break;
    case 'cal:pinned':       drawCalPinned(ctx, t, r); break;
    default:                 drawGeneric(ctx, npc, t, r);
  }
}

function drawShadow(ctx, r) {
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.95, r * 0.85, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawFace(ctx, r, opts = {}) {
  const { skin = '#f0c9a0', eyeY = -0.32, eyeColor = '#1a0d0d', happy = false } = opts;
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, r * (eyeY + 0.05), r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = eyeColor;
  ctx.beginPath();
  ctx.arc(-r * 0.1, r * eyeY, Math.max(1.4, r * 0.06), 0, Math.PI * 2);
  ctx.arc(r * 0.1, r * eyeY, Math.max(1.4, r * 0.06), 0, Math.PI * 2);
  ctx.fill();
  if (happy) {
    ctx.strokeStyle = eyeColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, r * (eyeY + 0.18), r * 0.12, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }
}

// --- Mira the shopkeeper -----------------------------------------------------
// Cheerful, apron, holding a coin pouch, hair tied up with a yellow ribbon.

function drawMira(ctx, t, r) {
  const bob = Math.sin(t * 2.3) * 0.8;
  drawShadow(ctx, r);
  ctx.save();
  ctx.translate(0, bob);

  // Skirt / dress base
  ctx.fillStyle = '#5a6a90';
  ctx.beginPath();
  ctx.moveTo(-r * 0.55, r * 0.0);
  ctx.lineTo(r * 0.55, r * 0.0);
  ctx.bezierCurveTo(r * 0.75, r * 0.5, r * 0.85, r * 0.9, r * 0.9, r);
  ctx.lineTo(-r * 0.9, r);
  ctx.bezierCurveTo(-r * 0.85, r * 0.9, -r * 0.75, r * 0.5, -r * 0.55, r * 0.0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1a2a4a';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Apron (cream, with belt)
  ctx.fillStyle = '#f4eecf';
  ctx.beginPath();
  ctx.moveTo(-r * 0.35, r * 0.0);
  ctx.lineTo(r * 0.35, r * 0.0);
  ctx.lineTo(r * 0.45, r * 0.85);
  ctx.lineTo(-r * 0.45, r * 0.85);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#a08a5a';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Apron pocket
  ctx.fillStyle = '#d8c890';
  ctx.fillRect(-r * 0.3, r * 0.4, r * 0.25, r * 0.18);
  ctx.strokeRect(-r * 0.3, r * 0.4, r * 0.25, r * 0.18);
  // Belt
  ctx.fillStyle = '#4a3018';
  ctx.fillRect(-r * 0.5, r * 0.05, r * 1.0, r * 0.1);
  ctx.fillStyle = '#ffd84d';
  ctx.fillRect(-r * 0.06, r * 0.05, r * 0.12, r * 0.1);

  // Hair (gathered behind, peeking)
  ctx.fillStyle = '#c8a060';
  ctx.beginPath();
  ctx.arc(0, -r * 0.4, r * 0.42, 0, Math.PI * 2);
  ctx.fill();

  // Face
  drawFace(ctx, r, { eyeY: -0.34, happy: true });
  // Hair bangs across forehead
  ctx.fillStyle = '#c8a060';
  ctx.beginPath();
  ctx.moveTo(-r * 0.28, -r * 0.4);
  ctx.quadraticCurveTo(-r * 0.1, -r * 0.55, r * 0.1, -r * 0.45);
  ctx.quadraticCurveTo(r * 0.25, -r * 0.4, r * 0.28, -r * 0.4);
  ctx.lineTo(r * 0.28, -r * 0.32);
  ctx.lineTo(-r * 0.28, -r * 0.32);
  ctx.closePath();
  ctx.fill();
  // Hair bun + ribbon
  ctx.fillStyle = '#c8a060';
  ctx.beginPath();
  ctx.arc(0, -r * 0.7, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd84d';
  ctx.beginPath();
  ctx.moveTo(-r * 0.18, -r * 0.7);
  ctx.lineTo(-r * 0.32, -r * 0.78);
  ctx.lineTo(-r * 0.18, -r * 0.62);
  ctx.closePath();
  ctx.moveTo(r * 0.18, -r * 0.7);
  ctx.lineTo(r * 0.32, -r * 0.78);
  ctx.lineTo(r * 0.18, -r * 0.62);
  ctx.closePath();
  ctx.fill();

  // Coin pouch in right hand
  ctx.save();
  ctx.translate(r * 0.55, r * 0.3);
  ctx.rotate(0.2 + Math.sin(t * 1.8) * 0.06);
  ctx.fillStyle = '#7a4a18';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.16, r * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3a1a08';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Drawstring
  ctx.strokeStyle = '#3a1a08';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-r * 0.08, -r * 0.15);
  ctx.lineTo(r * 0.08, -r * 0.15);
  ctx.stroke();
  // Coin peek
  ctx.fillStyle = '#ffd84d';
  ctx.beginPath();
  ctx.arc(0, -r * 0.05, r * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

// --- Old Edran the innkeeper ------------------------------------------------
// Hefty, white beard, holding a tin lantern, warm and weathered.

function drawEdran(ctx, t, r) {
  const bob = Math.sin(t * 1.8) * 0.7;
  drawShadow(ctx, r);
  ctx.save();
  ctx.translate(0, bob);

  // Tunic body
  const tunicGrad = ctx.createLinearGradient(0, -r * 0.1, 0, r * 0.9);
  tunicGrad.addColorStop(0, '#6a4a3a');
  tunicGrad.addColorStop(1, '#3a2a18');
  ctx.fillStyle = tunicGrad;
  ctx.beginPath();
  ctx.moveTo(-r * 0.65, -r * 0.05);
  ctx.lineTo(r * 0.65, -r * 0.05);
  ctx.bezierCurveTo(r * 0.85, r * 0.5, r * 0.95, r * 0.9, r * 1.0, r);
  ctx.lineTo(-r * 1.0, r);
  ctx.bezierCurveTo(-r * 0.95, r * 0.9, -r * 0.85, r * 0.5, -r * 0.65, -r * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1a0e08';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // Tunic laces
  ctx.strokeStyle = '#1a0e08';
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const y = r * (0.05 + i * 0.18);
    ctx.moveTo(-r * 0.06, y);
    ctx.lineTo(r * 0.06, y);
  }
  ctx.stroke();
  // Belt
  ctx.fillStyle = '#2a1a08';
  ctx.fillRect(-r * 0.6, r * 0.35, r * 1.2, r * 0.12);
  ctx.fillStyle = '#a08850';
  ctx.fillRect(-r * 0.06, r * 0.36, r * 0.12, r * 0.1);

  // Head — slightly bald (peeking forehead) with thinning hair
  ctx.fillStyle = '#f0c9a0';
  ctx.beginPath();
  ctx.arc(0, -r * 0.42, r * 0.32, 0, Math.PI * 2);
  ctx.fill();
  // Hair tufts on sides
  ctx.fillStyle = '#e0e0e0';
  ctx.beginPath();
  ctx.arc(-r * 0.28, -r * 0.42, r * 0.12, 0.3, Math.PI - 0.3);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 0.28, -r * 0.42, r * 0.12, 0.3, Math.PI - 0.3);
  ctx.fill();
  // Eyes
  ctx.fillStyle = '#1a0d0d';
  ctx.beginPath();
  ctx.arc(-r * 0.1, -r * 0.42, 1.6, 0, Math.PI * 2);
  ctx.arc(r * 0.1, -r * 0.42, 1.6, 0, Math.PI * 2);
  ctx.fill();
  // Brows (bushy)
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.16, -r * 0.48); ctx.lineTo(-r * 0.04, -r * 0.5);
  ctx.moveTo(r * 0.04, -r * 0.5); ctx.lineTo(r * 0.16, -r * 0.48);
  ctx.stroke();
  // Big white beard
  ctx.fillStyle = '#e8e8e8';
  ctx.beginPath();
  ctx.moveTo(-r * 0.3, -r * 0.3);
  ctx.quadraticCurveTo(-r * 0.45, r * 0.0, -r * 0.3, r * 0.1);
  ctx.quadraticCurveTo(-r * 0.15, r * 0.2, 0, r * 0.18);
  ctx.quadraticCurveTo(r * 0.15, r * 0.2, r * 0.3, r * 0.1);
  ctx.quadraticCurveTo(r * 0.45, r * 0.0, r * 0.3, -r * 0.3);
  ctx.quadraticCurveTo(0, -r * 0.15, -r * 0.3, -r * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#a0a0a0';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Mustache shadow
  ctx.fillStyle = '#d0d0d0';
  ctx.beginPath();
  ctx.arc(-r * 0.08, -r * 0.28, r * 0.08, 0, Math.PI * 2);
  ctx.arc(r * 0.08, -r * 0.28, r * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Lantern in left hand (camera-side)
  ctx.save();
  ctx.translate(-r * 0.7, r * 0.2);
  // Handle
  ctx.strokeStyle = '#3a2a18';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -r * 0.18, r * 0.12, 0, Math.PI, true);
  ctx.stroke();
  // Lantern body
  ctx.fillStyle = '#6a5040';
  ctx.fillRect(-r * 0.14, -r * 0.05, r * 0.28, r * 0.3);
  ctx.strokeStyle = '#1a0e08';
  ctx.lineWidth = 1;
  ctx.strokeRect(-r * 0.14, -r * 0.05, r * 0.28, r * 0.3);
  // Glowing interior
  const lgrad = ctx.createRadialGradient(0, r * 0.1, 0, 0, r * 0.1, r * 0.18);
  lgrad.addColorStop(0, 'rgba(255,210,120,0.95)');
  lgrad.addColorStop(1, 'rgba(255,180,80,0)');
  ctx.fillStyle = lgrad;
  ctx.shadowColor = '#ffae3b'; ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(0, r * 0.1, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();

  ctx.restore();
}

// --- Elder Vorrin ------------------------------------------------------------
// Tall robed elder with long staff and a crystal — wisdom personified.

function drawVorrin(ctx, t, r) {
  const bob = Math.sin(t * 1.7) * 0.7;
  drawShadow(ctx, r);
  ctx.save();
  ctx.translate(0, bob);

  // Robe — long, deep blue with violet undertone
  const robeGrad = ctx.createLinearGradient(0, -r * 0.4, 0, r);
  robeGrad.addColorStop(0, '#4a3a8a');
  robeGrad.addColorStop(1, '#1a1240');
  ctx.fillStyle = robeGrad;
  ctx.beginPath();
  ctx.moveTo(-r * 0.3, -r * 0.4);
  ctx.lineTo(r * 0.3, -r * 0.4);
  ctx.bezierCurveTo(r * 0.5, r * 0.0, r * 0.85, r * 0.6, r * 1.0, r);
  ctx.quadraticCurveTo(0, r * 1.05, -r * 1.0, r);
  ctx.bezierCurveTo(-r * 0.85, r * 0.6, -r * 0.5, r * 0.0, -r * 0.3, -r * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#0a0420';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // Robe sash (gold trim down center)
  ctx.fillStyle = '#a08840';
  ctx.fillRect(-r * 0.06, -r * 0.35, r * 0.12, r * 1.3);
  // A rune on the sash
  ctx.fillStyle = '#ffd84d';
  ctx.beginPath();
  ctx.arc(0, r * 0.2, r * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1a1240';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-r * 0.04, r * 0.2); ctx.lineTo(r * 0.04, r * 0.2);
  ctx.moveTo(0, r * 0.16); ctx.lineTo(0, r * 0.24);
  ctx.stroke();

  // Hood — pulled up, framing the face
  ctx.fillStyle = '#3a2a6a';
  ctx.beginPath();
  ctx.moveTo(-r * 0.55, -r * 0.1);
  ctx.quadraticCurveTo(-r * 0.55, -r * 0.85, 0, -r * 0.85);
  ctx.quadraticCurveTo(r * 0.55, -r * 0.85, r * 0.55, -r * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1a1240';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Face (shaded by hood)
  ctx.fillStyle = '#d8b894';
  ctx.beginPath();
  ctx.arc(0, -r * 0.28, r * 0.28, 0, Math.PI * 2);
  ctx.fill();
  // Eyes (knowing)
  ctx.fillStyle = '#1a0d0d';
  ctx.beginPath();
  ctx.arc(-r * 0.1, -r * 0.3, 1.6, 0, Math.PI * 2);
  ctx.arc(r * 0.1, -r * 0.3, 1.6, 0, Math.PI * 2);
  ctx.fill();
  // Brows
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-r * 0.16, -r * 0.36); ctx.lineTo(-r * 0.04, -r * 0.36);
  ctx.moveTo(r * 0.04, -r * 0.36); ctx.lineTo(r * 0.16, -r * 0.36);
  ctx.stroke();
  // Long flowing beard
  ctx.fillStyle = '#e8e8e8';
  ctx.beginPath();
  ctx.moveTo(-r * 0.25, -r * 0.15);
  ctx.quadraticCurveTo(-r * 0.4, r * 0.2, -r * 0.18, r * 0.4);
  ctx.quadraticCurveTo(0, r * 0.55, r * 0.18, r * 0.4);
  ctx.quadraticCurveTo(r * 0.4, r * 0.2, r * 0.25, -r * 0.15);
  ctx.quadraticCurveTo(0, -r * 0.05, -r * 0.25, -r * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#a0a0a0';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Beard wisp at the tip
  ctx.fillStyle = '#e8e8e8';
  ctx.beginPath();
  ctx.moveTo(-r * 0.04, r * 0.45);
  ctx.quadraticCurveTo(0, r * 0.7, r * 0.04, r * 0.45);
  ctx.closePath();
  ctx.fill();

  // Long staff with crystal
  ctx.save();
  ctx.translate(r * 0.55, r * 0.2);
  ctx.rotate(-0.12);
  // Wooden shaft (gnarled)
  ctx.strokeStyle = '#5a3a18';
  ctx.lineWidth = Math.max(2, r * 0.08);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, r * 0.5);
  ctx.lineTo(0, -r * 1.3);
  ctx.stroke();
  // Top wrap
  ctx.strokeStyle = '#2a1a08';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.08, -r * (1.1 + i * 0.06));
    ctx.lineTo(r * 0.08, -r * (1.1 + i * 0.06));
    ctx.stroke();
  }
  // Crystal (violet)
  const cgrad = ctx.createRadialGradient(-r * 0.04, -r * 1.4, 0, 0, -r * 1.4, r * 0.2);
  cgrad.addColorStop(0, '#ffd2ff');
  cgrad.addColorStop(0.5, '#a060ff');
  cgrad.addColorStop(1, '#3a1a6a');
  ctx.fillStyle = cgrad;
  ctx.shadowColor = '#a060ff'; ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.55);
  ctx.lineTo(r * 0.16, -r * 1.4);
  ctx.lineTo(0, -r * 1.2);
  ctx.lineTo(-r * 0.16, -r * 1.4);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#1a0a3a';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

// --- Sable, the exiled Order mage -------------------------------------------
// Slategrey woodsman's robe, silver hair tied back, a smouldering ember-staff,
// faint ash motes drifting around him. Stands upright but weary.

function drawSable(ctx, t, r) {
  const bob = Math.sin(t * 1.5) * 0.6;
  drawShadow(ctx, r);
  ctx.save();
  ctx.translate(0, bob);

  // Robe — long slate-grey with smoke-violet undertone
  const robeGrad = ctx.createLinearGradient(0, -r * 0.4, 0, r);
  robeGrad.addColorStop(0, '#6a6a78');
  robeGrad.addColorStop(0.55, '#3a3a48');
  robeGrad.addColorStop(1, '#1a1822');
  ctx.fillStyle = robeGrad;
  ctx.beginPath();
  ctx.moveTo(-r * 0.34, -r * 0.32);
  ctx.lineTo(r * 0.34, -r * 0.32);
  ctx.bezierCurveTo(r * 0.55, r * 0.0, r * 0.85, r * 0.6, r * 0.95, r);
  ctx.quadraticCurveTo(0, r * 1.04, -r * 0.95, r);
  ctx.bezierCurveTo(-r * 0.85, r * 0.6, -r * 0.55, r * 0.0, -r * 0.34, -r * 0.32);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#0a0810';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // Vertical sash — dark violet with a single ember-orange rune
  ctx.fillStyle = '#2a1840';
  ctx.fillRect(-r * 0.07, -r * 0.28, r * 0.14, r * 1.25);
  ctx.strokeStyle = '#0a0420';
  ctx.lineWidth = 1;
  ctx.strokeRect(-r * 0.07, -r * 0.28, r * 0.14, r * 1.25);
  // Ember rune on the sash
  ctx.fillStyle = '#ff8a3b';
  ctx.shadowColor = '#ff5a20'; ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(0, r * 0.0);
  ctx.lineTo(r * 0.05, r * 0.06);
  ctx.lineTo(0, r * 0.14);
  ctx.lineTo(-r * 0.05, r * 0.06);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  // Sleeves — fold lines on both sides
  ctx.strokeStyle = '#0a0810';
  ctx.lineWidth = 1;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * r * 0.34, -r * 0.18);
    ctx.quadraticCurveTo(side * r * 0.6, r * 0.2, side * r * 0.7, r * 0.55);
    ctx.stroke();
  }

  // Head — weathered, narrow
  ctx.fillStyle = '#d8b894';
  ctx.beginPath();
  ctx.arc(0, -r * 0.42, r * 0.27, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5a3a28';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  // Cheek hollow shading
  ctx.fillStyle = 'rgba(80,40,30,0.18)';
  ctx.beginPath();
  ctx.arc(-r * 0.14, -r * 0.34, r * 0.1, 0, Math.PI * 2);
  ctx.arc(r * 0.14, -r * 0.34, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
  // Silver hair, swept back, tied
  ctx.fillStyle = '#cccccc';
  ctx.beginPath();
  ctx.moveTo(-r * 0.27, -r * 0.48);
  ctx.quadraticCurveTo(-r * 0.2, -r * 0.62, 0, -r * 0.64);
  ctx.quadraticCurveTo(r * 0.2, -r * 0.62, r * 0.27, -r * 0.48);
  ctx.lineTo(r * 0.22, -r * 0.42);
  ctx.lineTo(-r * 0.22, -r * 0.42);
  ctx.closePath();
  ctx.fill();
  // Ponytail tail behind shoulder
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = Math.max(2, r * 0.08);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-r * 0.22, -r * 0.42);
  ctx.quadraticCurveTo(-r * 0.36, -r * 0.28, -r * 0.32, -r * 0.1);
  ctx.stroke();
  // Eyes — narrow, knowing
  ctx.fillStyle = '#1a0d0d';
  ctx.beginPath();
  ctx.arc(-r * 0.1, -r * 0.42, Math.max(1.4, r * 0.05), 0, Math.PI * 2);
  ctx.arc(r * 0.1, -r * 0.42, Math.max(1.4, r * 0.05), 0, Math.PI * 2);
  ctx.fill();
  // Tired under-eye lines
  ctx.strokeStyle = 'rgba(60,30,20,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-r * 0.14, -r * 0.36); ctx.lineTo(-r * 0.06, -r * 0.36);
  ctx.moveTo(r * 0.06, -r * 0.36); ctx.lineTo(r * 0.14, -r * 0.36);
  ctx.stroke();
  // Brows (silver, set)
  ctx.strokeStyle = '#bbbbbb';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-r * 0.17, -r * 0.49); ctx.lineTo(-r * 0.04, -r * 0.48);
  ctx.moveTo(r * 0.04, -r * 0.48); ctx.lineTo(r * 0.17, -r * 0.49);
  ctx.stroke();
  // Short trimmed beard along jaw
  ctx.fillStyle = '#cccccc';
  ctx.beginPath();
  ctx.moveTo(-r * 0.22, -r * 0.3);
  ctx.quadraticCurveTo(-r * 0.18, -r * 0.18, -r * 0.06, -r * 0.16);
  ctx.lineTo(r * 0.06, -r * 0.16);
  ctx.quadraticCurveTo(r * 0.18, -r * 0.18, r * 0.22, -r * 0.3);
  ctx.quadraticCurveTo(0, -r * 0.22, -r * 0.22, -r * 0.3);
  ctx.closePath();
  ctx.fill();
  // Stern mouth line
  ctx.strokeStyle = '#3a1a08';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-r * 0.08, -r * 0.24);
  ctx.lineTo(r * 0.08, -r * 0.24);
  ctx.stroke();

  // Ember-staff in right hand — wood shaft, glowing coal at the top
  ctx.save();
  ctx.translate(r * 0.55, r * 0.25);
  ctx.rotate(-0.08);
  // Shaft (gnarled birch)
  ctx.strokeStyle = '#7a5a3a';
  ctx.lineWidth = Math.max(2, r * 0.07);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, r * 0.55);
  ctx.lineTo(0, -r * 1.2);
  ctx.stroke();
  // Bark notches
  ctx.strokeStyle = '#3a2a18';
  ctx.lineWidth = 1;
  for (let i = -3; i <= 4; i++) {
    const y = i * r * 0.18;
    ctx.beginPath();
    ctx.moveTo(-r * 0.05, y);
    ctx.lineTo(r * 0.05, y + r * 0.04);
    ctx.stroke();
  }
  // Bound coal at the staff head
  const flicker = 0.85 + Math.sin(t * 7) * 0.15;
  const eg = ctx.createRadialGradient(0, -r * 1.3, 0, 0, -r * 1.3, r * 0.22);
  eg.addColorStop(0, 'rgba(255,220,120,' + flicker + ')');
  eg.addColorStop(0.4, 'rgba(255,138,59,' + (flicker * 0.9) + ')');
  eg.addColorStop(1, 'rgba(120,30,8,0)');
  ctx.fillStyle = eg;
  ctx.shadowColor = '#ff8a3b'; ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(0, -r * 1.3, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Iron wrap around the coal
  ctx.strokeStyle = '#3a3a48';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, -r * 1.3, r * 0.13, 0.3, Math.PI - 0.3);
  ctx.arc(0, -r * 1.3, r * 0.13, Math.PI + 0.3, -0.3);
  ctx.stroke();
  // Stray sparks above the coal
  for (let i = 0; i < 3; i++) {
    const phase = (t * 1.4 + i * 0.7) % 1;
    const sy = -r * 1.3 - phase * r * 0.35;
    const sa = Math.max(0, 1 - phase) * 0.85;
    ctx.fillStyle = 'rgba(255,200,100,' + sa + ')';
    ctx.beginPath();
    ctx.arc((i - 1) * r * 0.05, sy, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Left hand — fingerless wrap holding a folded letter (Vael's last)
  ctx.save();
  ctx.translate(-r * 0.45, r * 0.32);
  ctx.fillStyle = '#d8b894';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3a2a18';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  // Wrap stripes
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.07, -r * 0.04 + i * r * 0.025);
    ctx.lineTo(r * 0.07, -r * 0.04 + i * r * 0.025);
    ctx.stroke();
  }
  // Folded paper edge
  ctx.fillStyle = '#f0e6c8';
  ctx.fillRect(-r * 0.05, -r * 0.18, r * 0.1, r * 0.14);
  ctx.strokeStyle = '#6a5a3a';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-r * 0.05, -r * 0.18, r * 0.1, r * 0.14);
  // Red wax seal blob on the letter
  ctx.fillStyle = '#aa2030';
  ctx.beginPath();
  ctx.arc(0, -r * 0.11, r * 0.025, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Drifting ash motes around him (cosmetic)
  for (let i = 0; i < 3; i++) {
    const phase = (t * 0.3 + i * 0.41) % 1;
    const ax = Math.cos(t * 0.7 + i * 2.1) * r * 0.6;
    const ay = -r * 0.1 - phase * r * 0.6;
    const aa = Math.max(0, 1 - phase) * 0.5;
    ctx.fillStyle = 'rgba(200,200,210,' + aa + ')';
    ctx.beginPath();
    ctx.arc(ax, ay, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// --- The Caretaker, wounded forest tender ----------------------------------
// Sitting low against a tree, green hooded cloak, bandaged hands, a small
// basket of dried reeds beside her, and a broken branch staked at her side
// marking where her companion fell.

function drawCaretaker(ctx, t, r) {
  // She sits — small downward bob like quiet breath. No floor-shadow shift.
  const breath = Math.sin(t * 1.1) * 0.5;
  // Shifted shadow — wider since she's seated
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.95, r * 1.05, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(0, breath);

  // Broken-branch grave marker behind her, off to one side
  ctx.save();
  ctx.translate(-r * 0.75, r * 0.0);
  ctx.rotate(-0.15);
  ctx.strokeStyle = '#3a2a14';
  ctx.lineWidth = Math.max(2, r * 0.07);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, r * 0.5);
  ctx.lineTo(0, -r * 0.6);
  ctx.stroke();
  // Splintered top
  ctx.strokeStyle = '#5a3a18';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.08, -r * 0.6);
  ctx.lineTo(0, -r * 0.5);
  ctx.lineTo(r * 0.06, -r * 0.66);
  ctx.lineTo(0, -r * 0.58);
  ctx.lineTo(-r * 0.04, -r * 0.7);
  ctx.stroke();
  // Tied white ribbon
  ctx.fillStyle = '#f4eecf';
  ctx.beginPath();
  ctx.moveTo(-r * 0.06, -r * 0.2);
  ctx.lineTo(r * 0.06, -r * 0.2);
  ctx.lineTo(r * 0.12, -r * 0.1);
  ctx.lineTo(-r * 0.12, -r * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#a08850';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.restore();

  // Cloak base — wide skirt pooled on the ground (she's seated)
  const cloakGrad = ctx.createLinearGradient(0, -r * 0.2, 0, r);
  cloakGrad.addColorStop(0, '#5a7a3a');
  cloakGrad.addColorStop(0.55, '#3a5a2a');
  cloakGrad.addColorStop(1, '#1a2a14');
  ctx.fillStyle = cloakGrad;
  ctx.beginPath();
  ctx.moveTo(-r * 0.4, -r * 0.05);
  ctx.lineTo(r * 0.4, -r * 0.05);
  ctx.quadraticCurveTo(r * 0.85, r * 0.7, r * 1.05, r * 1.0);
  ctx.lineTo(-r * 1.05, r * 1.0);
  ctx.quadraticCurveTo(-r * 0.85, r * 0.7, -r * 0.4, -r * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#0a1408';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // Stitching seam down the middle
  ctx.strokeStyle = '#1a2a14';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const y = r * (0.05 + i * 0.16);
    ctx.moveTo(-r * 0.02, y);
    ctx.lineTo(r * 0.02, y + r * 0.05);
  }
  ctx.stroke();
  // Leaf clasps along hem
  ctx.fillStyle = '#7aaa3a';
  for (const x of [-r * 0.55, -r * 0.2, r * 0.2, r * 0.55]) {
    ctx.beginPath();
    ctx.ellipse(x, r * 0.85, r * 0.06, r * 0.03, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Hood — pulled forward over the face, casting shadow
  ctx.fillStyle = '#3a5a2a';
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, -r * 0.05);
  ctx.quadraticCurveTo(-r * 0.55, -r * 0.7, 0, -r * 0.78);
  ctx.quadraticCurveTo(r * 0.55, -r * 0.7, r * 0.5, -r * 0.05);
  ctx.lineTo(r * 0.4, -r * 0.05);
  ctx.quadraticCurveTo(r * 0.42, -r * 0.6, 0, -r * 0.62);
  ctx.quadraticCurveTo(-r * 0.42, -r * 0.6, -r * 0.4, -r * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#0a1408';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // Hood lining peek
  ctx.fillStyle = '#7aaa3a';
  ctx.beginPath();
  ctx.moveTo(-r * 0.36, -r * 0.1);
  ctx.quadraticCurveTo(0, -r * 0.32, r * 0.36, -r * 0.1);
  ctx.lineTo(r * 0.3, -r * 0.05);
  ctx.lineTo(-r * 0.3, -r * 0.05);
  ctx.closePath();
  ctx.fill();

  // Face — in hood shadow, eyes downcast
  ctx.fillStyle = '#c8a890';
  ctx.beginPath();
  ctx.arc(0, -r * 0.32, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
  // Dark wash from the hood overhead
  ctx.fillStyle = 'rgba(20,30,15,0.35)';
  ctx.beginPath();
  ctx.arc(0, -r * 0.4, r * 0.2, Math.PI * 1.1, Math.PI * 1.9);
  ctx.fill();
  // Eyes — closed in mourning (small downward arcs)
  ctx.strokeStyle = '#2a1a14';
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(-r * 0.08, -r * 0.3, r * 0.05, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(r * 0.08, -r * 0.3, r * 0.05, 0.2, Math.PI - 0.2);
  ctx.stroke();
  // Subtle tear-track on the cheek
  ctx.strokeStyle = 'rgba(120,180,220,0.65)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-r * 0.06, -r * 0.24);
  ctx.lineTo(-r * 0.04, -r * 0.18);
  ctx.stroke();
  // A wisp of hair across the brow
  ctx.strokeStyle = '#7a5a3a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.14, -r * 0.4);
  ctx.quadraticCurveTo(0, -r * 0.36, r * 0.16, -r * 0.42);
  ctx.stroke();
  // Mouth — soft, set
  ctx.strokeStyle = '#3a2018';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-r * 0.06, -r * 0.18);
  ctx.lineTo(r * 0.06, -r * 0.18);
  ctx.stroke();

  // Bandaged hands resting in her lap, one over the other
  ctx.save();
  ctx.translate(0, r * 0.45);
  // Hand stack (lower)
  ctx.fillStyle = '#f4eecf';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.22, r * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a08850';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Bandage stripes
  ctx.strokeStyle = '#c8b88a';
  ctx.lineWidth = 1.2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * r * 0.05 - r * 0.06, -r * 0.06);
    ctx.lineTo(i * r * 0.05 + r * 0.06, r * 0.06);
    ctx.stroke();
  }
  // Spot of dried bloom on the bandage
  ctx.fillStyle = 'rgba(110,30,30,0.55)';
  ctx.beginPath();
  ctx.arc(r * 0.08, -r * 0.02, r * 0.025, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Reed basket beside her (camera-right)
  ctx.save();
  ctx.translate(r * 0.7, r * 0.55);
  ctx.rotate(0.08);
  // Basket body
  ctx.fillStyle = '#a88a4a';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.2, r * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();
  // Weave lines
  ctx.strokeStyle = '#5a3a18';
  ctx.lineWidth = 0.8;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * r * 0.05, -r * 0.13);
    ctx.lineTo(i * r * 0.05, r * 0.13);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.04, r * 0.2, r * 0.04, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Dried reeds bursting out the top
  ctx.strokeStyle = '#c8b070';
  ctx.lineWidth = 1.2;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(i * r * 0.04, -r * 0.06);
    ctx.lineTo(i * r * 0.05 + Math.sin(i + t * 0.4) * r * 0.04, -r * 0.32);
    ctx.stroke();
  }
  // Reed tufts
  ctx.fillStyle = '#d8c08a';
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.ellipse(i * r * 0.05 + Math.sin(i + t * 0.4) * r * 0.04, -r * 0.33, r * 0.018, r * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Faint sorrowful motes drifting up around her (cool grey-green)
  for (let i = 0; i < 3; i++) {
    const phase = (t * 0.25 + i * 0.37) % 1;
    const mx = Math.cos(t * 0.6 + i * 1.9) * r * 0.7;
    const my = -r * 0.1 - phase * r * 0.55;
    const ma = Math.max(0, 1 - phase) * 0.45;
    ctx.fillStyle = 'rgba(168,200,168,' + ma + ')';
    ctx.beginPath();
    ctx.arc(mx, my, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// --- Bren — dying scout slumped against the gatepost ------------------------

function drawBren(ctx, t, r) {
  const slowBob = Math.sin(t * 0.8) * 0.5; // shallow ragged breathing
  drawShadow(ctx, r);
  ctx.save();
  ctx.translate(0, slowBob);
  // Slumped pose — body tilts ~15deg.
  ctx.rotate(-0.20);

  // Leather tunic — brown with darker mud at the bottom
  const tunic = ctx.createLinearGradient(0, -r * 0.3, 0, r);
  tunic.addColorStop(0, '#9a6a3a');
  tunic.addColorStop(0.6, '#6a4a28');
  tunic.addColorStop(1, '#2a1a08');
  ctx.fillStyle = tunic;
  ctx.beginPath();
  ctx.moveTo(-r * 0.45, -r * 0.20);
  ctx.lineTo(r * 0.45, -r * 0.20);
  ctx.quadraticCurveTo(r * 0.7, r * 0.4, r * 0.75, r);
  ctx.quadraticCurveTo(0, r * 1.04, -r * 0.75, r);
  ctx.quadraticCurveTo(-r * 0.7, r * 0.4, -r * 0.45, -r * 0.20);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1a0d04';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Blood seeping from the side — dark red, wet sheen
  ctx.fillStyle = '#7a1010';
  ctx.beginPath();
  ctx.moveTo(r * 0.05, r * 0.05);
  ctx.quadraticCurveTo(r * 0.30, r * 0.30, r * 0.20, r * 0.85);
  ctx.quadraticCurveTo(r * 0.08, r * 0.55, r * 0.0, r * 0.35);
  ctx.closePath();
  ctx.fill();
  // Wet glint on the blood
  ctx.fillStyle = 'rgba(255,80,80,0.45)';
  ctx.beginPath();
  ctx.arc(r * 0.15, r * 0.30, r * 0.05, 0, Math.PI * 2);
  ctx.fill();

  // Head — pale, sweat-sheened
  ctx.fillStyle = '#e8c8a0';
  ctx.beginPath();
  ctx.arc(0, -r * 0.45, r * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7a4a28';
  ctx.lineWidth = 0.6;
  ctx.stroke();
  // Sweat highlight
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.arc(-r * 0.12, -r * 0.55, r * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Dishevelled brown hair
  ctx.fillStyle = '#5a3a18';
  ctx.beginPath();
  ctx.moveTo(-r * 0.28, -r * 0.48);
  ctx.quadraticCurveTo(-r * 0.2, -r * 0.74, 0, -r * 0.72);
  ctx.quadraticCurveTo(r * 0.2, -r * 0.74, r * 0.28, -r * 0.48);
  ctx.lineTo(r * 0.22, -r * 0.42);
  ctx.lineTo(-r * 0.22, -r * 0.42);
  ctx.closePath();
  ctx.fill();

  // Closed/pained eyes
  ctx.strokeStyle = '#1a0d0d';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.14, -r * 0.46);
  ctx.lineTo(-r * 0.04, -r * 0.46);
  ctx.moveTo(r * 0.04, -r * 0.46);
  ctx.lineTo(r * 0.14, -r * 0.46);
  ctx.stroke();
  // Furrowed brow
  ctx.beginPath();
  ctx.moveTo(-r * 0.12, -r * 0.52);
  ctx.lineTo(-r * 0.04, -r * 0.50);
  ctx.moveTo(r * 0.04, -r * 0.50);
  ctx.lineTo(r * 0.12, -r * 0.52);
  ctx.stroke();
  // Bloody scratch on cheek
  ctx.strokeStyle = '#7a1010';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-r * 0.18, -r * 0.34);
  ctx.lineTo(-r * 0.06, -r * 0.40);
  ctx.stroke();

  ctx.restore();
}

// --- Cal — wiry young hunter, brown leathers --------------------------------

function drawCal(ctx, t, r) {
  const bob = Math.sin(t * 2.2) * 1.2;
  drawShadow(ctx, r);
  ctx.save();
  ctx.translate(0, bob);

  // Leather hunter's vest — green-brown
  const vest = ctx.createLinearGradient(0, -r * 0.3, 0, r);
  vest.addColorStop(0, '#8a7a3a');
  vest.addColorStop(0.6, '#5a4a18');
  vest.addColorStop(1, '#2a200a');
  ctx.fillStyle = vest;
  ctx.beginPath();
  ctx.moveTo(-r * 0.34, -r * 0.30);
  ctx.lineTo(r * 0.34, -r * 0.30);
  ctx.bezierCurveTo(r * 0.55, r * 0.0, r * 0.78, r * 0.5, r * 0.8, r);
  ctx.quadraticCurveTo(0, r * 1.04, -r * 0.8, r);
  ctx.bezierCurveTo(-r * 0.78, r * 0.5, -r * 0.55, r * 0.0, -r * 0.34, -r * 0.30);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1a0d04';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // Cross-strap from quiver
  ctx.strokeStyle = '#3a2818';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.25, -r * 0.22);
  ctx.lineTo(r * 0.20, r * 0.40);
  ctx.stroke();

  // Quiver behind right shoulder
  ctx.fillStyle = '#3a2818';
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(r * 0.18, -r * 0.05, r * 0.20, r * 0.55, 2) : ctx.rect(r * 0.18, -r * 0.05, r * 0.20, r * 0.55);
  ctx.fill();
  ctx.strokeStyle = '#1a0d04';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Arrow fletching peeking out
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = ['#aa3030', '#c8aa18', '#aa3030'][i];
    ctx.beginPath();
    ctx.moveTo(r * 0.22 + i * 0.04 * r, -r * 0.18);
    ctx.lineTo(r * 0.20 + i * 0.04 * r, -r * 0.06);
    ctx.lineTo(r * 0.26 + i * 0.04 * r, -r * 0.06);
    ctx.closePath();
    ctx.fill();
  }

  // Head — tan, weathered
  ctx.fillStyle = '#e8c8a0';
  ctx.beginPath();
  ctx.arc(0, -r * 0.45, r * 0.27, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7a4a28';
  ctx.lineWidth = 0.6;
  ctx.stroke();

  // Dark blond shaggy hair
  ctx.fillStyle = '#a08240';
  ctx.beginPath();
  ctx.moveTo(-r * 0.27, -r * 0.50);
  ctx.quadraticCurveTo(-r * 0.18, -r * 0.72, 0, -r * 0.70);
  ctx.quadraticCurveTo(r * 0.18, -r * 0.72, r * 0.27, -r * 0.50);
  ctx.lineTo(r * 0.22, -r * 0.42);
  ctx.lineTo(-r * 0.22, -r * 0.42);
  ctx.closePath();
  ctx.fill();

  // Eyes — alert, brown
  ctx.fillStyle = '#3a2010';
  ctx.beginPath();
  ctx.arc(-r * 0.10, -r * 0.45, Math.max(1.4, r * 0.05), 0, Math.PI * 2);
  ctx.arc(r * 0.10, -r * 0.45, Math.max(1.4, r * 0.05), 0, Math.PI * 2);
  ctx.fill();
  // Glint
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-r * 0.085, -r * 0.46, Math.max(0.6, r * 0.018), 0, Math.PI * 2);
  ctx.arc(r * 0.115, -r * 0.46, Math.max(0.6, r * 0.018), 0, Math.PI * 2);
  ctx.fill();
  // Small grateful smile
  ctx.strokeStyle = '#3a2010';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, -r * 0.30, r * 0.08, 0.3, Math.PI - 0.3);
  ctx.stroke();

  ctx.restore();
}

// --- Cal — pinned against tree, wounded, alert ------------------------------
// Pre-rescue pose: slumped at the base of a pine, one knee up, defensive arm
// raised, bow snapped at his side, blood on the shoulder, sweat sheen on the
// brow, alternating distress glyph above. Same color palette as drawCal so the
// player reads them as the same person.

function drawCalPinned(ctx, t, r) {
  // Shallow ragged breathing — quicker than Bren (he's still fighting).
  const pant = Math.sin(t * 4.2) * 0.6;
  // Wider shadow (he's down on the ground).
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.95, r * 1.10, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(0, pant);

  // Pine-trunk slab behind him — bark texture, suggests he's pinned to it.
  ctx.save();
  ctx.translate(0, -r * 0.05);
  const bark = ctx.createLinearGradient(-r * 0.55, 0, r * 0.55, 0);
  bark.addColorStop(0, '#2a1808');
  bark.addColorStop(0.5, '#5a3a18');
  bark.addColorStop(1, '#2a1808');
  ctx.fillStyle = bark;
  ctx.beginPath();
  ctx.rect(-r * 0.55, -r * 0.85, r * 1.10, r * 1.10);
  ctx.fill();
  ctx.strokeStyle = '#1a0d04';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Bark grooves
  ctx.strokeStyle = '#1a0d04';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 5; i++) {
    const x = -r * 0.4 + i * r * 0.22;
    ctx.beginPath();
    ctx.moveTo(x, -r * 0.85);
    ctx.bezierCurveTo(x + r * 0.04, -r * 0.5, x - r * 0.04, -r * 0.1, x + r * 0.02, r * 0.25);
    ctx.stroke();
  }
  ctx.restore();

  // Body tilts slightly to the right — he's slumped against the trunk.
  ctx.rotate(0.12);

  // Hunter's vest — same green-brown as drawCal, but torn at the hem
  const vest = ctx.createLinearGradient(0, -r * 0.3, 0, r);
  vest.addColorStop(0, '#8a7a3a');
  vest.addColorStop(0.6, '#5a4a18');
  vest.addColorStop(1, '#2a200a');
  ctx.fillStyle = vest;
  ctx.beginPath();
  ctx.moveTo(-r * 0.34, -r * 0.30);
  ctx.lineTo(r * 0.34, -r * 0.30);
  ctx.bezierCurveTo(r * 0.55, r * 0.0, r * 0.78, r * 0.5, r * 0.8, r);
  // Torn ragged hem
  ctx.lineTo(r * 0.55, r * 0.92);
  ctx.lineTo(r * 0.30, r);
  ctx.lineTo(0, r * 0.94);
  ctx.lineTo(-r * 0.30, r);
  ctx.lineTo(-r * 0.55, r * 0.92);
  ctx.bezierCurveTo(-r * 0.78, r * 0.5, -r * 0.55, r * 0.0, -r * 0.34, -r * 0.30);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1a0d04';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Blood seep at the left shoulder — wolf bite.
  ctx.fillStyle = '#7a1010';
  ctx.beginPath();
  ctx.moveTo(-r * 0.30, -r * 0.18);
  ctx.quadraticCurveTo(-r * 0.45, r * 0.05, -r * 0.32, r * 0.30);
  ctx.quadraticCurveTo(-r * 0.20, r * 0.10, -r * 0.18, -r * 0.20);
  ctx.closePath();
  ctx.fill();
  // Wet glint on the blood
  ctx.fillStyle = 'rgba(255,80,80,0.45)';
  ctx.beginPath();
  ctx.arc(-r * 0.32, r * 0.05, r * 0.045, 0, Math.PI * 2);
  ctx.fill();

  // Snapped bow lying across his lap — string broken, top half angled away.
  ctx.save();
  ctx.translate(r * 0.10, r * 0.55);
  ctx.rotate(-0.3);
  ctx.strokeStyle = '#3a2818';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  // Lower limb (intact-ish)
  ctx.beginPath();
  ctx.moveTo(-r * 0.35, r * 0.08);
  ctx.quadraticCurveTo(-r * 0.05, -r * 0.04, r * 0.05, -r * 0.10);
  ctx.stroke();
  // Snap break — splinter
  ctx.strokeStyle = '#a88848';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(r * 0.05, -r * 0.10);
  ctx.lineTo(r * 0.10, -r * 0.05);
  ctx.lineTo(r * 0.08, -r * 0.14);
  ctx.lineTo(r * 0.13, -r * 0.10);
  ctx.stroke();
  // Upper limb (snapped off, lying further along)
  ctx.strokeStyle = '#3a2818';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(r * 0.16, -r * 0.04);
  ctx.quadraticCurveTo(r * 0.30, -r * 0.18, r * 0.42, -r * 0.30);
  ctx.stroke();
  // Frayed string trailing
  ctx.strokeStyle = '#d8c8a0';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(-r * 0.32, r * 0.06);
  ctx.quadraticCurveTo(0, r * 0.18, r * 0.13, -r * 0.04);
  ctx.stroke();
  ctx.restore();

  // Defensive arm raised in front of his face — the camera-right arm comes up.
  ctx.save();
  ctx.translate(r * 0.05, -r * 0.05);
  // Sleeve
  ctx.fillStyle = '#5a4a18';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(r * 0.20, -r * 0.20, r * 0.32, -r * 0.42);
  ctx.lineTo(r * 0.42, -r * 0.36);
  ctx.quadraticCurveTo(r * 0.30, -r * 0.12, r * 0.10, r * 0.06);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1a0d04';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Hand at the top of the arc — clenched
  ctx.fillStyle = '#e8c8a0';
  ctx.beginPath();
  ctx.arc(r * 0.36, -r * 0.42, r * 0.10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7a4a28';
  ctx.lineWidth = 0.6;
  ctx.stroke();
  // Knuckle lines
  ctx.strokeStyle = '#7a4a28';
  ctx.lineWidth = 0.7;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(r * 0.32 + i * r * 0.03, -r * 0.48);
    ctx.lineTo(r * 0.34 + i * r * 0.03, -r * 0.44);
    ctx.stroke();
  }
  ctx.restore();

  // Head — tan, sweat-sheened, looking up to camera-right (toward attacker)
  ctx.save();
  ctx.translate(-r * 0.06, 0);
  ctx.rotate(-0.15);
  ctx.fillStyle = '#e8c8a0';
  ctx.beginPath();
  ctx.arc(0, -r * 0.45, r * 0.27, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7a4a28';
  ctx.lineWidth = 0.6;
  ctx.stroke();
  // Sweat highlight on the brow
  ctx.fillStyle = 'rgba(255,255,255,0.30)';
  ctx.beginPath();
  ctx.arc(-r * 0.10, -r * 0.55, r * 0.08, 0, Math.PI * 2);
  ctx.fill();
  // Sweat bead trickling
  ctx.fillStyle = 'rgba(180,220,255,0.7)';
  ctx.beginPath();
  ctx.arc(r * 0.05, -r * 0.32 + Math.sin(t * 3) * 0.6, r * 0.025, 0, Math.PI * 2);
  ctx.fill();

  // Shaggy brown hair, damp and pushed back
  ctx.fillStyle = '#5a3a18';
  ctx.beginPath();
  ctx.moveTo(-r * 0.26, -r * 0.48);
  ctx.quadraticCurveTo(-r * 0.18, -r * 0.74, 0, -r * 0.72);
  ctx.quadraticCurveTo(r * 0.20, -r * 0.74, r * 0.26, -r * 0.46);
  ctx.lineTo(r * 0.22, -r * 0.42);
  ctx.lineTo(-r * 0.22, -r * 0.42);
  ctx.closePath();
  ctx.fill();

  // Wide eyes — alert, fearful. Pupil shifts slightly with t to read "tracking".
  const eyeShift = Math.sin(t * 2.6) * 0.5;
  ctx.fillStyle = '#f8e8c8';
  ctx.beginPath();
  ctx.arc(-r * 0.08, -r * 0.46, r * 0.055, 0, Math.PI * 2);
  ctx.arc(r * 0.08, -r * 0.46, r * 0.055, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a0d0d';
  ctx.beginPath();
  ctx.arc(-r * 0.08 + eyeShift * 0.4, -r * 0.46, r * 0.025, 0, Math.PI * 2);
  ctx.arc(r * 0.08 + eyeShift * 0.4, -r * 0.46, r * 0.025, 0, Math.PI * 2);
  ctx.fill();
  // Furrowed brow
  ctx.strokeStyle = '#3a2014';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.16, -r * 0.55);
  ctx.lineTo(-r * 0.04, -r * 0.52);
  ctx.moveTo(r * 0.04, -r * 0.52);
  ctx.lineTo(r * 0.16, -r * 0.55);
  ctx.stroke();
  // Open mouth — gritted teeth
  ctx.fillStyle = '#3a1a0d';
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.30, r * 0.07, r * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();
  // Teeth glint
  ctx.fillStyle = '#f4eecf';
  ctx.beginPath();
  ctx.rect(-r * 0.055, -r * 0.32, r * 0.11, r * 0.018);
  ctx.fill();
  // Bloody scratch across cheek
  ctx.strokeStyle = '#7a1010';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-r * 0.18, -r * 0.34);
  ctx.lineTo(-r * 0.04, -r * 0.40);
  ctx.stroke();
  ctx.restore();

  ctx.restore();

  // Distress glyph (! mark) floating above — pulses on/off every ~0.9s for
  // an extra layer of "this guy is in trouble" readability at a glance.
  const pulse = (Math.sin(t * 6.5) + 1) * 0.5;
  if (pulse > 0.5) {
    const ga = (pulse - 0.5) * 2;
    ctx.save();
    ctx.translate(r * 0.55, -r * 1.05);
    ctx.fillStyle = 'rgba(255,80,80,' + (0.75 * ga) + ')';
    ctx.strokeStyle = 'rgba(40,0,0,' + (0.85 * ga) + ')';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-r * 0.06, -r * 0.18);
    ctx.lineTo(r * 0.06, -r * 0.18);
    ctx.lineTo(r * 0.03, r * 0.06);
    ctx.lineTo(-r * 0.03, r * 0.06);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, r * 0.14, r * 0.04, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}

// --- Generic villager fallback ----------------------------------------------
// Used for any NPC without a dedicated sprite.

function drawGeneric(ctx, npc, t, r) {
  const bob = Math.sin(t * 2) * 1.5;
  drawShadow(ctx, r);
  ctx.save();
  ctx.translate(0, bob);
  ctx.fillStyle = npc.color || '#a0a0a0';
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = _darker(npc.color || '#a0a0a0');
  ctx.beginPath();
  ctx.arc(0, -r * 0.25, r * 0.85, Math.PI, 0);
  ctx.fill();
  drawFace(ctx, r, { eyeY: -0.05 });
  ctx.restore();
}

function _darker(hex) {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return hex;
  const r = Math.max(0, parseInt(m[1], 16) - 60);
  const g = Math.max(0, parseInt(m[2], 16) - 60);
  const b = Math.max(0, parseInt(m[3], 16) - 60);
  return '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
}
