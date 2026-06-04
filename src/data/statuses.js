// Status effect definitions. Each combatant carries an array of active status
// instances: { id, duration, power? }. Effects tick on the affected actor's
// turn start; durations decrement after the actor acts (or after a forced
// skip from an incapacitating status). Haste/Slow apply continuously via
// the ATB fill rate, not on turn ticks.

export const STATUSES = [
  // ---- Damage over time ------------------------------------------------
  { id: 'poison', name: 'Poison', icon: '☠', color: '#7aff8a',
    kind: 'dotHp', factor: 0.06, duration: 4, negative: true,
    appliedMsg: 'is poisoned!' },
  { id: 'burn',   name: 'Burn',   icon: '🔥', color: '#ff8a3b',
    kind: 'dotHp', factor: 0.08, duration: 3, negative: true,
    appliedMsg: 'is burning!' },

  // ---- Heal over time --------------------------------------------------
  { id: 'regen',  name: 'Regen',  icon: '🌱', color: '#a8ffc8',
    kind: 'hotHp', factor: 0.07, duration: 4, negative: false,
    appliedMsg: 'glows with renewal.' },

  // ---- Incapacitating (skip turn) -------------------------------------
  { id: 'freeze', name: 'Freeze', icon: '❄', color: '#7adaff',
    kind: 'skip', duration: 2, negative: true,
    appliedMsg: 'is frozen solid!', skipMsg: 'is frozen!' },
  { id: 'sleep',  name: 'Sleep',  icon: '💤', color: '#c0a0ff',
    kind: 'skip', duration: 5, wakesOnHit: true, negative: true,
    appliedMsg: 'falls asleep.', skipMsg: 'is asleep!' },
  { id: 'stun',   name: 'Stun',   icon: '⚡', color: '#ffd84d',
    kind: 'skip', duration: 1, negative: true,
    appliedMsg: 'is stunned!', skipMsg: 'is stunned!' },

  // ---- ATB modifiers (continuous, not on tick) ------------------------
  { id: 'haste',  name: 'Haste',  icon: '💨', color: '#ffd84d',
    kind: 'atbMult', factor: 1.5, duration: 5, negative: false,
    appliedMsg: 'surges with speed.' },
  { id: 'slow',   name: 'Slow',   icon: '🐢', color: '#5a3a8a',
    kind: 'atbMult', factor: 0.5, duration: 4, negative: true,
    appliedMsg: 'is slowed.' },
];

export const STATUS_BY_ID = Object.fromEntries(STATUSES.map(s => [s.id, s]));
