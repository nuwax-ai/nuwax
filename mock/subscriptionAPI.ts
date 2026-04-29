// ========================
// In-memory mock data store
// ========================

let nextPlanId = 100;
let nextSubId = 200;

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
];

const subscriptions: any[] = [
  {
    id: 1,
    userId: 1001,
    userName: 'Alice Wang',
    userAvatar: '',
    agentId: 1,
    agentName: 'Code Assistant',
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
    planId: 2,
    planName: 'Pro Plan',
    price: 269,
    cycle: 'quarterly',
    status: 'cancelled',
    startAt: '2026-02-15T00:00:00Z',
    expireAt: '2026-05-15T00:00:00Z',
    createdAt: '2026-02-15T00:00:00Z',
  },
];

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
    const { agentId, planId, status, keyword } = req.query;
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
};
