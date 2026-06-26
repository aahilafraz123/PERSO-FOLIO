import Phaser from 'phaser';
import { TILE, VIEW_W, VIEW_H } from '../config/constants.js';
import Player from '../entities/Player.js';
import Torch from '../systems/Torch.js';
import DialogueBox from '../ui/DialogueBox.js';

const MAP_W = 40; // tiles
const MAP_H = 30;
const WORLD_W = MAP_W * TILE;
const WORLD_H = MAP_H * TILE;

/**
 * ForestScene — "The Wilderness."
 * Zone 1 of RELENTLESS. The darkest the game ever gets: 0 interviews, 3 rounds,
 * no light but the one you carry.
 */
export default class ForestScene extends Phaser.Scene {
  constructor() {
    super('forest');
  }

  create() {
    this.uiBlocked = false;

    this.buildWorld();
    this.spawnPlayer();
    this.setupCamera();
    this.setupTorch();
    this.setupInteractables();
    this.setupInput();
    this.setupHud();
    this.playIntro();
  }

  // ---------------------------------------------------------------------------
  // WORLD
  // ---------------------------------------------------------------------------
  buildWorld() {
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

    // ground
    this.add
      .tileSprite(0, 0, WORLD_W, WORLD_H, 'grass')
      .setOrigin(0, 0)
      .setDepth(0);

    // Walkable tiles: a set of clearings + corridors carved through the forest.
    // Everything else (inside the border) becomes a tree wall.
    const open = new Set();
    const rect = (x0, y0, x1, y1) => {
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) open.add(`${x},${y}`);
    };

    // spawn clearing (center)
    rect(15, 12, 25, 19);
    // north corridor -> OFFER gate
    rect(19, 4, 21, 12);
    rect(16, 4, 24, 6); // gate clearing
    // east corridor (the rejection gauntlet) -> east clearing
    rect(25, 14, 36, 16);
    rect(32, 11, 37, 19);
    // hidden south-west branch -> GRIND clearing (narrow mouth = easy to miss)
    rect(13, 17, 14, 18); // mouth
    rect(8, 18, 14, 20);
    rect(4, 20, 9, 27);
    rect(3, 23, 9, 27); // GRIND clearing

    this.openSet = open;
    this.solids = this.physics.add.staticGroup();

    // tree wall on every non-open interior tile
    for (let ty = 1; ty < MAP_H - 1; ty++) {
      for (let tx = 1; tx < MAP_W - 1; tx++) {
        if (open.has(`${tx},${ty}`)) continue;
        this.addTree(tx, ty);
      }
    }
    // solid border
    for (let tx = 0; tx < MAP_W; tx++) {
      this.addTree(tx, 0);
      this.addTree(tx, MAP_H - 1);
    }
    for (let ty = 0; ty < MAP_H; ty++) {
      this.addTree(0, ty);
      this.addTree(MAP_W - 1, ty);
    }

    // a few rocks for texture inside clearings (non-blocking-feel decor that
    // still collides, placed so they don't wall off a corridor)
    [[17, 18], [23, 13], [34, 18], [5, 26]].forEach(([tx, ty]) =>
      this.addRock(tx, ty),
    );
  }

  addTree(tx, ty) {
    const key = (tx * 3 + ty * 7) % 2 ? 'tree0' : 'tree1';
    const px = tx * TILE + TILE / 2;
    const py = ty * TILE + TILE / 2;
    const tree = this.solids
      .create(px, py + 6, key)
      .setOrigin(0.5, 0.75)
      .setFlipX((tx + ty) % 3 === 0);
    tree.setDepth(py + 6);
    // collider = the trunk footprint, not the whole canopy
    tree.body.setSize(20, 16).setOffset(6, 24);
    tree.refreshBody();
    // refreshBody resets size on static images in some versions — re-apply:
    tree.body.setSize(20, 16);
    tree.body.setOffset(6, 22);
    return tree;
  }

  addRock(tx, ty) {
    const px = tx * TILE + TILE / 2;
    const py = ty * TILE + TILE / 2;
    const rock = this.solids.create(px, py, 'rock');
    rock.setDepth(py);
    rock.body.setSize(22, 12).setOffset(5, 12);
    return rock;
  }

  // ---------------------------------------------------------------------------
  // PLAYER + CAMERA
  // ---------------------------------------------------------------------------
  spawnPlayer() {
    this.player = new Player(this, 20 * TILE, 15 * TILE);
    this.physics.add.collider(this.player, this.solids);

    // warm ember trail rising from the torch
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
      .setDepth(1100); // above darkness so they glow
    this.embers.startFollow(this.player, 7, -8);
  }

  setupCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_W, WORLD_H);
    cam.setZoom(1.75);
    cam.startFollow(this.player, true, 0.1, 0.1);
    cam.setRoundPixels(true);
  }

  setupTorch() {
    this.torch = new Torch(this, this.player, { baseRadius: 92 });
  }

  // ---------------------------------------------------------------------------
  // INTERACTABLES — signs, gate, GRIND
  // ---------------------------------------------------------------------------
  setupInteractables() {
    this.dialog = new DialogueBox(this);
    this.card = new DialogueBox(this, { centered: true });

    const SIGNS = [
      { tx: 26, ty: 15, text: '"We\'ve decided to move forward with other candidates."' },
      { tx: 30, ty: 15, text: '"We\'ll keep your resume on file for future openings."' },
      { tx: 34, ty: 13, text: '"This position has been closed."' },
      { tx: 20, ty: 8, text: 'Round A. Round B. Round C.\nZero interviews. Keep walking.' },
    ];

    this.signs = SIGNS.map(({ tx, ty, text }) => {
      const px = tx * TILE + TILE / 2;
      const py = ty * TILE + TILE / 2;
      const img = this.physics.add.staticImage(px, py, 'sign');
      img.setDepth(py);
      img.body.setSize(20, 10).setOffset(6, 18);
      img.dialog = text;
      return img;
    });
    this.physics.add.collider(this.player, this.signs);

    // "[E] read" prompt that floats above the nearest sign
    this.prompt = this.add
      .text(0, 0, '[E] read', {
        fontFamily: 'Courier New, monospace',
        fontSize: '13px',
        color: '#00d9f5',
        backgroundColor: '#05060acc',
        padding: { x: 5, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(1500)
      .setVisible(false);

    // OFFER gate — locked. Blocks the north exit; the path beyond waits for v2.
    const gx = 20 * TILE + TILE / 2;
    const gy = 4 * TILE;
    this.gate = this.physics.add.staticImage(gx, gy, 'gate');
    this.gate.setDepth(gy + 20);
    this.gate.body.setSize(34, 14).setOffset(-1, 16);
    this.gate.dialog = 'THE OFFER — locked.\nNothing here is given. Come back when you\'ve earned it.';
    this.signs.push(this.gate); // readable like a sign
    this.physics.add.collider(this.player, this.gate);

    // GRIND marker — the hidden side path's payoff.
    const mx = 5 * TILE + TILE / 2;
    const my = 25 * TILE;
    this.add
      .image(mx, my, 'marker')
      .setOrigin(0.5, 0.85)
      .setDepth(my + 1100); // glows above darkness like a beacon
    this.add
      .text(mx, my - 42, 'GRIND', {
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        color: '#ffcf3a',
      })
      .setOrigin(0.5, 1)
      .setDepth(1500);
    this.grindRect = new Phaser.Geom.Rectangle(mx - 40, my - 40, 80, 70);
    this.grindWasIn = false;
  }

  // ---------------------------------------------------------------------------
  // INPUT
  // ---------------------------------------------------------------------------
  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,E,SPACE,ESC');
  }

  interactJustDown() {
    return (
      Phaser.Input.Keyboard.JustDown(this.keys.E) ||
      Phaser.Input.Keyboard.JustDown(this.keys.SPACE)
    );
  }

  // ---------------------------------------------------------------------------
  // HUD + INTRO
  // ---------------------------------------------------------------------------
  setupHud() {
    this.add
      .text(14, 12, 'CHAPTER I — THE WILDERNESS', {
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        color: '#9aa0bd',
      })
      .setScrollFactor(0)
      .setDepth(1800)
      .setShadow(0, 2, '#000', 4);

    this.add
      .text(14, VIEW_H - 22, 'ARROWS / WASD move   ·   E interact', {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        color: '#5a607c',
      })
      .setScrollFactor(0)
      .setDepth(1800);
  }

  playIntro() {
    const lines = [
      'THE WILDERNESS',
      '0 interviews. 3 rounds. No light but the one you carry.',
    ];
    const title = this.add
      .text(VIEW_W / 2, VIEW_H / 2 - 14, lines[0], {
        fontFamily: 'Courier New, monospace',
        fontSize: '34px',
        color: '#f0f0f5',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2100)
      .setAlpha(0)
      .setShadow(0, 3, '#000', 6);

    const sub = this.add
      .text(VIEW_W / 2, VIEW_H / 2 + 26, lines[1], {
        fontFamily: 'Courier New, monospace',
        fontSize: '15px',
        color: '#8a90ad',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2100)
      .setAlpha(0);

    this.uiBlocked = true;
    this.tweens.add({ targets: [title, sub], alpha: 1, duration: 900 });
    this.tweens.add({
      targets: [title, sub],
      alpha: 0,
      delay: 2600,
      duration: 900,
      onComplete: () => {
        title.destroy();
        sub.destroy();
        this.uiBlocked = false;
      },
    });
  }

  // ---------------------------------------------------------------------------
  // LOOP
  // ---------------------------------------------------------------------------
  update(time) {
    const dialogOpen = this.dialog.open || this.card.open;
    const frozen = dialogOpen || this.uiBlocked;

    if (frozen) {
      this.player.setVelocity(0, 0);
      this.player.anims && this.player.play(`idle-${this.faceAnim()}`, true);
    } else {
      this.player.update(this.cursors, this.keys);
    }

    this.player.setDepth(this.player.y);
    this.embers.followOffset.x = this.player.flipX ? -7 : 7;
    this.torch.update(time);

    this.handleSigns();
    this.handleGrind();
    this.handleKeys();
  }

  faceAnim() {
    return this.player.facing === 'left' || this.player.facing === 'right'
      ? 'side'
      : this.player.facing;
  }

  handleSigns() {
    if (this.dialog.open || this.card.open) {
      this.prompt.setVisible(false);
      return;
    }
    let near = null;
    let best = 52;
    this.signs.forEach((s) => {
      const d = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        s.x,
        s.y,
      );
      if (d < best) {
        best = d;
        near = s;
      }
    });
    this.nearSign = near;
    if (near) {
      this.prompt.setPosition(near.x, near.y - 20).setVisible(true);
    } else {
      this.prompt.setVisible(false);
    }
  }

  handleGrind() {
    const inZone = Phaser.Geom.Rectangle.ContainsPoint(
      this.grindRect,
      new Phaser.Geom.Point(this.player.x, this.player.y),
    );
    if (inZone && !this.grindWasIn && !this.card.open && !this.dialog.open) {
      this.card.show('TO BE CONTINUED...\n\nThe GRIND begins in Chapter II.\nThis is where everything changed.');
    }
    this.grindWasIn = inZone;
  }

  handleKeys() {
    const interact = this.interactJustDown();
    const esc = Phaser.Input.Keyboard.JustDown(this.keys.ESC);

    if (this.card.open) {
      if (interact || esc) {
        if (!this.card.advance()) this.card.hide();
      }
      return;
    }

    if (this.dialog.open) {
      if (interact) {
        if (!this.dialog.advance()) this.dialog.hide();
      } else if (esc) {
        this.dialog.hide();
      }
      return;
    }

    if (interact && this.nearSign && !this.uiBlocked) {
      this.dialog.show(this.nearSign.dialog);
    }
  }
}
