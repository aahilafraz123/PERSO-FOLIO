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
    this.makeGate();
    this.makeWorkbench();
    this.makeComponent();
    this.makeAnvil();
    this.makeStage();
    this.makeArtifact();
    this.makeGlobe();
    this.makeDoorRoom();
    this.makeAnomaly();
    this.makeRelic();
    this.makeLetter();
    this.makeCampfire();
    this.makeLever();
    this.makePodium();
    this.makeBarrier();
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

  // --- locked OFFER gate (Wilderness): heavy barred door, won't open ----------
  makeGate() {
    this.paint('gate', 36, 44, (ctx) => {
      // stone posts
      ctx.fillStyle = '#2a2622';
      ctx.fillRect(1, 4, 6, 40);
      ctx.fillRect(29, 4, 6, 40);
      // dark doorway
      ctx.fillStyle = '#0c0a10';
      ctx.fillRect(7, 8, 22, 36);
      // iron bars
      ctx.fillStyle = '#4a4640';
      for (let x = 9; x < 28; x += 5) ctx.fillRect(x, 9, 2, 34);
      ctx.fillRect(7, 16, 22, 2);
      ctx.fillRect(7, 30, 22, 2);
      // OFFER plate
      ctx.fillStyle = '#b08d2e';
      ctx.fillRect(8, 1, 20, 7);
      ctx.fillStyle = '#15110a';
      ctx.fillRect(10, 3, 2, 3); ctx.fillRect(13, 3, 2, 3); ctx.fillRect(16, 3, 2, 3);
      ctx.fillRect(19, 3, 2, 3); ctx.fillRect(22, 3, 2, 3);
      // padlock
      ctx.fillStyle = '#d8d2c4';
      ctx.fillRect(16, 22, 5, 5);
      ctx.fillStyle = '#8a857a';
      ctx.fillRect(17, 19, 3, 3);
    });
  }

  // --- workbench (Hollow): a desk where work gets shipped into the void -------
  makeWorkbench() {
    this.paint('workbench', 34, 30, (ctx) => {
      // bench top
      ctx.fillStyle = '#3a3e4f';
      ctx.fillRect(2, 10, 30, 14);
      ctx.fillStyle = '#4a4f64';
      ctx.fillRect(2, 10, 30, 4);
      // legs
      ctx.fillStyle = '#23262f';
      ctx.fillRect(4, 24, 3, 5);
      ctx.fillRect(27, 24, 3, 5);
      // a small dim terminal (no glow — quiet room)
      ctx.fillStyle = '#1a1c24';
      ctx.fillRect(7, 2, 12, 9);
      ctx.fillStyle = '#2c4a52';
      ctx.fillRect(9, 4, 8, 5);
      ctx.fillStyle = '#3f6b74';
      ctx.fillRect(10, 5, 5, 1);
      ctx.fillRect(10, 7, 3, 1);
      // tools on the bench
      ctx.fillStyle = '#6b7088';
      ctx.fillRect(22, 6, 7, 2);
      ctx.fillRect(24, 4, 2, 5);
    });
  }

  // --- Forge: a component chip the player gathers to forge LearnFlow ----------
  makeComponent() {
    this.paint('component', 22, 22, (ctx) => {
      // a glowing chip / module fragment (warm forge tone)
      ctx.fillStyle = '#ff9a3c';
      ctx.fillRect(5, 5, 12, 12);
      ctx.fillStyle = '#ffd27a';
      ctx.fillRect(7, 7, 8, 8);
      ctx.fillStyle = '#ff7b00';
      ctx.fillRect(9, 9, 4, 4);
      // pins
      ctx.fillStyle = '#ffb14a';
      for (let x = 6; x <= 16; x += 4) { ctx.fillRect(x, 2, 2, 3); ctx.fillRect(x, 17, 2, 3); }
      for (let y = 6; y <= 16; y += 4) { ctx.fillRect(2, y, 3, 2); ctx.fillRect(17, y, 3, 2); }
    });
  }

  // --- Forge: the anvil where all six components fuse -------------------------
  makeAnvil() {
    this.paint('anvil', 34, 30, (ctx) => {
      ctx.fillStyle = '#1c1f28';
      ctx.fillRect(12, 22, 10, 6);      // base
      ctx.fillRect(14, 12, 6, 10);      // waist
      ctx.fillStyle = '#2a2d38';
      ctx.fillRect(5, 6, 24, 8);        // body
      ctx.fillRect(2, 7, 6, 4);         // horn
      ctx.fillStyle = '#3a3e4c';
      ctx.fillRect(5, 6, 24, 2);        // top face
      // hot glow on the face
      ctx.fillStyle = 'rgba(255,123,0,0.5)';
      ctx.fillRect(8, 5, 16, 2);
    });
  }

  // --- Forge: the pitch stage (a lit floor platform) -------------------------
  makeStage() {
    this.paint('stage', 40, 40, (ctx) => {
      ctx.fillStyle = 'rgba(255,180,74,0.10)';
      ctx.fillRect(2, 2, 36, 36);
      ctx.strokeStyle = 'rgba(255,210,122,0.55)';
      ctx.lineWidth = 2;
      ctx.strokeRect(3, 3, 34, 34);
      ctx.fillStyle = 'rgba(255,210,122,0.7)';
      // corner footlights
      [[6, 6], [32, 6], [6, 32], [32, 32]].forEach(([x, y]) => ctx.fillRect(x - 1, y - 1, 3, 3));
    });
  }

  // --- Forge: the forged LearnFlow artifact that floats with you afterward ----
  makeArtifact() {
    this.paint('artifact', 20, 24, (ctx) => {
      ctx.fillStyle = '#ffb14a';
      ctx.beginPath();
      ctx.moveTo(10, 1); ctx.lineTo(19, 9); ctx.lineTo(10, 23); ctx.lineTo(1, 9);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd790';
      ctx.beginPath();
      ctx.moveTo(10, 1); ctx.lineTo(14, 9); ctx.lineTo(10, 23);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff3d6';
      ctx.fillRect(8, 4, 2, 6);
    });
  }

  // --- Mission Control: a data-source globe (spins on connect) ---------------
  makeGlobe() {
    this.paint('globe', 30, 32, (ctx) => {
      // stand
      ctx.fillStyle = '#1a2238';
      ctx.fillRect(12, 26, 6, 4);
      ctx.fillRect(9, 29, 12, 2);
      // sphere
      ctx.fillStyle = '#16304a';
      ctx.beginPath(); ctx.arc(15, 13, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1e4a6e';
      ctx.beginPath(); ctx.arc(15, 13, 12, Math.PI * 0.15, Math.PI * 0.95); ctx.fill();
      // continents
      ctx.fillStyle = '#2f7d5a';
      ctx.fillRect(9, 8, 5, 4); ctx.fillRect(16, 12, 6, 3); ctx.fillRect(12, 17, 4, 3);
      // meridian + highlight
      ctx.fillStyle = 'rgba(127,212,255,0.5)';
      ctx.fillRect(14, 2, 1, 22);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.arc(11, 9, 2, 0, Math.PI * 2); ctx.fill();
    });
  }

  // --- Arena: a meeting-room door (you pass it, a meeting auto-joins) --------
  makeDoorRoom() {
    this.paint('door_room', 26, 34, (ctx) => {
      ctx.fillStyle = '#2a2d4a';
      ctx.fillRect(2, 2, 22, 32);            // frame
      ctx.fillStyle = '#3c4068';
      ctx.fillRect(4, 4, 18, 28);            // door
      ctx.fillStyle = '#4a4f7a';
      ctx.fillRect(4, 4, 18, 3);
      // glass slit
      ctx.fillStyle = '#ffcf3a';
      ctx.fillRect(7, 9, 12, 7);
      ctx.fillStyle = '#fff0c0';
      ctx.fillRect(8, 10, 10, 2);
      // handle
      ctx.fillStyle = '#d8d2c4';
      ctx.fillRect(18, 20, 2, 4);
    });
  }

  // --- Arena: a subtle anomaly (the hidden auth vuln) ------------------------
  makeAnomaly() {
    this.paint('anomaly', 26, 26, (ctx) => {
      // a glitchy, slightly-wrong panel
      ctx.fillStyle = '#161a2a';
      ctx.fillRect(4, 4, 18, 18);
      ctx.fillStyle = '#ffcf3a';
      ctx.fillRect(6, 7, 14, 2);
      ctx.fillStyle = '#ff5a5a';
      ctx.fillRect(6, 11, 9, 2);             // the off-colour "wrong" bar
      ctx.fillStyle = '#ffcf3a';
      ctx.fillRect(6, 15, 12, 2);
      // glitch shards
      ctx.fillStyle = 'rgba(255,90,90,0.6)';
      ctx.fillRect(2, 9, 3, 1); ctx.fillRect(21, 14, 4, 1); ctx.fillRect(3, 18, 2, 1);
    });
  }

  // --- cert relic: a gold medallion (hidden completionist pickup) ------------
  makeRelic() {
    this.paint('relic', 22, 22, (ctx) => {
      // medallion
      ctx.fillStyle = '#b8902e';
      ctx.beginPath(); ctx.arc(11, 10, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffcf3a';
      ctx.beginPath(); ctx.arc(11, 10, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff0c0';
      ctx.beginPath(); ctx.arc(9, 8, 2.5, 0, Math.PI * 2); ctx.fill();
      // a small star in the centre
      ctx.fillStyle = '#8a6a14';
      ctx.fillRect(10, 6, 2, 8); ctx.fillRect(7, 9, 8, 2);
      // ribbon tails
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(7, 17, 3, 4); ctx.fillRect(12, 17, 3, 4);
    });
  }

  // --- Wilderness: a rejection letter you carry to the fire ------------------
  makeLetter() {
    this.paint('letter', 20, 22, (ctx) => {
      ctx.fillStyle = '#d8d2c2';            // paper
      ctx.fillRect(3, 2, 14, 18);
      ctx.fillStyle = '#efe9da';            // highlight
      ctx.fillRect(3, 2, 14, 3);
      ctx.fillStyle = '#9a9482';            // folded corner
      ctx.fillRect(12, 2, 5, 5);
      ctx.fillStyle = '#7a7464';            // text lines
      ctx.fillRect(5, 8, 10, 1); ctx.fillRect(5, 11, 10, 1);
      ctx.fillRect(5, 14, 7, 1);
      ctx.fillStyle = '#b33';               // a red "rejected" stamp tilt
      ctx.fillRect(6, 16, 8, 2);
    });
  }

  // --- Wilderness: the campfire that grows as you feed it rejections ----------
  makeCampfire() {
    this.paint('campfire', 30, 30, (ctx) => {
      // logs
      ctx.fillStyle = '#3a2616';
      ctx.fillRect(6, 22, 18, 4);
      ctx.fillRect(8, 24, 14, 3);
      ctx.fillStyle = '#2a1c10';
      ctx.fillRect(9, 23, 2, 3); ctx.fillRect(18, 23, 2, 3);
      // flame
      ctx.fillStyle = '#ff7b00';
      ctx.beginPath(); ctx.moveTo(15, 6); ctx.lineTo(21, 22); ctx.lineTo(9, 22); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffb14a';
      ctx.beginPath(); ctx.moveTo(15, 11); ctx.lineTo(19, 22); ctx.lineTo(11, 22); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff3d6';
      ctx.beginPath(); ctx.moveTo(15, 15); ctx.lineTo(17, 22); ctx.lineTo(13, 22); ctx.closePath(); ctx.fill();
    });
  }

  // --- Mission: the DEPLOY lever you pull once the pipeline's wired ----------
  makeLever() {
    this.paint('lever', 26, 30, (ctx) => {
      // housing
      ctx.fillStyle = '#1a2238';
      ctx.fillRect(4, 14, 18, 14);
      ctx.fillStyle = '#2a3656';
      ctx.fillRect(4, 14, 18, 4);
      // slot
      ctx.fillStyle = '#0a0f1c';
      ctx.fillRect(11, 16, 4, 10);
      // handle (up = ready to pull)
      ctx.fillStyle = '#7a8499';
      ctx.fillRect(12, 4, 2, 12);
      ctx.fillStyle = '#ff5a5a';
      ctx.beginPath(); ctx.arc(13, 4, 3, 0, Math.PI * 2); ctx.fill();
      // DEPLOY label strip
      ctx.fillStyle = '#00d9f5';
      ctx.fillRect(5, 24, 16, 2);
    });
  }

  // --- Arena: the boardroom podium you present from -------------------------
  makePodium() {
    this.paint('podium', 26, 30, (ctx) => {
      // stand
      ctx.fillStyle = '#3c4068';
      ctx.fillRect(7, 12, 12, 16);
      ctx.fillStyle = '#4a4f7a';
      ctx.fillRect(7, 12, 12, 3);
      ctx.fillStyle = '#2a2d4a';
      ctx.fillRect(9, 27, 8, 3);
      // slanted top with a glowing slide
      ctx.fillStyle = '#23263a';
      ctx.fillRect(4, 8, 18, 6);
      ctx.fillStyle = '#ffcf3a';
      ctx.fillRect(6, 9, 14, 3);
      ctx.fillStyle = '#fff0c0';
      ctx.fillRect(7, 10, 7, 1);
    });
  }

  // --- the locked exit barrier (dissolves when the objective is complete) -----
  makeBarrier() {
    this.paint('barrier', 40, 48, (ctx) => {
      // stone posts
      ctx.fillStyle = '#2a2630';
      ctx.fillRect(2, 6, 7, 42);
      ctx.fillRect(31, 6, 7, 42);
      // locked energy field (reddish)
      ctx.fillStyle = 'rgba(255,90,90,0.16)';
      ctx.fillRect(9, 8, 22, 40);
      // bars
      ctx.fillStyle = '#4a4550';
      for (let x = 11; x < 30; x += 5) ctx.fillRect(x, 8, 2, 40);
      ctx.fillRect(9, 14, 22, 2);
      ctx.fillRect(9, 40, 22, 2);
      // big padlock
      ctx.fillStyle = '#8a857a';
      ctx.fillRect(17, 21, 6, 5); // shackle
      ctx.fillStyle = '#d8d2c4';
      ctx.fillRect(15, 25, 10, 9); // body
      ctx.fillStyle = '#2a2630';
      ctx.fillRect(19, 28, 2, 4); // keyhole
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
