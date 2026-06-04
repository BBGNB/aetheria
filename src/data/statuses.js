// Status effect definitions. Each combatant carries an array of active status
// instances: { id, duration, power? }. Effects tick on the affected actor's
// turn start; durations decrement after the actor acts (or after a forced
// skip from an incapacitating status). Haste/Slow apply continuously via
// the ATB fill rate, not on turn ticks.
//
// `persistent: true` — status lasts until cured (Mend/Purify, Echo of First
// Song, Sapphire Tide) or until end of battle. Duration is still set as a
// safety cap but `_tickStatuses` doesn't decrement it. FF7-style — makes
// cleanse spells matter.

export const STATUSES = [
  // ---- Damage over time ------------------------------------------------
  // Poison persists for the whole battle (or until cured) — every turn it
  // drains 6% maxHP. Force the player to cleanse or burn ethers/potions.
  { id: 'poison', name: 'Poison', icon: '☠', color: '#7aff8a',
    kind: 'dotHp', factor: 0.06, duration: 99, persistent: true, negative: true,
    appliedMsg: 'is poisoned!' },
  // Burn is intense but burns out. 5 turns of 8% maxHP — meaningful but
  // self-limiting if you can't cleanse.
  { id: 'burn',   name: 'Burn',   icon: '🔥', color: '#ff8a3b',
    kind: 'dotHp', factor: 0.08, duration: 5, negative: true,
    appliedMsg: 'is burning!' },

  // ---- Heal over time --------------------------------------------------
  { id: 'regen',  name: 'Regen',  icon: '🌱', color: '#a8ffc8',
    kind: 'hotHp', factor: 0.07, duration: 5, negative: false,
    appliedMsg: 'glows with renewal.' },

  // ---- Incapacitating (skip turn) -------------------------------------
  // Freeze locks you out hard — 4 skipped turns. Bumped from 2 so cleanse
  // and the cleansing summons (Echo/Sapphire) genuinely save lives.
  { id: 'freeze', name: 'Freeze', icon: '❄', color: '#7adaff',
    kind: 'skip', duration: 4, negative: true,
    appliedMsg: 'is frozen solid!', skipMsg: 'is frozen!' },
  // Sleep persists until a direct hit wakes you or you're cleansed. DoT
  // ticks don't wake sleepers — only direct attacks via `_applyDamage`.
  { id: 'sleep',  name: 'Sleep',  icon: '💤', color: '#c0a0ff',
    kind: 'skip', duration: 99, persistent: true, wakesOnHit: true, negative: true,
    appliedMsg: 'falls asleep.', skipMsg: 'is asleep!' },
  // Stun = quick stagger. One turn — the interrupt that cancels charged
  // moves. Kept short so it can be applied liberally without trivializing.
  { id: 'stun',   name: 'Stun',   icon: '⚡', color: '#ffd84d',
    kind: 'skip', duration: 1, negative: true,
    appliedMsg: 'is stunned!', skipMsg: 'is stunned!' },

  // ---- ATB modifiers (continuous, not on tick) ------------------------
  { id: 'haste',  name: 'Haste',  icon: '💨', color: '#ffd84d',
    kind: 'atbMult', factor: 1.5, duration: 6, negative: false,
    appliedMsg: 'surges with speed.' },
  { id: 'slow',   name: 'Slow',   icon: '🐢', color: '#5a3a8a',
    kind: 'atbMult', factor: 0.5, duration: 6, negative: true,
    appliedMsg: 'is slowed.' },

  // ---- Stat modifiers (applied at damage time) -----------------------
  // Cracked Armor — Earthsplitter's signature debuff. Reduces effective
  // DEF to 70% for the rest of the battle. Stacks multiplicatively with
  // skill `pierce` so subsequent Sunder hits hit harder still.
  { id: 'crackedArmor', name: 'Cracked Armor', icon: '🪨', color: '#7a5a3a',
    kind: 'statMod', stat: 'def', factor: 0.7,
    duration: 99, persistent: true, negative: true,
    appliedMsg: "'s armor cracks!" },
];

export const STATUS_BY_ID = Object.fromEntries(STATUSES.map(s => [s.id, s]));
