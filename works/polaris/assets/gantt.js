/* Polaris 排期表 — 拖拽改期 / 边缘缩放 / 日周月 / 依赖冲突 / 里程碑 / 今日线 */
(function () {
  'use strict';

  const S = () => window.Store;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.prototype.slice.call((el || document).querySelectorAll(s));

  const DAYMS = 86400000;
  const DW = { day: 36, week: 14, month: 6 };
  const HH = 56, RH = 40;
  const GROUP_COLORS = ['#8A9BBF', '#2E5CE6', '#C9A227', '#0E7490', '#7C8BB0', '#8E8E96'];

  let curPid = null;
  let zoom = 'day';
  let drag = null;
  let lastScrollLeft = 0;
  let lastScrollTop = 0;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function render(pid, opts) {
    curPid = pid;
    const st = S();
    const p = st.project(pid);
    if (!p) return;

    const tasks = st.tasksOf(pid).filter(t => t.start && t.end);
    if (!tasks.length) {
      $('#view').innerHTML = '<div class="view">' +
        '<div class="empty" style="margin-top:40px">这个项目还没有可排期的任务<br><small style="color:var(--t4)">在看板中创建任务后，这里会显示排期</small></div></div>';
      return;
    }

    const root = $('#view');
    root.innerHTML = '<div class="view"><div class="gantt">' +
      '<div class="gantt__bar-row">' +
      window.Board._headHtml(p, 'gantt') +
      '<div class="phead__ops">' +
      '<div class="seg" id="gt-zoom">' +
      '<button data-z="day"' + (zoom === 'day' ? ' class="is-on"' : '') + '>日</button>' +
      '<button data-z="week"' + (zoom === 'week' ? ' class="is-on"' : '') + '>周</button>' +
      '<button data-z="month"' + (zoom === 'month' ? ' class="is-on"' : '') + '>月</button>' +
      '</div>' +
      '<button class="btn" id="gt-today-btn">回到今天</button>' +
      '</div></div>' +
      '<div class="gwrap">' +
      '<div class="gleft"><div class="gleft__head">任务 · 负责人 · 日期</div><div class="gleft__body" id="gt-left"></div></div>' +
      '<div class="gscroll" id="gt-scroll"><div class="gcanvas" id="gt-canvas">' +
      '<div class="gh-months" id="gt-months"></div>' +
      '<div class="gh-days" id="gt-days"></div>' +
      '<div id="gt-grid"></div>' +
      '<div class="gtoday" id="gt-today"></div>' +
      '<svg class="gdeps" id="gt-deps"></svg>' +
      '<div id="gt-bars"></div>' +
      '</div></div></div>' +
      '<div class="gfoot">' +
      '<span class="gantt__hint"><span><i class="h-dot" style="background:var(--blue-bright)"></i>任务条（深色为进度）</span><span><i class="h-dia"></i>里程碑</span><span><i class="h-line"></i>依赖冲突</span></span>' +
      '<div class="gfoot__read" id="gt-readout">点击任务条查看详情 · 双击打开任务</div>' +
      '</div>' +
      '<div class="gtip" id="gt-tip" hidden></div>' +
      '</div></div>';

    $('#view-seg').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (b && b.dataset.v === 'board') location.hash = '#/p/' + pid + '/board';
    });
    $('#gt-zoom').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b || b.dataset.z === zoom) return;
      const scrollEl = $('#gt-scroll');
      const anchor = Math.round((scrollEl.scrollLeft + scrollEl.clientWidth / 2) / DW[zoom]);
      zoom = b.dataset.z;
      $$('#gt-zoom button').forEach(x => x.classList.toggle('is-on', x === b));
      renderAll();
      scrollEl.scrollLeft = Math.max(0, anchor * DW[zoom] - scrollEl.clientWidth / 2);
    });
    $('#gt-today-btn').addEventListener('click', () => {
      const scrollEl = $('#gt-scroll');
      scrollEl.scrollLeft = Math.max(0, (idx(today()) + 0.5) * DW[zoom] - scrollEl.clientWidth * 0.35);
    });
    $('#gt-scroll').addEventListener('scroll', () => {
      const scrollEl = $('#gt-scroll');
      const body = $('#gt-left');
      if (body) body.style.transform = 'translateY(' + (-scrollEl.scrollTop) + 'px)';
      lastScrollLeft = scrollEl.scrollLeft;
      lastScrollTop = scrollEl.scrollTop;
    });

    renderAll();
    bindPointer();
    const scrollEl = $('#gt-scroll');
    if (opts && opts.keepScroll) {
      scrollEl.scrollLeft = lastScrollLeft;
      scrollEl.scrollTop = lastScrollTop;
      $('#gt-left').style.transform = 'translateY(' + (-lastScrollTop) + 'px)';
    }
    else {
      scrollEl.scrollLeft = Math.max(0, (idx(today()) - 6) * DW.day);
      scrollEl.scrollTop = 0;
      lastScrollLeft = scrollEl.scrollLeft;
      lastScrollTop = 0;
    }
  }

  /* ---------- 布局计算 ---------- */
  function range() {
    const st = S();
    const tasks = st.tasksOf(curPid).filter(t => t.start && t.end);
    const p = st.project(curPid);
    let rs = p.start, re = p.end;
    tasks.forEach(t => {
      if (t.start < rs) rs = t.start;
      if (t.end > re) re = t.end;
    });
    return { RS: S().parse(rs), RE: S().parse(re) };
  }
  const today = () => S().todayStr();
  const dw = () => DW[zoom];
  const pd = str => S().parse(str);
  const idx = str => Math.round((pd(str) - range().RS) / DAYMS);
  const total = () => Math.round((range().RE - range().RS) / DAYMS) + 1;

  function rows() {
    const st = S();
    const tasks = st.tasksOf(curPid).filter(t => t.start && t.end);
    const phases = [];
    tasks.forEach(t => { const g = t.phase || '未分组'; if (phases.indexOf(g) < 0) phases.push(g); });
    const order = ['设计阶段', '开发阶段', '测试与发布'];
    phases.sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      if (a === '未分组') return 1;
      if (b === '未分组') return -1;
      if (ia < 0 && ib < 0) return a.localeCompare(b);
      if (ia < 0) return 1;
      if (ib < 0) return -1;
      return ia - ib;
    });
    const out = [];
    const rowIdx = {};
    phases.forEach(g => {
      const gi = phases.indexOf(g);
      out.push({ type: 'group', label: g, color: GROUP_COLORS[gi % GROUP_COLORS.length] });
      tasks.filter(t => (t.phase || '未分组') === g).forEach(t => {
        rowIdx[t.id] = out.length;
        out.push({ type: 'task', t });
      });
    });
    return { rows: out, rowIdx };
  }
  const canvasH = () => HH + rows().rows.length * RH + 20;

  function ownerColor(o) { return S().member(o).color; }

  /* ---------- 渲染 ---------- */
  function renderAll() {
    const canvas = $('#gt-canvas');
    if (!canvas) return;
    canvas.style.width = total() * dw() + 'px';
    canvas.style.height = canvasH() + 'px';
    const lb = $('#gt-left');
    lb.style.height = canvasH() - HH + 'px';
    renderLeft();
    renderHeader();
    renderGrid();
    renderBars();
    renderDeps();
    renderToday();
  }

  function renderLeft() {
    const st = S();
    const { rows: rs } = rows();
    let html = '';
    rs.forEach(r => {
      if (r.type === 'group') {
        html += '<div class="glrow glrow--group"><i style="background:' + r.color + '"></i>' + esc(r.label) + '</div>';
      } else {
        const t = r.t;
        const m = st.member(t.owner);
        html += '<div class="glrow' + (t.milestone ? ' glrow--m' : '') + '" data-id="' + t.id + '">' +
          '<span class="av av--sm" style="--ac:' + m.color + '" title="' + esc(m.name) + '">' + esc(t.owner) + '</span>' +
          '<span class="glrow__name">' + esc(t.title) + '</span>' +
          '<span class="glrow__date">' + (t.milestone ? st.md(t.start) : st.md(t.start) + '–' + st.md(t.end)) + '</span></div>';
      }
    });
    $('#gt-left').innerHTML = html;
    $$('#gt-left .glrow[data-id]').forEach(row => {
      row.addEventListener('click', () => selectTask(row.dataset.id));
      row.addEventListener('dblclick', () => openDetail(row.dataset.id));
    });
  }

  function renderHeader() {
    const { RS, RE } = range();
    const w = dw();
    const T = total();
    let months = '', days = '';
    let cur = new Date(RS.getFullYear(), RS.getMonth(), 1);
    const tStr = today();
    while (cur <= RE) {
      const mStart = cur < RS ? RS : cur;
      const mEndD = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
      const end = mEndD > RE ? RE : mEndD;
      const dCount = Math.round((end - mStart) / DAYMS) + 1;
      const isCur = pd(tStr) >= mStart && pd(tStr) <= end;
      months += '<div class="gh-month' + (isCur ? ' is-cur' : '') + '" style="width:' + dCount * w + 'px">' +
        (dCount * w > 44 ? (cur.getMonth() + 1) + '月' : '') + '</div>';
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }
    if (zoom === 'day') {
      for (let i = 0; i < T; i++) {
        const d = new Date(RS.getFullYear(), RS.getMonth(), RS.getDate() + i);
        const we = d.getDay() === 0 || d.getDay() === 6;
        const isT = S().fmt(d) === tStr;
        days += '<div class="gh-day' + (we ? ' is-we' : '') + (isT ? ' is-today' : '') +
          '" style="width:' + w + 'px">' + d.getDate() + '</div>';
      }
    } else {
      let i = 0;
      while (i < T) {
        const d = new Date(RS.getFullYear(), RS.getMonth(), RS.getDate() + i);
        const dow = d.getDay();
        let span = dow === 1 ? 7 : (dow === 0 ? 1 : 8 - dow);
        span = Math.min(span, T - i);
        const label = (d.getMonth() + 1) + '-' + String(d.getDate()).padStart(2, '0');
        days += '<div class="gh-day" style="width:' + span * w + 'px">' + (span * w > 40 ? label : '') + '</div>';
        i += span;
      }
    }
    $('#gt-months').innerHTML = months;
    $('#gt-days').innerHTML = days;
  }

  function renderGrid() {
    const { RS } = range();
    const w = dw();
    const T = total();
    const { rows: rs } = rows();
    let html = '';
    rs.forEach((r, i) => {
      html += '<div class="grband' + (r.type === 'group' ? ' is-group' : (i % 2 ? ' is-odd' : '')) +
        '" style="top:' + (HH + i * RH) + 'px"></div>';
    });
    for (let i = 0; i <= T; i++) {
      const isMajor = zoom !== 'day' && (i === 0 || i === T ||
        new Date(RS.getFullYear(), RS.getMonth(), RS.getDate() + i).getDay() === 1);
      html += '<div class="gvline' + (isMajor ? ' is-major' : '') + '" style="left:' + i * w + 'px"></div>';
    }
    if (zoom === 'day') {
      for (let i = 0; i < T; i++) {
        const d = new Date(RS.getFullYear(), RS.getMonth(), RS.getDate() + i);
        if (d.getDay() === 0 || d.getDay() === 6) {
          html += '<div class="gwend" style="left:' + i * w + 'px;width:' + w + 'px;top:' + HH + 'px"></div>';
        }
      }
    }
    $('#gt-grid').innerHTML = html;
  }

  function renderBars() {
    const w = dw();
    const { rows: rs, rowIdx } = rows();
    let html = '';
    rs.forEach(r => {
      if (r.type !== 'task') return;
      const t = r.t;
      const top = HH + rowIdx[t.id] * RH + 9;
      const x = idx(t.start) * w;
      const sel = selectedId === t.id ? ' is-sel' : '';
      if (t.milestone) {
        html += '<div class="gmdia' + sel + '" data-id="' + t.id + '" style="left:' + x + 'px;top:' + top + 'px">' +
          '<i></i><span>' + esc(t.title) + '</span></div>';
      } else {
        const width = Math.max((idx(t.end) - idx(t.start) + 1) * w, w);
        html += '<div class="gbar' + sel + '" data-id="' + t.id + '" style="left:' + (x + 1) + 'px;top:' + top + 'px;width:' + (width - 2) + 'px">' +
          '<div class="gbar__in"><div class="gbar__fill" style="width:' + (t.progress || 0) + '%"></div>' +
          '<span class="gbar__label">' + esc(t.title) + '</span></div>' +
          '<span class="gbar__rz gbar__rz--l"></span><span class="gbar__rz gbar__rz--r"></span></div>';
      }
    });
    $('#gt-bars').innerHTML = html;
  }

  function conflictOf(t) {
    const out = [];
    (t.deps || []).forEach(pid2 => {
      const p = S().task(pid2);
      if (p && idx(t.start) <= idx(p.end)) out.push(p.title);
    });
    return out;
  }

  function renderDeps() {
    const w = dw();
    const { rowIdx } = rows();
    let svg = '';
    S().tasksOf(curPid).forEach(t => {
      if (!t.start || !t.end) return;
      (t.deps || []).forEach(pid2 => {
        const p = S().task(pid2);
        if (!p || !p.start || !p.end) return;
        const x1 = (idx(p.end) + 1) * w;
        const y1 = HH + rowIdx[p.id] * RH + RH / 2;
        const x2 = idx(t.start) * w;
        const y2 = HH + rowIdx[t.id] * RH + RH / 2;
        const conflict = idx(t.start) <= idx(p.end);
        const xm = x2 > x1 + 24 ? x1 + (x2 - x1) / 2 : x1 + 12;
        const cls = conflict ? ' is-conflict' : '';
        svg += '<path class="' + cls.trim() + '" d="M ' + x1 + ' ' + y1 + ' H ' + xm + ' V ' + y2 + ' H ' + (x2 - 7) + '"/>' +
          '<polygon class="' + cls.trim() + '" points="' + x2 + ',' + y2 + ' ' + (x2 - 7) + ',' + (y2 - 4) + ' ' + (x2 - 7) + ',' + (y2 + 4) + '"/>';
      });
    });
    const deps = $('#gt-deps');
    deps.setAttribute('width', total() * w);
    deps.setAttribute('height', canvasH());
    deps.style.position = 'absolute';
    deps.style.top = '0';
    deps.style.left = '0';
    deps.innerHTML = svg;
  }

  function renderToday() {
    const el = $('#gt-today');
    if (!el) return;
    const i = idx(today());
    if (i < 0 || i > total()) { el.style.display = 'none'; return; }
    el.style.display = '';
    el.style.left = (i + 0.5) * dw() - 1 + 'px';
  }

  /* ---------- 选择与读出 ---------- */
  let selectedId = null;

  function updateLeftRow(t) {
    const row = $('#gt-left .glrow[data-id="' + t.id + '"]');
    if (!row) return;
    const el = $('.glrow__date', row);
    if (el) el.textContent = t.milestone ? S().md(t.start) : S().md(t.start) + '–' + S().md(t.end);
  }

  function updateReadout(t) {
    const st = S();
    const ro = $('#gt-readout');
    if (!ro || !t) return;
    const deps = (t.deps || []).map(d => { const p = st.task(d); return p ? p.title : ''; }).filter(Boolean).join('、');
    const cf = conflictOf(t);
    ro.innerHTML = '<b>' + esc(t.title) + '</b> · ' + st.md(t.start) +
      (t.milestone ? ' · 里程碑' : ' – ' + st.md(t.end) + ' · 进度 ' + (t.progress || 0) + '%') +
      ' · ' + esc(st.member(t.owner).name) +
      (deps ? ' · 前置：' + esc(deps) : '') +
      (cf.length ? ' <span class="is-late">依赖冲突：' + esc(cf.join('、')) + '</span>' : '');
  }

  function selectTask(id) {
    selectedId = id;
    renderBars();
    const t = S().task(id);
    if (t) updateReadout(t);
  }

  function openDetail(id) {
    const t = S().task(id);
    if (!t) return;
    location.hash = '#/p/' + t.pid + '/board';
    setTimeout(() => window.Board.openInspector(id), 60);
  }

  /* ---------- 拖拽 ---------- */
  function showTip(e, t) {
    const tip = $('#gt-tip');
    if (!tip) return;
    const wrap = $('.gwrap');
    const r = wrap.getBoundingClientRect();
    tip.hidden = false;
    tip.innerHTML = '<b>' + esc(t.title) + '</b><br>' + S().md(t.start) +
      (t.milestone ? ' · 里程碑' : ' – ' + S().md(t.end)) +
      (conflictOf(t).length ? '<br><span class="is-late">依赖冲突</span>' : '');
    let x = e.clientX - r.left + 18;
    let y = e.clientY - r.top - 10;
    x = Math.max(6, Math.min(x, r.width - tip.offsetWidth - 8));
    y = Math.max(6, Math.min(y, r.height - tip.offsetHeight - 6));
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  }
  const hideTip = () => { const tip = $('#gt-tip'); if (tip) tip.hidden = true; };

  function onMove(e) {
    if (!drag) return;
    const st = S();
    const w = dw();
    const dd = Math.round((e.clientX - drag.startX) / w);
    if (Math.abs(e.clientX - drag.startX) > 3) drag.moved = true;
    const t = drag.t;
    let ns = drag.os, ne = drag.oe;
    if (drag.mode === 'move') { ns = st.shift(drag.os, dd); ne = st.shift(drag.oe, dd); }
    else if (drag.mode === 'l') { ns = st.shift(drag.os, dd); if (pd(ns) > pd(ne)) ns = ne; }
    else { ne = st.shift(drag.oe, dd); if (pd(ne) < pd(ns)) ne = ns; }
    const { RS, RE } = range();
    if (pd(ns) < RS) { const off = Math.round((pd(ne) - pd(ns)) / DAYMS); ns = st.fmt(RS); ne = st.shift(ns, off); }
    if (pd(ne) > RE) { const off = Math.round((pd(ne) - pd(ns)) / DAYMS); ne = st.fmt(RE); ns = st.shift(ne, -off); }
    t.start = ns; t.end = ne;
    renderBars();
    renderDeps();
    updateLeftRow(t);
    showTip(e, t);
  }

  function onUp() {
    if (!drag) return;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    const t = drag.t;
    const item = document.querySelector('#gt-bars [data-id="' + t.id + '"]');
    if (item) item.classList.remove('is-drag');
    hideTip();
    if (drag.moved) {
      S().updateTask(t.id, { start: t.start, end: t.end });
      updateReadout(t);
    } else {
      selectTask(t.id);
    }
    drag = null;
  }

  function bindPointer() {
    const bars = $('#gt-bars');
    if (!bars || bars._bound) return;
    bars._bound = true;
    bars.addEventListener('pointerdown', e => {
      const item = e.target.closest('[data-id]');
      if (!item) return;
      const t = S().task(item.dataset.id);
      if (!t) return;
      e.preventDefault();
      const rect = item.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      let mode = 'move';
      if (item.classList.contains('gbar')) {
        if (localX <= 10) mode = 'l';
        else if (localX >= rect.width - 10) mode = 'r';
      }
      drag = { t, mode, startX: e.clientX, os: t.start, oe: t.end, moved: false };
      item.classList.add('is-drag');
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });
    bars.addEventListener('dblclick', e => {
      const item = e.target.closest('[data-id]');
      if (item) openDetail(item.dataset.id);
    });
  }

  window.Gantt = {
    render
  };
})();
