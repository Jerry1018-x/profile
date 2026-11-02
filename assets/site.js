(() => {
  'use strict';

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.max(0, Math.min(1, value));

  // Smooth wheel input, retaining native touch and the user's reduced-motion setting.
  const header = document.querySelector('header');
  let smoothScroll = null;
  function configureScroll() {
    if (motionPreference.matches) {
      smoothScroll?.destroy();
      smoothScroll = null;
      return;
    }
    if (!smoothScroll && window.Lenis) {
      smoothScroll = new window.Lenis({
        autoRaf: true,
        lerp: 0.14,
        smoothWheel: true,
        syncTouch: false,
        anchors: { offset: 0, duration: 1, lerp: 0 },
        stopInertiaOnNavigate: true,
        virtualScroll: ({ event }) => !event.ctrlKey && !event.metaKey && !event.shiftKey
      });
    }
  }
  configureScroll();

  // Prepare only content well below the screen, before it can flash into view.
  // No hiding without JS; no replay when scrolling back up.
  const runningAnimations = new Set();
  const pendingReveals = new Set();
  let revealObserver = null;
  const targets = new Map();
  document.querySelectorAll('.reveal').forEach(element => targets.set(element, 0));
  document.querySelectorAll('.reveal-group').forEach(group => {
    [...group.children].forEach((child, index) => targets.set(child, Math.min(index, 3) * 55));
  });
  document.querySelectorAll('.xhs-note').forEach((element, index) => targets.set(element, index * 55));
  function finishReveals() {
    revealObserver?.disconnect();
    pendingReveals.forEach(element => element.classList.remove('reveal-pending'));
    pendingReveals.clear();
    runningAnimations.forEach(animation => animation.cancel());
    runningAnimations.clear();
  }
  if (!motionPreference.matches && 'IntersectionObserver' in window && Element.prototype.animate) {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        revealObserver.unobserve(element);
        pendingReveals.delete(element);
        element.classList.remove('reveal-pending');
        if (motionPreference.matches) return;
        const animation = element.animate([
          { opacity: 0, transform: 'translate3d(0, 20px, 0)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0)' }
        ], { duration: 680, delay: targets.get(element) || 0, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' });
        runningAnimations.add(animation);
        animation.finished.then(() => runningAnimations.delete(animation), () => runningAnimations.delete(animation));
      });
    }, { threshold: 0, rootMargin: '96px 0px 96px 0px' });
    targets.forEach((delay, element) => {
      if (element.getBoundingClientRect().top < window.innerHeight + 100) return;
      // Avoid animating an element twice through an animated parent.
      if (element.parentElement.closest('.reveal')) return;
      element.classList.add('reveal-pending');
      pendingReveals.add(element);
      revealObserver.observe(element);
    });
    document.addEventListener('focusin', event => {
      const pending = event.target.closest('.reveal-pending');
      if (!pending) return;
      pending.classList.remove('reveal-pending');
      pendingReveals.delete(pending);
      revealObserver.unobserve(pending);
    });
  }

  // Cache geometry on layout changes; scrolling performs no layout reads or width writes.
  const progress = document.getElementById('scrollBar');
  const navigation = [...document.querySelectorAll('.nav-links a[href^="#"]')]
    .map(link => ({ link, section: document.getElementById(link.hash.slice(1)), top: 0, bottom: 0 }))
    .filter(item => item.section);
  let navigationFrame = 0;
  let measureFrame = 0;
  let totalScroll = 1;
  let viewportHeight = window.innerHeight;
  let activeLink = null;
  let headerScrolled = false;

  function updateNavigation() {
    navigationFrame = 0;
    const y = window.scrollY;
    if (progress) progress.style.transform = 'scaleX(' + clamp(y / totalScroll).toFixed(4) + ')';
    const scrolled = y > 8;
    if (header && headerScrolled !== scrolled) {
      header.classList.toggle('scrolled', scrolled);
      headerScrolled = scrolled;
    }
    const marker = y + viewportHeight * 0.35;
    const activeItem = navigation.find(item => item.top <= marker && item.bottom > marker);
    const nextLink = activeItem?.link || null;
    if (activeLink === nextLink) return;
    activeLink?.classList.remove('active');
    activeLink?.removeAttribute('aria-current');
    nextLink?.classList.add('active');
    nextLink?.setAttribute('aria-current', 'location');
    activeLink = nextLink;
  }
  function measureNavigation() {
    measureFrame = 0;
    const y = window.scrollY;
    viewportHeight = window.innerHeight;
    totalScroll = Math.max(1, document.documentElement.scrollHeight - viewportHeight);
    navigation.forEach(item => {
      const rect = item.section.getBoundingClientRect();
      item.top = rect.top + y;
      item.bottom = rect.bottom + y;
    });
    // Lenis already honors the root scroll-padding-top; do not subtract it twice.
    scheduleNavigation();
  }
  function scheduleNavigation() {
    if (!navigationFrame) navigationFrame = requestAnimationFrame(updateNavigation);
  }
  function scheduleMeasure() {
    if (!measureFrame) measureFrame = requestAnimationFrame(measureNavigation);
  }
  window.addEventListener('scroll', scheduleNavigation, { passive: true });
  window.addEventListener('resize', scheduleMeasure);
  window.addEventListener('load', scheduleMeasure);
  if ('ResizeObserver' in window) new ResizeObserver(scheduleMeasure).observe(document.body);
  measureNavigation();

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
    configureScroll();
    if (!event.matches) return;
    finishReveals();
    pauseForReducedMotion();
  });
})();
