// Excel 批量导入岗位机会：解析 → 列映射 → 预览 → 入库（自动建岗位、按分类归组、去重）
const IMPORT_FIELDS = [
  { key: 'company', label: '公司', required: true, guess: ['公司', '企业'] },
  { key: 'position', label: '岗位', required: true, guess: ['岗位'] },
  { key: 'category', label: '分类', guess: ['分类', '类别', '方向', '行业'] },
  { key: 'title', label: '具体岗位', guess: ['具体岗位', '职位名称', '职位'] },
  { key: 'city', label: '城市', guess: ['城市', '地点'] },
  { key: 'channel', label: '渠道', guess: ['渠道', '来源', '途径'] },
  { key: 'date', label: '日期', guess: ['日期', '投递', '申请', '时间', '发布'] },
  { key: 'url', label: '投递网址', guess: ['网址', '链接', 'url'] },
  { key: 'referral', label: '内推码', guess: ['内推码', '内推'] },
  { key: 'note', label: '备注', guess: ['备注', '进展', '说明', '状态', '进度'] },
];

function openImportExcel() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.xlsx,.xls';
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.upload('/api/import/parse', fd);
      if (!res.headers.length) return toast('Excel 为空或无法解析', 'error');
      showImportMapping(res);
    } catch (e) { toast(e.message, 'error'); }
  };
  input.click();
}

function showImportMapping(parsed) {
  const guessIdx = (keys) => parsed.headers.findIndex((hd) => keys.some((k) => hd.includes(k)));
  const selects = IMPORT_FIELDS.map((f) => {
    const guessed = guessIdx(f.guess);
    const opts = ['<option value="">不导入</option>']
      .concat(parsed.headers.map((hd, i) => `<option value="${i}" ${i === guessed ? 'selected' : ''}>${esc(hd || '（空）')}</option>`))
      .join('');
    return `<div class="form-row"><label>${esc(f.label)}${f.required ? ' <em>*</em>' : ''}</label><select data-key="${f.key}">${opts}</select></div>`;
  }).join('');
  const preview = parsed.rows.slice(0, 5).map((r) =>
    `<tr>${parsed.headers.map((_, i) => `<td>${esc(String(r[i] ?? '').slice(0, 24))}</td>`).join('')}</tr>`).join('');
  const m = openModal(`
    <div class="import-box">
      <h3>导入岗位机会</h3>
      <p class="muted">文件: ${esc(parsed.fileName)} · 共 ${parsed.rows.length} 行数据。将按「分类 → 岗位」归入投递台账，请确认列映射：</p>
      <div class="import-map">${selects}</div>
      <div class="import-preview">
        <div class="muted">数据预览（前 5 行）</div>
        <div class="table-scroll"><table>
          <thead><tr>${parsed.headers.map((hd) => `<th>${esc(hd || '（空）')}</th>`).join('')}</tr></thead>
          <tbody>${preview}</tbody>
        </table></div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn" data-close>取消</button>
        <button type="button" class="btn primary" id="import-go">开始导入</button>
      </div>
    </div>`, { width: 880 });
  m.el.querySelector('#import-go').onclick = async () => {
    const mapping = {};
    m.el.querySelectorAll('select[data-key]').forEach((s) => { mapping[s.dataset.key] = s.value === '' ? null : Number(s.value); });
    if (mapping.company == null || mapping.position == null) return toast('「公司」和「岗位」必须映射', 'error');
    const btn = m.el.querySelector('#import-go');
    btn.disabled = true; btn.textContent = '导入中…';
    try {
      const r = await api.post('/api/import/execute', { mapping, rows: parsed.rows });
      m.close();
      toast(`导入完成：新增 ${r.inserted} 个机会，新岗位 ${r.newPositions} 个，重复跳过 ${r.duplicates}，无效跳过 ${r.skipped}`, 'success');
      router();
    } catch (e) { toast(e.message, 'error'); btn.disabled = false; btn.textContent = '开始导入'; }
  };
}
