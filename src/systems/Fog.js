import Phaser from 'phaser';

/**
 * Fog — "remembered" exploration memory. Where the torch HAS been stays faintly,
 * coolly visible after you leave, so progress accumulates on screen instead of
 * the dark closing seamlessly behind you (GDD §0 — confidence built one real
 * thing at a time, made literal).
 *
 * A world-space render texture (so it scrolls with the camera for free) sits just
 * ABOVE the darkness overlay with ADD blend. We stamp a soft, very-dim cool glow
 * at the player as they move; it's never cleared, so the explored footprint
 * persists. Stamping only after the player travels a little bounds the build-up
 * and leaves a believable trodden trail.
 */
export default class Fog {
  constructor(scene, { worldW, worldH, tint = 0x2a3550, alpha = 0.05, radius = 70 } = {}) {
    this.scene = scene;
    this.alpha = alpha;
    this.radius = radius;
    this.lastX = null;
    this.lastY = null;

    this.rt = scene.add
      .renderTexture(0, 0, worldW, worldH)
      .setOrigin(0, 0)
      .setDepth(1001) // just above LightSystem's darkness (1000)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.stamp = scene.make.image({ key: 'light', add: false }).setOrigin(0.5).setTint(tint);
  }

  update(player) {
    // guard against a torn-down RT (scene restart can fire one more update)
    if (!this.rt || !this.rt.scene) return;
    if (this.lastX !== null) {
      const moved = Phaser.Math.Distance.Between(player.x, player.y, this.lastX, this.lastY);
      if (moved < 14) return; // bound accumulation; only remember as we travel
    }
    this.lastX = player.x;
    this.lastY = player.y;
    this.stamp.setPosition(player.x, player.y)
      .setScale((this.radius * 2) / 256)
      .setAlpha(this.alpha);
    this.rt.draw(this.stamp);
  }

  /** Reveal the whole map at once (the Horizon — the dark is gone). */
  revealAll() {
    this.rt.fill(0x2a3550, this.alpha * 3);
  }

  destroy() {
    this.rt?.destroy();
    this.stamp?.destroy();
    this.rt = null;
    this.stamp = null;
  }
}
