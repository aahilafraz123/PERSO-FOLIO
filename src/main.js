import './site/site.css';
import { initScreens } from './site/screens.js';
import { initDialogue } from './site/dialogue.js';
import { initCards } from './site/cards.js';
import { initHero } from './site/hero.js';
import { resumeAudio } from './systems/audio.js';

// Browsers gate Web Audio behind a user gesture — resume on the first one so the
// prologue's sound (lamp hum, whooshes, the torch) can play.
['pointerdown', 'keydown'].forEach((evt) =>
  window.addEventListener(evt, () => resumeAudio()),
);

// ---------------------------------------------------------------------------
// RELENTLESS — site shell
// A real website (landing + readable bio) is the front door. Choosing PLAY
// lazily boots the Phaser game and goes fully immersive (chrome stripped away).
// ---------------------------------------------------------------------------

const body = document.body;
let bootGame = null; // resolved lazily on first PLAY
let sleepGame = null;

// --- routing ---------------------------------------------------------------
const ROUTES = {
  '': 'landing',
  '#/': 'landing',
  '#/read': 'read',
  '#/play': 'play',
};

async function enterPlay() {
  body.classList.add('playing');
  // Load the game module on demand the first time only.
  if (!bootGame) {
    const mod = await import('./game/boot.js');
    bootGame = mod.bootGame;
    sleepGame = mod.sleepGame;
  }
  // Parent (#game) is full-viewport even when hidden (visibility, not display),
  // so Phaser's Scale.FIT measures correctly the moment we boot.
  bootGame();
}

function leavePlay() {
  body.classList.remove('playing');
  if (sleepGame) sleepGame();
}

const progressNav = document.getElementById('read-progress');

// --- chapter temperature shift (read view only) ----------------------------
const blobViolet = document.querySelector('.blob-violet');
const blobCyan   = document.querySelector('.blob-cyan');
const tempOverlays = {};
document.querySelectorAll('.bg-temp[data-temp]').forEach((el) => {
  tempOverlays[el.dataset.temp] = el;
});

const midPlane = document.getElementById('mid-plane');
const midArts = {};
document.querySelectorAll('.mid-art[data-chapter]').forEach((el) => {
  midArts[el.dataset.chapter] = el;
});

window.addEventListener('scroll', () => {
  if (midPlane) midPlane.style.transform = `translateY(${window.scrollY * 0.25}px)`;
}, { passive: true });

const MOOD_BLOBS = {
  wilderness: { b1: '#2a4cff', b2: '#1540cc' },
  forge:      { b1: '#ff6a00', b2: '#cc3300' },
  mission:    { b1: '#00bcd4', b2: '#006688' },
  arena:      { b1: '#ffb800', b2: '#ff8000' },
};

function setReadMood(mood) {
  Object.values(tempOverlays).forEach((el) => el.classList.remove('active'));
  if (mood) tempOverlays[mood]?.classList.add('active');

  Object.values(midArts).forEach((el) => el.classList.remove('active'));
  if (mood) midArts[mood]?.classList.add('active');

  const cols = mood ? MOOD_BLOBS[mood] : null;
  if (cols) {
    blobViolet?.style.setProperty('--blob1-col', cols.b1);
    blobCyan?.style.setProperty('--blob2-col', cols.b2);
  } else {
    blobViolet?.style.removeProperty('--blob1-col');
    blobCyan?.style.removeProperty('--blob2-col');
  }
}

function route() {
  const view = ROUTES[location.hash] ?? 'landing';

  if (view === 'play') {
    enterPlay();
    progressNav?.classList.remove('visible');
    return;
  }

  leavePlay();
  document.querySelectorAll('.view').forEach((el) => {
    el.classList.toggle('active', el.dataset.view === view);
  });
  // a fresh view starts at the top
  window.scrollTo(0, 0);
  revealOnLoad(view);

  if (view === 'read') {
    progressNav?.classList.add('visible');
    initReadProgress();
    setReadMood('wilderness');
  } else {
    progressNav?.classList.remove('visible');
    setReadMood(null);
    if (midPlane) midPlane.style.transform = '';
  }
}

window.addEventListener('hashchange', route);

// Esc from inside the game (emitted by the scene when no dialogue is open)
// returns to the landing page.
window.addEventListener('relentless:exit', () => {
  location.hash = '#/';
});

// --- heading scramble ------------------------------------------------------
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ▓░▒█◆◇';

function scrambleHeading(h3) {
  const real = h3.textContent;
  const start = performance.now();
  const duration = 520;
  function tick(now) {
    const p = Math.min(1, (now - start) / duration);
    h3.textContent = real.split('').map((c, i) => {
      if (c === ' ') return ' ';
      return i / real.length < p ? c : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
    }).join('');
    if (p < 1) requestAnimationFrame(tick);
    else h3.textContent = real;
  }
  requestAnimationFrame(tick);
}

// --- scroll-reveal for the read view ---------------------------------------
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        const h3 = e.target.querySelector('h3');
        if (h3) setTimeout(() => scrambleHeading(h3), 180);
        io.unobserve(e.target);
      }
    });
  },
  { threshold: 0.18 },
);

function revealOnLoad(view) {
  if (view !== 'read') return;
  // Delay so the page renders first — without this, chapters already in the
  // viewport get .in-view added before the user sees them, hiding the animation
  setTimeout(() => {
    document
      .querySelectorAll('#view-read .reveal:not(.in-view)')
      .forEach((el) => io.observe(el));
  }, 120);
}

// --- read progress sidebar --------------------------------------------------
const CHAPTERS = ['wilderness', 'forge', 'mission', 'arena'];
let readProgressInited = false;

function initReadProgress() {
  if (readProgressInited) return;
  readProgressInited = true;

  const dots = Object.fromEntries(
    CHAPTERS.map((k) => [k, progressNav?.querySelector(`.rp-dot[data-chapter="${k}"]`)])
  );
  const connectors = Object.fromEntries(
    ['wilderness', 'forge', 'mission'].map((k) => [k, progressNav?.querySelector(`.rp-connector[data-fill="${k}"]`)])
  );

  let active = null;

  const chapterObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        const chapter = e.target.dataset.mood;
        if (!chapter || !CHAPTERS.includes(chapter)) return;
        const idx = CHAPTERS.indexOf(chapter);

        if (e.isIntersecting) {
          active = chapter;
          setReadMood(chapter);
          CHAPTERS.forEach((k, i) => {
            dots[k]?.classList.toggle('active', i <= idx);
          });
          ['wilderness', 'forge', 'mission'].forEach((k, i) => {
            connectors[k]?.classList.toggle('filled', i < idx);
          });
        }
      });
    },
    { threshold: 0.3 },
  );

  CHAPTERS.forEach((k) => {
    const el = document.getElementById(`ch-${k}`);
    if (el) chapterObs.observe(el);
  });

  // dot clicks scroll to chapter
  CHAPTERS.forEach((k) => {
    dots[k]?.addEventListener('click', () => {
      document.getElementById(`ch-${k}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// --- periodic glitch trigger on hero name ----------------------------------
const heroName = document.querySelector('.hero-name');
if (heroName) {
  function fireGlitch() {
    heroName.classList.add('glitch-hit');
    setTimeout(() => heroName.classList.remove('glitch-hit'), 600);
    // next hit: random 5–8 s
    setTimeout(fireGlitch, 5000 + Math.random() * 3000);
  }
  // first hit after 3 s so the page has settled
  setTimeout(fireGlitch, 3000);
}

// --- The Vault modal --------------------------------------------------------
(function initVault() {
  const modal    = document.getElementById('vault-modal');
  const trigger  = document.getElementById('vault-trigger');
  const closeBtn = document.getElementById('vault-close');
  const backdrop = document.getElementById('vault-backdrop');
  if (!modal || !trigger) return;

  function openVault() {
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('open'));
    document.body.style.overflow = 'hidden';
    closeBtn?.focus();
  }

  function closeVault() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    modal.addEventListener('transitionend', () => { modal.hidden = true; }, { once: true });
    trigger?.focus();
  }

  trigger.addEventListener('click', openVault);
  closeBtn?.addEventListener('click', closeVault);
  backdrop?.addEventListener('click', closeVault);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeVault();
  });
})();

// --- proof receipt links (read view) ----------------------------------------
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-screen]');
  if (el) window.dispatchEvent(new CustomEvent('relentless:screen', { detail: { id: el.dataset.screen } }));
});

// --- year stamp + boot -----------------------------------------------------
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = '2026';

initScreens(); // PC-screen artifact modals (NASA email, résumé, contact…)
initDialogue(); // sign / NPC speech as a viewport-pinned DOM bar (never clipped)
initCards(); // in-game narration cards + inner-voice line as DOM (never clipped)
initHero(document.getElementById('hero-particles')); // particle-initials title

route();
