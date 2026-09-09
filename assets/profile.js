/* The account's stable avatar URL always serves its current GitHub profile photo. */
(() => {
  'use strict';

  const images = Array.from(document.querySelectorAll('[data-github-avatar]'));
  if (!images.length) return;

  const avatarURL = 'https://avatars.githubusercontent.com/u/302349533?v=4&s=1024';
  const refreshInterval = 5 * 60 * 1000;
  const retryInterval = 60 * 1000;
  let lastSuccess = 0;
  let lastAttempt = 0;
  let timer = 0;
  let inFlight = false;

  images.forEach((image) => {
    image.addEventListener('load', () => image.classList.remove('profile-image-unavailable'));
    image.addEventListener('error', () => image.classList.add('profile-image-unavailable'));
    if (image.complete && !image.naturalWidth) image.classList.add('profile-image-unavailable');
  });

  function schedule(delay = refreshInterval) {
    window.clearTimeout(timer);
    timer = 0;
    if (!document.hidden && navigator.onLine !== false) {
      timer = window.setTimeout(refresh, Math.max(1000, delay));
    }
  }

  function loadPhoto(url) {
    return new Promise((resolve, reject) => {
      const probe = new Image();
      const timeout = window.setTimeout(() => finish(false), 10000);
      function finish(success) {
        window.clearTimeout(timeout);
        probe.onload = null;
        probe.onerror = null;
        if (success) resolve(url);
        else reject(new Error('Profile image unavailable'));
      }
      probe.referrerPolicy = 'no-referrer';
      probe.onload = () => finish(probe.naturalWidth > 0);
      probe.onerror = () => finish(false);
      probe.src = url;
    });
  }

  async function refresh() {
    if (inFlight || document.hidden || navigator.onLine === false) return;
    const now = Date.now();
    if (now - lastSuccess < refreshInterval) {
      schedule(refreshInterval - (now - lastSuccess));
      return;
    }
    if (now - lastAttempt < retryInterval) {
      schedule(retryInterval - (now - lastAttempt));
      return;
    }

    inFlight = true;
    lastAttempt = now;
    const url = new URL(avatarURL);
    // A shared five-minute key avoids a stale browser cache without a GitHub API token.
    url.searchParams.set('refresh', String(Math.floor(now / refreshInterval)));
    try {
      const readyURL = await loadPhoto(url.href);
      images.forEach((image) => {
        image.src = readyURL;
        image.classList.remove('profile-image-unavailable');
      });
      lastSuccess = Date.now();
      schedule();
    } catch {
      // Keep the displayed photo during outages; its initials fallback covers first-load failure.
      schedule(retryInterval);
    } finally {
      inFlight = false;
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) window.clearTimeout(timer);
    else refresh();
  });
  window.addEventListener('online', () => { lastAttempt = 0; refresh(); });
  window.addEventListener('pagehide', () => window.clearTimeout(timer));
  window.addEventListener('pageshow', refresh);
  schedule(750);
})();
