// Enhanced background music: progress ring, HUD, seek, volume, wheel-to-volume, long-press mute.
(() => {
  'use strict';
  const d = document, $ = (s,r=d)=>r.querySelector(s);

  const audio = $('#bgm');
  const btn   = $('#vinylToggle');
  const hud   = $('#musicHud');
  const elTitle = $('#hudTitle');
  const elTime  = $('#hudTime');
  const seek    = $('#hudSeek');
  const vol     = $('#hudVol');

  if (!audio || !btn || !hud) return;

  // ---- Config / state
  const K_TIME = 'dd-bgm-time';
  const K_PLAY = 'dd-bgm-playing';
  const K_VOL  = 'dd-bgm-volume';
  const RM_MQ  = matchMedia('(prefers-reduced-motion: reduce)');

  // init title from current source
  const src = (audio.currentSrc || audio.src || $('source', audio)?.src || '').split('/').pop() || 'track';
  elTitle.textContent = decodeURIComponent(src);

  // restore volume
  const storedVol = Number(localStorage.getItem(K_VOL));
  audio.volume = Number.isFinite(storedVol) ? Math.min(1, Math.max(0, storedVol)) : 0.8;
  vol.value = String(audio.volume);

  // restore time + pending resume
  try {
    const t = parseFloat(localStorage.getItem(K_TIME));
    if (!Number.isNaN(t) && t > 0) audio.currentTime = t;
  } catch {}
  let resumePending = localStorage.getItem(K_PLAY) === '1';

  // ---- Helpers
  const fmt = s => {
    if (!Number.isFinite(s)) return '0:00';
    s = Math.max(0, Math.floor(s));
    const m = Math.floor(s/60), r = s%60;
    return `${m}:${String(r).padStart(2,'0')}`;
  };
  const setPlayUI = (playing) => {
    btn.classList.toggle('is-playing', playing && !RM_MQ.matches);
    btn.setAttribute('aria-pressed', String(playing));
    btn.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
    btn.title = playing ? 'Pause (M)' : 'Play (M)';
    hud.classList.toggle('is-open', playing); // auto-open HUD while playing
  };
  const setProgressRing = () => {
    const p = (audio.currentTime / (audio.duration || 1)) * 360;
    // CSS conic progress
    btn.style.setProperty('--p', `${isFinite(p) ? p : 0}deg`);
  };
  const updateTimeUI = () => {
    elTime.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
    // keep slider in sync (avoid dragging conflict)
    if (!seek.matches(':active')) seek.value = String((audio.currentTime || 0) / (audio.duration || 1));
  };

  // ---- Play/pause core
  const play = async () => {
    try {
      await audio.play();
      localStorage.setItem(K_PLAY,'1');
      setPlayUI(true);
      ticker.start();
    } catch(e){ /* gesture required, ignore */ }
  };
  const pause = () => {
    audio.pause();
    localStorage.setItem(K_PLAY,'0');
    setPlayUI(false);
    ticker.stop();
    try { localStorage.setItem(K_TIME, String(audio.currentTime||0)); } catch {}
  };

  // ---- Ticker (progress + save time)
  const ticker = (() => {
    let id=0, lastSave=0;
    const step = (t) => {
      setProgressRing(); updateTimeUI();
      if (!lastSave || t - lastSave > 2000){
        try { localStorage.setItem(K_TIME, String(audio.currentTime||0)); } catch {}
        lastSave = t;
      }
      id = requestAnimationFrame(step);
    };
    const start = () => { if(id) return; id = requestAnimationFrame(step); };
    const stop  = () => { if(id){ cancelAnimationFrame(id); id=0; } };
    return { start, stop };
  })();

  // ---- Events
  btn.addEventListener('click', () => audio.paused ? play() : pause());

  // Wheel over vinyl or HUD to change volume
  const wheelVol = (e) => {
    e.preventDefault();
    const delta = (e.deltaY || e.wheelDelta) > 0 ? -0.05 : 0.05;
    audio.volume = Math.min(1, Math.max(0, audio.volume + delta));
    vol.value = String(audio.volume);
    try { localStorage.setItem(K_VOL, String(audio.volume)); } catch {}
  };
  btn.addEventListener('wheel', wheelVol, { passive:false });
  hud.addEventListener('wheel', wheelVol, { passive:false });

  // Long-press to mute/unmute
  (() => {
    let t=0, pressed=false;
    const down = () => { pressed=true; t = setTimeout(()=>{ pressed=false; audio.muted = !audio.muted; btn.classList.toggle('is-muted', audio.muted); }, 550); };
    const up   = () => { clearTimeout(t); if(pressed){ /* short click handled by default */ } pressed=false; };
    btn.addEventListener('pointerdown', down);
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
  })();

  // Keyboard M toggle; ArrowUp/Down volume; ArrowLeft/Right seek 5s
  d.addEventListener('keydown', (e)=>{
    if (e.metaKey||e.ctrlKey||e.altKey) return;
    const k = e.key.toLowerCase();
    if (k==='m'){ e.preventDefault(); audio.paused ? play() : pause(); }
    if (k==='arrowup'){ e.preventDefault(); audio.volume = Math.min(1, audio.volume + .04); vol.value = String(audio.volume); }
    if (k==='arrowdown'){ e.preventDefault(); audio.volume = Math.max(0, audio.volume - .04); vol.value = String(audio.volume); }
    if (k==='arrowleft'){ e.preventDefault(); audio.currentTime = Math.max(0, audio.currentTime - 5); }
    if (k==='arrowright'){ e.preventDefault(); audio.currentTime = Math.min(audio.duration||0, audio.currentTime + 5); }
  });

  // Seek bar
  seek.addEventListener('input', ()=>{
    audio.currentTime = (audio.duration||0) * parseFloat(seek.value || '0');
    setProgressRing(); updateTimeUI();
  });

  // Volume bar
  vol.addEventListener('input', ()=>{
    audio.volume = Math.min(1, Math.max(0, parseFloat(vol.value || '0')));
    try { localStorage.setItem(K_VOL, String(audio.volume)); } catch {}
  });

  // Audio event sync
  audio.addEventListener('play',  ()=> setPlayUI(true));
  audio.addEventListener('pause', ()=> setPlayUI(false));
  audio.addEventListener('timeupdate', ()=> { setProgressRing(); updateTimeUI(); });
  audio.addEventListener('durationchange', ()=> updateTimeUI());
  audio.addEventListener('ended', ()=> { localStorage.setItem(K_PLAY,'0'); setPlayUI(false); ticker.stop(); });

  // Respect reduced motion for spinner
  RM_MQ.addEventListener('change', ()=> setPlayUI(!audio.paused));

  // Ambient open/close HUD on proximity
  const openHud = () => hud.classList.add('is-open');
  const closeHudDelay = (()=>{ let t=0; return ()=>{ clearTimeout(t); t=setTimeout(()=> hud.matches(':hover')||btn.matches(':hover') ? openHud() : hud.classList.remove('is-open'), 500); }; })();
  btn.addEventListener('pointerenter', openHud);
  btn.addEventListener('pointerleave', closeHudDelay);
  hud.addEventListener('pointerleave', closeHudDelay);

  // Resume on first gesture if previously playing (autoplay policy)
  const tryResume = () => {
    if (!resumePending) return;
    resumePending = false; play();
    d.removeEventListener('pointerdown', tryResume);
    d.removeEventListener('keydown', tryResume);
  };
  d.addEventListener('pointerdown', tryResume, { passive:true });
  d.addEventListener('keydown', tryResume);

  // Prime UI
  setProgressRing(); updateTimeUI(); setPlayUI(localStorage.getItem(K_PLAY)==='1' && !audio.paused);
})();
