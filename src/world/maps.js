// Tile-character key for ASCII map data.
//   . grass     T tree     W water    p path     s stone     ~ sand
//   f flower    c cobble   x wall     d door     r roof      , cave floor
//   X cave wall R rug
const TILE_FROM = {
  '.': 0, T: 1, W: 2, p: 3, s: 4, '~': 5, f: 6,
  c: 7, x: 8, d: 9, r: 10, ',': 11, X: 12, R: 13,
  C: 14, // cave mouth (rocky entrance — for caves/dungeons)
  b: 15, B: 16, k: 17, '#': 18, L: 19, F: 20, h: 21, S: 22, g: 23, O: 24,
  ' ': 0,
};

function parse(str) {
  const rows = str.trim().split('\n').map(r => r.split('').map(c => TILE_FROM[c] ?? 0));
  const w = Math.max(...rows.map(r => r.length));
  for (const r of rows) while (r.length < w) r.push(0);
  return rows;
}

// Meadow — starter outdoor area; open cobble exit east → town, cave mouth west
// → cave, and a path north up to the Verdant Reach (gated until the Hollow
// Warden has fallen).
const MEADOW_STR = `
TpTTTTTTTTTTTTTTTTTTT
Tp.........f........T
Tp.f.....TTT........T
Tp...TTT.T.T...TTTT.T
Tp...T.T.T.T...T..T.T
Tp...T.TTT.T...T..T.T
Tpp..T.....T...T..T.T
Tp.ppppppppppppp....c
Tp.p.WWWWWW...p.WWT.T
Tp.p.W....W...p.W~T.T
Cp.p.W....W...p.W~T.T
Tp.p.WWWWWW...p..~T.T
Tp.pppppppppppp~~~T.T
Tp..............~~T.T
Tp.f.....TT.....~~T.T
TpTT....TTTT....~sT.T
Tp..............~~T.T
Tp..f.....f.....~~T.T
TpppppppppppppppppT.T
TTTTTTTTTTTTTTTTTTTTT`;

// Town — Hearthstone. Tighter 40×28 layout: shrine + Aetherial well to the
// north, a fountain plaza in the centre, two shops south of the plaza with
// a path running between them, then a small thicket along the bottom for
// secrets. West gate (3 tiles tall) opens to the meadow.
const TOWN_STR = `
TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT
T..b...b..f..b....b....b....b..f...b..bT
T..f...b..b...b..b..b..b..b....b..f..b.T
T.............rrrrrrrrrrr..............T
T..b..f..b....rxxxxxxxxxr....b..f..b..bT
T.............rxxxxdxxxxr..............T
T...b...b.....rxxxxRxxxxr....b...b..b..T
T............cccccccccccccc............T
T...b...f....ccccccOOOccccc...f...b.b..T
T.....b......ccccccOOOccccc........f...T
T.f..........cccccccccccccc......b.....T
T....b......cLccccccccccLc.......g.g..bT
T............cccccFFFcccccc...g..g.g.gT
T..b.f.f.....cccccFFFcccccc.....g.g.b..T
T....b......cLccccccccccLc......b.....fT
ccccccccccccccccccccccccccc............T
ccccccccccccccccccccccccccc.......b....T
ccccccccccccccccccccccccccc............T
T....rrrrrrrr..ppppppppp..rrrrrrrr.....T
T...krxxxxxxr..ppppppppp..rxxxxxxr.....T
T....rxxdxxxr..ppppppppp..rxxdxxxr.B...T
T....rxxRxxxr..ppppppppp..rxxRxxxr.....T
T...g..g.....pLpppppppLp.....g..g..b..bT
T..g.b..g.....ppppppppp.....g..g.b.....T
T..b..b..b...bbpppppppbb..b...b..b.b..bT
T..b.f..b.b..bbbpppppbbb..b...b..f..b..T
T...b..b.bb..bbbbbpbbbbb..b...b.bb..b..T
TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT`;

// Bloom of Decay arena — the leyline knot at the heart of the Reach,
// reachable only after Sable has joined. A ceremonial stone circle ringed
// by lanterns with two side alcoves for hidden caches. The Bloom itself
// roots at the centre.
const BLOOM_ARENA_STR = `
TTTTTTTTTTTTTTTTTTTTTTTTTTTT
TTTTbTbbTTTTTTTbbbTTTTTTbbbT
T..........................T
T..........................T
T.......cLccccLccccLc......T
T.......ccccccccccccc......T
T.......ccccccccccccc......T
T.......Lcccccccccccc......T
T.......LcccccccccccL......T
T.......ccccccccccccc......T
T.......ccccccccccccc......T
T.......cLccccpccccLc......T
T.............p............T
T.............p............T
T.............p............T
T.............p............T
T......ppppppppppppppp.....T
T.............p............T
T.............p............T
T.............p............T
TbTTTTTTbTbTTTpTTTTbTbTTTTTT
TTTTTTTTTTTTTTpTTTTTTTTTTTTT`;

// Sable's Hollow — the sanctum of the exiled Order mage, hidden in the misted
// pass beyond the Deep Reach. Stone-paved interior, Sable's small cottage to
// the upper right, a ruined Order shrine to the left, a central meditation
// pavilion. The player can only reach it once the Rotcrown Treant has fallen.
const SABLE_HOLLOW_STR = `
TTTTTTTTTTTTTTTCTTTTTTTTTTTTTT
TbbTfTTTTfTTTTT.TTTTbTTTTbTffT
TTccccccccccccccccccccccccccTT
TTcccccccccccccccccrrrrrrrrcTT
TTcccccccccccccccccrrrrrrrrcTT
TTcccccccccccccccccrrrrrrrrcTT
TbcccccccccccccccccxxxdxxxxcTT
TTcccccccccccccccccxccpcccxcTT
TTcccccLcccccccccccxcLpLccxcfT
TTcccFcccccccccccccxccpcccxcbT
TTcccccLccccccccccccccpcccccTT
TbcccccccccccLccpppppppcccccTT
TTcccccccpppppppRcccccccccccTT
TTcccccccccccLcpLcccccccccccTT
TTcccccccccccccpccccccccccccTT
TTcccccccccccccpccccccccccccbT
TTcccccccccccccpccccccccccccTT
TTcccccccccccccpccccccccccccbT
TTccccccppppppppppppppcBccccTT
TTcccgcccccccccpcccccccckcccTT
TfccccgccccccccpccccccccccccbT
TTcccccccccccccpccccccccccccTT
TTcccccccccccccpccccccccccccTT
TTcccccccccccccpccccccccccccTT
TbTTTfTTTTbbTffpTTbbTTTfbTTTfT
TTTTTTTTTTTTTTTpTTTTTTTTTTTTTT`;

// Verdant Reach (deep) — the rotting heart of the forest beyond the outer
// path. Denser trees, twisted layout, a clearing in the middle where the
// Rotcrown Treant takes root, a few side branches with hidden caches.
const DEEP_REACH_STR = `
TTTTTTTTTTTTTTTTTTTTTTCTTTTTTTTTTTTTTTTT
T.TT.T..TT.bbTb.TT.TT.pT.TTT.TT..TTTfTTT
Tf.TTT.TTTTT.TbbTTbT..p...TT.T.b..T.TTbT
T...T.T.TTT.T.TT.TT...p....bT..TTT..TT.T
T.TT...TTTT.T.b...b..fp.........T.b..TTT
TTTT.TT.f.T...T.T.fT..p.....T.fTT..TTbbT
T.TTT.TT.TbTppppppppppp..TT.T.T.T...b..T
TT.T.TTTT...p.bT..T..bb.bTTTbTTbT.TTb.TT
T.TT.TTT.TfTp.T..T.bT.TT..TT.TTT.T..fb.T
TTTTb.T..b..p.T..TbTTTfTT.TbTbT..TTTb.TT
T..T.TT.....p...T..TTbT..T.b.b.b.bT..TTT
TT.Tb......Tp..TTT...T..b.T....TT.b..TTT
T.bTTTTf.f.Tppppppppppppppppppp.T..T.TTT
TT.TfT..T.T..b.b.TT.T.TTT.TT.TpTTfbT.TTT
TT.TTf.bbbTT.bTTT..TTT..TTTT.Tp.T......T
Tf.TT.T...TTTbTTTT..fTb..T.T..ppppppp..T
TTTT..TTTTTfT.......T.Tb.T.b.TpTT...p..T
T.TT....T.bT.........T.bbT..TTpT..Tfp.TT
T..T...Tb.b.f...ppppppppppppppp.TTTTp.TT
TTTT..TTT.bT....p...fTfTT.TTTT.TTff.p.TT
T.TT.T.TT.fTf...p.f.TT.TTTTT.bTTTTT.pTTT
TT.TTT.T.T...T.fp.T.bTT..TTT..TTTTfTpTTT
TT.TTfTTppppppppp.T..T..bTfbTTb....bpTbT
T.bTT.TTpT.T.T.TT.f.bTTT.fT....b.....T.T
TTT....fp.TbTfT.T...TTTfT....T.T.b.bTTfT
TTTppppppbTT..T.T..TbT....T.TT.TTTT...bT
TT.p...bpTT...bT.b...TTT..TT.bb.T.bTT..T
T.bp.T..pTT.TT....fb..fT...T..TTTT....TT
TTTp.TT.pppppppppppppT..Tb.b..fTT..T...T
TbTp.....T.T.T.TTb..pTT.T..b..T.T...T..T
TT.p.b....T.fTTTbTT.p....TT..T...TT.TTTT
T..T.T.T..bfbTT.bb..pTTT.TT.TT.b.bTb.TbT
Tb.TT.TTbT..TT.bTf..pT..bTfT..TTTTT..T.T
TT.TbT.TTT.f.TTTT...p..T.T.T...TT..TTTTT
TT.TT..T...T.TTTT...pTTTT.fT.T..Tff.TTTT
TTTTTTTTTTTTTTTTTTTTpTTTTTTTTTTTTTTTTTTT`;

// Verdant Reach (outer) — corrupted forest, entered from the meadow's north
// path. The trail descends in a long S-curve through dense trees with a hermit
// clearing midway. North end has a rocky pass leading deeper (Deep Reach,
// future content). South end opens back to the meadow.
const REACH_OUTER_STR = `
TTTTTTTTTTTTTTTTTTTTCTTTTTTTTTTTTTTTTTTT
Tb.....f.TTT.....TTTp........TT.f.TTT.bT
TTTT.Tbf....b..T.T..pb.TT..T.T...TTT.T.T
T..T....TT.bTT.TTT..p...T..T.....TT...TT
TbT..f.bT..TT..b.T.Tp....T....b..fT...bT
TTT..TTb..T..b.b.TT.p....TT............T
T.bTT.TT..T.....TT.bpT.................T
T.T.TbT.T.TfTT...T..pT.....f..b.....f.fT
TT....Tf....TT.T.T..p.T......bTbb.Tb...T
T..T......T....TTT..p.......f.T.fTT..TTT
T..TfTTf.TT.bT...T.Tppppppppppp.Tb.bbbfT
T....TT.T.TTTb...T.....T..bb.fp..TT....T
T...T....T......TTf.T..fb..T..pTTT.....T
T.....T.b.f......T..Tf.T.T.T.Tp......T.T
T.Tb....T.TT.T.T.T.TT.T.....Tpp........T
TTT.T.T.TfT.T...TT..T..TTT.bTTp.TTf..T.T
T..Tb......bT..T.b.f.T..TT...TpT..T....T
T......T.T.T.T.T.b...Tbb..T.T.pf.....TTT
TT.f.T..T.T.....Tb....T..TT...pTTf....TT
T.f.TT.TTTT....b...f.b..T...b.p.T.T.TT.T
T....bf..bpppppppppppppppppppppTf..T..TT
TT..Tf.T..pT.T..T....T..TTf...fT...T.f.T
T.T.b..TT.p..f.T...b.b.T......TT.bT....T
T.....bT..p...TT...Tb...T..T..TT.T....TT
TTTTfT.T.Tp.TT..TbT....TTTbT.fTT.TTf.T.T
T...f.fT..p...T..b.b...T......T...T.TTbT
T....TbTTTppppppppppp.T..T..ff.....f..TT
TTTT.TTb..TT.T..T...pT.....T.T.TT.TTb..T
T..T..TT..T.T..T..T.p.T.T..TTT...b.T.T.T
T.....Tb...b...T...Tp..T.TT..T.TT.T...TT
TTT.T.TTT..Tf..fT...pTTf..T..Tb.T..T.T.T
TTTTTTTTTTTTTTTTTTTTpTTTTTTTTTTTTTTTTTTT`;

// Cave — dungeon area. The east exit is a cave mouth opening into the meadow.
const CAVE_STR = `
XXXXXXXXXXXXXXXXXXXXXX
X,,,,,,,,,,,,,,,,,,,,X
X,,,XXXXX,,,,,XXX,,,,X
X,,,X,,,,,,,,,X,,,,,,X
X,,,X,,XXX,,,,X,,XX,,X
X,,,,,,X,X,,,,,,X,X,,X
X,,,,,,X,X,,,,XX,,X,,X
X,,XX,,X,X,,,,X,,,X,,X
X,,X,,,X,XXXX,X,,,X,,C
X,,X,,,,,,,,,,X,,,X,,X
X,,XXXXX,,,XXXX,,,X,,X
X,,,,,,,,,,,,,,,,,X,,X
X,,,,,,XX,,XX,,,,,,,,X
X,,,,,,,,,,,,,,,,,,,,X
XXXXXXXXXXXXXXXXXXXXXX`;

export const MAPS = {
  meadow: {
    id: 'meadow', name: 'Verdant Meadow',
    tiles: parse(MEADOW_STR),
    playerStart: { tx: 2, ty: 14 },
    encounters: [
      { enemyIds: ['slime'],                            weight: 3 },
      { enemyIds: ['slime', 'slime'],                   weight: 2 },
      { enemyIds: ['bat'],                              weight: 2 },
      { enemyIds: ['bat', 'bat'],                       weight: 1 },
      { enemyIds: ['wolf'],                             weight: 1 },
      // Three-enemy mobs — weighted low; the meadow shouldn't gut a fresh hero.
      { enemyIds: ['slime', 'slime', 'slime'],          weight: 1 },
      { enemyIds: ['slime', 'slime', 'bat'],            weight: 1 },
      { enemyIds: ['bat', 'bat', 'slime'],              weight: 1 },
      // Full-party mobs — only roll once the party reaches 3 members.
      { enemyIds: ['slime', 'slime', 'slime', 'bat'],            weight: 2, partyMin: 3 },
      { enemyIds: ['bat', 'bat', 'bat', 'slime'],                weight: 2, partyMin: 3 },
      { enemyIds: ['slime','slime','bat','bat','slime'],         weight: 1, partyMin: 3 },
      { enemyIds: ['wolf','slime','slime','bat'],                weight: 1, partyMin: 3 },
    ],
    encounterRate: 2, // ~1 fight per 500 px walked (≈12 tiles)
    npcs: [],
    doors: [
      { tx: 20, ty: 7,  target: 'town',   targetTx: 1,  targetTy: 16 },
      { tx: 0,  ty: 10, target: 'cave',   targetTx: 20, targetTy: 8 },
      // North path to the Verdant Reach — opens once the Hollow Warden falls.
      { tx: 1,  ty: 0,  target: 'reachOuter', targetTx: 20, targetTy: 30,
        requires: 'cave:warden',
        lockedMsg: 'The path north pulses with a wrongness. Lyra warns: "Not yet — the Hollow still binds it."' },
    ],
    // The Pack Alpha guards the cave mouth — must be slain first.
    bossEvents: [
      { id: 'meadow:packAlpha', tx: 0, ty: 10, boss: 'packAlpha',
        speaker: '',
        lines: [
          'A massive russet wolf steps from the cave\'s shadow, its hackles raised.',
          'Elder Vorrin warned of this one — the Pack Alpha that hunts the road to the Hollow.',
          'It bares blackened fangs and lets out a guttural growl that shakes the trees.',
          'There is no path past it. Only through.',
        ] },
    ],
    music: 'overworld',
    ambient: 'forest',
  },
  town: {
    id: 'town', name: 'Hearthstone',
    tiles: parse(TOWN_STR),
    playerStart: { tx: 1, ty: 16 },
    encounters: [],
    encounterRate: 0,
    npcs: [
      { id: 'shopkeeper', tx: 8,  ty: 21, color: '#ffd84d', name: 'Mira',
        kind: 'shop',
        lines: ['Welcome, traveler! Mira here. Take a look at my wares?'] },
      { id: 'innkeeper',  tx: 29, ty: 21, color: '#7adaff', name: 'Old Edran',
        kind: 'inn', cost: 10,
        lines: ['You look weary. A bed for the night will cost 10 gold.'] },
      { id: 'elder',      tx: 19, ty: 6, color: '#b67aff', name: 'Elder Vorrin',
        kind: 'talk',
        lines: [
          'You carry the stillness of someone who has felt the world crack.',
          'Long ago, seven mages — the Aetherial Order — kept the leylines in tune. They sang the world steady.',
          'One of them, Vael, reached too far. He tried to wield the song. It tore.',
          'What walked back from that tear was no longer Vael. The people now call it The Sundered.',
          'The Order tried to mend the rifts. Six of them fell.',
          'Only Lyra, the youngest, was left to try. She walked into the Hollow weeks ago, seeking the source. She has not come back.',
          'But understand this: the Hollow is only one wound. There are others — older, deeper — where the bleed is far worse.',
          'Find Lyra first, if she lives. She knew paths the Order kept hidden. With her at your side, there is work to do, you and I.',
          'The road to the Hollow is no longer safe. A great wolf — the Pack Alpha — holds the cave mouth.',
          'Cut your teeth on the meadow\'s beasts. Then break the Alpha. Only then can you reach her.',
        ] },
    ],
    doors: [
      { tx: 0, ty: 15, target: 'meadow', targetTx: 19, targetTy: 7 },
      { tx: 0, ty: 16, target: 'meadow', targetTx: 19, targetTy: 7 },
      { tx: 0, ty: 17, target: 'meadow', targetTx: 19, targetTy: 7 },
    ],
    searchables: [
      // Visible — pickups beside known props.
      { id: 'town:crate1',  tx: 4,  ty: 19, kind: 'crate',  label: 'Wooden crate',
        lines: ['You pry open the crate.'],
        item: { kind: 'consumable', id: 'potion', qty: 2 } },
      { id: 'town:barrel1', tx: 35, ty: 20, kind: 'barrel', label: 'Inn barrel',
        lines: ['You peek inside the barrel.'],
        item: { kind: 'consumable', id: 'ether' } },
      // Hidden — only marked by an occasional sparkle.
      { id: 'town:hidden1', tx: 2,  ty: 2,  kind: 'hidden', label: 'Loose earth',
        lines: ['Beneath the loose earth, something glints.'],
        item: { kind: 'gem', id: 'mightCore' } },
      { id: 'town:hidden2', tx: 38, ty: 13, kind: 'hidden', label: 'Behind a hedge',
        lines: ['Tucked behind a stone, a forgotten purse.'],
        item: { kind: 'gold', amount: 75 } },
      { id: 'town:hidden3', tx: 18, ty: 26, kind: 'hidden', label: 'Within the thicket',
        lines: ['You shoulder past the bushes and find a small offering.'],
        item: { kind: 'equipment', id: 'amulet' } },
    ],
    music: 'overworld',
    ambient: null,
  },
  cave: {
    id: 'cave', name: 'Echoing Hollow',
    tiles: parse(CAVE_STR),
    playerStart: { tx: 20, ty: 8 },
    encounters: [
      { enemyIds: ['frostBat'],                              weight: 2 },
      { enemyIds: ['frostBat', 'frostBat'],                  weight: 1 },
      { enemyIds: ['bogSlime'],                              weight: 2 },
      { enemyIds: ['bogSlime', 'frostBat'],                  weight: 1 },
      { enemyIds: ['direWolf'],                              weight: 2 },
      { enemyIds: ['direWolf', 'frostBat'],                  weight: 1 },
      { enemyIds: ['wraith'],                                weight: 2 },
      { enemyIds: ['wraith', 'frostBat'],                    weight: 1 },
      // Three-enemy mobs — the Hollow is dangerous.
      { enemyIds: ['frostBat', 'frostBat', 'frostBat'],      weight: 1 },
      { enemyIds: ['bogSlime', 'bogSlime', 'frostBat'],      weight: 1 },
      { enemyIds: ['direWolf', 'frostBat', 'frostBat'],      weight: 1 },
      { enemyIds: ['wraith', 'frostBat', 'bogSlime'],        weight: 1 },
      // Full-party mobs — the cave really opens up once you're three deep.
      { enemyIds: ['frostBat','frostBat','frostBat','bogSlime'],            weight: 2, partyMin: 3 },
      { enemyIds: ['bogSlime','bogSlime','bogSlime','frostBat'],            weight: 2, partyMin: 3 },
      { enemyIds: ['direWolf','frostBat','frostBat','bogSlime'],            weight: 2, partyMin: 3 },
      { enemyIds: ['wraith','wraith','frostBat','bogSlime'],                weight: 1, partyMin: 3 },
      { enemyIds: ['frostBat','frostBat','bogSlime','bogSlime','frostBat'], weight: 1, partyMin: 3 },
      { enemyIds: ['wraith','frostBat','bogSlime','direWolf','bogSlime'],   weight: 1, partyMin: 3 },
    ],
    encounterRate: 3, // dungeons are slightly denser than the open meadow
    npcs: [
      // Rescued at the deepest point of the Hollow. The elder hinted at her.
      { id: 'recruit:lyra', tx: 2, ty: 1, color: '#e8e8ee', name: 'Lyra',
        kind: 'recruit', classId: 'white',
        // Lyra was a healer in the Order, but if the player already has a
        // white mage she'll take a different role to round out the party.
        preferredClasses: ['white', 'black', 'ranger', 'fighter'],
        lines: [
          'Thank the light. Another living soul.',
          'I am Lyra — youngest of the Aetherial Order, and the only one of us still trying.',
          'I came for the source of the rift. I found only the wound itself, and a Warden between me and the way out.',
          'But the Hollow is the smallest tear. The true blade is elsewhere — at the places where my brothers and sisters fell. That is where Vael feeds.',
          'I cannot mend what is left of the song alone. I never could.',
          'If you would walk that road with me, my staff is yours.',
        ] },
    ],
    doors: [
      { tx: 21, ty: 8, target: 'meadow', targetTx: 1, targetTy: 10 },
    ],
    // After Lyra is recruited, the Rift sends a guardian to stop her leaving.
    // Once defeated, the flag is set and the exit is free.
    bossEvents: [
      { id: 'cave:warden', tx: 21, ty: 8, requires: 'recruit:lyra', boss: 'hollowWarden',
        speaker: '',
        lines: [
          'The cave mouth blackens. Violet light folds in on itself — and out walks a thing of jagged shards and burning eyes.',
          'Lyra steps in front of you, her staff catching the dark light. "It found us. Vael\'s hand reaches even here..."',
          'The Warden\'s many eyes blaze open as one. "...broken... broken..." — its voice is not its own.',
          'Lyra: "Together. The song is not yet silent."',
          'You ready your weapons.',
        ] },
    ],
    // Lore breadcrumbs — Lyra's torn journal pages laid as a trail to her
    // chamber, plus a couple of caches left by her or her predecessors.
    searchables: [
      { id: 'cave:journal1', tx: 16, ty: 11, kind: 'hidden', label: 'Torn page',
        lines: [
          'A page torn from a leather journal, pinned beneath a stone.',
          '"Day 1 — I have descended. The Aether sings even here, but faint. Thin. Strained."',
          '— Lyra',
        ],
        item: { kind: 'lore' } },
      { id: 'cave:journal2', tx: 10, ty: 5,  kind: 'hidden', label: 'Torn page',
        lines: [
          'Another page, tucked between cave-floor cracks.',
          '"Day 3 — Wraiths chased me deeper. I think they remember Vael\'s face. Or whatever wears it now."',
          '— Lyra',
        ],
        item: { kind: 'lore' } },
      { id: 'cave:journal3', tx: 4,  ty: 12, kind: 'hidden', label: 'Torn page',
        lines: [
          'A water-warped page caught on a stalagmite.',
          '"Day 6 — Something is here that is not beast and not memory. A Warden, the old texts called it. The Sundered places them at every leyline wound."',
          '— Lyra',
        ],
        item: { kind: 'lore' } },
      { id: 'cave:journal4', tx: 1,  ty: 3,  kind: 'hidden', label: 'Torn page',
        lines: [
          'The last page, fluttering by the entrance to a small chamber.',
          '"Day 9 — If you read this and I am not here, leave. Tell Vorrin the Hollow is only a wound, not the blade. Mend what you can elsewhere. I am sorry."',
          '— Lyra',
        ],
        item: { kind: 'lore' } },
      // Treasures
      { id: 'cave:cache1', tx: 16, ty: 1,  kind: 'hidden', label: 'Hidden niche',
        lines: ['A small carved niche in the wall — someone meant to come back for this.'],
        item: { kind: 'equipment', id: 'silverRing' } },
      { id: 'cave:cache2', tx: 12, ty: 13, kind: 'hidden', label: 'Wraith leavings',
        lines: ['A torn satchel dropped by something that no longer needed it.'],
        item: { kind: 'consumable', id: 'ether', qty: 2 } },
      { id: 'cave:cache3', tx: 19, ty: 13, kind: 'hidden', label: 'Old waterskin',
        lines: ['Half-buried in cave silt. Still sealed.'],
        item: { kind: 'consumable', id: 'hipotion' } },
    ],
    music: 'battle', // moodier for the dungeon
    ambient: null,
    dark: true,      // player-centered torchlight overlay
  },
  reachOuter: {
    id: 'reachOuter', name: 'Verdant Reach — Outer',
    tiles: parse(REACH_OUTER_STR),
    playerStart: { tx: 20, ty: 30 },
    // Tier-3 forest pool. Slightly denser than the meadow but lighter than the
    // cave — players are arriving fresh from chapter 1 and need a ramp.
    encounters: [
      { enemyIds: ['brambleSprite'],                                  weight: 3 },
      { enemyIds: ['brambleSprite', 'brambleSprite'],                 weight: 2 },
      { enemyIds: ['choirmoth'],                                      weight: 3 },
      { enemyIds: ['choirmoth', 'brambleSprite'],                     weight: 2 },
      { enemyIds: ['witheredStag'],                                   weight: 2 },
      { enemyIds: ['witheredStag', 'choirmoth'],                      weight: 1 },
      { enemyIds: ['mossback'],                                       weight: 2 },
      { enemyIds: ['mossback', 'brambleSprite'],                      weight: 1 },
      // Three-enemy mobs — the Reach swarms intruders.
      { enemyIds: ['brambleSprite', 'brambleSprite', 'choirmoth'],    weight: 1 },
      { enemyIds: ['choirmoth', 'choirmoth', 'brambleSprite'],        weight: 1 },
      { enemyIds: ['witheredStag', 'brambleSprite', 'choirmoth'],     weight: 1 },
      { enemyIds: ['brambleSprite', 'brambleSprite', 'brambleSprite'],weight: 1 },
      // Full-party swarms — the Reach really takes notice.
      { enemyIds: ['brambleSprite','brambleSprite','brambleSprite','choirmoth'],     weight: 2, partyMin: 3 },
      { enemyIds: ['choirmoth','choirmoth','brambleSprite','brambleSprite'],         weight: 2, partyMin: 3 },
      { enemyIds: ['witheredStag','choirmoth','brambleSprite','choirmoth'],          weight: 2, partyMin: 3 },
      { enemyIds: ['mossback','brambleSprite','brambleSprite','choirmoth'],          weight: 1, partyMin: 3 },
      { enemyIds: ['brambleSprite','brambleSprite','choirmoth','choirmoth','brambleSprite'], weight: 1, partyMin: 3 },
    ],
    encounterRate: 2.6,
    npcs: [
      // Sable — exiled member of the Aetherial Order. Lives in a clearing
      // halfway up the Reach. Hints at the deeper corruption and the path north.
      // The Caretaker — a wounded forest tender camped by the entry path,
      // grieving a lost companion in the Deep Reach. Gives a side quest.
      { id: 'tender:caretaker', tx: 16, ty: 29, color: '#a8c8a0', name: 'The Caretaker',
        kind: 'talk',
        lines: [
          'A small figure huddled at the edge of the path. She does not look up as you approach.',
        ] },
      { id: 'hermit:sable', tx: 25, ty: 7, color: '#c0b8a0', name: 'Sable',
        kind: 'talk', hideIfRecruited: 'recruit:sable',
        lines: [
          'You walked the meadow road and lived. Good. You\'ll need that.',
          'I was one of the seven, before. Before Vael tore the song.',
          'When the Order tried to stitch the leylines back, I argued we should let it bleed clean — let the wound seal itself. They named that cowardice and made me leave.',
          'Now I sit here, mostly, while a forest I used to know rots from the inside.',
          'The pass north — Deep Reach, the loggers used to call it — leads to a hollow where the leyline knot is. Something old has wrapped itself around the knot and is feeding.',
          'If you mean to cut it loose, you\'ll need more than steel. Find what the forest hides between here and there. The Reach keeps its own secrets in plain sight.',
          'And — if you see Lyra in there — tell her I am sorry. She\'ll know what for.',
        ] },
    ],
    doors: [
      // South back to the meadow.
      { tx: 20, ty: 31, target: 'meadow', targetTx: 1, targetTy: 1 },
      // North into Deep Reach — opens after meeting Sable.
      { tx: 20, ty: 0, target: 'reachDeep', targetTx: 20, targetTy: 34,
        requires: 'sable:met',
        lockedMsg: 'The pass north is choked with thorns. Sable said the forest hides what you need — look first.' },
    ],
    // Outer Reach is Sable's stretch of the forest — still itself, not yet
    // visibly corrupted. Kept un-tinted so the cross into Deep Reach lands.
    // The corruption cutscene + ambient particles still hint at trouble.
    enterCutscene: {
      flag: 'reach:firstEntry',
      speaker: 'Lyra',
      visual: 'forest-corruption',
      delay: 1100,
      lines: [
        'You crest the meadow\'s ridge — and the trees ahead are wrong.',
        'Lyra: "This is the Verdant Reach. It looked nothing like this when I last walked it. The leyline beneath it is bleeding."',
        'Lyra: "Vorrin said there was a man living in here — Sable. If anyone can tell us where the wound is widest, he can."',
        'A path winds north into the dim. Move slowly. The Reach knows you are here.',
      ],
    },
    // Sable's discarded research + a couple of caches. The journal pages tell
    // the story of the Order's fall and what truly happened to Vael.
    searchables: [
      { id: 'reach:sable1', tx: 22, ty: 3, kind: 'hidden', label: 'Discarded notebook',
        lines: [
          'A leather notebook half-buried in moss — Sable\'s handwriting, but old.',
          '"The seven of us could only ever steady a single wound at a time. When the second wound opened, we had to choose which one to tend. We chose wrong."',
        ],
        item: { kind: 'lore' } },
      { id: 'reach:sable2', tx: 25, ty: 7, kind: 'hidden', label: 'Scorched page',
        lines: [
          'A page torn from a longer manuscript, edges blackened.',
          '"Vael did not reach for the song out of ambition. He reached for it because his wife was dying, and the song could mend her. The Order knew. We let him try. We are not innocent."',
        ],
        item: { kind: 'lore' } },
      { id: 'reach:sable3', tx: 24, ty: 14, kind: 'hidden', label: 'Buried ledger',
        lines: [
          'A small ledger sealed in wax, recently disturbed.',
          '"What returned from the tear was not Vael. It was the song itself, given a face. The Sundered is the wound learning to walk. It does not hate us. It does not know us."',
        ],
        item: { kind: 'lore' } },
      { id: 'reach:sable4', tx: 13, ty: 22, kind: 'hidden', label: 'Pressed map',
        lines: [
          'A pressed-leaf map of the Verdant Reach, with the deep hollow marked.',
          '"The knot at the heart of the Reach feeds on what grows. If it blooms once, the forest is gone. If it blooms twice, the kingdom is."',
        ],
        item: { kind: 'lore' } },
      // Treasures
      { id: 'reach:cache1', tx: 28, ty: 25, kind: 'hidden', label: 'Hollow log',
        lines: ['Inside a hollow log, wrapped in old cloth — a knapped tool kit.'],
        item: { kind: 'consumable', id: 'hipotion', qty: 2 } },
      { id: 'reach:cache2', tx: 30, ty: 19, kind: 'hidden', label: 'Sable\'s cairn',
        lines: ['Beneath a small stone cairn, something Sable meant to forget.'],
        item: { kind: 'gem', id: 'frostAspect' } },
      { id: 'reach:cache3', tx: 5, ty: 6, kind: 'hidden', label: 'Twisted roots',
        lines: ['A small purse, slipped from a traveler who never came back.'],
        item: { kind: 'gold', amount: 180 } },
      { id: 'reach:cache4', tx: 36, ty: 8, kind: 'hidden', label: 'Birdsnest cache',
        lines: ['A magpie\'s hoard — shiny things gathered into a high cleft.'],
        item: { kind: 'gem', id: 'magpieCharm' } },
      { id: 'reach:cache5', tx: 4, ty: 20, kind: 'hidden', label: 'Wax-sealed jar',
        lines: ['A jar sealed with red wax. Whatever\'s inside still hums.'],
        item: { kind: 'consumable', id: 'ether', qty: 3 } },
      { id: 'reach:cache6', tx: 33, ty: 27, kind: 'hidden', label: 'Splintered chest',
        lines: ['A small ironbound chest, splintered open by a falling branch.'],
        item: { kind: 'equipment', id: 'silverRing' } },
    ],
    music: 'overworld',
    ambient: 'forest',
  },
  reachDeep: {
    id: 'reachDeep', name: 'Verdant Reach — Deep',
    tiles: parse(DEEP_REACH_STR),
    playerStart: { tx: 20, ty: 35 },
    // Tier-3+ pool — same enemies as outer but mixed denser, plus a sprinkle of
    // tougher cave wraiths that have wandered up from below.
    encounters: [
      { enemyIds: ['mossback'],                                       weight: 3 },
      { enemyIds: ['mossback', 'choirmoth'],                          weight: 2 },
      { enemyIds: ['witheredStag'],                                   weight: 3 },
      { enemyIds: ['witheredStag', 'witheredStag'],                   weight: 1 },
      { enemyIds: ['brambleSprite', 'brambleSprite'],                 weight: 2 },
      { enemyIds: ['choirmoth', 'choirmoth'],                         weight: 2 },
      { enemyIds: ['hollowWraith'],                                   weight: 2 },
      { enemyIds: ['hollowWraith', 'brambleSprite'],                  weight: 1 },
      { enemyIds: ['mossback', 'witheredStag'],                       weight: 1 },
      // Three-enemy mobs — Deep Reach is meant to feel oppressive.
      { enemyIds: ['witheredStag', 'witheredStag', 'choirmoth'],      weight: 1 },
      { enemyIds: ['mossback', 'choirmoth', 'brambleSprite'],         weight: 1 },
      { enemyIds: ['hollowWraith', 'choirmoth', 'brambleSprite'],     weight: 1 },
      { enemyIds: ['hollowWraith', 'hollowWraith', 'brambleSprite'],  weight: 1 },
      { enemyIds: ['mossback', 'mossback', 'witheredStag'],           weight: 1 },
      // Full-party swarms — Deep Reach with three+ is genuinely scary.
      { enemyIds: ['witheredStag','witheredStag','choirmoth','choirmoth'],                            weight: 2, partyMin: 3 },
      { enemyIds: ['mossback','choirmoth','brambleSprite','witheredStag'],                            weight: 2, partyMin: 3 },
      { enemyIds: ['hollowWraith','hollowWraith','brambleSprite','choirmoth'],                        weight: 2, partyMin: 3 },
      { enemyIds: ['mossback','mossback','witheredStag','brambleSprite'],                             weight: 1, partyMin: 3 },
      { enemyIds: ['witheredStag','choirmoth','choirmoth','brambleSprite','brambleSprite'],           weight: 1, partyMin: 3 },
      { enemyIds: ['hollowWraith','hollowWraith','choirmoth','brambleSprite','brambleSprite','brambleSprite'], weight: 1, partyMin: 3 },
    ],
    encounterRate: 3.2,
    npcs: [],
    doors: [
      // South back to Outer Reach.
      { tx: 20, ty: 35, target: 'reachOuter', targetTx: 20, targetTy: 1 },
      // North pass up to Sable's Hollow — opens after the Rotcrown falls.
      { tx: 22, ty: 0, target: 'sableHollow', targetTx: 15, targetTy: 24,
        requires: 'reach:rotcrown',
        lockedMsg: 'The pass slopes up into mist — but the Rotcrown\'s roots still bar the way. Break it first.' },
    ],
    // Mid-boss event at the boss-arena tile — entering the clearing triggers
    // the Rotcrown Treant cinematic, once. Setting the flag opens the way north.
    bossEvents: [
      { id: 'reach:rotcrown', tx: 16, ty: 18, boss: 'rotcrownTreant',
        bannerName: 'Rotcrown Treant',
        bannerSub: '— heart of the rotting leyline —',
        speaker: '',
        lines: [
          'You step into a wide clearing — and the trees here are not trees.',
          'A great bark-skinned shape unfolds from the canopy. Its crown is a wreath of fungus and its eyes are red embers in a hollow face.',
          'Lyra: "By the song. The leyline\'s ate into the wood itself. This is what was feeding."',
          'The Rotcrown groans — a sound like a forest dying all at once — and steps forward.',
          'Bracing roots split the loam. There is no going around it.',
        ] },
    ],
    // The light here is wrong — a sour green-violet that doesn't belong to
    // any sun. Strongly saturated violet recolors the world via HSL `color`
    // blend; a much subtler sickly-green additive whisper adds the swamp-
    // light undertone without canceling the purple to grey. Slight darken
    // for atmospheric weight.
    tint: { color: '#6020c8', alpha: 0.80, glow: 0.06, glowColor: '#7aaa3a', darken: 0.08 },
    enterCutscene: {
      flag: 'reachDeep:firstEntry',
      speaker: '',
      visual: 'deep-dread',
      delay: 1300,
      lines: [
        'The path narrows. The light filtering through the canopy is the wrong color — a sour green-violet that doesn\'t belong to any sun.',
        'Lyra: "We\'re close to it now. Stay near. Whatever the Reach has become — it can hear our footsteps."',
        'Somewhere ahead, something massive shifts in the undergrowth.',
      ],
    },
    searchables: [
      // ---- Lore (3 — Vael's letters, Order's record) ----------------------
      { id: 'reachDeep:lore1', tx: 24, ty: 3, kind: 'hidden', label: 'Sealed letter',
        lines: [
          'A letter pinned to a tree with an iron nail, the seal long broken.',
          '"To whoever finds this — my wife is dying. I have walked into the song and I will pull from it what I need. If I do not come back, the Order will say I reached too far. They will not say why."',
          '— Vael',
        ],
        item: { kind: 'lore' } },
      { id: 'reachDeep:lore2', tx: 21, ty: 4, kind: 'hidden', label: 'Aether-burnt stone',
        lines: [
          'A flat stone, its surface scorched black with old aether-burn.',
          '"The seven of us argued for three days. In the end, we did nothing — and Vael went alone. Whatever he became, we made it by waiting."',
          '— Sable\'s journal, year of the tearing',
        ],
        item: { kind: 'lore' } },
      { id: 'reachDeep:lore3', tx: 14, ty: 18, kind: 'hidden', label: 'Bone reliquary',
        lines: [
          'A small carved box of root-bone, set into the base of a stump.',
          '"Vael\'s wife outlived him by eleven days. She begged us to stop searching for him. We did not listen. The thing that took his face cannot be saved — but neither can we — and we keep trying anyway."',
          '— Sable',
        ],
        item: { kind: 'lore' } },
      // ---- Gems (4) -------------------------------------------------------
      { id: 'reachDeep:gem1', tx: 25, ty: 5, kind: 'hidden', label: 'Vine-wrapped stone',
        lines: ['Hidden in a vine snarl — a humming green crystal.'],
        item: { kind: 'gem', id: 'lifebloom' } },
      { id: 'reachDeep:gem2', tx: 13, ty: 10, kind: 'hidden', label: 'Wraith-keening',
        lines: ['A pale frost-blue shard wedged between two trees that bend toward each other.'],
        item: { kind: 'gem', id: 'frostAspect' } },
      { id: 'reachDeep:gem3', tx: 28, ty: 11, kind: 'hidden', label: 'Choirmoth chrysalis',
        lines: ['A broken chrysalis — left inside, a small bell of brittle horn.'],
        item: { kind: 'gem', id: 'sandmanBell' } },
      { id: 'reachDeep:gem4', tx: 34, ty: 15, kind: 'hidden', label: 'Whisper-stone',
        lines: ['Set into a high cleft of bark — a stone that hums when you touch it.'],
        item: { kind: 'gem', id: 'stormPearl' } },
      // ---- Equipment (2) --------------------------------------------------
      { id: 'reachDeep:eq1', tx: 7, ty: 27, kind: 'hidden', label: 'Mossy reliquary',
        lines: ['An old reliquary — inside, a band of woven silver and thornroot.'],
        item: { kind: 'equipment', id: 'amulet' } },
      { id: 'reachDeep:eq2', tx: 36, ty: 16, kind: 'hidden', label: 'Sable\'s old kit',
        lines: ['A bundle Sable left here long ago — wrapped tight, still serviceable.'],
        item: { kind: 'equipment', id: 'flameBrand' } },
      // ---- Consumables (4) ------------------------------------------------
      { id: 'reachDeep:con1', tx: 19, ty: 33, kind: 'hidden', label: 'Pathside cache',
        lines: ['A small leather pouch tucked under a rock at the edge of the path.'],
        item: { kind: 'consumable', id: 'hipotion', qty: 2 } },
      { id: 'reachDeep:con2', tx: 17, ty: 34, kind: 'hidden', label: 'Forgotten pack',
        lines: ['A traveler\'s pack — fallen from a shoulder long ago.'],
        item: { kind: 'consumable', id: 'ether', qty: 2 } },
      { id: 'reachDeep:con3', tx: 18, ty: 19, kind: 'hidden', label: 'Spore-blasted earth',
        lines: ['Tucked beneath sporeswarmed loam — a phial still intact.'],
        item: { kind: 'consumable', id: 'hipotion', qty: 3 } },
      { id: 'reachDeep:con4', tx: 5, ty: 25, kind: 'hidden', label: 'Wraith-leavings',
        lines: ['What a wraith dropped, last time it tried to pass through here.'],
        item: { kind: 'consumable', id: 'ether', qty: 3 } },
      // ---- Gold (2) -------------------------------------------------------
      { id: 'reachDeep:gold1', tx: 4, ty: 26, kind: 'hidden', label: 'Bone cairn',
        lines: ['A cairn of small bones, capped with a leather purse.'],
        item: { kind: 'gold', amount: 240 } },
      { id: 'reachDeep:gold2', tx: 18, ty: 20, kind: 'hidden', label: 'Adventurer\'s remains',
        lines: ['What\'s left of someone who got this far and no further. They won\'t need it now.'],
        item: { kind: 'gold', amount: 320 } },
      // ---- Side-quest grave markers (Caretaker's Last Round) -------------
      // These three searchables grant nothing tangible but track on the
      // Caretaker side quest via the player's `searched` set.
      { id: 'reachDeep:grave1', tx: 8, ty: 23, kind: 'hidden', label: 'First grave marker',
        lines: [
          'A cairn of pale stones — far too small for an adult, too large for a child.',
          '(You set a hand on it and whisper the Caretaker\'s name for her companion. The wind eases.)',
        ],
        item: { kind: 'lore' } },
      { id: 'reachDeep:grave2', tx: 36, ty: 21, kind: 'hidden', label: 'Second grave marker',
        lines: [
          'A clay urn nestled in the roots of a dead tree.',
          '(You leave a small ribbon at its base, as the Caretaker asked.)',
        ],
        item: { kind: 'lore' } },
      { id: 'reachDeep:grave3', tx: 17, ty: 17, kind: 'hidden', label: 'Third grave marker',
        lines: [
          'A circle of antlers tied with weathered cord at the edge of the boss arena.',
          '(You speak the last name softly. Something in the clearing settles.)',
        ],
        item: { kind: 'lore' } },
    ],
    music: 'battle',
    ambient: 'forest',
  },
  sableHollow: {
    id: 'sableHollow', name: 'Sable\'s Hollow',
    tiles: parse(SABLE_HOLLOW_STR),
    playerStart: { tx: 15, ty: 24 },
    encounters: [],
    encounterRate: 0,
    npcs: [
      // Sable at the central meditation shrine. Recruit cinematic + dialog that
      // reacts to Lyra being in the party (she always is by this point).
      { id: 'recruit:sable', tx: 14, ty: 12, color: '#c0a0ff', name: 'Sable',
        kind: 'recruit', classId: 'black',
        // Sable's an ember-mage by lore, but fills whatever role the party
        // is still missing — leans toward casters, falls back to martial.
        preferredClasses: ['black', 'white', 'ranger', 'fighter'],
        lines: [
          'You step into the meditation pavilion. Sable sits cross-legged on the rug, eyes closed, hands folded.',
          'Without opening his eyes: "You broke the Rotcrown. Good. The forest will not heal — but it will not die today, either."',
          '(Lyra steps forward.) "Sable. I am not the only one of us left."',
          'Sable: "I know, little sister. I have known for a long time. I let you believe otherwise because I was a coward, and because you would have come for me, and I did not want to be found."',
          'Sable: "But the Rotcrown is dead, and the next knot is widening. You cannot mend all six of them with one cleric and a stranger who wandered into your story."',
          '(He opens his eyes. They are tired and very old.) "I will come. For Lyra. For the Order I helped fail. For what Vael was before he was anything else."',
          'Sable: "Teach me where you are walking. I will burn the path open."',
        ] },
    ],
    doors: [
      // South back to Deep Reach.
      { tx: 15, ty: 25, target: 'reachDeep', targetTx: 22, targetTy: 1 },
      // North into the Bloom of Decay arena — opens once Sable has joined.
      { tx: 15, ty: 0, target: 'bloomArena', targetTx: 14, targetTy: 20,
        requires: 'recruit:sable',
        lockedMsg: 'A presence beyond the pass watches the path. Sable says: "Not until I walk with you."' },
    ],
    // Warm amber — lanterns burning that no one lit. The whole sanctum reads
    // golden, like late afternoon light through old stained glass.
    tint: { color: '#ff9a3b', alpha: 0.45, glow: 0.12 },
    enterCutscene: {
      flag: 'sableHollow:firstEntry',
      speaker: '',
      visual: 'sanctum-awe',
      delay: 1200,
      lines: [
        'The pass crests, and the mist parts.',
        'A stone-paved sanctum sits in the hollow ahead — older than the Order, older than the names of the leylines themselves. Lanterns burn that no one has lit.',
        'Lyra (whispering): "He kept it. He kept all of it. He never really left."',
        'A figure waits at the central pavilion, deep in trance.',
      ],
    },
    searchables: [
      // ---- Lore (3) -------------------------------------------------------
      { id: 'sableHollow:lore1', tx: 4, ty: 4, kind: 'hidden', label: 'Order regalia',
        lines: [
          'A folded ceremonial robe, the Aetherial Order\'s sigil embroidered in faded thread.',
          '"We were seven and we were proud and we believed we could hold the song. We were children with a knife that we did not know was sharper than us."',
          '— Sable\'s margin notes',
        ],
        item: { kind: 'lore' } },
      { id: 'sableHollow:lore2', tx: 4, ty: 9, kind: 'hidden', label: 'Stone tablet',
        lines: [
          'A weather-worn slab carved with the Order\'s founding charter.',
          '"To steady. To never to silence. To hold the song in trust for those who come after — not to wield it as ours."',
          'The last line has been struck through. Beneath it, Sable\'s hand has written: "We forgot the second one first."',
        ],
        item: { kind: 'lore' } },
      { id: 'sableHollow:lore3', tx: 25, ty: 8, kind: 'hidden', label: 'Vael\'s last letter',
        lines: [
          'A letter tucked under Sable\'s pillow. Sable\'s name on the front, in Vael\'s hand.',
          '"Sable — if you read this, I have already done it. I do not ask forgiveness. I ask that you remember what I was, and not only what I became. Do not let them name the rift after me. Name it for her. — V."',
          'The letter has been read many times, and folded so many ways it is almost falling apart.',
        ],
        item: { kind: 'lore' } },
      // ---- Gems (2) -------------------------------------------------------
      { id: 'sableHollow:gem1', tx: 8, ty: 10, kind: 'hidden', label: 'Cracked Order shard',
        lines: ['A violet shard, once part of a much larger working. It still hums faintly.'],
        item: { kind: 'gem', id: 'echoingSigil' } },
      { id: 'sableHollow:gem2', tx: 17, ty: 13, kind: 'hidden', label: 'Sealed prism',
        lines: ['A small prism wound in iron wire — one of Sable\'s own bindings.'],
        item: { kind: 'gem', id: 'mirroredSigil' } },
      // ---- Equipment (2) --------------------------------------------------
      { id: 'sableHollow:eq1', tx: 6, ty: 19, kind: 'hidden', label: 'Worn staff',
        lines: ['Sable\'s old training staff, leaned against the garden wall. Still serviceable.'],
        item: { kind: 'equipment', id: 'soulforge' } },
      { id: 'sableHollow:eq2', tx: 25, ty: 18, kind: 'hidden', label: 'Brass-bound chest',
        lines: ['A chest banded in brass — inside, a robe of woven slategrey thread, smelling faintly of woodsmoke.'],
        item: { kind: 'equipment', id: 'cinderRobe' } },
      // ---- Consumables (2) ------------------------------------------------
      { id: 'sableHollow:con1', tx: 14, ty: 20, kind: 'hidden', label: 'Apothecary shelf',
        lines: ['A row of phials, neatly stoppered. Sable kept stocked even out here.'],
        item: { kind: 'consumable', id: 'hipotion', qty: 4 } },
      { id: 'sableHollow:con2', tx: 23, ty: 22, kind: 'hidden', label: 'Ether cabinet',
        lines: ['A small cabinet with the Order\'s sigil burned into the door.'],
        item: { kind: 'consumable', id: 'ether', qty: 4 } },
    ],
    music: 'overworld',
    ambient: null,
  },
  bloomArena: {
    id: 'bloomArena', name: 'Bloom of Decay — Arena',
    tiles: parse(BLOOM_ARENA_STR),
    playerStart: { tx: 14, ty: 21 },
    encounters: [],
    encounterRate: 0,
    npcs: [],
    doors: [
      { tx: 14, ty: 21, target: 'sableHollow', targetTx: 15, targetTy: 1 },
    ],
    // The Bloom roots at the centre of the arena. Walking into the stone
    // ring triggers the final boss cinematic.
    bossEvents: [
      { id: 'reach:bloom', tx: 14, ty: 10, boss: 'bloomOfDecay',
        bannerName: 'Bloom of Decay',
        bannerSub: '— a face Vael used to wear —',
        speaker: '',
        lines: [
          'You step onto the stone ring — and the air folds inward.',
          'Where the leyline knot should be, there is a vast violet flower of bark and bone. It opens its many faces, and one of them looks like a man.',
          'Sable: "...that\'s not a face it should still have. The Sundered is letting us see him."',
          'Lyra: "Then let it. Vael — we hear you. We are still here."',
          'The Bloom answers without sound. The arena begins to dim from the edges in.',
          'Steady your hand. The song breaks here, or you do.',
        ] },
    ],
    // Deep magenta-violet — the leyline knot bleeds into the air itself.
    // The strongest tint of the chapter; the whole arena hums purple.
    tint: { color: '#b070ff', alpha: 0.92, glow: 0.22, darken: 0.12 },
    cutscenes: [
      // Intro — fires the first time the party crosses the threshold (before
      // the boss arena trigger), Sable + Lyra exchange a final word.
      { flag: 'bloomArena:intro',
        speaker: '',
        visual: 'bloom-arena-intro',
        delay: 1500,
        lines: [
          'You cross the misted pass and step into a stone clearing older than the Order.',
          'Sable (quiet): "I thought I would never come back to this place. The knot is just ahead."',
          'Lyra: "Sable — whatever face we find in there, it is not the brother you knew. Do not flinch from striking it."',
          'Sable: "I will not flinch. I am only telling you what I have to forgive myself for, before we begin."',
          'The path leads north — into the ring.',
        ] },
      // Epilogue — fires once after the Bloom falls, on re-entry to the arena.
      { flag: 'bloomArena:epilogue', requires: 'reach:bloom',
        speaker: '',
        visual: 'bloom-dissolve',
        delay: 1800,
        lines: [
          'The stone ring is still. The Bloom is gone — only soft violet ash drifts in its place.',
          'For a moment, where the flower had been, there is the silhouette of a man bowing his head. Then it dissolves.',
          'Lyra (after a long breath): "The second knot is mended. That\'s two of seven."',
          'Sable: "And the easiest two. We should rest. Hearthstone will want to hear what we did here — and what we did not."',
          'A path home is waiting. The road continues.',
        ] },
    ],
    searchables: [
      // ---- Lore (2) -------------------------------------------------------
      { id: 'bloom:lore1', tx: 11, ty: 5, kind: 'hidden', label: 'Faded pillar',
        lines: [
          'Carved into a fallen pillar at the arena\'s edge.',
          '"Where seven mages stood, the world was steady. Where six remain, the world chooses what to break first."',
        ],
        item: { kind: 'lore' } },
      { id: 'bloom:lore2', tx: 17, ty: 5, kind: 'hidden', label: 'Order sigil',
        lines: [
          'A weather-burned Order sigil set into the stone — under it, a list of seven names.',
          'Six of them are scratched out. Two of those have small flowers carved next to them — the dead of the Order whom Lyra and Sable still remember.',
          'The seventh name is "Vael." It has not been scratched out.',
        ],
        item: { kind: 'lore' } },
      // ---- Gems (2) -------------------------------------------------------
      { id: 'bloom:gem1', tx: 9, ty: 8, kind: 'hidden', label: 'Knot-fragment',
        lines: ['A splinter of crystallized leyline — humming, almost warm.'],
        item: { kind: 'gem', id: 'echoingSigil' } },
      { id: 'bloom:gem2', tx: 19, ty: 8, kind: 'hidden', label: 'Vein of stone',
        lines: ['A vein of stone laced with cooled aether.'],
        item: { kind: 'gem', id: 'wardStone' } },
      // ---- Equipment (1) --------------------------------------------------
      { id: 'bloom:eq1', tx: 22, ty: 17, kind: 'hidden', label: 'Pilgrim\'s pack',
        lines: ['An unopened pack left at the alcove\'s edge. Someone meant to outlive this place.'],
        item: { kind: 'equipment', id: 'amulet' } },
      // ---- Consumables (2) ------------------------------------------------
      { id: 'bloom:con1', tx: 5, ty: 16, kind: 'hidden', label: 'Brass jar',
        lines: ['A sealed brass jar, half-buried in moss. Still cold.'],
        item: { kind: 'consumable', id: 'hipotion', qty: 5 } },
      { id: 'bloom:con2', tx: 23, ty: 16, kind: 'hidden', label: 'Glass phials',
        lines: ['Three glass phials stoppered with old wax.'],
        item: { kind: 'consumable', id: 'ether', qty: 5 } },
    ],
    music: 'battle',
    ambient: null,
  },
};

// Backwards compat — some code still imports STARTER_MAP.
export const STARTER_MAP = MAPS.meadow;
