// 面试题库：按类型分类 + 关键词/掌握程度筛选 + 随机抽题；顶部速览各版简历（可重命名）
async function renderQuestions(container) {
  const Q = appState.qaState;
  const [{ types, customs }, { questions }, dData] = await Promise.all([
    api.get('/api/questions/types'), api.get('/api/questions'), api.get('/api/agent/directions')]);
  const resumes = (dData.directions || []).flatMap((d) => (d.resumes || []).map((r) => ({ ...r, dir: d.name })));
  // 侧栏分类：自定义分类在前（可空分类也显示），再按题目数排数据里出现过的分类
  const customSet = new Set(customs || []);
  const sideTypes = [
    ...(customs || []).map((n) => ({ type: n, count: (types.find((t) => t.type === n) || {}).count || 0 })),
    ...types.filter((t) => !customSet.has(t.type)),
  ];
  Q._all = questions; // 分类/掌握程度/搜索均在前端即时筛选，点击分类不再整页重载
  const masteryOpts = META.mastery.map((m) => `<option value="${esc(m)}" ${Q.mastery === m ? 'selected' : ''}>${esc(m)}</option>`).join('');
  container.innerHTML = `
    <div class="page-head">
      <h2>面试题库 <span class="muted">（${questions.length} 题）</span></h2>
      <div class="actions">
        <button class="btn" onclick="randomQuestion()">🎲 随机抽题</button>
        <button class="btn primary" onclick="newQuestion()">＋ 新增题目</button>
      </div>
    </div>
    ${resumes.length ? `
    <div class="card qa-resume-card">
      <div class="ai-card-head">
        <h3>我的简历 <span class="muted">（${resumes.length} 版）</span></h3>
        <span class="muted">面试前随手看 · 每版可单独命名</span>
      </div>
      <div class="qa-resume-list">
        ${resumes.map((r) => `
          <div class="resume-row">
            <span class="resume-name">${esc(r.name)}</span>
            <span class="chip chip-gray">${esc(r.dir)}</span>
            ${r.analysis ? `<span class="chip chip-green">匹配 ${r.analysis.matchScore}</span>` : '<span class="chip chip-gray">未分析</span>'}
            <span class="spacer"></span>
            ${r.has_profile ? `<button class="btn small" onclick="viewResumeProfile(${r.id})">档案</button>` : ''}
            <button class="btn small" onclick="renameResume(${r.id})">改名</button>
          </div>`).join('')}
      </div>
    </div>` : ''}
    <div class="qa-layout">
      <aside class="qa-types">
        <div class="qa-type ${!Q.type ? 'active' : ''}" data-all onclick="setQaFilter('type', '')">
          <span class="qa-type-name">全部</span><b>${questions.length}</b>
        </div>
        ${sideTypes.map((t) => `<div class="qa-type ${Q.type === t.type ? 'active' : ''}" data-v="${esc(t.type)}" onclick="setQaFilter('type', this.dataset.v)">
          <span class="qa-type-name" title="${esc(t.type)}">${esc(t.type)}</span><b>${t.count}</b>
          <button type="button" class="qa-type-edit" title="管理分类「${esc(t.type)}」中的题目（新增/编辑/删除）" aria-label="管理分类「${esc(t.type)}」中的题目" data-name="${esc(t.type)}" data-count="${t.count}" onclick="event.stopPropagation(); openQaCategoryManager(this)">✎</button>
        </div>`).join('')}
        ${sideTypes.length ? '' : '<div class="muted">暂无题目</div>'}
        <div class="qa-type qa-type-manage" onclick="openQaTypesModal()">＋ 管理分类</div>
      </aside>
      <div class="qa-main">
        <div class="filter-bar">
          <input type="search" placeholder="搜索题目 / 答案 / 提示 / 标签 / 公司…" value="${esc(Q.q)}">
          <select onchange="setQaFilter('mastery', this.value)"><option value="">全部掌握程度</option>${masteryOpts}</select>
        </div>
        <div class="qa-list">${qaListHtml()}</div>
      </div>
    </div>`;

  const si = container.querySelector('.filter-bar input[type=search]');
  if (si) {
    bindSearchInput(si, (value) => {
      Q.q = value;
      refreshQaView();
    });
    if (Q.focusSearch) {
      si.focus();
      si.setSelectionRange(si.value.length, si.value.length);
      Q.focusSearch = false;
    }
  }
}

function qaMatches(q) {
  const Q = appState.qaState;
  if (Q.type && q.type !== Q.type) return false;
  if (Q.mastery && q.mastery !== Q.mastery) return false;
  if (Q.q && !((q.question || '') + (q.answer || '') + (q.hint || '') + (q.tags || '') + (q.company || '')).includes(Q.q)) return false;
  return true;
}

function qaListHtml() {
  const Q = appState.qaState;
  const shown = (Q._all || []).filter(qaMatches);
  Q._filtered = shown;
  const typeTotal = Q.type ? (Q._all || []).filter((q) => q.type === Q.type).length : 0;
  const toolbar = Q.type ? `<div class="qa-cat-bar">
    <span>当前分类：<b>${esc(Q.type)}</b><span class="muted">（${typeTotal} 题${shown.length !== typeTotal ? `，当前显示 ${shown.length} 题` : ''}）</span></span>
    <span class="spacer"></span>
    <button type="button" class="btn small" data-name="${esc(Q.type)}" onclick="openQaCategoryManager(this)">✎ 管理本分类题目</button>
    <button type="button" class="btn small primary" onclick="addQuestionInType()">＋ 新增到本分类</button>
  </div>` : '';
  if (!shown.length) {
    const canAdd = Q.type && !Q.q && !Q.mastery;
    return toolbar + `<div class="empty">没有符合条件的题目。${canAdd
      ? `<div class="qa-empty-add"><button type="button" class="btn small primary" onclick="addQuestionInType()">＋ 新增到「${esc(Q.type)}」</button></div>`
      : ''}</div>`;
  }
  return toolbar + shown.map((q) => qaCard(q, Q.expandedId === q.id)).join('');
}

// 只刷新列表和侧栏选中态：分类/搜索/展开不再请求接口、不再整页闪「加载中」
function refreshQaView() {
  const main = document.getElementById('main');
  const list = main && main.querySelector('.qa-list');
  if (!list) { router(); return; }
  const Q = appState.qaState;
  list.innerHTML = qaListHtml();
  initAttachmentZones(list);
  main.querySelectorAll('.qa-type[data-v]').forEach((el) => el.classList.toggle('active', el.dataset.v === Q.type));
  const all = main.querySelector('.qa-type[data-all]');
  if (all) all.classList.toggle('active', !Q.type);
}

function qaCard(q, expanded) {
  return `<div class="card qa-card">
    <div class="qa-q" onclick="toggleQa(${q.id})">
      <span class="qa-text">${esc(q.question)}</span>
      <span class="qa-meta">
        ${appState.qaState.type === q.type ? '' : `<span class="chip chip-gray">${esc(q.type)}</span>`}
        <span class="chip ${masteryClass(q.mastery)}">${esc(q.mastery)}</span>
        ${q.company ? `<span class="qa-company">${esc(q.company)}</span>` : ''}
      </span>
      <span class="qa-q-acts">
        <button type="button" class="qa-q-act" title="编辑这道题" aria-label="编辑这道题" onclick="event.stopPropagation(); openQuestionForm(${q.id})">✎</button>
      </span>
    </div>
    ${expanded ? `
    <div class="qa-a">
      ${q.hint ? `<div class="qa-hint">
        <div class="qa-hint-head"><span>💡 答题提示</span><span class="qa-hint-note">参考思路，不是你的答案</span></div>
        <div class="md">${renderMd(q.hint)}</div>
      </div>` : ''}
      <div class="qa-answer">
        <div class="qa-answer-head">✍️ 我的答案</div>
        ${q.answer ? `<div class="md">${renderMd(q.answer)}</div>`
          : '<div class="qa-answer-empty">还没有写自己的答案。<button type="button" class="btn small" onclick="openQuestionForm(' + q.id + ')">写答案</button></div>'}
      </div>
      ${q.tags ? `<div class="tags">${q.tags.split(/[,，;；\s]+/).filter(Boolean).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
      <div class="attach-zone" data-module="question" data-id="${q.id}"></div>
    </div>` : ''}
  </div>`;
}

function masteryClass(m) { return { '未复习': 'chip-gray', '待复习': 'chip-amber', '已掌握': 'chip-green' }[m] || 'chip-gray'; }
function setQaFilter(key, value) { appState.qaState[key] = value; appState.qaState.expandedId = null; refreshQaView(); }
function toggleQa(id) { appState.qaState.expandedId = appState.qaState.expandedId === id ? null : id; refreshQaView(); }

function randomQuestion() {
  const list = appState.qaState._filtered || [];
  if (!list.length) return toast('当前筛选下没有题目', 'error');
  appState.qaState.expandedId = list[Math.floor(Math.random() * list.length)].id;
  refreshQaView();
}

function newQuestion() {
  const type = appState.qaState.type;
  openQuestionForm(null, type ? { type } : {});
}

function addQuestionInType() {
  const type = appState.qaState.type;
  if (type) openQuestionForm(null, { type });
}

async function openQuestionForm(id, preset = {}) {
  try {
    let initial = { type: '技术八股', question: '', hint: '', answer: '', company: '', tags: '', mastery: '未复习', position_id: null };
    if (id) { initial = (await api.get('/api/questions/' + id)).question; }
    if (preset.type && !id) initial.type = preset.type;
    if (preset.positionName) {
      if (!id) { initial.type = '针对性准备'; initial.tags = preset.positionName; }
      initial.position_id = preset.positionId || null;
    }
    const { types } = await api.get('/api/questions/types');
    const typeOptions = Array.from(new Set([...META.defaultQaTypes, ...META.questionTypes, ...types.map((t) => t.type)]));
    openFormModal({
      title: id ? '编辑题目' : '新增题目',
      width: 720,
      fields: [
        { name: 'question', label: '问题', type: 'textarea', rows: 3, required: true },
        { name: 'type', label: '题目类型', type: 'datalist', options: typeOptions },
        { name: 'hint', label: '答题提示（参考资料，不是你的答案）', type: 'textarea', rows: 8, placeholder: '面试机构/资料整理的思路、考察点、STAR 结构等。只作提示，不计入你的答案。' },
        { name: 'answer', label: '我的答案', type: 'textarea', rows: 12, placeholder: '写你自己的答案，支持 Markdown：**加粗**、- 列表、```代码块```、[链接](url)' },
        { name: 'mastery', label: '掌握程度', type: 'select', options: META.mastery },
        { name: 'company', label: '来源公司' },
        { name: 'tags', label: '标签', placeholder: '逗号分隔' },
      ],
      initial,
      attach: { module: 'question', recordId: id || undefined },
      onSave: (v) => {
        v.position_id = initial.position_id || null;
        return id ? api.put('/api/questions/' + id, v).then(() => ({})) : api.post('/api/questions', v);
      },
      afterSave: preset.afterSave || null,
      onDelete: id ? () => api.del('/api/questions/' + id) : null,
      afterDelete: async () => {
        router();
        if (qaCatState) await refreshQaCatManager();
      },
      deleteConfirm: '删除这道题？',
    });
  } catch (e) { toast(e.message, 'error'); }
}

// 从「我的投递」岗位下发起的针对性问题（参数经 data-* 传递，避免内联转义问题）
function openQuestionFormFromEl(el) {
  openQuestionForm(null, {
    positionId: el.dataset.pid ? Number(el.dataset.pid) : null,
    positionName: el.dataset.pname || '',
  });
}

/* ---------- 自定义分类管理 ---------- */
async function openQaTypesModal() {
  const [{ types, customs }, { questions }] = await Promise.all([
    api.get('/api/questions/types'), api.get('/api/questions')]);
  const counts = Object.fromEntries(types.map((t) => [t.type, t.count]));
  const all = [...new Set([...(customs || []), ...META.defaultQaTypes, ...types.map((t) => t.type)])];
  const rows = all.map((n) => `<div class="resume-row">
    <span class="resume-name">${esc(n)}</span>
    <span class="muted">${counts[n] || 0} 题</span>
    ${(customs || []).includes(n) || !META.defaultQaTypes.includes(n) ? '<span class="chip chip-blue">自定义</span>' : '<span class="chip chip-gray">默认</span>'}
    <span class="spacer"></span>
    <button class="btn small" data-name="${esc(n)}" onclick="renameQaType(this)">改名</button>
    <button class="btn small danger" data-name="${esc(n)}" data-count="${counts[n] || 0}" onclick="delQaType(this)">删除</button>
  </div>`).join('');
  const m = openModal(`
    <div class="dir-cand-modal">
      <h3>题库分类管理 <span class="muted">（${questions.length} 题）</span></h3>
      <div class="ai-search-row" style="margin-bottom:12px">
        <input id="qa-type-new" placeholder="新分类名，如：宝洁八大问、项目经历">
        <button type="button" class="btn primary" id="qa-type-add">添加</button>
      </div>
      ${rows}
      <p class="muted" style="margin-top:10px">删除分类时，该分类下的题目会移到「未分类」，不会丢失。</p>
      <div class="modal-actions"><button type="button" class="btn" data-close>关闭</button></div>
    </div>`, { width: 640 });
  m.el.querySelector('[data-close]').onclick = m.close;
  m.el.querySelector('#qa-type-add').onclick = async () => {
    const name = m.el.querySelector('#qa-type-new').value.trim();
    if (!name) return toast('请输入分类名', 'error');
    try { await api.post('/api/questions/types', { name }); toast('已添加分类', 'success'); m.close(); router(); }
    catch (e) { toast(e.message, 'error'); }
  };
}

/* ---------- 单个分类的题目管理（新增/编辑/删除） ---------- */
let qaCatState = null;

function qaCatRowsHtml(list) {
  if (!list.length) return `<div class="empty qa-cat-empty">这个分类下还没有题目。
    <div class="qa-empty-add"><button type="button" class="btn small primary" onclick="qaCatAdd()">＋ 新增第一道题</button></div>
  </div>`;
  return list.map((q) => `<div class="qa-cat-row">
    <div class="qa-cat-row-main">
      <div class="qa-cat-row-q" title="${esc(q.question)}">${esc(q.question)}</div>
      <div class="qa-cat-row-meta">
        <span class="chip ${masteryClass(q.mastery)}">${esc(q.mastery)}</span>
        ${q.company ? `<span class="chip chip-gray">${esc(q.company)}</span>` : ''}
        ${q.answer ? '<span class="chip chip-green">已写答案</span>' : '<span class="chip chip-gray">未写答案</span>'}
      </div>
    </div>
    <div class="qa-cat-row-acts">
      <button type="button" class="btn small" data-id="${q.id}" onclick="qaCatEdit(this.dataset.id)">编辑</button>
    </div>
  </div>`).join('');
}

// 侧栏分类右侧 ✎：打开本分类的题目管理（不是只改分类名）
async function openQaCategoryManager(el) {
  const type = el && el.dataset ? el.dataset.name : String(el || '');
  if (!type) return;
  try {
    const { questions } = await api.get('/api/questions');
    const list = questions.filter((q) => q.type === type);
    const m = openModal(`
      <div class="qa-cat-modal">
        <div class="qa-cat-head">
          <h3>分类「<span id="qa-cat-title">${esc(type)}</span>」<span class="muted" id="qa-cat-count">（${list.length} 题）</span></h3>
          <button type="button" class="btn small primary" id="qa-cat-add">＋ 新增题目</button>
        </div>
        <div class="qa-cat-name-row">
          <label for="qa-cat-name">分类名</label>
          <input id="qa-cat-name" value="${esc(type)}" maxlength="40">
          <button type="button" class="btn small" id="qa-cat-rename">保存分类名</button>
          <button type="button" class="btn small danger" id="qa-cat-remove">删除分类</button>
        </div>
        <div class="qa-cat-rows" id="qa-cat-rows">${qaCatRowsHtml(list)}</div>
        <p class="muted qa-cat-tip">点「编辑」可修改题目，删除按钮在编辑弹窗里。删除分类不会删除题目，题目会移到「未分类」。</p>
        <div class="modal-actions"><button type="button" class="btn" data-close>关闭</button></div>
      </div>`, { width: 760 });
    qaCatState = { type, modal: m, questions: list };
    m.el.querySelector('#qa-cat-add').onclick = qaCatAdd;
    m.el.querySelector('#qa-cat-rename').onclick = qaCatRenameAction;
    m.el.querySelector('#qa-cat-remove').onclick = qaCatDeleteCategory;
    const nameInput = m.el.querySelector('#qa-cat-name');
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); qaCatRenameAction(); }
    });
  } catch (e) { toast(e.message, 'error'); }
}

async function refreshQaCatManager() {
  const st = qaCatState;
  if (!st) return;
  if (!document.body.contains(st.modal.el)) { qaCatState = null; return; }
  try {
    const { questions } = await api.get('/api/questions');
    if (qaCatState !== st || !document.body.contains(st.modal.el)) return;
    const list = questions.filter((q) => q.type === st.type);
    st.questions = list;
    const countEl = st.modal.el.querySelector('#qa-cat-count');
    if (countEl) countEl.textContent = `（${list.length} 题）`;
    const rowsEl = st.modal.el.querySelector('#qa-cat-rows');
    if (rowsEl) rowsEl.innerHTML = qaCatRowsHtml(list);
  } catch (e) { toast(e.message, 'error'); }
}

function qaCatAdd() {
  if (!qaCatState) return;
  const type = qaCatState.type;
  openQuestionForm(null, { type, afterSave: refreshQaCatManager });
}

function qaCatEdit(id) {
  openQuestionForm(Number(id), { afterSave: refreshQaCatManager });
}

async function qaCatRenameAction() {
  const st = qaCatState;
  if (!st) return;
  if (!document.body.contains(st.modal.el)) { qaCatState = null; return; }
  const input = st.modal.el.querySelector('#qa-cat-name');
  const name = input.value.trim();
  if (!name) return toast('分类名不能为空', 'error');
  if (name === st.type) return toast('分类名没有变化');
  const btn = st.modal.el.querySelector('#qa-cat-rename');
  btn.disabled = true;
  try {
    await api.put('/api/questions/types/' + encodeURIComponent(st.type), { name });
    if (appState.qaState.type === st.type) appState.qaState.type = name;
    st.type = name;
    const titleEl = st.modal.el.querySelector('#qa-cat-title');
    if (titleEl) titleEl.textContent = name;
    toast('分类已改名', 'success');
    router();
    await refreshQaCatManager();
  } catch (e) { toast(e.message, 'error'); }
  finally { btn.disabled = false; }
}

async function qaCatDeleteCategory() {
  const st = qaCatState;
  if (!st) return;
  const { type, questions } = st;
  if (!(await confirmDialog(`删除分类「${type}」？${questions.length ? `该分类下的 ${questions.length} 道题将移到「未分类」` : '该分类将被移除'}。`))) return;
  try {
    await api.del('/api/questions/types/' + encodeURIComponent(type));
    if (appState.qaState.type === type) appState.qaState.type = '';
    st.modal.close();
    qaCatState = null;
    toast('已删除分类', 'success');
    router();
  } catch (e) { toast(e.message, 'error'); }
}

async function renameQaType(el) {
  const old = el.dataset.name;
  openFormModal({
    title: '重命名分类',
    fields: [{ name: 'name', label: '分类名', required: true }],
    initial: { name: old },
    onSave: async (v) => {
      const name = String(v.name || '').trim();
      await api.put('/api/questions/types/' + encodeURIComponent(old), { name });
      if (appState.qaState.type === old) appState.qaState.type = name;
      return {};
    },
  });
}

async function delQaType(el) {
  const name = el.dataset.name;
  const count = Number(el.dataset.count) || 0;
  if (!(await confirmDialog(`删除分类「${name}」？${count ? `该分类下的 ${count} 道题将移到「未分类」` : '该分类将被移除'}。`))) return;
  try {
    await api.del('/api/questions/types/' + encodeURIComponent(name));
    if (appState.qaState.type === name) appState.qaState.type = '';
    toast('已删除', 'success');
    router();
  } catch (e) { toast(e.message, 'error'); }
}

/* ---------- 简历速览（与求职方向共用同一批简历） ---------- */
async function renameResume(id) {
  try {
    const { resume } = await api.get('/api/agent/resumes/' + id);
    openFormModal({
      title: '重命名简历版本',
      fields: [{ name: 'name', label: '版本名称', required: true }],
      initial: { name: resume.name },
      onSave: (v) => api.put('/api/agent/resumes/' + id, v).then(() => ({})),
    });
  } catch (e) { toast(e.message, 'error'); }
}
