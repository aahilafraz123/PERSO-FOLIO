import Phaser from 'phaser';
import { gameConfig } from '../config/gameConfig.js';
import { GameState } from '../systems/state.js';

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
    if (import.meta.env?.DEV) installDevBridge(game);
  } else {
    // Returning from the website — wake the loop back up.
    game.loop.wake();
  }
  return game;
}

export function sleepGame() {
  if (game) game.loop.sleep(); // stop rendering/updating while the site is shown
}

/**
 * DEV-only test bridge — lets the preview/MCP loop drive the game headlessly
 * (Phaser canvas state can't be asserted via the DOM). Exposed on window.__game.
 */
function installDevBridge(g) {
  window.game = g;
  const zone = () => g.scene.getScene('zone');
  const KEYCODES = { E: 'KeyE', SPACE: 'Space', W: 'KeyW', A: 'KeyA', S: 'KeyS', D: 'KeyD', ESC: 'Escape' };
  const kev = (type, key) => window.dispatchEvent(
    new KeyboardEvent(type, { code: KEYCODES[key] || key, key, bubbles: true }),
  );

  window.__game = {
    get game() { return g; },
    get scene() { return zone(); },
    get state() { return GameState; },
    jumpToZone(key) {
      const sm = g.scene;
      if (sm.isActive('zone')) zone().scene.restart({ zoneKey: key });
      else sm.start('zone', { zoneKey: key });
    },
    torchRadius() { return zone()?.light?.torchRadius ?? null; },
    torchFloor() { return zone()?.torch?.floor ?? null; },
    // movement: drive Phaser's Key objects directly — synthetic DOM KeyboardEvents
    // don't carry a keyCode, so Phaser ignores them. WASD only (what Player reads).
    hold(key) { const k = zone()?.keys?.[key]; if (k) { k.isDown = true; k.isUp = false; } },
    release(key) { const k = zone()?.keys?.[key]; if (k) { k.isDown = false; k.isUp = true; } },
    // interact like the real key: fire activate() on the nearest interactable
    interact() { const z = zone(); if (z?.near && !z.frozen && !z._miniGame) z.activate(z.near); },
    press(key) { kev('keydown', key); kev('keyup', key); }, // best-effort DOM tap
    // manually advance the Phaser loop — headless preview tabs are backgrounded,
    // so requestAnimationFrame is paused and the game would never tick otherwise.
    tick(seconds = 2, fps = 60) {
      const steps = Math.round(seconds * fps);
      const dt = 1000 / fps;
      let t = g.loop.time || performance.now();
      for (let i = 0; i < steps; i++) { t += dt; g.loop.step(t); }
      return steps;
    },
    mini() { return zone()?._miniGame ?? null; },                // active minigame
    miniHit() { zone()?._miniGame?.hit(); },
    miniResolve(score = 0.8) { zone()?._miniGame?.resolve(score); },
    snapshot() {
      const z = zone();
      return {
        zone: z?.zone?.key, frozen: z?.frozen, mini: !!z?._miniGame,
        torch: z?.light?.torchRadius, floor: z?.torch?.floor,
        xp: GameState.xp, level: GameState.level,
        shards: GameState.collectedShards.size, relics: GameState.relics.size,
        secrets: GameState.secrets.size, meetings: GameState.meetingCount,
        achievements: GameState.achievements.map((a) => a.title),
      };
    },
  };
}
