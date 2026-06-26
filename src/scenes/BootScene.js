import Phaser from 'phaser';
import { ZONES } from '../data/story.js';

/**
 * BootScene
 * ---------
 * Generates ALL placeholder art at runtime (no asset files needed):
 *  - per-zone themed floor + wall tiles (from each zone's palette)
 *  - shared props: shard, monitor, npc, portal, sign, ember
 *  - the player sprite sheet (3x3, sliced into frames 0..8)
 *
 * SWAPPING IN REAL ART LATER (GDD §9, §11.5): replace a make* call with a
 * this.load.* in preload(), keep the texture KEY identical, done. Keys:
 *   floor_<zoneKey>, wall_<zoneKey>, player, shard, monitor, npc, portal,
 *   sign, ember.
 */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create() {
    // per-zone themed tiles
    ZONES.forEach((z) => {
      this.makeFloor(`floor_${z.key}`, z.palette);
      if (z.wallStyle === 'tree') this.makeTreeWall(`wall_${z.key}`, z.palette);
      else this.makeBlockWall(`wall_${z.key}`, z.palette);
    });

    // shared props
    this.makeSign();
    this.makeEmber();
    this.makeShard();
    this.makeMonitor();
    this.makeNpc();
    this.makePortal();
    this.makePlayer();

    // go to the first zone (router passes which via scene data on (re)start)
    const startZone = this.scene.settings.data?.zoneKey || ZONES[0].key;
    this.scene.start('zone', { zoneKey: startZone });
  }

  // --- canvas helper ---------------------------------------------------------
  paint(key, w, h, draw) {
    if (this.textures.exists(key)) this.textures.remove(key);
    const tex = this.textures.createCanvas(key, w, h);
    draw(tex.getContext(), tex);
    tex.refresh();
    return tex;
  }

  hex(n) {
    return `#${n.toString(16).padStart(6, '0')}`;
  }

  // --- floor (themed) --------------------------------------------------------
  makeFloor(key, p) {
    this.paint(key, 32, 32, (ctx) => {
      ctx.fillStyle = this.hex(p.floor);
      ctx.fillRect(0, 0, 32, 32);
      const dots = [
        [4, 6], [11, 3], [19, 9], [27, 5], [2, 18], [14, 16],
        [22, 21], [29, 25], [7, 27], [17, 29], [25, 13], [9, 12],
      ];
      dots.forEach(([x, y], i) => {
        ctx.fillStyle = this.hex(i % 2 ? p.speckA : p.speckB);
        ctx.fillRect(x, y, 2, 2);
      });
    });
  }

  // --- tree wall (zone 1) ----------------------------------------------------
  makeTreeWall(key, p) {
    this.paint(key, 32, 44, (ctx) => {
      ctx.fillStyle = this.hex(p.trunk);
      ctx.fillRect(14, 30, 4, 12);
      ctx.fillStyle = this.hex(p.wallDark);
      ctx.fillRect(4, 8, 24, 22);
      ctx.fillRect(2, 14, 28, 12);
      ctx.fillStyle = this.hex(p.wallLight);
      ctx.fillRect(7, 6, 16, 14);
      ctx.fillRect(6, 11, 20, 10);
      ctx.fillStyle = this.hex(p.wallDark);
      ctx.fillRect(5, 24, 22, 4);
    });
  }

  // --- block wall (zones 2–6) ------------------------------------------------
  makeBlockWall(key, p) {
    this.paint(key, 32, 36, (ctx) => {
      // body
      ctx.fillStyle = this.hex(p.wallDark);
      ctx.fillRect(1, 4, 30, 31);
      // top face highlight
      ctx.fillStyle = this.hex(p.wallLight);
      ctx.fillRect(1, 4, 30, 6);
      // brick seams
      ctx.fillStyle = this.hex(p.trunk);
      ctx.fillRect(1, 18, 30, 1);
      ctx.fillRect(15, 10, 1, 8);
      ctx.fillRect(8, 19, 1, 16);
      ctx.fillRect(23, 19, 1, 16);
      // bottom shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(1, 31, 30, 4);
    });
  }

  makeSign() {
    this.paint('sign', 32, 32, (ctx) => {
      ctx.fillStyle = '#3a2616';
      ctx.fillRect(15, 16, 3, 14);
      ctx.fillStyle = '#5a3d22';
      ctx.fillRect(6, 8, 20, 12);
      ctx.fillStyle = '#6e4d2c';
      ctx.fillRect(7, 9, 18, 4);
      ctx.fillStyle = '#3a2616';
      ctx.fillRect(6, 8, 20, 1);
      ctx.fillRect(6, 19, 20, 1);
      ctx.fillStyle = '#2c1d10';
      ctx.fillRect(9, 12, 14, 1);
      ctx.fillRect(9, 15, 10, 1);
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

  // --- skill shard: a faceted gem (glows + bobs in-scene) --------------------
  makeShard() {
    this.paint('shard', 20, 26, (ctx) => {
      // diamond body
      ctx.fillStyle = '#00d9f5';
      ctx.beginPath();
      ctx.moveTo(10, 1);
      ctx.lineTo(19, 11);
      ctx.lineTo(10, 25);
      ctx.lineTo(1, 11);
      ctx.closePath();
      ctx.fill();
      // facets
      ctx.fillStyle = '#7af6ff';
      ctx.beginPath();
      ctx.moveTo(10, 1);
      ctx.lineTo(14, 11);
      ctx.lineTo(10, 25);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#cffcff';
      ctx.fillRect(8, 4, 2, 6);
    });
  }

  // --- monitor / PC screen (glowing CRT) -------------------------------------
  makeMonitor() {
    this.paint('monitor', 32, 32, (ctx) => {
      // stand
      ctx.fillStyle = '#1a1c26';
      ctx.fillRect(13, 26, 6, 4);
      ctx.fillRect(9, 29, 14, 2);
      // bezel
      ctx.fillStyle = '#23262f';
      ctx.fillRect(3, 4, 26, 22);
      // glowing screen
      ctx.fillStyle = '#063844';
      ctx.fillRect(6, 7, 20, 16);
      ctx.fillStyle = '#00d9f5';
      ctx.fillRect(8, 9, 16, 2);
      ctx.fillRect(8, 13, 11, 1);
      ctx.fillRect(8, 16, 14, 1);
      ctx.fillRect(8, 19, 8, 1);
      // scanline glint
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(6, 7, 20, 1);
    });
  }

  // --- npc (distinct from player; muted figure) ------------------------------
  makeNpc() {
    this.paint('npc', 32, 32, (ctx) => {
      const P = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
      P(12, 25, 4, 4, '#1d2233');
      P(16, 25, 4, 4, '#1d2233');
      P(9, 13, 14, 13, '#3a4060');   // body
      P(9, 21, 14, 5, '#2c3150');
      P(11, 4, 10, 10, '#d8b48a');   // head
      P(11, 4, 10, 4, '#2a2535');    // hair
      P(13, 8, 2, 2, '#22202c');     // eyes
      P(17, 8, 2, 2, '#22202c');
    });
  }

  // --- portal / doorway to the next zone (glowing arch) ----------------------
  makePortal() {
    this.paint('portal', 36, 48, (ctx) => {
      // frame
      ctx.fillStyle = '#15161f';
      ctx.fillRect(4, 6, 28, 42);
      // glowing interior
      const g = ctx.createLinearGradient(0, 6, 0, 48);
      g.addColorStop(0, 'rgba(123,47,190,0.95)');
      g.addColorStop(0.5, 'rgba(0,217,245,0.85)');
      g.addColorStop(1, 'rgba(123,47,190,0.6)');
      ctx.fillStyle = g;
      ctx.fillRect(8, 10, 20, 36);
      // bright core
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(15, 14, 6, 28);
      // frame top
      ctx.fillStyle = '#2a2c3c';
      ctx.fillRect(4, 6, 28, 4);
    });
  }

  // --- player sprite sheet (3 cols x 3 rows of 32x32) ------------------------
  makePlayer() {
    const tex = this.paint('player', 96, 96, (ctx) => {
      const rows = ['down', 'up', 'side'];
      for (let r = 0; r < 3; r++)
        for (let c = 0; c < 3; c++)
          this.drawPerson(ctx, c * 32, r * 32, rows[r], c);
    });
    let i = 0;
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++) tex.add(i++, 0, c * 32, r * 32, 32, 32);
  }

  drawPerson(ctx, ox, oy, dir, frame) {
    const P = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(ox + x, oy + y, w, h); };
    const skin = '#e8b48a', skinDk = '#c98f63', hair = '#241a2e';
    const hood = '#6b3fa0', hoodDk = '#4f2c86', pants = '#222238', boot = '#13131d';
    const stick = '#6e4423', flame = '#ff7b00', flameHot = '#ffd27a';

    const aDown = frame === 0 ? 1 : 0;
    const bDown = frame === 2 ? 1 : 0;
    P(12, 25, 4, 4 + aDown, pants);
    P(16, 25, 4, 4 + bDown, pants);
    P(12, 28 + aDown, 4, 1, boot);
    P(16, 28 + bDown, 4, 1, boot);

    P(9, 14, 14, 12, hood);
    P(9, 22, 14, 4, hoodDk);
    P(8, 15, 2, 8, hoodDk);
    P(22, 15, 2, 8, hoodDk);

    if (dir === 'up') {
      P(10, 4, 12, 11, hair);
    } else if (dir === 'side') {
      P(10, 4, 12, 4, hair);
      P(10, 4, 5, 10, hair);
      P(15, 7, 6, 7, skin);
      P(15, 13, 6, 1, skinDk);
      P(18, 9, 2, 2, hair);
    } else {
      P(10, 4, 12, 4, hair);
      P(10, 4, 2, 9, hair);
      P(20, 4, 2, 9, hair);
      P(12, 6, 8, 8, skin);
      P(12, 13, 8, 1, skinDk);
      P(13, 9, 2, 2, hair);
      P(17, 9, 2, 2, hair);
    }

    // the torch (always on the figure's right; flips with the sprite)
    P(24, 12, 2, 11, stick);
    const flick = frame === 1 ? 0 : 1;
    P(22, 7 - flick, 6, 6, flame);
    P(23, 4 - flick, 4, 5, flameHot);
    P(24, 5 - flick, 2, 2, '#fff6d8');
  }
}
