/* Polaris store — 本地优先数据层（localStorage 持久化） */
(function () {
  'use strict';

  const KEY = 'polaris-mvp-v0.1';
  const DAYMS = 86400000;
  const TODAY = new Date(2026, 10, 12); // 演示基准日 2026-11-12

  const MEMBERS = [
    { id: 'Al', name: 'Alex', color: '#2E5CE6' },
    { id: 'Ly', name: '林悦', color: '#8A6A12' },
    { id: 'Zc', name: '周晨', color: '#47598F' },
    { id: 'Wm', name: '王铭', color: '#0E7490' }
  ];

  function seed() {
    return {
      user: 'Al',
      members: MEMBERS,
      projects: [
        { id: 'p1', name: 'Polaris v1.0', color: '#2E5CE6', start: '2026-10-26', end: '2026-12-08' },
        { id: 'p2', name: '官网改版', color: '#C9A227', start: '2026-11-02', end: '2026-11-28' },
        { id: 'p3', name: '数据迁移', color: '#7C8BB0', start: '2026-10-30', end: '2026-11-20' },
        { id: 'p4', name: '品牌物料', color: '#0E7490', start: '2026-11-10', end: '2026-12-15' }
      ],
      tasks: [
        /* ---- p1 Polaris v1.0（排期表数据，阶段分三组） ---- */
        { id: 't101', pid: 'p1', phase: '设计阶段', title: '需求梳理与范围确认', owner: 'Al', status: 'done', pri: 'p1', start: '2026-10-26', end: '2026-10-30', progress: 100, doneAt: '2026-10-30', desc: '收敛 MVP 范围：项目 / 任务 / 看板 / 排期表与本地数据层，明确 v0.2 与 v1.0 的边界。', deps: [], subs: [] },
        { id: 't102', pid: 'p1', phase: '设计阶段', title: '交互原型设计', owner: 'Al', status: 'done', pri: 'p1', start: '2026-10-31', end: '2026-11-06', progress: 100, doneAt: '2026-11-06', desc: '完成五个模块的可交互原型，重点验证排期表拖拽与依赖冲突的表达。', deps: ['t101'], subs: [{ t: '工作台布局', d: true }, { t: '看板交互', d: true }, { t: '排期表交互', d: true }] },
        { id: 't103', pid: 'p1', phase: '设计阶段', title: '视觉设计与走查', owner: 'Ly', status: 'doing', pri: 'p0', start: '2026-11-05', end: '2026-11-12', progress: 70, desc: '按 Mac 端软件视觉风格输出高保真稿，含色彩、字阶、间距与组件状态。', deps: ['t102'], subs: [{ t: '设计规范初版', d: true }, { t: '高保真稿', d: false }] },
        { id: 't104', pid: 'p1', phase: '开发阶段', title: '前端框架搭建', owner: 'Zc', status: 'done', pri: 'p1', start: '2026-11-07', end: '2026-11-10', progress: 100, doneAt: '2026-11-10', desc: '搭建应用外壳、路由与本地数据层，跑通看板与排期表的数据联动。', deps: ['t102'], subs: [] },
        { id: 't105', pid: 'p1', phase: '开发阶段', title: '核心功能开发', owner: 'Zc', status: 'doing', pri: 'p0', start: '2026-11-11', end: '2026-11-24', progress: 40, desc: '看板拖拽、任务详情、排期表交互的完整实现。', deps: ['t104'], subs: [{ t: '看板视图', d: true }, { t: '排期表视图', d: false }, { t: '任务详情面板', d: false }] },
        { id: 't106', pid: 'p1', phase: '开发阶段', title: '数据层与同步服务', owner: 'Wm', status: 'doing', pri: 'p1', start: '2026-11-13', end: '2026-11-25', progress: 25, desc: 'localStorage 持久化与导出，为 v1.0 云同步预留接口。', deps: ['t104'], subs: [] },
        { id: 't107', pid: 'p1', phase: '测试与发布', title: '测试用例编写', owner: 'Ly', status: 'todo', pri: 'p2', start: '2026-11-18', end: '2026-11-21', progress: 0, desc: '覆盖排期规则：吸附粒度、最小工期、依赖冲突提示。', deps: ['t103'], subs: [] },
        { id: 't108', pid: 'p1', phase: '测试与发布', title: '集成测试与修复', owner: 'Wm', status: 'todo', pri: 'p1', start: '2026-11-26', end: '2026-12-03', progress: 0, desc: '按测试用例回归，修复 P0/P1 缺陷。', deps: ['t105', 't106'], subs: [] },
        { id: 't109', pid: 'p1', phase: '测试与发布', title: 'Beta 版发布', owner: 'Al', status: 'todo', pri: 'p0', start: '2026-11-27', end: '2026-11-27', progress: 0, milestone: true, desc: '内测发布，收集首批反馈。', deps: ['t105'], subs: [] },
        { id: 't110', pid: 'p1', phase: '测试与发布', title: '正式上线', owner: 'Al', status: 'todo', pri: 'p0', start: '2026-12-08', end: '2026-12-08', progress: 0, milestone: true, desc: 'v0.1 正式对外发布。', deps: ['t108'], subs: [] },

        /* ---- p2 官网改版（看板数据） ---- */
        { id: 't201', pid: 'p2', title: '首页视觉稿定稿', owner: 'Ly', status: 'todo', pri: 'p1', start: '2026-11-12', end: '2026-11-14', desc: '根据走查结论收敛两套方案，与开发确认首屏切图范围后定稿。', deps: [], subs: [{ t: '移动端布局', d: true }, { t: '桌面端布局', d: false }, { t: '切图标注', d: false }] },
        { id: 't202', pid: 'p2', title: '响应式适配方案', owner: 'Zc', status: 'todo', pri: 'p2', start: '2026-11-16', end: '2026-11-18', desc: '输出 375 / 768 / 1440 三档断点的布局策略，标注可复用组件。', deps: [], subs: [{ t: '断点策略', d: false }, { t: '组件复用清单', d: false }] },
        { id: 't203', pid: 'p2', title: '数据埋点清单', owner: 'Wm', status: 'todo', pri: 'p2', start: '2026-11-18', end: '2026-11-20', desc: '梳理全站埋点点位与事件命名规则，输出给数据侧评审。', deps: [], subs: [] },
        { id: 't204', pid: 'p2', title: '404 页面文案', owner: 'Ly', status: 'todo', pri: 'p3', start: '2026-11-23', end: '2026-11-25', desc: '重写 404 与异常态文案，统一语气。', deps: [], subs: [] },
        { id: 't205', pid: 'p2', title: '首屏性能优化', owner: 'Zc', status: 'doing', pri: 'p0', start: '2026-11-10', end: '2026-11-13', desc: '首屏 LCP 目标 2 秒内：图片懒加载、字体子集化、接口预取。', deps: [], subs: [{ t: '图片懒加载', d: true }, { t: '字体子集化', d: false }, { t: '接口预取', d: false }, { t: '监控看板', d: false }] },
        { id: 't206', pid: 'p2', title: 'CMS 字段对接', owner: 'Wm', status: 'doing', pri: 'p1', start: '2026-11-07', end: '2026-11-11', desc: '对接 CMS 字段映射，补齐商品模块的富文本解析。', deps: [], subs: [{ t: '字段映射表', d: true }, { t: '富文本解析', d: false }] },
        { id: 't207', pid: 'p2', title: '导航信息架构调整', owner: 'Ly', status: 'doing', pri: 'p2', start: '2026-11-13', end: '2026-11-16', desc: '按新信息架构重排导航，需同步更新面包屑规则。', deps: [], subs: [] },
        { id: 't208', pid: 'p2', title: '竞品走查报告', owner: 'Al', status: 'done', pri: 'p1', start: '2026-11-04', end: '2026-11-08', progress: 100, doneAt: '2026-11-08', desc: '覆盖 6 家竞品的首页与详情页结构对比，结论已同步全组。', deps: [], subs: [] },
        { id: 't209', pid: 'p2', title: '设计规范初稿', owner: 'Ly', status: 'done', pri: 'p2', start: '2026-11-02', end: '2026-11-05', progress: 100, doneAt: '2026-11-05', desc: '含色彩、字阶、间距与组件状态的设计规范初版。', deps: [], subs: [] },

        /* ---- p3 数据迁移 ---- */
        { id: 't301', pid: 'p3', title: '数据字典梳理', owner: 'Wm', status: 'done', pri: 'p1', start: '2026-10-30', end: '2026-11-04', progress: 100, doneAt: '2026-11-04', desc: '新旧系统字段对照与缺口清单。', deps: [], subs: [] },
        { id: 't302', pid: 'p3', title: '迁移脚本开发', owner: 'Zc', status: 'doing', pri: 'p0', start: '2026-11-05', end: '2026-11-10', desc: '按数据字典编写批量迁移脚本，含回滚方案。', deps: ['t301'], subs: [{ t: '全量脚本', d: true }, { t: '增量脚本', d: false }] },
        { id: 't303', pid: 'p3', title: '供应商比价表', owner: 'Al', status: 'todo', pri: 'p2', start: '2026-11-14', end: '2026-11-16', desc: '整理三家云厂商的存储与带宽报价。', deps: [], subs: [] },
        { id: 't304', pid: 'p3', title: '灰度切换方案', owner: 'Wm', status: 'todo', pri: 'p1', start: '2026-11-17', end: '2026-11-20', desc: '按 5% → 30% → 100% 三批灰度，明确回滚触发条件。', deps: ['t302'], subs: [] },

        /* ---- p4 品牌物料 ---- */
        { id: 't401', pid: 'p4', title: '品牌手册翻译校对', owner: 'Ly', status: 'todo', pri: 'p3', start: '2026-11-30', end: '2026-12-02', desc: '英文版品牌手册的术语统一与三审校对。', deps: [], subs: [] },
        { id: 't402', pid: 'p4', title: '年度复盘模板', owner: 'Al', status: 'todo', pri: 'p2', start: '2026-11-22', end: '2026-11-24', desc: '沉淀全年项目复盘模板，含里程碑与数据口径。', deps: [], subs: [] }
      ],
      feed: [
        { who: 'Ly', txt: '完成了「设计规范初稿」', time: '09:41' },
        { who: 'Wm', txt: '评论了「数据层与同步服务」', time: '10:24' },
        { who: 'sys', txt: '排期冲突：「视觉设计与走查」早于前置任务结束', time: '10:30' }
      ]
    };
  }

  /* ---------- 日期工具 ---------- */
  const pad = n => String(n).padStart(2, '0');
  const fmt = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parse = s => { const a = s.split('-'); return new Date(+a[0], +a[1] - 1, +a[2]); };
  const shift = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return fmt(d); };
  const diffDays = (a, b) => Math.round((parse(a) - parse(b)) / DAYMS);
  const todayStr = () => fmt(TODAY);
  const md = s => s.slice(5);

  /* ---------- 状态 ---------- */
  let state = null;
  const listeners = [];

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      state = raw ? JSON.parse(raw) : null;
      if (state && !state.tasks) state = null;
    } catch (e) { state = null; }
    if (!state) { state = seed(); save(); }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { /* 隐私模式等场景静默降级为内存态 */ }
  }
  function emit() { listeners.forEach(fn => fn()); }

  /* ---------- 派生规则 ---------- */
  function isLate(t) {
    return t.status !== 'done' && t.end && diffDays(t.end, todayStr()) < 0;
  }
  function healthOf(p) {
    const ts = state.tasks.filter(t => t.pid === p.id);
    if (!ts.length) return 'ok';
    const late = ts.filter(isLate).length;
    if (p.end && diffDays(p.end, todayStr()) < 0 && ts.some(t => t.status !== 'done')) return 'late';
    if (ts.length && late / ts.length > 0.2) return 'risk';
    return 'ok';
  }
  function progressOf(p) {
    const ts = state.tasks.filter(t => t.pid === p.id);
    if (!ts.length) return 0;
    const sum = ts.reduce((a, t) => a + (t.status === 'done' ? 100 : (t.progress || 0)), 0);
    return Math.round(sum / ts.length);
  }
  function openCount(p) {
    return state.tasks.filter(t => t.pid === p.id && t.status !== 'done').length;
  }

  /* ---------- 查询 ---------- */
  const data = () => state;
  const project = id => state.projects.filter(p => p.id === id)[0];
  const tasksOf = pid => state.tasks.filter(t => t.pid === pid);
  const task = id => state.tasks.filter(t => t.id === id)[0];
  const member = id => state.members.filter(m => m.id === id)[0] || { id, name: id, color: '#8E8E96' };

  function myTasks() {
    const mine = state.tasks.filter(t => t.owner === state.user && t.status !== 'done');
    const today = todayStr();
    const groups = { today: [], week: [], later: [], noDate: [] };
    const wkEnd = shift(today, 7);
    mine.forEach(t => {
      if (!t.end) { groups.noDate.push(t); return; }
      const d = diffDays(t.end, today);
      if (d < 0) groups.today.push(t);
      else if (d === 0) groups.today.push(t);
      else if (t.end <= wkEnd) groups.week.push(t);
      else groups.later.push(t);
    });
    const byEnd = (a, b) => (a.end || '9999').localeCompare(b.end || '9999');
    groups.today.sort(byEnd); groups.week.sort(byEnd); groups.later.sort(byEnd);
    return groups;
  }

  function metrics() {
    const today = todayStr();
    const month = today.slice(0, 7);
    return {
      projects: state.projects.length,
      weekDue: state.tasks.filter(t => t.status !== 'done' && t.end && t.end >= today && t.end <= shift(today, 7)).length,
      late: state.tasks.filter(isLate).length,
      monthDone: state.tasks.filter(t => t.doneAt && t.doneAt.slice(0, 7) === month).length
    };
  }

  /* ---------- 变更 ---------- */
  function nextId(prefix) {
    const n = state.tasks.reduce((max, t) => {
      const num = parseInt(t.id.replace(/\D/g, ''), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return prefix + (n + 1);
  }

  function updateTask(id, patch) {
    const t = task(id);
    if (!t) return;
    Object.assign(t, patch);
    if (patch.status === 'done') { t.progress = 100; t.doneAt = todayStr(); }
    if (patch.status && patch.status !== 'done') { t.doneAt = null; if (t.progress === 100) t.progress = 60; }
    save(); emit();
  }

  function addTask(o) {
    const t = {
      id: nextId('t'),
      pid: o.pid,
      title: o.title,
      owner: o.owner || state.user,
      status: 'todo',
      pri: o.pri || 'p2',
      start: o.start || o.end || todayStr(),
      end: o.end || o.start || shift(todayStr(), 3),
      progress: 0,
      desc: '',
      deps: [],
      subs: [],
      phase: o.phase || ''
    };
    state.tasks.push(t);
    save(); emit();
    return t;
  }

  function deleteTask(id) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    state.tasks.forEach(t => { if (t.deps) t.deps = t.deps.filter(d => d !== id); });
    save(); emit();
  }

  function addProject(name, color, end) {
    const n = state.projects.reduce((m, p) => Math.max(m, parseInt(p.id.slice(1), 10) || 0), 0) + 1;
    const p = { id: 'p' + n, name, color, start: todayStr(), end: end || shift(todayStr(), 30) };
    state.projects.push(p);
    save(); emit();
    return p;
  }

  function pushFeed(txt, who) {
    const h = 10 + Math.floor(Math.random() * 8), m = Math.floor(Math.random() * 60);
    state.feed.unshift({ who: who || state.user, txt, time: pad(h) + ':' + pad(m) });
    if (state.feed.length > 12) state.feed.length = 12;
    save();
  }

  function reset() {
    state = seed();
    save(); emit();
  }

  function exportJSON() {
    return JSON.stringify(state, null, 2);
  }

  function onChange(fn) { listeners.push(fn); }

  load();

  window.Store = {
    DAYMS, TODAY, todayStr, fmt, parse, shift, diffDays, md,
    data, project, tasksOf, task, member,
    myTasks, metrics, isLate, healthOf, progressOf, openCount,
    updateTask, addTask, deleteTask, addProject, pushFeed,
    reset, exportJSON, onChange
  };
})();
