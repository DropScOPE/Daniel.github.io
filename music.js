// Simple vinyl toggle: click = play/pause; resume from last position
(() => {
  const vinylBtn = document.getElementById('vinylToggle');
  const audio = document.getElementById('bgm');

  if (!vinylBtn || !audio) return;

  // Set your default volume here (kept constant; no on-page controls)
  const DEFAULT_VOL = 0.85;
  audio.volume = DEFAULT_VOL;

  // Toggle UI state helper
  const setPlayingUI = (isPlaying) => {
    vinylBtn.classList.toggle('is-playing', isPlaying);
    vinylBtn.setAttribute('aria-pressed', String(isPlaying));
  };

  // Play with policy-safe handling
  const safePlay = () =>
    audio.play().then(() => setPlayingUI(true)).catch(() => {
      // If autoplay policy blocks, do nothing visible.
      setPlayingUI(false);
    });

  const toggle = () => (audio.paused ? safePlay() : (audio.pause(), setPlayingUI(false)));

  // Mouse / touch
  vinylBtn.addEventListener('click', toggle);

  // Prevent long-press context menu from feeling janky on touch
  vinylBtn.addEventListener('contextmenu', (e) => e.preventDefault());

  // Reflect state when audio ends or pauses
  audio.addEventListener('pause', ()
