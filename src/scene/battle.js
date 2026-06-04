import { createEnemyInstance } from '../data/enemies.js';
import { SKILL_BY_ID } from '../data/skills.js';
import { ITEM_BY_ID } from '../data/items.js';
import { STATUS_BY_ID } from '../data/statuses.js';
import { findAllLinkersFor, slotIdxOf } from '../data/equipment.js';
import { matchCombos } from '../data/combos.js';
import { audio } from '../audio.js';
import { clamp } from '../util.js';
import { drawHero } from '../heroSprites.js';
import { Effects } from '../effects.js';

// Trio-cataclysm signature configs — bespoke palette per endgame 3-element
// fusion spell. Each gets element-driven FX + a triple-shockwave palette + a
// Prisma-Burst-class star/blackStar overlay + 4 audio stings. Add new trios
// here; the helper `_playTrioSignature` reads this map.
const TRIO_SIGNATURES = {
  frostBramble:      { elements: ['fire','ice','nature'],     colors: ['#a8ffc8','#cfeaff','#ff8a3b'], audio: ['glassShatter','sporeBurst','thornCrack','aetherWail'], starColor: '#a8ffc8', flash: '#a8ffc8' },
  sanctifiedPrism:   { elements: ['fire','ice','holy'],       colors: ['#ffd884','#cfeaff','#ff8a3b'], audio: ['glassShatter','choirSwell','chime','doomKnell'],       starColor: '#ffffff', flash: '#ffd884' },
  venomspire:        { elements: ['fire','ice','poison'],     colors: ['#c8e060','#cfeaff','#ff8a3b'], audio: ['glassShatter','swarmHiss','sporeBurst','aetherWail'], starColor: '#c8e060', flash: '#c8e060' },
  hellstorm:         { elements: ['fire','thunder','dark'],   colors: ['#c0a0ff','#ffd84d','#ff5a3b'], audio: ['thunderclap','voidHum','doomKnell','aetherWail'],     starColor: '#c0a0ff', flash: '#c0a0ff' },
  wildfireTempest:   { elements: ['fire','thunder','nature'], colors: ['#a8ffc8','#ffd84d','#ff5a3b'], audio: ['thunderclap','thornCrack','sporeBurst','aetherWail'], starColor: '#a8ffc8', flash: '#a8ffc8' },
  abyssalSteam:      { elements: ['fire','water','dark'],     colors: ['#5a2070','#7adaff','#ff5a3b'], audio: ['sporeBurst','voidHum','doomKnell','aetherWail'],      starColor: '#c0a0ff', flash: '#c0a0ff' },
  greenfireTide:     { elements: ['fire','water','nature'],   colors: ['#7aaa3a','#7adaff','#ff5a3b'], audio: ['sporeBurst','thornCrack','doomKnell','aetherWail'],   starColor: '#a8ffc8', flash: '#a8ffc8' },
  hallowedPyre:      { elements: ['fire','nature','holy'],    colors: ['#ffd884','#7aaa3a','#ff5a3b'], audio: ['choirSwell','sporeBurst','chime','aetherWail'],       starColor: '#ffffff', flash: '#ffd884' },
  wretchedBloom:     { elements: ['fire','nature','poison'],  colors: ['#7aaa3a','#c8e060','#ff5a3b'], audio: ['swarmHiss','thornCrack','sporeBurst','aetherWail'],   starColor: '#c8e060', flash: '#c8e060' },
  inquisitorBrand:   { elements: ['fire','holy','poison'],    colors: ['#ffd884','#c8e060','#ff5a3b'], audio: ['choirSwell','swarmHiss','chime','doomKnell'],         starColor: '#ffd884', flash: '#ffd884' },
  polarTempest:      { elements: ['ice','thunder','water'],   colors: ['#7adaff','#ffd84d','#cfeaff'], audio: ['thunderclap','glassShatter','sporeBurst','aetherWail'],starColor: '#cfeaff', flash: '#cfeaff' },
  briarTempest:      { elements: ['ice','thunder','nature'],  colors: ['#7aaa3a','#ffd84d','#cfeaff'], audio: ['thunderclap','glassShatter','thornCrack','aetherWail'],starColor: '#a8ffc8', flash: '#a8ffc8' },
  haloStorm:         { elements: ['ice','thunder','holy'],    colors: ['#ffd884','#ffd84d','#cfeaff'], audio: ['thunderclap','choirSwell','chime','doomKnell'],       starColor: '#ffffff', flash: '#ffd884' },
  acidFrostBolt:     { elements: ['ice','thunder','poison'],  colors: ['#c8e060','#ffd84d','#cfeaff'], audio: ['thunderclap','glassShatter','swarmHiss','aetherWail'],starColor: '#c8e060', flash: '#c8e060' },
  drownedGlacier:    { elements: ['ice','water','dark'],      colors: ['#5a2070','#7adaff','#cfeaff'], audio: ['glassShatter','voidHum','sporeBurst','doomKnell'],    starColor: '#c0a0ff', flash: '#c0a0ff' },
  verdantFrost:      { elements: ['ice','water','nature'],    colors: ['#7aaa3a','#7adaff','#cfeaff'], audio: ['glassShatter','sporeBurst','thornCrack','aetherWail'],starColor: '#a8ffc8', flash: '#a8ffc8' },
  sacredGlacier:     { elements: ['ice','water','holy'],      colors: ['#ffd884','#7adaff','#cfeaff'], audio: ['glassShatter','choirSwell','chime','doomKnell'],      starColor: '#ffffff', flash: '#ffd884' },
  plagueTide:        { elements: ['ice','water','poison'],    colors: ['#c8e060','#7adaff','#cfeaff'], audio: ['glassShatter','sporeBurst','swarmHiss','aetherWail'], starColor: '#c8e060', flash: '#c8e060' },
  witheringBriar:    { elements: ['ice','dark','nature'],     colors: ['#7aaa3a','#5a2070','#cfeaff'], audio: ['glassShatter','voidHum','thornCrack','aetherWail'],   starColor: '#a8ffc8', flash: '#a8ffc8' },
  twilightGlacier:   { elements: ['ice','dark','holy'],       colors: ['#ffd884','#5a2070','#cfeaff'], audio: ['glassShatter','voidHum','choirSwell','doomKnell'],    starColor: '#ffffff', flash: '#cfeaff' },
  frozenPlague:      { elements: ['ice','dark','poison'],     colors: ['#c8e060','#5a2070','#cfeaff'], audio: ['glassShatter','voidHum','swarmHiss','aetherWail'],    starColor: '#c8e060', flash: '#c8e060' },
  frostbloomSanctum: { elements: ['ice','nature','holy'],     colors: ['#ffd884','#7aaa3a','#cfeaff'], audio: ['glassShatter','sporeBurst','choirSwell','chime'],     starColor: '#ffffff', flash: '#a8ffc8' },
  sterileFrost:      { elements: ['ice','holy','poison'],     colors: ['#c8e060','#ffd884','#cfeaff'], audio: ['glassShatter','choirSwell','swarmHiss','chime'],      starColor: '#ffffff', flash: '#ffd884' },
  abyssalStorm:      { elements: ['thunder','water','dark'],  colors: ['#5a2070','#7adaff','#ffd84d'], audio: ['thunderclap','sporeBurst','voidHum','aetherWail'],    starColor: '#c0a0ff', flash: '#c0a0ff' },
  monsoonStorm:      { elements: ['thunder','water','nature'],colors: ['#7aaa3a','#7adaff','#ffd84d'], audio: ['thunderclap','sporeBurst','thornCrack','aetherWail'], starColor: '#a8ffc8', flash: '#a8ffc8' },
  hallowedTempest:   { elements: ['thunder','water','holy'],  colors: ['#ffd884','#7adaff','#ffd84d'], audio: ['thunderclap','sporeBurst','choirSwell','chime'],      starColor: '#ffffff', flash: '#ffd884' },
  toxicSquall:       { elements: ['thunder','water','poison'],colors: ['#c8e060','#7adaff','#ffd84d'], audio: ['thunderclap','sporeBurst','swarmHiss','aetherWail'],  starColor: '#c8e060', flash: '#c8e060' },
  witherstorm:       { elements: ['thunder','dark','nature'], colors: ['#7aaa3a','#5a2070','#ffd84d'], audio: ['thunderclap','voidHum','thornCrack','aetherWail'],    starColor: '#a8ffc8', flash: '#a8ffc8' },
  judgementBolt:     { elements: ['thunder','dark','holy'],   colors: ['#ffd884','#5a2070','#ffd84d'], audio: ['thunderclap','voidHum','choirSwell','doomKnell'],     starColor: '#ffffff', flash: '#ffd884' },
  venomBoltStorm:    { elements: ['thunder','dark','poison'], colors: ['#c8e060','#5a2070','#ffd84d'], audio: ['thunderclap','voidHum','swarmHiss','aetherWail'],     starColor: '#c8e060', flash: '#c8e060' },
  plagueTempest:     { elements: ['thunder','nature','poison'],colors:['#c8e060','#7aaa3a','#ffd84d'], audio: ['thunderclap','thornCrack','swarmHiss','aetherWail'],  starColor: '#c8e060', flash: '#c8e060' },
  sanctifyingBolt:   { elements: ['thunder','holy','poison'], colors: ['#ffd884','#c8e060','#ffd84d'], audio: ['thunderclap','choirSwell','swarmHiss','chime'],       starColor: '#ffffff', flash: '#ffd884' },
  drownedMire:       { elements: ['water','dark','nature'],   colors: ['#7aaa3a','#5a2070','#7adaff'], audio: ['sporeBurst','voidHum','thornCrack','aetherWail'],     starColor: '#a8ffc8', flash: '#c0a0ff' },
  sacredSpring:      { elements: ['water','nature','holy'],   colors: ['#ffd884','#7aaa3a','#7adaff'], audio: ['sporeBurst','thornCrack','choirSwell','chime'],       starColor: '#ffffff', flash: '#a8ffc8' },
  swampTide:         { elements: ['water','nature','poison'], colors: ['#c8e060','#7aaa3a','#7adaff'], audio: ['sporeBurst','thornCrack','swarmHiss','aetherWail'],   starColor: '#c8e060', flash: '#c8e060' },
  cleansingFlood:    { elements: ['water','holy','poison'],   colors: ['#ffd884','#c8e060','#7adaff'], audio: ['sporeBurst','choirSwell','swarmHiss','chime'],        starColor: '#ffffff', flash: '#ffd884' },
  eclipseGrove:      { elements: ['dark','nature','holy'],    colors: ['#ffd884','#7aaa3a','#5a2070'], audio: ['voidHum','thornCrack','choirSwell','chime'],          starColor: '#a8ffc8', flash: '#c0a0ff' },
  taintedHalo:       { elements: ['dark','holy','poison'],    colors: ['#c8e060','#ffd884','#5a2070'], audio: ['voidHum','choirSwell','swarmHiss','aetherWail'],      starColor: '#ffffff', flash: '#c0a0ff' },
  hallowedVenom:     { elements: ['nature','holy','poison'],  colors: ['#c8e060','#ffd884','#7aaa3a'], audio: ['thornCrack','choirSwell','swarmHiss','chime'],        starColor: '#ffffff', flash: '#a8ffc8' },
};

// Wrap a Game party member as a battle combatant. Stats read through to the
// underlying ref. Phoenix passive is captured once per fight on the member
// itself so each character has their own revive charge.
function makeBattleMember(ref) {
  const m = {
    kind: 'player',
    ref,
    name: ref.name,
    classId: ref.classId,
    get hp() { return this.ref.hp; }, set hp(v) { this.ref.hp = v; },
    get maxHp() { return this.ref.maxHp; },
    get mp() { return this.ref.mp; }, set mp(v) { this.ref.mp = v; },
    get maxMp() { return this.ref.maxMp; },
    get atk() { return this.ref.atk; }, get def() { return this.ref.def; },
    get mag() { return this.ref.mag; }, get spd() { return this.ref.spd; },
    get skills() { return this.ref.skills; },
    defending: false, dead: false, shake: 0, hitFlash: 0,
    phoenixCharged: null,
    statuses: [],
    get attackStatus() { return this.ref.attackStatus; },
    get atbMult() { return this.ref.atbMult || 1; },
    get counterSkill() { return this.ref.counterSkill || null; },
    get counterLinkers() { return this.ref.counterLinkers || []; },
    _screenX: 0, _screenY: 0,
  };
  for (const sid of ref.skills) {
    const s = SKILL_BY_ID[sid];
    if (s?.kind === 'passive' && s.passive?.revive) m.phoenixCharged = s.passive;
  }
  if (m.hp <= 0) m.dead = true;
  return m;
}

export class Battle {
  constructor(game, enemyIds, overworldKey) {
    this.game = game;
    this.overworldKey = overworldKey;
    this.party = game.party.map(makeBattleMember);
    this.enemies = enemyIds.map(id => createEnemyInstance(id));

    this.state = 'intro';
    this.t = 0;
    this.log = ['You are ambushed!'];
    this.actor = null;
    this.popups = [];
    this.attackAnim = null;
    this.targetCallback = null;
    this._targetPool = null;
    this._targetSide = 'enemies';

    this.bgGradient = null;
    // Battle-wide camera shake; ticks down each frame in update().
    this.battleShake = 0;
    this.fx = new Effects();
    audio.stopAmbient();
    audio.startMusic('battle');
  }

  _spellScale(skill) {
    return [1.0, 1.0, 1.25, 1.6, 1.85][this._spellTier(skill)];
  }

  // Returns 1 (cantrip), 2 (-ra/-ara), 3 (-ga), or 4 (ultimate non-elemental).
  // Tier 1 deliberately stays underwhelming; tier 2-3 layer ground sigils,
  // bigger sigils, screen flashes, and secondary rings. Combo fusions are
  // sorted into 3 / 4 depending on how rare and powerful they are.
  _spellTier(skill) {
    if (!skill?.id) return 1;
    const ult = new Set([
      // Original endgame non-elemental
      'ultima','meteor','flare','prismaBurst','aurora','judgement','stormfront',
      // Top-tier 3-gem combo fusions (rare, powerful, cinematic warranted)
      'sunlitSea','dayStar','twinSun','worldtree','crownedSunrise','lifeburst',
      // Summons — flagship cinematics, always tier-4 windup.
      'ashCrownedStag','drownedChoir','loomMother',
      'echoFirstSong','veilCrawler','hollowKing','sapphireTide','sunderedHeart','auroraThrone','verdantColossus',
      // Endgame 3-element fusions — get the full tier-4 cinematic stack.
      'tideTriad','causticCataract',
      'frostBramble','sanctifiedPrism','venomspire','hellstorm','wildfireTempest',
      'abyssalSteam','greenfireTide','hallowedPyre','wretchedBloom','inquisitorBrand',
      'polarTempest','briarTempest','haloStorm','acidFrostBolt','drownedGlacier',
      'verdantFrost','sacredGlacier','plagueTide','witheringBriar','twilightGlacier',
      'frozenPlague','frostbloomSanctum','sterileFrost','abyssalStorm','monsoonStorm',
      'hallowedTempest','toxicSquall','witherstorm','judgementBolt','venomBoltStorm',
      'plagueTempest','sanctifyingBolt','drownedMire','sacredSpring','swampTide',
      'cleansingFlood','eclipseGrove','taintedHalo','hallowedVenom',
    ]);
    const t3 = new Set([
      // -ga endings + curaga + heavy phys finishers
      'firaga','blizzaga','thundaga','waterga','blightga','thornga','holyga','bioga','curaga',
      'snipe','hailstorm','crusher','multishot','aimedVolley',
      // 2-gem rare/strong combo fusions
      'duality','plagueGrove','eclipseLullaby','hellfire','wildfire','wildbloom',
      'toxinflood','napalm','solarFlare','deluge','monsoon','rotbloom','voidlight',
      'sterilize','frostBrand',
      // 3-gem combo fusions (the rest)
      'hellfireDecay','ashenGrove','tempestSouls','twilightTide','stormBrands',
      'steamGeyser','plagueWide','necroticBloom','pyremaster','drownedGarden',
      'eclipsePetal','pyreSky','glacialField','lullsky','twinPyre','twinGlacier',
      'cryoCurse','verdantSun','tideblight','bogCurse','acidTempest',
    ]);
    const t2 = new Set([
      // -ra/-ara endings + cure
      'fira','blizzara','thundara','watera','blighta','thornra','holyra','biora',
      'cure','renew','cleave','pierceShot','volley','sanctify',
      // 2-gem fusion combos
      'steamBurst','plasmaSurge','tempestVolt','scaldGeyser','chainCurrent',
      'killingFrost','unmaking','thornsting','benediction','acidblade','frostFire',
      'shadowFrost','briarchain','venomFrost','stormVoid','dawnTide',
      // Status-cross 2-gem combos
      'lullsoot','acidrain','hushFrost','venomBolt','searingBolt','staticFrost',
      'drowsingTide','hellbrand','frostTomb','livingPyre','glacialVine','poppysleep',
      'pyrelight','caustic','lethalTwilight','coldSteel','burningEdge','mercyStroke',
      'frozentoxin',
    ]);
    if (ult.has(skill.id)) return 4;
    if (t3.has(skill.id)) return 3;
    if (t2.has(skill.id)) return 2;
    return 1;
  }

  _elementColor(el) {
    return el === 'fire' ? '#ff8a3b'
         : el === 'ice'  ? '#7adaff'
         : el === 'thunder' ? '#ffd84d'
         : el === 'water' ? '#3bb6c8'
         : el === 'dark' ? '#a060ff'
         : el === 'nature' ? '#7aaa3a'
         : el === 'holy' ? '#ffd884'
         : el === 'poison' ? '#9aaa3b'
         : el === 'nonelemental' ? '#ffffff'
         : el === 'phys' ? '#cfd6e0'
         : '#cccccc';
  }

  // Draw an enemy's HP/ATB bars + name + status icons. `scale` shrinks the
  // bar size slightly for back-row enemies so they read as "further away".
  _drawEnemyNameplate(ctx, e, baseX, baseY, scale = 1) {
    ctx.save();
    const w = Math.round(70 * scale);
    ctx.translate(baseX, baseY + e.radius * scale + 14);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(-w / 2, 0, w, 6);
    ctx.fillStyle = e.dead ? '#444' : '#ff5a6e';
    ctx.fillRect(-w / 2, 0, w * (e.hp / e.maxHp), 6);
    if (!e.dead) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-w / 2, 8, w, 3);
      ctx.fillStyle = '#ffd84d';
      ctx.fillRect(-w / 2, 8, w * Math.min(1, e.atb || 0), 3);
    }
    const leaderLv = this.party[0]?.ref?.level || 1;
    const diff = (e.level || 1) - leaderLv;
    const lvColor = diff <= -3 ? '#8aff8a'
                  : diff <= 1  ? '#cdd6e0'
                  : diff <= 3  ? '#ffd84d'
                  :              '#ff5a6e';
    ctx.fillStyle = lvColor;
    ctx.font = `bold ${Math.round(9 * Math.max(scale, 0.85))}px system-ui`;
    ctx.textAlign = 'center';
    ctx.fillText(`Lv ${e.level || 1}`, 0, -14);
    ctx.fillStyle = e.boss ? '#ffae3b' : '#fff';
    ctx.font = (e.boss ? 'bold 11px' : '10px') + ' system-ui';
    ctx.fillText(e.name, 0, -2);
    if (e.statuses?.length) {
      let sx = -((e.statuses.length - 1) * 6);
      ctx.font = '10px system-ui';
      for (const s of e.statuses) {
        const def = STATUS_BY_ID[s.id];
        if (!def) continue;
        ctx.fillStyle = def.color;
        ctx.fillText(def.icon, sx, 22);
        sx += 12;
      }
    }
    ctx.restore();
  }

  // Returns an effective copy of `skill` with linker modifiers applied
  // (target='all' from Echoing Sigil, doublecast from Mirrored Sigil, etc.).
  // Inspects the actor's gear to find which gem granted the skill and
  // whether that socket is linked to a linker.
  // Walk the actor's gear: if the cast skill comes from a gem granted in a
  // linked socket, OR from a combo recipe on an item that also holds a linker,
  // apply that linker's modifier to the skill.
  _resolveLinkers(skillId, actor) {
    const baseSkill = SKILL_BY_ID[skillId];
    if (!baseSkill || actor.kind !== 'player' || !actor.ref) return baseSkill;
    const equipped = actor.ref.equipped || {};
    for (const slot of ['weapon', 'armor', 'accessory']) {
      const inst = equipped[slot];
      if (!inst?.gems) continue;
      // 1) Per-gem-pair link: if a single gem on this item grants skillId
      //    (cumulative across its leveled tiers) and shares a link group with
      //    one or more linkers, apply ALL of them composed together.
      for (let i = 0; i < inst.gems.length; i++) {
        const gem = inst.gems[i];
        if (!gem) continue;
        const tmpl = gem.template;
        const lv = Math.min(gem.level, tmpl.maxLevel);
        const grantsAll = new Set();
        for (let l = 1; l <= lv; l++) for (const id of (tmpl.grantsByLevel?.[l] || [])) grantsAll.add(id);
        if (!grantsAll.has(skillId)) continue;
        const linkers = findAllLinkersFor(inst, i);
        if (linkers.length) return this._composeLinkers(baseSkill, linkers.map(g => g.template.linkerEffect));
      }
      // 2) Combo-granted: if a combo on this item's gems grants skillId,
      //    any linker on the same item composes into it. ALSO apply a
      //    combo-only MP discount scaled by the average level of the combo's
      //    component gems (10% per level above 1, capped at 20% at all-Lv3).
      //    Native single-gem spells aren't combos and don't get the discount —
      //    they already scale via gem-level cumulative tier grants.
      const ids = inst.gems.filter(Boolean).map(g => g.id);
      if (ids.length >= 2) {
        const combos = matchCombos(ids);
        for (const combo of combos) {
          if (!combo.grants.includes(skillId)) continue;
          const fxs = [];
          for (const g of inst.gems) {
            if (g?.template?.linker) fxs.push(g.template.linkerEffect);
          }
          let eff = fxs.length ? this._composeLinkers(baseSkill, fxs) : { ...baseSkill };
          // Combo MP discount: 5% per average gem level above 1, cap 20% at
          // all-Lv5. Lv1=0% / Lv2=5% / Lv3=10% / Lv4=15% / Lv5=20%.
          const comboGems = combo.gems.map(gid => inst.gems.find(gi => gi?.id === gid)).filter(Boolean);
          if (comboGems.length) {
            const avgLv = comboGems.reduce((s, gi) => s + Math.min(gi.level, gi.template.maxLevel), 0) / comboGems.length;
            const discount = Math.min(0.20, Math.max(0, (avgLv - 1) * 0.05));
            if (discount > 0) eff = { ...eff, cost: Math.max(1, Math.ceil((eff.cost || 0) * (1 - discount))) };
          }
          return eff;
        }
      }
    }
    return baseSkill;
  }

  // Compose a list of linker effects onto a base skill. Multiple cast-count
  // linkers (double / quad) take the higher — they don't multiply (no 8×).
  // AoE applies once. 'counter' is passive and is filtered out here.
  _composeLinkers(baseSkill, linkerEffects) {
    const fxs = linkerEffects.filter(fx => fx !== 'counter');
    if (!fxs.length) return baseSkill;
    let aoe = false;
    let castMult = 1;
    for (const fx of fxs) {
      if (fx === 'all') aoe = true;
      else if (fx === 'double') castMult = Math.max(castMult, 2);
      else if (fx === 'quad') castMult = Math.max(castMult, 4);
    }
    const eff = { ...baseSkill };
    let costMult = 1;
    if (aoe && eff.target === 'one') {
      eff.target = 'all';
      eff.power = (eff.power || 1) * 0.7;
      costMult *= 1.5;
    }
    if (castMult === 2) {
      costMult *= 1.6;
      eff._linker = eff._linker ? eff._linker + '+double' : 'double';
    } else if (castMult === 4) {
      costMult *= 2.8;
      eff._linker = eff._linker ? eff._linker + '+quad' : 'quad';
    }
    if (aoe) eff._linker = (eff._linker ? eff._linker + '+all' : 'all');
    eff.cost = Math.ceil((eff.cost || 0) * costMult);
    return eff;
  }

  _playSpellHit(skill, target) {
    if (!target) return;
    const x = target._screenX || 0, y = target._screenY || 0;
    const scale = this._spellScale(skill);
    const tier = this._spellTier(skill);
    const color = this._elementColor(skill?.element);
    switch (skill?.element) {
      case 'fire':    this.fx.fireBloom(x, y, scale); break;
      case 'ice':     this.fx.iceShards(x, y, scale); break;
      case 'thunder': this.fx.lightningBolt(x, y, -20, { branches: tier >= 2 ? 2 + tier : 1 }); break;
      case 'water':   this.fx.waterColumn(x, y, scale); break;
      case 'dark':    this.fx.darkRift(x, y, scale); break;
      case 'nature':  this.fx.natureBurst(x, y, scale); break;
      case 'holy':    this.fx.holyPillar(x, y, scale); break;
      case 'poison':  this.fx.poisonCloud(x, y, scale); break;
      case 'nonelemental': this.fx.ultimaBurst(x, y, scale); break;
      case 'phys':    this.fx.slashHit(x, y); break;
      default:        this.fx.hitSpark(x, y);
    }
    // Tier 2+: an extra shockwave so impacts feel weighted.
    if (tier >= 2) this.fx.shockwave(x, y, color, 70 * scale, 0.4);
    // Tier 3: a second wider shockwave and screen-rim flash.
    if (tier >= 3) {
      this.fx.shockwave(x, y, '#ffffff', 130 * scale, 0.55);
      this.fx.screenFlash(color, 0.18, 0.18);
    }
    // Tier 4 (ultimate): heavy screen flash + camera-shake-tier extra ring.
    if (tier >= 4) {
      this.fx.shockwave(x, y, color, 220 * scale, 0.9);
      this.fx.screenFlash('#ffffff', 0.55, 0.3);
    }
    // Bespoke combo signature — layered on top so each combo reads as
    // visually unique even though it shares the standard tier stack.
    this._playComboSignature(skill, x, y, scale);
  }

  // Combo signature dispatcher. Each fusion spell has its own bespoke
  // particle / shape / audio layer fired at impact in addition to the
  // standard tier visuals. These are the "harder to get, more incredible"
  // flourishes the player earns for assembling rare gem combinations.
  // Cataclysm signature for endgame 3-element fusions — driven by the
  // per-spell config in TRIO_SIGNATURES. Layers 3 element FX + a triple-color
  // shockwave palette + Prisma-Burst-class star/blackStar/flash + 4 audio
  // stings. Each spell stays visually distinct via its palette + audio mix.
  _playTrioSignature(x, y, scale, cfg) {
    for (const el of (cfg.elements || [])) {
      switch (el) {
        case 'fire':    this.fx.infernoVortex(x, y, '#ffae3b', scale * 0.85); break;
        case 'ice':     this.fx.shatterRain(x, y, '#cfeaff', scale * 0.95); break;
        case 'thunder': this.fx.lightningBolt(x, y, -20, { branches: 4 }); break;
        case 'water':   this.fx.waterColumn(x, y, scale * 1.15); break;
        case 'dark':    this.fx.darkRift(x, y, scale * 0.95); break;
        case 'nature':  this.fx.natureBurst(x, y, scale * 1.0); break;
        case 'holy':    this.fx.holyPillar(x, y, scale * 1.0); break;
        case 'poison':  this.fx.poisonCloud(x, y, scale * 1.0); break;
      }
    }
    const [c1, c2, c3] = cfg.colors || ['#ffffff','#cdd6e0','#7adaff'];
    this.fx.shockwave(x, y, c1, 160 * scale, 0.9);
    this.fx.shockwave(x, y, c2, 110 * scale, 0.7);
    this.fx.shockwave(x, y, c3, 70 * scale, 0.5);
    this.fx.starBurst(x, y, cfg.starColor || '#ffffff', scale * 1.3);
    this.fx.blackStar(x, y, scale * 0.55);
    this.fx.screenFlash(cfg.flash || '#cfeaff', 0.38, 0.3);
    this.battleShake = Math.max(this.battleShake, 16);
    for (const a of (cfg.audio || [])) audio.play(a);
  }

  // ---- SUMMON SYSTEM ------------------------------------------------------

  // Map known summon spell ids to the cinematic dispatcher.
  _resolveSummonTemplate(skill) {
    const id = skill?.id;
    if (id === 'ashCrownedStag') return { id, cinematic: '_summonStag' };
    if (id === 'drownedChoir')   return { id, cinematic: '_summonChoir' };
    if (id === 'loomMother')     return { id, cinematic: '_summonLoom' };
    if (id === 'echoFirstSong')  return { id, cinematic: '_summonEcho' };
    if (id === 'veilCrawler')    return { id, cinematic: '_summonVeil' };
    if (id === 'hollowKing')     return { id, cinematic: '_summonHollowKing' };
    if (id === 'sapphireTide')   return { id, cinematic: '_summonSapphireTide' };
    if (id === 'sunderedHeart')  return { id, cinematic: '_summonSunderedHeart' };
    if (id === 'auroraThrone')   return { id, cinematic: '_summonAuroraThrone' };
    if (id === 'verdantColossus') return { id, cinematic: '_summonVerdantColossus' };
    return null;
  }

  // Plays a staged, skippable summon cutscene. Damage is applied at
  // `impactAt` (or immediately on tap-to-skip). The cutscene's stage list
  // is bespoke per summon — `_summonStag` etc. supply it.
  _playSummonCutscene(skill, summonTmpl, dmgBase, targets) {
    this[summonTmpl.cinematic](skill, dmgBase, targets);
  }

  // Generic stage scheduler with skip-on-tap. Each stage's `fn` fires at
  // `at` ms unless the player taps to skip. On skip: stage timers cancel,
  // any in-flight impact-strike timers (scheduled by applyDamage via
  // `_scheduleStrike`) cancel, applyDamage is called WITH `skip=true` so
  // each summon can snap its remaining damage synchronously, `onComplete`
  // fires ~900ms later. Without a tap, applyDamage(false) fires at
  // `impactAt` and onComplete at `totalMs`.
  _runSummonCutscene(cfg, applyDamage, onComplete) {
    const timers = [];
    // Strike timers — populated by `_scheduleStrike` during applyDamage.
    // Tracked separately so they can be cancelled on skip without touching
    // the cutscene's stage timers.
    this._summonImpactTimers = [];
    let skipped = false, damaged = false, done = false;
    const skipHint = this._showSkipHint();
    const battleUI = document.getElementById('battleUI');
    battleUI?.classList.add('summonCutscene');
    const doDamage = (isSkip = false) => {
      if (damaged) return;
      damaged = true;
      applyDamage(isSkip);
    };
    const finish = () => {
      if (done) return;
      done = true;
      for (const t of timers) clearTimeout(t);
      for (const t of (this._summonImpactTimers || [])) clearTimeout(t);
      this._summonImpactTimers = [];
      document.removeEventListener('pointerdown', skip, true);
      battleUI?.classList.remove('summonCutscene');
      if (skipHint?.remove) skipHint.remove();
      onComplete();
    };
    const skip = (e) => {
      if (skipped) return;
      e?.preventDefault?.();
      e?.stopPropagation?.();
      skipped = true;
      // Cancel cutscene stage timers
      for (const t of timers) clearTimeout(t);
      // Cancel any strike timers ALREADY scheduled by applyDamage. This is
      // the critical fix — without it, 15-30 seconds of audio + damage
      // continue firing after the player taps through, even into the
      // overworld scene swap.
      for (const t of (this._summonImpactTimers || [])) clearTimeout(t);
      this._summonImpactTimers = [];
      this.fx.clearSceneTints();
      // Run applyDamage in skip mode — each summon's callback snaps all
      // remaining hits synchronously when isSkip is true.
      doDamage(true);
      // Any strike timers re-scheduled inside the skip-mode applyDamage
      // are dropped immediately (skip mode shouldn't schedule any anyway).
      for (const t of (this._summonImpactTimers || [])) clearTimeout(t);
      this._summonImpactTimers = [];
      timers.push(setTimeout(finish, 900));
    };
    document.addEventListener('pointerdown', skip, true);
    for (const { at, fn } of (cfg.stages || [])) {
      timers.push(setTimeout(() => { if (!skipped && !done) fn(); }, at));
    }
    timers.push(setTimeout(() => { if (!skipped && !done) doDamage(false); }, cfg.impactAt));
    timers.push(setTimeout(() => { if (!skipped && !done) finish(); }, cfg.totalMs));
  }

  // Schedule a strike inside a summon impact callback. Tracked in
  // `_summonImpactTimers` so the cutscene runner can cancel them on skip
  // (preventing orphaned audio + damage in the overworld). Returns the
  // timer ID; usually you don't need it.
  _scheduleStrike(ms, fn) {
    const id = setTimeout(fn, ms);
    (this._summonImpactTimers ||= []).push(id);
    return id;
  }

  // Default "snap all damage" used by simple multi-hit summon impact
  // callbacks. Applies `skill.hits || 1` damage applications per target
  // synchronously, plus a single per-target impact-FX flourish.
  _snapSummonDamage(skill, dmgBase, targets, impactFn) {
    const hits = skill.hits || 1;
    for (const t of targets) {
      if (impactFn) impactFn(t._screenX, t._screenY);
      for (let i = 0; i < hits; i++) {
        this._applyDamage(this.actor, t, dmgBase * (skill.power || 1), skill.element, skill);
      }
    }
  }

  // Bottom-of-screen "Tap to skip" pill, pulses gently. Auto-removed on
  // cutscene end (or on tap). Returns the element so the orchestrator
  // can remove it.
  _showSkipHint() {
    const el = document.createElement('div');
    el.className = 'summonSkipHint';
    el.textContent = '⏵ Tap to skip';
    el.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.6);color:#fff;padding:8px 18px;border-radius:8px;font-size:12px;pointer-events:none;z-index:1000;font-weight:600;letter-spacing:1px;border:1px solid rgba(255,255,255,0.2);box-shadow:0 0 10px rgba(0,0,0,0.6);animation:summonHintPulse 1.6s ease-in-out infinite;';
    document.body.appendChild(el);
    return el;
  }

  // Per-target impact: damage + bespoke explosive FX layered per summon.
  // Summons keep hitting dead enemies too — shows overkill damage popups
  // and lets the cinematic play through to the end without truncating.
  _summonHitTargets(skill, dmgBase, targets, impactFn) {
    for (const t of targets) {
      impactFn(t._screenX, t._screenY);
      this._applyDamage(this.actor, t, dmgBase * (skill.power || 1), skill.element, skill);
    }
  }

  // ---- ASH-CROWNED STAG — fire-trail charge cinematic --------------------
  _summonStag(skill, dmgBase, targets) {
    const W = this.game.viewW || 800, H = this.game.viewH || 600;
    const cx = W / 2, cy = H / 2;
    const scale = 1.8;
    this._runSummonCutscene({
      impactAt: 8800,
      totalMs: 11200,
      stages: [
        // 0.0s — Sky darkens to ember-blood red; deep rumble
        { at: 0, fn: () => {
          this.fx.sceneTint('#3a0a0a', 0.82, 10.5, 0.6, 1.2);
          audio.play('rift');
          this.battleShake = Math.max(this.battleShake, 4);
        }},
        // 1.2s — Ember rain begins streaming down
        { at: 1200, fn: () => {
          for (let i = 0; i < 90; i++) {
            const ox = (Math.random() - 0.5) * W * 1.1;
            this.fx.spawn({
              x: cx + ox, y: cy - H * 0.55 - Math.random() * 80,
              vx: -ox * 0.3, vy: 180 + Math.random() * 160,
              gravity: 30, drag: 0.08,
              size: 2 + Math.random() * 2.5,
              color: ['#ffd84d','#ff8a3b','#ff5a20'][Math.floor(Math.random()*3)],
              life: 3.0, shrink: false, glow: 12,
            });
          }
          audio.play('ember');
        }},
        // 2.2s — Massive antler-rune ground sigil draws
        { at: 2200, fn: () => {
          this.fx.groundSigil(cx, cy + 80, '#ff5a3b', 'fire', 7.0, scale * 3.0);
          // Concentric pre-shockwaves
          this.fx.shockwave(cx, cy + 80, '#ff8a3b', 240 * scale, 1.2);
          audio.play('bossThump');
          this.battleShake = Math.max(this.battleShake, 8);
        }},
        // 3.5s — Antlered stag silhouette rises into view, holds large
        { at: 3500, fn: () => this._drawStagSilhouette(cx, cy, scale * 3.2, 5.0),},
        // 4.5s — Heavy hoofbeats audio + extra shake
        { at: 4500, fn: () => {
          audio.play('bossThump');
          this.battleShake = Math.max(this.battleShake, 14);
        }},
        // 5.8s — Crowned head ignites; antlers burst into greater flame
        { at: 5800, fn: () => {
          this.fx.casterAura(cx, cy - 60 * scale, '#ff5a3b', 2.5, scale * 2.8);
          for (let i = 0; i < 60; i++) {
            const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
            const sp = 80 + Math.random() * 140;
            this.fx.spawn({
              x: cx + (Math.random() - 0.5) * 120, y: cy - 100 * scale,
              vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
              gravity: -20, drag: 0.3,
              size: 3 + Math.random() * 2,
              color: i % 2 === 0 ? '#ffd84d' : '#ff8a3b',
              life: 1.6, shrink: true, glow: 14,
            });
          }
          audio.play('crit');
          audio.play('aetherWail');
        }},
        // 7.0s — Stag rears, ground cracks split outward
        { at: 7000, fn: () => {
          for (let i = -2; i <= 2; i++) {
            this.fx.lingerScorch(cx + i * 80 * scale, cy + 90, '#ff5a20', scale * 0.9, 2.5);
          }
          this.fx.shockwave(cx, cy + 80, '#ffae3b', 320 * scale, 1.3);
          audio.play('bossThump');
          audio.play('rift');
          this.battleShake = Math.max(this.battleShake, 18);
        }},
        // 8.0s — Charge across screen; bright trail builds
        { at: 8000, fn: () => {
          for (let i = 0; i < 24; i++) {
            this._scheduleStrike(i * 28, () => {
              const px = -120 + (i / 24) * (W + 240);
              this.fx.fireBloom(px, cy + (Math.random() - 0.5) * 80, scale * 0.7);
            });
          }
          audio.play('bossThump');
        }},
      ],
    }, (isSkip) => {
      // Impact — devastate every target (single-hit summon, damage is
      // synchronous so skip mode is the same FX flow).
      this.fx.screenFlash('#ffae3b', 0.95, 0.6);
      this.battleShake = Math.max(this.battleShake, 32);
      audio.play('doomKnell');
      audio.play('aetherWail');
      audio.play('crit');
      this._summonHitTargets(skill, dmgBase, targets, (tx, ty) => {
        this.fx.fireBloom(tx, ty, scale * 2.0);
        this.fx.infernoVortex(tx, ty, '#ffae3b', scale * 1.3);
        this.fx.shockwave(tx, ty, '#ffae3b', 240 * scale, 1.2);
        this.fx.shockwave(tx, ty, '#ff5a20', 140 * scale, 0.9);
        this.fx.starBurst(tx, ty, '#ffd84d', scale * 1.5);
        this.fx.lingerScorch(tx, ty, '#ff5a20', scale * 1.3, 2.2);
      });
    }, () => {
      this._checkEnd() || this._endActorTurn();
    });
  }

  // Long-running stag silhouette — used by the manifest stage.
  _drawStagSilhouette(cx, cy, scale, durSec) {
    this.fx.shape(durSec, (ctx, k) => {
      const fadeIn = Math.min(1, k / 0.12);
      const fadeOut = k > 0.86 ? Math.max(0, 1 - (k - 0.86) / 0.14) : 1;
      const alpha = fadeIn * fadeOut;
      const rise = -k * 30 * scale;
      const sx = scale;
      ctx.save();
      ctx.translate(cx, cy + rise + 30 * scale);
      ctx.scale(sx, sx);
      ctx.globalAlpha = alpha;
      // Slight breathing motion — vertical bob
      const bob = Math.sin(k * 8) * 1.4;
      ctx.translate(0, bob);
      // Body
      ctx.fillStyle = '#0d0405';
      ctx.beginPath();
      ctx.ellipse(0, 28, 40, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      // Neck + head
      ctx.beginPath();
      ctx.ellipse(-14, 4, 14, 20, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-24, -12, 15, 11, -0.2, 0, Math.PI * 2);
      ctx.fill();
      // Legs
      ctx.fillRect(-24, 42, 6, 30); ctx.fillRect(-10, 44, 6, 30);
      ctx.fillRect(16, 44, 6, 30);  ctx.fillRect(28, 42, 6, 30);
      // Antlers
      ctx.strokeStyle = '#0a0204';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      const drawAntler = (side) => {
        const s = side;
        ctx.beginPath();
        ctx.moveTo(-24 + s * 7, -20);
        ctx.lineTo(-24 + s * 20, -42);
        ctx.lineTo(-24 + s * 16, -62);
        ctx.moveTo(-24 + s * 20, -42);
        ctx.lineTo(-24 + s * 36, -50);
        ctx.lineTo(-24 + s * 40, -68);
        ctx.moveTo(-24 + s * 20, -42);
        ctx.lineTo(-24 + s * 32, -32);
        ctx.lineTo(-24 + s * 44, -28);
        ctx.stroke();
      };
      drawAntler(-1); drawAntler(1);
      // Fire-glow rim
      ctx.strokeStyle = `rgba(255,138,59,${0.85 * alpha})`;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#ff5a20';
      ctx.shadowBlur = 18;
      drawAntler(-1); drawAntler(1);
      // Pulsing eye
      ctx.shadowBlur = 0;
      const eyePulse = 0.7 + 0.3 * Math.sin(k * 14);
      ctx.fillStyle = `rgba(255,210,80,${alpha * eyePulse})`;
      ctx.beginPath();
      ctx.arc(-32, -12, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // ---- THE DROWNED CHOIR — chorus-of-the-lost cinematic ------------------
  _summonChoir(skill, dmgBase, targets) {
    const W = this.game.viewW || 800, H = this.game.viewH || 600;
    const cx = W / 2, cy = H / 2;
    const scale = 1.8;
    this._runSummonCutscene({
      impactAt: 10200,
      totalMs: 12500,
      stages: [
        // 0.0s — Abyssal-blue plunge; reality cools. Distant rumble of a
        // vast cathedral filling with water.
        { at: 0, fn: () => {
          this.fx.sceneTint('#02091e', 0.92, 11.8, 0.5, 1.3);
          audio.play('rift');
          this.battleShake = Math.max(this.battleShake, 5);
        }},
        // 0.7s — First reverent bell chimes through the dark
        { at: 700, fn: () => {
          audio.play('chime');
          audio.play('choirSwell');
        }},
        // 1.3s — A great tide rises — seven water columns crash up in
        // sequence across the field, then the inner ring crashes up
        { at: 1300, fn: () => {
          for (let i = -5; i <= 5; i++) {
            this._scheduleStrike(Math.abs(i) * 80, () => this.fx.waterColumn(cx + i * 55 * scale, cy + 100, scale * 1.1));
          }
          audio.play('aetherWail');
        }},
        // 2.4s — Tidal-circle ground sigil expands; bigger pre-shockwave
        { at: 2400, fn: () => {
          this.fx.groundSigil(cx, cy + 80, '#7adaff', 'water', 9.0, scale * 3.6);
          this.fx.shockwave(cx, cy + 80, '#3bb6c8', 280 * scale, 1.4);
          this.fx.shockwave(cx, cy + 80, '#cfeaff', 180 * scale, 1.0);
          audio.play('bossThump');
        }},
        // 3.4s — Eleven cloaked figures rise — bigger choir, holds 7s
        { at: 3400, fn: () => this._drawChoirRising(cx, cy, scale, 7.5),},
        // 4.4s — Each figure raises its hand; chimes ring in answer
        { at: 4400, fn: () => {
          audio.play('chime');
          audio.play('choirSwell');
          // Pale ring of light around each figure
          for (let i = -5; i <= 5; i++) {
            const fxx = cx + i * 55 * scale;
            this.fx.shockwave(fxx, cy + 20, '#cfeaff', 60 * scale, 0.55);
          }
        }},
        // 5.4s — Beams of pale light pour from each mouth, converging
        // upward into a single point above the choir
        { at: 5400, fn: () => this._drawChoirBeams(cx, cy, scale, 3.0),},
        // 5.4s — Drifting notes + glowing motes rise to meet the beam apex
        { at: 5500, fn: () => {
          this.fx.musicalNotes(cx, cy - 20 * scale, '#dff3ff', scale * 2.3);
          for (let i = 0; i < 60; i++) {
            const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
            const sp = 70 + Math.random() * 120;
            this.fx.spawn({
              x: cx + (Math.random() - 0.5) * 280, y: cy + 60,
              vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
              gravity: -14, drag: 0.4,
              size: 2.2 + Math.random() * 1.4,
              color: i % 3 === 0 ? '#dff3ff' : i % 3 === 1 ? '#7adaff' : '#cfeaff',
              life: 2.4, shrink: false, glow: 14,
            });
          }
          audio.play('choirSwell');
          audio.play('chime');
        }},
        // 6.8s — The convergence point ignites — a star forms
        { at: 6800, fn: () => {
          const apex = cy - 130 * scale;
          this.fx.casterAura(cx, apex, '#dff3ff', 2.8, scale * 3.2);
          this.fx.castCharge(cx, apex, '#cfeaff', scale * 3.0);
          this.fx.shockwave(cx, apex, '#7adaff', 150 * scale, 0.9);
          audio.play('aetherWail');
          audio.play('crit');
          this.battleShake = Math.max(this.battleShake, 12);
        }},
        // 7.8s — Voices reach a sustained peak — concentric resonance
        // rings ripple outward in a layered crescendo
        { at: 7800, fn: () => {
          const apex = cy - 130 * scale;
          for (let r = 0; r < 6; r++) {
            this._scheduleStrike(r * 110, () => {
              this.fx.shockwave(cx, apex, r % 2 ? '#dff3ff' : '#7adaff', (130 + r * 75) * scale, 1.0);
            });
          }
          audio.play('choirSwell');
          audio.play('aetherWail');
          this.battleShake = Math.max(this.battleShake, 18);
        }},
        // 8.8s — The star above becomes a sun — bright bloom
        { at: 8800, fn: () => {
          const apex = cy - 130 * scale;
          this.fx.starBurst(cx, apex, '#ffffff', scale * 2.5);
          this.fx.starBurst(cx, apex, '#cfeaff', scale * 1.8);
          this.fx.screenFlash('#dff3ff', 0.45, 0.32);
          audio.play('doomKnell');
          audio.play('aetherWail');
          this.battleShake = Math.max(this.battleShake, 22);
        }},
        // 9.6s — The chorus releases — a tsunami sweeps across the screen
        { at: 9600, fn: () => {
          for (let i = 0; i < 18; i++) {
            this._scheduleStrike(i * 28, () => {
              const px = -120 + (i / 18) * (W + 240);
              this.fx.waterColumn(px, cy + 50 + (Math.random() - 0.5) * 60, scale * 1.0);
            });
          }
          audio.play('aetherWail');
          audio.play('crit');
        }},
      ],
    }, (isSkip) => {
      // IMPACT — the chorus reaches damnation pitch; sound becomes weapon.
      // Single-hit summon, so damage applies the same in skip or full mode;
      // skip just drops the ring fanfare.
      this.fx.screenFlash('#cfeaff', 1.0, 0.7);
      this.fx.screenFlash('#ffffff', 0.55, 0.35);
      this.battleShake = Math.max(this.battleShake, 34);
      audio.play('doomKnell');
      audio.play('aetherWail');
      audio.play('choirSwell');
      audio.play('crit');
      audio.play('glassShatter');
      if (!isSkip) {
        for (let r = 0; r < 5; r++) {
          this._scheduleStrike(r * 90, () => {
            this.fx.shockwave(cx, cy, r % 2 ? '#ffffff' : '#7adaff', (180 + r * 100) * scale, 1.3);
          });
        }
      }
      this._summonHitTargets(skill, dmgBase, targets, (tx, ty) => {
        this.fx.waterColumn(tx, ty, scale * 2.0);
        this.fx.waterColumn(tx + 20, ty - 10, scale * 1.4);
        this.fx.shatterRain(tx, ty, '#cfeaff', scale * 1.6);
        this.fx.shockwave(tx, ty, '#7adaff', 260 * scale, 1.3);
        this.fx.shockwave(tx, ty, '#dff3ff', 170 * scale, 1.0);
        this.fx.shockwave(tx, ty, '#ffffff', 100 * scale, 0.7);
        this.fx.starBurst(tx, ty, '#ffffff', scale * 1.7);
        this.fx.blackStar(tx, ty, scale * 0.55);
        for (let i = 0; i < 18; i++) {
          const ang = Math.random() * Math.PI * 2;
          const sp = 80 + Math.random() * 120;
          this.fx.spawn({
            x: tx, y: ty, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 30,
            gravity: 80, drag: 0.25,
            size: 2.5, color: i % 2 ? '#dff3ff' : '#7adaff',
            life: 1.4, shrink: true, glow: 9,
          });
        }
      });
    }, () => {
      this._checkEnd() || this._endActorTurn();
    });
  }

  // Beams of pale light from each choir-figure's mouth converging at a
  // point above the formation. Used by `_summonChoir`'s convergence stage.
  _drawChoirBeams(cx, cy, scale, durSec) {
    const figures = 11;
    const apexY = cy - 130 * scale;
    this.fx.shape(durSec, (ctx, k) => {
      const intensity = Math.min(1, k * 2);
      const fade = k > 0.7 ? Math.max(0, 1 - (k - 0.7) / 0.3) : 1;
      const alpha = intensity * fade;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < figures; i++) {
        const fxx = cx + (i - (figures - 1) / 2) * 55 * scale;
        const fyy = cy - 30 * scale;
        const grd = ctx.createLinearGradient(fxx, fyy, cx, apexY);
        grd.addColorStop(0, `rgba(220,240,255,${alpha * 0.85})`);
        grd.addColorStop(0.6, `rgba(140,200,250,${alpha * 0.55})`);
        grd.addColorStop(1, 'rgba(80,160,230,0)');
        ctx.strokeStyle = grd;
        ctx.lineWidth = 2.5 + Math.sin(k * 18 + i) * 0.8;
        ctx.shadowColor = '#cfeaff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(fxx, fyy);
        // Slight curve toward the apex with subtle wobble
        const midX = (fxx + cx) / 2 + Math.sin(k * 8 + i) * 4;
        const midY = (fyy + apexY) / 2 - 20;
        ctx.quadraticCurveTo(midX, midY, cx, apexY);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  _drawChoirRising(cx, cy, scale, durSec) {
    this.fx.shape(durSec, (ctx, k) => {
      const fadeIn = Math.min(1, k / 0.1);
      const fadeOut = k > 0.88 ? Math.max(0, 1 - (k - 0.88) / 0.12) : 1;
      const alpha = fadeIn * fadeOut;
      const rise = -k * 90 * scale + 70 * scale;
      const figures = 11;
      ctx.save();
      ctx.translate(cx, cy);
      for (let i = 0; i < figures; i++) {
        const fxOffset = (i - (figures - 1) / 2) * 55 * scale;
        const depth = Math.abs(i - (figures - 1) / 2) * 0.08;
        ctx.save();
        ctx.translate(fxOffset, rise + depth * 30);
        const sx = scale * (1 - depth);
        ctx.scale(sx, sx);
        ctx.globalAlpha = alpha * (0.7 + 0.3 * (1 - depth));
        // Cloaked body
        const grd = ctx.createLinearGradient(0, -60, 0, 70);
        grd.addColorStop(0, 'rgba(180,225,255,0.0)');
        grd.addColorStop(0.3, `rgba(160,210,250,${alpha * 0.9})`);
        grd.addColorStop(0.8, `rgba(50,110,170,${alpha * 0.92})`);
        grd.addColorStop(1, 'rgba(15,40,80,0.0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.moveTo(-26, 70);
        ctx.bezierCurveTo(-36, 5, -20, -40, 0, -50);
        ctx.bezierCurveTo(20, -40, 36, 5, 26, 70);
        ctx.closePath();
        ctx.fill();
        // Head
        ctx.fillStyle = `rgba(225,240,255,${alpha * 0.75})`;
        ctx.shadowColor = '#7adaff';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(0, -36, 13, 0, Math.PI * 2);
        ctx.fill();
        // Singing mouth (open void)
        ctx.shadowBlur = 0;
        const sing = 0.8 + 0.4 * Math.sin(k * 12 + i);
        ctx.fillStyle = `rgba(15,30,55,${alpha * sing})`;
        ctx.beginPath();
        ctx.ellipse(0, -30, 3.5, 8 + sing * 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Eyes — twin pale pinpoints
        ctx.fillStyle = `rgba(190,225,255,${alpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(-4, -40, 1.4, 0, Math.PI * 2);
        ctx.arc(4, -40, 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    });
  }

  // ---- THE LOOM-MOTHER — eight-legged weaver cinematic -------------------
  _summonLoom(skill, dmgBase, targets) {
    const W = this.game.viewW || 800, H = this.game.viewH || 600;
    const cx = W / 2, cy = H / 2;
    const scale = 1.8;
    this._runSummonCutscene({
      impactAt: 11000,
      totalMs: 13200,
      stages: [
        // 0.0s — Reality dims to violet-black; deep predatory hum
        { at: 0, fn: () => {
          this.fx.sceneTint('#0f0420', 0.94, 12.5, 0.5, 1.4);
          audio.play('rift');
          audio.play('voidHum');
          this.battleShake = Math.max(this.battleShake, 4);
        }},
        // 0.8s — Silver silk threads stir across the sky in layer 1 — radial
        { at: 800, fn: () => {
          this._drawSilkWebLayer1(cx, cy - H * 0.35, scale * 2.6, 4.0);
          audio.play('voidHum');
        }},
        // 1.8s — Layer 2 — tightening spiral overlays
        { at: 1800, fn: () => {
          this._drawSilkWebLayer2(cx, cy - H * 0.35, scale * 2.6, 4.0);
        }},
        // 2.6s — Layer 3 — cross-weave fills between threads
        { at: 2600, fn: () => {
          this._drawSilkWebLayer3(cx, cy - H * 0.35, scale * 2.6, 4.0);
          audio.play('aetherWail');
          this.battleShake = Math.max(this.battleShake, 8);
        }},
        // 3.2s — Web pattern locks; massive ground sigil draws beneath
        { at: 3200, fn: () => {
          this.fx.groundSigil(cx, cy + 80, '#a060ff', 'dark', 9.5, scale * 3.6);
          this.fx.shockwave(cx, cy + 80, '#c0a0ff', 280 * scale, 1.4);
          this.fx.shockwave(cx, cy + 80, '#a060ff', 180 * scale, 1.0);
          audio.play('voidHum');
          audio.play('bossThump');
          this.battleShake = Math.max(this.battleShake, 12);
        }},
        // 4.0s — Loom-Mother descends — eight-legged silhouette from above,
        // larger and longer hold than before
        { at: 4000, fn: () => this._drawLoomDescent(cx, cy, scale * 3.6, 7.5),},
        // 5.2s — Eyes open ONE AT A TIME (eight pulses, 200ms apart)
        { at: 5200, fn: () => {
          for (let i = 0; i < 8; i++) {
            this._scheduleStrike(i * 220, () => {
              this.fx.screenFlash('#c060ff', 0.18, 0.18);
              audio.play('chime');
            });
          }
        }},
        // 7.2s — Predatory thrum — webbing motes erupt from the center
        { at: 7200, fn: () => {
          this.fx.casterAura(cx, cy - 60 * scale, '#a060ff', 3.0, scale * 3.5);
          for (let i = 0; i < 80; i++) {
            const ang = Math.random() * Math.PI * 2;
            const sp = 60 + Math.random() * 140;
            this.fx.spawn({
              x: cx, y: cy - 80 * scale,
              vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
              gravity: 8, drag: 0.35,
              size: 2.2 + Math.random() * 1.4,
              color: i % 3 === 0 ? '#e8d8ff' : i % 3 === 1 ? '#c0a0ff' : '#a060ff',
              life: 2.2, shrink: true, glow: 12,
            });
          }
          audio.play('aetherWail');
          audio.play('voidHum');
          this.battleShake = Math.max(this.battleShake, 16);
        }},
        // 8.2s — First wave of silk strands lashes out — two per target
        { at: 8200, fn: () => {
          for (const t of targets) {
            if (t.dead) continue;
            this._lashSilkStrand(cx, cy - 80 * scale, t._screenX, t._screenY, 1.6);
            this._scheduleStrike(140, () => this._lashSilkStrand(cx, cy - 80 * scale, t._screenX - 18, t._screenY + 10, 1.4));
          }
          audio.play('glassShatter');
        }},
        // 9.0s — Second lash wave + dark rifts open beneath each target
        { at: 9000, fn: () => {
          for (const t of targets) {
            if (t.dead) continue;
            this._lashSilkStrand(cx, cy - 80 * scale, t._screenX + 18, t._screenY - 10, 1.5);
            this.fx.darkRift(t._screenX, t._screenY, scale * 0.7);
          }
          audio.play('voidHum');
          this.battleShake = Math.max(this.battleShake, 20);
        }},
        // 9.8s — Reality tears — screen shudders, distortion ripples
        { at: 9800, fn: () => {
          this._drawRealityTear(cx, cy, scale, 1.6);
          audio.play('aetherWail');
          audio.play('doomKnell');
          this.battleShake = Math.max(this.battleShake, 26);
        }},
        // 10.3s — The Mother rears for the binding — everything converges
        // to the center then will explode outward at impact
        { at: 10300, fn: () => {
          for (let r = 0; r < 5; r++) {
            this._scheduleStrike(r * 70, () => {
              this.fx.shockwave(cx, cy - 30 * scale, '#c0a0ff', (220 - r * 35) * scale, 0.45);
            });
          }
          this.fx.castCharge(cx, cy - 30 * scale, '#a060ff', scale * 3.0);
          audio.play('voidHum');
        }},
      ],
    }, (isSkip) => {
      // IMPACT — the web contracts violently then detonates outward
      this.fx.screenFlash('#c0a0ff', 1.0, 0.7);
      this.fx.screenFlash('#ffffff', 0.5, 0.3);
      this.battleShake = Math.max(this.battleShake, 38);
      audio.play('doomKnell');
      audio.play('aetherWail');
      audio.play('voidHum');
      audio.play('glassShatter');
      audio.play('crit');
      this.fx.blackStar(cx, cy - 30 * scale, scale * 1.2);
      this.fx.starBurst(cx, cy - 30 * scale, '#c0a0ff', scale * 2.2);
      if (!isSkip) {
        for (let r = 0; r < 6; r++) {
          this._scheduleStrike(r * 90, () => {
            this.fx.shockwave(cx, cy - 30 * scale, r % 2 ? '#e8d8ff' : '#a060ff', (200 + r * 110) * scale, 1.3);
          });
        }
      }
      this._summonHitTargets(skill, dmgBase, targets, (tx, ty) => {
        this.fx.darkRift(tx, ty, scale * 2.0);
        this.fx.darkRift(tx + 14, ty - 8, scale * 1.2);
        this.fx.blackStar(tx, ty, scale * 1.1);
        this.fx.starBurst(tx, ty, '#c0a0ff', scale * 1.7);
        this.fx.starBurst(tx, ty, '#ffffff', scale * 1.0);
        this.fx.shockwave(tx, ty, '#a060ff', 280 * scale, 1.3);
        this.fx.shockwave(tx, ty, '#e8d8ff', 180 * scale, 1.0);
        this.fx.shockwave(tx, ty, '#ffffff', 110 * scale, 0.75);
        // Heavy silk-bind particle storm on each target
        for (let i = 0; i < 28; i++) {
          const ang = Math.random() * Math.PI * 2;
          const sp = 70 + Math.random() * 140;
          this.fx.spawn({
            x: tx, y: ty,
            vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 40,
            gravity: 60, drag: 0.3,
            size: 2 + Math.random() * 1.5,
            color: i % 3 === 0 ? '#e8d8ff' : i % 3 === 1 ? '#c0a0ff' : '#ffffff',
            life: 1.6, shrink: true, glow: 10,
          });
        }
      });
    }, () => {
      this._checkEnd() || this._endActorTurn();
    });
  }

  // Silk web layer 1 — radial threads from center outward.
  _drawSilkWebLayer1(cx, cy, scale, durSec) {
    this.fx.shape(durSec, (ctx, k) => {
      const fadeIn = Math.min(1, k / 0.25);
      const fadeOut = k > 0.75 ? Math.max(0, 1 - (k - 0.75) / 0.25) : 1;
      const alpha = fadeIn * fadeOut * 0.8;
      const reach = (60 + k * 200) * scale;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#e8d8ff';
      ctx.lineWidth = 1.4;
      ctx.shadowColor = '#c0a0ff';
      ctx.shadowBlur = 8;
      const threads = 20;
      for (let i = 0; i < threads; i++) {
        const a = (i / threads) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * reach, Math.sin(a) * reach * 0.75);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  // Silk web layer 2 — tightening spiral.
  _drawSilkWebLayer2(cx, cy, scale, durSec) {
    this.fx.shape(durSec, (ctx, k) => {
      const fadeIn = Math.min(1, k / 0.2);
      const fadeOut = k > 0.78 ? Math.max(0, 1 - (k - 0.78) / 0.22) : 1;
      const alpha = fadeIn * fadeOut * 0.7;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#e8d8ff';
      ctx.lineWidth = 1.2;
      ctx.shadowColor = '#c0a0ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const t = i / 120;
        const a = t * Math.PI * 8 + k * Math.PI * 0.6;
        const r = (10 + t * 200 * scale * 0.85);
        const px = Math.cos(a) * r, py = Math.sin(a) * r * 0.75;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
    });
  }

  // Silk web layer 3 — connecting cross-threads between adjacent radials.
  _drawSilkWebLayer3(cx, cy, scale, durSec) {
    this.fx.shape(durSec, (ctx, k) => {
      const fadeIn = Math.min(1, k / 0.2);
      const fadeOut = k > 0.78 ? Math.max(0, 1 - (k - 0.78) / 0.22) : 1;
      const alpha = fadeIn * fadeOut * 0.65;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#cfb8ff';
      ctx.lineWidth = 0.9;
      ctx.shadowColor = '#a060ff';
      ctx.shadowBlur = 6;
      const threads = 20;
      const rings = 6;
      for (let r = 1; r <= rings; r++) {
        const reach = (r / rings) * 200 * scale;
        ctx.beginPath();
        for (let i = 0; i <= threads; i++) {
          const a = (i / threads) * Math.PI * 2;
          const px = Math.cos(a) * reach;
          const py = Math.sin(a) * reach * 0.75;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  // Reality-tear effect — distorted slashes across the screen suggesting
  // the world itself is being unwoven. Used by Loom impact buildup.
  _drawRealityTear(cx, cy, scale, durSec) {
    const W = this.game.viewW || 800, H = this.game.viewH || 600;
    const tears = [];
    for (let i = 0; i < 7; i++) {
      tears.push({
        x: Math.random() * W,
        y: Math.random() * H,
        ang: Math.random() * Math.PI * 2,
        len: 80 + Math.random() * 200,
        delay: Math.random() * 0.4,
      });
    }
    this.fx.shape(durSec, (ctx, k) => {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const t of tears) {
        const localK = (k - t.delay) / (1 - t.delay);
        if (localK < 0 || localK > 1) continue;
        const fade = localK < 0.3 ? localK / 0.3 : localK > 0.7 ? Math.max(0, 1 - (localK - 0.7) / 0.3) : 1;
        const c = Math.cos(t.ang), s = Math.sin(t.ang);
        const grow = 0.4 + localK * 0.6;
        // Bright slash with violet core
        ctx.strokeStyle = `rgba(232,216,255,${fade * 0.95})`;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#c0a0ff';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(t.x - c * t.len * grow / 2, t.y - s * t.len * grow / 2);
        ctx.lineTo(t.x + c * t.len * grow / 2, t.y + s * t.len * grow / 2);
        ctx.stroke();
        // Dark core
        ctx.strokeStyle = `rgba(40,10,70,${fade * 0.85})`;
        ctx.lineWidth = 1.2;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(t.x - c * t.len * grow / 2, t.y - s * t.len * grow / 2);
        ctx.lineTo(t.x + c * t.len * grow / 2, t.y + s * t.len * grow / 2);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  _drawLoomDescent(cx, cy, scale, durSec) {
    this.fx.shape(durSec, (ctx, k) => {
      const fadeIn = Math.min(1, k / 0.12);
      const fadeOut = k > 0.88 ? Math.max(0, 1 - (k - 0.88) / 0.12) : 1;
      const alpha = fadeIn * fadeOut;
      const drop = -200 * scale + k * 150 * scale;
      ctx.save();
      ctx.translate(cx, cy + drop);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      // Abdomen
      ctx.fillStyle = '#080318';
      ctx.beginPath();
      ctx.ellipse(0, 22, 32, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      // Cephalothorax
      ctx.beginPath();
      ctx.ellipse(0, -8, 22, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      // Legs
      ctx.strokeStyle = '#1a0830';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      const wave = Math.sin(k * 12);
      const legs = [
        { ang: -1.45, len: 48, bend: 0.7 + wave * 0.1 },
        { ang: -0.95, len: 56, bend: 0.55 + wave * 0.1 },
        { ang: -0.55, len: 58, bend: 0.55 + wave * 0.1 },
        { ang: -0.22, len: 50, bend: 0.45 + wave * 0.1 },
        { ang:  0.22, len: 50, bend: 0.45 - wave * 0.1 },
        { ang:  0.55, len: 58, bend: 0.55 - wave * 0.1 },
        { ang:  0.95, len: 56, bend: 0.55 - wave * 0.1 },
        { ang:  1.45, len: 48, bend: 0.7 - wave * 0.1 },
      ];
      for (const l of legs) {
        const mx = Math.cos(l.ang) * l.len * 0.55;
        const my = Math.sin(l.ang) * l.len * 0.55 - 10;
        const ex = Math.cos(l.ang) * l.len + Math.cos(l.ang + l.bend) * l.len * 0.55;
        const ey = Math.sin(l.ang) * l.len + 14 + Math.abs(Math.sin(l.ang)) * 12;
        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.quadraticCurveTo(mx, my, ex, ey);
        ctx.stroke();
      }
      // Eight glowing violet eyes — pulse
      const eyePulse = 0.7 + 0.3 * Math.sin(k * 16);
      ctx.shadowColor = '#c060ff';
      ctx.shadowBlur = 12;
      ctx.fillStyle = `rgba(200,130,255,${alpha * eyePulse})`;
      const eyes = [[-10,-14],[-4,-16],[4,-16],[10,-14],[-7,-9],[-2,-11],[2,-11],[7,-9]];
      for (const [ex, ey] of eyes) {
        ctx.beginPath();
        ctx.arc(ex, ey, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  _lashSilkStrand(fromX, fromY, toX, toY, durSec) {
    this.fx.shape(durSec, (ctx, k) => {
      const reach = k;
      const alpha = k < 0.5 ? k * 2 : 1 - (k - 0.5) * 1.4;
      const tx = fromX + (toX - fromX) * reach;
      const ty = fromY + (toY - fromY) * reach;
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha) * 0.9;
      ctx.strokeStyle = '#e8d8ff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#c0a0ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      // Slight curve via control point pulled sideways
      const cx = (fromX + tx) / 2 + (Math.random() - 0.5) * 40;
      const cy = (fromY + ty) / 2 - 40;
      ctx.quadraticCurveTo(cx, cy, tx, ty);
      ctx.stroke();
      ctx.restore();
    });
  }

  // ===== ECHO OF THE FIRST SONG — 7-note chord that damages + heals =======
  _summonEcho(skill, dmgBase, targets) {
    const W = this.game.viewW || 800, H = this.game.viewH || 600;
    const cx = W / 2, cy = H / 2;
    const scale = 1.8;
    const HITS = 7;
    const apexY = cy - 90 * scale;
    this._runSummonCutscene({
      impactAt: 10500,
      totalMs: 13500,
      stages: [
        // 0.0s — Sceneline fades to pale gold-white; first bell
        { at: 0, fn: () => {
          this.fx.sceneTint('#f8e89a', 0.62, 12.8, 0.5, 1.5);
          audio.play('chime');
        }},
        // 0.6s — Distant chord rises beneath
        { at: 600, fn: () => audio.play('choirSwell') },
        // 1.2s — Musical staff lines arc across the entire screen
        { at: 1200, fn: () => this._drawMusicStaff(cx, cy, scale, 6.0)},
        // 2.0s — Golden ground sigil with chord-rune
        { at: 2000, fn: () => {
          this.fx.groundSigil(cx, cy + 80, '#ffd884', 'holy', 8.0, scale * 3.2);
          this.fx.shockwave(cx, cy + 80, '#fff5d8', 220 * scale, 1.0);
          audio.play('chime');
        }},
        // 2.8s — A single perfect tone-sphere forms at apex
        { at: 2800, fn: () => this._drawPerfectTone(cx, apexY, scale, 7.0)},
        // 4.0s — Seven golden notes spawn in orbit around the sphere
        { at: 4000, fn: () => this._drawSevenNotes(cx, apexY, scale, 5.0)},
        // 4.0s — Note-chime audio cascade
        { at: 4000, fn: () => {
          for (let i = 0; i < 7; i++) this._scheduleStrike(i * 90, () => audio.play('chime'));
        }},
        // 5.8s — Chord crescendo — sphere brightens, notes pulse
        { at: 5800, fn: () => {
          this.fx.casterAura(cx, apexY, '#ffd884', 2.4, scale * 3.0);
          this.fx.shockwave(cx, apexY, '#fff5d8', 160 * scale, 0.95);
          audio.play('choirSwell');
          audio.play('aetherWail');
          this.battleShake = Math.max(this.battleShake, 12);
        }},
        // 7.0s — Sphere bursts into prismatic light — gold-rainbow refraction
        { at: 7000, fn: () => {
          this.fx.starBurst(cx, apexY, '#ffffff', scale * 2.2);
          this.fx.starBurst(cx, apexY, '#ffd884', scale * 1.6);
          for (let i = 0; i < 80; i++) {
            const ang = Math.random() * Math.PI * 2;
            const sp = 80 + Math.random() * 160;
            const colors = ['#ffd884','#ff8acf','#a8d8ff','#a0ffd8','#ffae3b','#cf9aff','#ffffff'];
            this.fx.spawn({
              x: cx, y: apexY,
              vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
              gravity: -10, drag: 0.35,
              size: 2.5, color: colors[Math.floor(Math.random()*colors.length)],
              life: 2.5, shrink: false, glow: 14,
            });
          }
          audio.play('chime');
          audio.play('choirSwell');
          this.battleShake = Math.max(this.battleShake, 16);
        }},
        // 8.4s — Notes drift outward toward each target — predictive trails
        { at: 8400, fn: () => {
          for (const t of targets) {
            if (t.dead) continue;
            for (let n = 0; n < HITS; n++) {
              this._scheduleStrike(n * 60, () => {
                this.fx.castProjectile(cx, apexY, t._screenX, t._screenY, '#ffd884', 0.35);
              });
            }
          }
          audio.play('aetherWail');
        }},
        // 9.6s — Party-heal sigil draws on each ally
        { at: 9600, fn: () => {
          for (const m of this.party) {
            if (m.dead) continue;
            this.fx.magicCircle(m._screenX, m._screenY, '#fff5d8', 0.7, scale * 1.2);
            this.fx.shockwave(m._screenX, m._screenY, '#ffd884', 70, 0.6);
          }
          audio.play('chime');
          audio.play('heal');
        }},
      ],
    }, (isSkip) => {
      // SKIP — snap 7 hits per enemy + party restoration
      if (isSkip) {
        this._snapSummonDamage(skill, dmgBase, targets, (tx, ty) => {
          this.fx.holyPillar(tx, ty, scale);
          this.fx.shockwave(tx, ty, '#ffd884', 140 * scale, 0.8);
          this.fx.starBurst(tx, ty, '#fff5d8', scale * 1.2);
        });
        this.fx.screenFlash('#fff5d8', 0.8, 0.5);
        this.battleShake = Math.max(this.battleShake, 22);
        const healAmount0 = Math.max(20, Math.floor(dmgBase * 0.7));
        for (const m of this.party) {
          this._restoreAlly(m, { hpPct: 1.0, healAmount: healAmount0, color: '#ffd884', bgColor: '#fff5d8', label: 'is restored by the First Song' });
        }
        audio.play('doomKnell');
        audio.play('choirSwell');
        audio.play('aetherWail');
        return;
      }
      // IMPACT — 7-note chord lands on each enemy; healing motes shower allies
      this.fx.screenFlash('#fff5d8', 0.85, 0.6);
      this.battleShake = Math.max(this.battleShake, 26);
      audio.play('doomKnell');
      audio.play('choirSwell');
      audio.play('aetherWail');
      // Damage — 7 staggered hits per enemy. Plays through even on dead
      // enemies so overkill damage is shown and the cinematic isn't truncated.
      for (const t of targets) {
        for (let i = 0; i < HITS; i++) {
          this._scheduleStrike(i * 110, () => {
            const offset = 26 + Math.sin(i * 0.9) * 18;
            this.fx.holyPillar(t._screenX + (Math.random() - 0.5) * offset, t._screenY, scale * 0.65);
            this.fx.shockwave(t._screenX, t._screenY, '#ffd884', 80 * scale, 0.45);
            this.fx.spawn({
              x: t._screenX, y: t._screenY - 20, vx: 0, vy: 0,
              gravity: -8, drag: 0.4, size: 3.5, color: '#ffd884',
              life: 0.8, shrink: true, glow: 14,
            });
            this._applyDamage(this.actor, t, dmgBase * skill.power, skill.element, skill);
            if (i === 0) audio.play('chime');
            if (i === HITS - 1) audio.play('aetherWail');
          });
        }
      }
      // Restore the party — the world remembered whole. Allies are healed,
      // dead allies are FULLY revived, and every negative status is cleansed
      // because the unbroken song doesn't know affliction.
      const healAmount = Math.max(20, Math.floor(dmgBase * 0.7));
      for (const m of this.party) {
        this._restoreAlly(m, { hpPct: 1.0, healAmount, color: '#ffd884', bgColor: '#fff5d8', label: 'is restored by the First Song' });
      }
    }, () => {
      this._checkEnd() || this._endActorTurn();
    });
  }

  // Shared revive/heal/cleanse helper used by Echo of the First Song and
  // Sapphire Tide. For dead allies, hpPct decides revive amount (1.0 = full,
  // 0.5 = half). For alive allies, healAmount is added to HP. Negative
  // statuses are always cleared. Visuals tint by `color`/`bgColor`.
  _restoreAlly(m, opts) {
    const { hpPct = 1.0, healAmount = 30, color = '#a8ffc8', bgColor = '#ffffff', label = 'is restored' } = opts;
    if (m.dead) {
      m.dead = false;
      m.hp = Math.max(1, Math.floor(m.maxHp * hpPct));
      m.hitFlash = 0.45;
      this._addLog(`${m.name} ${label}!`);
      // Big revive flourish
      this.fx.shockwave(m._screenX, m._screenY, color, 220, 1.0);
      this.fx.shockwave(m._screenX, m._screenY, bgColor, 130, 0.7);
      this.fx.starBurst(m._screenX, m._screenY, bgColor, 1.6);
      this.popups.push({ text: '+' + m.hp, x: m._screenX, y: (m._screenY || 0) - 24, life: 1.1, max: 1.1, color });
      audio.play('victory');
      audio.play('heal');
    } else {
      this._healMember(m, healAmount);
    }
    // Cleanse — strip negative statuses regardless of alive/revive state
    if (m.statuses?.length) {
      const before = m.statuses.length;
      m.statuses = m.statuses.filter(s => !STATUS_BY_ID[s.id]?.negative);
      if (m.statuses.length < before) {
        this.popups.push({ text: 'cleansed', x: m._screenX, y: (m._screenY || 0) - 38, life: 0.9, max: 0.9, color: bgColor });
      }
    }
    // Healing motes always — even on full-HP allies the visual reads
    this.fx.shockwave(m._screenX, m._screenY, color, 60, 0.5);
    for (let i = 0; i < 20; i++) {
      const ang = Math.random() * Math.PI * 2;
      this.fx.spawn({
        x: m._screenX + Math.cos(ang) * 15, y: m._screenY,
        vx: Math.cos(ang) * 20, vy: -40 - Math.random() * 30,
        gravity: -8, drag: 0.35, size: 2,
        color: i % 2 ? bgColor : color,
        life: 1.4, shrink: false, glow: 10,
      });
    }
  }

  _drawMusicStaff(cx, cy, scale, durSec) {
    const W = this.game.viewW || 800;
    this.fx.shape(durSec, (ctx, k) => {
      const fadeIn = Math.min(1, k / 0.15);
      const fadeOut = k > 0.82 ? Math.max(0, 1 - (k - 0.82) / 0.18) : 1;
      const alpha = fadeIn * fadeOut * 0.75;
      const reach = 0.4 + k * 0.6;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#ffd884';
      ctx.lineWidth = 1.6;
      ctx.shadowColor = '#fff5d8';
      ctx.shadowBlur = 6;
      // 5 staff lines — curve gently like ribbons across the upper region
      for (let line = 0; line < 5; line++) {
        const baseY = cy - 120 * scale + line * 18;
        ctx.beginPath();
        const startX = cx - (W / 2) * reach;
        const endX   = cx + (W / 2) * reach;
        ctx.moveTo(startX, baseY);
        for (let x = startX; x <= endX; x += 12) {
          const yWave = Math.sin((x - cx) * 0.012 + k * 4) * 4;
          ctx.lineTo(x, baseY + yWave);
        }
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  _drawPerfectTone(cx, cy, scale, durSec) {
    this.fx.shape(durSec, (ctx, k) => {
      const grow = Math.min(1, k * 2.5);
      const fade = k > 0.85 ? Math.max(0, 1 - (k - 0.85) / 0.15) : 1;
      const alpha = grow * fade;
      const r = (20 + Math.sin(k * 12) * 3) * scale * grow;
      ctx.save();
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2);
      grd.addColorStop(0, `rgba(255,255,255,${alpha * 0.95})`);
      grd.addColorStop(0.4, `rgba(255,234,160,${alpha * 0.75})`);
      grd.addColorStop(1, 'rgba(255,200,80,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 2.2, 0, Math.PI * 2);
      ctx.fill();
      // Solid core
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  _drawSevenNotes(cx, cy, scale, durSec) {
    this.fx.shape(durSec, (ctx, k) => {
      const fadeOut = k > 0.85 ? Math.max(0, 1 - (k - 0.85) / 0.15) : 1;
      const alpha = Math.min(1, k * 3) * fadeOut;
      ctx.save();
      ctx.translate(cx, cy);
      const orbit = (45 + Math.sin(k * 3) * 6) * scale;
      for (let i = 0; i < 7; i++) {
        const ang = (i / 7) * Math.PI * 2 + k * Math.PI * 0.7;
        const nx = Math.cos(ang) * orbit;
        const ny = Math.sin(ang) * orbit * 0.8;
        const noteScale = 0.85 + Math.sin(k * 8 + i) * 0.18;
        ctx.save();
        ctx.translate(nx, ny);
        ctx.scale(noteScale, noteScale);
        ctx.globalAlpha = alpha;
        // Note head — gold sphere
        ctx.fillStyle = '#ffd884';
        ctx.shadowColor = '#fff5d8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
        ctx.fill();
        // Stem
        ctx.strokeStyle = '#ffd884';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(5, 0); ctx.lineTo(5, -16);
        ctx.stroke();
        // Flag (eighth-note)
        ctx.beginPath();
        ctx.moveTo(5, -16);
        ctx.quadraticCurveTo(14, -14, 12, -8);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    });
  }

  // ===== VEIL-CRAWLER — vertical tear with eyes, 4 tendrils per target ====
  _summonVeil(skill, dmgBase, targets) {
    const W = this.game.viewW || 800, H = this.game.viewH || 600;
    const cx = W / 2, cy = H / 2;
    const scale = 1.8;
    const HITS = 4;
    this._runSummonCutscene({
      impactAt: 11000,
      totalMs: 14000,
      stages: [
        // 0.0s — Black-violet plunge, whisper of something ancient
        { at: 0, fn: () => {
          this.fx.sceneTint('#0d0418', 0.94, 13.3, 0.5, 1.4);
          audio.play('voidHum');
          audio.play('rift');
        }},
        // 0.8s — Vertical tear opens on the LEFT side of screen
        { at: 800, fn: () => this._drawVerticalTear(cx - W * 0.35, cy, scale * 0.6, 3.5)},
        // 1.6s — Second tear opens on the RIGHT
        { at: 1600, fn: () => {
          this._drawVerticalTear(cx + W * 0.35, cy, scale * 0.6, 3.5);
          audio.play('voidHum');
        }},
        // 2.4s — Both connect into one large central rift
        { at: 2400, fn: () => this._drawVerticalTear(cx, cy, scale * 1.6, 8.0)},
        // 3.6s — Eyes start blinking open inside the rift (40 of them, in waves)
        { at: 3600, fn: () => this._drawTearEyes(cx, cy, scale * 1.6, 5.0)},
        // 4.4s — A face briefly glimpsed in the rift — many-eyed silhouette
        { at: 4400, fn: () => this._drawCrawlerFace(cx, cy, scale * 1.6, 2.5)},
        // 4.4s — Predatory chime audio cascade
        { at: 4400, fn: () => {
          for (let i = 0; i < 6; i++) this._scheduleStrike(i * 180, () => audio.play('voidHum'));
        }},
        // 5.6s — Tendrils start emerging from the tear
        { at: 5600, fn: () => {
          audio.play('aetherWail');
          this.battleShake = Math.max(this.battleShake, 8);
        }},
        // 6.4s — Tendrils accelerate toward each target — first sweep
        { at: 6400, fn: () => {
          for (const t of targets) {
            if (t.dead) continue;
            this._drawVeilTendril(cx, cy, t._screenX, t._screenY, 2.0);
          }
          audio.play('voidHum');
          this.battleShake = Math.max(this.battleShake, 12);
        }},
        // 7.4s — Second tendril sweep
        { at: 7400, fn: () => {
          for (const t of targets) {
            if (t.dead) continue;
            this._drawVeilTendril(cx, cy, t._screenX + 20, t._screenY - 10, 1.8);
          }
        }},
        // 8.4s — Targets briefly pulled toward the tear (visual: shake)
        { at: 8400, fn: () => {
          for (const t of targets) {
            if (t.dead) continue;
            t.shake = 0.8;
          }
          audio.play('aetherWail');
          this.battleShake = Math.max(this.battleShake, 18);
        }},
        // 9.2s — Tear pulses red — soul-drain begins
        { at: 9200, fn: () => {
          this.fx.screenFlash('#6a1a4a', 0.4, 0.3);
          this.fx.castCharge(cx, cy, '#a060ff', scale * 2.5);
          audio.play('voidHum');
          audio.play('doomKnell');
        }},
        // 10.0s — Pre-impact contraction
        { at: 10000, fn: () => {
          for (let r = 0; r < 4; r++) {
            this._scheduleStrike(r * 80, () => {
              this.fx.shockwave(cx, cy, '#3a0a3a', (200 - r * 40) * scale, 0.4);
            });
          }
        }},
      ],
    }, (isSkip) => {
      if (isSkip) {
        this._snapSummonDamage(skill, dmgBase, targets, (tx, ty) => {
          this.fx.darkRift(tx, ty, scale * 1.0);
          this.fx.blackStar(tx, ty, scale * 0.7);
          this.fx.shockwave(tx, ty, '#7a1a7a', 170 * scale, 0.8);
        });
        this.fx.screenFlash('#5a1a4a', 0.9, 0.5);
        this.battleShake = Math.max(this.battleShake, 26);
        audio.play('doomKnell');
        audio.play('aetherWail');
        return;
      }
      // IMPACT — 4 tendril strikes per enemy, each draining
      this.fx.screenFlash('#5a1a4a', 0.95, 0.6);
      this.battleShake = Math.max(this.battleShake, 30);
      audio.play('doomKnell');
      audio.play('aetherWail');
      audio.play('voidHum');
      for (const t of targets) {
        for (let i = 0; i < HITS; i++) {
          this._scheduleStrike(i * 180, () => {
            this.fx.darkRift(t._screenX + (Math.random() - 0.5) * 24, t._screenY, scale * 0.9);
            this.fx.blackStar(t._screenX, t._screenY, scale * 0.5);
            this.fx.shockwave(t._screenX, t._screenY, '#7a1a7a', 130 * scale, 0.6);
            for (let p = 0; p < 6; p++) {
              const px = t._screenX, py = t._screenY;
              this.fx.spawn({
                x: px, y: py,
                vx: (cx - px) * 0.8 / 60, vy: (cy - py) * 0.8 / 60,
                gravity: 0, drag: 0,
                size: 2, color: '#c060ff',
                life: 1.0, shrink: false, glow: 10,
              });
            }
            this._applyDamage(this.actor, t, dmgBase * skill.power, skill.element, skill);
            audio.play(i % 2 ? 'voidHum' : 'glassShatter');
          });
        }
      }
    }, () => {
      this._checkEnd() || this._endActorTurn();
    });
  }

  _drawVerticalTear(cx, cy, scale, durSec) {
    const H = this.game.viewH || 600;
    this.fx.shape(durSec, (ctx, k) => {
      const grow = Math.min(1, k * 2.2);
      const fadeOut = k > 0.85 ? Math.max(0, 1 - (k - 0.85) / 0.15) : 1;
      const alpha = grow * fadeOut;
      const height = H * 0.85 * grow;
      const width = (12 + Math.sin(k * 18) * 3) * scale;
      ctx.save();
      // Outer violet glow
      ctx.fillStyle = `rgba(150,80,255,${alpha * 0.45})`;
      ctx.shadowColor = '#c060ff';
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.ellipse(cx, cy, width * 1.6, height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Core black tear
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(8,2,18,${alpha})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, width, height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Inner shimmer — flickering inside
      ctx.fillStyle = `rgba(192,96,255,${alpha * 0.35 * (0.5 + Math.sin(k * 22) * 0.5)})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, width * 0.5, height * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  _drawTearEyes(cx, cy, scale, durSec) {
    const H = this.game.viewH || 600;
    const eyes = [];
    for (let i = 0; i < 40; i++) {
      eyes.push({
        x: cx + (Math.random() - 0.5) * 25 * scale,
        y: cy + (Math.random() - 0.5) * H * 0.7,
        size: 1.5 + Math.random() * 1.5,
        openDelay: 0.05 + Math.random() * 0.55,
        blinkRate: 0.5 + Math.random() * 2.5,
      });
    }
    this.fx.shape(durSec, (ctx, k) => {
      const fadeOut = k > 0.78 ? Math.max(0, 1 - (k - 0.78) / 0.22) : 1;
      ctx.save();
      for (const e of eyes) {
        if (k < e.openDelay) continue;
        const localK = (k - e.openDelay) / (1 - e.openDelay);
        const open = Math.sin(localK * Math.PI * e.blinkRate + 1) * 0.5 + 0.5;
        const alpha = open * fadeOut;
        if (alpha <= 0.05) continue;
        // Eye sclera (pale violet)
        ctx.fillStyle = `rgba(220,160,255,${alpha * 0.85})`;
        ctx.shadowColor = '#c060ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.ellipse(e.x, e.y, e.size * 2.2, e.size, 0, 0, Math.PI * 2);
        ctx.fill();
        // Pupil
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(20,5,40,${alpha})`;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  _drawCrawlerFace(cx, cy, scale, durSec) {
    this.fx.shape(durSec, (ctx, k) => {
      const grow = Math.min(1, k * 2.5);
      const fadeOut = k > 0.6 ? Math.max(0, 1 - (k - 0.6) / 0.4) : 1;
      const alpha = grow * fadeOut * 0.6;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      // Inhuman skull-like face — elongated, multiple eye sockets
      ctx.fillStyle = '#180420';
      ctx.beginPath();
      ctx.ellipse(0, 0, 28, 48, 0, 0, Math.PI * 2);
      ctx.fill();
      // Cluster of glowing eye-sockets
      ctx.fillStyle = `rgba(192,80,255,${alpha * 1.4})`;
      ctx.shadowColor = '#c060ff';
      ctx.shadowBlur = 10;
      const eyePositions = [
        [-9, -20], [9, -20], [-14, -10], [-2, -8], [12, -10],
        [-8, 4], [8, 4], [-14, 14], [0, 18], [14, 14],
      ];
      for (const [ex, ey] of eyePositions) {
        ctx.beginPath();
        ctx.arc(ex, ey, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      // Long thin mouth slit
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(60,15,100,${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-14, 32);
      ctx.lineTo(14, 32);
      ctx.stroke();
      ctx.restore();
    });
  }

  _drawVeilTendril(fromX, fromY, toX, toY, durSec) {
    const segs = 14;
    const seed = Math.random() * 100;
    this.fx.shape(durSec, (ctx, k) => {
      const reach = Math.min(1, k * 1.8);
      const fade = k > 0.7 ? Math.max(0, 1 - (k - 0.7) / 0.3) : 1;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.lineCap = 'round';
      // Build segmented snaking path
      const path = [];
      for (let i = 0; i <= segs; i++) {
        const t = (i / segs) * reach;
        const baseX = fromX + (toX - fromX) * t;
        const baseY = fromY + (toY - fromY) * t;
        const wave = Math.sin(t * 8 + k * 6 + seed) * 18;
        // Perpendicular offset
        const dx = toX - fromX, dy = toY - fromY;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len;
        path.push([baseX + nx * wave, baseY + ny * wave]);
      }
      // Outer glow
      ctx.strokeStyle = '#a060ff';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#c060ff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(path[0][0], path[0][1]);
      for (let i = 1; i < path.length; i++) ctx.lineTo(path[i][0], path[i][1]);
      ctx.stroke();
      // Inner core — darker
      ctx.strokeStyle = '#1a0418';
      ctx.lineWidth = 1.6;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(path[0][0], path[0][1]);
      for (let i = 1; i < path.length; i++) ctx.lineTo(path[i][0], path[i][1]);
      ctx.stroke();
      ctx.restore();
    });
  }

  // ===== HOLLOW KING — throne rises, 8 judgement strikes per enemy ========
  _summonHollowKing(skill, dmgBase, targets) {
    const W = this.game.viewW || 800, H = this.game.viewH || 600;
    const cx = W / 2, cy = H / 2;
    const scale = 1.8;
    const HITS = 8;
    this._runSummonCutscene({
      impactAt: 11500,
      totalMs: 14500,
      stages: [
        // 0.0s — Sceneline deep blue-black; the ground groans
        { at: 0, fn: () => {
          this.fx.sceneTint('#080214', 0.93, 13.8, 0.5, 1.4);
          audio.play('rift');
          audio.play('bossThump');
          this.battleShake = Math.max(this.battleShake, 6);
        }},
        // 1.0s — Ground crack opens — black light pours from below
        { at: 1000, fn: () => {
          this.fx.shockwave(cx, cy + 100, '#a060ff', 220 * scale, 1.2);
          for (let i = 0; i < 40; i++) {
            const ox = (Math.random() - 0.5) * 250 * scale;
            this.fx.spawn({
              x: cx + ox, y: cy + 80, vx: ox * 0.3, vy: -60 - Math.random() * 80,
              gravity: -10, drag: 0.3,
              size: 2.5, color: i % 2 ? '#6a3a8a' : '#c0a0ff',
              life: 2.0, shrink: false, glow: 12,
            });
          }
          audio.play('bossThump');
        }},
        // 2.0s — Throne rises from the crack
        { at: 2000, fn: () => this._drawObsidianThrone(cx, cy, scale * 1.6, 9.0)},
        // 3.5s — Sigil draws on the throne base
        { at: 3500, fn: () => {
          this.fx.groundSigil(cx, cy + 90, '#6a3a8a', 'dark', 8.0, scale * 3.0);
          audio.play('voidHum');
          this.battleShake = Math.max(this.battleShake, 10);
        }},
        // 4.5s — Hollow King silhouette assembles on the throne
        { at: 4500, fn: () => this._drawHollowKing(cx, cy, scale * 1.6, 7.0)},
        // 6.0s — King's crown ignites violet-gold; eyes blaze
        { at: 6000, fn: () => {
          this.fx.casterAura(cx, cy - 80 * scale, '#c0a0ff', 2.5, scale * 2.8);
          this.fx.shockwave(cx, cy - 80 * scale, '#ffd884', 130 * scale, 0.85);
          audio.play('aetherWail');
          audio.play('chime');
          this.battleShake = Math.max(this.battleShake, 14);
        }},
        // 7.0s — King raises hand; dark-gold beams lock onto each enemy
        { at: 7000, fn: () => {
          for (const t of targets) {
            if (t.dead) continue;
            this._drawJudgementBeam(cx, cy - 50 * scale, t._screenX, t._screenY, 4.5);
          }
          audio.play('voidHum');
        }},
        // 8.5s — Beams pulse brighter
        { at: 8500, fn: () => {
          for (const t of targets) {
            if (t.dead) continue;
            this.fx.shockwave(t._screenX, t._screenY, '#ffd884', 60 * scale, 0.5);
          }
          audio.play('crit');
          this.battleShake = Math.max(this.battleShake, 16);
        }},
        // 9.5s — Crown intensifies; royal commandment
        { at: 9500, fn: () => {
          this.fx.starBurst(cx, cy - 80 * scale, '#ffd884', scale * 1.8);
          audio.play('doomKnell');
          audio.play('aetherWail');
          this.battleShake = Math.max(this.battleShake, 20);
        }},
        // 10.5s — King brings down hand — judgement begins descending
        { at: 10500, fn: () => {
          this.fx.castCharge(cx, cy - 50 * scale, '#ffd884', scale * 3.0);
          for (const t of targets) {
            if (t.dead) continue;
            this.fx.skyBeam?.(t._screenX, t._screenY, '#ffd884', 0.7, scale * 1.2);
          }
          audio.play('aetherWail');
        }},
      ],
    }, (isSkip) => {
      if (isSkip) {
        this._snapSummonDamage(skill, dmgBase, targets, (tx, ty) => {
          this.fx.holyPillar(tx, ty, scale);
          this.fx.darkRift(tx, ty, scale * 0.7);
          this.fx.shockwave(tx, ty, '#ffd884', 180 * scale, 0.9);
          this.fx.starBurst(tx, ty, '#ffd884', scale * 1.4);
        });
        this.fx.screenFlash('#ffd884', 0.85, 0.5);
        this.battleShake = Math.max(this.battleShake, 28);
        audio.play('doomKnell');
        audio.play('aetherWail');
        return;
      }
      // IMPACT — 8 royal strikes per enemy, holy/dark hybrid
      this.fx.screenFlash('#ffd884', 0.9, 0.6);
      this.fx.screenFlash('#ffffff', 0.5, 0.32);
      this.battleShake = Math.max(this.battleShake, 36);
      audio.play('doomKnell');
      audio.play('aetherWail');
      audio.play('crit');
      for (const t of targets) {
        for (let i = 0; i < HITS; i++) {
          this._scheduleStrike(i * 130, () => {
            const angle = (i / HITS) * Math.PI * 2;
            const offset = 30;
            const ox = Math.cos(angle) * offset, oy = Math.sin(angle) * offset * 0.6;
            this.fx.holyPillar(t._screenX + ox, t._screenY + oy, scale * 0.65);
            this.fx.darkRift(t._screenX + ox * 0.5, t._screenY + oy * 0.5, scale * 0.55);
            this.fx.shockwave(t._screenX, t._screenY, i % 2 ? '#ffd884' : '#a060ff', 100 * scale, 0.5);
            if (i === 0) this.fx.starBurst(t._screenX, t._screenY, '#ffffff', scale * 1.0);
            if (i === HITS - 1) this.fx.starBurst(t._screenX, t._screenY, '#ffd884', scale * 1.4);
            this._applyDamage(this.actor, t, dmgBase * skill.power, skill.element, skill);
            audio.play(i % 3 === 0 ? 'crit' : i % 3 === 1 ? 'aetherWail' : 'doomKnell');
          });
        }
      }
    }, () => {
      this._checkEnd() || this._endActorTurn();
    });
  }

  _drawObsidianThrone(cx, cy, scale, durSec) {
    this.fx.shape(durSec, (ctx, k) => {
      const fadeIn = Math.min(1, k / 0.15);
      const fadeOut = k > 0.88 ? Math.max(0, 1 - (k - 0.88) / 0.12) : 1;
      const alpha = fadeIn * fadeOut;
      const rise = Math.max(0, 1 - k * 4) * 80 * scale;
      ctx.save();
      ctx.translate(cx, cy + 40 + rise);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      // Base — wide obsidian platform
      ctx.fillStyle = '#0d0418';
      ctx.beginPath();
      ctx.moveTo(-65, 80);
      ctx.lineTo(65, 80);
      ctx.lineTo(58, 60);
      ctx.lineTo(-58, 60);
      ctx.closePath();
      ctx.fill();
      // Seat
      ctx.fillRect(-42, 0, 84, 60);
      // Backrest — tall spiked
      ctx.beginPath();
      ctx.moveTo(-30, 0);
      ctx.lineTo(-44, -80);
      ctx.lineTo(-30, -120);
      ctx.lineTo(-10, -100);
      ctx.lineTo(0, -130);
      ctx.lineTo(10, -100);
      ctx.lineTo(30, -120);
      ctx.lineTo(44, -80);
      ctx.lineTo(30, 0);
      ctx.closePath();
      ctx.fill();
      // Violet glow seams between obsidian segments
      ctx.strokeStyle = `rgba(192,96,255,${alpha * 0.85})`;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#c060ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(-25, 4); ctx.lineTo(-25, 56);
      ctx.moveTo(25, 4); ctx.lineTo(25, 56);
      ctx.moveTo(-44, -80); ctx.lineTo(-30, 0);
      ctx.moveTo(44, -80); ctx.lineTo(30, 0);
      ctx.moveTo(0, -130); ctx.lineTo(0, -20);
      ctx.stroke();
      ctx.restore();
    });
  }

  _drawHollowKing(cx, cy, scale, durSec) {
    this.fx.shape(durSec, (ctx, k) => {
      const fadeIn = Math.min(1, k / 0.18);
      const fadeOut = k > 0.86 ? Math.max(0, 1 - (k - 0.86) / 0.14) : 1;
      const alpha = fadeIn * fadeOut;
      // King is seated on the throne; subtle breathing
      const breath = Math.sin(k * 6) * 1.5;
      ctx.save();
      ctx.translate(cx, cy - 80 * scale + breath);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      // Body — heavy royal robes
      ctx.fillStyle = '#0a0218';
      ctx.beginPath();
      ctx.moveTo(-22, -10);
      ctx.bezierCurveTo(-30, 30, -34, 80, -28, 100);
      ctx.lineTo(28, 100);
      ctx.bezierCurveTo(34, 80, 30, 30, 22, -10);
      ctx.closePath();
      ctx.fill();
      // Pauldrons — angular shoulder armor
      ctx.beginPath();
      ctx.moveTo(-30, -10); ctx.lineTo(-26, 15); ctx.lineTo(-18, 18); ctx.lineTo(-22, -8);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(30, -10); ctx.lineTo(26, 15); ctx.lineTo(18, 18); ctx.lineTo(22, -8);
      ctx.closePath();
      ctx.fill();
      // Head — gaunt
      ctx.beginPath();
      ctx.ellipse(0, -22, 11, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      // Crown — obsidian spikes
      ctx.strokeStyle = '#0a0218';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-11, -32);
      ctx.lineTo(-8, -42); ctx.lineTo(-3, -34);
      ctx.lineTo(0, -46); ctx.lineTo(3, -34);
      ctx.lineTo(8, -42); ctx.lineTo(11, -32);
      ctx.closePath();
      ctx.fill();
      // Crown — gold inset glow line
      ctx.strokeStyle = `rgba(255,216,132,${alpha})`;
      ctx.lineWidth = 1.2;
      ctx.shadowColor = '#ffd884';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(-10, -32); ctx.lineTo(10, -32);
      ctx.stroke();
      // Blazing violet eyes
      ctx.shadowColor = '#c060ff';
      ctx.shadowBlur = 10;
      const eyePulse = 0.7 + 0.3 * Math.sin(k * 12);
      ctx.fillStyle = `rgba(220,140,255,${alpha * eyePulse})`;
      ctx.beginPath();
      ctx.arc(-4, -22, 1.6, 0, Math.PI * 2);
      ctx.arc(4, -22, 1.6, 0, Math.PI * 2);
      ctx.fill();
      // Royal scepter — held vertical
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#1a0418';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(28, 14); ctx.lineTo(34, -40);
      ctx.stroke();
      // Scepter orb — glowing gold-violet
      ctx.fillStyle = `rgba(255,216,132,${alpha * 0.95})`;
      ctx.shadowColor = '#ffd884';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(34, -42, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  _drawJudgementBeam(fromX, fromY, toX, toY, durSec) {
    this.fx.shape(durSec, (ctx, k) => {
      const reach = Math.min(1, k * 2);
      const pulse = 0.8 + 0.2 * Math.sin(k * 18);
      const fade = k > 0.75 ? Math.max(0, 1 - (k - 0.75) / 0.25) : 1;
      const alpha = reach * fade * pulse;
      const tx = fromX + (toX - fromX) * reach;
      const ty = fromY + (toY - fromY) * reach;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      // Outer gold glow
      const grd = ctx.createLinearGradient(fromX, fromY, tx, ty);
      grd.addColorStop(0, `rgba(255,216,132,${alpha * 0.9})`);
      grd.addColorStop(0.6, `rgba(192,120,255,${alpha * 0.7})`);
      grd.addColorStop(1, 'rgba(120,40,180,0)');
      ctx.strokeStyle = grd;
      ctx.lineWidth = 4.5;
      ctx.shadowColor = '#ffd884';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      // Inner core
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.restore();
    });
  }

  // ===== SAPPHIRE TIDE — rising wall, cresting wave, single tsunami =======
  _summonSapphireTide(skill, dmgBase, targets) {
    const W = this.game.viewW || 800, H = this.game.viewH || 600;
    const cx = W / 2, cy = H / 2;
    const scale = 1.8;
    this._runSummonCutscene({
      impactAt: 10000,
      totalMs: 13000,
      stages: [
        // 0.0s — Deep sapphire sceneline; ocean rumble
        { at: 0, fn: () => {
          this.fx.sceneTint('#04143a', 0.85, 12.3, 0.5, 1.4);
          audio.play('rift');
        }},
        // 0.8s — Water level visible at bottom of screen, rising
        { at: 800, fn: () => this._drawTidalRise(scale, 5.5)},
        // 1.5s — First wave-front audio
        { at: 1500, fn: () => audio.play('bossThump') },
        // 2.5s — Sapphire-blue sigil draws on the rising water
        { at: 2500, fn: () => {
          this.fx.groundSigil(cx, cy + 80, '#3b88ff', 'water', 8.0, scale * 3.4);
          this.fx.shockwave(cx, cy + 80, '#7adaff', 240 * scale, 1.3);
          audio.play('aetherWail');
          this.battleShake = Math.max(this.battleShake, 8);
        }},
        // 4.0s — Wave begins forming above — crest building
        { at: 4000, fn: () => this._drawWaveCrest(scale, 6.5)},
        // 5.5s — Wave grows higher; crystalline foam particles trail
        { at: 5500, fn: () => {
          for (let i = 0; i < 80; i++) {
            this.fx.spawn({
              x: cx + (Math.random() - 0.5) * W,
              y: cy - H * 0.3 + (Math.random() - 0.5) * 60,
              vx: 200 + Math.random() * 100, vy: -20 - Math.random() * 60,
              gravity: 30, drag: 0.1,
              size: 2.5 + Math.random() * 2,
              color: i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#cfeaff' : '#3b88ff',
              life: 2.0, shrink: false, glow: 12,
            });
          }
          audio.play('choirSwell');
          this.battleShake = Math.max(this.battleShake, 12);
        }},
        // 7.0s — Wave reaches peak — held terrifying
        { at: 7000, fn: () => {
          this.fx.casterAura(cx, cy - 40 * scale, '#3b88ff', 2.5, scale * 3.2);
          audio.play('aetherWail');
          audio.play('crit');
        }},
        // 8.0s — Wave begins to break — pre-crash
        { at: 8000, fn: () => {
          this.fx.castCharge(cx, cy - 40 * scale, '#7adaff', scale * 3.0);
          audio.play('bossThump');
          this.battleShake = Math.max(this.battleShake, 18);
        }},
        // 8.8s — Wave breaks — visual sweep across screen
        { at: 8800, fn: () => this._drawTidalBreak(scale, 2.0)},
        // 9.4s — Crash audio + pre-impact shake
        { at: 9400, fn: () => {
          audio.play('crit');
          audio.play('doomKnell');
          this.battleShake = Math.max(this.battleShake, 24);
        }},
      ],
    }, (isSkip) => {
      // IMPACT — single massive wave hit per enemy; allies get cleansing heal
      this.fx.screenFlash('#7adaff', 0.95, 0.65);
      this.fx.screenFlash('#ffffff', 0.55, 0.35);
      this.battleShake = Math.max(this.battleShake, 36);
      audio.play('doomKnell');
      audio.play('aetherWail');
      audio.play('crit');
      audio.play('glassShatter');
      if (!isSkip) {
        for (let r = 0; r < 6; r++) {
          this._scheduleStrike(r * 80, () => {
            this.fx.shockwave(cx, cy, r % 2 ? '#ffffff' : '#3b88ff', (200 + r * 100) * scale, 1.3);
          });
        }
      }
      this._summonHitTargets(skill, dmgBase, targets, (tx, ty) => {
        this.fx.waterColumn(tx, ty, scale * 2.5);
        this.fx.waterColumn(tx - 20, ty + 10, scale * 1.6);
        this.fx.waterColumn(tx + 20, ty - 10, scale * 1.6);
        this.fx.shatterRain(tx, ty, '#cfeaff', scale * 1.8);
        this.fx.shockwave(tx, ty, '#3b88ff', 280 * scale, 1.4);
        this.fx.shockwave(tx, ty, '#7adaff', 180 * scale, 1.0);
        this.fx.shockwave(tx, ty, '#ffffff', 100 * scale, 0.7);
        this.fx.starBurst(tx, ty, '#ffffff', scale * 1.6);
        for (let i = 0; i < 30; i++) {
          const ang = Math.random() * Math.PI * 2;
          const sp = 80 + Math.random() * 140;
          this.fx.spawn({
            x: tx, y: ty,
            vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 30,
            gravity: 80, drag: 0.25,
            size: 2.5, color: i % 2 ? '#ffffff' : '#3b88ff',
            life: 1.4, shrink: true, glow: 10,
          });
        }
      });
      // Restore the party — the wave washes allies clean. Dead allies are
      // revived at half HP (the cleansing tide isn't as restorative as the
      // First Song), all negative statuses are washed away.
      const healAmount = Math.max(15, Math.floor(dmgBase * 0.5));
      for (const m of this.party) {
        this._restoreAlly(m, { hpPct: 0.5, healAmount, color: '#3b88ff', bgColor: '#cfeaff', label: 'is washed clean by the Sapphire Tide' });
      }
    }, () => {
      this._checkEnd() || this._endActorTurn();
    });
  }

  _drawTidalRise(scale, durSec) {
    const W = this.game.viewW || 800, H = this.game.viewH || 600;
    this.fx.shape(durSec, (ctx, k) => {
      const fadeOut = k > 0.85 ? Math.max(0, 1 - (k - 0.85) / 0.15) : 1;
      const alpha = Math.min(1, k * 3) * fadeOut;
      const level = H * (1 - Math.min(1, k * 0.6));  // rises from bottom
      ctx.save();
      // Water fill
      const grd = ctx.createLinearGradient(0, level, 0, H);
      grd.addColorStop(0, `rgba(122,218,255,${alpha * 0.8})`);
      grd.addColorStop(0.5, `rgba(59,136,255,${alpha * 0.7})`);
      grd.addColorStop(1, `rgba(20,60,150,${alpha * 0.5})`);
      ctx.fillStyle = grd;
      ctx.fillRect(0, level, W, H - level);
      // Wave-line ripples on top
      ctx.strokeStyle = `rgba(207,234,255,${alpha * 0.95})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = '#7adaff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 8) {
        const wave = Math.sin((x + k * 600) * 0.04) * 6;
        if (x === 0) ctx.moveTo(x, level + wave);
        else ctx.lineTo(x, level + wave);
      }
      ctx.stroke();
      ctx.restore();
    });
  }

  _drawWaveCrest(scale, durSec) {
    const W = this.game.viewW || 800, H = this.game.viewH || 600;
    this.fx.shape(durSec, (ctx, k) => {
      const fadeIn = Math.min(1, k / 0.15);
      const fadeOut = k > 0.78 ? Math.max(0, 1 - (k - 0.78) / 0.22) : 1;
      const alpha = fadeIn * fadeOut;
      const grow = Math.min(1, k * 1.4);
      const crestTop = H * 0.6 - 220 * grow * scale;
      const crestBot = H * 0.55;
      ctx.save();
      ctx.globalAlpha = alpha;
      // Curling wave body
      ctx.fillStyle = '#0d2a5a';
      ctx.beginPath();
      ctx.moveTo(0, crestBot);
      ctx.quadraticCurveTo(W * 0.3, crestTop, W * 0.5, crestTop + 20);
      ctx.quadraticCurveTo(W * 0.7, crestTop + 40, W, crestBot);
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fill();
      // Foam crest line — bright cyan-white
      ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.95})`;
      ctx.lineWidth = 4;
      ctx.shadowColor = '#7adaff';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(0, crestBot);
      ctx.quadraticCurveTo(W * 0.3, crestTop, W * 0.5, crestTop + 20);
      ctx.quadraticCurveTo(W * 0.7, crestTop + 40, W, crestBot);
      ctx.stroke();
      // Foam particles along the crest
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(255,255,255,${alpha * 0.85})`;
      for (let i = 0; i < 20; i++) {
        const t = i / 20;
        const x = t * W;
        const y = crestBot + (crestTop - crestBot) * Math.sin(t * Math.PI) + Math.sin(k * 10 + i) * 3;
        ctx.beginPath();
        ctx.arc(x, y, 3 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  _drawTidalBreak(scale, durSec) {
    const W = this.game.viewW || 800, H = this.game.viewH || 600;
    this.fx.shape(durSec, (ctx, k) => {
      const fade = k > 0.6 ? Math.max(0, 1 - (k - 0.6) / 0.4) : 1;
      const alpha = fade;
      const sweep = k;  // 0 to 1 — the wave sweeping across
      ctx.save();
      ctx.globalAlpha = alpha;
      // The breaking wave — diagonal sweep across the screen
      const sweepX = -W * 0.3 + sweep * W * 1.4;
      const grd = ctx.createLinearGradient(sweepX - 80, 0, sweepX + 80, 0);
      grd.addColorStop(0, 'rgba(255,255,255,0)');
      grd.addColorStop(0.5, `rgba(255,255,255,${alpha * 0.9})`);
      grd.addColorStop(1, 'rgba(122,218,255,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(sweepX - 80, 0, 160, H);
      ctx.restore();
    });
  }

  // ===== SUNDERED HEART — chaos rift, 13 strikes across enemies ===========
  // ===== THE SUNDERED HEART — true KoR-style: 13 named fragments, each
  // strikes every enemy in sequence. ~31 seconds total. The crown jewel.
  _summonSunderedHeart(skill, dmgBase, targets) {
    const W = this.game.viewW || 800, H = this.game.viewH || 600;
    const cx = W / 2, cy = H / 2;
    const scale = 1.8;
    // The 13 fragments — each one falls in sequence and strikes every enemy.
    // Each has its own color, central FX primitive, per-enemy FX, status, and
    // audio sting, so 13 individual moments instead of one repeating effect.
    const FRAGMENTS = this._sunderedFragmentList();
    const STRIKE_GAP = 1500;  // 1.5s per strike → 19.5s of strikes
    const PRE_IMPACT_END = 10500;  // end of buildup, first strike starts here
    const lastStrikeAt = PRE_IMPACT_END + (FRAGMENTS.length - 1) * STRIKE_GAP;
    const totalMs = lastStrikeAt + STRIKE_GAP + 1500;  // tail + aftermath
    this._runSummonCutscene({
      impactAt: PRE_IMPACT_END,
      totalMs,
      stages: [
        // 0.0s — Reality shudders — color shifts red-violet, deep rift audio
        { at: 0, fn: () => {
          this.fx.sceneTint('#2a0418', 0.92, totalMs / 1000 - 0.5, 0.5, 1.4);
          audio.play('rift');
          audio.play('aetherWail');
          this.battleShake = Math.max(this.battleShake, 8);
        }},
        // 0.5s — Screen-wide hairline cracks start appearing
        { at: 500, fn: () => this._drawRealityCracks(2.5)},
        // 1.5s — More cracks, more violent — second wave
        { at: 1500, fn: () => {
          this._drawRealityCracks(2.5);
          audio.play('glassShatter');
          this.battleShake = Math.max(this.battleShake, 10);
        }},
        // 3.0s — A central wound opens — pulsing red-violet rift
        { at: 3000, fn: () => this._drawAetherWound(cx, cy, scale, 8.5)},
        // 4.5s — Vael's silhouette briefly visible inside the wound
        { at: 4500, fn: () => this._drawVaelGhost(cx, cy, scale, 3.0)},
        // 5.5s — Wound pulses, distorts; world glitches
        { at: 5500, fn: () => {
          this.fx.screenFlash('#ff2a6a', 0.35, 0.18);
          audio.play('voidHum');
          this.battleShake = Math.max(this.battleShake, 16);
        }},
        // 6.5s — Reality glitches harder — color-flash sequence
        { at: 6500, fn: () => {
          const colors = ['#ff2a6a','#a060ff','#ffd884','#7adaff'];
          for (let i = 0; i < 4; i++) {
            this._scheduleStrike(i * 100, () => this.fx.screenFlash(colors[i], 0.45, 0.15));
          }
          audio.play('aetherWail');
          audio.play('glassShatter');
        }},
        // 7.5s — Aether-pressure builds in the wound
        { at: 7500, fn: () => {
          this.fx.casterAura(cx, cy, '#ff2a6a', 2.5, scale * 3.2);
          this.fx.castCharge(cx, cy, '#a060ff', scale * 3.0);
          audio.play('doomKnell');
          this.battleShake = Math.max(this.battleShake, 20);
        }},
        // 8.5s — Reality WHITES OUT — momentary blank
        { at: 8500, fn: () => {
          this.fx.screenFlash('#ffffff', 1.0, 0.5);
          audio.play('aetherWail');
          this.battleShake = Math.max(this.battleShake, 28);
        }},
        // 9.5s — Pre-impact contraction rings, anticipation
        { at: 9500, fn: () => {
          for (let r = 0; r < 5; r++) {
            this._scheduleStrike(r * 70, () => {
              this.fx.shockwave(cx, cy, '#ff2a6a', (250 - r * 40) * scale, 0.45);
            });
          }
          audio.play('voidHum');
        }},
      ],
    }, (isSkip) => {
      if (isSkip) {
        // Snap all 13 fragment strikes against every target. Each iteration
        // uses a different fragment's status for variety.
        for (let i = 0; i < FRAGMENTS.length; i++) {
          const frag = FRAGMENTS[i];
          for (const t of targets) {
            const status = frag.status || { id: 'burn', chance: 0.4 };
            this._applyDamage(this.actor, t, dmgBase * skill.power, skill.element, { ...skill, status });
          }
        }
        // Brief central flourish so the snap has visual presence
        this.fx.screenFlash('#ff2a6a', 0.9, 0.55);
        this.fx.screenFlash('#ffffff', 0.5, 0.35);
        this.fx.starBurst(cx, cy, '#ffffff', scale * 2.4);
        this.fx.starBurst(cx, cy, '#ff2a6a', scale * 1.8);
        this.fx.blackStar(cx, cy, scale * 1.1);
        // Per-target impact flourish
        for (const t of targets) {
          this.fx.fireBloom(t._screenX, t._screenY, scale * 0.9);
          this.fx.shockwave(t._screenX, t._screenY, '#ff2a6a', 160 * scale, 0.85);
          this.fx.shockwave(t._screenX, t._screenY, '#ffffff', 110 * scale, 0.6);
        }
        this.battleShake = Math.max(this.battleShake, 32);
        audio.play('doomKnell');
        audio.play('aetherWail');
        audio.play('rift');
        return;
      }
      // ==== IMPACT — 13 fragments fall, each strikes every enemy ===========
      // Initial wound-erupt flash; central blackStar that holds the eye
      this.fx.screenFlash('#ff2a6a', 0.85, 0.5);
      this.fx.screenFlash('#ffffff', 0.4, 0.3);
      this.fx.blackStar(cx, cy, scale * 1.1);
      this.battleShake = Math.max(this.battleShake, 36);
      audio.play('doomKnell');
      audio.play('aetherWail');
      audio.play('rift');
      // Loop through the 13 fragments — each gets its own ~1.5s window
      for (let i = 0; i < FRAGMENTS.length; i++) {
        const frag = FRAGMENTS[i];
        const offset = i * STRIKE_GAP;
        // T+0: central manifestation appears at top — the fragment forms.
        this._scheduleStrike(offset, () => {
          this._drawFragmentManifest(cx, cy - 110 * scale, frag, 1.3);
          this.fx.screenFlash(frag.flash, 0.3, 0.2);
          this.battleShake = Math.max(this.battleShake, 14);
          audio.play(frag.audio);
        });
        // T+400ms: fragment shatters — chaos shards arc out to each enemy
        this._scheduleStrike(offset + 400, () => {
          for (const t of targets) {
            this.fx.castProjectile(cx, cy - 110 * scale, t._screenX, t._screenY, frag.color, 0.45);
          }
          audio.play(frag.secondAudio || 'crit');
        });
        // T+850ms: impact on each enemy with the fragment's signature
        this._scheduleStrike(offset + 850, () => {
          for (const t of targets) {
            frag.impactFx(this, t._screenX, t._screenY, scale);
            this.fx.shockwave(t._screenX, t._screenY, frag.color, 110 * scale, 0.55);
            this.fx.shockwave(t._screenX, t._screenY, frag.flash, 70 * scale, 0.4);
            const status = frag.status || { id: 'burn', chance: 0.4 };
            this._applyDamage(this.actor, t, dmgBase * skill.power, skill.element, { ...skill, status });
          }
          this.battleShake = Math.max(this.battleShake, frag.shake || 14);
          if (frag.impactAudio) audio.play(frag.impactAudio);
          this._showFragmentName(frag.name, frag.color);
        });
      }
      // Final flourish AFTER the 13th strike resolves
      this._scheduleStrike(FRAGMENTS.length * STRIKE_GAP + 100, () => {
        this.fx.screenFlash('#ffffff', 1.0, 0.7);
        this.fx.screenFlash('#ff2a6a', 0.5, 0.4);
        this.fx.starBurst(cx, cy, '#ffffff', scale * 2.8);
        this.fx.starBurst(cx, cy, '#ff2a6a', scale * 2.0);
        this.fx.blackStar(cx, cy, scale * 1.3);
        for (let r = 0; r < 8; r++) {
          this._scheduleStrike(r * 80, () => {
            const c = r % 4 === 0 ? '#ff2a6a' : r % 4 === 1 ? '#a060ff' : r % 4 === 2 ? '#ffd884' : '#ffffff';
            this.fx.shockwave(cx, cy, c, (220 + r * 110) * scale, 1.4);
          });
        }
        this.battleShake = Math.max(this.battleShake, 42);
        audio.play('doomKnell');
        audio.play('aetherWail');
        audio.play('rift');
        audio.play('crit');
      });
    }, () => {
      this._checkEnd() || this._endActorTurn();
    });
  }

  // The 13 Aether-fragments — each is one knight-equivalent. Each one has
  // unique color, central manifestation glyph, per-enemy impact FX, status
  // affliction, and audio fingerprint so the 13 hits feel like 13 distinct
  // beings rather than one effect playing on loop.
  _sunderedFragmentList() {
    return [
      { name: 'Ember Fragment',     color: '#ff5a3b', flash: '#ff8a3b',
        audio: 'magic',   secondAudio: 'ember',         impactAudio: 'thornCrack',
        status: { id: 'burn', chance: 0.45 }, shake: 14,
        impactFx: (b, x, y, s) => { b.fx.fireBloom(x, y, s * 0.85); b.fx.infernoVortex(x, y, '#ffae3b', s * 0.6); } },
      { name: 'Frost Fragment',     color: '#7adaff', flash: '#cfeaff',
        audio: 'glassShatter', secondAudio: 'crit',     impactAudio: 'glassShatter',
        status: { id: 'freeze', chance: 0.45 }, shake: 14,
        impactFx: (b, x, y, s) => { b.fx.shatterRain(x, y, '#cfeaff', s * 0.9); b.fx.iceShards(x, y, s * 0.7); } },
      { name: 'Storm Fragment',     color: '#ffd84d', flash: '#fff5d8',
        audio: 'thunderclap', secondAudio: 'crit',      impactAudio: 'thunderclap',
        status: { id: 'stun', chance: 0.45 }, shake: 15,
        impactFx: (b, x, y, s) => { b.fx.lightningBolt(x, y, -10, { branches: 3 }); b.fx.lightningBolt(x + 15, y, -15, { branches: 2 }); } },
      { name: 'Tide Fragment',      color: '#3b88ff', flash: '#7adaff',
        audio: 'sporeBurst', secondAudio: 'crit',       impactAudio: 'glassShatter',
        status: { id: 'stun', chance: 0.40 }, shake: 14,
        impactFx: (b, x, y, s) => { b.fx.waterColumn(x, y, s * 1.1); b.fx.shockwave(x, y, '#7adaff', 90 * s, 0.6); } },
      { name: 'Void Fragment',      color: '#5a2070', flash: '#c060ff',
        audio: 'voidHum', secondAudio: 'rift',          impactAudio: 'voidHum',
        status: { id: 'sleep', chance: 0.45 }, shake: 15,
        impactFx: (b, x, y, s) => { b.fx.darkRift(x, y, s * 0.95); b.fx.blackStar(x, y, s * 0.45); } },
      { name: 'Bloom Fragment',     color: '#7aaa3a', flash: '#a8ffc8',
        audio: 'thornCrack', secondAudio: 'sporeBurst', impactAudio: 'swarmHiss',
        status: { id: 'poison', chance: 0.50 }, shake: 13,
        impactFx: (b, x, y, s) => { b.fx.natureBurst(x, y, s * 0.95); b.fx.rotMist(x, y, s * 0.55); } },
      { name: 'Dawn Fragment',      color: '#ffd884', flash: '#ffffff',
        audio: 'chime', secondAudio: 'choirSwell',      impactAudio: 'chime',
        status: { id: 'stun', chance: 0.40 }, shake: 15,
        impactFx: (b, x, y, s) => { b.fx.holyPillar(x, y, s * 1.0); b.fx.starBurst(x, y, '#fff5d8', s * 0.7); } },
      { name: 'Bio Fragment',       color: '#9aaa3b', flash: '#c8e060',
        audio: 'swarmHiss', secondAudio: 'sporeBurst',  impactAudio: 'swarmHiss',
        status: { id: 'poison', chance: 0.55 }, shake: 13,
        impactFx: (b, x, y, s) => { b.fx.poisonCloud(x, y, s * 1.0); b.fx.rotMist(x, y, s * 0.6); } },
      { name: 'Aether Fragment',    color: '#ffffff', flash: '#ffffff',
        audio: 'aetherWail', secondAudio: 'crit',       impactAudio: 'doomKnell',
        status: { id: 'sleep', chance: 0.45 }, shake: 18,
        impactFx: (b, x, y, s) => { b.fx.starBurst(x, y, '#ffffff', s * 1.2); b.fx.ultimaBurst?.(x, y, s * 0.7) || b.fx.shockwave(x, y, '#ffffff', 120 * s, 0.7); } },
      { name: 'Heart Fragment',     color: '#ff2a6a', flash: '#ff8acf',
        audio: 'aetherWail', secondAudio: 'magic',      impactAudio: 'crit',
        status: { id: 'burn', chance: 0.55 }, shake: 16,
        impactFx: (b, x, y, s) => { b.fx.fireBloom(x, y, s * 0.95); b.fx.blackStar(x, y, s * 0.55); b.fx.starBurst(x, y, '#ff2a6a', s * 0.9); } },
      { name: 'Soul Fragment',      color: '#a060ff', flash: '#e8d8ff',
        audio: 'voidHum', secondAudio: 'aetherWail',    impactAudio: 'doomKnell',
        status: { id: 'sleep', chance: 0.55 }, shake: 18,
        impactFx: (b, x, y, s) => { b.fx.darkRift(x, y, s * 1.0); b.fx.starBurst(x, y, '#c060ff', s * 1.0); b.fx.blackStar(x, y, s * 0.5); } },
      { name: 'Memory Fragment',    color: '#ffae3b', flash: '#ffd884',
        audio: 'chime', secondAudio: 'rift',            impactAudio: 'aetherWail',
        status: { id: 'stun', chance: 0.55 }, shake: 18,
        impactFx: (b, x, y, s) => { b.fx.holyPillar(x, y, s * 1.0); b.fx.darkRift(x, y, s * 0.5); b.fx.starBurst(x, y, '#ffae3b', s * 0.9); } },
      { name: 'Sundering Fragment', color: '#ffffff', flash: '#ffffff',
        audio: 'doomKnell', secondAudio: 'aetherWail',  impactAudio: 'rift',
        status: { id: 'burn', chance: 0.65 }, shake: 30,
        impactFx: (b, x, y, s) => {
          b.fx.starBurst(x, y, '#ffffff', s * 1.8);
          b.fx.starBurst(x, y, '#ff2a6a', s * 1.3);
          b.fx.blackStar(x, y, s * 0.9);
          b.fx.fireBloom(x, y, s * 1.0);
          b.fx.shatterRain(x, y, '#a060ff', s * 0.8);
          b.fx.shockwave(x, y, '#ffffff', 180 * s, 0.9);
          b.fx.lingerScorch(x, y, '#ff2a6a', s * 1.1, 2.0);
        } },
    ];
  }

  // Draws the central fragment manifestation — a glowing shard rotating at
  // the apex, color-tinted per fragment. Lives during the ~1.3s window
  // before its shards arc out to the targets.
  _drawFragmentManifest(cx, cy, frag, durSec) {
    this.fx.shape(durSec, (ctx, k) => {
      const grow = Math.min(1, k * 3);
      const fadeOut = k > 0.7 ? Math.max(0, 1 - (k - 0.7) / 0.3) : 1;
      const alpha = grow * fadeOut;
      const rot = k * Math.PI * 3;
      const size = (18 + Math.sin(k * 22) * 3) * grow;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      // Outer halo
      const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 3);
      halo.addColorStop(0, this._withAlphaRGBA(frag.flash, alpha * 0.85));
      halo.addColorStop(0.5, this._withAlphaRGBA(frag.color, alpha * 0.55));
      halo.addColorStop(1, this._withAlphaRGBA(frag.color, 0));
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, size * 3, 0, Math.PI * 2);
      ctx.fill();
      // Fragment shard — angular crystal silhouette
      ctx.fillStyle = this._withAlphaRGBA(frag.color, alpha);
      ctx.shadowColor = frag.flash;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.moveTo(0, -size * 1.6);
      ctx.lineTo(size * 0.6, -size * 0.2);
      ctx.lineTo(size * 1.1, size * 0.8);
      ctx.lineTo(0, size * 1.4);
      ctx.lineTo(-size * 1.1, size * 0.8);
      ctx.lineTo(-size * 0.6, -size * 0.2);
      ctx.closePath();
      ctx.fill();
      // Inner white core
      ctx.shadowBlur = 0;
      ctx.fillStyle = this._withAlphaRGBA(frag.flash, alpha * 0.9);
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.7);
      ctx.lineTo(size * 0.3, 0);
      ctx.lineTo(0, size * 0.6);
      ctx.lineTo(-size * 0.3, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
  }

  // Floats the fragment's name across the top of the screen for ~1.2s so
  // each strike reads as a distinct "knight" rather than a generic chaos hit.
  _showFragmentName(name, color) {
    const W = this.game.viewW || 800;
    this.fx.shape(1.4, (ctx, k) => {
      const slideIn = Math.min(1, k * 4);
      const slideOut = k > 0.75 ? Math.max(0, 1 - (k - 0.75) / 0.25) : 1;
      const alpha = slideIn * slideOut;
      const y = 80 - (1 - slideIn) * 30;
      ctx.save();
      ctx.globalAlpha = alpha;
      // Backing pill
      ctx.fillStyle = 'rgba(10,5,20,0.85)';
      const text = name;
      ctx.font = 'bold 18px system-ui';
      const tw = ctx.measureText(text).width + 32;
      ctx.fillRect(W / 2 - tw / 2, y - 18, tw, 32);
      // Color edge
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.strokeRect(W / 2 - tw / 2, y - 18, tw, 32);
      // Name text
      ctx.shadowBlur = 0;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, W / 2, y - 2);
      ctx.restore();
    });
  }

  // Helper: convert hex to rgba string with alpha applied. Used by the
  // fragment manifestation shape which needs precise per-stop alpha control.
  _withAlphaRGBA(hex, alpha) {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
    if (!m) return hex;
    return `rgba(${parseInt(m[1],16)},${parseInt(m[2],16)},${parseInt(m[3],16)},${alpha})`;
  }

  _drawRealityCracks(durSec) {
    const W = this.game.viewW || 800, H = this.game.viewH || 600;
    const cracks = [];
    for (let i = 0; i < 9; i++) {
      const startX = Math.random() * W;
      const startY = Math.random() * H;
      const segs = 4 + Math.floor(Math.random() * 4);
      const path = [[startX, startY]];
      let ang = Math.random() * Math.PI * 2;
      for (let s = 0; s < segs; s++) {
        const len = 40 + Math.random() * 80;
        ang += (Math.random() - 0.5) * 1.2;
        const px = path[path.length - 1][0] + Math.cos(ang) * len;
        const py = path[path.length - 1][1] + Math.sin(ang) * len;
        path.push([px, py]);
      }
      cracks.push({ path, delay: Math.random() * 0.35 });
    }
    this.fx.shape(durSec, (ctx, k) => {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const c of cracks) {
        const localK = (k - c.delay) / (1 - c.delay);
        if (localK < 0) continue;
        const fade = localK < 0.25 ? localK / 0.25 : localK > 0.7 ? Math.max(0, 1 - (localK - 0.7) / 0.3) : 1;
        const drawN = Math.min(c.path.length, Math.ceil(c.path.length * localK * 2));
        if (drawN < 2) continue;
        ctx.strokeStyle = `rgba(255,42,106,${fade * 0.85})`;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#ff2a6a';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(c.path[0][0], c.path[0][1]);
        for (let i = 1; i < drawN; i++) ctx.lineTo(c.path[i][0], c.path[i][1]);
        ctx.stroke();
        // Inner white core
        ctx.strokeStyle = `rgba(255,255,255,${fade * 0.7})`;
        ctx.lineWidth = 0.6;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(c.path[0][0], c.path[0][1]);
        for (let i = 1; i < drawN; i++) ctx.lineTo(c.path[i][0], c.path[i][1]);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  _drawAetherWound(cx, cy, scale, durSec) {
    this.fx.shape(durSec, (ctx, k) => {
      const fadeIn = Math.min(1, k / 0.1);
      const fadeOut = k > 0.88 ? Math.max(0, 1 - (k - 0.88) / 0.12) : 1;
      const alpha = fadeIn * fadeOut;
      const pulse = 0.85 + 0.15 * Math.sin(k * 22);
      const r = (40 + k * 30) * scale * pulse;
      ctx.save();
      ctx.translate(cx, cy);
      // Outer red-violet halo
      const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.5);
      halo.addColorStop(0, `rgba(255,42,106,${alpha * 0.85})`);
      halo.addColorStop(0.5, `rgba(160,96,255,${alpha * 0.45})`);
      halo.addColorStop(1, 'rgba(20,4,40,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, r * 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Geometric jagged inner wound — unstable polygon
      ctx.fillStyle = `rgba(10,0,15,${alpha})`;
      ctx.beginPath();
      const sides = 9;
      for (let i = 0; i <= sides; i++) {
        const a = (i / sides) * Math.PI * 2;
        const rr = r * (0.7 + Math.sin(a * 3 + k * 8) * 0.2);
        const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      // Inner pulsing core — fractured light
      ctx.fillStyle = `rgba(255,80,160,${alpha * pulse * 0.75})`;
      ctx.shadowColor = '#ff2a6a';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.4 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  _drawVaelGhost(cx, cy, scale, durSec) {
    this.fx.shape(durSec, (ctx, k) => {
      const fadeIn = Math.min(1, k / 0.18);
      const fadeOut = k > 0.7 ? Math.max(0, 1 - (k - 0.7) / 0.3) : 1;
      const alpha = fadeIn * fadeOut * 0.6;
      const glitch = Math.sin(k * 25) * 4;
      ctx.save();
      ctx.translate(cx + glitch, cy);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      // Robed body — tall mage silhouette
      ctx.fillStyle = '#1a0420';
      ctx.beginPath();
      ctx.moveTo(-22, 60);
      ctx.bezierCurveTo(-30, 10, -18, -40, 0, -50);
      ctx.bezierCurveTo(18, -40, 30, 10, 22, 60);
      ctx.closePath();
      ctx.fill();
      // Head
      ctx.fillStyle = `rgba(40,5,50,${alpha * 1.4})`;
      ctx.beginPath();
      ctx.arc(0, -40, 10, 0, Math.PI * 2);
      ctx.fill();
      // Fractured face — pieces visibly displaced
      ctx.strokeStyle = `rgba(255,42,106,${alpha * 1.2})`;
      ctx.lineWidth = 1.2;
      ctx.shadowColor = '#ff2a6a';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(-6, -42); ctx.lineTo(-2, -36);
      ctx.moveTo(2, -42); ctx.lineTo(6, -36);
      ctx.moveTo(-8, -34); ctx.lineTo(8, -34);
      ctx.stroke();
      // Sundered crackles around the figure
      ctx.strokeStyle = `rgba(255,80,160,${alpha * 0.85})`;
      for (let i = 0; i < 5; i++) {
        const a = Math.random() * Math.PI * 2;
        const x1 = Math.cos(a) * (20 + Math.random() * 30);
        const y1 = Math.sin(a) * (20 + Math.random() * 30);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + (Math.random() - 0.5) * 12, y1 + (Math.random() - 0.5) * 12);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  // ===== AURORA THRONE — 7 thrones, 7 beams per enemy =====================
  _summonAuroraThrone(skill, dmgBase, targets) {
    const W = this.game.viewW || 800, H = this.game.viewH || 600;
    const cx = W / 2, cy = H / 2;
    const scale = 1.8;
    const HITS = 7;
    this._runSummonCutscene({
      impactAt: 10800,
      totalMs: 13500,
      stages: [
        // 0.0s — Sceneline cools to deep polar blue
        { at: 0, fn: () => {
          this.fx.sceneTint('#04183a', 0.82, 12.8, 0.5, 1.4);
          audio.play('chime');
        }},
        // 0.6s — Aurora ribbons start undulating across the upper region
        { at: 600, fn: () => this._drawAuroraRibbons(cx, cy, scale, 9.0)},
        // 1.8s — Aurora grows wider, multi-colored
        { at: 1800, fn: () => {
          audio.play('choirSwell');
          this.fx.shockwave(cx, cy - H * 0.3, '#a0ffd8', 280 * scale, 1.2);
        }},
        // 3.0s — Seven throne silhouettes appear in arc across the sky
        { at: 3000, fn: () => this._drawSevenThrones(cx, cy, scale, 7.0)},
        // 4.5s — Thrones become more solid; seven figures barely visible
        { at: 4500, fn: () => {
          audio.play('chime');
          audio.play('choirSwell');
          for (let i = 0; i < 7; i++) {
            const tx = cx + (i - 3) * 80 * scale;
            const ty = cy - H * 0.32;
            this._scheduleStrike(i * 80, () => this.fx.shockwave(tx, ty, '#a0ffd8', 50 * scale, 0.5));
          }
        }},
        // 5.8s — All seven thrones glow simultaneously
        { at: 5800, fn: () => {
          for (let i = 0; i < 7; i++) {
            const tx = cx + (i - 3) * 80 * scale;
            const ty = cy - H * 0.32;
            this.fx.casterAura(tx, ty, '#a0ffd8', 2.0, scale * 1.2);
          }
          audio.play('aetherWail');
          audio.play('chime');
          this.battleShake = Math.max(this.battleShake, 12);
        }},
        // 6.8s — Each throne projects a beam downward
        { at: 6800, fn: () => {
          for (let i = 0; i < 7; i++) {
            const tx = cx + (i - 3) * 80 * scale;
            const ty = cy - H * 0.32;
            this._drawAuroraBeam(tx, ty, cx, cy + 40, 3.0);
          }
          audio.play('choirSwell');
          this.battleShake = Math.max(this.battleShake, 15);
        }},
        // 8.0s — Beams converge briefly above the field
        { at: 8000, fn: () => {
          this.fx.starBurst(cx, cy + 20, '#ffffff', scale * 2.0);
          this.fx.castCharge(cx, cy + 20, '#a0ffd8', scale * 2.8);
          audio.play('aetherWail');
        }},
        // 9.0s — Beams split into individual beams for each enemy
        { at: 9000, fn: () => {
          for (const t of targets) {
            if (t.dead) continue;
            for (let i = 0; i < HITS; i++) {
              this._scheduleStrike(i * 50, () => {
                this._drawAuroraBeam(cx, cy + 20, t._screenX, t._screenY, 1.4);
              });
            }
          }
          audio.play('chime');
        }},
        // 10.0s — Final crescendo
        { at: 10000, fn: () => {
          audio.play('doomKnell');
          audio.play('aetherWail');
          this.battleShake = Math.max(this.battleShake, 22);
        }},
      ],
    }, (isSkip) => {
      if (isSkip) {
        this._snapSummonDamage(skill, dmgBase, targets, (tx, ty) => {
          this.fx.holyPillar(tx, ty, scale);
          this.fx.lightningBolt(tx, ty, -10, { branches: 3 });
          this.fx.starBurst(tx, ty, '#a0ffd8', scale * 1.3);
          this.fx.shockwave(tx, ty, '#a0ffd8', 160 * scale, 0.8);
        });
        this.fx.screenFlash('#a0ffd8', 0.85, 0.5);
        this.battleShake = Math.max(this.battleShake, 24);
        audio.play('doomKnell');
        audio.play('chime');
        return;
      }
      // IMPACT — 7 aurora beams hit each enemy
      this.fx.screenFlash('#a0ffd8', 0.9, 0.6);
      this.fx.screenFlash('#ffffff', 0.55, 0.32);
      this.battleShake = Math.max(this.battleShake, 32);
      audio.play('doomKnell');
      audio.play('aetherWail');
      audio.play('chime');
      audio.play('choirSwell');
      for (const t of targets) {
        for (let i = 0; i < HITS; i++) {
          this._scheduleStrike(i * 120, () => {
            const auroraColors = ['#a0ffd8','#ffd884','#7adaff','#cf9aff','#7aff8a','#ffffff','#ff8acf'];
            const color = auroraColors[i % auroraColors.length];
            this.fx.holyPillar(t._screenX + (Math.random() - 0.5) * 20, t._screenY, scale * 0.7);
            this.fx.lightningBolt(t._screenX, t._screenY, -10, { branches: 2 });
            this.fx.shockwave(t._screenX, t._screenY, color, 100 * scale, 0.5);
            this.fx.starBurst(t._screenX, t._screenY, color, scale * 0.8);
            this._applyDamage(this.actor, t, dmgBase * skill.power, skill.element, skill);
            audio.play(i % 2 ? 'chime' : 'thunderclap');
          });
        }
      }
    }, () => {
      this._checkEnd() || this._endActorTurn();
    });
  }

  _drawAuroraRibbons(cx, cy, scale, durSec) {
    const W = this.game.viewW || 800, H = this.game.viewH || 600;
    this.fx.shape(durSec, (ctx, k) => {
      const fadeIn = Math.min(1, k / 0.15);
      const fadeOut = k > 0.85 ? Math.max(0, 1 - (k - 0.85) / 0.15) : 1;
      const alpha = fadeIn * fadeOut;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const colors = ['#a0ffd8', '#7adaff', '#cf9aff', '#7aff8a', '#ff8acf'];
      for (let band = 0; band < 5; band++) {
        const baseY = cy - H * 0.4 + band * 12;
        ctx.beginPath();
        const startX = -W * 0.1;
        const endX = W * 1.1;
        for (let x = startX; x <= endX; x += 8) {
          const wave1 = Math.sin((x + k * 350 + band * 60) * 0.012) * 22;
          const wave2 = Math.sin((x + k * 200 + band * 80) * 0.025) * 10;
          const y = baseY + wave1 + wave2;
          if (x === startX) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${parseInt(colors[band].slice(1,3),16)},${parseInt(colors[band].slice(3,5),16)},${parseInt(colors[band].slice(5,7),16)},${alpha * 0.65})`;
        ctx.lineWidth = 8;
        ctx.shadowColor = colors[band];
        ctx.shadowBlur = 16;
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  _drawSevenThrones(cx, cy, scale, durSec) {
    const H = this.game.viewH || 600;
    this.fx.shape(durSec, (ctx, k) => {
      const fadeIn = Math.min(1, k / 0.2);
      const fadeOut = k > 0.88 ? Math.max(0, 1 - (k - 0.88) / 0.12) : 1;
      const alpha = fadeIn * fadeOut;
      ctx.save();
      for (let i = 0; i < 7; i++) {
        const tx = cx + (i - 3) * 80 * scale;
        const ty = cy - H * 0.32;
        const float = Math.sin(k * 3 + i * 0.8) * 3;
        ctx.save();
        ctx.translate(tx, ty + float);
        ctx.scale(scale * 0.6, scale * 0.6);
        ctx.globalAlpha = alpha;
        // Throne silhouette — minimalist, radiant
        ctx.fillStyle = 'rgba(15,10,40,0.85)';
        ctx.fillRect(-12, 0, 24, 18);
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(-14, -32);
        ctx.lineTo(0, -42);
        ctx.lineTo(14, -32);
        ctx.lineTo(14, 0);
        ctx.closePath();
        ctx.fill();
        // Aurora-glow halo behind
        const haloColors = ['#a0ffd8','#7adaff','#cf9aff','#a0ffd8','#7adaff','#cf9aff','#a0ffd8'];
        ctx.shadowColor = haloColors[i];
        ctx.shadowBlur = 20;
        ctx.strokeStyle = `rgba(${parseInt(haloColors[i].slice(1,3),16)},${parseInt(haloColors[i].slice(3,5),16)},${parseInt(haloColors[i].slice(5,7),16)},${alpha * 0.85})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -16, 22, 0, Math.PI * 2);
        ctx.stroke();
        // Tiny seated figure on throne (one-pixel-ish)
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(0, -8, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    });
  }

  _drawAuroraBeam(fromX, fromY, toX, toY, durSec) {
    this.fx.shape(durSec, (ctx, k) => {
      const reach = Math.min(1, k * 2);
      const fade = k > 0.65 ? Math.max(0, 1 - (k - 0.65) / 0.35) : 1;
      const alpha = reach * fade;
      const tx = fromX + (toX - fromX) * reach;
      const ty = fromY + (toY - fromY) * reach;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const grd = ctx.createLinearGradient(fromX, fromY, tx, ty);
      grd.addColorStop(0, `rgba(160,255,216,${alpha * 0.9})`);
      grd.addColorStop(0.4, `rgba(207,154,255,${alpha * 0.75})`);
      grd.addColorStop(0.8, `rgba(255,216,132,${alpha * 0.6})`);
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = grd;
      ctx.lineWidth = 4;
      ctx.shadowColor = '#a0ffd8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      // Bright core
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.restore();
    });
  }

  // ===== THE VERDANT COLOSSUS — 15 hits across 5 attack waves =============
  // Pure offensive flagship. ~32-second cutscene, longest in the game.
  _summonVerdantColossus(skill, dmgBase, targets) {
    const W = this.game.viewW || 800, H = this.game.viewH || 600;
    const cx = W / 2, cy = H / 2;
    const scale = 1.8;
    // 5 waves × 3 hits = 15 total per enemy.
    const WAVE_START = 12500;          // first wave begins here
    const WAVE_GAP = 3500;             // 3.5s between waves
    const HIT_GAP = 600;               // 600ms between hits within a wave
    const lastWaveAt = WAVE_START + 4 * WAVE_GAP;
    const lastHitAt = lastWaveAt + 2 * HIT_GAP + 500;
    const totalMs = lastHitAt + 2500;  // aftermath
    this._runSummonCutscene({
      impactAt: WAVE_START,
      totalMs,
      stages: [
        // 0.0s — Sceneline deepens to forest-twilight green-black; deep rumble
        { at: 0, fn: () => {
          this.fx.sceneTint('#0a1808', 0.93, totalMs / 1000 - 0.5, 0.6, 1.4);
          audio.play('rift');
          audio.play('bossThump');
          this.battleShake = Math.max(this.battleShake, 6);
        }},
        // 1.0s — Ground tremors — fissures spread across the field
        { at: 1000, fn: () => {
          this._drawGroundFissures(2.5);
          audio.play('bossThump');
          this.battleShake = Math.max(this.battleShake, 10);
        }},
        // 2.0s — Second deeper tremor; pebbles + dust spurt up
        { at: 2000, fn: () => {
          for (let i = 0; i < 80; i++) {
            const px = (Math.random() - 0.5) * W * 0.9;
            this.fx.spawn({
              x: cx + px, y: cy + H * 0.4,
              vx: (Math.random() - 0.5) * 60, vy: -120 - Math.random() * 80,
              gravity: 220, drag: 0.1,
              size: 2 + Math.random() * 2,
              color: i % 3 === 0 ? '#5a3a18' : i % 3 === 1 ? '#3a2810' : '#7a5a3a',
              life: 2.0, shrink: false, glow: 0,
            });
          }
          audio.play('bossThump');
          this.battleShake = Math.max(this.battleShake, 14);
        }},
        // 3.0s — Massive ground sigil draws — primordial roots-and-stone glyph
        { at: 3000, fn: () => {
          this.fx.groundSigil(cx, cy + 80, '#7aaa3a', 'nature', 10.0, scale * 4.0);
          this.fx.shockwave(cx, cy + 80, '#7aaa3a', 320 * scale, 1.5);
          this.fx.shockwave(cx, cy + 80, '#3a5a18', 220 * scale, 1.1);
          audio.play('aetherWail');
          this.battleShake = Math.max(this.battleShake, 18);
        }},
        // 4.5s — Colossus begins rising — silhouette assembles from below
        { at: 4500, fn: () => this._drawColossusRise(cx, cy, scale * 4.5, 8.0)},
        // 5.5s — Roots burst around the rising form
        { at: 5500, fn: () => {
          for (let i = 0; i < 14; i++) {
            const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.8;
            const sp = 150 + Math.random() * 100;
            this.fx.spawn({
              x: cx + (Math.random() - 0.5) * 200, y: cy + H * 0.35,
              vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
              gravity: 40, drag: 0.2,
              size: 4, color: '#5a3a18',
              life: 2.2, shrink: false, glow: 4,
            });
          }
          audio.play('thornCrack');
          audio.play('bossThump');
        }},
        // 7.0s — Colossus reaches full height — eyes blaze amber-green
        { at: 7000, fn: () => {
          this.fx.casterAura(cx, cy - 130 * scale, '#a8ff5a', 3.0, scale * 3.5);
          audio.play('aetherWail');
          audio.play('doomKnell');
          this.battleShake = Math.max(this.battleShake, 16);
        }},
        // 8.5s — Pre-impact roar — heavy chest pulse
        { at: 8500, fn: () => {
          this.fx.shockwave(cx, cy - 50 * scale, '#a8ff5a', 280 * scale, 1.4);
          this.fx.shockwave(cx, cy - 50 * scale, '#ffffff', 180 * scale, 1.0);
          audio.play('aetherWail');
          this.battleShake = Math.max(this.battleShake, 22);
        }},
        // 10.0s — Colossus inhales — energy gathers
        { at: 10000, fn: () => {
          this.fx.castCharge(cx, cy - 130 * scale, '#a8ff5a', scale * 4.0);
          audio.play('voidHum');
          this.battleShake = Math.max(this.battleShake, 16);
        }},
        // 11.5s — Final tension before WAVE 1
        { at: 11500, fn: () => {
          this.fx.screenFlash('#a8ff5a', 0.55, 0.4);
          audio.play('doomKnell');
          this.battleShake = Math.max(this.battleShake, 26);
        }},
      ],
    }, (isSkip) => {
      // SKIP — snap all 15 hits per target synchronously, brief flourish
      if (isSkip) {
        this._snapSummonDamage(skill, dmgBase, targets, (tx, ty) => {
          this.fx.natureBurst(tx, ty, scale * 1.2);
          this.fx.shockwave(tx, ty, '#a8ff5a', 180 * scale, 1.0);
          this.fx.shockwave(tx, ty, '#5a3a18', 120 * scale, 0.7);
          this.fx.starBurst(tx, ty, '#ffffff', scale * 1.2);
          this.fx.lingerScorch(tx, ty, '#7aaa3a', scale, 1.4);
        });
        this.fx.screenFlash('#a8ff5a', 0.8, 0.5);
        this.battleShake = Math.max(this.battleShake, 30);
        audio.play('doomKnell');
        audio.play('aetherWail');
        return;
      }
      // ===== 5 WAVES OF 3 HITS EACH =======================================
      this._scheduleColossusWaves(skill, dmgBase, targets, scale, cx, cy);
      // Final colossus afterglow + dissipation flourish
      const dissipateAt = lastHitAt + 600;
      this._scheduleStrike(dissipateAt - WAVE_START, () => {
        this.fx.screenFlash('#a8ff5a', 0.7, 0.6);
        this.fx.starBurst(cx, cy - 80 * scale, '#a8ff5a', scale * 2.4);
        this.fx.starBurst(cx, cy - 80 * scale, '#ffffff', scale * 1.6);
        for (let i = 0; i < 50; i++) {
          const px = (Math.random() - 0.5) * W;
          this.fx.spawn({
            x: cx + px, y: cy - H * 0.45,
            vx: (Math.random() - 0.5) * 40, vy: 50 + Math.random() * 40,
            gravity: 30, drag: 0.5,
            size: 3, color: i % 2 ? '#a8ff5a' : '#7aaa3a',
            life: 3.0, shrink: false, glow: 6,
          });
        }
        for (let r = 0; r < 6; r++) {
          this._scheduleStrike(r * 80, () => {
            this.fx.shockwave(cx, cy, r % 2 ? '#a8ff5a' : '#5a8a18', (200 + r * 120) * scale, 1.4);
          });
        }
        this.battleShake = Math.max(this.battleShake, 36);
        audio.play('doomKnell');
        audio.play('aetherWail');
        audio.play('crit');
      });
    }, () => {
      this._checkEnd() || this._endActorTurn();
    });
  }

  // Schedule the 5 attack waves of the Verdant Colossus. Each wave has its
  // own attack type, audio palette, and per-enemy impact FX.
  _scheduleColossusWaves(skill, dmgBase, targets, scale, cx, cy) {
    const WAVE_GAP = 3500;
    const HIT_GAP = 600;
    const dealHit = (t, fxFn) => {
      fxFn(t._screenX, t._screenY);
      this._applyDamage(this.actor, t, dmgBase * skill.power, skill.element, skill);
    };
    // Wave 1 — ROOT-SPEARS erupt from beneath each enemy
    const waveBaseT = (waveIdx) => waveIdx * WAVE_GAP;
    const scheduleWave = (waveIdx, waveLabel, perHitFx, waveSetup, waveAudio) => {
      const base = waveBaseT(waveIdx);
      this._scheduleStrike(base, () => {
        if (waveSetup) waveSetup();
        this._showWaveBanner(waveLabel, waveIdx);
        if (waveAudio) audio.play(waveAudio);
      });
      for (let h = 0; h < 3; h++) {
        this._scheduleStrike(base + 200 + h * HIT_GAP, () => {
          for (const t of targets) dealHit(t, perHitFx);
          this.battleShake = Math.max(this.battleShake, 20);
          audio.play(h === 2 ? 'crit' : 'thornCrack');
        });
      }
    };

    // WAVE 1: Root-spears (3 hits) — green-brown spike eruptions
    scheduleWave(0, 'ROOT-SPEARS', (x, y) => {
      this._drawRootSpear(x, y, scale * 1.4);
      this.fx.natureBurst(x, y, scale * 0.9);
      this.fx.shockwave(x, y, '#5a3a18', 110 * scale, 0.55);
      this.fx.shockwave(x, y, '#7aaa3a', 70 * scale, 0.4);
    }, () => {
      this.fx.screenFlash('#7aaa3a', 0.35, 0.25);
      this.battleShake = Math.max(this.battleShake, 18);
    }, 'aetherWail');

    // WAVE 2: Stone fists slam down from above (3 hits)
    scheduleWave(1, 'STONE FISTS', (x, y) => {
      this._drawStoneFist(x, y, scale * 1.3);
      this.fx.shockwave(x, y, '#7a5a3a', 140 * scale, 0.7);
      this.fx.shockwave(x, y, '#cdb88a', 90 * scale, 0.5);
      this.fx.starBurst(x, y, '#cdb88a', scale * 0.7);
      // Dust spurts on impact
      for (let i = 0; i < 12; i++) {
        const ang = Math.random() * Math.PI * 2;
        this.fx.spawn({
          x, y, vx: Math.cos(ang) * (80 + Math.random() * 80), vy: Math.sin(ang) * 40 - 50,
          gravity: 140, drag: 0.2,
          size: 3, color: i % 2 ? '#5a3a18' : '#7a5a3a',
          life: 1.4, shrink: false, glow: 2,
        });
      }
    }, () => {
      this.fx.screenFlash('#cdb88a', 0.4, 0.3);
      this.battleShake = Math.max(this.battleShake, 22);
    }, 'bossThump');

    // WAVE 3: Earthquake stomps — colossus footfalls (3 hits)
    scheduleWave(2, 'EARTHQUAKE STOMP', (x, y) => {
      this.fx.shockwave(x, y, '#a8ff5a', 180 * scale, 1.0);
      this.fx.shockwave(x, y, '#5a3a18', 130 * scale, 0.75);
      this.fx.shockwave(x, y, '#cdb88a', 90 * scale, 0.55);
      // Vertical dirt-and-leaf eruption
      for (let i = 0; i < 18; i++) {
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
        const sp = 100 + Math.random() * 100;
        this.fx.spawn({
          x, y,
          vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
          gravity: 140, drag: 0.15,
          size: 3.5, color: i % 3 === 0 ? '#a8ff5a' : i % 3 === 1 ? '#7a5a3a' : '#3a2810',
          life: 1.6, shrink: false, glow: 4,
        });
      }
    }, () => {
      this.fx.screenFlash('#a8ff5a', 0.5, 0.35);
      this.battleShake = Math.max(this.battleShake, 30);
    }, 'doomKnell');

    // WAVE 4: Verdant blooms — life-energy explosions (3 hits)
    scheduleWave(3, 'VERDANT BLOOM', (x, y) => {
      this.fx.natureBurst(x, y, scale * 1.3);
      this.fx.livingTree?.(x, y, '#3a5a2a', '#a8ff5a', scale * 0.8) || this.fx.natureBurst(x, y, scale * 0.7);
      this.fx.shockwave(x, y, '#7aff8a', 150 * scale, 0.9);
      this.fx.shockwave(x, y, '#a8ff5a', 100 * scale, 0.6);
      this.fx.starBurst(x, y, '#a8ff5a', scale * 1.0);
      // Petal storm
      for (let i = 0; i < 20; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 70 + Math.random() * 100;
        this.fx.spawn({
          x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 30,
          gravity: 30, drag: 0.45,
          size: 2.5, color: i % 3 === 0 ? '#a8ff5a' : i % 3 === 1 ? '#7aaa3a' : '#cdffae',
          life: 1.8, shrink: false, glow: 8,
        });
      }
    }, () => {
      this.fx.screenFlash('#a8ff5a', 0.55, 0.4);
      this.battleShake = Math.max(this.battleShake, 26);
    }, 'aetherWail');

    // WAVE 5: Final crushing slam — both arms together (3 hits)
    scheduleWave(4, 'COLOSSUS CRUSH', (x, y) => {
      this.fx.starBurst(x, y, '#ffffff', scale * 1.5);
      this.fx.starBurst(x, y, '#a8ff5a', scale * 1.2);
      this.fx.blackStar(x, y, scale * 0.8);
      this.fx.fireBloom(x, y, scale * 0.7);  // impact ignites debris
      this.fx.shockwave(x, y, '#ffffff', 220 * scale, 1.2);
      this.fx.shockwave(x, y, '#a8ff5a', 160 * scale, 0.9);
      this.fx.shockwave(x, y, '#5a3a18', 110 * scale, 0.65);
      this.fx.lingerScorch(x, y, '#7aaa3a', scale * 1.2, 2.5);
      // Heavy debris kicked outward
      for (let i = 0; i < 28; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 130 + Math.random() * 140;
        this.fx.spawn({
          x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 50,
          gravity: 200, drag: 0.18,
          size: 3 + Math.random() * 2,
          color: i % 4 === 0 ? '#ffffff' : i % 4 === 1 ? '#a8ff5a' : i % 4 === 2 ? '#cdb88a' : '#5a3a18',
          life: 1.8, shrink: false, glow: 6,
        });
      }
    }, () => {
      this.fx.screenFlash('#ffffff', 0.8, 0.55);
      this.fx.screenFlash('#a8ff5a', 0.5, 0.35);
      this.battleShake = Math.max(this.battleShake, 38);
    }, 'doomKnell');
  }

  // Draws the colossus silhouette rising from below and holding position
  _drawColossusRise(cx, cy, scale, durSec) {
    const H = this.game.viewH || 600;
    this.fx.shape(durSec, (ctx, k) => {
      const fadeIn = Math.min(1, k / 0.18);
      const fadeOut = k > 0.88 ? Math.max(0, 1 - (k - 0.88) / 0.12) : 1;
      const alpha = fadeIn * fadeOut;
      // Rises from below the screen for the first 35% of duration, then holds
      const rise = k < 0.35 ? (1 - k / 0.35) * 200 : 0;
      const breath = Math.sin(k * 6) * 1.8;
      ctx.save();
      ctx.translate(cx, cy + 30 + rise + breath);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      // ---- Body — moss-covered stone torso ----
      const stoneGrad = ctx.createLinearGradient(0, -60, 0, 60);
      stoneGrad.addColorStop(0, '#2a3a1a');
      stoneGrad.addColorStop(0.5, '#3a4a2a');
      stoneGrad.addColorStop(1, '#1a2a0a');
      ctx.fillStyle = stoneGrad;
      // Chest — heavy trapezoid
      ctx.beginPath();
      ctx.moveTo(-30, -50);
      ctx.lineTo(30, -50);
      ctx.lineTo(38, 30);
      ctx.lineTo(-38, 30);
      ctx.closePath();
      ctx.fill();
      // Shoulders — chunky stone slabs
      ctx.beginPath();
      ctx.ellipse(-32, -42, 14, 10, 0, 0, Math.PI * 2);
      ctx.ellipse(32, -42, 14, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      // Arms hanging at sides — root-and-stone
      ctx.strokeStyle = '#3a2810';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-36, -36); ctx.quadraticCurveTo(-44, 0, -38, 40);
      ctx.moveTo(36, -36); ctx.quadraticCurveTo(44, 0, 38, 40);
      ctx.stroke();
      // Fists at end of arms
      ctx.fillStyle = '#5a3a18';
      ctx.beginPath();
      ctx.arc(-38, 42, 9, 0, Math.PI * 2);
      ctx.arc(38, 42, 9, 0, Math.PI * 2);
      ctx.fill();
      // ---- Head — humanoid stone crown of roots ----
      ctx.fillStyle = '#2a3a1a';
      ctx.beginPath();
      ctx.ellipse(0, -70, 16, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      // Crown of branching roots
      ctx.strokeStyle = '#3a2810';
      ctx.lineWidth = 3;
      const drawCrownBranch = (side) => {
        const s = side;
        ctx.beginPath();
        ctx.moveTo(s * 8, -84);
        ctx.lineTo(s * 18, -100);
        ctx.lineTo(s * 14, -116);
        ctx.moveTo(s * 18, -100);
        ctx.lineTo(s * 28, -106);
        ctx.lineTo(s * 32, -120);
        ctx.moveTo(s * 18, -100);
        ctx.lineTo(s * 24, -90);
        ctx.stroke();
      };
      drawCrownBranch(-1);
      drawCrownBranch(1);
      // ---- Glowing amber-green eyes ----
      const eyePulse = 0.7 + 0.3 * Math.sin(k * 12);
      ctx.shadowColor = '#a8ff5a';
      ctx.shadowBlur = 14;
      ctx.fillStyle = `rgba(168,255,90,${alpha * eyePulse})`;
      ctx.beginPath();
      ctx.arc(-5, -72, 2.4, 0, Math.PI * 2);
      ctx.arc(5, -72, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // ---- Vine details across the chest — glowing seams ----
      ctx.strokeStyle = `rgba(168,255,90,${alpha * 0.75})`;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#a8ff5a';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(-22, -30); ctx.quadraticCurveTo(-8, -10, 10, 15);
      ctx.moveTo(20, -34); ctx.quadraticCurveTo(0, -8, -12, 22);
      ctx.stroke();
      // ---- Legs trailing into ground/roots ----
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#3a2810';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(-15, 30); ctx.lineTo(-12, 80);
      ctx.moveTo(15, 30); ctx.lineTo(12, 80);
      ctx.stroke();
      // Roots from feet spreading into ground
      ctx.lineWidth = 3;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i < 0 ? -12 : 12, 80);
        ctx.lineTo(i * 9, 110 + Math.abs(i) * 6);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  // Ground fissures spreading across the field — used in pre-impact buildup
  _drawGroundFissures(durSec) {
    const W = this.game.viewW || 800, H = this.game.viewH || 600;
    const fissures = [];
    for (let i = 0; i < 11; i++) {
      const startX = Math.random() * W;
      const startY = H * 0.55 + Math.random() * H * 0.35;
      const segs = 4 + Math.floor(Math.random() * 4);
      const path = [[startX, startY]];
      let ang = (Math.random() - 0.5) * 0.4;
      for (let s = 0; s < segs; s++) {
        const len = 30 + Math.random() * 50;
        ang += (Math.random() - 0.5) * 0.8;
        const px = path[path.length - 1][0] + Math.cos(ang) * len;
        const py = path[path.length - 1][1] + Math.sin(ang) * len;
        path.push([px, py]);
      }
      fissures.push({ path, delay: Math.random() * 0.4 });
    }
    this.fx.shape(durSec, (ctx, k) => {
      ctx.save();
      for (const f of fissures) {
        const localK = (k - f.delay) / (1 - f.delay);
        if (localK < 0) continue;
        const fade = localK < 0.25 ? localK / 0.25 : localK > 0.7 ? Math.max(0, 1 - (localK - 0.7) / 0.3) : 1;
        const drawN = Math.min(f.path.length, Math.ceil(f.path.length * localK * 2));
        if (drawN < 2) continue;
        // Outer dark fissure
        ctx.strokeStyle = `rgba(20,12,4,${fade * 0.9})`;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(f.path[0][0], f.path[0][1]);
        for (let i = 1; i < drawN; i++) ctx.lineTo(f.path[i][0], f.path[i][1]);
        ctx.stroke();
        // Inner green glow line
        ctx.strokeStyle = `rgba(168,255,90,${fade * 0.85})`;
        ctx.lineWidth = 1.2;
        ctx.shadowColor = '#a8ff5a';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(f.path[0][0], f.path[0][1]);
        for (let i = 1; i < drawN; i++) ctx.lineTo(f.path[i][0], f.path[i][1]);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    });
  }

  // Per-enemy root spear erupting from beneath
  _drawRootSpear(cx, cy, scale) {
    this.fx.shape(0.7, (ctx, k) => {
      const rise = Math.min(1, k * 2.5);
      const fade = k > 0.65 ? Math.max(0, 1 - (k - 0.65) / 0.35) : 1;
      const alpha = fade;
      const h = 70 * scale * rise;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.globalAlpha = alpha;
      // Spear body — gnarled brown-green root
      ctx.strokeStyle = '#3a2810';
      ctx.lineWidth = 8 * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 30);
      ctx.quadraticCurveTo(4, -h * 0.4, 0, -h);
      ctx.stroke();
      // Spear point
      ctx.fillStyle = '#5a3a18';
      ctx.beginPath();
      ctx.moveTo(0, -h - 5 * scale);
      ctx.lineTo(-8 * scale, -h + 12 * scale);
      ctx.lineTo(8 * scale, -h + 12 * scale);
      ctx.closePath();
      ctx.fill();
      // Glowing vine wrap
      ctx.strokeStyle = `rgba(168,255,90,${alpha * 0.85})`;
      ctx.lineWidth = 1.5 * scale;
      ctx.shadowColor = '#a8ff5a';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        const x = Math.sin(t * Math.PI * 4) * 6 * scale;
        const y = -t * h + 30;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    });
  }

  // Per-enemy stone fist slamming from above
  _drawStoneFist(cx, cy, scale) {
    this.fx.shape(0.7, (ctx, k) => {
      const drop = Math.min(1, k * 3.5);
      const fade = k > 0.65 ? Math.max(0, 1 - (k - 0.65) / 0.35) : 1;
      const fistY = -120 * scale + drop * 130 * scale;
      const alpha = Math.min(1, k * 4) * fade;
      ctx.save();
      ctx.translate(cx, cy + fistY);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      // Forearm
      ctx.fillStyle = '#3a2810';
      ctx.fillRect(-14, -55, 28, 50);
      // Fist (closed hand)
      ctx.fillStyle = '#5a3a18';
      ctx.beginPath();
      ctx.arc(0, -2, 22, 0, Math.PI * 2);
      ctx.fill();
      // Knuckle bumps
      ctx.fillStyle = '#3a2810';
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.arc(i * 7, 8, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      // Moss patches
      ctx.fillStyle = `rgba(168,255,90,${alpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(-10, -3, 6, 0, Math.PI * 2);
      ctx.arc(8, 6, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // Top-of-screen banner showing the wave label, like Sundered Heart's
  // fragment names. Uses wave index to color slightly differently per wave.
  _showWaveBanner(label, waveIdx) {
    const W = this.game.viewW || 800;
    const colors = ['#7aaa3a','#cdb88a','#a8ff5a','#7aff8a','#ffffff'];
    const color = colors[waveIdx] || '#a8ff5a';
    this.fx.shape(1.8, (ctx, k) => {
      const slideIn = Math.min(1, k * 3.5);
      const slideOut = k > 0.78 ? Math.max(0, 1 - (k - 0.78) / 0.22) : 1;
      const alpha = slideIn * slideOut;
      const y = 88 - (1 - slideIn) * 30;
      ctx.save();
      ctx.globalAlpha = alpha;
      // Backing
      ctx.fillStyle = 'rgba(10,18,6,0.88)';
      ctx.font = 'bold 20px system-ui';
      const tw = ctx.measureText(label).width + 36;
      ctx.fillRect(W / 2 - tw / 2, y - 22, tw, 36);
      // Glow border
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.strokeRect(W / 2 - tw / 2, y - 22, tw, 36);
      // Label text
      ctx.shadowBlur = 0;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, W / 2, y - 3);
      // "WAVE N/5" subtitle below the main label, smaller
      ctx.font = 'bold 10px system-ui';
      ctx.fillStyle = `rgba(${parseInt(color.slice(1,3),16)},${parseInt(color.slice(3,5),16)},${parseInt(color.slice(5,7),16)},${alpha * 0.7})`;
      ctx.fillText(`WAVE ${waveIdx + 1} / 5`, W / 2, y + 18);
      ctx.restore();
    });
  }

  // ---- IMPACT-ONLY SIGNATURES (used by skill paths outside the summon
  // cutscene, e.g. counter-summon spell or future direct casts) ------------

  _sigAshCrownedStag(x, y, scale) {
    // The Ash-Crowned Stag charges out of a darkening sky — antlered
    // silhouette wreathed in cinders, ground splits in fire, ember rain
    // converges, then the impact erupts.
    const W = this.game.viewW || 800, H = this.game.viewH || 600;
    this.fx.sceneTint('#5a1a08', 0.45, 1.8, 0.25, 0.6);
    this.fx.screenFlash('#ff5a3b', 0.55, 0.35);
    this.battleShake = Math.max(this.battleShake, 22);

    // Massive antlered silhouette rises from the ground, holds, fades.
    this.fx.shape(2.0, (ctx, k) => {
      const rise = -k * 80 * scale;
      const sx = scale * 1.6;
      const alpha = k < 0.15 ? (k / 0.15) : k > 0.75 ? Math.max(0, 1 - (k - 0.75) / 0.25) : 1;
      ctx.save();
      ctx.translate(x, y + rise + 30 * scale);
      ctx.scale(sx, sx);
      ctx.globalAlpha = alpha;
      // Body — heavy stag torso
      ctx.fillStyle = '#0d0405';
      ctx.beginPath();
      ctx.ellipse(0, 28, 38, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      // Neck + head
      ctx.beginPath();
      ctx.ellipse(-12, 6, 12, 18, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-22, -8, 14, 10, -0.2, 0, Math.PI * 2);
      ctx.fill();
      // Legs (front + back, paired)
      ctx.fillRect(-22, 40, 5, 28);
      ctx.fillRect(-10, 42, 5, 28);
      ctx.fillRect(16, 42, 5, 28);
      ctx.fillRect(26, 40, 5, 28);
      // Antlers — branching, fire-lit edge
      ctx.strokeStyle = '#1a0408';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      const drawAntler = (side) => {
        const s = side;
        ctx.beginPath();
        ctx.moveTo(-22 + s * 6, -16);
        ctx.lineTo(-22 + s * 18, -36);
        ctx.lineTo(-22 + s * 14, -54);
        ctx.moveTo(-22 + s * 18, -36);
        ctx.lineTo(-22 + s * 32, -42);
        ctx.lineTo(-22 + s * 36, -56);
        ctx.moveTo(-22 + s * 18, -36);
        ctx.lineTo(-22 + s * 28, -28);
        ctx.stroke();
      };
      drawAntler(-1);
      drawAntler(1);
      // Fire-glow rim around antlers
      ctx.strokeStyle = `rgba(255,138,59,${0.7 * (1 - k * 0.5)})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = '#ff5a20';
      ctx.shadowBlur = 14;
      drawAntler(-1);
      drawAntler(1);
      // Eye-glow
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(255,200,80,${alpha})`;
      ctx.beginPath();
      ctx.arc(-30, -8, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Cinder rain converging from above onto target zone
    for (let i = 0; i < 50; i++) {
      const ox = (Math.random() - 0.5) * W * 0.8;
      this.fx.spawn({
        x: x + ox,
        y: y - H * 0.5 - Math.random() * 60,
        vx: -ox * 0.3, vy: 240 + Math.random() * 120,
        gravity: 30, drag: 0.1,
        size: 2 + Math.random() * 2,
        color: i % 3 === 0 ? '#ffd84d' : i % 3 === 1 ? '#ff8a3b' : '#ff5a20',
        life: 1.2, shrink: true, glow: 10,
      });
    }

    // Ground crack — fire bursts across screen at three points
    for (let i = -1; i <= 1; i++) {
      const cx = x + i * 80 * scale;
      this.fx.infernoVortex(cx, y, '#ffae3b', scale * 1.0);
      this.fx.lingerScorch(cx, y, '#ff5a20', scale * 1.0, 1.8);
      this.fx.shockwave(cx, y, '#ff8a3b', 100 * scale, 0.7);
    }

    // Central charge: massive fire bloom + concentric shockwave rings
    this.fx.fireBloom(x, y, scale * 2.0);
    this.fx.shockwave(x, y, '#ffae3b', 220 * scale, 1.0);
    this.fx.shockwave(x, y, '#ff5a20', 140 * scale, 0.8);
    this.fx.shockwave(x, y, '#ffffff', 80 * scale, 0.55);
    this.fx.starBurst(x, y, '#ffd84d', scale * 1.5);

    // Hoofbeat-then-impact audio buildup
    audio.play('bossThump');
    audio.play('ember');
    audio.play('rift');
    audio.play('doomKnell');
    audio.play('aetherWail');
    // Secondary impact pulse — sound of hooves striking
    setTimeout(() => audio.play('bossThump'), 220);
    setTimeout(() => audio.play('crit'), 450);
  }

  _sigDrownedChoir(x, y, scale) {
    // Voices of the lost rise from below — multiple ghostly figures
    // emerge, mouths open in silent song. Resonance ripples outward;
    // sound itself becomes damage. Deep blue sceneTint underneath.
    const W = this.game.viewW || 800;
    this.fx.sceneTint('#08183a', 0.55, 2.0, 0.3, 0.7);
    this.fx.screenFlash('#7adaff', 0.45, 0.30);
    this.battleShake = Math.max(this.battleShake, 18);

    // Chorus of figures rising from below — 6 ghostly silhouettes
    const figures = 6;
    this.fx.shape(2.2, (ctx, k) => {
      ctx.save();
      ctx.translate(x, y);
      const alpha = k < 0.2 ? (k / 0.2) : k > 0.75 ? Math.max(0, 1 - (k - 0.75) / 0.25) : 1;
      for (let i = 0; i < figures; i++) {
        const fx = (i - (figures - 1) / 2) * 50 * scale;
        const rise = -k * 110 * scale + 60 * scale;
        ctx.save();
        ctx.translate(fx, rise);
        ctx.globalAlpha = alpha * 0.78;
        // Cloaked body — tapering robe with rounded head
        const grd = ctx.createLinearGradient(0, -45, 0, 50);
        grd.addColorStop(0, 'rgba(180,225,255,0.0)');
        grd.addColorStop(0.3, `rgba(140,200,240,${alpha * 0.85})`);
        grd.addColorStop(0.8, `rgba(60,120,180,${alpha * 0.9})`);
        grd.addColorStop(1, 'rgba(20,40,80,0.0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.moveTo(-22, 50);
        ctx.bezierCurveTo(-30, 0, -16, -30, 0, -38);
        ctx.bezierCurveTo(16, -30, 30, 0, 22, 50);
        ctx.closePath();
        ctx.fill();
        // Faintly luminous head
        ctx.fillStyle = `rgba(220,235,255,${alpha * 0.6})`;
        ctx.shadowColor = '#7adaff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, -28, 11, 0, Math.PI * 2);
        ctx.fill();
        // Open mouth — singing void
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(20,40,80,${alpha})`;
        ctx.beginPath();
        ctx.ellipse(0, -22, 3, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    });

    // Water columns at each figure position
    for (let i = 0; i < figures; i++) {
      const fx = x + (i - (figures - 1) / 2) * 50 * scale;
      this.fx.waterColumn(fx, y, scale * 0.9);
    }

    // Concentric resonance rings — sound waves visualized
    for (let r = 0; r < 5; r++) {
      setTimeout(() => {
        this.fx.shockwave(x, y, r % 2 === 0 ? '#7adaff' : '#cfeaff', (90 + r * 50) * scale, 0.7);
      }, r * 120);
    }

    // Drifting musical notes — the song made visible
    this.fx.musicalNotes(x, y, '#cfeaff', scale * 1.3);
    setTimeout(() => this.fx.musicalNotes(x, y, '#7adaff', scale * 1.0), 300);

    // Pale starlight peak + dark central core
    this.fx.starBurst(x, y, '#dff3ff', scale * 1.4);
    this.fx.blackStar(x, y, scale * 0.5);

    // Audio — chorus building into a wail
    audio.play('choirSwell');
    audio.play('rift');
    setTimeout(() => audio.play('choirSwell'), 250);
    setTimeout(() => audio.play('chime'), 500);
    setTimeout(() => audio.play('aetherWail'), 700);
    setTimeout(() => audio.play('doomKnell'), 900);
  }

  _sigLoomMother(x, y, scale) {
    // The Loom-Mother descends — eight-legged silhouette overhead, silver
    // threads weave a web that lashes downward and binds all enemies.
    const W = this.game.viewW || 800, H = this.game.viewH || 600;
    this.fx.sceneTint('#1a0830', 0.55, 2.0, 0.3, 0.7);
    this.fx.screenFlash('#a060ff', 0.42, 0.32);
    this.battleShake = Math.max(this.battleShake, 20);

    // Eight-legged silhouette descends from above
    this.fx.shape(2.2, (ctx, k) => {
      const drop = -180 * scale + k * 130 * scale;
      const sx = scale * 1.5;
      const alpha = k < 0.18 ? (k / 0.18) : k > 0.78 ? Math.max(0, 1 - (k - 0.78) / 0.22) : 1;
      ctx.save();
      ctx.translate(x, y + drop);
      ctx.scale(sx, sx);
      ctx.globalAlpha = alpha;
      // Abdomen + cephalothorax
      ctx.fillStyle = '#0a0418';
      ctx.beginPath();
      ctx.ellipse(0, 14, 26, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, -8, 18, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      // Eight legs — bent, articulated
      ctx.strokeStyle = '#1a0830';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      const legAngles = [
        { ang: -1.4, len: 36, bend: 0.6 }, { ang: -0.9, len: 42, bend: 0.5 },
        { ang: -0.5, len: 44, bend: 0.5 }, { ang: -0.2, len: 38, bend: 0.4 },
        { ang:  0.2, len: 38, bend: 0.4 }, { ang:  0.5, len: 44, bend: 0.5 },
        { ang:  0.9, len: 42, bend: 0.5 }, { ang:  1.4, len: 36, bend: 0.6 },
      ];
      for (const l of legAngles) {
        const mx = Math.cos(l.ang) * l.len * 0.5;
        const my = Math.sin(l.ang) * l.len * 0.5 - 10;
        const ex = Math.cos(l.ang) * l.len + Math.cos(l.ang + l.bend) * l.len * 0.5;
        const ey = Math.sin(l.ang) * l.len + 14 + Math.abs(Math.sin(l.ang)) * 10;
        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.quadraticCurveTo(mx, my, ex, ey);
        ctx.stroke();
      }
      // Eight glowing violet eyes — clustered
      ctx.fillStyle = `rgba(192,120,255,${alpha})`;
      ctx.shadowColor = '#c060ff';
      ctx.shadowBlur = 8;
      const eyes = [[-8,-12],[-3,-14],[3,-14],[8,-12],[-6,-7],[-2,-9],[2,-9],[6,-7]];
      for (const [ex, ey] of eyes) {
        ctx.beginPath();
        ctx.arc(ex, ey, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.restore();
    });

    // Silver silk web pattern — radial threads from the spider down
    this.fx.shape(1.6, (ctx, k) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = (1 - k) * 0.8;
      ctx.strokeStyle = '#e8d8ff';
      ctx.lineWidth = 1;
      ctx.shadowColor = '#c0a0ff';
      ctx.shadowBlur = 6;
      const threads = 12;
      const reach = (60 + k * 200) * scale;
      for (let i = 0; i < threads; i++) {
        const a = (i / threads) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, -40 * scale);
        ctx.lineTo(Math.cos(a) * reach, Math.sin(a) * reach * 0.6 + 20);
        ctx.stroke();
      }
      // Spiraling silk threads — the web tightens
      ctx.beginPath();
      for (let i = 0; i <= 64; i++) {
        const t = i / 64;
        const a = t * Math.PI * 6 + k * Math.PI;
        const r = (10 + t * reach * 0.7);
        const px = Math.cos(a) * r, py = Math.sin(a) * r * 0.6 + 20;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
    });

    // Dark rifts at three positions — web-binding visual
    for (let i = -1; i <= 1; i++) {
      this.fx.darkRift(x + i * 70 * scale, y, scale * 0.9);
    }

    // Central impact — violet starburst + blackStar
    this.fx.starBurst(x, y, '#c0a0ff', scale * 1.4);
    this.fx.blackStar(x, y, scale * 0.6);
    this.fx.shockwave(x, y, '#a060ff', 200 * scale, 0.9);
    this.fx.shockwave(x, y, '#c0a0ff', 130 * scale, 0.75);

    // Drifting silk motes — bound enemies
    for (let i = 0; i < 24; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 90;
      this.fx.spawn({
        x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 20,
        gravity: 8, drag: 0.45,
        size: 1.8, color: '#e8d8ff',
        life: 1.4, shrink: true, glow: 8,
      });
    }

    // Audio — humming void + chorus of binding threads
    audio.play('voidHum');
    audio.play('rift');
    setTimeout(() => audio.play('aetherWail'), 280);
    setTimeout(() => audio.play('glassShatter'), 520);
    setTimeout(() => audio.play('doomKnell'), 760);
  }

  // ---- Impact-only signatures for the 6 story-tier summons (counter use)
  _sigEchoFirstSong(x, y, scale) {
    this.fx.sceneTint('#fff5d8', 0.35, 1.4, 0.2, 0.5);
    this.fx.starBurst(x, y, '#ffd884', scale * 1.6);
    this.fx.starBurst(x, y, '#ffffff', scale * 1.0);
    this.fx.holyPillar(x, y, scale * 1.2);
    this.fx.shockwave(x, y, '#fff5d8', 180 * scale, 0.9);
    this.fx.shockwave(x, y, '#ffd884', 110 * scale, 0.65);
    this.battleShake = Math.max(this.battleShake, 16);
    audio.play('choirSwell'); audio.play('chime');
    audio.play('aetherWail'); audio.play('doomKnell');
  }

  _sigVeilCrawler(x, y, scale) {
    this.fx.sceneTint('#1a0830', 0.45, 1.4, 0.2, 0.5);
    this.fx.darkRift(x, y, scale * 1.4);
    this.fx.darkRift(x + 12, y - 8, scale * 0.9);
    this.fx.blackStar(x, y, scale * 0.8);
    this.fx.shockwave(x, y, '#7a1a7a', 170 * scale, 0.85);
    this.fx.shockwave(x, y, '#c060ff', 100 * scale, 0.6);
    this.battleShake = Math.max(this.battleShake, 18);
    audio.play('voidHum'); audio.play('aetherWail');
    audio.play('doomKnell'); audio.play('glassShatter');
  }

  _sigHollowKing(x, y, scale) {
    this.fx.sceneTint('#0a0418', 0.5, 1.4, 0.2, 0.5);
    this.fx.holyPillar(x, y, scale * 1.4);
    this.fx.darkRift(x, y, scale * 0.85);
    this.fx.starBurst(x, y, '#ffd884', scale * 1.5);
    this.fx.starBurst(x, y, '#a060ff', scale * 1.0);
    this.fx.shockwave(x, y, '#ffd884', 180 * scale, 0.9);
    this.fx.shockwave(x, y, '#a060ff', 110 * scale, 0.65);
    this.battleShake = Math.max(this.battleShake, 22);
    audio.play('aetherWail'); audio.play('doomKnell');
    audio.play('crit'); audio.play('chime');
  }

  _sigSapphireTide(x, y, scale) {
    this.fx.sceneTint('#04143a', 0.45, 1.4, 0.2, 0.5);
    this.fx.waterColumn(x, y, scale * 1.8);
    this.fx.shatterRain(x, y, '#cfeaff', scale * 1.4);
    this.fx.shockwave(x, y, '#3b88ff', 200 * scale, 1.0);
    this.fx.shockwave(x, y, '#ffffff', 110 * scale, 0.65);
    this.fx.starBurst(x, y, '#ffffff', scale * 1.3);
    this.battleShake = Math.max(this.battleShake, 18);
    audio.play('aetherWail'); audio.play('crit');
    audio.play('glassShatter'); audio.play('doomKnell');
  }

  _sigSunderedHeart(x, y, scale) {
    this.fx.sceneTint('#2a0418', 0.5, 1.4, 0.2, 0.5);
    this.fx.fireBloom(x, y, scale * 1.0);
    this.fx.darkRift(x, y, scale * 0.9);
    this.fx.shatterRain(x, y, '#a060ff', scale * 0.9);
    this.fx.starBurst(x, y, '#ff2a6a', scale * 1.5);
    this.fx.starBurst(x, y, '#ffffff', scale * 1.0);
    this.fx.blackStar(x, y, scale * 0.7);
    this.fx.shockwave(x, y, '#ff2a6a', 200 * scale, 1.0);
    this.fx.shockwave(x, y, '#a060ff', 130 * scale, 0.7);
    this.battleShake = Math.max(this.battleShake, 24);
    audio.play('aetherWail'); audio.play('doomKnell');
    audio.play('glassShatter'); audio.play('rift');
  }

  _sigAuroraThrone(x, y, scale) {
    this.fx.sceneTint('#04183a', 0.4, 1.4, 0.2, 0.5);
    this.fx.holyPillar(x, y, scale * 1.2);
    this.fx.lightningBolt(x, y, -10, { branches: 3 });
    this.fx.starBurst(x, y, '#a0ffd8', scale * 1.4);
    this.fx.starBurst(x, y, '#ffffff', scale * 1.0);
    this.fx.shockwave(x, y, '#a0ffd8', 180 * scale, 0.9);
    this.fx.shockwave(x, y, '#cf9aff', 110 * scale, 0.65);
    this.battleShake = Math.max(this.battleShake, 18);
    audio.play('chime'); audio.play('thunderclap');
    audio.play('choirSwell'); audio.play('aetherWail');
  }

  _sigVerdantColossus(x, y, scale) {
    this.fx.sceneTint('#0a1808', 0.5, 1.6, 0.2, 0.5);
    this.fx.natureBurst(x, y, scale * 1.4);
    this.fx.starBurst(x, y, '#a8ff5a', scale * 1.5);
    this.fx.starBurst(x, y, '#ffffff', scale * 1.0);
    this.fx.blackStar(x, y, scale * 0.7);
    this.fx.shockwave(x, y, '#a8ff5a', 220 * scale, 1.1);
    this.fx.shockwave(x, y, '#5a3a18', 150 * scale, 0.8);
    this.fx.shockwave(x, y, '#cdb88a', 90 * scale, 0.55);
    this.fx.lingerScorch(x, y, '#7aaa3a', scale * 1.0, 1.8);
    this.battleShake = Math.max(this.battleShake, 28);
    audio.play('doomKnell'); audio.play('aetherWail');
    audio.play('bossThump'); audio.play('thornCrack');
  }

  _playComboSignature(skill, x, y, scale) {
    if (!skill?.id) return;
    const id = skill.id;
    // ---- SUMMONS — flagship cinematics with bespoke creature silhouettes ----
    if (id === 'ashCrownedStag') { this._sigAshCrownedStag(x, y, scale); return; }
    if (id === 'drownedChoir')   { this._sigDrownedChoir(x, y, scale); return; }
    if (id === 'loomMother')     { this._sigLoomMother(x, y, scale); return; }
    if (id === 'echoFirstSong')  { this._sigEchoFirstSong(x, y, scale); return; }
    if (id === 'veilCrawler')    { this._sigVeilCrawler(x, y, scale); return; }
    if (id === 'hollowKing')     { this._sigHollowKing(x, y, scale); return; }
    if (id === 'sapphireTide')   { this._sigSapphireTide(x, y, scale); return; }
    if (id === 'sunderedHeart')  { this._sigSunderedHeart(x, y, scale); return; }
    if (id === 'auroraThrone')   { this._sigAuroraThrone(x, y, scale); return; }
    if (id === 'verdantColossus') { this._sigVerdantColossus(x, y, scale); return; }
    // Endgame trio cataclysm — config-driven; bespoke palette per spell.
    const trio = TRIO_SIGNATURES[id];
    if (trio) { this._playTrioSignature(x, y, scale, trio); return; }
    // ---- Fire-family combos -------------------------------------------------
    if (id === 'causticCataract') {
      // Fire + water + poison — boiling toxic flood. Element-fusion layer
      // (waterColumn + poisonCloud + infernoVortex) then the cataclysm.
      this.fx.waterColumn(x, y, scale * 1.3);
      this.fx.poisonCloud(x, y, scale * 1.2);
      this.fx.infernoVortex(x, y, '#ffae3b', scale * 0.8);
      this.fx.shockwave(x, y, '#9aff4d', 160 * scale, 0.9);
      this.fx.shockwave(x, y, '#3bb6c8', 110 * scale, 0.7);
      this.fx.shockwave(x, y, '#ff8a3b', 70 * scale, 0.5);
      // Bubbling acid froth — sickly green-yellow droplets fountaining up
      for (let i = 0; i < 26; i++) {
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
        const sp = 70 + Math.random() * 110;
        this.fx.spawn({
          x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
          gravity: 90, drag: 0.35,
          size: 3 + Math.random() * 3, color: i % 3 === 0 ? '#ffd84d' : '#9aff4d',
          life: 0.9 + Math.random() * 0.5, shrink: true, glow: 8,
        });
      }
      // Hissing steam clouds — venomous tint
      for (let i = 0; i < 18; i++) {
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.1;
        const sp = 50 + Math.random() * 80;
        this.fx.spawn({
          x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
          gravity: -20, drag: 0.45,
          size: 8 + Math.random() * 5, color: 'rgba(180,220,140,0.55)',
          life: 1.0 + Math.random() * 0.4, shrink: false, glow: 4,
        });
      }
      // --- Cataclysm layer ---
      this.fx.starBurst(x, y, '#ddffdd', scale * 1.3);
      this.fx.blackStar(x, y, scale * 0.55);
      this.fx.screenFlash('#9aff4d', 0.38, 0.32);
      this.battleShake = Math.max(this.battleShake, 16);
      audio.play('swarmHiss');
      audio.play('sporeBurst');
      audio.play('doomKnell');
      audio.play('aetherWail');
      return;
    }
    if (id === 'tideTriad') {
      // Three elements crashing at once. Element-fusion layer (water/ice/fire)
      // sits underneath, then the cataclysm layer (starBurst + blackStar +
      // doomKnell/aetherWail) reads as "this is endgame."
      // --- Element-fusion layer ---
      this.fx.waterColumn(x, y, scale * 1.4);
      this.fx.shatterRain(x, y, '#cfeaff', scale * 1.0);
      this.fx.infernoVortex(x, y, '#ffae3b', scale * 0.85);
      this.fx.shockwave(x, y, '#7adaff', 160 * scale, 0.9);
      this.fx.shockwave(x, y, '#3bb6c8', 110 * scale, 0.7);
      this.fx.shockwave(x, y, '#ff8a3b', 70 * scale, 0.5);
      // Dense drifting steam — denser than before for the cataclysm read
      for (let i = 0; i < 28; i++) {
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.3;
        const sp = 60 + Math.random() * 100;
        this.fx.spawn({
          x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
          gravity: -18, drag: 0.45,
          size: 8 + Math.random() * 6, color: 'rgba(200,225,240,0.65)',
          life: 1.0 + Math.random() * 0.5, shrink: false, glow: 4,
        });
      }
      // Tri-color crystalline ice shards crossed with cinder embers
      for (let i = 0; i < 18; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 90 + Math.random() * 140;
        const fire = Math.random() < 0.4;
        this.fx.spawn({
          x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
          gravity: 60, drag: 0.3,
          size: 2.5, color: fire ? '#ffae3b' : '#cfeaff',
          life: 0.7 + Math.random() * 0.3, shrink: true, glow: 10,
        });
      }
      // --- Cataclysm layer (Prisma-Burst-class) ---
      this.fx.starBurst(x, y, '#ffffff', scale * 1.4);
      this.fx.blackStar(x, y, scale * 0.55);
      this.fx.screenFlash('#cfeaff', 0.42, 0.32);
      this.battleShake = Math.max(this.battleShake, 16);
      audio.play('glassShatter');
      audio.play('sporeBurst');
      audio.play('doomKnell');
      audio.play('aetherWail');
      return;
    }
    if (id === 'steamBurst' || id === 'scaldGeyser' || id === 'steamGeyser') {
      this.fx.infernoVortex(x, y, '#ffae3b', scale);
      // Steam burst — billowing white-grey cloud
      for (let i = 0; i < 20; i++) {
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.0;
        const sp = 50 + Math.random() * 80;
        this.fx.spawn({
          x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
          gravity: -20, drag: 0.5,
          size: 8 + Math.random() * 6, color: 'rgba(220,220,230,0.6)',
          life: 0.9 + Math.random() * 0.4, shrink: false,
        });
      }
      audio.play('sporeBurst');
    } else if (id === 'pyreSky' || id === 'pyreMark' || id === 'pyrelight' ||
               id === 'searingBolt' || id === 'livingPyre' || id === 'wildfire' ||
               id === 'hellfire' || id === 'hellfireDecay' || id === 'napalm' ||
               id === 'twinPyre' || id === 'pyremaster' || id === 'burningEdge') {
      this.fx.infernoVortex(x, y, '#ff5a3b', scale);
      audio.play('magic');
      audio.play('thornCrack');
    }
    // ---- Ice / freeze combos -----------------------------------------------
    else if (id === 'glacier' || id === 'glacialField' || id === 'glacialVine' ||
             id === 'killingFrost' || id === 'frostTomb' || id === 'frostFire' ||
             id === 'frostBrand' || id === 'twinGlacier' || id === 'frozentoxin' ||
             id === 'venomFrost' || id === 'hushFrost' || id === 'shadowFrost' ||
             id === 'coldSteel' || id === 'staticFrost') {
      this.fx.shatterRain(x, y, '#cfeaff', scale);
      audio.play('glassShatter');
    }
    // ---- Thunder / shock combos --------------------------------------------
    else if (id === 'plasmaSurge' || id === 'chainCurrent' || id === 'tempestVolt' ||
             id === 'venomBolt' || id === 'stormVoid' || id === 'tempestSouls' ||
             id === 'stormBrands' || id === 'acidTempest' || id === 'briarchain' ||
             id === 'lullsky' || id === 'stormfront') {
      audio.play('thunderclap');
      // Secondary forked branches
      for (let i = 0; i < 4; i++) {
        this.fx.lightningBolt(x + (Math.random() - 0.5) * 50, y + (Math.random() - 0.5) * 50, -40 + Math.random() * 30, { branches: 1 + Math.floor(Math.random() * 2) });
      }
    }
    // ---- Holy / sacred combos ----------------------------------------------
    else if (id === 'sunlitSea' || id === 'dayStar' || id === 'verdantSun' ||
             id === 'twinSun' || id === 'crownedSunrise' || id === 'lifeburst' ||
             id === 'solarFlare' || id === 'dawnTide' || id === 'sterilize' ||
             id === 'benediction' || id === 'hallowedAegis') {
      this.fx.starBurst(x, y, '#ffd884', scale);
      audio.play('choirSwell');
      audio.play('chime');
    }
    // ---- Dark / void combos ------------------------------------------------
    else if (id === 'voidlight' || id === 'duality' || id === 'unmaking' ||
             id === 'cryoCurse' || id === 'ashenGrove' || id === 'twilightTide' ||
             id === 'eclipseLullaby' || id === 'eclipsePetal' || id === 'tideblight') {
      this.fx.blackStar(x, y, scale);
      audio.play('voidHum');
    }
    // ---- Nature / bloom combos ---------------------------------------------
    else if (id === 'worldtree') {
      this.fx.livingTree(x, y, '#5a3a18', '#ffd884', scale * 1.4);
      audio.play('chime');
      audio.play('choirSwell');
    } else if (id === 'wildbloom' || id === 'thornsting' || id === 'plagueGrove' ||
               id === 'rotbloom' || id === 'monsoon' || id === 'drownedGarden' ||
               id === 'pyrebloom' || id === 'thornga' || id === 'thornra') {
      this.fx.livingTree(x, y, '#3a5a2a', '#7aff8a', scale);
      audio.play('swarmHiss');
    }
    // ---- Poison / decay combos ---------------------------------------------
    else if (id === 'necroticBloom' || id === 'bogCurse' || id === 'lethalTwilight' ||
             id === 'caustic' || id === 'toxinflood' || id === 'acidblade' ||
             id === 'acidrain' || id === 'plagueWide' || id === 'plagueStrike' ||
             id === 'acidBloom' || id === 'hellbrand') {
      this.fx.rotMist(x, y, scale);
      audio.play('swarmHiss');
    }
    // ---- Sleep / dream combos ----------------------------------------------
    else if (id === 'lullsoot' || id === 'drowsingTide' || id === 'poppysleep' ||
             id === 'mercyStroke' || id === 'lullaby') {
      this.fx.musicalNotes(x, y, '#c0a0ff', scale);
      audio.play('chime');
    }
    // ---- Ultimate non-elemental --------------------------------------------
    else if (id === 'ultima' || id === 'meteor' || id === 'flare' ||
             id === 'prismaBurst' || id === 'aurora' || id === 'judgement') {
      this.fx.starBurst(x, y, '#ffffff', scale * 1.4);
      this.fx.blackStar(x, y, scale * 0.6);
      audio.play('doomKnell');
      audio.play('aetherWail');
    }
    // ---- Twin / mirror dual-cast feel --------------------------------------
    // Twin-named spells get a literal two-strike layer on top of their
    // element family signature, so the "two cast as one" identity reads.
    if (id === 'twinPyre' || id === 'twinGlacier' || id === 'twinSun') {
      this.fx.dualImpact(x, y,
        this._elementColor(skill.element),
        '#ffffff', scale * 0.85);
    }
  }

  // ---- ATB (wait mode) -----------------------------------------------------
  //
  // Every alive combatant carries `atb` in [0,1]. While state==='waiting',
  // each combatant's bar fills at `dt * spd * ATB_RATE`. The first to hit 1
  // becomes the actor; the loop pauses for animations and player input. After
  // an action commits, the actor's atb resets to 0 and the loop resumes.
  //
  // At ATB_RATE=0.05, a SPD-5 character fills in ~4s, SPD-8 in ~2.5s, SPD-16
  // in ~1.25s — close to FF7's default battle-speed pacing.
  enter() {
    // Even start so the first turn is just a matter of who's fastest.
    for (const c of this.party) c.atb = 0;
    for (const e of this.enemies) e.atb = 0;
    this.state = 'waiting';
  }

  _advanceAtb(dt) {
    if (this.state !== 'waiting') return;
    const RATE = 0.05;
    for (const c of [...this.party, ...this.enemies]) {
      if (c.dead || c.hp <= 0) continue;
      // Haste / Slow (status) and gem-based atbMult both scale fill rate.
      let mult = c.atbMult || 1;
      for (const s of c.statuses || []) {
        const def = STATUS_BY_ID[s.id];
        if (def?.kind === 'atbMult') mult *= def.factor;
      }
      c.atb = Math.min(1, (c.atb || 0) + dt * c.spd * RATE * mult);
    }
    this._tryStartTurn();
  }

  // Tick the actor's active statuses (DoT/HoT damage, skip checks). Returns
  // a skip reason string ('Frozen', 'Asleep'…) if the actor cannot act this
  // turn, else null. Always decrements remaining durations after the tick.
  _tickStatuses(actor) {
    if (!actor.statuses?.length) return null;
    let skipReason = null;
    for (const s of [...actor.statuses]) {
      const def = STATUS_BY_ID[s.id];
      if (!def) continue;
      if (def.kind === 'dotHp') {
        const dmg = Math.max(1, Math.floor(actor.maxHp * def.factor));
        actor.hp = Math.max(0, actor.hp - dmg);
        this.popups.push({ text: '-' + dmg, x: actor._screenX || 0, y: (actor._screenY || 0) - 18, life: 0.8, max: 0.8, color: def.color });
        if (actor.hp <= 0) {
          actor.dead = true;
          this._addLog(`${actor.name} succumbs to ${def.name.toLowerCase()}!`);
        }
      } else if (def.kind === 'hotHp') {
        const heal = Math.max(1, Math.floor(actor.maxHp * def.factor));
        const before = actor.hp;
        actor.hp = Math.min(actor.maxHp, actor.hp + heal);
        this.popups.push({ text: '+' + (actor.hp - before), x: actor._screenX || 0, y: (actor._screenY || 0) - 18, life: 0.8, max: 0.8, color: def.color });
      } else if (def.kind === 'skip' && !skipReason) {
        skipReason = def;
      }
    }
    // Decrement and prune
    for (const s of actor.statuses) s.duration--;
    actor.statuses = actor.statuses.filter(s => s.duration > 0);
    return skipReason;
  }

  // Apply (or refresh) a status on a target. Duration uses the status default
  // or an override. No-op if status id is unknown.
  _applyStatus(target, statusId, opts = {}) {
    const def = STATUS_BY_ID[statusId];
    if (!def || !target || target.dead) return;
    if (!target.statuses) target.statuses = [];
    const existing = target.statuses.find(s => s.id === statusId);
    const dur = opts.duration ?? def.duration;
    if (existing) {
      existing.duration = Math.max(existing.duration, dur);
      return;
    }
    target.statuses.push({ id: statusId, duration: dur });
    this._addLog(`${target.name} ${def.appliedMsg || 'is afflicted!'}`);
    // Visual flourish — colored particle puff above the target
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      this.fx.spawn({
        x: target._screenX || 0, y: (target._screenY || 0) - 8,
        vx: Math.cos(ang) * 40, vy: Math.sin(ang) * 40 - 10,
        gravity: 30, drag: 0.4,
        size: 2.5, color: def.color, glow: 8,
        life: 0.6, shrink: true,
      });
    }
  }

  _tryStartTurn() {
    if (this.state !== 'waiting') return;
    // Pick the most-overfull ready combatant; tie-break by spd.
    let best = null;
    for (const c of [...this.party, ...this.enemies]) {
      if (c.dead || c.hp <= 0 || (c.atb || 0) < 1) continue;
      if (!best || c.atb > best.atb || (c.atb === best.atb && c.spd > best.spd)) best = c;
    }
    if (!best) return;
    this.actor = best;
    if (best.kind === 'player') this._startPlayerTurn();
    else this._startEnemyTurn(best);
  }

  _checkEnd() {
    if (this.state === 'over') return true;
    const partyAlive = this.party.some(c => !c.dead);
    const enemiesAlive = this.enemies.some(e => !e.dead);
    if (!partyAlive) {
      this.state = 'over';
      this._addLog('Your party has fallen...');
      audio.play('defeat');
      this._delay(1.4, () => this.game.exitBattle({ won: false }));
      return true;
    }
    if (!enemiesAlive) {
      this.state = 'over';
      let xp = 0, gold = 0;
      const drops = [];
      for (const e of this.enemies) {
        xp += e.template.xp;
        gold += e.template.gold;
        for (const d of (e.template.drops || [])) {
          if (Math.random() < d.chance) drops.push({ kind: d.kind, id: d.id });
        }
      }
      this._addLog(`Victory! +${xp} XP, +${gold} G`);
      if (drops.length) this._addLog(`Got: ${drops.map(d => d.id).join(', ')}`);
      audio.play('victory');
      this._delay(1.6, () => this.game.exitBattle({ won: true, xpGained: xp, goldGained: gold, drops, fledFrom: this.overworldKey }));
      return true;
    }
    return false;
  }

  // --- Player input flow -----------------------------------------------------

  _startPlayerTurn() {
    if (this.actor.defending) this.actor.defending = false;
    const skip = this._tickStatuses(this.actor);
    if (this.actor.dead) { this._delay(0.3, () => this._endActorTurn()); return; }
    if (skip) {
      this._addLog(`${this.actor.name} ${skip.skipMsg || ('is ' + skip.name.toLowerCase() + '!')}`);
      this._delay(0.7, () => this._endActorTurn());
      return;
    }
    this.state = 'playerMenu';
    this.game.ui.openBattleMenu(this);
  }

  chooseAttack() {
    if (this.state !== 'playerMenu') return;
    this.state = 'animating';
    this.game.ui.closeBattleMenu();
    this._pickTarget(target => {
      this.fx.slashHit(target._screenX, target._screenY);
      this._doAttack(this.actor, target, this.actor.atk * 1.0, 'phys');
      this._endActorTurn();
    });
  }

  chooseSkill(skillId) {
    // Re-entry guard — without this, rapid clicks cast the spell multiple
    // times (and the resulting `won` battle multiplies XP/gold rewards).
    if (this.state !== 'playerMenu') return;
    const skill = this._resolveLinkers(skillId, this.actor);
    if (!skill) return;
    if (this.actor.mp < skill.cost) return;
    // Block re-entry immediately. _pickTarget may overwrite to 'targetSelect'
    // for multi-target picking; that's fine — only 'playerMenu' allows commit.
    this.state = 'animating';
    // Drop the skill list immediately so it doesn't block the spell visuals.
    // Cancelling target-select reopens the menu via _cancelTarget.
    this.game.ui.closeBattleMenu();
    // ---- SUMMONS — multi-stage FF7-style cutscene with skip-on-tap. ----
    // Skill template carries `summon: true` (declared on gems.js for the
    // summon-granting gems). We route those through `_playSummonCutscene`
    // instead of the normal magic path so the cinematic plays first and
    // damage lands at the cinematic's impact beat.
    const summonTmpl = this._resolveSummonTemplate(skill);
    if (summonTmpl) {
      const dmgBase = this.actor.mag;
      const launch = (targets) => {
        this.actor.mp -= skill.cost;
        this._playSummonCutscene(skill, summonTmpl, dmgBase, targets);
      };
      if (skill.target === 'all') {
        this._addLog(`${this.actor.name} summons ${skill.name}!`);
        launch(this.enemies.filter(e => !e.dead));
      } else {
        this._pickTarget(target => {
          this._addLog(`${this.actor.name} summons ${skill.name}!`);
          launch([target]);
        });
      }
      return;
    }
    if (skill.kind === 'attack' || skill.kind === 'magic') {
      const dmgBase = skill.kind === 'magic' ? this.actor.mag : this.actor.atk;
      const launch = (targets) => {
        // Only spend MP once the cast actually commits.
        this.actor.mp -= skill.cost;
        const color = this._elementColor(skill.element);
        const scale = this._spellScale(skill);
        const tier = this._spellTier(skill);
        const cx = this.actor._screenX, cy = this.actor._screenY;
        // --- TIER-LAYERED CAST WINDUP ----------------------------------------
        // Tier 1: a small magic-circle flicker, instant. Reads like a cantrip.
        // Tier 2: ground sigil + charge particles + projectile per target.
        // Tier 3: ALL of tier 2 plus a brighter aura on the caster, a SECOND
        //   inner sigil ring, a predictive target-sigil that drops at each
        //   target right before the projectile arrives, a SKY BEAM descending
        //   into the target, camera shake during cast AND on impact, and
        //   3-burst staggered impact + a lingering scorch on the ground.
        // Tier 4: ALL of tier 3 plus a heavy screen flash and a white-hot
        //   secondary cast charge — the "I just cast Ultima" treatment.
        if (tier === 1) {
          this.fx.magicCircle(cx, cy, color, 0.35, 0.85);
        } else {
          this.fx.groundSigil(cx, cy, color, skill.element, 0.55 + 0.1 * tier, scale);
          this.fx.castCharge(cx, cy, color, scale);
        }
        if (tier >= 3) {
          // Caster halo — the player visibly powers up.
          this.fx.casterAura(cx, cy, color, 0.65, scale);
          // Inner second sigil ring at half-scale for layered look.
          this.fx.groundSigil(cx, cy, '#ffffff', skill.element, 0.7, scale * 0.55);
          // Outer shockwave at the caster (the "I am charging" pulse).
          this.fx.shockwave(cx, cy, color, 130 * scale, 0.6);
          // Pre-shake during the windup builds anticipation.
          this.battleShake = Math.max(this.battleShake, 4);
        }
        if (tier >= 4) {
          this.fx.screenFlash(color, 0.32, 0.35);
          this.fx.castCharge(cx, cy, '#ffffff', scale);
          this.fx.casterAura(cx, cy, '#ffffff', 0.55, scale * 1.2);
          this.battleShake = Math.max(this.battleShake, 8);
        }
        // Audio scales with tier.
        if (skill.kind === 'magic') {
          audio.play('magic');
          if (tier >= 3) { audio.play('crit'); audio.play('rift'); }
          if (tier >= 4) { audio.play('magic'); audio.play('aetherWail'); }
        }
        const fire = (targetList) => {
          for (const t of targetList) {
            if (t.dead) continue;
            if (tier >= 3) {
              // Drop a predictive sigil under the target now, so it sits
              // there glowing while the projectile + beam arrive.
              this.fx.targetSigil(t._screenX, t._screenY, color, skill.element, 0.45, scale * 0.9);
              // The sky beam descends into the target a beat after the sigil.
              this._delay(0.08, () => {
                this.fx.skyBeam(t._screenX, t._screenY, color, 0.55, scale);
              });
              // Projectile from caster — arrives at the same moment the
              // sky beam touches down, so the two converge dramatically.
              this.fx.castProjectile(cx, cy, t._screenX, t._screenY, color, 0.40, () => {
                if (t.dead) return;
                // Heavy impact: element FX, then 2 staggered secondary
                // bursts at slight offsets, then lingering scorch.
                this._playSpellHit(skill, t);
                this.battleShake = Math.max(this.battleShake, tier >= 4 ? 14 : 9);
                this._applyDamage(this.actor, t, dmgBase * skill.power, skill.element, skill);
                this._delay(0.10, () => {
                  if (!t.dead) {
                    this.fx.shockwave(t._screenX - 14, t._screenY + 8, color, 70 * scale, 0.4);
                    this.fx.shockwave(t._screenX + 18, t._screenY - 4, '#ffffff', 50 * scale, 0.35);
                  }
                });
                this._delay(0.22, () => {
                  if (!t.dead) {
                    this.fx.shockwave(t._screenX + 10, t._screenY + 14, color, 60 * scale, 0.4);
                  }
                });
                // Lingering scorch on the ground — stays for ~1.4s.
                this.fx.lingerScorch(t._screenX, t._screenY, color, scale * 0.9, 1.4);
              });
            } else if (tier >= 2) {
              this.fx.castProjectile(cx, cy, t._screenX, t._screenY, color, 0.30, () => {
                if (!t.dead) {
                  this._playSpellHit(skill, t);
                  this._applyDamage(this.actor, t, dmgBase * skill.power, skill.element, skill);
                }
              });
            } else {
              this._playSpellHit(skill, t);
              this._applyDamage(this.actor, t, dmgBase * skill.power, skill.element, skill);
            }
          }
        };
        // Wind-up delay before damage commits — longer for bigger spells so the
        // tier-3 cast actually feels like buildup, not just bigger numbers.
        const windup = tier === 1 ? 0.32 : tier === 2 ? 0.40 : tier === 3 ? 0.70 : 0.90;
        // Total turn duration accounts for windup + projectile travel + reaction.
        const endDelay = (tier >= 2 ? 0.30 : 0) + (tier >= 3 ? 0.45 : 0.32);
        this._delay(windup, () => {
          fire(targets);
          const lk = skill._linker || '';
          const extra = lk.includes('quad') ? 3 : lk.includes('double') ? 1 : 0;
          if (extra > 0) {
            const step = 0.45;
            for (let n = 1; n <= extra; n++) {
              this._delay(step * n, () => fire(targets));
            }
            this._delay(step * extra + endDelay, () => this._endActorTurn());
          } else {
            this._delay(endDelay, () => this._endActorTurn());
          }
        });
      };
      if (skill.target === 'all') {
        this._addLog(`${this.actor.name} casts ${skill.name}!`);
        launch(this.enemies.filter(e => !e.dead));
      } else {
        this._pickTarget(target => {
          this._addLog(`${this.actor.name} uses ${skill.name}!`);
          launch([target]);
        });
      }
    } else if (skill.kind === 'heal') {
      const launch = (targets) => {
        this.actor.mp -= skill.cost;
        const scale = this._spellScale(skill);
        const tier = this._spellTier(skill);
        const cx = this.actor._screenX, cy = this.actor._screenY;
        if (tier === 1) {
          this.fx.magicCircle(cx, cy, '#a8ffc8', 0.45, 0.9);
        } else {
          this.fx.groundSigil(cx, cy, '#a8ffc8', 'holy', 0.55 + 0.1 * tier, scale);
          this.fx.castCharge(cx, cy, '#a8ffc8', scale);
        }
        if (tier >= 3) this.fx.shockwave(cx, cy, '#d4ffd4', 120 * scale, 0.55);
        audio.play('heal');
        if (tier >= 3) audio.play('confirm');
        this._delay(tier === 1 ? 0.32 : 0.42, () => {
          for (const t of targets) {
            this.fx.healingMotes(t._screenX, t._screenY, scale);
            if (tier >= 2) this.fx.shockwave(t._screenX, t._screenY, '#a8ffc8', 50 * scale, 0.4);
            if (tier >= 3) {
              // Holy-style rising motes around the recipient
              for (let i = 0; i < 14; i++) {
                const a = (i / 14) * Math.PI * 2;
                this.fx.spawn({
                  x: t._screenX + Math.cos(a) * 22 * scale,
                  y: t._screenY + Math.sin(a) * 12 * scale,
                  vx: Math.cos(a) * 10, vy: -60 - Math.random() * 40,
                  gravity: -10, drag: 0.4,
                  size: 1.8, color: ['#fff5d8','#a8ffc8','#ffffff'][i % 3], glow: 9,
                  life: 1.0, shrink: false,
                });
              }
            }
            // Bespoke combo signature on the recipient too — Worldtree, Lifeburst,
            // Benediction etc. trigger their unique visuals here.
            this._playComboSignature(skill, t._screenX, t._screenY, scale);
            this._healMember(t, skill.power);
          }
          this._delay(0.32, () => this._endActorTurn());
        });
      };
      if (skill.target === 'all') {
        this._addLog(`${this.actor.name} casts ${skill.name}!`);
        launch(this.party.filter(m => !m.dead));
      } else {
        this._pickTarget(target => {
          this._addLog(`${this.actor.name} casts ${skill.name} on ${target.name}!`);
          launch([target]);
        }, 'party');
      }
    } else if (skill.kind === 'cleanse') {
      const launch = (targets) => {
        this.actor.mp -= skill.cost;
        this.fx.magicCircle(this.actor._screenX, this.actor._screenY, '#f4eecf', 0.5, this._spellScale(skill));
        audio.play('heal');
        this._delay(0.3, () => {
          for (const t of targets) {
            const before = t.statuses?.length || 0;
            if (t.statuses) t.statuses = t.statuses.filter(s => !STATUS_BY_ID[s.id]?.negative);
            const cleared = before - (t.statuses?.length || 0);
            // Visual: white sparkle ring
            this.fx.shockwave(t._screenX, t._screenY, '#f4eecf', 70, 0.4);
            for (let i = 0; i < 10; i++) {
              const ang = (i / 10) * Math.PI * 2;
              this.fx.spawn({
                x: t._screenX + Math.cos(ang) * 18,
                y: t._screenY + Math.sin(ang) * 8,
                vx: Math.cos(ang) * 30, vy: -30 - Math.random() * 15,
                gravity: -5, drag: 0.3,
                size: 2, color: '#fff5cf', glow: 8,
                life: 0.9, shrink: false,
              });
            }
            if (cleared > 0) this.popups.push({ text: 'cleansed', x: t._screenX, y: (t._screenY || 0) - 20, life: 0.9, max: 0.9, color: '#f4eecf' });
          }
          this._delay(0.3, () => this._endActorTurn());
        });
      };
      if (skill.target === 'all') {
        this._addLog(`${this.actor.name} casts ${skill.name}!`);
        launch(this.party.filter(m => !m.dead));
      } else {
        this._pickTarget(target => {
          this._addLog(`${this.actor.name} casts ${skill.name} on ${target.name}!`);
          launch([target]);
        }, 'party');
      }
    } else if (skill.kind === 'restoreMp') {
      const launch = (targets) => {
        this.actor.mp -= skill.cost;
        this.fx.magicCircle(this.actor._screenX, this.actor._screenY, '#7adaff', 0.5, this._spellScale(skill));
        audio.play('heal');
        this._delay(0.32, () => {
          for (const t of targets) {
            // Blue motes effect (reuse healingMotes shape but with blue particles spawned)
            this.fx.shockwave(t._screenX, t._screenY, '#7adaff', 60, 0.45);
            for (let i = 0; i < 14; i++) {
              const ang = (i / 14) * Math.PI * 2;
              const ringR = 18;
              this.fx.spawn({
                x: t._screenX + Math.cos(ang) * ringR,
                y: t._screenY + Math.sin(ang) * ringR * 0.4,
                vx: -Math.cos(ang) * 12,
                vy: -45 - Math.random() * 25,
                gravity: -10, drag: 0.3,
                size: 2, color: ['#7adaff','#cfeaff','#5aaaff'][i % 3], glow: 8,
                life: 1.0, shrink: false,
              });
            }
            const before = t.mp;
            t.mp = Math.min(t.maxMp, t.mp + skill.power);
            const gained = t.mp - before;
            this.popups.push({ text: '+' + gained + ' MP', x: t._screenX, y: (t._screenY || 0) - 20, life: 0.9, max: 0.9, color: '#7adaff' });
          }
          this._delay(0.32, () => this._endActorTurn());
        });
      };
      if (skill.target === 'all') {
        this._addLog(`${this.actor.name} casts ${skill.name}!`);
        launch(this.party.filter(m => !m.dead));
      } else {
        this._pickTarget(target => {
          this._addLog(`${this.actor.name} casts ${skill.name} on ${target.name}!`);
          launch([target]);
        }, 'party');
      }
    } else if (skill.kind === 'drainMp') {
      // Osmose-style — pull MP off one enemy and feed it to the caster.
      this._pickTarget(target => {
        this._addLog(`${this.actor.name} drains ${skill.name === 'Osmose' ? 'aether' : 'mana'} from ${target.name}!`);
        this.fx.magicCircle(this.actor._screenX, this.actor._screenY, '#a060ff', 0.5, 1.2);
        audio.play('magic');
        this._delay(0.35, () => {
          // Visual thread from target to caster
          for (let i = 0; i < 18; i++) {
            const t = i / 18;
            this.fx.spawn({
              x: target._screenX + (this.actor._screenX - target._screenX) * t,
              y: target._screenY + (this.actor._screenY - target._screenY) * t - Math.sin(t * Math.PI) * 14,
              vx: 0, vy: 0,
              gravity: 0, drag: 0,
              size: 2.2, color: ['#a060ff', '#d0a0ff', '#7adaff'][i % 3], glow: 9,
              life: 0.45 + i * 0.02, shrink: true,
            });
          }
          const drain = Math.min(skill.power, target.mp ?? 0);
          if (target.mp != null) target.mp = Math.max(0, target.mp - drain);
          const before = this.actor.mp;
          this.actor.mp = Math.min(this.actor.maxMp, this.actor.mp + drain);
          const gained = this.actor.mp - before;
          if (gained > 0) {
            this.popups.push({ text: '+' + gained + ' MP', x: this.actor._screenX, y: (this.actor._screenY || 0) - 20, life: 0.9, max: 0.9, color: '#a060ff' });
          } else {
            this.popups.push({ text: 'nothing to drain', x: target._screenX || 0, y: (target._screenY || 0) - 20, life: 0.9, max: 0.9, color: '#cdd6e0' });
          }
          this._delay(0.5, () => this._endActorTurn());
        });
      });
    }
  }

  chooseItem(itemId) {
    if (this.state !== 'playerMenu') return;
    const inv = this.game.inventory.consumables;
    if (!inv[itemId] || inv[itemId] <= 0) return;
    const it = ITEM_BY_ID[itemId];
    if (!it) return;
    this.state = 'animating';
    this.game.ui.closeBattleMenu();
    const apply = (target) => {
      inv[itemId]--;
      if (it.kind === 'heal-hp') this._healMember(target, it.power);
      else if (it.kind === 'heal-mp') target.mp = Math.min(target.maxMp, target.mp + it.power);
      this._addLog(`${this.actor.name} uses ${it.name} on ${target.name}!`);
      audio.play('heal');
      this._endActorTurn();
    };
    if (this.party.filter(p => !p.dead).length > 1) this._pickTarget(apply, 'party');
    else apply(this.actor);
  }

  chooseDefend() {
    if (this.state !== 'playerMenu') return;
    this.state = 'animating';
    this.game.ui.closeBattleMenu();
    this.actor.defending = true;
    this._addLog(`${this.actor.name} braces.`);
    audio.play('confirm');
    this._endActorTurn();
  }

  chooseRun() {
    if (this.state !== 'playerMenu') return;
    this.state = 'animating';
    this.game.ui.closeBattleMenu();
    if (Math.random() < 0.65) {
      this._addLog('Escaped!');
      audio.play('confirm');
      this.state = 'over';
      this._delay(0.9, () => this.game.exitBattle({ won: false, fled: true }));
    } else {
      this._addLog('Could not escape!');
      audio.play('hurt');
      this._endActorTurn();
    }
  }

  // side: 'enemies' (default) or 'party'
  _pickTarget(cb, side = 'enemies') {
    const pool = side === 'party'
      ? this.party.filter(p => !p.dead)
      : this.enemies.filter(e => !e.dead);
    if (pool.length === 0) return;
    if (pool.length === 1) { cb(pool[0]); return; }
    this.state = 'targetSelect';
    this._targetPool = pool;
    this._targetSide = side;
    this.targetCallback = cb;
    this.game.ui.closeBattleMenu();
    this.game.ui.showTargetHint(side, () => this._cancelTarget());
  }

  _cancelTarget() {
    if (this.state !== 'targetSelect') return;
    this.game.ui.hideTargetHint();
    this.targetCallback = null;
    this._targetPool = null;
    this.state = 'playerMenu';
    this.game.ui.openBattleMenu(this);
  }

  onTap(x, y) {
    if (this.state !== 'targetSelect') return false;
    let best = null, bestD = 80 * 80;
    for (const t of (this._targetPool || [])) {
      const dx = x - (t._screenX || 0), dy = y - (t._screenY || 0);
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD) { bestD = d2; best = t; }
    }
    if (best) {
      this.game.ui.hideTargetHint();
      const cb = this.targetCallback;
      this.targetCallback = null;
      this._targetPool = null;
      cb(best);
    }
    return true;
  }

  _endActorTurn() {
    this.game.ui.closeBattleMenu();
    if (this.actor) {
      this.actor.atb = 0;
      this.actor = null;
    }
    if (this._checkEnd()) return;
    // Tiny pacing breath, then yield to the ATB tick to find the next actor.
    this._delay(0.18, () => { this.state = 'waiting'; });
  }

  // --- Enemy AI --------------------------------------------------------------

  _startEnemyTurn(e) {
    this.state = 'enemyTurn';
    const skip = this._tickStatuses(e);
    if (e.dead) { this._checkEnd() || this._delay(0.3, () => this._endActorTurn()); return; }
    if (skip) {
      this._addLog(`${e.name} ${skip.skipMsg || ('is ' + skip.name.toLowerCase() + '!')}`);
      this._delay(0.7, () => this._endActorTurn());
      return;
    }
    const targets = this.party.filter(c => !c.dead);
    if (targets.length === 0) { this._checkEnd(); return; }
    const action = e.ai ? e.ai(this, e) : { kind: 'basic' };
    switch (action.kind) {
      case 'veilPulse':       return this._enemyVeilPulse(e, targets);
      case 'sunderedStrike':  return this._enemySunderedStrike(e, targets);
      case 'thornLash':       return this._enemyThornLash(e, targets);
      case 'sporeBloom':      return this._enemySporeBloom(e, targets);
      case 'aetherWail':      return this._enemyAetherWail(e, targets);
      default:                return this._enemyBasicAttack(e, targets);
    }
  }

  _enemyBasicAttack(e, targets) {
    const t = targets[Math.floor(Math.random() * targets.length)];
    this._delay(0.4, () => {
      this._addLog(`${e.name} attacks ${t.name}!`);
      this.fx.slashHit(t._screenX, t._screenY, Math.PI / 4);
      this._doAttack(e, t, e.atk, 'phys');
      this._delay(0.6, () => this._endActorTurn());
    });
  }

  _enemySunderedStrike(e, targets) {
    const t = targets[Math.floor(Math.random() * targets.length)];
    this._delay(0.35, () => {
      this._addLog(`${e.name} winds up Sundered Strike!`);
      this.fx.magicCircle(e._screenX, e._screenY, '#a060ff', 0.4, 1.6);
      audio.play('magic');
      this._delay(0.45, () => {
        this.fx.slashHit(t._screenX, t._screenY, Math.PI / 3);
        this.fx.shockwave(t._screenX, t._screenY, '#a060ff', 110, 0.55);
        this._applyDamage(e, t, e.atk * 1.7, 'phys');
        this._delay(0.6, () => this._endActorTurn());
      });
    });
  }

  _enemyThornLash(e, targets) {
    const t = targets[Math.floor(Math.random() * targets.length)];
    this._delay(0.35, () => {
      this._addLog(`${e.name} lashes ${t.name} with thorned branches!`);
      this.fx.magicCircle(e._screenX, e._screenY, '#6a7a3b', 0.35, 1.4);
      audio.play('bossThump');
      audio.play('thornCrack');
      this._delay(0.4, () => {
        this.fx.slashHit(t._screenX, t._screenY, Math.PI / 2);
        this.fx.shockwave(t._screenX, t._screenY, '#6a7a3b', 90, 0.45);
        // Burst of greenish thorn motes
        for (let i = 0; i < 12; i++) {
          const ang = Math.random() * Math.PI * 2;
          const sp = 50 + Math.random() * 80;
          this.fx.spawn({
            x: t._screenX, y: t._screenY,
            vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
            gravity: 60, drag: 1.0,
            size: 2.2, color: ['#6a7a3b', '#3a5a1a', '#9aaa5b'][Math.floor(Math.random() * 3)],
            life: 0.6 + Math.random() * 0.3, shrink: true, glow: 6,
          });
        }
        this._applyDamage(e, t, e.atk * 1.5, 'phys');
        // Inflict poison ~60%.
        if (!t.dead && Math.random() < 0.6) this._applyStatus(t, 'poison', { duration: 4 });
        this._delay(0.6, () => this._endActorTurn());
      });
    });
  }

  _enemySporeBloom(e, targets) {
    this._delay(0.45, () => {
      this._addLog(`${e.name} bursts open — sporeswarms billow across the field!`);
      this.fx.magicCircle(e._screenX, e._screenY, '#9a7a3b', 0.6, 2.2);
      audio.play('sporeBurst');
      this._delay(0.55, () => {
        this.fx.shockwave(e._screenX, e._screenY, '#9aaa5b', 360, 1.0);
        for (const t of targets) {
          for (let i = 0; i < 16; i++) {
            const ang = Math.random() * Math.PI * 2;
            const sp = 40 + Math.random() * 90;
            this.fx.spawn({
              x: t._screenX, y: t._screenY,
              vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 30,
              gravity: -10, drag: 1.4,
              size: 2.6, color: ['#9aaa5b', '#6a7a3b', '#ccdc8a'][Math.floor(Math.random() * 3)],
              life: 0.9 + Math.random() * 0.4, shrink: true, glow: 7,
            });
          }
          this._applyDamage(e, t, e.mag * 0.85, 'nature');
          // Inflict sleep ~40% per target.
          if (!t.dead && Math.random() < 0.4) this._applyStatus(t, 'sleep', { duration: 2 });
        }
        this._delay(0.8, () => this._endActorTurn());
      });
    });
  }

  // Aether Wail — chapter 2 boss heavy AoE. Hits the whole party with dark
  // magic and applies a long sleep with ~25% chance per target.
  _enemyAetherWail(e, targets) {
    this._delay(0.6, () => {
      this._addLog(`${e.name} unleashes Aether Wail — the song bleeds across the field!`);
      this.fx.magicCircle(e._screenX, e._screenY, '#a060ff', 0.9, 2.6);
      audio.play('aetherWail');
      this._delay(0.7, () => {
        this.fx.shockwave(e._screenX, e._screenY, '#a060ff', 480, 1.2);
        this.fx.shockwave(e._screenX, e._screenY, '#ff60ff', 280, 0.7);
        for (const t of targets) {
          for (let i = 0; i < 22; i++) {
            const ang = Math.random() * Math.PI * 2;
            const sp = 70 + Math.random() * 140;
            this.fx.spawn({
              x: t._screenX, y: t._screenY,
              vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
              gravity: 30, drag: 1.2,
              size: 2.8, color: ['#a060ff','#ff60ff','#6020a0','#ffffff'][Math.floor(Math.random()*4)],
              life: 0.8 + Math.random() * 0.5, shrink: true, glow: 10,
            });
          }
          this._applyDamage(e, t, e.mag * 1.35, 'dark');
          if (!t.dead && Math.random() < 0.25) this._applyStatus(t, 'sleep', { duration: 3 });
        }
        this._delay(0.9, () => this._endActorTurn());
      });
    });
  }

  _enemyVeilPulse(e, targets) {
    this._delay(0.4, () => {
      this._addLog(`${e.name} unleashes Veil Pulse!`);
      this.fx.magicCircle(e._screenX, e._screenY, '#a060ff', 0.55, 2.0);
      audio.play('magic');
      this._delay(0.5, () => {
        this.fx.shockwave(e._screenX, e._screenY, '#a060ff', 320, 0.9);
        for (const t of targets) {
          // Per-target violet bloom
          for (let i = 0; i < 14; i++) {
            const ang = Math.random() * Math.PI * 2;
            const sp = 60 + Math.random() * 100;
            this.fx.spawn({
              x: t._screenX, y: t._screenY,
              vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
              gravity: 60, drag: 1.2,
              size: 2.4, color: ['#a060ff', '#d0a0ff', '#6020a0'][Math.floor(Math.random() * 3)],
              life: 0.6 + Math.random() * 0.3, shrink: true, glow: 8,
            });
          }
          this._applyDamage(e, t, e.mag * 1.05, 'dark');
        }
        this._delay(0.7, () => this._endActorTurn());
      });
    });
  }

  // --- Damage / Heal ---------------------------------------------------------

  _doAttack(attacker, defender, power, element) {
    this.attackAnim = { attacker, t: 0, dur: 0.35 };
    this._applyDamage(attacker, defender, power, element);
  }

  _applyDamage(attacker, defender, base, element, skill = null) {
    // Hybrid (dual / trio) element support — if the skill declares an
    // `elements` array, average each element's weak/resist/immune modifier.
    // Falls back to the legacy single-element path otherwise.
    const elementList = (skill?.elements && skill.elements.length) ? skill.elements
                       : (element ? [element] : []);
    let elementMod = 1.0;
    let blockedNote = null;
    if (elementList.length) {
      let total = 0;
      let immuneCount = 0;
      let physInList = false;
      for (const e of elementList) {
        if (e === 'phys') { physInList = true; total += 1; continue; }
        if (e === 'nonelemental') { total += 1; continue; }
        if (e && defender.immune?.includes(e)) { immuneCount++; continue; } // contributes 0
        let m = 1.0;
        if (defender.weak?.includes(e)) m *= 1.5;
        if (defender.resist?.includes(e)) m *= 0.5;
        total += m;
      }
      // Full-immune short-circuit: every listed element resolves to immune AND
      // no phys component carries damage through. Keeps the classic "No effect"
      // popup for skills that genuinely do nothing against the target.
      if (!physInList && immuneCount === elementList.length) {
        this.popups.push({ text: 'No effect', x: defender._screenX || 0, y: (defender._screenY || 0) - 20, life: 1.0, max: 1.0, color: '#cdd6e0' });
        defender.hitFlash = 0.12;
        this._addLog(`${defender.name} is unaffected by ${elementList.join('/')}!`);
        audio.play('menu');
        return;
      }
      elementMod = total / elementList.length;
      if (immuneCount > 0 && elementList.length > 1) {
        const blocked = elementList.filter(e => e !== 'phys' && defender.immune?.includes(e));
        if (blocked.length) blockedNote = blocked.join('/');
      }
    }
    // Snapshot whether the defender was already dead/at-zero BEFORE this hit
    // applies — used below to mark damage popups as OVERKILL and to suppress
    // duplicate "falls!" / "KO'd!" log lines on summon overkill flurries.
    const wasDead = defender.dead || defender.hp <= 0;
    const pierce = skill?.pierce ?? 0;
    let dmg = Math.max(1, base - defender.def * 0.5 * (1 - pierce));
    if (defender.defending) dmg *= 0.5;
    dmg *= elementMod;
    const crit = Math.random() < 0.08;
    if (crit) dmg *= 1.75;
    dmg = Math.max(1, Math.floor(dmg));
    defender.hp = Math.max(0, defender.hp - dmg);
    defender.hitFlash = 0.25;
    defender.shake = 0.3;
    // Wake sleep on hit
    if (defender.statuses?.length) {
      defender.statuses = defender.statuses.filter(s => {
        const def = STATUS_BY_ID[s.id];
        return !(def?.wakesOnHit);
      });
    }
    // Skill-applied status (e.g., Fira → Burn chance)
    if (skill?.status && defender.hp > 0 && Math.random() < (skill.status.chance ?? 1)) {
      this._applyStatus(defender, skill.status.id, { duration: skill.status.duration });
    }
    // Attacker-applied status (enemies with attackStatus, future status-gem weapons)
    if (attacker?.attackStatus && defender.hp > 0 && Math.random() < (attacker.attackStatus.chance ?? 1)) {
      this._applyStatus(defender, attacker.attackStatus.id, { duration: attacker.attackStatus.duration });
    }
    // Damage popup — overkill hits get a bigger, brighter "OVERKILL" label
    // that still includes the rolled damage number. Each overkill popup also
    // gets a random horizontal jitter so a 13-strike summon's eleven overkill
    // popups don't stack on the same vertical column and obscure each other.
    if (wasDead) {
      const jx = (Math.random() - 0.5) * 90;
      const jy = (Math.random() - 0.5) * 24;
      this.popups.push({
        text: `-${dmg} OVERKILL`,
        x: (defender._screenX || 0) + jx,
        y: (defender._screenY || 0) - 20 + jy,
        life: 1.5, max: 1.5, color: '#ff80a0', large: true,
      });
    } else {
      this.popups.push({
        text: '-' + dmg,
        x: defender._screenX || 0, y: (defender._screenY || 0) - 20,
        life: 0.9, max: 0.9, color: crit ? '#ffd84d' : '#fff',
      });
    }
    if (blockedNote) this._addLog(`${defender.name} shrugs off the ${blockedNote} half.`);
    if (crit) audio.play('crit'); else audio.play('hit');

    if (defender.kind === 'player' && defender.hp <= 0 && !wasDead) {
      const rev = defender.phoenixCharged;
      if (rev) {
        defender.phoenixCharged = null;
        const hpPct = rev.revive?.hpPct ?? 0.5;
        defender.hp = Math.max(1, Math.floor(defender.maxHp * hpPct));
        defender.hitFlash = 0.3;
        this._addLog(`Phoenix Shroud ignites! ${defender.name} revives.`);
        audio.play('heal');
        this.fx.shockwave(defender._screenX, defender._screenY, '#ffae3b', 220, 0.6);
        this.fx.fireBloom(defender._screenX, defender._screenY, 1.8);
        const ringBase = defender.mag * (rev.revive?.ringPower ?? 2.0);
        for (const e of this.enemies) {
          if (e.dead) continue;
          let d = Math.max(1, Math.floor(ringBase - e.def * 0.5));
          if (e.weak?.includes('fire')) d = Math.floor(d * 1.5);
          e.hp = Math.max(0, e.hp - d);
          e.hitFlash = 0.25;
          e.shake = 0.3;
          this.fx.fireBloom(e._screenX, e._screenY, 1.2);
          this.popups.push({ text: '-' + d, x: e._screenX || 0, y: (e._screenY || 0) - 20, life: 0.9, max: 0.9, color: '#ff7a3b' });
          if (e.hp <= 0) { e.dead = true; this._addLog(`${e.name} falls!`); }
        }
        audio.play('magic');
      } else {
        defender.dead = true;
        this._addLog(`${defender.name} is KO'd!`);
      }
    }
    if (defender.kind !== 'player' && defender.hp <= 0 && !wasDead) {
      defender.dead = true;
      this._addLog(`${defender.name} falls!`);
    }
    // Vengeful Sigil — passive retaliation. Player who survived a hit with a
    // counter linker fires their counter skill at the attacker. Counters
    // never trigger more counters (the `_isCounter` flag suppresses recursion).
    if (defender.kind === 'player' && defender.hp > 0 && defender.counterSkill
        && attacker && attacker !== defender && !attacker.dead
        && !skill?._isCounter) {
      this._delay(0.45, () => this._triggerCounter(defender, attacker));
    }
  }

  _triggerCounter(defender, attacker) {
    if (defender.dead) return;
    const skillId = defender.counterSkill;
    if (!skillId) return;
    const linkerFx = defender.counterLinkers || [];
    const lk = linkerFx.includes('quad') ? 'quad' : linkerFx.includes('double') ? 'double' : '';
    const castCount = lk === 'quad' ? 4 : lk === 'double' ? 2 : 1;
    const aoe = linkerFx.includes('all');
    if (skillId === 'attack') {
      // Basic-attack counter — free, no MP gate. Honors AoE / cast-count
      // linkers if the player composed them in the same link group.
      const targets = aoe
        ? this.enemies.filter(e => !e.dead)
        : (attacker.dead ? [] : [attacker]);
      if (!targets.length) return;
      this._addLog(`${defender.name} counters!`);
      for (let n = 0; n < castCount; n++) {
        const isLast = n === castCount - 1;
        this._delay(n * 0.18, () => {
          if (defender.dead) return;
          const live = targets.filter(t => !t.dead);
          if (live.length) {
            for (const t of live) {
              this.fx.slashHit(t._screenX, t._screenY);
              this._applyDamage(defender, t, defender.atk * 1.0, 'phys', { _isCounter: true });
            }
            audio.play('hit');
          }
          if (isLast) this._delay(0.25, () => this._checkEnd());
        });
      }
      return;
    }
    const baseSk = SKILL_BY_ID[skillId];
    if (!baseSk) return;
    // Compose linker effects onto the counter skill (AoE, 2×, 4× — counter
    // itself is filtered out by _composeLinkers so it can't recurse).
    const chained = this._composeLinkers(baseSk, linkerFx);
    const targets = chained.target === 'all'
      ? this.enemies.filter(e => !e.dead)
      : (attacker.dead ? [] : [attacker]);
    if (!targets.length) return;
    // Counter pays half the chained MP cost (which already factors in the
    // linker premiums). Still cheaper than casting it normally.
    const cost = Math.ceil((chained.cost || 0) * 0.5);
    if (defender.mp < cost) {
      this._addLog(`${defender.name} tries to counter but lacks MP.`);
      return;
    }
    defender.mp -= cost;
    const linkerLabel = lk === 'quad' ? ' (×4)' : lk === 'double' ? ' (×2)' : '';
    this._addLog(`${defender.name} counters with ${baseSk.name}${linkerLabel}!`);
    const color = this._elementColor(baseSk.element);
    const scale = this._spellScale(baseSk);
    this.fx.magicCircle(defender._screenX, defender._screenY, color, 0.4, scale * 0.8);
    audio.play('magic');
    const counterSk = { ...chained, _isCounter: true };
    const dmgBase = baseSk.kind === 'magic' ? defender.mag : defender.atk;
    for (let n = 0; n < castCount; n++) {
      const isLast = n === castCount - 1;
      this._delay(0.18 + n * 0.45, () => {
        if (defender.dead) return;
        const live = targets.filter(t => !t.dead);
        if (live.length) {
          for (const t of live) {
            this._playSpellHit(baseSk, t);
            this._applyDamage(defender, t, dmgBase * (chained.power || 1), baseSk.element, counterSk);
          }
        }
        if (isLast) this._delay(0.25, () => this._checkEnd());
      });
    }
  }

  _healMember(m, amount) {
    const heal = Math.min(amount, m.maxHp - m.hp);
    m.hp += heal;
    this.popups.push({ text: '+' + heal, x: m._screenX || 0, y: (m._screenY || 0) - 20, life: 0.9, max: 0.9, color: '#8aff8a' });
  }

  // --- Util ------------------------------------------------------------------

  _addLog(text) { this.log.push(text); if (this.log.length > 4) this.log.shift(); this.game.ui.updateBattleLog(this.log); }
  _delay(seconds, fn) { setTimeout(fn, seconds * 1000); }

  // --- Render ----------------------------------------------------------------

  update(dt) {
    this.t += dt;
    if (this.battleShake > 0) this.battleShake = Math.max(0, this.battleShake - dt * 18);
    for (const e of this.enemies) {
      e.t += dt;
      if (e.hitFlash > 0) e.hitFlash -= dt;
      if (e.shake > 0) e.shake -= dt;
    }
    for (const p of this.party) {
      if (p.hitFlash > 0) p.hitFlash -= dt;
      if (p.shake > 0) p.shake -= dt;
    }
    if (this.attackAnim) {
      this.attackAnim.t += dt;
      if (this.attackAnim.t >= this.attackAnim.dur) this.attackAnim = null;
    }
    for (const pop of this.popups) pop.life -= dt;
    this.popups = this.popups.filter(p => p.life > 0);
    this.fx.update(dt);
    this._advanceAtb(dt);
    this.game.ui.renderPartyBars(this);
  }

  draw(ctx) {
    const W = this.game.viewW, H = this.game.viewH;
    if (!this.bgGradient) {
      this.bgGradient = ctx.createLinearGradient(0, 0, 0, H);
      this.bgGradient.addColorStop(0, '#2a1a40');
      this.bgGradient.addColorStop(1, '#0a0f20');
    }
    // Battle-wide camera shake (set by tier-3+ spell casts and big impacts).
    // Drawn before the bg so the entire scene moves together.
    let bgShakeX = 0, bgShakeY = 0;
    if (this.battleShake > 0) {
      const s = this.battleShake;
      bgShakeX = (Math.random() - 0.5) * s * 2;
      bgShakeY = (Math.random() - 0.5) * s * 2;
    }
    ctx.save();
    if (bgShakeX || bgShakeY) ctx.translate(bgShakeX, bgShakeY);
    ctx.fillStyle = this.bgGradient;
    ctx.fillRect(-bgShakeX, -bgShakeY, W, H);

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(W / 2, H * 0.7, W * 0.6, H * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Enemies: top half, spread horizontally. For 4+ enemies we split into a
    // back row (smaller, higher up) and a front row so things don't overlap.
    const alive = this.enemies;
    const n = alive.length;
    const twoRow = n >= 4;
    // Row plan: each row gets a y, scale, and the enemy indices it holds.
    let rows;
    if (!twoRow) {
      rows = [{ y: H * 0.36, scale: 1.0, indices: Array.from({length: n}, (_, i) => i) }];
    } else {
      const back = Math.ceil(n / 2);
      const front = n - back;
      rows = [
        { y: H * 0.27, scale: 0.82, indices: Array.from({length: back}, (_, i) => i) },
        { y: H * 0.45, scale: 1.0,  indices: Array.from({length: front}, (_, i) => i + back) },
      ];
    }
    for (const row of rows) {
      const slotW = W / (row.indices.length + 1);
      for (let j = 0; j < row.indices.length; j++) {
        const e = alive[row.indices[j]];
        const baseX = slotW * (j + 1);
        const baseY = row.y;
        e._screenX = baseX;
        e._screenY = baseY;
        const shake = e.shake > 0 ? (Math.random() - 0.5) * 6 : 0;
        ctx.save();
        ctx.translate(baseX + shake, baseY);
        if (row.scale !== 1) ctx.scale(row.scale, row.scale);
        if (e.dead) ctx.globalAlpha = 0.25;
        if (e.hitFlash > 0) { ctx.shadowColor = '#fff'; ctx.shadowBlur = 20; }
        e.template.draw(ctx, e);
        ctx.restore();
        this._drawEnemyNameplate(ctx, e, baseX, baseY, row.scale);
      }
    }

    // Party — spread horizontally across the lower half, mirroring enemies.
    const partyCount = this.party.length;
    const partyY = H * 0.66;
    const partySlotW = W / (partyCount + 1);
    for (let i = 0; i < partyCount; i++) {
      const p = this.party[i];
      const pX = partySlotW * (i + 1);
      const pY = partyY;
      p._screenX = pX;
      p._screenY = pY;
      const shake = p.shake > 0 ? (Math.random() - 0.5) * 5 : 0;
      ctx.save();
      ctx.translate(pX + shake, pY);
      if (this.attackAnim?.attacker === p) {
        // Party is at the bottom; lunge upward toward the enemy line.
        ctx.translate(0, -60 * Math.sin(this.attackAnim.t / this.attackAnim.dur * Math.PI));
      }
      if (p.dead) ctx.globalAlpha = 0.3;
      if (p.hitFlash > 0) { ctx.shadowColor = '#fff'; ctx.shadowBlur = 20; }
      drawHero(ctx, p.classId, this.t + i * 0.5, 26);
      // Highlight ring for whoever is currently acting.
      if (this.actor === p && !p.dead) {
        ctx.strokeStyle = '#ffd84d';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ffd84d'; ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    }

    // Spell/effect particles + flashes sit above sprites but below damage popups.
    this.fx.draw(ctx);

    for (const pop of this.popups) {
      const a = pop.life / pop.max;
      const yOff = (1 - a) * 40;
      ctx.save();
      ctx.globalAlpha = a;
      // Large popups (currently OVERKILL) — bigger font, thicker outline,
      // and an extra dark backing-glow so they punch through bright FX layers.
      if (pop.large) {
        ctx.font = 'bold 30px system-ui';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 14;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 6;
        ctx.strokeText(pop.text, pop.x, pop.y - yOff);
        ctx.shadowBlur = 0;
        // Outer color glow
        ctx.shadowColor = pop.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = pop.color;
        ctx.fillText(pop.text, pop.x, pop.y - yOff);
      } else {
        ctx.fillStyle = pop.color;
        ctx.font = 'bold 22px system-ui';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText(pop.text, pop.x, pop.y - yOff);
        ctx.fillText(pop.text, pop.x, pop.y - yOff);
      }
      ctx.restore();
    }
    // Close the camera-shake transform opened at the top of draw().
    ctx.restore();
  }
}

