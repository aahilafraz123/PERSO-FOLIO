/**
 * audio.js — tiny synthesized SFX via the Web Audio API (GDD §11.7, no files).
 *
 * Sound is the narrator of RELENTLESS — there is no voiceover, so these cues
 * carry the emotional turns: the lamp hum of the ordinary world, the whoosh of
 * an application fired into the void, the cut to dead silence, the crackle of
 * the torch you finally carry. All generated at runtime; swap for curated SFX
 * later if desired.
 *
 * Browsers suspend audio until a user gesture — call resumeAudio() from a click
 * or keypress (we do it on the PLAY interaction) before expecting sound.
 */

let ctx = null;
let master = null;

function getCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(ctx.destination);
  return ctx;
}

export function resumeAudio() {
  const c = getCtx();
  if (c && c.state === 'suspended') c.resume();
}

function noiseBuffer(c, seconds = 1) {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

// --- lamp / room hum: a low drone that holds until lights-out ---------------
let humNodes = null;
export function startHum() {
  const c = getCtx();
  if (!c || humNodes) return;
  const g = c.createGain();
  g.gain.value = 0.0;
  g.gain.linearRampToValueAtTime(0.05, c.currentTime + 1.2);
  const o1 = c.createOscillator();
  o1.type = 'sine';
  o1.frequency.value = 58;
  const o2 = c.createOscillator();
  o2.type = 'sine';
  o2.frequency.value = 116;
  const o2g = c.createGain();
  o2g.gain.value = 0.4;
  o1.connect(g);
  o2.connect(o2g).connect(g);
  g.connect(master);
  o1.start();
  o2.start();
  humNodes = { o1, o2, g };
}

export function stopHum(fast = false) {
  const c = getCtx();
  if (!c || !humNodes) return;
  const { o1, o2, g } = humNodes;
  const t = c.currentTime;
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(g.gain.value, t);
  g.gain.linearRampToValueAtTime(0.0, t + (fast ? 0.08 : 0.5));
  o1.stop(t + (fast ? 0.1 : 0.55));
  o2.stop(t + (fast ? 0.1 : 0.55));
  humNodes = null;
}

// --- application whoosh: a short noise sweep ---------------------------------
export function whoosh() {
  const c = getCtx();
  if (!c) return;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 0.3);
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(400, c.currentTime);
  bp.frequency.exponentialRampToValueAtTime(2600, c.currentTime + 0.22);
  bp.Q.value = 0.8;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0, c.currentTime);
  g.gain.linearRampToValueAtTime(0.12, c.currentTime + 0.03);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.28);
  src.connect(bp).connect(g).connect(master);
  src.start();
  src.stop(c.currentTime + 0.3);
}

// --- lights-out: a low thud that drops into nothing --------------------------
export function lightsOutThud() {
  const c = getCtx();
  if (!c) return;
  const o = c.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(140, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(32, c.currentTime + 0.5);
  const g = c.createGain();
  g.gain.setValueAtTime(0.18, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.7);
  o.connect(g).connect(master);
  o.start();
  o.stop(c.currentTime + 0.72);
}

// --- torch crackle: looping low filtered noise -------------------------------
let crackleNodes = null;
export function startCrackle() {
  const c = getCtx();
  if (!c || crackleNodes) return;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 2);
  src.loop = true;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 900;
  const g = c.createGain();
  g.gain.value = 0.0;
  g.gain.linearRampToValueAtTime(0.04, c.currentTime + 0.6);
  // subtle flicker on the crackle volume
  const lfo = c.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 7;
  const lfoG = c.createGain();
  lfoG.gain.value = 0.02;
  lfo.connect(lfoG).connect(g.gain);
  src.connect(lp).connect(g).connect(master);
  src.start();
  lfo.start();
  crackleNodes = { src, lfo, g };
}

export function stopCrackle() {
  const c = getCtx();
  if (!c || !crackleNodes) return;
  const { src, lfo, g } = crackleNodes;
  g.gain.linearRampToValueAtTime(0.0, c.currentTime + 0.3);
  src.stop(c.currentTime + 0.35);
  lfo.stop(c.currentTime + 0.35);
  crackleNodes = null;
}

// --- warm swell / ignite: when light is made -------------------------------
export function ignite() {
  const c = getCtx();
  if (!c) return;
  const o = c.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(220, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(660, c.currentTime + 0.3);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0, c.currentTime);
  g.gain.linearRampToValueAtTime(0.1, c.currentTime + 0.05);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.6);
  o.connect(g).connect(master);
  o.start();
  o.stop(c.currentTime + 0.62);
}
