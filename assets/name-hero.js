(() => {
  const hero = document.querySelector('.name-hero');
  const stage = hero.querySelector('.name-stage');
  const playback = document.querySelector('.intro-playback');
  const clamp = n => Math.min(1, Math.max(0, n));
  let playing = false;
  let frame = 0;
  let previousTime = 0;
  let accumulatedTime = 0;
  let position = 0;
  let startAfter = 0;
  let lastIssuedY = null;
  let endY = 0;

  hero.classList.add('is-playing-stage');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) {
          target.classList.remove('waiting');
          reveal.unobserve(target);
        }
      });
    });
    document.querySelectorAll('main .heading, main .case, main .poster, main .notes, main .toolrow').forEach(item => {
      if (item.getBoundingClientRect().top > innerHeight) {
        item.classList.add('reveal', 'waiting');
        reveal.observe(item);
      }
    });
  }

  function measure() {
    endY = document.querySelector('#work').getBoundingClientRect().top + window.scrollY - 20;
    paint();
  }
  function paint() {
    const top = hero.getBoundingClientRect().top;
    const height = stage.offsetHeight;
    const p = clamp(-top / Math.max(1, height));
    const mobile = innerWidth <= 768;
    if (top + hero.offsetHeight >= 0) {
      const style = stage.style;
      const convergence = clamp(p / .32);
      style.setProperty('--first-y', (Math.max(0, p - .32) * -height * .42) + 'px');
      style.setProperty('--last-y', (-height * .23 * convergence - Math.max(0,p-.32) * height * .42) + 'px');
      style.setProperty('--word-scale', 1 - .115 * convergence);
      style.setProperty('--caption-opacity', 1 - clamp(p / .17));
      style.setProperty('--image-top', (mobile ? 36 : 30) * (1 - p) + '%');
      style.setProperty('--image-left', (mobile ? 12 : 33.3) * (1 - p) + '%');
      style.setProperty('--image-right', (mobile ? 4 : 3.1) * (1 - p) + '%');
      style.setProperty('--image-bottom', (mobile ? 14 : 7) * (1 - p) + '%');
      // Repeated wordmarks form a continuous ticker on narrow screens.
      const repeat = innerWidth * 1.33;
      style.setProperty('--ticker-x', -(innerWidth * .04 + accumulatedTime * .024 + p * innerWidth * .6) % repeat + 'px');
    }
    playback.hidden = window.scrollY >= endY - 2;
  }

  function setPlaying(enabled) {
    playing = enabled;
    playback.lastElementChild.textContent = enabled ? 'Pause' : 'Play';
    playback.firstElementChild.textContent = enabled ? 'Ⅱ' : '▶';
    const label = enabled ? '暂停自动滚动' : '继续自动滚动';
    playback.setAttribute('aria-label', label);
    playback.title = label;
    cancelAnimationFrame(frame);
    frame = 0;
    if (enabled) {
      previousTime = performance.now();
      position = window.scrollY;
      lastIssuedY = null;
      frame = requestAnimationFrame(advance);
    }
  }
  function advance(now) {
    if (!playing) return;
    const elapsed = Math.max(0, Math.min(50, now - previousTime));
    previousTime = now;
    if (!document.hidden) {
      accumulatedTime += elapsed;
      if (now >= startAfter) {
        const speed = Math.max(70, Math.min(190, stage.offsetHeight / 5.8));
        position = Math.min(endY, position + elapsed * speed / 1000);
        window.scrollTo({ top: position, behavior: 'instant' });
        lastIssuedY = window.scrollY;
      }
      paint();
      if (position >= endY - 1) return setPlaying(false);
    }
    frame = requestAnimationFrame(advance);
  }
  const stop = () => { if (playing) setPlaying(false); };
  window.addEventListener('wheel', stop, { passive: true, capture: true });
  window.addEventListener('pointerdown', event => {
    if (!playback.contains(event.target)) stop();
  }, { passive: true, capture: true });
  window.addEventListener('keydown', event => {
    if (!playback.contains(event.target) || !['Enter', ' '].includes(event.key)) stop();
  }, true);
  window.addEventListener('hashchange', stop);
  playback.addEventListener('click', () => setPlaying(!playing));
  window.addEventListener('scroll', () => {
    if (lastIssuedY !== null && Math.abs(window.scrollY - lastIssuedY) > 8) stop();
    if (!playing) paint();
  }, { passive: true });
  window.addEventListener('resize', measure);
  new ResizeObserver(measure).observe(hero);
  window.addEventListener('pageshow', event => {
    measure();
    if (!event.persisted && (!location.hash || location.hash === '#top') && window.scrollY < 4 && !handledBeforeLoad) {
      startAfter = performance.now() + 650;
      setPlaying(true);
    }
  });
  let handledBeforeLoad = false;
  const markInteraction = () => { handledBeforeLoad = true; };
  for (const type of ['pointerdown', 'wheel', 'keydown']) {
    window.addEventListener(type, markInteraction, { once: true, passive: true, capture: true });
  }
  setPlaying(false);
  measure();
})();
