/* ===========================================================================
   Daniel's Digital Domain — 3-Section JS (Home / Skills / Gaming)
   Drop-in, zero-deps, a11y-first, motion-safe, perf-tuned.
   Assumes sections: #home, #skills, #gaming. No Accomplishments.
   Features:
   - Theme manager (persist + system aware) + hotkey (T)
   - Loading gate (fast) + reduced-motion compliance
   - HiDPI starfield on #starfield canvas
   - Section reveal, nav spy, smooth hash scroll, hash router
   - Home: typewriter intro, subtle parallax, back-to-top affordance
   - Skills: bar animation + live number counter + rerun on hash navigation
   - Gaming: lazy image loader, hover tilt (motion-safe), prefetch on hover
   - Utility: scroll progress bar under nav, keyboard shortcuts (H/S/G)
   =========================================================================== */
(() => {
  'use strict';

  // ---------- DOM helpers
  const d = document, w = window, DPR = w.devicePixelRatio || 1;
  const qs  = (s, r=d) => r.querySelector(s);
  const qsa = (s, r=d) => Array.from(r.querySelectorAll(s));
  const isRM = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const raf = (fn) => requestAnimationFrame(fn);
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

  // ---------- Selectors (3 sections only)
  const $loading   = qs('#loading') || qs('#loading-screen');
  const $star      = qs('#starfield');                  // canvas
  const $nav       = qs('#main-nav') || qs('header.nav');
  const $links     = qsa('nav a[href^="#"], [data-link]');
  const $home      = qs('#home');
  const $homeH1    = qs('#home h1');
  const $homeP     = qs('#home p');
  const $skills    = qs('#skills');
  const $gaming    = qs('#gaming');
  const $year      = qs('#year') || qs('#current-year');

  // ---------- Theme
  const Theme = (() => {
    const KEY = 'dd-theme';
    const mql = matchMedia('(prefers-color-scheme: light)');
    const get = () => localStorage.getItem(KEY);
    const apply = (mode) => d.documentElement.setAttribute('data-theme', mode);
    const set = (mode) => { apply(mode); localStorage.setItem(KEY, mode); };
    const init = () => apply(get() || (mql.matches ? 'light' : 'dark'));
    const bind = () => {
      const btn = qs('#themeToggle');
      const icon = () => d.documentElement.getAttribute('data-theme') === 'light' ? '🌞' : '🌙';
      if (btn) {
        btn.textContent = icon();
        btn.setAttribute('aria-pressed', d.documentElement.getAttribute('data-theme') !== 'light');
        btn.addEventListener('click', () => {
          const next = d.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
          set(next); btn.textContent = icon(); btn.setAttribute('aria-pressed', next !== 'light');
        });
        mql.addEventListener('change', (e)=>{ if(!get()) apply(e.matches ? 'light' : 'dark'); btn.textContent = icon(); });
      }
      // Hotkey (T) for theme toggle
      d.addEventListener('keydown', (e)=>{
        if (e.key.toLowerCase() === 't' && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          const next = d.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
          set(next); if (btn) { btn.textContent = icon(); btn.setAttribute('aria-pressed', next !== 'light'); }
        }
      });
    };
    return { init, bind };
  })();

  // ---------- Loading gate
  const Loading = (() => {
    const hide = () => { if ($loading) { $loading.classList.add('hidden'); $loading.setAttribute('aria-hidden','true'); } };
    const ready = () => { if (!$loading) return; isRM() ? hide() : setTimeout(hide, 350); };
    return { ready };
  })();

  // ---------- Scroll progress (under nav)
  const ScrollProgress = (() => {
    let bar;
    const mount = () => {
      if (qs('[data-scroll-progress]')) return;
      bar = d.createElement('div');
      bar.setAttribute('data-scroll-progress','');
      Object.assign(bar.style, {
        position:'fixed', left:'0', top: ($nav ? ($nav.offsetHeight + 'px') : '0'),
        height:'2px', width:'0%', zIndex:'999',
        background:'var(--brand, #ff3333)', boxShadow:'0 0 6px rgba(255,0,0,.5)'
      });
      d.body.appendChild(bar);
      update();
      w.addEventListener('scroll', update, { passive:true });
      w.addEventListener('resize', ()=> {
        if ($nav) bar.style.top = $nav.offsetHeight + 'px';
        update();
      });
    };
    const update = () => {
      const max = d.documentElement.scrollHeight - w.innerHeight;
      const pct = max > 0 ? (w.scrollY / max) * 100 : 0;
      if (bar) bar.style.width = `${pct}%`;
    };
    return { mount };
  })();

  // ---------- Smooth scroll + hash router + nav spy + reveal
  const Router = (() => {
    const sections = ['#home','#skills','#gaming'].map(id=>qs(id)).filter(Boolean);
    const revealIO = new IntersectionObserver((entries)=>{
      for (const e of entries) if (e.isIntersecting) e.target.classList.add('is-visible');
    }, { rootMargin:'-12% 0px', threshold:0.08 });

    const spyIO = new IntersectionObserver((entries)=>{
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        $links.forEach(l => l.removeAttribute('aria-current'));
        const id = '#' + e.target.id;
        const a  = $links.find(l => l.getAttribute('href') === id);
        if (a) a.setAttribute('aria-current','page');
      }
    }, { rootMargin:'-45% 0px -50% 0px', threshold:0.01 });

    const smoothTo = (id) => {
      const el = typeof id === 'string' ? qs(id) : id;
      if (!el) return;
      el.scrollIntoView({ behavior:'smooth', block:'start' });
    };

    const onClick = (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      const el = qs(id);
      if (!el) return;
      e.preventDefault();
      smoothTo(id);
      history.replaceState(null,'',id);
    };

    const onHashLoad = () => {
      if (location.hash && qs(location.hash)) {
        setTimeout(()=> smoothTo(location.hash), 10);
      }
    };

    const init = () => {
      d.addEventListener('click', onClick);
      sections.forEach(s => { revealIO.observe(s); spyIO.observe(s); });
      onHashLoad();
      w.addEventListener('hashchange', onHashLoad);
    };
    return { init, smoothTo };
  })();

  // ---------- Starfield (HiDPI)
  const Starfield = (() => {
    if (!$star || isRM()) return { start:()=>{}, stop:()=>{} };
    const ctx = $star.getContext('2d', { alpha:true });
    let W=0, H=0, stars=[], last=0, running=false;
    const SPEED = 0.18;

    const resize = () => {
      W = Math.max(1, Math.floor(w.innerWidth * DPR));
      H = Math.max(1, Math.floor(w.innerHeight * DPR));
      $star.width = W; $star.height = H;
      $star.style.width = `${W/DPR}px`; $star.style.height = `${H/DPR}px`;
      const count = clamp(Math.floor((W/DPR)*(H/DPR)/9000), 90, 200);
      stars = new Array(count).fill(0).map(()=>({ x: Math.random()*W, y: Math.random()*H, z: Math.random()*0.8 + 0.2, s: Math.random()*1.5 + 0.2 }));
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

  // ---------- Home: typewriter + parallax + back-to-top
  const Home = (() => {
    let tidH=0, tidP=0, ticking=false;
    const type = (el, txt, delay=22) => {
      if (!el || !txt || isRM()) return;
      el.textContent = '';
      let i=0;
      const tick = () => {
        if (i >= txt.length) return;
        el.textContent += txt.charAt(i++);
        tidH = setTimeout(tick, delay);
      };
      tick();
    };
    const typePair = () => {
      if (!$homeH1 || !$homeP || isRM()) return;
      const hTxt = $homeH1.textContent.trim();
      const pTxt = $homeP.textContent.trim();
      type($homeH1, hTxt, 26);
      setTimeout(()=> type($homeP, pTxt, 18), Math.min(1200, 20*hTxt.length));
    };
    const parallax = (e) => {
      if (isRM() || !$home) return;
      if (ticking) return (void 0);
      ticking = true;
      raf(()=> {
        const { clientX:x, clientY:y } = e;
        const cx = x / w.innerWidth  - 0.5;
        const cy = y / w.innerHeight - 0.5;
        const tx = cx * 8, ty = cy * 6; // subtle
        if ($homeH1) $homeH1.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
        if ($homeP)  $homeP.style.transform  = `translate3d(${tx/2}px, ${ty/2}px, 0)`;
        ticking = false;
      });
    };
    // back-to-top button
    const Top = (() => {
      let btn;
      const mount = () => {
        if (qs('[data-backtop]')) return;
        btn = d.createElement('button');
        btn.setAttribute('data-backtop','');
        btn.setAttribute('title','Back to top (H)');
        btn.textContent = '↑';
        Object.assign(btn.style, {
          position:'fixed', right:'16px', bottom:'16px', zIndex:'999',
          width:'44px', height:'44px', borderRadius:'999px',
          background:'var(--bg-elev, rgba(255,255,255,.08))',
          color:'var(--text, #fff)', border:'1px solid rgba(255,255,255,.12)',
          cursor:'pointer', opacity:'0', transform:'translateY(10px)', transition:'opacity .2s ease, transform .2s ease'
        });
        btn.addEventListener('click', () => Router.smoothTo('#home'));
        d.body.appendChild(btn);
        w.addEventListener('scroll', () => {
          const show = w.scrollY > (w.innerHeight * 0.75);
          btn.style.opacity = show ? '1' : '0';
          btn.style.transform = show ? 'translateY(0)' : 'translateY(10px)';
        }, { passive:true });
      };
      return { mount };
    })();

    const keys = () => {
      d.addEventListener('keydown', (e)=>{
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        const k = e.key.toLowerCase();
        if (k === 'h') { e.preventDefault(); Router.smoothTo('#home'); }
        if (k === 's') { e.preventDefault(); Router.smoothTo('#skills'); }
        if (k === 'g') { e.preventDefault(); Router.smoothTo('#gaming'); }
      });
    };

    const init = () => {
      typePair();
      w.addEventListener('pointermove', parallax);
      Top.mount();
      keys();
    };
    return { init };
  })();

  // ---------- Skills: animate bars + increment numbers
  const Skills = (() => {
    if (!$skills) return { init:()=>{} };
    const rows = qsa('.skills__row, .skill, .skill-progress', $skills);
    const getLevel = (row) => {
      // Prefer data-level on row; fallback to data-skill/aria-valuenow/code% patterns
      let lvl = Number(row.dataset.level || row.dataset.skill || row.getAttribute('aria-valuenow') || 0);
      if (!lvl) {
        const code = row.querySelector('code')?.textContent?.replace('%','');
        lvl = Number(code||0);
      }
      return clamp(lvl, 0, 100);
    };
    const inc = (el, to, ms=600) => {
      if (!el) return;
      const from = Number(el.textContent.replace('%','')) || 0;
      const start = performance.now();
      const step = (t) => {
        const k = clamp((t - start) / ms, 0, 1);
        const v = Math.round(from + (to - from) * k);
        el.textContent = v + '%';
        if (k < 1) raf(step);
      };
      raf(step);
    };
    const io = new IntersectionObserver((entries, obs)=>{
      for (const { isIntersecting, target } of entries) {
        if (!isIntersecting) continue;
        const lvl = getLevel(target);
        const bar = target.querySelector('.skills__bar, .bar > span, .skill-progress');
        const label = target.querySelector('code');
        if (bar) {
          bar.style.transition = 'inline-size 900ms cubic-bezier(.2,.9,.2,1), width 900ms cubic-bezier(.2,.9,.2,1)';
          // support width or inline-size depending on CSS
          bar.style.inlineSize = lvl + '%';
          bar.style.width = lvl + '%';
        }
        if (label) inc(label, lvl, 700);
        target.setAttribute('aria-valuenow', String(lvl));
        obs.unobserve(target);
      }
    }, { threshold:.35 });

    const init = () => rows.forEach(r => io.observe(r));
    return { init };
  })();

  // ---------- Gaming: lazy images + tilt + prefetch
  const Gaming = (() => {
    if (!$gaming) return { init:()=>{} };
    const tiles = qsa('.tile, .card, a[rel~="noopener"][target="_blank"]', $gaming);

    // Lazy images
    const imgs = qsa('img[loading="lazy"], .tile img, .card__img', $gaming);
    const lqIO = new IntersectionObserver((entries, obs)=>{
      for (const { isIntersecting, target } of entries){
        if (!isIntersecting) continue;
        const src = target.getAttribute('data-src') || target.getAttribute('src');
        if (src) {
          // force reload to ensure decode (works for data-src)
          if (target.hasAttribute('data-src')) target.src = target.getAttribute('data-src');
          target.decode?.().catch(()=>null).finally(()=> target.classList.add('is-loaded'));
        }
        obs.unobserve(target);
      }
    }, { rootMargin:'200px 0px', threshold:0.01 });

    // Hover tilt (safe for reduced motion)
    const tiltBind = (el) => {
      if (isRM()) return;
      let rAF = 0;
      const onMove = (e) => {
        cancelAnimationFrame(rAF);
        rAF = raf(()=> {
          const rect = el.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top)  / rect.height - 0.5;
          const rx = clamp(-y * 8, -8, 8);
          const ry = clamp( x * 12, -12, 12);
          el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
        });
      };
      const reset = () => { el.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateZ(0)'; };
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerleave', reset);
      el.addEventListener('blur', reset);
    };

    // Prefetch on hover (anchors only)
    const prefetchBind = (a) => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      let hinted = false;
      const hint = () => {
        if (hinted) return; hinted = true;
        const l = d.createElement('link');
        l.rel = 'prefetch'; l.href = href; d.head.appendChild(l);
      };
      a.addEventListener('pointerenter', hint, { passive:true });
      a.addEventListener('focus', hint, { passive:true });
    };

    const init = () => {
      imgs.forEach(img => lqIO.observe(img));
      tiles.forEach(tiltBind);
      tiles.forEach(preview => prefetchBind(preview));
    };
    return { init };
  })();

  // ---------- Boot
  const Boot = () => {
    // Remove no-js
    d.documentElement.classList.remove('no-js');

    // Theme
    Theme.init(); Theme.bind();

    // Loading gate
    w.addEventListener('load', Loading.ready);

    // Progress bar
    ScrollProgress.mount();

    // Router (reveal + spy + smooth + hash)
    Router.init();

    // Starfield
    Starfield.start();

    // Home, Skills, Gaming
    Home.init();
    Skills.init();
    Gaming.init();

    // Footer year
    if ($year) $year.textContent = new Date().getFullYear();
  };

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', Boot);
  else Boot();
})();
