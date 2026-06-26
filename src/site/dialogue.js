/**
 * dialogue.js — sign / NPC speech as a DOM overlay (not in the Phaser canvas).
 *
 * The in-canvas dialogue box kept getting clipped when the canvas overflowed the
 * viewport. A DOM bar pinned to the real viewport bottom is immune to all canvas
 * scaling — it is ALWAYS readable. Same bridge pattern as the screen modals:
 *   game → `relentless:dialogue` {text, speaker}   (freezes the scene)
 *   here → `relentless:dialogue-close`             (unfreezes the scene)
 */

let el = null;
let full = '';
let i = 0;
let timer = null;
let openedAt = 0;

function buildEl() {
  const root = document.createElement('div');
  root.id = 'dialogue-bar';
  root.innerHTML = `
    <div class="dlg-inner">
      <span class="dlg-speaker"></span>
      <p class="dlg-text"></p>
      <span class="dlg-hint">▸ E / Space</span>
    </div>`;
  document.body.appendChild(root);
  return root;
}

function close() {
  if (!el) return;
  clearInterval(timer);
  el.classList.remove('open');
  const node = el;
  el = null;
  setTimeout(() => node.remove(), 200);
  window.dispatchEvent(new Event('relentless:dialogue-close'));
}

function complete() {
  clearInterval(timer);
  i = full.length;
  if (el) el.querySelector('.dlg-text').textContent = full;
}

function typing() {
  return i < full.length;
}

function show(text, speaker) {
  if (!el) el = buildEl();
  openedAt = performance.now();
  full = text || '';
  i = 0;

  const textEl = el.querySelector('.dlg-text');
  const speakerEl = el.querySelector('.dlg-speaker');
  speakerEl.textContent = speaker || '';
  speakerEl.style.display = speaker ? 'block' : 'none';
  textEl.textContent = '';

  requestAnimationFrame(() => el && el.classList.add('open'));

  clearInterval(timer);
  timer = setInterval(() => {
    i += 1;
    textEl.textContent = full.slice(0, i);
    if (i >= full.length) clearInterval(timer);
  }, 18);
}

export function initDialogue() {
  window.addEventListener('relentless:dialogue', (e) => {
    show(e.detail.text, e.detail.speaker);
  });

  window.addEventListener(
    'keydown',
    (e) => {
      if (!el) return;
      const k = e.key;
      if (k !== 'e' && k !== 'E' && k !== ' ' && k !== 'Enter' && k !== 'Escape') return;
      // ignore the same press that opened it
      if (performance.now() - openedAt < 200) { e.preventDefault(); return; }
      e.preventDefault();
      e.stopPropagation();
      if (k === 'Escape') { close(); return; }
      if (typing()) complete();
      else close();
    },
    true, // capture, so it beats other handlers while a line is open
  );
}
