/* 站点全部文案与作品数据 —— 与参考逐帧核对整理 */

export const SITE = {
  owner: '徐诗怡',
  tagline: "XU SHIYI — PORTFOLIO",
  year: '2026',
}

/* ── 顶部导航 ─────────────────────────────────────────── */
export const NAV = [
  { id: 'about', label: 'ABOUT' },
  { id: 'skills', label: 'SKILLS' },
  { id: 'work', label: 'SELECTED WORK' },
  { id: 'contact', label: 'CONTACT' },
] as const

/* ── ABOUT：工牌 ─────────────────────────────────────── */
export const ABOUT = {
  cardNo: 'NO. 2026-OP',
  title: ['BASIC', 'INFORMATION'],
  titleCn: '个人简介',
  sub: 'PERSONAL PORTFOLIO ID CARD',
  fields: [
    { k: 'NAME / 姓名', v: '徐诗怡' },
    { k: 'GENDER / 性别', v: '女' },
    { k: 'SCHOOL / 学校', v: '华侨大学' },
    { k: 'MAJOR / 专业', v: '英语' },
    { k: 'BIRTH / 出生年月', v: '2005.07' },
    { k: 'GPA', v: '4.25 / 5.0 · 专业前 25%' },
  ],
  email: '1361007247@qq.com',
  phone: '18350930882',
  stampTop: 'CERTIFIED',
  stampMid: 'HUAQIAO · ENGLISH',
  stampRing: 'HUAQIAO UNIVERSITY · 2026 · ENGLISH MAJOR · XSY ·',
  footL: 'XU SHIYI · PORTFOLIO',
  footR: 'PERSONAL DESIGN PORTFOLIO · 2026',
}

/* ── SKILLS：三张卡片 ─────────────────────────────────── */
export type SkillCard = {
  no: string
  kicker: string
  title: string
  desc: string
  rows: { k: string; v: string }[]
  bg: string
  fg: string
}

export const SKILLS: SkillCard[] = [
  {
    no: '01',
    kicker: '01 / CONTENT OPS',
    title: '内容运营',
    desc: '500+ 笔记产出 / 250+ 爆款，累计曝光 420w+。',
    rows: [
      { k: 'PLATFORM', v: '小红书 / 公众号' },
      { k: 'CYCLE', v: '提炼框架 → 批量生产 → 数据验证 → 入库复用' },
      { k: 'TOOLS', v: '秀米 / 剪映 / 可画 / Xmind' },
    ],
    bg: '#1b28d8',
    fg: '#ffffff',
  },
  {
    no: '02',
    kicker: '02 / VISUAL DESIGN',
    title: '视觉设计',
    desc: '海报、PPT、长图排版——把信息做成可被记住的画面。',
    rows: [
      { k: 'GRAPHIC', v: 'Photoshop / 可画 / Canva' },
      { k: 'LAYOUT', v: '秀米 / PPT' },
      { k: 'STYLE', v: '扁平插画 / 新中式 / 孟菲斯 / 治愈系' },
    ],
    bg: '#c8f322',
    fg: '#12140f',
  },
  {
    no: '03',
    kicker: '03 / COPYWRITING',
    title: '文案创作',
    desc: '英语专业 × 新媒体文案，中英双语创作与公文写作训练。',
    rows: [
      { k: 'CERT', v: 'CET-4 · CET-6 · TEM-4 · CFT-4 · 普通话二甲' },
      { k: 'TYPES', v: '公众号长文 / 招生宣讲稿' },
      { k: 'TEACHING', v: '高中英语教师资格证' },
    ],
    bg: '#ffffff',
    fg: '#14161a',
  },
]

/* ── SELECTED WORK：四个文件夹 ───────────────────────── */
export const FOLDERS = [
  {
    id: 'video',
    en: ['VIDEO'],
    cn: '影像作品',
    bg: '#0b0b0d',
    fg: '#e0322a',
    cnFg: '#e0322a',
    x: -30,
    y: 12,
    rot: -6,
    z: 1,
  },
  {
    id: 'design',
    en: ['VISUAL', 'DESIGN'],
    cn: '视觉类设计',
    bg: '#c8f322',
    fg: '#1b28d8',
    cnFg: '#1b28d8',
    x: 0,
    y: 0,
    rot: -7,
    z: 3,
  },
  {
    id: 'photograph',
    en: ['PHOTO', 'GRAPH'],
    cn: '摄影作品',
    bg: '#1b28d8',
    fg: '#c8f322',
    cnFg: '#ffffff',
    x: 30,
    y: -18,
    rot: 3,
    z: 2,
  },
  {
    id: 'internship',
    en: ['INTERNSHIP', 'NOTES'],
    cn: '实习成果',
    bg: '#f8f8f6',
    fg: '#14161a',
    cnFg: '#14161a',
    x: 22,
    y: 20,
    rot: 2,
    z: 2,
  },
  {
    id: 'accounts',
    en: ['ACCOUNT', 'OPS'],
    cn: '账号运营',
    bg: '#8a5cf6',
    fg: '#ffffff',
    cnFg: '#ffffff',
    x: -26,
    y: -20,
    rot: -4,
    z: 1,
  },
] as const

/* ── DESIGN › 01 POSTERS ─────────────────────────────── */
export const POSTERS = [
  { src: 'baituan', title: '百团大战 · BAITUAN DAZHAN' },
  { src: 'wenhua', title: '声入万卷 · WENHUA DAGUANYUAN' },
  { src: 'qiuyuan', title: '盛世国庆·遇中秋 · NATIONAL & MID-AUTUMN' },
  { src: 'recruit1', title: '华音社招新 · RECRUITMENT I' },
  { src: 'recruit2', title: '华音社招新 · RECRUITMENT II' },
]

/* ── DESIGN › 02 ARTICLES（公众号长文，3 篇） ─────────
 * article 字段：cover = /assets/articles/aN.webp 的 slug
 * href = 微信公众号原始链接（与 PPT 中逐篇核对） */
export const ARTICLES = [
  {
    no: '01',
    cover: 'a1',
    en: 'ROUTINE REVIEW',
    cn: '例行活动回顾 · 声韵流转，戏梦浮生',
    sub: '华音社 · 例行活动',
    desc: '明黄+浅蓝青春配色，利用秀米分栏与边框组件，划分“寻韵之美”“默契考验”等模块，降低长文阅读疲劳。',
    href: 'https://mp.weixin.qq.com/s/7IPgSuFCUdrhdylNI5TA_g?click_id=2058241759',
    accent: '#f0b53a',
  },
  {
    no: '02',
    cover: 'a2',
    en: 'VOICE ACTING',
    cn: '配音实战活动回顾 · 声启新程',
    sub: '华音社 · 系列活动',
    desc: '暖橙/浅黄色调，营造历史厚重感。三周连续活动采用统一视觉框架，利用 LIVE 标签模拟现场感。',
    href: 'https://mp.weixin.qq.com/s/YOevbIG2og2heFxlHcGBXA',
    accent: '#e0933a',
  },
  {
    no: '03',
    cover: 'a3',
    en: 'CULTURE GARDEN',
    cn: '文化大观园活动总结 · 一声入境，万卷游园',
    sub: '华音社 · 文化大观游园会',
    desc: '新中式淡绿/米色基调，古风植物元素与水墨边框。文案以诗词对仗开场，巧妙运用“左滑查看更多”交互组件。',
    href: 'https://mp.weixin.qq.com/s/uBji-0wX8FnycLxrW6ACDQ?click_id=198434841',
    accent: '#9db86f',
  },
]

/* ── PHOTOGRAPH：12 张摄影 ───────────────────────────── */
export const PHOTOS = [
  'p11', 'p4', 'p3', 'p2',
  'p1', 'p5', 'p7', 'p6',
  'p9', 'p8', 'p10', 'p12',
]

/* ── VIDEO：3 支视频 ─────────────────────────────────── */
export const VIDEOS = [
  {
    no: '01',
    en: 'GAME EDITING',
    cn: '游戏视频剪辑 · 逆水寒',
    desc: '脚本策划 / 剪辑 · 镜头语言、调色处理、配乐剪辑',
    cover: 'v1',
    href: '/assets/video/v1.mp4',
  },
  {
    no: '02',
    en: 'CAMPUS FILM',
    cn: '学院“春之声”短视频活动',
    desc: '摄像 / 剪辑 · 剪映 · 活动纪实、人物跟拍、快剪节奏、氛围渲染',
    cover: 'v2',
    href: '/assets/video/v2.mp4',
  },
  {
    no: '03',
    en: 'MICRO FILM',
    cn: '校级微电影大赛作品',
    desc: '演员 / 摄像 / 剪辑 · 剪映 · 故事叙事、镜头语言、情感调度、调色处理',
    cover: 'v3',
    href: '/assets/video/v3.mp4',
  },
]

/* ── 实习成果：9 篇小红书爆款笔记 ──────────────────────
 * cover  = /assets/notes/nN.webp 的 slug（与图片逐张核对：
 *          n1 健身党 / n2 女团直拍 / n3 把手机放下 / n4 男团舞台 /
 *          n5 黄金45分钟 / n6 身材好不好 / n7 困在工位 / n8 帮我拍个板 / n9 在家爬坡）
 * href   = 小红书原始链接（与标题逐一对应）
 * stats  = 点击大图展示的笔记数据（来自截图实读） */
export const NOTES = [
  {
    no: '01',
    cover: 'n5',
    title: '黄金45分钟爬坡法｜亲测掉秤',
    strategy: '干货教程型',
    stats: '点赞 1711 · 收藏 1204 · 评论 28',
    desc: '将产品功能转化为可执行参数（热身 5 分钟坡度 8 速度 3，燃脂 35 分钟坡度 12 速度 3.5）。收藏破千，验证“干货清单型”的长尾搜索价值。',
    href: 'https://www.xiaohongshu.com/explore/6a7307670000000033009348?xsec_token=CBQjp-Gy_ZaLAtSKT6X9i639pkA4KukOxMIwTxTYAWrao=&xsec_source=app_share',
  },
  {
    no: '02',
    cover: 'n7',
    title: '我不该一直困在工位错过一切',
    strategy: '情感共鸣型',
    stats: '点赞 492 · 收藏 81 · 评论 40',
    desc: '以情绪价值切入打工人痛点，大字报封面 + 负面情绪标题，将跑步机作为“重获生活掌控感”的出口进行软植入。评论区形成情感共鸣场。',
    href: 'https://www.xiaohongshu.com/explore/6a6b355a000000002402694a?xsec_token=AB458la83Lfa9PYsyx-BHWUcsb6wRlXY4WkqKoNp3e3OQ=&xsec_source=pc_user',
  },
  {
    no: '03',
    cover: 'n1',
    title: '健身党选跑步机，我只看这三点',
    strategy: '痛点测评型',
    stats: '点赞 234 · 收藏 12 · 评论 6',
    desc: '针对高意向决策人群，以“自己买的，不骗健身党”建立信任，围绕跑台宽度、马达稳定、减震效果进行专业拆解。',
    href: 'https://www.xiaohongshu.com/explore/6a72ba670000000033012712?xsec_token=CBj4jXGwH0BUv2sp239Lu5LszuNkIqWXH3gTDcF1ShKDo=&xsec_source=app_share',
  },
  {
    no: '04',
    cover: 'n2',
    title: '爬坡看女团直拍时间过得好快啊！',
    strategy: '场景借势型',
    stats: '点赞 313 · 收藏 8 · 评论 5',
    desc: '解决“跑步 5 分钟倒计时”痛点，将“追星/看舞台”与“爬坡”绑定，赋予产品娱乐属性，击中年轻女性群体。',
    href: 'https://www.xiaohongshu.com/explore/6a8e498b0000000020031b85?xsec_token=CBrP6m1EkNdQDKWn5smWUukVPwckQDcfiv7VJwN19qVcg=&xsec_source=pc_share&source=webshare',
  },
  {
    no: '05',
    cover: 'n8',
    title: '帮我拍个板吧，买了请大家云跑步哈哈',
    strategy: '生活化互动型',
    stats: '点赞 298 · 收藏 94 · 评论 13',
    desc: '用“买了求监督”的轻度求助建立真实人设，引导评论区互动。',
    href: 'https://www.xiaohongshu.com/explore/6a7c35f50000000022010606?xsec_token=CBPsDxNrDuBH8xpFy2ev7lwi6iELo6mdD6xa8JRMjOUjo=&xsec_source=app_share',
  },
  {
    no: '06',
    cover: 'n3',
    title: '把手机放下之后，状态真的会变好',
    strategy: '情绪共鸣型',
    stats: '点赞 328 · 收藏 58 · 评论 11',
    desc: '用真实生活切片切入情绪，把跑步机塑造成“重建生活掌控感”的工具。',
    href: 'https://www.xiaohongshu.com/explore/6a8e80120000000021032ead?xsec_token=ABMR7VweB0-vPlUWZsze4nMieCi-3ZZQKxK-JSkKD2qzY=&xsec_source=pc_share&source=webshare',
  },
  {
    no: '07',
    cover: 'n9',
    title: '在家爬坡瘦了！亲测有效参数',
    strategy: '效果展示型',
    stats: '点赞 637 · 收藏 405 · 评论 2',
    desc: '用“参数表+拉伸干货”说话，把居家爬坡拍成可复制的减脂方案。',
    href: 'https://www.xiaohongshu.com/explore/6a73073100000000250110ad?xsec_token=CB-BYHxWtrQ6Rsb55jM6Nc0IH1cPpvmU7SUNZfTtKYouk=&xsec_source=app_share',
  },
  {
    no: '08',
    cover: 'n6',
    title: '身材好不好不用出门证明……',
    strategy: '情绪共鸣型',
    stats: '点赞 554 · 收藏 72 · 评论 20',
    desc: '用反问句切入身材焦虑，把居家爬坡转译为“自我对话”的过程。',
    href: 'https://www.xiaohongshu.com/explore/6a6716d0000000000301f4ab?xsec_token=MBfg5wJ3j9zn9Dx4DZfkXPpqVjO43TtthT7VCjun8A-KA=&xsec_source=pc_pgy',
  },
  {
    no: '09',
    cover: 'n4',
    title: '爬坡看男团舞台真的会忘记累！！',
    strategy: '场景借势型',
    stats: '点赞 263 · 收藏 34 · 评论 15',
    desc: '延续爬坡+舞台的组合拳，把枯燥运动变成情绪充电站。',
    href: 'https://www.xiaohongshu.com/explore/6a799bfd000000002402d4ad?xsec_token=CBFrvZwnLQ-SWrRBRC8T3luwqE96ylPJPIvn9XZOk0qiE=&xsec_source=app_share',
  },
]
export const NOTE_COLORS = ['#cfe0c3', '#f0e6a8', '#e8b7b7', '#a9c9dd', '#e5cfe0', '#d8cdb8']

export const SEED_NOTES = [
  { id: 's1', text: '', color: '#cfe0c3', x: 14, y: 42, rot: -2 },
  { id: 's2', text: '', color: '#f0e6a8', x: 70, y: 12, rot: 3 },
  { id: 's3', text: '', color: '#e8b7b7', x: 80, y: 33, rot: -3 },
]


/* ── ACCOUNT OPS：小红书账号运营（2 个账号，生活类为主） ──
 * cover = /assets/accounts/<slug>.webp
 * href  = 该账号代表作的小红书原文链接（与 PPT 逐页核对） */
export const ACCOUNTS = [
  {
    id: 'life',
    nickname: '栀白',
    handle: '小红书号 18961441627',
    ip: 'IP 福建',
    bio: 'Love Song',
    tag: '生活类 · 兼职·成长记录',
    style: '真实经历型',
    stats: { following: 0, followers: 11, likes: 186, notes: 3 },
    home: 'home-edu',
    notes: [
      {
        cover: 'edu-note',
        title: '伴鱼第一节课成功！',
        date: '03-18',
        likes: 70,
        plays: 4599,
        insight: '封面点击率 28.1% · 超 90% 同类',
      },
    ],
    chart: {
      label: '《伴🐟第一节课成功！》 数据表现',
      rows: [
        { k: '曝光', v: 17018 },
        { k: '观看', v: 4599 },
        { k: '点赞', v: 70 },
        { k: '评论', v: 99 },
      ],
      radar: [
        { k: '点击率', v: 26.8, max: 40 },
        { k: '互动率', v: 6, max: 20 },
        { k: '完播/观看', v: 55.3, max: 100 },
        { k: '涨粉', v: 8, max: 30 },
        { k: '收藏', v: 30, max: 60 },
      ],
      analysis:
        '真实经历型：全新打造大学生生活垂类账号，聚焦兼职、成长经验等刚需赛道，依托真实经历打造高共鸣内容。深度适配小红书算法，优化标题、封面与关键词布局，单篇爆款笔记曝光达 1.7w+、观看 4000+，沉淀精准大学生用户群体。',
    },
    href: 'https://www.xiaohongshu.com/explore/69bab685000000002301c2f1?xsec_token=ABB29k1QwaT2s3XzyNlL6_ojHwZXFls4ficTr4x57tqVM=&xsec_source=pc_search',
  },
  {
    id: 'game',
    nickname: '世界在下小鱼',
    handle: '小红书号 342781987',
    ip: 'IP 福建',
    bio: '如果泪水比爱多那我们就划船吧 ´･ᴗ･`',
    tag: '游戏类 · 逆水寒游戏摄影',
    style: '视觉审美型',
    stats: { following: 92, followers: 28, likes: 228, notes: 16 },
    home: 'home-life',
    notes: [
      {
        cover: 'life-note',
        title: '风有约，花不误🌸',
        date: '08-08',
        likes: 54,
        plays: 487,
        insight: '封面点击率 14.9% · 超 66% 同类',
      },
    ],
    chart: {
      label: '《风有约，花不误🌸》 数据表现',
      rows: [
        { k: '曝光', v: 2447 },
        { k: '观看', v: 487 },
        { k: '点赞', v: 54 },
        { k: '评论', v: 6 },
      ],
      radar: [
        { k: '点击率', v: 14.6, max: 30 },
        { k: '互动率', v: 14.2, max: 30 },
        { k: '完播/观看', v: 3.7, max: 8 },
        { k: '画质', v: 3.8, max: 5 },
        { k: '涨粉', v: 1, max: 10 },
      ],
      analysis:
        '视觉审美型：深度适配算法，优化封面构图（人物与花树留白）、情绪化标题、关键词布局（#逆水寒新世界 #游戏摄影）。点击率超同类中位数，互动率 14.2%，展现视觉构图与情绪文案功底。',
    },
    href: 'https://www.xiaohongshu.com/explore/6a774568000000002402fc56?xsec_token=ABb15uxRHjvP0Mcxl5OJoxl3QyL3t--tiMv2meAso2GnU=&xsec_source=pc_user',
  },
]

/* ── DESIGN › 03 PPT SHOWCASE（4 份精选演示文稿） ──
 * cover = /assets/ppt/<slug>.webp（PPT 首页代表性画面） */
export const PPT_DECKS = [
  {
    no: '01',
    cover: 'suzhou',
    en: 'GARDEN & EMBROIDERY',
    cn: '园林邂逅绣艺 · 一场古韵雅事',
    tag: '文化 · 中英双语',
    desc: '以苏州园林为线索，将刺绣工艺、古典诗词与实景摄影编织成一场古韵雅事。',
    pages: 25,
    gallery: ['suzhou-6', 'suzhou-5'],
  },
  {
    no: '02',
    cover: 'ragnarok',
    en: 'RAGNARÖK',
    cn: '诸神黄昏 · 命运与自由意志的悲剧交响',
    tag: '文学哲思 · 英文',
    desc: '从北欧神话出发，探讨命运与自由意志的悲剧哲学，史诗油画质感贯穿全篇。',
    pages: 15,
    gallery: ['ragnarok-4', 'ragnarok-12'],
  },
  {
    no: '03',
    cover: 'microexile',
    en: 'MICRO-EXILE',
    cn: '微小放逐 · 喧嚣时代里听见自己的声音',
    tag: '议题演讲 · 英文',
    desc: '关于现代生活中“微小放逐”与自我发现的英文演讲，水彩质感温柔克制。',
    pages: 18,
    gallery: ['microexile-6', 'microexile-13'],
  },
  {
    no: '04',
    cover: 'impression',
    en: 'FRENCH IMPRESSIONISM',
    cn: '法国印象派绘画之旅',
    tag: '艺术赏析 · 中文',
    desc: '循着光影与色彩漫步印象派，赏析代表画家与作品的诗意瞬间。',
    pages: 20,
    gallery: ['impression-4', 'impression-9'],
  },
]
