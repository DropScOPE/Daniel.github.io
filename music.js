// Simple vinyl toggle: click = play/pause; resume from last position
document.addEventListener('DOMContentLoaded', () => {
  const vinylBtn = document.getElementById('vinylToggle');
  const audio    = document.getElementById('bgm');

  if (!vinylBtn || !audio) {
    console.error('[music] Missing #vinylToggle or #bgm in DOM.');
    return;
  }

  // Default volume (no on-page controls)
  const DEFAULT_VOL = 0.85;
  audio.volume = DEFAULT_VOL;

  // Helpful diagnostics if the file can’t load
  audio.addEventListener('error', (e) => {
    console.error('[music] Audio error:', e, 'src=', audio.currentSrc || '(no src)');
  });

  const setPlayingUI = (isPlaying) => {
    vinylBtn.classList.toggle('is-playing', isPlaying);
    vinylBtn.setAttribute('aria-pressed', String(isPlaying));
  };

  const safePlay = () =>
    audio.play()
      .then(() => setPlayingUI(true))
      .catch((err) => {
        console.warn('[music] play() was blocked or failed:', err?.message || err);
        setPlayingUI(false);
      });

  const toggle = () => (audio.paused ? safePlay() : (audio.pause(), setPlayingUI(false)));

  // Click/tap handlers (pointerup catches some devices that swallow click)
  vinylBtn.addEventListener('click', toggle);
  vinylBtn.addEventListener('pointerup', toggle);
  vinylBtn.addEventListener('contextmenu', (e) => e.preventDefault());

  // Keep UI in sync if state changes elsewhere
  audio.addEventListener('play',  () => setPlayingUI(true));
  audio.addEventListener('pause', () => setPlayingUI(false));
  audio.addEventListener('ended', () => setPlayingUI(false));

  // Prewarm after first user gesture to avoid slow first play
  const unlock = () => {
    try { audio.load(); } catch {}
    window.removeEventListener('pointerdown', unlock, { passive: true });
  };
  window.addEventListener('pointerdown', unlock, { passive: true });
});
