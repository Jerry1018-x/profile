// 我的书架：书架 / AI 找书（联网查书目）/ 阅读器（章节目录、原文批注、随篇笔记、芒果全书总结）
const BOOK_STATUS_CHIP = { '想读': 'chip-gray', '在读': 'chip-blue', '读完': 'chip-green' };
const BOOK_FORMAT_LABEL = { epub: 'EPUB', pdf: 'PDF', txt: 'TXT' };
const READER_FONT_KEY = 'kb_reader_font';

function bookStars(n) {
  const r = Math.max(0, Math.min(5, Number(n) || 0));
  return r ? '★'.repeat(r) + '☆'.repeat(5 - r) : '未评分';
}

function bookCoverHtml(b, cls = 'book-cover') {
  const ch = esc(String(b.title || '书').slice(0, 1));
  return `<div class="${cls}">${b.cover_url ? `<img src="${esc(b.cover_url)}" alt="" loading="lazy" onerror="this.style.display='none'">` : ''}<span class="book-cover-fb">${ch}</span></div>`;
}

/* ============ 书架页 ============ */
async function renderBooks(container) {
  const B = appState.booksState;
  const [state, data] = await Promise.all([
    api.get('/api/books/state'),
    api.get(`/api/books?q=${encodeURIComponent(B.q)}&status=${encodeURIComponent(B.status)}`),
  ]);
  const books = data.books || [];

  container.innerHTML = `
    <div class="page-head">
      <h2>我的书架 <span class="muted">（${state.total} 本 · 在读 ${state.reading} · 读完 ${state.finished}）</span></h2>
      <div class="actions">
        <button class="btn primary" onclick="openBookUpload()">＋ 导入电子书</button>
        <button class="btn" onclick="toggleAiSearch()">✨ AI 找书</button>
        <button class="btn" onclick="openBookForm()">＋ 手动添加</button>
      </div>
    </div>

    <div class="filter-bar">
      <input type="search" placeholder="搜索书名 / 作者 / 备注…" value="${esc(B.q)}">
      <select onchange="setBookStatusFilter(this.value)">
        <option value="">全部状态</option>
        ${['想读', '在读', '读完'].map((s) => `<option value="${s}" ${B.status === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
      <span class="spacer"></span>
      <span class="muted">AI 总结 ${state.summaryCount} 本 · 笔记 ${state.notes} 条</span>
    </div>

    ${B.aiOpen ? renderAiPanel(B) : ''}

    ${books.length ? `<div class="book-grid">${books.map(bookCard).join('')}</div>` : `<div class="empty">书架还是空的。可以「导入电子书」（EPUB / PDF / TXT），用「✨ AI 找书」联网查书目，或先手动添加一本。</div>`}`;

  const si = container.querySelector('.filter-bar input[type=search]');
  if (si) {
    bindSearchInput(si, (v) => { B.q = v; router(); });
  }
  bindAiSearch(container);
}

function bookCard(b) {
  const hasFile = !!b.file_url;
  const progress = (() => {
    try { const p = JSON.parse(b.reading_position || '{}'); return Number.isInteger(p.ch) ? p.ch + 1 : 0; } catch (e) { return 0; }
  })();
  return `<div class="card book-card">
    <div class="book-card-top" onclick="openBookDetail(${b.id})">
      ${bookCoverHtml(b)}
      <div class="book-card-info">
        <div class="book-title">${esc(b.title)}</div>
        <div class="book-author">${esc(b.author || '未知作者')}</div>
        <div class="book-tags">
          <span class="chip ${BOOK_STATUS_CHIP[b.status] || 'chip-gray'}">${esc(b.status)}</span>
          <span class="book-meta-inline">${b.format ? esc(BOOK_FORMAT_LABEL[b.format] || b.format) : '无文件'}${b.note_count ? ` · 笔记 ${b.note_count}` : ''}</span>
        </div>
        <div class="book-rating ${Number(b.rating) ? '' : 'unrated'}">${bookStars(b.rating)}</div>
        ${b.summary ? `<div class="book-summary-snippet">${esc(b.summary.replace(/\s+/g, ' ').slice(0, 100))}…</div>` : ''}
        ${b.last_read_at ? `<div class="book-last-read">上次阅读 ${esc(String(b.last_read_at).slice(0, 16))}${progress ? ` · 第 ${progress} 章` : ''}</div>` : ''}
      </div>
    </div>
    <div class="book-card-actions">
      <button class="btn small primary" onclick="openBookReader(${b.id})" ${hasFile ? '' : 'disabled title="先导入电子书文件"'}>${b.last_read_at ? '继续阅读' : '阅读'}</button>
      <button class="btn small" onclick="openBookDetail(${b.id})">详情 / 笔记</button>
      ${appState.booksState.summarizing[b.id] ? '<span class="muted">芒果总结中…</span>' : ''}
    </div>
  </div>`;
}

function setBookStatusFilter(v) { appState.booksState.status = v; router(); }

/* ============ AI 找书 ============ */
function aiKey(r) { return `${r.source || ''}:${r.source_id || r.title || ''}`; }

function renderAiPanel(B) {
  const hint = B.aiResults.length ? `找到 ${B.aiResults.length} 本` : '';
  return `<div class="card online-shelf">
    <div class="online-shelf-head">
      <div><b>✨ AI 找书</b> <span class="muted">输入书名，自动联网查作者 / 出版社 / 简介 / 封面</span></div>
    </div>
    <div class="muted online-hint">找到后一键把书目和封面加入书架。现代版权书不会下载全文；需要阅读时，在书详情里上传自己的 EPUB / PDF / TXT。</div>
    <div class="online-search-row">
      <input id="ai-q" placeholder="如：活着 / 三体 / Sapiens / 余华 活着" value="${esc(B.aiQ)}">
      <button class="btn primary" id="ai-search-btn" ${B.aiLoading ? 'disabled' : ''}>${B.aiLoading ? '联网查找中…' : '✨ 查找'}</button>
    </div>
    ${B.aiError ? `<div class="error-box">${esc(B.aiError)}</div>` : ''}
    ${hint ? `<div class="muted online-hint">${hint}</div>` : ''}
    ${B.aiResults.length ? `<div class="online-results">${B.aiResults.map((r, i) => {
      const key = aiKey(r);
      const imported = !!B.aiImported[key];
      const busy = !!B.importing[key];
      return `<div class="online-book">
        ${bookCoverHtml({ title: r.title, cover_url: r.cover_url }, 'book-cover small')}
        <div class="online-book-main">
          <b>${esc(r.title)}</b>
          <div class="muted">${esc(r.author || '未知作者')}${r.published_year ? ` · ${esc(r.published_year)}` : ''}${r.publisher ? ` · ${esc(r.publisher)}` : ''}</div>
          ${r.description ? `<div class="ai-book-desc">${esc(String(r.description).replace(/\s+/g, ' ').slice(0, 160))}${String(r.description).length > 160 ? '…' : ''}</div>` : ''}
          <div class="online-book-actions">
            <span class="chip chip-gray">${esc(r.source_label || (r.source === 'douban' ? '豆瓣' : '网络资料'))}</span>
            ${r.url ? `<a class="link" href="${esc(r.url)}" target="_blank" rel="noopener">查看来源 ↗</a>` : ''}
            <button class="btn small primary" onclick="importAiBook(${i})" ${imported || busy ? 'disabled' : ''}>${imported ? '✓ 已加入' : busy ? '加入中…' : '＋ 加入书架'}</button>
          </div>
        </div>
      </div>`;
    }).join('')}</div>` : (B.aiLoading ? '<div class="muted online-hint">AI 正在联网查书，最多约 30 秒…</div>' : (B.aiQ ? '<div class="muted online-hint">没有找到匹配的书。换个书名，或加上作者（如「余华 活着」）再试。</div>' : '<div class="muted online-hint">输入书名开始查找；中英文都可以。</div>'))}
  </div>`;
}

function toggleAiSearch() {
  const B = appState.booksState;
  B.aiOpen = !B.aiOpen;
  router();
}

async function loadAiSearch(q) {
  const B = appState.booksState;
  const query = String(q || '').trim();
  if (!query) {
    B.aiError = '请输入书名或作者';
    router();
    return;
  }
  B.aiQ = query;
  B.aiLoading = true;
  B.aiError = '';
  B.aiResults = [];
  B.aiImported = {};
  router();
  try {
    const r = await api.get(`/api/books/smart-search?q=${encodeURIComponent(query)}`);
    B.aiResults = r.results || [];
  } catch (e) {
    B.aiError = e.message;
  }
  B.aiLoading = false;
  if (location.hash.startsWith('#/books')) router();
}

function bindAiSearch(container) {
  const q = container.querySelector('#ai-q');
  if (q) {
    q.addEventListener('keydown', (e) => { if (e.key === 'Enter') loadAiSearch(q.value); });
  }
  const s = container.querySelector('#ai-search-btn');
  if (s) s.onclick = () => loadAiSearch(q ? q.value : '');
}

async function importAiBook(idx) {
  const B = appState.booksState;
  const r = B.aiResults[idx];
  if (!r) return;
  const key = aiKey(r);
  if (B.importing[key] || B.aiImported[key]) return;
  B.importing[key] = true;
  router();
  try {
    const res = await api.post('/api/books/smart-import', r);
    B.aiImported[key] = true;
    toast(res.already ? '这本书已经在书架里了' : `已加入《${res.title || r.title}》：书目信息已保存，可补传电子书文件`, 'success');
  } catch (e) {
    toast(e.message, 'error');
  }
  delete B.importing[key];
  await router();
}

/* ============ 导入 / 手动添加 / 编辑 ============ */
function openBookUpload() {
  const m = openModal(`
    <form class="edit-form">
      <h3>导入电子书</h3>
      <div class="book-import-hint">
        支持 <b>EPUB / PDF / TXT</b>；导入后可以在线阅读、划词批注、随手记笔记，并让芒果生成全书总结。没有电子书文件时，也可以按书名联网找公开资料整理（附来源）。
        <br>现代版权书请导入你自己已有的电子书文件；只想先记书目，可以用「✨ AI 找书」。
      </div>
      <div class="form-row"><label>文件<em>*</em></label><input name="file" type="file" accept=".epub,.pdf,.txt,.md" required></div>
      <div class="form-row"><label>书名（选填，默认用文件名 / 书内信息）</label><input name="title" placeholder="留空自动识别"></div>
      <div class="form-row"><label>作者（选填）</label><input name="author"></div>
      <label class="book-auto-check"><input type="checkbox" name="auto" ${appState.booksState.autoSummary ? 'checked' : ''}> 导入后让芒果生成总结（有原文按原文，无文字时联网找资料）</label>
      <div class="modal-actions">
        <button type="button" class="btn" data-close>取消</button>
        <button type="submit" class="btn primary">导入</button>
      </div>
    </form>`, { width: 560 });
  m.el.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData();
    const file = e.target.querySelector('input[name=file]').files[0];
    if (!file) return;
    fd.append('file', file);
    fd.append('title', e.target.querySelector('input[name=title]').value);
    fd.append('author', e.target.querySelector('input[name=author]').value);
    const auto = e.target.querySelector('input[name=auto]').checked;
    appState.booksState.autoSummary = auto;
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = '导入中…';
    try {
      const r = await api.upload('/api/books/upload', fd);
      m.close();
      toast(`《${r.title}》已加入书架（${r.chapters} 章）`, 'success');
      await router();
      if (auto && r.chapters > 0) requestBookSummary(r.id, r.title);
    } catch (err) {
      toast(err.message || '导入失败', 'error');
      btn.disabled = false;
      btn.textContent = '导入';
    }
  });
}

async function openBookForm(id) {
  let old = null;
  if (id) {
    const d = await api.get('/api/books/' + id);
    old = d.book;
  }
  openFormModal({
    title: old ? '编辑书籍信息' : '手动添加一本书',
    width: 560,
    fields: [
      { name: 'title', label: '书名', required: true },
      { name: 'author', label: '作者' },
      { name: 'category', label: '分类 / 标签', placeholder: '如：AI、文学、求职' },
      { name: 'status', label: '状态', type: 'select', options: ['想读', '在读', '读完'] },
      { name: 'rating', label: '评分', type: 'select', options: ['0', '1', '2', '3', '4', '5'], placeholder: '未评分' },
      { name: 'note', label: '备注 / 简介', type: 'textarea', rows: 4 },
    ],
    initial: old || { status: '想读', rating: 0 },
    onSave: async (v) => (id ? api.put('/api/books/' + id, v) : api.post('/api/books', v)),
    onDelete: id ? () => api.del('/api/books/' + id) : null,
    deleteConfirm: '删除这本书？章节、批注和笔记会一并删除（原始文件也会删除）。',
  });
}

function openBookFileUpload(id, title) {
  const m = openModal(`
    <form class="edit-form">
      <h3>上传电子书文件</h3>
      <div class="muted" style="margin-bottom:10px">给《${esc(title || '这本书')}》补传 EPUB / PDF / TXT。书目信息会保留，上传后即可在线阅读、批注和让芒果总结。</div>
      <div class="form-row"><label>文件<em>*</em></label><input name="file" type="file" accept=".epub,.pdf,.txt,.md" required></div>
      <label class="book-auto-check"><input type="checkbox" name="auto" ${appState.booksState.autoSummary ? 'checked' : ''}> 上传后让芒果生成总结（有原文按原文，无文字时联网找资料）</label>
      <div class="modal-actions">
        <button type="button" class="btn" data-close>取消</button>
        <button type="submit" class="btn primary">上传</button>
      </div>
    </form>`, { width: 560 });
  m.el.addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = e.target.querySelector('input[name=file]').files[0];
    if (!file) return;
    const auto = e.target.querySelector('input[name=auto]').checked;
    appState.booksState.autoSummary = auto;
    const fd = new FormData();
    fd.append('file', file);
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = '上传中…';
    try {
      const r = await api.upload(`/api/books/${id}/file`, fd);
      m.close();
      toast(`电子书已上传（${r.chapters} 章）`, 'success');
      await router();
      if (auto && r.chapters > 0) requestBookSummary(id, title || '这本书');
    } catch (err) {
      toast(err.message || '上传失败', 'error');
      btn.disabled = false;
      btn.textContent = '上传';
    }
  });
}

/* ============ 书籍详情 ============ */
function summarySourceBadge(b) {
  if (!b.summary) return '';
  return b.summary_source === 'web'
    ? '<span class="chip chip-cyan">网络资料整理</span>'
    : '<span class="chip chip-green">基于原文</span>';
}

function summarySourcesHtml(sources) {
  if (!Array.isArray(sources) || !sources.length) return '';
  return `<div class="book-summary-sources">
    <span>参考来源</span>
    ${sources.map((s, i) => `<a href="${esc(s.url)}" target="_blank" rel="noopener" title="${esc(s.title || s.url)}">${esc(s.site || s.title || ('来源 ' + (i + 1)))} ↗</a>`).join('')}
  </div>`;
}

function summaryMetaHtml(b) {
  if (!b.summary) return '';
  return `<div class="book-summary-meta">
    ${summarySourceBadge(b)}
    ${b.summary_source === 'web' ? '<span class="muted">根据网络公开资料整理，不是逐章原文总结，引用前请核对来源</span>' : ''}
  </div>`;
}

async function openBookDetail(id) {
  const d = await api.get('/api/books/' + id);
  const b = d.book;
  const notes = d.notes || [];
  const summarizing = appState.booksState.summarizing[b.id];
  const kp = (b.key_points || []).map((k) => `<div class="book-kp-item"><b>${esc(k.title || '')}</b><ul>${(k.points || []).map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>`).join('');
  const notesHtml = notes.slice(-8).reverse().map((n) => {
    const cls = n.type === 'highlight' ? 'hl' : '';
    const label = n.chapter || (d.chapters[n.chapter_index] || {}).title || '全书';
    return `<button type="button" class="book-note-quick ${cls}" onclick="openBookReaderAt(${b.id}, ${n.chapter_index || 0}, ${n.id})">
      <span class="book-note-quick-type">${n.type === 'highlight' ? '批注' : '笔记'}</span>
      <span>${esc((n.quote || n.thought || '').replace(/\s+/g, ' ').slice(0, 70))}${(n.quote || n.thought || '').length > 70 ? '…' : ''}</span>
      <i>${esc(label)}</i>
    </button>`;
  }).join('');

  const m = openModal(`
    <div class="book-detail">
      <div class="book-detail-head">
        ${bookCoverHtml(b, 'book-cover detail')}
        <div class="book-detail-main">
          <h3>${esc(b.title)}</h3>
          <div class="muted">${esc(b.author || '未知作者')}${b.publisher ? ` · ${esc(b.publisher)}` : ''}${b.published_year ? ` · ${esc(b.published_year)}` : ''}${b.language ? ` · ${esc(b.language)}` : ''}${b.format ? ` · ${esc(BOOK_FORMAT_LABEL[b.format] || b.format)}` : ''}${b.rating ? ` · ${bookStars(b.rating)}` : ''}</div>
          <div class="book-tags" style="margin-top:8px">
            <span class="chip ${BOOK_STATUS_CHIP[b.status] || 'chip-gray'}">${esc(b.status)}</span>
            ${b.chapter_count ? `<span class="book-meta-inline">${b.chapter_count} 章</span>` : ''}
            ${b.total_chars ? `<span class="book-meta-inline">${(b.total_chars / 10000).toFixed(1)} 万字</span>` : ''}
          </div>
          ${b.description ? `<div class="book-detail-desc">${esc(b.description)}</div>` : (b.note ? `<div class="book-detail-desc">${esc(b.note)}</div>` : '')}
          ${(b.isbn || b.source_url) ? `<div class="book-detail-meta">
            ${b.isbn ? `<span class="muted">ISBN ${esc(b.isbn)}</span>` : ''}
            ${b.source_url ? `<a class="link" href="${esc(b.source_url)}" target="_blank" rel="noopener">${b.source === 'douban' ? '豆瓣页面 ↗' : '信息来源 ↗'}</a>` : ''}
          </div>` : ''}
          <div class="book-detail-actions">
            <button class="btn primary" id="bd-read" ${(d.chapters.length || b.pdf_url) ? '' : 'disabled'}>${b.last_read_at ? '继续阅读' : '开始阅读'}</button>
            ${b.file_path ? '' : '<button class="btn" id="bd-upload">上传电子书文件</button>'}
            <button class="btn ghost" id="bd-edit">编辑</button>
          </div>
        </div>
      </div>

      <div class="book-detail-section">
        <div class="book-detail-section-head"><b>${b.summary_source === 'web' ? '🌐 网络资料总结' : '🐾 芒果全书总结'}</b>${b.summary ? `<span class="muted">生成于 ${esc(String(b.summary_at || '').slice(0, 16))}</span>` : ''}</div>
        ${b.summary ? `${summaryMetaHtml(b)}
          <div class="md book-summary">${renderMd(b.summary)}</div>${kp ? `<div class="book-kp">${kp}</div>` : ''}
          ${summarySourcesHtml(b.summary_sources)}
          <div class="book-summary-actions">
            <button class="btn small" id="bd-websummary">${b.summary_source === 'web' ? '重新网上找总结' : '🌐 网上找总结'}</button>
            ${(d.chapters.length || 0) ? '<button class="btn small" id="bd-resummarize">基于原文重新总结</button>' : ''}
          </div>`
          : (summarizing ? '<div class="muted">芒果正在生成总结…（原文 1-3 分钟，联网几十秒到几分钟）</div>'
            : (b.summary_error ? `<div class="error-box">${esc(b.summary_error)}</div>` : '<div class="muted">还没有生成总结。</div>') + `<div class="book-summary-actions">
              <button class="btn small primary" id="bd-summarize" ${(d.chapters.length || 0) ? '' : 'disabled'} title="${(d.chapters.length || 0) ? '' : '这本书还没有可提取的文字，请用「网上找总结」'}">${(d.chapters.length || 0) ? '让芒果总结全书' : '原文总结（需先上传电子书）'}</button>
              <button class="btn small" id="bd-websummary">🌐 网上找总结</button>
            </div>`)}
      </div>

      <div class="book-detail-section">
        <div class="book-detail-section-head"><b>我的笔记与批注</b><span class="muted">${notes.length} 条 · 点一条直接跳到原文</span></div>
        ${notesHtml || '<div class="muted">还没有笔记。开始阅读后，选中原文可以写批注，右侧也能随手记笔记。</div>'}
      </div>

      <div class="modal-actions"><button type="button" class="btn" data-close>关闭</button></div>
    </div>`, { width: 780 });

  const read = () => { m.close(); openBookReader(b.id); };
  m.el.querySelector('#bd-read').onclick = read;
  const upBtn = m.el.querySelector('#bd-upload');
  if (upBtn) upBtn.onclick = () => { m.close(); openBookFileUpload(b.id, b.title); };
  m.el.querySelector('#bd-edit').onclick = () => { m.close(); openBookForm(b.id); };
  const sumBtn = m.el.querySelector('#bd-summarize') || m.el.querySelector('#bd-resummarize');
  if (sumBtn) sumBtn.onclick = async () => {
    m.close();
    const r = await requestBookSummary(b.id, b.title, 'text');
    if (r) openBookDetail(b.id); else router();
  };
  const webBtn = m.el.querySelector('#bd-websummary');
  if (webBtn) webBtn.onclick = async () => {
    m.close();
    const r = await requestBookSummary(b.id, b.title, 'web');
    if (r) openBookDetail(b.id); else router();
  };
}

/* ============ AI 全书总结 ============ */
async function requestBookSummary(id, title, mode = 'auto') {
  const B = appState.booksState;
  if (B.summarizing[id]) return null;
  B.summarizing[id] = true;
  const how = mode === 'web' ? '联网查公开资料' : mode === 'text' ? '读原文' : '生成';
  toast(`芒果正在${how}并整理《${title}》的总结，可能需要几十秒到几分钟…`, 'info');
  try {
    const r = await api.post(`/api/books/${id}/summarize`, { mode });
    const label = r.mode === 'web' ? '网络资料总结' : '全书总结';
    toast(`《${title}》的${label}已生成${r.mode === 'web' ? '（非原文，引用请核对来源）' : ''}`, 'success');
    return r;
  } catch (e) {
    toast('总结失败：' + e.message, 'error');
    return null;
  } finally {
    delete B.summarizing[id];
    if (appState.readerState.bookId === id) {
      try {
        const d = await api.get('/api/books/' + id);
        appState.readerState.book = d.book;
        const btn = document.getElementById('reader-summary-btn');
        if (btn) btn.textContent = d.book.summary ? (d.book.summary_source === 'web' ? '🌐 网络总结' : '🐾 全书总结') : '🐾 AI 总结';
      } catch (e) { /* 忽略 */ }
    }
    if (location.hash.startsWith('#/books')) router();
  }
}

/* ============ 阅读器 ============ */
function openBookReader(id) { location.hash = '#/book/' + id; }
function openBookReaderAt(id, ch, noteId) {
  location.hash = `#/book/${id}?ch=${Number(ch) || 0}${noteId ? `&note=${noteId}` : ''}`;
}
function backToShelf() { location.hash = '#/books'; }

async function renderBookReader(container, id) {
  const R = appState.readerState;
  const d = await api.get('/api/books/' + id);
  const { book, chapters, notes } = d;
  Object.assign(R, {
    bookId: id, book, chapters: chapters || [], notes: notes || [],
    selection: null, pendingNoteId: null, summaryLoading: false, restoreScroll: null,
    fontSize: Number(localStorage.getItem(READER_FONT_KEY)) || 18,
  });
  const params = new URLSearchParams((location.hash.split('?')[1] || ''));
  if (params.get('note')) R.pendingNoteId = Number(params.get('note'));
  let start = params.get('ch') !== null ? Number(params.get('ch')) : null;
  if (start == null) {
    try {
      const pos = JSON.parse(book.reading_position || '{}');
      if (Number.isInteger(pos.ch)) { start = pos.ch; R.restoreScroll = Number(pos.scroll) || 0; }
    } catch (e) { /* 忽略 */ }
  }
  if (R.pendingNoteId) {
    const n = R.notes.find((x) => x.id === R.pendingNoteId);
    if (n) start = n.chapter_index || 0;
  }
  R.current = start != null && R.chapters[start] ? start : 0;
  R.mode = book.format === 'pdf' && book.pdf_url ? 'pdf' : 'text';

  container.innerHTML = readerHtml(book, R.chapters);
  bindReaderEvents(container);
  renderReaderNotes();
  if (!R.chapters.length && !book.pdf_url) {
    const box = container.querySelector('#reader-content');
    if (box) box.innerHTML = '<div class="empty" style="padding:40px">这本书还没有电子书文件。回到书架，在书详情里点「上传电子书文件」即可开始阅读。</div>';
    return;
  }
  loadChapter(R.current, { restoreScroll: R.restoreScroll });
}

function readerHtml(book, chapters) {
  const toc = chapters.map((c) => `<option value="${c.idx}">${esc(c.title)}</option>`).join('');
  return `<div class="reader-shell">
    <div class="reader-topbar">
      <button class="btn small" id="reader-back">← 书架</button>
      <div class="reader-book-title"><b>${esc(book.title)}</b><span>${esc(book.author || '')}</span></div>
      <span class="spacer"></span>
      <select id="reader-toc" title="目录" ${chapters.length ? '' : 'disabled'}>${toc || '<option>暂无章节</option>'}</select>
      <button class="btn small" id="reader-search-btn" ${chapters.length ? '' : 'disabled'}>🔍 书内搜索</button>
      <button class="btn small" id="reader-summary-btn">${book.summary ? (book.summary_source === 'web' ? '🌐 网络总结' : '🐾 全书总结') : '🐾 AI 总结'}</button>
      <button class="btn small" id="reader-font-minus" title="缩小字号">A-</button>
      <button class="btn small" id="reader-font-plus" title="放大字号">A+</button>
      ${book.pdf_url && chapters.length ? `<button class="btn small" id="reader-mode-btn">${book.format === 'pdf' ? '切换文字模式' : ''}</button>` : ''}
    </div>
    <div class="reader-body">
      <div class="reader-main">
        <div class="reader-chapter-title" id="reader-chapter-title"></div>
        <div id="reader-content">
          <div id="reader-text-view">
            <iframe id="reader-frame" sandbox="allow-same-origin" title="正文"></iframe>
            <div class="reader-pager">
              <button class="btn small" id="reader-prev">← 上一章</button>
              <span class="muted" id="reader-progress"></span>
              <button class="btn small" id="reader-next">下一章 →</button>
            </div>
          </div>
          <div id="reader-pdf-view" class="hidden">
            ${book.pdf_url ? `<iframe id="reader-pdf" src="${esc(book.pdf_url)}" title="PDF"></iframe>
            <div class="reader-pdf-note">原版 PDF 阅读模式（浏览器内置阅读器）${chapters.length ? '；切到「文字模式」可以划词做原文批注。' : ''}</div>` : ''}
          </div>
        </div>
      </div>
      <aside class="reader-side">
        <div class="reader-side-head">
          <button type="button" class="reader-tab active" data-tab="highlight">原文批注 <span id="reader-hl-count">0</span></button>
          <button type="button" class="reader-tab" data-tab="note">随篇笔记 <span id="reader-note-count">0</span></button>
        </div>
        <div class="reader-note-list" id="reader-note-list"></div>
        <div class="reader-side-foot">
          <button class="btn small primary" id="reader-add-note">＋ 写随篇笔记</button>
          <div class="muted reader-side-hint">选中正文文字可以添加原文批注；点笔记可直接跳回原文。</div>
        </div>
      </aside>
    </div>
    <div class="reader-select-bar hidden" id="reader-select-bar">
      <span>已选中 <b id="reader-sel-len">0</b> 字</span>
      <button class="btn small primary" id="reader-sel-annotate">添加批注</button>
      <button class="btn small" id="reader-sel-cancel">取消</button>
    </div>
  </div>`;
}

function bindReaderEvents(container) {
  const R = appState.readerState;
  const $ = (s) => container.querySelector(s);
  $('#reader-back').onclick = () => { saveReaderProgress(true); backToShelf(); };
  $('#reader-toc').onchange = (e) => switchChapter(Number(e.target.value));
  $('#reader-prev').onclick = () => switchChapter(R.current - 1);
  $('#reader-next').onclick = () => switchChapter(R.current + 1);
  $('#reader-font-minus').onclick = () => changeReaderFont(-1);
  $('#reader-font-plus').onclick = () => changeReaderFont(1);
  $('#reader-search-btn').onclick = openBookSearch;
  $('#reader-summary-btn').onclick = openReaderSummary;
  const modeBtn = $('#reader-mode-btn');
  if (modeBtn) modeBtn.onclick = () => {
    R.mode = R.mode === 'pdf' ? 'text' : 'pdf';
    applyReaderMode();
    if (R.mode === 'text') loadChapter(R.current);
  };
  container.querySelectorAll('.reader-tab').forEach((b) => {
    b.onclick = () => { R.sideTab = b.dataset.tab; renderReaderNotes(); };
  });
  $('#reader-add-note').onclick = () => openReaderNoteModal(null);
  $('#reader-sel-annotate').onclick = openHighlightModal;
  $('#reader-sel-cancel').onclick = () => { hideSelectionBar(); clearFrameSelection(); };
  const list = $('#reader-note-list');
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (btn) {
      e.stopPropagation();
      const n = R.notes.find((x) => x.id === Number(btn.dataset.id));
      if (!n) return;
      if (btn.dataset.act === 'edit') openReaderNoteModal(n);
      return;
    }
    const item = e.target.closest('.r-note');
    if (item) {
      const n = R.notes.find((x) => x.id === Number(item.dataset.noteId));
      if (n) jumpToNote(n);
    }
  });
  applyReaderMode();
}

function applyReaderMode() {
  const R = appState.readerState;
  const textView = document.getElementById('reader-text-view');
  const pdfView = document.getElementById('reader-pdf-view');
  const modeBtn = document.getElementById('reader-mode-btn');
  if (!textView || !pdfView) return;
  const isPdf = R.mode === 'pdf';
  textView.classList.toggle('hidden', isPdf);
  pdfView.classList.toggle('hidden', !isPdf);
  if (modeBtn) modeBtn.textContent = isPdf ? '切换文字模式' : '切换 PDF 原版';
  const title = document.getElementById('reader-chapter-title');
  if (isPdf) {
    if (title) title.textContent = 'PDF 原版';
    const pager = document.querySelector('.reader-pager');
    if (pager) pager.classList.add('hidden');
  } else {
    if (title) title.textContent = (R.chapters[R.current] || {}).title || '';
    const pager = document.querySelector('.reader-pager');
    if (pager) pager.classList.remove('hidden');
  }
}

function loadChapter(idx, opts = {}) {
  const R = appState.readerState;
  if (R.mode === 'pdf') { applyReaderMode(); return; }
  if (!R.chapters.length) return;
  const i = Math.max(0, Math.min(R.chapters.length - 1, idx));
  R.current = i;
  const ch = R.chapters[i];
  const title = document.getElementById('reader-chapter-title');
  if (title) title.textContent = ch.title || `第 ${i + 1} 章`;
  const toc = document.getElementById('reader-toc');
  if (toc) toc.value = String(i);
  const prog = document.getElementById('reader-progress');
  if (prog) prog.textContent = `第 ${i + 1} / ${R.chapters.length} 章`;
  const prev = document.getElementById('reader-prev');
  const next = document.getElementById('reader-next');
  if (prev) prev.disabled = i <= 0;
  if (next) next.disabled = i >= R.chapters.length - 1;
  const frame = document.getElementById('reader-frame');
  if (!frame) return;
  R.restoreScroll = opts.restoreScroll != null ? opts.restoreScroll : null;
  R.pendingSearch = opts.search || null;
  frame.onload = () => setupReaderFrame(frame);
  frame.src = ch.file_url + (ch.file_url.includes('?') ? '&' : '?') + 'v=' + Date.now();
  renderReaderNotes();
  if (R.mode === 'pdf') applyReaderMode();
}

function switchChapter(idx, opts = {}) {
  const R = appState.readerState;
  if (R.mode === 'pdf') R.mode = 'text';
  saveReaderProgress(true);
  loadChapter(idx, opts);
  applyReaderMode();
}

function setupReaderFrame(frame) {
  const R = appState.readerState;
  let doc = null;
  try { doc = frame.contentDocument; } catch (e) { doc = null; }
  if (!doc || !doc.body) return;
  let style = doc.getElementById('reader-style');
  if (!style) { style = doc.createElement('style'); style.id = 'reader-style'; (doc.head || doc.documentElement).appendChild(style); }
  style.textContent = `
    html,body{background:#fff}
    body{font-family:"Noto Serif SC","Songti SC","SimSun",serif;font-size:${R.fontSize}px !important;line-height:1.85;color:#2a2f38;max-width:860px;margin:0 auto;padding:24px 34px 80px;box-sizing:border-box;word-break:break-word}
    p{margin:0 0 1em}
    img{max-width:100%;height:auto}
    mark.bk-hl{background:#ffe9a8;border-bottom:2px solid #e8b53a;padding:1px 0;cursor:pointer;border-radius:2px}
    mark.bk-hl.active{background:#ffd55e}
    mark.bk-search{background:#cfe3ff;border-bottom:2px solid #5b8def}
  `;
  applyHighlights(doc);
  if (R.pendingSearch) { scrollToSearch(doc, R.pendingSearch); R.pendingSearch = null; }
  doc.addEventListener('mouseup', () => setTimeout(captureReaderSelection, 15));
  doc.addEventListener('click', onReaderFrameClick);
  try {
    frame.contentWindow.addEventListener('scroll', () => scheduleProgressSave());
  } catch (e) { /* 忽略 */ }
  if (R.restoreScroll != null) {
    try { frame.contentWindow.scrollTo(0, R.restoreScroll); } catch (e) { /* 忽略 */ }
    R.restoreScroll = null;
  }
  if (R.pendingNoteId) {
    const mark = doc.querySelector(`mark.bk-hl[data-note-id="${R.pendingNoteId}"]`);
    if (mark) {
      mark.classList.add('active');
      setTimeout(() => { try { mark.scrollIntoView({ block: 'center' }); } catch (e) { /* 忽略 */ } }, 80);
    }
    R.pendingNoteId = null;
  }
  setTimeout(() => saveReaderProgress(), 1200);
}

function clearFrameSelection() {
  try { const f = document.getElementById('reader-frame'); if (f && f.contentWindow) f.contentWindow.getSelection().removeAllRanges(); } catch (e) { /* 忽略 */ }
}

function captureReaderSelection() {
  const R = appState.readerState;
  const frame = document.getElementById('reader-frame');
  if (!frame || R.mode !== 'text') return;
  let win, doc;
  try { win = frame.contentWindow; doc = frame.contentDocument; } catch (e) { return; }
  if (!doc) return;
  const sel = win.getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) { hideSelectionBar(); return; }
  const quote = sel.toString().replace(/\s+/g, ' ').trim();
  if (!quote) { hideSelectionBar(); return; }
  const range = sel.getRangeAt(0);
  let start = 0, end = 0;
  try {
    const pre = doc.createRange();
    pre.selectNodeContents(doc.body);
    pre.setEnd(range.startContainer, range.startOffset);
    start = pre.toString().length;
    end = start + range.toString().length;
  } catch (e) { return; }
  R.selection = {
    start, end, quote: quote.slice(0, 500),
    chapter_index: R.current,
    chapter: (R.chapters[R.current] || {}).title || '',
  };
  const bar = document.getElementById('reader-select-bar');
  const len = document.getElementById('reader-sel-len');
  if (len) len.textContent = String(quote.length);
  if (bar) bar.classList.remove('hidden');
}

function hideSelectionBar() {
  const bar = document.getElementById('reader-select-bar');
  if (bar) bar.classList.add('hidden');
}

function onReaderFrameClick(e) {
  const R = appState.readerState;
  const mark = e.target.closest('mark.bk-hl');
  if (mark) {
    const n = R.notes.find((x) => x.id === Number(mark.dataset.noteId));
    if (n) selectReaderNote(n);
    return;
  }
  const a = e.target.closest('a[href]');
  if (!a) return;
  const href = a.getAttribute('href') || '';
  if (!href || href.startsWith('#')) return;
  e.preventDefault();
  if (/^https?:/i.test(href)) {
    const url = a.href;
    if (isStandaloneApp()) api.post('/api/open-url', { url }).catch(() => window.open(url, '_blank', 'noopener'));
    else window.open(url, '_blank', 'noopener');
    return;
  }
  // 书内链接：能在章节列表里找到就跳转
  try {
    const abs = new URL(a.href, a.baseURI || document.location.href);
    const idx = R.chapters.findIndex((c) => c.file_url && new URL(c.file_url, location.origin).pathname === abs.pathname);
    if (idx >= 0) switchChapter(idx);
    else toast('这个书内链接暂时打不开，请用上方目录切换章节', 'info');
  } catch (err) { /* 忽略 */ }
}

function selectReaderNote(n) {
  appState.readerState.sideTab = n.type === 'highlight' ? 'highlight' : 'note';
  renderReaderNotes();
  const el = document.querySelector(`.r-note[data-note-id="${n.id}"]`);
  if (el) { el.classList.add('active'); el.scrollIntoView({ block: 'nearest' }); }
}

function jumpToNote(n) {
  const R = appState.readerState;
  const ch = Number.isInteger(n.chapter_index) ? n.chapter_index : 0;
  if (R.mode === 'pdf') R.mode = 'text';
  R.sideTab = n.type === 'highlight' ? 'highlight' : 'note';
  R.pendingNoteId = n.type === 'highlight' ? n.id : null;
  if (R.current === ch) {
    if (R.mode === 'text') loadChapter(ch, { restoreScroll: null });
    renderReaderNotes();
  } else {
    switchChapter(ch);
  }
}

function applyHighlights(doc) {
  const R = appState.readerState;
  clearHighlights(doc);
  const notes = R.notes.filter((n) => n.type === 'highlight' && Number(n.chapter_index) === R.current);
  for (const n of notes) {
    let loc = null;
    try { loc = JSON.parse(n.locator || '{}'); } catch (e) { loc = null; }
    if (!loc || !Number.isInteger(loc.start) || !Number.isInteger(loc.end) || loc.end <= loc.start) continue;
    wrapTextRange(doc, loc.start, loc.end, n.id);
  }
}

function clearHighlights(doc) {
  const marks = [...doc.querySelectorAll('mark.bk-hl, mark.bk-search')];
  for (const m of marks) {
    const parent = m.parentNode;
    while (m.firstChild) parent.insertBefore(m.firstChild, m);
    parent.removeChild(m);
  }
  if (doc.body) doc.body.normalize();
}

function wrapTextRange(doc, start, end, noteId) {
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
  const nodes = [];
  let pos = 0, node;
  while ((node = walker.nextNode())) {
    const len = node.nodeValue.length;
    nodes.push({ node, start: pos, end: pos + len });
    pos += len;
  }
  for (let i = nodes.length - 1; i >= 0; i--) {
    const { node: t, start: s, end: e } = nodes[i];
    if (e <= start || s >= end) continue;
    const localStart = Math.max(0, start - s);
    const localEnd = Math.min(e - s, end - s);
    if (localEnd <= localStart) continue;
    const textLen = t.nodeValue.length;
    if (localEnd < textLen) t.splitText(localEnd);
    const mid = localStart > 0 ? t.splitText(localStart) : t;
    const mark = doc.createElement('mark');
    mark.className = 'bk-hl';
    mark.dataset.noteId = String(noteId);
    mark.textContent = mid.nodeValue;
    mid.parentNode.replaceChild(mark, mid);
  }
}

function scrollToSearch(doc, q) {
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
  let node;
  const ql = String(q || '').toLowerCase();
  while ((node = walker.nextNode())) {
    const i = node.nodeValue.toLowerCase().indexOf(ql);
    if (i < 0) continue;
    const range = doc.createRange();
    range.setStart(node, i);
    range.setEnd(node, i + q.length);
    const mark = doc.createElement('mark');
    mark.className = 'bk-search';
    mark.textContent = range.toString();
    range.deleteContents();
    range.insertNode(mark);
    try { mark.scrollIntoView({ block: 'center' }); } catch (e) { /* 忽略 */ }
    break;
  }
}

function changeReaderFont(delta) {
  const R = appState.readerState;
  R.fontSize = Math.max(14, Math.min(28, R.fontSize + delta));
  localStorage.setItem(READER_FONT_KEY, String(R.fontSize));
  try {
    const f = document.getElementById('reader-frame');
    const doc = f && f.contentDocument;
    const style = doc && doc.getElementById('reader-style');
    if (style) style.textContent = style.textContent.replace(/font-size:\s*\d+px\s*!important/, `font-size:${R.fontSize}px !important`);
  } catch (e) { /* 忽略 */ }
}

let readerSaveTimer = null;
function scheduleProgressSave() {
  clearTimeout(readerSaveTimer);
  readerSaveTimer = setTimeout(() => saveReaderProgress(), 800);
}

async function saveReaderProgress(immediate) {
  const R = appState.readerState;
  if (!R.bookId) return;
  let scroll = 0;
  try {
    const f = document.getElementById('reader-frame');
    if (R.mode === 'text' && f && f.contentWindow) scroll = Math.round(f.contentWindow.scrollY || 0);
  } catch (e) { /* 忽略 */ }
  const position = { ch: R.current, scroll, mode: R.mode };
  try { await api.post(`/api/books/${R.bookId}/progress`, { position }); } catch (e) { /* 静默 */ }
}

/* ---------- 阅读器右侧笔记 ---------- */
function renderReaderNotes() {
  const R = appState.readerState;
  const list = document.getElementById('reader-note-list');
  if (!list) return;
  const hls = R.notes.filter((n) => n.type === 'highlight');
  const notes = R.notes.filter((n) => n.type !== 'highlight');
  document.querySelectorAll('.reader-tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === R.sideTab));
  const hlc = document.getElementById('reader-hl-count');
  const nc = document.getElementById('reader-note-count');
  if (hlc) hlc.textContent = String(hls.length);
  if (nc) nc.textContent = String(notes.length);
  const items = R.sideTab === 'highlight' ? hls : notes;
  list.innerHTML = items.length ? items.map(readerNoteItem).join('')
    : `<div class="reader-note-empty">${R.sideTab === 'highlight' ? '还没有原文批注。选中正文文字，点「添加批注」即可。' : '还没有随篇笔记。点下方「＋ 写随篇笔记」记一条。'}</div>`;
  const active = document.querySelector('.r-note.active');
  if (active) active.classList.remove('active');
}

function readerNoteItem(n) {
  const R = appState.readerState;
  const isHl = n.type === 'highlight';
  const chapter = n.chapter || (R.chapters[n.chapter_index] || {}).title || '';
  return `<div class="r-note ${isHl ? 'hl' : ''}" data-note-id="${n.id}">
    ${isHl ? `<div class="r-note-quote">“${esc(String(n.quote || '').slice(0, 140))}”</div>` : ''}
    <div class="r-note-thought">${n.thought ? esc(n.thought) : '<span class="muted">（未写批注）</span>'}</div>
    <div class="r-note-meta">
      <span>${esc(chapter)}${n.page ? ` · 第 ${esc(n.page)} 页` : ''}</span>
      <span class="spacer"></span>
      <button class="btn small ghost" data-act="edit" data-id="${n.id}">编辑</button>
    </div>
  </div>`;
}

function openReaderNoteModal(editNote) {
  const R = appState.readerState;
  const isEdit = !!editNote;
  const m = openModal(`
    <form class="edit-form">
      <h3>${isEdit ? '编辑笔记' : '写随篇笔记'}</h3>
      <div class="muted" style="margin-bottom:8px">${esc((R.chapters[editNote ? editNote.chapter_index : R.current] || {}).title || '')}</div>
      <div class="form-row"><label>笔记内容<em>*</em></label><textarea name="thought" rows="6" required placeholder="此刻的想法、疑问、联想…">${esc(isEdit ? editNote.thought : '')}</textarea></div>
      <div class="modal-actions">
        ${isEdit ? '<button type="button" class="btn danger modal-delete" id="r-note-del">删除</button>' : ''}
        <button type="button" class="btn" data-close>取消</button>
        <button type="submit" class="btn primary">保存</button>
      </div>
    </form>`, { width: 520 });
  const delBtn = m.el.querySelector('#r-note-del');
  if (delBtn) delBtn.onclick = async () => {
    if (!(await confirmDialog('删除这条笔记？'))) return;
    delBtn.disabled = true;
    try {
      await api.del('/api/books/notes/' + editNote.id);
      const R = appState.readerState;
      R.notes = R.notes.filter((x) => x.id !== editNote.id);
      m.close();
      renderReaderNotes();
      try { applyHighlights(document.getElementById('reader-frame').contentDocument); } catch (e) { /* 忽略 */ }
      toast('已删除', 'success');
    } catch (err) {
      toast(err.message, 'error');
      delBtn.disabled = false;
    }
  };
  m.el.addEventListener('submit', async (e) => {
    e.preventDefault();
    const thought = e.target.querySelector('textarea[name=thought]').value.trim();
    if (!thought) return;
    try {
      if (isEdit) {
        await api.put('/api/books/notes/' + editNote.id, { thought });
        editNote.thought = thought;
      } else {
        const ch = R.chapters[R.current] || {};
        const r = await api.post(`/api/books/${R.bookId}/notes`, {
          type: 'note', thought, chapter_index: R.current, chapter: ch.title || '',
        });
        R.notes.push({ id: r.id, type: 'note', thought, chapter_index: R.current, chapter: ch.title || '', quote: '', locator: '', page: '' });
      }
      m.close();
      renderReaderNotes();
      toast('笔记已保存', 'success');
    } catch (err) { toast(err.message, 'error'); }
  });
}

function openHighlightModal() {
  const R = appState.readerState;
  const sel = R.selection;
  if (!sel) return;
  const m = openModal(`
    <form class="edit-form">
      <h3>添加原文批注</h3>
      <div class="book-quote-box">“${esc(sel.quote)}”</div>
      <div class="form-row"><label>批注（选填）</label><textarea name="thought" rows="5" placeholder="写下你的理解、疑问或联想…"></textarea></div>
      <div class="modal-actions">
        <button type="button" class="btn" data-close>取消</button>
        <button type="submit" class="btn primary">保存批注</button>
      </div>
    </form>`, { width: 560 });
  m.el.addEventListener('submit', async (e) => {
    e.preventDefault();
    const thought = e.target.querySelector('textarea[name=thought]').value.trim();
    try {
      const r = await api.post(`/api/books/${R.bookId}/notes`, {
        type: 'highlight', quote: sel.quote, thought,
        chapter_index: sel.chapter_index, chapter: sel.chapter,
        locator: { start: sel.start, end: sel.end },
      });
      R.notes.push({
        id: r.id, type: 'highlight', quote: sel.quote, thought,
        chapter_index: sel.chapter_index, chapter: sel.chapter,
        locator: JSON.stringify({ start: sel.start, end: sel.end }), page: '',
      });
      m.close();
      hideSelectionBar();
      clearFrameSelection();
      R.selection = null;
      renderReaderNotes();
      try { applyHighlights(document.getElementById('reader-frame').contentDocument); } catch (err) { /* 忽略 */ }
      toast('批注已保存', 'success');
    } catch (err) { toast(err.message, 'error'); }
  });
}

/* ---------- 阅读器：总结 / 搜索 ---------- */
async function openReaderSummary() {
  const R = appState.readerState;
  if (R.book && R.book.summary) return showSummaryModal(R.book);
  if (appState.booksState.summarizing[R.bookId]) { toast('芒果还在读这本书，稍等…', 'info'); return; }
  const btn = document.getElementById('reader-summary-btn');
  if (btn) { btn.disabled = true; btn.textContent = '芒果在整理…'; }
  const r = await requestBookSummary(R.bookId, (R.book && R.book.title) || '这本书');
  if (btn) { btn.disabled = false; btn.textContent = r ? (r.mode === 'web' ? '🌐 网络总结' : '🐾 全书总结') : '🐾 AI 总结'; }
  if (r) { try { const d = await api.get('/api/books/' + R.bookId); R.book = d.book; } catch (e) { /* 忽略 */ } showSummaryModal(R.book); }
}

function showSummaryModal(book) {
  const kp = (book.key_points || []).map((k) => `<div class="book-kp-item"><b>${esc(k.title || '')}</b><ul>${(k.points || []).map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>`).join('');
  const web = book.summary_source === 'web';
  openModal(`<div class="book-summary-modal">
    <h3>${web ? '🌐' : '🐾'} 《${esc(book.title)}》${web ? '网络资料总结' : '全书总结'}</h3>
    <div class="muted" style="margin-bottom:10px">${esc(book.author || '')}${book.summary_at ? ' · 生成于 ' + esc(String(book.summary_at).slice(0, 16)) : ''}</div>
    ${summaryMetaHtml(book)}
    <div class="md book-summary">${renderMd(book.summary || '')}</div>
    ${kp ? `<div class="book-kp">${kp}</div>` : ''}
    ${summarySourcesHtml(book.summary_sources)}
    <div class="modal-actions"><button type="button" class="btn" data-close>关闭</button></div>
  </div>`, { width: 760 });
}

function openBookSearch() {
  const R = appState.readerState;
  const m = openModal(`<div>
    <h3>书内搜索</h3>
    <div class="ai-search-row" style="margin-top:10px">
      <input id="bs-q" placeholder="输入关键词，回车搜索">
      <button class="btn primary" id="bs-go">搜索</button>
    </div>
    <div id="bs-res" class="reader-search-results"></div>
    <div class="modal-actions"><button type="button" class="btn" data-close>关闭</button></div>
  </div>`, { width: 640 });
  const input = m.el.querySelector('#bs-q');
  const run = async () => {
    const q = input.value.trim();
    if (!q) return;
    const box = m.el.querySelector('#bs-res');
    box.innerHTML = '<div class="muted">搜索中…</div>';
    try {
      const r = await api.get(`/api/books/${R.bookId}/search?q=${encodeURIComponent(q)}`);
      box.innerHTML = r.results.length ? r.results.map((x) => `<button type="button" class="reader-search-hit" data-idx="${x.idx}" data-q="${esc(q)}">
        <b>${esc(x.title)}</b><span>${esc(x.snippet)}</span></button>`).join('') : '<div class="muted">没有找到。</div>';
      box.querySelectorAll('.reader-search-hit').forEach((btn) => {
        btn.onclick = () => {
          m.close();
          if (R.mode === 'pdf') R.mode = 'text';
          switchChapter(Number(btn.dataset.idx), { search: btn.dataset.q });
          applyReaderMode();
        };
      });
    } catch (e) { box.innerHTML = `<div class="error-box">${esc(e.message)}</div>`; }
  };
  m.el.querySelector('#bs-go').onclick = run;
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });
  setTimeout(() => input.focus(), 80);
}
