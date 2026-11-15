// 轻量 Markdown 渲染（用于答案/笔记正文）：代码块、行内代码、加粗、链接、标题、列表
function renderMd(text) {
  if (!text) return '';
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s) => esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  const lines = String(text).replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let inCode = false, codeBuf = [], list = null;
  const closeList = () => { if (list) { html.push(`</${list}>`); list = null; } };
  const openList = (t) => { if (list !== t) { closeList(); html.push(`<${t}>`); list = t; } };
  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      if (inCode) { html.push('<pre><code>' + esc(codeBuf.join('\n')) + '</code></pre>'); codeBuf = []; inCode = false; }
      else { closeList(); inCode = true; }
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }
    const t = line.trim();
    if (!t) { closeList(); continue; }
    const hd = t.match(/^(#{1,4})\s+(.*)/);
    if (hd) { closeList(); html.push(`<h${hd[1].length}>` + inline(hd[2]) + `</h${hd[1].length}>`); continue; }
    const ul = t.match(/^[-*+]\s+(.*)/);
    if (ul) { openList('ul'); html.push('<li>' + inline(ul[1]) + '</li>'); continue; }
    const ol = t.match(/^\d+[.、)]\s*(.*)/);
    if (ol) { openList('ol'); html.push('<li>' + inline(ol[1]) + '</li>'); continue; }
    closeList();
    html.push('<p>' + inline(t) + '</p>');
  }
  if (inCode) html.push('<pre><code>' + esc(codeBuf.join('\n')) + '</code></pre>');
  closeList();
  return html.join('');
}
