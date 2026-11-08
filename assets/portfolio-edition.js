// Keep the current chapter visible without moving the visitor's page.
(() => {
  const index = document.querySelector('.chapter-index');
  if (!index) return;
  const entries = Array.from(index.querySelectorAll('a[href^="#"]'), link => [link, document.getElementById(link.hash.slice(1))]).filter(([,target]) => target);
  let previous, pending = false;
  function update() {
    pending = false;
    const marker = index.offsetHeight + Math.min(140, innerHeight * .20);
    let current;
    for (const [link, target] of entries) {
      // The footer is sticky behind main; its visual bounds don't mark its flow position.
      if (target.id === 'contact') continue;
      if (target.getBoundingClientRect().top <= marker) current = link;
    }
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 3) current = entries.at(-1)?.[0];
    if (current === previous) return;
    previous?.removeAttribute('aria-current');
    previous = current;
    if (!current) return;
    current.setAttribute('aria-current','location');
    const offset = current.getBoundingClientRect().left - index.getBoundingClientRect().left;
    if (offset < 0) index.scrollLeft += offset;
    else if (offset + current.offsetWidth > index.clientWidth) index.scrollLeft += offset + current.offsetWidth - index.clientWidth;
  }
  function schedule() { if (!pending) { pending = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', schedule, { passive:true });
  window.addEventListener('resize', schedule);
  window.addEventListener('pageshow', schedule);
  schedule();
})();
// Covers remain ordinary image links when JS or native dialog is unavailable.
(() => {
  const viewer = document.querySelector('#journal-viewer');
  if (!viewer || typeof viewer.showModal !== 'function') return;
  const albums = [['.office-photo','PROJECT EXPERIENCE'], ['.field-photo','ON LOCATION'], ['.note-cover','FIELD NOTES']];
  const photo = viewer.querySelector('#viewer-image');
  const caption = viewer.querySelector('#viewer-caption');
  const count = viewer.querySelector('#viewer-count');
  let current = 0, covers = [];
  let opener;
  function display(index) {
    current = (index + covers.length) % covers.length;
    const cover = covers[current];
    photo.src = cover.href;
    photo.alt = cover.querySelector('img').alt;
    viewer.toggleAttribute('data-landscape', cover.querySelector('img').naturalWidth > cover.querySelector('img').naturalHeight);
    caption.textContent = cover.getAttribute('aria-label').replace(/^放大：/, '');
    count.textContent = String(current + 1).padStart(2, '0') + ' / ' + String(covers.length).padStart(2, '0');
  }
  for (const [selector, label] of albums) {
    const collection = Array.from(document.querySelectorAll(selector));
    collection.forEach((cover, index) => cover.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      opener = cover;
      covers = collection;
      viewer.querySelector('#viewer-album').textContent = label;
      display(index);
      viewer.showModal();
    }));
  }
  viewer.querySelector('[data-action=close]').addEventListener('click', () => viewer.close());
  viewer.querySelector('[data-action=prev]').addEventListener('click', () => display(current - 1));
  viewer.querySelector('[data-action=next]').addEventListener('click', () => display(current + 1));
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      display(current + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  viewer.addEventListener('click', event => {
    if (event.target !== viewer) return;
    const box = viewer.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) viewer.close();
  });
  viewer.addEventListener('close', () => opener?.focus({preventScroll:true}));
})();
