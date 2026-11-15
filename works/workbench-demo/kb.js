// AI 知识库（芒果）：推荐博主列表 + 笔记区。自动视频抓取已停用；历史收录保留在数据库，不再展示。

async function renderKb(container) {
  const K = appState.kbState;
  const [state, bData, nData, rData] = await Promise.all([
    api.get('/api/kb/state'), api.get('/api/kb/bloggers'),
    api.get('/api/kb/notes'), api.get('/api/kb/recommended'),
  ]);
  const bloggers = bData.bloggers || [];
  const notes = nData.notes || [];
  const recByName = new Map((rData.recommended || []).map((r) => [r.name, r]));

  container.innerHTML = `
    <div class="page-head">
      <h2>AI 知识库 <span class="muted">（${bloggers.length} 位博主 · ${notes.length} 篇笔记）</span></h2>
      <div class="actions">
        <button class="btn primary" onclick="openKbNoteForm()">＋ 写笔记</button>
      </div>
    </div>

    <div class="card kb-mango-card">
      <div class="kb-cat-box">${mangoCatSvg()}</div>
      <div class="kb-mango-main">
        <div class="kb-mango-title">芒果 · 知识库管家</div>
        <div class="kb-mango-sub">自动视频抓取已关闭：这里整理你关注的 AI 博主和主页链接。学习想法记进笔记，问芒果时它会翻你的笔记来回答。</div>
        ${state.localModel ? `<div class="kb-mango-stats">
          <span class="chip chip-gray">本地模型 ${esc(state.localModel)}</span>
        </div>` : ''}
        <div class="ai-search-row kb-mango-ask">
          <input id="mango-question" placeholder="今天想学什么？" value="${esc(K.question)}">
          <button class="btn primary" id="mango-run" ${K.asking ? 'disabled' : ''}>${K.asking ? '芒果在想…' : '🐾 问芒果'}</button>
        </div>
        ${K.answer ? `<div class="md kb-mango-answer">${renderMd(K.answer)}</div>` : ''}
      </div>
    </div>

    <div class="section-block">
      <div class="section-head">
        <h3>推荐博主 <span class="muted">（${bloggers.length}）</span></h3>
        <div class="actions">
          <span class="muted kb-blogger-tip">自动抓取已关闭 · 历史收录已归档 · 点名字打开主页</span>
          <button class="btn small" onclick="openBloggerForm()">＋ 添加博主</button>
        </div>
      </div>
      ${bloggers.length ? `
      <div class="kb-blogger-list">
        ${bloggers.map((b) => {
          const rec = recByName.get(b.name) || {};
          const summary = rec.summary || '';
          const field = rec.field || '';
          const home = b.home_url || rec.url || '';
          const note = b.note || '';
          const desc = summary || note;
          return `<div class="kb-blogger-row">
            ${home
              ? `<a class="kb-blogger-name" href="${esc(home)}" target="_blank" rel="noopener" title="打开主页">${esc(b.name)} ↗</a>`
              : `<b class="kb-blogger-name">${esc(b.name)}</b>`}
            <span class="kb-blogger-meta">${esc(b.platform)}${field ? ` · ${esc(field)}` : ''}</span>
            <span class="spacer"></span>
            <button class="btn small ghost" onclick="openBloggerForm(${b.id})">编辑</button>
            ${desc ? `<div class="kb-blogger-summary">${esc(desc)}</div>` : ''}
            ${summary && note ? `<div class="kb-blogger-summary kb-blogger-note">备注：${esc(note)}</div>` : ''}
          </div>`;
        }).join('')}
      </div>` : '<div class="empty">还没有博主。点「＋ 添加博主」添加你想关注的 AI 博主；自动抓取已关闭，不影响你点主页自己看。</div>'}
    </div>

    <div class="section-block">
      <div class="section-head">
        <h3>笔记区 <span class="muted">（${notes.length}）</span></h3>
      </div>
      ${notes.length ? `<div class="kb-notes-grid">${notes.map(kbNoteCard).join('')}</div>`
        : '<div class="empty">还没有笔记。学习时有什么想法，点「＋ 写笔记」记下来；问芒果时它也会参考这里。</div>'}
    </div>`;

  const mq = container.querySelector('#mango-question');
  if (mq) {
    bindSearchInput(mq, (v) => { K.question = v; }, 400);
    mq.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); container.querySelector('#mango-run').click(); }
    });
  }
  const mr = container.querySelector('#mango-run');
  if (mr) mr.onclick = () => { if (mq) K.question = mq.value; askMango(); };
}

/* ---------- 芒果页内问答（与山竹面板同款） ---------- */
async function askMango() {
  const K = appState.kbState;
  if (K.asking) return;
  K.asking = true;
  router();
  try {
    const r = await api.post('/api/agents/mango/ask', { message: K.question });
    K.answer = r.reply;
  } catch (e) {
    K.answer = `**回答失败**：${esc(e.message)}\n\n（芒果需要 DeepSeek Key；本地 Ollama 可用时会自动用本地模型）`;
  }
  K.asking = false;
  router();
}

/* ---------- 笔记区 ---------- */
function kbNoteCard(n) {
  return `<div class="card kb-note">
    <div class="kb-note-head">
      <b class="kb-note-title">${esc(n.title || '无标题笔记')}</b>
      <span class="spacer"></span>
      <button class="btn small" onclick="openKbNoteForm(${n.id})">编辑</button>
    </div>
    <div class="kb-note-content">${esc(n.content)}</div>
    <div class="kb-note-meta">
      ${(n.tags || '').split(/[,，\s]+/).filter(Boolean).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}
      <span class="muted">更新于 ${esc(String(n.updated_at || '').slice(0, 16))}</span>
    </div>
  </div>`;
}

async function openKbNoteForm(id) {
  const data = await api.get('/api/kb/notes');
  const old = id ? (data.notes || []).find((n) => n.id === id) : null;
  const m = openModal(`
    <form class="edit-form">
      <h3>${old ? '编辑笔记' : '写笔记'}</h3>
      <div class="form-row"><label>标题（选填）</label><input name="title" value="${esc(old ? old.title : '')}" placeholder="给这篇笔记起个名字"></div>
      <div class="form-row"><label>内容<em>*</em></label><textarea name="content" rows="10" required placeholder="今天学到什么？用自己的话记下来…">${esc(old ? old.content : '')}</textarea></div>
      <div class="form-row"><label>标签（用空格或逗号分隔）</label><input name="tags" value="${esc(old ? old.tags : '')}" placeholder="如：大模型 面试"></div>
      <div class="modal-actions">
        ${old ? '<button type="button" class="btn danger modal-delete" id="note-delete">删除笔记</button>' : ''}
        <button type="button" class="btn" data-close>取消</button>
        <button type="submit" class="btn primary">保存</button>
      </div>
    </form>`, { width: 620 });
  const delBtn = m.el.querySelector('#note-delete');
  if (delBtn) delBtn.onclick = async () => {
    if (!(await confirmDialog('删除这篇笔记？'))) return;
    delBtn.disabled = true;
    try {
      await api.del('/api/kb/notes/' + id);
      m.close();
      toast('笔记已删除', 'success');
      router();
    } catch (err) { toast(err.message, 'error'); delBtn.disabled = false; }
  };
  m.el.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = { title: fd.get('title'), content: fd.get('content'), tags: fd.get('tags') };
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      if (id) await api.put('/api/kb/notes/' + id, body);
      else await api.post('/api/kb/notes', body);
      m.close();
      toast('笔记已保存', 'success');
      router();
    } catch (err) { toast(err.message || '保存失败', 'error'); btn.disabled = false; }
  });
}

/* ---------- 博主列表 ---------- */
async function openBloggerForm(id) {
  const bData = await api.get('/api/kb/bloggers');
  const platforms = bData.platforms || [];
  const old = id ? bData.bloggers.find((b) => b.id === id) : null;
  openFormModal({
    title: old ? '编辑博主' : '添加博主',
    width: 520,
    fields: [
      { name: 'platform', label: '平台', type: 'select', options: platforms, required: true },
      { name: 'name', label: '博主名', required: true, placeholder: '如：跟李沐学AI' },
      { name: 'uid', label: '账号 ID / 频道（可选）', placeholder: 'B站 mid 或 YouTube 频道 ID；用于生成主页链接' },
      { name: 'url', label: '主页链接（可选）', placeholder: '空间 / 频道主页地址，留空会按账号 ID 生成' },
      { name: 'note', label: '备注（可选）', type: 'textarea', rows: 2, placeholder: '领域、推荐理由等' },
    ],
    initial: old || { platform: 'B站' },
    onSave: async (v) => (id ? api.put('/api/kb/bloggers/' + id, v) : api.post('/api/kb/bloggers', v)),
    onDelete: id ? () => api.del('/api/kb/bloggers/' + id) : null,
    deleteConfirm: '从推荐列表删除该博主？不会删除笔记和历史收录。',
  });
}

