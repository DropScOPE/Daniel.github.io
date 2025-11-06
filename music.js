// Smooth WebAudio BGM: soft fades, ring progress, HUD seek/vol, wheel-volume, long-press mute, Media Session.
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

  // ---------- Persistent keys
  const K_TIME='dd-bgm-time', K_PLAY='dd-bgm-playing', K_VOL='dd-bgm-volume';

  // ---------- WebAudio graph (for click-free fades)
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const src = ctx.createMediaElementSource(audio);
  const gain = ctx.createGain();
  gain.gain.value = 0.0; // start silent; we’ll fade in on play
  src.connect(gain).connect(ctx.destination);

  // helpers
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  const fmt = s => {
    if (!Number.isFinite(s)) return '0:00';
    s = Math.max(0, Math.floor(s));
    const m = Math.floor(s/60), r = s%60;
    return `${m}:${String(r).padStart(2,'0')}`;
  };
  const now = () => ctx.currentTime || audio.currentTime || 0;

  // ---------- Restore state
  const srcName = (audio.currentSrc || audio.src || $('source',audio)?.src || '').split('/').pop() || 'track.mp3';
  elTitle.textContent = decodeURIComponent(srcName);

  const savedVol = Number(localStorage.getItem(K_VOL));
  audio.volume = clamp(Number.isFinite(savedVol) ? savedVol : 0.85, 0, 1);
  vol.value = String(audio.volume);

  try {
    const t = parseFloat(localStorage.getItem(K_TIME));
    if (!Number.isNaN(t) && t>0) audio.currentTime = t;
  } catch {}
  let resumePending = localStorage.getItem(K_PLAY) === '1';

  // ---------- UI update
  const setRing = () => {
    const p = (audio.currentTime/(audio.duration||1))*360;
    btn.style.setProperty('--p', `${isFinite(p)?p:0}deg`);
  };
  const setTime = () => {
    elTime.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
    if (!seek.matches(':active')) seek.value = String((audio.currentTime||0)/(audio.duration||1));
  };
  const setPlayingUI = (playing) => {
    const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    btn.classList.toggle('is-playing', playing && !rm);
    btn.setAttribute('aria-pressed', String(playing));
    btn.title = playing ? 'Pause (M)' : 'Play (M)';
    btn.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
    hud.classList.toggle('is-open', playing);
  };

  // ---------- Gain ramp (no clicks)
  const rampTo = (value, dur=0.18) => {
    const t = now();
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(clamp(value,0,1), t + dur);
  };

  // ---------- Playback control
  const play = async () => {
    try{
      if (ctx.state !== 'running') await ctx.resume();
      await audio.play();
      rampTo(audio.volume, 0.22);
      localStorage.setItem(K_PLAY,'1');
      ticker.start(); setPlayingUI(true);
    }catch(e){ /* user gesture needed; ignore */ }
  };
  const pause = () => {
    rampTo(0.0, 0.18);
    setTimeout(()=> audio.pause(), 190); // pause after fade-out
    localStorage.setItem(K_PLAY,'0');
    ticker.stop(); setPlayingUI(false);
    try{ localStorage.setItem(K_TIME, String(audio.currentTime||0)); }catch{}
  };

  // ---------- Global ticker (progress + autosave)
  const ticker = (()=> {
    let id=0, lastSave=0;
    const step = (t) => {
      setRing(); setTime();
      if (!lastSave || t-lastSave>1800){
        try{ localStorage.setItem(K_TIME, String(audio.currentTime||0)); }catch{}
        lastSave = t;
      }
      id = requestAnimationFrame(step);
    };
    return {
      start(){ if(!id) id = requestAnimationFrame(step); },
      stop(){ if(id){ cancelAnimationFrame(id); id=0; } }
    };
  })();

  // ---------- Event wiring
  btn.addEventListener('click', ()=> audio.paused ? play() : pause());

  // wheel-to-volume on vinyl/HUD
  const wheelVol = (e) => {
    e.preventDefault();
    const delta = (e.deltaY||e.wheelDelta) > 0 ? -0.05 : 0.05;
    audio.volume = clamp(audio.volume + delta, 0, 1);
    vol.value = String(audio.volume);
    try{ localStorage.setItem(K_VOL, String(audio.volume)); }catch{}
    if (!audio.paused) rampTo(audio.volume, 0.12); // smooth adjust while playing
  };
  btn.addEventListener('wheel', wheelVol, { passive:false });
  hud.addEventListener('wheel', wheelVol, { passive:false });

  // long-press mute/unmute
  (()=> {
    let t=0, pressed=false, prevVol=audio.volume;
    const down = () => { pressed=true; t=setTimeout(()=>{ pressed=false; prevVol=audio.volume; audio.volume=0; vol.value='0'; rampTo(0,0.15); }, 520); };
    const up = () => { clearTimeout(t); if(!pressed) return; /* short-click handled by click */ };
    btn.addEventListener('pointerdown', down);
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
  })();

  // keyboard: M toggle, arrows seek/vol
  d.addEventListener('keydown', (e)=>{
    if(e.metaKey||e.ctrlKey||e.altKey) return;
    const k=e.key.toLowerCase();
    if(k==='m'){ e.preventDefault(); audio.paused ? play() : pause(); }
    if(k==='arrowleft'){ e.preventDefault(); audio.currentTime = clamp(audio.currentTime-5, 0, audio.duration||0); }
    if(k==='arrowright'){ e.preventDefault(); audio.currentTime = clamp(audio.currentTime+5, 0, audio.duration||0); }
    if(k==='arrowup'){ e.preventDefault(); audio.volume = clamp(audio.volume+.04,0,1); vol.value=String(audio.volume); if(!audio.paused) rampTo(audio.volume,0.1); }
    if(k==='arrowdown'){ e.preventDefault(); audio.volume = clamp(audio.volume-.04,0,1); vol.value=String(audio.volume); if(!audio.paused) rampTo(audio.volume,0.1); }
  });

  // Seek + Volume sliders
  seek.addEventListener('input', ()=>{
    audio.currentTime = (audio.duration||0) * parseFloat(seek.value||'0');
    setRing(); setTime();
  });
  vol.addEventListener('input', ()=>{
    audio.volume = clamp(parseFloat(vol.value||'0'),0,1);
    try{ localStorage.setItem(K_VOL, String(audio.volume)); }catch{}
    if(!audio.paused) rampTo(audio.volume, 0.1);
  });

  // Audio events
  audio.addEventListener('play',  ()=> setPlayingUI(true));
  audio.addEventListener('pause', ()=> setPlayingUI(false));
  audio.addEventListener('timeupdate', ()=> { setRing(); setTime(); });
  audio.addEventListener('durationchange', ()=> setTime());
  audio.addEventListener('ended', ()=> { localStorage.setItem(K_PLAY,'0'); setPlayingUI(false); ticker.stop(); rampTo(0,0.15); });

  // Media Session (lock-screen / headset buttons)
  if ('mediaSession' in navigator){
    navigator.mediaSession.metadata = new MediaMetadata({
      title: elTitle.textContent,
      artist: 'Daniel',
      album: 'Site BGM',
      artwork: [{ src: 'images/Vynl.png', sizes: '512x512', type: 'image/png' }]
    });
    navigator.mediaSession.setActionHandler('play', play);
    navigator.mediaSession.setActionHandler('pause', pause);
    navigator.mediaSession.setActionHandler('seekbackward', ()=> audio.currentTime = clamp(audio.currentTime-10, 0, audio.duration||0));
    navigator.mediaSession.setActionHandler('seekforward', ()=> audio.currentTime = clamp(audio.currentTime+10, 0, audio.duration||0));
    navigator.mediaSession.setActionHandler('seekto', (d)=> { if (d.seekTime!=null) audio.currentTime = clamp(d.seekTime,0,audio.duration||0); });
  }

  // Resume on first gesture if it was playing previously (autoplay policy)
  const tryResume = () => {
    if (!resumePending) return;
    resumePending=false; play();
    d.removeEventListener('pointerdown', tryResume);
    d.removeEventListener('keydown', tryResume);
  };
  d.addEventListener('pointerdown', tryResume, { passive:true });
  d.addEventListener('keydown', tryResume);

  // Prime UI
  setRing(); setTime(); setPlayingUI(localStorage.getItem(K_PLAY)==='1' && !audio.paused);
})();
