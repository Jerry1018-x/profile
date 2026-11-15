// 作品集：轻量滚动显现 + 截图画廊查看器
(function () {
  document.documentElement.classList.add('js');

  var revealed = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
    revealed.forEach(function (el) { io.observe(el); });
  } else {
    revealed.forEach(function (el) { el.classList.add('in'); });
  }

  var viewer = document.getElementById('shot-viewer');
  var viewerImage = document.getElementById('viewer-image');
  var viewerCaption = document.getElementById('viewer-caption');
  if (!viewer || !viewerImage || !viewerCaption) return;

  function closeViewer() {
    if (viewer.open) viewer.close();
  }

  document.querySelectorAll('[data-shot]').forEach(function (button) {
    button.addEventListener('click', function () {
      viewerImage.src = button.dataset.shot;
      viewerImage.alt = button.dataset.alt || '';
      viewerCaption.textContent = button.dataset.caption || '';
      if (typeof viewer.showModal === 'function') viewer.showModal();
      else viewer.setAttribute('open', '');
    });
  });

  viewer.addEventListener('click', function (event) {
    if (event.target === viewer || event.target.closest('[data-close]')) closeViewer();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeViewer();
  });
})();
