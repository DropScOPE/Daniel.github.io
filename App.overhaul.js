/* Daniel's Digital Domain — Compatibility JS (110%)
   Maps old HTML structure to the new engine, so no HTML edits are needed.
   - Works with: #loading-screen, #starfield canvas, #timeline, .timeline-item,
                 #timeline-details, .skill-progress[data-skill], nav#main-nav a, etc.
   - Adds: theme toggle persistence, reveal/spy, HiDPI starfield, smoother timeline,
           skill bar animation, reduced-motion safety.
*/
(() => {
  'use strict';

  // ---- DOM helpers
  const d = document, w = window, DPR = w.devicePixelRatio || 1;
  const qs  = (s, r=d) => r.querySelector(s);
  const qsa = (s, r=d) => Array.from(r.querySelectorAll(s));
  const isRM = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Selectors: support BOTH new + your current HTML
  const $loading     = qs('#loading') || qs('#loading-screen');
  const $starCanvas  = qs('canvas#starfield');         // your existing canvas
  const $starWrap    = $starCanvas || qs('.starfield'); // either canvas or container
  const $homeH1      = qs('#home .content h1') || qs('#home h1');
  const $homeP       = qs('#home .content p') || qs('#home p');
  const $timeline    = qs('#timeline');
  const $timelineDet = qs('#timelineDetails') || qs('#timeline-details');
  const $skillsRows  = qsa('.skills__row'); // new
  const $skillBars   = qsa('.skill-progress, .skills__bar'); // your old + new
  const $sections    = qsa('section');
  const $navLinks    = qsa('nav#main-nav a[href^="#"], [data-link]');

  // ---- Utilities
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const raf = (fn) => requestAnimationFrame(fn);

  // ---- Theme
  const Theme = (()=> {
    const KEY = 'dd-theme';
    const mql = matchMedia('(prefers-color-scheme: light)');
    const get = () => localStorage.getItem(KEY);
    const apply = (m) => d.documentElement.setAttribute('data-theme', m);
    const set = (m) => { apply(m); localStorage.setItem(KEY, m); };
    const init = () => apply(get() || (mql.matches ? 'light' : 'dark'));
    const bind = () => {
      const btn = qs('#themeToggle');
      if (!btn) return;
      const icon = () => d.documentElement.getAttribute('data-theme') === 'light' ? '🌞' : '🌙';
      btn.textContent = icon();
      btn.addEventListener('click', ()=>{
        const next = d.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        set(next); btn.textContent = icon(); btn.setAttribute('aria-pressed', next !== 'light');
      });
      mql.addEventListener('change', e => { if (!get()) apply(e.matches ? 'light' : 'dark'); btn.textContent = icon(); });
    };
    return { init, bind };
  })();

  // ---- Loading gate (respects both ids)
  const Loading = (()=> {
    const hide = () => { if ($loading) { $loading.classList.add('hidden'); $loading.setAttribute('aria-hidden','true'); } };
    const ready = () => {
      if (!$loading) return;
      if (isRM()) { hide(); return; }
      // min 400ms gate for smoother feel; yours was 3s – not necessary.
      setTimeout(hide, 400);
    };
    return { ready };
  })();

  // ---- Starfield (HiDPI). Works on existing <canvas id="starfield">
  const Starfield = (()=> {
    if (!$starWrap || isRM()) return { start:()=>{}, stop:()=>{} };
    const canvas = $starCanvas || d.createElement('canvas');
    if (!$starCanvas) $starWrap.appendChild(canvas);

    const ctx = canvas.getContext('2d', { alpha:true });
    let W=0, H=0, stars=[], last=0, running=false;
    const SPEED = 0.18;

    const resize = () => {
      const rect = ($starCanvas ? canvas : $starWrap).getBoundingClientRect();
      W = Math.max(1, Math.floor(rect.width * DPR));
      H = Math.max(1, Math.floor((w.innerHeight || rect.height) * DPR));
      canvas.width = W; canvas.height = H;
      canvas.style.width = `${W/DPR}px`; canvas.style.height = `${H/DPR}px`;
      const count = clamp(Math.floor((W/DPR)*(H/DPR)/9000), 80, 180);
      stars = new Array(count).fill(0).map(()=>({ x: Math.random()*W, y: Math.random()*H, z: Math.random()*0.8+0.2, s: Math.random()*1.5+0.2 }));
    };

    const draw = (now) => {
      if (!running) return;
      const dt = Math.min(34, now - (last||now)); last = now;
      ctx.clearRect(0,0,W,H);
      for (let i=0;i<stars.length;i++){
        const st = stars[i];
        st.x += st.z * SPEED * dt * DPR;
        if (st.x > W){ st.x = 0; st.y = Math.random()*H; }
        ctx.fillStyle = `rgba(255,255,255,${0.4 + st.z*0.6})`;
        ctx.fillRect(st.x, st.y, st.s*DPR, st.s*DPR);
      }
      raf(draw);
    };

    const start = () => { resize(); running=true; raf(draw); };
    const stop  = () => { running=false; };
    addEventListener('resize', resize);
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => e.matches ? stop() : start());
    return { start, stop };
  })();

  // ---- Reveal + nav spy (works with your anchors)
  const RevealSpy = (()=> {
    const links = $navLinks;
    const sections = links.map(a => qs(a.getAttribute('href'))).filter(Boolean);

    const revealIO = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) e.target.classList.add('visible','is-visible');
    }, { rootMargin: '-12% 0px', threshold: 0.08 });

    const spyIO = new IntersectionObserver(entries => {
      for (const e of entries){
        if (!e.isIntersecting) continue;
        links.forEach(l => l.removeAttribute('aria-current'));
        const id = '#' + e.target.id;
        const a = links.find(l => l.getAttribute('href') === id);
        if (a) a.setAttribute('aria-current','page');
      }
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0.01 });

    const init = () => {
      qsa('.section, section').forEach(s => revealIO.observe(s));
      sections.forEach(s => spyIO.observe(s));
    };
    return { init };
  })();

  // ---- Smooth anchor scroll (offsetless; your CSS already uses scroll-padding)
  const Smooth = (()=> {
    const onClick = (e) => {
      const a = e.target.closest('a[href^="#"]'); if (!a) return;
      const id = a.getAttribute('href'); if (!id || id.length < 2) return;
      const el = qs(id); if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null,'',id);
    };
    const bind = () => d.addEventListener('click', onClick);
    return { bind };
  })();

  // ---- Timeline controller (supports your .timeline-item structure)
  const Timeline = (()=> {
    if (!$timeline) return { bind:()=>{} };
    const map = {
      2020: 'Stack: Lua, SQL, JavaScript. Early Git discipline. Won a local hack challenge; shipped two utilities used by a 500+ user community.',
      2021: 'Led strats, VOD reviews, and mental game. Discipline → cleaner code reviews, faster shipping.',
      2022: 'Rebuilt priorities. Cut noise. Doubled down on UI/UX rigor and perf-first standards.',
      2023: 'Dropped FiveM utilities, HUDs, inventory prototypes. CI checks, semantic release, docs-as-code.',
      2024: 'Learning composition → mixing → mastering. Ambient/industrial textures.',
      2025: 'Flagship site, premium modules, unified brand system.'
    };
    const items = qsa('.timeline__item, .timeline-item, #timeline .card[aria-expanded]');

    const extractTitle = (el) => (el.querySelector('h3') && el.querySelector('h3').textContent) || el.getAttribute('data-title') || 'Details';
    const extractYear  = (el) => el.dataset.year || el.getAttribute('data-year') || (el.querySelector('.pill')?.textContent?.trim()) || '';

    const activate = (it) => {
      items.forEach(i => i.setAttribute('aria-current','false'));
      it.setAttribute('aria-current','true');
      const y = extractYear(it), t = extractTitle(it);
      if ($timelineDet){
        // If your HTML already renders inner details, prefer that
        const inner = it.querySelector('.timeline-content, .details');
        $timelineDet.innerHTML = inner ? inner.innerHTML : `<h3>${y} — ${t}</h3><p>${map[y]||''}</p>`;
        $timelineDet.classList.add('visible','is-visible');
      }
    };

    const bind = () => {
      $timeline.addEventListener('click', (e) => {
        const it = e.target.closest('.timeline__item, .timeline-item, #timeline .card[aria-expanded]');
        if (!it) return;
        // support old cards that toggle aria-expanded
        if (it.hasAttribute('aria-expanded')) {
          const exp = it.getAttribute('aria-expanded') === 'true';
          qsa('#timeline .card[aria-expanded]').forEach(c => c.setAttribute('aria-expanded','false'));
          it.setAttribute('aria-expanded', String(!exp));
        }
        activate(it);
      });
      items.forEach(it => it.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(it); }}));
    };
    return { bind };
  })();

  // ---- Skills animator (supports .skill-progress[data-skill])
  const Skills = (()=> {
    const rows = $skillsRows.length ? $skillsRows : qsa('.skill, .skill-progress[aria-valuenow], .skill-progress[data-skill]');
    const io = new IntersectionObserver((entries, obs)=>{
      for (const { isIntersecting, target } of entries) {
        if (!isIntersecting) continue;
        const bar = target.matches('.skill-progress') ? target : target.querySelector('.skills__bar, .bar > span, .skill-progress');
        if (!bar) { obs.unobserve(target); continue; }
        // level extraction (prefer data-skill, then aria-valuenow, then inner code %)
        const container = target.matches('.skill-progress') ? target : target.closest('.skill') || target;
        let lvl = Number(container?.dataset?.skill || bar?.dataset?.skill || container?.getAttribute('aria-valuenow') || 0);
        if (!lvl) {
          const code = (container.querySelector('code')?.textContent || '').replace('%','');
          lvl = Number(code||0);
        }
        lvl = clamp(lvl, 0, 100);
        // old structure: CSS uses --skill-width on .skill-progress
        if (bar.classList.contains('skill-progress')) bar.style.setProperty('--skill-width', lvl + '%');
        // new structure: width on .skills__bar or .bar>span
        bar.style.width = lvl + '%';
        container.setAttribute('aria-valuenow', String(lvl));
        obs.unobserve(target);
      }
    }, { threshold: .35 });
    const init = () => rows.forEach(r => io.observe(r));
    return { init };
  })();

  // ---- Typewriter intro (safe if content exists; respects reduced motion)
  const Typewriter = (el, txt, delay=22) => {
    if (!el || !txt || isRM()) return { start: (cb)=>cb&&cb() };
    let i=0, id=0; el.textContent='';
    const tick = () => { if (i>=txt.length) return; el.textContent += txt.charAt(i++); id = setTimeout(tick, delay); };
    return { start: (cb)=>{ tick(); setTimeout(()=>cb&&cb(), delay*txt.length+10); } };
  };

  // ---- Boot
  const boot = () => {
    // no-js
    d.documentElement.classList.remove('no-js');

    // Theme
    Theme.init(); Theme.bind();

    // Loading
    addEventListener('load', Loading.ready);

    // Starfield
    if (Starfield.start) Starfield.start();

    // Reveal / Spy / Smooth
    RevealSpy.init();  Smooth.bind();

    // Timeline
    Timeline.bind();

    // Skills
    Skills.init();

    // Intro typing (if elements exist)
    if ($homeH1 && $homeP){
      const t1 = Typewriter($homeH1, $homeH1.textContent.trim(), 26);
      const t2 = Typewriter($homeP,  $homeP.textContent.trim(), 20);
      t1.start(()=> t2.start(()=>{}));
    }

    // Footer year (supports both #year and #current-year)
    const y = qs('#year') || qs('#current-year');
    if (y) y.textContent = new Date().getFullYear();

    // Reduced motion live changes
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e)=>{
      if (e.matches && $starWrap) $starWrap.style.display = 'none';
      if (!e.matches && $starWrap) $starWrap.style.display = '';
    });
  };

  // Start
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
