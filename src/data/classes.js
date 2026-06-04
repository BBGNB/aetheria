// Character classes. Each class has its own base stats, per-level growth,
// and a skill tree of nodes the player buys with SP. A node grants exactly
// one skill (active or passive). Tiered skills (slash→cleave→sunder) are
// resolved automatically by resolveTieredSkills so unlocking a higher tier
// hides the base.
export const CLASSES = [
  {
    id: 'fighter',
    name: 'Fighter',
    icon: '⚔️',
    desc: 'Steel and grit. Trades magic for raw damage and durability.',
    base:   { maxHp: 48, maxMp: 6,  atk: 11, def: 6, mag: 3,  spd: 5 },
    growth: { maxHp: 9,  maxMp: 1,  atk: 2.0, def: 1.5, mag: 0.3, spd: 0.6 },
    startingNodes: ['f.slash'],
    tree: [
      { id: 'f.slash',     grants: 'slash',         cost: 1, requires: [] },
      { id: 'f.iron',      grants: 'ironSkin',      cost: 1, requires: [] },
      { id: 'f.vit',       grants: 'vitality',      cost: 2, requires: ['f.iron'], levelReq: 3 },
      { id: 'f.cleave',    grants: 'cleave',        cost: 2, requires: ['f.slash'], levelReq: 4 },
      { id: 'f.overhead',  grants: 'overhead',      cost: 2, requires: ['f.slash'], levelReq: 4 },
      { id: 'f.earthsplit',grants: 'earthsplit',    cost: 2, requires: ['f.overhead'], levelReq: 6 },
      { id: 'f.rally',     grants: 'rallyingCry',   cost: 3, requires: ['f.vit'], levelReq: 6 },
      { id: 'f.bulwark',   grants: 'ironBulwark',   cost: 3, requires: ['f.iron'], levelReq: 7 },
      { id: 'f.stone',     grants: 'stoneSkin',     cost: 3, requires: ['f.vit'], levelReq: 8 },
      { id: 'f.sentinel',  grants: 'sentinel',      cost: 3, requires: ['f.stone'], levelReq: 9 },
      { id: 'f.sunder',    grants: 'sunder',        cost: 3, requires: ['f.cleave', 'f.earthsplit'], levelReq: 10 },
      { id: 'f.whirlwind', grants: 'whirlwind',     cost: 4, requires: ['f.cleave'], levelReq: 10 },
      { id: 'f.berserker', grants: 'berserkerEdge', cost: 4, requires: ['f.sunder'], levelReq: 11 },
      { id: 'f.roar',      grants: 'standingRoar',  cost: 4, requires: ['f.rally'], levelReq: 11 },
      { id: 'f.might',     grants: 'warriorsMight', cost: 4, requires: ['f.stone', 'f.sunder'], levelReq: 12 },
      { id: 'f.unbroken',  grants: 'unbroken',      cost: 4, requires: ['f.bulwark', 'f.sentinel'], levelReq: 13 },
      { id: 'f.crusher',   grants: 'crusher',       cost: 5, requires: ['f.sunder', 'f.berserker'], levelReq: 14 },
    ],
  },
  {
    id: 'black',
    name: 'Black Mage',
    icon: '🔮',
    desc: 'Master of destructive elements. Frail but devastating.',
    base:   { maxHp: 30, maxMp: 18, atk: 5,  def: 3,  mag: 11, spd: 5 },
    growth: { maxHp: 4,  maxMp: 4,  atk: 0.6, def: 0.6, mag: 2.2, spd: 0.8 },
    startingNodes: ['b.fire'],
    tree: [
      { id: 'b.focus',     grants: 'focus',      cost: 2, requires: [] },
      { id: 'b.fire',      grants: 'fire',       cost: 1, requires: [] },
      { id: 'b.ice',       grants: 'ice',        cost: 1, requires: ['b.focus'], levelReq: 2 },
      { id: 'b.thunder',   grants: 'thunder',    cost: 1, requires: ['b.focus'], levelReq: 3 },
      { id: 'b.manaSurge', grants: 'manaSurge',  cost: 2, requires: ['b.focus'], levelReq: 4 },
      { id: 'b.fira',      grants: 'fira',       cost: 2, requires: ['b.fire'], levelReq: 5 },
      { id: 'b.blizzara',  grants: 'blizzara',   cost: 2, requires: ['b.ice'], levelReq: 5 },
      { id: 'b.thundara',  grants: 'thundara',   cost: 2, requires: ['b.thunder'], levelReq: 6 },
      { id: 'b.quicksilver', grants: 'quicksilver', cost: 3, requires: ['b.focus'], levelReq: 7 },
      { id: 'b.firaga',    grants: 'firaga',     cost: 3, requires: ['b.fira'], levelReq: 10 },
      { id: 'b.blizzaga',  grants: 'blizzaga',   cost: 3, requires: ['b.blizzara'], levelReq: 10 },
      { id: 'b.thundaga',  grants: 'thundaga',   cost: 3, requires: ['b.thundara'], levelReq: 11 },
      { id: 'b.mindsEye',  grants: 'mindsEye',   cost: 4, requires: ['b.quicksilver'], levelReq: 12 },
      { id: 'b.arcane',    grants: 'arcaneMind', cost: 4, requires: ['b.focus'], levelReq: 13 },
      // ---- Black mage chapter 2+ expansion -------------------------------
      { id: 'b.water',     grants: 'water',      cost: 1, requires: ['b.focus'], levelReq: 4 },
      { id: 'b.watera',    grants: 'watera',     cost: 2, requires: ['b.water'], levelReq: 7 },
      { id: 'b.waterga',   grants: 'waterga',    cost: 3, requires: ['b.watera'], levelReq: 12 },
      { id: 'b.bio',       grants: 'bio',        cost: 1, requires: ['b.focus'], levelReq: 5 },
      { id: 'b.biora',     grants: 'biora',      cost: 2, requires: ['b.bio'], levelReq: 8 },
      { id: 'b.bioga',     grants: 'bioga',      cost: 3, requires: ['b.biora'], levelReq: 13 },
      { id: 'b.blight',    grants: 'blight',     cost: 1, requires: ['b.arcane'], levelReq: 14 },
      { id: 'b.blighta',   grants: 'blighta',    cost: 2, requires: ['b.blight'], levelReq: 15 },
      { id: 'b.blightga',  grants: 'blightga',   cost: 3, requires: ['b.blighta'], levelReq: 17 },
      { id: 'b.osmose',    grants: 'osmose',     cost: 2, requires: ['b.quicksilver'], levelReq: 9 },
      { id: 'b.flare',     grants: 'flare',      cost: 5, requires: ['b.firaga','b.blizzaga','b.thundaga'], levelReq: 16 },
      { id: 'b.meteor',    grants: 'meteor',     cost: 5, requires: ['b.flare'], levelReq: 18 },
      { id: 'b.ultima',    grants: 'ultima',     cost: 6, requires: ['b.meteor','b.blightga'], levelReq: 20 },
    ],
  },
  {
    id: 'white',
    name: 'White Mage',
    icon: '✨',
    desc: 'Healer and bulwark. Sustains the party.',
    base:   { maxHp: 36, maxMp: 14, atk: 6,  def: 4,  mag: 9,  spd: 5 },
    growth: { maxHp: 5,  maxMp: 3,  atk: 0.7, def: 1.0, mag: 1.8, spd: 0.7 },
    startingNodes: ['w.heal'],
    tree: [
      { id: 'w.meditate',  grants: 'meditate',    cost: 1, requires: [] },
      { id: 'w.heal',      grants: 'heal',        cost: 1, requires: [] },
      { id: 'w.smite',     grants: 'smite',       cost: 2, requires: ['w.meditate'], levelReq: 3 },
      { id: 'w.spring',    grants: 'manaSpring',  cost: 2, requires: ['w.meditate'], levelReq: 4 },
      { id: 'w.mend',      grants: 'mend',        cost: 2, requires: ['w.heal'], levelReq: 4 },
      { id: 'w.renew',     grants: 'renew',       cost: 3, requires: ['w.heal'], levelReq: 5 },
      { id: 'w.cure',      grants: 'cure',        cost: 3, requires: ['w.heal'], levelReq: 6 },
      { id: 'w.wall',      grants: 'wall',        cost: 3, requires: ['w.meditate'], levelReq: 7 },
      { id: 'w.sanctify',  grants: 'sanctify',    cost: 3, requires: ['w.smite'], levelReq: 8 },
      { id: 'w.purify',    grants: 'purify',      cost: 3, requires: ['w.mend'], levelReq: 8 },
      { id: 'w.wellspring',grants: 'wellspring',  cost: 4, requires: ['w.spring'], levelReq: 9 },
      { id: 'w.curaga',    grants: 'curaga',      cost: 5, requires: ['w.cure', 'w.renew'], levelReq: 10 },
      { id: 'w.sanctuary', grants: 'sanctuary',   cost: 4, requires: ['w.wall'], levelReq: 11 },
      { id: 'w.aegis',     grants: 'aegis',       cost: 4, requires: ['w.sanctuary'], levelReq: 13 },
      { id: 'w.grace',     grants: 'divineGrace', cost: 4, requires: ['w.meditate'], levelReq: 13 },
      // ---- White mage chapter 2+ expansion -------------------------------
      { id: 'w.holy',      grants: 'holy',        cost: 2, requires: ['w.smite'], levelReq: 7 },
      { id: 'w.holyra',    grants: 'holyra',      cost: 3, requires: ['w.holy'], levelReq: 11 },
      { id: 'w.holyga',    grants: 'holyga',      cost: 4, requires: ['w.holyra'], levelReq: 14 },
      { id: 'w.osmose',    grants: 'osmose',      cost: 2, requires: ['w.spring'], levelReq: 8 },
    ],
  },
  {
    id: 'ranger',
    name: 'Ranger',
    icon: '🏹',
    desc: 'Swift archer. Strikes from afar with precision.',
    base:   { maxHp: 40, maxMp: 10, atk: 9,  def: 4,  mag: 6,  spd: 8 },
    growth: { maxHp: 6,  maxMp: 2,  atk: 1.6, def: 0.9, mag: 0.9, spd: 1.4 },
    startingNodes: ['r.aim'],
    tree: [
      { id: 'r.swift',     grants: 'swiftness',  cost: 1, requires: [] },
      { id: 'r.aim',       grants: 'aimedShot',  cost: 1, requires: [] },
      { id: 'r.hawkeye',   grants: 'hawkeye',    cost: 2, requires: ['r.aim'], levelReq: 4 },
      { id: 'r.volley',    grants: 'volley',     cost: 3, requires: ['r.aim'], levelReq: 5 },
      { id: 'r.pierce',    grants: 'pierceShot', cost: 3, requires: ['r.aim'], levelReq: 5 },
      { id: 'r.eagle',     grants: 'eagleEye',   cost: 3, requires: ['r.swift'], levelReq: 7 },
      { id: 'r.tracker',   grants: 'tracker',    cost: 3, requires: ['r.swift'], levelReq: 8 },
      { id: 'r.aimedVolley', grants: 'aimedVolley', cost: 4, requires: ['r.volley'], levelReq: 9 },
      { id: 'r.multi',     grants: 'multishot',  cost: 4, requires: ['r.aimedVolley'], levelReq: 10 },
      { id: 'r.snipe',     grants: 'snipe',      cost: 5, requires: ['r.pierce'], levelReq: 11 },
      { id: 'r.hailstorm', grants: 'hailstorm',  cost: 5, requires: ['r.multi'], levelReq: 12 },
      { id: 'r.lethal',    grants: 'lethalPrec', cost: 4, requires: ['r.eagle'], levelReq: 13 },
    ],
  },
];

export const CLASS_BY_ID = Object.fromEntries(CLASSES.map(c => [c.id, c]));

// Slower SP economy so trees can't be auto-maxed. Forces real lane choices —
// by lv 12 you have 13 SP, enough to commit to one branch but never all.
export const STARTING_SP  = 2;
export const SP_PER_LEVEL = 1;

export function classNodeById(classId, nodeId) {
  const cls = CLASS_BY_ID[classId];
  if (!cls) return null;
  return cls.tree.find(n => n.id === nodeId) || null;
}

// Map a Set of learned node ids to the list of granted skill ids.
export function skillsFromTree(classId, learnedNodes) {
  const cls = CLASS_BY_ID[classId];
  if (!cls || !learnedNodes) return [];
  const out = [];
  for (const n of cls.tree) {
    if (learnedNodes.has(n.id)) out.push(n.grants);
  }
  return out;
}

// 'learned' | 'available' | 'levelLocked' | 'locked'
export function nodeState(classId, nodeId, learnedNodes, level = 1) {
  const node = classNodeById(classId, nodeId);
  if (!node) return 'locked';
  if (learnedNodes.has(nodeId)) return 'learned';
  if (!node.requires.every(r => learnedNodes.has(r))) return 'locked';
  if (node.levelReq && level < node.levelReq) return 'levelLocked';
  return 'available';
}

// Sort the tree so prerequisites appear before their dependents.
export function sortedTree(classId) {
  const cls = CLASS_BY_ID[classId];
  if (!cls) return [];
  const depthCache = new Map();
  const depth = (n) => {
    if (depthCache.has(n.id)) return depthCache.get(n.id);
    const d = n.requires.length
      ? 1 + Math.max(...n.requires.map(r => {
          const req = cls.tree.find(x => x.id === r);
          return req ? depth(req) : 0;
        }))
      : 0;
    depthCache.set(n.id, d);
    return d;
  };
  return [...cls.tree].sort((a, b) => depth(a) - depth(b) || a.id.localeCompare(b.id));
}
