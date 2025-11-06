(() => {
  'use strict';
  const d=document, qs=(s,r=d)=>r.querySelector(s);
  const raf=(fn)=>requestAnimationFrame(fn);
  const isRM=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

  const h1 = qs('#home h1');
  const p  = qs('#home p');

  function type(el, txt, delay=22){
    if(!el || !txt || isRM()) return;
    el.textContent=''; let i=0;
    (function step(){ if(i>=txt.length) return; el.textContent += txt.charAt(i++); setTimeout(step, delay); })();
  }

  function runType(){
    if(!h1 || !p || isRM()) return;
    const ht = h1.textContent.trim(), pt = p.textContent.trim();
    type(h1, ht, 26);
    setTimeout(()=> type(p, pt, 18), Math.min(1200, 20*ht.length));
  }

  let ticking=false;
  function parallax(e){
    if(isRM() || !h1 || !p) return;
    if(ticking) return; ticking=true;
    raf(()=>{
      const x = e.clientX/innerWidth - 0.5;
      const y = e.clientY/innerHeight - 0.5;
      h1.style.transform = `translate3d(${x*8}px, ${y*6}px, 0)`;
      p.style.transform  = `translate3d(${x*4}px, ${y*3}px, 0)`;
      ticking=false;
    });
  }

  function mountTopBtn(){
    if (document.querySelector('[data-backtop]')) return;
    const btn = document.createElement('button');
    btn.setAttribute('data-backtop',''); btn.setAttribute('title','Back to top (H)'); btn.textContent='↑';
    Object.assign(btn.style,{position:'fixed',right:'16px',bottom:'16px',zIndex:'999',
      width:'44px',height:'44px',borderRadius:'999px',background:'var(--bg3)',color:'var(--text)',
      border:'1px solid var(--edge)',cursor:'pointer',opacity:'0',transform:'translateY(10px)',
      transition:'opacity .2s ease, transform .2s ease'});
    btn.addEventListener('click', ()=> window.DD.router.smoothTo('#home'));
    document.body.appendChild(btn);
    addEventListener('scroll', ()=>{
      const show = scrollY > innerHeight * .75;
      btn.style.opacity = show ? '1':'0';
      btn.style.transform = show ? 'translateY(0)':'translateY(10px)';
    }, { passive:true });
  }

  function shortcuts(){
    document.addEventListener('keydown', e=>{
      if(e.metaKey||e.ctrlKey||e.altKey) return;
      const k = e.key.toLowerCase();
      if (k==='h'){ e.preventDefault(); window.DD.router.smoothTo('#home'); }
      if (k==='s'){ e.preventDefault(); window.DD.router.smoothTo('#skills'); }
      if (k==='g'){ e.preventDefault(); window.DD.router.smoothTo('#gaming'); }
    });
  }

  // init
  runType();
  addEventListener('pointermove', parallax);
  mountTopBtn();
  shortcuts();
})();
