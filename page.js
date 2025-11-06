// Page boot: no-js swap, theme, loader, progress, router, starfield, footer year
(() => {
  'use strict';
  const d=document;

  d.documentElement.classList.remove('no-js');

  // Theme + controls
  DD.theme.init();
  DD.theme.bind();

  // Loading gate
  addEventListener('load', DD.loading.ready);

  // Progress bar
  DD.progress.mount();

  // Router (reveal + spy + smooth)
  DD.router.init();

  // Starfield
  DD.starfield.start();

  // Year
  if (DD.$.year) DD.$.year.textContent = new Date().getFullYear();
})();
