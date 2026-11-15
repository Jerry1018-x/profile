/* Polaris 看板视图 — 拖拽换列 / 就地新建 / 任务详情 Inspector */
(function () {
  'use strict';

  const S = () => window.Store;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.prototype.slice.call((el || document).querySelectorAll(s));

  const COLS = [
    { key: 'todo', name: '待处理' },
    { key: 'doing', name: '进行中' },
    { key: 'done', name: '已完成' }
  ];

  let curPid = null;
  let inspTask = null;   // 当前 Inspector 打开的任务

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function avHtml(owner, size) {
    const m = S().member(owner);
    return '<span class="av' + (size ? ' av--' + size : '') + '" style="--ac:' + m.color + '" title="' + esc(m.name) + '">' + esc(m.id) + '</span>';
  }

  function dueHtml(t) {
    if (t.status === 'done') {
      return '<span class="due due--done">' + S().md(t.doneAt || t.end) + ' 完成</span>';
    }
    if (!t.end) return '<span class="due">未设截止</span>';
    const d = S().diffDays(t.end, S().todayStr());
    const cls = d < 0 ? ' due--late' : (d <= 2 ? ' due--soon' : '');
    const label = d < 0 ? S().md(t.end) + ' 已延期' : (d === 0 ? '今天' : S().md(t.end) + ' 截止');
    return '<span class="due' + cls + '">' + label + '</span>';
  }

  function subCount(t) {
    if (!t.subs || !t.subs.length) return '';
    const done = t.subs.filter(s => s.d).length;
    return '<span class="bcard__sub"><svg viewBox="0 0 14 14"><rect x="2" y="4.5" width="7" height="7" rx="1.4" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M4.6 3h7.4v7.4" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>' + done + '/' + t.subs.length + '</span>';
  }

  function cardHtml(t) {
    return '<article class="bcard' + (t.status === 'done' ? ' is-done' : '') + '" draggable="true" data-id="' + t.id + '">' +
      '<div class="bcard__top"><span class="pri pri--' + t.pri + '">' + t.pri.toUpperCase() + '</span>' +
      (t.milestone ? '<span class="bcard__mile"><i></i>里程碑</span>' : '') +
      avHtml(t.owner) + '</div>' +
      '<h5>' + esc(t.title) + '</h5>' +
      '<div class="bcard__foot">' + dueHtml(t) + subCount(t) + '</div>' +
      '</article>';
  }

  function projectHead(p, view) {
    const hp = { ok: '<span class="chip chip--ok">正常</span>', risk: '<span class="chip chip--risk">有风险</span>', late: '<span class="chip chip--late">延期</span>' }[S().healthOf(p)];
    const members = {};
    S().tasksOf(p.id).forEach(t => { members[t.owner] = 1; });
    const avs = Object.keys(members).map(o => avHtml(o, 'sm')).join('');
    const meta = S().tasksOf(p.id);
    const done = meta.filter(t => t.status === 'done').length;
    return '<div class="phead">' +
      '<div class="phead__name"><i style="background:' + p.color + '"></i>' + esc(p.name) + '</div>' +
      hp +
      '<div class="phead__meta"><span>' + meta.length + ' 个任务 · ' + done + ' 已完成</span><span>至 ' + S().md(p.end) + '</span></div>' +
      '<div class="phead__ops">' +
      '<div class="phead__members">' + avs + '</div>' +
      '<div class="seg" id="view-seg">' +
      '<button data-v="board"' + (view === 'board' ? ' class="is-on"' : '') + '><svg viewBox="0 0 14 14"><rect x="1.5" y="2" width="3" height="10" rx="1" fill="currentColor"/><rect x="5.5" y="2" width="3" height="7" rx="1" fill="currentColor"/><rect x="9.5" y="2" width="3" height="8.5" rx="1" fill="currentColor"/></svg>看板</button>' +
      '<button data-v="gantt"' + (view === 'gantt' ? ' class="is-on"' : '') + '><svg viewBox="0 0 14 14"><rect x="1.5" y="3" width="8" height="2.4" rx="1.2" fill="currentColor"/><rect x="4" y="8.5" width="8.5" height="2.4" rx="1.2" fill="currentColor"/></svg>排期</button>' +
      '</div></div></div>';
  }

  /* ============ 看板主体 ============ */
  function render(pid, opts) {
    curPid = pid;
    const st = S();
    const p = st.project(pid);
    if (!p) return;
    const keepInsp = inspTask && st.task(inspTask) && st.task(inspTask).pid === pid ? inspTask : null;
    inspTask = null;
    const root = $('#view');

    const cols = COLS.map(c => {
      const ts = st.tasksOf(pid).filter(t => t.status === c.key);
      return '<div class="bcol" data-status="' + c.key + '">' +
        '<div class="bcol__head"><b>' + c.name + '</b><span class="num">' + ts.length + '</span>' +
        '<button class="bcol__add" title="新建任务">+</button></div>' +
        '<div class="bcol__cards">' + ts.map(cardHtml).join('') + '</div>' +
        (ts.length ? '' : '<div class="bcol__empty">拖拽任务到这里</div>') +
        '</div>';
    }).join('');

    root.innerHTML = '<div class="view">' + projectHead(p, 'board') +
      '<div class="board" id="board-root">' + cols + '</div>' +
      '<div id="insp-mount"></div></div>';

    $('#view-seg').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (b && b.dataset.v === 'gantt') location.hash = '#/p/' + pid + '/gantt';
    });

    bindBoard(root, p);
    if (keepInsp) openInspector(keepInsp);
  }

  function bindBoard(root, p) {
    const st = S();

    $$('.bcard', root).forEach(bindCard);

    $$('.bcol', root).forEach(col => {
      col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('is-over'); });
      col.addEventListener('dragleave', () => col.classList.remove('is-over'));
      col.addEventListener('drop', e => {
        e.preventDefault();
        col.classList.remove('is-over');
        const id = e.dataTransfer.getData('text/plain');
        const t = st.task(id);
        if (!t || t.pid !== p.id || t.status === col.dataset.status) return;
        if (col.dataset.status === 'done') st.pushFeed('完成了「' + t.title + '」');
        st.updateTask(id, { status: col.dataset.status });
      });
      $('.bcol__add', col).addEventListener('click', () => newTaskInline(col));
    });
  }

  function bindCard(card) {
    card.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', card.dataset.id);
      e.dataTransfer.effectAllowed = 'move';
      card.classList.add('is-drag');
    });
    card.addEventListener('dragend', () => card.classList.remove('is-drag'));
    card.addEventListener('click', e => {
      if (e.defaultPrevented) return;
      openInspector(card.dataset.id);
    });
  }

  function newTaskInline(col) {
    if ($('.bnew', col)) { $('.bnew input', col).focus(); return; }
    const wrap = document.createElement('div');
    wrap.className = 'bnew';
    wrap.innerHTML = '<input type="text" placeholder="任务标题，回车创建" maxlength="50"><button class="btn btn--sm btn--pri">添加</button>';
    $('.bcol__cards', col).parentNode.insertBefore(wrap, $('.bcol__cards', col).nextSibling);
    const input = $('input', wrap);
    input.focus();
    function commit() {
      const v = input.value.trim();
      if (v) {
        S().pushFeed('创建了「' + v + '」');
        S().addTask({ pid: curPid, title: v });
      }
      wrap.remove();
    }
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
      if (e.key === 'Escape') wrap.remove();
    });
    $('button', wrap).addEventListener('click', commit);
  }

  /* ============ 任务详情 Inspector ============ */
  function openInspector(id) {
    const st = S();
    const t = st.task(id);
    if (!t) return;
    inspTask = id;
    $$('.bcard').forEach(c => c.classList.toggle('is-sel', c.dataset.id === id));
    const mount = $('#insp-mount');
    if (!mount) return;

    const pris = ['p0', 'p1', 'p2', 'p3'].map(p =>
      '<button class="pri pri--' + p + (t.pri === p ? '' : ' btn--ghost') + '" data-p="' + p + '" style="' + (t.pri === p ? '' : 'opacity:.55') + '">' + p.toUpperCase() + '</button>').join('');

    const subs = (t.subs || []).map((s, i) =>
      '<div class="subs__row' + (s.d ? ' is-done' : '') + '" data-i="' + i + '">' +
      '<input type="checkbox" class="ck"' + (s.d ? ' checked' : '') + '><span>' + esc(s.t) + '</span>' +
      '<button class="btn--ghost btn btn--sm" data-del="' + i + '" title="删除子任务">×</button></div>').join('');

    const deps = (t.deps || []).map(d => {
      const dt = st.task(d);
      return dt ? '<span class="chip chip--gray" data-goto="' + d + '">← ' + esc(dt.title) + '</span>' : '';
    }).join(' ');

    mount.innerHTML =
      '<aside class="insp" id="insp">' +
      '<div class="insp__head"><span class="insp__lbl" style="padding:0 2px">任务详情</span>' +
      '<button class="btn btn--sm btn--ghost" id="insp-del" title="删除任务"><svg viewBox="0 0 14 14"><path d="M2.5 4h9M5.5 4V2.8h3V4M4 4l.6 8h4.8L10 4" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '<button class="bcol__add" id="insp-close">×</button></div>' +
      '<div class="insp__body">' +
      '<textarea class="insp__title" id="insp-title" rows="2">' + esc(t.title) + '</textarea>' +
      '<div class="insp__sec"><span class="insp__lbl">状态</span>' +
      '<div class="seg" id="insp-status">' +
      COLS.map(c => '<button data-s="' + c.key + '"' + (t.status === c.key ? ' class="is-on"' : '') + '>' + c.name + '</button>').join('') +
      '</div></div>' +
      '<div class="insp__sec"><span class="insp__lbl">优先级</span><div class="insp__row" id="insp-pris">' + pris + '</div></div>' +
      '<div class="insp__sec"><span class="insp__lbl">属性</span>' +
      '<div class="insp__kv"><span>负责人</span><div>' + avHtml(t.owner) +
      '<select id="insp-owner">' + st.data().members.map(m => '<option value="' + m.id + '"' + (t.owner === m.id ? ' selected' : '') + '>' + esc(m.name) + '</option>').join('') + '</select></div></div>' +
      '<div class="insp__kv"><span>开始</span><div><input type="date" id="insp-start" value="' + (t.start || '') + '"></div></div>' +
      '<div class="insp__kv"><span>截止</span><div><input type="date" id="insp-end" value="' + (t.end || '') + '"></div></div>' +
      '<div class="insp__kv"><span>进度</span><div><input type="range" id="insp-prog" min="0" max="100" step="5" value="' + (t.progress || 0) + '" style="flex:1"><span id="insp-prog-v" style="font-size:12px;color:var(--t2);font-variant-numeric:tabular-nums">' + (t.progress || 0) + '%</span></div></div>' +
      '</div>' +
      '<div class="insp__sec"><span class="insp__lbl">描述</span>' +
      '<textarea class="insp__desc" id="insp-desc" placeholder="补充描述…">' + esc(t.desc || '') + '</textarea></div>' +
      '<div class="insp__sec"><span class="insp__lbl">子任务 ' + ((t.subs || []).filter(s => s.d).length + '/' + (t.subs || []).length) + '</span>' +
      '<div class="subs" id="insp-subs">' + subs + '</div>' +
      '<div class="subs__add"><input type="text" id="insp-sub-in" placeholder="添加子任务，回车确认" maxlength="40"><button class="btn btn--sm" id="insp-sub-add">添加</button></div></div>' +
      (deps ? '<div class="insp__sec"><span class="insp__lbl">前置依赖</span><div class="insp__row">' + deps + '</div></div>' : '') +
      '</div>' +
      '<div class="insp__foot"><span class="due">ID ' + t.id + '</span>' +
      (t.milestone ? '<span class="bcard__mile"><i></i>里程碑</span>' : '') + '</div>' +
      '</aside>';

    bindInspector(t);
  }

  function bindInspector(t) {
    const st = S();
    const el = $('#insp');

    $('#insp-close').addEventListener('click', closeInspector);
    $('#insp-del').addEventListener('click', () => {
      if (confirm('删除任务「' + t.title + '」？')) {
        st.deleteTask(t.id);
        toast('任务已删除');
      }
    });

    $('#insp-title').addEventListener('change', e => {
      const v = e.target.value.trim();
      if (v) st.updateTask(t.id, { title: v });
    });
    $('#insp-title').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } });

    $('#insp-status').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b || b.dataset.s === t.status) return;
      if (b.dataset.s === 'done') st.pushFeed('完成了「' + t.title + '」');
      st.updateTask(t.id, { status: b.dataset.s });
    });

    $('#insp-pris').addEventListener('click', e => {
      const b = e.target.closest('button[data-p]');
      if (!b) return;
      st.updateTask(t.id, { pri: b.dataset.p });
    });

    $('#insp-owner').addEventListener('change', e => st.updateTask(t.id, { owner: e.target.value }));
    $('#insp-start').addEventListener('change', e => st.updateTask(t.id, { start: e.target.value }));
    $('#insp-end').addEventListener('change', e => st.updateTask(t.id, { end: e.target.value }));
    $('#insp-desc').addEventListener('change', e => st.updateTask(t.id, { desc: e.target.value }));

    $('#insp-prog').addEventListener('input', e => { $('#insp-prog-v').textContent = e.target.value + '%'; });
    $('#insp-prog').addEventListener('change', e => st.updateTask(t.id, { progress: +e.target.value }));

    $('#insp-subs').addEventListener('change', e => {
      if (e.target.matches('.ck')) {
        const row = e.target.closest('.subs__row');
        const i = +row.dataset.i;
        const subs = (st.task(t.id).subs || []).slice();
        subs[i].d = e.target.checked;
        st.updateTask(t.id, { subs });
      }
    });
    $('#insp-subs').addEventListener('click', e => {
      const del = e.target.closest('[data-del]');
      if (!del) return;
      const subs = (st.task(t.id).subs || []).slice();
      subs.splice(+del.dataset.del, 1);
      st.updateTask(t.id, { subs });
    });
    const addSub = () => {
      const input = $('#insp-sub-in');
      const v = input.value.trim();
      if (!v) return;
      const subs = (st.task(t.id).subs || []).slice();
      subs.push({ t: v, d: false });
      st.updateTask(t.id, { subs });
      const again = $('#insp-sub-in');
      if (again) again.focus();
    };
    $('#insp-sub-add').addEventListener('click', addSub);
    $('#insp-sub-in').addEventListener('keydown', e => { if (e.key === 'Enter') addSub(); });

    $$('[data-goto]', el).forEach(chip => {
      chip.addEventListener('click', () => {
        const dt = st.task(chip.dataset.goto);
        if (dt && dt.pid !== curPid) { location.hash = '#/p/' + dt.pid + '/board'; }
        setTimeout(() => openInspector(chip.dataset.goto), dt && dt.pid !== curPid ? 80 : 0);
      });
    });
  }

  function closeInspector() {
    inspTask = null;
    const el = $('#insp');
    if (el) el.remove();
    $$('.bcard').forEach(c => c.classList.remove('is-sel'));
  }

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(t._h);
    t._h = setTimeout(() => { t.hidden = true; }, 1800);
  }

  window.Board = {
    render,
    openInspector,
    closeInspector,
    current: () => curPid,
    _headHtml: projectHead
  };
})();
