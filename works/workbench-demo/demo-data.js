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

  /* ============================================================
     浏览器内可操作数据层
     公开演示用；数据只保存在当前浏览器的 localStorage。
     ============================================================ */
  const DEMO_KEY = 'workbench-public-demo-v1';
  const clone = (value) => JSON.parse(JSON.stringify(value));

  function demoSeed() {
    return {
      positions: clone(positions),
      openings: clone(openings),
      applications: clone(applications),
      directions: clone(directions),
      questions: clone(questions),
      questionTypes: ['项目经历', '行为面', '产品思考'],
      jds: [{ id: 1, position_id: 1, company: '云帆科技', title: '项目助理', requirements: '负责项目资料整理、会议纪要、进度跟进与交付节点协调；能够把客户需求整理成可评审的文档。', skills: '项目跟进, 需求分析, 文档, 沟通', source: '' }],
      bloggers: clone(bloggers),
      notes: clone(kbNotes),
      accounts: clone(accounts),
      metrics: clone(metrics),
      books: clone(books),
      bookNotes: clone(bookNotes),
      settings: { daily: { enabled: false, hour: 8, lastDate: '' }, blocked: [], autoSync: false },
    };
  }

  function loadDemoState() {
    try {
      const raw = localStorage.getItem(DEMO_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && Array.isArray(s.positions) && Array.isArray(s.books) && Array.isArray(s.questions)) return s;
      }
    } catch (e) { /* 忽略 */ }
    return demoSeed();
  }

  let DS = loadDemoState();
  function saveDemo() {
    try { localStorage.setItem(DEMO_KEY, JSON.stringify(DS)); } catch (e) { /* 隐私模式静默降级 */ }
  }
  window.__demoReset = function () {
    try { localStorage.removeItem(DEMO_KEY); } catch (e) { /* 忽略 */ }
    location.reload();
  };

  const stamp = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  };
  const nextId = (arr) => arr.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1;
  const byId = (arr, id) => arr.find((x) => Number(x.id) === Number(id));

  function positionsOut() {
    return DS.positions.map((p) => ({
      ...p,
      opening_count: DS.openings.filter((o) => Number(o.position_id) === Number(p.id)).length,
      app_count: DS.applications.filter((a) => Number(a.position_id) === Number(p.id)).length,
      active_count: DS.openings.filter((o) => Number(o.position_id) === Number(p.id)).length,
      jd_count: DS.jds.filter((j) => Number(j.position_id) === Number(p.id)).length,
    }));
  }
  function openingsOut() {
    return DS.openings.map((o) => {
      const p = byId(DS.positions, o.position_id);
      return { ...o, position_name: p ? p.name : '', category: p ? p.category : '', genmai_new: Number(o.genmai_new) || 0 };
    });
  }
  function applicationsOut() {
    return DS.applications.map((a) => {
      const p = byId(DS.positions, a.position_id);
      const o = byId(DS.openings, a.opening_id);
      return { ...a, position_name: p ? p.name : (a.position_name || null), opening_url: o ? (o.url || null) : (a.opening_url || null) };
    });
  }
  function directionsOut() {
    return DS.directions.map((d) => ({
      ...d,
      resumes: d.resumes || [],
      pending_candidates: 0,
      synced_candidates: DS.openings.filter((o) => Number(o.direction_id) === Number(d.id)).length,
      last_run: null,
      category_blocked: false,
    }));
  }
  function questionsTypesOut() {
    const counts = new Map();
    DS.questions.forEach((q) => counts.set(q.type || '未分类', (counts.get(q.type || '未分类') || 0) + 1));
    const names = [...new Set([...(DS.questionTypes || []), ...counts.keys()])];
    return {
      types: names.map((type) => ({ type, count: counts.get(type) || 0 })),
      customs: [...(DS.questionTypes || [])],
    };
  }
  function booksOut() {
    return DS.books.map((b) => ({
      ...b,
      note_count: (DS.bookNotes[b.id] || []).length,
      chapter_count: Number(b.id) === 1 ? (chapters[1] || []).length : 0,
    }));
  }
  function bookDetail(id) {
    const book = byId(DS.books, id);
    if (!book) return null;
    return { book: booksOut().find((b) => Number(b.id) === Number(id)), chapters: Number(id) === 1 ? (chapters[1] || []) : [], notes: DS.bookNotes[id] || [] };
  }
  function accountsOut() {
    return DS.accounts.map((a) => {
      const rows = DS.metrics.filter((m) => Number(m.account_id) === Number(a.id));
      const dates = [...new Set(rows.map((m) => m.metric_date).filter(Boolean))];
      return {
        ...a,
        metric_count: rows.length,
        metric_days: dates.length,
        total_views: rows.reduce((n, m) => n + (Number(m.views) || 0), 0),
        total_likes: rows.reduce((n, m) => n + (Number(m.likes) || 0), 0),
        latest_date: dates.sort().slice(-1)[0] || null,
      };
    });
  }
  function mediaMetrics(id) {
    const account = byId(DS.accounts, id);
    if (!account) return null;
    const rows = DS.metrics.filter((m) => Number(m.account_id) === Number(id));
    const dailyMap = new Map();
    rows.forEach((m) => {
      const key = m.metric_date || '';
      const cur = dailyMap.get(key) || { metric_date: key, views: 0, likes: 0, comments: 0, shares: 0, fans: 0 };
      cur.views += Number(m.views) || 0;
      cur.likes += Number(m.likes) || 0;
      cur.comments += Number(m.comments) || 0;
      cur.shares += Number(m.shares) || 0;
      cur.fans = Math.max(cur.fans, Number(m.fans) || 0);
      dailyMap.set(key, cur);
    });
    return {
      account,
      metrics: rows,
      totals: {
        count: rows.length,
        views: rows.reduce((n, m) => n + (Number(m.views) || 0), 0),
        likes: rows.reduce((n, m) => n + (Number(m.likes) || 0), 0),
        comments: rows.reduce((n, m) => n + (Number(m.comments) || 0), 0),
        shares: rows.reduce((n, m) => n + (Number(m.shares) || 0), 0),
        fans: rows.reduce((n, m) => Math.max(n, Number(m.fans) || 0), 0),
      },
      daily: [...dailyMap.values()].sort((a, b) => String(a.metric_date).localeCompare(String(b.metric_date))),
    };
  }

  function readBody(init) {
    if (!init || !init.body) return {};
    if (typeof init.body === 'string') {
      try { return JSON.parse(init.body); } catch (e) { return {}; }
    }
    if (typeof FormData !== 'undefined' && init.body instanceof FormData) {
      const out = {};
      init.body.forEach((value, key) => { if (typeof value === 'string') out[key] = value; });
      return out;
    }
    return {};
  }

  function parseImportData(text) {
    const raw = String(text || '').trim();
    if (!raw) return [];
    if (raw.startsWith('[')) {
      try {
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
      } catch (e) { return []; }
    }
    const lines = raw.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];
    const head = lines[0].split(',').map((x) => x.trim());
    return lines.slice(1).map((line) => {
      const cells = line.split(',').map((x) => x.trim());
      const item = {};
      head.forEach((h, i) => { item[h] = cells[i] || ''; });
      return item;
    });
  }

  function addApplicationFromOpening(opening) {
    const exists = DS.applications.find((a) => Number(a.opening_id) === Number(opening.id));
    if (exists) return { already: true, id: exists.id };
    const p = byId(DS.positions, opening.position_id);
    const id = nextId(DS.applications);
    const now = stamp();
    DS.applications.push({
      id, position_id: opening.position_id || null, company: opening.company || '', city: opening.city || '',
      channel: opening.channel || '', applied_at: '', deadline: opening.deadline || '', status: '未投递', note: opening.note || '',
      created_at: now, updated_at: now, title: opening.title || '', opening_id: opening.id, url: opening.url || '',
      source: opening.source || '', position_name: p ? p.name : null, opening_url: opening.url || null,
    });
    saveDemo();
    return { already: false, id };
  }

  function demoRoute(path, method, url, init) {
    const body = readBody(init);
    const isGet = method === 'GET' || method === 'HEAD';

    if (path === '/api/meta') return { meta: META };
    if (path === '/api/ai/config') return { config: { configured: false, model: '', keySource: 'none' } };
    if (path === '/api/agents/state') return { agents: [{ id: 'genmai', name: '玄米', role: '求职搭子', configured: false, model: '', keySource: 'none' }, { id: 'mango', name: '芒果', role: '知识库管家', configured: false, model: '', keySource: 'none' }, { id: 'shanzhu', name: '山竹', role: '媒体数据分析师', configured: false, model: '', keySource: 'none' }], localModel: '' };
    if ((path === '/api/agent/notifications' || path === '/api/notifications') && isGet) return { notifications: [], unread: 0 };
    if (path === '/api/agent/preferences' && isGet) return { blocked: DS.settings.blocked || [] };
    if (path === '/api/agent/industries') return { recommended: ['互联网', '企业服务', '教育'], collected: [], groups: [], blocked: DS.settings.blocked || [] };
    if (path === '/api/ai/candidates' && isGet) return { candidates: [], counts: { 待确认: 0, 已导入: 0, 已忽略: 0 } };
    if (path === '/api/attachments' && isGet) return { attachments: [] };
    if (path === '/api/kb/recommended') return { recommended, generatedAt: '', canGenerate: false };

    if (path === '/api/dashboard') return { positions: positionsOut(), openings: openingsOut(), applications: applicationsOut() };
    if (path === '/api/positions' && isGet) return { positions: positionsOut() };
    if (path === '/api/openings' && isGet) return { openings: openingsOut() };
    if (path === '/api/applications' && isGet) {
      const q = String(url.searchParams.get('q') || '').trim();
      let list = applicationsOut();
      if (q) list = list.filter((a) => ((a.company || '') + (a.title || '') + (a.position_name || '')).includes(q));
      return { applications: list };
    }
    if (path === '/api/agent/directions' && isGet) return { directions: directionsOut(), daily: DS.settings.daily, configured: false, blocked: DS.settings.blocked || [], autoSync: !!DS.settings.autoSync };
    if (path === '/api/questions/types' && isGet) return questionsTypesOut();
    if (path === '/api/questions' && isGet) {
      const pid = url.searchParams.get('position_id');
      return { questions: pid ? DS.questions.filter((q) => Number(q.position_id) === Number(pid)) : DS.questions };
    }
    if (path === '/api/jds' && isGet) {
      const pid = url.searchParams.get('position_id');
      return { jds: pid ? DS.jds.filter((j) => Number(j.position_id) === Number(pid)) : DS.jds };
    }
    if (path === '/api/kb/state') return { lastCheckAt: '', todayNew: 0, bloggerCount: DS.bloggers.length, itemCount: 0, favCount: 0, noteCount: DS.notes.length, localModel: '' };
    if (path === '/api/kb/bloggers' && isGet) return { bloggers: DS.bloggers, platforms: ['B站', 'YouTube', '其他'] };
    if (path === '/api/kb/notes' && isGet) return { notes: DS.notes };
    if (path === '/api/media/accounts' && isGet) return { accounts: accountsOut(), platforms: ['小红书', '抖音', 'B站', '公众号', '视频号'], statuses: ['规划中', '已导入'] };
    if (path === '/api/books/state') {
      const bs = booksOut();
      return { total: bs.length, want: bs.filter((b) => b.status === '想读').length, reading: bs.filter((b) => b.status === '在读').length, finished: bs.filter((b) => b.status === '读完').length, notes: Object.values(DS.bookNotes).reduce((n, x) => n + x.length, 0), summaryCount: bs.filter((b) => b.summary).length };
    }
    if (path === '/api/books' && isGet) {
      const q = String(url.searchParams.get('q') || '').trim();
      const st = String(url.searchParams.get('status') || '');
      let list = booksOut();
      if (q) list = list.filter((b) => ((b.title || '') + (b.author || '') + (b.note || '')).includes(q));
      if (st) list = list.filter((b) => b.status === st);
      return { books: list, statuses: META.bookStatus };
    }
    if (path === '/api/books/smart-search') return { results: [], source: 'demo' };
    if (path === '/api/books/1/search') return { results: [] };

    let m = path.match(/^\/api\/media\/accounts\/(\d+)\/metrics$/);
    if (m) return mediaMetrics(Number(m[1])) || {};
    m = path.match(/^\/api\/books\/(\d+)\/chapters\/(\d+)$/);
    if (m) return { html: '<h1>示例章节</h1><p>这是一段用于演示的示例正文。</p>' };
    m = path.match(/^\/api\/books\/(\d+)$/);
    if (m && isGet) return bookDetail(Number(m[1])) || {};
    m = path.match(/^\/api\/(positions|openings|applications|jds)\/(\d+)$/);
    if (m && isGet) {
      const list = m[1] === 'positions' ? DS.positions : m[1] === 'openings' ? DS.openings : m[1] === 'applications' ? DS.applications : DS.jds;
      const item = byId(list, m[2]);
      return item ? { [m[1].slice(0, -1)]: item } : {};
    }
    m = path.match(/^\/api\/agent\/resumes\/(\d+)$/);
    if (m && isGet) {
      const r = DS.directions.flatMap((d) => d.resumes || []).find((x) => Number(x.id) === Number(m[1]));
      return r ? { resume: r } : {};
    }
    if (!isGet) {
      // 写操作：保持真实前端行为，并把结果写进浏览器本地数据
      m = path.match(/^\/api\/applications\/(\d+)$/);
      if (m) {
        const id = Number(m[1]);
        if (method === 'DELETE') {
          DS.applications = DS.applications.filter((a) => Number(a.id) !== id);
          saveDemo(); return {};
        }
        const a = byId(DS.applications, id);
        if (a) Object.assign(a, body, { updated_at: stamp() });
        saveDemo(); return { application: a || {} };
      }
      if (path === '/api/applications' && method === 'POST') {
        const id = nextId(DS.applications);
        const p = byId(DS.positions, body.position_id);
        const now = stamp();
        DS.applications.push({ id, ...body, position_id: body.position_id || null, status: body.status || '未投递', created_at: now, updated_at: now, position_name: p ? p.name : null, opening_url: null });
        saveDemo(); return { id };
      }
      m = path.match(/^\/api\/openings\/(\d+)\/to-application$/);
      if (m) {
        const opening = byId(DS.openings, m[1]);
        return opening ? addApplicationFromOpening(opening) : { already: false };
      }
      if (path === '/api/openings/mark-seen') return {};
      m = path.match(/^\/api\/openings\/(\d+)$/);
      if (m) {
        const id = Number(m[1]);
        if (method === 'DELETE') { DS.openings = DS.openings.filter((o) => Number(o.id) !== id); saveDemo(); return {}; }
        const o = byId(DS.openings, id);
        if (o) Object.assign(o, body);
        saveDemo(); return { opening: o || {} };
      }
      if (path === '/api/openings' && method === 'POST') {
        const id = nextId(DS.openings);
        DS.openings.push({ id, ...body, position_id: body.position_id || null, created_at: stamp(), genmai_new: 0 });
        saveDemo(); return { id };
      }
      m = path.match(/^\/api\/positions\/(\d+)$/);
      if (m) {
        const id = Number(m[1]);
        if (method === 'DELETE') {
          DS.positions = DS.positions.filter((p) => Number(p.id) !== id);
          DS.openings = DS.openings.filter((o) => Number(o.position_id) !== id);
          DS.jds = DS.jds.filter((j) => Number(j.position_id) !== id);
          DS.applications.forEach((a) => { if (Number(a.position_id) === id) a.position_id = null; });
          saveDemo(); return {};
        }
        const p = byId(DS.positions, id);
        if (p) Object.assign(p, body);
        saveDemo(); return { position: p || {} };
      }
      if (path === '/api/positions' && method === 'POST') {
        const id = nextId(DS.positions);
        DS.positions.push({ id, ...body, created_at: stamp() });
        saveDemo(); return { id };
      }
      m = path.match(/^\/api\/jds\/(\d+)$/);
      if (m) {
        const id = Number(m[1]);
        if (method === 'DELETE') { DS.jds = DS.jds.filter((j) => Number(j.id) !== id); saveDemo(); return {}; }
        const j = byId(DS.jds, id);
        if (j) Object.assign(j, body);
        saveDemo(); return { jd: j || {} };
      }
      if (path === '/api/jds' && method === 'POST') {
        const id = nextId(DS.jds);
        DS.jds.push({ id, ...body, position_id: body.position_id || null, created_at: stamp() });
        saveDemo(); return { id };
      }
      m = path.match(/^\/api\/questions\/types\/(.+)$/);
      if (m) {
        const name = decodeURIComponent(m[1]);
        if (method === 'DELETE') {
          DS.questionTypes = (DS.questionTypes || []).filter((x) => x !== name);
          DS.questions.forEach((q) => { if (q.type === name) q.type = '未分类'; });
          saveDemo(); return {};
        }
        const newName = String(body.name || '').trim();
        if (newName && newName !== name) {
          DS.questionTypes = (DS.questionTypes || []).map((x) => x === name ? newName : x);
          DS.questions.forEach((q) => { if (q.type === name) q.type = newName; });
        }
        saveDemo(); return {};
      }
      if (path === '/api/questions/types' && method === 'POST') {
        const name = String(body.name || '').trim();
        if (name && !(DS.questionTypes || []).includes(name)) DS.questionTypes.push(name);
        saveDemo(); return {};
      }
      m = path.match(/^\/api\/questions\/(\d+)$/);
      if (m) {
        const id = Number(m[1]);
        if (method === 'DELETE') { DS.questions = DS.questions.filter((q) => Number(q.id) !== id); saveDemo(); return {}; }
        const q = byId(DS.questions, id);
        if (q) Object.assign(q, body, { updated_at: stamp() });
        saveDemo(); return { question: q || {} };
      }
      if (path === '/api/questions' && method === 'POST') {
        const id = nextId(DS.questions);
        DS.questions.push({ id, ...body, type: body.type || '未分类', mastery: body.mastery || '未复习', created_at: stamp(), updated_at: stamp() });
        saveDemo(); return { id };
      }
      if (path === '/api/agent/preferences' && method === 'PUT') { DS.settings.blocked = body.blocked || []; saveDemo(); return {}; }
      if (path === '/api/agent/daily' && method === 'PUT') { Object.assign(DS.settings.daily, body); saveDemo(); return {}; }
      if (path === '/api/agent/auto-sync' && method === 'PUT') { DS.settings.autoSync = !!body.enabled; saveDemo(); return {}; }
      m = path.match(/^\/api\/agent\/directions\/(\d+)\/collect$/);
      if (m) return { found: 0, inserted: 0, candidates: [] };
      m = path.match(/^\/api\/agent\/directions\/(\d+)$/);
      if (m) {
        const id = Number(m[1]);
        if (method === 'DELETE') { DS.directions = DS.directions.filter((d) => Number(d.id) !== id); saveDemo(); return {}; }
        const d = byId(DS.directions, id);
        if (d) Object.assign(d, body, { updated_at: stamp() });
        saveDemo(); return { direction: d || {} };
      }
      if (path === '/api/agent/directions' && method === 'POST') {
        const id = nextId(DS.directions);
        DS.directions.push({ id, ...body, resumes: [], pending_candidates: 0, synced_candidates: 0, last_run: null, category_blocked: false, created_at: stamp(), updated_at: stamp() });
        saveDemo(); return { id };
      }
      if (path === '/api/agent/resumes' && method === 'POST') {
        const directionId = Number(body.direction_id);
        const d = byId(DS.directions, directionId);
        if (!d) return { ok: false, error: '演示方向不存在' };
        d.resumes = d.resumes || [];
        const rid = nextId(d.resumes);
        const name = body.name || `简历 ${d.resumes.length + 1}`;
        d.resumes.push({ id: rid, direction_id: directionId, name, file_name: name + '.pdf', content_len: String(body.content || '').length, analysis: null, analyzed_at: '', created_at: stamp(), has_profile: 0 });
        saveDemo(); return { id: rid, method: 'text' };
      }
      m = path.match(/^\/api\/agent\/resumes\/(\d+)\/analyze$/);
      if (m) {
        const r = DS.directions.flatMap((d) => d.resumes || []).find((x) => Number(x.id) === Number(m[1]));
        if (r) { r.analysis = resumeAnalysis; r.analyzed_at = stamp(); saveDemo(); }
        return {};
      }
      m = path.match(/^\/api\/agent\/resumes\/(\d+)\/profile$/);
      if (m) { const r = DS.directions.flatMap((d) => d.resumes || []).find((x) => Number(x.id) === Number(m[1])); if (r) { r.has_profile = 1; saveDemo(); } return {}; }
      m = path.match(/^\/api\/agent\/resumes\/(\d+)$/);
      if (m && method === 'DELETE') { DS.directions.forEach((d) => { d.resumes = (d.resumes || []).filter((r) => Number(r.id) !== Number(m[1])); }); saveDemo(); return {}; }
      m = path.match(/^\/api\/kb\/bloggers\/(\d+)$/);
      if (m) {
        const id = Number(m[1]);
        if (method === 'DELETE') { DS.bloggers = DS.bloggers.filter((b) => Number(b.id) !== id); saveDemo(); return {}; }
        const b = byId(DS.bloggers, id); if (b) Object.assign(b, body); saveDemo(); return { blogger: b || {} };
      }
      if (path === '/api/kb/bloggers' && method === 'POST') {
        const id = nextId(DS.bloggers);
        DS.bloggers.push({ id, ...body, active: body.active === undefined ? 1 : body.active, created_at: stamp(), home_url: body.url || '', item_count: 0 });
        saveDemo(); return { id };
      }
      m = path.match(/^\/api\/kb\/notes\/(\d+)$/);
      if (m) {
        const id = Number(m[1]);
        if (method === 'DELETE') { DS.notes = DS.notes.filter((n) => Number(n.id) !== id); saveDemo(); return {}; }
        const n = byId(DS.notes, id); if (n) Object.assign(n, body, { updated_at: stamp() }); saveDemo(); return { note: n || {} };
      }
      if (path === '/api/kb/notes' && method === 'POST') {
        const id = nextId(DS.notes);
        DS.notes.push({ id, ...body, created_at: stamp(), updated_at: stamp() });
        saveDemo(); return { id };
      }
      m = path.match(/^\/api\/media\/accounts\/(\d+)\/import$/);
      if (m) {
        const account = byId(DS.accounts, Number(m[1]));
        if (!account) return { ok: false, error: '账号不存在' };
        const rows = parseImportData(body.data);
        if (!rows.length) return { ok: false, error: '演示版请粘贴 CSV/JSON 数据（Excel 文件暂不支持）' };
        let inserted = 0, duplicates = 0;
        const seen = new Set(DS.metrics.filter((x) => Number(x.account_id) === Number(account.id)).map((x) => `${x.metric_date}|${x.title}`));
        rows.forEach((row) => {
          const date = row['日期'] || row.date || row.metric_date || '';
          const title = row['标题'] || row.title || '';
          const key = `${date}|${title}`;
          if (!date || !title || seen.has(key)) { duplicates++; return; }
          seen.add(key);
          DS.metrics.push({ id: nextId(DS.metrics), account_id: account.id, metric_date: date, title, views: Number(row['播放'] || row['浏览量'] || row.views) || 0, likes: Number(row['点赞'] || row.likes) || 0, comments: Number(row['评论'] || row.comments) || 0, shares: Number(row['转发'] || row['收藏'] || row.shares) || 0, fans: Number(row['粉丝'] || row.fans) || 0, url: row.url || '' });
          inserted++;
        });
        if (inserted) account.status = '已导入';
        saveDemo(); return { inserted, duplicates, alreadyImported: !inserted && !!duplicates };
      }
      if (path === '/api/media/accounts' && method === 'POST') {
        const id = nextId(DS.accounts);
        DS.accounts.push({ id, ...body, status: body.status || '规划中', created_at: stamp() });
        saveDemo(); return { id };
      }
      m = path.match(/^\/api\/media\/accounts\/(\d+)$/);
      if (m) {
        const id = Number(m[1]);
        if (method === 'DELETE') { DS.accounts = DS.accounts.filter((a) => Number(a.id) !== id); DS.metrics = DS.metrics.filter((x) => Number(x.account_id) !== id); saveDemo(); return {}; }
        const a = byId(DS.accounts, id); if (a) Object.assign(a, body); saveDemo(); return { account: a || {} };
      }
      m = path.match(/^\/api\/media\/metrics\/(\d+)$/);
      if (m && method === 'DELETE') { DS.metrics = DS.metrics.filter((x) => Number(x.id) !== Number(m[1])); saveDemo(); return {}; }
      if (path === '/api/books/smart-import') return { already: true };
      m = path.match(/^\/api\/books\/(\d+)\/summarize$/);
      if (m) {
        const book = byId(DS.books, Number(m[1]));
        if (book) { book.summary = '这是示例总结，用于展示阅读器的 AI 总结区域。'; book.summary_source = body.mode === 'web' ? 'web' : 'text'; book.summary_at = stamp(); book.key_points = book.key_points || []; saveDemo(); }
        return { mode: 'text', summary: book ? book.summary : '' };
      }
      m = path.match(/^\/api\/books\/(\d+)\/progress$/);
      if (m) { const b = byId(DS.books, Number(m[1])); if (b) { b.reading_position = JSON.stringify(body.position || {}); b.last_read_at = stamp(); saveDemo(); } return {}; }
      m = path.match(/^\/api\/books\/notes\/(\d+)$/);
      if (m) {
        const id = Number(m[1]);
        Object.keys(DS.bookNotes).forEach((bid) => { DS.bookNotes[bid] = (DS.bookNotes[bid] || []).filter((n) => Number(n.id) !== id); });
        saveDemo(); return {};
      }
      m = path.match(/^\/api\/books\/(\d+)\/notes$/);
      if (m) {
        const bid = Number(m[1]);
        const list = DS.bookNotes[bid] || (DS.bookNotes[bid] = []);
        if (method === 'POST') {
          const id = list.reduce((mx, n) => Math.max(mx, Number(n.id) || 0), 0) + 1;
          list.push({ id, book_id: bid, created_at: stamp(), ...body });
          saveDemo(); return { id, note: list[list.length - 1] };
        }
      }
      m = path.match(/^\/api\/books\/(\d+)$/);
      if (m) {
        const id = Number(m[1]);
        if (method === 'DELETE') { DS.books = DS.books.filter((b) => Number(b.id) !== id); delete DS.bookNotes[id]; saveDemo(); return {}; }
        const b = byId(DS.books, id);
        if (b) Object.assign(b, body); saveDemo(); return { book: b || {} };
      }
      if (path === '/api/books' && method === 'POST') {
        const id = nextId(DS.books);
        DS.books.push({ id, ...body, status: body.status || '想读', rating: Number(body.rating) || 0, summary: '', key_points: [], created_at: stamp(), note_count: 0, chapter_count: 0, cover_url: '', file_url: '', pdf_url: '' });
        DS.bookNotes[id] = [];
        saveDemo(); return { id };
      }
      if (path === '/api/books/smart-import') return { already: true };
      if (path === '/api/agents/mango/ask') return { reply: '这是公开示例演示。数据保存在当前浏览器，不会上传。完整版的芒果会结合笔记回答。' };
      if (path === '/api/agents/shanzhu/ask') return { reply: '这是公开示例演示。完整版的山竹会分析账号数据并给出内容复盘。' };
      if (path === '/api/agents/genmai/ask') return { reply: '这是公开示例演示。完整版的玄米会按方向筛选岗位。' };
      if (/^\/api\/agents\/(?:genmai|mango|shanzhu)\/chat$/.test(path)) return { reply: '这是公开示例演示，数据只保存在当前浏览器。' };
      if (path === '/api/media/analyze') return { answer: '**示例分析**\n\n这是示例数据，完整版会由山竹结合账号数据输出复盘和选题建议。' };
      if (path === '/api/ai/search') return { target: 'openings', query: '', filters: {}, rows: [] };
      if (path === '/api/open-url') return {};
      return { demo: true };
    }
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
    const data = demoRoute(url.pathname, method, url, init);
    if (data) {
      return Promise.resolve(new Response(JSON.stringify(Object.assign({ ok: true }, data)), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    if (isWrite(method)) {
      return Promise.resolve(new Response(JSON.stringify({ ok: true, demo: true }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    return Promise.resolve(new Response(JSON.stringify({ ok: false, error: '演示数据暂不包含该接口' }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
  };
})();
