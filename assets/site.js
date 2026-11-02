(() => {
  'use strict';

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.max(0, Math.min(1, value));

  // Content is visible by default. Entrance animations enhance offscreen content only.
  const revealContainers = [...document.querySelectorAll('.reveal, .reveal-group, .xhs-stage')];
  revealContainers.forEach(element => element.classList.add('in', 'settled'));
  const runningAnimations = new Set();
  if ('IntersectionObserver' in window && Element.prototype.animate) {
    const targets = new Set(document.querySelectorAll('.reveal'));
    document.querySelectorAll('.reveal-group').forEach(group => {
      [...group.children].forEach(child => targets.add(child));
    });
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        if (motionPreference.matches) return;
        const animation = entry.target.animate([
          { opacity: 0, transform: 'translateY(18px)' },
          { opacity: 1, transform: 'none' }
        ], { duration: 520, easing: 'cubic-bezier(.22,.61,.36,1)' });
        runningAnimations.add(animation);
        animation.finished.then(
          () => runningAnimations.delete(animation),
          () => runningAnimations.delete(animation)
        );
      });
    }, { threshold: 0.05 });
    targets.forEach(element => {
      if (element.getBoundingClientRect().top >= window.innerHeight) observer.observe(element);
    });
  }

  // Keep the current section and both scroll indicators in sync.
  const header = document.querySelector('header');
  const progress = document.getElementById('scrollBar');
  const navigation = [...document.querySelectorAll('.nav-links a[href^="#"]')]
    .map(link => ({ link, section: document.getElementById(link.hash.slice(1)) }))
    .filter(item => item.section);
  let navigationFrame = 0;

  function updateNavigation() {
    navigationFrame = 0;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = `${(total > 0 ? clamp(window.scrollY / total) * 100 : 0).toFixed(2)}%`;
    if (header) header.classList.toggle('scrolled', window.scrollY > 8);
    const marker = window.innerHeight * 0.35;
    let activeItem = null;
    navigation.forEach(item => {
      const rect = item.section.getBoundingClientRect();
      item.link.style.setProperty('--p', clamp((marker - rect.top) / Math.max(rect.height, 1)).toFixed(3));
      if (rect.top <= marker && rect.bottom > marker) activeItem = item;
    });
    navigation.forEach(item => {
      const active = item === activeItem;
      item.link.classList.toggle('active', active);
      if (active) item.link.setAttribute('aria-current', 'location');
      else item.link.removeAttribute('aria-current');
    });
  }

  function scheduleNavigation() {
    if (!navigationFrame) navigationFrame = requestAnimationFrame(updateNavigation);
  }
  window.addEventListener('scroll', scheduleNavigation, { passive: true });
  window.addEventListener('resize', scheduleNavigation);
  window.addEventListener('load', scheduleNavigation);
  if ('ResizeObserver' in window) new ResizeObserver(scheduleNavigation).observe(document.body);
  updateNavigation();

  // A manually controllable, continuous photography strip.
  const strip = document.getElementById('photoStrip');
  const toggle = document.getElementById('photoToggle');
  let pauseForReducedMotion = () => {};
  if (strip && toggle && strip.children.length) {
    const originals = [...strip.children];
    const firstOriginal = originals[0];
    const copies = originals.map(original => {
      const copy = original.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.removeAttribute('id');
      copy.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
      copy.querySelectorAll('a, button, input, [tabindex]').forEach(element => element.tabIndex = -1);
      strip.append(copy);
      return copy;
    });
    strip.querySelectorAll('img').forEach(image => { image.draggable = false; });
    strip.tabIndex = 0;
    strip.setAttribute('aria-label', '摄影作品，使用左右方向键或拖动浏览');
    let playing = !motionPreference.matches;
    let hovered = false;
    let focused = false;
    let inView = !('IntersectionObserver' in window);
    let dragging = false;
    let startX = 0;
    let startScroll = 0;
    let cycleWidth = 0;
    let frame = 0;
    let previousTime = 0;
    let remainder = 0;

    function measureStrip() {
      cycleWidth = copies[0].getBoundingClientRect().left - firstOriginal.getBoundingClientRect().left;
    }
    function updateToggle() {
      toggle.setAttribute('aria-pressed', String(playing));
      toggle.setAttribute('aria-controls', 'photoStrip');
      toggle.textContent = playing ? '暂停播放' : '播放照片';
    }
    function canPlay() {
      return playing && inView && !document.hidden && !hovered && !focused && !dragging;
    }
    function tick(time) {
      frame = 0;
      if (!canPlay()) { previousTime = 0; return; }
      const elapsed = previousTime ? Math.min(64, time - previousTime) : 0;
      previousTime = time;
      remainder += elapsed * 0.032;
      const movement = Math.floor(remainder);
      remainder -= movement;
      if (cycleWidth > 0 && movement > 0) {
        strip.scrollLeft += movement;
        if (strip.scrollLeft >= cycleWidth) strip.scrollLeft -= cycleWidth;
      }
      frame = requestAnimationFrame(tick);
    }
    function syncPlayback() {
      if (canPlay() && !frame) frame = requestAnimationFrame(tick);
      else if (!canPlay()) {
        cancelAnimationFrame(frame);
        frame = 0;
        previousTime = 0;
      }
    }
    toggle.addEventListener('click', () => {
      playing = !playing;
      updateToggle();
      syncPlayback();
    });
    strip.addEventListener('pointerenter', event => {
      if (event.pointerType === 'touch') return;
      hovered = true;
      syncPlayback();
    });
    strip.addEventListener('pointerleave', () => { hovered = false; syncPlayback(); });
    strip.addEventListener('focusin', () => { focused = true; syncPlayback(); });
    strip.addEventListener('focusout', event => {
      focused = strip.contains(event.relatedTarget);
      syncPlayback();
    });
    strip.addEventListener('pointerdown', event => {
      // Touch keeps the browser's native horizontal scrolling and vertical page gestures.
      if (event.pointerType === 'touch' || event.button !== 0) return;
      dragging = true;
      startX = event.clientX;
      startScroll = strip.scrollLeft;
      strip.classList.add('dragging');
      strip.setPointerCapture(event.pointerId);
      syncPlayback();
    });
    strip.addEventListener('pointermove', event => {
      if (dragging) strip.scrollLeft = startScroll - (event.clientX - startX);
    });
    function finishDrag() {
      dragging = false;
      strip.classList.remove('dragging');
      syncPlayback();
    }
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => strip.addEventListener(type, finishDrag));
    strip.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      if (event.key === 'ArrowLeft' && strip.scrollLeft < 1 && cycleWidth > 0) strip.scrollLeft = cycleWidth;
      strip.scrollLeft += event.key === 'ArrowRight' ? 160 : -160;
      if (cycleWidth > 0 && strip.scrollLeft >= cycleWidth) strip.scrollLeft -= cycleWidth;
    });
    document.addEventListener('visibilitychange', syncPlayback);
    window.addEventListener('resize', measureStrip);
    strip.querySelectorAll('img').forEach(image => image.addEventListener('load', measureStrip));
    if ('ResizeObserver' in window) new ResizeObserver(measureStrip).observe(strip);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        inView = entries[0].isIntersecting;
        syncPlayback();
      }).observe(strip);
    }
    pauseForReducedMotion = () => {
      playing = false;
      updateToggle();
      syncPlayback();
    };
    measureStrip();
    updateToggle();
    syncPlayback();
  }

  // The WeChat code works by click, touch and keyboard, with explicit state.
  const qrButton = document.querySelector('button.qr-channel');
  if (qrButton) {
    const popup = qrButton.querySelector('.qr-pop');
    function setExpanded(expanded) {
      qrButton.setAttribute('aria-expanded', String(expanded));
      if (popup) popup.setAttribute('aria-hidden', String(!expanded));
    }
    setExpanded(false);
    qrButton.addEventListener('click', () => setExpanded(qrButton.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('click', event => {
      if (!qrButton.contains(event.target)) setExpanded(false);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && qrButton.getAttribute('aria-expanded') === 'true') {
        setExpanded(false);
        qrButton.focus();
      }
    });
  }

  motionPreference.addEventListener('change', event => {
    if (!event.matches) return;
    runningAnimations.forEach(animation => animation.cancel());
    runningAnimations.clear();
    pauseForReducedMotion();
  });
})();
