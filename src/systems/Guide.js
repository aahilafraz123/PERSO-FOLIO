import Phaser from 'phaser';
import { VIEW_W } from '../config/constants.js';

/**
 * Guide — the wayfinding layer (maximal hand-holding: this is an interactive
 * experience, not a game, so nobody should ever be lost).
 *
 * Two languages of light keep this honest (so guidance never dilutes the earned
 * fire): the warm torch is the REWARD; this cool cyan beacon is GUIDANCE. The
 * scene decides the sequence and calls show()/hide(); the Guide just renders:
 *   - an always-on objective line (plain words, what to do next)
 *   - a cyan beacon (glow + bobbing chevron) that pierces the dark on the target
 *   - a flowing trail of light on the floor from the player to the beacon
 */
export default class Guide {
  constructor(scene) {
    this.scene = scene;
    this.target = null;
    const mono = 'JetBrains Mono, monospace';

    // the inner-voice line is now DOM (see show()/hide()); the beacon stays canvas
    this.glow = scene.add
      .image(0, 0, 'light')
      .setTint(0x00d9f5).setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(1150).setScale(0.75).setAlpha(0).setVisible(false);

    this.chevron = scene.add
      .text(0, 0, '▼', { fontFamily: 'monospace', fontSize: '22px', color: '#9fefff' })
      .setOrigin(0.5).setDepth(1500).setAlpha(0).setVisible(false)
      .setShadow(0, 0, '#00d9f5', 8);

    // flowing floor trail
    this.dots = [];
    for (let i = 0; i < 7; i++) {
      this.dots.push(
        scene.add.image(0, 0, 'light')
          .setTint(0x00d9f5).setBlendMode(Phaser.BlendModes.ADD)
          .setScale(0.05).setDepth(1140).setVisible(false),
      );
    }
  }

  show(pos, objective) {
    this.target = { x: pos.x, y: pos.y };
    // inner-voice line rendered as DOM (Phaser canvas text mis-wraps web fonts)
    window.dispatchEvent(new CustomEvent('relentless:objective', { detail: { text: objective || '' } }));
    this.glow.setPosition(pos.x, pos.y).setVisible(true);
    this.chevron.setVisible(true);
  }

  hide() {
    this.target = null;
    window.dispatchEvent(new Event('relentless:objective-hide'));
    this.scene.tweens.add({ targets: [this.glow, this.chevron], alpha: 0, duration: 300 });
    this.dots.forEach((d) => d.setVisible(false));
  }

  update(player, t) {
    if (!this.target) return;
    const pulse = 0.5 + Math.sin(t / 300) * 0.28;
    this.glow.setAlpha(pulse).setPosition(this.target.x, this.target.y);
    this.chevron
      .setPosition(this.target.x, this.target.y - 30 + Math.sin(t / 250) * 4)
      .setAlpha(0.9);

    // flowing trail from the player toward the beacon
    const dx = this.target.x - player.x;
    const dy = this.target.y - player.y;
    const dist = Math.hypot(dx, dy);
    this.dots.forEach((d, i) => {
      if (dist < 48) { d.setVisible(false); return; }
      // each dot rides 0..1 along the line, offset + time = "flow toward target"
      const f = (((t / 900) + i / this.dots.length) % 1);
      d.setVisible(true)
        .setPosition(player.x + dx * f, player.y + dy * f)
        .setAlpha((1 - f) * 0.55);
    });
  }
}
