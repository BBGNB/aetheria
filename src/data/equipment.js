// Equipment catalog. Each piece occupies one of three slots: weapon, armor, accessory.
// Stat fields are added to player base stats when equipped.
// `gemSlots` is the number of gem sockets (used by the future gem/materia system).
// `grants` is a list of skill ids granted while the item is equipped (in addition to
// level-based skills).
//
// Future-proofing note: gems are stored separately and slotted at runtime. See
// gems.js. Items in this catalog are templates; equipped instances are created via
// `createEquipmentInstance(id)` so each carries its own gem layout.
export const EQUIPMENT = [
  // Weapons
  { id: 'rustySword',  name: 'Rusty Sword',  slot: 'weapon', icon: '🗡️', atk: 0, gemSlots: 0, desc: 'A nicked blade. Better than fists.' },
  { id: 'ironSword',   name: 'Iron Sword',   slot: 'weapon', icon: '⚔️', atk: 4, gemSlots: 1, desc: 'Well-balanced steel.' },
  { id: 'flameBrand',  name: 'Flame Brand',  slot: 'weapon', icon: '🔥', atk: 7, gemSlots: 2, linkedSlots: [[0, 1]], desc: 'Hums with latent heat. Its two sockets share a link.', grants: ['fire'] },
  { id: 'soulforge',   name: 'Soulforge Blade', slot: 'weapon', icon: '🗡️', atk: 10, gemSlots: 3, linkedSlots: [[0, 1]], desc: 'Three sockets, the first two linked.' },

  // Armor
  { id: 'travelCloak', name: 'Travel Cloak', slot: 'armor', icon: '🧥', def: 0, gemSlots: 0, desc: 'Worn but trustworthy.' },
  { id: 'leatherArmor',name: 'Leather Armor',slot: 'armor', icon: '🛡️', def: 3, gemSlots: 1, desc: 'Tough hide stitching.' },
  { id: 'cinderRobe',  name: 'Sable\'s Cinder Robe', slot: 'armor', icon: '🥋', def: 5, mag: 4, maxMp: 14, gemSlots: 2, linkedSlots: [[0, 1]], desc: 'A slategrey robe woven by Sable in his exile. Smells faintly of woodsmoke. Its two sockets share a link.' },

  // Accessories
  { id: 'silverRing',  name: 'Silver Ring',  slot: 'accessory', icon: '💍', mag: 2, gemSlots: 1, desc: 'Slightly tingles.' },
  { id: 'amulet',      name: 'Hearty Amulet',slot: 'accessory', icon: '📿', maxHp: 10, gemSlots: 0, desc: 'Steadies your nerves.' },
  { id: 'choirthreadBrooch', name: 'Choirthread Brooch', slot: 'accessory', icon: '🎼', mag: 3, maxMp: 10, gemSlots: 1, desc: 'Mira\'s craft — Warden essence woven into thread. Sings faintly.' },
  { id: 'tendersBrace', name: 'Tender\'s Brace', slot: 'accessory', icon: '🌿', def: 3, maxHp: 24, gemSlots: 1, desc: 'A bracelet braided from healing reeds. The Caretaker\'s thanks.' },
  { id: 'bloomsilkVeil', name: 'Bloomsilk Veil', slot: 'accessory', icon: '🎭', mag: 5, maxMp: 18, spd: 2, gemSlots: 2, linkedSlots: [[0, 1]], desc: 'Mira\'s craft — Bloom petal-silk woven against the song of the Sundered. Its two sockets share a link.' },

  // ---- TEST / SANDBOX EQUIPMENT (free in shop, for combo experimentation) ----
  { id: 'testLink2', name: 'Test Twinlink', slot: 'weapon', icon: '🧪', atk: 4, gemSlots: 2, linkedSlots: [[0, 1]], desc: 'Sandbox piece — two linked sockets. For testing any 2-gem pair combo.' },
  { id: 'testLink3', name: 'Test Trilink', slot: 'armor', icon: '🧪', def: 3, gemSlots: 3, linkedSlots: [[0, 1], [1, 2]], desc: 'Sandbox piece — three sockets chained (0↔1 and 1↔2). Tests trio combos plus overlapping pair combos.' },
  { id: 'testLink4', name: 'Test Quadlink', slot: 'accessory', icon: '🧪', mag: 3, gemSlots: 4, linkedSlots: [[0, 1], [2, 3]], desc: 'Sandbox piece — four sockets in two linked pairs. Enough for the 4-gem Ultima fusion AND two simultaneous pair combos.' },
];

export const EQUIP_BY_ID = Object.fromEntries(EQUIPMENT.map(e => [e.id, e]));

export function createEquipmentInstance(id) {
  const tmpl = EQUIP_BY_ID[id];
  if (!tmpl) return null;
  return {
    id, template: tmpl,
    // Each gem slot holds null or a gem-instance id pointer (resolved at use).
    gems: new Array(tmpl.gemSlots).fill(null),
  };
}

// Compute connected-component link groups. Each returned array is a set of
// socket indices that are transitively linked (e.g. linkedSlots
// `[[0,1],[1,2]]` yields `[[0,1,2]]`). Singleton sockets are omitted —
// only groups of size >= 2 are returned. Within a group, ANY pair of
// sockets counts as "linked" for combo and linker-resolution purposes.
export function linkGroups(equipInstance) {
  if (!equipInstance?.template) return [];
  const n = equipInstance.template.gemSlots || 0;
  if (!n) return [];
  const links = equipInstance.template.linkedSlots || [];
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x) => parent[x] === x ? x : (parent[x] = find(parent[x]));
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; };
  for (const [a, b] of links) union(a, b);
  const buckets = new Map();
  for (let i = 0; i < n; i++) {
    const r = find(i);
    if (!buckets.has(r)) buckets.set(r, []);
    buckets.get(r).push(i);
  }
  return [...buckets.values()].filter(g => g.length > 1);
}

// The link group (array of socket indices) containing sourceSlotIdx, or null
// if that socket isn't part of any link group.
export function linkGroupFor(equipInstance, sourceSlotIdx) {
  for (const g of linkGroups(equipInstance)) {
    if (g.includes(sourceSlotIdx)) return g;
  }
  return null;
}

// All linker gems in the same connected group as the source socket (excluding
// the source itself). Used by the cast layer to compose multiple linkers
// (Mirror + Echoing + Vengeful etc.) on the same chain.
export function findAllLinkersFor(equipInstance, sourceSlotIdx) {
  const group = linkGroupFor(equipInstance, sourceSlotIdx);
  if (!group) return [];
  const out = [];
  for (const idx of group) {
    if (idx === sourceSlotIdx) continue;
    const g = equipInstance.gems[idx];
    if (g?.template?.linker) out.push(g);
  }
  return out;
}

// Legacy single-linker accessor — returns the first linker in the source
// gem's connected group, preserving older call sites.
export function findLinkerFor(equipInstance, sourceSlotIdx) {
  const linkers = findAllLinkersFor(equipInstance, sourceSlotIdx);
  return linkers[0] || null;
}

// Given a gem instance and the equipment it lives in, find which slot it
// occupies (or -1 if not slotted there).
export function slotIdxOf(equipInstance, gemInstance) {
  if (!equipInstance) return -1;
  return equipInstance.gems.indexOf(gemInstance);
}

// Compute the stat bonus, granted skills, and the set of gem ids slotted
// into this equipment instance. `gemEffectsFn` derives stats/grants from a
// gem instance (typically `gemEffects` from gems.js).
export function computeEquipBonus(instance, gemEffectsFn) {
  if (!instance) return { stats: {}, grants: [], slottedGemIds: [] };
  const tmpl = instance.template;
  const stats = {};
  for (const key of ['atk', 'def', 'mag', 'spd', 'maxHp', 'maxMp']) {
    if (tmpl[key]) stats[key] = (stats[key] || 0) + tmpl[key];
  }
  const grants = tmpl.grants ? [...tmpl.grants] : [];
  const slottedGemIds = [];
  for (const gemInst of (instance.gems || [])) {
    if (!gemInst) continue;
    slottedGemIds.push(gemInst.id);
    const eff = gemEffectsFn ? gemEffectsFn(gemInst) : null;
    if (!eff) continue;
    for (const k of Object.keys(eff.stats)) stats[k] = (stats[k] || 0) + eff.stats[k];
    for (const g of eff.grants) grants.push(g);
  }
  return { stats, grants, slottedGemIds };
}
