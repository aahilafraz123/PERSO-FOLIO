import Phaser from 'phaser';
import { VIEW_W, VIEW_H } from '../config/constants.js';

// the keys the grind cycles through — "switch the letters we ask for"
const GRIND_KEYS = ['E', 'SPACE', 'W', 'A', 'S', 'D'];

/**
 * MiniGame — a small, self-contained canvas overlay for the active beats:
 *   stoke  — mash to fill a bar (The Forge)
 *   timing — press as the marker hits the green zone (the pitch / present)
 *   grind  — fill a bar by hitting a ROTATING prompted key (The Hollow); ends in
 *            silence, the joyless grind made literal
 *
 * Pinned to the camera, freezes the world while open, takes keyboard AND pointer
 * input, and ALWAYS auto-resolves after `duration` so a phone or idle player is
 * never trapped. The active instance is parked on scene._miniGame so the dev test
 * bridge can drive it headlessly (hit() / resolve()).
 */
export default class MiniGame {
  constructor(scene, { mode = 'stoke', title = '', hint = '', duration = 6000, onDone = () => {} } = {}) {
    this.scene = scene;
    this.mode = mode;
    this.duration = duration;
    this.onDone = onDone;
    this.done = false;
    this.elapsed = 0;

    // stoke / grind state
    this.fill = 0;
    this.grindStep = 0;
    this.promptKey = GRIND_KEYS[0];
    // timing state
    this.cursor = 0;
    this.dir = 1;
    this.hits = [];
    this.needHits = 3;
    this.targetC = 0.8;
    this.targetW = 0.17;

    scene._miniGame = this;
    this._build(title, hint);

    if (mode === 'grind') {
      this._grindHandlers = {};
      GRIND_KEYS.forEach((k) => {
        const evt = `keydown-${k}`;
        const h = () => this.hit(k);
        this._grindHandlers[evt] = h;
        scene.input.keyboard.on(evt, h);
      });
      this._onPtr = () => this.hit(this.promptKey); // a tap always matches (mobile)
      scene.input.on('pointerdown', this._onPtr);
    } else {
      this._onKey = () => this.hit();
      scene.input.keyboard.on('keydown-E', this._onKey);
      scene.input.keyboard.on('keydown-SPACE', this._onKey);
      this._onPtr = () => this.hit();
      scene.input.on('pointerdown', this._onPtr);
    }
    this._onUpd = (t, dms) => this._tick(dms);
    scene.events.on('update', this._onUpd);
  }

  _build(title, hint) {
    const s = this.scene;
    const cx = VIEW_W / 2;
    const cy = VIEW_H / 2;
    const accent = this.mode === 'grind' ? 0x6b7088 : 0xff7b00; // grind = joyless grey
    const c = s.add.container(0, 0).setScrollFactor(0).setDepth(1900);

    const backdrop = s.add.rectangle(cx, cy, VIEW_W, VIEW_H, 0x05060a, 0.66).setOrigin(0.5);
    const panel = s.add.rectangle(cx, cy, 420, 150, 0x0b0d16, 0.98).setStrokeStyle(2, accent);
    const t = s.add.text(cx, cy - 50, title, {
      fontFamily: 'JetBrains Mono, monospace', fontSize: '15px', color: '#ffd27a', align: 'center',
      wordWrap: { width: 380 },
    }).setOrigin(0.5);

    this.trackX = cx - 170;
    this.trackW = 340;
    this.trackY = cy + 6;
    const track = s.add.rectangle(cx, this.trackY, this.trackW, 18, 0x1a1c2e, 1).setStrokeStyle(1, 0x3a3e57);

    c.add([backdrop, panel, t, track]);

    if (this.mode === 'timing') {
      this.zoneRect = s.add.rectangle(this.trackX + this.trackW * this.targetC, this.trackY, this.trackW * this.targetW, 18, 0x2e7d32, 0.9);
      this.marker = s.add.rectangle(this.trackX, this.trackY, 5, 26, 0xffd27a, 1);
      c.add([this.zoneRect, this.marker]);
    } else {
      this.bar = s.add.rectangle(this.trackX, this.trackY, 0, 16, accent, 1).setOrigin(0, 0.5);
      c.add(this.bar);
    }

    if (this.mode === 'grind') {
      this.promptText = s.add.text(cx, cy - 18, '', {
        fontFamily: 'JetBrains Mono, monospace', fontSize: '20px', color: '#e6e8f5', fontStyle: 'bold',
      }).setOrigin(0.5);
      c.add(this.promptText);
      this._updateGrindPrompt();
    }

    const h = s.add.text(cx, cy + 44, hint, {
      fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#9aa0bd', align: 'center',
    }).setOrigin(0.5);
    c.add(h);

    c.setAlpha(0);
    s.tweens.add({ targets: c, alpha: 1, duration: 180 });
    this.container = c;
  }

  _updateGrindPrompt() {
    if (this.promptText) this.promptText.setText(`PRESS  [ ${this.promptKey} ]`);
  }

  /** A press / tap / dev-driven beat. `key` is the pressed key (grind only). */
  hit(key) {
    if (this.done) return;
    if (this.mode === 'grind') {
      if (key && key !== this.promptKey) return; // wrong key — the grind ignores you
      this.fill = Math.min(1, this.fill + 0.13);
      this.grindStep += 1;
      this.promptKey = GRIND_KEYS[this.grindStep % GRIND_KEYS.length];
      this._updateGrindPrompt();
      this.scene.tweens.add({ targets: this.bar, scaleY: 1.3, duration: 70, yoyo: true });
      if (this.fill >= 1) this._finish(1);
      return;
    }
    if (this.mode === 'stoke') {
      this.fill = Math.min(1, this.fill + 0.16);
      this.scene.tweens.add({ targets: this.bar, scaleY: 1.3, duration: 70, yoyo: true });
      if (this.fill >= 1) this._finish(1);
      return;
    }
    // timing: score how close the sweeping marker is to the green zone centre
    const d = Math.abs(this.cursor - this.targetC);
    const q = Phaser.Math.Clamp(1 - d / this.targetW, 0, 1);
    this.hits.push(q);
    if (this.hits.length >= this.needHits) {
      this._finish(this.hits.reduce((a, b) => a + b, 0) / this.hits.length);
    }
  }

  /** Force-resolve (timeout / dev bridge). */
  resolve(score = 0.6) { this._finish(score); }

  _tick(dms) {
    if (this.done) return;
    const dt = Math.min(dms, 50) / 1000;
    this.elapsed += dms;

    if (this.mode === 'stoke') {
      this.fill = Math.max(0, this.fill - 0.34 * dt);
      this.bar.width = this.trackW * this.fill;
    } else if (this.mode === 'grind') {
      this.fill = Math.max(0, this.fill - 0.20 * dt); // bleeds — you have to keep at it
      this.bar.width = this.trackW * this.fill;
    } else {
      this.cursor += this.dir * 0.9 * dt;
      if (this.cursor >= 1) { this.cursor = 1; this.dir = -1; }
      if (this.cursor <= 0) { this.cursor = 0; this.dir = 1; }
      this.marker.x = this.trackX + this.trackW * this.cursor;
    }

    if (this.elapsed >= this.duration) {
      if (this.mode === 'timing') {
        this._finish(this.hits.length ? this.hits.reduce((a, b) => a + b, 0) / this.hits.length : 0.6);
      } else {
        this._finish(Math.max(0.6, this.fill)); // never trap
      }
    }
  }

  _finish(score) {
    if (this.done) return;
    this.done = true;
    if (this.mode === 'grind') {
      Object.entries(this._grindHandlers).forEach(([evt, h]) => this.scene.input.keyboard.off(evt, h));
    } else {
      this.scene.input.keyboard.off('keydown-E', this._onKey);
      this.scene.input.keyboard.off('keydown-SPACE', this._onKey);
    }
    this.scene.input.off('pointerdown', this._onPtr);
    this.scene.events.off('update', this._onUpd);
    if (this.scene._miniGame === this) this.scene._miniGame = null;
    this.scene.tweens.add({
      targets: this.container, alpha: 0, duration: 220,
      onComplete: () => this.container.destroy(),
    });
    this.onDone(Phaser.Math.Clamp(score, 0, 1));
  }
}
