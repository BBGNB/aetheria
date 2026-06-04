// Gem catalog — original-to-Aetheria upgrade system (materia analog).
//
// Each gem definition:
//   id, name, icon, color, desc
//   maxLevel, xpCurve    — how to level up
//   grantsByLevel        — gem level -> skill id granted while slotted
//   statsByLevel         — gem level -> stat bonuses
// Combos are defined separately in combos.js.
//
// A gem instance carries its current `level` and `xp`. It is stored either
// in the player's `inventory.gems[]` or slotted into an equipment's `gems[]`
// array (one socket = one gem instance reference, or null).
//
// Levels 1–5. Spell-granting gems unlock new tiers at Lv1/2/3; Lv4/5 are
// "mastery" levels that only boost stats + the combo MP discount. Reaching
// Lv5 on any gem spawns a fresh Lv1 copy of the same gem in inventory.
export const GEMS = [
  {
    id: 'emberCore', name: 'Ember Core', icon: '🔴', color: '#ff5a3b',
    desc: 'A flicker of flame. Grants Fire and stronger tiers as it levels.',
    maxLevel: 5, xpCurve: [200, 600, 1500, 3500],
    grantsByLevel: { 1: ['fire'], 2: ['fira'], 3: ['firaga'], 4: [], 5: [] },
    statsByLevel: { 1: {}, 2: { mag: 2 }, 3: { mag: 5 }, 4: { mag: 8 }, 5: { mag: 12 } },
  },
  {
    id: 'tideShard', name: 'Tide Shard', icon: '🔵', color: '#3bb6ff',
    desc: 'Cool to the touch. Grants Ice tiers.',
    maxLevel: 5, xpCurve: [200, 600, 1500, 3500],
    grantsByLevel: { 1: ['ice'], 2: ['blizzara'], 3: ['blizzaga'], 4: [], 5: [] },
    statsByLevel: { 1: {}, 2: { mag: 2 }, 3: { mag: 5 }, 4: { mag: 8 }, 5: { mag: 12 } },
  },
  {
    id: 'stormPearl', name: 'Storm Pearl', icon: '⚡', color: '#ffd84d',
    desc: 'Crackles softly. Grants Thunder tiers.',
    maxLevel: 5, xpCurve: [200, 600, 1500, 3500],
    grantsByLevel: { 1: ['thunder'], 2: ['thundara'], 3: ['thundaga'], 4: [], 5: [] },
    statsByLevel: { 1: {}, 2: { mag: 2 }, 3: { mag: 5 }, 4: { mag: 8 }, 5: { mag: 12 } },
  },
  {
    id: 'deepTide', name: 'Deep Tide', icon: '🌊', color: '#3bb6c8',
    desc: 'A drop of unending ocean. Grants Water tiers.',
    maxLevel: 5, xpCurve: [200, 600, 1500, 3500],
    grantsByLevel: { 1: ['water'], 2: ['watera'], 3: ['waterga'], 4: [], 5: [] },
    statsByLevel: { 1: {}, 2: { mag: 2 }, 3: { mag: 5 }, 4: { mag: 8 }, 5: { mag: 12 } },
  },
  {
    id: 'voidshard', name: 'Void Shard', icon: '🕳️', color: '#5a2070',
    desc: 'A sliver of the rift. Grants Blight tiers.',
    maxLevel: 5, xpCurve: [240, 700, 1700, 3800],
    grantsByLevel: { 1: ['blight'], 2: ['blighta'], 3: ['blightga'], 4: [], 5: [] },
    statsByLevel: { 1: {}, 2: { mag: 2 }, 3: { mag: 5 }, 4: { mag: 8 }, 5: { mag: 12 } },
  },
  {
    id: 'bloomroot', name: 'Bloomroot', icon: '🌵', color: '#7aaa3a',
    desc: 'A living root that hums when struck. Grants Thorn tiers.',
    maxLevel: 5, xpCurve: [200, 600, 1500, 3500],
    grantsByLevel: { 1: ['thorn'], 2: ['thornra'], 3: ['thornga'], 4: [], 5: [] },
    statsByLevel: { 1: {}, 2: { mag: 2 }, 3: { mag: 5 }, 4: { mag: 8 }, 5: { mag: 12 } },
  },
  {
    id: 'dawnstone', name: 'Dawnstone', icon: '☀️', color: '#ffd884',
    desc: 'Warm even in shadow. Grants Holy tiers.',
    maxLevel: 5, xpCurve: [240, 700, 1700, 3800],
    grantsByLevel: { 1: ['holy'], 2: ['holyra'], 3: ['holyga'], 4: [], 5: [] },
    statsByLevel: { 1: {}, 2: { mag: 2 }, 3: { mag: 5 }, 4: { mag: 8 }, 5: { mag: 12 } },
  },
  {
    id: 'acidvial', name: 'Acid Vial', icon: '🧪', color: '#9aaa3b',
    desc: 'A sealed phial that hisses against the inside. Grants Bio tiers.',
    maxLevel: 5, xpCurve: [240, 700, 1700, 3800],
    grantsByLevel: { 1: ['bio'], 2: ['biora'], 3: ['bioga'], 4: [], 5: [] },
    statsByLevel: { 1: {}, 2: { mag: 2 }, 3: { mag: 5 }, 4: { mag: 8 }, 5: { mag: 12 } },
  },
  {
    id: 'lifebloom', name: 'Lifebloom', icon: '🌿', color: '#7aff8a',
    desc: 'Pulses with vitality. Grants Heal tiers.',
    maxLevel: 5, xpCurve: [200, 600, 1500, 3500],
    grantsByLevel: { 1: ['heal'], 2: ['cure'], 3: ['curaga'], 4: [], 5: [] },
    statsByLevel: {
      1: {}, 2: { mag: 2, maxMp: 4 }, 3: { mag: 4, maxMp: 8 },
      4: { mag: 6, maxMp: 14 }, 5: { mag: 9, maxMp: 22 },
    },
  },
  {
    id: 'wardStone', name: 'Ward Stone', icon: '🛡️', color: '#7adaff',
    desc: 'Stout and steady. Boosts defense.',
    maxLevel: 5, xpCurve: [250, 700, 1700, 3800],
    grantsByLevel: { 1: [], 2: [], 3: [], 4: [], 5: [] },
    statsByLevel: { 1: { def: 3 }, 2: { def: 6 }, 3: { def: 10 }, 4: { def: 15 }, 5: { def: 22 } },
  },
  {
    id: 'vigorStone', name: 'Vigor Stone', icon: '❤️', color: '#ff3b6e',
    desc: 'Throbs with life. Boosts maximum HP.',
    maxLevel: 5, xpCurve: [250, 700, 1700, 3800],
    grantsByLevel: { 1: [], 2: [], 3: [], 4: [], 5: [] },
    statsByLevel: { 1: { maxHp: 12 }, 2: { maxHp: 26 }, 3: { maxHp: 44 }, 4: { maxHp: 65 }, 5: { maxHp: 90 } },
  },
  {
    id: 'mightCore', name: 'Might Core', icon: '💪', color: '#ff8a3b',
    desc: 'Trembles with raw force. Grants Power Slash tiers.',
    maxLevel: 5, xpCurve: [250, 700, 1700, 3800],
    grantsByLevel: { 1: ['slash'], 2: ['cleave'], 3: ['sunder'], 4: [], 5: [] },
    statsByLevel: { 1: { atk: 2 }, 2: { atk: 4 }, 3: { atk: 7 }, 4: { atk: 11 }, 5: { atk: 16 } },
  },

  // ---- STATUS GEMS — add status chance to the wearer's basic attacks ------
  {
    id: 'venomFang', name: 'Venom Fang', icon: '🐍', color: '#7aff8a',
    desc: 'Slotted weapon spits poison on hit.',
    maxLevel: 5, xpCurve: [300, 800, 2000, 4500],
    grantsByLevel: { 1: [], 2: [], 3: [], 4: [], 5: [] },
    statsByLevel: { 1: {}, 2: { atk: 1 }, 3: { atk: 2 }, 4: { atk: 4 }, 5: { atk: 6 } },
    attackStatusByLevel: {
      1: { id: 'poison', chance: 0.25 },
      2: { id: 'poison', chance: 0.35 },
      3: { id: 'poison', chance: 0.50 },
      4: { id: 'poison', chance: 0.65 },
      5: { id: 'poison', chance: 0.80 },
    },
  },
  {
    id: 'brandOfCinders', name: 'Brand of Cinders', icon: '🔥', color: '#ff8a3b',
    desc: 'Slotted weapon sears with lingering fire.',
    maxLevel: 5, xpCurve: [300, 800, 2000, 4500],
    grantsByLevel: { 1: [], 2: [], 3: [], 4: [], 5: [] },
    statsByLevel: { 1: {}, 2: { atk: 1 }, 3: { atk: 2 }, 4: { atk: 4 }, 5: { atk: 6 } },
    attackStatusByLevel: {
      1: { id: 'burn', chance: 0.22 },
      2: { id: 'burn', chance: 0.32 },
      3: { id: 'burn', chance: 0.45 },
      4: { id: 'burn', chance: 0.60 },
      5: { id: 'burn', chance: 0.75 },
    },
  },
  {
    id: 'frostAspect', name: 'Frost Aspect', icon: '❄️', color: '#7adaff',
    desc: 'Slotted weapon may lock foes in ice.',
    maxLevel: 5, xpCurve: [350, 900, 2200, 5000],
    grantsByLevel: { 1: [], 2: [], 3: [], 4: [], 5: [] },
    statsByLevel: { 1: {}, 2: { mag: 1 }, 3: { mag: 2 }, 4: { mag: 4 }, 5: { mag: 6 } },
    attackStatusByLevel: {
      1: { id: 'freeze', chance: 0.18 },
      2: { id: 'freeze', chance: 0.28 },
      3: { id: 'freeze', chance: 0.40 },
      4: { id: 'freeze', chance: 0.55 },
      5: { id: 'freeze', chance: 0.70 },
    },
  },
  {
    id: 'sandmanBell', name: 'Sandman Bell', icon: '🔔', color: '#c0a0ff',
    desc: 'Slotted weapon hums a lulling tone.',
    maxLevel: 5, xpCurve: [350, 900, 2200, 5000],
    grantsByLevel: { 1: [], 2: [], 3: [], 4: [], 5: [] },
    statsByLevel: {
      1: {}, 2: { mag: 1 }, 3: { spd: 1, mag: 1 },
      4: { spd: 2, mag: 3 }, 5: { spd: 3, mag: 4 },
    },
    attackStatusByLevel: {
      1: { id: 'sleep', chance: 0.15 },
      2: { id: 'sleep', chance: 0.22 },
      3: { id: 'sleep', chance: 0.32 },
      4: { id: 'sleep', chance: 0.45 },
      5: { id: 'sleep', chance: 0.58 },
    },
  },

  // ---- UTILITY GEMS — passive effects on the wearer ---------------------
  {
    id: 'heartOfSpeed', name: 'Heart of Speed', icon: '💨', color: '#ffd84d',
    desc: 'The wearer\'s ATB fills faster.',
    maxLevel: 5, xpCurve: [300, 800, 2000, 4500],
    grantsByLevel: { 1: [], 2: [], 3: [], 4: [], 5: [] },
    statsByLevel: { 1: { spd: 1 }, 2: { spd: 2 }, 3: { spd: 3 }, 4: { spd: 4 }, 5: { spd: 6 } },
    atbMultByLevel: { 1: 1.15, 2: 1.30, 3: 1.50, 4: 1.70, 5: 2.00 },
  },
  {
    id: 'scholarsEye', name: "Scholar's Eye", icon: '📖', color: '#cdd6e0',
    desc: 'Battles teach more — gain extra XP after victory.',
    maxLevel: 5, xpCurve: [300, 800, 2000, 4500],
    grantsByLevel: { 1: [], 2: [], 3: [], 4: [], 5: [] },
    statsByLevel: { 1: {}, 2: { mag: 1 }, 3: { mag: 2 }, 4: { mag: 3 }, 5: { mag: 5 } },
    xpBonusByLevel: { 1: 0.15, 2: 0.25, 3: 0.40, 4: 0.55, 5: 0.75 },
  },
  {
    id: 'magpieCharm', name: 'Magpie Charm', icon: '🪙', color: '#ffae3b',
    desc: 'Spoils land richer — more gold from victories.',
    maxLevel: 5, xpCurve: [300, 800, 2000, 4500],
    grantsByLevel: { 1: [], 2: [], 3: [], 4: [], 5: [] },
    statsByLevel: { 1: {}, 2: { spd: 1 }, 3: { spd: 2 }, 4: { spd: 3 }, 5: { spd: 4 } },
    goldBonusByLevel: { 1: 0.20, 2: 0.35, 3: 0.55, 4: 0.75, 5: 1.00 },
  },

  // ---- SUMMON GEMS — grant a single high-MP "summon" spell --------------
  // No per-fight cap — the MP cost is the gating mechanism. Levels boost
  // the wearer's MAG so the summon hits harder over time.
  {
    id: 'stagShard', name: 'Stag-Shard', icon: '🦌', color: '#ff7a3b',
    desc: 'A shard of antler-bone humming with cinders. Calls the Ash-Crowned Stag.',
    maxLevel: 5, xpCurve: [600, 1500, 3500, 8000], summon: true,
    grantsByLevel: { 1: ['ashCrownedStag'], 2: ['ashCrownedStag'], 3: ['ashCrownedStag'], 4: ['ashCrownedStag'], 5: ['ashCrownedStag'] },
    statsByLevel: {
      1: { mag: 3 }, 2: { mag: 6 }, 3: { mag: 10, maxMp: 12 },
      4: { mag: 14, maxMp: 18 }, 5: { mag: 20, maxMp: 26 },
    },
  },
  {
    id: 'choirReed', name: 'Choir Reed', icon: '🎶', color: '#7adaff',
    desc: 'A reed of pale glass that still remembers a chorus. Calls the Drowned Choir.',
    maxLevel: 5, xpCurve: [700, 1700, 4000, 9000], summon: true,
    grantsByLevel: { 1: ['drownedChoir'], 2: ['drownedChoir'], 3: ['drownedChoir'], 4: ['drownedChoir'], 5: ['drownedChoir'] },
    statsByLevel: {
      1: { mag: 4 }, 2: { mag: 7 }, 3: { mag: 12, maxMp: 16 },
      4: { mag: 17, maxMp: 24 }, 5: { mag: 24, maxMp: 34 },
    },
  },
  {
    id: 'loomThread', name: 'Loom-Thread', icon: '🕷️', color: '#a060ff',
    desc: 'A thread of silver silk older than memory. Calls the Loom-Mother.',
    maxLevel: 5, xpCurve: [600, 1500, 3500, 8000], summon: true,
    grantsByLevel: { 1: ['loomMother'], 2: ['loomMother'], 3: ['loomMother'], 4: ['loomMother'], 5: ['loomMother'] },
    statsByLevel: {
      1: { mag: 3 }, 2: { mag: 5, spd: 1 }, 3: { mag: 8, spd: 2 },
      4: { mag: 12, spd: 3 }, 5: { mag: 17, spd: 4 },
    },
  },
  {
    id: 'firstChord', name: 'First Chord', icon: '🎼', color: '#ffd884',
    desc: 'A folded scrap of the very first song, before Vael tore it. Calls the Echo of the First Song.',
    maxLevel: 5, xpCurve: [700, 1700, 4000, 9000], summon: true,
    grantsByLevel: { 1: ['echoFirstSong'], 2: ['echoFirstSong'], 3: ['echoFirstSong'], 4: ['echoFirstSong'], 5: ['echoFirstSong'] },
    statsByLevel: {
      1: { mag: 5, maxMp: 8 }, 2: { mag: 8, maxMp: 14 }, 3: { mag: 12, maxMp: 22 },
      4: { mag: 17, maxMp: 32 }, 5: { mag: 24, maxMp: 44 },
    },
  },
  {
    id: 'veilFragment', name: 'Veil Fragment', icon: '🌑', color: '#3a1a4a',
    desc: 'A shard of the membrane between life and death. Calls the Veil-Crawler from the boundary.',
    maxLevel: 5, xpCurve: [700, 1700, 4000, 9000], summon: true,
    grantsByLevel: { 1: ['veilCrawler'], 2: ['veilCrawler'], 3: ['veilCrawler'], 4: ['veilCrawler'], 5: ['veilCrawler'] },
    statsByLevel: {
      1: { mag: 4, spd: 1 }, 2: { mag: 7, spd: 1 }, 3: { mag: 11, spd: 2 },
      4: { mag: 16, spd: 2 }, 5: { mag: 22, spd: 3 },
    },
  },
  {
    id: 'hollowCrown', name: 'Hollow Crown', icon: '👑', color: '#6a3a8a',
    desc: 'An obsidian circlet that hums with old kingship. Calls the Hollow King from beneath the world.',
    maxLevel: 5, xpCurve: [800, 2000, 4500, 10000], summon: true,
    grantsByLevel: { 1: ['hollowKing'], 2: ['hollowKing'], 3: ['hollowKing'], 4: ['hollowKing'], 5: ['hollowKing'] },
    statsByLevel: {
      1: { mag: 5, maxMp: 10 }, 2: { mag: 9, maxMp: 16 }, 3: { mag: 14, maxMp: 26 },
      4: { mag: 20, maxMp: 38 }, 5: { mag: 28, maxMp: 52 },
    },
  },
  {
    id: 'sapphireTear', name: 'Sapphire Tear', icon: '💧', color: '#3b88ff',
    desc: 'A perfect drop of the first ocean, hardened to gem. Calls the Sapphire Tide.',
    maxLevel: 5, xpCurve: [600, 1500, 3500, 8000], summon: true,
    grantsByLevel: { 1: ['sapphireTide'], 2: ['sapphireTide'], 3: ['sapphireTide'], 4: ['sapphireTide'], 5: ['sapphireTide'] },
    statsByLevel: {
      1: { mag: 4, maxMp: 6 }, 2: { mag: 7, maxMp: 12 }, 3: { mag: 11, maxMp: 20 },
      4: { mag: 16, maxMp: 30 }, 5: { mag: 22, maxMp: 42 },
    },
  },
  {
    id: 'sunderedShard', name: 'Sundered Shard', icon: '💔', color: '#ff2a6a',
    desc: 'A fragment of Vael himself — dimly conscious, dangerous to wield. Calls the Sundered Heart.',
    maxLevel: 5, xpCurve: [900, 2200, 5000, 11000], summon: true,
    grantsByLevel: { 1: ['sunderedHeart'], 2: ['sunderedHeart'], 3: ['sunderedHeart'], 4: ['sunderedHeart'], 5: ['sunderedHeart'] },
    statsByLevel: {
      1: { mag: 6, maxMp: 12 }, 2: { mag: 10, maxMp: 20 }, 3: { mag: 15, maxMp: 32 },
      4: { mag: 22, maxMp: 46 }, 5: { mag: 30, maxMp: 64 },
    },
  },
  {
    id: 'auroraSliver', name: 'Aurora Sliver', icon: '🌈', color: '#a0ffd8',
    desc: 'A frozen ribbon of polar light. Calls the Aurora Throne — the seven Order keepers in radiance.',
    maxLevel: 5, xpCurve: [750, 1800, 4200, 9500], summon: true,
    grantsByLevel: { 1: ['auroraThrone'], 2: ['auroraThrone'], 3: ['auroraThrone'], 4: ['auroraThrone'], 5: ['auroraThrone'] },
    statsByLevel: {
      1: { mag: 5, spd: 1 }, 2: { mag: 9, spd: 2 }, 3: { mag: 14, spd: 3 },
      4: { mag: 20, spd: 4 }, 5: { mag: 28, spd: 5 },
    },
  },
  {
    id: 'worldRoot', name: 'World-Root', icon: '🌳', color: '#7aaa3a',
    desc: 'A petrified seed of the first tree — older than the Aetherial Order. Calls the Verdant Colossus, who walked before kings.',
    maxLevel: 5, xpCurve: [1000, 2500, 5500, 12000], summon: true,
    grantsByLevel: { 1: ['verdantColossus'], 2: ['verdantColossus'], 3: ['verdantColossus'], 4: ['verdantColossus'], 5: ['verdantColossus'] },
    statsByLevel: {
      1: { mag: 7, maxMp: 14 }, 2: { mag: 12, maxMp: 24 }, 3: { mag: 18, maxMp: 38 },
      4: { mag: 25, maxMp: 54 }, 5: { mag: 34, maxMp: 72 },
    },
  },

  // ---- LINKER GEMS — only effective when linked to another gem ----------
  // Live in a socket; modify the linked gem's spell when cast. By themselves
  // they do almost nothing (small stat boost).
  {
    id: 'echoingSigil', name: 'Echoing Sigil', icon: '📡', color: '#ffd84d',
    desc: "Support — pair it with any gem in a linked socket group. Any spell that gem grants will hit ALL enemies instead of one. Stacks with other linkers in the same chain (e.g. AoE + 2× / 4× / counter).",
    maxLevel: 5, xpCurve: [400, 1000, 2500, 5500], linker: true, linkerEffect: 'all',
    grantsByLevel: { 1: [], 2: [], 3: [], 4: [], 5: [] },
    statsByLevel: { 1: { mag: 1 }, 2: { mag: 2 }, 3: { mag: 4 }, 4: { mag: 6 }, 5: { mag: 9 } },
  },
  {
    id: 'mirroredSigil', name: 'Mirrored Sigil', icon: '🪞', color: '#cdd6e0',
    desc: "Support — pair it with any gem in a linked socket group. Any spell that gem grants will cast TWICE in a row. Stacks with other linkers in the same chain (AoE, counter). If a 4× Prism Shard shares the chain, it overrides this — cast counts don't multiply.",
    maxLevel: 5, xpCurve: [500, 1200, 3000, 6500], linker: true, linkerEffect: 'double',
    grantsByLevel: { 1: [], 2: [], 3: [], 4: [], 5: [] },
    statsByLevel: {
      1: { mag: 1 }, 2: { mag: 2, spd: 1 }, 3: { mag: 4, spd: 2 },
      4: { mag: 6, spd: 3 }, 5: { mag: 9, spd: 4 },
    },
  },
  {
    id: 'prismShard', name: 'Prism Shard', icon: '💠', color: '#a8e8ff',
    desc: "Support — pair it with any gem in a linked socket group. Any spell that gem grants will cast FOUR TIMES in succession. Costs ~2.8× MP — less than four casts, but still steep. Stacks with other linkers in the same chain (AoE, counter). Overrides Mirror Sigil if both are linked.",
    maxLevel: 5, xpCurve: [700, 1700, 4000, 9000], linker: true, linkerEffect: 'quad',
    grantsByLevel: { 1: [], 2: [], 3: [], 4: [], 5: [] },
    statsByLevel: {
      1: { mag: 2 }, 2: { mag: 4, spd: 1 }, 3: { mag: 7, spd: 2 },
      4: { mag: 10, spd: 3 }, 5: { mag: 14, spd: 4 },
    },
  },
  {
    id: 'vengefulSigil', name: 'Vengeful Sigil', icon: '💢', color: '#ff5a8a',
    desc: "Support — slot it anywhere to enable counters. When the wearer is struck and survives, they retaliate with a basic attack. Linked to a spell-granting gem, it counters with that gem's highest-tier spell instead (half the chained MP cost). Stacks with other linkers in the same chain — pair it with a Prism Shard + summon for a 4× counter-summon, etc. Counters don't trigger counters.",
    maxLevel: 5, xpCurve: [500, 1200, 3000, 6500], linker: true, linkerEffect: 'counter',
    grantsByLevel: { 1: [], 2: [], 3: [], 4: [], 5: [] },
    statsByLevel: {
      1: { atk: 1, spd: 1 }, 2: { atk: 2, spd: 1 }, 3: { atk: 4, spd: 2 },
      4: { atk: 6, spd: 3 }, 5: { atk: 9, spd: 4 },
    },
  },
];

export const GEM_BY_ID = Object.fromEntries(GEMS.map(g => [g.id, g]));

export function createGemInstance(id) {
  const tmpl = GEM_BY_ID[id];
  if (!tmpl) return null;
  return { id, template: tmpl, level: 1, xp: 0 };
}

export function gemEffects(instance) {
  if (!instance) return { stats: {}, grants: [] };
  const tmpl = instance.template;
  const lv = Math.min(instance.level, tmpl.maxLevel);
  // Cumulative grants: a leveled gem keeps every prior tier's skills
  // available (Fire/Fira/Firaga all castable from a Lv3 Ember Core) so the
  // player can still spend the cheap base on chip damage when MP is tight.
  const grantsSet = new Set();
  for (let l = 1; l <= lv; l++) {
    for (const id of (tmpl.grantsByLevel[l] || [])) grantsSet.add(id);
  }
  const eff = {
    stats: { ...(tmpl.statsByLevel[lv] || {}) },
    grants: [...grantsSet],
  };
  if (tmpl.attackStatusByLevel?.[lv]) eff.attackStatus = tmpl.attackStatusByLevel[lv];
  if (tmpl.atbMultByLevel?.[lv]) eff.atbMult = tmpl.atbMultByLevel[lv];
  if (tmpl.xpBonusByLevel?.[lv]) eff.xpBonus = tmpl.xpBonusByLevel[lv];
  if (tmpl.goldBonusByLevel?.[lv]) eff.goldBonus = tmpl.goldBonusByLevel[lv];
  return eff;
}

// Total XP needed for the gem to reach the *next* level (1 -> 2 etc).
// Returns null if already at max level.
export function gemXpToNext(instance) {
  if (!instance) return null;
  const tmpl = instance.template;
  if (instance.level >= tmpl.maxLevel) return null;
  return tmpl.xpCurve[instance.level - 1];
}

// Mutates the instance: adds xp, applies level ups. Returns array of new
// levels reached. If maxLevel is reached, the LAST entry in the array equals
// `instance.template.maxLevel` — callers can detect mastery from that and
// spawn a Lv1 duplicate in inventory.
export function addGemXp(instance, amount) {
  if (!instance) return [];
  const reached = [];
  let need = gemXpToNext(instance);
  instance.xp += amount;
  while (need != null && instance.xp >= need) {
    instance.xp -= need;
    instance.level++;
    reached.push(instance.level);
    need = gemXpToNext(instance);
  }
  if (need == null) instance.xp = 0;
  return reached;
}
