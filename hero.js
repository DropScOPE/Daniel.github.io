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
      const
