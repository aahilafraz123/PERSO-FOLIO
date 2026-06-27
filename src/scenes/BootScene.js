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
    this.makeLight();
    this.makeShard();
    this.makeMonitor();
    this.makeNpc();
    this.makePortal();
    this.makePlayer();
    this.makePrologueArt();

    // Fresh play opens on the prologue ("The Room"); it hands off to Chapter I.
    // (Re)starting straight into a zone is still supported via scene data.
    const startZone = this.scene.settings.data?.zoneKey;
    if (startZone) this.scene.start('zone', { zoneKey: startZone });
    else this.scene.start('prologue');
  }

  // ===========================================================================
  // PROLOGUE ART — "The Room" (warm, lit, ordinary; top-down)
  // ===========================================================================
  makePrologueArt() {
    // wood floor
    this.paint('floor_room', 32, 32, (ctx) => {
      ctx.fillStyle = '#3a2c20';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#43342655';
      ctx.fillRect(0, 0, 32, 2);
      ctx.fillStyle = '#2c2018';
      ctx.fillRect(0, 15, 32, 1);
      ctx.fillStyle = '#46362788';
      ctx.fillRect(15, 0, 1, 15);
      ctx.fillRect(7, 16, 1, 16);
    });
    // interior wall
    this.paint('wall_room', 32, 32, (ctx) => {
      ctx.fillStyle = '#241a30';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#2e2240';
      ctx.fillRect(0, 0, 32, 22);
      ctx.fillStyle = '#1a1322';
      ctx.fillRect(0, 26, 32, 6); // baseboard shadow
    });
    // desk (top-down, wide)
    this.paint('desk', 64, 30, (ctx) => {
      ctx.fillStyle = '#4a3322';
      ctx.fillRect(0, 4, 64, 24);
      ctx.fillStyle = '#5d4129';
      ctx.fillRect(0, 4, 64, 6);
      ctx.fillStyle = '#33241799';
      ctx.fillRect(0, 25, 64, 3);
    });
    // laptop with a glowing screen
    this.paint('laptop', 22, 18, (ctx) => {
      ctx.fillStyle = '#15171f';
      ctx.fillRect(2, 9, 18, 8); // base
      ctx.fillStyle = '#1d2029';
      ctx.fillRect(3, 1, 16, 9); // lid
      ctx.fillStyle = '#bfe9ff';
      ctx.fillRect(4, 2, 14, 7); // screen glow
      ctx.fillStyle = '#7fd4ff';
      ctx.fillRect(5, 3, 9, 1);
      ctx.fillRect(5, 5, 12, 1);
      ctx.fillRect(5, 7, 6, 1);
    });
    // chair (top-down, back to camera)
    this.paint('chair', 24, 24, (ctx) => {
      ctx.fillStyle = '#2a2030';
      ctx.fillRect(4, 2, 16, 6); // backrest
      ctx.fillStyle = '#352942';
      ctx.fillRect(4, 8, 16, 12); // seat
    });
    // seated kid (back to camera, no torch yet)
    this.paint('kid_sit', 24, 28, (ctx) => {
      const P = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
      P(7, 12, 10, 14, '#3a3550');   // hoodie back
      P(7, 12, 10, 4, '#2e2a40');    // hood
      P(8, 4, 8, 9, '#241a2e');      // hair / back of head
      P(6, 14, 2, 8, '#332e48');     // arms
      P(16, 14, 2, 8, '#332e48');
    });
    // bed
    this.paint('bed', 40, 56, (ctx) => {
      ctx.fillStyle = '#3a2f4a';
      ctx.fillRect(2, 2, 36, 52); // frame
      ctx.fillStyle = '#4a5a7a';
      ctx.fillRect(4, 8, 32, 44); // blanket
      ctx.fillStyle = '#d8dcea';
      ctx.fillRect(6, 3, 28, 9);  // pillow
      ctx.fillStyle = '#3f4d68';
      ctx.fillRect(4, 30, 32, 1);
    });
    // floor lamp (warm) — the room's light source
    this.paint('lamp', 24, 40, (ctx) => {
      ctx.fillStyle = '#2a2a32';
      ctx.fillRect(11, 16, 2, 22); // pole
      ctx.fillStyle = '#1f1f27';
      ctx.fillRect(7, 37, 10, 2);  // base
      ctx.fillStyle = '#ffe9a8';
      ctx.fillRect(6, 2, 12, 12);  // shade glow
      ctx.fillStyle = '#fff6d8';
      ctx.fillRect(9, 5, 6, 7);
    });
    // exit door
    this.paint('door', 40, 52, (ctx) => {
      ctx.fillStyle = '#1a1422';
      ctx.fillRect(2, 2, 36, 50);
      ctx.fillStyle = '#0c0a12';
      ctx.fillRect(7, 6, 26, 44); // dark opening
      ctx.fillStyle = '#2e2440';
      ctx.fillRect(2, 2, 36, 4);
    });
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

  // soft radial glow, used for warm ambient washes (prologue lamp, etc.)
  makeLight() {
    this.paint('light', 256, 256, (ctx) => {
      const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.5, 'rgba(255,255,255,0.55)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
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

  /**
   * The protagonist: a brown-skinned traveler in a sleek dark jacket with a
   * neon-cyan accent, carrying a torch. Reads as a real person and pops against
   * the dark. dir = 'down' | 'up' | 'side' (side faces right; flipped in-engine).
   */
  drawPerson(ctx, ox, oy, dir, frame) {
    const P = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(ox + x, oy + y, w, h); };

    const skin = '#a06a3f', skinDk = '#7c5130', skinLt = '#bb8254';
    const hair = '#15110e', hairLt = '#2a2018';
    const jkt = '#2b2742', jktDk = '#1c1930', jktLt = '#3d3862';
    const cyan = '#00d9f5', cyanDk = '#0a7e94';
    const pants = '#1a1a26', pantsDk = '#101019', boot = '#0c0c12';
    const stick = '#5e3c1f', flame = '#ff8a1e', flameHot = '#ffd27a', core = '#fff6d8';

    const aDn = frame === 0 ? 1 : 0; // alternating leg lift for the walk
    const bDn = frame === 2 ? 1 : 0;

    // --- legs + boots ---
    P(11, 24, 5, 4 + aDn, pants);
    P(16, 24, 5, 4 + bDn, pants);
    P(11, 24, 1, 4 + aDn, pantsDk);
    P(20, 24, 1, 4 + bDn, pantsDk);
    P(11, 27 + aDn, 5, 2, boot);
    P(16, 27 + bDn, 5, 2, boot);

    // --- torso / jacket ---
    P(9, 13, 14, 12, jkt);
    P(9, 13, 14, 2, jktLt);        // shoulder highlight
    P(9, 22, 14, 3, jktDk);        // hem shadow
    P(8, 14, 2, 9, jktDk);         // arms
    P(22, 14, 2, 9, jktDk);
    P(15, 15, 2, 9, cyanDk);       // glowing zipper
    P(15, 15, 1, 9, cyan);
    P(9, 14, 2, 1, cyan);          // shoulder accents (not covered by head)
    P(21, 14, 2, 1, cyan);

    // --- head ---
    if (dir === 'up') {
      P(10, 3, 12, 11, hair);
      P(10, 3, 12, 3, hairLt);
      P(10, 12, 12, 2, jktDk);     // collar behind the neck
    } else if (dir === 'side') {
      P(9, 4, 12, 4, hair);        // hair top
      P(9, 5, 5, 9, hair);         // back hair
      P(14, 6, 7, 8, skin);        // face
      P(14, 6, 7, 1, skinLt);
      P(20, 7, 1, 6, skinDk);      // front edge shadow
      P(14, 13, 7, 1, skinDk);     // jaw
      P(18, 9, 2, 2, hair);        // eye
    } else {
      P(10, 3, 12, 5, hair);       // hair
      P(9, 4, 2, 7, hair);
      P(21, 4, 2, 7, hair);
      P(10, 3, 12, 1, hairLt);
      P(11, 6, 10, 8, skin);       // face
      P(11, 6, 10, 1, skinLt);     // forehead light
      P(11, 13, 10, 1, skinDk);    // chin shadow
      P(12, 9, 3, 1, hair);        // brows
      P(17, 9, 3, 1, hair);
      P(13, 10, 2, 2, hair);       // eyes
      P(17, 10, 2, 2, hair);
      P(13, 10, 1, 1, '#f0f0f5');  // eye glints
      P(17, 10, 1, 1, '#f0f0f5');
      P(15, 12, 2, 1, skinDk);     // nose hint
    }

    // --- torch (figure's right hand; flips with the sprite) ---
    const flick = frame === 1 ? 0 : 1;
    P(22, 14, 1, 8, '#6a5236');     // warm rim on the lit side
    P(24, 12, 2, 11, stick);
    P(22, 7 - flick, 6, 6, flame);
    P(23, 4 - flick, 4, 5, flameHot);
    P(24, 5 - flick, 2, 2, core);
  }
}
