(() => {
  const root = document.documentElement;
  root.classList.remove('no-js');

  /* -------------------------------------------------------
   * Feature flags & utilities
   * ----------------------------------------------------- */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersLightScheme = window.matchMedia('(prefers-color-scheme: light)');

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const lerp = (start, end, t) => start + (end - start) * t;

  /* -------------------------------------------------------
   * Theme handling
   * ----------------------------------------------------- */
  const themeToggle = document.getElementById('themeToggle');
  const themeKey = 'dd-theme';

  const applyTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(themeKey, theme);
    if (themeToggle) {
      const isDark = theme === 'dark';
      themeToggle.setAttribute('aria-pressed', String(isDark));
      const icon = isDark ? '🌙' : '🌞';
      themeToggle.querySelector('.theme-icon').textContent = icon;
    }
    document.querySelector('meta[name="theme-color"]').setAttribute('content', theme === 'dark' ? '#05070b' : '#f6f8fc');
  };

  const savedTheme = localStorage.getItem(themeKey);
  if (savedTheme) {
    applyTheme(savedTheme);
  } else {
    applyTheme(prefersLightScheme.matches ? 'light' : 'dark');
  }

  prefersLightScheme.addEventListener('change', (event) => {
    if (!localStorage.getItem(themeKey)) {
      applyTheme(event.matches ? 'light' : 'dark');
    }
  });

  themeToggle?.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });

  /* -------------------------------------------------------
   * Loading overlay
   * ----------------------------------------------------- */
  window.addEventListener('load', () => {
    const loadingScreen = document.getElementById('loading-screen');
    if (!loadingScreen) return;
    requestAnimationFrame(() => loadingScreen.classList.add('hidden'));
  });

  /* -------------------------------------------------------
   * Footer year stamp
   * ----------------------------------------------------- */
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }

  /* -------------------------------------------------------
   * Scroll spy + smooth scrolling for nav links
   * ----------------------------------------------------- */
  const navLinks = Array.from(document.querySelectorAll('[data-link]'));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            navLinks.forEach((link) => link.removeAttribute('aria-current'));
            const active = navLinks.find((link) => link.getAttribute('href') === `#${entry.target.id}`);
            if (active) active.setAttribute('aria-current', 'page');
          }
        });
      },
      { rootMargin: '-50% 0px -45% 0px', threshold: 0.05 }
    );
    sections.forEach((section) => spy.observe(section));
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
    });
  });

  /* -------------------------------------------------------
   * Timeline accordion
   * ----------------------------------------------------- */
  const timeline = document.getElementById('timeline');
  const detailCard = document.getElementById('timeline-details');

  timeline?.addEventListener('click', (event) => {
    const card = event.target.closest('.card');
    if (!card || !timeline.contains(card)) return;

    const expanded = card.getAttribute('aria-expanded') === 'true';
    timeline.querySelectorAll('.card').forEach((item) => item.setAttribute('aria-expanded', 'false'));
    card.setAttribute('aria-expanded', String(!expanded));

    if (!expanded && detailCard) {
      const year = card.dataset.year || '';
      const title = card.querySelector('h3')?.textContent ?? '';
      const detailMarkup = card.querySelector('.details')?.innerHTML ?? '';
      detailCard.innerHTML = `<h3>${year} — ${title}</h3>${detailMarkup}`;
    }
  });

  /* -------------------------------------------------------
   * Skill bar animation + stats counter
   * ----------------------------------------------------- */
  const skillItems = Array.from(document.querySelectorAll('.skill'));
  const statCounters = Array.from(document.querySelectorAll('.stats dd[data-count]'));

  if ('IntersectionObserver' in window) {
    const skillObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const skill = entry.target;
          const level = Number(skill.dataset.level || skill.querySelector('code')?.textContent?.replace('%', '') || 0);
          const span = skill.querySelector('.bar span');
          if (span) {
            span.style.width = clamp(level, 0, 100) + '%';
          }
          skill.classList.add('visible');
          observer.unobserve(skill);
        });
      },
      { threshold: 0.4 }
    );
    skillItems.forEach((item) => skillObserver.observe(item));

    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const counter = entry.target;
          const targetValue = Number(counter.dataset.count || 0);
          const duration = prefersReducedMotion.matches ? 0 : 1200;
          let startValue = 0;
          let startTime = null;

          const update = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = duration === 0 ? 1 : clamp((timestamp - startTime) / duration, 0, 1);
            const value = Math.round(lerp(startValue, targetValue, progress));
            counter.textContent = value.toLocaleString();
            if (progress < 1) requestAnimationFrame(update);
          };

          requestAnimationFrame(update);
          observer.unobserve(counter);
        });
      },
      { threshold: 0.55 }
    );
    statCounters.forEach((counter) => counterObserver.observe(counter));
  } else {
    skillItems.forEach((skill) => {
      const span = skill.querySelector('.bar span');
      const level = Number(skill.dataset.level || 0);
      if (span) span.style.width = clamp(level, 0, 100) + '%';
    });
    statCounters.forEach((counter) => {
      counter.textContent = Number(counter.dataset.count || 0).toLocaleString();
    });
  }

  /* -------------------------------------------------------
   * Starfield background
   * ----------------------------------------------------- */
  const starfieldCanvas = document.getElementById('starfield');
  const ctx = starfieldCanvas?.getContext('2d', { alpha: true });
  let stars = [];
  let width = 0;
  let height = 0;
  const STAR_COUNT = 140;

  const initStarfield = () => {
    if (!starfieldCanvas || !ctx || prefersReducedMotion.matches) return;
    const dpr = window.devicePixelRatio || 1;
    width = starfieldCanvas.width = Math.floor(window.innerWidth * dpr);
    height = starfieldCanvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      depth: Math.random() * 0.8 + 0.2,
      size: Math.random() * 1.4 + 0.3,
      drift: Math.random() * 0.25 + 0.05,
    }));
  };

  let starfieldFrame;
  const renderStarfield = () => {
    if (!ctx || prefersReducedMotion.matches) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.fillStyle = '#ffffff';
    const elapsed = 16;

    for (const star of stars) {
      star.x += star.drift * elapsed * star.depth;
      if (star.x > window.innerWidth) {
        star.x = 0;
        star.y = Math.random() * window.innerHeight;
      }
      const alpha = 0.3 + star.depth * 0.7;
      ctx.globalAlpha = alpha;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }

    starfieldFrame = requestAnimationFrame(renderStarfield);
  };

  if (starfieldCanvas && ctx && !prefersReducedMotion.matches) {
    initStarfield();
    renderStarfield();
    window.addEventListener('resize', () => {
      cancelAnimationFrame(starfieldFrame);
      initStarfield();
      renderStarfield();
    });
  }

  prefersReducedMotion.addEventListener('change', () => {
    if (prefersReducedMotion.matches) {
      cancelAnimationFrame(starfieldFrame);
      if (ctx) ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    } else {
      initStarfield();
      renderStarfield();
    }
  });

  /* -------------------------------------------------------
   * Parallax hero + tilt cards
   * ----------------------------------------------------- */
  const parallaxSection = document.querySelector('[data-parallax]');
  let parallaxFrame = null;
  const parallaxState = { x: 0, y: 0, targetX: 0, targetY: 0 };

  const updateParallax = () => {
    parallaxState.x = lerp(parallaxState.x, parallaxState.targetX, 0.08);
    parallaxState.y = lerp(parallaxState.y, parallaxState.targetY, 0.08);
    parallaxSection?.style.setProperty('--parallax-x', parallaxState.x.toFixed(2));
    parallaxSection?.style.setProperty('--parallax-y', parallaxState.y.toFixed(2));
    if (Math.abs(parallaxState.x - parallaxState.targetX) > 0.01 || Math.abs(parallaxState.y - parallaxState.targetY) > 0.01) {
      parallaxFrame = requestAnimationFrame(updateParallax);
    } else {
      parallaxFrame = null;
    }
  };

  if (parallaxSection && !prefersReducedMotion.matches) {
    parallaxSection.addEventListener('pointermove', (event) => {
      const rect = parallaxSection.getBoundingClientRect();
      const offsetX = (event.clientX - rect.left) / rect.width - 0.5;
      const offsetY = (event.clientY - rect.top) / rect.height - 0.5;
      parallaxState.targetX = offsetX * 18;
      parallaxState.targetY = offsetY * 12;
      if (!parallaxFrame) parallaxFrame = requestAnimationFrame(updateParallax);
    });

    parallaxSection.addEventListener('pointerleave', () => {
      parallaxState.targetX = 0;
      parallaxState.targetY = 0;
      if (!parallaxFrame) parallaxFrame = requestAnimationFrame(updateParallax);
    });
  }

  const tiltCards = Array.from(document.querySelectorAll('[data-tilt]'));
  tiltCards.forEach((card) => {
    if (prefersReducedMotion.matches) return;
    let frameId = null;
    const tilt = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const updateTilt = () => {
      tilt.x = lerp(tilt.x, tilt.targetX, 0.12);
      tilt.y = lerp(tilt.y, tilt.targetY, 0.12);
      card.style.transform = `rotateX(${tilt.y.toFixed(2)}deg) rotateY(${tilt.x.toFixed(2)}deg)`;
      if (Math.abs(tilt.x - tilt.targetX) > 0.01 || Math.abs(tilt.y - tilt.targetY) > 0.01) {
        frameId = requestAnimationFrame(updateTilt);
      } else {
        frameId = null;
      }
    };

    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const percentX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const percentY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      tilt.targetX = clamp(percentX * 8, -12, 12);
      tilt.targetY = clamp(percentY * -6, -10, 10);
      if (!frameId) frameId = requestAnimationFrame(updateTilt);
    });

    card.addEventListener('pointerleave', () => {
      tilt.targetX = 0;
      tilt.targetY = 0;
      if (!frameId) frameId = requestAnimationFrame(updateTilt);
    });
  });
})();
