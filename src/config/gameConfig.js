import Phaser from 'phaser';
import BootScene from '../scenes/BootScene.js';
import ForestScene from '../scenes/ForestScene.js';
import { VIEW_W, VIEW_H } from './constants.js';

// Re-export for convenience.
export { TILE, VIEW_W, VIEW_H } from './constants.js';

export const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: VIEW_W,
  height: VIEW_H,
  backgroundColor: '#05060a',

  // The pixel-art holy trinity. Do not touch these without a good reason.
  pixelArt: true,
  antialias: false,
  roundPixels: true,

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false, // flip to true to see collision boxes
    },
  },

  scene: [BootScene, ForestScene],
};
