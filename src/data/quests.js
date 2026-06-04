// Quest declarations — FF6/FF7-style: implicit, dialog-driven. The Quests
// tab is a safety net so the player can recall what they're doing if they
// put the game down for a while. There is no XP from quests; the reward is
// always the in-world consequence (recruit, item, lore).
//
// A quest has steps, each gated on a `when(game)` predicate. The "current
// step" is the first one whose predicate returns false. A quest's `available`
// predicate controls whether it shows up in the list at all.

export const QUESTS = [
  {
    id: 'main:hollow',
    title: "The Hollow's Echo",
    type: 'main',
    intro: 'Find your bearings in Hearthstone. Someone here will know what comes next.',
    steps: [
      { text: 'Speak with Elder Vorrin in Hearthstone.',
        when: g => g.flags.has('vorrin:spoken') },
      { text: 'Break the Pack Alpha guarding the road into the Echoing Hollow.',
        when: g => g.flags.has('meadow:packAlpha') },
      { text: 'Find Lyra at the back of the Hollow.',
        when: g => g.recruited.has('recruit:lyra') },
      { text: 'Escape the Hollow with her — past whatever the Sundered has placed at the door.',
        when: g => g.flags.has('cave:warden') },
      { text: 'Return to Elder Vorrin in Hearthstone.',
        when: g => g.flags.has('vorrin:postWarden') },
    ],
  },
  {
    id: 'main:reach',
    title: 'Roots of the Reach',
    type: 'main',
    intro: 'Elder Vorrin pointed you north. The Verdant Reach is rotting from the inside — find its heart.',
    available: g => g.flags.has('vorrin:postWarden'),
    steps: [
      { text: 'Walk the path north of the meadow into the Verdant Reach.',
        when: g => g.flags.has('sable:met') || g.currentMapId === 'reachOuter' },
      { text: 'Find Sable, the exile, in the forest clearing.',
        when: g => g.flags.has('sable:met') },
      { text: 'Recover Sable\'s lost research pages scattered through the Reach.',
        when: g => ['reach:sable1','reach:sable2'].every(id => g.searched.has(id)) },
      { text: 'Press deeper — into the Reach\'s rotting heart.',
        when: g => g.flags.has('reachDeep:firstEntry') },
      { text: 'Break what has rooted at the heart of the Reach.',
        when: g => g.flags.has('reach:rotcrown') },
      { text: 'Climb the misted pass to Sable\'s hidden sanctum.',
        when: g => g.flags.has('sableHollow:firstEntry') },
      { text: 'Recruit Sable to walk with you.',
        when: g => g.recruited.has('recruit:sable') },
      { text: 'Cross the stone ring beyond the Hollow.',
        when: g => g.flags.has('bloomArena:intro') },
      { text: 'Break the Bloom of Decay.',
        when: g => g.flags.has('reach:bloom') },
      { text: 'Return to Hearthstone — Vorrin will want to know.',
        when: g => g.flags.has('vorrin2:reward') || g.flags.has('vorrin:postBloom') },
    ],
  },
  {
    id: 'side:caretaker',
    title: "The Caretaker's Last Round",
    type: 'side',
    available: g => g.flags.has('caretaker:quest'),
    intro: 'A wounded forest tender asked you to lay her companion to rest at three markers in the Deep Reach.',
    steps: [
      { text: 'Lay the first grave marker in the Deep Reach.',
        when: g => g.searched.has('reachDeep:grave1') },
      { text: 'Lay the second grave marker.',
        when: g => g.searched.has('reachDeep:grave2') },
      { text: 'Lay the third grave marker.',
        when: g => g.searched.has('reachDeep:grave3') },
      { text: 'Return to the Caretaker at the Reach\'s edge.',
        when: g => g.flags.has('caretaker:reward') },
    ],
  },
  {
    id: 'side:mira2',
    title: "Mira's Bloomsilk",
    type: 'side',
    available: g => g.flags.has('mira2:quest'),
    intro: 'Mira spotted petal-dust on your cloak after the Bloom fell. She wants to weave one of its petals.',
    steps: [
      { text: 'Defeat the Bloom of Decay.',
        when: g => g.flags.has('reach:bloom') },
      { text: 'Return to Mira at her shop.',
        when: g => g.flags.has('mira2:reward') },
    ],
  },
  {
    id: 'side:vorrin2',
    title: "Vorrin's Reckoning",
    type: 'side',
    available: g => g.flags.has('vorrin2:quest'),
    intro: 'Elder Vorrin asked for an Order sigil from the Bloom arena, to anchor Hearthstone\'s shrine.',
    steps: [
      { text: 'Recover the Order sigil from the Bloom arena.',
        when: g => g.searched.has('bloom:lore2') },
      { text: 'Return to Vorrin in Hearthstone.',
        when: g => g.flags.has('vorrin2:reward') },
    ],
  },
  {
    id: 'side:mira',
    title: "Mira's Craft",
    type: 'side',
    intro: 'Mira asked you to bring back something from the Hollow\'s depths.',
    available: g => g.flags.has('mira:quest'),
    steps: [
      { text: 'Bring back what dwells deepest in the Hollow.',
        when: g => g.flags.has('cave:warden') },
      { text: 'Return to Mira at her shop.',
        when: g => g.flags.has('mira:reward') },
    ],
  },
];

// First incomplete step index for a quest. If all steps pass, the quest is complete.
export function questProgress(quest, game) {
  for (let i = 0; i < quest.steps.length; i++) {
    if (!quest.steps[i].when(game)) {
      return { current: i, complete: false, total: quest.steps.length };
    }
  }
  return { current: quest.steps.length, complete: true, total: quest.steps.length };
}

// Quests visible in the log (started or always-on).
export function activeQuests(game) {
  return QUESTS.filter(q => !q.available || q.available(game));
}
