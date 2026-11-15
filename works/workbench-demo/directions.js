// 求职方向：大卡片网格；每个方向对应一版简历；图片/PDF 自动识别并归档结构化档案
const DIR_EMOJI = { '项目': '🗂️', '产品': '🧩', '运营': '🔁', '营销': '📣', '其他': '✨' };

async function renderDirections(container) {
  const [data, candData] = await Promise.all([
    api.get('/api/agent/directions'),
    api.get('/api/ai/candidates?status=' + encodeURIComponent('待确认')),
  ]);
  const dirs = data.directions;
  const daily = data.daily;
  const configured = data.configured;
  const blocked = data.blocked || [];
  const candidates = candData.candidates || [];
  const candCounts = candData.counts || {};

  const banner = configured ? '' : `
    <div class="ai-guide">
      <p><b>玄米还没接入 DeepSeek。</b>按你的要求，API Key 在对话里由 Claude 配置；配置前只能上传文字版简历，图片识别和自动分析暂不可用。</p>
    </div>`;

  const dailyBar = `
    <div class="card dir-daily">
      <label class="ai-check">
        <input type="checkbox" ${daily.enabled ? 'checked' : ''} onchange="setDailyEnabled(this.checked)">
        玄米每天
        <input type="number" class="ai-hour" min="0" max="23" value="${daily.hour}" onchange="setDailyHour(this.value)">
        点自动更新所有方向
      </label>
      <span class="muted">${daily.lastDate ? '上次自动更新：' + esc(daily.lastDate) : '还没有自动更新记录'} · 只在工作台服务运行期间生效</span>
    </div>`;

  const addCard = `
    <button type="button" class="card dir2-card dir-add" onclick="openDirectionForm()">
      <span class="dir-add-plus">＋</span>
      <b>新建方向</b>
      <span class="muted">比如：财务、法务、设计</span>
    </button>`;

  const syncLine = `<div class="pref-line">
    <label class="ai-check"><input type="checkbox" ${data.autoSync ? 'checked' : ''} onchange="setAutoSync(this.checked)">
      自动同步：玄米新找到的岗位直接写入「岗位汇总」（不自动加入「我的投递」，想投的再点 ＋）</label>
    <span class="muted">${data.autoSync ? '开启中' : '已关闭，新岗位先进候选池'}</span>
  </div>`;

  const prefLine = `<div class="pref-line">
    ${blocked.length
      ? `已屏蔽行业：${blocked.map((b) => `<span class="chip chip-red">${esc(b)}</span>`).join('')}<button type="button" class="link-btn" onclick="openIndustryPrefs()">调整</button>`
      : '<span class="muted">没有屏蔽任何行业</span><button type="button" class="link-btn" onclick="openIndustryPrefs()">设置偏好</button>'}
  </div>`;

  const candidateRows = candidates.map((c) => `
    <tr>
      <td><input type="checkbox" class="cand-check" data-id="${c.id}"></td>
      <td><strong>${esc(c.company)}</strong></td>
      <td>${esc(c.position_name || '—')}</td>
      <td>${esc(c.category || '—')}</td>
      <td>${esc(c.city || '—')}</td>
      <td>${c.url ? `<a class="op-url" href="${esc(c.url)}" target="_blank" rel="noopener" title="${esc(c.url)}">${esc(c.url.length > 42 ? c.url.slice(0, 42) + '…' : c.url)}</a>` : '<span class="muted">—</span>'}</td>
      <td>${esc(c.deadline || '—')}</td>
      <td>${esc(c.referral || '—')}</td>
      <td class="row-actions"><button class="btn small danger" onclick="aiIgnoreOne(${c.id})">移除</button></td>
    </tr>`).join('');

  const candPool = `
    <div class="card dir-cand-pool">
      <div class="ai-card-head">
        <h3>候选池</h3>
        <span class="muted">待确认 ${candCounts['待确认'] || 0} · 已导入 ${candCounts['已导入'] || 0} · 已忽略 ${candCounts['已忽略'] || 0}${data.autoSync ? ' · 自动同步开启时新岗位直接进岗位汇总，不走候选池' : ''}</span>
      </div>
      <div class="ai-extract-row">
        <input id="ai-extract-url" placeholder="已有招聘链接？粘贴到这里，让 AI 提取成岗位">
        <button type="button" class="btn" onclick="aiExtract(this)" ${configured ? '' : 'disabled'}>提取链接</button>
      </div>
      ${candidates.length ? `
        <div class="ai-cand-actions">
          <label class="ai-check"><input type="checkbox" id="cand-all" onchange="aiToggleAll(this)"> 全选</label>
          <span class="spacer"></span>
          <button class="btn" onclick="aiIgnoreSelected()">忽略选中</button>
          <button class="btn" onclick="aiClearProcessed()">清空已处理</button>
          <button class="btn primary" onclick="aiImportSelected()">导入选中到岗位汇总</button>
        </div>
        <div class="table-scroll">
          <table class="cand-table">
            <thead><tr><th class="cand-check-col"></th><th>公司</th><th>岗位</th><th>行业</th><th>城市</th><th>网址</th><th>截止</th><th>内推码</th><th></th></tr></thead>
            <tbody>${candidateRows}</tbody>
          </table>
        </div>`
      : `<div class="empty">${data.autoSync
        ? '候选池是空的。自动同步已开启，玄米采集的岗位已直接进入「岗位汇总」。'
        : '候选池是空的。在方向卡片上点「立即更新」，新岗位会先到这里待你确认。'}</div>`}
    </div>`;

  container.innerHTML = `
    <div class="page-head">
      <h2>求职方向 <span class="muted">（每个方向对应一版简历）</span></h2>
      <div class="actions">
        <button class="btn" onclick="openIndustryPrefs()">偏好设置${blocked.length ? `（${blocked.length}）` : ''}</button>
        <button class="btn primary" onclick="openDirectionForm()">＋ 新建方向</button>
      </div>
    </div>
    ${banner}
    ${dailyBar}
    ${syncLine}
    ${prefLine}
    ${dirs.length || addCard ? `<div class="dir-grid">${dirs.map(dirCard).join('')}${addCard}</div>` : ''}
    ${candPool}`;
}

function dirCard(d) {
  const latest = d.resumes[0] || null;
  const analyzed = d.resumes.find((r) => r.analysis) || null;
  const analysis = analyzed ? analyzed.analysis : null;
  const emoji = DIR_EMOJI[d.name] || '📁';
  const empty = !d.keywords && !d.resumes.length;
  const keywords = (d.keywords || '').split(/[,，]/).map((x) => x.trim()).filter(Boolean).slice(0, 4);
  const pending = d.pending_candidates || 0;
  const synced = d.synced_candidates || 0;
  const catChip = d.category
    ? `<span class="chip ${d.category_blocked ? 'chip-red' : 'chip-gray'}" title="行业类别">${esc(d.category)}${d.category_blocked ? '（已屏蔽）' : ''}</span>`
    : '';
  const keywordText = keywords.length ? `<span class="dir-keywords">${keywords.map(esc).join(' · ')}</span>` : '';
  const tagsHtml = catChip + keywordText;

  const resumeBlock = latest ? `
    <div class="dir2-resume">
      <div class="dir2-resume-top">
        <span class="dir2-resume-name" title="${esc(latest.name)}">${esc(latest.name)}</span>
      </div>
      <div class="dir2-resume-actions">
        <button class="btn small" onclick="openResumeUpload(${d.id})">更换简历</button>
        <button class="btn small" onclick="openResumeList(${d.id})">${d.resumes.length > 1 ? `共 ${d.resumes.length} 版` : '版本管理'}</button>
      </div>
    </div>` : `
    <div class="dir2-resume dir2-resume-empty">
      <span class="muted">还没有简历</span>
      <button class="btn small" onclick="openResumeUpload(${d.id})">上传 / 拍照</button>
    </div>`;

  return `<div class="card dir2-card">
    <div class="dir2-head">
      <span class="dir2-emoji">${emoji}</span>
      <div class="dir2-title">
        <h3>${esc(d.name)}</h3>
        <span class="muted">${esc(d.graduation)}${d.cities ? ' · ' + esc(d.cities) : ' · 城市不限'}</span>
      </div>
      ${d.active ? '' : '<span class="chip chip-amber">暂停</span>'}
    </div>

    <div class="dir2-tags">
      ${tagsHtml || '<span class="muted">关键词待补充</span>'}
    </div>

    ${resumeBlock}

    <div class="dir2-analysis">
      ${analysis ? `
        <div class="dir2-score"><b>${analysis.matchScore}</b><span>匹配</span></div>
        <div class="dir2-analysis-main">
          <div class="dir2-summary" title="${esc(analysis.summary)}">${esc(analysis.summary)}</div>
          ${latest && analyzed.id !== latest.id ? `<div class="dir2-analysis-src muted">分析来自「${esc(analyzed.name)}」</div>` : ''}
          <button type="button" class="link-btn" onclick="viewResumeAnalysis(${analyzed.id})">分析详情</button>
        </div>` : `
        <div class="dir2-analysis-main">
          <div class="muted dir2-summary">${empty ? '先点「编辑」补充方向信息，再上传简历' : '上传简历后玄米会自动分析匹配度'}</div>
        </div>`}
    </div>

    <div class="dir2-foot">
      <div class="dir2-foot-left">
        ${pending
          ? `<button type="button" class="dir2-cand dir2-cand-link" onclick="openDirectionCandidates(${d.id})">待确认 ${pending} · 查看</button>`
          : (synced
            ? `<a class="dir2-cand dir2-cand-link" href="#/catalog">已同步 ${synced} · 看岗位</a>`
            : '<span class="dir2-cand muted">暂无候选</span>')}
      </div>
      <div class="dir2-foot-right">
        <button class="btn small ghost" onclick="openDirectionForm(${d.id})">编辑</button>
        <button class="btn small primary" onclick="openDirectionCollect(${d.id}, this)">立即更新</button>
      </div>
    </div>
  </div>`;
}

/* ---------- 方向 CRUD ---------- */
function industryOptionsHtml(data, current) {
  const rec = (data && data.recommended) || [];
  const collected = (data && data.collected) || [];
  const groups = (data && data.groups) || [];
  const blocked = new Set((data && data.blocked) || []);
  const all = new Set([...rec, ...collected, ...groups.flatMap((g) => (g.items || []).map((i) => i.name))]);
  const seen = new Set();
  let html = '<option value="">不限行业</option>';
  const opt = (v, label) => {
    seen.add(v);
    return `<option value="${esc(v)}"${v === current ? ' selected' : ''}>${esc(label || v)}</option>`;
  };
  if (current && (!all.has(current) || blocked.has(current))) {
    html += opt(current, current + (blocked.has(current) ? '（已屏蔽）' : '（自定义）'));
  }
  const recRest = rec.filter((x) => !seen.has(x));
  if (recRest.length) html += `<optgroup label="推荐给这个方向">${recRest.map((x) => opt(x)).join('')}</optgroup>`;
  const colRest = collected.filter((x) => !seen.has(x));
  if (colRest.length) html += `<optgroup label="你数据里的行业分类">${colRest.map((x) => opt(x)).join('')}</optgroup>`;
  for (const g of groups) {
    const rest = (g.items || []).filter((i) => !i.blocked && !seen.has(i.name));
    if (rest.length) html += `<optgroup label="${esc(g.label)}">${rest.map((i) => opt(i.name)).join('')}</optgroup>`;
  }
  return html;
}

async function openDirectionForm(id) {
  let initial = { name: '', category: '', keywords: '', cities: '', graduation: '2027届', active: '1', note: '' };
  if (id) {
    const { directions } = await api.get('/api/agent/directions');
    const d = directions.find((x) => x.id === id);
    if (d) initial = { ...d, active: d.active ? '1' : '0' };
  }
  let ind0 = { recommended: [], collected: [], groups: [], blocked: [] };
  try { ind0 = await api.get('/api/agent/industries?name=' + encodeURIComponent(initial.name || '')); } catch (e) { /* 静默 */ }

  const m = openModal(`
    <form class="edit-form dir-form">
      <h3>${id ? '编辑方向' : '新建岗位方向'}</h3>
      <div class="dir-form-grid">
        <div class="form-row"><label>方向名称 <em>*</em></label><input name="name" required value="${esc(initial.name)}" placeholder="如：项目 / 产品 / 运营 / 营销"></div>
        <div class="form-row"><label>行业类别</label><select name="category">${industryOptionsHtml(ind0, initial.category)}</select></div>
      </div>
      <p class="muted dir-form-hint">行业选项会按方向名称推荐；不想投的行业可在「偏好设置」里屏蔽。</p>
      <div class="dir-form-grid">
        <div class="form-row"><label>搜索关键词</label><input name="keywords" value="${esc(initial.keywords)}" placeholder="逗号分隔，如：产品经理, 需求分析"></div>
        <div class="form-row"><label>目标城市</label><input name="cities" value="${esc(initial.cities)}" placeholder="留空不限"></div>
      </div>
      <div class="dir-form-grid">
        <div class="form-row"><label>届别</label><select name="graduation">
          ${['2027届', '2028届', '2026届', '不限'].map((x) => `<option ${initial.graduation === x ? 'selected' : ''}>${x}</option>`).join('')}
        </select></div>
        <div class="form-row"><label>状态</label><select name="active">
          <option value="1" ${initial.active !== '0' ? 'selected' : ''}>活跃（参与每日更新）</option>
          <option value="0" ${initial.active === '0' ? 'selected' : ''}>暂停</option>
        </select></div>
      </div>
      <div class="form-row"><label>备注</label><textarea name="note" rows="2">${esc(initial.note)}</textarea></div>
      <div class="modal-actions">
        ${id ? '<button type="button" class="btn danger modal-delete" id="dir-delete">删除方向</button>' : ''}
        <button type="button" class="btn" data-close>取消</button>
        <button type="submit" class="btn primary">保存</button>
      </div>
    </form>`, { width: 700 });

  const form = m.el.querySelector('form');
  const nameInput = form.querySelector('[name=name]');
  const catSelect = form.querySelector('[name=category]');
  let loading = false;
  nameInput.addEventListener('change', async () => {
    if (loading) return;
    loading = true;
    try {
      const data = await api.get('/api/agent/industries?name=' + encodeURIComponent(nameInput.value.trim()));
      const current = catSelect.value;
      catSelect.innerHTML = industryOptionsHtml(data, current);
    } catch (e) { /* 静默 */ }
    finally { loading = false; }
  });

  const delBtn = form.querySelector('#dir-delete');
  if (delBtn) delBtn.onclick = async () => {
    if (!(await confirmDialog('删除该方向？方向下的简历会一起删除，已采集的候选岗位会保留。'))) return;
    delBtn.disabled = true;
    try {
      await api.del('/api/agent/directions/' + id);
      m.close();
      toast('已删除', 'success');
      router();
    } catch (err) { toast(err.message, 'error'); delBtn.disabled = false; }
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const v = Object.fromEntries(new FormData(form).entries());
    if (!String(v.name || '').trim()) return toast('方向名称不能为空', 'error');
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      const payload = { ...v, active: Number(v.active) === 1 };
      if (id) await api.put('/api/agent/directions/' + id, payload);
      else await api.post('/api/agent/directions', payload);
      m.close();
      toast('已保存', 'success');
      router();
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false;
    }
  };
}

/* ---------- 行业偏好 ---------- */
async function openIndustryPrefs() {
  const data = await api.get('/api/agent/preferences');
  const groups = data.groups || [];
  const blockedSet = new Set(data.blocked || []);
  const m = openModal(`
    <div class="pref-modal">
      <h3>行业偏好</h3>
      <p class="muted">点一下即屏蔽，再点取消。屏蔽后：方向表单不再推荐这些行业，玄米自动采集时也会直接过滤掉。</p>
      ${groups.map((g) => `<div class="pref-group">
        <h4>${esc(g.label)}</h4>
        <div class="pref-items">${g.items.map((n) => `<button type="button" class="pref-chip ${blockedSet.has(n) ? 'blocked' : ''}" data-ind="${esc(n)}">${esc(n)}</button>`).join('')}</div>
      </div>`).join('')}
      <div class="pref-count">已屏蔽 <b>${blockedSet.size}</b> 个行业 <button type="button" class="link-btn" id="pref-clear">全部取消</button></div>
      <div class="modal-actions">
        <button type="button" class="btn" data-close>取消</button>
        <button type="button" class="btn primary" id="pref-save">保存偏好</button>
      </div>
    </div>`, { width: 800 });

  const countEl = m.el.querySelector('.pref-count b');
  const chips = [...m.el.querySelectorAll('.pref-chip')];
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('blocked');
      countEl.textContent = m.el.querySelectorAll('.pref-chip.blocked').length;
    });
  });
  m.el.querySelector('#pref-clear').onclick = () => {
    chips.forEach((c) => c.classList.remove('blocked'));
    countEl.textContent = '0';
  };
  m.el.querySelector('[data-close]').onclick = m.close;
  m.el.querySelector('#pref-save').onclick = async () => {
    const list = chips.filter((c) => c.classList.contains('blocked')).map((c) => c.dataset.ind);
    try {
      await api.put('/api/agent/preferences', { blocked: list });
      toast(`偏好已保存（屏蔽 ${list.length} 个行业）`, 'success');
      m.close();
      router();
    } catch (e) { toast(e.message, 'error'); }
  };
}

/* ---------- 简历上传（图片自动压缩 + OCR） ---------- */
async function shrinkImage(file, maxDim = 1800) {
  if (!file || !file.type || !file.type.startsWith('image/')) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size <= 2 * 1024 * 1024) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
    if (!blob) return file;
    return new File([blob], (file.name || 'resume').replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch (e) { return file; }
}

async function openResumeUpload(directionId) {
  const { directions } = await api.get('/api/agent/directions');
  const d = directions.find((x) => x.id === directionId);
  const m = openModal(`
    <form class="edit-form">
      <h3>上传简历 · ${esc(d ? d.name : '')}</h3>
      <div class="form-row"><label>版本名称</label><input name="name" placeholder="如：产品版 v3（留空自动命名）"></div>
      <div class="form-row"><label>选择文件</label><input type="file" name="file" accept=".pdf,.docx,.txt,.md,image/jpeg,image/png,image/gif,image/webp"></div>
      <p class="muted resume-upload-hint">支持 <b>图片（JPG / PNG）</b>、PDF、DOCX、TXT。图片和扫描版 PDF 由玄米识别文字并自动整理成档案（约 10~30 秒）；原图会保留。</p>
      <div class="form-row"><label>或直接粘贴简历正文</label><textarea name="content" rows="8" placeholder="把简历文字粘贴到这里，效果和上传文件一样"></textarea></div>
      <div class="modal-actions">
        <button type="button" class="btn" data-close>取消</button>
        <button type="submit" class="btn primary">保存并归档</button>
      </div>
    </form>`, { width: 660 });
  m.el.querySelector('form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('direction_id', String(directionId));
    fd.append('name', e.target.querySelector('[name=name]').value.trim());
    fd.append('content', e.target.querySelector('[name=content]').value.trim());
    const raw = e.target.querySelector('[name=file]').files[0];
    const isImage = !!raw && raw.type.startsWith('image/');
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = isImage ? '识别中…' : '解析中…';
    try {
      if (raw) fd.append('file', isImage ? await shrinkImage(raw) : raw);
      const r = await api.upload('/api/agent/resumes', fd);
      m.close();
      toast(r.method === 'vision' || r.method === 'vision-pdf' ? '图片已识别并归档' : '简历已保存并归档', 'success');
      router();
      try {
        await api.post(`/api/agent/resumes/${r.id}/analyze`);
        toast('简历分析完成', 'success');
        router();
      } catch (err) {
        toast('已归档，但分析失败：' + err.message, 'error');
      }
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = '保存并归档';
    }
  };
}

async function openResumeList(dirId) {
  const { directions } = await api.get('/api/agent/directions');
  const d = directions.find((x) => x.id === dirId);
  if (!d) return;
  const rows = d.resumes.map((r) => `<div class="resume-row">
    <span class="resume-name">${esc(r.name)}</span>
    ${r.file_name ? `<span class="muted resume-file" title="${esc(r.file_name)}">${esc(r.file_name)}</span>` : ''}
    <span class="muted">${r.content_len} 字</span>
    ${r.analysis ? `<span class="chip chip-green">匹配 ${r.analysis.matchScore}</span>` : '<span class="chip chip-gray">未分析</span>'}
    <span class="spacer"></span>
    <button class="btn small" onclick="analyzeResume(${r.id}, this)">分析</button>
    ${r.analysis ? `<button class="btn small" onclick="viewResumeAnalysis(${r.id})">看分析</button>` : ''}
    ${r.has_profile ? `<button class="btn small" onclick="viewResumeProfile(${r.id})">档案</button>` : ''}
    <button class="btn small danger" onclick="delResume(${r.id}, ${dirId})">删除</button>
  </div>`).join('');
  const m = openModal(`<div class="dir-cand-modal">
    <h3>${esc(d.name)} · 简历版本</h3>
    ${rows || '<div class="muted">还没有简历</div>'}
    <div class="modal-actions"><button type="button" class="btn" data-close>关闭</button></div>
  </div>`, { width: 780 });
  m.el.querySelector('[data-close]').onclick = m.close;
}

async function analyzeResume(id, btn) {
  btn.disabled = true;
  const old = btn.textContent;
  btn.textContent = '分析中…';
  try { await api.post(`/api/agent/resumes/${id}/analyze`); toast('分析完成', 'success'); router(); }
  catch (e) { toast(e.message, 'error'); btn.disabled = false; btn.textContent = old; }
}

async function viewResumeAnalysis(id) {
  try {
    const { resume } = await api.get('/api/agent/resumes/' + id);
    if (!resume.analysis) return toast('这份简历还没有分析结果', 'error');
    const m = openModal(`
      <div class="analysis-modal">
        <h3>${esc(resume.name)} · 匹配分析</h3>
        ${analysisBox(resume.analysis, resume.name)}
        <div class="modal-actions">
          ${resume.profile ? `<button type="button" class="btn" onclick="closeAllModals(); viewResumeProfile(${resume.id})">查看档案</button>` : ''}
          <button type="button" class="btn" data-close>关闭</button>
        </div>
      </div>`, { width: 720 });
    m.el.querySelector('[data-close]').onclick = m.close;
  } catch (e) { toast(e.message, 'error'); }
}

function analysisBox(a, resumeName) {
  const list = (arr, cls) => (arr && arr.length
    ? `<ul class="${cls}">${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`
    : '<div class="muted">—</div>');
  return `<div class="dir-analysis">
    <div class="analysis-score"><b>${a.matchScore}</b><span>匹配度</span></div>
    <div class="analysis-main">
      <div class="analysis-summary">${esc(a.summary || '')} <span class="muted">· 来自「${esc(resumeName || '最新简历')}」</span></div>
      <div class="analysis-cols">
        <div><div class="analysis-label ok">优势</div>${list(a.strengths)}</div>
        <div><div class="analysis-label warn">短板</div>${list(a.gaps)}</div>
      </div>
      ${a.keywords && a.keywords.length ? `<div class="analysis-tags">${a.keywords.map((k) => `<span class="chip chip-blue">${esc(k)}</span>`).join('')}</div>` : ''}
      ${a.suggestions && a.suggestions.length ? `<details class="analysis-more"><summary>改进建议（${a.suggestions.length}）</summary><ol>${a.suggestions.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></details>` : ''}
    </div>
  </div>`;
}

/* ---------- 结构化档案 ---------- */
function profileHtml(p) {
  if (!p) return '<div class="muted">还没有结构化档案</div>';
  const edu = (p.education || []).map((e) => `<li><b>${esc(e.school || '—')}</b>${e.degree ? ' · ' + esc(e.degree) : ''}${e.major ? ' · ' + esc(e.major) : ''}<span class="muted"> ${esc([e.start, e.end].filter(Boolean).join(' – '))}</span></li>`).join('');
  const exp = (p.experience || []).map((e) => `<li><b>${esc(e.company || '—')}</b>${e.role ? ' · ' + esc(e.role) : ''}<span class="muted"> ${esc([e.start, e.end].filter(Boolean).join(' – '))}</span>
    ${(e.bullets || []).length ? `<ul>${e.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}</li>`).join('');
  const proj = (p.projects || []).map((e) => `<li><b>${esc(e.name || '—')}</b>${e.role ? ' · ' + esc(e.role) : ''}<span class="muted"> ${esc([e.start, e.end].filter(Boolean).join(' – '))}</span>
    ${(e.bullets || []).length ? `<ul>${e.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}</li>`).join('');
  return `<div class="profile-box">
    <div class="profile-head">
      <div class="profile-name">${esc(p.name || '未识别姓名')}</div>
      <div class="profile-contact muted">${[p.phone, p.email, p.city].filter(Boolean).map(esc).join(' · ') || '联系方式未识别'}</div>
    </div>
    ${p.summary ? `<p class="profile-summary">${esc(p.summary)}</p>` : ''}
    ${edu ? `<div class="profile-sec"><h4>教育背景</h4><ul>${edu}</ul></div>` : ''}
    ${exp ? `<div class="profile-sec"><h4>实习 / 工作</h4><ul>${exp}</ul></div>` : ''}
    ${proj ? `<div class="profile-sec"><h4>项目经历</h4><ul>${proj}</ul></div>` : ''}
    ${(p.skills || []).length ? `<div class="profile-sec"><h4>技能</h4><div class="analysis-tags">${p.skills.map((s) => `<span class="chip chip-blue">${esc(s)}</span>`).join('')}</div></div>` : ''}
    ${(p.awards || []).length ? `<div class="profile-sec"><h4>奖项</h4><ul>${p.awards.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>` : ''}
  </div>`;
}

async function viewResumeProfile(id) {
  try {
    const { resume } = await api.get('/api/agent/resumes/' + id);
    const m = openModal(`
      <div class="analysis-modal">
        <h3>${esc(resume.name)} · 简历档案</h3>
        ${profileHtml(resume.profile)}
        <div class="modal-actions">
          <button type="button" class="btn" id="reprofile">${resume.profile ? '重新识别档案' : '提取档案'}</button>
          <button type="button" class="btn" data-close>关闭</button>
        </div>
      </div>`, { width: 760 });
    m.el.querySelector('[data-close]').onclick = m.close;
    m.el.querySelector('#reprofile').onclick = async (ev) => {
      const btn = ev.target;
      btn.disabled = true; btn.textContent = '识别中…';
      try {
        await api.post(`/api/agent/resumes/${resume.id}/profile`);
        toast('档案已更新', 'success');
        m.close();
        router();
      } catch (e) { toast(e.message, 'error'); btn.disabled = false; btn.textContent = '重新识别档案'; }
    };
  } catch (e) { toast(e.message, 'error'); }
}

async function delResume(id, dirId) {
  if (!(await confirmDialog('删除这份简历版本？'))) return;
  try {
    await api.del('/api/agent/resumes/' + id);
    toast('已删除', 'success');
    closeAllModals();
    router();
    if (dirId) openResumeList(dirId); // 刷新版本列表，删完还能接着管理
  } catch (e) { toast(e.message, 'error'); }
}

/* ---------- 采集与候选 ---------- */
async function openDirectionCollect(id, btn) {
  if (!(await confirmDialog('让玄米现在联网搜索这个方向的新岗位？大约需要 30~90 秒。'))) return;
  btn.disabled = true;
  const old = btn.textContent;
  btn.textContent = '搜索中…';
  try {
    const r = await api.post(`/api/agent/directions/${id}/collect`, {});
    const s = r.stats;
    const msg = s.mode === 'sync'
      ? `新增 ${s.openings} 个岗位已同步到岗位汇总${s.existing ? `（已存在 ${s.existing} 个）` : ''}${s.blocked ? `，屏蔽 ${s.blocked} 条` : ''}`
      : `新增 ${s.inserted} 条候选（重复 ${s.duplicated} 条${s.blocked ? `，屏蔽 ${s.blocked} 条` : ''}）`;
    toast(msg, 'success');
    router();
  } catch (e) {
    toast(e.message, 'error');
    btn.disabled = false; btn.textContent = old;
  }
}

async function openDirectionCandidates(dirId) {
  try {
    const { candidates } = await api.get(`/api/ai/candidates?status=${encodeURIComponent('待确认')}&direction_id=${dirId}`);
    if (!candidates.length) return toast('这个方向暂无待确认候选', 'error');
    const rows = candidates.map((c) => `<tr>
      <td><input type="checkbox" class="dc-check" data-id="${c.id}" checked></td>
      <td><strong>${esc(c.company)}</strong></td>
      <td>${esc(c.position_name || '—')}</td>
      <td>${esc(c.city || '—')}</td>
      <td>${c.url ? `<a class="op-url" href="${esc(c.url)}" target="_blank" rel="noopener">链接</a>` : '—'}</td>
      <td>${esc(c.deadline || '—')}</td>
      <td>${esc(c.referral || '—')}</td>
    </tr>`).join('');
    const m = openModal(`
      <div class="dir-cand-modal">
        <h3>待确认候选 <span class="muted">（${candidates.length} 条）</span></h3>
        <div class="table-scroll"><table>
          <thead><tr><th><input type="checkbox" checked onchange="document.querySelectorAll('.dc-check').forEach(c=>c.checked=this.checked)"></th>
          <th>公司</th><th>岗位</th><th>城市</th><th>网址</th><th>截止</th><th>内推码</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
        <div class="modal-actions">
          <button type="button" class="btn" data-close>关闭</button>
          <button type="button" class="btn primary" id="dc-import">导入选中到岗位汇总</button>
        </div>
      </div>`, { width: 880 });
    m.el.querySelector('#dc-import').onclick = async () => {
      const ids = [...m.el.querySelectorAll('.dc-check:checked')].map((el) => Number(el.dataset.id));
      if (!ids.length) return toast('请先勾选', 'error');
      try {
        const r = await api.post('/api/ai/candidates/import', { ids });
        toast(`已导入 ${r.imported} 条（新增岗位 ${r.newPositions} 个，重复 ${r.duplicates} 条）`, 'success');
        m.close(); router();
      } catch (e) { toast(e.message, 'error'); }
    };
    m.el.querySelector('[data-close]').onclick = m.close;
  } catch (e) { toast(e.message, 'error'); }
}

/* ---------- 每日更新设置 ---------- */
async function setDailyEnabled(v) {
  try { await api.put('/api/agent/daily', { enabled: v }); toast(v ? '每日更新已开启' : '每日更新已关闭', 'success'); router(); }
  catch (e) { toast(e.message, 'error'); }
}
async function setDailyHour(v) {
  try { await api.put('/api/agent/daily', { hour: Number(v) }); router(); }
  catch (e) { toast(e.message, 'error'); }
}
async function setAutoSync(v) {
  try {
    await api.put('/api/agent/auto-sync', { enabled: v });
    toast(v ? '已开启自动同步' : '已关闭自动同步，新岗位先进入候选池', 'success');
    router();
  } catch (e) { toast(e.message, 'error'); }
}

/* ---------- 候选池与链接提取（原智能采集页功能，已并入求职方向） ---------- */
// 粘贴单个招聘链接 → 网页提取 → 进候选池
async function aiExtract(btn) {
  const input = document.getElementById('ai-extract-url');
  const url = input.value.trim();
  if (!url) return toast('请粘贴招聘网页链接', 'error');
  btn.disabled = true;
  const old = btn.textContent;
  btn.textContent = '提取中…';
  try {
    const r = await api.post('/api/ai/extract', { url });
    const f = r.fields || {};
    if (!f.company) return toast('没有提取到公司信息（页面可能需要登录），可改用方向采集', 'error');
    const add = await api.post('/api/ai/candidates', {
      company: f.company,
      position: f.position || '校招岗位',
      category: f.category || '',
      city: f.city || '',
      url: f.apply_url || url,
      deadline: f.deadline || '',
      referral: f.referral || '',
      channel: '官网',
      note: f.requirements ? String(f.requirements).slice(0, 150) : '',
    });
    toast(add.inserted ? `已加入候选池：${f.company} · ${f.position || '校招岗位'}` : '该岗位已在候选池或岗位汇总中',
      add.inserted ? 'success' : 'error');
    if (add.inserted) router();
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = old;
  }
}

function aiToggleAll(el) {
  document.querySelectorAll('.cand-check').forEach((c) => { c.checked = el.checked; });
}
function aiCheckedIds() {
  return [...document.querySelectorAll('.cand-check:checked')].map((el) => Number(el.dataset.id));
}

async function aiImportSelected() {
  const ids = aiCheckedIds();
  if (!ids.length) return toast('请先勾选要导入的候选', 'error');
  if (!(await confirmDialog(`把选中的 ${ids.length} 条岗位写入「岗位汇总」？`))) return;
  try {
    const r = await api.post('/api/ai/candidates/import', { ids });
    toast(`已导入 ${r.imported} 条（新增岗位 ${r.newPositions} 个，重复 ${r.duplicates} 条）`, 'success');
    router();
  } catch (e) { toast(e.message, 'error'); }
}

async function aiIgnoreSelected() {
  const ids = aiCheckedIds();
  if (!ids.length) return toast('请先勾选要忽略的候选', 'error');
  try { await api.post('/api/ai/candidates/ignore', { ids }); toast('已忽略', 'success'); router(); }
  catch (e) { toast(e.message, 'error'); }
}

async function aiIgnoreOne(id) {
  try { await api.post('/api/ai/candidates/ignore', { ids: [id] }); router(); }
  catch (e) { toast(e.message, 'error'); }
}

async function aiClearProcessed() {
  if (!(await confirmDialog('清空所有已导入/已忽略的记录？岗位汇总里的数据不受影响。'))) return;
  try { await api.del('/api/ai/candidates/processed'); toast('已清空', 'success'); router(); }
  catch (e) { toast(e.message, 'error'); }
}
