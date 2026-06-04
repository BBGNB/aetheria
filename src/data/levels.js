// XP needed to reach the next level FROM the given level.
// Total XP at start of level N = sum of xpForLevel(1..N-1).
// Scaled up so leveling is something you feel, not something that happens
// every fight or two — pairs with the tightened SP economy.
export function xpForLevel(level) {
  return Math.floor((10 + level * 8 + Math.pow(level, 1.9)) * 1.6);
}

// Stat growth applied to base stats per level.
// Hero stats grow each level by these flat amounts.
export const HERO_GROWTH = {
  maxHp: 6,
  maxMp: 2,
  atk: 1.4,
  def: 1.0,
  mag: 1.0,
  spd: 0.6,
};

export function applyGrowth(stats, levels) {
  const out = { ...stats };
  for (const k of Object.keys(HERO_GROWTH)) {
    out[k] = Math.floor(out[k] + HERO_GROWTH[k] * (levels - 1));
  }
  return out;
}
