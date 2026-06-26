import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig.js';

// Boot the game. Everything else lives in scenes.
// eslint-disable-next-line no-new
new Phaser.Game(gameConfig);
