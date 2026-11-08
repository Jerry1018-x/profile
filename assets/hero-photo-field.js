// The source photo stays sharp under a progressively lower-resolution copy.
// Drawing it directly also works when the portfolio is opened from disk.
(() => {
  const image = document.querySelector('.name-visual .hero-still');
  const stage = image?.closest('.name-stage');
  if (!stage) return;
  const frame = image.parentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return;
  canvas.className = 'hero-photo-field';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;image-rendering:pixelated';
  canvas.hidden = true;
  frame.append(canvas);

  let visible = true;
  let animation = 0;
  let hover = 0;
  let hoverFrom = 0;
  let hoverTarget = 0;
  let hoverStarted = 0;
  const duration = 400;

  function allowed() {
    return visible && !document.hidden && !reducedMotion.matches && !stage.hasAttribute('data-motion-paused');
  }

  function schedule() {
    if (!animation) animation = requestAnimationFrame(draw);
  }

  function clear() {
    cancelAnimationFrame(animation);
    animation = hover = hoverFrom = hoverTarget = 0;
    canvas.hidden = true;
  }

  function setHover(target) {
    if (!allowed() || hoverTarget === target) return;
    hoverFrom = hover;
    hoverTarget = target;
    hoverStarted = performance.now();
    schedule();
  }

  function draw(now) {
    animation = 0;
    if (!allowed()) return clear();
    const t = Math.max(0, Math.min(1, (now - hoverStarted) / duration));
    hover = hoverFrom + (hoverTarget - hoverFrom) * t * t * (3 - 2 * t);
    if (t < 1 && hoverTarget !== hoverFrom) schedule();

    const opening = stage.hasAttribute('data-opening-pixels')
      ? parseFloat(stage.style.getPropertyValue('--intro-pixel')) || 0
      : 0;
    // The opening can advance while the page itself is still at scrollY = 0.
    if (opening > 0) schedule();
    const amount = Math.min(1, Math.max(opening, hover));
    canvas.hidden = !amount || !image.naturalWidth;
    if (canvas.hidden) return;

    const bounds = frame.getBoundingClientRect();
    const photo = image.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    // Each canvas pixel becomes one crisp, square tile in the visible image.
    const cellSize = 3 + amount * 15;
    const cols = Math.max(1, Math.round(bounds.width / cellSize));
    const rows = Math.max(1, Math.round(bounds.height / cellSize));
    if (cols !== canvas.width || rows !== canvas.height) {
      canvas.width = cols;
      canvas.height = rows;
    }

    // Match object-fit: cover, object-position and the moving hero's scale.
    const scale = Math.max(photo.width / image.naturalWidth, photo.height / image.naturalHeight);
    const w = image.naturalWidth * scale;
    const h = image.naturalHeight * scale;
    const [alignX, alignY] = getComputedStyle(image).objectPosition.split(' ').map(n => parseFloat(n) / 100);
    const left = photo.left - bounds.left + (photo.width - w) * alignX;
    const top = photo.top - bounds.top + (photo.height - h) * alignY;
    context.setTransform(cols / bounds.width, 0, 0, rows / bounds.height, 0, 0);
    context.drawImage(image, left, top, w, h);
    canvas.style.opacity = amount;
  }

  function onPointer(event) {
    if (event.pointerType === 'mouse' || event.pointerType === 'pen') setHover(1);
  }
  function updateCrop() {
    if (hover || hoverTarget || stage.hasAttribute('data-opening-pixels')) schedule();
  }

  frame.addEventListener('pointerenter', onPointer, { passive: true });
  frame.addEventListener('pointermove', onPointer, { passive: true });
  frame.addEventListener('pointerleave', () => setHover(0));
  window.addEventListener('scroll', updateCrop, { passive: true });
  window.addEventListener('resize', updateCrop);
  image.addEventListener('load', updateCrop);
  document.addEventListener('visibilitychange', () => document.hidden ? clear() : updateCrop());
  reducedMotion.addEventListener('change', () => reducedMotion.matches ? clear() : updateCrop());
  new MutationObserver(schedule).observe(stage, {
    attributes: true, attributeFilter: ['data-motion-paused', 'data-opening-pixels']
  });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) updateCrop();
    else clear();
  }).observe(frame);
})();
