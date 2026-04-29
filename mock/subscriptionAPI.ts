// ========================
// In-memory mock data store
// ========================

let nextPlanId = 100;
let nextSubId = 200;
let nextPkgId = 50;

const pricingPlans: any[] = [
  {
    id: 1,
    spaceId: 1,
    name: 'Basic Plan',
    description: 'Basic subscription plan with essential features',
    price: 99,
    cycle: 'monthly',
    benefits: ['Access to basic models', '100 API calls/day'],
    enabled: true,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-04-01T08:00:00Z',
  },
  {
    id: 2,
    spaceId: 1,
    name: 'Pro Plan',
    description: 'Professional plan with advanced features and higher limits',
    price: 269,
    cycle: 'quarterly',
    benefits: [
      'Access to all models',
      '1000 API calls/day',
      'Priority support',
    ],
    enabled: true,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-04-01T08:00:00Z',
  },
  {
    id: 3,
    spaceId: 1,
    name: 'Enterprise Plan',
    description:
      'Enterprise-grade plan with unlimited access and dedicated support',
    price: 999,
    cycle: 'yearly',
    benefits: [
      'Unlimited API calls',
      'Dedicated support',
      'Custom models',
      'SLA guarantee',
    ],
    enabled: true,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-04-01T08:00:00Z',
  },
  {
    id: 4,
    spaceId: 752,
    name: '基础版',
    description: '适合个人开发者，包含核心功能',
    price: 99,
    cycle: 'monthly',
    benefits: ['基础模型访问', '100次/日 API 调用'],
    enabled: true,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-04-01T08:00:00Z',
  },
  {
    id: 5,
    spaceId: 752,
    name: '专业版',
    description: '适合专业团队，包含高级功能和更高限额',
    price: 269,
    cycle: 'quarterly',
    benefits: ['全部模型访问', '1000次/日 API 调用', '优先技术支持'],
    enabled: true,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-04-01T08:00:00Z',
  },
  {
    id: 6,
    spaceId: 752,
    name: '企业版',
    description: '企业级方案，无限访问量和专属支持',
    price: 999,
    cycle: 'yearly',
    benefits: ['无限 API 调用', '专属技术支持', '自定义模型', 'SLA 保障'],
    enabled: false,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-04-01T08:00:00Z',
  },
];

const subscriptions: any[] = [
  {
    id: 1,
    userId: 1001,
    userName: 'Alice Wang',
    userAvatar: '',
    agentId: 1,
    agentName: 'Code Assistant',
    spaceId: 1,
    planId: 1,
    planName: 'Basic Plan',
    price: 99,
    cycle: 'monthly',
    status: 'active',
    startAt: '2026-04-01T00:00:00Z',
    expireAt: '2026-05-01T00:00:00Z',
    createdAt: '2026-04-01T00:00:00Z',
  },
  {
    id: 2,
    userId: 1002,
    userName: 'Bob Li',
    userAvatar: '',
    agentId: 2,
    agentName: 'Data Analyst',
    spaceId: 1,
    planId: 2,
    planName: 'Pro Plan',
    price: 269,
    cycle: 'quarterly',
    status: 'active',
    startAt: '2026-03-15T00:00:00Z',
    expireAt: '2026-06-15T00:00:00Z',
    createdAt: '2026-03-15T00:00:00Z',
  },
  {
    id: 3,
    userId: 1003,
    userName: 'Charlie Zhang',
    userAvatar: '',
    agentId: 1,
    agentName: 'Code Assistant',
    spaceId: 1,
    planId: 1,
    planName: 'Basic Plan',
    price: 99,
    cycle: 'monthly',
    status: 'expired',
    startAt: '2026-02-01T00:00:00Z',
    expireAt: '2026-03-01T00:00:00Z',
    createdAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 4,
    userId: 1004,
    userName: 'Diana Chen',
    userAvatar: '',
    agentId: 3,
    agentName: 'Writing Assistant',
    spaceId: 1,
    planId: 3,
    planName: 'Enterprise Plan',
    price: 999,
    cycle: 'yearly',
    status: 'active',
    startAt: '2026-01-01T00:00:00Z',
    expireAt: '2027-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 5,
    userId: 1005,
    userName: 'Eve Liu',
    userAvatar: '',
    agentId: 2,
    agentName: 'Data Analyst',
    spaceId: 1,
    planId: 2,
    planName: 'Pro Plan',
    price: 269,
    cycle: 'quarterly',
    status: 'cancelled',
    startAt: '2026-02-15T00:00:00Z',
    expireAt: '2026-05-15T00:00:00Z',
    createdAt: '2026-02-15T00:00:00Z',
  },
  {
    id: 6,
    userId: 1006,
    userName: 'Alice Wang',
    userAvatar: '',
    agentId: 4,
    agentName: '智能客服助手',
    spaceId: 752,
    planId: 4,
    planName: '基础版',
    price: 99,
    cycle: 'monthly',
    status: 'active',
    startAt: '2026-04-01T00:00:00Z',
    expireAt: '2026-05-01T00:00:00Z',
    createdAt: '2026-04-01T00:00:00Z',
  },
  {
    id: 7,
    userId: 1007,
    userName: 'Bob Li',
    userAvatar: '',
    agentId: 5,
    agentName: '数据分析师',
    spaceId: 752,
    planId: 5,
    planName: '专业版',
    price: 269,
    cycle: 'quarterly',
    status: 'active',
    startAt: '2026-03-15T00:00:00Z',
    expireAt: '2026-06-15T00:00:00Z',
    createdAt: '2026-03-15T00:00:00Z',
  },
  {
    id: 8,
    userId: 1008,
    userName: 'Charlie Zhang',
    userAvatar: '',
    agentId: 4,
    agentName: '智能客服助手',
    spaceId: 752,
    planId: 4,
    planName: '基础版',
    price: 99,
    cycle: 'monthly',
    status: 'expired',
    startAt: '2026-02-01T00:00:00Z',
    expireAt: '2026-03-01T00:00:00Z',
    createdAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 9,
    userId: 1009,
    userName: 'Diana Chen',
    userAvatar: '',
    agentId: 6,
    agentName: '写作助手',
    spaceId: 752,
    planId: 6,
    planName: '企业版',
    price: 999,
    cycle: 'yearly',
    status: 'active',
    startAt: '2026-01-01T00:00:00Z',
    expireAt: '2027-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 10,
    userId: 1010,
    userName: 'Eve Liu',
    userAvatar: '',
    agentId: 5,
    agentName: '数据分析师',
    spaceId: 752,
    planId: 5,
    planName: '专业版',
    price: 269,
    cycle: 'quarterly',
    status: 'cancelled',
    startAt: '2026-02-15T00:00:00Z',
    expireAt: '2026-05-15T00:00:00Z',
    createdAt: '2026-02-15T00:00:00Z',
  },
];

const creditPackageMocks: any[] = [
  {
    id: 1,
    name: '入门包',
    credits: 100,
    price: 10,
    originalPrice: 15,
    tag: '',
    enabled: true,
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 2,
    name: '标准包',
    credits: 500,
    price: 45,
    originalPrice: 50,
    tag: '热门',
    enabled: true,
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 3,
    name: '专业包',
    credits: 2000,
    price: 150,
    originalPrice: 200,
    tag: '最划算',
    enabled: true,
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 4,
    name: '企业包',
    credits: 10000,
    price: 600,
    originalPrice: 1000,
    tag: '限时折扣',
    enabled: false,
    createdAt: '2026-02-01T08:00:00Z',
  },
];

// ── 资源定价（模型/工具/技能）Mock 数据 ──

const modelPricingMocks: any[] = [
  {
    id: 1,
    name: 'GPT-4o',
    provider: 'OpenAI',
    enabled: true,
    tiers: [
      {
        label: '≤32K',
        inputPrice: 0.005,
        outputPrice: 0.015,
        cachePrice: 0.0025,
      },
      { label: '>32K', inputPrice: 0.01, outputPrice: 0.03, cachePrice: 0.005 },
    ],
  },
  {
    id: 2,
    name: 'GPT-4o-mini',
    provider: 'OpenAI',
    enabled: true,
    tiers: [
      {
        label: '≤32K',
        inputPrice: 0.00015,
        outputPrice: 0.0006,
        cachePrice: 0.000075,
      },
      {
        label: '>32K',
        inputPrice: 0.0003,
        outputPrice: 0.0012,
        cachePrice: 0.00015,
      },
    ],
  },
  {
    id: 3,
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    enabled: true,
    tiers: [
      {
        label: '≤32K',
        inputPrice: 0.003,
        outputPrice: 0.015,
        cachePrice: 0.0015,
      },
      {
        label: '>32K',
        inputPrice: 0.003,
        outputPrice: 0.015,
        cachePrice: 0.0015,
      },
    ],
  },
  {
    id: 4,
    name: 'DeepSeek-V3',
    provider: 'DeepSeek',
    enabled: false,
    tiers: [
      {
        label: '≤32K',
        inputPrice: 0.0005,
        outputPrice: 0.002,
        cachePrice: 0.0001,
      },
      {
        label: '>32K',
        inputPrice: 0.0005,
        outputPrice: 0.002,
        cachePrice: 0.0001,
      },
    ],
  },
  {
    id: 5,
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    enabled: true,
    tiers: [
      {
        label: '≤128K',
        inputPrice: 0.00125,
        outputPrice: 0.005,
        cachePrice: 0.0003,
      },
      {
        label: '>128K',
        inputPrice: 0.0025,
        outputPrice: 0.01,
        cachePrice: 0.0006,
      },
    ],
  },
];
let nextModelPricingId = 6;

const toolPricingMocks: any[] = [
  {
    id: 1,
    name: 'GPT-4o 文本生成',
    category: 'plugin',
    description: '支持多轮对话与复杂推理任务，高精度自然语言生成',
    price: 0.015,
    period: '次',
    calls: 2847,
    trialCount: 50,
    enabled: true,
    createdAt: '2026-03-01',
  },
  {
    id: 2,
    name: 'DALL·E 图像生成',
    category: 'plugin',
    description: '根据文本描述生成高质量图像，支持多种风格',
    price: 0.08,
    period: '次',
    calls: 1523,
    trialCount: 20,
    enabled: true,
    createdAt: '2026-03-05',
  },
  {
    id: 3,
    name: '语音识别引擎',
    category: 'plugin',
    description: '多语种语音转文字，支持实时流式识别',
    price: 0.003,
    period: '次',
    calls: 8920,
    trialCount: 100,
    enabled: true,
    createdAt: '2026-03-10',
  },
  {
    id: 4,
    name: '视频分析插件',
    category: 'plugin',
    description: '视频内容识别、场景检测与物体追踪',
    price: 0.25,
    period: '次',
    calls: 342,
    trialCount: 10,
    enabled: false,
    createdAt: '2026-03-15',
  },
  {
    id: 5,
    name: 'Claude 长文本分析',
    category: 'workflow',
    description: '超长上下文窗口，适合文档分析与摘要',
    price: 0.025,
    period: '次',
    calls: 1830,
    trialCount: 80,
    enabled: true,
    createdAt: '2026-04-01',
  },
  {
    id: 6,
    name: '日报自动生成',
    category: 'workflow',
    description: '每日自动汇总数据并生成结构化报告',
    price: 0.05,
    period: '次',
    calls: 670,
    trialCount: 30,
    enabled: false,
    createdAt: '2026-04-05',
  },
  {
    id: 7,
    name: '文件搜索 MCP',
    category: 'mcp',
    description: '通过 MCP 协议提供本地文件智能搜索能力',
    price: 0.008,
    period: '次',
    calls: 4200,
    trialCount: 150,
    enabled: true,
    createdAt: '2026-04-10',
  },
  {
    id: 8,
    name: '数据库查询 MCP',
    category: 'mcp',
    description: '通过 MCP 协议执行数据库查询与结果返回',
    price: 0.012,
    period: '次',
    calls: 2150,
    trialCount: 100,
    enabled: true,
    createdAt: '2026-04-12',
  },
];
let nextToolPricingId = 9;

const skillPricingMocks: any[] = [
  {
    id: 1,
    name: 'Text-to-Speech',
    category: 'voice',
    description: '将文字转换为自然流畅的语音输出，支持多种音色',
    pricingModel: 'buyout',
    price: 99,
    calls: 12500,
    enabled: true,
    createdAt: '2026-03-01',
  },
  {
    id: 2,
    name: '图像识别',
    category: 'vision',
    description: '识别图像中的物体、场景和文字内容',
    pricingModel: 'buyout',
    price: 199,
    calls: 8300,
    enabled: true,
    createdAt: '2026-03-05',
  },
  {
    id: 3,
    name: '情感分析',
    category: 'text',
    description: '分析文本中的情感倾向，支持正面/负面/中性分类',
    pricingModel: 'monthly',
    price: 29.9,
    calls: 6200,
    enabled: true,
    createdAt: '2026-03-10',
  },
  {
    id: 4,
    name: '关键词提取',
    category: 'text',
    description: '从文本中自动提取核心关键词和短语',
    pricingModel: 'monthly',
    price: 19.9,
    calls: 15000,
    enabled: true,
    createdAt: '2026-03-15',
  },
  {
    id: 5,
    name: '人脸检测',
    category: 'vision',
    description: '检测图像中的人脸位置、特征和属性',
    pricingModel: 'buyout',
    price: 149,
    calls: 3400,
    enabled: false,
    createdAt: '2026-03-20',
  },
  {
    id: 6,
    name: '文本翻译',
    category: 'text',
    description: '支持多语种间的文本翻译服务',
    pricingModel: 'monthly',
    price: 39.9,
    calls: 9800,
    enabled: true,
    createdAt: '2026-04-01',
  },
];
let nextSkillPricingId = 7;

const agentSubscriptionConfigs: Record<number, any> = {
  1: {
    enabled: true,
    trialCount: 3,
    planIds: [1, 2, 3],
    description: 'Choose a plan to unlock all features',
  },
  2: { enabled: true, trialCount: 5, planIds: [1, 2], description: '' },
};

const userSubscriptionMap: Record<number, Record<number, boolean>> = {
  1: { 1001: true, 1003: true },
  2: { 1002: true, 1005: true },
  3: { 1004: true },
};

import { S } from './utils';

function paginate(list: any[], pageNum: number, pageSize: number) {
  const start = (pageNum - 1) * pageSize;
  return { list: list.slice(start, start + pageSize), total: list.length };
}

// ── 订阅设置 & 智能体订阅 mock 状态 ──
let subSettingsPlans: any[] = [
  {
    id: 'p1',
    name: '基础版',
    desc: '适合个人开发者入门使用，包含核心功能，性价比之选',
    cycle: '月',
    price: 29.9,
    calls: 1000,
    trialCalls: 50,
    funcOnly: false,
    active: true,
  },
  {
    id: 'p2',
    name: '专业版',
    desc: '适合专业开发者，更多调用次数和高级功能',
    cycle: '月',
    price: 99,
    calls: 10000,
    trialCalls: 100,
    funcOnly: false,
    active: true,
  },
  {
    id: 'p3',
    name: '企业版',
    desc: '适合团队使用，无限调用和专属技术支持',
    cycle: '月',
    price: 299,
    calls: -1,
    trialCalls: 200,
    funcOnly: false,
    active: true,
  },
  {
    id: 'p4',
    name: '旗舰定制版',
    desc: '全功能包含，包干价，不限调用次数',
    cycle: '年',
    price: 9999,
    calls: -1,
    trialCalls: 500,
    funcOnly: false,
    active: true,
  },
  {
    id: 'p5',
    name: 'AI工具订阅',
    desc: '仅限功能使用，模型调用按量计费，灵活搭配',
    cycle: '月',
    price: 19.9,
    calls: 500,
    trialCalls: 20,
    funcOnly: true,
    active: true,
  },
  {
    id: 'p6',
    name: '代码助手包',
    desc: '代码生成、审查、重构等开发工具专用订阅',
    cycle: '月',
    price: 59.9,
    calls: 3000,
    trialCalls: 50,
    funcOnly: true,
    active: true,
  },
  {
    id: 'p7',
    name: '初创团队包',
    desc: '为3-5人小团队量身定制，协作功能全开',
    cycle: '季',
    price: 1079,
    calls: 50000,
    trialCalls: 300,
    funcOnly: false,
    active: true,
  },
  {
    id: 'p8',
    name: '内容创作包',
    desc: '文案撰写、翻译、润色等内容创作工具订阅',
    cycle: '年',
    price: 349,
    calls: 1500,
    trialCalls: 30,
    funcOnly: true,
    active: true,
  },
];
let nextSubSettingsId = 9;

const agentSubPlans: any[] = [
  {
    id: 'plan_a',
    name: '免费版',
    desc: '适合轻度使用，体验基础智能体功能',
    cycle: '月',
    price: 0,
    calls: '50次/日',
    callsNum: 50,
    trialCalls: 0,
    recommend: false,
  },
  {
    id: 'plan_b',
    name: '标准版',
    desc: '适合个人开发者日常使用，性价比之选',
    cycle: '月',
    price: 49.9,
    calls: '500次/日',
    callsNum: 500,
    trialCalls: 50,
    recommend: false,
  },
  {
    id: 'plan_c',
    name: '专业版',
    desc: '适合专业开发者，更多调用和高级模型',
    cycle: '月',
    price: 129,
    calls: '2000次/日',
    callsNum: 2000,
    trialCalls: 100,
    recommend: true,
  },
  {
    id: 'plan_d',
    name: '企业版',
    desc: '适合团队使用，不限调用和专属资源',
    cycle: '月',
    price: 399,
    calls: '不限',
    callsNum: -1,
    trialCalls: 200,
    recommend: false,
  },
  {
    id: 'plan_e',
    name: '季度标准',
    desc: '按季度付费，享受标准版全部能力',
    cycle: '季',
    price: 129,
    calls: '500次/日',
    callsNum: 500,
    trialCalls: 80,
    recommend: false,
  },
  {
    id: 'plan_f',
    name: '年度专业',
    desc: '按年付费优惠，专业版能力全覆盖',
    cycle: '年',
    price: 999,
    calls: '2000次/日',
    callsNum: 2000,
    trialCalls: 200,
    recommend: false,
  },
];

function getAgentSubEndDate(cycle: string) {
  const now = new Date();
  const end = new Date(now);
  switch (cycle) {
    case '月':
      end.setMonth(end.getMonth() + 1);
      break;
    case '季':
      end.setMonth(end.getMonth() + 3);
      break;
    case '年':
      end.setFullYear(end.getFullYear() + 1);
      break;
  }
  return end.toISOString().slice(0, 10);
}

let agentSubCurrent: any = {
  planId: 'plan_b',
  startDate: '2026-03-15',
  endDate: '2026-04-15',
  status: 'active',
};

export default {
  // ── 定价套餐 ──

  'GET /api/space/:spaceId/pricing-plans': (req: any, res: any) => {
    const plans = pricingPlans.filter(
      (p) => p.spaceId === Number(req.params.spaceId),
    );
    res.json(S(plans));
  },

  'POST /api/pricing-plans': (req: any, res: any) => {
    const plan = {
      id: nextPlanId++,
      ...req.body,
      enabled: req.body.enabled ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    pricingPlans.push(plan);
    res.json(S(plan));
  },

  'PUT /api/pricing-plans/:id': (req: any, res: any) => {
    const idx = pricingPlans.findIndex((p) => p.id === Number(req.params.id));
    if (idx === -1)
      return res.json({ code: '0001', data: null, message: 'Not found' });
    pricingPlans[idx] = {
      ...pricingPlans[idx],
      ...req.body,
      id: Number(req.params.id),
      updatedAt: new Date().toISOString(),
    };
    res.json(S(pricingPlans[idx]));
  },

  'DELETE /api/pricing-plans/:id': (req: any, res: any) => {
    const idx = pricingPlans.findIndex((p) => p.id === Number(req.params.id));
    if (idx === -1)
      return res.json({ code: '0001', data: null, message: 'Not found' });
    pricingPlans.splice(idx, 1);
    res.json(S(null));
  },

  'PUT /api/pricing-plans/:id/toggle': (req: any, res: any) => {
    const plan = pricingPlans.find((p) => p.id === Number(req.params.id));
    if (!plan)
      return res.json({ code: '0001', data: null, message: 'Not found' });
    plan.enabled = req.body.enabled;
    plan.updatedAt = new Date().toISOString();
    res.json(S(null));
  },

  // ── 工作空间订阅列表（管理员视角） ──

  'GET /api/subscriptions': (req: any, res: any) => {
    let list = [...subscriptions];
    const { spaceId, agentId, planId, status, keyword } = req.query;
    if (spaceId) list = list.filter((s) => s.spaceId === Number(spaceId));
    if (agentId) list = list.filter((s) => s.agentId === Number(agentId));
    if (planId) list = list.filter((s) => s.planId === Number(planId));
    if (status) list = list.filter((s) => s.status === status);
    if (keyword)
      list = list.filter(
        (s) => s.userName.includes(keyword) || s.agentName.includes(keyword),
      );
    res.json(
      S(
        paginate(
          list,
          Number(req.query.pageNum || 1),
          Number(req.query.pageSize || 20),
        ),
      ),
    );
  },

  // ── 智能体订阅配置 ──

  'GET /api/agent/:agentId/subscription-config': (req: any, res: any) => {
    const config = agentSubscriptionConfigs[Number(req.params.agentId)] || {
      enabled: false,
      trialCount: 0,
      planIds: [],
      description: '',
    };
    res.json(S(config));
  },

  'PUT /api/agent/:agentId/subscription-config': (req: any, res: any) => {
    const agentId = Number(req.params.agentId);
    agentSubscriptionConfigs[agentId] = {
      ...agentSubscriptionConfigs[agentId],
      ...req.body,
    };
    res.json(S(null));
  },

  'GET /api/agent/:agentId/check-subscription': (req: any, res: any) => {
    const agentId = Number(req.params.agentId);
    const currentUserId = 1001;
    const config = agentSubscriptionConfigs[agentId];
    const availablePlans = config?.planIds
      ? pricingPlans.filter((p) => config.planIds.includes(p.id) && p.enabled)
      : pricingPlans.filter((p) => p.enabled);
    res.json(
      S({
        hasSubscription: userSubscriptionMap[agentId]?.[currentUserId] ?? false,
        trialRemaining: userSubscriptionMap[agentId]?.[currentUserId]
          ? 0
          : config?.trialCount ?? 0,
        plans: availablePlans,
      }),
    );
  },

  'POST /api/subscriptions': (req: any, res: any) => {
    const { agentId, planId } = req.body;
    const plan = pricingPlans.find((p) => p.id === planId);
    if (!plan)
      return res.json({ code: '0001', data: null, message: 'Plan not found' });
    const now = new Date();
    const expireAt = new Date(now);
    if (plan.cycle === 'monthly') expireAt.setMonth(expireAt.getMonth() + 1);
    else if (plan.cycle === 'quarterly')
      expireAt.setMonth(expireAt.getMonth() + 3);
    else if (plan.cycle === 'yearly')
      expireAt.setFullYear(expireAt.getFullYear() + 1);
    const sub = {
      id: nextSubId++,
      userId: 1001,
      userName: 'Current User',
      userAvatar: '',
      agentId: Number(agentId),
      agentName: `Agent ${agentId}`,
      planId: plan.id,
      planName: plan.name,
      price: plan.price,
      cycle: plan.cycle,
      status: 'active',
      startAt: now.toISOString(),
      expireAt: expireAt.toISOString(),
      createdAt: now.toISOString(),
    };
    subscriptions.push(sub);
    if (!userSubscriptionMap[Number(agentId)])
      userSubscriptionMap[Number(agentId)] = {};
    userSubscriptionMap[Number(agentId)][1001] = true;
    res.json(S(sub));
  },

  // ── 我的订阅（用户视角） ──

  'GET /api/user/subscriptions': (req: any, res: any) => {
    let list = subscriptions.filter((s) => s.userId === 1001);
    const { status, keyword } = req.query;
    if (status) list = list.filter((s) => s.status === status);
    if (keyword)
      list = list.filter(
        (s) => s.planName.includes(keyword) || s.agentName.includes(keyword),
      );
    res.json(
      S(
        paginate(
          list,
          Number(req.query.pageNum || 1),
          Number(req.query.pageSize || 20),
        ),
      ),
    );
  },

  'DELETE /api/subscriptions/:id': (req: any, res: any) => {
    const sub = subscriptions.find((s) => s.id === Number(req.params.id));
    if (sub) sub.status = 'cancelled';
    res.json(S(null));
  },

  // ── 我的订单 ──

  'GET /api/user/orders': (req: any, res: any) => {
    const orders = [
      {
        id: 1,
        orderNo: 'ORD20260401001',
        productName: 'Basic Plan',
        orderType: 'subscription',
        amount: 99,
        payMethod: 'wechat',
        status: 'paid',
        createdAt: '2026-04-01T10:30:00Z',
      },
      {
        id: 2,
        orderNo: 'ORD20260315001',
        productName: 'Pro Plan',
        orderType: 'subscription',
        amount: 269,
        payMethod: 'alipay',
        status: 'paid',
        createdAt: '2026-03-15T14:20:00Z',
      },
      {
        id: 3,
        orderNo: 'ORD20260220001',
        productName: '100 Credits',
        orderType: 'credits',
        amount: 50,
        payMethod: 'wechat',
        status: 'refunded',
        createdAt: '2026-02-20T09:00:00Z',
      },
      {
        id: 4,
        orderNo: 'ORD20260415001',
        productName: '500 Credits',
        orderType: 'credits',
        amount: 200,
        status: 'pending',
        createdAt: '2026-04-15T16:00:00Z',
      },
    ];
    res.json(
      S(
        paginate(
          orders,
          Number(req.query.pageNum || 1),
          Number(req.query.pageSize || 20),
        ),
      ),
    );
  },

  'POST /api/orders/:id/refund': (_req: any, res: any) => {
    res.json(S(null));
  },

  // ── 我的收益 ──

  'GET /api/user/earnings/summary': (_req: any, res: any) => {
    res.json(
      S({
        totalEarnings: 12800,
        monthlyEarnings: 2450,
        subscriberCount: 38,
        pendingSettlement: 1200,
      }),
    );
  },

  'GET /api/user/earnings': (req: any, res: any) => {
    const earnings = [
      {
        id: 1,
        agentName: 'Code Assistant',
        userName: 'Alice Wang',
        planName: 'Basic Plan',
        cycle: 'monthly',
        earnings: 79,
        settlementStatus: 'settled',
        createdAt: '2026-04-01T00:00:00Z',
      },
      {
        id: 2,
        agentName: 'Data Analyst',
        userName: 'Bob Li',
        planName: 'Pro Plan',
        cycle: 'quarterly',
        earnings: 215,
        settlementStatus: 'settled',
        createdAt: '2026-03-15T00:00:00Z',
      },
      {
        id: 3,
        agentName: 'Writing Assistant',
        userName: 'Diana Chen',
        planName: 'Enterprise Plan',
        cycle: 'yearly',
        earnings: 799,
        settlementStatus: 'pending',
        createdAt: '2026-04-10T00:00:00Z',
      },
    ];
    res.json(
      S(
        paginate(
          earnings,
          Number(req.query.pageNum || 1),
          Number(req.query.pageSize || 20),
        ),
      ),
    );
  },

  // ── 积分 ──

  'GET /api/user/credits': (_req: any, res: any) => {
    res.json(S({ balance: 350, unit: 'credit' }));
  },

  'GET /api/credits/packages': (_req: any, res: any) => {
    res.json(
      S([
        { id: 1, name: '100 Credits', credits: 100, price: 50, tag: 'Popular' },
        {
          id: 2,
          name: '500 Credits',
          credits: 500,
          price: 200,
          originalPrice: 250,
          tag: 'Best Value',
        },
        {
          id: 3,
          name: '1000 Credits',
          credits: 1000,
          price: 350,
          originalPrice: 400,
        },
        {
          id: 4,
          name: '5000 Credits',
          credits: 5000,
          price: 1500,
          tag: 'Enterprise',
        },
      ]),
    );
  },

  'POST /api/credits/purchase': (_req: any, res: any) => {
    res.json(
      S({ payUrl: 'https://pay.example.com/mock-checkout', qrCode: '' }),
    );
  },

  'GET /api/user/credit-records': (req: any, res: any) => {
    const records = [
      {
        id: 1,
        recordType: 'recharge',
        description: 'Purchase 500 Credits',
        amount: 500,
        balance: 500,
        createdAt: '2026-04-10T08:00:00Z',
      },
      {
        id: 2,
        recordType: 'consume',
        description: 'AI Agent usage - Code Assistant',
        amount: -50,
        balance: 450,
        createdAt: '2026-04-12T10:30:00Z',
      },
      {
        id: 3,
        recordType: 'consume',
        description: 'AI Agent usage - Data Analyst',
        amount: -30,
        balance: 420,
        createdAt: '2026-04-14T14:00:00Z',
      },
      {
        id: 4,
        recordType: 'consume',
        description: 'AI Agent usage - Code Assistant',
        amount: -70,
        balance: 350,
        createdAt: '2026-04-18T09:20:00Z',
      },
    ];
    res.json(
      S(
        paginate(
          records,
          Number(req.query.pageNum || 1),
          Number(req.query.pageSize || 20),
        ),
      ),
    );
  },

  // ── 系统管理 - 支付与收益（开发者） ──

  'GET /api/system/dev-earnings-summary': (_req: any, res: any) => {
    res.json(
      S({
        totalEarnings: 85600,
        monthlyEarnings: 12400,
        pendingSettlement: 3600,
        developerCount: 12,
      }),
    );
  },

  'GET /api/system/dev-earnings': (req: any, res: any) => {
    const earnings = [
      {
        id: 1,
        developerName: 'TechStudio',
        agentName: 'Code Assistant',
        userName: 'Alice Wang',
        planName: 'Basic Plan',
        cycle: 'monthly',
        earnings: 79,
        settlementStatus: 'settled',
        createdAt: '2026-04-01T00:00:00Z',
      },
      {
        id: 2,
        developerName: 'DataViz Inc.',
        agentName: 'Data Analyst',
        userName: 'Bob Li',
        planName: 'Pro Plan',
        cycle: 'quarterly',
        earnings: 215,
        settlementStatus: 'settled',
        createdAt: '2026-03-15T00:00:00Z',
      },
      {
        id: 3,
        developerName: 'AI Writer Co.',
        agentName: 'Writing Assistant',
        userName: 'Diana Chen',
        planName: 'Enterprise Plan',
        cycle: 'yearly',
        earnings: 799,
        settlementStatus: 'pending',
        createdAt: '2026-04-10T00:00:00Z',
      },
      {
        id: 4,
        developerName: 'TechStudio',
        agentName: 'Code Assistant',
        userName: 'Charlie Zhang',
        planName: 'Basic Plan',
        cycle: 'monthly',
        earnings: 79,
        settlementStatus: 'settled',
        createdAt: '2026-03-01T00:00:00Z',
      },
      {
        id: 5,
        developerName: 'DataViz Inc.',
        agentName: 'Smart Report',
        userName: 'Eve Liu',
        planName: 'Pro Plan',
        cycle: 'monthly',
        earnings: 215,
        settlementStatus: 'pending',
        createdAt: '2026-04-20T00:00:00Z',
      },
      {
        id: 6,
        developerName: 'CloudBot Labs',
        agentName: 'Customer Support AI',
        userName: 'Frank Wang',
        planName: 'Enterprise Plan',
        cycle: 'yearly',
        earnings: 799,
        settlementStatus: 'settled',
        createdAt: '2026-02-01T00:00:00Z',
      },
    ];
    const { keyword } = req.query;
    let filtered = [...earnings];
    if (keyword)
      filtered = filtered.filter(
        (e) =>
          e.developerName.includes(keyword) ||
          e.agentName.includes(keyword) ||
          e.userName.includes(keyword),
      );
    res.json(
      S(
        paginate(
          filtered,
          Number(req.query.pageNum || 1),
          Number(req.query.pageSize || 20),
        ),
      ),
    );
  },

  // ── 系统管理 - 订阅与积分（管理员） ──

  'GET /api/system/subscription-summary': (_req: any, res: any) => {
    res.json(
      S({
        activeSubscriptions: 38,
        totalUsers: 156,
        monthlyRevenue: 24500,
        totalCredits: 125000,
      }),
    );
  },

  // ── 系统管理 - 积分套餐 CRUD ──

  'GET /api/system/credit-packages': (_req: any, res: any) => {
    res.json(S(creditPackageMocks));
  },

  'POST /api/system/credit-packages': (req: any, res: any) => {
    const pkg = {
      id: nextPkgId++,
      ...req.body,
      enabled: req.body.enabled ?? true,
      createdAt: new Date().toISOString(),
    };
    creditPackageMocks.push(pkg);
    res.json(S(pkg));
  },

  'PUT /api/system/credit-packages/:id': (req: any, res: any) => {
    const idx = creditPackageMocks.findIndex(
      (p) => p.id === Number(req.params.id),
    );
    if (idx === -1)
      return res.json({ code: '0001', data: null, message: 'Not found' });
    creditPackageMocks[idx] = {
      ...creditPackageMocks[idx],
      ...req.body,
      id: Number(req.params.id),
    };
    res.json(S(creditPackageMocks[idx]));
  },

  'DELETE /api/system/credit-packages/:id': (req: any, res: any) => {
    const idx = creditPackageMocks.findIndex(
      (p) => p.id === Number(req.params.id),
    );
    if (idx === -1)
      return res.json({ code: '0001', data: null, message: 'Not found' });
    creditPackageMocks.splice(idx, 1);
    res.json(S(null));
  },

  // ── 资源定价 - 模型定价 ──

  'GET /api/space/:spaceId/resource-pricing/models': (_req: any, res: any) => {
    res.json(S(modelPricingMocks));
  },

  'POST /api/space/:spaceId/resource-pricing/models': (req: any, res: any) => {
    const item = {
      id: nextModelPricingId++,
      ...req.body,
      enabled: req.body.enabled ?? true,
    };
    modelPricingMocks.push(item);
    res.json(S(item));
  },

  'PUT /api/resource-pricing/models/:id': (req: any, res: any) => {
    const idx = modelPricingMocks.findIndex(
      (p) => p.id === Number(req.params.id),
    );
    if (idx === -1)
      return res.json({ code: '0001', data: null, message: 'Not found' });
    modelPricingMocks[idx] = {
      ...modelPricingMocks[idx],
      ...req.body,
      id: Number(req.params.id),
    };
    res.json(S(modelPricingMocks[idx]));
  },

  'DELETE /api/resource-pricing/models/:id': (req: any, res: any) => {
    const idx = modelPricingMocks.findIndex(
      (p) => p.id === Number(req.params.id),
    );
    if (idx === -1)
      return res.json({ code: '0001', data: null, message: 'Not found' });
    modelPricingMocks.splice(idx, 1);
    res.json(S(null));
  },

  'PUT /api/resource-pricing/models/:id/toggle': (req: any, res: any) => {
    const item = modelPricingMocks.find((p) => p.id === Number(req.params.id));
    if (!item)
      return res.json({ code: '0001', data: null, message: 'Not found' });
    item.enabled = req.body.enabled;
    res.json(S(null));
  },

  // ── 资源定价 - 工具定价 ──

  'GET /api/space/:spaceId/resource-pricing/tools': (_req: any, res: any) => {
    res.json(S(toolPricingMocks));
  },

  'POST /api/space/:spaceId/resource-pricing/tools': (req: any, res: any) => {
    const item = {
      id: nextToolPricingId++,
      ...req.body,
      calls: 0,
      enabled: req.body.enabled ?? true,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    toolPricingMocks.unshift(item);
    res.json(S(item));
  },

  'PUT /api/resource-pricing/tools/:id': (req: any, res: any) => {
    const idx = toolPricingMocks.findIndex(
      (p) => p.id === Number(req.params.id),
    );
    if (idx === -1)
      return res.json({ code: '0001', data: null, message: 'Not found' });
    toolPricingMocks[idx] = {
      ...toolPricingMocks[idx],
      ...req.body,
      id: Number(req.params.id),
    };
    res.json(S(toolPricingMocks[idx]));
  },

  'DELETE /api/resource-pricing/tools/:id': (req: any, res: any) => {
    const idx = toolPricingMocks.findIndex(
      (p) => p.id === Number(req.params.id),
    );
    if (idx === -1)
      return res.json({ code: '0001', data: null, message: 'Not found' });
    toolPricingMocks.splice(idx, 1);
    res.json(S(null));
  },

  'PUT /api/resource-pricing/tools/:id/toggle': (req: any, res: any) => {
    const item = toolPricingMocks.find((p) => p.id === Number(req.params.id));
    if (!item)
      return res.json({ code: '0001', data: null, message: 'Not found' });
    item.enabled = req.body.enabled;
    res.json(S(null));
  },

  // ── 资源定价 - 技能定价 ──

  'GET /api/space/:spaceId/resource-pricing/skills': (_req: any, res: any) => {
    res.json(S(skillPricingMocks));
  },

  'POST /api/space/:spaceId/resource-pricing/skills': (req: any, res: any) => {
    const item = {
      id: nextSkillPricingId++,
      ...req.body,
      calls: 0,
      enabled: req.body.enabled ?? true,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    skillPricingMocks.unshift(item);
    res.json(S(item));
  },

  'PUT /api/resource-pricing/skills/:id': (req: any, res: any) => {
    const idx = skillPricingMocks.findIndex(
      (p) => p.id === Number(req.params.id),
    );
    if (idx === -1)
      return res.json({ code: '0001', data: null, message: 'Not found' });
    skillPricingMocks[idx] = {
      ...skillPricingMocks[idx],
      ...req.body,
      id: Number(req.params.id),
    };
    res.json(S(skillPricingMocks[idx]));
  },

  'DELETE /api/resource-pricing/skills/:id': (req: any, res: any) => {
    const idx = skillPricingMocks.findIndex(
      (p) => p.id === Number(req.params.id),
    );
    if (idx === -1)
      return res.json({ code: '0001', data: null, message: 'Not found' });
    skillPricingMocks.splice(idx, 1);
    res.json(S(null));
  },

  'PUT /api/resource-pricing/skills/:id/toggle': (req: any, res: any) => {
    const item = skillPricingMocks.find((p) => p.id === Number(req.params.id));
    if (!item)
      return res.json({ code: '0001', data: null, message: 'Not found' });
    item.enabled = req.body.enabled;
    res.json(S(null));
  },

  'PUT /api/system/credit-packages/:id/toggle': (req: any, res: any) => {
    const pkg = creditPackageMocks.find((p) => p.id === Number(req.params.id));
    if (!pkg)
      return res.json({ code: '0001', data: null, message: 'Not found' });
    pkg.enabled = req.body.enabled;
    res.json(S(null));
  },

  // ── 订阅设置（workspace 管理员 CRUD） ──

  'GET /api/space/:spaceId/subscription-settings': (_req: any, res: any) => {
    res.json(S(subSettingsPlans));
  },

  'POST /api/space/:spaceId/subscription-settings': (req: any, res: any) => {
    const plan = {
      id: 'p' + nextSubSettingsId++,
      ...req.body,
      active: true,
    };
    subSettingsPlans.push(plan);
    res.json(S(plan));
  },

  'PUT /api/subscription-settings/:id': (req: any, res: any) => {
    const idx = subSettingsPlans.findIndex((p) => p.id === req.params.id);
    if (idx === -1)
      return res.json({ code: '0001', data: null, message: 'Not found' });
    subSettingsPlans[idx] = {
      ...subSettingsPlans[idx],
      ...req.body,
      id: req.params.id,
    };
    res.json(S(subSettingsPlans[idx]));
  },

  'DELETE /api/subscription-settings/:id': (req: any, res: any) => {
    subSettingsPlans = subSettingsPlans.filter((p) => p.id !== req.params.id);
    res.json(S(null));
  },

  'PUT /api/subscription-settings/:id/toggle': (req: any, res: any) => {
    const item = subSettingsPlans.find((p) => p.id === req.params.id);
    if (!item)
      return res.json({ code: '0001', data: null, message: 'Not found' });
    item.active = req.body.active;
    res.json(S(null));
  },

  // ── 智能体订阅页面（套餐展示 + 订阅操作） ──

  'GET /api/space/:spaceId/agent-subscriptions/plans': (
    _req: any,
    res: any,
  ) => {
    res.json(S(agentSubPlans));
  },

  'GET /api/space/:spaceId/agent-subscriptions/current': (
    _req: any,
    res: any,
  ) => {
    res.json(S(agentSubCurrent));
  },

  'POST /api/space/:spaceId/agent-subscriptions/subscribe': (
    req: any,
    res: any,
  ) => {
    const { planId } = req.body;
    const plan = agentSubPlans.find((p) => p.id === planId);
    if (!plan)
      return res.json({ code: '0001', data: null, message: 'Plan not found' });
    const now = new Date();
    agentSubCurrent = {
      planId: plan.id,
      startDate: now.toISOString().slice(0, 10),
      endDate: getAgentSubEndDate(plan.cycle),
      status: 'active',
    };
    res.json(S(agentSubCurrent));
  },
};
