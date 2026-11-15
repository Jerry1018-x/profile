// 媒体规划（山竹）：账号工作台 + 后台数据导入（粘贴 / Excel）+ 山竹数据分析
async function renderMedia(container) {
  const S = appState.mediaState;
  const data = await api.get('/api/media/accounts');
  const accounts = data.accounts || [];
  const platforms = data.platforms || [];
  const imported = accounts.filter((a) => a.metric_count > 0);
  const answerAccount = accounts.find((a) => a.id === S.analyzeAccountId);

  container.innerHTML = `
    <div class="page-head">
      <h2>媒体规划 <span class="muted">（${accounts.length} 个账号 · ${imported.length} 个已导入数据）</span></h2>
      <div class="actions"><button class="btn" onclick="openMediaAccountForm()">＋ 添加账号</button></div>
    </div>

    <div class="card media-shanzhu">
      <div class="kb-cat-box">${shanzhuCatSvg()}</div>
      <div class="media-sz-main">
        <div class="kb-mango-title">山竹 · 账号数据分析师</div>
        <div class="kb-mango-sub">把平台后台数据导出（Excel / 粘贴）导入账号，山竹读数据、找爆款、给规划建议${answerAccount ? ` · 正在分析「${esc(answerAccount.name || '规划中账号')}」` : ''}</div>
        <div class="ai-search-row" style="margin-top:8px">
          <input id="sz-question" placeholder="想问山竹什么？留空 = 整体复盘 + 下期规划" value="${esc(S.question)}">
          <button class="btn primary" id="sz-run" ${S.analyzing ? 'disabled' : ''}>${S.analyzing ? '分析中…' : '🐾 让山竹分析'}</button>
        </div>
        ${S.answer ? `<div class="md media-sz-answer">${renderMd(S.answer)}</div>` : ''}
      </div>
    </div>

    <div class="section-block">
      <div class="section-head"><h3>账号板块</h3></div>
      ${accounts.length ? `<div class="media-grid">${accounts.map(mediaAccountCard).join('')}</div>` : '<div class="empty">还没有账号。点右上角「＋ 添加账号」，先把小红书（主要阵地）加进来吧。</div>'}
    </div>`;

  const q = container.querySelector('#sz-question');
  if (q) {
    bindSearchInput(q, (v) => { S.question = v; }, 400);
    q.addEventListener('keydown', (e) => { if (e.key === 'Enter') container.querySelector('#sz-run').click(); });
  }
  const run = container.querySelector('#sz-run');
  if (run) run.onclick = () => shanzhuAnalyze(S.analyzeAccountId, q ? q.value : '');
}

function mediaAccountCard(a) {
  const hasData = a.metric_count > 0;
  const title = a.name || a.platform || '未命名账号';
  const meta = [
    a.platform ? esc(a.platform) : '',
    a.track ? esc(a.track) : '<span class="muted">未填赛道</span>',
  ].filter(Boolean).join(' · ') + (a.url
    ? ` · <a class="link" href="${esc(a.url)}" target="_blank" rel="noopener">主页 ↗</a>`
    : '');
  return `<div class="card media-acc ${hasData ? '' : 'planning'}">
    <div class="media-acc-head">
      <div class="media-acc-name">${esc(title)}</div>
      <span class="chip ${a.status === '已导入' ? 'chip-green' : 'chip-gray'}">${esc(a.status)}</span>
      <span class="spacer"></span>
      ${hasData
        ? `<button class="btn small" onclick="openMediaMetrics(${a.id})">查看数据</button>`
        : `<button class="btn small" onclick="openMediaImport(${a.id})">导入数据</button>`}
      <button class="btn small ghost" onclick="openMediaAccountForm(${a.id})">编辑</button>
    </div>
    <div class="media-acc-tags">${meta}</div>
    ${a.note ? `<div class="media-acc-note">${esc(a.note)}</div>` : ''}
    ${hasData ? `
    <div class="media-acc-stats">
      <span>数据 <b>${a.metric_count}</b> 条</span>
      <span>覆盖 <b>${a.metric_days}</b> 天</span>
      <span>总播放 <b>${fmtNum(a.total_views)}</b></span>
      <span>总点赞 <b>${fmtNum(a.total_likes)}</b></span>
      <span class="muted">最新 ${esc(a.latest_date || '—')}</span>
    </div>` : '<div class="media-acc-empty">还没导入后台数据 —— 在平台后台导出后粘贴或上传 Excel 即可</div>'}
  </div>`;
}

function fmtNum(n) {
  const v = Number(n) || 0;
  if (v >= 100000000) return (v / 100000000).toFixed(1) + '亿';
  if (v >= 10000) return (v / 10000).toFixed(1) + '万';
  return String(v);
}

/* ---------- 账号 CRUD ---------- */
async function openMediaAccountForm(id) {
  const data = await api.get('/api/media/accounts');
  const platforms = data.platforms || [];
  const old = id ? data.accounts.find((a) => a.id === id) : null;
  openFormModal({
    title: old ? '编辑账号' : '添加账号',
    width: 520,
    fields: [
      { name: 'platform', label: '平台', type: 'select', options: platforms, required: true },
      { name: 'name', label: '账号名', placeholder: '已导入的账号需要填账号名；规划中的可留空' },
      { name: 'track', label: '赛道', placeholder: '如：AI 工具测评 / 求职干货 / 职场成长' },
      { name: 'status', label: '状态', type: 'select', options: ['规划中', '已导入'] },
      { name: 'url', label: '主页链接（可选）' },
      { name: 'note', label: '定位 / 备注（可选）', type: 'textarea', rows: 2 },
    ],
    initial: old || { platform: '小红书', status: '规划中' },
    onSave: async (v) => (id ? api.put('/api/media/accounts/' + id, v) : api.post('/api/media/accounts', v)),
    onDelete: id ? () => api.del('/api/media/accounts/' + id) : null,
    deleteConfirm: '删除该账号？它的全部导入数据也会一并删除。',
  });
}

/* ---------- 数据导入（粘贴 JSON/CSV 或 Excel 文件） ---------- */
async function openMediaImport(id) {
  const data = await api.get('/api/media/accounts');
  const a = data.accounts.find((x) => x.id === id);
  if (!a) return;
  const m = openModal(`
    <form class="edit-form">
      <h3>导入后台数据 · ${esc(a.name || '规划中账号')}</h3>
      <div class="media-import-hint">
        两种方式（选一）：
        <ul>
          <li><b>粘贴</b>：平台后台导出的 CSV（带表头）或 JSON 数组。支持中文表头：日期 / 标题 / 播放(浏览量) / 点赞 / 评论 / 转发(收藏) / 粉丝</li>
          <li><b>上传 Excel</b>：xlsx 文件，同样识别中文表头</li>
        </ul>
        按「日期 + 标题」自动去重，重复导入不会产生重复数据。
      </div>
      <div class="form-row"><label>粘贴数据</label><textarea name="data" rows="9" placeholder="日期,标题,播放,点赞,评论,收藏
2026-11-01,我的第一条笔记,1200,89,12,45"></textarea></div>
      <div class="form-row"><label>或上传 Excel 文件</label><input name="file" type="file" accept=".xlsx,.xls,.csv"></div>
      <div class="modal-actions">
        <button type="button" class="btn" data-close>取消</button>
        <button type="submit" class="btn primary">导入</button>
      </div>
    </form>`, { width: 560 });
  m.el.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('data', e.target.querySelector('textarea[name=data]').value);
    const file = e.target.querySelector('input[name=file]').files[0];
    if (file) fd.append('file', file);
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      const r = await api.upload(`/api/media/accounts/${id}/import`, fd);
      if (r.alreadyImported) toast('这些数据之前已经导入过了', 'info');
      else toast(`导入成功：新增 ${r.inserted} 条${r.duplicates ? `，跳过重复 ${r.duplicates} 条` : ''}`, 'success');
      m.close();
      router();
    } catch (err) { toast(err.message || '导入失败', 'error'); btn.disabled = false; }
  });
}

/* ---------- 数据详情 ---------- */
async function openMediaMetrics(id) {
  const { account, metrics, totals, daily } = await api.get(`/api/media/accounts/${id}/metrics`);
  const m = openModal(`
    <div>
      <h3>${esc(account.name || account.platform)} <span class="muted">${esc([account.platform, account.track].filter(Boolean).join(' · '))}</span></h3>
      <div class="kpi-row" style="margin-top:12px">
        <div class="kpi"><span class="kpi-label">内容数</span><span class="kpi-value">${totals.count}</span></div>
        <div class="kpi"><span class="kpi-label">总播放</span><span class="kpi-value">${fmtNum(totals.views)}</span></div>
        <div class="kpi"><span class="kpi-label">总点赞</span><span class="kpi-value">${fmtNum(totals.likes)}</span></div>
        <div class="kpi"><span class="kpi-label">总评论</span><span class="kpi-value">${fmtNum(totals.comments)}</span></div>
        <div class="kpi"><span class="kpi-label">总收藏/转发</span><span class="kpi-value">${fmtNum(totals.shares)}</span></div>
        <div class="kpi"><span class="kpi-label">粉丝</span><span class="kpi-value">${fmtNum(totals.fans)}</span></div>
      </div>
      ${vBarChart(daily.map((d) => d.metric_date), [{ name: '播放', values: daily.map((d) => d.views) }], { colors: { '播放': CAT_COLORS[0] }, showLegend: false, emptyText: '按天汇总的播放趋势' })}
      <div class="table-scroll" style="margin-top:12px">
        <table>
          <thead><tr><th>日期</th><th>标题</th><th>播放</th><th>点赞</th><th>评论</th><th>收藏/转发</th><th></th></tr></thead>
          <tbody>
            ${metrics.map((x) => `<tr>
              <td>${esc(x.metric_date || '—')}</td>
              <td>${x.url ? `<a class="link" href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title || '无标题')}</a>` : esc(x.title || '无标题')}</td>
              <td>${fmtNum(x.views)}</td><td>${fmtNum(x.likes)}</td><td>${fmtNum(x.comments)}</td><td>${fmtNum(x.shares)}</td>
              <td><button class="btn small danger" onclick="delMediaMetric(${x.id}, this)">删除</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn" id="mm-analyze">让山竹分析这个账号</button>
        <button type="button" class="btn" id="mm-import">导入更多数据</button>
        <button type="button" class="btn" data-close>关闭</button>
      </div>
    </div>`, { width: 860 });
  m.el.querySelector('#mm-analyze').onclick = () => { m.close(); shanzhuForAccount(id); };
  m.el.querySelector('#mm-import').onclick = () => { m.close(); openMediaImport(id); };
}

async function delMediaMetric(id, btn) {
  if (!(await confirmDialog('删除这条数据？'))) return;
  try { await api.del('/api/media/metrics/' + id); btn.closest('tr').remove(); toast('已删除', 'success'); }
  catch (e) { toast(e.message, 'error'); }
}

/* ---------- 山竹分析 ---------- */
async function shanzhuForAccount(id) {
  appState.mediaState.analyzeAccountId = id;
  appState.mediaState.answer = '';
  router();
  await shanzhuAnalyze(id, appState.mediaState.question);
}

async function shanzhuAnalyze(accountId, question) {
  const S = appState.mediaState;
  if (S.analyzing) return;
  S.analyzing = true;
  S.question = question;
  router();
  try {
    const r = await api.post('/api/media/analyze', { account_id: accountId || null, question });
    S.answer = r.answer;
  } catch (e) {
    S.answer = `**分析失败**：${esc(e.message)}\n\n（AI 分析需要 DeepSeek Key；本地 Ollama 可用时会自动用本地模型）`;
  }
  S.analyzing = false;
  router();
}
