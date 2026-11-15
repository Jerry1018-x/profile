// 岗位汇总：默认展示全部一级分类、折叠二级岗位；条目 = 公司（上）+ 具体岗位（下）+ 网址 + 内推码；交互键在右侧
// 玄米新采集的岗位带「新」角标，点击或加入投递后消失；内置一句话 AI 搜索
const AI_EXAMPLES = [
  '北京汽车行业还没投的岗位',
  '我还剩哪些行业一个都没投',
  '我投了哪些公司，面试中都有谁',
];

async function renderCatalog(container) {
  const [{ openings }, { positions }, { applications }, { config }] = await Promise.all([
    api.get('/api/openings'), api.get('/api/positions'), api.get('/api/applications'), api.get('/api/ai/config')]);
  const F = appState.catalogState;
  const addedIds = new Set(applications.filter((a) => a.opening_id).map((a) => a.opening_id));
  const q = (F.q || '').trim();
  const catFilter = F.catFilter || '';
  const posFilter = F.posFilter || null;
  const filtered = openings.filter((o) => {
    if (catFilter && (o.category || '未分类') !== catFilter) return false;
    if (posFilter && o.position_id !== posFilter) return false;
    if (q && !(o.company + o.title + o.position_name + o.category + o.referral).includes(q)) return false;
    return true;
  });

  // 按 分类 → 岗位 分组（搜索/筛选时只保留有匹配结果的岗位，避免出现大量空岗位块）
  const catMap = new Map(); // category -> Map(position_id -> {position, items})
  const positionOf = new Map(positions.map((p) => [p.id, p]));
  const posFilterName = posFilter ? ((positionOf.get(posFilter) || {}).name || '') : '';
  const hitPositionIds = new Set(filtered.map((o) => o.position_id));
  positions.forEach((p) => {
    if (catFilter && (p.category || '未分类') !== catFilter) return;
    if (posFilter && p.id !== posFilter) return;
    if (q && !hitPositionIds.has(p.id)) return;
    const c = p.category || '未分类';
    if (!catMap.has(c)) catMap.set(c, new Map());
    catMap.get(c).set(p.id, { position: p, items: [] });
  });
  filtered.forEach((o) => {
    const c = o.category || '未分类';
    if (!catMap.has(c)) catMap.set(c, new Map());
    if (!catMap.get(c).has(o.position_id)) catMap.get(c).set(o.position_id, { position: positionOf.get(o.position_id) || { id: o.position_id, name: o.position_name || '未知岗位', category: c }, items: [] });
    catMap.get(c).get(o.position_id).items.push(o);
  });
  const cats = [...catMap.entries()].sort((a, b) => (a[0] === '未分类' ? 1 : b[0] === '未分类' ? -1 : a[0].localeCompare(b[0], 'zh')));

  const searching = q.length > 0 || !!catFilter || !!posFilter; // 搜索/筛选时自动展开，避免结果藏在折叠里
  const sections = cats.map(([cat, posMap]) => {
    const catExpanded = searching || F.expandedCats.has(cat);
    const posBlocks = [...posMap.entries()]
      .sort((a, b) => a[1].position.name.localeCompare(b[1].position.name, 'zh'))
      .map(([pid, { position, items }]) => {
        const posExpanded = searching || !F.collapsedPos.has(pid);
        const rows = items
          .sort((a, b) => a.company.localeCompare(b.company, 'zh'))
          .map((o) => `
            <div class="opening-row">
              <div class="op-main">
                <div class="op-company">${esc(o.company)}${o.source === '玄米' ? ' <span class="op-source">玄米</span>' : ''}${o.genmai_new ? `<span class="op-new" data-id="${o.id}" title="玄米新采集 · 点击标记已读" onclick="markOpeningSeen(${o.id})">新</span>` : ''}</div>
                ${o.title ? `<div class="op-title">${esc(o.title)}</div>` : ''}
              </div>
              ${o.url ? `<a class="op-url" href="${esc(o.url)}" target="_blank" rel="noopener" title="${esc(o.url)}">${esc(o.url.length > 36 ? o.url.slice(0, 36) + '…' : o.url)}</a>` : ''}
              ${o.referral ? `<span class="chip chip-amber op-ref" title="内推码">内推码 ${esc(o.referral)}</span>` : ''}
              ${o.deadline ? `<span class="chip chip-red op-deadline" title="截止日期">截止 ${esc(o.deadline)}</span>` : ''}
              <span class="spacer"></span>
              <div class="op-actions">
                ${addedIds.has(o.id)
                  ? '<span class="op-added" title="已加入我的投递">✓ 已添加</span>'
                  : `<button class="btn small primary op-add" title="加入我的投递" onclick="addToMyApps(${o.id})">＋</button>`}
                <button class="btn small ghost" onclick="openOpeningForm(${o.id})">编辑</button>
              </div>
            </div>`).join('');
        return `<div class="pos-block">
          <div class="pos-block-head" role="button" tabindex="0" data-pid="${pid}" onclick="togglePosition(${pid})">
            <span class="cat-caret">${posExpanded ? '▾' : '▸'}</span>
            <strong>${esc(position.name)}</strong><span class="muted">${items.length} 个机会</span>
          </div>
          <div class="opening-list" ${posExpanded ? '' : 'hidden'}>${rows || '<div class="muted">该岗位暂无机会</div>'}</div>
        </div>`;
      }).join('');
    const catCount = [...posMap.values()].reduce((s, v) => s + v.items.length, 0);
    const posCount = posMap.size;
    return `<section class="cat-section">
      <div class="cat-head" role="button" tabindex="0" data-cat="${esc(cat)}" onclick="toggleCategory(this.dataset.cat)">
        <span class="cat-caret">${catExpanded ? '▾' : '▸'}</span>📁 ${esc(cat)}
        <span class="muted">${posCount} 个岗位 · ${catCount} 个机会</span>
      </div>
      <div class="cat-body" ${catExpanded ? '' : 'hidden'}>${posBlocks}</div>
    </section>`;
  }).join('');

  container.innerHTML = `
    <div class="page-head">
      <h2>岗位汇总 <span class="muted">（${filtered.length} / ${openings.length} 个机会）</span></h2>
      <div class="actions">
        <button class="btn ghost" onclick="openImportExcel()">导入 Excel</button>
        <button class="btn ghost" onclick="openPositionForm()">新增岗位</button>
        <button class="btn primary" onclick="openOpeningForm()">＋ 新增机会</button>
      </div>
    </div>
    <div class="card ai-card cat-ai-card">
      <div class="ai-card-head"><h3>AI 搜索</h3><span class="muted">用一句话找岗位，例如「北京汽车行业还没投的岗位」</span></div>
      <div class="ai-search-row">
        <input id="ai-search-input" placeholder="还没投的岗位 / 面试中的公司 / 内推机会…" value="${esc(F.aiQ || '')}">
        <button class="btn primary" onclick="aiSearch(this)" ${config.configured ? '' : 'disabled'}>搜索</button>
      </div>
      ${config.configured ? `<div class="ai-examples">${AI_EXAMPLES.map((e) => `<button type="button" class="ai-example" onclick="aiExample(this)">${esc(e)}</button>`).join('')}</div>`
        : '<p class="ai-hint">玄米还没接入 DeepSeek，AI 搜索暂不可用（Key 在对话里由 Claude 配置）。</p>'}
      <div id="ai-search-result">${F.aiResult ? aiResultHtml(F.aiResult) : ''}</div>
    </div>
    <div class="filter-bar">
      <input type="search" placeholder="搜索公司 / 岗位 / 分类 / 内推码…" value="${esc(F.q || '')}">
    </div>
    ${(catFilter || posFilter) ? `<div class="filter-chips">
      ${catFilter ? `<span class="filter-chip">分类：${esc(catFilter)}<button title="清除" onclick="clearCatalogFilters()">×</button></span>` : ''}
      ${posFilter ? `<span class="filter-chip">岗位：${esc(posFilterName || '')}<button title="清除" onclick="clearCatalogFilters()">×</button></span>` : ''}
    </div>` : ''}
    ${sections || `<div class="empty">${searching
      ? `没有匹配${q ? `「${esc(q)}」` : ''}${catFilter ? `「${esc(catFilter)}」分类` : ''}的机会`
      : '岗位汇总为空。点「导入 Excel」批量导入投递表，或手动「新增岗位 / 新增机会」。'}</div>`}
    ${openings.length ? '<div class="muted" style="margin-top:10px">点击分类展开岗位，点 ＋ 可把机会加入「我的投递」。</div>' : ''}`;

  // 搜索框：IME 感知绑定 + 重渲染后保持焦点
  const si = container.querySelector('.filter-bar input[type=search]');
  if (si) {
    bindSearchInput(si, (value) => {
      F.q = value;
      F.focusSearch = true;
      router();
    });
    if (F.focusSearch) {
      si.focus();
      si.setSelectionRange(si.value.length, si.value.length);
      F.focusSearch = false;
    }
  }
  const aiInput = container.querySelector('#ai-search-input');
  if (aiInput) {
    aiInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); aiSearch(); }
    });
  }
}

/* ---------- 玄米新岗位角标 ---------- */
async function markOpeningSeen(id) {
  try {
    await api.post('/api/openings/mark-seen', { ids: [id] });
    document.querySelectorAll('.op-new[data-id="' + id + '"]').forEach((el) => el.remove());
  } catch (e) { toast(e.message, 'error'); }
}

/* ---------- 一句话 AI 搜索（原智能采集页功能，已并入岗位汇总） ---------- */
function aiExample(btn) {
  const input = document.getElementById('ai-search-input');
  if (input) input.value = btn.textContent;
  aiSearch();
}

async function aiSearch(btn) {
  const input = document.getElementById('ai-search-input');
  const q = input.value.trim();
  if (!q) return toast('请输入搜索内容', 'error');
  const F = appState.catalogState;
  F.aiQ = q;
  if (btn) { btn.disabled = true; btn.textContent = '搜索中…'; }
  const box = document.getElementById('ai-search-result');
  box.innerHTML = '<div class="ai-status"><span class="ai-spinner"></span> 正在理解你的问题…</div>';
  try {
    const data = await api.post('/api/ai/search', { q });
    F.aiResult = data;
    box.innerHTML = aiResultHtml(data);
  } catch (e) {
    F.aiResult = null;
    box.innerHTML = `<div class="error-box">${esc(e.message)}</div>`;
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '搜索'; }
  }
}

function aiResultHtml(d) {
  const f = d.filters || {};
  const chips = [
    `<span class="chip chip-gray">${d.target === 'applications' ? '我的投递' : '机会库'}</span>`,
    ...(f.categories || []).map((c) => `<span class="chip chip-blue">行业：${esc(c)}</span>`),
    ...(f.cities || []).map((c) => `<span class="chip chip-cyan">城市：${esc(c)}</span>`),
    ...(f.keywords || []).map((c) => `<span class="chip chip-purple">关键词：${esc(c)}</span>`),
    ...(f.statuses || []).map((c) => `<span class="chip chip-amber">状态：${esc(c)}</span>`),
    f.onlyUnapplied ? '<span class="chip chip-green">只看未投递</span>' : '',
  ].filter(Boolean).join('');
  const head = `<div class="ai-result-head">「${esc(d.query)}」找到 <b>${d.rows.length}</b> 条 ${chips}</div>`;
  if (!d.rows.length) return head + '<div class="empty">没有匹配的记录，换个说法试试。</div>';

  if (d.target === 'applications') {
    return head + `<div class="table-scroll"><table>
      <thead><tr><th>公司</th><th>岗位</th><th>城市</th><th>状态</th><th>截止</th><th></th></tr></thead>
      <tbody>${d.rows.map((a) => `<tr>
        <td><strong>${esc(a.company)}</strong></td>
        <td>${esc(a.title || a.position_name || '—')}</td>
        <td>${esc(a.city || '—')}</td>
        <td>${statusChip(a.status)}</td>
        <td>${esc(a.deadline || '—')}</td>
        <td class="row-actions"><a class="btn small" href="#/app/${a.id}">查看详情</a></td>
      </tr>`).join('')}</tbody></table></div>`;
  }
  return head + `<div class="table-scroll"><table>
    <thead><tr><th>公司</th><th>岗位</th><th>城市</th><th>行业</th><th>截止</th><th>网址</th><th>内推码</th><th></th></tr></thead>
    <tbody>${d.rows.map((o) => `<tr>
      <td><strong>${esc(o.company)}</strong></td>
      <td>${esc(o.title || o.position_name || '—')}</td>
      <td>${esc(o.city || '—')}</td>
      <td>${esc(o.category || '—')}</td>
      <td>${esc(o.deadline || '—')}</td>
      <td>${o.url ? `<a class="op-url" href="${esc(o.url)}" target="_blank" rel="noopener" title="${esc(o.url)}">${esc(o.url.length > 36 ? o.url.slice(0, 36) + '…' : o.url)}</a>` : '<span class="muted">—</span>'}</td>
      <td>${esc(o.referral || '—')}</td>
      <td class="row-actions"><button class="btn small" data-company="${esc(o.company)}" data-title="${esc(o.title)}" data-url="${esc(o.url)}" data-city="${esc(o.city)}" data-deadline="${esc(o.deadline || '')}" data-pos="${o.position_id || ''}" onclick="aiToMyApps(this)">加入投递</button></td>
    </tr>`).join('')}</tbody></table></div>`;
}

function aiToMyApps(btn) {
  openApplicationForm(Number(btn.dataset.pos) || null, null, {
    company: btn.dataset.company,
    title: btn.dataset.title,
    url: btn.dataset.url,
    city: btn.dataset.city,
    deadline: btn.dataset.deadline,
  });
}

function toggleCategory(cat) {
  const s = appState.catalogState.expandedCats;
  if (s.has(cat)) s.delete(cat); else s.add(cat);
  router();
}

function togglePosition(pid) {
  const s = appState.catalogState.collapsedPos;
  if (s.has(pid)) s.delete(pid); else s.add(pid);
  router();
}

function setCatalogFilter(key, value) {
  appState.catalogState[key] = value;
  router();
}

// 清除由数据分析下钻带入的分类/岗位筛选
function clearCatalogFilters() {
  appState.catalogState.catFilter = '';
  appState.catalogState.posFilter = null;
  location.hash = '#/catalog';
}

async function addToMyApps(openingId) {
  try {
    const r = await api.post('/api/openings/' + openingId + '/to-application', {});
    toast(r.already ? '该机会已在「我的投递」中' : '已加入「我的投递」', 'success');
    markOpeningSeen(openingId); // 加入投递即视为已处理，角标消失
    router();
  } catch (e) { toast(e.message, 'error'); }
}

async function openOpeningForm(openingId) {
  try {
    const { positions } = await api.get('/api/positions');
    let initial = { position_id: '', company: '', title: '', city: '', channel: '', date: '', deadline: '', url: '', referral: '', note: '' };
    if (openingId) { initial = (await api.get('/api/openings/' + openingId)).opening; markOpeningSeen(openingId); }
    openFormModal({
      title: openingId ? '编辑机会' : '新增机会',
      fields: [
        { name: 'position_id', label: '所属岗位', type: 'select', required: true, options: positions.map((p) => ({ value: p.id, label: p.name + (p.category ? '（' + p.category + '）' : '') })) },
        { name: 'company', label: '公司', required: true },
        { name: 'title', label: '具体岗位' },
        { name: 'city', label: '城市' },
        { name: 'channel', label: '渠道', type: 'select', options: META.channels },
        { name: 'date', label: '日期', type: 'date' },
        { name: 'deadline', label: '截止日期', type: 'date' },
        { name: 'url', label: '投递网址', placeholder: 'https://…' },
        { name: 'referral', label: '内推码' },
        { name: 'note', label: '备注', type: 'textarea', rows: 3 },
      ],
      initial,
      onSave: (v) => openingId ? api.put('/api/openings/' + openingId, v).then(() => ({})) : api.post('/api/openings', v),
      onDelete: openingId ? () => api.del('/api/openings/' + openingId) : null,
      deleteConfirm: '删除这个岗位机会？',
    });
  } catch (e) { toast(e.message, 'error'); }
}

// 岗位管理（台账页头部与我的投递共用）
async function openPositionForm(id) {
  try {
    let initial = { name: '', category: '', notes: '' };
    if (id) { initial = (await api.get('/api/positions/' + id)).position; }
    openFormModal({
      title: id ? '编辑岗位' : '新增岗位',
      fields: [
        { name: 'name', label: '岗位名称', required: true },
        { name: 'category', label: '一级分类', type: 'datalist', options: META.categories, placeholder: '如 AI算法 / 后端开发（台账按此分组）' },
        { name: 'notes', label: '备注', type: 'textarea', rows: 2 },
      ],
      initial,
      onSave: (v) => id ? api.put('/api/positions/' + id, v).then(() => ({})) : api.post('/api/positions', v),
      onDelete: id ? () => api.del('/api/positions/' + id) : null,
      deleteConfirm: '删除该岗位？其下机会与 JD 将一并删除，已加入「我的投递」的记录保留并变为「未分类」。',
    });
  } catch (e) { toast(e.message, 'error'); }
}

