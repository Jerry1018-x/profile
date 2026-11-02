(() => {
  'use strict';

  function initMascot(stage) {
    const button = stage.querySelector('[data-mascot-button]');
    const figure = button?.querySelector('[data-mascot-figure]');
    if (!stage || !button || !figure) return;

    const idle = figure.querySelector('[data-mascot-idle]');
    const happy = figure.querySelector('[data-mascot-happy]');
    const message = stage.querySelector('[data-mascot-message]');
    const canvas = stage.querySelector('[data-mascot-canvas]');
    const reset = stage.querySelector('[data-mascot-reset]')
      || [...document.querySelectorAll('[data-mascot-reset]')].find((control) => stage.id && control.dataset.mascotReset === stage.id)
      || (document.querySelectorAll('[data-mascot-stage]').length === 1 ? document.querySelector('[data-mascot-reset]') : null);
    const context = canvas?.getContext('2d');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const hover = matchMedia('(hover: hover) and (pointer: fine)');
    const originalMessage = message?.textContent.trim() || '把鼠标移过来，或点我打个招呼。';
    const originalHidden = message?.hidden || false;
    const position = { x: 0, y: 0, vx: 0, vy: 0 };
    const target = { x: 0, y: 0 };
    let bounds;
    let geometryDirty = true;
    let onScreen = true;
    let inside = false;
    let frame = 0;
    let lastTime = 0;
    let happyTimer = 0;
    let animation;
    let activation = 0;
    let width = 0;
    let height = 0;
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const isActive = () => onScreen && !document.hidden;

    async function decodeImage(image) {
      if (!image) return false;
      try {
        if (image.decode) await image.decode();
        else if (!image.complete) {
          await new Promise((resolve, reject) => {
            image.addEventListener('load', resolve, { once: true });
            image.addEventListener('error', reject, { once: true });
          });
        }
        return image.naturalWidth > 0;
      } catch {
        return false;
      }
    }

    // The second expression is never revealed before its image is decoded.
    const imagesReady = Promise.all([decodeImage(idle), decodeImage(happy)])
      .then((results) => results.every(Boolean));

    function say(text, restore = false) {
      if (!message) return;
      message.hidden = restore ? originalHidden : false;
      if (message.textContent !== text) message.textContent = text;
    }

    function restMessage() {
      say(inside ? '嗨，欢迎来到我的小天地。' : originalMessage, !inside);
    }

    function drawBackdrop() {
      if (!context || !width || !height) return;
      context.clearRect(0, 0, width, height);
      const radius = Math.min(width * 0.34, height * 0.48);
      const spacing = Math.min(width, height) * 0.033;
      const segment = clamp(width * 0.015, 5, 10);
      context.lineWidth = 2;
      context.lineCap = 'round';
      for (let row = 0; row < 5; row += 1) {
        const arcRadius = radius + row * spacing;
        context.strokeStyle = `hsla(${215 + row * 12}, 72%, 62%, ${0.2 + row * 0.015})`;
        for (let index = 0; index < 23; index += 1) {
          const angle = Math.PI * (1.04 + index / 22 * 0.92);
          const x = width * 0.5 + Math.cos(angle) * arcRadius;
          const y = height * 0.78 + Math.sin(angle) * arcRadius;
          const tilt = position.x * 0.28 + position.y * Math.cos(angle) * 0.16;
          const direction = angle + Math.PI / 2 + tilt;
          const dx = Math.cos(direction) * segment / 2;
          const dy = Math.sin(direction) * segment / 2;
          context.beginPath();
          context.moveTo(x - dx, y - dy);
          context.lineTo(x + dx, y + dy);
          context.stroke();
        }
      }
    }

    function paint() {
      const { x, y } = position;
      figure.style.transform = reduced.matches
        ? 'none'
        : `translate3d(${(x * 6).toFixed(3)}px, ${(y * 3).toFixed(3)}px, 0) rotateX(${(-y * 4).toFixed(3)}deg) rotateY(${(x * 6).toFixed(3)}deg) rotateZ(${(x * 0.9).toFixed(3)}deg)`;
      drawBackdrop();
    }

    function measure() {
      bounds = stage.getBoundingClientRect();
      geometryDirty = false;
      width = bounds.width;
      height = bounds.height;
      if (context && width && height) {
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
      }
      if (isActive()) paint();
    }

    function stopFrame() {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    }

    function tick(time) {
      frame = 0;
      if (!isActive() || reduced.matches) return;
      const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.032) : 1 / 60;
      lastTime = time;
      let moving = false;
      for (const axis of ['x', 'y']) {
        const velocity = axis === 'x' ? 'vx' : 'vy';
        position[velocity] += ((target[axis] - position[axis]) * 150 - position[velocity] * 21) * dt;
        position[axis] += position[velocity] * dt;
        if (Math.abs(target[axis] - position[axis]) > 0.0005 || Math.abs(position[velocity]) > 0.002) {
          moving = true;
        } else {
          position[axis] = target[axis];
          position[velocity] = 0;
        }
      }
      paint();
      if (moving) frame = requestAnimationFrame(tick);
      else lastTime = 0;
    }

    function requestFrame() {
      if (!frame && isActive() && !reduced.matches) frame = requestAnimationFrame(tick);
    }

    function clearReaction() {
      activation += 1;
      clearTimeout(happyTimer);
      animation?.cancel();
      animation = undefined;
      button.classList.remove('is-happy');
    }

    function leave() {
      inside = false;
      target.x = target.y = 0;
      requestFrame();
      if (!button.classList.contains('is-happy')) restMessage();
    }

    function settle() {
      stopFrame();
      target.x = target.y = 0;
      position.x = position.y = position.vx = position.vy = 0;
      figure.style.transform = 'none';
      if (isActive()) drawBackdrop();
    }

    function suspend() {
      inside = false;
      clearReaction();
      settle();
      restMessage();
    }

    stage.addEventListener('pointerenter', (event) => {
      if (!hover.matches || event.pointerType === 'touch') return;
      inside = true;
      measure();
      if (!button.classList.contains('is-happy')) restMessage();
    });
    stage.addEventListener('pointermove', (event) => {
      if (!inside || reduced.matches || !isActive() || event.pointerType === 'touch') return;
      if (geometryDirty) measure();
      if (!width || !height) return;
      target.x = clamp((event.clientX - bounds.left) / width * 2 - 1, -1, 1);
      target.y = clamp((event.clientY - bounds.top) / height * 2 - 1, -1, 1);
      requestFrame();
    });
    stage.addEventListener('pointerleave', leave);
    stage.addEventListener('pointercancel', leave);
    window.addEventListener('blur', suspend);
    button.addEventListener('blur', leave);

    // Native button activation covers mouse, touch, Enter, and Space.
    button.addEventListener('click', async () => {
      const request = ++activation;
      say('嗨，很高兴认识你！');
      const ready = await imagesReady;
      if (request !== activation || !isActive()) return;
      clearTimeout(happyTimer);
      if (ready) button.classList.add('is-happy');
      const from = animation ? getComputedStyle(button).transform : 'none';
      animation?.cancel();
      if (!reduced.matches && button.animate) {
        animation = button.animate([
          { transform: from },
          { transform: 'translateY(-4px) scale(1.018)', offset: 0.38 },
          { transform: 'none' },
        ], { duration: 560, easing: 'cubic-bezier(.22,.7,.3,1)' });
        animation.onfinish = () => { animation = undefined; };
      }
      happyTimer = window.setTimeout(() => {
        button.classList.remove('is-happy');
        restMessage();
      }, 1100);
    });

    reset?.addEventListener('click', suspend);
    reduced.addEventListener('change', () => {
      clearReaction();
      settle();
      restMessage();
    });
    hover.addEventListener('change', () => { if (!hover.matches) suspend(); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) suspend();
      else if (onScreen) measure();
    });
    window.addEventListener('scroll', () => { geometryDirty = true; }, { passive: true, capture: true });
    window.addEventListener('resize', measure, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(stage);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        if (!onScreen) suspend();
        else measure();
      }).observe(stage);
    }
    measure();
  }

  function initAll() {
    document.querySelectorAll('[data-mascot-stage]').forEach(initMascot);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll, { once: true });
  else initAll();
})();
