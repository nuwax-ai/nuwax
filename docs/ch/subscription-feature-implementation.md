# 订阅与支付功能 —— 页面实现文档

> **版本**：v1.0  
> **日期**：2026-04-29  
> **分支**：`feat-subscriptions-payments`  
> **关联方案**：[订阅与支付开发方案](./subscriptions-payments-dev-plan.md)

本文档用于功能实现回放，完整记录本次迭代新增的所有订阅相关页面与组件。

---

## 一、总览

### 1.1 功能模块划分

| 视角 | 功能模块 | 页面/组件 |
| --- | --- | --- |
| **用户（订阅者）** | 我的订阅 | `MorePage/MySubscriptions` |
|  | 我的订单 | `MorePage/MyOrders` |
|  | 我的收益 | `MorePage/MyEarnings` |
|  | 积分明细 | `MorePage/CreditRecords` |
|  | 积分余额（全局） | `CreditsBalance` + `CreditsPurchaseModal` |
|  | 订阅引导（对话内） | `SubscriptionPrompt` |
|  | 订阅 Drawer（对话内） | `SubscriptionDrawer` |
| **开发者（发布者）** | 资源定价管理 | `SpaceResource/Pricing` |
|  | 智能体用户订阅管理 | `SpaceResource/AgentSubscriptions` |
|  | 智能体订阅设置 | `EditAgent/SubscriptionSetting` |

### 1.2 核心数据流

```
后端菜单 → 路由渲染
                ↓
        CreditsBalance（Header，全局余额入口）
                ↓ 点击
        CreditRecords（积分明细页）
                ↑ 充值
        CreditsPurchaseModal（选包 → 支付）

对话页（无订阅）:
  SubscriptionPrompt（引导条）→ SubscriptionDrawer（选套餐 → 订阅）
                                        ↓
                              apiSubscribePlan → 订阅成功

开发者配置路径:
  EditAgent → SubscriptionSetting（Drawer）→ 配置套餐 / 试用次数
  SpaceResource/Pricing → 创建 / 管理套餐
  SpaceResource/AgentSubscriptions → 查看哪些用户订了
```

---

## 二、用户侧页面

### 2.1 我的订阅

**文件**：[`src/pages/MorePage/MySubscriptions/index.tsx`](../../src/pages/MorePage/MySubscriptions/index.tsx)  
**路由**：`/more-page/my-subscriptions`

#### UI 结构

```
WorkspaceLayout（标题：我的订阅 / 右侧：购买积分 Button）
├── 积分余额横幅（紫色渐变）
│   ├── 左：积分图标 + 余额数字
│   └── 右：查看积分明细 Button
└── XProTable（订阅列表）
    ├── 列：智能体名称（可搜索）
    ├── 列：套餐名称
    ├── 列：价格 / 周期（¥99/月）
    ├── 列：开始日期
    ├── 列：到期日期
    ├── 列：状态 Tag（Active绿 / Expired灰 / Cancelled红）
    └── 列：操作（Active 状态显示"取消续费"，确认后调用 apiCancelSubscription）
```

#### 关键逻辑

| 逻辑点 | 说明 |
| --- | --- |
| 余额初始化 | `useState(350)`，`useEffect` 内调用 `apiGetUserCredits` 覆盖真实值 |
| 取消订阅 | `TableActions` 带 confirm 弹窗，成功后 `actionRef.current?.reload()` |
| 表格请求 | 支持 `agentName`（关键词）和 `status` 两个筛选条件 |

#### 调用 API

| API                              | 时机                         |
| -------------------------------- | ---------------------------- |
| `apiGetUserCredits()`            | 页面挂载时，获取余额横幅数字 |
| `apiListMySubscriptions(params)` | XProTable 分页/筛选时        |
| `apiCancelSubscription(id)`      | 点击"取消续费"确认后         |

---

### 2.2 我的订单

**文件**：[`src/pages/MorePage/MyOrders/index.tsx`](../../src/pages/MorePage/MyOrders/index.tsx)  
**路由**：`/more-page/my-orders`

#### UI 结构

```
WorkspaceLayout（标题：我的订单）
└── XProTable（订单列表）
    ├── 列：订单号（可复制，CopyOutlined 按钮）
    ├── 列：商品名称（可搜索）
    ├── 列：类型 Tag（订阅 / 积分，可筛选）
    ├── 列：金额（¥99）
    ├── 列：支付方式（无则显示占位符）
    ├── 列：创建时间
    ├── 列：状态 Tag（已支付绿 / 待支付橙 / 已退款灰，可筛选）
    └── 列：操作（已支付状态显示"申请退款"，确认后调用 apiRefundOrder）
```

#### 关键逻辑

| 逻辑点 | 说明 |
| --- | --- |
| 复制订单号 | 调用项目公共工具 `copyTextToClipboard`，成功后 `message.success` |
| 退款 | 带 confirm 弹窗，只对 `OrderStatusEnum.Paid` 的订单显示入口 |
| 筛选 | 支持 `productName`（关键词）、`orderType`、`status` 三个筛选维度 |

#### 调用 API

| API                       | 时机                  |
| ------------------------- | --------------------- |
| `apiListMyOrders(params)` | XProTable 分页/筛选时 |
| `apiRefundOrder(id)`      | 点击"申请退款"确认后  |

---

### 2.3 我的收益

**文件**：[`src/pages/MorePage/MyEarnings/index.tsx`](../../src/pages/MorePage/MyEarnings/index.tsx)  
**路由**：`/more-page/my-earnings`

#### UI 结构

```
WorkspaceLayout（标题：我的收益）
├── 统计卡片区（4列网格）
│   ├── 总收益（灰色背景，¥12,800.00）
│   ├── 月度收益（蓝色背景，¥2,450.00）
│   ├── 订阅用户数（绿色背景，38）
│   └── 待结算金额（橙色背景，¥1,200.00）
└── XProTable（收益明细列表）
    ├── 列：智能体（可搜索）
    ├── 列：用户（可搜索）
    ├── 列：套餐 / 周期（"Pro Plan / 季度"）
    ├── 列：收益（¥215）
    ├── 列：结算状态 Tag（待结算processing / 已结算success）
    └── 列：创建时间
```

#### 关键逻辑

| 逻辑点 | 说明 |
| --- | --- |
| 统计卡片初始化 | `useState(MOCK_EARNINGS_SUMMARY)`，`useEffect` 调用 `apiGetEarningsSummary` 覆盖 |
| 卡片使用 `??` | `summary?.totalEarnings ?? 0`，即使 API 失败也不会 NaN |

#### 调用 API

| API                         | 时机                     |
| --------------------------- | ------------------------ |
| `apiGetEarningsSummary()`   | 页面挂载时，填充统计卡片 |
| `apiListMyEarnings(params)` | XProTable 分页时         |

---

### 2.4 积分明细

**文件**：[`src/pages/MorePage/CreditRecords/index.tsx`](../../src/pages/MorePage/CreditRecords/index.tsx)  
**路由**：`/more-page/credit-records`（`hideInMenu: true`，通过余额组件点入）

#### UI 结构

```
WorkspaceLayout（标题：积分明细）
├── 余额卡片（紫色渐变）
│   ├── 左：积分图标 + 当前积分余额（大字）
│   └── 右：购买积分 Button → 打开 CreditsPurchaseModal
└── XProTable（积分记录列表）
    ├── 列：类型 Tag（充值success / 消费error / 退款processing，可筛选）
    ├── 列：描述（可搜索，ellipsis）
    ├── 列：变动金额（正数绿+500，负数红-50）
    ├── 列：余额
    └── 列：时间
```

#### 关键逻辑

| 逻辑点 | 说明 |
| --- | --- |
| 金额颜色 | `isPositive ? '#52c41a' : '#ff4d4f'`，正数加`+`前缀 |
| 表格筛选 | `recordType` 下拉筛选（充值/消费/退款），对应 `valueEnum` 配置 |
| 购买成功回调 | `CreditsPurchaseModal.onSuccess` 触发 `fetchCredits()`，余额自动刷新 |

#### 调用 API

| API                            | 时机                         |
| ------------------------------ | ---------------------------- |
| `apiGetUserCredits()`          | 页面挂载时，获取余额卡片数字 |
| `apiListCreditRecords(params)` | XProTable 分页/筛选时        |

---

## 三、全局业务组件

### 3.1 CreditsBalance（积分余额入口）

**文件**：[`src/components/business-component/CreditsBalance/index.tsx`](../../src/components/business-component/CreditsBalance/index.tsx)  
**挂载位置**：全局 Header / 侧边导航

#### UI 结构

```
<div onClick → /more-page/credit-records>
  积分图标
  余额数字（toLocaleString）
  充值 Button（link 样式，stopPropagation，点击打开 CreditsPurchaseModal）
</div>
<CreditsPurchaseModal />
```

#### 关键逻辑

| 逻辑点     | 说明                                                        |
| ---------- | ----------------------------------------------------------- |
| 余额初始化 | `useState(350)`（不再 null，避免 loading spinner 影响布局） |
| 点击区域   | 整个容器可点击跳转积分明细；充值按钮独立 `stopPropagation`  |
| 购买成功   | `handlePurchaseSuccess → fetchCredits()`，余额自动更新      |

---

### 3.2 CreditsPurchaseModal（积分购买弹窗）

**文件**：[`src/components/business-component/CreditsBalance/CreditsPurchaseModal/index.tsx`](../../src/components/business-component/CreditsBalance/CreditsPurchaseModal/index.tsx)  
**使用位置**：`CreditsBalance`、`CreditRecords`

#### Props

```typescript
interface Props {
  open: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
}
```

#### UI 结构

```
Modal（宽520，标题：购买积分）
├── Spin（packages 加载中）
└── 积分包列表（单选）
    ├── 每项：包名 + 优惠 Tag + 积分数 + 价格（原价划线）
    └── 选中：蓝色边框 + 浅蓝背景
Footer: 立即购买 Button（loading态）
```

#### 关键逻辑

| 逻辑点 | 说明 |
| --- | --- |
| 包列表加载 | Modal open 时调用 `apiListCreditPackages` |
| 购买流程 | `apiPurchaseCredits(packageId)` → 获取 `payUrl` 或 `qrCode` → 跳转/展示二维码 |
| 购买成功 | 调用 `onSuccess?.()`，父组件刷新余额 |

#### 调用 API

| API                             | 时机             |
| ------------------------------- | ---------------- |
| `apiListCreditPackages()`       | Modal 打开时     |
| `apiPurchaseCredits(packageId)` | 点击"立即购买"时 |

---

### 3.3 SubscriptionDrawer（用户订阅 Drawer）

**文件**：[`src/components/business-component/SubscriptionDrawer/index.tsx`](../../src/components/business-component/SubscriptionDrawer/index.tsx)  
**使用位置**：对话页，用户点击"订阅"按钮时打开

#### Props

```typescript
interface Props {
  agentId: number;
  open: boolean;
  onClose: () => void;
  onSubscribeSuccess?: () => void;
}
```

#### UI 结构

```
Drawer（宽400，destroyOnHidden）
├── Spin（loading 时全屏居中）
└── 内容区
    ├── [有订阅] 绿勾 + "已订阅"提示
    ├── [有试用] 橙色试用剩余次数提示（trialRemaining > 0）
    └── [有套餐] 套餐列表
        └── 每个套餐卡片
            ├── 套餐名 + 周期 Tag
            ├── 描述文本（可选）
            ├── 底部：价格 + 订阅 Button
            │   ├── 已订阅：按钮 disabled + 文字"已订阅"
            │   └── 未订阅：loading 态（按套餐 id 区分）
```

#### 关键逻辑

| 逻辑点 | 说明 |
| --- | --- |
| 数据初始化 | `useState(MOCK_CHECK_RESULT)`，Drawer 每次 open 时重新调 `apiCheckSubscription` |
| 多套餐独立 loading | `subscribingId === plan.id`，同时只能有一个套餐在 loading |
| 订阅后刷新 | 成功后 `checkSubscription()` 重新获取状态 + 触发 `onSubscribeSuccess` |

#### 调用 API

| API                                     | 时机                             |
| --------------------------------------- | -------------------------------- |
| `apiCheckSubscription(agentId)`         | Drawer 打开时（`open === true`） |
| `apiSubscribePlan({ agentId, planId })` | 点击套餐订阅按钮时               |

---

### 3.4 SubscriptionPrompt（订阅引导条）

**文件**：[`src/components/business-component/SubscriptionPrompt/index.tsx`](../../src/components/business-component/SubscriptionPrompt/index.tsx)  
**使用位置**：对话页输入框上方，当用户无订阅且无试用次数时显示

#### Props

```typescript
interface Props {
  plans: PricingPlanInfo[]; // 由父组件（对话页）传入，来自 checkSubscription 结果
  onViewPlans: () => void; // 点击任意区域时打开 SubscriptionDrawer
}
```

#### UI 结构

```
<div>
  锁图标 + "需要订阅才能继续使用"
  套餐芯片列表（最多2个）
  └── 每个芯片：套餐名 + 价格/周期，点击触发 onViewPlans
  查看全部 Link Button
</div>
```

#### 关键逻辑

| 逻辑点 | 说明 |
| --- | --- |
| 显示套餐数 | `(plans.length > 0 ? plans : FALLBACK_PLANS).slice(0, 2)`，最多展示 2 个 |
| FALLBACK_PLANS | 父组件 plans 为空时的兜底显示，避免组件内容全空 |
| 无内部状态 | 完全受控，所有数据和行为由父组件通过 props 控制 |

---

## 四、开发者侧页面

### 4.1 资源定价管理

**文件**：[`src/pages/SpaceResource/Pricing/index.tsx`](../../src/pages/SpaceResource/Pricing/index.tsx)  
**路由**：`/space/:spaceId/resource-pricing`

#### UI 结构

```
<div>（非 WorkspaceLayout，自定义 flex 布局）
├── 头部区域
│   ├── 左：页面标题
│   └── 右：搜索框（实时过滤，前端过滤不请求接口）+ 创建计划 Button
└── 主内容区（滚动容器）
    ├── [有套餐] PricingPlanItem 卡片列表
    └── [无套餐] Empty 组件
```

#### PricingPlanItem 子组件

**文件**：[`src/pages/SpaceResource/Pricing/PricingPlanItem/index.tsx`](../../src/pages/SpaceResource/Pricing/PricingPlanItem/index.tsx)

```
卡片
├── 头部：套餐名 + 启用开关 + 更多操作（编辑/删除 DropdownMenu）
├── 描述文本（可选，灰色）
└── 底部：价格/周期（¥99/月）+ 状态 Tag（启用绿 / 停用灰）
```

#### CreatePricingPlanModal 子组件

**文件**：[`src/pages/SpaceResource/Pricing/CreatePricingPlanModal/index.tsx`](../../src/pages/SpaceResource/Pricing/CreatePricingPlanModal/index.tsx)

```
CustomFormModal（宽480）
├── 标题：创建定价套餐 / 编辑定价套餐
└── Form 字段
    ├── 套餐名称（Input，最多50字）
    ├── 套餐描述（TextArea，3行，最多200字，显示字数）
    ├── 价格（InputNumber，≥0，精度2位）
    └── 订阅周期（Select：月度/季度/年度）
```

#### 关键逻辑

| 逻辑点 | 说明 |
| --- | --- |
| 套餐列表初始化 | `useState(MOCK_PRICING_PLANS)`，避免 API 失败时页面空白 |
| 前端搜索过滤 | `keyword` 变更时直接过滤 `planList`，不触发 API |
| 启用/禁用 | `apiTogglePricingPlan` 后直接 `setPlanList` 局部更新，不重新请求 |
| 删除确认 | `modalConfirm` 二次确认，成功后 `runList()` 重新加载 |
| 编辑/新建共用 Modal | `editPlan` 不为 null 时 Modal 为编辑模式，`initialValues` 回填 |

#### 调用 API

| API                                 | 时机                   |
| ----------------------------------- | ---------------------- |
| `apiListPricingPlans(spaceId)`      | 页面挂载 + 创建/删除后 |
| `apiCreatePricingPlan(data)`        | Modal 新建确认时       |
| `apiUpdatePricingPlan(id, data)`    | Modal 编辑确认时       |
| `apiDeletePricingPlan(id)`          | 删除确认后             |
| `apiTogglePricingPlan(id, enabled)` | 切换开关时             |

---

### 4.2 智能体用户订阅管理

**文件**：[`src/pages/SpaceResource/AgentSubscriptions/index.tsx`](../../src/pages/SpaceResource/AgentSubscriptions/index.tsx)  
**路由**：`/space/:spaceId/agent-subscriptions`

#### UI 结构

```
WorkspaceLayout（标题：智能体订阅管理）
└── XProTable（所有用户对本空间智能体的订阅记录）
    ├── 列：用户名（可搜索）
    ├── 列：智能体名称（可搜索）
    ├── 列：套餐名称
    ├── 列：价格 / 周期
    ├── 列：开始日期
    ├── 列：到期日期
    └── 列：状态 Tag（Active/Expired/Cancelled）
```

#### 关键逻辑

| 逻辑点   | 说明                                                    |
| -------- | ------------------------------------------------------- |
| 只读视图 | 无操作列，开发者仅查看，不可代用户操作订阅              |
| 数据来源 | `apiListUserSubscriptions({ spaceId })` 传入当前空间 ID |

#### 调用 API

| API                                | 时机                  |
| ---------------------------------- | --------------------- |
| `apiListUserSubscriptions(params)` | XProTable 分页/筛选时 |

---

### 4.3 智能体订阅设置

**文件**：[`src/pages/EditAgent/SubscriptionSetting/index.tsx`](../../src/pages/EditAgent/SubscriptionSetting/index.tsx)  
**挂载位置**：智能体编辑页（`EditAgent`）右侧面板或 Tab 内，以 Drawer 形式打开

#### Props

```typescript
interface Props {
  agentId: number;
  spaceId: number;
  visible: boolean;
  onClose: () => void;
}
```

#### UI 结构

```
Drawer（宽400，标题：订阅设置）
└── Form（垂直布局）
    ├── 启用订阅（Switch）
    ├── [条件显示，enabled=true]
    │   ├── 试用次数（InputNumber，默认3次）
    │   ├── 关联套餐（Select multiple，从 apiListPricingPlans 获取选项）
    │   └── 订阅描述（TextArea）
    └── 页脚：取消 + 保存
```

#### 关键逻辑

| 逻辑点 | 说明 |
| --- | --- |
| 数据回填 | open 时调 `apiGetAgentSubscriptionConfig`，结果 `form.setFieldsValue` |
| 套餐选项 | 调 `apiListPricingPlans(spaceId)` 动态填充 Select 选项 |
| 条件显示字段 | 监听 `enabled` 字段值，`Form.useWatch` 控制其他字段显示/隐藏 |
| 保存 | `form.validateFields()` → `apiSaveAgentSubscriptionConfig` |

#### 调用 API

| API | 时机 |
| --- | --- |
| `apiListPricingPlans(spaceId)` | Drawer 打开时，填充套餐多选 |
| `apiGetAgentSubscriptionConfig(agentId)` | Drawer 打开时，回填现有配置 |
| `apiSaveAgentSubscriptionConfig(agentId, config)` | 点击保存时 |

---

## 五、数据类型参考

### 5.1 枚举

| 枚举                     | 值                             | 说明         |
| ------------------------ | ------------------------------ | ------------ |
| `PricingCycleEnum`       | `Monthly / Quarterly / Yearly` | 订阅周期     |
| `SubscriptionStatusEnum` | `Active / Expired / Cancelled` | 订阅状态     |
| `OrderTypeEnum`          | `Subscription / Credits`       | 订单类型     |
| `OrderStatusEnum`        | `Paid / Pending / Refunded`    | 订单状态     |
| `SettlementStatusEnum`   | `Pending / Settled`            | 结算状态     |
| `CreditRecordTypeEnum`   | `Recharge / Consume / Refund`  | 积分变动类型 |

### 5.2 核心接口

```typescript
// 定价套餐
interface PricingPlanInfo {
  id: number;
  spaceId: number;
  name: string;
  description?: string;
  price: number;
  cycle: PricingCycleEnum;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// 用户订阅记录
interface UserSubscriptionInfo {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  agentId: number;
  agentName: string;
  planId: number;
  planName: string;
  price: number;
  cycle: PricingCycleEnum;
  status: SubscriptionStatusEnum;
  startAt: string;
  expireAt: string;
  createdAt: string;
}

// 订单
interface OrderInfo {
  id: number;
  orderNo: string;
  productName: string;
  orderType: OrderTypeEnum;
  amount: number;
  payMethod?: string;
  status: OrderStatusEnum;
  createdAt: string;
}

// 收益汇总
interface EarningsSummaryInfo {
  totalEarnings: number;
  monthlyEarnings: number;
  subscriberCount: number;
  pendingSettlement: number;
}

// 收益明细
interface EarningRecordInfo {
  id: number;
  agentName: string;
  userName: string;
  planName: string;
  cycle: PricingCycleEnum;
  earnings: number;
  settlementStatus: SettlementStatusEnum;
  createdAt: string;
}

// 积分
interface UserCreditsInfo {
  balance: number;
  unit: 'credit';
}
interface CreditPackageInfo {
  id: number;
  name: string;
  credits: number;
  price: number;
  originalPrice?: number;
  tag?: string;
}
interface CreditRecordInfo {
  id: number;
  recordType: CreditRecordTypeEnum;
  description: string;
  amount: number;
  balance: number;
  createdAt: string;
}

// 智能体订阅配置
interface AgentSubscriptionConfig {
  enabled: boolean;
  trialCount?: number;
  planIds?: number[];
  description?: string;
}

// 订阅检查结果（用户侧）
interface CheckSubscriptionResult {
  hasSubscription: boolean;
  trialRemaining: number;
  plans: PricingPlanInfo[];
}
```

---

## 六、API 接口清单

**服务文件**：[`src/services/subscriptionService.ts`](../../src/services/subscriptionService.ts)

| 分组 | 函数名 | 方法 | 路径 |
| --- | --- | --- | --- |
| **定价套餐** | `apiListPricingPlans(spaceId)` | GET | `/api/space/:spaceId/pricing-plans` |
|  | `apiCreatePricingPlan(data)` | POST | `/api/pricing-plans` |
|  | `apiUpdatePricingPlan(id, data)` | PUT | `/api/pricing-plans/:id` |
|  | `apiDeletePricingPlan(id)` | DELETE | `/api/pricing-plans/:id` |
|  | `apiTogglePricingPlan(id, enabled)` | PUT | `/api/pricing-plans/:id/toggle` |
| **订阅（用户侧）** | `apiCheckSubscription(agentId)` | GET | `/api/agent/:agentId/check-subscription` |
|  | `apiSubscribePlan({ agentId, planId })` | POST | `/api/subscriptions` |
|  | `apiListMySubscriptions(params)` | GET | `/api/user/subscriptions` |
|  | `apiCancelSubscription(id)` | DELETE | `/api/subscriptions/:id` |
| **订阅（管理员侧）** | `apiListUserSubscriptions(params)` | GET | `/api/subscriptions` |
|  | `apiGetAgentSubscriptionConfig(agentId)` | GET | `/api/agent/:agentId/subscription-config` |
|  | `apiSaveAgentSubscriptionConfig(agentId, data)` | PUT | `/api/agent/:agentId/subscription-config` |
| **订单** | `apiListMyOrders(params)` | GET | `/api/user/orders` |
|  | `apiRefundOrder(id)` | POST | `/api/orders/:id/refund` |
| **收益** | `apiGetEarningsSummary()` | GET | `/api/user/earnings/summary` |
|  | `apiListMyEarnings(params)` | GET | `/api/user/earnings` |
| **积分** | `apiGetUserCredits()` | GET | `/api/user/credits` |
|  | `apiListCreditPackages()` | GET | `/api/credits/packages` |
|  | `apiPurchaseCredits(packageId)` | POST | `/api/credits/purchase` |
|  | `apiListCreditRecords(params)` | GET | `/api/user/credit-records` |

---

## 七、路由配置

**文件**：[`src/routes/index.ts`](../../src/routes/index.ts)

### 更多页面（MorePage 子路由）

| 路径 | 组件 | 菜单显示 |
| --- | --- | --- |
| `/more-page/my-subscriptions` | `MorePage/MySubscriptions` | ✅ |
| `/more-page/my-orders` | `MorePage/MyOrders` | ✅ |
| `/more-page/my-earnings` | `MorePage/MyEarnings` | ✅ |
| `/more-page/credit-records` | `MorePage/CreditRecords` | ❌（`hideInMenu: true`） |

### 工作空间（Space 子路由）

| 路径 | 组件 | 菜单显示 |
| --- | --- | --- |
| `/space/:spaceId/resource-pricing` | `SpaceResource/Pricing` | ✅ |
| `/space/:spaceId/agent-subscriptions` | `SpaceResource/AgentSubscriptions` | ✅ |
| `/space/:spaceId/plugin-workflow` | `SpaceResource/PluginWorkflow` | ✅ |
| `/space/:spaceId/knowledge-storage` | `SpaceResource/KnowledgeStorage` | ✅ |
| `/space/:spaceId/model-manage` | `SpaceResource/ModelManage` | ✅ |

---

## 八、菜单图标映射

**文件**：[`src/services/menuService.ts`](../../src/services/menuService.ts)（`MENU_ICON_MAP` 新增项）

| 菜单 code               | 图标名                      | 说明           |
| ----------------------- | --------------------------- | -------------- |
| `my_subscriptions`      | `icons-nav-my-subscription` | 我的订阅       |
| `my_orders`             | `icons-nav-my-orders`       | 我的订单       |
| `my_earnings`           | `icons-nav-my-earnings`     | 我的收益       |
| `resource_pricing`      | `icons-nav-pricing`         | 资源定价       |
| `agent_subscription`    | `icons-nav-subscription`    | 智能体用户订阅 |
| `plugin_workflow_dev`   | `icons-nav-cube`            | 插件与工作流   |
| `knowledge_storage_dev` | `icons-nav-knowledge`       | 知识与数据存储 |
| `space_model_manage`    | `icons-nav-model`           | 模型管理       |

> 菜单结构由后端动态下发，前端仅维护 `code → icon` 映射，无需在前端硬编码菜单树。

---

## 九、Mock 数据说明

**Mock Server 文件**：[`mock/subscriptionAPI.ts`](../../mock/subscriptionAPI.ts)（658 行，无需修改）

dev server 正常运行时会自动拦截所有 `/api/` 请求。

各页面组件内额外注入了**内联 mock 常量**作为初始 state，确保即使 mock server 未响应页面也能显示内容。详见：[mock-data-ui-verification.md](./mock-data-ui-verification.md)

---

## 十、验证入口索引

| 功能入口 | 路径/触发方式 |
| --- | --- |
| 积分余额 | 任意页面 Header |
| 积分明细 | 点击 Header 余额 → `/more-page/credit-records` |
| 购买积分 | 余额处"充值"按钮 → `CreditsPurchaseModal` |
| 我的订阅 | 更多页 → 我的订阅 → `/more-page/my-subscriptions` |
| 我的订单 | 更多页 → 我的订单 → `/more-page/my-orders` |
| 我的收益 | 更多页 → 我的收益 → `/more-page/my-earnings` |
| 资源定价 | 工作空间 → 资源定价 → `/space/:spaceId/resource-pricing` |
| 订阅用户管理 | 工作空间 → 智能体订阅 → `/space/:spaceId/agent-subscriptions` |
| 智能体订阅设置 | 编辑智能体 → 订阅设置 Tab/Drawer |
| 用户订阅 Drawer | 对话页 → 点击订阅按钮 |
| 订阅引导条 | 对话页（无订阅/无试用次数时输入框上方自动显示） |
