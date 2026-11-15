// API 请求封装。后端约定: 成功 {ok:true,...} / 失败 {ok:false,error}
async function apiFetch(url, options) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    const here = location.pathname + location.search + location.hash;
    location.href = '/login?next=' + encodeURIComponent(here || '/');
    throw new Error('登录已过期，请重新登录');
  }
  let data;
  try { data = await res.json(); } catch (e) { data = { ok: false, error: '服务器返回异常' }; }
  if (!res.ok || data.ok === false) throw new Error(data.error || '请求失败 (' + res.status + ')');
  return data;
}

const api = {
  get: (u) => apiFetch(u),
  post: (u, body) => apiFetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) }),
  put: (u, body) => apiFetch(u, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) }),
  del: (u) => apiFetch(u, { method: 'DELETE' }),
  upload: (u, formData, method = 'POST') => apiFetch(u, { method, body: formData }),
};
