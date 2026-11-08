const pages = document.querySelectorAll('main section');
const links = document.querySelectorAll('#sidebar nav a');
function switchPage() {
  const target = [...pages].find(page => '#' + page.id === location.hash) || pages[0];
  for (const page of pages) page.hidden = page !== target;
  for (const link of links) {
    const active = link.hash === '#' + target.id;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}
window.addEventListener('hashchange', switchPage);
switchPage();
document.querySelector('[data-cat="mango"]').innerHTML = mangoCatSvg();
document.querySelector('[data-cat="shanzhu"]').innerHTML = shanzhuCatSvg();

const note = document.querySelector('#note');
document.querySelector('#note-form').addEventListener('submit', event => {
  event.preventDefault();
  const text = note.value.trim();
  if (!text) return note.focus();
  const item = document.createElement('li');
  item.textContent = text;
  document.querySelector('#notes').prepend(item);
  note.value = '';
  note.focus();
});

const jobs = [
  ['人工智能', 'AI 产品助理'], ['软件/企业服务', '项目助理'],
  ['教育', '课程运营'], ['媒体/内容', '品牌营销助理']
];
const excluded = new Set();
const jobsList = document.querySelector('#jobs');
function renderJobs() {
  jobsList.replaceChildren();
  for (const [industry, title] of jobs) {
    if (excluded.has(industry)) continue;
    const item = document.createElement('li');
    item.className = 'kb-blogger-row';
    item.textContent = title + '　·　' + industry;
    jobsList.append(item);
  }
  if (!jobsList.children.length) jobsList.textContent = '没有匹配的示例岗位。再次点击行业可恢复。';
}
for (const [industry] of jobs) {
  const button = document.createElement('button');
  button.className = 'btn';
  button.textContent = industry;
  button.setAttribute('aria-pressed', 'false');
  button.onclick = () => {
    if (excluded.has(industry)) excluded.delete(industry);
    else excluded.add(industry);
    button.setAttribute('aria-pressed', String(excluded.has(industry)));
    renderJobs();
  };
  document.querySelector('#industry-options').append(button);
}
renderJobs();

const examples = {
  小红书: [['求职工具笔记', 1820], ['AI 学习清单', 1260], ['周末拍摄记录', 740]],
  B站: [['工作台搭建过程', 2310], ['知识库使用演示', 1540], ['我的工具栈', 920]]
};
const platform = document.querySelector('#platform');
function renderMetrics() {
  const posts = examples[platform.value];
  const metrics = document.querySelector('#metrics');
  const total = posts.reduce((sum, [, views]) => sum + views, 0);
  const summary = document.createElement('p');
  summary.textContent = '示例数据 · ' + posts.length + ' 条内容，共 ' + total.toLocaleString('zh-CN') + ' 次浏览';
  metrics.replaceChildren(summary);
  for (const [title, count] of posts) {
    const row = document.createElement('div');
    row.className = 'wb-bar';
    const value = document.createElement('b');
    value.textContent = count.toLocaleString('zh-CN');
    const bar = document.createElement('meter');
    bar.max = Math.max(...posts.map(post => post[1]));
    bar.value = count;
    bar.setAttribute('aria-label', title + '浏览次数');
    row.append(title, value, bar);
    metrics.append(row);
  }
}
platform.addEventListener('change', renderMetrics);
renderMetrics();
