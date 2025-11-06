// Utilities, theme, loading, router/spy/reveal, starfield
(() => {
  'use strict';
  const d=document, w=window, DPR=w.devicePixelRatio||1;
  const qs=(s,r=d)=>r.querySelector(s), qsa=(s,r=d)=>Array.from(r.querySelectorAll(s));
  const raf=(fn)=>requestAnimationFrame(fn);
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  const isRM=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

  // public namespace
  const DD = (w.DD = w.DD || {});

  // cache
  DD.$ = {
    loading: qs('#loading'),
    star: qs('#starfield'),
    nav: qs('#main-nav'),
    year: qs('#year') || qs('#current-year'),
  };

  // mobile 100vh fix
  DD.setVh = () => {
    const vh = Math.max(1, w.innerHeight * 0.01);
    d.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  DD.setVh();
  addEventListener('resize', ()=>{ clearTimeout(DD._vh); DD._vh=setTimeout(DD.setVh,120); });

  // Theme
  DD.theme = (()=> {
    const KEY='dd-theme', mql=matchMedia('(prefers-color-scheme: light)');
    const get=()=>localStorage.getItem(KEY);
    const apply=(m)=>d.documentElement.setAttribute('data-theme', m);
    const set=(m)=>{ apply(m); localStorage.setItem(KEY, m); };
    const init=()=> apply(get() || (mql.matches ? 'light' : 'dark'));
    const bind=()=> {
      const btn = qs('#themeToggle');
      const icon = () => d.documentElement.getAttribute('data-theme')==='light' ? '🌞' : '🌙';
      if (btn){
        btn.textContent = icon();
        btn.setAttribute('aria-pressed', d.documentElement.getAttribute('data-theme')!=='light');
        btn.addEventListener('click', ()=>{
          const next = d.documentElement.getAttribute('data-theme')==='light'?'dark':'light';
          set(next); btn.textContent=icon(); btn.setAttribute('aria-pressed', next!=='light');
        });
      }
      mql.addEventListener('change', e=>{ if(!get()) apply(e.matches?'light':'dark'); if(btn) btn.textContent=icon(); });
      d.addEventListener('keydown', e=>{
        if(e.metaKey||e.ctrlKey||e.altKey) return;
        if(e.key.toLowerCase()==='t'){ e.preventDefault();
          const next=d.documentElement.getAttribute('data-theme')==='light'?'dark':'light';
          set(next); if(btn){ btn.textContent=icon(); btn.setAttribute('aria-pressed', next!=='light'); }
        }
      });
    };
    return { init, bind };
  })();

  // Loading
  DD.loading = (()=> {
    const hide = () => { const el = DD.$.loading; if (el){ el.classList.add('hidden'); el.setAttribute('aria-hidden','true'); } };
    const ready = () => isRM() ? hide() : setTimeout(hide, 320);
    return { ready };
  })();

  // Scroll progress
  DD.progress = (()=> {
    let bar;
    const mount = () => {
      if (qs('[data-scroll-progress]')) return;
      bar = d.createElement('div'); bar.setAttribute('data-scroll-progress',''); d.body.appendChild(bar);
      const place = () => { bar.style.top = ((DD.$.nav ? DD.$.nav.offsetHeight : 54)) + 'px'; };
      const upd = () => { const max = d.documentElement.scrollHeight - innerHeight; bar.style.width = (max>0 ? (scrollY/max)*100 : 0) + '%'; };
      place(); upd();
      addEventListener('resize', ()=>{ place(); upd(); });
      addEventListener('scroll', upd, { passive:true });
    };
    return { mount };
  })();

  // Router + spy + reveal
  DD.router = (()=> {
    const links = qsa('nav a[href^="#"], [data-link]');
    const sections = links.map(a=>qs(a.getAttribute('href'))).filter(Boolean);
    const smoothTo = (target) => {
      const el = typeof target==='string' ? qs(target) : target;
      el && el.scrollIntoView({ behavior:'smooth', block:'start' });
    };

    d.addEventListener('click', e=>{
      const a = e.target.closest('a[href^="#"]'); if(!a) return;
      const el = qs(a.getAttribute('href')); if(!el) return;
      e.preventDefault(); smoothTo(el); history.replaceState(null,'',a.getAttribute('href'));
    });

    const spy = new IntersectionObserver((es)=>{
      for (const e of es){
        if(!e.isIntersecting) continue;
        links.forEach(l=>l.removeAttribute('aria-current'));
        const id='#'+e.target.id; const a = links.find(l=>l.getAttribute('href')===id); a && a.setAttribute('aria-current','page');
      }
    }, { rootMargin:'-45% 0px -50% 0px', threshold:.01 });

    const rev = new IntersectionObserver((es)=>{
      for (const e of es) if (e.isIntersecting) e.target.classList.add('is-visible');
    }, { rootMargin:'-12% 0px', threshold:.08 });

    const init = () => {
      sections.forEach(s=>{ spy.observe(s); rev.observe(s); });
      if (location.hash && qs(location.hash)) setTimeout(()=>smoothTo(location.hash),10);
      addEventListener('hashchange', ()=>{ if(qs(location.hash)) smoothTo(location.hash); });
    };

    return { init, smoothTo };
  })();

  // Starfield
  DD.starfield = (()=> {
    const canvas = DD.$.star; if(!canvas) return { start:()=>{}, stop:()=>{} };
    const ctx = canvas.getContext('2d', { alpha:true });
    let W=0,H=0,last=0,stars=[],running=false; const SPEED=.18;

    const resize = () => {
      W = Math.max(1, Math.floor(innerWidth*DPR));
      H = Math.max(1, Math.floor(innerHeight*DPR));
      canvas.width=W; canvas.height=H; canvas.style.width=W/DPR+'px'; canvas.style.height=H/DPR+'px';
      const count = Math.min(220, Math.max(90, Math.floor((W/DPR)*(H/DPR)/9000)));
      stars = new Array(count).fill(0).map(()=>({ x:Math.random()*W, y:Math.random()*H, z:Math.random()*.8+.2, s:Math.random()*1.5+.2 }));
    };

    const draw = (now) => {
      if(!running) return; const dt=Math.min(34, now-(last||now)); last=now;
      ctx.clearRect(0,0,W,H);
      for (let i=0;i<stars.length;i++){
        const st = stars[i]; st.x += st.z*SPEED*dt*DPR; if (st.x > W){ st.x=0; st.y=Math.random()*H; }
        ctx.fillStyle = `rgba(255,255,255,${.4+st.z*.6})`; ctx.fillRect(st.x, st.y, st.s*DPR, st.s*DPR);
      }
      raf(draw);
    };

    const start = () => { if (isRM()) return; resize(); running=true; raf(draw); };
    const stop  = () => { running=false; };

    addEventListener('resize', ()=>{ clearTimeout(canvas._t); canvas._t = setTimeout(resize, 120); });
    document.addEventListener('visibilitychange', ()=>{ if(document.hidden) stop(); else start(); });
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e=> e.matches ? stop() : start());

    return { start, stop };
  })();

})();
