# Mock 数据注入 —— UI 验证实施文档

> **版本**：v1.0  
> **日期**：2026-04-29  
> **分支**：`feat-subscriptions-payments`  
> **关联文档**：[订阅与支付开发方案](./subscriptions-payments-dev-plan.md)

---

## 一、问题背景

`feat-subscriptions-payments` 分支新增的所有页面在本地开发环境下**均显示空白**，根本原因如下：

| 原因 | 说明 |
| --- | --- |
| API 未拦截 | umi mock 系统（`mock/subscriptionAPI.ts`）需要 dev server 正常运行才能拦截请求；若请求未被拦截，各组件的 `useState` 初始值保持 `[]` / `null` / `0`，界面无内容 |
| spaceId 不匹配 | `SpaceResource/Pricing` 的 mock 以 `spaceId: 1` 过滤，URL 中的 spaceId 若不为 `1` 则返回空数组 |
| checkResult 为 null | `SubscriptionDrawer` 的 `checkResult` 初始值为 `null`，API 失败后 Drawer 内容全空 |
| plans 为空数组 | `SubscriptionPrompt` 的 `plans` 由父组件通过 prop 传入，若父组件 API 失败则传入空数组，组件无任何内容 |

---

## 二、解决方案

在每个组件内用**内联 mock 常量**作为初始 state 和请求失败后的兜底。

**核心原则**：

- 不改变真实 API 调用逻辑
- 不改变任何 UI 结构或样式
- 联调完成后，只需删除 mock 常量并还原初始值即可

### 统一修改模式

```tsx
// ① 文件顶部定义 mock 常量（在 import 之后、组件定义之前）
const MOCK_LIST: SomeType[] = [...];

// ② 状态初始化用 mock 值（而不是空值）
const [list, setList] = useState(MOCK_LIST);
const [balance, setBalance] = useState(350);   // 而不是 0 / null

// ③ API 成功回调：有数据则覆盖，无数据保留 mock
onSuccess: (res) => {
  setList(res?.data?.length ? res.data : MOCK_LIST);
}

// ④ XProTable request：加 try/catch，失败或空时返回 mock
request={async (params) => {
  try {
    const res = await apiList(params);
    if (res?.code === SUCCESS_CODE && res.data?.list?.length) {
      return { data: res.data.list, total: res.data.total, success: true };
    }
  } catch {}
  return { data: MOCK_LIST, total: MOCK_LIST.length, success: true };
}}
```

---

## 三、修改清单

共涉及 **8 个文件**，均不改变 UI 结构，仅修改初始值和请求兜底逻辑。

---

### 3.1 CreditsBalance（全局积分余额）

**文件**：[`src/components/business-component/CreditsBalance/index.tsx`](../../src/components/business-component/CreditsBalance/index.tsx)

| 改动点 | 原代码 | 新代码 |
| --- | --- | --- |
| balance 初始值 | `useState<number \| null>(null)` | `useState<number \| null>(350)` |
| loading 态 | `if (balance === null) return <Spin />` | 删除（balance 永远有值，无需 loading） |

**效果**：全局 Header 中积分余额立即显示 `350`，不再显示 loading 菊花。

---

### 3.2 CreditRecords（积分明细页）

**文件**：[`src/pages/MorePage/CreditRecords/index.tsx`](../../src/pages/MorePage/CreditRecords/index.tsx)

**新增 mock 常量**：

```tsx
const MOCK_CREDIT_RECORDS: CreditRecordInfo[] = [
  {
    id: 1,
    recordType: CreditRecordTypeEnum.Recharge,
    description: '购买 500 积分包',
    amount: 500,
    balance: 500,
    createdAt: '2026-04-10T08:00:00Z',
  },
  {
    id: 2,
    recordType: CreditRecordTypeEnum.Consume,
    description: 'AI 智能体使用 - 代码助手',
    amount: -50,
    balance: 450,
    createdAt: '2026-04-12T10:30:00Z',
  },
  {
    id: 3,
    recordType: CreditRecordTypeEnum.Consume,
    description: 'AI 智能体使用 - 数据分析师',
    amount: -30,
    balance: 420,
    createdAt: '2026-04-14T14:00:00Z',
  },
  {
    id: 4,
    recordType: CreditRecordTypeEnum.Consume,
    description: 'AI 智能体使用 - 代码助手',
    amount: -70,
    balance: 350,
    createdAt: '2026-04-18T09:20:00Z',
  },
];
```

| 改动点            | 说明                                              |
| ----------------- | ------------------------------------------------- |
| balance 初始值    | `0` → `350`                                       |
| XProTable request | 加 try/catch + 空数据时回退 `MOCK_CREDIT_RECORDS` |

**效果**：顶部余额卡片显示 `350`；表格显示 4 条积分明细（充值 1 条、消费 3 条）。

---

### 3.3 MySubscriptions（我的订阅页）

**文件**：[`src/pages/MorePage/MySubscriptions/index.tsx`](../../src/pages/MorePage/MySubscriptions/index.tsx)

**新增 mock 常量**：

```tsx
const MOCK_MY_SUBSCRIPTIONS: UserSubscriptionInfo[] = [
  { id: 1, agentName: '代码助手',  planName: 'Basic Plan',      price: 99,  cycle: Monthly,   status: Active,    startAt: '2026-04-01', expireAt: '2026-05-01', ... },
  { id: 2, agentName: '数据分析师', planName: 'Pro Plan',        price: 269, cycle: Quarterly,  status: Expired,   startAt: '2026-01-15', expireAt: '2026-04-15', ... },
  { id: 3, agentName: '写作助手',  planName: 'Enterprise Plan', price: 999, cycle: Yearly,     status: Cancelled, startAt: '2026-02-01', expireAt: '2027-02-01', ... },
];
```

| 改动点            | 说明                                                |
| ----------------- | --------------------------------------------------- |
| balance 初始值    | `0` → `350`（顶部积分横幅）                         |
| XProTable request | 加 try/catch + 空数据时回退 `MOCK_MY_SUBSCRIPTIONS` |

**效果**：顶部积分横幅显示 `350`；表格显示 3 条订阅（Active/Expired/Cancelled 状态各一条）。

---

### 3.4 MyOrders（我的订单页）

**文件**：[`src/pages/MorePage/MyOrders/index.tsx`](../../src/pages/MorePage/MyOrders/index.tsx)

**新增 mock 常量**：

```tsx
const MOCK_ORDERS: OrderInfo[] = [
  {
    id: 1,
    orderNo: 'ORD20260401001',
    productName: 'Basic Plan',
    orderType: Subscription,
    amount: 99,
    payMethod: '微信支付',
    status: Paid,
    createdAt: '2026-04-01T10:30:00Z',
  },
  {
    id: 2,
    orderNo: 'ORD20260315001',
    productName: 'Pro Plan',
    orderType: Subscription,
    amount: 269,
    payMethod: '支付宝',
    status: Paid,
    createdAt: '2026-03-15T14:20:00Z',
  },
  {
    id: 3,
    orderNo: 'ORD20260220001',
    productName: '100 积分包',
    orderType: Credits,
    amount: 50,
    payMethod: '微信支付',
    status: Refunded,
    createdAt: '2026-02-20T09:00:00Z',
  },
  {
    id: 4,
    orderNo: 'ORD20260415001',
    productName: '500 积分包',
    orderType: Credits,
    amount: 200,
    payMethod: undefined,
    status: Pending,
    createdAt: '2026-04-15T16:00:00Z',
  },
];
```

| 改动点            | 说明                                      |
| ----------------- | ----------------------------------------- |
| XProTable request | 加 try/catch + 空数据时回退 `MOCK_ORDERS` |

**效果**：表格显示 4 条订单，涵盖已付款、已退款、待支付三种状态，Tag 颜色各异。

---

### 3.5 MyEarnings（我的收益页）

**文件**：[`src/pages/MorePage/MyEarnings/index.tsx`](../../src/pages/MorePage/MyEarnings/index.tsx)

**新增 mock 常量**：

```tsx
const MOCK_EARNINGS_SUMMARY: EarningsSummaryInfo = {
  totalEarnings: 12800,
  monthlyEarnings: 2450,
  subscriberCount: 38,
  pendingSettlement: 1200,
};

const MOCK_EARNINGS: EarningRecordInfo[] = [
  {
    id: 1,
    agentName: '代码助手',
    userName: 'Alice Wang',
    planName: 'Basic Plan',
    cycle: Monthly,
    earnings: 79,
    settlementStatus: Settled,
    createdAt: '2026-04-01',
  },
  {
    id: 2,
    agentName: '数据分析师',
    userName: 'Bob Li',
    planName: 'Pro Plan',
    cycle: Quarterly,
    earnings: 215,
    settlementStatus: Settled,
    createdAt: '2026-03-15',
  },
  {
    id: 3,
    agentName: '写作助手',
    userName: 'Diana Chen',
    planName: 'Enterprise Plan',
    cycle: Yearly,
    earnings: 799,
    settlementStatus: Pending,
    createdAt: '2026-04-10',
  },
];
```

| 改动点 | 说明 |
| --- | --- |
| summary 初始值 | `null` → `MOCK_EARNINGS_SUMMARY`（统计卡片立即显示数字） |
| useRequest onSuccess | `setSummary(res?.data ?? MOCK_EARNINGS_SUMMARY)` |
| XProTable request | 加 try/catch + 空数据时回退 `MOCK_EARNINGS` |

**效果**：4 个统计卡片立即显示数字（¥12800 / ¥2450 / 38 人 / ¥1200）；表格显示 3 条收益明细。

---

### 3.6 SpaceResource/Pricing（资源定价页）

**文件**：[`src/pages/SpaceResource/Pricing/index.tsx`](../../src/pages/SpaceResource/Pricing/index.tsx)

**新增 import**：`PricingCycleEnum`（原文件未导入，mock 常量依赖此 enum）

**新增 mock 常量**：

```tsx
const MOCK_PRICING_PLANS: PricingPlanInfo[] = [
  { id: 1, name: 'Basic Plan',      description: '基础订阅计划，包含核心功能',      price: 99,  cycle: Monthly,   enabled: true,  ... },
  { id: 2, name: 'Pro Plan',        description: '专业计划，包含高级功能和更高限额', price: 269, cycle: Quarterly, enabled: true,  ... },
  { id: 3, name: 'Enterprise Plan', description: '企业级计划，无限访问量和专属支持', price: 999, cycle: Yearly,    enabled: false, ... },
];
```

| 改动点 | 说明 |
| --- | --- |
| planList 初始值 | `[]` → `MOCK_PRICING_PLANS`（卡片立即渲染） |
| useRequest onSuccess | `setPlanList(res?.data?.length ? res.data : MOCK_PRICING_PLANS)` |

**效果**：进入资源定价页立即显示 3 张套餐卡片（Basic/Pro 启用，Enterprise 停用）。

---

### 3.7 SubscriptionDrawer（订阅 Drawer）

**文件**：[`src/components/business-component/SubscriptionDrawer/index.tsx`](../../src/components/business-component/SubscriptionDrawer/index.tsx)

**新增 mock 常量**：

```tsx
const MOCK_CHECK_RESULT: CheckSubscriptionResult = {
  hasSubscription: false,
  trialRemaining: 3,
  plans: [
    { id: 1, name: 'Basic Plan',      price: 99,  cycle: Monthly,   ... },
    { id: 2, name: 'Pro Plan',        price: 269, cycle: Quarterly, ... },
    { id: 3, name: 'Enterprise Plan', price: 999, cycle: Yearly,    ... },
  ],
};
```

| 改动点 | 说明 |
| --- | --- |
| checkResult 初始值 | `null` → `MOCK_CHECK_RESULT`（Drawer 打开立即显示内容） |
| useRequest onSuccess | `setCheckResult(res?.data ?? MOCK_CHECK_RESULT)` |

**效果**：Drawer 打开后立即显示"剩余 3 次试用"提示 + 3 个可订阅套餐卡片。

---

### 3.8 SubscriptionPrompt（订阅引导条）

**文件**：[`src/components/business-component/SubscriptionPrompt/index.tsx`](../../src/components/business-component/SubscriptionPrompt/index.tsx)

**新增 mock 常量**：

```tsx
const FALLBACK_PLANS: PricingPlanInfo[] = [
  { id: 1, name: 'Basic Plan', price: 99,  cycle: Monthly,   ... },
  { id: 2, name: 'Pro Plan',   price: 269, cycle: Quarterly, ... },
];
```

| 改动点 | 说明 |
| --- | --- |
| displayPlans 逻辑 | `plans.slice(0, 2)` → `(plans.length > 0 ? plans : FALLBACK_PLANS).slice(0, 2)` |

**效果**：对话页无订阅无试用次数时，输入框上方引导条显示 2 个套餐芯片。

---

## 四、验证清单

启动开发服务器后，按以下步骤逐项验证：

| # | 路径 / 位置 | 预期内容 |
| --- | --- | --- |
| 1 | 全局 Header（任意页面） | 积分余额显示 `350`，无 loading 菊花 |
| 2 | 更多页 → 我的订阅 | 顶部横幅显示积分 `350`；表格 3 条（绿/灰/红 Tag） |
| 3 | 更多页 → 我的订单 | 4 条订单，颜色：已支付(绿)、待支付(橙)、已退款(灰) |
| 4 | 更多页 → 我的收益 | 4 个统计卡片有数字；3 条收益明细 |
| 5 | 积分明细（从余额点入） | 顶部余额 `350`；4 条积分记录（充值绿/消费红） |
| 6 | `/space/:spaceId/resource-pricing` | 3 张套餐卡片（Basic/Pro/Enterprise） |
| 7 | 对话页 → 订阅图标 → Drawer | 试用 3 次提示 + 3 个套餐卡片 |
| 8 | 对话页（无订阅） | 输入框上方显示 2 个套餐芯片 |

---

## 五、后续移除计划（联调完成后）

真实 API 联调完成、mock 系统稳定后，按以下步骤清理 mock 数据：

### 5.1 可直接删除的内容（不影响功能）

| 文件 | 删除内容 |
| --- | --- |
| `CreditsBalance/index.tsx` | 无需删除（初始值为 `350` 与真实值相差无几，API 会覆盖） |
| `CreditRecords/index.tsx` | 删除 `MOCK_CREDIT_RECORDS` 常量 |
| `MySubscriptions/index.tsx` | 删除 `MOCK_MY_SUBSCRIPTIONS` 常量 |
| `MyOrders/index.tsx` | 删除 `MOCK_ORDERS` 常量 |
| `MyEarnings/index.tsx` | 删除 `MOCK_EARNINGS_SUMMARY`、`MOCK_EARNINGS` 常量 |
| `SpaceResource/Pricing/index.tsx` | 删除 `MOCK_PRICING_PLANS` 常量 |
| `SubscriptionDrawer/index.tsx` | 删除 `MOCK_CHECK_RESULT` 常量 |
| `SubscriptionPrompt/index.tsx` | 删除 `FALLBACK_PLANS` 常量 |

### 5.2 需要还原的逻辑

| 文件 | 还原点 |
| --- | --- |
| `MyEarnings/index.tsx` | `useState(MOCK_EARNINGS_SUMMARY)` → `useState(null)` |
| `SpaceResource/Pricing/index.tsx` | `useState(MOCK_PRICING_PLANS)` → `useState([])` |
| `SubscriptionDrawer/index.tsx` | `useState(MOCK_CHECK_RESULT)` → `useState(null)` |
| `SubscriptionPrompt/index.tsx` | `displayPlans` 还原为 `plans.slice(0, 2)` |
| 各 XProTable | request 回调还原为原始 `if (res?.code === SUCCESS_CODE)` 逻辑（去掉 try/catch 兜底） |

> 💡 `CreditsBalance` 的 `balance` 初始值建议保持 `350` 或改为 `0`（两者 UX 影响均很小，按产品要求决定）。

---

## 六、相关文件索引

| 文件 | 类型 | 说明 |
| --- | --- | --- |
| [`mock/subscriptionAPI.ts`](../../mock/subscriptionAPI.ts) | Mock Server | 完整 umi mock，联调阶段自动生效（不需要修改） |
| [`src/types/interfaces/subscription.ts`](../../src/types/interfaces/subscription.ts) | 类型定义 | 所有订阅/积分/订单/收益相关 TypeScript 类型 |
| [`src/services/subscriptionService.ts`](../../src/services/subscriptionService.ts) | API 服务 | 所有订阅相关接口封装 |
| [`src/routes/index.ts`](../../src/routes/index.ts) | 路由 | 新增的所有路由配置 |
| [`src/services/menuService.ts`](../../src/services/menuService.ts) | 菜单 | 新增菜单 code → 图标映射 |
