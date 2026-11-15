// 数据分析：围绕「投得够不够 / 投偏了没有 / 下一步做什么」组织，而不是罗列导入的目录
async function renderDashboard(container) {
  const { positions, openings, applications: apps } = await api.get('/api/dashboard');

  /* ---------- 基础统计 ---------- */
  // 玄米新同步、还没看过的岗位（岗位汇总里的「新」角标），作为「待筛」提示，不影响投递统计
  const genmaiNew = openings.filter((o) => o.genmai_new).length;
  const tracked = apps;
  const countBy = (s) => tracked.filter((a) => a.status === s).length;
  const openCompanies = new Set(openings.map((o) => o.company));
  const appliedCompanies = new Set(tracked.map((a) => a.company));
  const covered = [...appliedCompanies].filter((c) => openCompanies.has(c)).length;
  const coverage = openCompanies.size ? (covered / openCompanies.size) * 100 : 0;

  const posCat = new Map(positions.map((p) => [p.id, p.category || '未分类']));
  const catOfApp = (a) => (a.position_id ? (posCat.get(a.position_id) || '未分类') : '未分类');

  /* ---------- 1. KPI ---------- */
  const kpi = `
    <div class="kpi-row">
      <div class="kpi"><span class="kpi-label">我的投递</span><span class="kpi-value">${tracked.length}</span><span class="kpi-sub">${appliedCompanies.size} 家公司${genmaiNew ? ` · 玄米新增 ${genmaiNew} 条待筛` : ''}</span></div>
      <div class="kpi"><span class="kpi-label">面试中</span><span class="kpi-value">${countBy('面试中')}</span><span class="kpi-sub">已投 ${countBy('已投递')} · 已挂 ${countBy('已挂')}</span></div>
      <div class="kpi"><span class="kpi-label">机会库</span><span class="kpi-value">${openings.length}</span><span class="kpi-sub">${openCompanies.size} 家公司 · ${new Set(openings.map((o) => o.category || '未分类')).size} 个行业</span></div>
      <div class="kpi ${coverage < 5 ? 'kpi-warn' : ''}">
        <span class="kpi-label">行业公司覆盖率</span>
        <span class="kpi-value">${coverage.toFixed(1)}<i>%</i></span>
        <span class="kpi-sub">已触及 ${covered} / ${openCompanies.size} 家</span>
      </div>
    </div>`;

  /* ---------- 2. 投递进度（堆叠条） ---------- */
  const statusSegments = META.statuses.map((s) => ({
    label: s, value: countBy(s), color: statusChartColor(s),
  }));
  const progressCard = `
    <div class="card chart-card">
      <div class="chart-title">投递进度</div>
      ${stackedBar(statusSegments, { emptyText: '还没有投递记录' })}
      ${tracked.length ? `<div class="chart-foot muted">面试中占比 <b>${((countBy('面试中') / tracked.length) * 100).toFixed(0)}%</b> · 已挂占比 <b>${((countBy('已挂') / tracked.length) * 100).toFixed(0)}%</b></div>` : ''}
    </div>`;

  /* ---------- 3. 投递节奏（近 8 周） ---------- */
  const weeks = [];
  const monday = (d) => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); x.setHours(0, 0, 0, 0); return x; };
  const thisMonday = monday(new Date());
  for (let i = 7; i >= 0; i--) {
    const start = new Date(thisMonday); start.setDate(start.getDate() - i * 7);
    const end = new Date(start); end.setDate(end.getDate() + 7);
    weeks.push({ start, end, label: `${start.getMonth() + 1}/${start.getDate()}`, count: 0 });
  }
  const parseLocal = (s) => {
    if (!s) return null;
    const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  };
  tracked.forEach((a) => {
    const d = parseLocal(a.applied_at) || parseLocal(a.created_at);
    if (!d) return;
    const w = weeks.find((x) => d >= x.start && d < x.end);
    if (w) w.count++;
  });
  const rhythmCard = `
    <div class="card chart-card">
      <div class="chart-title">投递节奏 <span class="muted">（近 8 周 · 按周）</span></div>
      ${vBarChart(weeks.map((w) => w.label), [{ name: '投递数', values: weeks.map((w) => w.count) }], {
        colors: { '投递数': CAT_COLORS[0] },
        emptyText: '暂无投递记录',
        showLegend: false,
      })}
    </div>`;

  /* ---------- 4. 行业覆盖：机会库 vs 我的投递 ---------- */
  const oppByCat = new Map();
  openings.forEach((o) => {
    const c = o.category || '未分类';
    oppByCat.set(c, (oppByCat.get(c) || 0) + 1);
  });
  const appByCat = new Map();
  tracked.forEach((a) => {
    const c = catOfApp(a);
    appByCat.set(c, (appByCat.get(c) || 0) + 1);
  });
  const catRows = [...oppByCat.entries()].sort((a, b) => b[1] - a[1]).map(([cat, n]) => ({
    cat, opp: n, mine: appByCat.get(cat) || 0,
  }));
  const maxOpp = Math.max(...catRows.map((r) => r.opp), 1);
  const untouched = catRows.filter((r) => r.mine === 0);

  const coverageRows = catRows.map((r) => `
    <a class="cov-row" href="#/catalog?cat=${encodeURIComponent(r.cat)}" title="点击查看该行业的岗位机会">
      <span class="cov-label">${esc(r.cat)}</span>
      <span class="cov-track"><span class="cov-fill" style="width:${(r.opp / maxOpp) * 100}%"></span></span>
      <span class="cov-nums"><b>${r.opp}</b> 个机会</span>
      <span class="cov-mine ${r.mine ? '' : 'zero'}">${r.mine ? `已投 ${r.mine}` : ''}</span>
    </a>`).join('');

  const coverageCard = `
    <div class="card chart-card">
      <div class="chart-title">行业覆盖 <span class="muted">（机会库 vs 我的投递 · 点击下钻）</span></div>
      ${catRows.length ? `<div class="cov-list hbar-scroll">${coverageRows}</div>
      <div class="chart-foot muted">还有 <b>${untouched.length}</b> 个行业一个都没投，机会最多的未投行业：<b>${esc((untouched.sort((a, b) => b.opp - a.opp)[0] || {}).cat || '—')}</b></div>`
        : '<div class="chart-empty">暂无机会数据</div>'}
    </div>`;

  /* ---------- 5. 投递目录（按状态） ---------- */
  const statusCatalog = META.statuses.map((s) => {
    const list = tracked.filter((a) => a.status === s);
    if (!list.length) return '';
    return `<div class="sc-group">
      <div class="sc-head">${statusChip(s)}<span class="muted">${list.length} 个</span></div>
      <div class="sc-items">
        ${list.map((a) => `<a class="sc-item" href="#/app/${a.id}" title="${esc(a.company)}${a.title ? ' · ' + esc(a.title) : ''}">
          <b>${esc(a.company)}</b>${a.title ? `<span>${esc(a.title)}</span>` : ''}
        </a>`).join('')}
      </div>
    </div>`;
  }).join('');

  container.innerHTML = `
    <div class="page-head"><h2>数据分析 <span class="muted">（自动汇总 · 仅展示）</span></h2></div>
    ${kpi}
    <div class="charts-grid">
      ${progressCard}
      ${rhythmCard}
    </div>
    ${coverageCard}
    <div class="card chart-card">
      <div class="chart-title">投递目录 <span class="muted">（按状态 · 点击进入岗位详情）</span></div>
      ${statusCatalog || '<div class="chart-empty">暂无投递记录。在「我的投递」手动添加后可在此汇总。</div>'}
      ${genmaiNew ? `<div class="chart-foot muted">岗位汇总里有 ${genmaiNew} 个玄米新岗位待筛（带「新」角标），想投的点 ＋ 加入投递。</div>` : ''}
    </div>`;
}
