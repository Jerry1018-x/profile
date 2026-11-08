const sections = [...document.querySelectorAll('#main section')];
const routes = document.querySelectorAll('#sidebar nav a');
const main = document.querySelector('#main');

function showSection() {
  const active = sections.find(section => '#/' + section.id === location.hash) || sections[0];
  for (const section of sections) section.hidden = section !== active;
  for (const link of routes) {
    const current = link.hash === '#/' + active.id;
    link.classList.toggle('active', current);
    if (current) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  document.title = active.querySelector('h1').textContent + ' · 个人 AI 工作台';
}
document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  main.focus();
});
window.addEventListener('hashchange', () => {
  showSection();
  if (matchMedia('(max-width: 960px)').matches) {
    main.focus({ preventScroll: true });
  }
  window.scrollTo(0, 0);
});
showSection();
