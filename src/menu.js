import { ITEMS, ITEM_BY_ID } from './data/items.js';
import { SKILLS, SKILL_BY_ID } from './data/skills.js';
import { EQUIPMENT, EQUIP_BY_ID, linkGroups } from './data/equipment.js';
import { gemEffects, gemXpToNext, GEM_BY_ID } from './data/gems.js';
import { matchPairCombo, matchHigherCombos } from './data/combos.js';
import { STATUS_BY_ID } from './data/statuses.js';
import { CLASS_BY_ID, nodeState, sortedTree } from './data/classes.js';
import { activeQuests, questProgress } from './data/quests.js';
import { audio } from './audio.js';

const TABS = ['items', 'skills', 'equip', 'gems', 'quests', 'status'];
const TAB_LABEL = { items: 'Items', skills: 'Skills', equip: 'Equip', gems: 'Gems', quests: 'Quests', status: 'Status' };

export class OverworldMenu {
  constructor(game) {
    this.game = game;
    this.el = document.getElementById('overworldMenu');
    this.tabsEl = document.getElementById('ovTabs');
    this.bodyEl = document.getElementById('ovMenuBody');
    this.btnEl = document.getElementById('menuBtn');
    this.closeEl = document.getElementById('ovMenuClose');
    this.activeTab = 'items';
    this.selectedMemberIdx = 0;
    this.open = false;

    this.btnEl.addEventListener('click', () => this.toggle());
    this.closeEl.addEventListener('click', () => this.close());
    this._buildTabs();
  }

  _buildTabs() {
    this.tabsEl.innerHTML = '';
    for (const t of TABS) {
      const b = document.createElement('button');
      b.textContent = TAB_LABEL[t];
      b.dataset.tab = t;
      if (t === this.activeTab) b.classList.add('active');
      b.addEventListener('click', () => { this.activeTab = t; audio.play('menu'); this._buildTabs(); this._renderBody(); });
      this.tabsEl.appendChild(b);
    }
  }

  showButton() { this.btnEl.classList.remove('hidden'); }
  hideButton() { this.btnEl.classList.add('hidden'); }
  toggle() { if (this.open) this.close(); else this.openMenu(); }

  openMenu() {
    this.open = true;
    this.el.classList.remove('hidden');
    audio.play('menu');
    this._renderBody();
  }

  close() {
    this.open = false;
    this.el.classList.add('hidden');
    audio.play('menu');
  }

  _renderBody() {
    this.bodyEl.innerHTML = '';
    this._clampSelectedIdx();
    switch (this.activeTab) {
      case 'items':  this._renderItems(); break;
      case 'skills': this._renderSkills(); break;
      case 'equip':  this._renderEquip(); break;
      case 'gems':   this._renderGems(); break;
      case 'quests': this._renderQuests(); break;
      case 'status': this._renderStatus(); break;
    }
  }

  _renderQuests() {
    const list = activeQuests(this.game);
    if (list.length === 0) {
      this.bodyEl.innerHTML = `<div class="ovEmpty">No quests yet — talk to the townsfolk.</div>`;
      return;
    }
    const mains = list.filter(q => q.type === 'main');
    const sides = list.filter(q => q.type !== 'main');
    if (mains.length) this._renderQuestGroup('STORY', mains);
    if (sides.length) this._renderQuestGroup('SIDE', sides);
  }

  _renderQuestGroup(label, quests) {
    const h = document.createElement('div');
    h.className = 'ovHeading';
    h.textContent = label;
    this.bodyEl.appendChild(h);
    for (const q of quests) {
      const prog = questProgress(q, this.game);
      const card = document.createElement('div');
      card.className = 'ovRow' + (prog.complete ? ' equipped' : '');
      const titleIcon = q.type === 'main' ? '★' : '◆';
      const statusTag = prog.complete
        ? '<span class="tag" style="color:#8aff8a">✓ COMPLETE</span>'
        : `<span class="tag">${prog.current}/${prog.total}</span>`;
      // Show completed steps (struck through) and the current step (highlighted).
      // Future steps are hidden as "???" so the chapter still feels discovered.
      const lines = q.steps.map((s, i) => {
        const done = i < prog.current;
        const active = i === prog.current && !prog.complete;
        if (done) return `<div style="font-size:12px;opacity:0.6;text-decoration:line-through">✓ ${s.text}</div>`;
        if (active) return `<div style="font-size:12px;color:#ffd84d;font-weight:700">◆ ${s.text}</div>`;
        return `<div style="font-size:12px;opacity:0.35">○ ???</div>`;
      }).join('');
      card.innerHTML = `
        <div class="icon">${titleIcon}</div>
        <div class="body">
          <div class="name">${q.title} ${statusTag}</div>
          <div class="desc" style="margin-top:2px">${q.intro || ''}</div>
          <div style="margin-top:6px;display:flex;flex-direction:column;gap:3px">${lines}</div>
        </div>`;
      this.bodyEl.appendChild(card);
    }
  }

  _clampSelectedIdx() {
    const max = Math.max(0, this.game.party.length - 1);
    if (this.selectedMemberIdx > max) this.selectedMemberIdx = 0;
    if (this.selectedMemberIdx < 0) this.selectedMemberIdx = 0;
    return this.selectedMemberIdx;
  }

  // Returns a row of party-member buttons; clicking switches selectedMemberIdx.
  // Always shown — even with a single character — so the per-member intent of
  // the Skills/Equip/Status tabs is unambiguous.
  _memberStrip() {
    if (!this.game.party.length) return null;
    const wrap = document.createElement('div');
    // Pin the member strip to the top of the scrolling menu body so the
    // player can swap characters without first scrolling all the way back up.
    wrap.style.cssText = 'display:flex;gap:6px;padding:6px 0;flex-wrap:wrap;position:sticky;top:0;background:rgba(15,20,32,0.97);backdrop-filter:blur(4px);z-index:5;border-bottom:1px solid rgba(255,255,255,0.08);';
    for (let i = 0; i < this.game.party.length; i++) {
      const m = this.game.party[i];
      const cls = CLASS_BY_ID[m.classId];
      const sel = i === this.selectedMemberIdx;
      const btn = document.createElement('button');
      btn.style.cssText = `flex:1;min-width:90px;padding:8px;border-radius:8px;border:1px solid ${sel ? '#ffd84d' : 'rgba(255,255,255,0.15)'};background:${sel ? 'rgba(255,216,77,0.15)' : 'rgba(20,30,45,0.6)'};color:#fff;cursor:pointer;font-size:11px;font-weight:700;line-height:1.3;`;
      btn.innerHTML = `${cls?.icon || ''} ${m.name}<br><span style="font-weight:400;opacity:0.75">Lv ${m.level} · ${Math.ceil(m.hp)}/${m.maxHp}</span>`;
      btn.addEventListener('click', () => {
        this.selectedMemberIdx = i;
        audio.play('menu');
        this._renderBody();
      });
      wrap.appendChild(btn);
    }
    return wrap;
  }

  _renderItems() {
    const inv = this.game.inventory.consumables;
    const owned = ITEMS.filter(i => (inv[i.id] || 0) > 0);
    if (owned.length === 0) {
      this.bodyEl.innerHTML = `<div class="ovEmpty">No items.</div>`;
      return;
    }
    for (const it of owned) {
      const row = document.createElement('div');
      row.className = 'ovRow';
      row.innerHTML = `
        <div class="icon">${it.icon}</div>
        <div class="body">
          <div class="name">${it.name} <span class="tag">×${inv[it.id]}</span></div>
          <div class="desc">${it.desc}</div>
        </div>
        <div class="actions"><button>Use</button></div>`;
      row.querySelector('button').addEventListener('click', () => this._chooseItemTarget(it.id));
      this.bodyEl.appendChild(row);
    }
  }

  _chooseItemTarget(itemId) {
    if (this.game.party.length === 1) {
      if (this.game.useConsumable(itemId, 0)) this._renderBody();
      return;
    }
    // Show a quick member picker.
    this.bodyEl.innerHTML = '';
    const heading = document.createElement('div');
    heading.className = 'ovHeading';
    const it = ITEM_BY_ID[itemId];
    heading.textContent = `USE ${it.name.toUpperCase()} ON…`;
    this.bodyEl.appendChild(heading);
    for (let i = 0; i < this.game.party.length; i++) {
      const m = this.game.party[i];
      const cls = CLASS_BY_ID[m.classId];
      const row = document.createElement('div');
      row.className = 'ovRow';
      row.innerHTML = `
        <div class="icon">${cls?.icon || '◌'}</div>
        <div class="body">
          <div class="name">${m.name}</div>
          <div class="desc">Lv ${m.level} · HP ${Math.ceil(m.hp)}/${m.maxHp} · MP ${Math.ceil(m.mp)}/${m.maxMp}</div>
        </div>
        <div class="actions"><button>Use</button></div>`;
      row.querySelector('button').addEventListener('click', () => {
        if (this.game.useConsumable(itemId, i)) this._renderBody();
      });
      this.bodyEl.appendChild(row);
    }
    const back = document.createElement('button');
    back.className = 'ovClose';
    back.textContent = '← Back';
    back.style.alignSelf = 'flex-start';
    back.addEventListener('click', () => { audio.play('menu'); this._renderBody(); });
    this.bodyEl.appendChild(back);
  }

  _renderSkills() {
    const strip = this._memberStrip();
    if (strip) this.bodyEl.appendChild(strip);
    const p = this.game.party[this.selectedMemberIdx];
    if (!p) { this.bodyEl.innerHTML += `<div class="ovEmpty">No party member.</div>`; return; }
    const cls = CLASS_BY_ID[p.classId];
    if (!cls) { this.bodyEl.innerHTML += `<div class="ovEmpty">No class assigned.</div>`; return; }

    const header = document.createElement('div');
    header.className = 'ovStat';
    header.innerHTML = `<span>${cls.icon} ${p.name} · ${cls.name}</span><b>SP ${p.sp || 0}</b>`;
    this.bodyEl.appendChild(header);

    const nodeName = (nid) => {
      const node = cls.tree.find(n => n.id === nid);
      const s = node && SKILL_BY_ID[node.grants];
      return s?.name || nid;
    };

    for (const node of sortedTree(p.classId)) {
      const skill = SKILL_BY_ID[node.grants];
      if (!skill) continue;
      const state = nodeState(p.classId, node.id, p.learnedNodes, p.level || 1);
      const canBuy = state === 'available' && (p.sp || 0) >= node.cost;

      const reqText = node.requires.length
        ? ` · req: ${node.requires.map(nodeName).join(', ')}`
        : '';
      const mpText = skill.kind === 'passive' ? 'passive' : `${skill.cost} MP`;

      let right;
      if (state === 'learned')        right = `<div class="tag">✓ Learned · ${mpText}</div>`;
      else if (state === 'available') right = `<div class="actions"><button>${node.cost} SP</button></div>`;
      else if (state === 'levelLocked') right = `<div class="tag">🔒 Lv ${node.levelReq} · ${node.cost} SP</div>`;
      else                            right = `<div class="tag">🔒 ${node.cost} SP</div>`;

      const row = document.createElement('div');
      const rowCls = state === 'learned' ? ' equipped' : (state === 'locked' || state === 'levelLocked') ? ' disabled' : '';
      row.className = 'ovRow' + rowCls;
      row.innerHTML = `
        <div class="icon">${skill.icon}</div>
        <div class="body">
          <div class="name">${skill.name}</div>
          <div class="desc">${skill.desc}${reqText}</div>
        </div>
        ${right}`;
      const btn = row.querySelector('button');
      if (btn) {
        if (!canBuy) { btn.disabled = true; btn.style.opacity = '0.5'; }
        btn.addEventListener('click', () => {
          if (!canBuy) { this.game.ui.toast('Not enough SP.'); return; }
          if (this.game.learnNode(this.selectedMemberIdx, node.id)) {
            audio.play('levelup');
            this.game.ui.toast(`${p.name} learned ${skill.name}`);
            this._renderBody();
          }
        });
      }
      this.bodyEl.appendChild(row);
    }
  }

  _renderEquip() {
    const strip = this._memberStrip();
    if (strip) this.bodyEl.appendChild(strip);
    const p = this.game.party[this.selectedMemberIdx];
    if (!p) return;
    const slots = ['weapon', 'armor', 'accessory'];
    for (const slot of slots) {
      const heading = document.createElement('div');
      heading.className = 'ovHeading';
      heading.textContent = slot.toUpperCase();
      this.bodyEl.appendChild(heading);
      const eq = p.equipped[slot];
      if (eq) {
        const row = document.createElement('div');
        row.className = 'ovRow equipped';
        row.innerHTML = `
          <div class="icon">${eq.template.icon}</div>
          <div class="body">
            <div class="name">${eq.template.name}</div>
            <div class="desc">${eq.template.desc}</div>
            <div class="tag">${describeBonus(eq.template)}${eq.template.gemSlots ? ` · ${eq.template.gemSlots} socket${eq.template.gemSlots > 1 ? 's' : ''}` : ''}</div>
          </div>
          <div class="actions"><button>Unequip</button></div>`;
        row.querySelector('button').addEventListener('click', () => { this.game.unequip(this.selectedMemberIdx, slot); audio.play('confirm'); this._renderBody(); });
        this.bodyEl.appendChild(row);
        if (eq.template.gemSlots > 0) this._renderGemSockets(eq);
      } else {
        const empty = document.createElement('div');
        empty.className = 'ovRow disabled';
        empty.innerHTML = `<div class="icon">·</div><div class="body"><div class="name">Empty</div></div>`;
        this.bodyEl.appendChild(empty);
      }
      const owned = this.game.inventory.equipment.filter(i => i.template.slot === slot);
      if (owned.length) {
        for (const inst of owned) {
          const row = document.createElement('div');
          row.className = 'ovRow';
          row.innerHTML = `
            <div class="icon">${inst.template.icon}</div>
            <div class="body">
              <div class="name">${inst.template.name}</div>
              <div class="desc">${inst.template.desc}</div>
              <div class="tag">${describeBonus(inst.template)}${inst.template.gemSlots ? ` · ${inst.template.gemSlots} socket${inst.template.gemSlots > 1 ? 's' : ''}` : ''}</div>
            </div>
            <div class="actions"><button>Equip</button></div>`;
          row.querySelector('button').addEventListener('click', () => { this.game.equip(this.selectedMemberIdx, slot, inst); audio.play('confirm'); this._renderBody(); });
          this.bodyEl.appendChild(row);
        }
      }
    }
  }

  _renderGemSockets(eq) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:0;padding:6px 12px 10px;flex-wrap:wrap;align-items:stretch;';
    const links = eq.template?.linkedSlots || [];
    // Set of sockets that participate in ANY link — used to draw the linked
    // visual treatment (solid gold border instead of dashed).
    const linkedSockets = new Set();
    for (const [a, b] of links) { linkedSockets.add(a); linkedSockets.add(b); }
    // Set of left-edge indices for adjacent linked pairs — used to decide
    // where to drop a glowing chain connector between two cells.
    const adjacencies = new Set();
    for (const [a, b] of links) {
      if (Math.abs(a - b) === 1) adjacencies.add(Math.min(a, b));
    }
    const makeCell = (i, isLinked) => {
      const gem = eq.gems[i];
      const cell = document.createElement('button');
      const border = isLinked
        ? 'border:1px solid rgba(255,216,77,0.6);box-shadow:0 0 0 1px rgba(255,216,77,0.18);'
        : 'border:1px dashed rgba(255,255,255,0.2);';
      cell.style.cssText = `flex:1 1 96px;min-width:96px;background:rgba(0,0,0,0.45);${border}border-radius:8px;padding:8px;color:#fff;display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;position:relative;margin:0 4px;`;
      if (gem) {
        cell.style.borderStyle = 'solid';
        cell.style.borderColor = gem.template.color;
        cell.style.boxShadow = `inset 0 0 8px ${gem.template.color}40${isLinked ? ', 0 0 0 1px rgba(255,216,77,0.4)' : ''}`;
        const need = gemXpToNext(gem);
        const xpLabel = need == null ? 'MAX' : `${gem.xp}/${need}`;
        cell.innerHTML = `<span style="font-size:18px">${gem.template.icon}</span><span><b>${gem.template.name}</b><br><span style="opacity:0.7">Lv ${gem.level} · ${xpLabel}</span></span>`;
        cell.addEventListener('click', () => { this.game.unslotGem(this.selectedMemberIdx, eq, i); audio.play('menu'); this._renderBody(); });
      } else {
        cell.innerHTML = `<span style="font-size:18px;opacity:0.5">○</span><span style="opacity:0.6">Empty socket</span>`;
        cell.addEventListener('click', () => this._openGemPicker(eq, i));
      }
      return cell;
    };
    const makeConnector = () => {
      const conn = document.createElement('div');
      conn.style.cssText = 'flex:0 0 22px;height:8px;align-self:center;position:relative;background:linear-gradient(90deg,#a08840 0%,#ffd84d 50%,#a08840 100%);box-shadow:0 0 8px rgba(255,216,77,0.85),0 0 14px rgba(255,216,77,0.45);';
      conn.innerHTML = `<span style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);font-size:10px;color:#1a1a28;background:#ffd84d;border-radius:4px;padding:0 4px;line-height:11px;box-shadow:0 0 6px #ffd84d;">🔗</span>`;
      return conn;
    };
    // Render all sockets in one inline flow. After socket i, if (i, i+1) is
    // a linked pair, append a chain connector. Repeating links (0↔1, 1↔2,
    // 2↔3) all chain together naturally without special-casing.
    for (let i = 0; i < eq.template.gemSlots; i++) {
      wrap.appendChild(makeCell(i, linkedSockets.has(i)));
      if (adjacencies.has(i)) wrap.appendChild(makeConnector());
    }
    // Combo readout — mirrors what rebuildStats actually grants. Pairs trigger
    // between any two gems in the same link group; 3+ gem combos trigger when
    // all required gems are on this equipment. Smaller combos are suppressed
    // if a larger active combo's gem set is a strict superset (so a trio like
    // Tide Triad hides its three constituent pair combos).
    const ids = eq.gems.filter(Boolean).map(g => g.id);
    const all = [];
    for (const group of linkGroups(eq)) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const ga = eq.gems[group[i]], gb = eq.gems[group[j]];
          if (!ga || !gb) continue;
          for (const c of matchPairCombo(ga.id, gb.id)) all.push(c);
        }
      }
    }
    if (ids.length >= 3) {
      for (const c of matchHigherCombos(ids)) all.push(c);
    }
    const supSet = new Set();
    for (let a = 0; a < all.length; a++) {
      for (let b = 0; b < all.length; b++) {
        if (a === b) continue;
        const s = all[a], big = all[b];
        if (s.gems.length >= big.gems.length) continue;
        if (s.gems.every(g => big.gems.includes(g))) supSet.add(s);
      }
    }
    const found = all.filter(c => !supSet.has(c));
    if (found.length) {
      const cb = document.createElement('div');
      cb.style.cssText = 'flex:1 1 100%;padding:6px 10px;background:rgba(255,216,77,0.12);border:1px solid rgba(255,216,77,0.4);border-radius:8px;font-size:11px;color:#ffd84d;display:flex;flex-wrap:wrap;gap:6px;align-items:center;';
      const label = document.createElement('span');
      label.textContent = '✦ Resonance:';
      label.style.cssText = 'opacity:0.85;';
      cb.appendChild(label);
      const seen = new Set();
      for (const c of found) {
        const key = c.name + '|' + c.gems.join(',');
        if (seen.has(key)) continue;
        seen.add(key);
        const chip = document.createElement('button');
        chip.style.cssText = 'background:rgba(255,216,77,0.18);border:1px solid rgba(255,216,77,0.55);color:#ffd84d;border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;font-weight:700;';
        chip.textContent = `${c.name} ⓘ`;
        chip.addEventListener('click', (ev) => {
          ev.stopPropagation();
          audio.play('menu');
          this._showComboInfo(c);
        });
        cb.appendChild(chip);
      }
      wrap.appendChild(cb);
    }
    this.bodyEl.appendChild(wrap);
  }

  _comboElementColor(el) {
    return el === 'fire' ? '#ff8a3b'
         : el === 'ice'  ? '#7adaff'
         : el === 'thunder' ? '#ffd84d'
         : el === 'water' ? '#3bb6c8'
         : el === 'dark' ? '#a060ff'
         : el === 'nature' ? '#7aaa3a'
         : el === 'holy' ? '#ffd884'
         : el === 'poison' ? '#9aaa3b'
         : el === 'nonelemental' ? '#ffffff'
         : el === 'phys' ? '#cfd6e0'
         : '#cdd6e0';
  }

  _showComboInfo(combo) {
    if (this._comboInfoEl) this._comboInfoEl.remove();
    const el = document.createElement('div');
    el.className = 'ovMenu';
    el.style.zIndex = 50;
    el.style.background = 'rgba(10,14,22,0.96)';
    const close = () => { el.remove(); this._comboInfoEl = null; };
    el.innerHTML = `
      <div class="ovMenuHeader">
        <div style="flex:1;font-weight:700;color:#ffd84d;font-size:15px;">✦ ${(combo.name)}</div>
        <button class="ovClose">✕</button>
      </div>
      <div class="ovMenuBody" id="comboInfoBody"></div>`;
    document.body.appendChild(el);
    this._comboInfoEl = el;
    el.querySelector('.ovClose').addEventListener('click', close);
    el.addEventListener('click', (ev) => { if (ev.target === el) close(); });

    const body = el.querySelector('#comboInfoBody');

    // ---- Gem requirements row ---------------------------------------------
    const reqHead = document.createElement('div');
    reqHead.style.cssText = 'font-size:11px;color:#cdd6e0;opacity:0.7;text-transform:uppercase;letter-spacing:1px;margin-top:4px;';
    reqHead.textContent = combo.gems.length === 2 ? 'Linked pair' : `${combo.gems.length}-gem fusion`;
    body.appendChild(reqHead);

    const reqRow = document.createElement('div');
    reqRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;padding:6px 0 10px;';
    for (let i = 0; i < combo.gems.length; i++) {
      const g = GEM_BY_ID[combo.gems[i]];
      if (!g) continue;
      if (i > 0) {
        const plus = document.createElement('span');
        plus.style.cssText = 'align-self:center;color:#ffd84d;font-weight:700;font-size:14px;';
        plus.textContent = '+';
        reqRow.appendChild(plus);
      }
      const tile = document.createElement('div');
      tile.style.cssText = `display:flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid ${g.color};background:rgba(0,0,0,0.4);border-radius:8px;box-shadow:inset 0 0 8px ${g.color}40;`;
      tile.innerHTML = `<span style="font-size:18px;">${g.icon}</span><span style="font-size:12px;color:#fff;"><b>${(g.name)}</b></span>`;
      reqRow.appendChild(tile);
    }
    body.appendChild(reqRow);

    if (combo.gems.length === 2) {
      const hint = document.createElement('div');
      hint.style.cssText = 'font-size:10px;color:#9aa5b5;padding:0 0 8px;font-style:italic;';
      hint.textContent = 'Both gems must sit in a linked socket pair on the same equipment.';
      body.appendChild(hint);
    } else {
      const hint = document.createElement('div');
      hint.style.cssText = 'font-size:10px;color:#9aa5b5;padding:0 0 8px;font-style:italic;';
      hint.textContent = `All ${combo.gems.length} gems must share the same equipment (no link required for ${combo.gems.length}-gem fusions).`;
      body.appendChild(hint);
    }

    // ---- Grants ------------------------------------------------------------
    const grantsHead = document.createElement('div');
    grantsHead.style.cssText = 'font-size:11px;color:#cdd6e0;opacity:0.7;text-transform:uppercase;letter-spacing:1px;margin-top:4px;';
    grantsHead.textContent = combo.grants.length > 1 ? `Grants ${combo.grants.length} skills` : 'Grants';
    body.appendChild(grantsHead);

    for (const skillId of combo.grants) {
      const sk = SKILL_BY_ID[skillId];
      const card = document.createElement('div');
      const color = this._comboElementColor(sk?.element);
      card.style.cssText = `margin:8px 0;padding:10px 12px;border-radius:10px;border:1px solid ${color};background:linear-gradient(135deg, rgba(0,0,0,0.55), ${color}18);box-shadow:0 0 0 1px ${color}30, inset 0 0 12px ${color}22;color:#fff;`;
      if (!sk) {
        card.innerHTML = `<div style="font-weight:700;">Unknown skill <code>${(skillId)}</code></div>`;
        body.appendChild(card);
        continue;
      }

      const targetLabel = sk.target === 'all' ? 'All enemies' : sk.target === 'self' ? 'Self' : sk.kind === 'heal' ? 'One ally' : 'One enemy';
      const kindLabel = sk.kind === 'heal' ? 'Heal'
                      : sk.kind === 'attack' ? 'Physical attack'
                      : sk.kind === 'magic' ? 'Magic'
                      : sk.kind === 'passive' ? 'Passive' : sk.kind || 'Skill';
      const elementIds = (sk.elements && sk.elements.length) ? sk.elements : (sk.element ? [sk.element] : []);
      const capit = (s) => s ? s[0].toUpperCase() + s.slice(1) : '—';

      const tags = [];
      if (elementIds.length === 0) {
        tags.push(`<span style="background:${color}30;border:1px solid ${color};color:${color};padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;">—</span>`);
      } else {
        for (const eid of elementIds) {
          const ec = this._comboElementColor(eid);
          tags.push(`<span style="background:${ec}30;border:1px solid ${ec};color:${ec};padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;">${(capit(eid))}</span>`);
        }
        if (elementIds.length > 1) {
          tags.push(`<span style="background:rgba(255,216,77,0.16);border:1px solid #ffd84d;color:#ffd84d;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;">Hybrid · avg of ${elementIds.length} elements</span>`);
        }
      }
      tags.push(`<span style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);padding:2px 6px;border-radius:4px;font-size:10px;">${(kindLabel)}</span>`);
      tags.push(`<span style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);padding:2px 6px;border-radius:4px;font-size:10px;">🎯 ${(targetLabel)}</span>`);
      if (sk.cost != null) tags.push(`<span style="background:rgba(122,218,255,0.18);border:1px solid #7adaff;color:#7adaff;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;">${sk.cost} MP</span>`);
      if (sk.power != null) {
        const powerLabel = sk.kind === 'heal' ? `+${sk.power} HP base` : `×${sk.power.toFixed(2)} power`;
        tags.push(`<span style="background:rgba(255,216,77,0.16);border:1px solid #ffd84d;color:#ffd84d;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;">${powerLabel}</span>`);
      }
      if (sk.pierce) tags.push(`<span style="background:rgba(255,138,59,0.18);border:1px solid #ff8a3b;color:#ff8a3b;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;">Pierces ${Math.round(sk.pierce*100)}% DEF</span>`);

      let statusBlock = '';
      if (sk.status) {
        const st = STATUS_BY_ID[sk.status.id];
        const stName = st?.name || sk.status.id;
        const stIcon = st?.icon || '✦';
        const stColor = st?.color || '#fff';
        const stDesc = st ? this._statusBlurb(st) : '';
        const chance = Math.round((sk.status.chance ?? 1) * 100);
        statusBlock = `<div style="margin-top:8px;padding:6px 8px;border-left:3px solid ${stColor};background:rgba(0,0,0,0.35);border-radius:4px;font-size:11px;">
          <span style="color:${stColor};font-weight:700;">${stIcon} ${(stName)}</span>
          <span style="opacity:0.8;"> · ${chance}% on hit</span>
          ${stDesc ? `<div style="opacity:0.75;margin-top:2px;">${(stDesc)}</div>` : ''}
        </div>`;
      }

      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:22px;">${sk.icon || '✦'}</span>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:14px;color:${color};text-shadow:0 0 8px ${color}80;">${(sk.name)}</div>
            <div style="opacity:0.85;font-size:12px;margin-top:2px;">${(sk.desc || '')}</div>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;">${tags.join('')}</div>
        ${statusBlock}`;
      body.appendChild(card);
    }
  }

  _statusBlurb(st) {
    if (st.kind === 'dotHp') return `Drains roughly ${Math.round(st.factor * 100)}% max HP per turn for ${st.duration} turns.`;
    if (st.kind === 'hotHp') return `Restores roughly ${Math.round(st.factor * 100)}% max HP per turn for ${st.duration} turns.`;
    if (st.kind === 'skip') return `Skips the target's turn${st.wakesOnHit ? ' (wakes when hit)' : ''} for up to ${st.duration} turn${st.duration === 1 ? '' : 's'}.`;
    if (st.kind === 'atbMult') {
      const dir = st.factor > 1 ? 'Speeds ATB' : 'Slows ATB';
      return `${dir} by ${Math.round(Math.abs(1 - st.factor) * 100)}% for ${st.duration} turns.`;
    }
    return '';
  }

  _gemBlurb(g) {
    // Build a short, human-readable summary of what a gem actually does
    // when slotted: stats, granted skill(s), linker effect, summon, status,
    // and passive bonuses. Used in the gem inventory list and the slot picker.
    const tmpl = g.template;
    const eff = gemEffects(g);
    const parts = [];
    const statsTxt = Object.entries(eff.stats).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(' · ');
    if (statsTxt) parts.push(statsTxt);
    const grantNames = eff.grants
      .map(id => SKILL_BY_ID[id]?.name)
      .filter(Boolean);
    if (tmpl.summon && grantNames.length) {
      parts.push(`Summon: ${grantNames[0]}`);
    } else if (tmpl.linker) {
      const label = tmpl.linkerEffect === 'all'     ? 'AoE on linked spell'
                  : tmpl.linkerEffect === 'double'  ? '2× cast on linked spell'
                  : tmpl.linkerEffect === 'quad'    ? '4× cast on linked spell'
                  : tmpl.linkerEffect === 'counter' ? 'Counter when hit'
                  : 'Linker';
      parts.push(label);
    } else if (grantNames.length) {
      parts.push(`Grants ${grantNames.join(', ')}`);
    }
    if (eff.attackStatus) {
      const st = STATUS_BY_ID[eff.attackStatus.id];
      const pct = Math.round((eff.attackStatus.chance ?? 1) * 100);
      parts.push(`+${pct}% ${st?.name || eff.attackStatus.id} on hit`);
    }
    if (eff.atbMult) parts.push(`ATB ×${eff.atbMult.toFixed(2)}`);
    if (eff.xpBonus) parts.push(`+${Math.round(eff.xpBonus * 100)}% XP`);
    if (eff.goldBonus) parts.push(`+${Math.round(eff.goldBonus * 100)}% gold`);
    return parts.join(' · ') || tmpl.desc;
  }

  _openGemPicker(eq, slotIdx) {
    const available = this.game.inventory.gems;
    if (!available.length) { this.game.ui.toast('No gems to slot.'); return; }
    this.bodyEl.innerHTML = '';
    const heading = document.createElement('div');
    heading.className = 'ovHeading';
    heading.textContent = `SLOT INTO ${eq.template.name.toUpperCase()}`;
    this.bodyEl.appendChild(heading);
    for (const g of available) {
      const desc = this._gemBlurb(g);
      const row = document.createElement('div');
      row.className = 'ovRow';
      row.style.borderColor = g.template.color;
      row.innerHTML = `
        <div class="icon">${g.template.icon}</div>
        <div class="body">
          <div class="name">${g.template.name} <span class="tag">Lv ${g.level}</span></div>
          <div class="desc">${desc}</div>
        </div>
        <div class="actions"><button>Slot</button></div>`;
      row.querySelector('button').addEventListener('click', () => { this.game.slotGem(this.selectedMemberIdx, eq, slotIdx, g); audio.play('confirm'); this._renderBody(); });
      this.bodyEl.appendChild(row);
    }
    const back = document.createElement('button');
    back.className = 'ovClose';
    back.textContent = '← Back';
    back.style.alignSelf = 'flex-start';
    back.addEventListener('click', () => { audio.play('menu'); this._renderBody(); });
    this.bodyEl.appendChild(back);
  }

  _renderGems() {
    const heading = document.createElement('div');
    heading.className = 'ovHeading';
    heading.textContent = 'INVENTORY GEMS (SHARED)';
    this.bodyEl.appendChild(heading);
    if (!this.game.inventory.gems.length) {
      this.bodyEl.innerHTML += `<div class="ovEmpty">No spare gems. Slot them via the Equip tab.</div>`;
    } else {
      for (const g of this.game.inventory.gems) {
        const need = gemXpToNext(g);
        const xp = need == null ? 'MAX' : `XP ${g.xp}/${need}`;
        const tag = this._gemBlurb(g);
        const row = document.createElement('div');
        row.className = 'ovRow';
        row.style.borderColor = g.template.color;
        row.innerHTML = `
          <div class="icon">${g.template.icon}</div>
          <div class="body">
            <div class="name">${g.template.name} <span class="tag">Lv ${g.level} · ${xp}</span></div>
            <div class="desc">${tag}</div>
          </div>`;
        this.bodyEl.appendChild(row);
      }
    }
    const h2 = document.createElement('div');
    h2.className = 'ovHeading';
    h2.textContent = 'SLOTTED ON PARTY';
    this.bodyEl.appendChild(h2);
    let any = false;
    for (const m of this.game.party) {
      for (const slot of ['weapon', 'armor', 'accessory']) {
        const inst = m.equipped[slot];
        if (!inst || !inst.template.gemSlots) continue;
        for (const g of inst.gems) {
          if (!g) continue;
          any = true;
          const need = gemXpToNext(g);
          const xp = need == null ? 'MAX' : `XP ${g.xp}/${need}`;
          const row = document.createElement('div');
          row.className = 'ovRow equipped';
          row.innerHTML = `
            <div class="icon">${g.template.icon}</div>
            <div class="body">
              <div class="name">${g.template.name} <span class="tag">Lv ${g.level} · ${xp}</span></div>
              <div class="desc">${m.name}'s ${inst.template.name} (${slot})</div>
            </div>`;
          this.bodyEl.appendChild(row);
        }
      }
    }
    if (!any) this.bodyEl.innerHTML += `<div class="ovEmpty">Nothing slotted.</div>`;
  }

  _renderStatus() {
    const strip = this._memberStrip();
    if (strip) this.bodyEl.appendChild(strip);
    const p = this.game.party[this.selectedMemberIdx];
    if (!p) return;
    const cls = CLASS_BY_ID[p.classId];
    const lines = [
      ['Class', cls ? `${cls.icon} ${cls.name}` : '—'],
      ['Level', p.level],
      ['XP', `${Math.floor(p.xp)} / ${p.xpToNext}`],
      ['Gold (shared)', this.game.gold],
      ['HP', `${Math.ceil(p.hp)} / ${p.maxHp}`],
      ['MP', `${Math.ceil(p.mp)} / ${p.maxMp}`],
      ['ATK', p.atk],
      ['DEF', p.def],
      ['MAG', p.mag],
      ['SPD', p.spd],
    ];
    for (const [k, v] of lines) {
      const row = document.createElement('div');
      row.className = 'ovStat';
      row.innerHTML = `<span>${k}</span><b>${v}</b>`;
      this.bodyEl.appendChild(row);
    }
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:8px;margin-top:14px;';
    const saveBtn = document.createElement('button');
    saveBtn.textContent = '💾 Save Now';
    saveBtn.style.cssText = 'flex:1;background:linear-gradient(135deg,#5aaaff,#7a6aff);border:none;color:#fff;padding:12px;border-radius:10px;font-weight:700;cursor:pointer;';
    saveBtn.addEventListener('click', () => { this.game.save(); audio.play('confirm'); this.game.ui.toast('Saved.'); });
    actions.appendChild(saveBtn);
    const eraseBtn = document.createElement('button');
    eraseBtn.textContent = '🗑 Erase Save';
    eraseBtn.style.cssText = 'flex:1;background:rgba(255,90,110,0.2);border:1px solid #ff5a6e;color:#ff5a6e;padding:12px;border-radius:10px;font-weight:700;cursor:pointer;';
    eraseBtn.addEventListener('click', () => {
      this.game.ui.showDialog('System', ['Erase your save? This cannot be undone.'], ['Erase', 'Cancel'], idx => {
        if (idx === 0) { this.game.eraseSave(); this.game.ui.toast('Save erased.'); audio.play('hurt'); }
      });
    });
    actions.appendChild(eraseBtn);
    this.bodyEl.appendChild(actions);
  }
}

function describeBonus(tmpl) {
  const parts = [];
  for (const k of ['atk', 'def', 'mag', 'spd', 'maxHp', 'maxMp']) {
    if (tmpl[k]) parts.push(`+${tmpl[k]} ${k.toUpperCase()}`);
  }
  if (tmpl.grants?.length) parts.push(`grants ${tmpl.grants.join(', ')}`);
  return parts.join(' · ') || '—';
}
