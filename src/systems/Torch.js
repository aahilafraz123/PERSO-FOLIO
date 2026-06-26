import Phaser from 'phaser';

/**
 * Torch — the heart of the whole game.
 *
 * A near-black overlay is laid over the screen, then a soft radial "light"
 * is ERASED out of it around the player every frame. The result is a pool of
 * visibility that follows the character through the dark, with a subtle flicker.
 *
 * The radius is intentionally suffocating in The Wilderness (this is the
 * darkest the game ever gets). Later zones widen `baseRadius` — the light grows
 * as the story does.
 */
export default class Torch {
  constructor(scene, target, opts = {}) {
    this.scene = scene;
    this.target = target;
    this.baseRadius = opts.baseRadius ?? 92; // world-space radius
    this.darkColor = opts.darkColor ?? 0x04050a;
    this.darkAlpha = opts.darkAlpha ?? 0.94; // how black the unlit world is

    const cam = scene.cameras.main;

    // Screen-sized render texture, pinned to the camera, drawn above the world.
    this.rt = scene.add
      .renderTexture(0, 0, cam.width, cam.height)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1000);

    // The erase brush. Kept invisible; we only use its transform.
    this.brush = scene.add.image(0, 0, 'light').setVisible(false);
  }

  update(time) {
    const cam = this.scene.cameras.main;

    // gentle multi-sine flicker
    const flick =
      1 +
      Math.sin(time / 90) * 0.035 +
      Math.sin(time / 37) * 0.02 +
      Math.sin(time / 211) * 0.03;

    // world -> screen
    const sx = (this.target.x - cam.worldView.x) * cam.zoom;
    const sy = (this.target.y - cam.worldView.y) * cam.zoom;

    const rScreen = this.baseRadius * cam.zoom * flick;
    const scale = (rScreen * 2) / 256; // 'light' texture is 256px

    this.rt.clear();
    this.rt.fill(this.darkColor, this.darkAlpha);

    this.brush.setPosition(sx, sy).setScale(scale);
    this.rt.erase(this.brush);
  }

  resize(width, height) {
    this.rt.setSize(width, height);
  }
}
