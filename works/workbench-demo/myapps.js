// 我的投递：按公司分组；公司名 + 网址；每行用状态下拉切换（替代四颗按钮）；岗位可点击进入详情页

async function renderMyApps(container) {
  const { applications } = await api.get('/api/applications');
  const M = appState.myappsState;
  const q = (M.q || '').trim();
  const statusFilter = M.statusFilter || '';

  // 搜索 + 状态筛选
  const visible = applications.filter((a) => {
    if (statusFilter && a.status !== statusFilter) return false;
    if (q && !((a.company || '') + (a.title || '') + (a.position_name || '')).includes(q)) return false;
    return true;
  });

  // 按公司分组
  const comps = new Map();
  visible.forEach((a) => {
    const k = a.company || '未知公司';
    if (!comps.has(k)) comps.set(k, []);
    comps.get(k).push(a);
  });
  const STATUS_CLASS = { '未投递': 'st-idle', '已投递': 'st-applied', '面试中': 'st-interview', '已挂': 'st-rejected' };
  const blocks = [...comps.entries()].sort((a, b) => a[0].localeCompare(b[0], 'zh')).map(([company, apps]) => {
    const urls = [...new Set(apps.map((a) => a.url || a.opening_url).filter(Boolean))];
    const urlSlot = urls.length
      ? urls.map((u) => `<a class="op-url" href="${esc(u)}" target="_blank" rel="noopener" title="${esc(u)}">${esc(u.length > 40 ? u.slice(0, 40) + '…' : u)}</a>`).join('')
      : `<button class="url-add" data-company="${esc(company)}" onclick="editCompanyUrl(this.dataset.company)">＋ 添加招聘网址</button>`;
    const entries = apps.map((a) => {
      const label = a.title || a.position_name || '未分类';
      return `<div class="ma-entry">
        <a class="ma-entry-main" href="#/app/${a.id}" title="${esc(label)}（点击查看详情）">
          ${a.position_name ? `<span class="chip chip-gray">${esc(a.position_name)}</span>` : ''}
          ${a.title ? `<span class="ma-title">${esc(a.title)}</span>` : ''}
          ${a.source === '玄米' ? '<span class="op-source">玄米</span>' : ''}
          ${!a.position_name && !a.title ? '<span class="chip chip-gray">未分类</span>' : ''}
        </a>
        <select class="ma-status-select ${STATUS_CLASS[a.status] || 'st-idle'}" data-app="${a.id}"
          aria-label="投递状态" onchange="setAppStatus(this.dataset.app, this.value)">
          ${META.statuses.map((s) => `<option value="${esc(s)}" ${a.status === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}
        </select>
      </div>`;
    }).join('');
    return `<div class="card ma-block">
      <div class="ma-head">
        <strong class="ma-company">${esc(company)}</strong>
        ${urlSlot}
      </div>
      <form class="ma-add-row" data-company="${esc(company)}">
        <span class="ma-add-label">岗位：</span>
        <input type="text" name="title" placeholder="输入岗位名称，回车添加" autocomplete="off">
        <button type="submit" class="btn small primary" title="添加岗位">＋</button>
      </form>
      <div class="ma-entries">${entries}</div>
    </div>`;
  }).join('');

  const filtering = !!q || !!statusFilter;
  container.innerHTML = `
    <div class="page-head">
      <h2>我的投递 <span class="muted">（${filtering ? `${visible.length} / ${applications.length}` : applications.length} 条）</span></h2>
      <div class="actions">
        <button class="btn primary" onclick="openApplicationForm()">＋ 新增投递</button>
      </div>
    </div>
    <div class="filter-bar">
      <input type="search" placeholder="搜索公司 / 岗位…" value="${esc(M.q || '')}">
      <select onchange="setMyAppsStatus(this.value)">
        <option value="">全部状态</option>
        ${META.statuses.map((s) => `<option value="${esc(s)}" ${statusFilter === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}
      </select>
      ${filtering ? '<button class="btn" onclick="clearMyAppsFilters()">清除筛选</button>' : ''}
    </div>
    ${blocks || `<div class="empty">${filtering
      ? '没有符合条件的投递记录'
      : '还没有投递记录。去「岗位汇总」浏览机会，点 ＋ 一键加入。'}</div>`}`;

  const si = container.querySelector('.filter-bar input[type=search]');
  if (si) {
    bindSearchInput(si, (value) => {
      M.q = value;
      M.focusSearch = true;
      router();
    });
    if (M.focusSearch) {
      si.focus();
      si.setSelectionRange(si.value.length, si.value.length);
      M.focusSearch = false;
    }
  }

  // 每家公司的「岗位：」快速添加行
  container.querySelectorAll('.ma-add-row').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = form.querySelector('input').value.trim();
      if (!title) return;
      quickAddPosition(form.dataset.company, title);
    });
  });
  if (M.focusAddCompany) {
    const form = [...container.querySelectorAll('.ma-add-row')].find((f) => f.dataset.company === M.focusAddCompany);
    if (form) form.querySelector('input').focus();
    M.focusAddCompany = null;
  }
}

// 在指定公司下快速添加一个岗位（按名称匹配已有岗位，匹配不到则只记具体岗位名）
async function quickAddPosition(company, title) {
  try {
    const [{ positions }, { applications }] = await Promise.all([
      api.get('/api/positions'), api.get('/api/applications')]);
    const norm = (s) => String(s || '').replace(/\s+/g, '');
    const matched = positions.find((p) => norm(p.name) === norm(title));
    const dup = applications.some((a) => a.company === company
      && (matched ? a.position_id === matched.id : norm(a.title) === norm(title)));
    if (dup) return toast('该岗位已在列表中', 'error');
    await api.post('/api/applications', {
      company,
      position_id: matched ? matched.id : null,
      title: matched ? '' : title,
      status: '未投递',
    });
    appState.myappsState.focusAddCompany = company;
    toast(matched ? `已添加：${matched.name}` : `已添加：${title}`, 'success');
    router();
  } catch (e) { toast(e.message, 'error'); }
}

// 状态筛选写进 URL，保证与数据分析下钻一致、刷新后仍保留
function setMyAppsStatus(status) {
  appState.myappsState.statusFilter = status;
  const target = status ? `#/myapps?status=${encodeURIComponent(status)}` : '#/myapps';
  if (location.hash === target) router();
  else location.hash = target;
}

function clearMyAppsFilters() {
  appState.myappsState.q = '';
  appState.myappsState.statusFilter = '';
  if (location.hash === '#/myapps') router();
  else location.hash = '#/myapps';
}

// 四态切换
async function setAppStatus(appId, status) {
  try {
    const { application } = await api.get('/api/applications/' + appId);
    const { position_name, opening_id, created_at, updated_at, ...rest } = application;
    await api.put('/api/applications/' + appId, { ...rest, status });
    router();
  } catch (e) { toast(e.message, 'error'); }
}

// 公司招聘网址：空时可直接填写（同步到该公司下所有投递记录）
async function editCompanyUrl(company) {
  const { applications } = await api.get('/api/applications?q=' + encodeURIComponent(company));
  const targets = applications.filter((a) => a.company === company);
  if (!targets.length) return toast('该公司暂无投递记录', 'error');
  const current = targets.map((a) => a.url).find(Boolean) || '';
  const m = openModal(`
    <form class="edit-form">
      <h3>设置「${esc(company)}」的招聘网址</h3>
      <div class="form-row">
        <label>网址</label>
        <input name="url" placeholder="https://…" value="${esc(current)}" autofocus>
      </div>
      <p class="muted" style="font-size:12.5px">将同步到该公司下的 ${targets.length} 条投递记录。</p>
      <div class="modal-actions">
        <button type="button" class="btn" data-close>取消</button>
        <button type="submit" class="btn primary">保存</button>
      </div>
    </form>`, { width: 520 });
  m.el.querySelector('form').onsubmit = async (e) => {
    e.preventDefault();
    const url = e.target.querySelector('[name=url]').value.trim();
    try {
      for (const a of targets) {
        const payload = { company: a.company, position_id: a.position_id, title: a.title, city: a.city, channel: a.channel,
          applied_at: a.applied_at, deadline: a.deadline, status: a.status, url, note: a.note };
        await api.put('/api/applications/' + a.id, payload);
      }
      m.close();
      toast('网址已保存', 'success');
      router();
    } catch (err) { toast(err.message, 'error'); }
  };
}

/* ============ 岗位详情页（JD + 针对性准备 + 编辑按钮） ============ */
async function renderAppDetail(container, id) {
  const { application } = await api.get('/api/applications/' + id);
  const posId = application.position_id;
  const posName = application.position_name || '未分类';
  const [{ jds }, { questions }] = await Promise.all([
    posId ? api.get('/api/jds?position_id=' + posId) : Promise.resolve({ jds: [] }),
    posId ? api.get('/api/questions?position_id=' + posId) : Promise.resolve({ questions: [] }),
  ]);
  const Q = appState.qaState;
  const over = application.deadline && application.status !== '已挂' && application.deadline < todayStr();
  const meta = [application.source === '玄米' ? '玄米发现' : '', application.city, application.channel, application.applied_at,
    application.deadline ? '截止 ' + application.deadline : '', application.note].filter(Boolean);
  container.innerHTML = `
    <div class="page-head">
      <div>
        <a class="back-link" href="#/myapps">← 返回我的投递</a>
        <h2>${esc(application.company)} ${application.title ? `<span class="muted">${esc(application.title)}</span>` : ''} ${statusChip(application.status)}</h2>
        <div class="ma-detail-meta">
          <span class="chip chip-gray">${esc(posName)}</span>
          ${application.url ? `<a class="op-url" href="${esc(application.url)}" target="_blank" rel="noopener" title="${esc(application.url)}">${esc(application.url.length > 50 ? application.url.slice(0, 50) + '…' : application.url)}</a>` : ''}
          ${over ? '<span class="deadline-over">⚠ 已过截止</span>' : ''}
          ${meta.length ? `<span class="muted">${meta.map((x) => esc(x)).join(' · ')}</span>` : ''}
        </div>
      </div>
      <div class="actions">
        <button class="btn" onclick="openApplicationForm(null, ${application.id})">编辑投递</button>
      </div>
    </div>
    <section class="section-block">
      <div class="section-head">
        <h3>JD 要求 <span class="muted">(${jds.length})</span></h3>
        <button class="btn small primary" onclick="openJdForm(${posId || 'null'})">＋ 添加 JD</button>
      </div>
      ${jds.length ? jds.map(jdCard).join('') : '<div class="empty">该岗位还没有 JD，点「添加 JD」录入任职要求。</div>'}
    </section>
    <section class="section-block">
      <div class="section-head">
        <h3>针对性准备 <span class="muted">(${questions.length})</span></h3>
        <button class="btn small" onclick="openQuestionFormFromEl(this)" data-pid="${posId || ''}" data-pname="${esc(posName)}">＋ 添加问题</button>
      </div>
      ${questions.length ? questions.map((q) => qaCard(q, Q.expandedId === q.id)).join('') : '<div class="empty">还没有准备问题，点「添加问题」开始（自动带岗位名标签进入面试题库）。</div>'}
    </section>
    <section class="section-block">
      <div class="section-head"><h3>附件</h3></div>
      <div class="attach-zone" data-module="application" data-id="${application.id}"></div>
    </section>`;
}

/* ============ 表单与操作 ============ */
async function openApplicationForm(positionId, appId, preset = {}) {
  try {
    const { positions } = await api.get('/api/positions');
    let initial = { company: preset.company || '', position_id: positionId || '', title: preset.title || '', city: preset.city || '', channel: '', applied_at: '', deadline: '', status: '未投递', url: preset.url || '', note: '' };
    if (appId) { initial = (await api.get('/api/applications/' + appId)).application; }
    openFormModal({
      title: appId ? '编辑投递' : '新增投递',
      fields: [
        { name: 'company', label: '公司', required: true },
        { name: 'position_id', label: '岗位', type: 'select', options: positions.map((p) => ({ value: p.id, label: p.name })) },
        { name: 'title', label: '具体岗位' },
        { name: 'url', label: '投递网址', placeholder: 'https://…' },
        { name: 'city', label: '城市' },
        { name: 'channel', label: '渠道', type: 'select', options: META.channels },
        { name: 'applied_at', label: '投递日期', type: 'date' },
        { name: 'deadline', label: '截止日期', type: 'date' },
        { name: 'status', label: '状态', type: 'select', options: META.statuses },
        { name: 'note', label: '备注', type: 'textarea', rows: 3 },
      ],
      initial,
      attach: { module: 'application', recordId: appId || undefined },
      onSave: (v) => appId ? api.put('/api/applications/' + appId, v).then(() => ({})) : api.post('/api/applications', v),
      onDelete: appId ? () => api.del('/api/applications/' + appId) : null,
      afterDelete: () => {
        if (parseHash().view === 'appDetail') location.hash = '#/myapps';
        else router();
      },
      deleteConfirm: '删除这条投递记录？',
    });
  } catch (e) { toast(e.message, 'error'); }
}

/* ============ JD（挂在岗位下，详情页展示） ============ */
function jdCard(j) {
  return `<div class="card jd-card">
    <div class="jd-head">
      <strong>${esc(j.company || '未填公司')}</strong>
      ${j.title ? `<span class="muted">${esc(j.title)}</span>` : ''}
      ${j.source ? `<a class="link" href="${esc(j.source)}" target="_blank" rel="noopener">来源 ↗</a>` : ''}
      <span class="spacer"></span>
      <button class="btn small" onclick="openJdForm(null, ${j.id})">编辑</button>
    </div>
    ${j.requirements ? `<div class="jd-req">${esc(j.requirements)}</div>` : ''}
    ${j.skills ? `<div class="skills">${j.skills.split(/[,，;；]/).map((s) => s.trim()).filter(Boolean).map((s) => `<span class="skill">${esc(s)}</span>`).join('')}</div>` : ''}
    <div class="attach-zone" data-module="jd" data-id="${j.id}"></div>
  </div>`;
}

async function openJdForm(positionId, jdId) {
  try {
    const { positions } = await api.get('/api/positions');
    let initial = { position_id: positionId || '', company: '', title: '', requirements: '', skills: '', source: '' };
    if (jdId) { initial = (await api.get('/api/jds/' + jdId)).jd; }
    openFormModal({
      title: jdId ? '编辑 JD' : '添加 JD',
      width: 720,
      fields: [
        { name: 'position_id', label: '所属岗位', type: 'select', required: true, options: positions.map((p) => ({ value: p.id, label: p.name })) },
        { name: 'company', label: '公司', required: true },
        { name: 'title', label: '职位名称' },
        { name: 'requirements', label: 'JD 要求', type: 'textarea', rows: 8, placeholder: '粘贴 JD 原文或提炼后的要求' },
        { name: 'skills', label: '技能关键词', placeholder: '逗号分隔，如 Python, PyTorch, 大模型' },
        { name: 'source', label: '来源链接', placeholder: 'https://…' },
      ],
      initial,
      attach: { module: 'jd', recordId: jdId || undefined },
      onSave: (v) => jdId ? api.put('/api/jds/' + jdId, v).then(() => ({})) : api.post('/api/jds', v),
      onDelete: jdId ? () => api.del('/api/jds/' + jdId) : null,
      deleteConfirm: '删除这条 JD？',
    });
  } catch (e) { toast(e.message, 'error'); }
}

