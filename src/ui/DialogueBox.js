import Phaser from 'phaser';
import { VIEW_W, VIEW_H } from '../config/constants.js';

/**
 * DialogueBox — a screen-pinned speech panel with a typewriter effect.
 * Used for signs (bottom) and the GRIND card (centered).
 */
export default class DialogueBox {
  constructor(scene, { centered = false } = {}) {
    this.scene = scene;
    this.centered = centered;
    this.open = false;

    const boxW = centered ? 420 : 560;
    const boxH = centered ? 150 : 120;
    const x = (VIEW_W - boxW) / 2;
    const y = centered ? (VIEW_H - boxH) / 2 : VIEW_H - boxH - 26;

    this.container = scene.add
      .container(0, 0)
      .setScrollFactor(0)
      .setDepth(2000)
      .setVisible(false);

    const g = scene.add.graphics();
    g.fillStyle(0x05060a, 0.92);
    g.fillRoundedRect(x, y, boxW, boxH, 8);
    g.lineStyle(2, centered ? 0xffcf3a : 0x6b3fa0, 1);
    g.strokeRoundedRect(x, y, boxW, boxH, 8);
    // inner accent line
    g.lineStyle(1, 0x00d9f5, 0.35);
    g.strokeRoundedRect(x + 4, y + 4, boxW - 8, boxH - 8, 6);

    this.label = scene.add
      .text(x + 18, y + 14, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: centered ? '20px' : '17px',
        color: centered ? '#ffe9a8' : '#eef0ff',
        wordWrap: { width: boxW - 36 },
        lineSpacing: 6,
      })
      .setShadow(0, 2, '#000000', 4);

    this.hint = scene.add
      .text(x + boxW - 14, y + boxH - 12, '[E] / Esc', {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        color: '#6b7088',
      })
      .setOrigin(1, 1);

    this.container.add([g, this.label, this.hint]);
  }

  show(text) {
    this.open = true;
    this.container.setVisible(true);
    this.label.setText('');
    this._full = text;
    this._i = 0;

    if (this._timer) this._timer.remove();
    this._timer = this.scene.time.addEvent({
      delay: 18,
      loop: true,
      callback: () => {
        this._i += 1;
        this.label.setText(this._full.slice(0, this._i));
        if (this._i >= this._full.length) this._timer.remove();
      },
    });
  }

  // if mid-typewriter, first press completes the text instead of closing
  advance() {
    if (this._timer && this._timer.getProgress() < 1 && this._i < this._full.length) {
      this._timer.remove();
      this._i = this._full.length;
      this.label.setText(this._full);
      return true; // consumed
    }
    return false;
  }

  hide() {
    this.open = false;
    this.container.setVisible(false);
    if (this._timer) this._timer.remove();
  }
}
