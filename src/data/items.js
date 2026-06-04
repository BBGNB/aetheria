// Consumable items used in battle.
export const ITEMS = [
  { id: 'potion', name: 'Potion', icon: '🧪', desc: 'Restores 35 HP.', kind: 'heal-hp', power: 35, target: 'one' },
  { id: 'ether', name: 'Ether', icon: '💙', desc: 'Restores 15 MP.', kind: 'heal-mp', power: 15, target: 'one' },
  { id: 'hipotion', name: 'High Potion', icon: '🧪', desc: 'Restores 90 HP.', kind: 'heal-hp', power: 90, target: 'one' },
];

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));
