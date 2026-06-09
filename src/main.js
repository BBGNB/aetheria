import { Game } from './game.js';
import { Input } from './input.js';
import { UI } from './ui.js';
import { audio } from './audio.js';
import { OverworldMenu } from './menu.js';
import { CLASSES } from './data/classes.js';
import { Intro } from './scene/intro.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = new Input(canvas);
const ui = new UI();
const game = new Game(canvas, ctx, input, ui);
const menu = new OverworldMenu(game);
game.menu = menu;
ui.game = game;

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  game.resize(w, h);
}
window.addEventListener('resize', resize);
resize();

function bootAudio() {
  audio.init();
  if (audio.ctx?.state === 'suspended') audio.ctx.resume();
}

function startLoop() {
  menu.showButton();
  game.lastT = performance.now();
  requestAnimationFrame(t => game.tick(t));
}

function startNewWithClass(classId) {
  bootAudio();
  game.newGame(classId);
  startLoop();
}

function showClassPicker(onBack) {
  const picker = document.getElementById('classPicker');
  const cards = document.getElementById('classCards');
  cards.innerHTML = '';
  // White Mage is reserved for Lyra — she's depicted as one in the intro
  // and joins the party early in chapter 1, so picking White as the starting
  // class would duplicate her identity.
  for (const cls of CLASSES.filter(c => c.id !== 'white')) {
    const card = document.createElement('button');
    card.className = 'classCard';
    const top = topStats(cls);
    const statTags = top.map(s => `<span>${s}</span>`).join('');
    card.innerHTML = `
      <div class="ic">${cls.icon}</div>
      <div class="body">
        <div class="name">${cls.name}</div>
        <div class="desc">${cls.desc}</div>
        <div class="stats">${statTags}</div>
      </div>`;
    card.addEventListener('click', () => {
      picker.classList.add('hidden');
      startNewWithClass(cls.id);
    });
    cards.appendChild(card);
  }
  document.getElementById('classBackBtn').onclick = () => {
    picker.classList.add('hidden');
    if (onBack) onBack();
  };
  document.getElementById('startScreen').classList.add('hidden');
  document.getElementById('gameOver').classList.add('hidden');
  picker.classList.remove('hidden');
}

function topStats(cls) {
  // Rank growth fields and surface the top two as tags ("ATK ★★★", "DEF ★★").
  const order = ['atk','def','mag','spd','maxHp','maxMp'];
  const labels = { atk: 'ATK', def: 'DEF', mag: 'MAG', spd: 'SPD', maxHp: 'HP', maxMp: 'MP' };
  const ranked = order
    .map(k => ({ k, v: cls.growth[k] || 0, b: cls.base[k] || 0 }))
    .sort((a, b) => b.v - a.v);
  return ranked.slice(0, 3).map(r => `${labels[r.k]} ${r.b}`);
}

function startGame() {
  bootAudio();
  document.getElementById('startScreen').classList.add('hidden');
  const intro = new Intro(canvas, ctx, input, () => {
    showClassPicker(() => document.getElementById('startScreen').classList.remove('hidden'));
  });
  intro.start();
}
function continueGame() { bootAudio(); if (game.loadGame()) startLoop(); else startGame(); }
function restart() {
  bootAudio();
  if (game.hasSave()) { if (game.loadGame()) { startLoop(); return; } }
  startGame();
}

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('continueBtn').addEventListener('click', continueGame);
document.getElementById('restartBtn').addEventListener('click', restart);

// Show Continue if a save exists.
if (game.hasSave()) document.getElementById('continueBtn').classList.remove('hidden');

// Debug warps — `?warp=cal` for the Brookside rescue beat, `?warp=warden`
// for the Hollow Warden boss (Lv7 Ranger Hero + Lv7 Lyra, mid-cave spawn).
const warp = new URLSearchParams(location.search).get('warp');
if (warp === 'cal') {
  bootAudio();
  game.warpToCalRescue();
  startLoop();
} else if (warp === 'warden') {
  bootAudio();
  game.warpToWardenBoss();
  startLoop();
}
document.getElementById('muteBtn').addEventListener('click', e => {
  audio.setMuted(!audio.muted);
  e.currentTarget.textContent = audio.muted ? '🔇' : '🔊';
});

document.getElementById('encBtn').addEventListener('click', e => {
  game.encountersDisabled = !game.encountersDisabled;
  const btn = e.currentTarget;
  btn.classList.toggle('off', game.encountersDisabled);
  btn.textContent = game.encountersDisabled ? '🕊️' : '⚔️';
});

document.body.addEventListener('touchmove', e => {
  // Allow native scrolling inside designated scroll regions (menus, skill lists).
  if (e.target.closest && e.target.closest('.ovMenuBody, .skillList, .ovMenu')) return;
  e.preventDefault();
}, { passive: false });

window.__game = game;
window.addEventListener('error', e => {
  try { fetch('/log', { method: 'POST', body: 'WINDOW ERROR: ' + (e.error?.stack || e.message) }); } catch {}
});
window.addEventListener('unhandledrejection', e => {
  try { fetch('/log', { method: 'POST', body: 'UNHANDLED PROMISE: ' + (e.reason?.stack || String(e.reason)) }); } catch {}
});
