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
let bannerEl = null;
let beatEl = null;

function ensureCard() {
  if (cardEl) return cardEl;
  cardEl = document.createElement('div');
  cardEl.id = 'game-card';
  cardEl.innerHTML = '<div class="gc-inner"></div><span class="gc-hint"></span>';
  document.body.appendChild(cardEl);
  return cardEl;
}

// Renders any of: the cinematic LEVEL card, the 2nd-person briefing, or the
// standard title/body narration. Inner HTML is rebuilt per variant.
function showCard({ title = '', sub = '', body = '', variant = 'body', hint = '', level = null, name = '', accent = '', position = '', recap = '' } = {}) {
  ensureCard();
  const inner = cardEl.querySelector('.gc-inner');
  inner.className = `gc-inner gc-${variant}`;
  if (accent) inner.style.setProperty('--accent', accent); else inner.style.removeProperty('--accent');

  if (variant === 'level') {
    inner.innerHTML = `<div class="gc-levelnum">LEVEL ${level}</div>`
      + `<h2 class="gc-levelname">${name}</h2>`
      + (sub ? `<p class="gc-leveltag">${sub}</p>` : '')
      + (position ? `<div class="gc-position">${position}</div>` : '');
  } else if (variant === 'briefing') {
    inner.innerHTML = (recap ? `<p class="gc-recap">${recap}</p>` : '')
      + `<p class="gc-brief">${body}</p>`;
  } else {
    inner.innerHTML = (title ? `<h2 class="gc-title">${title}</h2>` : '')
      + (sub ? `<p class="gc-sub">${sub}</p>` : '')
      + (body ? `<p class="gc-body">${body}</p>` : '');
  }
  cardEl.querySelector('.gc-hint').textContent = hint || '';
  requestAnimationFrame(() => cardEl && cardEl.classList.add('open'));
}

function hideCard() {
  if (cardEl) cardEl.classList.remove('open');
}

// --- objective banner: the level goal + live progress (top-center) ----------
function ensureBanner() {
  if (bannerEl) return bannerEl;
  bannerEl = document.createElement('div');
  bannerEl.id = 'game-objbanner';
  document.body.appendChild(bannerEl);
  return bannerEl;
}

function showBanner({ label = '', text = '', complete = false } = {}) {
  ensureBanner();
  bannerEl.innerHTML = `<span class="ob-mark">◈</span><span class="ob-label">${label}</span>`
    + (text ? `<span class="ob-sep">·</span><span class="ob-text">${text}</span>` : '');
  bannerEl.classList.toggle('complete', !!complete);
  bannerEl.classList.add('open');
}

function hideBanner() { if (bannerEl) bannerEl.classList.remove('open'); }

// --- situational beat: a brief, non-blocking context toast (2nd person) ------
function showBeat(text) {
  if (!beatEl) {
    beatEl = document.createElement('div');
    beatEl.id = 'game-beat';
    document.body.appendChild(beatEl);
  }
  beatEl.textContent = text || '';
  beatEl.classList.add('open');
  clearTimeout(beatEl._t);
  beatEl._t = setTimeout(() => beatEl && beatEl.classList.remove('open'), 3000);
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
  window.addEventListener('relentless:objbanner', (e) => showBanner(e.detail || {}));
  window.addEventListener('relentless:objbanner-hide', hideBanner);
  window.addEventListener('relentless:beat', (e) => showBeat(e.detail?.text));
  // leaving the game wipes any lingering narration
  window.addEventListener('relentless:exit', () => { hideCard(); hideObjective(); hideBanner(); });
}
