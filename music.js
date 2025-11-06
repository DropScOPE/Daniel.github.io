// Background music controller with persistent position + vinyl spinner
(() => {
  'use strict';
  const d = document;

  const audio = d.getElementById('bgm');
  const btn   = d.getElementById('vinylToggle');

  if (!audio || !btn) return;

  // === CONFIG ===
  // Replace this if your <audio> doesn't have a <source> element.
  // audio.src = 'music/track.mp3';

  const K_TIME = 'dd-bgm-time';
  const K_PLAY = 'dd-bgm-playing';
  const canRM  = matchMedia('(prefers-reduced-motion: reduce)');

  // Restore last position & state
  try {
    const t = parseFloat(localStorage.getItem(K_TIME));
    if (!Number.isNaN(t) && t > 0) audio.currentTime = t;
  } catch {}
  let shouldResume = localStorage.getItem(K_PLAY) === '1';

  // Keep time every ~2s while playing
  let saveTick = null;
  const startSaving = () => {
    stopSaving();
    saveTick = setInterval(() => {
      try { localStorage.setItem(K_TIME, String(audio.currentTime||0)); } catch {}
    }, 2000);
  };
  const stopSaving = () => { if (saveTick) { clearInterval(saveTick); saveTick = null; } };

  const setPlayingUI = (isPlaying) => {
    btn.classList.toggle('is-playing', isPlaying && !canRM.matches);
    btn.setAttribute('aria-pressed', String(isPlaying));
    btn.setAttribute('aria-label', isPlaying ? 'Pause background music' : 'Play background music');
    btn.title = isPlaying ? 'Pause (M)' : 'Play (M)';
  };

  const play = async () => {
    try {
      await audio.play();
      localStorage.setItem(K_PLAY, '1');
      setPlayingUI(true);
      startSaving();
    } catch (err) {
      // Autoplay blocked until user gesture – do nothing.
      console.warn('[bgm] play blocked until a gesture', err);
    }
  };
  const pause = () => {
    audio.pause();
    localStorage.setItem(K_PLAY, '0');
    setPlayingUI(false);
    stopSaving();
    try { localStorage.setItem(K_TIME, String(audio.currentTime||0)); } catch {}
  };

  // Toggle on click
  btn.addEventListener('click', () => {
    if (audio.paused) play(); else pause();
  });

  // Keyboard shortcut: M to toggle
  d.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key.toLowerCase() === 'm') {
      e.preventDefault();
      if (audio.paused) play(); else pause();
    }
  });

  // Update UI on events
  audio.addEventListener('play',  () => setPlayingUI(true));
  audio.addEventListener('pause', () => setPlayingUI(false));
  audio.addEventListener('ended', () => {
    // If not looping, preserve last time as end.
    try { localStorage.setItem(K_TIME, String(audio.currentTime||0)); } catch {}
    localStorage.setItem(K_PLAY, '0');
    setPlayingUI(false);
    stopSaving();
  });

  // Respect reduced motion for spinner only (audio still works)
  canRM.addEventListener('change', () => setPlayingUI(!audio.paused));

  // If user previously left it playing, only resume on first user interaction (autoplay policies)
  const tryResume = () => {
    if (!shouldResume) return;
    shouldResume = false;
    play();
    d.removeEventListener('pointerdown', tryResume);
    d.removeEventListener('keydown', tryResume);
  };
  d.addEventListener('pointerdown', tryResume, { once:false, passive:true });
  d.addEventListener('keydown', tryResume, { once:false });

  // Initialize UI now
  setPlayingUI(!audio.paused && localStorage.getItem(K_PLAY) === '1');
})();
