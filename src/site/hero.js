/**
 * hero.js — particles live in #bg as a permanent full-viewport animation.
 *
 * Four-phase loop:
 *   GATHER  (~3 s) — spring toward the "AA" target positions
 *   HOLD    (~4.5s) — drift gently around the settled shape
 *   SCATTER (~1.4s) — explode outward with momentum
 *   ROAM    (~5 s)  — wander the full viewport freely
 *
 * The cycle repeats indefinitely, giving the background a living,
 * breathing quality. Respects prefers-reduced-motion.
 */

const ACCENTS = ['#9d5cff', '#00d9f5', '#ffcf3a', '#cdb8ff'];

const DUR = { gather: 3000, hold: 4500, scatter: 1400, roam: 5000 };
const NEXT = { gather: 'hold', hold: 'scatter', scatter: 'roam', roam: 'gather' };

export function initHero(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let particles = [];
  let raf = 0;
  let w = 0;
  let h = 0;
  let phase = 'gather';
  let phaseStart = 0;
  let initialised = false;

  function sampleAA() {
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const o = off.getContext('2d');
    o.fillStyle = '#fff';
    o.textAlign = 'center';
    o.textBaseline = 'middle';
    const size = Math.min(w * 0.34, h * 0.9);
    o.font = `900 ${size}px Orbitron, monospace`;
    o.fillText('AA', w / 2, h / 2);

    const img = o.getImageData(0, 0, w, h).data;
    const pts = [];
    const gap = Math.max(4, Math.round(size / 46));
    for (let y = 0; y < h; y += gap) {
      for (let x = 0; x < w; x += gap) {
        if (img[(y * w + x) * 4 + 3] > 128) pts.push({ x, y });
      }
    }
    return pts;
  }

  function build() {
    w = canvas.width = Math.round(canvas.getBoundingClientRect().width || window.innerWidth);
    h = canvas.height = Math.round(canvas.getBoundingClientRect().height || window.innerHeight);
    if (!w || !h) return;

    const pts = sampleAA();

    if (!initialised) {
      particles = pts.map((p, i) => ({
        tx: p.x, ty: p.y,
        x: reduce ? p.x : Math.random() * w,
        y: reduce ? p.y : Math.random() * h,
        vx: 0, vy: 0,
        rx: (Math.random() - 0.5) * 2,
        ry: (Math.random() - 0.5) * 2,
        c: ACCENTS[i % ACCENTS.length],
        ph: Math.random() * Math.PI * 2,
        r: Math.random() < 0.12 ? 1.9 : 1.15,
      }));
      initialised = true;
    } else {
      // update targets on resize; keep live positions
      const len = Math.min(pts.length, particles.length);
      for (let i = 0; i < len; i++) {
        particles[i].tx = pts[i].x;
        particles[i].ty = pts[i].y;
      }
      if (pts.length > particles.length) {
        for (let i = particles.length; i < pts.length; i++) {
          particles.push({
            tx: pts[i].x, ty: pts[i].y,
            x: Math.random() * w, y: Math.random() * h,
            vx: 0, vy: 0,
            rx: (Math.random() - 0.5) * 2,
            ry: (Math.random() - 0.5) * 2,
            c: ACCENTS[i % ACCENTS.length],
            ph: Math.random() * Math.PI * 2,
            r: Math.random() < 0.12 ? 1.9 : 1.15,
          });
        }
      } else {
        particles.length = pts.length;
      }
    }
  }

  function frame(t) {
    // --- phase transition ---
    if (t - phaseStart > DUR[phase]) {
      const leaving = phase;
      phase = NEXT[phase];
      phaseStart = t;

      if (phase === 'scatter') {
        const cx = w / 2;
        const cy = h / 2;
        for (const p of particles) {
          const angle = Math.atan2(p.y - cy, p.x - cx) + (Math.random() - 0.5) * 1.4;
          const speed = 3.5 + Math.random() * 5.5;
          p.vx = Math.cos(angle) * speed;
          p.vy = Math.sin(angle) * speed;
        }
      }

      if (phase === 'roam') {
        for (const p of particles) {
          p.rx = (Math.random() - 0.5) * 2;
          p.ry = (Math.random() - 0.5) * 2;
        }
      }
    }

    ctx.clearRect(0, 0, w, h);
    const pct = Math.min(1, (t - phaseStart) / DUR[phase]);

    for (const p of particles) {
      // --- physics by phase ---
      if (phase === 'gather') {
        const dx = Math.cos(p.ph + t / 1400) * 0.7;
        const dy = Math.sin(p.ph + t / 1600) * 0.7;
        p.vx += (p.tx + dx - p.x) * 0.018;
        p.vy += (p.ty + dy - p.y) * 0.018;
        p.vx *= 0.84;
        p.vy *= 0.84;
      } else if (phase === 'hold') {
        const amp = 2.8;
        const dx = Math.cos(p.ph + t / 1200) * amp;
        const dy = Math.sin(p.ph + t / 1500) * amp;
        p.vx += (p.tx + dx - p.x) * 0.012;
        p.vy += (p.ty + dy - p.y) * 0.012;
        p.vx *= 0.86;
        p.vy *= 0.86;
      } else if (phase === 'scatter') {
        p.vx *= 0.972;
        p.vy *= 0.972;
        // gentle wall bounce
        if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx) * 0.4; }
        if (p.x > w) { p.x = w; p.vx = -Math.abs(p.vx) * 0.4; }
        if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy) * 0.4; }
        if (p.y > h) { p.y = h; p.vy = -Math.abs(p.vy) * 0.4; }
      } else if (phase === 'roam') {
        p.rx += (Math.random() - 0.5) * 0.08;
        p.ry += (Math.random() - 0.5) * 0.08;
        const spd = Math.hypot(p.rx, p.ry);
        if (spd > 2) { p.rx *= 0.9; p.ry *= 0.9; }
        p.vx = p.vx * 0.97 + p.rx * 0.03;
        p.vy = p.vy * 0.97 + p.ry * 0.03;
        // wrap-around
        if (p.x < -12) p.x = w + 12;
        if (p.x > w + 12) p.x = -12;
        if (p.y < -12) p.y = h + 12;
        if (p.y > h + 12) p.y = -12;
      }

      p.x += p.vx;
      p.y += p.vy;

      // --- opacity by phase ---
      let alpha;
      if (phase === 'gather')  alpha = 0.6 + pct * 0.3;
      else if (phase === 'hold') alpha = 0.82 + Math.sin(p.ph + t / 900) * 0.12;
      else if (phase === 'scatter') alpha = 0.8 * (1 - pct * 0.5);
      else alpha = 0.35 + Math.sin(p.ph + t / 700) * 0.22;

      ctx.fillStyle = p.c;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }

  function start() {
    build();
    if (reduce) {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        ctx.fillStyle = p.c;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(p.tx, p.ty, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    cancelAnimationFrame(raf);
    phaseStart = performance.now();
    raf = requestAnimationFrame(frame);
  }

  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(start, 200);
  });

  if (document.fonts?.ready) document.fonts.ready.then(start);
  else start();
}
