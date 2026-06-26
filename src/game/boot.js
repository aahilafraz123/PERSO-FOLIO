import Phaser from 'phaser';
import { gameConfig } from '../config/gameConfig.js';

// The Phaser game is created lazily — only when the player actually enters PLAY
// mode — so the landing/read site loads instantly and the game loop never runs
// underneath the website. Dynamically imported by the router (code-splits Phaser
// out of the initial bundle).

let game = null;

export function bootGame() {
  if (!game) {
    game = new Phaser.Game(gameConfig);
    if (import.meta.env?.DEV) window.game = game;
  } else {
    // Returning from the website — wake the loop back up.
    game.loop.wake();
  }
  return game;
}

export function sleepGame() {
  if (game) game.loop.sleep(); // stop rendering/updating while the site is shown
}
