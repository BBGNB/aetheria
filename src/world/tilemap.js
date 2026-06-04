import { TILE_BY_ID, TILE_SIZE, TILES } from './tiles.js';

export class TileMap {
  constructor(map) {
    this.tiles = map.tiles;
    this.h = this.tiles.length;
    this.w = this.tiles[0].length;
    this.tileSize = TILE_SIZE;
    this.worldW = this.w * this.tileSize;
    this.worldH = this.h * this.tileSize;
  }

  tileAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return TILES.TREE;
    return TILE_BY_ID[this.tiles[ty][tx]] || TILES.GRASS;
  }

  // Is the given pixel position walkable for an entity of given radius?
  // Two pass system:
  //   1. Bush rect colliders — bushes use a small AABB sub-rect inside the
  //      tile (rect-vs-circle test). Smaller than a full tile so the player
  //      can step very close, but straight-edged so parallel slides are clean.
  //   2. Solid rectangular tiles (walls, water, roofs, TREES, stone, etc.) —
  //      cardinal sampling. Tree-tiles use the same full-tile-AABB rule as
  //      roofs, so a row of boundary trees feels like a clean wall (no
  //      sticking on the curved valleys between adjacent tree circles).
  //   3. Lantern posts — small circle (they really are thin poles).
  walkable(x, y, radius = 12) {
    const ts = this.tileSize;
    const minTx = Math.floor((x - radius) / ts);
    const maxTx = Math.floor((x + radius) / ts);
    const minTy = Math.floor((y - radius) / ts);
    const maxTy = Math.floor((y + radius) / ts);

    // ---- Pass 1: lantern posts (small circle) ----------------------------
    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        const tile = this.tileAt(tx, ty);
        if (tile !== TILES.LANTERN) continue;
        const cx = tx * ts + ts * 0.5;
        const cy = ty * ts + ts * 0.6;
        const rr = ts * 0.16;
        const dx = x - cx, dy = y - cy;
        const reach = rr + radius;
        if (dx * dx + dy * dy < reach * reach) return false;
      }
    }

    // ---- Pass 2: bush sub-rect (rect-vs-circle) --------------------------
    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        const tile = this.tileAt(tx, ty);
        if (tile !== TILES.BUSH) continue;
        const rx1 = tx * ts + ts * 0.20;
        const ry1 = ty * ts + ts * 0.34;
        const rx2 = tx * ts + ts * 0.80;
        const ry2 = ty * ts + ts * 0.82;
        const px = Math.max(rx1, Math.min(rx2, x));
        const py = Math.max(ry1, Math.min(ry2, y));
        const dx = x - px, dy = y - py;
        if (dx * dx + dy * dy < radius * radius) return false;
      }
    }

    // ---- Pass 3: all other non-walkable tiles (cardinal sampling) --------
    // Trees are now in this pass too — full-tile AABB. A line of boundary
    // trees reads as a clean wall, no curved sticking.
    const samples = [
      [x - radius, y],
      [x + radius, y],
      [x, y - radius],
      [x, y + radius],
      [x, y],
    ];
    for (const [sx, sy] of samples) {
      const tx = Math.floor(sx / ts);
      const ty = Math.floor(sy / ts);
      const tile = this.tileAt(tx, ty);
      if (tile.walk) continue;
      // Already covered by earlier passes — skip so we don't double-test.
      if (tile === TILES.BUSH || tile === TILES.LANTERN) continue;
      return false;
    }
    return true;
  }

  draw(ctx, camX, camY, viewW, viewH, time = 0) {
    const ts = this.tileSize;
    const startX = Math.max(0, Math.floor(camX / ts));
    const startY = Math.max(0, Math.floor(camY / ts));
    const endX = Math.min(this.w, Math.ceil((camX + viewW) / ts) + 1);
    const endY = Math.min(this.h, Math.ceil((camY + viewH) / ts) + 1);

    for (let ty = startY; ty < endY; ty++) {
      for (let tx = startX; tx < endX; tx++) {
        const t = TILE_BY_ID[this.tiles[ty][tx]];
        const x = tx * ts;
        const y = ty * ts;
        this._drawTile(ctx, t, tx, ty, x, y, ts, time);
      }
    }
  }

  _drawTile(ctx, t, tx, ty, x, y, ts, time = 0) {
    // Base fill — alternate alt color for subtle texture.
    const useAlt = t.alt && ((tx + ty) & 1);
    ctx.fillStyle = useAlt ? t.alt : t.color;
    ctx.fillRect(x, y, ts, ts);

    if (t === TILES.TREE) {
      // Tree on top of grass
      ctx.fillStyle = '#2f6a30';
      ctx.fillRect(x, y, ts, ts);
      // Trunk
      ctx.fillStyle = '#5a3a18';
      ctx.fillRect(x + ts * 0.42, y + ts * 0.55, ts * 0.16, ts * 0.3);
      // Foliage
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.arc(x + ts * 0.5, y + ts * 0.45, ts * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2a5a2a';
      ctx.beginPath();
      ctx.arc(x + ts * 0.5 - 4, y + ts * 0.4, ts * 0.18, 0, Math.PI * 2);
      ctx.fill();
    } else if (t === TILES.WATER) {
      // Animated ripples — flow with time, offset per-tile so the surface
      // doesn't pulse in lockstep across the whole pool.
      const phase = time * 1.4 + tx * 0.55 + ty * 0.37;
      const drift = Math.sin(phase) * 4;
      const drift2 = Math.cos(phase * 0.9 + 1.2) * 4;
      ctx.strokeStyle = 'rgba(220,240,255,0.32)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const y1 = y + ts * (0.32 + Math.sin(phase) * 0.04);
      const y2 = y + ts * (0.66 + Math.sin(phase + 1.7) * 0.04);
      ctx.moveTo(x + 4 + drift, y1);
      ctx.lineTo(x + ts * 0.5 + drift, y1);
      ctx.moveTo(x + ts * 0.5 + drift2, y2);
      ctx.lineTo(x + ts - 4 + drift2, y2);
      ctx.stroke();
      // Subtle shimmer
      const shimmer = (Math.sin(phase * 1.3) + 1) * 0.5;
      ctx.fillStyle = `rgba(255,255,255,${0.04 + shimmer * 0.06})`;
      ctx.fillRect(x, y, ts, ts);
    } else if (t === TILES.STONE) {
      ctx.fillStyle = '#3a3a44';
      ctx.fillRect(x + 4, y + 4, ts - 8, ts - 8);
      ctx.fillStyle = '#6a6a7a';
      ctx.fillRect(x + 8, y + 8, 6, 6);
      ctx.fillRect(x + ts - 18, y + ts - 16, 8, 6);
    } else if (t === TILES.COBBLE) {
      // Subtle grout lines.
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, ts - 1, ts - 1);
    } else if (t === TILES.WALL) {
      // Stone block with mortar
      ctx.fillStyle = '#3a2818';
      ctx.fillRect(x + 2, y + 2, ts - 4, ts - 4);
      ctx.fillStyle = t.color;
      ctx.fillRect(x + 4, y + 4, ts - 8, ts - 8);
      ctx.strokeStyle = '#2a1808';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 4, y + ts * 0.5);
      ctx.lineTo(x + ts - 4, y + ts * 0.5);
      ctx.stroke();
    } else if (t === TILES.ROOF) {
      ctx.fillStyle = '#3a7a3b';
      ctx.fillRect(x, y, ts, ts);
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.moveTo(x, y + ts);
      ctx.lineTo(x + ts * 0.5, y + ts * 0.15);
      ctx.lineTo(x + ts, y + ts);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#4a1a1a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i < 4; i++) {
        const yy = y + ts * (0.15 + i * 0.2);
        ctx.moveTo(x + 2, yy);
        ctx.lineTo(x + ts - 2, yy);
      }
      ctx.stroke();
    } else if (t === TILES.DOOR) {
      // Cobble underneath
      ctx.fillStyle = '#7a7a85';
      ctx.fillRect(x, y, ts, ts);
      // Door panel
      ctx.fillStyle = t.color;
      ctx.fillRect(x + 6, y + 4, ts - 12, ts - 6);
      ctx.strokeStyle = '#1a0a00';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 6.5, y + 4.5, ts - 13, ts - 7);
      // Knob
      ctx.fillStyle = '#ffd84d';
      ctx.beginPath();
      ctx.arc(x + ts - 11, y + ts * 0.55, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (t === TILES.CFLOOR) {
      // Cave floor — speckled
      const seed = ((tx * 41) ^ (ty * 67)) & 0xff;
      if (seed % 5 === 0) {
        ctx.fillStyle = '#3a3540';
        ctx.fillRect(x + (seed % 12), y + ((seed * 3) % 12), 3, 3);
      }
    } else if (t === TILES.CWALL) {
      ctx.fillStyle = '#0a0810';
      ctx.fillRect(x, y, ts, ts);
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.arc(x + ts * 0.5, y + ts * 0.5, ts * 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (t === TILES.CAVE_MOUTH) {
      // Rocky outcrop with a dark opening. The surround is neutral earth so
      // the tile reads naturally both in the meadow border and the cave wall.
      ctx.fillStyle = '#2a1f18';
      ctx.fillRect(x, y, ts, ts);
      // Outer rocky frame — broad arch
      ctx.fillStyle = '#5a4030';
      ctx.beginPath();
      ctx.moveTo(x + ts * 0.05, y + ts * 0.95);
      ctx.lineTo(x + ts * 0.1,  y + ts * 0.5);
      ctx.quadraticCurveTo(x + ts * 0.5, y + ts * 0.05, x + ts * 0.9, y + ts * 0.5);
      ctx.lineTo(x + ts * 0.95, y + ts * 0.95);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#1a0e08';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Inner darkness — the actual opening
      ctx.fillStyle = '#050306';
      ctx.beginPath();
      ctx.moveTo(x + ts * 0.20, y + ts * 0.92);
      ctx.lineTo(x + ts * 0.24, y + ts * 0.55);
      ctx.quadraticCurveTo(x + ts * 0.5, y + ts * 0.18, x + ts * 0.76, y + ts * 0.55);
      ctx.lineTo(x + ts * 0.80, y + ts * 0.92);
      ctx.closePath();
      ctx.fill();
      // Faint violet inner glow — Rift residue leaking out
      const gradC = ctx.createRadialGradient(x + ts * 0.5, y + ts * 0.65, 0, x + ts * 0.5, y + ts * 0.65, ts * 0.42);
      gradC.addColorStop(0, 'rgba(120,60,200,0.32)');
      gradC.addColorStop(1, 'rgba(80,30,120,0)');
      ctx.fillStyle = gradC;
      ctx.fillRect(x, y, ts, ts);
      // A couple of rocky chips at the base for texture
      ctx.fillStyle = '#7a5a40';
      ctx.fillRect(x + ts * 0.16, y + ts * 0.88, ts * 0.1, ts * 0.07);
      ctx.fillRect(x + ts * 0.78, y + ts * 0.86, ts * 0.08, ts * 0.08);
    } else if (t === TILES.RUG) {
      ctx.fillStyle = '#5a2020';
      ctx.fillRect(x + 2, y + 2, ts - 4, ts - 4);
      ctx.fillStyle = t.color;
      ctx.fillRect(x + 5, y + 5, ts - 10, ts - 10);
    } else if (t === TILES.BUSH) {
      // Grass base + clustered leaf puffs
      ctx.fillStyle = '#3a7a3b';
      ctx.fillRect(x, y, ts, ts);
      const seed = ((tx * 53) ^ (ty * 79)) & 0xff;
      const phase = time * 1.2 + seed * 0.1;
      const sway = Math.sin(phase) * 1.2;
      ctx.fillStyle = '#2a5a2a';
      ctx.beginPath();
      ctx.arc(x + ts * 0.5 + sway, y + ts * 0.55, ts * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a3a1a';
      ctx.beginPath();
      ctx.arc(x + ts * 0.35 + sway * 0.6, y + ts * 0.45, ts * 0.18, 0, Math.PI * 2);
      ctx.arc(x + ts * 0.65 + sway * 0.4, y + ts * 0.5,  ts * 0.18, 0, Math.PI * 2);
      ctx.arc(x + ts * 0.5  + sway * 0.5, y + ts * 0.35, ts * 0.16, 0, Math.PI * 2);
      ctx.fill();
      // A small berry on some bushes
      if (seed % 4 === 0) {
        ctx.fillStyle = '#ff5a6e';
        ctx.beginPath();
        ctx.arc(x + ts * 0.6 + sway * 0.4, y + ts * 0.4, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (t === TILES.BARREL) {
      // Wooden barrel with iron bands
      ctx.fillStyle = '#3a7a3b';
      ctx.fillRect(x, y, ts, ts);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(x + ts * 0.5, y + ts * 0.9, ts * 0.32, ts * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
      // Body
      const bg = ctx.createLinearGradient(x, y, x + ts, y);
      bg.addColorStop(0, '#3a2010');
      bg.addColorStop(0.5, '#7a4a20');
      bg.addColorStop(1, '#3a2010');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.ellipse(x + ts * 0.5, y + ts * 0.55, ts * 0.32, ts * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1a0a04';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      // Iron bands
      ctx.strokeStyle = '#3a3a44';
      ctx.lineWidth = 2;
      for (const off of [0.3, 0.55, 0.8]) {
        ctx.beginPath();
        ctx.ellipse(x + ts * 0.5, y + ts * off, ts * 0.32, ts * 0.05, 0, 0, Math.PI);
        ctx.stroke();
      }
      // Top rim
      ctx.fillStyle = '#2a1808';
      ctx.beginPath();
      ctx.ellipse(x + ts * 0.5, y + ts * 0.17, ts * 0.3, ts * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();
      // Plank lines down the front
      ctx.strokeStyle = '#1a0a04';
      ctx.lineWidth = 0.8;
      for (const xo of [-0.18, 0, 0.18]) {
        ctx.beginPath();
        ctx.moveTo(x + ts * (0.5 + xo), y + ts * 0.2);
        ctx.lineTo(x + ts * (0.5 + xo), y + ts * 0.92);
        ctx.stroke();
      }
    } else if (t === TILES.CRATE) {
      ctx.fillStyle = '#3a7a3b';
      ctx.fillRect(x, y, ts, ts);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(x + ts * 0.5, y + ts * 0.9, ts * 0.34, ts * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();
      // Box body
      ctx.fillStyle = '#7a5028';
      ctx.fillRect(x + ts * 0.15, y + ts * 0.22, ts * 0.7, ts * 0.7);
      ctx.strokeStyle = '#3a2010';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + ts * 0.15, y + ts * 0.22, ts * 0.7, ts * 0.7);
      // Plank seams
      ctx.beginPath();
      ctx.moveTo(x + ts * 0.15, y + ts * 0.45); ctx.lineTo(x + ts * 0.85, y + ts * 0.45);
      ctx.moveTo(x + ts * 0.15, y + ts * 0.68); ctx.lineTo(x + ts * 0.85, y + ts * 0.68);
      ctx.moveTo(x + ts * 0.5, y + ts * 0.22); ctx.lineTo(x + ts * 0.5, y + ts * 0.92);
      ctx.stroke();
      // Nails
      ctx.fillStyle = '#3a3a3a';
      for (const cx of [0.2, 0.8]) for (const cy of [0.27, 0.55, 0.86]) {
        ctx.beginPath();
        ctx.arc(x + ts * cx, y + ts * cy, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (t === TILES.FENCE) {
      ctx.fillStyle = '#3a7a3b';
      ctx.fillRect(x, y, ts, ts);
      // Posts
      ctx.fillStyle = '#5a3a18';
      ctx.fillRect(x + ts * 0.1, y + ts * 0.25, ts * 0.12, ts * 0.6);
      ctx.fillRect(x + ts * 0.78, y + ts * 0.25, ts * 0.12, ts * 0.6);
      // Rails
      ctx.fillStyle = '#8a6a3a';
      ctx.fillRect(x, y + ts * 0.35, ts, ts * 0.08);
      ctx.fillRect(x, y + ts * 0.62, ts, ts * 0.08);
      // Post caps
      ctx.fillStyle = '#4a2a14';
      ctx.fillRect(x + ts * 0.08, y + ts * 0.22, ts * 0.16, ts * 0.05);
      ctx.fillRect(x + ts * 0.76, y + ts * 0.22, ts * 0.16, ts * 0.05);
    } else if (t === TILES.LANTERN) {
      // Cobble base
      ctx.fillStyle = '#7a7a85';
      ctx.fillRect(x, y, ts, ts);
      // Post
      ctx.fillStyle = '#2a1a08';
      ctx.fillRect(x + ts * 0.45, y + ts * 0.25, ts * 0.1, ts * 0.65);
      // Cross arm at top
      ctx.fillStyle = '#2a1a08';
      ctx.fillRect(x + ts * 0.3, y + ts * 0.22, ts * 0.4, ts * 0.05);
      // Lantern hanging
      ctx.fillStyle = '#3a2a10';
      ctx.fillRect(x + ts * 0.36, y + ts * 0.27, ts * 0.28, ts * 0.22);
      ctx.strokeStyle = '#1a0a04';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + ts * 0.36, y + ts * 0.27, ts * 0.28, ts * 0.22);
      // Flickering flame
      const flick = 0.85 + 0.15 * Math.sin(time * 11 + tx + ty);
      const gx = x + ts * 0.5, gy = y + ts * 0.38;
      const gg = ctx.createRadialGradient(gx, gy, 0, gx, gy, ts * 0.4);
      gg.addColorStop(0, `rgba(255,210,120,${0.95 * flick})`);
      gg.addColorStop(0.5, `rgba(255,160,60,${0.5 * flick})`);
      gg.addColorStop(1, 'rgba(255,160,60,0)');
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(gx, gy, ts * 0.4, 0, Math.PI * 2);
      ctx.fill();
      // Flame core
      ctx.fillStyle = '#ffe6a0';
      ctx.shadowColor = '#ffae3b'; ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(gx, gy, ts * 0.06, ts * 0.1 * flick, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (t === TILES.FOUNTAIN) {
      // Stone basin with animated water
      ctx.fillStyle = '#7a7a85';
      ctx.fillRect(x, y, ts, ts);
      // Outer stone basin
      ctx.fillStyle = '#5a5a6a';
      ctx.beginPath();
      ctx.ellipse(x + ts * 0.5, y + ts * 0.6, ts * 0.45, ts * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2a2a3a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Water surface
      const phase = time * 1.5 + tx + ty;
      const wg = ctx.createRadialGradient(x + ts * 0.5, y + ts * 0.55, 0, x + ts * 0.5, y + ts * 0.55, ts * 0.4);
      wg.addColorStop(0, '#cfeaff');
      wg.addColorStop(0.6, '#3bb6ff');
      wg.addColorStop(1, '#1a4a7a');
      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.ellipse(x + ts * 0.5, y + ts * 0.55, ts * 0.36, ts * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      // Animated ripples
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const a = 0.4 + Math.sin(phase + i) * 0.05;
        ctx.beginPath();
        ctx.ellipse(x + ts * 0.5, y + ts * 0.55, ts * (0.1 + i * 0.1), ts * (0.05 + i * 0.05), 0, Math.PI * a, Math.PI - Math.PI * a);
        ctx.stroke();
      }
      // Central spout — water pillar
      ctx.fillStyle = '#cfeaff';
      ctx.shadowColor = '#7adaff'; ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(x + ts * 0.5, y + ts * 0.35, ts * 0.06, ts * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Spout droplets
      for (let i = 0; i < 4; i++) {
        const dp = (phase + i * 0.4) % 1;
        const dx = (i - 1.5) * 4;
        const dy = -dp * ts * 0.45;
        ctx.fillStyle = `rgba(207,234,255,${1 - dp})`;
        ctx.beginPath();
        ctx.arc(x + ts * 0.5 + dx, y + ts * 0.4 + dy, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (t === TILES.HEDGE) {
      // Tight low hedge — denser than a bush, square-ish
      ctx.fillStyle = '#3a7a3b';
      ctx.fillRect(x, y, ts, ts);
      ctx.fillStyle = '#1a3a1a';
      ctx.fillRect(x + ts * 0.08, y + ts * 0.2, ts * 0.84, ts * 0.7);
      // Leafy texture
      ctx.fillStyle = '#2a5a2a';
      const seedH = ((tx * 43) ^ (ty * 89)) & 0xff;
      for (let i = 0; i < 7; i++) {
        const dx = ((seedH * (i + 1)) % 10) / 10 * ts * 0.8 + ts * 0.1;
        const dy = ((seedH * (i + 3)) % 10) / 10 * ts * 0.6 + ts * 0.22;
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (t === TILES.SIGN) {
      ctx.fillStyle = '#3a7a3b';
      ctx.fillRect(x, y, ts, ts);
      // Post
      ctx.fillStyle = '#3a2010';
      ctx.fillRect(x + ts * 0.46, y + ts * 0.45, ts * 0.08, ts * 0.45);
      // Plank
      ctx.fillStyle = '#a0764a';
      ctx.fillRect(x + ts * 0.1, y + ts * 0.25, ts * 0.8, ts * 0.28);
      ctx.strokeStyle = '#3a2010';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x + ts * 0.1, y + ts * 0.25, ts * 0.8, ts * 0.28);
      // Carved arrow (>)
      ctx.strokeStyle = '#3a2010';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + ts * 0.3, y + ts * 0.32);
      ctx.lineTo(x + ts * 0.7, y + ts * 0.39);
      ctx.lineTo(x + ts * 0.3, y + ts * 0.46);
      ctx.stroke();
    } else if (t === TILES.GARDEN) {
      // Tilled bed + scattered flowers
      ctx.fillStyle = '#5a3a20';
      ctx.fillRect(x, y, ts, ts);
      ctx.strokeStyle = '#3a2010';
      ctx.lineWidth = 0.6;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(x, y + ts * (0.2 + i * 0.2));
        ctx.lineTo(x + ts, y + ts * (0.2 + i * 0.2));
        ctx.stroke();
      }
      // A couple of flowers swaying
      const seedG = ((tx * 41) ^ (ty * 73)) & 0xff;
      const sway = Math.sin(time * 1.6 + seedG * 0.13) * 1.2;
      const colors = ['#ff6f9c', '#ffd84d', '#a0e3ff', '#fff'];
      for (let i = 0; i < 2; i++) {
        const fx = x + ts * (0.3 + i * 0.4) + sway * 0.4;
        const fy = y + ts * 0.5;
        ctx.fillStyle = colors[(seedG + i) % colors.length];
        for (let j = 0; j < 5; j++) {
          const a = (j / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(fx + Math.cos(a) * 3, fy + Math.sin(a) * 3, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#ffd84d';
        ctx.beginPath();
        ctx.arc(fx, fy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (t === TILES.WELL) {
      // Cobble surround
      ctx.fillStyle = '#7a7a85';
      ctx.fillRect(x, y, ts, ts);
      // Outer rim (stone ring)
      ctx.fillStyle = '#4a4a55';
      ctx.beginPath();
      ctx.arc(x + ts * 0.5, y + ts * 0.5, ts * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1a1a25';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Dark water
      const wgw = ctx.createRadialGradient(x + ts * 0.5, y + ts * 0.5, 0, x + ts * 0.5, y + ts * 0.5, ts * 0.32);
      wgw.addColorStop(0, '#1a4a7a');
      wgw.addColorStop(1, '#0a1a3a');
      ctx.fillStyle = wgw;
      ctx.beginPath();
      ctx.arc(x + ts * 0.5, y + ts * 0.5, ts * 0.32, 0, Math.PI * 2);
      ctx.fill();
      // A glimmer (aetheric)
      const phaseW = time * 0.8 + tx + ty;
      const ga = 0.4 + 0.4 * Math.sin(phaseW);
      ctx.fillStyle = `rgba(170,80,255,${ga})`;
      ctx.shadowColor = '#a060ff'; ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(x + ts * (0.45 + Math.sin(phaseW * 1.3) * 0.04), y + ts * (0.48 + Math.cos(phaseW) * 0.05), ts * 0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Bricks suggested by short radial strokes
      ctx.strokeStyle = '#2a2a35';
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const x1 = x + ts * 0.5 + Math.cos(a) * ts * 0.35;
        const y1 = y + ts * 0.5 + Math.sin(a) * ts * 0.35;
        const x2 = x + ts * 0.5 + Math.cos(a) * ts * 0.42;
        const y2 = y + ts * 0.5 + Math.sin(a) * ts * 0.42;
        ctx.beginPath();
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    } else if (t === TILES.FLOWER) {
      // Flowers sway gently. The per-tile seed offsets the sway phase so
      // they don't all bob in unison.
      const seed = ((tx * 73856093) ^ (ty * 19349663)) & 0xff;
      const cx = x + ts * 0.5;
      const cy = y + ts * 0.5;
      const colors = ['#ff6f9c', '#ffd84d', '#a0e3ff', '#fff'];
      const phase = time * 1.6 + seed * 0.13;
      const sway = Math.sin(phase) * 1.6;
      ctx.fillStyle = colors[seed % colors.length];
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * 4 + sway * 0.5, cy + Math.sin(a) * 4 + sway * 0.2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ffd84d';
      ctx.beginPath(); ctx.arc(cx + sway * 0.5, cy + sway * 0.2, 1.8, 0, Math.PI * 2); ctx.fill();
    }
  }
}
