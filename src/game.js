import { Overworld } from './scene/overworld.js';
import { Battle } from './scene/battle.js';
import { xpForLevel, HERO_GROWTH } from './data/levels.js';
import { computeEquipBonus, createEquipmentInstance, linkGroups, linkGroupFor } from './data/equipment.js';
import { ITEM_BY_ID } from './data/items.js';
import { SHOP_INVENTORY } from './data/shop.js';
import { gemEffects, createGemInstance, addGemXp, GEM_BY_ID } from './data/gems.js';
import { matchCombos, matchPairCombo, matchHigherCombos } from './data/combos.js';
import { resolveTieredSkills, SKILL_BY_ID } from './data/skills.js';
import { CLASS_BY_ID, skillsFromTree, classNodeById, STARTING_SP, SP_PER_LEVEL } from './data/classes.js';
import { audio } from './audio.js';
import { write as saveWrite, read as saveRead, clear as saveClear, hasSave, applySave } from './save.js';

export const MAX_PARTY = 3;

export class Game {
  constructor(canvas, ctx, input, ui) {
    this.canvas = canvas; this.ctx = ctx; this.input = input; this.ui = ui;
    this.viewW = 0; this.viewH = 0;
    this.running = false;
    this.scene = null;
    this.lastT = 0;
    this.party = [];
    this.gold = 0;
    this.inventory = { consumables: {}, equipment: [], gems: [] };
    this.recruited = new Set(); // recruit-NPC ids that already joined (so they vanish)
    this.searched = new Set();  // ids of searchables the player has already claimed
    this.flags = new Set();     // story flags (e.g. 'cave:warden') for one-shot events
    input.onTap = (x, y) => { if (this.scene?.onTap) this.scene.onTap(x, y); };
  }

  // Leader — most overworld/HUD code still asks for `player`.
  get player() { return this.party[0]; }

  newGame(classId = 'fighter') {
    this.party = [makeCharacter(classId, 'Hero')];
    this.gold = 0;
    this.inventory = {
      consumables: { potion: 3, ether: 1 },
      equipment: [],
      gems: [createGemInstance('emberCore')],  // starter gem to learn the system
    };
    this.recruited = new Set();
    this.searched = new Set();
    this.flags = new Set(); // story flags (e.g., 'cave:warden')
    this.defeatedEnemies = new Set();
    this.currentMapId = 'town';
    this.scene = new Overworld(this);
    this.running = true;
    this.ui.showHud();
    this.ui.hideStart();
    this.ui.hideGameOver();
    this.save();
  }

  loadGame() {
    const data = saveRead();
    if (!data || !applySave(this, data)) return false;
    // Don't carry a half-fought boss attempt across reloads.
    this._pendingBossWinFlag = null;
    this._pendingDefeatedFlag = null;
    this.scene = new Overworld(this);
    this.running = true;
    this.ui.showHud();
    this.ui.hideStart();
    this.ui.hideGameOver();
    return true;
  }

  save() { return saveWrite(this); }
  eraseSave() { saveClear(); }
  hasSave() { return hasSave(); }

  // Debug warp — drops a Lv7 Ranger Hero + Lv7 Lyra into the Echoing Hollow
  // with the full chapter-1 flag chain already set (Cal rescue, Pack Alpha,
  // Lyra recruited). Player spawns mid-cave on a walkable cave-floor tile;
  // walk east to (21,8) cave mouth to trigger the Hollow Warden boss event.
  // Use via `?warp=warden` URL param. Safe to remove later.
  warpToWardenBoss() {
    this.newGame('ranger');
    // Level the player up to 7 — apply the same per-level bookkeeping the
    // normal XP flow does (xpToNext + SP + rebuildStats + full restore).
    for (let i = this.player.level; i < 7; i++) {
      this.player.level++;
      this.player.xpToNext = xpForLevel(this.player.level);
      this.player.sp = (this.player.sp || 0) + SP_PER_LEVEL;
    }
    rebuildStats(this.player);
    this.player.hp = this.player.maxHp;
    this.player.mp = this.player.maxMp;
    // Chapter-1 corridor: mark every scripted fight defeated so nothing
    // ambushes the player on the way back through.
    for (const id of ['meadow:wolfling1','meadow:bramble1','meadow:pair1',
                      'meadow:otter1','meadow:wisp1','meadow:rescueCal',
                      'meadow:packAlpha']) {
      this.defeatedEnemies.add(id);
    }
    for (const f of ['town:rested','bren:warned','meadow:packAlpha','cal:rescued']) {
      this.flags.add(f);
    }
    // Recruit Lyra — she joins at the player's level via the standard path.
    this.recruit('white', 'Lyra', 'recruit:lyra');
    // Give a starting kit that fits a Lv7 mid-dungeon party.
    this.gold = 250;
    this.inventory.consumables = { potion: 6, hipotion: 2, ether: 2 };
    // Drop them at (12,5) in the cave — open floor, walkable, ~half-way
    // between Lyra's deep recruit spot and the cave-mouth boss trigger.
    this.transitionTo('cave', 12, 5);
    this.running = true;
    this.ui.showHud();
    this.ui.hideStart();
    this.ui.hideGameOver();
  }

  // Debug warp — drops a fresh Fighter into Brookside Grove south of the Cal
  // rescue, on the wide row-10 path with no nearby colliders so movement isn't
  // catching on bush/tree AABBs at spawn. Walk a few tiles north and the row-3
  // trigger fires. Use via `?warp=cal` URL param. Safe to remove later.
  warpToCalRescue() {
    this.newGame('fighter');
    for (const id of ['meadow:wolfling1','meadow:bramble1','meadow:pair1',
                      'meadow:otter1','meadow:wisp1']) {
      this.defeatedEnemies.add(id);
    }
    for (const f of ['town:rested','bren:warned']) this.flags.add(f);
    // transitionTo handles the map swap + scene rebuild + position-from-tile
    // correctly (clears x/y to null first so the Overworld constructor uses
    // the spawnOverride tile).
    this.transitionTo('meadowBrook', 10, 10);
    this.running = true;
    this.ui.showHud();
    this.ui.hideStart();
    this.ui.hideGameOver();
  }

  transitionTo(mapId, tx, ty) {
    this.currentMapId = mapId;
    this.player.overworld.x = null;
    this.player.overworld.y = null;
    this.scene = new Overworld(this, { tx, ty });
    this.save();
  }

  // Elder Vorrin's dialog tracks the chapter 1 questline so he never tells you
  // to do something you've already done.
  _openElderDialog(npc) {
    const alphaDown   = this.flags.has('meadow:packAlpha');
    const lyraJoined  = this.recruited.has('recruit:lyra');
    const wardenDown  = this.flags.has('cave:warden');
    const bloomDown   = this.flags.has('reach:bloom');
    const sableJoined = this.recruited.has('recruit:sable');
    // ---- Chapter 2 side quest: Vorrin's Reckoning ----------------------
    // After the Bloom falls, Vorrin asks for an Order relic from the
    // Bloom arena to anchor the town's wards.
    if (bloomDown) {
      const givenFlag = 'vorrin2:quest';
      const rewardFlag = 'vorrin2:reward';
      const relicFound = this.searched.has('bloom:lore2'); // Order sigil
      if (!this.flags.has('vorrin:postBloom')) {
        this.flags.add('vorrin:postBloom');
        this.save();
      }
      if (this.flags.has(rewardFlag)) {
        this.ui.showDialog(npc.name, [
          '"The sigil rests in the shrine here. Hearthstone is steadier for it."',
          '"Whatever wound you reach next — come back and tell me what you find. The town will remember."',
        ], null, null);
        return;
      }
      if (!this.flags.has(givenFlag)) {
        this.ui.showDialog(npc.name, [
          '"So. The Bloom is broken. Two of the seven mended. I would not have believed I would live to say that."',
          '"There is a thing I would ask of you. The Bloom arena had an Order sigil set into its stone — a small, weatherworn thing, with all seven names cut into it."',
          '"Bring it back to Hearthstone. The town has never had a piece of the Order. It should — so we remember what we are fighting for, not only what against."',
        ], ['I\'ll find it', 'Later'], idx => {
          if (idx === 0) {
            this.flags.add(givenFlag);
            this.ui.toast('Quest: bring the Order sigil to Vorrin');
            this.save();
          }
        });
        return;
      }
      if (!relicFound) {
        this.ui.showDialog(npc.name, [
          '"The sigil is at the Bloom arena, set into the stone. You will know it when you see the seven names."',
          '"Find it. The town has waited a long time."',
        ], null, null);
        return;
      }
      // Quest complete — give reward.
      this.ui.showDialog(npc.name, [
        '"You found it." (He turns the sigil in his hands a long moment.) "I knew two of these names personally. Three, if you count the boy Vael was once."',
        '"Set it in the shrine for me. There — done."',
        '"This is for you. The Order kept their summons bound in threads like this — I have only this one left of theirs."',
      ], ['Take it'], () => {
        const inst = createGemInstance('loomThread');
        if (inst) {
          this.inventory.gems.push(inst);
          this.flags.add(rewardFlag);
          audio.play('levelup');
          this.ui.toast('Received Loom-Thread gem');
          this.save();
        }
      });
      return;
    }
    const brenWarned = this.flags.has('bren:warned');
    let lines;
    if (wardenDown && lyraJoined) {
      lines = [
        '(He looks at you a long moment before he speaks. His eyes settle on Lyra and he closes them.)',
        '"You brought her out. I have not slept properly in two months. I think tonight I will."',
        'Lyra — there is a room above the inn. Edran has kept it for you. Use it. The town will wait until morning to ask you anything.',
        '(He turns back to you. His voice drops.) "There is more to say. There is always more. But not tonight."',
        '"Tomorrow — walk north. The meadow path opens past the Reach now that the Hollow is sealed. There is a man in those woods. Sable. He was one of the seven, before. He left us, and we let him."',
        '"Find him. He will not be glad to see anyone. But he knows where the next wound bleeds, and he owes us — owes Lyra — a debt he has not been able to forget."',
        '"Go drink. Eat. Breathe. The road north can wait until you can taste your food again."',
      ];
      // Closes the chapter 1 main questline.
      if (!this.flags.has('vorrin:postWarden')) {
        this.flags.add('vorrin:postWarden');
        this.save();
      }
    } else if (lyraJoined) {
      lines = [
        '(His hand tightens on his staff as Lyra steps into the room. He does not speak for a long moment.)',
        '"You\'re thin. You\'re alive. We\'ll take both."',
        '(To you) "The Hollow has not let you go yet — its Warden still walks the cave mouth. Whatever you brought out, it wants back."',
        '"Finish it. Come home together. I will keep the hearth lit."',
      ];
    } else if (alphaDown) {
      lines = [
        '"You broke the Alpha. The road is quieter — I can feel it. I have not been able to feel the road for weeks."',
        '"Go. The cave mouth is open. If Lyra is still alive in there, she is at the deepest place. She will not come out on her own."',
      ];
    } else if (this.flags.has('town:rested') && !brenWarned) {
      // Morning after — the player rested as Vorrin asked. He's been up since
      // before dawn. Bren stumbled in at first light; Vorrin sends the
      // player to find him at the west gate. This is the bridge between
      // the welcome and the proper quest pitch.
      if (!this.flags.has('vorrin:spoken')) {
        this.flags.add('vorrin:spoken');
        this.save();
      }
      lines = [
        '(He has not slept. There is a fresh ink-mark on his thumb and a cup of something gone cold beside him. He looks up before you speak.)',
        '"Good. You rested. I asked for that for a reason."',
        '"At first light a boy named Bren staggered through the west gate. Wolf-bit, mostly through. He is down at the gatepost — Edran is keeping him still. He has not enough breath to come this far."',
        '"Whatever he is trying to say, he means to say it to someone. Walk down. Hear him out. Then come back to me — I will know what to ask of you when you have heard what he has to tell."',
        '(He returns to his book, but the page does not turn.)',
      ];
    } else if (brenWarned) {
      // Player has met Bren — Vorrin's first proper conversation. No lore
      // dump (the intro covered it). All personal, all immediate stakes.
      if (!this.flags.has('vorrin:spoken')) {
        this.flags.add('vorrin:spoken');
        this.save();
      }
      lines = [
        '(He sets down his cup before you finish speaking. The hall goes still around him.)',
        '"Bren. I knew his father. Damn it. Damn ALL of it."',
        '(A long silence. When he speaks again his voice is level — the kind of level that costs something.)',
        '"Listen. The pack came south because something further north drove them. The Sundered is reaching. Each year a little further. This year is the worst."',
        '"There is a girl in the Hollow. Lyra. Youngest of the Order — the only one of them I have left. I taught her to read the leylines when she was a child. She walked into the Hollow two months ago. She has not come out."',
        '"A wolf holds the cave mouth — they are calling it the Pack Alpha. It is not a wolf, not really. It is what the Sundered turns wolves into when it bleeds long enough through the same wood."',
        '"Break the Alpha. Find Lyra. Bring her home, or come tell me where she fell. Either way, I need to know."',
        '(He puts a heavy hand on your shoulder.) "I am sorry to ask. I have no one else to ask."',
      ];
    } else {
      // Pre-Bren first visit. Personal welcome, no quest yet — just stage-set
      // so the player learns who Vorrin is before Bren collapses at the gate.
      if (!this.flags.has('vorrin:spoken')) {
        this.flags.add('vorrin:spoken');
        this.save();
      }
      lines = [
        '(He looks up from a worn leather book. His eyes are tired but they read you in a single pass.)',
        '"You came east. Few do, anymore. Most of the roads east end somewhere they did not used to."',
        '"I am Vorrin. I keep what is left of this place running, when I can. Hearthstone sits on an Aetheric well — it is why the song is still audible here, when most places have gone quiet."',
        '"Rest a night. The inn is honest. Mira undersells her wares. The shrine in the square is older than the kingdom — older than my grandmother\'s grandmother. Touch it if you mean to swear anything."',
        '(He returns to his book. As you turn to go, without looking up:)',
        '"If you mean to walk west — wait until tomorrow. The road past the meadow has gone strange this week. I will know more by morning."',
      ];
    }
    this.ui.showDialog(npc.name, lines, null, null);
  }

  // The Caretaker — Outer Reach side quest. Asks the party to lay 3 grave
  // markers in Deep Reach. The markers are 3 searchables; completion is
  // detected via the player's `searched` set. Three-state dialog: offer,
  // in-progress, complete.
  _openCaretakerDialog(npc) {
    const startedFlag = 'caretaker:quest';
    const rewardFlag = 'caretaker:reward';
    const graveIds = ['reachDeep:grave1', 'reachDeep:grave2', 'reachDeep:grave3'];
    const allLaid = graveIds.every(id => this.searched.has(id));
    if (this.flags.has(rewardFlag)) {
      this.ui.showDialog(npc.name,
        ['"Thank you. He is at rest now — what little I can give him."',
         '"Stay safe in the Reach. The forest knows you walked it well."'],
        null, null);
      return;
    }
    if (!this.flags.has(startedFlag)) {
      this.ui.showDialog(npc.name, [
        '(She does not look up.) "I was a forest tender. We are the ones who lay the wild back to sleep when it dies."',
        '"My companion went north with me, into the Deep Reach. He did not come back. I made it as far as the dying trees, but my legs would not carry me further. I have been here since."',
        '"There are three markers I left for him — places where I thought I felt him last. They need a word said over them, that\'s all. I cannot do it from here."',
        '"If you go north — would you?"',
      ], ['I will', 'Not now'], idx => {
        if (idx === 0) {
          this.flags.add(startedFlag);
          this.ui.toast('Quest: lay the Caretaker\'s three grave markers');
          this.save();
        }
      });
      return;
    }
    if (!allLaid) {
      const found = graveIds.filter(id => this.searched.has(id)).length;
      this.ui.showDialog(npc.name, [
        '"You have not finished yet. The Reach is wide and I am not in a hurry."',
        '(' + found + ' of 3 markers laid.)',
      ], null, null);
      return;
    }
    // All three laid — give reward.
    this.ui.showDialog(npc.name, [
      '"You laid all three? Then he is at rest." (She finally looks up. Her eyes are red but clear.)',
      '"I cannot pay you. But I braided this from the reeds at the meadow\'s edge, before I came north. Take it."',
      '"It will steady you when nothing else will."',
    ], ['Take it'], () => {
      const inst = createEquipmentInstance('tendersBrace');
      if (inst) {
        this.inventory.equipment.push(inst);
        this.flags.add(rewardFlag);
        audio.play('levelup');
        this.ui.toast('Received Tender\'s Brace');
        this.save();
      }
    });
  }

  // Bren — the dying scout. One-shot dialog: he gasps out his warning, then
  // his last words. Sets `bren:warned` so Vorrin's dialog and Mira's gift
  // unlock, and so Bren himself stops appearing.
  _openBrenDialog(npc) {
    const warned = this.flags.has('bren:warned');
    if (warned) {
      // Stays present until cave:warden so the player can re-read his last
      // words, but most NPCs will use hideIfFlag once a chapter beat fires.
      this.ui.showDialog(npc.name, [
        'Bren\'s body lies still. His tunic is dark where it shouldn\'t be.',
        '"…Cal," he\'d whispered, near the end. "Find Cal."',
      ], null, null);
      return;
    }
    this.ui.showDialog(npc.name, [
      '(He looks up, his eyes glassy.) "You\'re — you\'re someone who can walk. Good. Good."',
      '"The pack moved south. They were never this far before. Three days, maybe four — they came out of the Reach like the woods spat them."',
      '"My partner Cal — we got split. He\'s wounded. He\'s somewhere in the meadow grove, pinned by them. If anyone is still going west…"',
      '"Tell Elder Vorrin. Tell him the pack is hunting south. Tell him I tried."',
      '(He grips your wrist. His hand is cold.) "Find Cal."',
      '(His grip slackens.)',
    ], ['I will'], () => {
      this.flags.add('bren:warned');
      this.ui.toast('Quest: warn Vorrin, then find Cal in the meadow.');
      this.save();
    });
  }

  // Cal — post-rescue. Says goodbye on the way back to Hearthstone. Stays as
  // a static NPC until chapter 1 ends.
  _openCalDialog(npc) {
    const rescued = this.flags.has('cal:rescued');
    if (!rescued) {
      this.ui.showDialog(npc.name, ['(He doesn\'t appear to be here yet.)'], null, null);
      return;
    }
    this.ui.showDialog(npc.name, [
      'Cal: "I owe you my life. I\'ll limp back to Hearthstone — Edran keeps a back room."',
      'Cal: "Whatever you find past the cave mouth — be careful. The pack was only the first wave. Something is hunting THEM, too."',
    ], null, null);
  }

  // Sable the hermit — first visit unfolds his exile and points the way north.
  // Once Lyra is in the party, she speaks back. After first meeting, the rest
  // collapses to a shorter check-in.
  _openSableDialog(npc) {
    const lyraJoined = this.recruited.has('recruit:lyra');
    const met = this.flags.has('sable:met');
    let lines;
    if (!met) {
      lines = [
        'You walked the meadow road and lived. Good. You\'ll need that.',
        'I was one of the seven, before. Before Vael tore the song.',
        'When the Order tried to stitch the leylines back, I argued we should let it bleed clean — let the wound seal itself. They named that cowardice and made me leave.',
        'Now I sit here, mostly, while a forest I used to know rots from the inside.',
      ];
      if (lyraJoined) {
        lines.push('(Lyra steps forward.) "Sable. You\'re alive."');
        lines.push('(Sable, after a long pause.) "Hello, little sister. You came back from the Hollow. Of course you did."');
      }
      lines.push('The pass north — Deep Reach, the loggers used to call it — leads to a hollow where the leyline knot is. Something old has wrapped itself around the knot and is feeding.');
      lines.push('If you mean to cut it loose, you\'ll need more than steel. Find what the forest hides between here and there. The Reach keeps its own secrets in plain sight.');
      if (!lyraJoined) {
        lines.push('And — if you see Lyra in there — tell her I am sorry. She\'ll know what for.');
      } else {
        lines.push('(Sable, quieter.) "Lyra. I am sorry. For what that is worth — and for what it is not."');
      }
      this.flags.add('sable:met');
      this.save();
    } else if (this.flags.has('reach:rotcrown')) {
      lines = [
        'So. You broke the Rotcrown. That took less time than I thought it would.',
        'The pass to my Hollow is open now — the mist will part for you. Come find me up there when you\'re ready.',
        'I will be waiting at the pavilion. We have things to say to each other that should not be said in a forest that is listening.',
      ];
    } else {
      lines = [
        'Still here. Still arguing with myself about whether to walk back into all that.',
        'The deep pass is north. Read what the forest has left lying about, and you\'ll arrive less stupid than I did.',
      ];
      if (lyraJoined) {
        lines.push('(To Lyra) Keep them moving. The knot will not wait for our reckonings.');
      }
    }
    this.ui.showDialog(npc.name, lines, null, null);
  }

  // Mira's branching dialog — multiple quest states.
  _openMiraDialog(npc) {
    const questGiven = this.flags.has('mira:quest');
    const wardenDown = this.flags.has('cave:warden');
    const rewardTaken = this.flags.has('mira:reward');
    const bloomDown = this.flags.has('reach:bloom');
    const mira2Given = this.flags.has('mira2:quest');
    const mira2Reward = this.flags.has('mira2:reward');
    const shop = () => this.ui.openShop(this, SHOP_INVENTORY);
    // ---- Chapter 2 quest: Bloomsilk Veil --------------------------------
    // After the player defeats the Bloom of Decay, Mira recognizes the
    // residue and offers a second craft.
    if (bloomDown && !mira2Reward) {
      if (!mira2Given) {
        this.ui.showDialog(npc.name, [
          '(She catches you by the sleeve.) "You came back from the Bloom. You have its dust on you — there, on your cloak."',
          '"Bring me one petal. Just one. Bloom-silk is stronger than anything I have ever woven."',
          '"You\'ll have something rare from me. Better than the brooch."',
        ], ['Of course', 'Browse', 'Leave'], idx => {
          if (idx === 0) {
            this.flags.add('mira2:quest');
            this.ui.toast('Quest: bring Mira a Bloom petal');
            this.save();
          } else if (idx === 1) {
            shop();
          }
        });
        return;
      }
      // Quest given. Since the player carries the residue automatically after
      // the Bloom falls, completing the quest is just returning to her.
      this.ui.showDialog(npc.name, [
        '"There. Hold still — let me brush the petal-silk off you."',
        '(She works in silence for a long minute, then holds up a thin, dark veil that shimmers like aether.)',
        '"Bloomsilk Veil. Hum a tune through it — anything you like — and the Sundered\'s song bends a little further around you."',
      ], ['Take it', 'Just browse'], idx => {
        if (idx === 0) {
          const inst = createEquipmentInstance('bloomsilkVeil');
          if (inst) {
            this.inventory.equipment.push(inst);
            this.flags.add('mira2:reward');
            audio.play('levelup');
            this.ui.toast('Received Bloomsilk Veil');
            this.save();
          }
        } else { shop(); }
      });
      return;
    }
    if (rewardTaken) {
      this.ui.showDialog(npc.name, ['Welcome back, traveler. The wares are yours.'], ['Browse', 'Leave'], idx => { if (idx === 0) shop(); });
      return;
    }
    if (wardenDown && questGiven) {
      this.ui.showDialog(npc.name, [
        'You\'ve been to the Hollow\'s heart. I can feel it on you.',
        'The Warden you bested — its essence still clings to your cloak. Hold still…',
        'There. Worked into thread. A brooch — sing through it, and the song carries a little further.',
      ], ['Take it', 'Just browse'], idx => {
        if (idx === 0) {
          const inst = createEquipmentInstance('choirthreadBrooch');
          if (inst) {
            this.inventory.equipment.push(inst);
            this.flags.add('mira:reward');
            audio.play('levelup');
            this.ui.toast('Received Choirthread Brooch');
            this.save();
          }
        } else { shop(); }
      });
      return;
    }
    if (questGiven) {
      this.ui.showDialog(npc.name, [
        'Still hunting in the Hollow? Bring me a piece of what dwells deepest down there.',
        'Wraith essence — or anything stronger. I haven\'t forgotten my promise.',
      ], ['Browse', 'Leave'], idx => { if (idx === 0) shop(); });
      return;
    }
    // Bren's warning unlocks a free potion gift before the quest pitch — Mira
    // overheard what happened and wants the player to take SOMETHING with them.
    if (this.flags.has('bren:warned') && !this.flags.has('mira:potion')) {
      this.ui.showDialog(npc.name, [
        '(She catches your sleeve before you can leave.) "I heard about the boy at the gate. Bren. Don\'t go west empty-handed."',
        '"Take this. On me. Cal\'s out there too, and you\'ll need every drop."',
      ], ['Take it'], () => {
        this.inventory.consumables.potion = (this.inventory.consumables.potion || 0) + 1;
        this.flags.add('mira:potion');
        audio.play('confirm');
        this.ui.toast('Received Potion (from Mira)');
        this.save();
      });
      return;
    }
    // First visit — offer the quest.
    this.ui.showDialog(npc.name, [
      'Welcome, traveler! Mira here.',
      'I have a small request — if you go into the Hollow, bring back what its deepest things leave behind. I can weave essence into thread.',
      'For your trouble, you\'ll have something rare in return.',
    ], ['I\'ll do it', 'Just browse', 'Leave'], idx => {
      if (idx === 0) {
        this.flags.add('mira:quest');
        this.ui.toast('Quest: bring Mira essence from the Hollow');
        this.save();
      } else if (idx === 1) {
        shop();
      }
    });
  }

  // Open a searchable. Two-step flow:
  //   1. Show the discovery prompt (first line) + "Search / Leave" choice.
  //   2. On Search, reveal the rest of the lines, then grant the reward.
  // This keeps the act of finding the item before reading what it is.
  openSearchable(s) {
    if (this.searched.has(s.id)) return;
    audio.play('menu');
    const all = Array.isArray(s.lines) ? s.lines : (s.lines ? [s.lines] : []);
    const promptLine = s.prompt || all[0] || `You search the ${s.kind || 'spot'}…`;
    const revealLines = s.reveal || all.slice(s.prompt ? 0 : 1);
    this.ui.showDialog(s.label || '—', [promptLine], ['Search', 'Leave'], idx => {
      if (idx !== 0) return;
      const claim = () => {
        this._grantSearchableReward(s);
        this.searched.add(s.id);
        this.save();
      };
      if (revealLines.length) {
        this.ui.showDialog(s.label || '—', revealLines, null, null, claim);
      } else {
        claim();
      }
    });
  }

  _grantSearchableReward(s) {
    const r = s.item;
    if (!r) return;
    if (r.kind === 'lore') {
      // Pure narrative pickup — the dialog already showed the text. Shrine-
      // style lore beats can opt out of the journal-page toast via `toast: false`
      // and supply a custom audio sting via `audio: 'chime'` to replace the
      // default levelup chord.
      if (r.toast !== false) this.ui.toast(r.toast || 'Journal page recovered');
      if (r.audio) { audio.play(r.audio); return; }
    } else if (r.kind === 'gold') {
      this.gold += r.amount;
      this.ui.toast(`Found ${r.amount} gold!`);
    } else if (r.kind === 'consumable') {
      const inv = this.inventory.consumables;
      inv[r.id] = (inv[r.id] || 0) + (r.qty || 1);
      const t = ITEM_BY_ID[r.id];
      this.ui.toast(`Found ${t?.name || r.id}${r.qty > 1 ? ' ×' + r.qty : ''}!`);
    } else if (r.kind === 'equipment') {
      const inst = createEquipmentInstance(r.id);
      if (inst) {
        this.inventory.equipment.push(inst);
        this.ui.toast(`Found ${inst.template.name}!`);
      }
    } else if (r.kind === 'gem') {
      const inst = createGemInstance(r.id);
      if (inst) {
        this.inventory.gems.push(inst);
        this.ui.toast(`Found ${inst.template.name}!`);
      }
    }
    audio.play('levelup');
  }

  openNpc(npc) {
    audio.play('menu');
    if (npc.kind === 'talk') {
      // Elder Vorrin has branching state-aware dialog.
      if (npc.id === 'elder') return this._openElderDialog(npc);
      if (npc.id === 'hermit:sable') return this._openSableDialog(npc);
      if (npc.id === 'tender:caretaker') return this._openCaretakerDialog(npc);
      if (npc.id === 'bren:dying') return this._openBrenDialog(npc);
      if (npc.id === 'cal:scout') return this._openCalDialog(npc);
      this.ui.showDialog(npc.name, npc.lines, null, null);
    } else if (npc.kind === 'inn') {
      // First rest is on Vorrin's tab — Edran's dialog acknowledges it. After
      // the first night the standard 10g-bed pitch returns.
      const firstRest = !this.flags.has('town:rested');
      const lines = firstRest
        ? [
            '(He looks up from a kettle, eyes the worn road off your boots.) "You came in with Vorrin\'s blessing, didn\'t you?"',
            '"He sent word — your bed tonight\'s on him. He pays his debts before he names them. Rest if you mean to."',
          ]
        : npc.lines;
      const optLabel = firstRest ? 'Rest (on Vorrin)' : 'Rest (' + npc.cost + 'g)';
      this.ui.showDialog(npc.name, lines, [optLabel, 'Leave'], idx => {
        if (idx === 0) this._restAtInn(npc.cost);
      });
    } else if (npc.kind === 'shop') {
      // Mira has a side-quest tied to the Hollow Warden.
      if (npc.id === 'shopkeeper') return this._openMiraDialog(npc);
      this.ui.showDialog(npc.name, npc.lines, ['Browse', 'Leave'], idx => {
        if (idx === 0) this.ui.openShop(this, SHOP_INVENTORY);
      });
    } else if (npc.kind === 'recruit') {
      if (this.party.length >= MAX_PARTY) {
        this.ui.showDialog(npc.name, ['Your party is already full.'], null, null);
        return;
      }
      // Dynamic class assignment — pick the first class in the recruit's
      // `preferredClasses` order that isn't already in the party. This
      // avoids ending up with two healers or two of any class. If the
      // recruit only defined a fixed `classId`, that's used unchanged.
      const chosenClass = this._chooseRecruitClass(npc);
      const cls = CLASS_BY_ID[chosenClass];
      const intro = (npc.lines || []).concat([`(${cls?.name || chosenClass}) Join your party?`]);
      this.ui.showDialog(npc.name, intro, ['Recruit', 'Not now'], idx => {
        if (idx !== 0) return;
        const join = () => {
          if (this.recruit(chosenClass, npc.name, npc.id)) {
            audio.play('levelup');
            this.ui.toast(`${npc.name} joined as ${cls?.name || chosenClass}.`);
          }
        };
        // If the active scene knows how to play a recruit cinematic, let it
        // run and finish the join in its callback. Otherwise, just join.
        if (this.scene?.playRecruitCinematic) {
          // Pass the resolved class so the cinematic palette can match.
          this.scene.playRecruitCinematic({ ...npc, classId: chosenClass }, join);
        } else join();
      });
    }
  }

  // Pick a recruit's actual class so the party doesn't end up duplicating
  // roles. Reads `npc.preferredClasses` (ordered) and returns the first
  // entry not already in the party. Falls back to `npc.classId` and finally
  // to any unused class from the full roster.
  _chooseRecruitClass(npc) {
    const partyClasses = new Set(this.party.map(m => m.classId));
    const prefs = npc.preferredClasses ?? (npc.classId ? [npc.classId] : []);
    for (const cls of prefs) {
      if (CLASS_BY_ID[cls] && !partyClasses.has(cls)) return cls;
    }
    // Fallback — pick any registered class not in the party
    for (const cls of Object.keys(CLASS_BY_ID)) {
      if (!partyClasses.has(cls)) return cls;
    }
    // Truly last resort — use the declared classId or fighter
    return npc.classId || 'fighter';
  }

  recruit(classId, name, npcId) {
    if (this.party.length >= MAX_PARTY) return false;
    const m = makeCharacter(classId, name);
    // Bring recruits up to the leader's level so they pull weight immediately.
    const target = Math.max(1, this.player.level);
    while (m.level < target) {
      m.level++;
      m.xpToNext = xpForLevel(m.level);
      m.sp = (m.sp || 0) + SP_PER_LEVEL;
    }
    rebuildStats(m);
    m.hp = m.maxHp; m.mp = m.maxMp;
    this.party.push(m);
    if (npcId) this.recruited.add(npcId);
    this.save();
    return true;
  }

  _restAtInn(cost) {
    // First rest of the game is on Vorrin's tab — fits his "rest a night, the
    // inn is honest" pitch and keeps the rest gate from punishing a fresh
    // player who hasn't earned 10g yet. Also flagged so the west gate's
    // auto-rest cutscene doesn't fire after the player has rested manually.
    const firstRest = !this.flags.has('town:rested');
    if (firstRest) cost = 0;
    if (this.gold < cost) {
      this.ui.toast('Not enough gold.');
      audio.play('hurt');
      return;
    }
    this.gold -= cost;
    for (const m of this.party) { m.hp = m.maxHp; m.mp = m.maxMp; }
    audio.play('heal');
    this.flags.add('town:rested');
    this.ui.toast(firstRest ? 'You rest. Party fully restored.' : 'Rested. Party fully restored.');
    this.save();
    // First rest flips Bren's `requires: 'town:rested'` gate — refresh the
    // overworld so he appears at the gatepost without forcing a map reload.
    if (firstRest) this.scene?._refreshNpcs?.();
  }

  buyFromShop(entry) {
    if (this.gold < entry.price) {
      this.ui.toast('Not enough gold.');
      audio.play('hurt');
      return false;
    }
    this.gold -= entry.price;
    if (entry.type === 'consumable') {
      const inv = this.inventory.consumables;
      inv[entry.id] = (inv[entry.id] || 0) + 1;
    } else if (entry.type === 'equipment') {
      const inst = createEquipmentInstance(entry.id);
      if (inst) this.inventory.equipment.push(inst);
    } else if (entry.type === 'gem') {
      const inst = createGemInstance(entry.id);
      if (inst) this.inventory.gems.push(inst);
    }
    audio.play('confirm');
    this.save();
    return true;
  }

  addDrops(drops) {
    for (const d of drops) {
      if (d.kind === 'gold') this.gold += d.amount;
      else if (d.kind === 'consumable') {
        const inv = this.inventory.consumables;
        inv[d.id] = (inv[d.id] || 0) + 1;
      } else if (d.kind === 'equipment') {
        const inst = createEquipmentInstance(d.id);
        if (inst) this.inventory.equipment.push(inst);
      } else if (d.kind === 'gem') {
        const inst = createGemInstance(d.id);
        if (inst) this.inventory.gems.push(inst);
      }
    }
  }

  slotGem(memberIdx, equipInst, slotIdx, gemInst) {
    if (!equipInst || slotIdx < 0 || slotIdx >= equipInst.template.gemSlots) return false;
    const existing = equipInst.gems[slotIdx];
    const invIdx = this.inventory.gems.indexOf(gemInst);
    if (invIdx < 0) return false;
    this.inventory.gems.splice(invIdx, 1);
    equipInst.gems[slotIdx] = gemInst;
    if (existing) this.inventory.gems.push(existing);
    const m = this.party[memberIdx];
    if (m) rebuildStats(m);
    return true;
  }

  unslotGem(memberIdx, equipInst, slotIdx) {
    if (!equipInst) return false;
    const existing = equipInst.gems[slotIdx];
    if (!existing) return false;
    equipInst.gems[slotIdx] = null;
    this.inventory.gems.push(existing);
    const m = this.party[memberIdx];
    if (m) rebuildStats(m);
    return true;
  }

  // Distribute battle XP across every slotted gem on any party member's gear.
  // Hitting maxLevel "masters" the gem — a fresh Lv1 copy of the same gem
  // appears in inventory (FF7-style materia mastery).
  awardGemXp(totalXp) {
    const slottedGems = [];
    for (const m of this.party) {
      for (const slot of ['weapon', 'armor', 'accessory']) {
        const inst = m.equipped?.[slot];
        if (!inst) continue;
        for (const g of (inst.gems || [])) if (g) slottedGems.push({ g, owner: m });
      }
    }
    if (slottedGems.length === 0) return;
    const share = Math.max(1, Math.floor(totalXp / slottedGems.length));
    const notices = [];
    const masteryNotices = [];
    const dirty = new Set();
    for (const { g, owner } of slottedGems) {
      const reached = addGemXp(g, share);
      if (reached.length) dirty.add(owner);
      for (const lv of reached) notices.push(`${g.template.name} → Lv ${lv}`);
      // Mastery — Lv reached === maxLevel spawns a fresh Lv1 copy in inventory.
      if (reached.includes(g.template.maxLevel)) {
        const copy = createGemInstance(g.id);
        if (copy) {
          this.inventory.gems.push(copy);
          masteryNotices.push(`✦ ${g.template.name} mastered! New ${g.template.name} created.`);
        }
      }
    }
    for (const m of dirty) rebuildStats(m);
    if (notices.length) {
      this.ui.toast(notices.join(' · '));
      audio.play('confirm');
    }
    if (masteryNotices.length) {
      // Slight delay so the level-up toast lands first, then the mastery toast.
      setTimeout(() => {
        this.ui.toast(masteryNotices.join(' · '));
        audio.play('victory');
      }, 900);
    }
  }

  enterBattle(enemyIds, key, opts = {}) {
    // `opts.defeatFlag` — set on victory; powers the scripted-overworld-enemy
    // pipeline (mirrors _pendingBossWinFlag but writes to defeatedEnemies).
    // `opts.guest` — string id for a transient 4th party member (e.g. 'cal')
    // that joins for this battle only and is NOT added to game.party.
    if (opts.defeatFlag) this._pendingDefeatedFlag = opts.defeatFlag;
    const b = new Battle(this, enemyIds, key, { guest: opts.guest || null });
    this.scene = b;
    b.enter();
  }

  // Wraps enterBattle for scripted boss fights — on victory, the named flag is
  // set so the gate opens and the encounter doesn't fire again.
  enterBossBattle(enemyId, winFlag) {
    this._pendingBossWinFlag = winFlag;
    this.enterBattle([enemyId], 'boss:' + winFlag);
  }

  exitBattle(result) {
    if (result?.won) {
      // Aggregate XP/Gold multipliers across living party (utility gems).
      let xpBonus = 0, goldBonus = 0;
      for (const m of this.party) {
        if (m.hp <= 0) continue;
        xpBonus += m.xpBonus || 0;
        goldBonus += m.goldBonus || 0;
      }
      const goldGained = Math.floor(result.goldGained * (1 + goldBonus));
      const xpGained = Math.floor(result.xpGained * (1 + xpBonus));
      this.gold += goldGained;
      if (goldBonus > 0) this.ui.toast(`+${Math.round(goldBonus * 100)}% gold bonus`);
      if (result.drops?.length) this.addDrops(result.drops);
      if (this._pendingBossWinFlag) {
        this.flags.add(this._pendingBossWinFlag);
        this._pendingBossWinFlag = null;
      }
      if (this._pendingDefeatedFlag) {
        this.defeatedEnemies.add(this._pendingDefeatedFlag);
        // Cal's rescue fight pays out: full party heal + grant 1 free level.
        if (this._pendingDefeatedFlag === 'meadow:rescueCal') {
          this.flags.add('cal:rescued');
          for (const m of this.party) {
            m.hp = m.maxHp;
            m.mp = m.maxMp;
          }
          this._grantFreeLevel();
          this.ui.toast('Cal heals the party and shares his XP!');
        }
        this._pendingDefeatedFlag = null;
      }
      this.awardGemXp(Math.max(2, Math.floor(xpGained * 0.35)));
      this._gainXp(xpGained);
    } else if (result?.fled) {
      // Fled — clear any pending boss-win flag so a later random-encounter
      // win doesn't retroactively credit the unfought boss.
      this._pendingBossWinFlag = null;
      this._pendingDefeatedFlag = null;
    } else {
      // Loss — same hazard. Clear the pending flag before the GameOver
      // overlay so a future load+win doesn't credit the failed attempt.
      this._pendingBossWinFlag = null;
      this._pendingDefeatedFlag = null;
      this.running = false;
      audio.stopMusic();
      audio.stopAmbient();
      audio.play('defeat');
      audio.startMusic('defeat');
      this.ui.showGameOver();
      return;
    }
    this.scene = new Overworld(this);
    this.save();
  }

  // Story-beat free level — used by the Cal rescue scene. Every living party
  // member gains exactly one level regardless of current XP.
  _grantFreeLevel() {
    const notices = [];
    for (const m of this.party) {
      if (m.hp <= 0) continue;
      m.xp = 0;
      m.level++;
      m.xpToNext = xpForLevel(m.level);
      m.sp = (m.sp || 0) + SP_PER_LEVEL;
      rebuildStats(m);
      m.hp = m.maxHp; m.mp = m.maxMp;
      notices.push(`${m.name} → Lv ${m.level}`);
    }
    if (notices.length) {
      audio.play('levelup');
      this.ui.toast(notices.join(' · '));
    }
  }

  // Each living party member gains the same XP (FF1-style — generous; KO'd get nothing).
  _gainXp(amount) {
    const notices = [];
    for (const m of this.party) {
      if (m.hp <= 0) continue;
      m.xp += amount;
      while (m.xp >= m.xpToNext) {
        m.xp -= m.xpToNext;
        m.level++;
        m.xpToNext = xpForLevel(m.level);
        m.sp = (m.sp || 0) + SP_PER_LEVEL;
        rebuildStats(m);
        m.hp = m.maxHp; m.mp = m.maxMp;
        notices.push(`${m.name} → Lv ${m.level}`);
      }
    }
    if (notices.length) {
      audio.play('levelup');
      this.ui.toast(notices.join(' · '));
    }
  }

  learnNode(memberIdx, nodeId) {
    const p = this.party[memberIdx];
    if (!p) return false;
    const node = classNodeById(p.classId, nodeId);
    if (!node) return false;
    if (p.learnedNodes.has(nodeId)) return false;
    if (!node.requires.every(r => p.learnedNodes.has(r))) return false;
    if (node.levelReq && (p.level || 1) < node.levelReq) return false;
    if ((p.sp || 0) < node.cost) return false;
    p.sp -= node.cost;
    p.learnedNodes.add(nodeId);
    rebuildStats(p);
    this.save();
    return true;
  }

  equip(memberIdx, slot, instance) {
    const m = this.party[memberIdx];
    if (!m) return;
    if (m.equipped[slot]) this.inventory.equipment.push(m.equipped[slot]);
    m.equipped[slot] = instance;
    if (instance) {
      const idx = this.inventory.equipment.indexOf(instance);
      if (idx >= 0) this.inventory.equipment.splice(idx, 1);
    }
    rebuildStats(m);
  }

  unequip(memberIdx, slot) {
    const m = this.party[memberIdx];
    if (!m || !m.equipped[slot]) return;
    this.inventory.equipment.push(m.equipped[slot]);
    m.equipped[slot] = null;
    rebuildStats(m);
  }

  // Use a consumable item on the given party member (overworld use).
  useConsumable(itemId, memberIdx) {
    const inv = this.inventory.consumables;
    const it = ITEM_BY_ID[itemId];
    const p = this.party[memberIdx];
    if (!it || !p || !inv[itemId]) return false;
    if (it.kind === 'heal-hp') {
      if (p.hp >= p.maxHp) { this.ui.toast(`${p.name}'s HP is full.`); return false; }
      const before = p.hp;
      p.hp = Math.min(p.maxHp, p.hp + it.power);
      this.ui.toast(`${p.name} +${p.hp - before} HP`);
    } else if (it.kind === 'heal-mp') {
      if (p.mp >= p.maxMp) { this.ui.toast(`${p.name}'s MP is full.`); return false; }
      const before = p.mp;
      p.mp = Math.min(p.maxMp, p.mp + it.power);
      this.ui.toast(`${p.name} +${p.mp - before} MP`);
    } else return false;
    inv[itemId]--;
    audio.play('heal');
    return true;
  }

  resize(w, h) { this.viewW = w; this.viewH = h; }

  tick(t) {
    if (!this.running) return;
    const dt = Math.min(0.05, (t - this.lastT) / 1000);
    this.lastT = t;
    try {
      this.scene?.update?.(dt);
      this.scene?.draw?.(this.ctx);
      this.ui.update(this);
    } catch (err) {
      this.running = false;
      this.ui.showError(err);
      return;
    }
    requestAnimationFrame(this.tick.bind(this));
  }
}

// Compute effective stats from base + level growth + equipped gear + slotted
// gems + resonance combos. Re-run on level up, equip, gem changes.
export function rebuildStats(p) {
  const base = p.base;
  const stats = { ...base };
  const cls = CLASS_BY_ID[p.classId];
  const growth = cls?.growth ?? HERO_GROWTH;
  for (const k of Object.keys(growth)) {
    stats[k] = stats[k] + growth[k] * (p.level - 1);
  }
  const granted = [];
  const activeCombos = [];
  // Aggregate gem-derived passive effects (stacked across all slotted gems).
  let attackStatus = null;
  let atbMult = 1;
  let xpBonus = 0;
  let goldBonus = 0;
  for (const slot of ['weapon', 'armor', 'accessory']) {
    const inst = p.equipped?.[slot];
    if (!inst) continue;
    const { stats: bonus, grants, slottedGemIds } = computeEquipBonus(inst, gemEffects);
    for (const k of Object.keys(bonus)) stats[k] = (stats[k] || 0) + bonus[k];
    for (const g of grants) granted.push(g);
    // Roll through gems individually for the new passive effect fields.
    for (const gemInst of (inst.gems || [])) {
      if (!gemInst) continue;
      const eff = gemEffects(gemInst);
      if (eff.attackStatus) {
        // Highest-chance attack status wins (no stacking of distinct statuses).
        if (!attackStatus || eff.attackStatus.chance > attackStatus.chance) attackStatus = eff.attackStatus;
      }
      if (eff.atbMult) atbMult *= eff.atbMult;
      if (eff.xpBonus) xpBonus += eff.xpBonus;
      if (eff.goldBonus) goldBonus += eff.goldBonus;
    }
    // 2-gem combos require gems to share a link group. With transitive links
    // any two gems in the same connected group pair. 3+ gem combos still
    // trigger item-wide. AFTER gathering both, smaller combos whose gem set
    // is fully contained in a larger active combo are suppressed — so a 3-gem
    // trio (e.g. Tide Triad from fire+ice+water) hides its three pair combos
    // (Steam Burst, Scald Geyser, Deluge). Same rule collapses 3-gem combos
    // into a 4-gem Ultima when applicable.
    const itemCombos = [];
    for (const group of linkGroups(inst)) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const ga = inst.gems[group[i]], gb = inst.gems[group[j]];
          if (!ga || !gb) continue;
          for (const c of matchPairCombo(ga.id, gb.id)) itemCombos.push(c);
        }
      }
    }
    if (slottedGemIds.length >= 3) {
      for (const c of matchHigherCombos(slottedGemIds)) itemCombos.push(c);
    }
    const suppressed = new Set();
    for (let a = 0; a < itemCombos.length; a++) {
      for (let b = 0; b < itemCombos.length; b++) {
        if (a === b) continue;
        const small = itemCombos[a], big = itemCombos[b];
        if (small.gems.length >= big.gems.length) continue;
        if (small.gems.every(g => big.gems.includes(g))) suppressed.add(small);
      }
    }
    for (const c of itemCombos) {
      if (suppressed.has(c)) continue;
      activeCombos.push(c);
      for (const g of c.grants) granted.push(g);
    }
  }
  p.attackStatus = attackStatus;
  p.atbMult = atbMult;
  p.xpBonus = xpBonus;
  p.goldBonus = goldBonus;
  // Vengeful Sigil — counter linker. Looks across the whole link group it
  // sits in (transitively-linked sockets, not just a direct partner) to pick
  // a counter spell, AND to collect any OTHER linkers in the same group so
  // the counter composes with 2×/4× cast and AoE.
  //
  // Priority for the counter spell: 3+ gem combo > 2-gem combo > single
  // gem's highest tier > basic attack. This means linking fire+ice+counter
  // actually counters with Steam Burst (the pair combo), not bare Fire.
  // Passive grants (stat buffs etc.) are filtered out — counters need an
  // active spell to fire.
  const firstActiveGrant = (combo) => {
    for (const id of (combo.grants || [])) {
      const s = SKILL_BY_ID[id];
      if (s && s.kind !== 'passive') return id;
    }
    return null;
  };
  let counterSkill = null;
  let counterLinkers = [];
  outer: for (const slot of ['weapon', 'armor', 'accessory']) {
    const inst = p.equipped?.[slot];
    if (!inst?.gems) continue;
    for (let i = 0; i < inst.gems.length; i++) {
      const gem = inst.gems[i];
      if (gem?.template?.linkerEffect !== 'counter') continue;
      const group = linkGroupFor(inst, i);
      const fxSet = new Set();
      const groupGemIds = [];
      const groupGemInsts = [];
      if (group) {
        for (const idx of group) {
          if (idx === i) continue;
          const other = inst.gems[idx];
          if (!other) continue;
          if (other.template?.linker) {
            if (other.template.linkerEffect !== 'counter') fxSet.add(other.template.linkerEffect);
            continue;
          }
          groupGemIds.push(other.id);
          groupGemInsts.push(other);
        }
      }
      let pick = null;
      // 1) Trio+ combos — strongest, use first non-passive grant.
      if (groupGemIds.length >= 3) {
        for (const c of matchHigherCombos(groupGemIds)) {
          const skId = firstActiveGrant(c);
          if (skId) { pick = skId; break; }
        }
      }
      // 2) Any 2-gem pair combo within the group.
      if (!pick && groupGemIds.length >= 2) {
        outerCombo: for (let a = 0; a < groupGemIds.length; a++) {
          for (let b = a + 1; b < groupGemIds.length; b++) {
            for (const c of matchPairCombo(groupGemIds[a], groupGemIds[b])) {
              const skId = firstActiveGrant(c);
              if (skId) { pick = skId; break outerCombo; }
            }
          }
        }
      }
      // 3) Single-gem highest tier — the original fallback.
      if (!pick) {
        for (const other of groupGemInsts) {
          const tmpl = other.template;
          const lv = Math.min(other.level, tmpl.maxLevel);
          for (let l = lv; l >= 1; l--) {
            const gr = tmpl.grantsByLevel?.[l];
            if (gr?.length) { pick = gr[0]; break; }
          }
          if (pick) break;
        }
      }
      counterSkill = pick || 'attack';
      counterLinkers = [...fxSet];
      break outer;
    }
  }
  p.counterSkill = counterSkill;
  p.counterLinkers = counterLinkers;
  const fromTree = skillsFromTree(p.classId, p.learnedNodes ?? new Set());
  const granted2 = [...fromTree, ...granted];
  p.skills = resolveTieredSkills(granted2);
  for (const sid of p.skills) {
    const s = SKILL_BY_ID[sid];
    if (s?.kind === 'passive' && s.passive?.stats) {
      for (const k of Object.keys(s.passive.stats)) stats[k] = (stats[k] || 0) + s.passive.stats[k];
    }
  }
  for (const k of Object.keys(stats)) p[k] = Math.floor(stats[k]);
  p.hp = Math.min(p.hp ?? p.maxHp, p.maxHp);
  p.mp = Math.min(p.mp ?? p.maxMp, p.maxMp);
  p.activeCombos = activeCombos;
}

// Build a single party member. Gold + inventory live on the Game, not here.
export function makeCharacter(classId, name) {
  const cls = CLASS_BY_ID[classId] || CLASS_BY_ID.fighter;
  const base = { ...cls.base };
  const p = {
    name,
    classId: cls.id,
    level: 1, xp: 0, xpToNext: xpForLevel(1),
    base,
    hp: base.maxHp, mp: base.maxMp,
    ...base,
    sp: STARTING_SP,
    learnedNodes: new Set(cls.startingNodes || []),
    skills: [],
    equipped: { weapon: null, armor: null, accessory: null },
    overworld: { x: null, y: null, facing: 0 },
  };
  rebuildStats(p);
  p.hp = p.maxHp; p.mp = p.maxMp;
  return p;
}
