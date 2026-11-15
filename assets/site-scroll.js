/* 在个人网站 / 作品集 / 案例页之间返回时恢复原滚动位置。
   只记录同源、非新标签页的页面跳转；hash 页内跳转不处理。 */
(function () {
  'use strict';
  var MAP_KEY = 'kb-scroll-map-v1';
  var RETURN_KEY = 'kb-scroll-return-v1';

  function norm(path) {
    return String(path || '').replace(/\/index\.html$/, '/');
  }
  function here() { return norm(location.pathname); }
  function readMap() {
    try { return JSON.parse(sessionStorage.getItem(MAP_KEY) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function saveMap(map) {
    try { sessionStorage.setItem(MAP_KEY, JSON.stringify(map)); } catch (e) { /* 忽略 */ }
  }
  function saveScroll(y) {
    var map = readMap();
    map[here()] = Math.max(0, Math.round(y || 0));
    saveMap(map);
  }

  document.addEventListener('click', function (event) {
    var a = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    var url;
    try { url = new URL(a.getAttribute('href'), location.href); } catch (e) { return; }
    if (url.origin !== location.origin) return;
    if (norm(url.pathname) === here()) return;
    saveScroll(window.scrollY);
    if (a.dataset && a.dataset.return === '1') {
      try { sessionStorage.setItem(RETURN_KEY, norm(url.pathname)); } catch (e) { /* 忽略 */ }
    }
  }, true);

  function restore() {
    var target;
    try { target = sessionStorage.getItem(RETURN_KEY); } catch (e) { return; }
    if (!target || target !== here()) return;
    try { sessionStorage.removeItem(RETURN_KEY); } catch (e) { /* 忽略 */ }
    var y = readMap()[here()];
    if (!Number.isFinite(y)) return;
    var apply = function () { window.scrollTo(0, y); };
    requestAnimationFrame(function () {
      apply();
      setTimeout(apply, 120);
    });
  }

  if (document.readyState === 'complete') restore();
  else window.addEventListener('load', restore);
})();
