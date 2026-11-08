(() => {
  const hero = document.querySelector('.name-hero');
  const stage = hero.querySelector('.name-stage');
  const frame = stage.querySelector('.name-visual');
  const photo = frame.querySelector('.hero-still');
  const first = stage.querySelector('.name-first');
  const last = stage.querySelector('.name-last');
  const caption = stage.querySelector('.name-caption');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const nativeTimeline = CSS.supports('animation-timeline: view()') && CSS.supports('animation-range: contain 0% contain 100%');
  const narrow = matchMedia('(max-width: 768px)');
  const clamp = n => Math.max(0, Math.min(1, n));
  let lenis, width, height, origin, run, lift, imageW, imageH, previous;

  function measure() {
    if (nativeTimeline && !reduced.matches) return;
    width = stage.clientWidth;
    height = stage.clientHeight;
    origin = hero.getBoundingClientRect().top + window.scrollY;
    run = Math.max(1, hero.offsetHeight - height);
    const gap = last.offsetTop - first.offsetTop;
    lift = narrow.matches ? Math.max(0, gap - first.offsetHeight) : gap;
    const aspect = photo.naturalWidth && photo.naturalHeight ? photo.naturalWidth / photo.naturalHeight : 1.5;
    imageW = Math.max(width, height * aspect);
    imageH = imageW / aspect;
    if (!reduced.matches) {
      photo.style.width = imageW + 'px';
      photo.style.height = imageH + 'px';
    }
    previous = -1;
    paint(window.scrollY);
  }

  function paint(y) {
    if ((nativeTimeline && !reduced.matches) || !width || !height) return;
    const p = clamp((y - origin) / run);
    if (p === previous) return;
    previous = p;
    if (reduced.matches) {
      // Keep feedback directly under the user's gesture, without a large camera move.
      last.style.transform = 'translateY(' + (-20 * p) + 'px)';
      photo.style.transform = 'scale(' + (1 + .045 * p) + ')';
      return;
    }
    const mobile = narrow.matches;
    const remaining = (1 - p) ** 2;
    const t = clamp(p / .38);
    const joined = t * (2 - t);
    const pan = -Math.max(0, p - .38) * height * .44 - (mobile ? height * .09 * joined : 0);
    const typeScale = mobile ? 1 : 1 - .115 * joined;
    const firstX = mobile ? -width * p * .66 : -width * .05 * joined;
    first.style.transform = 'translate3d(' + firstX + 'px,' + pan + 'px,0) scale(' + typeScale + ')';
    last.style.transform = 'translate3d(' + width * .04 * joined + 'px,' + (pan - lift * joined) + 'px,0) scale(' + typeScale + ')';
    caption.style.opacity = 1 - clamp(p / .23);

    // Grow the crop and its photograph with transforms only: the scroll loop never lays out the image.
    const l = width * (mobile ? .12 : .333) * remaining;
    const r = width * (mobile ? .04 : .031) * remaining;
    const top = height * (mobile ? .36 : .30) * remaining;
    const b = height * (mobile ? .14 : .07) * remaining;
    const w = width - l - r, h = height - top - b;
    const sx = w / width, sy = h / height;
    const cover = Math.max(w / imageW, h / imageH) * (1.045 + .16 * (1 - remaining));
    const x = (w - imageW * cover) * (mobile ? .55 : .53);
    const yInFrame = (h - imageH * cover) * (mobile ? .50 : .51);
    frame.style.transform = 'translate3d(' + l + 'px,' + top + 'px,0) scale(' + sx + ',' + sy + ')';
    photo.style.transform = 'translate3d(' + x / sx + 'px,' + yInFrame / sy + 'px,0) scale(' + cover / sx + ',' + cover / sy + ')';
    frame.style.setProperty('--finder-opacity', 1 - clamp((p - .12) / .62));
    stage.style.setProperty('--film-progress', p);
  }

  function configure() {
    lenis?.destroy();
    lenis = null;
    const active = !reduced.matches;
    [frame, photo, first, last, caption, stage].forEach(el => el.removeAttribute('style'));
    hero.classList.toggle('has-scroll-motion', active && !nativeTimeline);
    if (active && window.Lenis) {
      lenis = new window.Lenis({
        autoRaf: true, smoothWheel: true, lerp: .105, syncTouch: false,
        stopInertiaOnNavigate: true,
        virtualScroll: ({event}) => !event.ctrlKey && !event.metaKey && !event.shiftKey
      });
      if (!nativeTimeline) lenis.on('scroll', event => paint(event.animatedScroll));
    }
    measure();
  }

  // Preserve fragment URLs, browser history and keyboard focus for in-page navigation.
  document.addEventListener('click', event => {
    if (!lenis || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href^="#"]');
    const target = link?.hash && document.getElementById(link.hash.slice(1));
    if (!target) return;
    event.preventDefault();
    if (location.hash !== link.hash) history.pushState(null, '', link.hash);
    if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
    target.focus({preventScroll: true});
    lenis.scrollTo(target === hero ? 'top' : target.id === 'contact' ? 'bottom' : target);
  });
  reduced.addEventListener('change', configure);
  // Native scrolling also covers scrollbars, keyboard input and wheel events outside Lenis.
  window.addEventListener('scroll', () => paint(window.scrollY), {passive: true});
  window.addEventListener('popstate', () => { lenis?.reset(); });
  window.addEventListener('pageshow', measure);
  const geometry = new ResizeObserver(measure);
  geometry.observe(stage);
  photo.addEventListener('load', measure);
  configure();

  if ('IntersectionObserver' in window && !reduced.matches) {
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
    reduced.addEventListener('change', () => {
      if (reduced.matches) {
        reveal.disconnect();
        document.querySelectorAll('main .reveal.waiting').forEach(item => item.classList.remove('waiting'));
      }
    });
  }
})();
