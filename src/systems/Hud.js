import { GameState } from './state.js';
import { VIEW_W, VIEW_H } from '../config/constants.js';
import { ZONES } from '../data/story.js';

/**
 * Hud — top-left level + XP bar, top-center zone name, and bottom-right
 * achievement toasts (GDD §6). Screen-pinned, above the darkness overlay.
 * Reads from the global GameState so values persist across zones.
 */
export default class Hud {
  constructor(scene, zone) {
    this.scene = scene;
    const DEPTH = 1800;
    const mono = 'JetBrains Mono, Courier New, monospace';

    // --- level name (top center) ---
    const levelNum = Math.max(1, ZONES.findIndex((z) => z.key === zone.key) + 1);
    scene.add
      .text(VIEW_W / 2, 16, `LEVEL ${levelNum} — ${zone.name}`, {
        fontFamily: mono, fontSize: '13px', color: '#9aa0bd',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH)
      .setShadow(0, 2, '#000', 4);

    // --- level + XP (top left) ---
    this.levelText = scene.add
      .text(16, 14, '', { fontFamily: mono, fontSize: '14px', color: '#ffcf3a' })
      .setScrollFactor(0)
      .setDepth(DEPTH)
      .setShadow(0, 2, '#000', 4);

    const barX = 16;
    const barY = 36;
    this.barW = 168;
    this.barH = 8;

    this.barBg = scene.add
      .rectangle(barX, barY, this.barW, this.barH, 0x1a1c2e, 0.85)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x3a3e57)
      .setScrollFactor(0)
      .setDepth(DEPTH);
    this.barFill = scene.add
      .rectangle(barX + 1, barY + 1, 0, this.barH - 2, 0x7b2fbe)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);

    this.xpText = scene.add
      .text(barX + this.barW + 8, barY - 3, '', {
        fontFamily: mono, fontSize: '10px', color: '#6b7088',
      })
      .setScrollFactor(0)
      .setDepth(DEPTH);

    // cert-relic tracker (top-right) — only shows once you've found one
    this.relicText = scene.add
      .text(VIEW_W - 16, 58, '', { fontFamily: mono, fontSize: '11px', color: '#ffcf3a' })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH)
      .setShadow(0, 2, '#000', 4);

    // --- controls hint (bottom left) ---
    scene.add
      .text(16, VIEW_H - 22, 'ARROWS / WASD move   ·   E interact   ·   ESC exit', {
        fontFamily: mono, fontSize: '11px', color: '#5a607c',
      })
      .setScrollFactor(0)
      .setDepth(DEPTH);

    this.refresh();

    // live updates from anywhere XP/achievements change
    this.off = GameState.on((evt) => {
      this.refresh();
      if (evt.type === 'achievement') this.toast(evt.achievement);
      if (evt.type === 'levelup') this.flashLevel();
    });
    scene.events.once('shutdown', () => this.off && this.off());
  }

  refresh() {
    const need = GameState.xpForLevel(GameState.level);
    const frac = Phaser_clamp(GameState.xp / need);
    this.levelText.setText(`LVL ${GameState.level}`);
    this.barFill.width = Math.max(0, (this.barW - 2) * frac);
    this.xpText.setText(`${GameState.xp} / ${need} XP`);
    if (this.relicText) {
      const n = GameState.relics.size;
      this.relicText.setText(n ? `✦ Relics ${n}/3` : '');
    }
  }

  flashLevel() {
    this.scene.tweens.add({
      targets: this.levelText,
      scale: { from: 1.4, to: 1 },
      duration: 420,
      ease: 'Back.easeOut',
    });
  }

  /** achievement toast, bottom-right, auto-dismiss (GDD §6) */
  toast(a) {
    const x = VIEW_W - 18;
    const y = VIEW_H - 64;
    const c = this.scene.add.container(x, y + 40).setScrollFactor(0).setDepth(2050);

    const w = 286;
    const h = 50;
    const bg = this.scene.add
      .rectangle(0, 0, w, h, 0x0b0d16, 0.96)
      .setOrigin(1, 0.5)
      .setStrokeStyle(2, 0xffcf3a);
    const star = this.scene.add
      .text(-w + 14, 0, '★', { fontFamily: 'monospace', fontSize: '20px', color: '#ffcf3a' })
      .setOrigin(0, 0.5);
    const title = this.scene.add
      .text(-w + 40, -9, `ACHIEVEMENT — ${a.title}`, {
        fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#ffe9a8',
      })
      .setOrigin(0, 0.5);
    const desc = this.scene.add
      .text(-w + 40, 9, a.desc, {
        fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#9aa0bd',
        wordWrap: { width: w - 54 },
      })
      .setOrigin(0, 0.5);
    c.add([bg, star, title, desc]);

    this.scene.tweens.add({ targets: c, y, alpha: { from: 0, to: 1 }, duration: 380, ease: 'Back.easeOut' });
    this.scene.time.delayedCall(4200, () => {
      this.scene.tweens.add({
        targets: c, alpha: 0, x: x + 30, duration: 420,
        onComplete: () => c.destroy(),
      });
    });
  }
}

function Phaser_clamp(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
