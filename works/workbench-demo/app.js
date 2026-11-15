// 应用入口：hash 路由 + 导航
const mainEl = document.getElementById('main');
let META = null; // 启动时从 /api/meta 加载的枚举

// 静态展示模式：?presentation=1 隐藏开发/账户入口与常驻助手气泡，方便截图与作品集展示
if (new URLSearchParams(location.search).get('presentation') === '1') {
  document.body.classList.add('presentation');
}

const appState = {
  // 岗位汇总：分类默认全部折叠（仅保留 📂 板块标题），展开后直接显示公司 + 岗位；aiQ/aiResult 存一句话 AI 搜索
  catalogState: { q: '', expandedCats: new Set(), collapsedPos: new Set(), catFilter: '', posFilter: null, focusSearch: false, aiQ: '', aiResult: null },
  qaState: { type: '', mastery: '', q: '', expandedId: null, _filtered: [] },
  myappsState: { q: '', statusFilter: '', focusSearch: false, focusAddCompany: null },
  // AI 知识库（芒果）：平台/类型/搜索筛选 + 收藏夹/分组折叠 + 页内问答；媒体规划（山竹）：分析面板状态
  kbState: { question: '', answer: '', asking: false },
  mediaState: { analyzeAccountId: null, question: '', answer: '', analyzing: false },
  // 我的书架 / 阅读器
  booksState: {
    q: '', status: '', aiOpen: false, aiQ: '', aiResults: [], aiLoading: false, aiError: '',
    aiImported: {}, autoSummary: true, summarizing: {}, importing: {},
  },
  readerState: {
    bookId: null, book: null, chapters: [], notes: [], current: 0,
    sideTab: 'highlight', fontSize: 18, mode: 'text',
    selection: null, restoreScroll: null, pendingNoteId: null,
    summaryLoading: false, searchLoading: false,
  },
};

const routes = {
  '/dashboard': renderDashboard,
  '/catalog': renderCatalog,
  '/myapps': renderMyApps,
  '/questions': renderQuestions,
  '/directions': renderDirections,
  '/kb': renderKb,
  '/books': renderBooks,
  '/media': renderMedia,
};

function parseHash() {
  const hsh = location.hash.slice(1) || '/dashboard';
  const [pathPart, queryPart] = hsh.split('?');
  const params = new URLSearchParams(queryPart || '');
  const m = pathPart.match(/^\/app\/(\d+)$/);
  if (m) return { view: 'appDetail', id: Number(m[1]), params };
  const bk = pathPart.match(/^\/book\/(\d+)$/);
  if (bk) return { view: 'bookReader', id: Number(bk[1]), params };
  return { view: routes[pathPart] ? pathPart : '/dashboard', params };
}

let lastRouteKey = null;

function router() {
  const { view, id, params } = parseHash();
  document.body.dataset.route = (view === 'appDetail' ? 'myapps' : view === 'bookReader' ? 'books' : view).replace(/^\//, '') || 'dashboard';
  // 没手动选过猫时，右下角助手跟随页面（知识库/书架→芒果，媒体→山竹）
  if (window.syncAgentToRoute) window.syncAgentToRoute();
  // URL 参数 → 视图筛选状态（供数据分析图表下钻使用）
  if (view === '/catalog') {
    appState.catalogState.catFilter = params.get('cat') || '';
    const pos = params.get('pos');
    appState.catalogState.posFilter = pos ? Number(pos) : null;
  }
  if (view === '/myapps') {
    appState.myappsState.statusFilter = params.get('status') || '';
  }
  const routeKey = location.hash || '#/dashboard';
  const samePage = routeKey === lastRouteKey; // 同页重渲染时保留滚动位置，避免页面跳动
  const scrollY = window.scrollY;
  document.querySelectorAll('#sidebar a[data-route]').forEach((a) => {
    a.classList.toggle('active', a.dataset.route === (view === 'appDetail' ? '/myapps' : view === 'bookReader' ? '/books' : view));
  });
  const fn = view === 'appDetail' ? () => renderAppDetail(mainEl, id)
    : view === 'bookReader' ? () => renderBookReader(mainEl, id)
      : () => routes[view](mainEl);
  mainEl.innerHTML = '<div class="loading">加载中…</div>';
  Promise.resolve()
    .then(fn)
    .then(() => {
      initAttachmentZones(mainEl);
      if (samePage) requestAnimationFrame(() => window.scrollTo(0, scrollY));
      else window.scrollTo(0, 0);
      lastRouteKey = routeKey;
    })
    .catch((e) => { mainEl.innerHTML = `<div class="error-box">加载失败：${esc(e.message || e)}</div>`; });
}

// 开发期刷新：带时间戳绕过缓存，并保留当前路由
function hardRefresh() {
  const url = new URL(location.href);
  url.searchParams.set('_t', Date.now());
  location.replace(url.toString());
}

// 退出登录：清除服务端会话后回登录页。用原生 fetch，避免 api.js 的 401 跳转干扰
async function logoutApp() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
  } catch (e) { /* 服务不可达也照样回登录页 */ }
  location.replace('/login');
}

// 桌面独立窗口（Edge/Chrome 的 --app 模式）没有标签页，target=_blank 会被当弹窗拦截。
// 独立窗口里只有真正的外部 http(s) 链接交给系统默认浏览器；
// 站内链接（包括侧栏的 #/xxx hash 导航）必须留在应用窗口，否则会跳出软件变成网页。
function isStandaloneApp() {
  return !!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
}
function isExternalUrl(href) {
  try {
    const u = new URL(href, location.href);
    return /^https?:$/.test(u.protocol) && u.origin !== location.origin;
  } catch (e) { return false; }
}
document.addEventListener('click', (e) => {
  const t = e.target;
  const a = t && t.closest ? t.closest('a[href]') : null;
  if (!a || !isStandaloneApp()) return;
  const href = a.href || '';
  if (!isExternalUrl(href)) return;
  e.preventDefault();
  api.post('/api/open-url', { url: href }).catch(() => window.open(href, '_blank', 'noopener'));
});

async function bootstrap() {
  try {
    META = (await api.get('/api/meta')).meta;
  } catch (e) {
    mainEl.innerHTML = `<div class="error-box">无法连接服务器：${esc(e.message)}<br>请在 knowledge-base 目录运行 <code>npm start</code></div>`;
    return;
  }
  window.addEventListener('hashchange', router);
  router();
  initGenmai(); // 右下角像素小猫：玄米
}
bootstrap();
