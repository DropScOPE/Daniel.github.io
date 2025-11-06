/* ===========================================================================
   Daniel's Digital Domain — JS Overhaul (110%)
   Paradigm: modular, a11y-first, perf-aware, zero deps.
   Features: Theme manager, Loading gate, Starfield engine (HiDPI),
             Section reveal + nav spy, Smooth router-like scroll,
             Timeline controller, Skills animator, Typewriter, Utilities.
   =========================================================================== */
(() => {
  'use strict';

  /* ----------------------------------------------------------------------- */
  /* 0) Guards & Globals                                                     */
  /* ----------------------------------------------------------------------- */
  const d = document;
  const w = window;
  const docEl = d.documentElement;
  const DPR = w.devicePixelRatio || 1;

  const qs  = (sel, root = d) => root.querySelector(sel);
  const qsa = (sel, root = d) => Array.from(root.querySelectorAll(sel));

  const isReducedMotion = () => w.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const lerp  = (a, b, t) => a + (b - a) * t;

  const debounce = (fn, wait = 150) => {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(null, args), wait); };
  };
  const throttle = (fn, limit = 100) => {
    let inThrottle = false, lastArgs = null;
    return function run(...args) {
      if (inThrottle) { lastArgs = args; return; }
      inThrottle = true; fn.apply(null, args);
      setTimeout(() => { inThrottle = false; if (lastArgs) { run(...lastArgs); lastArgs = null; } }, limit);
    };
  };

  const raf = (cb) => requestAnimationFrame(cb);

  /* ----------------------------------------------------------------------- */
  /* 1) Theme Manager                                                        */
  /* ----------------------------------------------------------------------- */
  const Theme = (() => {
    const KEY = 'dd-theme';
    const mql = w.matchMedia('(prefers-color-scheme: light)');
    const get = () => localStorage.getItem(KEY);
    const apply = (mode) => { docEl.setAttribute('data-theme', mode); };
    const set = (mode) => { apply(mode); localStorage.setItem(KEY, mode); };
    const init = () => { const saved = get(); apply(saved || (mql.matches ? 'light' : 'dark')); };
    const toggle = () => set(docEl.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
    const bind = () => {
      const btn = qs('#themeToggle'); if (!btn) return;
      const icon = () => docEl.getAttribute('data-theme') === 'light' ? '🌞' : '🌙';
      btn.textContent = icon();
      btn.setAttribute('aria-pressed', docEl.getAttribute('data-theme') !== 'light');
      btn.addEventListener('click', () => { toggle(); btn.textContent = icon(); btn.setAttribute('aria-pressed', docEl.getAttribute('data-theme') !== 'light'); });
      mql.addEventListener('change', (e) => { if (!get()) apply(e.matches ? 'light' : 'dark'); btn.textContent = icon(); });
    };
    return { init, bind };
  })();

  /* ----------------------------------------------------------------------- */
  /* 2) Loading Gate                                                         */
  /* ----------------------------------------------------------------------- */
  const Loading = (() => {
    const el = qs('#loading');
    let minGateStart = performance.now();
    const hide = () => { if (!el) return; el.setAttribute('hidden', ''); };
    const ready = () => {
      if (!el) return; const delta = performance.now() - minGateStart; const remain = Math.max(0, 400 - delta);
      setTimeout(hide, remain);
    };
    return { ready };
  })();

  /* ----------------------------------------------------------------------- */
  /* 3) Starfield Engine (HiDPI canvas, Offscreen fallback safe)             */
  /* ----------------------------------------------------------------------- */
  const Starfield = (() => {
    let canvas, ctx, W = 0, H = 0, stars = [], running = false, last = 0;
    const MAX = 160; // number of stars
    const SPEED = 0.18; // px/ms scaled by depth

    const container = qs('.starfield');

    const createCanvas = () => {
      if (!container) return null;
      // Reuse existing canvas or create one
      let c = container.querySelector('canvas');
      if (!c) { c = d.createElement('canvas'); container.appendChild(c); }
      return c;
    };

    const resize = () => {
      if (!canvas) return;
      const b = container.getBoundingClientRect();
      W = Math.max(1, Math.floor(b.width * DPR));
      H = Math.max(1, Math.floor((w.innerHeight || b.height) * DPR));
      canvas.width = W; canvas.height = H; canvas.style.width = `${W / DPR}px`; canvas.style.height = `${H / DPR}px`;
      // Rebuild star field
      const count = clamp(Math.floor((W / DPR) * (H / DPR) / 9000), 80, MAX);
      stars = new Array(count).fill(0).map(() => ({
        x: Math.random() * W,
        y: Math.random() * H,
        z: Math.random() * 0.8 + 0.2, // depth 0.2-1.0
        s: Math.random() * 1.5 + 0.2   // size
      }));
    };

    const draw = (now) => {
      if (!running || !ctx) return;
      const dt = Math.min(34, now - last || 16); last = now;
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < stars.length; i++) {
        const st = stars[i];
        st.x += st.z * SPEED * dt * DPR;
        if (st.x > W) { st.x = 0; st.y = Math.random() * H; }
        const alpha = 0.4 + st.z * 0.6;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fillRect(st.x, st.y, st.s * DPR, st.s * DPR);
      }
      raf(draw);
    };

    const start = () => {
      if (!container || isReducedMotion()) return;
      canvas = createCanvas(); if (!canvas) return;
      ctx = canvas.getContext('2d', { alpha: true }); if (!ctx) return;
      resize(); running = true; last = performance.now(); raf(draw);
    };

    const stop = () => { running = false; };

    const bind = () => {
      if (!container) return;
      const ro = new ResizeObserver(throttle(resize, 100));
      ro.observe(container);
      w.addEventListener('resize', throttle(resize, 120));
      w.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
        if (e.matches) { stop(); if (canvas) canvas.style.display = 'none'; }
        else { if (canvas) canvas.style.display = ''; start(); }
      });
    };

    return { start, stop, bind };
  })();

  /* ----------------------------------------------------------------------- */
  /* 4) Typewriter (progressive, cancel-safe)                                */
  /* ----------------------------------------------------------------------- */
  class Typewriter {
    constructor(el, text, delay = 28) { this.el = el; this.text = text; this.delay = delay; this._i = 0; this._id = 0; }
    start(cb) {
      if (!this.el || !this.text) { cb && cb(); return; }
      this.el.textContent = '';
      const tick = () => {
        if (this._i >= this.text.length) { cb && cb(); return; }
        this.el.textContent += this.text.charAt(this._i++);
        this._id = setTimeout(tick, this.delay);
      };
      tick();
    }
    cancel() { clearTimeout(this._id); }
  }

  /* ----------------------------------------------------------------------- */
  /* 5) Reveal Observer + Nav Spy                                            */
  /* ----------------------------------------------------------------------- */
  const Reveal = (() => {
    let revealIO, spyIO;
    const links = qsa('[data-link]');
    const sections = links.map(a => qs(a.getAttribute('href'))).filter(Boolean);

    const init = () => {
      revealIO = new IntersectionObserver((entries) => {
        for (const e of entries) if (e.isIntersecting) e.target.classList.add('is-visible');
      }, { rootMargin: '-15% 0px', threshold: 0.08 });
      qsa('.section').forEach(s => revealIO.observe(s));

      spyIO = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          links.forEach(l => l.removeAttribute('aria-current'));
          const id = '#' + e.target.id; const a = links.find(l => l.getAttribute('href') === id);
          if (a) a.setAttribute('aria-current', 'page');
        }
      }, { rootMargin: '-45% 0px -50% 0px', threshold: 0.01 });
      sections.forEach(s => spyIO.observe(s));
    };
    return { init };
  })();

  /* ----------------------------------------------------------------------- */
  /* 6) Router‑like Smooth Scroll (offset aware)                              */
  /* ----------------------------------------------------------------------- */
  const SmoothScroll = (() => {
    const TOP_OFFSET = 0; // Header is fixed but compact; CSS uses scroll-padding
    const onClick = (e) => {
      const a = e.target.closest('a[href^="#"]'); if (!a) return;
      const id = a.getAttribute('href'); if (id.length < 2) return;
      const el = qs(id); if (!el) return;
      e.preventDefault();
      const y = el.getBoundingClientRect().top + w.scrollY - TOP_OFFSET;
      w.scrollTo({ top: y, behavior: 'smooth' });
      history.replaceState(null, '', id);
    };
    const bind = () => d.addEventListener('click', onClick);
    return { bind };
  })();

  /* ----------------------------------------------------------------------- */
  /* 7) Timeline Controller                                                   */
  /* ----------------------------------------------------------------------- */
  const Timeline = (() => {
    const map = {
      2020: 'Stack: Lua, SQL, JavaScript. Early Git discipline. Won a local hack challenge; shipped two utilities used by a 500+ user community.',
      2021: 'Led strats, VOD reviews, and mental game. Discipline → cleaner code reviews, faster shipping.',
      2022: 'Rebuilt priorities. Cut noise. Doubled down on UI/UX rigor and perf-first standards.',
      2023: 'Dropped FiveM utilities, HUDs, inventory prototypes. CI checks, semantic release, docs-as-code.',
      2024: 'Learning composition → mixing → mastering. Ambient/industrial textures.',
      2025: 'Flagship site, premium modules, unified brand system.'
    };
    const details = qs('#timelineDetails');

    const activate = (item) => {
      qsa('.timeline__item[aria-current="true"]').forEach(i => i.setAttribute('aria-current', 'false'));
      item.setAttribute('aria-current', 'true');
      const y = item.dataset.year; const title = item.querySelector('h3')?.textContent || '';
      if (details) { details.innerHTML = `<div><h3>${y} — ${title}</h3><p>${map[y]||''}</p></div>`; details.classList.add('is-visible'); }
    };

    const bind = () => {
      const wrap = qs('#timeline'); if (!wrap) return;
      wrap.addEventListener('click', (e) => { const it = e.target.closest('.timeline__item'); if (it) activate(it); });
      qsa('.timeline__item').forEach(it => it.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); activate(it); } }));
    };
    return { bind };
  })();

  /* ----------------------------------------------------------------------- */
  /* 8) Skills Animator                                                       */
  /* ----------------------------------------------------------------------- */
  const Skills = (() => {
    let io;
    const init = () => {
      io = new IntersectionObserver((entries) => {
        for (const { isIntersecting, target } of entries) {
          if (!isIntersecting) continue;
          const lvl = Number(target.dataset.level) || 0;
          const bar = target.querySelector('.skills__bar');
          if (bar) raf(() => { bar.style.inlineSize = clamp(lvl, 0, 100) + '%'; });
          io.unobserve(target);
        }
      }, { threshold: 0.35 });
      qsa('.skills__row').forEach(r => io.observe(r));
    };
    return { init };
  })();

  /* ----------------------------------------------------------------------- */
  /* 9) Home Typewriter intro                                                */
  /* ----------------------------------------------------------------------- */
  const Intro = (() => {
    const h = qs('#home h1');
    const p = qs('#home .content p');
    const run = () => {
      if (!h || !p || isReducedMotion()) return; // respect motion prefs
      const th = new Typewriter(h, h.textContent.trim(), 24);
      const tp = new Typewriter(p, p.textContent.trim(), 18);
      th.start(() => { h.classList.add('is-visible'); tp.start(() => p.classList.add('is-visible')); });
    };
    return { run };
  })();

  /* ----------------------------------------------------------------------- */
  /* 10) Boot                                                                 */
  /* ----------------------------------------------------------------------- */
  const Boot = () => {
    // Remove no-js
    docEl.classList.remove('no-js');

    // Theme
    Theme.init();
    Theme.bind();

    // Loading gate after window load
    w.addEventListener('load', Loading.ready);

    // Core controllers
    Reveal.init();
    SmoothScroll.bind();
    Timeline.bind();
    Skills.init();

    // Dynamic visuals
    Starfield.bind();
    Starfield.start();

    // Intro typing
    Intro.run();

    // Footer year
    const yearEl = qs('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear();
  };

  Boot();
})();
