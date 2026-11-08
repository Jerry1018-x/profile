(() => {
  const hero = document.querySelector('.name-hero');
  const stage = hero?.querySelector('.name-stage');
  const photo = stage?.querySelector('.name-visual');
  const playback = document.querySelector('.intro-playback');
  const profile = document.querySelector('#profile');
  if (!stage || !photo || !playback || !profile) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const narrowLayout = matchMedia('(max-width: 768px)');
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)');
  const clamp = n => Math.min(1, Math.max(0, n));
  let manualMotion = false;
  const motionEnabled = () => manualMotion || !reducedMotion.matches;
  let playing = false;
  let frame = 0;
  let previousTime = 0;
  let playedTime = 0;
  let position = 0;
  let startAfter = 0;
  let lastIssuedY = null;
  let endY = 0;
  let height = 1;
  let heroY = 0;
  let interrupted = false;

  function measure() {
    height = stage.offsetHeight;
    heroY = hero.getBoundingClientRect().top + window.scrollY;
    endY = profile.getBoundingClientRect().top + window.scrollY - 20;
    paint();
  }

  function paint() {
    playback.hidden = window.scrollY >= endY - 2;
    if (window.scrollY > heroY + height * 2) return;
    const p = motionEnabled() ? clamp((window.scrollY - heroY) / Math.max(1,height)) : 0;
    const convergence = clamp(p / .32);
    const panY = -Math.max(0, p - .32) * height * .42;
    const mobile = narrowLayout.matches;
    const style = stage.style;
    style.setProperty('--first-y', panY + 'px');
    style.setProperty('--last-y', (-height * .23 * convergence + panY) + 'px');
    style.setProperty('--word-scale', 1 - .115 * convergence);
    style.setProperty('--caption-opacity', 1 - clamp(p / .17));
    style.setProperty('--image-top', (mobile ? 36 : 30) * (1 - p) + '%');
    style.setProperty('--image-left', (mobile ? 12 : 33.3) * (1 - p) + '%');
    style.setProperty('--image-right', (mobile ? 4 : 3.1) * (1 - p) + '%');
    style.setProperty('--image-bottom', (mobile ? 14 : 7) * (1 - p) + '%');
    style.setProperty('--finder-opacity', 1 - clamp((p - .12) / .62));
    style.setProperty('--hero-zoom', 1.045 + .055 * p);
    style.setProperty('--film-progress', (p * 100).toFixed(2) + '%');
    if (mobile) {
      // One repeat is the 128vw wordmark plus its 5vw gap.
      const travel = innerWidth * .04 + playedTime * .024 + p * innerWidth * .6;
      style.setProperty('--ticker-x', -(travel % (innerWidth * 1.33)) + 'px');
    }
  }

  function setPlaying(enabled) {
    playing = enabled && motionEnabled();
    playback.lastElementChild.textContent = playing ? 'Pause' : 'Play';
    playback.firstElementChild.textContent = playing ? 'Ⅱ' : '▶';
    const label = playing ? '暂停首屏动效' : '播放首屏动效';
    playback.setAttribute('aria-label', label);
    playback.title = label;
    cancelAnimationFrame(frame);
    if (!playing) return;
    previousTime = performance.now();
    position = window.scrollY;
    lastIssuedY = null;
    frame = requestAnimationFrame(advance);
  }

  function advance(now) {
    if (!playing) return;
    const elapsed = Math.max(0, Math.min(50, now - previousTime));
    previousTime = now;
    if (!document.hidden) {
      playedTime += elapsed;
      if (now >= startAfter) {
        const speed = Math.max(70, Math.min(190, height / 5.8));
        position = Math.min(endY, position + elapsed * speed / 1000);
        window.scrollTo({ top: position, behavior: 'instant' });
        lastIssuedY = window.scrollY;
      }
      paint();
      if (position >= endY - 1) return setPlaying(false);
    }
    frame = requestAnimationFrame(advance);
  }

  function stop() {
    interrupted = true;
    if (playing) setPlaying(false);
  }
  window.addEventListener('wheel', stop, { passive: true, capture: true });
  window.addEventListener('pointerdown', event => {
    if (!playback.contains(event.target)) stop();
  }, { passive: true, capture: true });
  window.addEventListener('keydown', event => {
    if (!playback.contains(event.target) || !['Enter',' '].includes(event.key)) stop();
  }, true);
  window.addEventListener('hashchange', stop);
  playback.addEventListener('click', () => {
    if (!motionEnabled()) {
      manualMotion = true;
      hero.classList.add('is-playing-stage');
      measure();
    }
    startAfter = 0;
    setPlaying(!playing);
  });
  window.addEventListener('scroll', () => {
    if (playing && lastIssuedY !== null && Math.abs(window.scrollY - lastIssuedY) > 8) stop();
    if (!playing) paint();
  }, { passive: true });
  photo.addEventListener('pointermove', event => {
    if (reducedMotion.matches || !finePointer.matches || event.pointerType === 'touch') return;
    const box = photo.getBoundingClientRect();
    photo.style.setProperty('--lens-x', (4 * ((event.clientX - box.left) / box.width - .5)) + 'px');
    photo.style.setProperty('--lens-y', (4 * ((event.clientY - box.top) / box.height - .5)) + 'px');
  }, { passive: true });
  photo.addEventListener('pointerleave', () => {
    photo.style.removeProperty('--lens-x');
    photo.style.removeProperty('--lens-y');
  });
  function syncMotionPreference() {
    manualMotion = false;
    setPlaying(false);
    hero.classList.toggle('is-playing-stage', !reducedMotion.matches);
    measure();
  }
  reducedMotion.addEventListener('change', syncMotionPreference);
  window.addEventListener('resize', measure);
  const resize = new ResizeObserver(measure);
  resize.observe(hero);
  resize.observe(profile);
  window.addEventListener('pageshow', event => {
    measure();
    if (!event.persisted && !reducedMotion.matches && !interrupted && (!location.hash || location.hash === '#top') && window.scrollY < 4) {
      startAfter = performance.now() + 650;
      setPlaying(true);
    }
  });

  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const reveal = new IntersectionObserver(entries => {
      for (const {target, isIntersecting} of entries) {
        if (isIntersecting) {
          target.classList.remove('waiting');
          reveal.unobserve(target);
        }
      }
    });
    document.querySelectorAll('main .heading, main .case, main .notes, main .toolrow').forEach(item => {
      if (item.getBoundingClientRect().top > innerHeight) {
        item.classList.add('reveal', 'waiting');
        reveal.observe(item);
      }
    });
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches) {
        reveal.disconnect();
        document.querySelectorAll('main .reveal.waiting').forEach(item => item.classList.remove('waiting'));
      }
    });
  }
  syncMotionPreference();
})();
