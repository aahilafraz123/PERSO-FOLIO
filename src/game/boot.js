import Phaser from 'phaser';
import { gameConfig } from '../config/gameConfig.js';

// The Phaser game is created lazily — only when the player actually enters PLAY
// mode — so the landing/read site loads instantly and the game loop never runs
// underneath the website. Dynamically imported by the router (code-splits Phaser
// out of the initial bundle).

let game = null;

export async function bootGame() {
  if (!game) {
    // Wait for the web fonts (JetBrains Mono / Orbitron) before creating any
    // Phaser text — otherwise the FIRST cards get word-wrapped with fallback-font
    // metrics, then re-render wider once the real font loads, spilling past the
    // canvas edges (the letterbox "vertical bars" chopping the narration). Timeout
    // guard so a hung font fetch can never block the game from starting.
    try {
      await Promise.race([
        document.fonts?.ready,
        new Promise((r) => setTimeout(r, 1500)),
      ]);
    } catch { /* fonts API unavailable — boot anyway */ }
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
