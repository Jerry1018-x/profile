(() => {
  const footer = document.getElementById('contact');
  const canvas = footer.querySelector('.footer-field');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const spacing = 56;
  const reach = 150;
  let width = 0, height = 0;
  let cells = [];
  let waves = [];
  let pointer = null;
  let frame = 0;

  function influence(distance, radius) {
    const t = Math.max(0, 1 - distance / radius);
    return t * t * (3 - 2 * t);
  }

  function draw(now) {
    frame = 0;
    ctx.clearRect(0, 0, width, height);
    const limit = Math.hypot(width, height) + spacing;
    waves = waves.filter(wave => (now - wave.start) * .6 < limit);
    let animating = waves.length > 0;
    for (const cell of cells) {
      let intensity = pointer ? influence(Math.hypot(cell.x - pointer.x, cell.y - pointer.y), reach) : 0;
      const age = now - cell.hit;
      if (age < 1200) {
        intensity = Math.max(intensity, cell.strength * Math.min(1, (1200 - age) / 800));
        animating = true;
      }
      if (!reduced.matches) {
        for (const wave of waves) {
          const distance = Math.hypot(cell.x - wave.x, cell.y - wave.y);
          const offset = Math.abs(distance - (now - wave.start) * .6);
          intensity = Math.max(intensity, influence(offset, spacing) * Math.max(0, 1 - distance / limit));
        }
      }
      ctx.fillStyle = 'white';
      ctx.globalAlpha = (.14 + .76 * intensity) * cell.edge;
      ctx.beginPath();
      ctx.arc(cell.x, cell.y, 1.25, 0, Math.PI * 2);
      ctx.fill();
      if (intensity > .01) {
        ctx.globalAlpha = .06 * intensity * cell.edge;
        ctx.fillRect(cell.x - spacing / 2, cell.y - spacing / 2, spacing, spacing);
      }
    }
    ctx.globalAlpha = 1;
    if (animating) schedule();
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(draw);
  }
  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    if (!width || !height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cells = [];
    for (let x = spacing / 2; x < width; x += spacing) {
      for (let y = spacing / 2; y < height; y += spacing) {
        const edge = Math.min(1, x / (.12 * width), (width - x) / (.12 * width),
          y / (.12 * height), (height - y) / (.12 * height));
        cells.push({ x, y, edge, hit: -Infinity, strength: 0 });
      }
    }
    schedule();
  }
  function point(event) {
    const bounds = canvas.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }
  function hover(event) {
    pointer = point(event);
    const now = performance.now();
    for (const cell of cells) {
      const strength = influence(Math.hypot(cell.x - pointer.x, cell.y - pointer.y), reach);
      if (strength > 0) {
        const remaining = Math.max(0, Math.min(1, (1200 - (now - cell.hit)) / 800));
        cell.strength = Math.max(strength, cell.strength * remaining);
        cell.hit = now;
      }
    }
    schedule();
  }
  function leave() { pointer = null; schedule(); }
  footer.addEventListener('pointermove', hover);
  footer.addEventListener('pointerleave', leave);
  footer.addEventListener('pointercancel', leave);
  footer.addEventListener('pointerdown', event => {
    hover(event);
    if (!reduced.matches) waves.push({ ...pointer, start: performance.now() });
  });
  footer.addEventListener('pointerup', event => { if (event.pointerType === 'touch') leave(); });
  reduced.addEventListener('change', () => { waves = []; schedule(); });
  new ResizeObserver(resize).observe(canvas);
  resize();
})();
