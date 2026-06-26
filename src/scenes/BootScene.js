import Phaser from 'phaser';

/**
 * BootScene
 * ---------
 * Generates ALL placeholder art at runtime (no asset files needed) and slices
 * the player canvas into a 3x3 sprite sheet.
 *
 * SWAPPING IN REAL ART LATER:
 *   - Delete the matching `make*` call below and instead `this.load.image(...)`
 *     / `this.load.spritesheet('player', 'player.png', {frameWidth:32, frameHeight:32})`
 *     in preload(). Keep the texture KEYS identical ('player', 'tree0', 'grass', ...)
 *     and the rest of the game won't notice the difference.
 */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create() {
    this.makeGrass();
    this.makeTree('tree0', '#16361f', '#1f4a2b');
    this.makeTree('tree1', '#123018', '#1b4324');
    this.makeRock();
    this.makeSign();
    this.makeGate();
    this.makeMarker();
    this.makeEmber();
    this.makeLight();
    this.makePlayer();

    this.scene.start('forest');
  }

  // --- tiny canvas helper ---------------------------------------------------
  paint(key, w, h, draw) {
    const tex = this.textures.createCanvas(key, w, h);
    draw(tex.getContext(), tex);
    tex.refresh();
    return tex;
  }

  // --- ground ---------------------------------------------------------------
  makeGrass() {
    this.paint('grass', 32, 32, (ctx) => {
      ctx.fillStyle = '#13251a';
      ctx.fillRect(0, 0, 32, 32);
      // subtle deterministic speckle so tiling doesn't look flat
      const dots = [
        [4, 6], [11, 3], [19, 9], [27, 5], [2, 18], [14, 16],
        [22, 21], [29, 25], [7, 27], [17, 29], [25, 13], [9, 12],
      ];
      dots.forEach(([x, y], i) => {
        ctx.fillStyle = i % 2 ? '#183020' : '#0f1f15';
        ctx.fillRect(x, y, 2, 2);
      });
      // a couple of darker blades for texture
      ctx.fillStyle = '#1c3a26';
      ctx.fillRect(6, 22, 1, 4);
      ctx.fillRect(20, 7, 1, 4);
    });
  }

  // --- trees (colliders, drawn taller than their tile for overlap) ----------
  makeTree(key, dark, light) {
    this.paint(key, 32, 44, (ctx) => {
      // trunk
      ctx.fillStyle = '#3a2616';
      ctx.fillRect(14, 30, 4, 12);
      ctx.fillStyle = '#2a1a0f';
      ctx.fillRect(14, 30, 1, 12);
      // canopy (layered blobs)
      ctx.fillStyle = dark;
      ctx.fillRect(4, 8, 24, 22);
      ctx.fillRect(2, 14, 28, 12);
      ctx.fillStyle = light;
      ctx.fillRect(7, 6, 16, 14);
      ctx.fillRect(6, 11, 20, 10);
      // highlight + shadow
      ctx.fillStyle = '#27562f';
      ctx.fillRect(10, 8, 6, 4);
      ctx.fillStyle = '#0c2014';
      ctx.fillRect(5, 24, 22, 4);
    });
  }

  makeRock() {
    this.paint('rock', 32, 26, (ctx) => {
      ctx.fillStyle = '#3a3d49';
      ctx.fillRect(4, 8, 24, 16);
      ctx.fillStyle = '#4a4e5c';
      ctx.fillRect(7, 6, 16, 10);
      ctx.fillStyle = '#2a2c36';
      ctx.fillRect(6, 19, 22, 5);
      ctx.fillStyle = '#565b6b';
      ctx.fillRect(10, 8, 6, 3);
    });
  }

  makeSign() {
    this.paint('sign', 32, 32, (ctx) => {
      // post
      ctx.fillStyle = '#3a2616';
      ctx.fillRect(15, 16, 3, 14);
      // board
      ctx.fillStyle = '#5a3d22';
      ctx.fillRect(6, 8, 20, 12);
      ctx.fillStyle = '#6e4d2c';
      ctx.fillRect(7, 9, 18, 4);
      ctx.fillStyle = '#3a2616';
      ctx.fillRect(6, 8, 20, 1);
      ctx.fillRect(6, 19, 20, 1);
      // faint "text" scratches
      ctx.fillStyle = '#2c1d10';
      ctx.fillRect(9, 12, 14, 1);
      ctx.fillRect(9, 15, 10, 1);
    });
  }

  makeGate() {
    this.paint('gate', 32, 40, (ctx) => {
      // stone pillars
      ctx.fillStyle = '#41454f';
      ctx.fillRect(0, 6, 6, 34);
      ctx.fillRect(26, 6, 6, 34);
      // bars
      ctx.fillStyle = '#23252e';
      for (let x = 8; x < 26; x += 5) ctx.fillRect(x, 10, 2, 30);
      ctx.fillRect(6, 12, 20, 2);
      ctx.fillRect(6, 34, 20, 2);
      // gold lock
      ctx.fillStyle = '#ffcf3a';
      ctx.fillRect(14, 22, 5, 5);
      ctx.fillStyle = '#b9920f';
      ctx.fillRect(15, 19, 3, 3);
    });
  }

  makeMarker() {
    // a glowing waypoint torch — marks the hidden GRIND path
    this.paint('marker', 24, 40, (ctx) => {
      ctx.fillStyle = '#3a2616';
      ctx.fillRect(10, 18, 4, 20);
      ctx.fillStyle = '#ff7b00';
      ctx.fillRect(8, 8, 8, 10);
      ctx.fillStyle = '#ffb347';
      ctx.fillRect(9, 5, 6, 9);
      ctx.fillStyle = '#fff1c2';
      ctx.fillRect(10, 6, 3, 4);
    });
  }

  makeEmber() {
    this.paint('ember', 8, 8, (ctx) => {
      const g = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
      g.addColorStop(0, 'rgba(255,224,160,1)');
      g.addColorStop(0.5, 'rgba(255,140,40,0.8)');
      g.addColorStop(1, 'rgba(255,80,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 8, 8);
    });
  }

  // --- the torch light brush (radial gradient, used to erase the darkness) --
  makeLight() {
    this.paint('light', 256, 256, (ctx) => {
      const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0.0, 'rgba(255,255,255,1)');
      g.addColorStop(0.45, 'rgba(255,255,255,0.92)');
      g.addColorStop(0.72, 'rgba(255,255,255,0.45)');
      g.addColorStop(0.9, 'rgba(255,255,255,0.12)');
      g.addColorStop(1.0, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
    });
  }

  // --- player sprite sheet (3 cols x 3 rows of 32x32) -----------------------
  makePlayer() {
    const tex = this.paint('player', 96, 96, (ctx) => {
      const rows = ['down', 'up', 'side'];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          this.drawPerson(ctx, c * 32, r * 32, rows[r], c);
        }
      }
    });

    // slice the canvas into numbered frames 0..8 so generateFrameNumbers works
    let i = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        tex.add(i++, 0, c * 32, r * 32, 32, 32);
      }
    }
  }

  /**
   * One 32x32 character frame.
   * dir: 'down' | 'up' | 'side' (side faces right; flip in-engine for left)
   * frame: 0 = step A, 1 = neutral, 2 = step B
   */
  drawPerson(ctx, ox, oy, dir, frame) {
    const P = (x, y, w, h, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(ox + x, oy + y, w, h);
    };

    const skin = '#e8b48a';
    const skinDk = '#c98f63';
    const hair = '#241a2e';
    const hood = '#6b3fa0'; // brand violet
    const hoodDk = '#4f2c86';
    const pants = '#222238';
    const boot = '#13131d';
    const stick = '#6e4423';
    const flame = '#ff7b00';
    const flameHot = '#ffd27a';

    // --- legs (animated) ---
    const aDown = frame === 0 ? 1 : 0;
    const bDown = frame === 2 ? 1 : 0;
    P(12, 25, 4, 4 + aDown, pants);
    P(16, 25, 4, 4 + bDown, pants);
    P(12, 28 + aDown, 4, 1, boot);
    P(16, 28 + bDown, 4, 1, boot);

    // --- body / hood ---
    P(9, 14, 14, 12, hood);
    P(9, 22, 14, 4, hoodDk); // lower shading
    P(8, 15, 2, 8, hoodDk); // left arm
    P(22, 15, 2, 8, hoodDk); // right arm

    // --- head ---
    if (dir === 'up') {
      // back of head: all hair
      P(10, 4, 12, 11, hair);
    } else if (dir === 'side') {
      P(10, 4, 12, 4, hair); // top hair
      P(10, 4, 5, 10, hair); // back hair
      P(15, 7, 6, 7, skin); // face (front)
      P(15, 13, 6, 1, skinDk);
      P(18, 9, 2, 2, hair); // eye
    } else {
      // down: face forward
      P(10, 4, 12, 4, hair); // hair top
      P(10, 4, 2, 9, hair); // side hair
      P(20, 4, 2, 9, hair); // side hair
      P(12, 6, 8, 8, skin); // face
      P(12, 13, 8, 1, skinDk);
      P(13, 9, 2, 2, hair); // left eye
      P(17, 9, 2, 2, hair); // right eye
    }

    // --- the torch (always on the figure's right; flips with the sprite) ---
    P(24, 12, 2, 11, stick);
    const flick = frame === 1 ? 0 : 1; // tiny per-frame flame wobble
    P(22, 7 - flick, 6, 6, flame);
    P(23, 4 - flick, 4, 5, flameHot);
    P(24, 5 - flick, 2, 2, '#fff6d8');
  }
}
