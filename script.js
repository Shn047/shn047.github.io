document.documentElement.classList.add('js');

const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

// ───────── Theme toggle (remembers your choice) ─────────
document.getElementById('themeToggle')?.addEventListener('click', () => {
  const isDark = root.dataset.theme
    ? root.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  const next = isDark ? 'light' : 'dark';
  root.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch (e) {}
  window.dispatchEvent(new Event('themechange'));
});

// ───────── Fade sections in as they scroll into view ─────────
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('in'));
}

// ───────── Highlight the nav link for the section on screen ─────────
const navLinks = [...document.querySelectorAll('.nav__links a')];
const sections = navLinks.map((a) => { const h = a.getAttribute('href'); return h.startsWith('#') ? document.querySelector(h) : null; });
const spy = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach((s) => s && spy.observe(s));

// ───────── Mobile menu ─────────
const nav = document.querySelector('.nav');
const menuBtn = document.getElementById('menuToggle');
function setMenu(open) {
  if (!nav || !menuBtn) return;
  nav.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', open);
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}
menuBtn?.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
navLinks.forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
document.addEventListener('click', (e) => { if (nav && !nav.contains(e.target)) setMenu(false); });
matchMedia('(min-width: 860px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

// ───────── Scroll progress bar ─────────
const progress = document.querySelector('.progress');
let ticking = false;
function updateProgress() {
  const max = document.documentElement.scrollHeight - innerHeight;
  if (progress) progress.style.setProperty('--p', max > 0 ? scrollY / max : 0);
  ticking = false;
}
addEventListener('scroll', () => {
  if (!ticking) { requestAnimationFrame(updateProgress); ticking = true; }
}, { passive: true });
updateProgress();

// ───────── Copy email button ─────────
const copyBtn = document.getElementById('copyEmail');
copyBtn?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(copyBtn.dataset.email);
    copyBtn.textContent = 'Copied ✓';
  } catch (e) {
    copyBtn.textContent = copyBtn.dataset.email;
  }
  setTimeout(() => (copyBtn.textContent = 'Copy email'), 2000);
});

const yearEl = document.getElementById('year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

// ───────── Typed "focused on …" line ─────────
(function typed() {
  const el = document.querySelector('.typed');
  if (!el) return;
  const words = el.dataset.words.split('|');
  let w = 0;
  if (reduceMotion) {
    setInterval(() => { w = (w + 1) % words.length; el.textContent = words[w]; }, 2600);
    return;
  }
  let i = words[0].length, deleting = true;
  function step() {
    const word = words[w];
    el.textContent = word.slice(0, i);
    if (!deleting && i === word.length) { deleting = true; return setTimeout(step, 1800); }
    if (deleting && i === 0) { deleting = false; w = (w + 1) % words.length; return setTimeout(step, 300); }
    i += deleting ? -1 : 1;
    setTimeout(step, deleting ? 35 : 70);
  }
  setTimeout(step, 2200);
})();

// ───────── Count-up numbers in the stats strip ─────────
(function countUp() {
  const nums = document.querySelectorAll('[data-count]');
  if (reduceMotion || !nums.length) return;
  const run = (el) => {
    const target = +el.dataset.count, start = performance.now(), dur = 1100;
    const frame = (t) => {
      const p = Math.min((t - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(frame);
    };
    el.textContent = '0';
    requestAnimationFrame(frame);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.6 });
  nums.forEach((n) => io.observe(n));
})();

// ───────── Cursor spotlight, tile tilt, magnetic buttons ─────────
if (finePointer && !reduceMotion) {
  document.querySelectorAll('.tile, .card').forEach((el) => {
    const tilt = el.classList.contains('tile');
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      el.style.setProperty('--mx', x + 'px');
      el.style.setProperty('--my', y + 'px');
      if (tilt) {
        const rx = (y / r.height - 0.5) * -5;
        const ry = (x / r.width - 0.5) * 5;
        el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      }
    });
    if (tilt) el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  document.querySelectorAll('.magnetic').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      const dx = e.clientX - r.left - r.width / 2;
      const dy = e.clientY - r.top - r.height / 2;
      b.style.transform = `translate(${dx * 0.18}px, ${dy * 0.3}px)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });
}

// ───────── Neural network background in the hero ─────────
(function neuralNet() {
  const canvas = document.querySelector('.neural');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const host = canvas.parentElement;
  const LINK = 120, MOUSE_R = 170;
  let w = 0, h = 0, nodes = [], rgb = '0,113,227', running = false, raf = 0;
  const mouse = { x: -1e4, y: -1e4 };

  function readColor() {
    const hex = getComputedStyle(root).getPropertyValue('--accent').trim().replace('#', '');
    if (/^[0-9a-f]{6}$/i.test(hex)) {
      rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',');
    }
  }

  function resize() {
    const r = host.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(90, Math.max(30, (w * h) / 5000)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 1,
    }));
    if (!running) draw();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const n of nodes) {
      if (running) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        // Gentle pull toward the cursor
        const dx = mouse.x - n.x, dy = mouse.y - n.y, d = Math.hypot(dx, dy);
        if (d < MOUSE_R && d > 1) { n.x += (dx / d) * 0.35; n.y += (dy / d) * 0.35; }
      }
    }
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) {
          ctx.strokeStyle = `rgba(${rgb},${(1 - d / LINK) * 0.35})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      if (dm < MOUSE_R) {
        ctx.strokeStyle = `rgba(${rgb},${(1 - dm / MOUSE_R) * 0.7})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
      const near = dm < MOUSE_R;
      ctx.fillStyle = `rgba(${rgb},${near ? 0.95 : 0.6})`;
      ctx.beginPath(); ctx.arc(a.x, a.y, near ? a.r + 1 : a.r, 0, Math.PI * 2); ctx.fill();
    }
    if (running) raf = requestAnimationFrame(draw);
  }

  function start() { if (!running && !reduceMotion) { running = true; raf = requestAnimationFrame(draw); } }
  function stop() { running = false; cancelAnimationFrame(raf); }

  host.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    if (!running) draw();
  });
  host.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; if (!running) draw(); });

  // Only animate while the hero is on screen and the tab is visible
  new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(host);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  const onTheme = () => { readColor(); if (!running) draw(); };
  addEventListener('themechange', onTheme);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', onTheme);

  new ResizeObserver(resize).observe(host);
  readColor();
  resize();
})();

// ───────── Demo videos: hover preview + popup player ─────────
(function demoVideos() {
  const modal = document.getElementById('videoModal');
  if (!modal || !modal.showModal) return;
  const player = modal.querySelector('video');
  const caption = modal.querySelector('.video-modal__caption');

  function open(src, text, captions) {
    player.querySelectorAll('track').forEach((t) => t.remove());
    if (captions) {
      const track = document.createElement('track');
      Object.assign(track, { kind: 'captions', srclang: 'en', label: 'English', src: captions, default: true });
      player.appendChild(track);
    }
    player.src = src;
    caption.textContent = text || '';
    modal.showModal();
    player.play().catch(() => {});
  }
  function close() { player.pause(); modal.close(); }

  document.querySelectorAll('[data-video]').forEach((el) => {
    el.addEventListener('click', () => open(el.dataset.video, el.dataset.caption, el.dataset.captions));
  });
  modal.querySelector('.video-modal__close').addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  modal.addEventListener('close', () => player.pause());

  // Muted preview on hover (mouse devices only)
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.project__media--video').forEach((box) => {
      const v = box.querySelector('video');
      box.addEventListener('pointerenter', () => {
        box.classList.add('previewing');
        // Start the silent preview at the result (0:19.5), skipping the loading spinner
        const jump = () => { v.currentTime = parseFloat(box.dataset.previewStart || '19.5'); };
        if (v.readyState >= 1) jump(); else v.addEventListener('loadedmetadata', jump, { once: true });
        v.play().catch(() => {});
      });
      // Go back to the poster frame so the card never rests on the loading spinner
      box.addEventListener('pointerleave', () => { box.classList.remove('previewing'); v.pause(); v.load(); });
    });
  }
})();

// ───────── Certificate image popup ─────────
(function certImages() {
  const modal = document.getElementById('imageModal');
  if (!modal || !modal.showModal) return;
  const img = modal.querySelector('img');
  const caption = modal.querySelector('.video-modal__caption');
  document.querySelectorAll('[data-image]').forEach((btn) => {
    btn.addEventListener('click', () => {
      img.src = btn.dataset.image;
      img.alt = btn.dataset.caption || '';
      caption.textContent = btn.dataset.caption || '';
      modal.showModal();
    });
  });
  modal.querySelector('.video-modal__close').addEventListener('click', () => modal.close());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });
})();

// ───────── Certification filter ─────────
(function certFilter() {
  const chips = document.querySelectorAll('.cert-chip');
  const cards = document.querySelectorAll('.cert-card');
  chips.forEach((chip) => chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    chips.forEach((c) => { const on = c === chip; c.classList.toggle('is-active', on); c.setAttribute('aria-pressed', on); });
    cards.forEach((card) => { card.hidden = f !== 'all' && card.dataset.issuer !== f; });
  }));
})();

// ───────── Live clips: play only while on screen (static poster if reduced motion) ─────────
(function liveClips() {
  const clips = document.querySelectorAll('video.clip');
  if (!clips.length) return;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    clips.forEach((v) => { v.controls = true; });
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting) { v.preload = 'auto'; v.play().catch(() => {}); } else { v.pause(); }
    });
  }, { threshold: 0.35 });
  clips.forEach((v) => io.observe(v));
})();
