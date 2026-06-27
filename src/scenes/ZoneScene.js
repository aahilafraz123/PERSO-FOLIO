import Phaser from 'phaser';
import { TILE, VIEW_W, VIEW_H } from '../config/constants.js';
import { ZONE_BY_KEY } from '../data/story.js';
import { GameState } from '../systems/state.js';
import Player from '../entities/Player.js';
import LightSystem from '../systems/LightSystem.js';
import Hud from '../systems/Hud.js';
import Guide from '../systems/Guide.js';

/**
 * ZoneScene — one generic, data-driven zone (GDD §5). Renders any zone from its
 * ASCII map + content in story.js: world tiles, collisions, signs, skill shards,
 * PC-screen monitors, NPCs, and the exit portal. The torch grows on entry, the
 * HUD persists via GameState, and reaching the portal advances the story.
 */
export default class ZoneScene extends Phaser.Scene {
  constructor() {
    super('zone');
  }

  create(data) {
    this.zone = ZONE_BY_KEY[data.zoneKey] || ZONE_BY_KEY.wilderness;
    const z = this.zone;
    GameState.visitedZones.add(z.key);

    this.frozen = true; // unfrozen after the intro
    this.dialogueOpen = false;
    this.transitioning = false;

    this.parseMap(z);
    this.buildWorld(z);
    this.spawnPlayer();
    this.setupCamera();
    this.setupLight(z);
    this.placeInteractables(z);
    this.setupInput();
    this.hud = new Hud(this, z);
    this.guide = new Guide(this);
    this.buildGuide();
    this.listenForOverlayClose();
    this.playIntro(z);
  }

  // ---------------------------------------------------------------------------
  // MAP PARSING
  // ---------------------------------------------------------------------------
  parseMap(z) {
    // pad ragged rows with walls so uneven authoring can't break parsing
    const w = Math.max(...z.map.map((r) => r.length));
    this.grid = z.map.map((r) => r.padEnd(w, '#'));
    this.mapW = w;
    this.mapH = this.grid.length;
    this.worldW = this.mapW * TILE;
    this.worldH = this.mapH * TILE;

    // collect marker cells in row-major order
    this.spawn = { x: TILE * 1.5, y: TILE * 1.5 };
    this.markers = { S: [], M: [], '*': [], N: [], '>': [] };
    for (let ty = 0; ty < this.mapH; ty++) {
      for (let tx = 0; tx < this.mapW; tx++) {
        const ch = this.grid[ty][tx];
        const px = tx * TILE + TILE / 2;
        const py = ty * TILE + TILE / 2;
        if (ch === '@') this.spawn = { x: px, y: py };
        else if (this.markers[ch]) this.markers[ch].push({ tx, ty, px, py });
      }
    }
  }

  isWall(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.mapW || ty >= this.mapH) return true;
    return this.grid[ty][tx] === '#';
  }

  // ---------------------------------------------------------------------------
  // WORLD
  // ---------------------------------------------------------------------------
  buildWorld(z) {
    this.physics.world.setBounds(0, 0, this.worldW, this.worldH);

    // ground
    this.add
      .tileSprite(0, 0, this.worldW, this.worldH, `floor_${z.key}`)
      .setOrigin(0, 0)
      .setDepth(0);

    this.walls = this.physics.add.staticGroup();
    const wallH = z.wallStyle === 'tree' ? 44 : 36;

    for (let ty = 0; ty < this.mapH; ty++) {
      for (let tx = 0; tx < this.mapW; tx++) {
        if (this.grid[ty][tx] !== '#') continue;
        const px = tx * TILE + TILE / 2;
        const py = ty * TILE + TILE; // bottom-anchored
        const wall = this.walls
          .create(px, py, `wall_${z.key}`)
          .setOrigin(0.5, 1)
          .setDepth(py);
        wall.body.setSize(28, 24).setOffset(2, wallH - 26);
      }
    }
  }

  spawnPlayer() {
    this.player = new Player(this, this.spawn.x, this.spawn.y);
    this.physics.add.collider(this.player, this.walls);

    this.embers = this.add
      .particles(0, 0, 'ember', {
        speed: { min: 6, max: 22 },
        angle: { min: 250, max: 290 },
        lifespan: { min: 500, max: 900 },
        scale: { start: 1, end: 0 },
        alpha: { start: 0.9, end: 0 },
        frequency: 80,
        quantity: 1,
        blendMode: 'ADD',
      })
      .setDepth(1100);
    this.embers.startFollow(this.player, 7, -8);
  }

  setupCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.worldW, this.worldH);
    cam.setZoom(1.75);
    cam.startFollow(this.player, true, 0.1, 0.1);
    cam.setRoundPixels(true);
    cam.fadeIn(600, 5, 6, 10);
  }

  setupLight(z) {
    const start = GameState.lastRadius ?? 56;
    this.light = new LightSystem(this, {
      radius: start,
      // the final zone is full daylight — almost no darkness
      darkness: z.torchRadius > 1000 ? 0.45 : 0.985,
    });
    this.light.growTo(z.torchRadius);
    GameState.lastRadius = z.torchRadius;
  }

  // ---------------------------------------------------------------------------
  // INTERACTABLES
  // ---------------------------------------------------------------------------
  placeInteractables(z) {
    this.blockers = this.physics.add.staticGroup();
    this.interactables = []; // { sprite, type, payload }

    // signs — two-beat { quote, inner }
    this.markers.S.forEach((m, i) => {
      const img = this.blockers.create(m.px, m.py, 'sign').setDepth(m.py);
      img.body.setSize(20, 10).setOffset(6, 18);
      this.interactables.push({ sprite: img, type: 'sign', signIndex: i, payload: this.normalizeSign(z.signs[i]) });
    });

    // monitors (PC-screen modals)
    this.markers.M.forEach((m, i) => {
      const img = this.blockers.create(m.px, m.py, 'monitor').setDepth(m.py);
      img.body.setSize(24, 14).setOffset(4, 16);
      img.postFX?.addGlow(0x00d9f5, 3, 0, false, 0.1, 8);
      this.interactables.push({ sprite: img, type: 'screen', payload: z.screens[i] ?? null });
    });

    // npcs
    this.markers.N.forEach((m, i) => {
      const img = this.blockers.create(m.px, m.py, 'npc').setDepth(m.py);
      img.body.setSize(16, 12).setOffset(8, 18);
      this.interactables.push({ sprite: img, type: 'npc', payload: z.npcs[i] ?? { name: '', lines: ['...'] } });
    });

    this.physics.add.collider(this.player, this.blockers);

    // skill shards — overlap to collect (GDD §6)
    this.shardSprites = [];
    this.markers['*'].forEach((m, i) => {
      const data = z.shards[i] ?? { skill: 'XP', xp: 10 };
      const id = `${z.key}:shard:${i}`;
      if (GameState.collectedShards.has(id)) return; // already grabbed
      const s = this.physics.add.image(m.px, m.py, 'shard').setDepth(m.py);
      s.body.setSize(20, 24);
      s.shardId = id;
      s.shardData = data;
      s.postFX?.addGlow(0x00d9f5, 4, 0, false, 0.1, 10);
      this.tweens.add({ targets: s, y: m.py - 4, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.physics.add.overlap(this.player, s, () => this.collectShard(s));
      this.shardSprites.push(s);
    });

    // exit portal — may stay hidden until every beat is read (the grind path, §8.1)
    const p = this.markers['>'][0];
    this.portalHidden = false;
    if (p) {
      this.portalPos = { x: p.px, y: p.py };
      this.portal = this.add.image(p.px, p.py, 'portal').setOrigin(0.5, 0.7).setDepth(p.py);
      this.portal.postFX?.addGlow(0x7b2fbe, 6, 0, false, 0.1, 12);
      this.tweens.add({ targets: this.portal, scaleX: 1.06, scaleY: 1.03, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      if (z.portalHiddenUntilRead) {
        this.portal.setAlpha(0);
        this.portalHidden = true; // no collision / label / beacon until revealed
      } else {
        this.addPortalLabel();
        this.portalZone = new Phaser.Geom.Circle(p.px, p.py, 26);
      }
    }

    // floating "[E]" prompt for the nearest interactable
    this.prompt = this.add
      .text(0, 0, '[E]', {
        fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#00d9f5',
        backgroundColor: '#05060acc', padding: { x: 5, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(1500)
      .setVisible(false);
  }

  collectShard(s) {
    if (!s.active) return;
    if (!GameState.collectShard(s.shardId, s.shardData.xp)) return;
    // pop
    const burst = this.add.particles(s.x, s.y, 'ember', {
      speed: { min: 30, max: 90 }, lifespan: 360, scale: { start: 1.2, end: 0 },
      quantity: 10, blendMode: 'ADD', tint: 0x00d9f5,
    }).setDepth(1100);
    this.time.delayedCall(380, () => burst.destroy());
    this.floatLabel(s.x, s.y, `+${s.shardData.skill}`);
    s.destroy();
  }

  floatLabel(x, y, text) {
    const t = this.add
      .text(x, y - 10, text, { fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#7af6ff' })
      .setOrigin(0.5)
      .setDepth(1600);
    this.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 1100, onComplete: () => t.destroy() });
  }

  // ---------------------------------------------------------------------------
  // v2 NARRATION HELPERS
  // ---------------------------------------------------------------------------
  normalizeSign(s) {
    if (s == null) return { quote: '...', inner: null };
    if (typeof s === 'string') return { quote: s, inner: null };
    return { quote: s.quote ?? '...', inner: s.inner ?? null };
  }

  addPortalLabel() {
    if (!this.zone.portalLabel || !this.portalPos) return;
    this.add
      .text(this.portalPos.x, this.portalPos.y - 40, this.zone.portalLabel, {
        fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#cdb8ff',
      })
      .setOrigin(0.5, 1)
      .setDepth(1500);
  }

  // a centered first-person card: fade in / hold / fade out (revelation, portal reveal)
  showCard(text, { duration = 4200, color = '#f0f0f5' } = {}) {
    const card = this.add
      .text(VIEW_W / 2, VIEW_H / 2, text, {
        fontFamily: 'JetBrains Mono, monospace', fontSize: '17px', color,
        align: 'center', wordWrap: { width: VIEW_W - 130 }, lineSpacing: 7,
      })
      .setOrigin(0.5).setScrollFactor(0).setDepth(2100).setAlpha(0)
      .setShadow(0, 2, '#000', 6);
    this.tweens.add({ targets: card, alpha: 1, duration: 700 });
    this.time.delayedCall(Math.max(800, duration - 700), () => {
      this.tweens.add({ targets: card, alpha: 0, duration: 700, onComplete: () => card.destroy() });
    });
  }

  showRevelation(text) {
    // the one spoken-metaphor beat (§8.3) — warm, held longer, earned
    this.showCard(text, { duration: 6000, color: '#ffe9a8' });
  }

  // the hidden grind exit appears once everything's been read (§8.1)
  revealPortal() {
    if (!this.portalHidden || !this.portal) return;
    this.portalHidden = false;
    this.tweens.add({ targets: this.portal, alpha: { from: 0, to: 1 }, duration: 900 });
    this.addPortalLabel();
    this.portalZone = new Phaser.Geom.Circle(this.portalPos.x, this.portalPos.y, 26);
    if (this.zone.portalRevealLine) this.showCard(this.zone.portalRevealLine);
    this.refreshGuide(); // now beacon the way out
  }

  // called when a sign/screen/npc overlay closes — mark it read, fire torch beats
  finishInteraction() {
    const it = this.activeInteractable;
    this.activeInteractable = null;
    if (!it) return;

    const tb = this.zone.torchBeat;
    if (tb && it.type === 'sign' && it.signIndex === tb.afterSignIndex && !this._torchBeatFired) {
      this._torchBeatFired = true;
      this.light.growTo(tb.growTo, 1500);
      GameState.lastRadius = tb.growTo;
      if (this.zone.revelation) this.time.delayedCall(450, () => this.showRevelation(this.zone.revelation));
    }
    this.markGuideDone(it);
  }

  updateProgress() {
    if (!this.progressText) return;
    const total = this.guideTargets.length;
    const done = Math.min(this.guideDone.size, total);
    this.progressText.setText(total ? '●'.repeat(done) + '○'.repeat(total - done) : '');
  }

  // ---------------------------------------------------------------------------
  // GUIDE — maximal wayfinding (beacon the next beat, narrate the objective)
  // ---------------------------------------------------------------------------
  buildGuide() {
    // the press-E beats worth leading the player to (signs, screens, npcs)
    this.guideTargets = this.interactables.filter((it) =>
      it.type === 'sign' || it.type === 'screen' || it.type === 'npc',
    );
    this.guideDone = new Set();
    this.guideCurrent = null; // applied once the intro clears

    // tiny dim progress dots (the counter words would break the inner voice)
    this.progressText = this.add
      .text(VIEW_W - 16, 40, '', { fontFamily: 'monospace', fontSize: '12px', color: '#3a3f57' })
      .setOrigin(1, 0).setScrollFactor(0).setDepth(1850);
  }

  refreshGuide() {
    if (!this.guide) return;
    this.updateProgress();
    const thoughts = this.zone.thoughts || [];
    const remaining = this.guideTargets.filter(
      (it) => it.sprite.active && !this.guideDone.has(it),
    );

    if (remaining.length) {
      // beacon the nearest un-done beat; the words are the inner voice (§4)
      let near = remaining[0];
      let best = Infinity;
      remaining.forEach((it) => {
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, it.sprite.x, it.sprite.y);
        if (d < best) { best = d; near = it; }
      });
      this.guideCurrent = near;
      const thought = thoughts.length
        ? thoughts[Math.min(this.guideDone.size, thoughts.length - 1)]
        : 'Follow the light.';
      this.guide.show({ x: near.sprite.x, y: near.sprite.y }, thought);
      return;
    }

    // everything read
    this.guideCurrent = null;
    if (this.portalHidden) { this.revealPortal(); return; } // grind exit appears now

    const lastThought = thoughts.length ? thoughts[thoughts.length - 1] : '';
    if (this.portal) {
      this.guide.show({ x: this.portal.x, y: this.portal.y }, lastThought || 'Follow the light →');
    } else {
      // final zone, no portal — this is the end
      this.guide.hide();
      this.finishFinalZone();
    }
  }

  finishFinalZone() {
    if (this._zoneFinished) return;
    this._zoneFinished = true;
    GameState.unlockAchievement(this.zone.achievement);
    if (this.zone.closingCard) {
      this.time.delayedCall(900, () => this.showCard(this.zone.closingCard, { duration: 7000 }));
    }
  }

  markGuideDone(it) {
    if (!this.guideTargets || !this.guideTargets.includes(it)) return;
    if (this.guideDone.has(it)) return;
    this.guideDone.add(it);
    this.refreshGuide();
  }

  // ---------------------------------------------------------------------------
  // INPUT
  // ---------------------------------------------------------------------------
  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,E,SPACE,ESC');
  }

  interactDown() {
    return Phaser.Input.Keyboard.JustDown(this.keys.E) || Phaser.Input.Keyboard.JustDown(this.keys.SPACE);
  }

  listenForOverlayClose() {
    // both the PC-screen modal and the DOM dialogue bar live in the site layer;
    // they tell us when they close so we can unfreeze the scene.
    this._onScreenClose = () => { this.frozen = false; this.finishInteraction(); };
    this._onDialogueClose = () => { this.frozen = false; this.dialogueOpen = false; this.finishInteraction(); };
    window.addEventListener('relentless:screen-close', this._onScreenClose);
    window.addEventListener('relentless:dialogue-close', this._onDialogueClose);
    this.events.once('shutdown', () => {
      window.removeEventListener('relentless:screen-close', this._onScreenClose);
      window.removeEventListener('relentless:dialogue-close', this._onDialogueClose);
    });
  }

  // ---------------------------------------------------------------------------
  // INTRO
  // ---------------------------------------------------------------------------
  playIntro(z) {
    // prelude cards (the events, in first person) THEN the big title card
    const runTitle = () => this.playTitleCard(z);
    if (z.prelude && z.prelude.length) this.playCardSequence(z.prelude, runTitle);
    else runTitle();
  }

  // timed, skippable centered cards (reused for preludes) — scene stays frozen
  playCardSequence(lines, onDone) {
    let idx = -1;
    let timer = null;
    let finished = false;

    const card = this.add
      .text(VIEW_W / 2, VIEW_H / 2, '', {
        fontFamily: 'JetBrains Mono, monospace', fontSize: '18px', color: '#e6e8f5',
        align: 'center', wordWrap: { width: VIEW_W - 130 }, lineSpacing: 7,
      })
      .setOrigin(0.5).setScrollFactor(0).setDepth(2100).setAlpha(0).setShadow(0, 2, '#000', 5);
    const hint = this.add
      .text(VIEW_W - 18, VIEW_H - 16, 'press any key to skip', {
        fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#5a607c',
      })
      .setOrigin(1, 1).setScrollFactor(0).setDepth(2100);

    const onKey = () => finish();
    const cleanup = () => {
      if (timer) timer.remove();
      this.input.keyboard.off('keydown', onKey);
      card.destroy(); hint.destroy();
    };
    const finish = () => { if (finished) return; finished = true; cleanup(); onDone(); };
    const next = () => {
      idx += 1;
      if (idx >= lines.length) { finish(); return; }
      card.setText(lines[idx]).setAlpha(0);
      this.tweens.add({ targets: card, alpha: 1, duration: 450 });
      timer = this.time.delayedCall(1900, () => {
        this.tweens.add({ targets: card, alpha: 0, duration: 400, onComplete: next });
      });
    };

    this.input.keyboard.on('keydown', onKey); // any key skips the whole prelude
    next();
  }

  playTitleCard(z) {
    const title = this.add
      .text(VIEW_W / 2, VIEW_H / 2 - 14, z.intro[0], {
        fontFamily: 'Orbitron, Courier New, monospace', fontSize: '34px', color: '#f0f0f5',
        align: 'center', wordWrap: { width: VIEW_W - 80 },
      })
      .setOrigin(0.5).setScrollFactor(0).setDepth(2100).setAlpha(0).setShadow(0, 3, '#000', 6);
    const sub = this.add
      .text(VIEW_W / 2, VIEW_H / 2 + 26, z.intro[1] ?? '', {
        fontFamily: 'JetBrains Mono, monospace', fontSize: '15px', color: '#8a90ad',
        align: 'center', wordWrap: { width: VIEW_W - 80 },
      })
      .setOrigin(0.5).setScrollFactor(0).setDepth(2100).setAlpha(0);

    this.tweens.add({ targets: [title, sub], alpha: 1, duration: 800 });
    this.time.delayedCall(2600, () => {
      this.tweens.add({
        targets: [title, sub], alpha: 0, duration: 800,
        onComplete: () => { title.destroy(); sub.destroy(); },
      });
    });
    // unfreeze decoupled from the tween so it can't get stuck
    this.time.delayedCall(3500, () => {
      this.frozen = false;
      this.refreshGuide(); // light the first beacon + first thought
    });
  }

  // ---------------------------------------------------------------------------
  // LOOP
  // ---------------------------------------------------------------------------
  update(time) {
    const blocked = this.frozen || this.dialogueOpen || this.transitioning;
    if (blocked) {
      this.player.setVelocity(0, 0);
      this.player.idle();
    } else {
      this.player.update(this.cursors, this.keys);
    }

    this.player.setDepth(this.player.y);
    this.embers.followOffset.x = this.player.flipX ? -7 : 7;
    this.light.update(this.player);
    this.guide.update(this.player, time);

    if (!this.transitioning) {
      this.handleProximity();
      this.handleKeys();
      this.handlePortal();
    }
  }

  handleProximity() {
    if (this.dialogueOpen || this.frozen) { this.prompt.setVisible(false); return; }
    let near = null;
    let best = 48;
    this.interactables.forEach((it) => {
      if (!it.sprite.active) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, it.sprite.x, it.sprite.y);
      if (d < best) { best = d; near = it; }
    });
    this.near = near;
    if (near) {
      const verb = near.type === 'screen' ? 'View' : near.type === 'npc' ? 'Talk' : 'Read';
      this.prompt.setText(`[E] ${verb}`).setPosition(near.sprite.x, near.sprite.y - 22).setVisible(true);
    } else {
      this.prompt.setVisible(false);
    }
  }

  handleKeys() {
    // while a DOM dialogue is open it owns the keyboard (advance / close)
    if (this.dialogueOpen) return;

    const interact = this.interactDown();
    const esc = Phaser.Input.Keyboard.JustDown(this.keys.ESC);

    if (interact && this.near && !this.frozen) {
      this.activate(this.near);
      return;
    }

    if (esc && !this.frozen) window.dispatchEvent(new Event('relentless:exit'));
  }

  openDialogue(payload, speaker) {
    this.frozen = true;
    this.dialogueOpen = true;
    const detail = Array.isArray(payload) ? { pages: payload, speaker } : { text: payload, speaker };
    window.dispatchEvent(new CustomEvent('relentless:dialogue', { detail }));
  }

  activate(it) {
    // mark which beat is open; it's counted as read when the overlay CLOSES
    this.activeInteractable = it;
    if (it.type === 'sign') {
      const s = it.payload; // { quote, inner }
      const pages = [s.quote];
      if (s.inner) pages.push(s.inner);
      this.openDialogue(pages);
    } else if (it.type === 'npc') {
      this.openDialogue(it.payload.lines, it.payload.name); // each line a page
    } else if (it.type === 'screen' && it.payload) {
      this.frozen = true;
      window.dispatchEvent(new CustomEvent('relentless:screen', { detail: { id: it.payload, zone: this.zone.key } }));
    }
  }

  handlePortal() {
    if (!this.portalZone || this.frozen) return;
    if (Phaser.Geom.Circle.Contains(this.portalZone, this.player.x, this.player.y)) {
      this.completeZone();
    }
  }

  completeZone() {
    if (this.transitioning) return;
    this.transitioning = true;
    GameState.unlockAchievement(this.zone.achievement);
    this.cameras.main.fadeOut(700, 5, 6, 10);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (this.zone.next) this.scene.restart({ zoneKey: this.zone.next });
    });
  }
}
