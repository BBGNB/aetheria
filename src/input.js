// Drag-to-move joystick (same shape as the previous game). Also exposes
// `tapAt(x, y)` events for menu-style scenes via the `tap` callback.

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.active = false;
    this.origin = { x: 0, y: 0 };
    this.current = { x: 0, y: 0 };
    this.dirX = 0; this.dirY = 0;
    this.magnitude = 0;
    this.pointerId = null;
    this.onTap = null;
    this._maybeTap = null;

    canvas.addEventListener('pointerdown', e => {
      if (this.pointerId !== null) return;
      this.pointerId = e.pointerId ?? 'mouse';
      const p = this._point(e);
      this.origin.x = p.x; this.origin.y = p.y;
      this.current.x = p.x; this.current.y = p.y;
      this.active = true;
      this._maybeTap = { x: p.x, y: p.y, t: performance.now() };
      canvas.setPointerCapture?.(e.pointerId);
    });
    canvas.addEventListener('pointermove', e => {
      if (!this.active || (e.pointerId ?? 'mouse') !== this.pointerId) return;
      const p = this._point(e);
      this.current.x = p.x; this.current.y = p.y;
      this._compute();
      if (this._maybeTap) {
        const dx = p.x - this._maybeTap.x, dy = p.y - this._maybeTap.y;
        if (dx * dx + dy * dy > 12 * 12) this._maybeTap = null;
      }
    });
    const up = (e) => {
      if ((e.pointerId ?? 'mouse') !== this.pointerId) return;
      const wasTap = this._maybeTap && (performance.now() - this._maybeTap.t) < 350;
      const tapPos = wasTap ? { ...this._maybeTap } : null;
      this.active = false;
      this.pointerId = null;
      this.dirX = 0; this.dirY = 0; this.magnitude = 0;
      this._maybeTap = null;
      if (tapPos && this.onTap) this.onTap(tapPos.x, tapPos.y);
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    window.addEventListener('blur', () => { this.active = false; this.dirX = this.dirY = this.magnitude = 0; this.pointerId = null; });
  }

  _point(e) {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  _compute() {
    const dx = this.current.x - this.origin.x;
    const dy = this.current.y - this.origin.y;
    const len = Math.hypot(dx, dy);
    const deadzone = 10;
    if (len < deadzone) { this.dirX = 0; this.dirY = 0; this.magnitude = 0; return; }
    const maxR = 70;
    const mag = Math.min(1, (len - deadzone) / (maxR - deadzone));
    this.dirX = dx / len;
    this.dirY = dy / len;
    this.magnitude = mag;
    if (len > maxR + 30) {
      this.origin.x = this.current.x - this.dirX * maxR;
      this.origin.y = this.current.y - this.dirY * maxR;
    }
  }

  drawJoystick(ctx) {
    if (!this.active || this.magnitude < 0.05) return;
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.origin.x, this.origin.y, 50, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.origin.x + this.dirX * this.magnitude * 50,
            this.origin.y + this.dirY * this.magnitude * 50, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
