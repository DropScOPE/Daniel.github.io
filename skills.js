(() => {
  'use strict';
  const d=document, qs=(s,r=d)=>r.querySelector(s), qsa=(s,r=d)=>Array.from(r.querySelectorAll(s));
  const raf=(fn)=>requestAnimationFrame(fn);
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));

  const root = qs('#skills');
  if (!root) return;

  const rows = qsa('.row', root);
  const getLvl = (row) => clamp(Number(row.dataset.level||0),0,100);

  const inc = (el,to,ms=650) => {
    if(!el) return;
    const from = Number(el.textContent.replace('%','')) || 0;
    const st = performance.now();
    (function step(t){
      const k = Math.min(1, (t-st)/ms);
      el.textContent = Math.round(from + (to-from)*k) + '%';
      if (k<1) raf(step);
    })(st);
  };

  const io = new IntersectionObserver((entries, obs)=>{
    for (const {isIntersecting, target} of entries){
      if (!isIntersecting) continue;
      const lvl  = getLvl(target);
      const bar  = target.querySelector('.fill');
      const code = target.querySelector('code');
      if (bar){
        bar.style.transition = 'width 900ms cubic-bezier(.2,.9,.2,1)';
        bar.style.width = lvl + '%';
      }
      if (code) inc(code, lvl, 750);
      target.setAttribute('aria-valuenow', String(lvl));
      obs.unobserve(target);
    }
  }, { threshold:.35 });

  rows.forEach(r => io.observe(r));
})();
