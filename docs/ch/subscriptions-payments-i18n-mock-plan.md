# 新增页面/组件 翻译 & Mock 数据方案

## Context

`feat-subscriptions-payments` 分支新增了 10+ 个页面和组件（订阅管理、定价套餐、知识库存储等）。需要解决两个问题：

1. **翻译问题** — 部分 `dict()` 调用在模块顶层求值，切换语言后不会更新；少量硬编码符号(`¥`、日期格式)未跟随语言环境
2. **Mock 数据** — 后端接口定义尚未就绪，需要前端 mock 全部 subscription API

---

## 一、翻译修复

### 1.1 模块顶层 `dict()` 语言切换不更新 — 关键问题

**问题**: `dict()` 在模块顶层调用时只执行一次，用户切换语言后不会重新求值。

**涉及文件 (5 处)**:

| 文件 | 行号 | 变量名 |
| --- | --- | --- |
| `src/pages/SpaceResourcePricing/CreatePricingPlanModal/index.tsx` | 20-24 | `CYCLE_OPTIONS` |
| `src/components/business-component/SubscriptionPrompt/index.tsx` | 12-16 | `CYCLE_LABEL` |
| `src/components/business-component/SubscriptionDrawer/index.tsx` | 17-21 | `CYCLE_LABEL` |
| `src/pages/SpaceResourcePricing/PricingPlanItem/index.tsx` | 14-18 | `CYCLE_LABEL` |
| `src/pages/SpaceAgentSubscriptions/index.tsx` | 14-18 | `CYCLE_LABEL` |

**方案**: 将 `CYCLE_LABEL`/`CYCLE_OPTIONS` 的定义从模块顶层移入组件函数体内，或改为 `useMemo` hook。

```typescript
// Before (module level, frozen on first render)
const CYCLE_LABEL: Record<PricingCycleEnum, string> = {
  [PricingCycleEnum.Monthly]: dict('PC.Pages.SpaceResourcePricing.cycleMonthly'),
  ...
};

// After (inside component, re-evaluates on re-render)
const cycleLabel = useMemo(() => ({
  [PricingCycleEnum.Monthly]: dict('PC.Pages.SpaceResourcePricing.cycleMonthly'),
  ...
}), []);
```

**注意**: `CreatePricingPlanModal` 的 `CYCLE_OPTIONS` 还作为 `<Select options={CYCLE_OPTIONS} />` 的值，需要同时处理 `Form.Item` 的 `initialValue`，改在组件内声明。

### 1.2 硬编码符号

**`¥` 货币符号 (5 处)**:

- `SubscriptionPrompt/index.tsx:38`
- `SubscriptionDrawer/index.tsx:114`
- `PricingPlanItem/index.tsx:63`
- `SpaceAgentSubscriptions/index.tsx:50`
- `CreatePricingPlanModal/index.tsx:90` (InputNumber prefix)

**方案**: 在新文件中已经统一使用 `dict()` 的背景下，`¥` 作为人民币符号可保留。如需跟随其他币种，后续可通过后端 i18n API 下发货币格式。本次改为从 dict 获取，添加 key `PC.Common.Global.currencySymbol` 到 locale 文件（中文: `¥`，英文: `¥`，日文: `¥`）。

**`YYYY-MM-DD` 日期格式 (2 处)**: 改用 dayjs locale 自适应格式化。

**`-` 空值占位 (2 处)**: 加 dict key `PC.Common.Global.emptyPlaceholder`。

### 1.3 新增翻译 Key

需添加到 5 个 locale 文件 (`en-US`, `zh-CN`, `ja-JP`, `zh-TW`, `zh-HK`):

```typescript
'PC.Common.Global.currencySymbol': '¥',
'PC.Common.Global.emptyPlaceholder': '-',
```

日期格式使用 dayjs locale 动态获取，无需新增 key。

---

## 二、Mock 数据

### 2.1 Mock 方案

项目使用 Umi 内置 mock 系统 (`mock/` 目录)，参考现有 `mock/userAPI.ts` 的写法。

创建 `mock/subscriptionAPI.ts`，mock 全部 8 个 API:

| API | 方法 | 路径 | 返回数据类型 |
| --- | --- | --- | --- |
| apiListPricingPlans | GET | `/api/space/:spaceId/pricing-plans` | `PricingPlanInfo[]` |
| apiCreatePricingPlan | POST | `/api/pricing-plans` | `PricingPlanInfo` |
| apiUpdatePricingPlan | PUT | `/api/pricing-plans/:id` | `PricingPlanInfo` |
| apiDeletePricingPlan | DELETE | `/api/pricing-plans/:id` | `null` |
| apiTogglePricingPlan | PUT | `/api/pricing-plans/:id/toggle` | `null` |
| apiListUserSubscriptions | GET | `/api/subscriptions` | `{ list, total }` |
| apiGetAgentSubscriptionConfig | GET | `/api/agent/:agentId/subscription-config` | `AgentSubscriptionConfig` |
| apiSaveAgentSubscriptionConfig | PUT | `/api/agent/:agentId/subscription-config` | `null` |
| apiCheckSubscription | GET | `/api/agent/:agentId/check-subscription` | `CheckSubscriptionResult` |
| apiSubscribePlan | POST | `/api/subscriptions` | `UserSubscriptionInfo` |

### 2.2 Mock 数据设计

使用 `mockjs` 生成随机数据，预设 3 个定价套餐 + 5 条订阅记录:

- 套餐定价: 月度 ¥99、季度 ¥269、年度 ¥999
- 订阅状态: active/expired/cancelled 各若干条
- 订阅配置: enabled=true, trialCount=3, planIds=[1,2,3]
- 订阅检查: hasSubscription 根据 agentId 按规则返回

---

## 三、执行步骤

1. 在 `CreatePricingPlanModal` 中将 `CYCLE_OPTIONS` 移入组件
2. 在 `SubscriptionPrompt` 中将 `CYCLE_LABEL` 移入组件
3. 在 `SubscriptionDrawer` 中将 `CYCLE_LABEL` 移入组件
4. 在 `PricingPlanItem` 中将 `CYCLE_LABEL` 移入组件
5. 在 `SpaceAgentSubscriptions` 中将 `CYCLE_LABEL` 移入组件
6. 添加 2 个 `PC.Common.Global` 翻译 key 到 5 个 locale 文件
7. 统一处理 `¥` / 日期格式 / 空值占位的硬编码
8. 创建 `mock/subscriptionAPI.ts` 覆盖全部 10 个 API
9. 启动开发服务器验证各页面渲染和语言切换

## 四、验证

- `npm run dev` 启动后访问各新页面路由确认无白屏/报错
- 切换语言 (中/英/日) 确认页面文字跟随变化
- 对定价套餐进行增删改查操作确认 mock 数据正常流转
