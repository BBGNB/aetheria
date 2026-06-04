import { TileMap } from '../world/tilemap.js';
import { MAPS } from '../world/maps.js';
import { TILE_SIZE } from '../world/tiles.js';
import { audio } from '../audio.js';
import { drawHero } from '../heroSprites.js';
import { drawNpc as drawNpcSprite } from '../npcSprites.js';
import { Effects } from '../effects.js';
import { createEnemyInstance } from '../data/enemies.js';

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
    for (const cs of cutscenes) {
      if (this.game.flags.has(cs.flag)) continue;
      if (cs.requires && !this._meetsCutsceneRequires(cs.requires)) continue;
      this.cinematicLock = 999;
      this.game.flags.add(cs.flag);
      this.game.save();
      // Bespoke visual + sfx layer fires the moment the cutscene starts.
      if (cs.visual) this._playCutsceneVisual(cs.visual);
      setTimeout(() => {
        this.game.ui.showDialog(cs.speaker || '', cs.lines, ['Press onward'], () => {
          this.cinematicLock = 0;
        });
      }, cs.delay ?? 280);
      break;
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
    return list.every(r => this.game.flags.has(r) || this.game.recruited?.has(r));
  }

  update(dt) {
    this.fx.update(dt);
    if (this.bossCutscene) { this._updateBossCutscene(dt); return; }
    if (this.game.menu?.open) return;
    if (this.cinematicLock > 0) {
      this.cinematicLock -= dt;
      // Still let NPCs animate and trail tick, but skip player movement/encounters.
      for (const n of this.npcs) n.t += dt;
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
    const dx = input.dirX * input.magnitude * speed * dt;
    const dy = input.dirY * input.magnitude * speed * dt;
    const beforeX = ow.x, beforeY = ow.y;
    if (this.map.walkable(ow.x + dx, ow.y, r) && !this._npcAt(ow.x + dx, ow.y, r)) ow.x += dx;
    if (this.map.walkable(ow.x, ow.y + dy, r) && !this._npcAt(ow.x, ow.y + dy, r)) ow.y += dy;
    this.moving = input.magnitude > 0.05;
    if (this.moving) {
      ow.facing = Math.atan2(input.dirY, input.dirX);
      this.stepTimer += dt;
      if (this.stepTimer > 0.32) { this.stepTimer = 0; audio.play('step'); }
    }

    this._spawnAmbient(dt);

    // Accumulate distance actually traveled and roll for random encounter.
    const moved = Math.hypot(ow.x - beforeX, ow.y - beforeY);
    if (moved > 0 && (this.mapData.encounters?.length)) {
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
    // For now requires is either a recruited NPC id or a flag id.
    if (this.game.recruited?.has(ev.requires)) return true;
    if (this.game.flags?.has(ev.requires)) return true;
    return false;
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
      // Slide name banner down from above
      c.bannerSlide = Math.max(0, 1 - c.t / 0.65);
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
    // Boss name banner — drops from above, settles at ~38% height.
    if (c.phase >= 4) {
      const drop = c.bannerSlide * -180; // pixels above resting position
      const bannerH = 88;
      const yTop = H * 0.32 + drop;
      ctx.save();
      // Backdrop bar
      ctx.fillStyle = 'rgba(15,5,30,0.85)';
      ctx.fillRect(0, yTop, W, bannerH);
      ctx.fillStyle = '#a060ff';
      ctx.fillRect(0, yTop, W, 3);
      ctx.fillRect(0, yTop + bannerH - 3, W, 3);
      // Subtle glow runes on the bar
      ctx.fillStyle = 'rgba(170,80,255,0.18)';
      for (let i = 0; i < 8; i++) ctx.fillRect(W * (i / 8) + 8, yTop + 10, W / 16, 4);
      // Name
      ctx.textAlign = 'center';
      ctx.shadowColor = '#a060ff';
      ctx.shadowBlur = 28;
      ctx.fillStyle = '#f0e0ff';
      ctx.font = 'bold 34px system-ui';
      const bannerName = (c.ev.bannerName || c.warden?.name || 'BOSS').toUpperCase();
      ctx.fillText(bannerName, W / 2, yTop + 50);
      // Subtitle
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#c0a0ff';
      ctx.font = 'bold 12px system-ui';
      ctx.fillText(c.ev.bannerSub || '— sent by The Sundered —', W / 2, yTop + 70);
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
      // Solo hero: prefer single targets; trios are rare.
      mult = n === 1 ? 1.4 : n === 2 ? 0.7 : n === 3 ? 0.15 : 0.05;
    } else if (partySize === 2) {
      // Two-member party: 2s most common, 1s and 3s frequent, 4s rare.
      mult = n === 1 ? 0.9 : n === 2 ? 1.1 : n === 3 ? 0.8 : 0.3;
    } else {
      // Full party (3+): 3s normal, 4–5s appear regularly, 6s rare.
      mult = n <= 2 ? 0.45 : n === 3 ? 1.1 : n === 4 ? 1.0 : n === 5 ? 0.8 : 0.5;
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
