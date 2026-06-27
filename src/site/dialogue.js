/**
 * dialogue.js — sign / NPC speech as a DOM overlay (not in the Phaser canvas).
 *
 * A DOM bar pinned to the real viewport bottom is immune to canvas scaling — it
 * is ALWAYS readable. Bridge pattern, same as the screen modals:
 *   game → `relentless:dialogue` { pages | text, speaker }  (freezes the scene)
 *   here → `relentless:dialogue-close`                       (unfreezes the scene)
 *
 * v2: PAGING. A sign is a two-beat — page 1 the artifact (quote), page 2 the
 * inner response. `pages` is an array; `text` (string) still works for NPCs.
 * Press E/Space: complete the typewriter, then advance pages, then close.
 */

let el = null;
let pages = [''];
let pageIndex = 0;
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

function renderPage() {
  if (!el) return;
  full = pages[pageIndex] || '';
  i = 0;
  const textEl = el.querySelector('.dlg-text');
  const hintEl = el.querySelector('.dlg-hint');
  textEl.textContent = '';
  if (hintEl) hintEl.textContent = pageIndex < pages.length - 1 ? '▸ E / Space' : '▸ E to close';

  clearInterval(timer);
  timer = setInterval(() => {
    i += 1;
    textEl.textContent = full.slice(0, i);
    if (i >= full.length) clearInterval(timer);
  }, 18);
}

function show(payload, speaker) {
  if (!el) el = buildEl();
  openedAt = performance.now();
  pages = (Array.isArray(payload) ? payload : [payload])
    .filter((p) => p != null && p !== '');
  if (pages.length === 0) pages = [''];
  pageIndex = 0;

  const speakerEl = el.querySelector('.dlg-speaker');
  speakerEl.textContent = speaker || '';
  speakerEl.style.display = speaker ? 'block' : 'none';

  requestAnimationFrame(() => el && el.classList.add('open'));
  renderPage();
}

// one key press = one action: finish typing → advance page → close
function advanceOrClose() {
  if (typing()) { complete(); return; }
  if (pageIndex < pages.length - 1) { pageIndex += 1; renderPage(); return; }
  close();
}

export function initDialogue() {
  window.addEventListener('relentless:dialogue', (e) => {
    const payload = e.detail.pages != null ? e.detail.pages : e.detail.text;
    show(payload, e.detail.speaker);
  });

  window.addEventListener(
    'keydown',
    (e) => {
      if (!el) return;
      const k = e.key;
      if (k !== 'e' && k !== 'E' && k !== ' ' && k !== 'Enter' && k !== 'Escape') return;
      // ignore the same press that opened the bar
      if (performance.now() - openedAt < 200) { e.preventDefault(); return; }
      e.preventDefault();
      e.stopPropagation();
      if (k === 'Escape') { close(); return; }
      advanceOrClose();
    },
    true, // capture, so it beats other handlers while a line is open
  );
}
