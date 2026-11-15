// 未上线板块的占位页
function renderPlaceholder(title, badge, features) {
  mainEl.innerHTML = `
    <div class="page-head"><h2>${esc(title)} <span class="badge">${esc(badge)}</span></h2></div>
    <div class="card placeholder-card">
      <div class="muted">该板块尚未上线，规划中的功能：</div>
      <ul>${features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
    </div>`;
}
