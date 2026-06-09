// XP needed to reach the next level FROM the given level.
// Total XP at start of level N = sum of xpForLevel(1..N-1).
//
// Smooth polynomial curve scaling Lv 1 → 50 (and beyond). Single formula,
// no piecewise spike at Lv 10. Designed so a full Lv 1→50 playthrough
// takes ~30-40 hours of mixed story + grinding, with each level feeling
// like an event rather than a chore. Growth deceleration:
//   Lv  1 → next: 28 XP        Lv 25 → next: ~2,257 XP
//   Lv  5 → next: 120 XP       Lv 30 → next: ~3,290 XP
//   Lv 10 → next: 335 XP       Lv 40 → next: ~6,500 XP
//   Lv 15 → next: 690 XP       Lv 50 → next: ~11,270 XP
//   Lv 20 → next: 1,340 XP
// Cumulative to reach Lv 50 ≈ 150,000 XP. At ~3,000-5,000 XP/hour from
// random encounters + bosses, that's the 30-40 hour leveling target.
// Adjustments to enemy XP per chapter scale the actual pace.
export function xpForLevel(level) {
  return Math.floor(15 + level * 12 + level * level * 1.6 + Math.pow(level, 3) * 0.04);
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
