// 图表组件（无依赖，SVG + CSS）。配色遵循参考色板：分类固定色序、漏斗用蓝色顺序色阶、状态色保留语义
const CAT_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];
const INK_MUTED = '#898781';

// 投递状态 → 图表色（漏斗顺序色阶，终止态为中性灰；语义由文字标签承载）
const STATUS_CHART_COLORS = { '未投递': '#86b6ef', '已投递': '#3987e5', '面试中': '#184f95', '已挂': '#c3c2b7' };
function statusChartColor(status) {
  return STATUS_CHART_COLORS[status] || '#c3c2b7';
}

// 圆环图：data = [{label, value, color}]；2px 表面间隙；中心总数；图例始终带文字标签
function donutChart(data, { centerTitle = '总数', size = 168, thickness = 26 } = {}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return '<div class="chart-empty">暂无数据</div>';
  const r = (size - thickness) / 2, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const segs = data.map((d) => {
    const len = (d.value / total) * circ;
    const gap = Math.min(2, Math.max(len - 2, 0)); // 相邻段之间 2px 表面间隙
    const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${d.color}" stroke-width="${thickness}"
      stroke-dasharray="${Math.max(len - gap, 0.5)} ${circ - Math.max(len - gap, 0.5)}"
      stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})"><title>${esc(d.label)}：${d.value}</title></circle>`;
    offset += len;
    return seg;
  }).join('');
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${esc(centerTitle)}分布圆环图">
    ${segs}
    <text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="22" font-weight="600" fill="#1f2329">${total}</text>
    <text x="${cx}" y="${cy + 17}" text-anchor="middle" font-size="11" fill="${INK_MUTED}">${esc(centerTitle)}</text>
  </svg>`;
  const legend = data.map((d) => `<div class="legend-item" ${d.tooltip ? `title="${esc(d.tooltip)}"` : ''}>
    <span class="legend-dot" style="background:${d.color}"></span><span class="legend-label">${esc(d.label)}</span><span class="legend-value">${d.value}</span>
  </div>`).join('');
  return `<div class="donut-wrap">${svg}<div class="legend">${legend}</div></div>`;
}

// 水平条形图：rows = [{label, value, color?}]；细条 4px 圆头；值在右侧，tabular-nums 对齐
// 多分类场景统一单色（文字标签承载语义），需要语义色时行内传 color
function hBarChart(rows, { emptyText = '暂无数据', color = CAT_COLORS[0] } = {}) {
  if (!rows.length) return `<div class="chart-empty">${esc(emptyText)}</div>`;
  const top = Math.max(...rows.map((r) => r.value), 1);
  return `<div class="hbar-list">${rows.map((r) => {
    const w = Math.max((r.value / top) * 100, r.value > 0 ? 1.5 : 0);
    const inner = `<span class="hbar-label">${esc(r.label)}</span>
      <span class="hbar-track"><span class="hbar-fill" style="width:${w}%;background:${r.color || color}"></span></span>
      <span class="hbar-value">${r.value}</span>`;
    // 带 href 的行可点击下钻
    const cls = r.href ? 'hbar-row clickable' : 'hbar-row';
    const tip = esc(r.label) + '：' + r.value + (r.href ? '（点击查看）' : '');
    return r.href
      ? `<a class="${cls}" href="${esc(r.href)}" title="${tip}">${inner}</a>`
      : `<div class="${cls}" title="${tip}">${inner}</div>`;
  }).join('')}</div>`;
}

// 垂直分组条形图（趋势）：labels = 月份，series = [{name, values}]；相邻条 2px 间隙；图例必须
function vBarChart(labels, series, { colors = {}, emptyText = '数据积累后显示趋势', showLegend = true } = {}) {
  if (!labels.length) return `<div class="chart-empty">${esc(emptyText)}</div>`;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const bars = labels.map((lb, i) => {
    const group = series.map((s) => {
      const v = s.values[i] || 0;
      const hgt = Math.max((v / max) * 100, v > 0 ? 4 : 0);
      return `<div class="vbar" style="height:${hgt}%;background:${colors[s.name] || CAT_COLORS[0]}" title="${esc(s.name)} · ${esc(lb)}：${v}"></div>`;
    }).join('');
    return `<div class="vbar-col"><div class="vbar-stack">${group}</div><span class="vbar-label">${esc(lb)}</span></div>`;
  }).join('');
  const legend = showLegend && series.length > 1
    ? `<div class="vbar-legend">${series.map((s) => `<span class="legend-item"><span class="legend-dot" style="background:${colors[s.name] || CAT_COLORS[0]}"></span>${esc(s.name)}</span>`).join('')}</div>`
    : '';
  return `<div class="vbar-chart">${legend}<div class="vbar-plot">${bars}</div></div>`;
}

// 100% 堆叠条：展示状态占比，比饼图紧凑、比条形图省空间
function stackedBar(segments, { emptyText = '暂无数据' } = {}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (!total) return `<div class="chart-empty">${esc(emptyText)}</div>`;
  const segs = segments.filter((s) => s.value > 0).map((s) => {
    const pct = (s.value / total) * 100;
    return `<span class="stack-seg" style="width:${pct.toFixed(2)}%;background:${s.color}"
      title="${esc(s.label)}：${s.value}（${pct.toFixed(0)}%）"></span>`;
  }).join('');
  const legend = segments.map((s) => `<span class="legend-item">
    <span class="legend-dot" style="background:${s.color}"></span>
    <span class="legend-label">${esc(s.label)}</span><span class="legend-value">${s.value}</span></span>`).join('');
  return `<div class="stack-bar">${segs}</div><div class="stack-legend">${legend}</div>`;
}
