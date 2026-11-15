// 通用 UI 组件：转义、toast、弹窗、表单引擎、附件、表格、状态标签
function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

function toast(msg, type = 'info') {
  const box = document.getElementById('toasts');
  const el = h(`<div class="toast toast-${type}">${esc(msg)}</div>`);
  box.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 2600);
}

function openModal(innerHtml, { width = 640 } = {}) {
  const root = document.getElementById('modal-root');
  const wrap = h(`<div class="modal-overlay"><div class="modal" style="max-width:${width}px">${innerHtml}</div></div>`);
  root.appendChild(wrap);
  const close = () => wrap.remove();
  wrap.addEventListener('click', (e) => {
    if (e.target === wrap || e.target.closest('[data-close]')) close();
  });
  return { el: wrap.querySelector('.modal'), wrap, close };
}

function closeAllModals() { document.getElementById('modal-root').innerHTML = ''; }

// 搜索框绑定：感知输入法（IME）组合状态。
// 中文输入时 input 事件会在拼音阶段触发，若此时重渲染 DOM，输入法候选会被打断（表现为只能输入字母）。
// 因此组合期间只收集内容、不触发搜索，compositionend（选词落地）后才执行。
function bindSearchInput(input, onSearch, delay = 220) {
  let composing = false;
  let timer = null;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => { if (!composing) onSearch(input.value); }, delay);
  };
  input.addEventListener('compositionstart', () => { composing = true; clearTimeout(timer); });
  input.addEventListener('compositionend', () => { composing = false; schedule(); });
  input.addEventListener('input', (e) => {
    if (composing || e.isComposing) return; // 组合中：不搜索、不重渲染
    schedule();
  });
}

function confirmDialog(msg) {
  return new Promise((resolve) => {
    const m = openModal(`<div class="confirm-box"><p>${esc(msg)}</p><div class="modal-actions">
      <button type="button" class="btn" data-close>取消</button>
      <button type="button" class="btn danger" id="confirm-yes">确认</button></div></div>`, { width: 420 });
    let done = false;
    const finish = (v) => { if (!done) { done = true; m.close(); resolve(v); } };
    m.el.querySelector('#confirm-yes').onclick = () => finish(true);
    m.el.querySelector('[data-close]').onclick = () => finish(false);
    m.wrap.addEventListener('click', (e) => { if (e.target === m.wrap) finish(false); });
  });
}

// 表单字段渲染。fields: {name, label, type: text|date|select|textarea|datalist, options, required, placeholder, rows}
function fieldRow(f, v) {
  const val = v == null ? '' : v;
  const req = f.required ? ' <em>*</em>' : '';
  let input;
  if (f.type === 'select') {
    const opts = (f.options || []).map((o) => {
      const [value, label] = typeof o === 'object' ? [o.value, o.label] : [o, o];
      return `<option value="${esc(value)}" ${String(value) === String(val) ? 'selected' : ''}>${esc(label)}</option>`;
    }).join('');
    input = `<select name="${esc(f.name)}" ${f.required ? 'required' : ''}><option value="">${esc(f.placeholder || '— 请选择 —')}</option>${opts}</select>`;
  } else if (f.type === 'textarea') {
    input = `<textarea name="${esc(f.name)}" rows="${f.rows || 4}" ${f.required ? 'required' : ''} placeholder="${esc(f.placeholder || '')}">${esc(val)}</textarea>`;
  } else if (f.type === 'datalist') {
    const opts = (f.options || []).map((o) => `<option value="${esc(o)}">`).join('');
    input = `<input name="${esc(f.name)}" list="dl-${esc(f.name)}" value="${esc(val)}" placeholder="${esc(f.placeholder || '')}">
      <datalist id="dl-${esc(f.name)}">${opts}</datalist>`;
  } else {
    input = `<input type="${f.type || 'text'}" name="${esc(f.name)}" value="${esc(val)}" ${f.required ? 'required' : ''} placeholder="${esc(f.placeholder || '')}">`;
  }
  return `<div class="form-row"><label>${esc(f.label)}${req}</label>${input}</div>`;
}

// 通用 CRUD 表单弹窗。onSave(values) → 返回 {id}（新建时用于挂附件）；保存成功后自动刷新当前视图
// 传 onDelete 时，编辑态左下角出现「删除」，列表/卡片上不再单独放删除按钮。
function openFormModal({ title, fields, initial = {}, onSave, attach = null, width = 640, afterSave = null, onDelete = null, afterDelete = null, deleteConfirm = '确认删除？' }) {
  const rows = fields.map((f) => fieldRow(f, initial[f.name])).join('');
  const attachRow = attach ? `
      <div class="form-row">
        <label>图片 / 附件</label>
        <div class="form-attach">
          ${attach.recordId
            ? `<div class="attach-zone" data-module="${esc(attach.module)}" data-id="${attach.recordId}"></div>`
            : `<label class="att-add">＋ 添加图片 / 附件<input type="file" class="att-pick-input" multiple hidden></label>
               <div class="att-picked"></div>`}
        </div>
      </div>` : '';
  const m = openModal(`
    <form class="edit-form">
      <h3>${esc(title)}</h3>
      ${rows}
      ${attachRow}
      <div class="modal-actions">
        ${onDelete ? '<button type="button" class="btn danger modal-delete">删除</button>' : ''}
        <button type="button" class="btn" data-close>取消</button>
        <button type="submit" class="btn primary">保存</button>
      </div>
    </form>`, { width });
  initAttachmentZones(m.el);
  const cleanupPreview = bindAttachPreview(m.el);
  if (onDelete) {
    m.el.querySelector('.modal-delete').addEventListener('click', async () => {
      if (!(await confirmDialog(deleteConfirm))) return;
      const delBtn = m.el.querySelector('.modal-delete');
      delBtn.disabled = true;
      try {
        await onDelete();
      } catch (err) {
        toast(err.message || '删除失败', 'error');
        delBtn.disabled = false;
        return;
      }
      cleanupPreview();
      m.close();
      toast('已删除', 'success');
      try {
        if (afterDelete) await afterDelete();
        else router();
      } catch (err) { console.error(err); }
    });
  }
  m.el.addEventListener('submit', async (e) => {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.target).entries());
    const fileInput = e.target.querySelector('.att-pick-input');
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    let saved = false;
    try {
      const result = (await onSave(values)) || {};
      saved = true;
      const recordId = (attach && attach.recordId) || result.id;
      if (fileInput && fileInput.files.length && recordId && attach) {
        const fd = new FormData();
        for (const f of fileInput.files) fd.append('files', f);
        fd.append('module', attach.module);
        fd.append('record_id', recordId);
        await api.upload('/api/attachments', fd);
      }
      cleanupPreview();
      m.close();
      toast('已保存', 'success');
      router();
      if (afterSave) { try { await afterSave(result); } catch (err) { console.error(err); } }
    } catch (err) {
      if (saved) {
        // 内容已保存，只是附件上传失败：关掉表单避免重复保存，附件可稍后在详情里补
        cleanupPreview();
        m.close();
        toast('内容已保存，但附件上传失败：' + (err.message || '未知错误'), 'error');
        router();
      } else {
        toast(err.message || '保存失败', 'error');
        btn.disabled = false;
      }
    }
  });
}

// 新建记录时的附件选择预览（记录还不存在，保存成功后再上传）
function bindAttachPreview(scope) {
  const input = scope.querySelector('.att-pick-input');
  if (!input) return () => {};
  const picked = scope.querySelector('.att-picked');
  let urls = [];
  const revoke = () => { urls.forEach((u) => URL.revokeObjectURL(u)); urls = []; };
  input.addEventListener('change', () => {
    revoke();
    const files = [...input.files];
    picked.innerHTML = files.map((f) => {
      if (f.type.startsWith('image/')) {
        const url = URL.createObjectURL(f);
        urls.push(url);
        return `<img src="${url}" alt="${esc(f.name)}" title="${esc(f.name)}">`;
      }
      return `<span class="att-picked-file">📎 ${esc(f.name)}</span>`;
    }).join('');
    if (files.length) picked.insertAdjacentHTML('beforeend', `<span class="att-picked-tip">保存后上传 ${files.length} 个文件</span>`);
  });
  return revoke;
}

/* ---------- 附件 ---------- */
function initAttachmentZones(scope) {
  scope.querySelectorAll('.attach-zone').forEach((zone) => {
    if (zone.dataset.init) return;
    zone.dataset.init = '1';
    renderAttachments(zone.dataset.module, Number(zone.dataset.id), zone);
  });
}

async function renderAttachments(module, recordId, zone) {
  let items = [];
  try { items = (await api.get(`/api/attachments?module=${module}&record_id=${recordId}`)).attachments; } catch (e) { /* 忽略 */ }
  zone.innerHTML = `
    <div class="att-list">${items.map(attItem).join('') || '<span class="muted">暂无图片 / 附件</span>'}</div>
    <label class="att-add">＋ 添加图片 / 附件<input type="file" multiple hidden></label>`;
  zone.querySelector('input[type=file]').addEventListener('change', async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    const fd = new FormData();
    for (const f of files) fd.append('files', f);
    fd.append('module', module);
    fd.append('record_id', recordId);
    try { await api.upload('/api/attachments', fd); await renderAttachments(module, recordId, zone); }
    catch (err) { toast(err.message, 'error'); }
  });
}

function attItem(a) {
  const url = '/uploads/' + encodeURIComponent(a.filename);
  let media;
  if (a.mime && a.mime.startsWith('image/')) {
    media = `<button type="button" class="att-img-btn" title="点击查看大图" aria-label="查看图片 ${esc(a.original_name)}"
      data-url="${esc(url)}" data-name="${esc(a.original_name)}"
      onclick="openImagePreview(this.dataset.url, this.dataset.name)"><img src="${url}" alt="${esc(a.original_name)}"></button>`;
  } else if (a.mime && a.mime.startsWith('audio/')) media = `<audio controls src="${url}"></audio>`;
  else if (a.mime && a.mime.startsWith('video/')) media = `<video controls src="${url}"></video>`;
  else media = `<a class="att-file" href="${url}" target="_blank">📎 下载</a>`;
  return `<div class="att-item">${media}
    <div class="att-meta"><span class="att-name" title="${esc(a.original_name)}">${esc(a.original_name)}</span>
    <button type="button" class="att-del" title="删除附件" onclick="delAttachment(${a.id}, this)">×</button></div>
  </div>`;
}

// 站内图片预览：桌面独立窗口里点附件走外部浏览器会丢登录态，直接在本窗口看
function openImagePreview(url, name = '') {
  if (!url) return;
  const wrap = h(`<div class="img-preview-overlay" role="dialog" aria-modal="true" aria-label="${esc(name || '图片预览')}">
    <button type="button" class="img-preview-close" aria-label="关闭预览">×</button>
    <img src="${esc(url)}" alt="${esc(name || '图片预览')}">
    ${name ? `<div class="img-preview-name">${esc(name)}</div>` : ''}
  </div>`);
  document.body.appendChild(wrap);
  document.body.classList.add('img-preview-open');
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const close = () => {
    wrap.remove();
    document.body.classList.remove('img-preview-open');
    document.removeEventListener('keydown', onKey);
  };
  wrap.addEventListener('click', (e) => {
    if (e.target === wrap || e.target.closest('.img-preview-close')) close();
  });
  document.addEventListener('keydown', onKey);
}

async function delAttachment(id, btn) {
  if (!(await confirmDialog('删除该附件？'))) return;
  try {
    await api.del('/api/attachments/' + id);
    const item = btn.closest('.att-item');
    const list = item.parentElement;
    item.remove();
    if (!list.children.length) list.innerHTML = '<span class="muted">暂无附件</span>';
  } catch (e) { toast(e.message, 'error'); }
}

/* ---------- 状态与表格 ---------- */
const STATUS_COLORS = { '未投递': 'gray', '已投递': 'blue', '面试中': 'amber', '已挂': 'red' };
function statusChip(status) {
  return `<span class="chip ${'chip-' + (STATUS_COLORS[status] || 'gray')}">${esc(status || '未投')}</span>`;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function applicationsTable(apps, { withPosition = true } = {}) {
  const rows = apps.map((a) => {
    const over = a.deadline && a.status !== 'offer' && a.status !== '已终止' && a.deadline < todayStr();
    return `<tr>
      <td><strong>${esc(a.company)}</strong>${a.title ? `<div class="cell-note" title="${esc(a.title)}">${esc(a.title)}</div>` : ''}${a.note ? `<div class="cell-note" title="${esc(a.note)}">${esc(a.note)}</div>` : ''}</td>
      ${withPosition ? `<td>${a.position_name ? `<a class="link" href="#/position/${a.position_id}">${esc(a.position_name)}</a>` : '<span class="muted">未分类</span>'}</td>` : ''}
      <td>${esc(a.city || '—')}</td>
      <td>${esc(a.channel || '—')}</td>
      <td>${esc(a.applied_at || '—')}</td>
      <td>${statusChip(a.status)}</td>
      <td class="${over ? 'deadline-over' : ''}">${over ? '⚠ ' : ''}${esc(a.deadline || '—')}</td>
      <td class="row-actions">
        <button class="btn small" onclick="openApplicationForm(null, ${a.id})">编辑</button>
      </td>
    </tr>`;
  }).join('');
  return `<table>
    <thead><tr>
      <th>公司 / 备注</th>
      ${withPosition ? '<th>岗位</th>' : ''}
      <th>城市</th><th>渠道</th><th>投递日期</th><th>状态</th><th>截止日期</th><th>操作</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}
