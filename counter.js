(() => {
  // Static value for the view count (fixed at 3,4k)
  const fixedCount = '3,4k';

  const el = document.getElementById('vc-n');
  if (el) el.textContent = fixedCount;
})();
