// Save/load — localStorage backed. We strip non-serializable template
// references on save and re-link them on load via the data catalogs.
import { EQUIP_BY_ID, createEquipmentInstance } from './data/equipment.js';
import { GEM_BY_ID, createGemInstance } from './data/gems.js';
import { rebuildStats } from './game.js';

const KEY = 'aetheria.save.v3';
const VERSION = 3;

function serializeGem(g) {
  if (!g) return null;
  return { id: g.id, level: g.level, xp: g.xp };
}

function deserializeGem(obj) {
  if (!obj) return null;
  const inst = createGemInstance(obj.id);
  if (!inst) return null;
  inst.level = obj.level ?? 1;
  inst.xp = obj.xp ?? 0;
  return inst;
}

function serializeEquip(e) {
  if (!e) return null;
  return { id: e.id, gems: (e.gems || []).map(serializeGem) };
}

function deserializeEquip(obj) {
  if (!obj) return null;
  const inst = createEquipmentInstance(obj.id);
  if (!inst) return null;
  for (let i = 0; i < inst.gems.length; i++) {
    inst.gems[i] = deserializeGem(obj.gems?.[i]);
  }
  return inst;
}

function serializeMember(m) {
  return {
    name: m.name,
    classId: m.classId,
    level: m.level,
    xp: m.xp,
    xpToNext: m.xpToNext,
    sp: m.sp ?? 0,
    learnedNodes: [...(m.learnedNodes || [])],
    hp: m.hp, mp: m.mp,
    base: { ...m.base },
    overworld: { ...m.overworld },
    equipped: {
      weapon: serializeEquip(m.equipped.weapon),
      armor: serializeEquip(m.equipped.armor),
      accessory: serializeEquip(m.equipped.accessory),
    },
  };
}

function deserializeMember(sm) {
  const m = {
    name: sm.name,
    classId: sm.classId || 'fighter',
    level: sm.level,
    xp: sm.xp,
    xpToNext: sm.xpToNext,
    sp: sm.sp ?? 0,
    learnedNodes: new Set(sm.learnedNodes || []),
    base: { ...sm.base },
    hp: sm.hp, mp: sm.mp,
    maxHp: 0, maxMp: 0, atk: 0, def: 0, mag: 0, spd: 0,
    skills: [],
    equipped: {
      weapon: deserializeEquip(sm.equipped?.weapon),
      armor:  deserializeEquip(sm.equipped?.armor),
      accessory: deserializeEquip(sm.equipped?.accessory),
    },
    overworld: { ...(sm.overworld || { x: null, y: null, facing: 0 }) },
  };
  rebuildStats(m);
  m.hp = Math.min(sm.hp ?? m.maxHp, m.maxHp);
  m.mp = Math.min(sm.mp ?? m.maxMp, m.maxMp);
  return m;
}

export function toSave(game) {
  return {
    version: VERSION,
    savedAt: Date.now(),
    currentMapId: game.currentMapId,
    defeatedEnemies: [...game.defeatedEnemies],
    recruited: [...(game.recruited || [])],
    searched: [...(game.searched || [])],
    flags: [...(game.flags || [])],
    gold: game.gold,
    inventory: {
      consumables: { ...game.inventory.consumables },
      equipment: game.inventory.equipment.map(serializeEquip),
      gems: game.inventory.gems.map(serializeGem),
    },
    party: game.party.map(serializeMember),
  };
}

export function applySave(game, data) {
  if (!data || data.version !== VERSION) return false;
  game.currentMapId = data.currentMapId || 'meadow';
  game.defeatedEnemies = new Set(data.defeatedEnemies || []);
  game.recruited = new Set(data.recruited || []);
  game.searched = new Set(data.searched || []);
  game.flags = new Set(data.flags || []);
  game.gold = data.gold ?? 0;
  game.inventory = {
    consumables: { ...(data.inventory?.consumables || {}) },
    equipment: (data.inventory?.equipment || []).map(deserializeEquip).filter(Boolean),
    gems: (data.inventory?.gems || []).map(deserializeGem).filter(Boolean),
  };
  game.party = (data.party || []).map(deserializeMember);
  return game.party.length > 0;
}

export function hasSave() {
  try { return !!localStorage.getItem(KEY); } catch { return false; }
}

export function write(game) {
  try {
    const blob = JSON.stringify(toSave(game));
    localStorage.setItem(KEY, blob);
    return true;
  } catch (e) {
    console.warn('Save failed', e);
    return false;
  }
}

export function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Load failed', e);
    return null;
  }
}

export function clear() {
  try { localStorage.removeItem(KEY); } catch {}
}

export function summary() {
  const d = read();
  if (!d) return null;
  return {
    level: d.party?.[0]?.level ?? 1,
    name: d.party?.[0]?.name ?? 'Hero',
    map: d.currentMapId ?? 'meadow',
    gold: d.gold ?? 0,
    savedAt: d.savedAt ?? 0,
  };
}
