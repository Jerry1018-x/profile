/* 个人工作台 · 公开脱敏演示
   只拦截 /api/*；静态页面和样式仍由 GitHub Pages 提供。
   数据全部为示例，不读取、不上传任何真实记录。 */
(function () {
  'use strict';

  const META = {
    statuses: ['未投递', '已投递', '面试中', '已挂'],
    channels: ['官网', 'BOSS直聘', '牛客', '内推', '招聘会', '其他'],
    categories: ['AI算法', '后端开发', '前端开发', '客户端开发', '测试开发', '数据分析', '数据挖掘', '产品经理', '产品运营', '用户运营', '市场营销', '广告/媒介', '设计', '游戏', '金融/银行', '咨询', '快消/零售', '制造/硬件', '芯片/半导体', '通信', '汽车', '能源', '医药/生物', '教育', '媒体/内容', '国企/央企', '政府/事业单位'],
    mastery: ['未复习', '待复习', '已掌握'],
    defaultQaTypes: ['技术八股', '编程题', '项目深挖', '行为面', '项目经历', '产品思考'],
    bookStatus: ['想读', '在读', '读完'],
    contentStatus: ['灵感', '选题', '已发布'],
    resourceTypes: ['课程', '论文', '文章', '开源项目'],
    resourceStatus: ['未读', '在读', '已读'],
    noteCategories: ['AI基础', '深度学习', '大模型', '工程实践', '论文精读'],
    questionTypes: ['项目经历', '行为面', '产品思考'],
  };

  const positions = [
    { id: 1, name: '项目助理', category: '产品运营', notes: '', created_at: '2026-10-01 09:00:00', opening_count: 4, app_count: 2, active_count: 4, jd_count: 1 },
    { id: 2, name: '产品运营', category: '互联网', notes: '', created_at: '2026-10-03 09:00:00', opening_count: 3, app_count: 1, active_count: 3, jd_count: 1 },
    { id: 3, name: '品牌商务', category: '市场营销', notes: '', created_at: '2026-10-05 09:00:00', opening_count: 2, app_count: 0, active_count: 2, jd_count: 0 },
  ];

  const openings = [
    { id: 101, position_id: 1, company: '云帆科技', title: '项目助理', city: '北京', channel: '官网', date: '2026-11-02', note: '', created_at: '2026-11-02 09:10:00', url: '', referral: '', direction_id: 1, source: '校招', deadline: '2026-11-30', position_name: '项目助理', category: '产品运营', genmai_new: 1 },
    { id: 102, position_id: 1, company: '星野网络', title: '项目运营', city: '北京', channel: '内推', date: '2026-11-05', note: '需准备一份项目复盘', created_at: '2026-11-05 10:00:00', url: '', referral: 'DEMO-01', direction_id: 1, source: '校招', deadline: '2026-12-06', position_name: '项目助理', category: '产品运营', genmai_new: 1 },
    { id: 103, position_id: 1, company: '远山文化', title: '项目执行', city: '上海', channel: 'BOSS直聘', date: '2026-11-08', note: '', created_at: '2026-11-08 14:00:00', url: '', referral: '', direction_id: 1, source: '社招', deadline: '2026-12-01', position_name: '项目助理', category: '产品运营', genmai_new: 0 },
    { id: 104, position_id: 1, company: '北辰数据', title: '交付助理', city: '北京', channel: '官网', date: '2026-11-11', note: '', created_at: '2026-11-11 11:00:00', url: '', referral: '', direction_id: 1, source: '校招', deadline: '2026-12-12', position_name: '项目助理', category: '产品运营', genmai_new: 0 },
    { id: 201, position_id: 2, company: '青禾教育', title: '产品运营', city: '北京', channel: '官网', date: '2026-11-03', note: '', created_at: '2026-11-03 09:00:00', url: '', referral: '', direction_id: 2, source: '校招', deadline: '2026-11-28', position_name: '产品运营', category: '互联网', genmai_new: 1 },
    { id: 202, position_id: 2, company: '海岸设计', title: '用户运营', city: '杭州', channel: '招聘会', date: '2026-11-09', note: '', created_at: '2026-11-09 09:00:00', url: '', referral: '', direction_id: 2, source: '校招', deadline: '2026-12-10', position_name: '产品运营', category: '互联网', genmai_new: 0 },
    { id: 203, position_id: 2, company: '云帆科技', title: '内容运营', city: '北京', channel: '内推', date: '2026-11-12', note: '', created_at: '2026-11-12 09:00:00', url: '', referral: 'DEMO-02', direction_id: 2, source: '校招', deadline: '2026-12-15', position_name: '产品运营', category: '互联网', genmai_new: 0 },
    { id: 301, position_id: 3, company: '南山制造', title: '品牌商务', city: '深圳', channel: '官网', date: '2026-11-06', note: '', created_at: '2026-11-06 09:00:00', url: '', referral: '', direction_id: 2, source: '校招', deadline: '2026-12-08', position_name: '品牌商务', category: '市场营销', genmai_new: 0 },
    { id: 302, position_id: 3, company: '远山文化', title: '商务助理', city: '上海', channel: 'BOSS直聘', date: '2026-11-10', note: '', created_at: '2026-11-10 09:00:00', url: '', referral: '', direction_id: 2, source: '社招', deadline: '2026-12-05', position_name: '品牌商务', category: '市场营销', genmai_new: 0 },
  ];

  const applications = [
    { id: 201, position_id: 1, company: '云帆科技', city: '北京', channel: '官网', applied_at: '2026-10-28', deadline: '2026-11-30', status: '已投递', note: '', created_at: '2026-10-28 09:00:00', updated_at: '2026-11-01 09:00:00', title: '项目助理', opening_id: 101, url: '', source: '官网', position_name: '项目助理', opening_url: null },
    { id: 202, position_id: 2, company: '星野网络', city: '北京', channel: '内推', applied_at: '2026-11-03', deadline: '2026-12-06', status: '面试中', note: '一面准备项目复盘', created_at: '2026-11-03 09:00:00', updated_at: '2026-11-10 09:00:00', title: '产品运营', opening_id: 102, url: '', source: '内推', position_name: '产品运营', opening_url: null },
    { id: 203, position_id: 1, company: '远山文化', city: '上海', channel: 'BOSS直聘', applied_at: '2026-11-08', deadline: '2026-12-01', status: '已挂', note: '复盘：项目案例讲得太长', created_at: '2026-11-08 09:00:00', updated_at: '2026-11-12 09:00:00', title: '项目执行', opening_id: 103, url: '', source: 'BOSS直聘', position_name: '项目助理', opening_url: null },
    { id: 204, position_id: 2, company: '青禾教育', city: '北京', channel: '官网', applied_at: '2026-11-12', deadline: '2026-11-28', status: '未投递', note: '', created_at: '2026-11-12 09:00:00', updated_at: '2026-11-12 09:00:00', title: '产品运营', opening_id: 201, url: '', source: '官网', position_name: '产品运营', opening_url: null },
  ];

  const resumeAnalysis = {
    matchScore: 82,
    summary: '项目执行与跨团队协作经历和岗位方向匹配，建议把项目范围、里程碑和交付结果写成可核对的案例。',
    strengths: ['有项目助理实习，经历过需求梳理、原型和交付跟进', '能协调设计、开发和销售之间的信息同步', '会用 Figma、飞书等协作工具'],
    gaps: ['缺少量化的交付结果', '项目作品集还不够完整'],
    keywords: ['需求分析', '项目协调', '交付跟进', '信息架构'],
    suggestions: ['补充一个完整的项目案例：背景、动作、结果', '把简历中的“负责”改成可验证的交付动作'],
  };

  const resumes = [
    { id: 11, direction_id: 1, name: '项目管理方向简历 · 示例', file_name: 'demo-project.pdf', content_len: 1200, analysis: resumeAnalysis, analyzed_at: '2026-11-08 10:00:00', created_at: '2026-11-01 10:00:00', has_profile: 1 },
    { id: 12, direction_id: 2, name: '产品运营方向简历 · 示例', file_name: 'demo-product.pdf', content_len: 980, analysis: null, analyzed_at: '', created_at: '2026-11-06 10:00:00', has_profile: 0 },
  ];

  const directions = [
    { id: 1, name: '项目管理', category: '企业服务', keywords: '项目助理, 项目运营, 交付', cities: '北京', graduation: '2027届', active: 1, note: '', created_at: '2026-10-01 09:00:00', updated_at: '2026-11-09 09:00:00', resumes: [resumes[0]], pending_candidates: 0, synced_candidates: 4, last_run: null, category_blocked: false },
    { id: 2, name: '产品运营', category: '互联网', keywords: '产品运营, 用户增长, 内容', cities: '北京 / 杭州', graduation: '2027届', active: 1, note: '', created_at: '2026-10-03 09:00:00', updated_at: '2026-11-10 09:00:00', resumes: [resumes[1]], pending_candidates: 0, synced_candidates: 3, last_run: null, category_blocked: false },
  ];

  const questions = [
    { id: 1, type: '项目经历', question: '请讲一个你协调多方推进项目的经历。', answer: '', company: '', tags: '项目协作', mastery: '待复习', created_at: '2026-11-01 09:00:00', updated_at: '2026-11-01 09:00:00', position_id: 1, hint: '用 STAR 结构：先说明项目目标和你负责的环节，再说你如何对齐设计、开发和客户，最后给出交付结果。' },
    { id: 2, type: '项目经历', question: '当需求临时变更时，你会怎么处理？', answer: '', company: '云帆科技', tags: '需求变更', mastery: '未复习', created_at: '2026-11-02 09:00:00', updated_at: '2026-11-02 09:00:00', position_id: 1, hint: '先确认变更原因与优先级，再评估工作量、影响范围和回滚方案，最后让相关方确认新的交付顺序。' },
    { id: 3, type: '项目经历', question: '怎么判断一个项目是否真的完成了？', answer: '', company: '', tags: '验收', mastery: '已掌握', created_at: '2026-11-03 09:00:00', updated_at: '2026-11-03 09:00:00', position_id: null, hint: '从验收标准、客户确认、文档归档和后续维护四个方面回答。' },
    { id: 4, type: '行为面', question: '讲一次你说服他人接受不同方案的经历。', answer: '', company: '', tags: '沟通', mastery: '待复习', created_at: '2026-11-04 09:00:00', updated_at: '2026-11-04 09:00:00', position_id: null, hint: '重点说明你如何理解对方顾虑、用什么事实推动共识，而不是只强调自己的方案更好。' },
    { id: 5, type: '行为面', question: '你如何安排一个同时有多个截止日期的周？', answer: '', company: '', tags: '时间管理', mastery: '未复习', created_at: '2026-11-05 09:00:00', updated_at: '2026-11-05 09:00:00', position_id: null, hint: '先说排序依据，再说如何同步风险和调整计划，最后给一个具体例子。' },
    { id: 6, type: '产品思考', question: '如果让你优化一个内部工具，你会先看什么？', answer: '', company: '', tags: '产品判断', mastery: '未复习', created_at: '2026-11-06 09:00:00', updated_at: '2026-11-06 09:00:00', position_id: 2, hint: '先找真实使用频率和卡点，再区分“看起来重要”和“每天阻碍任务”的问题。' },
  ];

  const bloggers = [
    { id: 1, platform: 'B站', name: '示例博主 · 项目方法', uid: 'demo-project', url: 'https://example.com/project', note: '', active: 1, last_checked_at: '', created_at: '2026-10-01 09:00:00', last_error: '', item_count: 0, home_url: 'https://example.com/project' },
    { id: 2, platform: 'B站', name: '示例博主 · AI 工具', uid: 'demo-ai', url: 'https://example.com/ai', note: '关注 AI 工具的实际工作流', active: 1, last_checked_at: '', created_at: '2026-10-01 09:00:00', last_error: '', item_count: 0, home_url: 'https://example.com/ai' },
  ];

  const kbNotes = [
    { id: 1, title: '项目复盘可以怎么问', content: '不要只问“做了什么”。先问目标、约束、关键决策，再问如果重来一次会改哪一步。', tags: '项目, 复盘', created_at: '2026-11-01 09:00:00', updated_at: '2026-11-07 09:00:00' },
    { id: 2, title: '面试表达的结构', content: '背景一句话，动作两句话，结果一句话。先让面试官听懂，再展开细节。', tags: '面试, 表达', created_at: '2026-11-03 09:00:00', updated_at: '2026-11-08 09:00:00' },
  ];

  const recommended = [
    { platform: 'B站', name: '示例博主 · 项目方法', uid: '', url: 'https://example.com/project', field: '项目管理', summary: '用真实项目拆解需求、范围和交付节奏，适合建立项目复盘框架。', ai: false, subscribed: true, blogger_id: 1 },
    { platform: 'B站', name: '示例博主 · AI 工具', uid: '', url: 'https://example.com/ai', field: 'AI 工具', summary: '关注 AI 工具如何进入日常工作流，而不是只演示一次性效果。', ai: false, subscribed: true, blogger_id: 2 },
  ];

  const accounts = [
    { id: 1, name: '示例账号 · 小红书', platform: '小红书', track: 'AI 工具 · 求职成长', status: '已导入', url: 'https://example.com/xhs', note: '示例数据', created_at: '2026-10-01 09:00:00', metric_count: 12, metric_days: 7, total_views: 126000, total_likes: 8400, latest_date: '2026-11-10' },
    { id: 2, name: '示例账号 · B站', platform: 'B站', track: '知识分享', status: '规划中', url: 'https://example.com/bili', note: '准备开始', created_at: '2026-10-01 09:00:00', metric_count: 0, metric_days: 0, total_views: 0, total_likes: 0, latest_date: null },
  ];

  const metrics = Array.from({ length: 7 }, (_, i) => {
    const day = String(i + 4).padStart(2, '0');
    return { id: 500 + i, account_id: 1, metric_date: `2026-11-${day}`, title: ['项目复盘模板', 'AI 工具工作流', '简历里的项目案例'][i % 3], views: 12000 + i * 900, likes: 800 + i * 40, comments: 60 + i * 5, shares: 120 + i * 8, fans: 3000 + i * 80, url: '' };
  });
  const daily = metrics.map((m) => ({ metric_date: m.metric_date, views: m.views, likes: m.likes, comments: m.comments, shares: m.shares, fans: m.fans }));

  const books = [
    {
      id: 1, title: '示例：项目管理入门', author: '示例作者', category: '项目管理', status: '在读', rating: 4,
      started_at: '2026-10-20', finished_at: '', note: '', created_at: '2026-10-20 09:00:00', source: 'manual', source_id: '', format: 'epub',
      file_path: 'demo', cover_path: '', description: '这是一本用于演示阅读体验的示例书，内容由项目边界、里程碑和复盘三个章节组成。',
      language: 'zh', total_chars: 6800, summary: '项目管理的核心不是把任务列得更长，而是先定义边界、再安排里程碑、最后用复盘修正下一次行动。',
      key_points: [{ title: '范围', points: ['先写清楚不做什么', '把验收标准放在项目开始前'] }, { title: '节奏', points: ['里程碑要对应可验证的交付', '延期要尽早暴露'] }],
      summary_at: '2026-11-02 10:00:00', summary_error: '', reading_position: '{"ch":0}', last_read_at: '2026-11-10 21:00:00', source_url: '', publisher: '示例出版社', published_year: '2026', isbn: '',
      summary_source: 'text', summary_sources: [], note_count: 1, chapter_count: 2, cover_url: '', file_url: 'demo', pdf_url: '',
    },
    {
      id: 2, title: '示例：把想法做成产品', author: '示例作者', category: '产品', status: '想读', rating: 0,
      started_at: '', finished_at: '', note: '示例书目，用于展示书架状态。', created_at: '2026-11-01 09:00:00', source: 'manual', source_id: '', format: '',
      file_path: '', cover_path: '', description: '从问题、结构、界面到实现，记录一个个人产品从想法到上线的过程。', language: 'zh', total_chars: 0, summary: '', key_points: [],
      summary_at: '', summary_error: '', reading_position: '', last_read_at: '', source_url: '', publisher: '示例出版社', published_year: '2026', isbn: '',
      summary_source: '', summary_sources: [], note_count: 0, chapter_count: 0, cover_url: '', file_url: '', pdf_url: '',
    },
  ];

  const chapters = {
    1: [
      { id: 1, book_id: 1, idx: 0, title: '第一章 先定义边界', file_url: 'chapter-1.html', char_count: 2600 },
      { id: 2, book_id: 1, idx: 1, title: '第二章 让进度可回看', file_url: 'chapter-2.html', char_count: 2800 },
    ],
  };

  const bookNotes = {
    1: [{ id: 1, book_id: 1, type: 'note', chapter_index: 0, chapter: '第一章 先定义边界', quote: '', thought: '先把“不做什么”写下来，范围才真的收敛。', created_at: '2026-11-08 20:00:00' }],
  };

  const dashboard = { positions, openings, applications };

  function matchId(path, prefix) {
    const m = path.match(new RegExp('^' + prefix + '/(\\d+)$'));
    return m ? Number(m[1]) : null;
  }

  function route(path, method) {
    if (path === '/api/meta') return { meta: META };
    if (path === '/api/dashboard') return dashboard;
    if (path === '/api/positions') return { positions };
    if (path === '/api/openings') return { openings };
    if (path === '/api/applications') return { applications };
    if (path === '/api/ai/config') return { config: { configured: false, model: '', keySource: 'none' } };
    if (path === '/api/agent/directions') return { directions, daily: { enabled: false, hour: 8, lastDate: '' }, configured: false, blocked: [], autoSync: false };
    if (path === '/api/ai/candidates') return { candidates: [], counts: { 待确认: 0, 已导入: 0, 已忽略: 0 } };
    if (path === '/api/agent/preferences') return { blocked: [] };
    if (path === '/api/agent/industries') return { recommended: ['互联网', '企业服务', '教育'], collected: [], groups: [], blocked: [] };
    if (path === '/api/questions/types') return { types: [{ type: '项目经历', count: 3 }, { type: '行为面', count: 2 }, { type: '产品思考', count: 1 }], customs: ['项目经历', '行为面', '产品思考'] };
    if (path === '/api/questions') return { questions };
    if (path === '/api/kb/state') return { lastCheckAt: '', todayNew: 0, bloggerCount: bloggers.length, itemCount: 0, favCount: 0, noteCount: kbNotes.length, localModel: '' };
    if (path === '/api/kb/bloggers') return { bloggers, platforms: ['B站', 'YouTube', '其他'] };
    if (path === '/api/kb/notes') return { notes: kbNotes };
    if (path === '/api/kb/recommended') return { recommended, generatedAt: '', canGenerate: false };
    if (path === '/api/agents/state') return { agents: [{ id: 'genmai', name: '玄米', role: '求职搭子', configured: false, model: '', keySource: 'none' }, { id: 'mango', name: '芒果', role: '知识库管家', configured: false, model: '', keySource: 'none' }, { id: 'shanzhu', name: '山竹', role: '媒体数据分析师', configured: false, model: '', keySource: 'none' }], localModel: '' };
    if (path === '/api/agent/notifications') return { notifications: [], unread: 0 };
    if (path === '/api/notifications') return { notifications: [], unread: 0 };
    if (path === '/api/media/accounts') return { accounts, platforms: ['小红书', '抖音', 'B站', '公众号', '视频号'], statuses: ['规划中', '已导入'] };
    if (path === '/api/books/state') return { total: books.length, want: 1, reading: 1, finished: 0, notes: 1, summaryCount: 1 };
    if (path === '/api/books') return { books, statuses: META.bookStatus };
    if (path === '/api/attachments') return { attachments: [] };
    if (path === '/api/jds') return { jds: [{ id: 1, position_id: 1, company: '云帆科技', title: '项目助理', requirements: '负责项目资料整理、会议纪要、进度跟进与交付节点协调；能够把客户需求整理成可评审的文档。', skills: '项目跟进, 需求分析, 文档, 沟通', source: '' }] };
    if (path === '/api/books/1/search') return { results: [] };
    if (path === '/api/books/smart-search') return { results: [], source: 'demo' };

    let id = matchId(path, '/api/positions'); if (id) return { position: positions.find((x) => x.id === id) || positions[0] };
    id = matchId(path, '/api/openings'); if (id) return { opening: openings.find((x) => x.id === id) || openings[0] };
    id = matchId(path, '/api/applications'); if (id) return { application: applications.find((x) => x.id === id) || applications[0] };
    id = matchId(path, '/api/agent/resumes'); if (id) return { resume: resumes.find((x) => x.id === id) || resumes[0] };
    id = matchId(path, '/api/jds'); if (id) return { jd: { id: 1, position_id: 1, company: '云帆科技', title: '项目助理', requirements: '负责项目资料整理、会议进度跟进与交付节点协调；能把客户需求整理成可评审的文档。', skills: '项目跟进, 需求分析, 文档, 沟通', source: '' } };
    id = matchId(path, '/api/books'); if (id) return { book: books.find((x) => x.id === id) || books[0], chapters: chapters[id] || [], notes: bookNotes[id] || [] };
    const mm = path.match(/^\/api\/media\/accounts\/(\d+)\/metrics$/);
    if (mm) return { account: accounts.find((a) => a.id === Number(mm[1])) || accounts[0], metrics, totals: { count: metrics.length, views: 126000, likes: 8400, comments: 560, shares: 1200, fans: 3800 }, daily };
    const ch = path.match(/^\/api\/books\/(\d+)\/chapters\/(\d+)$/);
    if (ch) return { html: '<h1>示例章节</h1><p>这是一段用于演示的示例正文。</p>' };
    if (path === '/api/books/smart-import') return { already: true };
    if (path === '/api/agents/mango/ask') return { reply: '这是公开示例演示。这里展示的是工作台的真实界面与内置示例数据，不会连接或上传任何真实记录。' };
    if (path === '/api/agents/shanzhu/ask') return { reply: '这是公开示例演示。内容分析功能在完整版中接入 AI，演示版只展示界面与示例数据。' };
    if (path === '/api/agents/genmai/ask') return { reply: '这是公开示例演示。求职助手在完整版中接入 AI，演示版只展示界面与示例数据。' };
    if (/^\/api\/agents\/(?:genmai|mango|shanzhu)\/chat$/.test(path)) return { reply: '这是公开示例演示，不会连接真实数据。' };
    if (path === '/api/media/analyze') return { answer: '**示例分析**\n\n这组数据用于展示媒体规划界面。完整版会把账号数据交给山竹，输出内容复盘与下一期选题建议。' };
    if (path === '/api/ai/search') return { target: 'openings', query: '', filters: {}, rows: [] };
    if (path === '/api/books/1/summarize') return { mode: 'text', summary: '这是示例总结，用于展示阅读器的 AI 总结区域。' };
    return null;
  }

  function isWrite(method) { return method !== 'GET' && method !== 'HEAD'; }

  const originalFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    const raw = typeof input === 'string' ? input : (input && input.url) || '';
    let url;
    try { url = new URL(raw, location.href); } catch (e) { return originalFetch(input, init); }
    if (!url.pathname.startsWith('/api/')) return originalFetch(input, init);
    const method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    const data = route(url.pathname, method);
    if (data) {
      return Promise.resolve(new Response(JSON.stringify(Object.assign({ ok: true }, data)), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    if (isWrite(method)) {
      return Promise.resolve(new Response(JSON.stringify({ ok: true, demo: true }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    return Promise.resolve(new Response(JSON.stringify({ ok: false, error: '演示数据暂不包含该接口' }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
  };
})();
