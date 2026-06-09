// Resonance combos — when these gem ids all share an item's slots, the
// item also grants the listed skills/passives. Order doesn't matter.
// `requires` is a sorted set of gem ids; we match by exact set membership.
//
// 2-gem combos give a strong combo skill; 3-gem combos give a top-tier
// skill or a transformative passive.
export const COMBOS = [
  // ---- 2-gem ELEMENTAL × ELEMENTAL --------------------------------------
  { gems: ['emberCore', 'tideShard'],   grants: ['steamBurst'],    name: 'Steam Burst' },
  { gems: ['emberCore', 'stormPearl'],  grants: ['plasmaSurge'],   name: 'Plasma Surge' },
  { gems: ['tideShard', 'stormPearl'],  grants: ['tempestVolt'],   name: 'Tempest Volt' },

  // ---- 2-gem ELEMENTAL × STATUS -----------------------------------------
  // Combining an element with a status gem yields a "always inflicts" combo spell.
  { gems: ['emberCore', 'venomFang'],       grants: ['acidBloom'],    name: 'Acid Bloom' },
  { gems: ['emberCore', 'brandOfCinders'],  grants: ['pyreMark'],     name: 'Pyre Mark' },
  { gems: ['tideShard', 'frostAspect'],     grants: ['glacier'],      name: 'Glacier' },
  { gems: ['stormPearl', 'sandmanBell'],    grants: ['lullaby'],      name: 'Lullaby' },

  // ---- 2-gem PHYS × STATUS / SPEED --------------------------------------
  { gems: ['mightCore', 'venomFang'],       grants: ['plagueStrike'], name: 'Plague Strike' },
  { gems: ['mightCore', 'heartOfSpeed'],    grants: ['bladeStorm'],   name: 'Bladestorm' },

  // ---- 2-gem LIFEBLOOM × X ----------------------------------------------
  { gems: ['emberCore', 'lifebloom'],   grants: ['cure'],          name: 'Hearth Bloom (Cure)' },
  { gems: ['lifebloom', 'wardStone'],   grants: ['stalwartAura'],  name: 'Stalwart Aura' },
  { gems: ['lifebloom', 'tideShard'],   grants: ['heal'],          name: 'Tide of Mending (Heal)' },

  // ---- 2-gem PASSIVE STACKS ---------------------------------------------
  { gems: ['wardStone', 'vigorStone'],  grants: ['stalwartAura'],  name: 'Stalwart Aura' },

  // ---- 2-gem WEAPON IDENTITY upgrades -----------------------------------
  { gems: ['vigorStone','mightCore'],   grants: ['cleave'],        name: 'Berserker (Cleave)' },
  { gems: ['mightCore', 'wardStone'],   grants: ['sunder'],        name: 'Bulwark Strike (Sunder)' },
  { gems: ['mightCore', 'emberCore'],   grants: ['firaga'],        name: 'Flameforge' },
  { gems: ['mightCore', 'stormPearl'],  grants: ['thundara'],      name: 'Stormblade (Thundara)' },

  // ---- 3-gem TRIO COMBOS ------------------------------------------------
  { gems: ['emberCore','tideShard','deepTide'],     grants: ['tideTriad'],      name: 'Tide Triad' },
  { gems: ['emberCore','deepTide','acidvial'],      grants: ['causticCataract'],name: 'Caustic Cataract' },
  { gems: ['emberCore','tideShard','stormPearl'],   grants: ['prismaBurst'],    name: 'Prisma Burst' },
  { gems: ['emberCore','tideShard','lifebloom'],    grants: ['curaga'],         name: 'Eden Spring' },
  { gems: ['emberCore','stormPearl','mightCore'],   grants: ['sunder','firaga'], name: 'Wrath of Forges' },
  { gems: ['tideShard','stormPearl','wardStone'],   grants: ['stalwartAura','blizzaga'], name: 'Frozen Bastion' },
  { gems: ['lifebloom','wardStone','vigorStone'],   grants: ['phoenixShroud'],  name: 'Phoenix Shroud' },
  { gems: ['emberCore','tideShard','wardStone'],    grants: ['stalwartAura','steamBurst'], name: 'Maelstrom Aegis' },
  { gems: ['mightCore','lifebloom','wardStone'],    grants: ['stalwartAura','cleave'], name: "Sentinel's Oath" },

  // ---- 3-gem ELEMENT × ELEMENT × STATUS (fusion) ------------------------
  // Frostfire — an impossible flame.
  { gems: ['emberCore','tideShard','brandOfCinders'], grants: ['frostFire'], name: 'Frostfire' },
  { gems: ['emberCore','tideShard','frostAspect'],    grants: ['frostFire'], name: 'Frostfire' },

  // ---- 3-gem ULTIMATE FUSIONS -------------------------------------------
  // Three elements + lifebloom = Aurora (heal-all flavored as a shimmering veil).
  { gems: ['stormPearl','tideShard','lifebloom'],     grants: ['aurora'],   name: 'Aurora' },
  // (Cataclysm reserved for future 4-socket item — 4-element fusion.)

  // ---- 3-gem STATUS-STACKING --------------------------------------------
  { gems: ['venomFang','brandOfCinders','frostAspect'], grants: ['glacier','pyreMark'], name: 'Triple Brand' },
  { gems: ['venomFang','sandmanBell','brandOfCinders'], grants: ['lullaby','acidBloom'], name: 'Triune Affliction' },

  // ---- 3-gem UTILITY STACKS ---------------------------------------------
  // Heart of Speed + Might + Storm = Bladestorm + Thundara on the same item.
  { gems: ['heartOfSpeed','mightCore','stormPearl'],    grants: ['bladeStorm','thundara'], name: 'Stormblitz' },

  // ---- 3-gem NEW ELEMENT TRIOS ------------------------------------------
  { gems: ['emberCore','deepTide','dawnstone'],         grants: ['sunlitSea'],     name: 'Sunlit Sea' },
  { gems: ['emberCore','voidshard','acidvial'],         grants: ['hellfireDecay'], name: 'Hellfire Decay' },
  { gems: ['emberCore','stormPearl','dawnstone'],       grants: ['dayStar'],       name: 'Day Star' },
  { gems: ['emberCore','bloomroot','voidshard'],        grants: ['ashenGrove'],    name: 'Ashen Grove' },
  { gems: ['tideShard','stormPearl','voidshard'],       grants: ['tempestSouls'],  name: 'Tempest of Souls' },
  { gems: ['deepTide','voidshard','dawnstone'],         grants: ['twilightTide'],  name: 'Twilight Tide' },
  { gems: ['bloomroot','dawnstone','lifebloom'],        grants: ['worldtree'],     name: "Worldtree's Bloom" },
  { gems: ['stormPearl','brandOfCinders','frostAspect'],grants: ['stormBrands'],   name: 'Storm of Brands' },
  { gems: ['acidvial','voidshard','bloomroot'],         grants: ['necroticBloom'], name: 'Necrotic Bloom' },
  { gems: ['mightCore','emberCore','brandOfCinders'],   grants: ['pyremaster'],    name: "Pyremaster's Edge" },
  { gems: ['choirReed','tideShard','bloomroot'],        grants: ['drownedGarden'], name: 'Drowned Garden' },
  { gems: ['voidshard','bloomroot','sandmanBell'],      grants: ['eclipsePetal'],  name: 'Eclipse Petal' },
  { gems: ['stagShard','emberCore','dawnstone'],        grants: ['crownedSunrise'],name: 'Crowned Sunrise' },

  // ---- 3-gem LINKER-AMPLIFIED COMBOS ------------------------------------
  // When a support gem joins a 2-gem fusion, the fusion gets bigger or wider.
  { gems: ['echoingSigil','emberCore','tideShard'],         grants: ['steamGeyser'],   name: 'Steam Geyser' },
  { gems: ['echoingSigil','emberCore','venomFang'],         grants: ['plagueWide'],    name: 'Plague Wide' },
  { gems: ['echoingSigil','emberCore','brandOfCinders'],    grants: ['pyreSky'],       name: 'Pyre Sky' },
  { gems: ['echoingSigil','tideShard','frostAspect'],       grants: ['glacialField'],  name: 'Glacial Field' },
  { gems: ['echoingSigil','stormPearl','sandmanBell'],      grants: ['lullsky'],       name: 'Lullsky' },

  // ---- 3-gem MIRROR TWIN-CAST FUSIONS -----------------------------------
  { gems: ['mirroredSigil','emberCore','brandOfCinders'],   grants: ['twinPyre'],      name: 'Twin Pyre' },
  { gems: ['mirroredSigil','tideShard','frostAspect'],      grants: ['twinGlacier'],   name: 'Twin Glacier' },

  // ---- 3-gem ELEMENT TRIOS (continued) -----------------------------------
  { gems: ['emberCore','tideShard','voidshard'],            grants: ['cryoCurse'],     name: "Cryomancer's Curse" },
  { gems: ['stormPearl','bloomroot','dawnstone'],           grants: ['verdantSun'],    name: 'Verdant Sun' },
  { gems: ['deepTide','voidshard','acidvial'],              grants: ['tideblight'],    name: 'Tideblight' },
  { gems: ['emberCore','voidshard','dawnstone'],            grants: ['twinSun'],       name: 'Twin Sun' },
  { gems: ['tideShard','bloomroot','acidvial'],             grants: ['bogCurse'],      name: 'Bog Curse' },
  { gems: ['emberCore','stormPearl','acidvial'],            grants: ['acidTempest'],   name: 'Acid Tempest' },

  // ---- 3-gem MULTI-GRANT — combos that give two existing spells ----------
  // A "fire + heal" hybrid via Pyrebloom: gives Fira AND Cure together.
  { gems: ['emberCore','brandOfCinders','lifebloom'],       grants: ['fira', 'cure'],  name: 'Pyrebloom' },

  // ---- 2-gem WATER × X --------------------------------------------------
  { gems: ['deepTide', 'emberCore'],   grants: ['scaldGeyser'],  name: 'Scald Geyser' },
  { gems: ['deepTide', 'stormPearl'],  grants: ['chainCurrent'], name: 'Chain Current' },
  { gems: ['deepTide', 'frostAspect'], grants: ['killingFrost'], name: 'Killing Frost' },
  { gems: ['deepTide', 'lifebloom'],   grants: ['cure'],         name: 'Wellspring' },

  // ---- 2-gem DARK × X ---------------------------------------------------
  { gems: ['voidshard', 'lifebloom'],   grants: ['unmaking'],      name: 'Unmaking' },
  { gems: ['voidshard', 'sandmanBell'], grants: ['eclipseLullaby'], name: 'Eclipse Lullaby' },
  { gems: ['voidshard', 'emberCore'],   grants: ['hellfire'],      name: 'Hellfire' },

  // ---- 2-gem NATURE × X -------------------------------------------------
  { gems: ['bloomroot', 'venomFang'],   grants: ['thornsting'],    name: 'Thornsting' },
  { gems: ['bloomroot', 'lifebloom'],   grants: ['wildbloom'],     name: 'Wildbloom' },
  { gems: ['bloomroot', 'emberCore'],   grants: ['wildfire'],      name: 'Wildfire' },

  // ---- 2-gem HOLY × X ---------------------------------------------------
  { gems: ['dawnstone', 'voidshard'],   grants: ['duality'],       name: 'Duality' },
  { gems: ['dawnstone', 'lifebloom'],   grants: ['benediction'],   name: 'Benediction' },
  { gems: ['dawnstone', 'emberCore'],   grants: ['solarFlare'],    name: 'Solar Flare' },
  { gems: ['dawnstone', 'wardStone'],   grants: ['hallowedAegis'], name: 'Hallowed Aegis' },

  // ---- 2-gem POISON × X -------------------------------------------------
  { gems: ['acidvial', 'venomFang'],    grants: ['toxinflood'],    name: 'Toxinflood' },
  { gems: ['acidvial', 'emberCore'],    grants: ['napalm'],        name: 'Napalm' },
  { gems: ['acidvial', 'mightCore'],    grants: ['acidblade'],     name: 'Acidblade' },

  // ---- 2-gem ELEMENT × ELEMENT (filling out missing pairings) -----------
  { gems: ['tideShard', 'deepTide'],    grants: ['deluge'],       name: 'Deluge' },
  { gems: ['tideShard', 'voidshard'],   grants: ['shadowFrost'],  name: 'Shadow Frost' },
  { gems: ['tideShard', 'acidvial'],    grants: ['venomFrost'],   name: 'Venom Frost' },
  { gems: ['stormPearl', 'voidshard'],  grants: ['stormVoid'],    name: 'Storm Void' },
  { gems: ['stormPearl', 'bloomroot'],  grants: ['briarchain'],   name: 'Briarchain' },
  { gems: ['deepTide', 'voidshard'],    grants: ['rotbloom'],     name: 'Rotbloom' },
  { gems: ['deepTide', 'bloomroot'],    grants: ['monsoon'],      name: 'Monsoon' },
  { gems: ['deepTide', 'dawnstone'],    grants: ['dawnTide'],     name: 'Dawn Tide' },
  { gems: ['voidshard', 'bloomroot'],   grants: ['rotbloom'],     name: 'Rotbloom' },
  { gems: ['voidshard', 'acidvial'],    grants: ['voidlight'],    name: 'Voidlight' },
  { gems: ['bloomroot', 'dawnstone'],   grants: ['lifeburst'],    name: 'Lifeburst' },
  { gems: ['dawnstone', 'acidvial'],    grants: ['sterilize'],    name: 'Sterilize' },
  { gems: ['emberCore', 'frostAspect'], grants: ['frostBrand'],   name: 'Frost Brand' },

  // ---- 2-gem ELEMENT × STATUS (fusion crosses) --------------------------
  { gems: ['emberCore', 'sandmanBell'],     grants: ['lullsoot'],       name: 'Lullsoot' },
  { gems: ['tideShard', 'venomFang'],       grants: ['acidrain'],       name: 'Acid Rain' },
  { gems: ['tideShard', 'sandmanBell'],     grants: ['hushFrost'],      name: 'Hush Frost' },
  { gems: ['stormPearl', 'venomFang'],      grants: ['venomBolt'],      name: 'Venom Bolt' },
  { gems: ['stormPearl', 'brandOfCinders'], grants: ['searingBolt'],    name: 'Searing Bolt' },
  { gems: ['stormPearl', 'frostAspect'],    grants: ['staticFrost'],    name: 'Static Frost' },
  { gems: ['deepTide', 'sandmanBell'],      grants: ['drowsingTide'],   name: 'Drowsing Tide' },
  { gems: ['voidshard', 'brandOfCinders'],  grants: ['hellbrand'],      name: 'Hellbrand' },
  { gems: ['voidshard', 'frostAspect'],     grants: ['frostTomb'],      name: 'Frost Tomb' },
  { gems: ['bloomroot', 'brandOfCinders'],  grants: ['livingPyre'],     name: 'Living Pyre' },
  { gems: ['bloomroot', 'frostAspect'],     grants: ['glacialVine'],    name: 'Glacial Vine' },
  { gems: ['bloomroot', 'sandmanBell'],     grants: ['poppysleep'],     name: 'Poppysleep' },
  { gems: ['dawnstone', 'brandOfCinders'],  grants: ['pyrelight'],      name: 'Pyrelight' },
  { gems: ['acidvial', 'brandOfCinders'],   grants: ['caustic'],        name: 'Caustic' },
  { gems: ['acidvial', 'sandmanBell'],      grants: ['lethalTwilight'], name: 'Lethal Twilight' },

  // ---- 2-gem PHYS × STATUS — weapon-fusion strikes ----------------------
  { gems: ['mightCore', 'frostAspect'],     grants: ['coldSteel'],      name: 'Cold Steel' },
  { gems: ['mightCore', 'brandOfCinders'],  grants: ['burningEdge'],    name: 'Burning Edge' },
  { gems: ['mightCore', 'sandmanBell'],     grants: ['mercyStroke'],    name: 'Mercy Stroke' },

  // ---- 2-gem STATUS × STATUS — affliction laces -------------------------
  { gems: ['venomFang', 'frostAspect'],     grants: ['frozentoxin'],    name: 'Frozen Toxin' },

  // ---- 3-gem MASTERWORKS ------------------------------------------------
  // Three elemental gems forming an endgame fusion.
  { gems: ['emberCore','deepTide','stormPearl'],    grants: ['stormfront'],  name: 'Stormfront' },
  { gems: ['voidshard','dawnstone','lifebloom'],    grants: ['judgement'],   name: 'Judgement' },
  { gems: ['bloomroot','acidvial','venomFang'],     grants: ['plagueGrove'], name: 'Plague Grove' },
  // The four-element knot. The "ultimate" reachable via gem combos.
  { gems: ['emberCore','deepTide','stormPearl','voidshard'], grants: ['ultima'], name: 'Aether-Knell' },

  // ---- 3-gem ELEMENT TRIO FUSIONS (catalog sweep — every elemental triple) ----
  // Every C(8,3) elemental combination grants a bespoke tier-4 trio spell.
  { gems: ['emberCore','tideShard','bloomroot'],    grants: ['frostBramble'],     name: 'Frostfire Bramble' },
  { gems: ['emberCore','tideShard','dawnstone'],    grants: ['sanctifiedPrism'],  name: 'Sanctified Prism' },
  { gems: ['emberCore','tideShard','acidvial'],     grants: ['venomspire'],       name: 'Venomspire' },
  { gems: ['emberCore','stormPearl','voidshard'],   grants: ['hellstorm'],        name: 'Hellstorm' },
  { gems: ['emberCore','stormPearl','bloomroot'],   grants: ['wildfireTempest'],  name: 'Wildfire Tempest' },
  { gems: ['emberCore','deepTide','voidshard'],     grants: ['abyssalSteam'],     name: 'Abyssal Steam' },
  { gems: ['emberCore','deepTide','bloomroot'],     grants: ['greenfireTide'],    name: 'Greenfire Tide' },
  { gems: ['emberCore','bloomroot','dawnstone'],    grants: ['hallowedPyre'],     name: 'Hallowed Pyre' },
  { gems: ['emberCore','bloomroot','acidvial'],     grants: ['wretchedBloom'],    name: 'Wretched Bloom' },
  { gems: ['emberCore','dawnstone','acidvial'],     grants: ['inquisitorBrand'],  name: "Inquisitor's Brand" },
  { gems: ['tideShard','stormPearl','deepTide'],    grants: ['polarTempest'],     name: 'Polar Tempest' },
  { gems: ['tideShard','stormPearl','bloomroot'],   grants: ['briarTempest'],     name: 'Briar Tempest' },
  { gems: ['tideShard','stormPearl','dawnstone'],   grants: ['haloStorm'],        name: 'Halo Storm' },
  { gems: ['tideShard','stormPearl','acidvial'],    grants: ['acidFrostBolt'],    name: 'Acid Frost Bolt' },
  { gems: ['tideShard','deepTide','voidshard'],     grants: ['drownedGlacier'],   name: 'Drowned Glacier' },
  { gems: ['tideShard','deepTide','bloomroot'],     grants: ['verdantFrost'],     name: 'Verdant Frost' },
  { gems: ['tideShard','deepTide','dawnstone'],     grants: ['sacredGlacier'],    name: 'Sacred Glacier' },
  { gems: ['tideShard','deepTide','acidvial'],      grants: ['plagueTide'],       name: 'Plague Tide' },
  { gems: ['tideShard','voidshard','bloomroot'],    grants: ['witheringBriar'],   name: 'Withering Briar' },
  { gems: ['tideShard','voidshard','dawnstone'],    grants: ['twilightGlacier'],  name: 'Twilight Glacier' },
  { gems: ['tideShard','voidshard','acidvial'],     grants: ['frozenPlague'],     name: 'Frozen Plague' },
  { gems: ['tideShard','bloomroot','dawnstone'],    grants: ['frostbloomSanctum'],name: 'Frostbloom Sanctum' },
  { gems: ['tideShard','dawnstone','acidvial'],     grants: ['sterileFrost'],     name: 'Sterile Frost' },
  { gems: ['stormPearl','deepTide','voidshard'],    grants: ['abyssalStorm'],     name: 'Abyssal Storm' },
  { gems: ['stormPearl','deepTide','bloomroot'],    grants: ['monsoonStorm'],     name: 'Monsoon Storm' },
  { gems: ['stormPearl','deepTide','dawnstone'],    grants: ['hallowedTempest'],  name: 'Hallowed Tempest' },
  { gems: ['stormPearl','deepTide','acidvial'],     grants: ['toxicSquall'],      name: 'Toxic Squall' },
  { gems: ['stormPearl','voidshard','bloomroot'],   grants: ['witherstorm'],      name: 'Witherstorm' },
  { gems: ['stormPearl','voidshard','dawnstone'],   grants: ['judgementBolt'],    name: 'Judgement Bolt' },
  { gems: ['stormPearl','voidshard','acidvial'],    grants: ['venomBoltStorm'],   name: 'Venom Bolt Storm' },
  { gems: ['stormPearl','bloomroot','acidvial'],    grants: ['plagueTempest'],    name: 'Plague Tempest' },
  { gems: ['stormPearl','dawnstone','acidvial'],    grants: ['sanctifyingBolt'],  name: 'Sanctifying Bolt' },
  { gems: ['deepTide','voidshard','bloomroot'],     grants: ['drownedMire'],      name: 'Drowned Mire' },
  { gems: ['deepTide','bloomroot','dawnstone'],     grants: ['sacredSpring'],     name: 'Sacred Spring' },
  { gems: ['deepTide','bloomroot','acidvial'],      grants: ['swampTide'],        name: 'Swamp Tide' },
  { gems: ['deepTide','dawnstone','acidvial'],      grants: ['cleansingFlood'],   name: 'Cleansing Flood' },
  { gems: ['voidshard','bloomroot','dawnstone'],    grants: ['eclipseGrove'],     name: 'Eclipse Grove' },
  { gems: ['voidshard','dawnstone','acidvial'],     grants: ['taintedHalo'],      name: 'Tainted Halo' },
  { gems: ['bloomroot','dawnstone','acidvial'],     grants: ['hallowedVenom'],    name: 'Hallowed Venom' },
];

// Match a set of gem ids against the combo catalog. Returns array of combos
// whose required gems are all present in `slottedIds`.
export function matchCombos(slottedIds) {
  const present = new Set(slottedIds);
  const found = [];
  for (const c of COMBOS) {
    if (c.gems.every(g => present.has(g))) found.push(c);
  }
  return found;
}

// 2-gem combos activated by a specific linked socket pair. Pass the two gem
// ids that sit in a linked pair on the equipment; returns matching combos.
// Order-agnostic.
export function matchPairCombo(idA, idB) {
  if (!idA || !idB) return [];
  const set = new Set([idA, idB]);
  return COMBOS.filter(c => c.gems.length === 2 && c.gems.every(g => set.has(g)));
}

// 3+ gem combos still match against all gems on an equipment instance — these
// represent richer fusions that don't require a single linked pair.
export function matchHigherCombos(slottedIds) {
  const present = new Set(slottedIds);
  return COMBOS.filter(c => c.gems.length >= 3 && c.gems.every(g => present.has(g)));
}
