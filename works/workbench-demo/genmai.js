// 右下角的三只像素猫：玄米（求职搭子）/ 芒果（知识库管家）/ 山竹（媒体数据分析师）
// 当前主智能体放大显示，另外两只缩小排在旁边，点谁谁上台；对话各自独立存储
const GENMAI_WELCOME = '喵，我是玄米。\n我会帮你盯着每个方向的校招信息，也能一起看简历、理投递。\n试试问我：「今天有什么新岗位？」';
const AGENT_DEFS = {
  genmai: {
    name: '玄米', role: '求职搭子', color: '#1baf7a',
    welcome: GENMAI_WELCOME,
    hints: ['玄米在这儿，点我聊聊喵', '要不要看看今天的新岗位？', '简历放这儿，我帮你盯着～', '摸摸头，喵～', '有新的校招消息我会叫你', '今天也要加油投递呀'],
    quick: ['今天有什么新岗位？', '我的简历适合什么方向？', '投递进展怎么样？'],
    placeholder: '和玄米说点什么…（Enter 发送）',
    thinking: '玄米正在翻网页…',
    hasNews: true,
    newsScope: 'job',
    newsEmpty: '还没有岗位消息。玄米有新岗位或截止提醒时会放到这里。',
    api: { chat: '/api/agent/chat', messages: '/api/agent/messages', clear: '/api/agent/messages' },
    svg: () => genmaiCatSvg(),
  },
  mango: {
    name: '芒果', role: '知识库管家', color: '#e8913a',
    welcome: '喵，我是芒果。\n自动抓取已经关掉了，这里现在是你关注的 AI 博主目录和笔记。\n问我：该关注谁？笔记怎么整理？下一步学什么？',
    hints: ['芒果在这儿，聊聊博主喵', '今天想学点什么？', '笔记帮你理一理', '想追更就点博主主页'],
    quick: ['推荐几个值得关注的 AI 博主', '帮我整理一下笔记', '根据我的笔记给个学习计划'],
    placeholder: '和芒果说点什么…（Enter 发送）',
    thinking: '芒果正在翻你的笔记…',
    hasNews: true,
    newsScope: 'kb',
    newsEmpty: '还没有知识库消息。',
    api: { chat: '/api/agents/mango/chat', messages: '/api/agents/mango/messages', clear: '/api/agents/mango/messages' },
    svg: () => mangoCatSvg(),
  },
  shanzhu: {
    name: '山竹', role: '媒体数据分析师', color: '#c99a2e',
    welcome: '我是山竹，看数据的猫。\n账号数据导入后，我会告诉你哪里做得好、下期拍什么。\n先添加账号或导入后台数据吧喵。',
    hints: ['山竹在，用数据说话喵', '账号数据导入了吗？', '下期选题，问我', '播放量涨了吗？'],
    quick: ['我的账号数据怎么样？', '下期规划做什么选题？', '小红书冷启动怎么起步？'],
    placeholder: '和山竹说点什么…（Enter 发送）',
    thinking: '山竹正在算数据…',
    hasNews: false,
    api: { chat: '/api/agents/shanzhu/chat', messages: '/api/agents/shanzhu/messages', clear: '/api/agents/shanzhu/messages' },
    svg: () => shanzhuCatSvg(),
  },
};
const CAT_ORDER = ['mango', 'shanzhu', 'genmai']; // 主猫永远在最右，其余按此顺序缩在左边
const ROUTE_AGENT = { '/kb': 'mango', '/media': 'shanzhu', '/books': 'mango' }; // 页面默认助手

let currentAgent = localStorage.getItem('genmai_agent') || 'genmai';
if (!AGENT_DEFS[currentAgent]) currentAgent = 'genmai';
const agentUnread = { genmai: null, mango: null }; // null = 首次加载，不触发桌面提醒
let genmaiPollTimer = null;
let genmaiHintTimer = null;
let genmaiHintIndex = -1;
let agentStateMap = {};    // 每只猫的 API 接入状态（/api/agents/state）
const agentChatCache = { genmai: false, mango: false, shanzhu: false }; // 已加载过历史

function genmaiCatSvg() {
  return `<svg class="genmai-svg" viewBox="0 0 18 18" shape-rendering="crispEdges" aria-hidden="true">
    <g class="gm-tail">
      <rect x="13" y="12" width="2" height="1" fill="#1d1d21"/>
      <rect x="14" y="11" width="2" height="1" fill="#1d1d21"/>
      <rect x="15" y="10" width="2" height="1" fill="#1d1d21"/>
      <rect x="16" y="9" width="2" height="1" fill="#1d1d21"/>
      <rect x="17" y="7" width="1" height="2" fill="#1d1d21"/>
      <rect x="14" y="12" width="1" height="1" fill="#3a3a40"/>
      <rect x="15" y="11" width="1" height="1" fill="#3a3a40"/>
      <rect x="16" y="10" width="1" height="1" fill="#3a3a40"/>
      <rect x="17" y="9" width="1" height="1" fill="#3a3a40"/>
      <rect x="17" y="8" width="1" height="1" fill="#505058"/>
    </g>
    <rect x="5" y="0" width="1" height="1" fill="#1d1d21"/>
    <rect x="4" y="1" width="2" height="1" fill="#1d1d21"/>
    <rect x="3" y="2" width="3" height="1" fill="#1d1d21"/>
    <rect x="5" y="1" width="1" height="1" fill="#7a4f52"/>
    <rect x="12" y="0" width="1" height="1" fill="#1d1d21"/>
    <rect x="11" y="1" width="2" height="1" fill="#1d1d21"/>
    <rect x="11" y="2" width="3" height="1" fill="#1d1d21"/>
    <rect x="11" y="1" width="1" height="1" fill="#7a4f52"/>
    <rect x="3" y="2" width="11" height="8" fill="#1d1d21"/>
    <rect x="4" y="3" width="9" height="6" fill="#3a3a40"/>
    <rect x="2" y="6" width="1" height="2" fill="#1d1d21"/>
    <rect x="15" y="6" width="1" height="2" fill="#1d1d21"/>
    <rect x="3" y="6" width="1" height="2" fill="#3a3a40"/>
    <rect x="14" y="6" width="1" height="2" fill="#3a3a40"/>
    <rect x="5" y="3" width="1" height="1" fill="#505058"/>
    <rect x="8" y="3" width="2" height="1" fill="#505058"/>
    <rect x="12" y="4" width="1" height="1" fill="#505058"/>
    <g class="gm-eyes">
      <rect x="6" y="5" width="1" height="2" fill="#c2cc55"/>
      <rect x="10" y="5" width="1" height="2" fill="#c2cc55"/>
    </g>
    <rect x="8" y="7" width="2" height="1" fill="#a06a6a"/>
    <rect x="7" y="8" width="4" height="1" fill="#f3f1ea"/>
    <rect x="8" y="8" width="1" height="1" fill="#3a3a40"/>
    <g class="gm-blush">
      <rect x="5" y="7" width="1" height="1" fill="#d97f86"/>
      <rect x="11" y="7" width="1" height="1" fill="#d97f86"/>
    </g>
    <rect x="4" y="9" width="10" height="7" fill="#1d1d21"/>
    <rect x="5" y="10" width="8" height="5" fill="#3a3a40"/>
    <rect x="3" y="11" width="1" height="2" fill="#1d1d21"/>
    <rect x="14" y="11" width="1" height="2" fill="#1d1d21"/>
    <rect x="4" y="11" width="1" height="2" fill="#3a3a40"/>
    <rect x="13" y="11" width="1" height="2" fill="#3a3a40"/>
    <rect x="7" y="10" width="4" height="1" fill="#f3f1ea"/>
    <rect x="6" y="11" width="6" height="3" fill="#f3f1ea"/>
    <rect x="7" y="14" width="4" height="1" fill="#f3f1ea"/>
    <rect x="5" y="15" width="2" height="1" fill="#f3f1ea"/>
    <rect x="10" y="15" width="2" height="1" fill="#f3f1ea"/>
    <rect x="5" y="9" width="8" height="1" fill="#6f9a5e"/>
    <rect x="8" y="10" width="2" height="1" fill="#d9b45b"/>
  </svg>`;
}

function initGenmai() {
  if (document.getElementById('genmai')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div id="genmai" class="genmai">
      <div class="genmai-hint" id="genmai-hint">玄米在这儿，点我聊聊喵</div>
      <div class="genmai-cats" id="genmai-cats"></div>
    </div>
    <div id="genmai-panel" class="genmai-panel hidden">
      <div class="gp-head">
        <div class="gp-title"><span class="gp-dot" id="gp-dot"></span> <span id="gp-name">玄米</span> <span class="gp-sub" id="gp-role">求职搭子</span>
          <span class="gp-status" id="gp-status"></span></div>
        <button class="gp-mini" id="gp-clear" type="button" title="清空当前对话 / 消息">清空</button>
        <button class="gp-close" id="gp-close" type="button" title="收起">×</button>
      </div>
      <div class="gp-tabs">
        <button type="button" data-tab="chat" class="active">对话</button>
        <button type="button" data-tab="news" id="gp-news-tab">消息<span id="gp-news-count"></span></button>
      </div>
      <div class="gp-body">
        <div class="gp-chat" id="gp-chat"></div>
        <div class="gp-news hidden" id="gp-news"></div>
      </div>
      <div class="gp-foot">
        <div class="gp-quick" id="gp-quick"></div>
        <form id="gp-form">
          <textarea id="gp-input" rows="1"></textarea>
          <button type="submit" class="btn primary">发送</button>
        </form>
      </div>
    </div>`);

  renderCatRow();
  syncAgentToRoute();
  document.getElementById('gp-close').addEventListener('click', hideGenmai);
  document.getElementById('gp-clear').addEventListener('click', agentClear);
  document.querySelectorAll('.gp-tabs button').forEach((b) => b.addEventListener('click', () => switchGenmaiTab(b.dataset.tab)));
  document.getElementById('gp-form').addEventListener('submit', agentSend);
  document.getElementById('gp-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); agentSend(); }
  });
  const wrap = document.getElementById('genmai');
  wrap.addEventListener('mouseenter', () => {
    const panel = document.getElementById('genmai-panel');
    if (panel && !panel.classList.contains('hidden')) return;
    genmaiRandomHint();
  });
  wrap.addEventListener('mouseleave', () => genmaiHideHint(500));
  // 常驻气泡只给第一次使用的人看；之后靠 hover 触发，避免遮挡页面内容
  try {
    const hint = document.getElementById('genmai-hint');
    if (localStorage.getItem('genmai_hint_seen')) hint.classList.add('hidden');
    else {
      localStorage.setItem('genmai_hint_seen', '1');
      genmaiHideHint(7000);
    }
  } catch (e) { genmaiHideHint(7000); }
  refreshGenmaiBadge();
  refreshAgentState();
  if (genmaiPollTimer) clearInterval(genmaiPollTimer);
  genmaiPollTimer = setInterval(refreshGenmaiBadge, 60000);
  // 深链：?genmai=1 直接打开对话窗（可加 &agent=mango）
  const qs = new URLSearchParams(location.search);
  if (qs.get('genmai') === '1') setTimeout(showGenmai, 400);
  if (qs.get('agent') && AGENT_DEFS[qs.get('agent')]) switchAgent(qs.get('agent'), { silent: true });
}

/* ---------- 猫猫切换 ---------- */
function renderCatRow() {
  const box = document.getElementById('genmai-cats');
  if (!box) return;
  // 让 CSS 按当前猫切换面板/胶囊的强调色
  const wrap = document.getElementById('genmai');
  if (wrap) wrap.dataset.agent = currentAgent;
  const panel = document.getElementById('genmai-panel');
  if (panel) panel.dataset.agent = currentAgent;
  const order = CAT_ORDER.filter((id) => id !== currentAgent).concat([currentAgent]); // 主猫最后（最右）
  box.innerHTML = order.map((id) => {
    const a = AGENT_DEFS[id];
    const isMain = id === currentAgent;
    return `<button class="genmai-cat${isMain ? '' : ' cat-mini'}" type="button" data-agent="${id}"
        title="${esc(a.name)} · ${esc(a.role)}${isMain ? '' : '（点击切换）'}" aria-label="${esc(a.name)}">
      ${a.svg()}
      ${a.hasNews ? `<span class="genmai-badge" data-badge="${id}" hidden>0</span>` : ''}
    </button>`;
  }).join('');
  box.querySelectorAll('[data-agent]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.agent;
      if (id === currentAgent) toggleGenmai();
      else switchAgent(id);
    });
  });
}

function switchAgent(id, { silent = false, persist = true } = {}) {
  if (!AGENT_DEFS[id]) return;
  const changed = id !== currentAgent;
  currentAgent = id;
  // 只有用户主动选猫才记住；页面自动切换不覆盖用户偏好
  if (persist) localStorage.setItem('genmai_agent', id);
  renderCatRow();
  refreshGenmaiBadge(); // 重新渲染会重建徽标，立刻回填未读数
  applyAgentToPanel();
  if (!silent) showGenmai();
  else if (!document.getElementById('genmai-panel').classList.contains('hidden')) loadAgentMessages();
  if (changed && !silent) {
    const hint = document.getElementById('genmai-hint');
    if (hint) { hint.textContent = `${AGENT_DEFS[id].name}来啦，点我聊聊喵`; hint.classList.remove('hidden', 'fade'); genmaiHideHint(2500); }
  }
}

// 没有手动选过猫时，让右下角助手跟随当前页面：知识库/书架→芒果，媒体→山竹，其余→玄米
function syncAgentToRoute() {
  if (!document.getElementById('genmai')) return;
  if (localStorage.getItem('genmai_agent')) return;
  const route = location.hash.slice(1).split('?')[0] || '/dashboard';
  const id = ROUTE_AGENT[route] || 'genmai';
  if (id !== currentAgent) switchAgent(id, { silent: true, persist: false });
}
window.syncAgentToRoute = syncAgentToRoute;

function applyAgentToPanel() {
  const a = AGENT_DEFS[currentAgent];
  document.getElementById('gp-dot').style.background = a.color;
  document.getElementById('gp-name').textContent = a.name;
  document.getElementById('gp-role').textContent = a.role;
  const status = document.getElementById('gp-status');
  const st = agentStateMap[currentAgent];
  status.textContent = st ? (st.configured ? st.model : '未接入 API') : '';
  status.className = 'gp-status' + (st && !st.configured ? ' gp-status-warn' : '');
  document.getElementById('gp-news-tab').style.display = a.hasNews ? '' : 'none';
  document.getElementById('gp-quick').innerHTML = a.quick.map((q) => `<button type="button">${esc(q)}</button>`).join('');
  document.querySelectorAll('#gp-quick button').forEach((b) => {
    b.addEventListener('click', () => {
      document.getElementById('gp-input').value = b.textContent;
      agentSend();
    });
  });
  document.getElementById('gp-input').placeholder = a.placeholder;
  const box = document.getElementById('gp-chat');
  if (box && box.dataset.agent !== currentAgent) { box.dataset.agent = ''; box.dataset.loaded = ''; box.innerHTML = ''; }
  switchGenmaiTab('chat');
}

async function refreshAgentState() {
  try {
    const d = await api.get('/api/agents/state');
    (d.agents || []).forEach((x) => { agentStateMap[x.id] = x; });
    applyAgentToPanel();
  } catch (e) { /* 服务未就绪时静默 */ }
}

/* ---------- 面板显隐与提示 ---------- */
function toggleGenmai() {
  const panel = document.getElementById('genmai-panel');
  if (panel.classList.contains('hidden')) showGenmai();
  else hideGenmai();
}

function genmaiShowHint(text) {
  const h = document.getElementById('genmai-hint');
  if (!h) return;
  clearTimeout(genmaiHintTimer);
  h.textContent = text;
  h.classList.remove('hidden', 'fade');
}

function genmaiRandomHint() {
  const hints = AGENT_DEFS[currentAgent].hints;
  let i = Math.floor(Math.random() * hints.length);
  if (i === genmaiHintIndex) i = (i + 1) % hints.length;
  genmaiHintIndex = i;
  genmaiShowHint(hints[i]);
}

function genmaiHideHint(delay = 0) {
  const h = document.getElementById('genmai-hint');
  if (!h) return;
  clearTimeout(genmaiHintTimer);
  genmaiHintTimer = setTimeout(() => h.classList.add('fade'), delay);
}

function showGenmai() {
  document.getElementById('genmai-panel').classList.remove('hidden');
  document.getElementById('genmai-hint').classList.add('hidden');
  clearTimeout(genmaiHintTimer);
  applyAgentToPanel();
  loadAgentMessages();
  switchGenmaiTab('chat');
  setTimeout(() => document.getElementById('gp-input').focus(), 50);
}

function hideGenmai() {
  document.getElementById('genmai-panel').classList.add('hidden');
}

function switchGenmaiTab(tab) {
  if (tab === 'news' && !AGENT_DEFS[currentAgent].hasNews) tab = 'chat';
  document.querySelectorAll('.gp-tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  document.getElementById('gp-chat').classList.toggle('hidden', tab !== 'chat');
  document.getElementById('gp-news').classList.toggle('hidden', tab !== 'news');
  document.getElementById('gp-quick').classList.toggle('hidden', tab !== 'chat');
  if (tab === 'news') loadNews();
  else scrollGenmaiChat();
}

function gmMsgHtml(role, text) {
  const html = esc(text).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
  return `<div class="gm-msg gm-${role}">${html}</div>`;
}

function scrollGenmaiChat() {
  const box = document.getElementById('gp-chat');
  if (box) box.scrollTop = box.scrollHeight;
}

async function loadAgentMessages() {
  const box = document.getElementById('gp-chat');
  const agentAtLoad = currentAgent;
  const a = AGENT_DEFS[agentAtLoad];
  if (box.dataset.loaded === agentAtLoad) { scrollGenmaiChat(); return; }
  box.dataset.loaded = agentAtLoad;
  box.dataset.agent = agentAtLoad;
  box.innerHTML = '<div class="gm-loading">加载中…</div>';
  try {
    const { messages } = await api.get(a.api.messages);
    if (currentAgent !== agentAtLoad) return; // 加载期间切了猫
    let html = messages.length ? messages.map((m) => gmMsgHtml(m.role, m.content)).join('') : gmMsgHtml('assistant', a.welcome);
    const st = agentStateMap[agentAtLoad];
    if (st && !st.configured) html += gmMsgHtml('assistant', `（${a.name}还没接入 API —— 把 ${a.name} 的 Key 发给 Claude 配置，我就能回答你了喵）`);
    box.innerHTML = html;
    scrollGenmaiChat();
  } catch (e) {
    box.innerHTML = gmMsgHtml('assistant', '呜，连不上工作台服务：' + e.message);
  }
}

async function agentSend(e) {
  if (e) e.preventDefault();
  const a = AGENT_DEFS[currentAgent];
  const input = document.getElementById('gp-input');
  const text = input.value.trim();
  if (!text) return;
  if (document.getElementById('genmai-panel').classList.contains('hidden')) showGenmai();
  const box = document.getElementById('gp-chat');
  box.insertAdjacentHTML('beforeend', gmMsgHtml('user', text));
  input.value = '';
  const typing = document.createElement('div');
  typing.className = 'gm-msg gm-assistant gm-typing';
  typing.innerHTML = '<span></span><span></span><span></span>';
  box.appendChild(typing);
  scrollGenmaiChat();
  const wrap = document.getElementById('genmai');
  wrap.classList.add('thinking');
  const hint = document.getElementById('genmai-hint');
  if (hint) { hint.textContent = a.thinking; hint.classList.remove('hidden', 'fade'); }
  try {
    const r = await api.post(a.api.chat, { message: text });
    typing.remove();
    box.insertAdjacentHTML('beforeend', gmMsgHtml('assistant', r.reply));
    scrollGenmaiChat();
    refreshGenmaiBadge();
    if (currentAgent === 'genmai' && location.hash.startsWith('#/directions')) router();
    if (currentAgent === 'mango' && location.hash.startsWith('#/kb')) router();
    if (currentAgent === 'shanzhu' && location.hash.startsWith('#/media')) router();
  } catch (err) {
    typing.remove();
    box.insertAdjacentHTML('beforeend', gmMsgHtml('assistant', '呜，' + err.message));
    scrollGenmaiChat();
  } finally {
    wrap.classList.remove('thinking');
    if (hint) { hint.textContent = a.hints[0]; hint.classList.add('fade'); }
  }
}

// 抬头「清空」：在对话 tab = 清空对话；在消息 tab = 清空全部消息
function currentGenmaiTab() {
  const b = document.querySelector('.gp-tabs button.active');
  return b ? b.dataset.tab : 'chat';
}

async function agentClear() {
  const a = AGENT_DEFS[currentAgent];
  if (currentGenmaiTab() === 'news' && a.hasNews) return genmaiClearNews();
  if (!(await confirmDialog(`清空和${a.name}的对话记录？`))) return;
  try {
    await api.del(a.api.clear);
    const box = document.getElementById('gp-chat');
    box.innerHTML = gmMsgHtml('assistant', a.welcome);
    box.dataset.loaded = currentAgent; // 清空后不要让旧的加载缓存把历史拉回来
    box.dataset.agent = currentAgent;
    toast('对话已清空', 'success');
  } catch (e) { toast(e.message, 'error'); }
}

async function genmaiClearNews() {
  const a = AGENT_DEFS[currentAgent];
  const what = a.newsScope === 'kb' ? '知识库消息' : '岗位消息';
  if (!(await confirmDialog(`清空${a.name}的${what}？`))) return;
  try {
    await api.del(`/api/agent/notifications?scope=${encodeURIComponent(a.newsScope || '')}`);
    toast('消息已清空', 'success');
    refreshGenmaiBadge();
    loadNews();
  } catch (e) { toast(e.message, 'error'); }
}

/* ---------- 消息中心（玄米） ---------- */
function gmNewsItem(n) {
  const icon = n.type === 'new_jobs' ? '🐟' : n.type === 'deadline' ? '⏰' : n.type === 'daily' ? '🌾' : n.type === 'kb' ? '🎬' : '💬';
  return `<button type="button" class="gm-news ${n.read ? '' : 'unread'}" data-id="${n.id}" data-link="${esc(n.link || '')}">
    <span class="gm-news-icon">${icon}</span>
    <span class="gm-news-main">
      <b>${esc(n.title)}</b>
      ${n.body ? `<span>${esc(n.body)}</span>` : ''}
      <i>${esc(n.created_at)}</i>
    </span>
  </button>`;
}

async function loadNews() {
  const box = document.getElementById('gp-news');
  const a = AGENT_DEFS[currentAgent];
  box.innerHTML = '<div class="gm-loading">加载中…</div>';
  try {
    const { notifications } = await api.get(`/api/agent/notifications?limit=60&scope=${encodeURIComponent(a.newsScope || '')}`);
    const desktopOn = localStorage.getItem('genmai_desktop') === '1';
    box.innerHTML = `
      <div class="gm-news-actions">
        <button type="button" class="btn small" id="gm-read-all">全部已读</button>
        <button type="button" class="btn small" id="gm-clear-news">清空消息</button>
        <button type="button" class="btn small" id="gm-notify-perm">${desktopOn ? '桌面提醒已开' : '开启桌面提醒'}</button>
        <span class="spacer"></span>
      </div>
      ${notifications.length ? notifications.map(gmNewsItem).join('') : `<div class="empty">${esc(a.newsEmpty || '还没有消息。')}</div>`}`;
    box.querySelector('#gm-read-all').onclick = genmaiMarkAllRead;
    box.querySelector('#gm-clear-news').onclick = genmaiClearNews;
    box.querySelector('#gm-notify-perm').onclick = enableDesktopNotify;
    box.querySelectorAll('.gm-news').forEach((el) => {
      el.onclick = () => openNotification(Number(el.dataset.id), el.dataset.link, el);
    });
  } catch (e) {
    box.innerHTML = `<div class="error-box">${esc(e.message)}</div>`;
  }
}

async function openNotification(id, link, el) {
  try { await api.post('/api/agent/notifications/read', { ids: [id] }); } catch (e) { /* 忽略 */ }
  el.classList.remove('unread');
  refreshGenmaiBadge();
  if (link) {
    hideGenmai();
    if (location.hash === link) router();
    else location.hash = link;
  } else {
    loadNews();
  }
}

async function genmaiMarkAllRead() {
  try {
    await api.post('/api/agent/notifications/read', { all: true, scope: AGENT_DEFS[currentAgent].newsScope || '' });
    refreshGenmaiBadge();
    loadNews();
  } catch (e) { toast(e.message, 'error'); }
}

async function enableDesktopNotify() {
  if (!('Notification' in window)) return toast('当前浏览器不支持桌面提醒', 'error');
  const p = await Notification.requestPermission();
  if (p === 'granted') {
    localStorage.setItem('genmai_desktop', '1');
    toast('桌面提醒已开启', 'success');
    loadNews();
  } else {
    toast('已拒绝，可在浏览器地址栏左侧重新允许', 'error');
  }
}

async function refreshGenmaiBadge() {
  try {
    // 玄米看岗位消息，芒果看知识库消息，各算各的未读数
    const [job, kb] = await Promise.all([
      api.get('/api/agent/notifications?unread=1&limit=3&scope=job'),
      api.get('/api/agent/notifications?unread=1&limit=3&scope=kb'),
    ]);
    setAgentBadge('genmai', job);
    setAgentBadge('mango', kb);
    const cat = document.getElementById('genmai');
    if (cat) cat.classList.toggle('has-news', (job.unread || 0) + (kb.unread || 0) > 0);
    const cnt = document.getElementById('gp-news-count');
    const cur = currentAgent === 'genmai' ? job : currentAgent === 'mango' ? kb : null;
    if (cnt) cnt.textContent = cur && cur.unread ? `(${cur.unread})` : '';
    maybeDesktopNotify('genmai', job);
    maybeDesktopNotify('mango', kb);
  } catch (e) { /* 服务未就绪时静默 */ }
}

function setAgentBadge(id, d) {
  const badge = document.querySelector(`.genmai-badge[data-badge="${id}"]`);
  if (!badge) return;
  if (d.unread > 0) { badge.hidden = false; badge.textContent = d.unread > 99 ? '99+' : d.unread; }
  else badge.hidden = true;
}

function maybeDesktopNotify(id, d) {
  const prev = agentUnread[id];
  agentUnread[id] = d.unread;
  if (prev === null || d.unread <= prev || !d.notifications || !d.notifications[0]) return;
  if (localStorage.getItem('genmai_desktop') !== '1') return;
  if (!window.Notification || Notification.permission !== 'granted') return;
  const n = d.notifications[0];
  try { new Notification(`${AGENT_DEFS[id].name} · ${n.title}`, { body: n.body || '' }); } catch (e) { /* 忽略 */ }
}
