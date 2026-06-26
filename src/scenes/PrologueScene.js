import Phaser from 'phaser';
import { TILE, VIEW_W, VIEW_H } from '../config/constants.js';
import Player from '../entities/Player.js';
import LightSystem from '../systems/LightSystem.js';
import * as Audio from '../systems/audio.js';

/**
 * PrologueScene — "The Room" (the before).
 *
 * The game does NOT open in the dark. It opens in a fake, given light — an
 * ordinary lit room — and that light gets taken. Losing it is why you pick up
 * the torch. Hybrid staging (per build decision):
 *   1. COLD OPEN  — black title cards: "Everything here is true." (skippable)
 *   2. ROOM       — watched: the kid fires applications into silence, the
 *                   Applications counter climbs, Interviews stays at 0.
 *   3. LIGHTS-OUT — the hum dies, the room goes black, the torch ignites.
 *   4. CONTROL    — you take over, walk into the dark → Chapter I.
 *
 * Sound is the narrator (no voice): lamp hum → whooshes → dead silence → thud →
 * torch crackle. Hands off to the Wilderness when you cross the door.
 */
const ROOM_W = 18 * TILE; // 576
const ROOM_H = 13 * TILE; // 416
const TARGET_APPS = 23;

const CARDS = [
  'Everything here is true.',
  'The dark was real. So was the light.',
  'Nobody handed me either one.',
];

export default class PrologueScene extends Phaser.Scene {
  constructor() {
    super('prologue');
  }

  create() {
    Audio.resumeAudio();
    this.phase = 'coldopen';
    this.apps = 0;

    this.buildRoom();
    this.setupCamera();
    this.setupInput();
    this.startColdOpen();
  }

  // ---------------------------------------------------------------------------
  // ROOM
  // ---------------------------------------------------------------------------
  buildRoom() {
    this.physics.world.setBounds(0, 0, ROOM_W, ROOM_H);

    this.add.tileSprite(0, 0, ROOM_W, ROOM_H, 'floor_room').setOrigin(0, 0).setDepth(0);

    // perimeter walls with a 2-tile door gap at bottom-center
    this.walls = this.physics.add.staticGroup();
    const cols = ROOM_W / TILE;
    const rows = ROOM_H / TILE;
    const doorA = 8;
    const doorB = 9;
    for (let tx = 0; tx < cols; tx++) {
      this.addWall(tx, 0);
      if (tx !== doorA && tx !== doorB) this.addWall(tx, rows - 1);
    }
    for (let ty = 1; ty < rows - 1; ty++) {
      this.addWall(0, ty);
      this.addWall(cols - 1, ty);
    }

    // warm ambient wash so the lit room feels cozy (removed at lights-out)
    this.ambient = this.add
      .image(ROOM_W / 2, ROOM_H / 2, 'light')
      .setDepth(2)
      .setScale(ROOM_W / 180)
      .setTint(0xffe9a8)
      .setAlpha(0.16)
      .setBlendMode(Phaser.BlendModes.ADD);

    // props
    this.bed = this.add.image(96, 150, 'bed').setDepth(150);
    this.desk = this.add.image(288, 72, 'desk').setDepth(72);
    this.lampGlow = this.add
      .image(440, 96, 'light')
      .setDepth(60)
      .setScale(1.1)
      .setTint(0xffe9a8)
      .setAlpha(0.5)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.lamp = this.add.image(440, 96, 'lamp').setDepth(96);
    this.laptop = this.add.image(288, 60, 'laptop').setDepth(70);
    this.chair = this.add.image(288, 108, 'chair').setDepth(106);
    this.kid = this.add.image(288, 104, 'kid_sit').setDepth(108);

    // colliders for the big furniture
    this.solids = this.physics.add.staticGroup();
    this.addSolid(288, 78, 60, 18); // desk
    this.addSolid(96, 150, 36, 50); // bed

    // the exit door (lit faintly; becomes the way out)
    this.door = this.add.image((doorA + 1) * TILE, ROOM_H - 14, 'door').setDepth(400);
    this.doorZone = new Phaser.Geom.Circle((doorA + 1) * TILE, ROOM_H - 24, 30);

    // application particles fly up off the laptop
    this.appFx = this.add
      .particles(288, 56, 'ember', {
        speedY: { min: -90, max: -150 },
        speedX: { min: -30, max: 30 },
        lifespan: 700,
        scale: { start: 1.1, end: 0 },
        quantity: 6,
        emitting: false,
        blendMode: 'ADD',
        tint: 0xbfe9ff,
      })
      .setDepth(500);

    // black overlay for the cold open + lights-out
    this.black = this.add
      .rectangle(0, 0, VIEW_W, VIEW_H, 0x000000, 1)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(3000);
  }

  addWall(tx, ty) {
    const w = this.walls.create(tx * TILE + TILE / 2, ty * TILE + TILE / 2, 'wall_room');
    w.setDepth(ty * TILE);
    return w;
  }

  addSolid(x, y, w, h) {
    const s = this.add.rectangle(x, y, w, h);
    this.physics.add.existing(s, true);
    this.solids.add(s);
    return s;
  }

  setupCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, ROOM_W, ROOM_H);
    cam.setZoom(1.35);
    cam.centerOn(ROOM_W / 2, ROOM_H / 2);
    cam.setRoundPixels(true);
  }

  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,E,SPACE,ESC');
    this.anyKey = this.input.keyboard.on('keydown', () => this.onKey());
  }

  // ---------------------------------------------------------------------------
  // 1. COLD OPEN
  // ---------------------------------------------------------------------------
  startColdOpen() {
    this.cardIndex = -1;
    this.card = this.add
      .text(VIEW_W / 2, VIEW_H / 2, '', {
        fontFamily: 'Orbitron, Courier New, monospace',
        fontSize: '26px', color: '#f0f0f5', align: 'center',
        wordWrap: { width: VIEW_W - 140 },
      })
      .setOrigin(0.5).setScrollFactor(0).setDepth(3001).setAlpha(0)
      .setShadow(0, 2, '#000', 6);

    this.skipHint = this.add
      .text(VIEW_W - 18, VIEW_H - 16, 'press any key to skip', {
        fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#5a607c',
      })
      .setOrigin(1, 1).setScrollFactor(0).setDepth(3001);

    this.nextCard();
  }

  nextCard() {
    this.cardIndex += 1;
    if (this.cardIndex >= CARDS.length) {
      this.endColdOpen();
      return;
    }
    this.card.setText(CARDS[this.cardIndex]).setAlpha(0);
    this.tweens.add({ targets: this.card, alpha: 1, duration: 600 });
    this.cardTimer = this.time.delayedCall(2000, () => {
      this.tweens.add({
        targets: this.card, alpha: 0, duration: 500,
        onComplete: () => this.nextCard(),
      });
    });
  }

  endColdOpen() {
    if (this.phase !== 'coldopen') return;
    this.phase = 'room';
    this.card?.destroy();
    this.skipHint?.destroy();
    this.cardTimer?.remove();
    // fade the black away to reveal the lit room
    this.tweens.add({ targets: this.black, alpha: 0, duration: 1000, onComplete: () => this.startRoom() });
  }

  onKey() {
    if (this.phase === 'coldopen') {
      this.cardTimer?.remove();
      this.endColdOpen();
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
      window.dispatchEvent(new Event('relentless:exit'));
    }
  }

  // ---------------------------------------------------------------------------
  // 2. ROOM — applications into silence
  // ---------------------------------------------------------------------------
  startRoom() {
    Audio.startHum();

    this.counter = this.add
      .text(VIEW_W / 2, 26, '', {
        fontFamily: 'JetBrains Mono, monospace', fontSize: '15px', color: '#9aa0bd', align: 'center',
      })
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(1800).setShadow(0, 2, '#000', 4);
    this.updateCounter();

    // fire an application every ~360ms until we hit the target
    this.sendTimer = this.time.addEvent({
      delay: 360,
      repeat: TARGET_APPS - 1,
      callback: () => this.sendApplication(),
    });
  }

  updateCounter() {
    this.counter.setText(`Applications: ${this.apps}     Interviews: 0`);
  }

  sendApplication() {
    this.apps += 1;
    this.updateCounter();
    Audio.whoosh();
    this.appFx.explode(5, 288, 56);
    // tiny bob on the kid as he hits send
    this.tweens.add({ targets: this.kid, y: 102, duration: 90, yoyo: true });

    if (this.apps >= TARGET_APPS) {
      // the silence — let it sit before the lights die
      this.flashInterviewsZero();
      this.time.delayedCall(1900, () => this.lightsOut());
    }
  }

  flashInterviewsZero() {
    // the 0 that never moves — twist the knife with color, not words
    this.counter.setColor('#c98080');
    this.tweens.add({ targets: this.counter, scale: { from: 1.12, to: 1 }, duration: 500, ease: 'Back.easeOut' });
  }

  // ---------------------------------------------------------------------------
  // 3. LIGHTS-OUT — the given light is taken
  // ---------------------------------------------------------------------------
  lightsOut() {
    this.phase = 'lightsout';
    Audio.stopHum(true);
    Audio.lightsOutThud();

    // kill the warm ambient + lamp glow
    this.tweens.add({ targets: [this.ambient, this.lampGlow, this.laptop], alpha: 0, duration: 500 });

    // the kid stands and becomes you — now holding the torch
    this.kid.destroy();
    this.chair.setAlpha(0.6);
    this.player = new Player(this, 288, 120);
    this.player.idle();
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.solids);

    this.embers = this.add
      .particles(0, 0, 'ember', {
        speed: { min: 6, max: 22 }, angle: { min: 250, max: 290 },
        lifespan: { min: 500, max: 900 }, scale: { start: 1, end: 0 },
        alpha: { start: 0.9, end: 0 }, frequency: 80, quantity: 1, blendMode: 'ADD',
      })
      .setDepth(1100);
    this.embers.startFollow(this.player, 7, -8);

    // torch lighting fades IN as the room goes dark
    this.light = new LightSystem(this, { radius: 70 });
    this.light.darknessAlpha = 0;
    this.tweens.add({ targets: this.light, darknessAlpha: 0.985, duration: 1100, ease: 'Sine.easeIn' });
    Audio.startCrackle();
    this.time.delayedCall(500, () => Audio.ignite());

    // light the exit so the only way forward reads clearly
    this.door.postFX?.addGlow(0xffcf3a, 5, 0, false, 0.1, 10);
    this.tweens.add({ targets: this.door, alpha: { from: 0.6, to: 1 }, duration: 1200 });

    this.time.delayedCall(1300, () => this.beginControl());
  }

  // ---------------------------------------------------------------------------
  // 4. CONTROL — walk into the dark
  // ---------------------------------------------------------------------------
  beginControl() {
    this.phase = 'control';
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    this.prompt = this.add
      .text(VIEW_W / 2, VIEW_H - 40, 'ARROWS / WASD — find the way out', {
        fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#8a90ad',
      })
      .setOrigin(0.5).setScrollFactor(0).setDepth(1800);
    this.tweens.add({ targets: this.prompt, alpha: { from: 0, to: 1 }, duration: 600 });
  }

  // ---------------------------------------------------------------------------
  // LOOP
  // ---------------------------------------------------------------------------
  update() {
    if (this.phase === 'control') {
      this.player.update(this.cursors, this.keys);
      this.player.setDepth(this.player.y);
      this.embers.followOffset.x = this.player.flipX ? -7 : 7;
      this.light.update(this.player);

      if (Phaser.Geom.Circle.Contains(this.doorZone, this.player.x, this.player.y)) {
        this.leave();
      }
    } else if (this.light) {
      // during the lights-out fade, keep the torch tracking
      this.player?.idle();
      this.light.update(this.player);
    }
  }

  leave() {
    if (this.leaving) return;
    this.leaving = true;
    Audio.stopCrackle();
    if (this.prompt) this.prompt.setText('');
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('zone', { zoneKey: 'wilderness' });
    });
  }
}
