(() => {
  const hero = document.querySelector('.name-hero');
  const stage = hero?.querySelector('.name-stage');
  const photo = stage?.querySelector('.name-visual');
  const firstWord = stage?.querySelector('.name-first');
  const lastWord = stage?.querySelector('.name-last');
  const playback = document.querySelector('.intro-playback');
  const profile = document.querySelector('#profile');
  if (!stage || !photo || !firstWord || !lastWord || !playback || !profile) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const narrowLayout = matchMedia('(max-width: 768px)');
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)');
  const clamp = n => Math.min(1, Math.max(0, n));
  const ease = t => t * t * (3 - 2 * t);
  const openingTime = 950;
  let openingElapsed = openingTime;
  let manualMotion = false;
  const motionEnabled = () => manualMotion || !reducedMotion.matches;
  let playing = false;
  let frame = 0;
  let previousTime = 0;
  let playedTime = 0;
  let position = 0;
  let lastIssuedY = null;
  let endY = 0;
  let height = 1;
  let baselineTravel = 0;
  let heroY = 0;
  let ready = false;
  let replayArmed = false;
  let explicitlyPaused = false;
  let openingTimer = 0;
  const atTop = () => window.scrollY <= heroY + 4;

  function measure() {
    height = stage.offsetHeight;
    const baselineGap = lastWord.offsetTop - firstWord.offsetTop;
    baselineTravel = narrowLayout.matches ? Math.max(0, baselineGap - firstWord.offsetHeight) : baselineGap;
    heroY = hero.getBoundingClientRect().top + window.scrollY;
    endY = profile.getBoundingClientRect().top + window.scrollY - 20;
    paint();
  }

  function paint() {
    playback.hidden = window.scrollY >= endY - 2;
    if (window.scrollY > heroY + height * 2) return;
    const p = motionEnabled() ? clamp((window.scrollY - heroY) / Math.max(1,height)) : 0;
    const convergence = ease(clamp(p / .38));
    const panY = -Math.max(0, p - .38) * height * .44;
    const mobile = narrowLayout.matches;
    const style = stage.style;
    const first = ease(clamp(openingElapsed / 730));
    const last = ease(clamp((openingElapsed - 110) / (openingTime - 110)));
    const uncovered = 1 - ease(p);
    // Bring the two lines onto one baseline before the photo fills the viewport.
    style.setProperty('--first-y', panY + 'px');
    style.setProperty('--last-y', (-baselineTravel * convergence + panY) + 'px');
    style.setProperty('--first-x', (9 * (1 - first) - 5 * convergence) + 'vw');
    style.setProperty('--last-x', (-9 * (1 - last) + 4 * convergence) + 'vw');
    style.setProperty('--word-scale', mobile ? 1 : 1 - .115 * convergence);
    style.setProperty('--first-mask', ((1 - first) * 100) + '%');
    style.setProperty('--last-mask', ((1 - last) * 100) + '%');
    style.setProperty('--caption-opacity', last * (1 - clamp(p / .2)));
    style.setProperty('--image-top', (mobile ? 36 : 30) * uncovered + '%');
    style.setProperty('--image-left', (mobile ? 12 : 33.3) * uncovered + '%');
    style.setProperty('--image-right', (mobile ? 4 : 3.1) * uncovered + '%');
    style.setProperty('--image-bottom', (mobile ? 14 : 7) * uncovered + '%');
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
      if (openingElapsed < openingTime) {
        openingElapsed = Math.min(openingTime, openingElapsed + elapsed);
      } else {
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
    clearTimeout(openingTimer);
    openingTimer = 0;
    if (playing) setPlaying(false);
  }
  // Entering the hero is a viewport event, even when the URL still says #activities.
  // Arm another run only after leaving the opening, never while a visitor is reading below it.
  function considerOpening() {
    if (window.scrollY > heroY + height * .5) replayArmed = true;
    if (!ready || !replayArmed || playing || explicitlyPaused || reducedMotion.matches || document.hidden || !atTop() || openingTimer) return;
    openingElapsed = 0;
    playedTime = 0;
    paint();
    openingTimer = window.setTimeout(() => {
      openingTimer = 0;
      if (!atTop() || playing || explicitlyPaused || reducedMotion.matches || document.hidden) return;
      replayArmed = false;
      setPlaying(true);
    }, 100);
  }
  function yieldToReading() {
    stop();
    if (!explicitlyPaused && openingElapsed < openingTime) {
      openingElapsed = openingTime;
      paint();
    }
    if (atTop()) replayArmed = false;
  }
  function yieldToGesture(event) {
    // A trackpad often emits a few more upward ticks after it reaches the top.
    const settlingAtTop = replayArmed && atTop() && (event.type === 'touchmove' || event.deltaY <= 0);
    yieldToReading();
    if (settlingAtTop) { replayArmed = true; considerOpening(); }
  }
  window.addEventListener('wheel', yieldToGesture, { passive: true, capture: true });
  window.addEventListener('touchmove', yieldToGesture, { passive: true, capture: true });
  window.addEventListener('pointerdown', event => {
    if (event.target.closest?.('a,button') && !playback.contains(event.target)) yieldToReading();
  }, { passive: true, capture: true });
  window.addEventListener('keydown', event => {
    if (!playback.contains(event.target) && ['Tab',' ','PageDown','PageUp','Home','End','ArrowDown','ArrowUp'].includes(event.key)) yieldToReading();
  }, true);
  window.addEventListener('hashchange', () => {
    stop();
    if (location.hash === '#top') replayArmed = true;
    considerOpening();
  });
  playback.addEventListener('click', () => {
    explicitlyPaused = playing;
    clearTimeout(openingTimer);
    openingTimer = 0;
    if (!motionEnabled()) {
      manualMotion = true;
      hero.classList.add('is-playing-stage');
      if (atTop()) openingElapsed = 0;
      measure();
    }
    setPlaying(!playing);
  });
  window.addEventListener('scroll', () => {
    if (!atTop() && openingElapsed < openingTime) openingElapsed = openingTime;
    if (playing && lastIssuedY !== null && Math.abs(window.scrollY - lastIssuedY) > 8) stop();
    if (!playing) paint();
    considerOpening();
  }, { passive: true });
  stage.addEventListener('pointermove', event => {
    if (explicitlyPaused || reducedMotion.matches || !finePointer.matches || event.pointerType === 'touch') return;
    const box = stage.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - .5;
    const y = (event.clientY - box.top) / box.height - .5;
    stage.style.setProperty('--pointer-x', (x * 14) + 'px');
    stage.style.setProperty('--pointer-y', (y * 8) + 'px');
  }, { passive: true });
  stage.addEventListener('pointerleave', () => {
    stage.style.removeProperty('--pointer-x');
    stage.style.removeProperty('--pointer-y');
  });
  function syncMotionPreference() {
    manualMotion = false;
    openingElapsed = openingTime;
    stop();
    setPlaying(false);
    hero.classList.toggle('is-playing-stage', !reducedMotion.matches);
    measure();
    replayArmed = true;
    considerOpening();
  }
  reducedMotion.addEventListener('change', syncMotionPreference);
  window.addEventListener('resize', measure);
  const resize = new ResizeObserver(measure);
  resize.observe(hero);
  resize.observe(profile);
  function onReady() {
    ready = true;
    measure();
    considerOpening();
  }
  // A direct chapter link gets its native anchor position before autoplay is considered.
  if (!location.hash || location.hash === '#top') onReady();
  window.addEventListener('pageshow', () => requestAnimationFrame(onReady));
  document.addEventListener('visibilitychange', considerOpening);

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
