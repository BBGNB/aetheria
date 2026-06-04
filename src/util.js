export const TAU = Math.PI * 2;
export const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
export function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
