/**
 * cards.js — full-screen narration overlays as DOM, NOT Phaser canvas text.
 *
 * Phaser's canvas text measures web fonts (JetBrains Mono / Orbitron) with one
 * set of metrics and renders them with another, so wrapped lines spilled past
 * the canvas edges (the letterbox "vertical bars" chopping the narration). DOM
 * uses the actually-loaded fonts and wraps with CSS — it can never clip. Same
 * bridge as the dialogue bar: the SCENE owns timing and dispatches show/hide,
 * this module only renders.
 *
 *   relentless:card        { title?, sub?, body?, variant? }   ·  relentless:card-hide
 *   relentless:objective   { text }                            ·  relentless:objective-hide
 */

let cardEl = null;
let objEl = null;

function ensureCard() {
  if (cardEl) return cardEl;
  cardEl = document.createElement('div');
  cardEl.id = 'game-card';
  cardEl.innerHTML =
    '<div class="gc-inner"><h2 class="gc-title"></h2><p class="gc-sub"></p><p class="gc-body"></p></div>'
    + '<span class="gc-hint"></span>';
  document.body.appendChild(cardEl);
  return cardEl;
}

function showCard({ title = '', sub = '', body = '', variant = 'body', hint = '' } = {}) {
  ensureCard();
  const set = (sel, txt) => {
    const n = cardEl.querySelector(sel);
    n.textContent = txt;
    n.style.display = txt ? '' : 'none';
  };
  set('.gc-title', title);
  set('.gc-sub', sub);
  set('.gc-body', body);
  set('.gc-hint', hint);
  cardEl.querySelector('.gc-inner').className = `gc-inner gc-${variant}`;
  requestAnimationFrame(() => cardEl && cardEl.classList.add('open'));
}

function hideCard() {
  if (cardEl) cardEl.classList.remove('open');
}

function ensureObj() {
  if (objEl) return objEl;
  objEl = document.createElement('div');
  objEl.id = 'game-objective';
  document.body.appendChild(objEl);
  return objEl;
}

function showObjective(text) {
  ensureObj();
  objEl.textContent = text || '';
  objEl.classList.toggle('open', !!text);
}

function hideObjective() {
  if (objEl) objEl.classList.remove('open');
}

export function initCards() {
  window.addEventListener('relentless:card', (e) => showCard(e.detail || {}));
  window.addEventListener('relentless:card-hide', hideCard);
  window.addEventListener('relentless:objective', (e) => showObjective(e.detail?.text));
  window.addEventListener('relentless:objective-hide', hideObjective);
  // leaving the game wipes any lingering narration
  window.addEventListener('relentless:exit', () => { hideCard(); hideObjective(); });
}
