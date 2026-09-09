(() => {
  'use strict';

  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const revealElements = Array.from(document.querySelectorAll('[data-reveal]'));
  const cards = Array.from(document.querySelectorAll('.project-card'));
  let revealObserver = null;
  let scrollFrame = 0;

  function reveal(element) {
    if (!element) return;
    element.classList.add('is-visible');
    if (revealObserver) revealObserver.unobserve(element);
  }

  function revealEverything() {
    if (revealObserver) revealObserver.disconnect();
    revealObserver = null;
    revealElements.forEach(reveal);
  }

  function prepareReveals() {
    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      revealEverything();
      return;
    }
    try {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) reveal(entry.target);
        });
      }, { threshold: 0, rootMargin: '0px 0px -32px 0px' });

      revealElements.forEach((element) => {
        if (element.classList.contains('is-visible')) return;
        // Initial viewport and restored scroll positions remain readable immediately.
        if (element.getBoundingClientRect().top < window.innerHeight - 32) {
          reveal(element);
        } else {
          element.classList.add('will-reveal');
          revealObserver.observe(element);
        }
      });
    } catch {
      revealEverything();
    }
  }

  function revealTarget(target) {
    if (!target) return;
    reveal(target.closest('[data-reveal]'));
    target.querySelectorAll('[data-reveal]').forEach(reveal);
  }

  function revealCurrentHash() {
    if (!window.location.hash) return;
    try {
      revealTarget(document.getElementById(decodeURIComponent(window.location.hash.slice(1))));
    } catch {
      // An invalid URL fragment must never prevent navigation or reading.
    }
  }

  const sectionLinks = Array.from(document.querySelectorAll('.nav a[href^="#"], .case-nav a[href^="#"]'))
    .map((link) => ({ link, section: document.getElementById(link.getAttribute('href').slice(1)) }))
    .filter(({ section }) => section);

  function updateScroll() {
    scrollFrame = 0;
    const scrollY = Math.max(0, window.scrollY || 0);
    const scrollRange = Math.max(0, root.scrollHeight - window.innerHeight);
    const progress = scrollRange ? Math.min(1, scrollY / scrollRange) : 0;
    root.style.setProperty('--scroll-progress', String(progress));
    root.style.setProperty('--ambient-shift', reducedMotion.matches ? '0px' : `${Math.min(scrollY * 0.045, 95).toFixed(2)}px`);
    if (header) header.classList.toggle('is-scrolled', scrollY > 18);

    const marker = (header ? header.getBoundingClientRect().height : 80) + 90;
    let activeSection = null;
    sectionLinks.forEach(({ section }) => {
      if (section.getBoundingClientRect().top <= marker) activeSection = section;
    });
    if (progress > 0.98 && sectionLinks.length) activeSection = sectionLinks[sectionLinks.length - 1].section;
    sectionLinks.forEach(({ link, section }) => {
      if (section === activeSection) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  function queueScrollUpdate() {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScroll);
  }

  const resetCards = [];
  cards.forEach((card) => {
    let pointerFrame = 0;
    let pointerX = 0;
    let pointerY = 0;

    function resetCard() {
      if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      card.classList.remove('is-hovered');
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    }

    function paintPointer() {
      pointerFrame = 0;
      if (reducedMotion.matches || !finePointer.matches) return;
      const bounds = card.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const x = Math.min(1, Math.max(0, (pointerX - bounds.left) / bounds.width));
      const y = Math.min(1, Math.max(0, (pointerY - bounds.top) / bounds.height));
      card.style.setProperty('--pointer-x', `${(x * 100).toFixed(2)}%`);
      card.style.setProperty('--pointer-y', `${(y * 100).toFixed(2)}%`);
      card.style.setProperty('--tilt-x', `${((0.5 - y) * 3).toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${((x - 0.5) * 3.6).toFixed(2)}deg`);
      card.classList.add('is-hovered');
    }

    card.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse' || reducedMotion.matches || !finePointer.matches) return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!pointerFrame) pointerFrame = window.requestAnimationFrame(paintPointer);
    }, { passive: true });
    card.addEventListener('pointerleave', resetCard);
    card.addEventListener('pointercancel', resetCard);
    resetCards.push(resetCard);
  });

  function onMotionChange() {
    resetCards.forEach((reset) => reset());
    if (reducedMotion.matches) revealEverything();
    else prepareReveals();
    queueScrollUpdate();
  }

  if (typeof reducedMotion.addEventListener === 'function') {
    reducedMotion.addEventListener('change', onMotionChange);
    finePointer.addEventListener('change', () => resetCards.forEach((reset) => reset()));
  } else if (typeof reducedMotion.addListener === 'function') {
    reducedMotion.addListener(onMotionChange);
  }

  document.addEventListener('focusin', (event) => {
    if (event.target instanceof Element) reveal(event.target.closest('[data-reveal]'));
  });
  window.addEventListener('scroll', queueScrollUpdate, { passive: true });
  window.addEventListener('resize', queueScrollUpdate, { passive: true });
  window.addEventListener('hashchange', () => { revealCurrentHash(); queueScrollUpdate(); });
  window.addEventListener('pageshow', () => { revealCurrentHash(); queueScrollUpdate(); });
  window.addEventListener('pagehide', () => resetCards.forEach((reset) => reset()));
  window.addEventListener('beforeprint', revealEverything);
  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(queueScrollUpdate);
    resizeObserver.observe(document.body);
  }

  prepareReveals();
  revealCurrentHash();
  updateScroll();
})();
