(() => {
  'use strict';
  const d=document, qsa=(s,r=d)=>Array.from(r.querySelectorAll(s));
  const raf=(fn)=>requestAnimationFrame(fn);
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  const isRM=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

  const root = document.querySelector('#gaming');
  if (!root) return;

  const tiles = qsa('.card', root);
  const imgs  = qsa('img[loading="lazy"]', root);

  // lazy decode
  const lq = new IntersectionObserver((entries, obs)=>{
    entries.forEach(({isIntersecting, target})=>{
      if(!isIntersecting) return;
      target.decode?.().catch(()=>null).finally(()=>target.classList.add('is-loaded'));
      obs.unobserve(target);
    });
  }, { rootMargin:'200px 0px', threshold:.01 });
  imgs.forEach(i=> lq.observe(i));

  // tilt
  const tilt = (el) => {
    if (isRM()) return;
    let id=0;
    const imgWrap = el.querySelector('.img');
    if(!imgWrap) return;
    const move = (e) => {
      cancelAnimationFrame(id);
      id = raf(()=>{
        const r = imgWrap.getBoundingClientRect();
        const x = (e.clientX - r.left)/r.width - .5;
        const y = (e.clientY - r.top)/r.height - .5;
        const rx = clamp(-y*8, -8, 8), ry = clamp(x*12, -12, 12);
        imgWrap.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
    };
    const reset = () => { imgWrap.style.transform = 'perspective(900px) rotateX(0) rotateY(0)'; };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', reset);
    el.addEventListener('blur', reset);
  };
  tiles.forEach(tilt);

  // prefetch
  const prefetch = (a) => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    let hinted = false;
    const hint = () => {
      if (hinted) return; hinted = true;
      const l = document.createElement('link');
      l.rel = 'prefetch'; l.href = href; document.head.appendChild(l);
    };
    a.addEventListener('pointerenter', hint, { passive:true });
    a.addEventListener('focus', hint, { passive:true });
  };
  tiles.forEach(prefetch);
})();
