import { SKILLS, SKILL_BY_ID } from './data/skills.js';
import { ITEMS, ITEM_BY_ID } from './data/items.js';
import { EQUIP_BY_ID } from './data/equipment.js';
import { GEM_BY_ID } from './data/gems.js';
import { CLASS_BY_ID } from './data/classes.js';
import { STATUS_BY_ID } from './data/statuses.js';

export class UI {
  constructor() {
    this.hud = document.getElementById('topHud');
    this.goldEl = document.getElementById('goldEl');
    this.startScreen = document.getElementById('startScreen');
    this.gameOver = document.getElementById('gameOver');
    this.dialog = document.getElementById('dialog');
    this.dialogText = document.getElementById('dialogText');
    this.dialogNext = document.getElementById('dialogNext');
    this.battleUI = document.getElementById('battleUI');
    this.battleTop = document.getElementById('battleTop');
    this.battleLog = document.getElementById('battleLog');
    this.battleActions = document.getElementById('battleActions');
    this._targetEl = null;
    this._toastEl = null;
    this.objectiveEl = document.getElementById('objective');
    this.objectiveSpan = this.objectiveEl?.querySelector('span') || null;
  }

  showHud() { this.hud.classList.remove('hidden'); }
  hideHud() { this.hud.classList.add('hidden'); }
  hideStart() { this.startScreen.classList.add('hidden'); }
  showStart() { this.startScreen.classList.remove('hidden'); }
  showGameOver() { this.gameOver.classList.remove('hidden'); }
  hideGameOver() { this.gameOver.classList.add('hidden'); }

  update(game) {
    const p = game.player;
    if (!p) return;
    this.goldEl.textContent = `G ${game.gold}`;

    // Show battle UI only during battle; hide menu button during battle.
    // Also hide the overworld top HUD during battle — the battle UI has its
    // own per-member bars that would otherwise overlap with it.
    const inBattle = game.scene?.constructor?.name === 'Battle';
    const encBtn = document.getElementById('encBtn');
    if (inBattle) {
      this.battleUI.classList.remove('hidden');
      this.hideHud();
      this._setObjective(null);
      game.menu?.hideButton?.();
      if (game.menu?.open) game.menu.close();
      encBtn?.classList.add('hidden');
    } else {
      this.battleUI.classList.add('hidden');
      this.closeBattleMenu();
      this.showHud();
      this._setObjective(this._computeObjective(game));
      if (game.running) {
        game.menu?.showButton?.();
        encBtn?.classList.remove('hidden');
      }
    }
  }

  // Derives a one-line goal for the player based on current world state.
  _computeObjective(game) {
    if (!game.party?.length) return null;
    const spoken     = game.flags?.has('vorrin:spoken');
    const alphaDown  = game.flags?.has('meadow:packAlpha');
    const hasWhite   = game.party.some(m => m.classId === 'white');
    const wardenDown = game.flags?.has('cave:warden');
    const postWarden = game.flags?.has('vorrin:postWarden');
    if (!spoken) {
      return 'Find Elder Vorrin in Hearthstone';
    }
    if (!alphaDown) {
      return game.currentMapId === 'town'
        ? 'Head west into the meadow — slay the Pack Alpha at the cave mouth'
        : 'Slay the Pack Alpha guarding the cave mouth (west)';
    }
    if (!hasWhite) {
      return game.currentMapId === 'cave'
        ? 'Search deeper — the lost healer is here'
        : 'Enter the Echoing Hollow and find the lost healer';
    }
    if (!wardenDown) {
      return game.currentMapId === 'cave'
        ? 'Escape the Hollow with Lyra'
        : 'Return to the Hollow — Lyra needs cover to escape';
    }
    if (!postWarden) {
      return 'Return to Hearthstone — speak with Vorrin';
    }
    return null; // chapter 1 complete
  }

  _setObjective(text) {
    if (!this.objectiveEl) return;
    if (!text) { this.objectiveEl.classList.add('hidden'); return; }
    if (this.objectiveSpan && this.objectiveSpan.textContent !== text) {
      this.objectiveSpan.textContent = text;
    }
    this.objectiveEl.classList.remove('hidden');
  }

  toast(text) {
    if (this._toastEl) this._toastEl.remove();
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.85);color:#ffd84d;font-weight:700;padding:14px 22px;border-radius:12px;font-size:18px;z-index:30;pointer-events:none;border:1px solid rgba(255,216,77,0.5);';
    document.body.appendChild(el);
    this._toastEl = el;
    setTimeout(() => { if (this._toastEl === el) { el.remove(); this._toastEl = null; } }, 1600);
  }

  // ---- Battle menu ---------------------------------------------------------

  openBattleMenu(battle) {
    this.battleUI.classList.remove('menuExpanded');
    const buttons = [
      { label: 'Attack', cb: () => battle.chooseAttack() },
      { label: 'Skill',  cb: () => this._openSkillList(battle) },
      { label: 'Item',   cb: () => this._openItemList(battle) },
      { label: 'Defend', cb: () => battle.chooseDefend() },
      { label: 'Run',    cb: () => battle.chooseRun() },
    ];
    this.battleActions.innerHTML = '';
    for (const b of buttons) {
      const el = document.createElement('button');
      el.textContent = b.label;
      el.addEventListener('click', b.cb);
      this.battleActions.appendChild(el);
    }
  }

  closeBattleMenu() {
    this.battleActions.innerHTML = '';
    this.battleUI.classList.remove('menuExpanded');
  }

  _openSkillList(battle) {
    this.battleActions.innerHTML = '';
    this.battleUI.classList.add('menuExpanded');
    const unlocked = SKILLS.filter(s => battle.actor.skills.includes(s.id) && s.kind !== 'passive');
    if (unlocked.length === 0) {
      const back = document.createElement('button');
      back.textContent = '← No skills yet';
      back.addEventListener('click', () => this.openBattleMenu(battle));
      this.battleActions.appendChild(back);
      return;
    }
    const wrap = document.createElement('div');
    wrap.className = 'skillList';
    wrap.style.gridColumn = '1 / -1';
    for (const s of unlocked) {
      // Resolve linkers up-front so the row shows the REAL MP cost and tags
      // any chained effects (4×, 2×, AoE) the player has wired up.
      const resolved = battle._resolveLinkers(s.id, battle.actor) || s;
      const cost = resolved.cost ?? s.cost;
      const lk = resolved._linker || '';
      const tags = [];
      if (lk.includes('quad')) tags.push('<span class="linkTag quad">4×</span>');
      else if (lk.includes('double')) tags.push('<span class="linkTag double">2×</span>');
      if (lk.includes('all') && s.target === 'one') tags.push('<span class="linkTag aoe">AoE</span>');
      const tagHtml = tags.length ? `<span class="linkTags">${tags.join('')}</span>` : '';
      const row = document.createElement('button');
      row.className = 'skillRow' + (battle.actor.mp < cost ? ' disabled' : '');
      row.innerHTML = `<div class="icon">${s.icon}</div><div class="body"><div class="name">${s.name}${tagHtml}</div><div class="desc">${s.desc}</div></div><div class="cost">${cost} MP</div>`;
      row.addEventListener('click', () => {
        if (battle.actor.mp < cost) return;
        battle.chooseSkill(s.id);
      });
      wrap.appendChild(row);
    }
    const back = document.createElement('button');
    back.textContent = '← Back';
    back.style.gridColumn = '1 / -1';
    back.addEventListener('click', () => this.openBattleMenu(battle));
    this.battleActions.appendChild(wrap);
    this.battleActions.appendChild(back);
  }

  _openItemList(battle) {
    this.battleActions.innerHTML = '';
    this.battleUI.classList.add('menuExpanded');
    const inv = battle.game.inventory.consumables;
    const owned = ITEMS.filter(i => (inv[i.id] || 0) > 0);
    if (owned.length === 0) {
      const back = document.createElement('button');
      back.textContent = '← No items';
      back.addEventListener('click', () => this.openBattleMenu(battle));
      this.battleActions.appendChild(back);
      return;
    }
    const wrap = document.createElement('div');
    wrap.className = 'skillList';
    wrap.style.gridColumn = '1 / -1';
    for (const it of owned) {
      const row = document.createElement('button');
      row.className = 'skillRow';
      row.innerHTML = `<div class="icon">${it.icon}</div><div class="body"><div class="name">${it.name} ×${inv[it.id]}</div><div class="desc">${it.desc}</div></div>`;
      row.addEventListener('click', () => battle.chooseItem(it.id));
      wrap.appendChild(row);
    }
    const back = document.createElement('button');
    back.textContent = '← Back';
    back.style.gridColumn = '1 / -1';
    back.addEventListener('click', () => this.openBattleMenu(battle));
    this.battleActions.appendChild(wrap);
    this.battleActions.appendChild(back);
  }

  showTargetHint(side = 'enemies', onCancel = null) {
    if (this._targetEl) return;
    const el = document.createElement('div');
    el.className = 'targetSelect';
    const hint = side === 'party' ? 'Tap an ally' : 'Tap a target';
    // Position the hint below the party bars (which live at the top under
    // the safe-area inset). Two rows of bars worst case ≈ 130px, plus the
    // notch padding via env(safe-area-inset-top).
    el.innerHTML = `
      <div class="hint" style="top:calc(env(safe-area-inset-top, 0) + 140px)">${hint}</div>
      <button class="cancelTargetBtn">✕ Cancel</button>`;
    document.body.appendChild(el);
    if (onCancel) {
      const btn = el.querySelector('.cancelTargetBtn');
      btn.addEventListener('click', e => { e.stopPropagation(); onCancel(); });
      btn.addEventListener('pointerdown', e => e.stopPropagation());
    }
    this._targetEl = el;
  }
  hideTargetHint() {
    if (this._targetEl) { this._targetEl.remove(); this._targetEl = null; }
  }

  renderPartyBars(battle) {
    const rows = battle.party.map(m => {
      const cls = ['partyBar'];
      if (battle.actor === m && !m.dead) cls.push('active');
      const hpPct = (m.hp / m.maxHp * 100).toFixed(1);
      const mpPct = (m.mp / m.maxMp * 100).toFixed(1);
      const atbPct = (Math.min(1, m.atb || 0) * 100).toFixed(1);
      const ko = m.dead ? ' <span style="color:#ff5a6e">KO</span>' : '';
      const icon = CLASS_BY_ID[m.classId]?.icon || '';
      const statusIcons = (m.statuses || []).map(s => {
        const def = STATUS_BY_ID[s.id];
        return def ? `<span title="${def.name} (${s.duration})" style="color:${def.color};margin-left:2px;font-size:10px">${def.icon}</span>` : '';
      }).join('');
      return `<div class="${cls.join(' ')}">
        <div class="name">${icon} ${escapeHtml(m.name)}${ko}${statusIcons}</div>
        <div class="pbar"><div class="pfill" style="width:${hpPct}%"></div></div>
        <div class="pbar mp"><div class="pfill" style="width:${mpPct}%"></div></div>
        <div class="pbar atb"><div class="pfill" style="width:${atbPct}%"></div></div>
        <div style="font-size:9px;opacity:0.7">${Math.ceil(m.hp)}/${m.maxHp} · ${Math.ceil(m.mp)}/${m.maxMp}</div>
      </div>`;
    }).join('');
    if (this.battleTop.innerHTML !== rows) this.battleTop.innerHTML = rows;
  }

  updateBattleLog(lines) {
    this.battleLog.innerHTML = lines.map(l => `<div>${escapeHtml(l)}</div>`).join('');
  }

  showError(err) {
    const text = err?.stack || String(err);
    try { fetch('/log', { method: 'POST', body: 'ERROR: ' + text }); } catch {}
    console.error(err);
  }

  // ---- Dialog --------------------------------------------------------------

  showDialog(speaker, lines, choices, onChoice, onComplete) {
    this.dialog.classList.remove('hidden');
    this._dialogLines = Array.isArray(lines) ? [...lines] : [lines];
    this._dialogSpeaker = speaker;
    this._dialogChoices = choices;
    this._dialogOnChoice = onChoice;
    this._dialogOnComplete = onComplete;
    this._renderDialogLine();
    if (!this._dialogHandlerBound) {
      this._dialogHandlerBound = true;
      this.dialogNext.addEventListener('click', () => this._advanceDialog());
      this.dialogText.addEventListener('click', () => this._advanceDialog());
    }
  }

  _renderDialogLine() {
    const line = this._dialogLines[0] || '';
    this.dialogText.innerHTML = `<div style="font-weight:700;color:#ffd84d;margin-bottom:4px">${escapeHtml(this._dialogSpeaker || '')}</div><div>${escapeHtml(line)}</div>`;
    if (this._dialogLines.length === 1 && this._dialogChoices) {
      // Render choices instead of next arrow.
      this.dialogNext.style.display = 'none';
      let row = document.getElementById('dialogChoices');
      if (!row) {
        row = document.createElement('div');
        row.id = 'dialogChoices';
        row.style.cssText = 'display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;';
        this.dialog.appendChild(row);
      }
      row.innerHTML = '';
      this._dialogChoices.forEach((label, i) => {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.style.cssText = 'background:linear-gradient(135deg,#5aaaff,#7a6aff);border:none;color:#fff;padding:8px 14px;border-radius:8px;font-weight:700;cursor:pointer;font-size:13px;';
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const cb = this._dialogOnChoice;
          this._closeDialog();
          if (cb) cb(i);
        });
        row.appendChild(btn);
      });
    } else {
      this.dialogNext.style.display = '';
      const row = document.getElementById('dialogChoices');
      if (row) row.remove();
    }
  }

  _advanceDialog() {
    if (this._dialogChoices && this._dialogLines.length <= 1) return; // wait for choice
    this._dialogLines.shift();
    if (this._dialogLines.length === 0) this._closeDialog();
    else this._renderDialogLine();
  }

  _closeDialog() {
    this.dialog.classList.add('hidden');
    const onComplete = this._dialogOnComplete;
    this._dialogLines = null;
    this._dialogChoices = null;
    this._dialogOnChoice = null;
    this._dialogOnComplete = null;
    const row = document.getElementById('dialogChoices');
    if (row) row.remove();
    if (onComplete) onComplete();
  }

  // ---- Shop ----------------------------------------------------------------

  openShop(game, items) {
    if (this._shopEl) this._shopEl.remove();
    const el = document.createElement('div');
    el.className = 'ovMenu';
    el.style.zIndex = 30;
    el.innerHTML = `
      <div class="ovMenuHeader">
        <div class="ovTabs"><button class="active">Mira's Wares</button></div>
        <div style="margin-right:8px;font-weight:700;color:#ffd84d">G ${game.gold}</div>
        <button class="ovClose">✕</button>
      </div>
      <div class="ovMenuBody" id="shopBody"></div>`;
    document.body.appendChild(el);
    this._shopEl = el;
    el.querySelector('.ovClose').addEventListener('click', () => this._closeShop());
    const body = el.querySelector('#shopBody');
    const render = () => {
      body.innerHTML = '';
      el.querySelector('div[style*="ffd84d"]').textContent = `G ${game.gold}`;
      for (const entry of items) {
        const tmpl = entry.type === 'consumable' ? ITEM_BY_ID[entry.id]
                   : entry.type === 'gem'        ? GEM_BY_ID[entry.id]
                                                 : EQUIP_BY_ID[entry.id];
        if (!tmpl) continue;
        const row = document.createElement('div');
        const can = game.gold >= entry.price;
        row.className = 'ovRow' + (can ? '' : ' disabled');
        row.innerHTML = `
          <div class="icon">${tmpl.icon}</div>
          <div class="body">
            <div class="name">${tmpl.name}</div>
            <div class="desc">${tmpl.desc}</div>
            <div class="tag">${describeEntry(entry, tmpl)}</div>
          </div>
          <div class="actions"><button>${entry.price} G</button></div>`;
        row.querySelector('button').addEventListener('click', () => {
          if (game.buyFromShop(entry)) { this.toast(`Bought ${tmpl.name}`); render(); }
        });
        body.appendChild(row);
      }
    };
    render();
  }

  _closeShop() {
    if (this._shopEl) { this._shopEl.remove(); this._shopEl = null; }
  }
}

function describeEntry(entry, tmpl) {
  if (entry.type === 'consumable') return 'consumable';
  if (entry.type === 'gem') return `gem · max Lv ${tmpl.maxLevel}`;
  const parts = [];
  for (const k of ['atk','def','mag','spd','maxHp','maxMp']) if (tmpl[k]) parts.push(`+${tmpl[k]} ${k.toUpperCase()}`);
  if (tmpl.gemSlots) parts.push(`${tmpl.gemSlots} socket${tmpl.gemSlots>1?'s':''}`);
  return parts.join(' · ');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
