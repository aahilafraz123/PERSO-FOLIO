import Phaser from 'phaser';

/**
 * Player — boxy 32x32 character, 4-direction movement (arrows + WASD).
 * 'side' frames face right; we flipX for left so we only need 3 rows of art.
 */
export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player', 1);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    // Collision box = the feet, not the whole sprite. Lets the head overlap
    // tree canopies for a convincing top-down feel.
    this.body.setSize(14, 10).setOffset(9, 20);

    this.speed = 132;
    this.facing = 'down';

    Player.createAnims(scene);
    this.play('idle-down');
  }

  static createAnims(scene) {
    if (scene.anims.exists('walk-down')) return;
    const mk = (key, frames, rate = 8, repeat = -1) =>
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers('player', { frames }),
        frameRate: rate,
        repeat,
      });

    mk('walk-down', [0, 1, 2, 1]);
    mk('walk-up', [3, 4, 5, 4]);
    mk('walk-side', [6, 7, 8, 7]);
    mk('idle-down', [1], 1);
    mk('idle-up', [4], 1);
    mk('idle-side', [7], 1);
  }

  update(cursors, keys) {
    const left = cursors.left.isDown || keys.A.isDown;
    const right = cursors.right.isDown || keys.D.isDown;
    const up = cursors.up.isDown || keys.W.isDown;
    const down = cursors.down.isDown || keys.S.isDown;

    let vx = 0;
    let vy = 0;
    if (left) vx = -1;
    else if (right) vx = 1;
    if (up) vy = -1;
    else if (down) vy = 1;

    this.setVelocity(vx, vy);
    this.body.velocity.normalize().scale(this.speed);

    if (vx === 0 && vy === 0) {
      // idle in last-faced direction
      if (this.facing === 'up') this.play('idle-up', true);
      else if (this.facing === 'down') this.play('idle-down', true);
      else {
        this.play('idle-side', true);
        this.setFlipX(this.facing === 'left');
      }
      return;
    }

    // moving — horizontal wins ties for a more "walking sideways" read
    if (vx !== 0 && Math.abs(vx) >= Math.abs(vy)) {
      this.play('walk-side', true);
      this.setFlipX(vx < 0);
      this.facing = vx < 0 ? 'left' : 'right';
    } else if (vy < 0) {
      this.play('walk-up', true);
      this.setFlipX(false);
      this.facing = 'up';
    } else {
      this.play('walk-down', true);
      this.setFlipX(false);
      this.facing = 'down';
    }
  }
}
