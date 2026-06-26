import Phaser from 'phaser';

/**
 * LightSystem — the signature mechanic (GDD §0, §2).
 *
 * A near-black overlay covers the screen; a soft radial "hole" is punched out
 * around the player every frame. `torchRadius` is in SCREEN pixels and grows on
 * zone entry via growTo() — the world literally brightens as the story does.
 * This is the entire emotional argument of the game; treat it as load-bearing.
 *
 * Implementation = the render-texture mask approach from GDD §2 (most art control).
 */
export default class LightSystem {
  constructor(scene, { radius = 82, darkness = 0.985, color = 0x05060a } = {}) {
    this.scene = scene;
    this.torchRadius = radius;
    this.darknessAlpha = darkness;
    this.color = color;
    this.flicker = 0;

    const w = scene.scale.width;
    const h = scene.scale.height;

    LightSystem.makeLightTexture(scene, 256);

    // full-screen dark overlay, pinned to the camera
    this.rt = scene.add
      .renderTexture(0, 0, w, h)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1000);

    // an off-display stamp we scale + position, then erase from the darkness
    this.stamp = scene.make
      .image({ key: 'torchLight', add: false })
      .setOrigin(0.5);
  }

  static makeLightTexture(scene, size) {
    const key = 'torchLight';
    if (scene.textures.exists(key)) return key;
    const canvas = scene.textures.createCanvas(key, size, size);
    const ctx = canvas.getContext();
    const g = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2,
    );
    // feathered falloff — soft torch pool, not a hard circle
    g.addColorStop(0.0, 'rgba(255,255,255,1)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.94)');
    g.addColorStop(0.7, 'rgba(255,255,255,0.5)');
    g.addColorStop(0.88, 'rgba(255,255,255,0.16)');
    g.addColorStop(1.0, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    canvas.refresh();
    return key;
  }

  /** Grow (or shrink) the lit radius — call on zone entry. Confidence ↑. */
  growTo(radius, ms = 1600) {
    this.scene.tweens.add({
      targets: this,
      torchRadius: radius,
      duration: ms,
      ease: 'Sine.easeInOut',
    });
  }

  /** Call every frame after the camera has updated. */
  update(player) {
    const cam = this.scene.cameras.main;
    this.flicker = Math.sin(this.scene.time.now / 95) * 3.5
      + Math.sin(this.scene.time.now / 47) * 1.5; // layered = organic flame

    const r = this.torchRadius + this.flicker;

    // world → screen (camera viewport) coords; radius stays in screen space
    const sx = (player.x - cam.worldView.x) * cam.zoom;
    const sy = (player.y - cam.worldView.y) * cam.zoom;

    this.rt.clear();
    this.rt.fill(this.color, this.darknessAlpha);
    this.stamp.setPosition(sx, sy).setScale((r * 2) / 256);
    this.rt.erase(this.stamp);
  }

  destroy() {
    this.rt?.destroy();
    this.stamp?.destroy();
  }
}
