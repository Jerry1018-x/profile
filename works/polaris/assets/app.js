/* Polaris 应用主控 — 路由 / 侧栏 / 工作台 / 我的任务 / 搜索 / 快速创建 / 设置 */
(function () {
  'use strict';

  const S = () => window.Store;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.prototype.slice.call((el || document).querySelectorAll(s));

  const route = { page: 'dash', pid: null, view: 'board' };
  const PCOLORS = ['#2E5CE6', '#C9A227', '#7C8BB0', '#0E7490', '#8A6A12', '#47598F'];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function avHtml(owner, size) {
    const m = S().member(owner);
    return '<span class="av' + (size ? ' av--' + size : '') + '" style="--ac:' + m.color + '">' + esc(m.id) + '</span>';
  }

  /* ================= 侧栏 ================= */
  function renderSide() {
    const st = S();
    const box = $('#side-projects');
    box.innerHTML = st.data().projects.map(p => {
      const n = st.openCount(p);
      return '<a class="pj' + (route.page === 'project' && route.pid === p.id ? ' is-on' : '') + '" href="#/p/' + p.id + '/board" data-pid="' + p.id + '">' +
        '<i class="pj__dot" style="background:' + p.color + '"></i>' +
        '<span class="pj__name">' + esc(p.name) + '</span>' +
        (n ? '<span class="pj__n">' + n + '</span>' : '') + '</a>';
    }).join('');
    $$('.nav a[data-nav]').forEach(a => a.classList.toggle('is-on',
      (a.dataset.nav === 'dash' && route.page === 'dash') ||
      (a.dataset.nav === 'mine' && route.page === 'mine')));
  }

  /* ================= 工作台 ================= */
  function taskRow(t, ctx) {
    const st = S();
    const p = st.project(t.pid);
    let due;
    if (t.status === 'done') {
      due = '<span class="due due--done">' + st.md(t.doneAt || t.end) + ' 完成</span>';
    } else if (!t.end) {
      due = '<span class="due">未设截止</span>';
    } else {
      const d = st.diffDays(t.end, st.todayStr());
      due = d < 0 ? '<span class="due due--late">' + st.md(t.end) + ' 已延期</span>'
        : d === 0 ? '<span class="due due--today">今天</span>'
        : d <= 2 ? '<span class="due due--soon">' + st.md(t.end) + '</span>'
        : '<span class="due">' + st.md(t.end) + '</span>';
    }
    return '<div class="trow" data-id="' + t.id + '">' +
      '<input type="checkbox" class="ck"' + (t.status === 'done' ? ' checked' : '') + '>' +
      '<span class="trow__name">' + esc(t.title) + '</span>' +
      (ctx === 'dash' ? '<span class="trow__proj">' + esc(p ? p.name : '') + '</span>' : '') +
      '<span class="pri pri--' + t.pri + '">' + t.pri.toUpperCase() + '</span>' +
      due + '</div>';
  }

  function bindTaskRows(scope) {
    $$('.trow', scope).forEach(row => {
      row.addEventListener('change', e => {
        if (!e.target.matches('.ck')) return;
        const t = S().task(row.dataset.id);
        if (!t) return;
        if (e.target.checked) S().pushFeed('完成了「' + t.title + '」');
        S().updateTask(t.id, { status: e.target.checked ? 'done' : 'todo' });
      });
      row.addEventListener('click', e => {
        if (e.target.matches('.ck')) return;
        const t = S().task(row.dataset.id);
        if (t) { location.hash = '#/p/' + t.pid + '/board'; setTimeout(() => window.Board.openInspector(t.id), 60); }
      });
    });
  }

  function renderDash() {
    const st = S();
    const m = st.metrics();
    const g = st.myTasks();
    const hour = new Date().getHours();
    const hello = hour < 6 ? '夜深了' : hour < 12 ? '上午好' : hour < 18 ? '下午好' : '晚上好';
    const dow = ['日', '一', '二', '三', '四', '五', '六'][new Date().getDay()];

    const groups = [
      ['今天', g.today], ['本周', g.week], ['稍后', g.later]
    ].map(([label, arr]) => arr.length ?
      '<div class="tgroup">' + label + '<b>' + arr.length + '</b></div>' + arr.map(t => taskRow(t, 'dash')).join('')
      : '').join('') || '<div class="empty" style="margin:14px 16px">没有待办任务，休息一下 ☕</div>';

    const noDate = g.noDate.length ?
      '<div class="tgroup">未排期<b>' + g.noDate.length + '</b></div>' + g.noDate.map(t => taskRow(t, 'dash')).join('') : '';

    const health = st.data().projects.map(p => {
      const hp = st.healthOf(p);
      const chip = { ok: '<span class="chip chip--ok">正常</span>', risk: '<span class="chip chip--risk">有风险</span>', late: '<span class="chip chip--late">延期</span>' }[hp];
      const barColor = hp === 'ok' ? 'var(--blue)' : hp === 'risk' ? 'var(--gold)' : 'var(--red)';
      const endLabel = hp === 'late' ? st.md(p.end) + ' 已过' : '至 ' + st.md(p.end);
      return '<div class="hp-item"><div class="hp-top"><b data-goto="' + p.id + '">' + esc(p.name) + '</b>' + chip +
        '<span class="due">' + endLabel + '</span></div>' +
        '<div class="hp-bar"><i style="width:' + st.progressOf(p) + '%;background:' + barColor + '"></i></div></div>';
    }).join('');

    const feed = st.data().feed.slice(0, 6).map(f => {
      const av = f.who === 'sys'
        ? '<span class="av" style="--ac:#8E8E96">系</span>'
        : avHtml(f.who);
      return '<li>' + av + '<div class="f-txt">' + esc(f.txt) + '</div><time>' + f.time + '</time></li>';
    }).join('');

    $('#view').innerHTML = '<div class="view">' +
      '<div class="dash__hello"><div><h1>' + hello + '，' + esc(st.member(st.data().user).name) + '</h1>' +
      '<p>' + new Date().getFullYear() + ' 年 ' + (new Date().getMonth() + 1) + ' 月 ' + new Date().getDate() + ' 日 · 周' + dow + '</p></div></div>' +
      '<div class="metrics">' +
      '<div class="metric"><b>' + m.projects + '</b><span>进行中项目</span></div>' +
      '<div class="metric is-blue"><b>' + m.weekDue + '</b><span>本周到期任务</span></div>' +
      '<div class="metric is-red"><b>' + m.late + '</b><span>已延期任务</span></div>' +
      '<div class="metric is-gold"><b>' + m.monthDone + '</b><span>本月完成任务</span></div>' +
      '</div>' +
      '<div class="dash__cols">' +
      '<section class="card"><header>我的任务 <span class="num">' + (g.today.length + g.week.length + g.later.length + g.noDate.length) + '</span>' +
      '<span class="lnk" data-nav-mine>查看全部 →</span></header>' + groups + noDate + '</section>' +
      '<div><section class="card"><header>项目健康</header><div class="hp">' + health + '</div></section>' +
      '<section class="card"><header>今日动态</header><ul class="feed">' + feed + '</ul></section></div>' +
      '</div></div>';

    bindTaskRows($('#view'));
    $('[data-nav-mine]').addEventListener('click', () => { location.hash = '#/mine'; });
    $$('[data-goto]').forEach(b => b.addEventListener('click', () => { location.hash = '#/p/' + b.dataset.goto + '/board'; }));
  }

  /* ================= 我的任务 ================= */
  let mineTab = 'all';

  function renderMine() {
    const st = S();
    const g = st.myTasks();
    const all = g.today.concat(g.week, g.later, g.noDate);
    const late = all.filter(t => st.isLate(t));
    const pools = { all, today: g.today, week: g.week, late };
    const list = pools[mineTab] || [];

    const tabs = [
      ['all', '全部', all.length], ['today', '今天', g.today.length],
      ['week', '本周', g.week.length], ['late', '已延期', late.length]
    ].map(([k, n, c]) => '<button class="mtab' + (mineTab === k ? ' is-on' : '') + '" data-t="' + k + '">' + n + '<b>' + c + '</b></button>').join('');

    $('#view').innerHTML = '<div class="view">' +
      '<div class="dash__hello"><div><h1>我的任务</h1><p>跨项目聚合 · 勾选即完成</p></div></div>' +
      '<div class="mine__tabs">' + tabs + '</div>' +
      '<section class="card">' + (list.length ?
        list.map(t => {
          const p = st.project(t.pid);
          return '<div class="tgroup">' + esc(p ? p.name : '') + '</div>' + taskRow(t, 'mine');
        }).join('')
        : '<div class="empty" style="margin:16px">这里没有任务</div>') +
      '</section></div>';

    $$('.mtab').forEach(b => b.addEventListener('click', () => { mineTab = b.dataset.t; renderMine(); }));
    bindTaskRows($('#view'));
  }

  /* ================= 搜索 ================= */
  function initSearch() {
    const input = $('#search-input');
    const pop = $('#search-pop');
    let cur = -1;

    function run() {
      const q = input.value.trim().toLowerCase();
      if (!q) { pop.hidden = true; cur = -1; return; }
      const st = S();
      const hits = st.data().tasks.filter(t => t.title.toLowerCase().indexOf(q) >= 0).slice(0, 8);
      const phits = st.data().projects.filter(p => p.name.toLowerCase().indexOf(q) >= 0);
      let html = phits.map(p =>
        '<div class="sp-item" data-p="' + p.id + '"><i class="sp-dot" style="background:' + p.color + '"></i>' +
        '<div class="sp-main"><div class="sp-name">' + esc(p.name) + '</div><div class="sp-meta">项目 · ' + st.tasksOf(p.id).length + ' 个任务</div></div></div>'
      ).join('');
      html += hits.map(t => {
        const p = st.project(t.pid);
        return '<div class="sp-item" data-t="' + t.id + '"><i class="sp-dot" style="background:' + (p ? p.color : '#999') + '"></i>' +
          '<div class="sp-main"><div class="sp-name">' + esc(t.title) + '</div><div class="sp-meta">' + esc(p ? p.name : '') + ' · ' +
          ({ todo: '待处理', doing: '进行中', done: '已完成' }[t.status] || t.status) + '</div></div></div>';
      }).join('');
      pop.innerHTML = html || '<div class="sp-empty">没有匹配「' + esc(q) + '」的结果</div>';
      pop.hidden = false;
      cur = -1;
      $$('.sp-item', pop).forEach(item => {
        item.addEventListener('click', () => {
          if (item.dataset.t) {
            const t = S().task(item.dataset.t);
            location.hash = '#/p/' + t.pid + '/board';
            setTimeout(() => window.Board.openInspector(t.id), 60);
          } else {
            location.hash = '#/p/' + item.dataset.p + '/board';
          }
          input.value = ''; pop.hidden = true; input.blur();
        });
      });
    }

    input.addEventListener('input', run);
    input.addEventListener('focus', run);
    input.addEventListener('keydown', e => {
      const items = $$('.sp-item', pop);
      if (pop.hidden || !items.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        cur = e.key === 'ArrowDown' ? (cur + 1) % items.length : (cur - 1 + items.length) % items.length;
        items.forEach((it, i) => it.classList.toggle('is-cur', i === cur));
      } else if (e.key === 'Enter' && cur >= 0) {
        items[cur].click();
      } else if (e.key === 'Escape') {
        pop.hidden = true; input.blur();
      }
    });
    document.addEventListener('click', e => {
      if (!$('#search-box').contains(e.target)) pop.hidden = true;
    });
  }

  /* ================= 快速创建 ================= */
  function initCreate() {
    const modal = $('#modal-create');
    const title = $('#nc-title'), proj = $('#nc-proj'), owner = $('#nc-owner'),
          start = $('#nc-start'), end = $('#nc-end');

    function fill() {
      const st = S();
      proj.innerHTML = st.data().projects.map(p => '<option value="' + p.id + '">' + esc(p.name) + '</option>').join('');
      owner.innerHTML = st.data().members.map(m => '<option value="' + m.id + '">' + esc(m.name) + '</option>').join('');
      start.value = st.todayStr();
      end.value = st.shift(st.todayStr(), 3);
    }
    function open() {
      fill();
      modal.hidden = false;
      title.value = '';
      setTimeout(() => title.focus(), 40);
    }
    function submit() {
      const v = title.value.trim();
      if (!v) { title.focus(); return; }
      S().pushFeed('创建了「' + v + '」');
      const t = S().addTask({
        pid: proj.value,
        title: v,
        owner: owner.value,
        start: start.value,
        end: end.value
      });
      modal.hidden = true;
      toast('已创建「' + t.title + '」');
      location.hash = '#/p/' + t.pid + '/board';
    }

    $('#btn-create').addEventListener('click', open);
    $('#nc-submit').addEventListener('click', submit);
    title.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    $$('#modal-create [data-close]').forEach(b => b.addEventListener('click', () => { modal.hidden = true; }));
  }

  /* ================= 新建项目 ================= */
  function initNewProject() {
    const modal = $('#modal-proj');
    const name = $('#np-name'), end = $('#np-end'), colors = $('#np-colors');
    let color = PCOLORS[0];

    function fill() {
      colors.innerHTML = PCOLORS.map((c, i) =>
        '<button style="background:' + c + '"' + (i === 0 ? ' class="is-on"' : '') + ' data-c="' + c + '" type="button"></button>').join('');
      color = PCOLORS[0];
      $$('#np-colors button').forEach(b => b.addEventListener('click', () => {
        color = b.dataset.c;
        $$('#np-colors button').forEach(x => x.classList.toggle('is-on', x === b));
      }));
      end.value = S().shift(S().todayStr(), 30);
      name.value = '';
    }
    function submit() {
      const v = name.value.trim();
      if (!v) { name.focus(); return; }
      const p = S().addProject(v, color, end.value);
      modal.hidden = true;
      toast('已创建项目「' + p.name + '」');
      location.hash = '#/p/' + p.id + '/board';
    }

    $('#btn-addproj').addEventListener('click', () => { fill(); modal.hidden = false; setTimeout(() => name.focus(), 40); });
    $('#np-submit').addEventListener('click', submit);
    name.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    $$('#modal-proj [data-close]').forEach(b => b.addEventListener('click', () => { modal.hidden = true; }));
  }

  /* ================= 设置 ================= */
  function initSettings() {
    const modal = $('#modal-settings');
    $('#btn-settings').addEventListener('click', () => { modal.hidden = false; });
    $$('#modal-settings [data-close]').forEach(b => b.addEventListener('click', () => { modal.hidden = true; }));
    $('#set-export').addEventListener('click', () => {
      const blob = new Blob([S().exportJSON()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'polaris-backup-' + S().todayStr() + '.json';
      a.click();
      URL.revokeObjectURL(a.href);
      toast('已导出备份文件');
    });
    $('#set-reset').addEventListener('click', () => {
      if (confirm('重置将清除所有本地修改，恢复初始演示数据。确定继续？')) {
        S().reset();
        modal.hidden = true;
        toast('已恢复初始演示数据');
        location.hash = '#/dash';
      }
    });
  }

  /* ================= 路由 ================= */
  function parseHash() {
    const h = location.hash.replace(/^#\/?/, '');
    const parts = h.split('/').filter(Boolean);
    if (parts[0] === 'p' && parts[1]) {
      return { page: 'project', pid: parts[1], view: parts[2] === 'gantt' ? 'gantt' : 'board' };
    }
    if (parts[0] === 'mine') return { page: 'mine' };
    return { page: 'dash' };
  }

  function setWinTitle() {
    const st = S();
    let t = '工作台';
    if (route.page === 'mine') t = '我的任务';
    if (route.page === 'project') {
      const p = st.project(route.pid);
      t = p ? (p.name + (route.view === 'gantt' ? ' · 排期' : ' · 看板')) : '项目';
    }
    document.title = 'Polaris — ' + t;
  }

  function renderPage() {
    if (route.page === 'dash') renderDash();
    else if (route.page === 'mine') renderMine();
    else if (route.page === 'project') {
      const p = S().project(route.pid);
      if (!p) { location.hash = '#/dash'; return; }
      if (route.view === 'gantt') window.Gantt.render(route.pid, { keepScroll: false });
      else window.Board.render(route.pid);
    }
    setWinTitle();
    renderSide();
    $('#view').scrollTop = 0;
    $('.main').scrollTop = 0;
  }

  function onHash() {
    const r = parseHash();
    const sameProject = r.page === 'project' && route.page === 'project' && r.pid === route.pid && r.view === route.view;
    Object.assign(route, r);
    renderPage();
    if (!sameProject) window.Board.closeInspector();
  }

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(t._h);
    t._h = setTimeout(() => { t.hidden = true; }, 1800);
  }

  /* ================= 启动 ================= */
  function boot() {
    initSearch();
    initCreate();
    initNewProject();
    initSettings();
    window.addEventListener('hashchange', onHash);

    S().onChange(() => {
      renderSide();
      setWinTitle();
      if (route.page === 'dash') renderDash();
      else if (route.page === 'mine') renderMine();
      else if (route.page === 'project' && route.view === 'gantt') {
        window.Gantt.render(route.pid, { keepScroll: true });
      } else if (route.page === 'project') {
        window.Board.render(route.pid);
      }
    });

    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        $('#search-input').focus();
        $('#search-input').select();
      }
      if (e.key === 'Escape') {
        $$('.modal').forEach(m => { m.hidden = true; });
        window.Board.closeInspector();
      }
    });

    onHash();
  }

  boot();
})();
