/**
 * screens.js — the PC-screen artifact modals (GDD §4).
 *
 * The game dispatches `relentless:screen` with an id; we render a CRT-framed DOM
 * overlay above the canvas (crisper + more readable than in-world Phaser text),
 * and dispatch `relentless:screen-close` when dismissed so the scene unfreezes.
 *
 * Each artifact is real content from Aahil's story — the NASA email is rendered
 * faithfully from the actual message (drop a real screenshot at
 * public/assets/screens/nasa_email.png to swap it for the image).
 */

const SCREENS = {
  rejections: {
    title: 'INBOX — 0 unread offers',
    body: `
      <div class="crt-inbox">
        <div class="crt-row"><span class="crt-from">Recruiting</span><span class="crt-subj">Re: Software Co-op — Round A</span><span class="crt-x">✕</span></div>
        <div class="crt-row"><span class="crt-from">Talent Team</span><span class="crt-subj">Update on your application — Round B</span><span class="crt-x">✕</span></div>
        <div class="crt-row"><span class="crt-from">HR</span><span class="crt-subj">Your application — Round C</span><span class="crt-x">✕</span></div>
        <div class="crt-row"><span class="crt-from">No-Reply</span><span class="crt-subj">This position has been closed</span><span class="crt-x">✕</span></div>
      </div>`,
    caption: 'Round A. Round B. Round C. Zero interviews. The path was never lit — so I made my own light.',
  },

  'hollow-landing': {
    title: 'company-landing-page.html',
    body: `
      <div class="crt-browser">
        <div class="crt-url">http://localhost:3000  ·  "production"</div>
        <div class="crt-page">
          <div class="crt-skel crt-skel-h"></div>
          <div class="crt-skel"></div>
          <div class="crt-skel crt-skel-s"></div>
          <div class="crt-btnghost">Get Started</div>
        </div>
      </div>`,
    caption: 'They called localhost "production" and shipped my work as theirs. I learned what good structure was by surviving the total absence of it.',
  },

  resume: {
    title: 'resume — boot log',
    body: `
      <pre class="crt-term">> loading aahil.afraz ...
> role        : Software Engineer
> shipped     : Redis caching layer
> migrated    : 30+ components  Angular -> React
> impact      : -25% bundle   -35% load time
> founded     : LearnFlow (150+ users)
> recognized  : NASA Space Apps — Global Nominee
> now         : in the arena — moving the needle
> status      : <span class="crt-ok">RELENTLESS</span>
> _</pre>`,
    caption: 'Real wins in a quiet room. The work spoke even when no one else did.',
  },

  learnflow: {
    title: 'LearnFlow — demo',
    body: `
      <div class="crt-app">
        <div class="crt-app-top">LearnFlow <span class="crt-pill">150+ users</span></div>
        <div class="crt-app-grid">
          <div class="crt-card">OCR<br><small>Google Vision</small></div>
          <div class="crt-card">Transcription<br><small>Whisper</small></div>
          <div class="crt-card">Explanations<br><small>GPT-4</small></div>
          <div class="crt-card">Retrieval<br><small>6-stage pipeline</small></div>
          <div class="crt-card">Desktop<br><small>Electron</small></div>
          <div class="crt-card">Data<br><small>Supabase</small></div>
        </div>
      </div>`,
    caption: 'Built it myself. Forged six systems into one tool. Thirty-hour weeks. Pitched to anyone who would listen.',
  },

  nasa: {
    title: 'mail — community@spaceappschallenge.org',
    body: `
      <div class="crt-email" data-img="./assets/screens/nasa_email.png">
        <div class="crt-email-head">
          <div class="crt-avatar">🚀</div>
          <div>
            <div class="crt-email-from">NASA Space Apps Challenge</div>
            <div class="crt-email-meta">community@spaceappschallenge.org · Nov 5, 2025</div>
          </div>
          <div class="crt-star">★</div>
        </div>
        <div class="crt-email-body">
          <p><strong>Aahil Afraz —</strong></p>
          <p><strong>Congratulations!</strong></p>
          <p>In the absence of a public announcement, we are writing directly to inform the following teams of their <strong>Global Nominee</strong> status:</p>
          <p class="crt-email-team"><strong>Team: Relentless</strong><br>Event: Universal Event</p>
          <p>My team has been chosen as one of the <strong>1,290+ Global Nominees</strong> selected from Local Events and the Universal Event. #SpaceApps participants submitted over <strong>11,500 projects</strong> — and mine stood out as a Global Nominee in the 2025 NASA Space Apps Challenge.</p>
          <p class="crt-email-foot">— NASA Space Apps Global Organizing Team</p>
        </div>
      </div>`,
    caption: 'Team Relentless — 2025 NASA Space Apps Global Nominee. ~1,290 teams of 11,500+ projects, worldwide.',
  },

  comcast: {
    title: 'mail — University Relations · Comcast',
    body: `
      <div class="crt-email" data-img="./assets/screens/comcast_offer.png">
        <div class="crt-email-head">
          <div class="crt-avatar">📡</div>
          <div>
            <div class="crt-email-from">Comcast University Relations</div>
            <div class="crt-email-meta">universityrelations@comcast.com · Spring 2026</div>
          </div>
          <div class="crt-star">★</div>
        </div>
        <div class="crt-email-body">
          <p><strong>Congratulations!</strong></p>
          <p>On behalf of the Comcast University Relations Team, we are thrilled to welcome you to the <strong>Spring 2026 Co-op Program</strong>.</p>
          <p>We are so excited that you've accepted our offer and look forward to an engaging, educational, and fun summer together.</p>
          <p class="crt-email-foot">— Comcast University Relations Team</p>
        </div>
      </div>`,
    caption: 'From zero interviews to Comcast. The wilderness was worth it.',
  },

  aircast: {
    title: 'AirCast — air quality forecast',
    body: `
      <div class="crt-map">
        <div class="crt-map-grid"></div>
        <span class="crt-marker" style="left:22%;top:38%">NO₂</span>
        <span class="crt-marker" style="left:58%;top:24%">O₃</span>
        <span class="crt-marker" style="left:71%;top:62%">PM2.5</span>
        <span class="crt-marker" style="left:38%;top:70%">AQI</span>
      </div>`,
    caption: 'AI air-quality forecasting on NASA TEMPO satellite data + OpenAQ + OpenWeather. 6-hour AQI predictions, deployed on Azure with CI/CD.',
    action: { label: 'View AirCast on GitHub ↗', go: 'https://github.com/allenvarghese05/aircast-nasa-hackathon', external: true },
  },

  calendar: {
    title: 'your calendar — this week',
    body: `
      <div class="crt-cal crt-cal-full">
        ${Array.from({ length: 30 }).map((_, i) => `<div class="crt-evt">${['Standup', 'Sync', '1:1', 'Review', 'Planning', 'Demo'][i % 6]}</div>`).join('')}
      </div>`,
    caption: 'More meetings in a week than most have in a month. Too many to make them all — grateful to be the one carrying the load.',
  },

  'teammate-calendar': {
    title: "teammate's calendar — this week",
    body: `
      <div class="crt-cal">
        <div class="crt-evt">Standup</div>
        <div class="crt-evt">1:1</div>
        <div class="crt-cal-empty">· · · open · · ·</div>
      </div>`,
    caption: 'Two meetings. A calm week. Same building, different gear.',
  },

  contact: {
    title: 'contact — let\'s build something',
    body: `
      <pre class="crt-term" id="contact-boot"></pre>
      <div class="crt-contact" id="contact-links" style="opacity:0;transition:opacity .6s">
        <a href="#" data-edit>LinkedIn ↗</a>
        <a href="#" data-edit>GitHub ↗</a>
        <a href="#" data-edit>Email ↗</a>
      </div>`,
    // the contact terminal boots up and prints itself line-by-line (see runTyper)
    typer: [
      '> establishing connection ...',
      '> identity   : Aahil Afraz',
      '> role       : Software Engineer',
      '> status     : open to building something that matters',
      '>',
      '> reach me below ↓',
    ],
    caption: 'That was my story — the real one. If you felt any of it, that was the whole point. Let\'s build something.',
  },

  'read-hatch': {
    title: 'prefer the plain version?',
    body: `<div class="crt-hatch">For recruiters and the busy: the same story, in clean editorial words. No game required.</div>`,
    caption: '',
    action: { label: 'Open the written story →', go: '#/read' },
  },
};

let active = null;

// type a screen's `typer` lines into its boot terminal, then reveal the links.
// setInterval-based (not rAF) so it still advances in a backgrounded tab.
function runTyper(root, lines) {
  const pre = root.querySelector('#contact-boot');
  const links = root.querySelector('#contact-links');
  if (!pre) return;
  let shown = '';
  let li = 0;
  let ci = 0;
  const step = () => {
    if (!root.isConnected) return; // modal closed mid-type
    if (li >= lines.length) { if (links) links.style.opacity = '1'; return; }
    const line = lines[li];
    if (ci <= line.length) { pre.textContent = `${shown}${line.slice(0, ci)}`; ci += 1; setTimeout(step, 20); }
    else { shown += `${line}\n`; li += 1; ci = 0; setTimeout(step, 220); }
  };
  step();
}

function close() {
  if (!active) return;
  active.classList.add('closing');
  const el = active;
  active = null;
  setTimeout(() => el.remove(), 220);
  window.dispatchEvent(new Event('relentless:screen-close'));
}

function open(id) {
  const s = SCREENS[id];
  if (!s) return;
  close();

  const root = document.createElement('div');
  root.className = 'screen-modal';
  root.innerHTML = `
    <div class="screen-backdrop"></div>
    <div class="screen-crt" role="dialog" aria-label="${s.title}">
      <div class="screen-bezel">
        <span class="screen-led"></span>
        <span class="screen-title">${s.title}</span>
        <button class="screen-close" aria-label="Close">✕</button>
      </div>
      <div class="screen-content">${s.body}</div>
      ${s.caption ? `<p class="screen-caption">${s.caption}</p>` : ''}
      ${s.action ? `<button class="screen-action">${s.action.label}</button>` : ''}
      <p class="screen-hint">ESC / click outside to close</p>
    </div>`;
  document.body.appendChild(root);
  active = root;
  requestAnimationFrame(() => root.classList.add('open'));

  // if a real screenshot exists, prefer it over the rendered HTML (NASA email)
  const emailEl = root.querySelector('.crt-email[data-img]');
  if (emailEl) {
    const src = emailEl.getAttribute('data-img');
    const probe = new Image();
    probe.onload = () => {
      emailEl.innerHTML = `<img class="crt-email-img" src="${src}" alt="${s.title}">`;
    };
    probe.src = src;
  }

  if (s.typer) runTyper(root, s.typer);

  root.querySelector('.screen-backdrop').addEventListener('click', close);
  root.querySelector('.screen-close').addEventListener('click', close);
  const act = root.querySelector('.screen-action');
  if (act && s.action) act.addEventListener('click', () => {
    close();
    if (s.action.external) { window.open(s.action.go, '_blank', 'noopener,noreferrer'); }
    else { location.hash = s.action.go; }
  });
}

export function initScreens() {
  window.addEventListener('relentless:screen', (e) => open(e.detail.id));
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && active) { e.stopPropagation(); close(); }
  });
}
