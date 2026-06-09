import { TileMap } from '../world/tilemap.js';
import { MAPS } from '../world/maps.js';
import { TILE_SIZE } from '../world/tiles.js';
import { audio } from '../audio.js';
import { drawHero } from '../heroSprites.js';
import { drawNpc as drawNpcSprite } from '../npcSprites.js';
import { Effects } from '../effects.js';
import { createEnemyInstance } from '../data/enemies.js';
import { createGemInstance } from '../data/gems.js';
import { SummonBinding } from './summonBinding.js';
import { drawOverworldEnemy } from '../data/overworldEnemySprites.js';

export class Overworld {
  constructor(game, spawnOverride) {
    this.game = game;
    this.mapData = MAPS[game.currentMapId];
    this.map = new TileMap(this.mapData);
    const ow = this.game.player.overworld;
    const start = spawnOverride ?? this.mapData.playerStart;
    if (ow.x == null || ow.y == null) {
      ow.x = (start.tx + 0.5) * TILE_SIZE;
      ow.y = (start.ty + 0.5) * TILE_SIZE;
      ow.facing = 0;
    }
    // Random encounters — accumulate pixels walked, roll against the map's
    // encounter pool when we cross a randomized threshold.
    this.distSinceEncounter = -240; // grace period after entering a map
    this.nextEncounterDist = this._rollEncounterDist();
    const recruited = this.game.recruited || new Set();
    this.npcs = (this.mapData.npcs || [])
      .filter(n => {
        if (n.kind === 'recruit' && recruited.has(n.id)) return false;
        // Non-recruit NPC that should vanish once a tied recruit has joined.
        if (n.hideIfRecruited && recruited.has(n.hideIfRecruited)) return false;
        // Story flag gate: NPC vanishes once the named flag is set
        // (e.g. Bren is gone once chapter 1 is finished).
        if (n.hideIfFlag && this.game.flags.has(n.hideIfFlag)) return false;
        // Story flag gate the other direction: appears only after a flag is set
        // (Cal shows up post-rescue, for example). Matches the cutscene/door
        // pattern that already uses `requires` elsewhere.
        if (n.requires && !this.game.flags.has(n.requires)) return false;
        return true;
      })
      .map(n => ({
        ...n,
        x: (n.tx + 0.5) * TILE_SIZE,
        y: (n.ty + 0.5) * TILE_SIZE,
        t: 0,
      }));
    const searched = this.game.searched || new Set();
    this.searchables = (this.mapData.searchables || [])
      .filter(s => !searched.has(s.id))
      .map(s => ({
        ...s,
        x: (s.tx + 0.5) * TILE_SIZE,
        y: (s.ty + 0.5) * TILE_SIZE,
        t: 0,
      }));
    this.nearestSearchable = null;
    // Visible chapter-1 corridor enemies — they idle on the overworld until the
    // player gets within `detectRadius` tiles, then charge and trigger a
    // pre-battle cutscene. Defeated ones are filtered out via game.defeatedEnemies.
    // Migration: chapter-1 corridor maps are empty for saves that already cleared
    // the Hollow Warden — they've effectively finished the corridor narratively.
    const defeated = this.game.defeatedEnemies || new Set();
    const corridorPostChapter1 = ['meadow', 'meadowBrook', 'meadowApproach']
      .includes(this.mapData.id) && this.game.flags.has('cave:warden');
    this.overworldEnemies = corridorPostChapter1 ? [] : (this.mapData.overworldEnemies || [])
      .filter(oe => !defeated.has(oe.id))
      .map(oe => {
        // Two shapes supported:
        //  - Legacy (visible from start): `tx`/`ty` + `spriteId` — one enemy
        //    pacing the map, detected via `detectRadius` (kept for any maps
        //    that want the old behavior).
        //  - Ambush (invisible until triggered): `trigger` (single tile or
        //    {tx,ty,w,h} region) + `spawn[]` (one entry per mob with its own
        //    tile + spriteId). Crosses the trigger and they burst from the
        //    spawn tiles with a flourish, then charge the player.
        const ambush = !!oe.trigger;
        const spawns = ambush
          ? oe.spawn.map((sp, i) => ({
              spriteId: sp.spriteId,
              homeX: (sp.tx + 0.5) * TILE_SIZE,
              homeY: (sp.ty + 0.5) * TILE_SIZE,
              x: (sp.tx + 0.5) * TILE_SIZE,
              y: (sp.ty + 0.5) * TILE_SIZE,
              t: i * 0.13, // staggered idle phase so they don't bob in lockstep
              scale: 0,    // grows from 0 to 1 during 'triggered'
              idx: i,
            }))
          : [{
              spriteId: oe.spriteId,
              homeX: (oe.tx + 0.5) * TILE_SIZE,
              homeY: (oe.ty + 0.5) * TILE_SIZE,
              x: (oe.tx + 0.5) * TILE_SIZE,
              y: (oe.ty + 0.5) * TILE_SIZE,
              t: 0, scale: 1, idx: 0,
            }];
        return {
          ...oe,
          _ambush: ambush,
          _spawns: spawns,
          t: 0,
          // For ambush: hidden | triggered | charging
          // For legacy: idle | spotted | charging
          state: ambush ? 'hidden' : 'idle',
          stateT: 0,
          facing: 0,
        };
      });
    this.preBattleCutscene = null;
    this._pendingDefeatedFlag = null;
    this._pendingPostLines = null;
    this.encounter = null;
    this.encounterT = 0;
    this.transition = null;
    this.transitionT = 0;
    this.stepTimer = 0;
    this.nearestNpc = null;
    // Trail of recent leader positions so followers lag smoothly behind.
    // Capped — long enough for a party of MAX_PARTY at a comfortable spacing.
    this.leaderTrail = [{ x: ow.x, y: ow.y, facing: ow.facing || 0 }];
    this.moving = false;
    this.fx = new Effects();
    this.cinematicLock = 0; // seconds; when >0 player input is disabled.
    this.ambientT = 0;
    if (this.mapData.music) audio.startMusic(this.mapData.music);
    if (this.mapData.ambient) audio.startAmbient(this.mapData.ambient);
    else audio.stopAmbient();
    // One-shot cutscenes — each has its own setting flag, plus an optional
    // `requires` flag list that gates when it fires. The first matching unfired
    // cutscene plays on this entry. Maps can declare a single `enterCutscene`
    // (back-compat) or an array `cutscenes` for multiple beats (intro / epilogue).
    const cutscenes = this.mapData.cutscenes
      ? this.mapData.cutscenes
      : (this.mapData.enterCutscene ? [this.mapData.enterCutscene] : []);
    let firedCutscene = false;
    for (const cs of cutscenes) {
      if (this.game.flags.has(cs.flag)) continue;
      if (cs.requires && !this._meetsCutsceneRequires(cs.requires)) continue;
      this.cinematicLock = 999;
      this.game.flags.add(cs.flag);
      this.game.save();
      // Bespoke visual + sfx layer fires the moment the cutscene starts.
      if (cs.visual) this._playCutsceneVisual(cs.visual);
      const csFlag = cs.flag;
      setTimeout(() => {
        this.game.ui.showDialog(cs.speaker || '', cs.lines, ['Press onward'], () => {
          this.cinematicLock = 0;
          this._maybeTriggerPostCutsceneEvent(csFlag);
        });
      }, cs.delay ?? 280);
      firedCutscene = true;
      break;
    }
    // Migration / catch-up: if no cutscene fired but the player should have
    // already received the first summon, kick off the binding now. Covers
    // saves from before the binding hook existed.
    if (!firedCutscene && this.mapData.id === 'bloomArena'
        && this.game.flags.has('bloomArena:epilogue')
        && !this.game.flags.has('stagShard:bound')) {
      setTimeout(() => this._playStagBinding(), 600);
    }
  }

  // Cutscene visual library — each cutscene declares one of these by id.
  // Adds a particle / shockwave / colored haze flourish + an audio cue so
  // no cutscene is text-only.
  _playCutsceneVisual(id) {
    const ow = this.game.player.overworld;
    const cx = ow.x, cy = ow.y;
    if (id === 'forest-corruption') {
      // Sour-green spore motes converging on the party — the Reach takes notice.
      audio.play('rift');
      // Sickly chartreuse wash across the whole scene.
      this.fx.sceneTint('#9aaa5b', 0.22, 5.0, 0.18, 0.30);
      for (let i = 0; i < 40; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = 220 + Math.random() * 180;
        this.fx.spawn({
          x: cx + Math.cos(ang) * dist, y: cy + Math.sin(ang) * dist,
          vx: -Math.cos(ang) * 60, vy: -Math.sin(ang) * 60,
          gravity: 0, drag: 0.3,
          size: 2 + Math.random() * 1.2,
          color: ['#9aaa5b', '#6a7a3b', '#3a5a2a', '#c8c060'][Math.floor(Math.random() * 4)],
          life: 1.8 + Math.random() * 0.8, shrink: true, glow: 8,
        });
      }
      this.fx.shockwave(cx, cy, '#6a7a3b', 240, 1.2);
    } else if (id === 'deep-dread') {
      // Slow violet shockwave + black ash falling — the corruption is here.
      audio.play('rift');
      audio.play('bossThump');
      // Deep violet wash washes over the whole scene — the corruption isn't
      // distant any more, it's coloring the air.
      this.fx.sceneTint('#7020aa', 0.32, 5.5, 0.18, 0.30);
      this.fx.shockwave(cx, cy, '#a060ff', 360, 1.4);
      this.fx.shockwave(cx, cy, '#3a1a6a', 200, 0.9);
      for (let i = 0; i < 60; i++) {
        this.fx.spawn({
          x: cx + (Math.random() - 0.5) * 600,
          y: cy - 240 - Math.random() * 120,
          vx: (Math.random() - 0.5) * 6, vy: 18 + Math.random() * 18,
          gravity: 4, drag: 0.4,
          size: 1.4 + Math.random() * 1.2,
          color: 'rgba(80,40,120,0.85)',
          life: 3.5 + Math.random() * 1.5, shrink: false, glow: 4,
        });
      }
    } else if (id === 'sanctum-awe') {
      // Warm ember rise + magenta leyline-bloom — Sable's place feels sacred.
      audio.play('ember');
      audio.play('confirm');
      // Warm amber wash for "sacred place / lit by old lanterns."
      this.fx.sceneTint('#ff9a3b', 0.20, 5.5, 0.20, 0.32);
      this.fx.magicCircle(cx, cy, '#ff8a3b', 1.4, 1.4);
      for (let i = 0; i < 28; i++) {
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.7;
        const sp = 50 + Math.random() * 100;
        this.fx.spawn({
          x: cx + (Math.random() - 0.5) * 80, y: cy + 30,
          vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
          gravity: -6, drag: 0.4,
          size: 1.6 + Math.random() * 1.2,
          color: ['#ff8a3b', '#ffae3b', '#fff5b0', '#c060ff'][Math.floor(Math.random() * 4)],
          life: 1.8 + Math.random() * 0.8, shrink: false, glow: 8,
        });
      }
      this.fx.shockwave(cx, cy, '#ffae3b', 160, 0.7);
    } else if (id === 'bloom-arena-intro') {
      // Heavy violet vignette via dense petal-motes; aether wail.
      audio.play('aetherWail');
      audio.play('rift');
      // Deep magenta-violet wash — the strongest tint of the chapter.
      this.fx.sceneTint('#a060ff', 0.38, 6.0, 0.15, 0.25);
      this.fx.shockwave(cx, cy, '#a060ff', 420, 1.6);
      for (let i = 0; i < 80; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = 80 + Math.random() * 300;
        this.fx.spawn({
          x: cx + Math.cos(ang) * dist, y: cy + Math.sin(ang) * dist,
          vx: Math.cos(ang) * 20, vy: Math.sin(ang) * 20,
          gravity: 0, drag: 0.2,
          size: 2 + Math.random() * 1.4,
          color: ['#a060ff', '#ff60ff', '#3a1a6a'][Math.floor(Math.random() * 3)],
          life: 2.2 + Math.random() * 1.0, shrink: false, glow: 9,
        });
      }
    } else if (id === 'bloom-dissolve') {
      // Bloom epilogue — violet ash drifting + a transient Vael silhouette
      // (a quick particle-figure that fades) + rift hum.
      audio.play('rift');
      // White wash that decays into violet — the rift closing.
      this.fx.sceneTint('#ffffff', 0.55, 1.0, 0.05, 0.55);
      this.fx.sceneTint('#c060ff', 0.28, 5.5, 0.20, 0.30);
      // Ash drift outward + up
      for (let i = 0; i < 90; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 20 + Math.random() * 80;
        this.fx.spawn({
          x: cx + (Math.random() - 0.5) * 50, y: cy + (Math.random() - 0.5) * 40,
          vx: Math.cos(ang) * sp * 0.4, vy: -30 - Math.random() * 50,
          gravity: -4, drag: 0.4,
          size: 1.6 + Math.random() * 1.4,
          color: ['#c060ff', '#a060ff', '#6020a0', '#ffffff'][Math.floor(Math.random() * 4)],
          life: 2.4 + Math.random() * 1.4, shrink: false, glow: 8,
        });
      }
      this.fx.shockwave(cx, cy, '#a060ff', 200, 1.0);
      // Brief silhouette: a column of dense motes above the player that fades.
      setTimeout(() => {
        for (let i = 0; i < 50; i++) {
          // Roughly outline a head + shoulders by sampling positions
          const t = i / 50;
          const sx = cx + (Math.random() - 0.5) * (10 + t * 30);
          const sy = cy - 70 + t * 70;
          this.fx.spawn({
            x: sx, y: sy, vx: 0, vy: -6,
            gravity: -2, drag: 0.3,
            size: 2, color: '#d0a0ff',
            life: 1.4, shrink: true, glow: 7,
          });
        }
        audio.play('ember');
      }, 700);
    }
  }

  _meetsCutsceneRequires(req) {
    const list = Array.isArray(req) ? req : [req];
    return list.every(r =>
      this.game.flags.has(r)
      || this.game.recruited?.has(r)
      || this.game.defeatedEnemies?.has(r));
  }

  // Hook for one-shot cinematics that fire AFTER a cutscene's dialog closes
  // (the cutscene flag is already set at this point). Currently used to launch
  // the first-summon binding scene right after the Bloom epilogue lands.
  _maybeTriggerPostCutsceneEvent(csFlag) {
    if (csFlag === 'bloomArena:epilogue' && !this.game.flags.has('stagShard:bound')) {
      this._playStagBinding();
    }
  }

  _playStagBinding() {
    // Pause the overworld loop. SummonBinding owns the canvas + input for
    // its duration and resumes us via the onDone callback. We delay the start
    // by 400ms so the synthetic post-tap "click" from the dialog button
    // doesn't immediately skip the binding.
    this.cinematicLock = 999;
    this.game.running = false;
    setTimeout(() => {
      const binding = new SummonBinding(
        this.game.canvas,
        this.game.ctx,
        this.game.input,
        () => {
          const inst = createGemInstance('stagShard');
          if (inst) this.game.inventory.gems.push(inst);
          this.game.flags.add('stagShard:bound');
          this.game.save();
          this.game.ui.toast('Received Stag-Shard');
          audio.play('levelup');
          this.cinematicLock = 0;
          this.game.running = true;
          this.game.lastT = performance.now();
          requestAnimationFrame(t => this.game.tick(t));
        },
      );
      binding.start();
    }, 400);
  }

  update(dt) {
    this.fx.update(dt);
    // Hold-to-fast-forward applies during the two RAF-driven overworld
    // cutscenes (boss intro + pre-battle ambush). Quick taps still trigger
    // skip via the existing tap handlers; long holds (>350ms) accelerate
    // playback 4× until released.
    const cutsceneActive = this.bossCutscene || this.preBattleCutscene;
    if (cutsceneActive && this.game.input.active) {
      this._cutscenePressT = (this._cutscenePressT || 0) + dt;
      if (this._cutscenePressT > 0.35) {
        this._cutsceneFf = true;
        dt *= 4;
      }
    } else {
      this._cutscenePressT = 0;
      this._cutsceneFf = false;
    }
    if (this.bossCutscene) { this._updateBossCutscene(dt); return; }
    if (this.preBattleCutscene) { this._updatePreBattleCutscene(dt); return; }
    if (this.game.menu?.open) return;
    if (this.cinematicLock > 0) {
      this.cinematicLock -= dt;
      // Still let NPCs animate and trail tick, but skip player movement/encounters.
      for (const n of this.npcs) n.t += dt;
      for (const oe of this.overworldEnemies) oe.t += dt;
      return;
    }
    // Drop any NPCs that have just been recruited so they vanish from the world.
    const recruited = this.game.recruited;
    if (recruited && recruited.size) {
      const before = this.npcs.length;
      this.npcs = this.npcs.filter(n => !(n.kind === 'recruit' && recruited.has(n.id)));
      if (this.npcs.length !== before) this.nearestNpc = null;
    }
    // Drop any searchables the player has just claimed so the prompt goes away.
    const searched = this.game.searched;
    if (searched && searched.size && this.searchables.length) {
      const before = this.searchables.length;
      this.searchables = this.searchables.filter(s => !searched.has(s.id));
      if (this.searchables.length !== before) this.nearestSearchable = null;
    }
    // Drop any overworld enemies the player has just defeated.
    const defeated = this.game.defeatedEnemies;
    if (defeated && defeated.size && this.overworldEnemies.length) {
      this.overworldEnemies = this.overworldEnemies.filter(oe => !defeated.has(oe.id));
    }
    // After a scripted fight, surface any postLines once we're back in the
    // overworld and not inside another cutscene.
    if (this._pendingPostLines && !this.encounter && !this.transition) {
      const lines = this._pendingPostLines;
      this._pendingPostLines = null;
      this.cinematicLock = 999;
      this.game.ui.showDialog('', lines, ['Onward'], () => { this.cinematicLock = 0; });
      return;
    }
    if (this.encounter) {
      this.encounterT += dt;
      if (this.encounterT > 0.7) this.game.enterBattle(this.encounter.enemyIds, this.encounter.key);
      return;
    }
    if (this.transition) {
      this.transitionT += dt;
      if (this.transitionT > 0.5) {
        const t = this.transition;
        this.transition = null;
        this.game.transitionTo(t.target, t.targetTx, t.targetTy);
      }
      return;
    }

    const ow = this.game.player.overworld;
    const input = this.game.input;
    const speed = 150;
    const r = 12;
    // Tick visible-enemy state machines BEFORE reading player input. An active
    // ambush (any enemy in 'triggered' or 'charging') locks player movement
    // and short-circuits the rest of update.
    if (this.overworldEnemies.length) {
      this._updateOverworldEnemies(dt, ow);
      if (this.preBattleCutscene) return;
    }
    const ambushActive = this.overworldEnemies.some(
      oe => oe.state === 'triggered' || oe.state === 'charging'
    );
    const inX = ambushActive ? 0 : input.dirX * input.magnitude * speed * dt;
    const inY = ambushActive ? 0 : input.dirY * input.magnitude * speed * dt;
    const beforeX = ow.x, beforeY = ow.y;
    if (this.map.walkable(ow.x + inX, ow.y, r) && !this._npcAt(ow.x + inX, ow.y, r)) ow.x += inX;
    if (this.map.walkable(ow.x, ow.y + inY, r) && !this._npcAt(ow.x, ow.y + inY, r)) ow.y += inY;
    this.moving = !ambushActive && input.magnitude > 0.05;
    if (this.moving) {
      ow.facing = Math.atan2(input.dirY, input.dirX);
      this.stepTimer += dt;
      if (this.stepTimer > 0.32) { this.stepTimer = 0; audio.play('step'); }
    }
    const dx = ow.x - beforeX, dy = ow.y - beforeY;

    this._spawnAmbient(dt);

    // Accumulate distance actually traveled and roll for random encounter.
    const moved = Math.hypot(ow.x - beforeX, ow.y - beforeY);
    if (moved > 0 && (this.mapData.encounters?.length) && !this.game.encountersDisabled) {
      this.distSinceEncounter += moved;
      if (this.distSinceEncounter >= this.nextEncounterDist) {
        this.distSinceEncounter = 0;
        this.nextEncounterDist = this._rollEncounterDist();
        const pick = pickEncounter(this.mapData.encounters, this.game.party.length);
        if (pick) {
          this.encounter = { key: 'random:' + performance.now().toFixed(0), enemyIds: pick.enemyIds };
          this.encounterT = 0;
          audio.play('encounter');
        }
      }
    }
    // Push to leader trail when the leader has actually moved a bit.
    const head = this.leaderTrail[0];
    if (Math.hypot(ow.x - head.x, ow.y - head.y) > 2) {
      this.leaderTrail.unshift({ x: ow.x, y: ow.y, facing: ow.facing });
      if (this.leaderTrail.length > 240) this.leaderTrail.pop();
    }

    // Door check (the player's tile)
    const ptx = Math.floor(ow.x / TILE_SIZE);
    const pty = Math.floor(ow.y / TILE_SIZE);
    // Track which gated tile last toasted so we don't spam while standing on it.
    if (this._lastGatedTile && (this._lastGatedTile.tx !== ptx || this._lastGatedTile.ty !== pty)) {
      this._lastGatedTile = null;
    }
    for (const d of (this.mapData.doors || [])) {
      if (d.tx === ptx && d.ty === pty) {
        // Boss gate — fire encounter instead of transitioning, once.
        const blocker = (this.mapData.bossEvents || []).find(b =>
          b.tx === ptx && b.ty === pty &&
          !this.game.flags.has(b.id) &&
          this._meetsBossRequires(b));
        if (blocker) { this._triggerBossEncounter(blocker); return; }
        // Rest gate — first time crossing before resting, swap the door for
        // an auto-rest cutscene (fade to night, wake at dawn). After it runs,
        // `town:rested` is set and the same tile transitions normally.
        if (d.restGate && !this.game.flags.has('town:rested')) {
          this._playRestCutscene();
          return;
        }
        // Story gate — door requires a flag/recruit to open.
        if (d.requires && !this._meetsBossRequires(d)) {
          if (!this._lastGatedTile) {
            this._lastGatedTile = { tx: ptx, ty: pty };
            this.game.ui.toast(d.lockedMsg || 'The way is barred.');
            audio.play('hurt');
          }
          return;
        }
        this.transition = d;
        this.transitionT = 0;
        audio.play('confirm');
        return;
      }
    }
    // Pending-door tiles — purely informational gates (no actual destination yet).
    for (const pd of (this.mapData.pendingDoors || [])) {
      if (pd.tx === ptx && pd.ty === pty) {
        if (!this._lastGatedTile) {
          this._lastGatedTile = { tx: ptx, ty: pty };
          this.game.ui.toast(pd.lockedMsg || 'You cannot continue this way yet.');
          audio.play('hurt');
        }
        return;
      }
    }
    // Standalone boss events — fire on tile entry even when there is no door
    // at that spot (mid-map ambush bosses). Door-co-located events are handled
    // above and excluded here so they don't double-fire.
    for (const b of (this.mapData.bossEvents || [])) {
      if (b.tx === ptx && b.ty === pty &&
          !this.game.flags.has(b.id) &&
          this._meetsBossRequires(b) &&
          !(this.mapData.doors || []).some(d => d.tx === b.tx && d.ty === b.ty)) {
        this._triggerBossEncounter(b);
        return;
      }
    }

    // Nearest NPC for interact prompt
    this.nearestNpc = null;
    let bestD = 40 * 40;
    for (const n of this.npcs) {
      n.t += dt;
      const d2 = (n.x - ow.x) ** 2 + (n.y - ow.y) ** 2;
      if (d2 < bestD) { bestD = d2; this.nearestNpc = n; }
    }
    // Nearest searchable (only surfaces if no NPC is closer).
    this.nearestSearchable = null;
    let bestSD = 36 * 36;
    for (const s of this.searchables) {
      s.t += dt;
      const d2 = (s.x - ow.x) ** 2 + (s.y - ow.y) ** 2;
      if (d2 < bestSD) { bestSD = d2; this.nearestSearchable = s; }
    }
    if (this.nearestNpc && this.nearestSearchable) {
      const nd = (this.nearestNpc.x - ow.x) ** 2 + (this.nearestNpc.y - ow.y) ** 2;
      if (nd <= bestSD) this.nearestSearchable = null;
    }
    // Sparkle hint over "hidden" searchables — only sparkle the single
    // closest one to the player, so two are never advertised on the same
    // screen at once. Find the next one only by walking toward it.
    let sparkleTarget = null;
    let sparkBest = Infinity;
    for (const s of this.searchables) {
      if (s.kind !== 'hidden') continue;
      const d2 = (s.x - ow.x) ** 2 + (s.y - ow.y) ** 2;
      if (d2 < sparkBest) { sparkBest = d2; sparkleTarget = s; }
    }
    if (sparkleTarget && Math.random() < dt * 0.7) {
      this.fx.spawn({
        x: sparkleTarget.x + (Math.random() - 0.5) * 14, y: sparkleTarget.y - 4,
        vx: 0, vy: -14,
        gravity: 0, drag: 0.2,
        size: 1.3, color: '#ffd84d',
        life: 1.4, shrink: true, glow: 7,
      });
    }

  }

  _meetsBossRequires(ev) {
    if (!ev.requires) return true;
    // `requires` can be a recruited NPC id, a story flag, or a defeated
    // overworld enemy id (the chapter-1 corridor gates use the last form).
    if (this.game.recruited?.has(ev.requires)) return true;
    if (this.game.flags?.has(ev.requires)) return true;
    if (this.game.defeatedEnemies?.has(ev.requires)) return true;
    return false;
  }

  // First-night rest cutscene — fires when the player tries the west gate
  // before resting (Vorrin's "wait until tomorrow" promise made real). Fades
  // the world to a deep-navy night, holds, soft chime + heal sting, fades
  // back to morning light, then applies the rest and shows a dawn dialog.
  _playRestCutscene() {
    this.cinematicLock = 5.0;
    audio.play('chime');
    // Deep navy night wash — near-opaque so the world dissolves into stars.
    this.fx.sceneTint('#06122a', 0.94, 5.0, 1.0, 1.0);
    // Slow drift of starlight glints during the held night phase.
    for (let i = 0; i < 32; i++) {
      setTimeout(() => {
        if (!this.fx) return;
        const x = Math.random() * (this.game.viewW || 800);
        const y = Math.random() * (this.game.viewH || 600) * 0.55;
        this.fx.spawn({
          x, y, vx: 0, vy: -8,
          gravity: 0, drag: 0.4,
          size: 0.8 + Math.random() * 0.6,
          color: '#dceeff',
          life: 1.6 + Math.random() * 0.4,
          shrink: true, glow: 7,
        });
      }, 1100 + i * 70);
    }
    // The rest taking effect — soft heal sting at the midpoint.
    setTimeout(() => audio.play('heal'), 2400);
    // Dawn: apply the rest, release the lock, show the wake-up dialog. Push
    // the player one tile east so the same gate door doesn't insta-re-fire
    // the transition on the very next frame (door processing reads tile
    // position each frame). Refresh the NPC list so Bren — gated by
    // `requires: 'town:rested'` — actually appears at the gatepost.
    setTimeout(() => {
      if (!this.game) return;
      this.game._restAtInn(0);
      const ow = this.game.player.overworld;
      if (ow.x < TILE_SIZE * 1.0) ow.x = TILE_SIZE * 1.5;
      this._refreshNpcs();
      this.cinematicLock = 0;
      audio.play('confirm');
      this.game.ui.showDialog('Dawn', [
        '(You wake before dawn. The fire in the gatehouse has gone to embers and the road outside is still grey with mist.)',
        '(Hearthstone has gone quiet around you. Vorrin will be up — he never sleeps the whole night through any more.)',
      ], null, null);
    }, 5000);
  }

  // Re-run the NPC filter from current flags + recruited state. Used after a
  // story event flips a `requires` flag, so the gated NPC (e.g. Bren after
  // `town:rested`) appears immediately without forcing a map reload. Existing
  // NPC animation phase (`t`) is preserved so unrelated NPCs don't visibly
  // reset their bob.
  _refreshNpcs() {
    const recruited = this.game.recruited || new Set();
    const existing = new Map();
    for (const n of this.npcs) existing.set(n.id, n);
    this.npcs = (this.mapData.npcs || [])
      .filter(n => {
        if (n.kind === 'recruit' && recruited.has(n.id)) return false;
        if (n.hideIfRecruited && recruited.has(n.hideIfRecruited)) return false;
        if (n.hideIfFlag && this.game.flags.has(n.hideIfFlag)) return false;
        if (n.requires && !this.game.flags.has(n.requires)) return false;
        return true;
      })
      .map(n => existing.get(n.id) || ({
        ...n,
        x: (n.tx + 0.5) * TILE_SIZE,
        y: (n.ty + 0.5) * TILE_SIZE,
        t: 0,
      }));
    this.nearestNpc = null;
  }

  // Full boss intro: darken → particles converge → flash + materialize →
  // camera shake roar → name banner drops in → multi-line dialog → battle.
  _triggerBossEncounter(ev) {
    this.cinematicLock = 999;
    audio.stopMusic();
    audio.play('hurt');
    this.bossCutscene = {
      ev,
      phase: 0, t: 0,
      bossX: (ev.tx + 0.5) * TILE_SIZE,
      bossY: (ev.ty + 0.5) * TILE_SIZE,
      bossT: 0,
      cameraShake: 0,
      darkness: 0,
      flashAlpha: 0,
      bannerSlide: 1, // 1 = above screen, 0 = settled
      dialogShown: false,
      warden: null,
    };
  }

  _updateBossCutscene(dt) {
    const c = this.bossCutscene;
    c.t += dt; c.bossT += dt;
    c.cameraShake = Math.max(0, c.cameraShake - dt * 14);
    if (c.warden) c.warden.t = c.bossT;
    const PHASES = ['darken', 'gather', 'flash', 'roar', 'reveal', 'dialog'];
    const DURS  = [0.7, 1.5, 0.45, 0.9, 2.4, -1];
    const id = PHASES[c.phase], dur = DURS[c.phase];

    if (id === 'darken') {
      c.darkness = Math.min(0.72, (c.t / dur) * 0.72);
      if (c.t >= dur) { c.t = 0; c.phase++; }
    } else if (id === 'gather') {
      c.darkness = 0.72;
      // Converging violet motes from off-screen toward the door tile.
      const burst = Math.floor(dt * 30);
      for (let i = 0; i < burst; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = 220 + Math.random() * 160;
        const speed = dist / 0.85;
        this.fx.spawn({
          x: c.bossX + Math.cos(ang) * dist,
          y: c.bossY + Math.sin(ang) * dist,
          vx: -Math.cos(ang) * speed,
          vy: -Math.sin(ang) * speed,
          gravity: 0, drag: 0,
          size: 1.6, color: ['#a060ff','#d0a0ff','#6020a0'][Math.floor(Math.random()*3)],
          life: 0.85, shrink: false, glow: 8,
        });
      }
      // Mid-way: a low magic sting once.
      if (c.t > dur * 0.4 && !c._sting) { c._sting = true; audio.play('magic'); }
      if (c.t >= dur) {
        c.t = 0; c.phase++;
        c.flashAlpha = 1.0;
        c.cameraShake = 18;
        c.warden = createEnemyInstance(c.ev.boss);
        c.warden.t = 0;
        audio.play('encounter');
        audio.play('magic');
        this.fx.shockwave(c.bossX, c.bossY, '#a060ff', 460, 0.9);
        this.fx.shockwave(c.bossX, c.bossY, '#ffffff', 260, 0.5);
        for (let i = 0; i < 70; i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = 110 + Math.random() * 220;
          this.fx.spawn({
            x: c.bossX, y: c.bossY,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            gravity: 30, drag: 0.5,
            size: 2.5 + Math.random() * 2.5,
            color: ['#a060ff','#6020a0','#d0a0ff','#ffffff'][Math.floor(Math.random()*4)],
            life: 1.2 + Math.random() * 0.7, shrink: true, glow: 10,
          });
        }
      }
    } else if (id === 'flash') {
      c.flashAlpha = Math.max(0, 1 - c.t / dur);
      if (c.t >= dur) { c.t = 0; c.phase++; c.cameraShake = 10; }
    } else if (id === 'roar') {
      // Sustained low shake; one more sting halfway through.
      c.cameraShake = Math.max(c.cameraShake, 6 * Math.max(0, 1 - c.t / dur));
      if (c.t > dur * 0.45 && !c._roared) { c._roared = true; audio.play('crit'); audio.play('hurt'); }
      if (c.t >= dur) { c.t = 0; c.phase++; }
    } else if (id === 'reveal') {
      // Slide name banner down from above — match the ambush banner's
      // 0.30s slide so all pre-battle banners feel uniform.
      c.bannerSlide = Math.max(0, 1 - c.t / 0.30);
      if (c.t >= dur) { c.t = 0; c.phase++; }
    } else if (id === 'dialog') {
      if (!c.dialogShown) {
        c.dialogShown = true;
        const ev = c.ev;
        this.game.ui.showDialog(ev.speaker || '', ev.lines, ['Stand ready'], () => {
          this.game.enterBossBattle(ev.boss, ev.id);
        });
      }
    }
  }

  // ---- Overworld enemies (chapter-1 corridor) -------------------------------
  // Two state machines depending on `oe._ambush`:
  //
  // Ambush mode (corridor default):
  //   hidden  → triggered (player steps on `trigger` tile; locks input, mobs
  //             scale up from 0 at their spawn tiles, dust+rustle flourish)
  //   triggered (0.5s burst pause) → charging (each mob moves toward player)
  //   charging → collision (any mob within 22px of player) → pre-battle cutscene
  //
  // Legacy mode (visible-from-start, kept for back-compat):
  //   idle → spotted (player within detectRadius) → charging → collision.
  _updateOverworldEnemies(dt, ow) {
    for (const oe of this.overworldEnemies) {
      oe.t += dt;
      oe.stateT += dt;
      if (oe._ambush) {
        if (oe.state === 'hidden') {
          // Did the player just step on (or into) the trigger region?
          const tr = oe.trigger;
          const ptx = Math.floor(ow.x / TILE_SIZE);
          const pty = Math.floor(ow.y / TILE_SIZE);
          const w = tr.w ?? 1, h = tr.h ?? 1;
          if (ptx >= tr.tx && ptx < tr.tx + w
              && pty >= tr.ty && pty < tr.ty + h) {
            // If this encounter has a story dialog (e.g. Cal's rescue),
            // freeze the player and play it BEFORE the wolves burst from
            // the grass — so the ambush lands on the "here they come" beat
            // rather than mid-conversation. After dismissal, fall through
            // to the normal ambush burst.
            if (oe.preDialog && oe.preDialog.length && !oe._dialogPlayed) {
              oe._dialogPlayed = true;
              this.cinematicLock = 999;
              this.game.ui.showDialog('', oe.preDialog, ['Ready your blade'], () => {
                this.cinematicLock = 0;
                oe.state = 'triggered';
                oe.stateT = 0;
                audio.play('encounter');
                for (const mob of oe._spawns) {
                  this._spawnAmbushBurst(mob.x, mob.y, oe.flourish || 'dust');
                }
              });
              return;
            }
            oe.state = 'triggered';
            oe.stateT = 0;
            audio.play('encounter');
            // Burst FX at each spawn tile — rustle + quick shockwave + dust.
            for (const mob of oe._spawns) {
              this._spawnAmbushBurst(mob.x, mob.y, oe.flourish || 'dust');
            }
          }
        } else if (oe.state === 'triggered') {
          // Mobs scale up from 0 to 1 over the burst pause.
          const burstDur = 0.50;
          const k = Math.min(1, oe.stateT / burstDur);
          for (const mob of oe._spawns) mob.scale = k;
          if (oe.stateT >= burstDur) {
            oe.state = 'charging';
            oe.stateT = 0;
          }
        } else if (oe.state === 'charging') {
          const speed = oe.speed ?? 110;
          let collided = false;
          for (const mob of oe._spawns) {
            mob.t += dt;
            const dx = ow.x - mob.x, dy = ow.y - mob.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 1) {
              mob.x += (dx / dist) * speed * dt;
              mob.y += (dy / dist) * speed * dt;
            }
            if (dist < 22) collided = true;
          }
          if (collided) {
            this._triggerScriptedEncounter(oe);
            return;
          }
        }
      } else {
        // Legacy visible-from-start path.
        const dx = ow.x - oe._spawns[0].x, dy = ow.y - oe._spawns[0].y;
        const dist = Math.hypot(dx, dy);
        oe.facing = Math.atan2(dy, dx);
        const mob = oe._spawns[0];
        if (oe.state === 'idle') {
          const radiusPx = (oe.detectRadius ?? 4) * TILE_SIZE;
          if (dist < radiusPx) {
            oe.state = 'spotted';
            oe.stateT = 0;
            audio.play('encounter');
            this.fx.shockwave(mob.x, mob.y, '#ffd84d', 70, 0.4);
          }
        } else if (oe.state === 'spotted') {
          if (oe.stateT >= 0.40) { oe.state = 'charging'; oe.stateT = 0; }
        } else if (oe.state === 'charging') {
          const speed = oe.speed ?? 90;
          if (dist > 1) {
            mob.x += (dx / dist) * speed * dt;
            mob.y += (dy / dist) * speed * dt;
          }
          if (dist < 22) {
            this._triggerScriptedEncounter(oe);
            return;
          }
        }
      }
    }
  }

  _spawnAmbushBurst(x, y, flourish) {
    // Quick rustle + dust kick when mobs spring from grass/bushes. Flourish
    // colors echo the per-enemy flourish so the burst reads coherent with
    // the pre-battle cutscene FX that follows.
    const palette = flourish === 'spore'
      ? ['#9aaa5b','#3a5a2a','#c8c060']
      : flourish === 'violet'
      ? ['#a060ff','#6020a0','#d0a0ff']
      : ['#d8b070','#8a6028','#5a3a1a'];
    audio.play('hit');
    this.fx.shockwave(x, y, palette[0], 90, 0.45);
    for (let i = 0; i < 22; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 70 + Math.random() * 140;
      this.fx.spawn({
        x, y,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 30,
        gravity: 220, drag: 0.9,
        size: 1.4 + Math.random() * 1.4,
        color: palette[Math.floor(Math.random() * palette.length)],
        life: 0.6, shrink: true, glow: 4,
      });
    }
  }

  _triggerScriptedEncounter(oe) {
    this.cinematicLock = 999;
    audio.stopAmbient();
    // NOTE: `preDialog` fires up front when the trigger tile is first stepped
    // on (see _updateOverworldEnemies), so by the time the wolves collide and
    // we reach here the story beat has already played.
    this._beginPreBattleCutscene(oe);
  }

  _beginPreBattleCutscene(oe) {
    this.preBattleCutscene = {
      oe,
      phase: 0,
      t: 0,
      cx: oe.x,
      cy: oe.y,
      vignette: 0,
      darkness: 0,
      bannerSlide: 1,
      flourishFired: false,
    };
  }

  // 4-phase pre-battle cutscene per overworld enemy. Bespoke FX per flourish
  // type so each fight feels distinct. Banner phase holds long enough for the
  // player to actually read both the "— ENCOUNTER —" tag and the enemy name
  // (~0.30s slide-in + ~1.4s settled hold). Total ~2.6s.
  _updatePreBattleCutscene(dt) {
    const c = this.preBattleCutscene;
    c.t += dt;
    const PHASES = ['darken', 'focus', 'banner', 'enter'];
    const DURS   = [0.30,     0.35,    1.70,     0.25];
    const id = PHASES[c.phase];
    const dur = DURS[c.phase];

    if (id === 'darken') {
      c.darkness = Math.min(0.55, (c.t / dur) * 0.55);
      if (c.t >= dur) { c.t = 0; c.phase++; }
    } else if (id === 'focus') {
      c.darkness = 0.55;
      c.vignette = Math.min(1, c.t / dur);
      if (!c.flourishFired) {
        c.flourishFired = true;
        this._playPreBattleFlourish(c.oe.flourish || 'dust', c.cx, c.cy);
      }
      if (c.t >= dur) { c.t = 0; c.phase++; }
    } else if (id === 'banner') {
      c.darkness = 0.55;
      c.vignette = 1;
      c.bannerSlide = Math.max(0, 1 - c.t / 0.30);
      if (c.t >= dur) { c.t = 0; c.phase++; audio.play('crit'); }
    } else if (id === 'enter') {
      c.darkness = 0.55 + (c.t / dur) * 0.45;
      if (c.t >= dur) {
        // Hand off to the battle. Set up flag plumbing so the post-fight
        // victory flows back into defeatedEnemies + postLines surfacing.
        const oe = c.oe;
        this.preBattleCutscene = null;
        this.cinematicLock = 0;
        if (oe.postLines) this._pendingPostLines = oe.postLines;
        this.game.enterBattle(
          oe.encounter.enemyIds,
          'scripted:' + oe.id,
          { guest: oe.guest, defeatFlag: oe.id },
        );
      }
    }
  }

  _playPreBattleFlourish(kind, cx, cy) {
    if (kind === 'dust') {
      // Hard dust shockwave + brown debris kicked up.
      audio.play('hit');
      this.fx.shockwave(cx, cy, '#d8b070', 220, 0.6);
      this.fx.shockwave(cx, cy, '#8a6028', 130, 0.45);
      for (let i = 0; i < 36; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 80 + Math.random() * 160;
        this.fx.spawn({
          x: cx, y: cy,
          vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 40,
          gravity: 220, drag: 0.9,
          size: 1.6 + Math.random() * 1.6,
          color: ['#d8b070','#8a6028','#5a3a1a','#fff5d0'][Math.floor(Math.random()*4)],
          life: 0.7 + Math.random() * 0.4, shrink: true, glow: 4,
        });
      }
    } else if (kind === 'spore') {
      // Sour-green spore burst — corruption flavored.
      audio.play('sporeBurst');
      this.fx.shockwave(cx, cy, '#9aaa5b', 200, 0.6);
      this.fx.shockwave(cx, cy, '#5a8030', 110, 0.45);
      for (let i = 0; i < 40; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 60 + Math.random() * 140;
        this.fx.spawn({
          x: cx, y: cy,
          vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
          gravity: 8, drag: 0.6,
          size: 1.8 + Math.random() * 1.6,
          color: ['#9aaa5b','#3a5a2a','#c8c060','#6a7a3b'][Math.floor(Math.random()*4)],
          life: 1.0 + Math.random() * 0.5, shrink: true, glow: 8,
        });
      }
    } else if (kind === 'violet') {
      // Violet rift opening — wraith-themed flourish.
      audio.play('rift');
      audio.play('aetherWail');
      this.fx.shockwave(cx, cy, '#a060ff', 240, 0.7);
      this.fx.shockwave(cx, cy, '#6020a0', 140, 0.5);
      this.fx.shockwave(cx, cy, '#ffffff', 80, 0.35);
      for (let i = 0; i < 44; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 90 + Math.random() * 200;
        this.fx.spawn({
          x: cx, y: cy,
          vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
          gravity: 20, drag: 0.6,
          size: 2 + Math.random() * 1.6,
          color: ['#a060ff','#6020a0','#d0a0ff','#ffffff'][Math.floor(Math.random()*4)],
          life: 1.0 + Math.random() * 0.6, shrink: true, glow: 10,
        });
      }
    }
  }

  _drawPreBattleCutsceneOverlay(ctx) {
    const c = this.preBattleCutscene;
    const W = this.game.viewW, H = this.game.viewH;
    // Darken layer
    if (c.darkness > 0) {
      ctx.fillStyle = `rgba(0,0,0,${c.darkness})`;
      ctx.fillRect(0, 0, W, H);
    }
    // Banner — slides in from above and lands centered on screen. Mid-screen
    // placement keeps it clear of the quest objective HUD strip at the top
    // and gives the encounter a more cinematic punch.
    if (c.phase >= 2 && c.bannerSlide < 1) {
      const BH = 100;
      const settled = H / 2 - BH / 2;
      const startY = -BH - 20;
      const yTop = startY + (1 - c.bannerSlide) * (settled - startY);
      ctx.save();
      const grad = ctx.createLinearGradient(0, yTop, 0, yTop + BH);
      grad.addColorStop(0, 'rgba(40,8,8,0.94)');
      grad.addColorStop(1, 'rgba(120,30,30,0.94)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, yTop, W, BH);
      ctx.fillStyle = 'rgba(255,138,59,0.85)';
      ctx.fillRect(0, yTop, W, 2);
      ctx.fillRect(0, yTop + BH - 2, W, 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd884';
      ctx.font = 'bold 14px system-ui';
      ctx.fillText('— ENCOUNTER —', W / 2, yTop + 34);
      ctx.fillStyle = '#fff5e6';
      ctx.font = 'bold 26px system-ui';
      ctx.fillText((c.oe.name || c.oe.id).toUpperCase(), W / 2, yTop + 70);
      ctx.restore();
    }
  }

  // Plays a recruit cinematic at the NPC's position, then invokes onDone.
  // Each class/id gets its own palette and effect mix — Lyra's gentle heal-motes,
  // Sable's ember-and-ash flourish, etc. Generic fallback covers the rest.
  playRecruitCinematic(npc, onDone) {
    const x = npc.x, y = npc.y;
    this.cinematicLock = 2.8;
    const id = npc.id;
    if (id === 'recruit:sable') {
      // Ember + ash recruit: warm wood-crack, slow rising sparks, soot spiral.
      this.fx.magicCircle(x, y, '#ff8a3b', 1.6, 1.8);
      audio.play('ember');
      setTimeout(() => {
        // Ember spiral inward
        for (let i = 0; i < 36; i++) {
          const a = (i / 36) * Math.PI * 2;
          const dist = 80 + Math.random() * 20;
          this.fx.spawn({
            x: x + Math.cos(a) * dist, y: y + Math.sin(a) * dist,
            vx: -Math.cos(a) * 70, vy: -Math.sin(a) * 70 - 10,
            gravity: 0, drag: 0.4,
            size: 1.8 + Math.random() * 1.2,
            color: ['#ff8a3b', '#ffae3b', '#ff5a20', '#6a4a3a'][Math.floor(Math.random() * 4)],
            life: 0.8 + Math.random() * 0.3, shrink: true, glow: 9,
          });
        }
        audio.play('ember');
      }, 600);
      setTimeout(() => {
        this.fx.shockwave(x, y, '#ff8a3b', 160, 0.85);
        this.fx.shockwave(x, y, '#fff5b0', 80, 0.5);
        // Rising column of ash + warm sparks
        for (let i = 0; i < 30; i++) {
          const ang = (Math.random() - 0.5) * Math.PI * 0.4 - Math.PI / 2;
          const sp = 50 + Math.random() * 90;
          this.fx.spawn({
            x: x + (Math.random() - 0.5) * 14, y,
            vx: Math.cos(ang) * sp * 0.4, vy: Math.sin(ang) * sp,
            gravity: -8, drag: 0.4,
            size: 1.6 + Math.random() * 1.4,
            color: ['#ff8a3b', '#ffae3b', '#fff5b0', '#3a3a48'][Math.floor(Math.random() * 4)],
            life: 1.4 + Math.random() * 0.7, shrink: false, glow: 7,
          });
        }
        audio.play('confirm');
      }, 1200);
    } else if (id === 'recruit:lyra' || npc.classId === 'white') {
      // Healing-motes recruit (Lyra-style).
      this.fx.magicCircle(x, y, '#a8ffc8', 1.6, 1.6);
      audio.play('magic');
      setTimeout(() => {
        this.fx.healingMotes(x, y, 1.6);
        audio.play('heal');
      }, 700);
      setTimeout(() => {
        this.fx.shockwave(x, y, '#d4ffd4', 140, 0.9);
        for (let i = 0; i < 24; i++) {
          const ang = Math.random() * Math.PI * 2;
          const sp = 60 + Math.random() * 60;
          this.fx.spawn({
            x, y,
            vx: Math.cos(ang) * sp, vy: -40 - Math.random() * 50,
            gravity: -10, drag: 0.6,
            size: 2, color: ['#d4ffd4', '#ffffff', '#a8ffc8'][Math.floor(Math.random() * 3)],
            life: 1.2 + Math.random() * 0.8, shrink: false, glow: 8,
          });
        }
      }, 1200);
    } else {
      // Fallback — class-tinted halo + sparks.
      const tint = npc.classId === 'black' ? '#c0a0ff'
                 : npc.classId === 'ranger' ? '#ffd84d'
                 : '#ffffff';
      this.fx.magicCircle(x, y, tint, 1.5, 1.6);
      audio.play('magic');
      setTimeout(() => {
        this.fx.shockwave(x, y, tint, 130, 0.8);
        for (let i = 0; i < 22; i++) {
          const ang = Math.random() * Math.PI * 2;
          const sp = 60 + Math.random() * 60;
          this.fx.spawn({
            x, y,
            vx: Math.cos(ang) * sp, vy: -40 - Math.random() * 40,
            gravity: -10, drag: 0.5,
            size: 2, color: tint, life: 1.2, shrink: false, glow: 8,
          });
        }
      }, 800);
    }
    setTimeout(() => {
      if (onDone) onDone();
      this.cinematicLock = 0;
    }, 2700);
  }

  // Spawn map-flavored ambient particles into the visible area on a slow ticker.
  _spawnAmbient(dt) {
    this.ambientT -= dt;
    // Lyra (and any other recruit NPC) drops occasional sparkles so she's easy to spot.
    for (const n of this.npcs) {
      if (n.kind === 'recruit' && Math.random() < dt * 2.4) {
        const npcClass = this._resolveNpcClass(n);
        const color = npcClass === 'white' ? '#a8ffc8'
                    : npcClass === 'black' ? '#c0a0ff'
                    : npcClass === 'ranger' ? '#ffd84d'
                    : '#ffffff';
        this.fx.spawn({
          x: n.x + (Math.random() - 0.5) * 18,
          y: n.y + 6,
          vx: (Math.random() - 0.5) * 8, vy: -28 - Math.random() * 14,
          gravity: -3, drag: 0.4,
          size: 1.6, color, life: 1.4, shrink: false, glow: 6,
        });
      }
    }
    if (this.ambientT > 0) return;
    this.ambientT = 0.14 + Math.random() * 0.18;
    const id = this.mapData.id;
    const ow = this.game.player.overworld;
    const vw = this.game.viewW, vh = this.game.viewH;
    const left = ow.x - vw / 2, right = ow.x + vw / 2;
    const top  = ow.y - vh / 2, bottom = ow.y + vh / 2;
    if (id === 'meadow') {
      // Pollen drifting left → right, faint butterflies (slow zigzag motes)
      for (let i = 0; i < 2; i++) {
        this.fx.spawn({
          x: left - 8, y: top + Math.random() * vh,
          vx: 18 + Math.random() * 24, vy: -3 + (Math.random() - 0.5) * 6,
          gravity: 0, drag: 0.15,
          size: 1.1 + Math.random() * 1.3,
          color: ['#ffd84d', '#fff5b0', '#ffffff', '#cfeaff'][Math.floor(Math.random() * 4)],
          life: 5 + Math.random() * 3, shrink: false, glow: 4,
        });
      }
    } else if (id === 'cave') {
      // Rising embers
      this.fx.spawn({
        x: left + Math.random() * vw, y: bottom + 10,
        vx: (Math.random() - 0.5) * 12, vy: -22 - Math.random() * 28,
        gravity: -4, drag: 0.3,
        size: 1.3 + Math.random() * 1.3,
        color: ['#ff8a3b', '#ffae3b', '#ff5a3b'][Math.floor(Math.random() * 3)],
        life: 3 + Math.random() * 2, shrink: false, glow: 7,
      });
      // Falling dust
      if (Math.random() < 0.6) {
        this.fx.spawn({
          x: left + Math.random() * vw, y: top - 8,
          vx: (Math.random() - 0.5) * 6, vy: 14 + Math.random() * 10,
          gravity: 2, drag: 0.4,
          size: 0.8 + Math.random() * 0.6,
          color: 'rgba(190,180,170,0.55)',
          life: 4 + Math.random() * 2, shrink: false, glow: 0,
        });
      }
      // Rare violet rift residue spark
      if (Math.random() < 0.08) {
        this.fx.spawn({
          x: left + Math.random() * vw, y: top + Math.random() * vh,
          vx: 0, vy: -4,
          gravity: 0, drag: 0.1,
          size: 1.8, color: '#a060ff',
          life: 1.1, shrink: true, glow: 10,
        });
      }
    } else if (id === 'town') {
      // Soft warm motes drifting upward (hearth smoke flavor)
      if (Math.random() < 0.4) {
        this.fx.spawn({
          x: left + Math.random() * vw, y: bottom + 5,
          vx: (Math.random() - 0.5) * 4, vy: -10 - Math.random() * 8,
          gravity: 0, drag: 0.1,
          size: 1.2, color: '#ffd0a0',
          life: 3, shrink: false, glow: 4,
        });
      }
    } else if (id === 'reachOuter') {
      // Pollen (like meadow) BUT with sour green motes hinting at corruption.
      for (let i = 0; i < 2; i++) {
        this.fx.spawn({
          x: left - 8, y: top + Math.random() * vh,
          vx: 14 + Math.random() * 18, vy: -3 + (Math.random() - 0.5) * 6,
          gravity: 0, drag: 0.15,
          size: 1.1 + Math.random() * 1.2,
          color: ['#cfeaff', '#fff5b0', '#ffd84d', '#cfeaff'][Math.floor(Math.random() * 4)],
          life: 5 + Math.random() * 3, shrink: false, glow: 4,
        });
      }
      // Sickly-green spore mote
      if (Math.random() < 0.35) {
        this.fx.spawn({
          x: left + Math.random() * vw, y: top + Math.random() * vh,
          vx: (Math.random() - 0.5) * 6, vy: 8 + Math.random() * 10,
          gravity: 2, drag: 0.4,
          size: 1.3 + Math.random() * 0.6,
          color: '#9aaa5b',
          life: 4 + Math.random() * 2, shrink: false, glow: 5,
        });
      }
    } else if (id === 'reachDeep') {
      // Deep Reach — dense violet rift-residue + black ash drifting.
      // Drifting violet sparks (right→left)
      for (let i = 0; i < 2; i++) {
        this.fx.spawn({
          x: right + 8, y: top + Math.random() * vh,
          vx: -16 - Math.random() * 22, vy: -2 + (Math.random() - 0.5) * 4,
          gravity: 0, drag: 0.15,
          size: 1.4 + Math.random() * 1.0,
          color: ['#a060ff', '#6020a0', '#3a1a6a'][Math.floor(Math.random() * 3)],
          life: 4 + Math.random() * 2, shrink: false, glow: 8,
        });
      }
      // Slow falling ash flecks
      if (Math.random() < 0.7) {
        this.fx.spawn({
          x: left + Math.random() * vw, y: top - 8,
          vx: (Math.random() - 0.5) * 4, vy: 10 + Math.random() * 8,
          gravity: 2, drag: 0.4,
          size: 0.9 + Math.random() * 0.7,
          color: 'rgba(60,40,80,0.7)',
          life: 4 + Math.random() * 2, shrink: false, glow: 0,
        });
      }
      // Occasional magenta bloom-pulse spark
      if (Math.random() < 0.12) {
        this.fx.spawn({
          x: left + Math.random() * vw, y: top + Math.random() * vh,
          vx: 0, vy: -6,
          gravity: 0, drag: 0.1,
          size: 2.2, color: '#ff60ff',
          life: 1.2, shrink: true, glow: 12,
        });
      }
    } else if (id === 'sableHollow') {
      // Warm ember-motes drifting up from the lit lanterns; faint magenta
      // leyline residue suggesting Sable's deep work here.
      if (Math.random() < 0.6) {
        this.fx.spawn({
          x: left + Math.random() * vw, y: bottom + 8,
          vx: (Math.random() - 0.5) * 6, vy: -16 - Math.random() * 14,
          gravity: -4, drag: 0.3,
          size: 1.2 + Math.random() * 0.8,
          color: ['#ff8a3b', '#ffae3b', '#ffd0a0'][Math.floor(Math.random() * 3)],
          life: 3 + Math.random() * 2, shrink: false, glow: 7,
        });
      }
      // Slow magenta leyline mote
      if (Math.random() < 0.15) {
        this.fx.spawn({
          x: left + Math.random() * vw, y: top + Math.random() * vh,
          vx: (Math.random() - 0.5) * 3, vy: -2,
          gravity: 0, drag: 0.1,
          size: 1.8, color: '#c060ff',
          life: 1.6, shrink: true, glow: 9,
        });
      }
    } else if (id === 'bloomArena') {
      // Dense aether dust + occasional petal-scrap flutter.
      for (let i = 0; i < 2; i++) {
        this.fx.spawn({
          x: left + Math.random() * vw, y: top + Math.random() * vh,
          vx: (Math.random() - 0.5) * 8, vy: -4 + (Math.random() - 0.5) * 6,
          gravity: 0, drag: 0.2,
          size: 1.4 + Math.random() * 0.8,
          color: ['#a060ff', '#ff60ff', '#d0a0ff', '#6020a0'][Math.floor(Math.random() * 4)],
          life: 3 + Math.random() * 2, shrink: false, glow: 8,
        });
      }
      // Larger drifting petal-scrap
      if (Math.random() < 0.18) {
        this.fx.spawn({
          x: top - 4 < right ? left + Math.random() * vw : right + 4,
          y: top - 4,
          vx: (Math.random() - 0.5) * 14, vy: 24 + Math.random() * 14,
          gravity: 6, drag: 0.4,
          size: 2.6 + Math.random() * 1.4,
          color: '#c060ff',
          life: 3.5 + Math.random() * 1.5, shrink: false, glow: 6,
        });
      }
      // Pulsing white-magenta highlight near map centre
      if (Math.random() < 0.06) {
        this.fx.spawn({
          x: (left + right) / 2 + (Math.random() - 0.5) * vw * 0.4,
          y: (top + bottom) / 2 + (Math.random() - 0.5) * vh * 0.4,
          vx: 0, vy: -1,
          gravity: 0, drag: 0,
          size: 2.8, color: '#ffffff',
          life: 0.9, shrink: true, glow: 14,
        });
      }
    }
  }

  _rollEncounterDist() {
    const rate = this.mapData.encounterRate || 0;
    if (rate <= 0) return Infinity;
    const mean = 1000 / rate;
    // Exponential (Poisson-process) gap: same mean, but the spread is wide —
    // you'll sometimes walk straight into a fight and other times cross most
    // of a map untouched. That's what "random" usually feels like.
    const r = Math.max(0.001, Math.random());
    const d = -mean * Math.log(r);
    return Math.max(mean * 0.2, Math.min(mean * 5, d));
  }

  _npcAt(x, y, r) {
    for (const n of this.npcs) {
      const d = Math.hypot(n.x - x, n.y - y);
      if (d < r + 12) return true;
    }
    return false;
  }

  onTap(sx, sy) {
    if (this.nearestNpc) {
      this.game.openNpc(this.nearestNpc);
      return true;
    }
    if (this.nearestSearchable) {
      this.game.openSearchable(this.nearestSearchable);
      return true;
    }
    return false;
  }

  draw(ctx) {
    const ow = this.game.player.overworld;
    // Headroom for the slim gold badge + objective banner.
    const HUD_PAD = 90;
    const camX = Math.max(0, Math.min(this.map.worldW - this.game.viewW, ow.x - this.game.viewW / 2));
    const camY = Math.max(-HUD_PAD, Math.min(this.map.worldH - this.game.viewH, ow.y - this.game.viewH / 2));

    ctx.fillStyle = '#1a2230';
    ctx.fillRect(0, 0, this.game.viewW, this.game.viewH);
    // Camera shake — driven by the boss cutscene only for now.
    let shakeX = 0, shakeY = 0;
    if (this.bossCutscene?.cameraShake > 0) {
      const s = this.bossCutscene.cameraShake;
      shakeX = (Math.random() - 0.5) * s * 2;
      shakeY = (Math.random() - 0.5) * s * 2;
    }
    ctx.save();
    ctx.translate(-camX + shakeX, -camY + shakeY);

    this.map.draw(ctx, camX, camY, this.game.viewW, this.game.viewH, performance.now() / 1000);

    const ents = [
      ...this.npcs.map(n => ({ kind: 'npc', x: n.x, y: n.y, n })),
    ];
    // Visible overworld enemies — one entity per mob spawn, only when the
    // ambush has triggered (or it's a legacy visible-from-start enemy).
    for (const oe of this.overworldEnemies) {
      if (oe.state === 'hidden') continue;
      for (const mob of oe._spawns) {
        ents.push({ kind: 'oenemy', x: mob.x, y: mob.y, oe, mob });
      }
    }
    // Leader + followers along the trail, each a real party member sprite.
    const spacingPx = 26;
    for (let i = 0; i < this.game.party.length; i++) {
      const m = this.game.party[i];
      const pos = i === 0 ? { x: ow.x, y: ow.y, facing: ow.facing } : this._followerPos(i, spacingPx);
      ents.push({ kind: 'player', x: pos.x, y: pos.y, facing: pos.facing, classId: m.classId, idx: i });
    }
    // Boss sprite (only during the boss cutscene, once materialized)
    if (this.bossCutscene?.warden) {
      ents.push({ kind: 'boss', x: this.bossCutscene.bossX, y: this.bossCutscene.bossY });
    }
    ents.sort((a, b) => a.y - b.y);

    for (const e of ents) {
      if (e.kind === 'player') this._drawPlayer(ctx, e);
      else if (e.kind === 'npc') this._drawNpc(ctx, e.n);
      else if (e.kind === 'oenemy') this._drawOverworldEnemy(ctx, e.oe, e.mob);
      else if (e.kind === 'boss') this._drawBossInWorld(ctx);
    }

    // World-space effects (recruit cinematic, ambient particles, etc.)
    this.fx.draw(ctx);

    // Interact hint above nearest npc
    if (this.nearestNpc) {
      const n = this.nearestNpc;
      ctx.fillStyle = '#ffd84d';
      ctx.font = 'bold 14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('💬', n.x, n.y - 28);
      ctx.font = 'bold 10px system-ui';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText('tap to talk', n.x, n.y - 14);
      ctx.fillText('tap to talk', n.x, n.y - 14);
    } else if (this.nearestSearchable) {
      const s = this.nearestSearchable;
      ctx.fillStyle = '#ffd84d';
      ctx.font = 'bold 14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('✦', s.x, s.y - 28);
      ctx.font = 'bold 10px system-ui';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText('tap to search', s.x, s.y - 14);
      ctx.fillText('tap to search', s.x, s.y - 14);
    }

    ctx.restore();

    // Boss cutscene overlays (screen-space, drawn over the world).
    if (this.bossCutscene) this._drawBossCutsceneOverlay(ctx);
    // Fast-forward indicator (visible during the two RAF cutscenes when held).
    if (this._cutsceneFf) {
      ctx.save();
      ctx.fillStyle = 'rgba(255,216,77,0.95)';
      ctx.font = 'bold 13px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText('▶▶ fast-forward', this.game.viewW - 14, this.game.viewH - 14);
      ctx.restore();
    }
    // Pre-battle cutscene overlay (scripted overworld-enemy fights).
    if (this.preBattleCutscene) this._drawPreBattleCutsceneOverlay(ctx);

    // Atmospheric per-map tint — sits over the world and under the HUD. Skipped
    // during boss cutscenes / encounters so those overlays drive their own
    // color. Map data declares `tint: { color, alpha, glow }` to opt in.
    //
    // Two-pass stack:
    //   1. `color` blend — replaces hue + saturation while keeping the
    //      original brightness, so scenes look genuinely purple/green/amber
    //      instead of just "darker".
    //   2. `lighter` (additive) glow — a faint same-color wash on top so the
    //      color reads as glowing atmosphere, not flat post-processing.
    if (this.mapData.tint && !this.bossCutscene && !this.encounter) {
      const t = this.mapData.tint;
      ctx.save();
      ctx.fillStyle = t.color;
      ctx.globalAlpha = t.alpha;
      ctx.globalCompositeOperation = t.blend || 'color';
      ctx.fillRect(0, 0, this.game.viewW, this.game.viewH);
      ctx.restore();
      if (t.glow) {
        ctx.save();
        // `glowColor` lets a map mix two hues — e.g. violet body + green
        // additive glow to read as a "sour green-violet" sickly atmosphere.
        ctx.fillStyle = t.glowColor || t.color;
        ctx.globalAlpha = t.glow;
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillRect(0, 0, this.game.viewW, this.game.viewH);
        ctx.restore();
      }
      // Optional shadow-darken pass to add atmospheric weight without
      // crushing the recolored hue. Used for the deepest corruption.
      if (t.darken) {
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.globalAlpha = t.darken;
        ctx.fillRect(0, 0, this.game.viewW, this.game.viewH);
        ctx.restore();
      }
    }
    // Cave-style player-centered torchlight: dim the screen except around the leader.
    // Skipped during the boss cutscene so the boss banner / dialog stay legible —
    // the cutscene already supplies its own dramatic darkening.
    if (this.mapData.dark && !this.bossCutscene) {
      const cx = ow.x - camX;
      const cy = ow.y - camY;
      const innerR = 70;
      const outerR = 230;
      const g = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(0.7, 'rgba(0,0,0,0.78)');
      g.addColorStop(1, 'rgba(0,0,0,0.95)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.game.viewW, this.game.viewH);
    }

    if (this.encounter) {
      const a = Math.min(1, this.encounterT / 0.7);
      ctx.fillStyle = `rgba(0,0,0,${a})`;
      ctx.fillRect(0, 0, this.game.viewW, this.game.viewH);
      ctx.globalAlpha = a;
      ctx.fillStyle = '#ff5a6e';
      ctx.font = 'bold 24px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('ENCOUNTER!', this.game.viewW / 2, this.game.viewH / 2);
      ctx.globalAlpha = 1;
    }
    if (this.transition) {
      const a = Math.min(1, this.transitionT / 0.5);
      ctx.fillStyle = `rgba(0,0,0,${a})`;
      ctx.fillRect(0, 0, this.game.viewW, this.game.viewH);
    }

    // TEMP debug readout — shows current map id + player tile coords so the
    // player can point at a specific bush ("remove the bush at reachOuter 17,22").
    // Remove this block once the hidden-item bushes have been sorted.
    {
      const tx = Math.floor(ow.x / TILE_SIZE);
      const ty = Math.floor(ow.y / TILE_SIZE);
      const label = `${this.mapData.id} ${tx},${ty}`;
      ctx.save();
      ctx.font = 'bold 13px system-ui';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const padX = 6, padY = 4;
      const w = ctx.measureText(label).width + padX * 2;
      const x = 6, y = this.game.viewH - 24;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(x, y, w, 18);
      ctx.fillStyle = '#ffd84d';
      ctx.fillText(label, x + padX, y + padY);
      ctx.restore();
    }

    this.game.input.drawJoystick(ctx);
  }

  _drawBossInWorld(ctx) {
    const c = this.bossCutscene;
    if (!c || !c.warden) return;
    ctx.save();
    ctx.translate(c.bossX, c.bossY);
    // Slight float as the boss "lands".
    const land = Math.min(1, c.t + (c.phase >= 3 ? 1 : 0));
    ctx.translate(0, (1 - land) * 60);
    c.warden.template.draw(ctx, c.warden);
    ctx.restore();
  }

  _drawBossCutsceneOverlay(ctx) {
    const c = this.bossCutscene;
    const W = this.game.viewW, H = this.game.viewH;
    // Darkening vignette
    if (c.darkness > 0) {
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.18, W / 2, H / 2, Math.max(W, H) * 0.7);
      g.addColorStop(0, `rgba(0,0,0,${c.darkness * 0.3})`);
      g.addColorStop(1, `rgba(0,0,0,${c.darkness})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    // White flash on materialization
    if (c.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255,255,255,${c.flashAlpha})`;
      ctx.fillRect(0, 0, W, H);
    }
    // Boss name banner — slides from above and settles centered on screen,
    // matching the ambush pre-battle banner's dimensions, position, and
    // slide curve exactly (only the color palette differs for the boss).
    if (c.phase >= 4 && c.bannerSlide < 1) {
      const BH = 100;
      const settled = H / 2 - BH / 2;
      const startY = -BH - 20;
      const yTop = startY + (1 - c.bannerSlide) * (settled - startY);
      ctx.save();
      // Violet gradient + violet accent stripes — boss palette swap of the
      // ambush banner's red-orange.
      const grad = ctx.createLinearGradient(0, yTop, 0, yTop + BH);
      grad.addColorStop(0, 'rgba(15,5,30,0.94)');
      grad.addColorStop(1, 'rgba(60,20,110,0.94)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, yTop, W, BH);
      ctx.fillStyle = 'rgba(170,80,255,0.85)';
      ctx.fillRect(0, yTop, W, 2);
      ctx.fillRect(0, yTop + BH - 2, W, 2);
      ctx.textAlign = 'center';
      // Small subtitle tag on top — same font + Y offset as "— ENCOUNTER —"
      ctx.fillStyle = '#c0a0ff';
      ctx.font = 'bold 14px system-ui';
      ctx.fillText((c.ev.bannerSub || '— sent by The Sundered —').toUpperCase(), W / 2, yTop + 34);
      // Big name below — same font + Y offset as the ambush enemy name
      ctx.fillStyle = '#f0e0ff';
      ctx.font = 'bold 26px system-ui';
      const bannerName = (c.ev.bannerName || c.warden?.name || 'BOSS').toUpperCase();
      ctx.fillText(bannerName, W / 2, yTop + 70);
      ctx.restore();
    }
  }

  _drawPlayer(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    const walking = p.idx === 0 ? this.moving : true; // followers always animate when leader does
    drawHero(ctx, p.classId, this._tNow(p.idx), 14, { facing: p.facing, walking: this.moving });
    ctx.restore();
  }

  // Walk along the saved leader trail to find a position `distPx` behind.
  _followerPos(idx, spacingPx) {
    const trail = this.leaderTrail;
    if (trail.length < 2) return { ...trail[0] };
    const want = idx * spacingPx;
    let total = 0;
    for (let i = 1; i < trail.length; i++) {
      const a = trail[i - 1], b = trail[i];
      const seg = Math.hypot(a.x - b.x, a.y - b.y);
      if (total + seg >= want) {
        const tt = (want - total) / seg;
        return {
          x: a.x + (b.x - a.x) * tt,
          y: a.y + (b.y - a.y) * tt,
          facing: a.facing,
        };
      }
      total += seg;
    }
    return { ...trail[trail.length - 1] };
  }

  _tNow(idx) {
    // Slight per-character offset so they don't bob in lockstep.
    return (performance.now() / 1000) + idx * 0.4;
  }

  // For recruit NPCs with `preferredClasses`, returns the class they'd
  // ACTUALLY become given the current party (mirrors `_chooseRecruitClass` on
  // game.js). Used so the overworld sprite + halo match the post-recruit
  // reality — e.g. Lyra appears as a Black Mage if the player is already White.
  _resolveNpcClass(n) {
    if (n.kind !== 'recruit') return n.classId;
    const prefs = n.preferredClasses;
    if (!prefs?.length) return n.classId;
    const partyClasses = new Set(this.game.party.map(m => m.classId));
    for (const cls of prefs) {
      if (!partyClasses.has(cls)) return cls;
    }
    return n.classId;
  }

  _drawNpc(ctx, n) {
    ctx.save();
    ctx.translate(n.x, n.y);
    const npcClass = this._resolveNpcClass(n);
    if (n.kind === 'recruit') {
      // Pulsing halo so recruits are findable from a few tiles away.
      const pulse = 0.5 + 0.5 * Math.sin(n.t * 2);
      const haloR = 26 + pulse * 8;
      const color = npcClass === 'white' ? 'rgba(168,255,200,'
                  : npcClass === 'black' ? 'rgba(192,160,255,'
                  : npcClass === 'ranger' ? 'rgba(255,216,77,'
                  : 'rgba(255,255,255,';
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, haloR);
      g.addColorStop(0, color + (0.30 + pulse * 0.18) + ')');
      g.addColorStop(1, color + '0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, haloR, 0, Math.PI * 2);
      ctx.fill();
    }
    if (npcClass) {
      // Recruit NPC — render as their resolved-class sprite, facing the player.
      const ow = this.game.player.overworld;
      const facing = Math.atan2(ow.y - n.y, ow.x - n.x);
      drawHero(ctx, npcClass, n.t, 14, { facing, walking: false });
    } else {
      // Story NPC — role-specific detailed sprite (or generic villager).
      drawNpcSprite(ctx, n, n.t, 14);
    }
    ctx.restore();
    // Name banner.
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.font = 'bold 10px system-ui';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.strokeText(n.name, n.x, n.y + 26);
    ctx.fillText(n.name, n.x, n.y + 26);
  }

  _drawOverworldEnemy(ctx, oe, mob) {
    ctx.save();
    ctx.translate(mob.x, mob.y);
    // Angry red halo on legacy 'spotted' state — small read-cue before charge.
    if (oe.state === 'spotted') {
      const pulse = 0.5 + 0.5 * Math.sin(oe.stateT * 18);
      ctx.fillStyle = `rgba(255,60,60,${0.25 + pulse * 0.2})`;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();
    }
    // Face the player (mirror if charging right-to-left).
    const dx = (this.game.player.overworld.x ?? mob.x) - mob.x;
    if (dx < 0) ctx.scale(-1, 1);
    // Ambush mobs scale up from 0 during the burst pause; legacy/visible
    // mobs are always at scale 1.
    const s = mob.scale ?? 1;
    if (s !== 1) ctx.scale(s, s);
    drawOverworldEnemy(ctx, { spriteId: mob.spriteId }, mob.t || oe.t, 20);
    ctx.restore();
  }
}

function darker(hex) {
  // crude darken — just decrease each channel by ~50.
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return hex;
  const r = Math.max(0, parseInt(m[1], 16) - 60);
  const g = Math.max(0, parseInt(m[2], 16) - 60);
  const b = Math.max(0, parseInt(m[3], 16) - 60);
  return '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
}

// Pool selection scales with party size:
//   - Entries with `partyMin` above the current party are filtered out
//   - Each entry's effective weight is reshaped by enemy count vs party size
//     so small parties don't get mobbed and full parties don't get bored
//     fighting solo slimes.
function pickEncounter(pool, partySize = 1) {
  if (!pool || pool.length === 0) return null;
  const eligible = pool.filter(e => (e.partyMin ?? 1) <= partySize);
  if (eligible.length === 0) return null;
  const effective = (e) => {
    const n = e.enemyIds.length;
    let mult;
    if (partySize <= 1) {
      // Solo hero: almost always 1, occasionally 2, never more.
      mult = n === 1 ? 1.4 : n === 2 ? 0.6 : 0.04;
    } else if (partySize === 2) {
      // Two-member party: 3s most common; 2s and 4s frequent; 1s and 5+ rare.
      mult = n === 1 ? 0.25 : n === 2 ? 1.0 : n === 3 ? 1.4 : n === 4 ? 0.7 : 0.1;
    } else {
      // Full party (3+): 3s and 4s dominate; 5s common; 6s steady; 1-2s scarce.
      mult = n === 1 ? 0.05 : n === 2 ? 0.15
        : n === 3 ? 1.1 : n === 4 ? 1.2 : n === 5 ? 1.0 : 0.75;
    }
    return (e.weight || 1) * mult;
  };
  const total = eligible.reduce((s, e) => s + effective(e), 0);
  let r = Math.random() * total;
  for (const e of eligible) {
    r -= effective(e);
    if (r <= 0) return e;
  }
  return eligible[eligible.length - 1];
}
