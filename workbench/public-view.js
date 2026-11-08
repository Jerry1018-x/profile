const sections = [...document.querySelectorAll('#main section')];
const routes = document.querySelectorAll('#sidebar nav a');
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
window.addEventListener('hashchange', showSection);
showSection();
