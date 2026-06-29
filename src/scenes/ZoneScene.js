import Phaser from 'phaser';
import { TILE, VIEW_W, VIEW_H } from '../config/constants.js';
import { ZONES, ZONE_BY_KEY } from '../data/story.js';
import { GameState } from '../systems/state.js';
import Player from '../entities/Player.js';
import LightSystem from '../systems/LightSystem.js';
import TorchResource from '../systems/TorchResource.js';
import Fog from '../systems/Fog.js';
import Hud from '../systems/Hud.js';
import Guide from '../systems/Guide.js';
import MiniGame from '../systems/MiniGame.js';
import { objectiveState } from '../systems/Objective.js';
import { MARKER_SPEC, MARKER_CHARS, STATION_VERB, GUIDED_STATION_KINDS, runStation } from '../systems/stations.js';
import { lightsOutThud, whoosh, ignite, startCrackle, stopCrackle, startZoneAmbient, stopZoneAmbient } from '../systems/audio.js';

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
    // accessibility: honor prefers-reduced-motion (skip shake, auto-pass minigames)
    this.reducedMotion = !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    // per-zone flags must reset — the scene instance is reused across restarts
    this._zoneFinished = false;
    this._torchBeatFired = false;
    this._beatsFired = new Set();
    this._objectiveComplete = false;
    this.scriptIndex = 0; // position in the authored story sequence (the guide)

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
    // station markers (gates, components, anvils, …) — dormant unless the zone
    // supplies the backing data array (see stations.js).
    MARKER_CHARS.forEach((ch) => { this.markers[ch] = []; });
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
    // sprint unlock: you move with more command as the story (and torch) grows —
    // late chapters literally feel faster. Subtle: ~132 → ~152 across the arc.
    const zi = Math.max(0, ZONES.findIndex((z) => z.key === this.zone.key));
    this.player.speed = 132 + zi * 4;
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
    const start = GameState.lastRadius ?? 120;
    this.light = new LightSystem(this, {
      radius: start,
      // softened so the whole map stays dimly visible (not pitch black); the
      // torch pool is still brighter and grows zone-to-zone for the arc.
      darkness: z.torchRadius > 1000 ? 0.22 : 0.74,
    });
    this.light.growTo(z.torchRadius);
    GameState.lastRadius = z.torchRadius;

    // TorchResource makes the flame something you tend in opt-in zones (decay
    // while still, recover while moving); elsewhere it just forwards to the light.
    this.torch = new TorchResource(this, this.light, { base: z.torchRadius, decay: !!z.torchDecay });

    // exploration memory — skip in the full-daylight finale (nothing to remember).
    if (z.torchRadius <= 1000) {
      this.fog = new Fog(this, { worldW: this.worldW, worldH: this.worldH });
    }

    // audio arc: torch crackle + an ambient pad that brightens with the chapter
    const zi = Math.max(0, ZONES.findIndex((zz) => zz.key === z.key));
    stopZoneAmbient();
    startZoneAmbient(zi / (ZONES.length - 1));
    startCrackle();
  }

  // ---------------------------------------------------------------------------
  // INTERACTABLES
  // ---------------------------------------------------------------------------
  placeInteractables(z) {
    this.blockers = this.physics.add.staticGroup();
    this.interactables = []; // { sprite, type, payload }

    // the scene INSTANCE is reused across scene.restart, so clear per-zone
    // transients that are only set conditionally — otherwise a zone without a
    // portal (the Horizon finale) inherits the previous zone's destroyed one.
    this.portal = null;
    this.portalPos = null;
    this.portalZone = null;
    this.companion = null;
    this._hub = null;
    this.exitBarrier = null;
    this.exitBarrierBody = null;
    this.exitBarrierLabel = null;

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

    // new interactive stations (gates, components, anvils, …) — data-driven
    this.placeStations(z);

    // exit portal — may stay hidden until every beat is read (the grind path, §8.1)
    const p = this.markers['>'][0];
    this.portalHidden = false;
    if (p) {
      this.portalPos = { x: p.px, y: p.py };
      this.portal = this.add.image(p.px, p.py, 'portal').setOrigin(0.5, 0.7).setDepth(p.py);
      this.portal.postFX?.addGlow(0x7b2fbe, 6, 0, false, 0.1, 12);
      this.tweens.add({ targets: this.portal, scaleX: 1.06, scaleY: 1.03, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      if (z.portalHiddenUntilRead || z.gatedByObjective) {
        this.portal.setAlpha(0);
        this.portalHidden = true; // no collision / label / beacon until the objective's done
        // a VISIBLE locked barrier so it's clear you must finish the work first
        if (z.gatedByObjective) this.buildExitBarrier(p.px, p.py);
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

  // ---------------------------------------------------------------------------
  // STATIONS — the new verbs (gates, components, anvils, data nodes, …)
  // Generic placement; per-kind behavior lives in stations.js + phase methods.
  // ---------------------------------------------------------------------------
  placeStations(z) {
    this.stations = [];          // press-E / step / proximity station records
    this.proximityStations = []; // auto-fire when the player is near
    this.stepStations = [];      // floor triggers you stand on (pitch stage)

    // build-loop state (Forge): collect components → forge at the anvil → pitch
    this.buildTotal = (z.components || []).length;
    this.buildCount = 0;
    this.forged = false;
    this.pitched = false;

    // deploy state (Mission): connect data nodes → AirCast goes live
    this.deployTotal = (z.dataNodes || []).length;
    this.connectedCount = 0;
    this.deployed = false;

    // carry-burn state (Wilderness): haul rejection letters to the campfire
    this.burnTotal = (z.letters || []).length;
    this.burnedCount = 0;
    this.carriedLetter = null;
    this.carriedSprite = null;
    this.campfireRec = null;

    // ship state (Hollow): grind out the work nobody assigned
    this.shipTotal = (z.ships || []).length;
    this.shippedCount = 0;

    // present state (Arena): reach the boardroom through the gauntlet → present
    this.presented = false;
    this.reachedBoardroom = false;
    this.presentRec = null;

    // send state (Horizon): reach the contact terminal and send your message
    this.sent = false;

    Object.values(MARKER_SPEC).forEach((spec) => {
      const cells = this.markers[spec.char] || [];
      const data = z[spec.arr] || [];
      cells.forEach((m, i) => {
        const payload = data[i];
        if (payload == null && spec.place !== 'solid') return; // need content
        const tex = this.textures.exists(spec.tex) ? spec.tex : 'sign';

        if (spec.place === 'pickup') {
          const s = this.physics.add.image(m.px, m.py, tex).setDepth(m.py);
          s.body.setSize(20, 24);
          s.postFX?.addGlow(spec.secret ? 0xffcf3a : 0x00d9f5, 4, 0, false, 0.1, 9);
          this.tweens.add({ targets: s, y: m.py - 4, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
          const rec = { sprite: s, type: spec.kind, kind: spec.kind, payload, secret: !!spec.secret };
          this.physics.add.overlap(this.player, s, () => this.collectStation(rec));
          this.stations.push(rec);
          return;
        }

        if (spec.place === 'proximity' || spec.place === 'step') {
          const s = this.add.image(m.px, m.py, tex).setDepth(m.py);
          const rec = { sprite: s, type: spec.kind, kind: spec.kind, payload, fired: false, radius: spec.place === 'step' ? 22 : 40 };
          (spec.place === 'step' ? this.stepStations : this.proximityStations).push(rec);
          this.stations.push(rec);
          return;
        }

        // solid — a blocker you press E at
        const img = this.blockers.create(m.px, m.py, tex).setDepth(m.py);
        img.body.setSize(22, 14).setOffset(5, 16);
        if (spec.secret) img.postFX?.addGlow(0xffcf3a, 2, 0, false, 0.1, 6);
        if (spec.kind === 'vuln') {
          // subtly "wrong" — a slow flicker that a watchful player notices
          this.tweens.add({ targets: img, alpha: { from: 1, to: 0.5 }, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
        const rec = { sprite: img, type: 'station', kind: spec.kind, payload, secret: !!spec.secret };
        if (spec.kind === 'campfire') { this.campfireRec = rec; img.postFX?.addGlow(0xff7b00, 3, 0, false, 0.1, 8); }
        if (spec.kind === 'present') { this.presentRec = rec; img.postFX?.addGlow(0xffcf3a, 3, 0, false, 0.1, 8); }
        this.interactables.push(rec); // press-E flows through activate()
        this.stations.push(rec);
      });
    });

    this.updateObjective();         // levels with an objective drive the banner
    this.createMeetingCounter();
  }

  // ---------------------------------------------------------------------------
  // FORGE — the build loop: collect 6 components → forge at the anvil → pitch
  // ---------------------------------------------------------------------------
  // readiness gate so the guide (and step triggers) don't fire a station early
  stationReady(st) {
    if (st.kind === 'anvil') return this.buildCount >= this.buildTotal;
    if (st.kind === 'pitch') return this.forged;
    if (st.kind === 'lever') return this.connectedCount >= this.deployTotal;
    return true;
  }

  // pickup: a component gathered toward the forge (each brightens the flame)
  onComponentCollected(rec) {
    this.buildCount += 1;
    this.burstAt(rec.sprite.x, rec.sprite.y, 0xff9a3c);
    this.floatLabel(rec.sprite.x, rec.sprite.y, `+${rec.payload?.name || 'system'}`);
    this.torch?.raiseBase(6, 500); // a notch of light per real piece
    rec.done = true;
    this.markGuideDone(rec);
    this.updateObjective();
    if (this.buildCount >= this.buildTotal) this.fireBeat('collected');
  }

  // station handler: press E at the anvil — needs all six, then the stoke minigame
  tryForge(st) {
    if (this.forged) return;
    if (this.buildCount < this.buildTotal) {
      this.floatLabel(st.sprite.x, st.sprite.y - 8, `Need all six — ${this.buildCount}/${this.buildTotal}`);
      return;
    }
    if (this.reducedMotion) { this.completeForge(st, 0.85); return; } // a11y: auto-pass
    this.frozen = true;
    new MiniGame(this, {
      mode: 'stoke', title: 'FORGE IT', hint: 'mash E / tap to stoke the fire',
      duration: 6000, onDone: (score) => { this.frozen = false; this.completeForge(st, score); },
    });
  }

  completeForge(st, score) {
    this.forged = true;
    st.done = true;
    ignite();
    this.screenShake(0.01, 260);
    this.burstAt(st.sprite.x, st.sprite.y, 0xff7b00);
    this.spawnCompanion();
    this.torch?.raiseBase(28); // forging your own tool is a permanent light bump
    GameState.addXp(18 + Math.round(score * 18));
    this.updateObjective();
    this.fireBeat('forged');
    this.play150Users(st.sprite.x, st.sprite.y);
    this.floatLabel(st.sprite.x, st.sprite.y - 12, 'LearnFlow forged ✦');
    if (st.payload?.line) this.time.delayedCall(700, () => this.showCard(st.payload.line, { duration: 4200 }));
    this.markGuideDone(st);
  }

  // the forged LearnFlow artifact — floats with you and carries its own light
  spawnCompanion() {
    this.companion = this.add.image(this.player.x, this.player.y - 22, 'artifact').setDepth(2000);
    this.companion.postFX?.addGlow(0xffb14a, 6, 0, false, 0.1, 12);
    this.tweens.add({ targets: this.companion, scale: { from: 0, to: 1 }, duration: 420, ease: 'Back.easeOut' });
  }

  // the "150+ users" wall: a grid of dots lights up one-by-one with a count-up
  play150Users(cx, cy) {
    const cols = 25;
    const total = 150;
    const gap = 5;
    const sx = cx - (cols * gap) / 2;
    const sy = cy - 64;
    const dots = [];
    for (let i = 0; i < total; i++) {
      dots.push(this.add.rectangle(sx + (i % cols) * gap, sy + Math.floor(i / cols) * gap, 3, 3, 0x00d9f5, 0.12).setDepth(1700));
    }
    const label = this.add
      .text(cx, sy - 14, '0 users', { fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#7af6ff' })
      .setOrigin(0.5).setDepth(1700);
    let lit = 0;
    this.time.addEvent({
      delay: 9, repeat: total - 1,
      callback: () => {
        dots[lit].setFillStyle(0x00d9f5, 1); lit += 1;
        label.setText(`${lit}${lit >= total ? '+' : ''} users`);
        if (lit >= total) {
          this.time.delayedCall(1200, () => {
            dots.forEach((d) => this.tweens.add({ targets: d, alpha: 0, duration: 500, onComplete: () => d.destroy() }));
            this.tweens.add({ targets: label, alpha: 0, duration: 500, delay: 300, onComplete: () => label.destroy() });
          });
        }
      },
    });
  }

  // step trigger: stand on the pitch stage → the timing minigame
  startPitch(st) {
    if (this.pitched || !this.forged) return;
    if (this.reducedMotion) { this.completePitch(st, 0.85); return; } // a11y: auto-pass
    this.frozen = true;
    new MiniGame(this, {
      mode: 'timing', title: 'PITCH IT', hint: 'press E when the marker hits the green — land three',
      duration: 8000, onDone: (score) => { this.frozen = false; this.completePitch(st, score); },
    });
  }

  completePitch(st, score) {
    this.pitched = true;
    st.done = true;
    ignite();
    this.applause(this.player.x, this.player.y);
    this.screenShake(0.012, 300);
    // THE light jump (the torchBeat, now earned by pitching) + the one revelation
    const growTo = st.payload?.growTo || 320;
    this.light.growTo(growTo, 1500);
    this.torch.base = Math.max(this.torch.base, growTo);
    GameState.lastRadius = growTo;
    GameState.addXp(24 + Math.round(score * 24));
    if (this.zone.revelation) this.time.delayedCall(500, () => this.showRevelation(this.zone.revelation));
    this.markGuideDone(st);
    this.updateObjective(); // objective complete → banner flips, exit reveals via guide
  }

  applause(x, y) {
    const b = this.add.particles(x, y - 10, 'ember', {
      speedX: { min: -120, max: 120 }, speedY: { min: -170, max: -60 }, lifespan: 900,
      scale: { start: 1, end: 0 }, quantity: 26, blendMode: 'ADD', tint: [0xffd27a, 0x7af6ff, 0xffffff],
    }).setDepth(1100);
    this.time.delayedCall(940, () => b.destroy());
  }

  // step / proximity dispatch (assigned as methods so handleStations can call them)
  onStepStation(st) {
    if (st.kind === 'pitch') this.startPitch(st);
  }

  // ---------------------------------------------------------------------------
  // MISSION CONTROL — wire 3 data sources → pull the DEPLOY lever → AirCast live
  // ---------------------------------------------------------------------------
  // the control-room screens are the hub the data sources wire into
  computeHub() {
    if (this._hub) return this._hub;
    const ms = this.markers.M || [];
    this._hub = ms.length
      ? { x: ms.reduce((a, m) => a + m.px, 0) / ms.length, y: ms.reduce((a, m) => a + m.py, 0) / ms.length }
      : { x: this.worldW / 2, y: this.worldH / 2 };
    return this._hub;
  }

  // station handler: connect a data-source globe (spins it, blooms its marker)
  connectNode(st) {
    if (st.connected) return;
    st.connected = true;
    st.done = true;
    this.connectedCount += 1;
    ignite();
    this.tweens.add({ targets: st.sprite, angle: st.sprite.angle + 360, duration: 700, ease: 'Cubic.easeOut' });
    if (st.payload?.marker) this.floatLabel(st.sprite.x, st.sprite.y - 6, st.payload.marker);
    this.burstAt(st.sprite.x, st.sprite.y, 0x00d9f5);
    this.drawDataLink(st.sprite.x, st.sprite.y);
    this.markGuideDone(st);
    this.updateObjective();
    if (this.connectedCount === 1) this.fireBeat('first');
    if (this.connectedCount >= this.deployTotal) this.fireBeat('wired');
    this.refreshGuide(); // now beacon the lever
  }

  // station handler: pull the DEPLOY lever (only after all sources are wired)
  pullLever(st) {
    if (this.deployed) return;
    if (this.connectedCount < this.deployTotal) {
      this.floatLabel(st.sprite.x, st.sprite.y - 8, `wire all ${this.deployTotal} sources first`);
      return;
    }
    st.sprite.setFlipY(true); // thrown
    this.deploySequence();
  }

  drawDataLink(x, y) {
    const hub = this.computeHub();
    const g = this.add.graphics().setDepth(1050);
    g.lineStyle(2, 0x00d9f5, 0.32);
    g.lineBetween(x, y, hub.x, hub.y);
    const dot = this.add.image(x, y, 'light').setTint(0x7af6ff)
      .setBlendMode(Phaser.BlendModes.ADD).setScale(0.06).setDepth(1060);
    this.tweens.add({ targets: dot, x: hub.x, y: hub.y, duration: 600, onComplete: () => dot.destroy() });
  }

  deploySequence() {
    if (this.deployed) return;
    this.deployed = true;
    const hub = this.computeHub();
    // a short cosmetic launch countdown (never punishes) → then it goes live
    [3, 2, 1].forEach((n, i) => this.time.delayedCall(i * 500, () => {
      ignite();
      this.floatLabel(hub.x, hub.y - 24, `T-${n}`);
    }));
    this.time.delayedCall(1500, () => {
      ignite();
      this.screenShake(0.012, 320);
      this.applause(hub.x, hub.y);
      ['NO₂', 'PM2.5', 'O₃'].forEach((m, i) => this.time.delayedCall(i * 160, () => this.floatLabel(hub.x + (i - 1) * 26, hub.y - 18, m)));
      GameState.addXp(30);
      this.fireBeat('deployed');
      this.refreshGuide(); // advance the script past the lever beat → exit reveals
    });
  }

  // ---------------------------------------------------------------------------
  // THE ARENA — meeting gauntlet (ambient friction) + the hidden vuln hunt
  // ---------------------------------------------------------------------------
  createMeetingCounter() {
    if (!(this.zone.meetings || []).length) return;
    GameState.meetingCount = 0; // this chapter's tally
    this.meetingCounterText = this.add
      .text(16, 54, '', { fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#ffcf3a' })
      .setOrigin(0, 0).setScrollFactor(0).setDepth(1850).setShadow(0, 2, '#000', 4)
      .setPadding(6, 3, 6, 3).setBackgroundColor('#05060acc');
    this.updateMeetingCounter();
  }

  updateMeetingCounter() {
    if (!this.meetingCounterText) return;
    this.meetingCounterText.setText(`▦ Meetings today: ${GameState.meetingCount}`);
  }

  // proximity dispatch (meeting doors auto-fire as you pass)
  onProximityStation(st) {
    if (st.kind === 'meeting') this.enterMeeting(st);
  }

  enterMeeting(st) {
    GameState.bumpMeetings();
    this.updateMeetingCounter();
    this.floatLabel(st.sprite.x, st.sprite.y - 10, `▸ ${st.payload?.name || 'Meeting'}`);
    // pulled into the meeting — a brief attend-pause (the gauntlet's friction)
    if (!this.presented && !this._miniGame) {
      this.frozen = true;
      this.time.delayedCall(380, () => { if (!this._miniGame && !this.dialogueOpen) this.frozen = false; });
    }
  }

  // station handler: present your work to leadership at the boardroom podium
  startPresent(st) {
    if (this.presented) return;
    this.reachedBoardroom = true;
    if (this.reducedMotion) { this.completePresent(st, 0.85); return; }
    this.frozen = true;
    new MiniGame(this, {
      mode: 'timing', title: 'PRESENT TO LEADERSHIP', hint: 'land three clean beats — make the room remember you',
      duration: 8000, onDone: (score) => { this.frozen = false; this.completePresent(st, score); },
    });
  }

  completePresent(st, score) {
    this.presented = true;
    st.done = true;
    ignite();
    this.applause(this.player.x, this.player.y);
    this.screenShake(0.012, 300);
    GameState.addXp(24 + Math.round(score * 24));
    this.time.delayedCall(450, () => this.showCard('"That work got mentioned upstairs. People noticed. Keep going."', { duration: 4200 }));
    this.markGuideDone(st);
    this.fireBeat('presented');
    this.updateObjective(); // complete → exit reveals
  }

  // station handler: fix the hidden auth vuln — a secret + an achievement
  fixVuln(st) {
    if (st.done) return;
    st.done = true;
    this.screenShake(0.01, 240);
    this.burstAt(st.sprite.x, st.sprite.y, 0xffcf3a);
    const id = `${this.zone.key}:vuln:${st.payload?.title || st.sprite.x}`;
    GameState.findSecret(id);
    GameState.addXp(st.payload?.xp ?? 22);
    if (st.payload?.achievement) GameState.unlockAchievement(st.payload.achievement);
    this.floatLabel(st.sprite.x, st.sprite.y - 10, '✦ vuln patched');
    if (st.payload?.line) this.time.delayedCall(500, () => this.showCard(st.payload.line, { duration: 4400 }));
    this.refreshGuide(); // advance the gold secret beacon → exit
  }

  collectStation(rec) {
    if (!rec.sprite.active) return;
    if (rec.kind === 'letter') { this.pickUpLetter(rec); return; }
    if (rec.kind === 'relic') {
      const id = `${this.zone.key}:relic:${rec.payload?.id ?? rec.sprite.x}`;
      if (!GameState.collectRelic(id, rec.payload?.xp ?? 14)) return;
      this.burstAt(rec.sprite.x, rec.sprite.y, 0xffcf3a);
      this.floatLabel(rec.sprite.x, rec.sprite.y, `✦ ${rec.payload?.name ?? 'Relic'}`);
      if (GameState.relics.size >= 3) {
        GameState.unlockAchievement({ title: 'Certified', desc: 'AZ-900 · AI-900 · SC-900 — all three relics found.' });
      }
      rec.sprite.destroy();
      this.refreshGuide(); // advance the gold beacon to the next secret / exit
      return;
    }
    this.onComponentCollected?.(rec); // Forge wires this in Phase 3
    rec.sprite.destroy();
  }

  // ---------------------------------------------------------------------------
  // WILDERNESS — carry & burn: haul rejection letters to the fire (the verb)
  // ---------------------------------------------------------------------------
  pickUpLetter(rec) {
    if (this.carriedLetter || rec.picked || rec.done) return; // one at a time
    rec.picked = true;
    this.carriedLetter = rec;
    rec.sprite.setVisible(false); // lifted off the ground
    this.carriedSprite = this.add.image(this.player.x, this.player.y - 20, 'letter').setDepth(2000);
    if (rec.payload?.quote) window.dispatchEvent(new CustomEvent('relentless:beat', { detail: { text: rec.payload.quote } }));
    this.refreshGuide(); // now point to the fire
  }

  // station handler: burn the carried letter at the campfire — it becomes light
  burnLetter(st) {
    if (!this.carriedLetter) {
      this.floatLabel(st.sprite.x, st.sprite.y - 10, 'carry a rejection here');
      return;
    }
    const letter = this.carriedLetter;
    this.carriedLetter = null;
    this.carriedSprite?.destroy();
    this.carriedSprite = null;
    letter.sprite.destroy();
    letter.done = true;
    this.burnedCount += 1;

    ignite();
    this.screenShake(0.006, 180);
    this.burstAt(st.sprite.x, st.sprite.y - 6, 0xff7b00);
    st.sprite.setScale((st.sprite.scaleX || 1) + 0.12); // the fire grows
    this.torch?.raiseBase(8, 600); // rejections become fuel — the light grows
    if (letter.payload?.inner) this.time.delayedCall(400, () => this.showCard(letter.payload.inner, { duration: 3600 }));

    this.updateObjective();
    if (this.burnedCount === 1) this.fireBeat('first');
    if (this.burnedCount >= this.burnTotal) this.fireBeat('complete');
    this.refreshGuide();
  }

  // --- station handler: the locked OFFER gate (Wilderness) -------------------
  // It never opens — that's the point. Pressing E thuds, shakes, and knocks the
  // flame a touch; the only way on is the long way around (the grind portal).
  bumpGate(st) {
    this.screenShake(0.008, 240);
    lightsOutThud();
    this.torch?.pulse(10);
    const label = st.payload?.label ? `${st.payload.label} — LOCKED` : 'LOCKED';
    this.floatLabel(st.sprite.x, st.sprite.y - 8, label);
    if (!st._said && st.payload?.line) {
      st._said = true;
      this.showCard(st.payload.line, { duration: 3400 });
    }
  }

  // --- station handler: grind out the work nobody assigned (Hollow) ----------
  // You GRIND it out (mash the rotating prompted key), and the reward is...
  // nothing. No toast, no chime, no XP. Just silence. Shipping all reveals the exit.
  shipWork(st) {
    if (st.shipped || st.shipping) return;
    if (this.reducedMotion) { this.completeShip(st); return; } // a11y: skip the grind
    st.shipping = true;
    this.frozen = true;
    new MiniGame(this, {
      mode: 'grind', title: 'GRIND IT OUT', hint: 'hit the key it asks for — nobody\'s watching, keep going',
      duration: 9000, onDone: () => { this.frozen = false; st.shipping = false; this.completeShip(st); },
    });
  }

  // the silent payoff — work leaves, nothing comes back
  completeShip(st) {
    if (st.shipped) return;
    st.shipped = true;
    st.done = true;
    this.shippedCount += 1;
    whoosh();
    this.shipBurst(st.sprite.x, st.sprite.y);
    this.floatLabel(st.sprite.x, st.sprite.y - 8, 'shipped →'); // no XP, no toast
    if (st.payload?.line) this.time.delayedCall(750, () => this.showCard(st.payload.line, { duration: 4400 }));
    this.markGuideDone(st);
    this.updateObjective();
    if (this.shippedCount === 1) this.fireBeat('first');
    if (this.shippedCount >= this.shipTotal) this.fireBeat('complete');
  }

  // a muted, cold departure — work drifts up and away into silence (not a cheer)
  shipBurst(x, y) {
    const b = this.add.particles(x, y - 6, 'ember', {
      speedX: { min: 16, max: 56 }, speedY: { min: -92, max: -52 }, lifespan: 720,
      scale: { start: 0.8, end: 0 }, alpha: { start: 0.45, end: 0 }, quantity: 6, tint: 0x6b7088,
    }).setDepth(1100);
    this.time.delayedCall(740, () => b.destroy());
  }

  // small reusable pickup/forge burst
  burstAt(x, y, tint = 0x00d9f5) {
    const b = this.add.particles(x, y, 'ember', {
      speed: { min: 30, max: 90 }, lifespan: 360, scale: { start: 1.2, end: 0 },
      quantity: 10, blendMode: 'ADD', tint,
    }).setDepth(1100);
    this.time.delayedCall(380, () => b.destroy());
  }

  // a quick, bounded camera shake (locked gate thud, forge clang, deploy)
  screenShake(intensity = 0.006, ms = 220) {
    if (this.reducedMotion) return; // accessibility
    this.cameras.main.shake(ms, intensity);
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

  // a centered first-person card (revelation, portal reveal, closing) — DOM
  showCard(text, { duration = 4200, variant = 'body' } = {}) {
    window.dispatchEvent(new CustomEvent('relentless:card', { detail: { body: text, variant } }));
    this.time.delayedCall(duration, () => window.dispatchEvent(new Event('relentless:card-hide')));
  }

  showRevelation(text) {
    // the one spoken-metaphor beat (§8.3) — warm, held longer, earned
    this.showCard(text, { duration: 6000, variant: 'revelation' });
  }

  // a visible locked barrier at the exit — solid, so you physically can't leave
  // until the objective is done. Dissolves on completion.
  buildExitBarrier(x, y) {
    this.exitBarrier = this.add.image(x, y, 'barrier').setOrigin(0.5, 0.7).setDepth(y + 1);
    this.exitBarrier.postFX?.addGlow(0xff5a5a, 4, 0, false, 0.1, 8);
    this.tweens.add({ targets: this.exitBarrier, alpha: { from: 0.78, to: 1 }, duration: 1100, yoyo: true, repeat: -1 });
    this.exitBarrierBody = this.blockers.create(x, y, 'barrier').setVisible(false);
    this.exitBarrierBody.body.setSize(30, 22).setOffset(5, 22);
    this.exitBarrierLabel = this.add
      .text(x, y - 46, 'LOCKED · finish the work', {
        fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#ff9a9a',
        backgroundColor: '#05060acc', padding: { x: 5, y: 2 },
      })
      .setOrigin(0.5, 1).setDepth(1500);
  }

  dissolveExitBarrier() {
    if (this.exitBarrierBody) { this.exitBarrierBody.destroy(); this.exitBarrierBody = null; }
    [this.exitBarrier, this.exitBarrierLabel].forEach((o) => o && this.tweens.add({
      targets: o, alpha: 0, scaleX: 1.3, scaleY: 1.3, duration: 600, ease: 'Back.easeIn',
      onComplete: () => o.destroy(),
    }));
    this.exitBarrier = null;
    this.exitBarrierLabel = null;
  }

  // the exit appears once the objective is complete (grind path / objective gate)
  revealPortal() {
    if (!this.portalHidden || !this.portal) return;
    this.portalHidden = false;
    this.dissolveExitBarrier();
    this.tweens.add({ targets: this.portal, alpha: { from: 0, to: 1 }, duration: 900 });
    this.addPortalLabel();
    this.portalZone = new Phaser.Geom.Circle(this.portalPos.x, this.portalPos.y, 26);
    // objective-gated levels announce the unlock; legacy zones keep their reveal line
    if (this.zone.gatedByObjective) {
      ignite();
      window.dispatchEvent(new CustomEvent('relentless:beat', { detail: { text: 'OBJECTIVE COMPLETE — the way forward opens.' } }));
      this.updateObjective();
    } else if (this.zone.portalRevealLine) {
      this.showCard(this.zone.portalRevealLine);
    }
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
    // ENDURE: finishing a rejection sign knocks the flame back a beat (the
    // demoralization). Clamped by TorchResource; moving on recovers it.
    if (this.zone.torchDecay && it.type === 'sign') this.torch?.pulse(20);
    this.markGuideDone(it);

    // SEND (Horizon): closing the contact terminal IS sending your message — the end
    if (this.zone.objective?.kind === 'send' && it.type === 'screen' && it.payload === 'contact' && !this.sent) {
      this.sent = true;
      this.fireBeat('sent');
      this.updateObjective();
      this.time.delayedCall(700, () => this.finishFinalZone());
    }
  }

  updateProgress() {
    if (!this.progressText) return;
    // scripted levels show progress through the authored sequence; else read-count
    const total = this.zone.script ? this.zone.script.length : this.guideTargets.length;
    const done = Math.min(this.zone.script ? this.scriptIndex : this.guideDone.size, total);
    this.progressText.setText(total ? '●'.repeat(done) + '○'.repeat(total - done) : '');
  }

  // ---------------------------------------------------------------------------
  // GUIDE — maximal wayfinding (beacon the next beat, narrate the objective)
  // ---------------------------------------------------------------------------
  buildGuide() {
    // the press-E beats worth leading the player to (signs, screens, npcs, plus
    // any "guided" stations like workbenches/data nodes that act as story beats)
    this.guideTargets = this.interactables.filter((it) =>
      it.type === 'sign' || it.type === 'screen' || it.type === 'npc'
      || (it.type === 'station' && GUIDED_STATION_KINDS.has(it.kind)),
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
    if (this.zone.script) { this.runScript(); return; }
    this.updateProgress();
    this.updateObjective(); // keep the goal banner in sync as steps complete
    this.refreshGuideLegacy(); // zones without an authored sequence
  }

  // ---------------------------------------------------------------------------
  // SCRIPTED GUIDE — walk an authored beat sequence in strict story order, so
  // signs and minigames flow together. The guide directs; the player does. The
  // exit only opens when the LAST beat is done (= objective complete).
  // ---------------------------------------------------------------------------
  runScript() {
    const script = this.zone.script;
    // skip past any beats already satisfied
    while (this.scriptIndex < script.length && this.beatDone(script[this.scriptIndex])) {
      this.scriptIndex += 1;
    }
    this.updateProgress();
    this.updateObjective(); // banner + gate now reflect the advanced position

    // sequence finished → objective complete (the banner + barrier react via
    // updateObjective). Lead the curious to secrets, then the open exit.
    if (this.scriptIndex >= script.length) {
      this.guideCurrent = null;
      if (this.portalHidden) return; // updateObjective reveals it on completion
      const secret = this.nearestUnfoundSecret();
      if (secret) {
        this.guideCurrent = secret;
        this.guide.show({ x: secret.sprite.x, y: secret.sprite.y },
          "There's something here you weren't asked to find.", { color: 0xffcf3a, chevron: '#ffe9a8' });
        return;
      }
      if (this.portal) {
        this.guide.show({ x: this.portal.x, y: this.portal.y }, 'The way out is open. →');
      } else {
        this.guide.hide();
        this.finishFinalZone();
      }
      return;
    }

    // beacon the current beat
    const beat = script[this.scriptIndex];
    const target = this.beatTarget(beat);
    if (!target) { this.guide.hide(); return; }
    this.guideCurrent = target;
    const thoughts = this.zone.thoughts || [];
    const thought = beat.thought || thoughts[Math.min(this.scriptIndex, thoughts.length - 1)] || 'Follow the light.';
    const color = beat.t === 'burnloop' ? 0xff7b00 : 0x00d9f5;
    const x = target.sprite ? target.sprite.x : target.x;
    const y = target.sprite ? target.sprite.y : target.y;
    this.guide.show({ x, y }, thought, { color });
  }

  // is this beat satisfied?
  beatDone(beat) {
    switch (beat.t) {
      case 'sign': case 'screen': case 'npc': {
        const it = this.scriptInteractable(beat);
        return it ? this.guideDone.has(it) : true;
      }
      case 'gather': return (this.buildCount || 0) >= (beat.need ?? this.buildTotal);
      case 'burnloop': return (this.burnedCount || 0) >= this.burnTotal;
      case 'ship': return (this.shippedCount || 0) >= (beat.need ?? this.shipTotal);
      case 'wire': return (this.connectedCount || 0) >= (beat.need ?? this.deployTotal);
      case 'act': return this.actDone(beat.kind);
      default: return true;
    }
  }

  actDone(kind) {
    return ({ anvil: this.forged, pitch: this.pitched, lever: this.deployed, present: this.presented })[kind] ?? true;
  }

  // where to beacon for the current beat
  beatTarget(beat) {
    switch (beat.t) {
      case 'sign': case 'screen': case 'npc': {
        const it = this.scriptInteractable(beat);
        return it && it.sprite.active ? it : null;
      }
      case 'gather': return this.nearestOfKind('component');
      case 'burnloop': return this.carriedLetter ? this.campfireRec : this.nearestOfKind('letter');
      case 'ship': return this.nearestOfKind('workbench');
      case 'wire': return this.nearestOfKind('dataNode');
      case 'act': return this.stationOfKind(beat.kind);
      default: return null;
    }
  }

  scriptInteractable(beat) {
    const byType = (t) => this.interactables.filter((it) => it.type === t);
    if (beat.t === 'sign') return byType('sign')[beat.i ?? 0];
    if (beat.t === 'npc') return byType('npc')[beat.i ?? 0];
    if (beat.t === 'screen') {
      return beat.id
        ? this.interactables.find((it) => it.type === 'screen' && it.payload === beat.id)
        : byType('screen')[beat.i ?? 0];
    }
    return null;
  }

  nearestOfKind(kind) {
    const open = (this.stations || []).filter((s) => s.kind === kind && s.sprite.active && !s.done && !s.picked);
    if (!open.length) return this.stationOfKind(kind);
    let near = open[0];
    let best = Infinity;
    open.forEach((s) => {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, s.sprite.x, s.sprite.y);
      if (d < best) { best = d; near = s; }
    });
    return near;
  }

  stationOfKind(kind) {
    return (this.stations || []).find((s) => s.kind === kind) || null;
  }

  // the live sublabel shown in the objective banner for the current beat
  beatLabel(beat) {
    if (!beat) return '';
    switch (beat.t) {
      case 'gather': return `${beat.label || 'Collect'} · ${this.buildCount || 0}/${beat.need ?? this.buildTotal}`;
      case 'burnloop': return `${beat.label || 'Burn the rejections'} · ${this.burnedCount || 0}/${this.burnTotal}`;
      case 'ship': return `${beat.label || 'Ship the work'} · ${Math.min(this.shippedCount || 0, beat.need ?? this.shipTotal)}/${beat.need ?? this.shipTotal}`;
      case 'wire': return `${beat.label || 'Wire the sources'} · ${this.connectedCount || 0}/${beat.need ?? this.deployTotal}`;
      default: return beat.label || '';
    }
  }

  // ---------------------------------------------------------------------------
  // LEGACY GUIDE — nearest-target beaconing (zones without an authored script)
  // ---------------------------------------------------------------------------
  refreshGuideLegacy() {
    const thoughts = this.zone.thoughts || [];
    const objComplete = this.zone.gatedByObjective && this._objectiveComplete;
    const remaining = objComplete ? [] : this.guideTargets.filter(
      (it) => it.sprite.active && !this.guideDone.has(it) && this.stationReady(it),
    );
    if (remaining.length) {
      let near = remaining[0];
      let best = Infinity;
      remaining.forEach((it) => {
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, it.sprite.x, it.sprite.y);
        if (d < best) { best = d; near = it; }
      });
      this.guideCurrent = near;
      const thought = thoughts.length ? thoughts[Math.min(this.guideDone.size, thoughts.length - 1)] : 'Follow the light.';
      this.guide.show({ x: near.sprite.x, y: near.sprite.y }, thought);
      return;
    }
    this.guideCurrent = null;
    if (this.portalHidden && !this.zone.gatedByObjective) { this.revealPortal(); return; }
    const secret = this.nearestUnfoundSecret();
    if (secret) {
      this.guideCurrent = secret;
      this.guide.show({ x: secret.sprite.x, y: secret.sprite.y },
        "There's something here you weren't asked to find.", { color: 0xffcf3a, chevron: '#ffe9a8' });
      return;
    }
    const lastThought = thoughts.length ? thoughts[thoughts.length - 1] : '';
    if (this.portal) this.guide.show({ x: this.portal.x, y: this.portal.y }, lastThought || 'Follow the light →');
    else { this.guide.hide(); this.finishFinalZone(); }
  }

  finishFinalZone() {
    if (this._zoneFinished) return;
    this._zoneFinished = true;
    GameState.unlockAchievement(this.zone.achievement);
    if (this.zone.closingCard) {
      this.time.delayedCall(900, () => this.showCard(this.zone.closingCard, { duration: 7000 }));
    }
  }

  // carry-burn beacon: lead to the fire while carrying, else to the nearest letter
  beaconBurn() {
    if (this.carriedLetter && this.campfireRec) {
      this.guideCurrent = this.campfireRec;
      this.guide.show(
        { x: this.campfireRec.sprite.x, y: this.campfireRec.sprite.y },
        'Take it to the fire. Burn it — turn it into light.',
        { color: 0xff7b00, chevron: '#ffd27a' },
      );
      return;
    }
    const letters = (this.stations || []).filter((s) => s.kind === 'letter' && s.sprite.active && !s.done && !s.picked);
    if (!letters.length) { this.guide.hide(); return; }
    let near = letters[0];
    let best = Infinity;
    letters.forEach((s) => {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, s.sprite.x, s.sprite.y);
      if (d < best) { best = d; near = s; }
    });
    this.guideCurrent = near;
    this.guide.show({ x: near.sprite.x, y: near.sprite.y }, 'Pick up a rejection. Don\'t let it just sit in the dark.');
  }

  // nearest still-available secret station (un-collected relic / un-fixed vuln)
  nearestUnfoundSecret() {
    const open = (this.stations || []).filter((s) => s.secret && s.sprite.active && !s.done);
    if (!open.length) return null;
    let near = open[0];
    let best = Infinity;
    open.forEach((s) => {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, s.sprite.x, s.sprite.y);
      if (d < best) { best = d; near = s; }
    });
    return near;
  }

  markGuideDone(it) {
    if (!it) return;
    if (this.guideDone.has(it)) return;
    this.guideDone.add(it); // scripted beats read interactables directly, so track all
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
      // clear any lingering DOM narration when the zone tears down
      window.dispatchEvent(new Event('relentless:card-hide'));
      window.dispatchEvent(new Event('relentless:objective-hide'));
      window.dispatchEvent(new Event('relentless:objbanner-hide'));
      this.fog?.destroy();
      this.light?.destroy();
      this.fog = null;
      this._miniGame = null;
      stopZoneAmbient();
      stopCrackle();
    });
  }

  // ---------------------------------------------------------------------------
  // INTRO
  // ---------------------------------------------------------------------------
  // Entry sequence: cinematic "LEVEL X — THE NAME" card → 2nd-person briefing
  // (drops you into the phase + frames the mission) → unfreeze + objective banner.
  // Any key skips straight to gameplay.
  playIntro(z) {
    const levelNum = Math.max(1, ZONES.findIndex((zz) => zz.key === z.key) + 1);
    const accent = this.accentHex(z);
    this._introDone = false;
    this._introTimers = [];

    const endIntro = () => {
      if (this._introDone) return;
      this._introDone = true;
      this._introTimers.forEach((t) => t && t.remove());
      this.input.keyboard.off('keydown', skip);
      window.dispatchEvent(new Event('relentless:card-hide'));
      this.time.delayedCall(300, () => {
        this.frozen = false;
        this.updateObjective();  // show the goal banner
        this.refreshGuide();     // light the first beacon + inner-voice thought
      });
    };
    // ONLY a deliberate key skips — movement keys (arrows/WASD) must not, or you'd
    // blow past the level context just by starting to walk. Ignore an early stray
    // press too, so a quick tap can't nuke the intro before you've read anything.
    const startedAt = this.time.now;
    const skip = (e) => {
      const k = e?.key;
      if (k !== ' ' && k !== 'Enter' && k !== 'e' && k !== 'E') return;
      if (this.time.now - startedAt < 900) return;
      endIntro();
    };
    this.input.keyboard.on('keydown', skip);

    // 1) cinematic LEVEL card — with the POSITION stamp (the career rung)
    window.dispatchEvent(new CustomEvent('relentless:card', {
      detail: { variant: 'level', level: levelNum, name: z.name, sub: z.intro?.[1] ?? z.subtitle ?? '', accent, position: z.position ?? '' },
    }));

    // 2) after it plays, the briefing (with the growing recap), then unfreeze
    this._introTimers.push(this.time.delayedCall(3600, () => {
      window.dispatchEvent(new Event('relentless:card-hide'));
      if (z.briefing) {
        this._introTimers.push(this.time.delayedCall(300, () => {
          window.dispatchEvent(new CustomEvent('relentless:card', {
            detail: { body: z.briefing, variant: 'briefing', recap: z.recap ?? '', hint: 'Space to skip →' },
          }));
          this._introTimers.push(this.time.delayedCall(4600, endIntro));
        }));
      } else {
        this._introTimers.push(this.time.delayedCall(300, endIntro));
      }
    }));
  }

  accentHex(z) {
    const a = z.palette?.accent ?? 0xff7b00;
    return `#${a.toString(16).padStart(6, '0')}`;
  }

  // ---------------------------------------------------------------------------
  // OBJECTIVE — the level goal: drives the banner + gates the exit
  // ---------------------------------------------------------------------------
  updateObjective() {
    const o = this.zone.objective;
    if (!o) { window.dispatchEvent(new Event('relentless:objbanner-hide')); return; }

    let label = o.label;
    let text;
    let complete;
    if (this.zone.script) {
      // the authored sequence is the source of truth: complete = all beats done
      complete = this.scriptIndex >= this.zone.script.length;
      text = complete ? '✓ complete' : this.beatLabel(this.zone.script[this.scriptIndex]);
    } else {
      const st = objectiveState(this);
      label = st.label; text = st.text; complete = st.complete;
    }

    this._objectiveComplete = complete;
    window.dispatchEvent(new CustomEvent('relentless:objbanner', { detail: { label, text, complete } }));
    // the OBJECTIVE is the gate — not "every sign read". Complete it → exit opens.
    if (complete && this.zone.gatedByObjective && this.portalHidden) this.revealPortal();
  }

  // a short 2nd-person situational beat at a named milestone (non-blocking)
  fireBeat(at) {
    if (this._beatsFired?.has(at)) return;
    const beat = (this.zone.beats || []).find((b) => b.at === at);
    if (!beat) return;
    (this._beatsFired ??= new Set()).add(at);
    window.dispatchEvent(new CustomEvent('relentless:beat', { detail: { text: beat.text } }));
  }

  // ---------------------------------------------------------------------------
  // LOOP
  // ---------------------------------------------------------------------------
  update(time) {
    const blocked = this.frozen || this.dialogueOpen || this.transitioning || !!this._miniGame;
    if (blocked) {
      this.player.setVelocity(0, 0);
      this.player.idle();
    } else {
      this.player.update(this.cursors, this.keys);
    }

    const moving = !blocked && (this.player.body.velocity.x !== 0 || this.player.body.velocity.y !== 0);

    this.player.setDepth(this.player.y);
    this.embers.followOffset.x = this.player.flipX ? -7 : 7;
    this.fog?.update(this.player);
    this.torch.update(this.player, moving); // drives + renders the light
    this.guide.update(this.player, time);

    if (this.companion) { // the forged LearnFlow artifact trails the player
      const tx = this.player.x - (this.player.flipX ? -16 : 16);
      const ty = this.player.y - 22 + Math.sin(time / 300) * 3;
      this.companion.x += (tx - this.companion.x) * 0.12;
      this.companion.y += (ty - this.companion.y) * 0.12;
      this.companion.setDepth(this.player.y + 1);
    }

    if (this.carriedSprite) { // a rejection letter held over the player's head
      this.carriedSprite.x += (this.player.x - this.carriedSprite.x) * 0.25;
      this.carriedSprite.y += (this.player.y - 22 - this.carriedSprite.y) * 0.25;
      this.carriedSprite.setDepth(this.player.y + 2);
    }

    if (this.presentRec && !this.reachedBoardroom && !this.presented) { // arrived at the boardroom
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.presentRec.sprite.x, this.presentRec.sprite.y);
      if (d < 72) { this.reachedBoardroom = true; this.updateObjective(); this.fireBeat('boardroom'); }
    }

    if (!this.transitioning && !this._miniGame) {
      this.handleProximity();
      this.handleStations();
      this.handleKeys();
      this.handlePortal();
    }
  }

  // auto-fire proximity stations (meeting doors, ember nodes) + step triggers
  handleStations() {
    if (this.frozen || this.dialogueOpen) return;
    this.proximityStations?.forEach((st) => {
      if (st.fired || !st.sprite.active) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, st.sprite.x, st.sprite.y);
      if (d < st.radius) { st.fired = true; this.onProximityStation?.(st); }
    });
    this.stepStations?.forEach((st) => {
      if (st.fired || !st.sprite.active || !this.stationReady(st)) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, st.sprite.x, st.sprite.y);
      if (d < st.radius) { st.fired = true; this.onStepStation?.(st); }
    });
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
      const verb = near.type === 'screen' ? 'View'
        : near.type === 'npc' ? 'Talk'
        : near.type === 'station' ? (STATION_VERB[near.kind] || 'Use')
        : 'Read';
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
      if (it.payload === 'contact') this.fireBeat('terminal');
      this.frozen = true;
      window.dispatchEvent(new CustomEvent('relentless:screen', { detail: { id: it.payload, zone: this.zone.key } }));
    } else if (it.type === 'station') {
      this.activeInteractable = null; // stations aren't "read" beats; they run now
      runStation(this, it);
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
