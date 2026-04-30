# 订阅与支付 + 工作空间菜单调整 —— 开发方案文档

> **版本**：v2.0  
> **日期**：2026-04-30  
> **分支**：`feat-subscriptions-payments`  
> **负责人**：前端

---

## 一、需求背景

本次迭代包含两个方向：

| 方向 | 内容 |
| --- | --- |
| 工作空间菜单重构 | 将"组件库"拆分为多个子菜单（插件与工作流 / 知识与数据存储 / 模型管理）；新增"资源定价"菜单 |
| 订阅功能 | 管理员配置智能体订阅套餐；用户查看并购买订阅；详情页入口 + 对话框内套餐引导 |
| 更多页面扩展 | 用户个人"更多"页面新增"我的订阅"、"我的订单"、"我的收益"三个菜单 |
| 积分系统 | 全局积分余额展示入口；积分购买（点击"增购"跳转我的订阅）；积分明细页 |

原始需求设计稿（需登录查看）：

- 后台管理（订阅/支付/积分全部页面）：`https://agent.nuwax.com/static/file-preview.html?sk=0319a0204649495aba73241eb7f923b1&dl=1`
- 智能体订阅设置：`https://agent.nuwax.com/static/file-preview.html?sk=33c9e13c20264ce59fec77cab616f48e&dl=1`
- 智能体用户订阅：`https://agent.nuwax.com/static/file-preview.html?sk=98c813df31ca4486a40ae365aad0e972&dl=1`
- 工作空间菜单/资源定价：`https://agent.nuwax.com/static/file-preview.html?sk=cf1830c5017b4eb99ff0bee78707118c&dl=1`
- 我的订阅：`https://agent.nuwax.com/static/file-preview.html?sk=e0a1580c31d54fa78a784d086fb91874&dl=1`
- 我的订单：`https://agent.nuwax.com/static/file-preview.html?sk=10d1fa4846504044b97903f70e12973e&dl=1`
- 我的收益：`https://agent.nuwax.com/static/file-preview.html?sk=127149eb683f4c4b9674aad94fe81972&dl=1`
- 积分明细：`https://agent.nuwax.com/static/file-preview.html?sk=b7c882bd32da42488d0fcdac0d1ee406&dl=1`

---

## 二、架构说明

### 菜单系统

菜单数据由后端 `/api/user/list-menu` 动态下发，**前端不维护菜单结构**。

前端职责：

1. 在 `MENU_ICON_MAP`（`src/services/menuService.ts`）中维护 **菜单 code → icon 名称** 的映射
2. 在 `src/routes/index.ts` 中维护前端路由
3. 实现各路由对应的页面组件

后端职责：

- 配置菜单树结构、code、path、父子关系
- 将新菜单项下发给有权限的用户

---

### 2.1 开发约束规则（v1.2 新增）

本次迭代需遵守以下开发规则，确保不影响已有页面功能：

| 规则 | 说明 | 例外情况 |
| --- | --- | --- |
| **不修改已有页面** | 所有新需求页面必须新建文件，不得直接修改现有页面的 `index.tsx` | 基础设施文件（路由、布局、SvgIcon 注册表）允许最小化新增 |
| **可复用页面/组件** | 新页面优先复用现有组件（`XProTable`、`WorkspaceLayout`、`CustomFormModal`、`ComponentItem` 等） | 如复用困难需新建子组件，不应侵入修改原组件 |
| **基础设施可小幅新增** | `routes/index.ts` 新增路由、`menuService.ts` 新增映射、`nav.constants.tsx` 注册新图标等允许修改 | 仅做**追加**操作，不修改已有路由/映射逻辑 |
| **布局可新增引用** | `DynamicMenusLayout` 等布局文件可新增组件引用（如积分余额展示） | 仅做**插入**，不改变原有布局逻辑和样式 |
| **类型/enum 可新增** | `types/` 下新增类型定义或 enum 值 | 不修改已有类型的字段结构 |
| **i18n 后续补充** | 新增页面的国际化词条可在联调阶段统一补充 | 开发阶段 `dict()` 会回退显示 key |

**判断标准**：改动后，已有页面的 UI 展示、交互行为、路由跳转、数据请求应完全不受影响。仅新增功能出现的位置添加了新内容。

---

## 三、菜单重构方案

### 3.1 变更说明

| 原菜单 | 变更类型 | 新结构 |
| --- | --- | --- |
| 组件库 (`component_lib_dev`) | 改名/拆分 | 变为"组件资源"父节点 (`component_resource_dev`) |
| 技能管理 (`skill_dev`) | 移位 | 从一级移入"组件资源"子节点，路由不变 |
| MCP 管理 (`mcp_dev`) | 移位 | 从一级移入"组件资源"子节点，路由不变 |
| —— | 新增 | 插件与工作流 (`plugin_workflow_dev`) |
| —— | 新增 | 知识与数据存储 (`knowledge_storage_dev`) |
| —— | 新增 | 模型管理 (`space_model_manage`) |
| —— | 新增 | 资源定价 (`resource_pricing`) |
| —— | 新增 | 智能体用户订阅 (`agent_subscription`) |
| —— | 新增 | 支付与收益（开发者）(`dev_payment_earnings`) → 系统管理二级菜单 |
| —— | 新增 | 订阅与积分（管理员）(`admin_subscription_credits`) → 系统管理二级菜单 |

### 3.2 图标映射（已完成）

**文件**：[`src/services/menuService.ts`](../../src/services/menuService.ts)

```typescript
// 组件资源（父级，兼容旧 code）
component_resource_dev: 'icons-nav-components',
component_lib_dev:      'icons-nav-components',   // 旧 code 保留兼容

// 组件资源子菜单
plugin_workflow_dev:    'icons-nav-cube',
knowledge_storage_dev:  'icons-nav-knowledge',
space_model_manage:     'icons-nav-model',

// 新增独立菜单
resource_pricing:       'icons-nav-pricing',
agent_subscription:     'icons-nav-subscription',

// 系统管理新增菜单（v1.5 追加）
dev_payment_earnings:       'icons-nav-my-earnings',
admin_subscription_credits: 'icons-nav-subscription',
```

> ⚠️ `icons-nav-pricing`、`icons-nav-subscription`、`icons-nav-knowledge` 如项目中暂无对应 SVG，先用近似图标替代，待设计提供后替换。

### 3.3 路由（已完成）

**文件**：[`src/routes/index.ts`](../../src/routes/index.ts)

```typescript
// 组件资源三个子页面
{ path: '/space/:spaceId/plugin-workflow',      component: '@/pages/SpaceResource/PluginWorkflow' }
{ path: '/space/:spaceId/knowledge-storage',    component: '@/pages/SpaceResource/KnowledgeStorage' }
{ path: '/space/:spaceId/model-manage',         component: '@/pages/SpaceResource/ModelManage' }

// 资源定价
{ path: '/space/:spaceId/resource-pricing',     component: '@/pages/SpaceResource/Pricing' }

// 智能体用户订阅
{ path: '/space/:spaceId/agent-subscriptions',  component: '@/pages/SpaceResource/AgentSubscriptions' }
```

```typescript
// 系统管理新增页面
{ path: '/system/payment-earnings',       component: '@/pages/SystemManagement/PaymentEarnings' }
{ path: '/system/subscription-credits',    component: '@/pages/SystemManagement/SubscriptionCredits' }
```

> `skill-manage`、`mcp` 路由**保持不变**，后端将其挂在"组件资源"子节点下即可。

---

## 四、功能详细方案

### 4.1 组件资源子页面（SpaceLibrary 拆分）

**背景**：现有 `SpaceLibrary` 页面统一展示全部类型组件，本次拆分为三个独立页面，各自固定展示对应类型。

**数据来源**：复用现有 `apiComponentList(spaceId)` 接口（返回全量数据，前端过滤）。

#### SpacePluginWorkflow — 插件与工作流

| 项目 | 内容 |
| --- | --- |
| 路由 | `/space/:spaceId/plugin-workflow` |
| 页面文件 | [`src/pages/SpacePluginWorkflow/index.tsx`](../../src/pages/SpacePluginWorkflow/index.tsx) |
| 展示类型 | `ComponentTypeEnum.Workflow`、`ComponentTypeEnum.Plugin` |
| 类型筛选 | 全部 / 工作流 / 插件 |
| 创建入口 | 工作流、插件 |
| 支持操作 | 查看详情、复制到空间、导出配置、查看日志、删除 |
| 复用组件 | `ComponentItem`（来自 SpaceLibrary）、`CreateWorkflow`、`CreateNewPlugin`、`MoveCopyComponent` |

#### SpaceKnowledgeStorage — 知识与数据存储

| 项目 | 内容 |
| --- | --- |
| 路由 | `/space/:spaceId/knowledge-storage` |
| 页面文件 | [`src/pages/SpaceKnowledgeStorage/index.tsx`](../../src/pages/SpaceKnowledgeStorage/index.tsx) |
| 展示类型 | `ComponentTypeEnum.Knowledge`、`ComponentTypeEnum.Table` |
| 类型筛选 | 全部 / 知识库 / 数据表 |
| 创建入口 | 知识库、数据表 |
| 支持操作 | 查看详情、导出配置（数据表）、复制（数据表）、删除 |
| 复用组件 | `ComponentItem`、`CreateKnowledge`、`CreatedItem` |

#### SpaceModelManage — 模型管理

| 项目 | 内容 |
| --- | --- |
| 路由 | `/space/:spaceId/model-manage` |
| 页面文件 | [`src/pages/SpaceModelManage/index.tsx`](../../src/pages/SpaceModelManage/index.tsx) |
| 展示类型 | `ComponentTypeEnum.Model` |
| 类型筛选 | 无（只有模型，不需要类型切换） |
| 创建入口 | 模型 |
| 支持操作 | 编辑（点击卡片）、导出配置、删除 |
| 复用组件 | `ComponentItem`、`CreateModel`（来自 SpaceLibrary） |

**新增 constants（已完成）**：[`src/constants/space.constants.tsx`](../../src/constants/space.constants.tsx)

```typescript
PLUGIN_WORKFLOW_RESOURCE; // 插件与工作流的创建菜单选项
PLUGIN_WORKFLOW_TYPE; // 插件与工作流的类型筛选选项（含"全部"）
KNOWLEDGE_STORAGE_RESOURCE; // 知识与数据存储的创建菜单选项
KNOWLEDGE_STORAGE_TYPE; // 知识与数据存储的类型筛选选项（含"全部"）
```

---

### 4.2 资源定价页面（SpaceResourcePricing）

**作用**：工作空间管理员配置可售卖的订阅套餐，关联到具体智能体。

| 项目 | 内容 |
| --- | --- |
| 路由 | `/space/:spaceId/resource-pricing` |
| 页面文件 | [`src/pages/SpaceResourcePricing/index.tsx`](../../src/pages/SpaceResourcePricing/index.tsx) |
| 布局 | 卡片网格（同 SpaceLibrary 风格） |
| 功能 | 查看套餐列表、新建、编辑、删除、启用/停用 |

#### 子组件

| 组件 | 路径 | 说明 |
| --- | --- | --- |
| `PricingPlanItem` | [`src/pages/SpaceResourcePricing/PricingPlanItem/`](../../src/pages/SpaceResourcePricing/PricingPlanItem/index.tsx) | 套餐卡片，展示名称、价格、周期、状态开关、更多操作 |
| `CreatePricingPlanModal` | [`src/pages/SpaceResourcePricing/CreatePricingPlanModal/`](../../src/pages/SpaceResourcePricing/CreatePricingPlanModal/index.tsx) | 新建/编辑套餐弹框（使用 `CustomFormModal`） |

#### 套餐字段

| 字段          | 类型    | 说明                         |
| ------------- | ------- | ---------------------------- |
| `name`        | string  | 套餐名称（必填，≤50 字）     |
| `description` | string  | 套餐描述（≤200 字）          |
| `price`       | number  | 价格（精确到分）             |
| `cycle`       | enum    | 计费周期：月付 / 季付 / 年付 |
| `enabled`     | boolean | 是否上架                     |

---

### 4.3 智能体订阅设置（EditAgent 扩展）

**作用**：智能体开发者在编排页面配置该智能体的订阅策略。

#### 入口

在 `AgentHeader` 的更多操作下拉菜单中新增"订阅设置"选项（已完成）。

**涉及文件**：

- [`src/types/enums/space.ts`](../../src/types/enums/space.ts)：`EditAgentShowType` 新增 `Subscription_Setting`
- [`src/types/interfaces/agentConfig.ts`](../../src/types/interfaces/agentConfig.ts)：`AgentHeaderProps` 新增 `onToggleSubscriptionSetting`
- [`src/pages/EditAgent/AgentHeader/index.tsx`](../../src/pages/EditAgent/AgentHeader/index.tsx)：下拉菜单新增"订阅设置"
- [`src/pages/EditAgent/index.tsx`](../../src/pages/EditAgent/index.tsx)：连接事件 + 渲染 `SubscriptionSetting`

#### SubscriptionSetting 组件

| 项目 | 内容 |
| --- | --- |
| 组件路径 | [`src/pages/EditAgent/SubscriptionSetting/index.tsx`](../../src/pages/EditAgent/SubscriptionSetting/index.tsx) |
| 展示形式 | 侧边 Drawer（宽 400px） |
| 字段 | 开启订阅限制（Switch）、免费试用次数（InputNumber）、关联定价套餐（多选）、订阅说明（Textarea） |
| 依赖接口 | `GET /api/agent/:id/subscription-config`、`PUT /api/agent/:id/subscription-config`、`GET /api/space/:id/pricing-plans` |

---

### 4.4 智能体用户订阅页面（SpaceAgentSubscriptions）

**作用**：工作空间管理员查看所有用户的智能体订阅记录。

| 项目 | 内容 |
| --- | --- |
| 路由 | `/space/:spaceId/agent-subscriptions` |
| 页面文件 | [`src/pages/SpaceAgentSubscriptions/index.tsx`](../../src/pages/SpaceAgentSubscriptions/index.tsx) |
| 布局 | `WorkspaceLayout` + `XProTable`（ProTable 封装） |

#### 表格列

| 列名     | 字段            | 说明                               |
| -------- | --------------- | ---------------------------------- |
| 用户     | `userName`      | 支持搜索                           |
| 智能体   | `agentName`     | —                                  |
| 套餐名称 | `planName`      | —                                  |
| 价格     | `price + cycle` | 格式：¥9.9/月                      |
| 订阅时间 | `startAt`       | YYYY-MM-DD                         |
| 到期时间 | `expireAt`      | YYYY-MM-DD                         |
| 状态     | `status`        | 有效 / 已过期 / 已取消（Tag 展示） |

---

### 4.5 智能体详情页订阅图标 & 对话框套餐展示

**涉及组件**：[`src/components/business-component/ConversationDetails/index.tsx`](../../src/components/business-component/ConversationDetails/index.tsx)

#### 4.5.1 订阅图标（Header 右侧）

- **触发条件**：`agentDetail.subscriptionEnabled === true`
- **位置**：Header 右侧按钮区（与展开详情、预览页图标并列）
- **图标**：`SvgIcon name="icons-nav-subscription"`
- **点击行为**：打开 `SubscriptionDrawer`

#### 4.5.2 SubscriptionDrawer

| 项目 | 内容 |
| --- | --- |
| 组件路径 | [`src/components/business-component/SubscriptionDrawer/index.tsx`](../../src/components/business-component/SubscriptionDrawer/index.tsx) |
| 展示形式 | 侧边 Drawer（宽 400px） |
| 内容 | 当前订阅状态、剩余试用次数、可选套餐列表（含购买按钮） |
| 依赖接口 | `GET /api/agent/:id/check-subscription`、`POST /api/subscriptions` |

#### 4.5.3 对话框套餐引导（SubscriptionPrompt）

| 项目 | 内容 |
| --- | --- |
| 组件路径 | [`src/components/business-component/SubscriptionPrompt/index.tsx`](../../src/components/business-component/SubscriptionPrompt/index.tsx) |
| 触发条件 | `subscriptionEnabled = true` 且 `hasSubscription = false` 且 `trialRemaining <= 0` |
| 位置 | `ChatInputHome` 上方 |
| 内容 | 🔒 提示文案 + 套餐快速选择卡片（最多展示 2 个）+ "查看全部套餐"按钮 |

---

## 五、更多页面扩展（MorePage）

### 5.1 架构说明

**MorePage** 是一个动态菜单驱动的页面，菜单子项完全由后端 `/api/user/list-menu` 下发，前端通过 `menuModel.ts` 解析渲染。

添加菜单的前提：

1. 后端在 `more_page` 节点下配置子菜单记录
2. 前端添加对应路由（`/more-page/xxx`）和页面组件

**关键文件**：

- 路由：[`src/routes/index.ts`](../../src/routes/index.ts)（`/more-page` 段）
- 菜单图标映射：[`src/services/menuService.ts`](../../src/services/menuService.ts)
- 参考页面：[`src/pages/MorePage/ApiKey/index.tsx`](../../src/pages/MorePage/ApiKey/index.tsx)（使用 `WorkspaceLayout` 包装）

### 5.2 我的订阅（MySubscriptions）

**设计稿**：`https://agent.nuwax.com/static/file-preview.html?sk=e0a1580c31d54fa78a784d086fb91874`

| 项目 | 内容 |
| --- | --- |
| 路由 | `/more-page/my-subscriptions` |
| 页面文件 | [`src/pages/MorePage/MySubscriptions/index.tsx`](../../src/pages/MorePage/MySubscriptions/index.tsx) |
| 布局 | `WorkspaceLayout` + `XProTable` |
| 图标 code | `my_subscriptions` → `icons-nav-my-subscription` |

#### 表格列

| 列名     | 字段               | 说明                                    |
| -------- | ------------------ | --------------------------------------- |
| 智能体   | `agentName` + 头像 | —                                       |
| 套餐名称 | `planName`         | —                                       |
| 费用     | `price + cycle`    | 格式：¥9.9/月                           |
| 订阅时间 | `startAt`          | YYYY-MM-DD                              |
| 到期时间 | `expireAt`         | YYYY-MM-DD                              |
| 状态     | `status`           | Tag：有效(绿) / 已过期(灰) / 已取消(红) |
| 操作     | —                  | 取消续订（有效状态下可操作）            |

#### 积分关联

- 顶部展示"积分余额"横幅（与积分模块共享 `CreditsBalance` 组件）
- 右上角显示"增购积分"按钮 → 点击跳转积分购买弹框（详见第六节）

**接口**：

- `GET /api/user/subscriptions` — 查询当前用户订阅列表（分页）
- `DELETE /api/subscriptions/:id` — 取消续订

---

### 5.3 我的订单（MyOrders）

**设计稿**：`https://agent.nuwax.com/static/file-preview.html?sk=10d1fa4846504044b97903f70e12973e`

| 项目 | 内容 |
| --- | --- |
| 路由 | `/more-page/my-orders` |
| 页面文件 | [`src/pages/MorePage/MyOrders/index.tsx`](../../src/pages/MorePage/MyOrders/index.tsx) |
| 布局 | `WorkspaceLayout` + `XProTable` |
| 图标 code | `my_orders` → `icons-nav-my-orders` |

#### 表格列

| 列名     | 字段          | 说明                                      |
| -------- | ------------- | ----------------------------------------- |
| 订单号   | `orderNo`     | 点击可复制                                |
| 商品名称 | `productName` | 套餐名 / 积分包名                         |
| 商品类型 | `orderType`   | 订阅 / 积分充值                           |
| 金额     | `amount`      | 单位：元，精确到分                        |
| 支付方式 | `payMethod`   | 微信 / 支付宝 / —                         |
| 下单时间 | `createdAt`   | YYYY-MM-DD HH:mm                          |
| 状态     | `status`      | Tag：已支付(绿) / 待支付(橙) / 已退款(灰) |
| 操作     | —             | 申请退款（已支付且在退款窗口内）          |

**接口**：

- `GET /api/user/orders` — 查询当前用户订单列表（分页，可按类型/状态筛选）
- `POST /api/orders/:id/refund` — 申请退款

---

### 5.4 我的收益（MyEarnings）

**设计稿**：`https://agent.nuwax.com/static/file-preview.html?sk=127149eb683f4c4b9674aad94fe81972`

**定位**：开发者（发布了智能体并开启了订阅）查看自己智能体的订阅收益汇总。

| 项目 | 内容 |
| --- | --- |
| 路由 | `/more-page/my-earnings` |
| 页面文件 | [`src/pages/MorePage/MyEarnings/index.tsx`](../../src/pages/MorePage/MyEarnings/index.tsx) |
| 布局 | `WorkspaceLayout` + 统计卡片 + `XProTable` |
| 图标 code | `my_earnings` → `icons-nav-my-earnings` |

#### 顶部统计卡片

| 统计项     | 字段                | 说明             |
| ---------- | ------------------- | ---------------- |
| 累计收益   | `totalEarnings`     | 单位：元         |
| 本月收益   | `monthlyEarnings`   | —                |
| 订阅用户数 | `subscriberCount`   | 当前有效订阅人数 |
| 待结算     | `pendingSettlement` | 单位：元         |

#### 收益明细表格

| 列名     | 字段               | 说明               |
| -------- | ------------------ | ------------------ |
| 智能体   | `agentName`        | —                  |
| 用户     | `userName`         | —                  |
| 套餐     | `planName + cycle` | —                  |
| 金额     | `earnings`         | 平台抽成后的净收益 |
| 结算状态 | `settlementStatus` | 待结算 / 已结算    |
| 时间     | `createdAt`        | —                  |

**接口**：

- `GET /api/user/earnings/summary` — 汇总数据（统计卡片）
- `GET /api/user/earnings` — 收益明细列表（分页）

---

### 5.5 系统管理新增页面

**背景**：在系统管理侧新增两个二级菜单，下含多个三级子页面，供平台管理员管理支付、收益、订阅和积分。

#### 5.5.1 支付与收益（开发者） — 三级子菜单

| 三级菜单 | 路由 | 页面文件 | 状态 |
| --- | --- | --- | --- |
| 支付配置 | `/system/payment-earnings/config` | `PaymentEarnings/Config/` | ✅ Tabs + Card + Form |
| 支付进件信息 | `/system/payment-earnings/merchant-info` | `PaymentEarnings/MerchantInfo/` | ✅ Alert + Card + Form |
| 开发者付款信息 | `/system/payment-earnings/dev-payment` | `PaymentEarnings/DevPayment/` | ✅ XProTable |
| 开发者收益统计 | `/system/payment-earnings/earnings-stats` | `PaymentEarnings/EarningsStats/` | ✅ Row/Col/Card 统计 + XProTable |
| 开发者提现管理 | `/system/payment-earnings/withdrawal` | `PaymentEarnings/Withdrawal/` | ✅ Row/Col/Card 统计 + XProTable + 拒绝 Modal |
| 支付订单查询 | `/system/payment-earnings/orders` | `PaymentEarnings/Orders/` | ✅ XProTable |

#### 5.5.2 订阅与积分（管理员） — 三级子菜单

| 三级菜单 | 路由 | 页面文件 | 状态 |
| --- | --- | --- | --- |
| 基础配置 | `/system/subscription-credits/basic-config` | `SubscriptionCredits/BasicConfig/` | ✅ Card 分区 + Row/Col Form |
| 基础订阅套餐 | `/system/subscription-credits/plans` | `SubscriptionCredits/Plans/` | ✅ Row/Col/Card 统计 + XProTable |
| 积分增购套餐 | `/system/subscription-credits/credit-packages` | `SubscriptionCredits/CreditPackages/` | ✅ XProTable + CustomFormModal |
| 用户积分查询 | `/system/subscription-credits/user-credits` | `SubscriptionCredits/UserCredits/` | ✅ XProTable |
| 积分明细查询 | `/system/subscription-credits/credit-records` | `SubscriptionCredits/CreditRecords/` | ✅ XProTable |
| 业务订单查询 | `/system/subscription-credits/orders` | `SubscriptionCredits/Orders/` | ✅ XProTable |

---

## 六、积分系统

### 6.1 整体设计

积分作为平台内通用货币，用户通过充值获得积分，消耗积分使用各 AI 功能（如对话调用、知识库存储等）。

**系统入口**：

- **全局顶部 Header 区域**（用户头像左侧）：展示积分余额 + "增购"按钮
- **我的订阅页面**：页面内也展示积分余额横幅 + "增购积分"按钮
- **积分明细**：从余额展示区点击进入独立页面

### 6.2 CreditsBalance 组件（全局积分展示）

| 项目 | 内容 |
| --- | --- |
| 组件路径 | [`src/components/business-component/CreditsBalance/index.tsx`](../../src/components/business-component/CreditsBalance/index.tsx) |
| 挂载位置 | `DynamicMenusLayout` 中用户头像区域左侧 |
| 展示内容 | 积分图标 + 余额数字（如 `⭐ 1,250`） |

**点击行为**：

- 点击余额数字 → 跳转到积分明细页（`/more-page/credit-records`）
- 点击"增购"按钮 → 打开 `CreditsPurchaseModal`（积分购买弹框）

**数据更新**：

- 页面加载时请求一次
- 购买成功后刷新
- 可选：通过 `userModel`/`globalModel` 缓存积分余额，避免重复请求

**接口**：`GET /api/user/credits` → `{ balance: number, unit: 'credit' }`

### 6.3 CreditsPurchaseModal（积分购买弹框）

| 项目     | 内容                                                              |
| -------- | ----------------------------------------------------------------- |
| 组件路径 | 建议放在 `CreditsBalance/CreditsPurchaseModal/index.tsx`          |
| 展示内容 | 积分套餐卡片列表（如 100 积分=¥10，500 积分=¥45，2000 积分=¥150） |
| 操作     | 选择套餐 → 点击"立即购买" → 跳转支付（或弹出二维码）              |

> ⚠️ 支付流程（微信支付/支付宝）需后端提供支付参数，本期先实现 UI 框架，支付接口对接待后端就绪。

**接口**：

- `GET /api/credits/packages` — 积分套餐列表
- `POST /api/credits/purchase` — 创建购买订单，返回支付链接或二维码

### 6.4 积分明细页（CreditRecords）

**设计稿**：`https://agent.nuwax.com/static/file-preview.html?sk=b7c882bd32da42488d0fcdac0d1ee406`

| 项目 | 内容 |
| --- | --- |
| 路由 | `/more-page/credit-records` |
| 页面文件 | [`src/pages/MorePage/CreditRecords/index.tsx`](../../src/pages/MorePage/CreditRecords/index.tsx) |
| 布局 | `WorkspaceLayout` + 余额卡片 + `XProTable` |
| 菜单入口 | **不在左侧菜单显示**（`hideInMenu: true`），从 CreditsBalance 组件跳转进入 |

#### 顶部余额卡片

展示当前积分余额（大号字体）+ "增购积分"按钮（复用 `CreditsPurchaseModal`）

#### 明细表格

| 列名     | 字段          | 说明                                 |
| -------- | ------------- | ------------------------------------ |
| 类型     | `recordType`  | Tag：充值(绿) / 消耗(红) / 退款(蓝)  |
| 描述     | `description` | 如"订阅 XX 智能体"、"充值积分包 500" |
| 变动积分 | `amount`      | 正数=增加（+500），负数=消耗（-20）  |
| 余额     | `balance`     | 操作后的积分余额                     |
| 时间     | `createdAt`   | YYYY-MM-DD HH:mm                     |

**接口**：

- `GET /api/user/credit-records` — 积分明细列表（分页，可按类型筛选）

### 6.5 积分数据类型

追加到 [`src/types/interfaces/subscription.ts`](../../src/types/interfaces/subscription.ts)：

```typescript
// 积分套餐
interface CreditPackageInfo {
  id: number;
  name: string; // 如 "入门包"
  credits: number; // 积分数量
  price: number; // 价格（分）
  originalPrice?: number; // 划线价
  tag?: string; // 如 "最划算"
}

// 积分记录类型
enum CreditRecordTypeEnum {
  Recharge = 'recharge', // 充值
  Consume = 'consume', // 消耗
  Refund = 'refund', // 退款
}

// 积分明细记录
interface CreditRecordInfo {
  id: number;
  recordType: CreditRecordTypeEnum;
  description: string;
  amount: number; // 正=增加，负=减少
  balance: number; // 操作后余额
  createdAt: string;
}

// 用户积分余额
interface UserCreditsInfo {
  balance: number;
  unit: 'credit';
}
```

追加到 [`src/services/subscriptionService.ts`](../../src/services/subscriptionService.ts)：

```typescript
// 积分相关 API
export const apiGetUserCredits = () =>
  request<UserCreditsInfo>('/api/user/credits');
export const apiListCreditPackages = () =>
  request<CreditPackageInfo[]>('/api/credits/packages');
export const apiPurchaseCredits = (packageId: number) =>
  request('/api/credits/purchase', { method: 'POST', data: { packageId } });
export const apiListCreditRecords = (
  params: PageParams & { type?: CreditRecordTypeEnum },
) =>
  request<PageResult<CreditRecordInfo>>('/api/user/credit-records', { params });

// 我的订阅、订单、收益 API
export const apiListMySubscriptions = (params: PageParams) =>
  request<PageResult<UserSubscriptionInfo>>('/api/user/subscriptions', {
    params,
  });
export const apiCancelSubscription = (id: number) =>
  request(`/api/subscriptions/${id}`, { method: 'DELETE' });
export const apiListMyOrders = (
  params: PageParams & { type?: string; status?: string },
) => request<PageResult<OrderInfo>>('/api/user/orders', { params });
export const apiRefundOrder = (id: number) =>
  request(`/api/orders/${id}/refund`, { method: 'POST' });
export const apiGetEarningsSummary = () =>
  request<EarningsSummaryInfo>('/api/user/earnings/summary');
export const apiListMyEarnings = (params: PageParams) =>
  request<PageResult<EarningRecordInfo>>('/api/user/earnings', { params });
```

---

## 七、数据模型 & 接口约定（原有订阅部分）

### 7.1 类型定义文件

**文件**：[`src/types/interfaces/subscription.ts`](../../src/types/interfaces/subscription.ts)

```typescript
// 计费周期
enum PricingCycleEnum {
  Monthly,
  Quarterly,
  Yearly,
}

// 订阅状态
enum SubscriptionStatusEnum {
  Active,
  Expired,
  Cancelled,
}

// 定价套餐
interface PricingPlanInfo {
  id: number;
  spaceId: number;
  name: string;
  description?: string;
  price: number;
  cycle: PricingCycleEnum;
  enabled: boolean;
}

// 用户订阅记录
interface UserSubscriptionInfo {
  id: number;
  userId: number;
  userName: string;
  agentId: number;
  agentName: string;
  planId: number;
  planName: string;
  price: number;
  cycle: PricingCycleEnum;
  status: SubscriptionStatusEnum;
  startAt: string;
  expireAt: string;
}

// 智能体订阅配置
interface AgentSubscriptionConfig {
  enabled: boolean;
  trialCount: number;
  planIds: number[];
  description?: string;
}

// 订阅状态检查结果
interface CheckSubscriptionResult {
  hasSubscription: boolean;
  trialRemaining: number;
  plans: PricingPlanInfo[];
}
```

**AgentDetailDto 新增字段**（[`src/types/interfaces/agent.ts`](../../src/types/interfaces/agent.ts)）：

```typescript
subscriptionEnabled?: boolean;  // 是否开启订阅限制
trialRemaining?: number;        // 剩余免费试用次数
```

### 7.2 Service 文件

**文件**：[`src/services/subscriptionService.ts`](../../src/services/subscriptionService.ts)

| 函数 | 方法 | 路径 | 说明 |
| --- | --- | --- | --- |
| `apiListPricingPlans` | GET | `/api/space/:spaceId/pricing-plans` | 查询工作空间套餐列表 |
| `apiCreatePricingPlan` | POST | `/api/pricing-plans` | 创建套餐 |
| `apiUpdatePricingPlan` | PUT | `/api/pricing-plans/:id` | 更新套餐 |
| `apiDeletePricingPlan` | DELETE | `/api/pricing-plans/:id` | 删除套餐 |
| `apiTogglePricingPlan` | PUT | `/api/pricing-plans/:id/toggle` | 启用/停用套餐 |
| `apiListUserSubscriptions` | GET | `/api/subscriptions` | 查询用户订阅列表（分页） |
| `apiGetAgentSubscriptionConfig` | GET | `/api/agent/:id/subscription-config` | 获取智能体订阅配置 |
| `apiSaveAgentSubscriptionConfig` | PUT | `/api/agent/:id/subscription-config` | 保存智能体订阅配置 |
| `apiCheckSubscription` | GET | `/api/agent/:id/check-subscription` | 检查当前用户订阅状态 |
| `apiSubscribePlan` | POST | `/api/subscriptions` | 用户订阅套餐 |

---

## 八、前后端对齐事项

在正式联调前，需与后端确认以下内容：

### 8.1 菜单 code 名称对齐

| 功能                   | 前端使用的 code              | 后端确认  |
| ---------------------- | ---------------------------- | --------- |
| 组件资源（父节点）     | `component_resource_dev`     | ⬜ 待确认 |
| 插件与工作流           | `plugin_workflow_dev`        | ⬜ 待确认 |
| 知识与数据存储         | `knowledge_storage_dev`      | ⬜ 待确认 |
| 模型管理（工作空间级） | `space_model_manage`         | ⬜ 待确认 |
| 资源定价               | `resource_pricing`           | ⬜ 待确认 |
| 智能体用户订阅         | `agent_subscription`         | ⬜ 待确认 |
| 支付与收益（开发者）   | `dev_payment_earnings`       | ⬜ 待确认 |
| 订阅与积分（管理员）   | `admin_subscription_credits` | ⬜ 待确认 |
| 支付配置               | `payment_config`             | ⬜ 待确认 |
| 支付进件信息           | `payment_merchant_info`      | ⬜ 待确认 |
| 开发者付款信息         | `dev_payment_info`           | ⬜ 待确认 |
| 开发者收益统计         | `dev_earnings_stats`         | ⬜ 待确认 |
| 开发者提现管理         | `dev_withdrawal`             | ⬜ 待确认 |
| 支付订单查询           | `payment_orders`             | ⬜ 待确认 |
| 基础配置               | `subs_basic_config`          | ⬜ 待确认 |
| 基础订阅套餐           | `subs_plans`                 | ⬜ 待确认 |
| 积分增购套餐           | `credits_packages`           | ⬜ 待确认 |
| 用户积分查询           | `user_credits_query`         | ⬜ 待确认 |
| 积分明细查询           | `credits_records_query`      | ⬜ 待确认 |
| 业务订单查询           | `subs_orders`                | ⬜ 待确认 |

### 8.2 接口路径确认

上述 7.2 中的接口路径为前端预定义，需后端确认或调整。

### 8.3 AgentDetailDto 字段确认

`agentDetail` 接口（`/api/agent/:id`）需返回新增字段：

```json
{
  "subscriptionEnabled": true,
  "trialRemaining": 3
}
```

### 8.4 SVG 图标

以下图标需设计提供 SVG 文件（如暂无，用已有图标临时替代）：

- `icons-nav-pricing`（资源定价）
- `icons-nav-subscription`（订阅）
- `icons-nav-knowledge`（知识存储）
- `icons-nav-my-subscription`（我的订阅）
- `icons-nav-my-orders`（我的订单）
- `icons-nav-my-earnings`（我的收益）
- `icons-nav-credits`（积分）

### 8.5 积分与"更多"页面菜单确认

后端需在 `more_page` 菜单节点下新增以下子菜单 code（前端需提前对齐命名）：

| code               | 前端路由                      | 备注      |
| ------------------ | ----------------------------- | --------- |
| `my_subscriptions` | `/more-page/my-subscriptions` | ⬜ 待确认 |
| `my_orders`        | `/more-page/my-orders`        | ⬜ 待确认 |
| `my_earnings`      | `/more-page/my-earnings`      | ⬜ 待确认 |

积分相关接口路径（与后端对齐）：

| 接口         | 方法 | 路径                       | 备注          |
| ------------ | ---- | -------------------------- | ------------- |
| 获取积分余额 | GET  | `/api/user/credits`        | ⬜ 路径待确认 |
| 积分明细列表 | GET  | `/api/user/credit-records` | ⬜ 路径待确认 |
| 购买积分套餐 | POST | `/api/credits/purchase`    | ⬜ 路径待确认 |

---

## 九、文件变更清单

> 根据 v1.2 开发约束规则：基础设施文件允许最小化新增，现有页面不修改。

### 基础设施修改（仅追加，不修改已有逻辑）

| 文件 | 变更类型 | 变更内容 |
| --- | --- | --- |
| `src/services/menuService.ts` | 追加 | 新增 24 个菜单 code → icon 映射（含 MorePage + 系统管理） |
| `src/routes/index.ts` | 追加 | 新增 23 条路由（含系统管理 12 条三级路由） |
| `src/components/base/SvgIcon/nav.constants.tsx` | 追加 | 新增 7 个 SVG 图标导入和导出映射 |
| `src/layouts/DynamicMenusLayout/index.tsx` | 插入 | 在用户操作区和头像之间新增 `CreditsBalance` 组件引用 |
| `src/constants/space.constants.tsx` | 追加 | 新增 `PLUGIN_WORKFLOW_RESOURCE/TYPE`、`KNOWLEDGE_STORAGE_RESOURCE/TYPE` |
| `src/types/enums/space.ts` | 追加 | `EditAgentShowType` 新增 `Subscription_Setting` |
| `src/types/interfaces/agent.ts` | 追加 | `AgentDetailDto` 新增 `subscriptionEnabled`、`trialRemaining` |
| `src/types/interfaces/agentConfig.ts` | 追加 | `AgentHeaderProps` 新增 `onToggleSubscriptionSetting` |
| `config/config.development.ts` | 修改 | `BASE_URL=''` + proxy 到 `https://testagent.xspaceagi.com` |

### 现有页面侵入修改（最小化，仅新增入口/引用）

| 文件 | 变更内容 | 侵入范围 |
| --- | --- | --- |
| `src/pages/EditAgent/AgentHeader/index.tsx` | 下拉菜单新增"订阅设置"菜单项 | 只追加了一个菜单 items 条目 |
| `src/pages/EditAgent/index.tsx` | 引入 `SubscriptionSetting` 组件，连接事件 | 只新增了一个调用的引用和条件渲染 |
| `src/components/business-component/ConversationDetails/index.tsx` | 导入订阅组件和状态，Header 右侧加图标，输入框上方加 Prompt，底部加 Drawer | 新增局部变量、条件渲染和组件导入，不影响原交互逻辑 |

### 新建的文件

| 文件 | 说明 |
| --- | --- |
| `src/types/interfaces/subscription.ts` | 订阅 + 订单 + 收益 + 积分全部 TS 类型定义 |
| `src/services/subscriptionService.ts` | 订阅 & 定价 & 订单 & 收益 & 积分全部 API 封装 |
| `src/assets/icons/nav/icons-nav-{subscription,pricing,knowledge,...}.svg` | 7 个占位 SVG 图标（等待设计替换） |
| `src/utils/dateUtils.ts` | **新工具** — locale-aware 日期格式化（`formatDate` / `formatDateTime`） |
| `mock/utils.ts` | **新工具** — 共享 `S()` 响应格式化函数 |
| `mock/subscriptionAPI.ts` | **新 Mock** — 全部 20+ 订阅支付 API mock 数据 |
| `mock/userAPI.ts` | **新 Mock** — 完整菜单树 mock（含新增订阅/支付菜单项） |
| `src/pages/SpaceResource/` | **父目录** — 统一放置所有空间级资源管理新页面 |
| `src/pages/SpaceResource/KnowledgeStorage/` | **新页面** — 知识与数据存储（复用 `ComponentItem`、`CreateKnowledge`） |
| `src/pages/SpaceResource/ModelManage/` | **新页面** — 模型管理（复用 `ComponentItem`、`CreateModel`） |
| `src/pages/SpaceResource/Pricing/` | **新页面** — 资源定价（含 `PricingPlanItem`、`CreatePricingPlanModal`） |
| `src/pages/SpaceResource/AgentSubscriptions/` | **新页面** — 智能体用户订阅列表（`WorkspaceLayout` + `XProTable`） |
| `src/pages/EditAgent/SubscriptionSetting/` | **新组件** — 订阅设置侧边抽屉（复用在 EditAgent 的编排页） |
| `src/components/business-component/SubscriptionDrawer/` | **新组件** — 用户查看/购买订阅侧边抽屉 |
| `src/components/business-component/SubscriptionPrompt/` | **新组件** — 输入框上方订阅套餐引导条 |
| `src/pages/MorePage/MySubscriptions/` | **新页面** — 我的订阅（`WorkspaceLayout` + `XProTable` + 积分横幅） |
| `src/pages/MorePage/MyOrders/` | **新页面** — 我的订单（`WorkspaceLayout` + `XProTable`） |
| `src/pages/MorePage/MyEarnings/` | **新页面** — 我的收益（统计卡片 + `XProTable`） |
| `src/pages/MorePage/CreditRecords/` | **新页面** — 积分明细（余额卡片 + `XProTable`） |
| `src/components/business-component/CreditsBalance/` | **新组件** — 全局积分余额展示（含 `CreditsPurchaseModal` 购买弹窗） |
| `src/pages/SystemManagement/PaymentEarnings/` | **父目录** — 支付与收益（开发者）三级子页面 |
| `src/pages/SystemManagement/PaymentEarnings/EarningsStats/` | **新页面** — 开发者收益统计（统计卡片 + 收益表格 + Mock 数据） |
| `src/pages/SystemManagement/PaymentEarnings/Config/` | **新页面** — 支付配置（`Tabs` + `Card` + `Form`，支付宝/微信双 Tab） |
| `src/pages/SystemManagement/PaymentEarnings/MerchantInfo/` | **新页面** — 支付进件信息（审核状态 `Alert` + `Card` + `Form`） |
| `src/pages/SystemManagement/PaymentEarnings/DevPayment/` | **新页面** — 开发者付款信息（`XProTable` 列表，含支付类型 Tag 和开户银行字段） |
| `src/pages/SystemManagement/PaymentEarnings/Withdrawal/` | **新页面** — 开发者提现管理（`Row/Col/Card` 统计卡片 + `XProTable` + 拒绝原因 Modal） |
| `src/pages/SystemManagement/PaymentEarnings/Orders/` | **新页面** — 支付订单查询（`XProTable` 列表，含订单号/金额/状态/支付方式） |
| `src/pages/SystemManagement/SubscriptionCredits/` | **父目录** — 订阅与积分（管理员）三级子页面 |
| `src/pages/SystemManagement/SubscriptionCredits/Plans/` | **新页面** — 基础订阅套餐（`Row/Col/Card` 统计 + `XProTable` + `CustomFormModal`） |
| `src/pages/SystemManagement/SubscriptionCredits/BasicConfig/` | **新页面** — 基础配置（3 个 `Card` 分区 + `Row gutter` 两列表单，`Button` 保存） |
| `src/pages/SystemManagement/SubscriptionCredits/CreditPackages/` | **新页面** — 积分增购套餐（`XProTable` + `CustomFormModal` 新建/编辑） |
| `src/pages/SystemManagement/SubscriptionCredits/UserCredits/` | **新页面** — 用户积分查询（`XProTable`，含手动增减积分 Modal） |
| `src/pages/SystemManagement/SubscriptionCredits/CreditRecords/` | **新页面** — 积分明细查询（`XProTable`，含记录类型 Tag） |
| `src/pages/SystemManagement/SubscriptionCredits/Orders/` | **新页面** — 业务订单查询（`XProTable`，含订阅/积分充值类型 Tag） |

---

## 十、UI 规范遵循

所有新页面遵循项目现有规范：

| 规范项 | 实现方式 |
| --- | --- |
| 列表页布局 | 左=标题+`SelectList`+`ButtonToggle`；右=搜索+操作按钮 |
| 卡片组件 | 参考 `ApplicationItem`（SpaceDevelop）或 `ComponentItem`（SpaceLibrary） |
| 表格页布局 | `WorkspaceLayout` + `XProTable` |
| 弹框 | `CustomFormModal` 封装 |
| 图标 | `SvgIcon` 组件 |
| Tooltip | `TooltipIcon` 组件 |
| 样式 | `.less` + CSS Modules，不写内联样式 |
| 筛选状态 | URL search params 同步 |
| 国际化 | 所有文案通过 `dict()` / `t()` 调用 |

### 10.1 AntD 规范重构（v2.0 完成）

初版实现使用了非 AntD 规范的内联 CSS，已全部重构为 AntD 组件。以下为具体改动模式：

#### 统计卡片区（Before → After）

```tsx
// ❌ 旧写法（内联 CSS Grid + 背景色 div）
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
  <div style={{ padding: '20px 24px', borderRadius: 8, background: '#f0f5ff' }}>
    <Statistic title="..." value={...} />
  </div>
</div>

// ✅ 新写法（AntD Row/Col/Card）
import { Card, Col, Row, Statistic } from 'antd';

<Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
  <Col span={6}>
    <Card><Statistic title="..." value={...} /></Card>
  </Col>
</Row>
```

#### 表单分区（Before → After）

```tsx
// ❌ 旧写法（div sectionStyle + span labelStyle）
<div style={sectionStyle}>
  <span style={{ fontSize: 15, fontWeight: 600 }}>订阅功能配置</span>
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
    <Form.Item label={<span style={labelStyle}>字段</span>}>...</Form.Item>
  </div>
</div>

// ✅ 新写法（Card title + Row/Col）
import { Card, Col, Row } from 'antd';

<Card
  title={dict('PC.Pages.SystemSubscriptionBasicConfig.sectionSubscription')}
  extra={<Form.Item name="subscriptionEnabled" valuePropName="checked" noStyle><Switch /></Form.Item>}
  style={{ marginBottom: 16 }}
>
  <Row gutter={[32, 0]}>
    <Col span={12}><Form.Item name="field" label={dict('...')} rules={[{ required: true }]}>...</Form.Item></Col>
    <Col span={12}><Form.Item ...>...</Form.Item></Col>
  </Row>
</Card>
```

#### CRUD 弹窗（Before → After）

```tsx
// ❌ 旧写法（原生 antd Modal）
import { Modal } from 'antd';
<Modal title={...} open={modalOpen} onOk={handleSave} confirmLoading={saving} width={480}>
  <Form form={form} layout="vertical" style={{ marginTop: 16 }}>...</Form>
</Modal>

// ✅ 新写法（项目封装 CustomFormModal）
import CustomFormModal from '@/components/CustomFormModal';
<CustomFormModal
  form={form}
  title={editItem ? dict('...editPackage') : dict('...createPackage')}
  open={modalOpen}
  onCancel={() => setModalOpen(false)}
  onConfirm={handleSave}
  loading={saving}
  width={480}
>
  <Form form={form} layout="vertical">...</Form>
</CustomFormModal>
```

#### 涉及重构的 7 个文件

| 文件 | 重构内容 |
| --- | --- |
| `SubscriptionCredits/BasicConfig/index.tsx` | 原生 `<button>` → `<Button>`；`div sectionStyle` → 3 个 `<Card title>`；CSS Grid 两列 → `Row/Col span={12}`；移除 `labelStyle`/`sectionStyle` 变量 |
| `SubscriptionCredits/CreditPackages/index.tsx` | `<Modal>` → `<CustomFormModal>`；移除 `Form style={{ marginTop: 16 }}` |
| `SubscriptionCredits/Plans/index.tsx` | 彩色背景 div → `Row gutter + 4×Col span={6} + Card + Statistic` |
| `PaymentEarnings/EarningsStats/index.tsx` | 同 Plans，4 列统计区 |
| `PaymentEarnings/Withdrawal/index.tsx` | 同 Plans，3 列统计区（`Col span={8}`） |
| `PaymentEarnings/Config/index.tsx` | Tab 内容 `<div>` → `<Card style={{ maxWidth: 560 }}>`；移除 `fieldStyle` 变量和所有 `style={fieldStyle}` |
| `PaymentEarnings/MerchantInfo/index.tsx` | `<Alert>` 保留外层；`<Form>` 移入 `<Card>` 内；Alert `marginBottom: 20` → `16` |

---

## 十一、验收标准

> 状态标记：✅ 前端已完成（待联调） | 🔲 待开发 | 🟡 依赖后端

### 菜单与路由（✅ 完成）

| 验收项 | 验收方法 | 状态 |
| --- | --- | --- |
| 新菜单 code 下发后图标正确显示 | 后端配置后，侧边栏各菜单项显示对应图标 | ✅ 图标映射已配，SVG 占位文件已创建 |
| 子页面路由可访问 | 浏览器直接访问 `/space/xxx/plugin-workflow` 等路径正常渲染 | ✅ 11 条路由已配置 |

### 组件资源子页面（✅ 完成）

| 验收项 | 验收方法 | 状态 |
| --- | --- | --- |
| 插件与工作流页面只显示对应类型 | 列表中不出现知识库、数据表、模型卡片 | ✅ |
| 类型筛选有效 | 选择"工作流"只显示工作流，选择"插件"只显示插件 | ✅ |
| 创建工作流/插件正常 | 点击创建按钮弹出对应弹框，创建成功后列表刷新 | ✅ 复用现有弹框 |
| 知识与数据存储、模型管理同上 | — | ✅ |

### 资源定价（✅ 完成）

| 验收项           | 验收方法                           | 状态 |
| ---------------- | ---------------------------------- | ---- |
| 套餐列表正常展示 | 接口返回数据后卡片网格渲染正确     | ✅   |
| 新建套餐         | 填写必填项后保存，列表新增卡片     | ✅   |
| 编辑套餐         | 点击编辑，表单回填，保存后卡片更新 | ✅   |
| 删除套餐         | 二次确认后删除，列表移除           | ✅   |
| 启用/停用        | Switch 切换后状态标签实时更新      | ✅   |

### 订阅设置 EditAgent（✅ 完成）

| 验收项 | 验收方法 | 状态 |
| --- | --- | --- |
| 更多菜单中显示"订阅设置" | 点击编排页右上角"更多"下拉可见 | ✅ |
| 抽屉正常打开/关闭 | 点击"订阅设置"后出现右侧抽屉 | ✅ |
| 配置读取 | 抽屉打开时回填已有配置 | ✅ 需联调 |
| 配置保存 | 点击保存后接口调用成功，关闭抽屉 | ✅ 需联调 |
| 关闭订阅限制时隐藏子配置项 | Switch 关闭后试用次数、套餐选择等不显示 | ✅ |

### 智能体用户订阅列表（✅ 完成）

| 验收项            | 验收方法                             | 状态      |
| ----------------- | ------------------------------------ | --------- |
| 列表正常分页加载  | 接口返回数据后表格渲染，分页切换正常 | ✅ 需联调 |
| 状态 Tag 颜色区分 | 有效=绿、过期=灰、已取消=红          | ✅        |

### 对话页订阅功能（✅ 完成）

| 验收项 | 验收方法 | 状态 |
| --- | --- | --- |
| 订阅图标仅在需要订阅时显示 | `subscriptionEnabled=false` 时图标不出现 | ✅ |
| 点击图标打开抽屉 | 显示当前订阅状态和可选套餐 | ✅ 需联调 |
| 套餐引导仅在无订阅且无试用时显示 | `hasSubscription=true` 或 `trialRemaining>0` 时不显示 Prompt | ✅ |
| 购买套餐后 Prompt 消失 | 订阅成功后重新检查状态，Prompt 隐藏 | ✅ |

### 更多页面（MorePage）新菜单（✅ 前端完成）

| 验收项 | 验收方法 | 状态 |
| --- | --- | --- |
| 后端下发后三个菜单正常显示 | 侧边栏"更多"页面出现"我的订阅/我的订单/我的收益" | ✅ 路由 + 图标映射已就绪 |
| 我的订阅列表正常加载 | 有订阅记录时表格渲染，空时显示空态 | ✅ 含积分横幅 |
| 取消续订 | 点击"取消续订"后状态变为"已取消" | ✅ 需联调 |
| 我的订单列表正常加载 | 订单按时间倒序展示，筛选有效 | ✅ |
| 我的订单可以复制订单号 | 点击复制图标可复制 | ✅ |
| 我的订单可申请退款 | 已支付状态显示"申请退款"按钮 | ✅ 需联调 |
| 我的收益统计卡片与明细 | 顶部 4 张卡片数据正确，明细表格分页正常 | ✅ 需联调 |
| 积分明细列表加载 | 按类型筛选（充值/消耗/退款）有效 | ✅ |

### 积分系统（✅ 前端完成）

| 验收项 | 验收方法 | 状态 |
| --- | --- | --- |
| 全局余额展示 | 登录后 Header 区域显示积分余额 | ✅ DynamicMenusLayout 已集成 |
| 点击余额跳转积分明细 | 路由正确跳转到 `/more-page/credit-records` | ✅ |
| 点击"增购"打开购买弹框 | 弹框展示积分套餐列表 | ✅ CreditsPurchaseModal |
| 积分明细列表加载 | 按类型筛选（充值/消耗/退款）有效 | ✅ |
| 余额变动后刷新 | 购买成功后 Header 余额数字更新 | ✅ 回调查询接口 |

### 系统管理新增页面

| 验收项 | 验收方法 | 状态 |
| --- | --- | --- |
| 支付与收益二级菜单正常显示 | 系统管理下出现"支付与收益（开发者）" | ✅ 菜单 + 图标映射已配置 |
| 订阅与积分二级菜单正常显示 | 系统管理下出现"订阅与积分（管理员）" | ✅ 菜单 + 图标映射已配置 |
| 6 个支付三级菜单展开 | 点击展开后显示 6 个子菜单项 | ✅ Mock 菜单树已更新 |
| 6 个订阅积分三级菜单展开 | 点击展开后显示 6 个子菜单项 | ✅ Mock 菜单树已更新 |
| 12 条三级路由可访问 | 直接访问路由正常渲染对应页面 | ✅ 路由已配置 |
| 开发者收益统计 | 统计卡片 + 收益表格，Mock 数据可用 | ✅ |
| 基础订阅套餐 | 统计卡片 + 订阅表格，Mock 数据可用 | ✅ |

---

## 十二、国际化与 Mock 数据

### 12.1 翻译问题修复（✅ 已修复）

#### 模块顶层 dict() 冻结问题

`dict()` 在模块顶层调用时只执行一次，切换语言后不会重新求值。已将以下 5 处从模块顶层移入 `useMemo`：

| 文件                                | 变量            | 修复方式             |
| ----------------------------------- | --------------- | -------------------- |
| `CreatePricingPlanModal/index.tsx`  | `CYCLE_OPTIONS` | 移入组件内 `useMemo` |
| `SubscriptionPrompt/index.tsx`      | `CYCLE_LABEL`   | 移入组件内 `useMemo` |
| `SubscriptionDrawer/index.tsx`      | `CYCLE_LABEL`   | 移入组件内 `useMemo` |
| `PricingPlanItem/index.tsx`         | `CYCLE_LABEL`   | 移入组件内 `useMemo` |
| `SpaceAgentSubscriptions/index.tsx` | `CYCLE_LABEL`   | 移入组件内 `useMemo` |

#### MorePage 新增页面修复（同模式）

MySubscriptions、MyOrders、MyEarnings、CreditRecords 四个新增页面中，`CYCLE_LABEL`、`STATUS_CONFIG`、`ORDER_TYPE_LABEL`、`SETTLEMENT_CONFIG`、`RECORD_TYPE_CONFIG` 均已在编写时使用 `useMemo`。

#### 硬编码符号修复

| 问题 | 涉及处 | 修复方式 |
| --- | --- | --- |
| `¥` 货币符号 | 5 处（不含新增 MorePage 4 页也已修复） | 替换为 `dict('PC.Common.Global.currencySymbol')` |
| `-` 空值占位 | 3 处 | 替换为 `dict('PC.Common.Global.emptyPlaceholder')` |
| `YYYY-MM-DD` 日期格式 | 7 处（新页面全部修复） | 替换为 `formatDate()` / `formatDateTime()` 工具函数（`src/utils/dateUtils.ts`），使用 dayjs locale token 实现 locale-aware 格式化 |

#### 新增翻译 Key

已在 5 个 locale 文件 (`en-US`、`zh-CN`、`ja-JP`、`zh-TW`、`zh-HK`) 中添加：

```typescript
'PC.Common.Global.currencySymbol': '¥',
'PC.Common.Global.emptyPlaceholder': '-',
```

### 12.2 代理配置与 Mock 数据（✅ 已完成）

#### 代理配置

**文件**：[`config/config.development.ts`](../../config/config.development.ts)

```typescript
export default defineConfig({
  define: {
    'process.env.BASE_URL': '', // 空字符串让请求走本地 dev server
  },
  proxy: {
    '/api/': {
      target: 'https://testagent.xspaceagi.com',
      changeOrigin: true,
    },
  },
});
```

**工作原理**：

1. `process.env.BASE_URL = ''` 使所有 API 请求指向 `localhost:3000`
2. Umi mock 优先匹配 — 有 mock 的请求被本地拦截处理
3. 无 mock 的请求通过 proxy 转发到 `https://testagent.xspaceagi.com`
4. 不再需要手动修改 `src/services/common.ts` 的 BASE_URL

#### Mock 文件

**文件**：

- [`mock/subscriptionAPI.ts`](../../mock/subscriptionAPI.ts) — 订阅/支付/积分 API mock
- [`mock/userAPI.ts`](../../mock/userAPI.ts) — 完整菜单树 mock（含新增菜单）
- [`mock/utils.ts`](../../mock/utils.ts) — 共享 `S()` 工具函数

`mock/utils.ts`：

```typescript
export const S = (data: any) => ({
  code: '0000' as const,
  data,
  message: 'success',
});
```

#### 菜单 Mock（完整菜单树）

`mock/userAPI.ts` 返回完整的 10 个顶级菜单树，覆盖所有已有 + 新增菜单项：

| 顶级菜单 | 子菜单（新增项加粗） |
| --- | --- |
| workspace | agent_dev, page_app_dev, **component_resource_dev**(→plugin_workflow_dev, knowledge_storage_dev, space_model_manage), skill_dev, mcp_dev, im_channel, space_task_dev, space_log_query, space_square, member_setting, **resource_pricing**, **agent_subscription** |
| more_page | api_key, **my_subscriptions**, **my_orders**, **my_earnings** |

每个菜单项设置 `icon: ''`，使 `mapSysMenuToMenuItem` 自动从 `MENU_ICON_MAP` 补全图标。

使用模拟真实数据结构：id, code, name, path, icon, parentId, sortIndex, status, source, children。

#### 订阅/支付 API Mock

覆盖全部 20+ 个 API（以 `subscriptionAPI.ts` + `userAPI.ts` 划分）：

**订阅相关** | `/api/space/:spaceId/pricing-plans`, `/api/pricing-plans`(CRUD+toggle), `/api/subscriptions`(list+create+cancel), `/api/agent/:id/subscription-config`, `/api/agent/:id/check-subscription` **用户相关** | `/api/user/subscriptions`, `/api/user/orders`, `/api/user/earnings/summary`, `/api/user/earnings`, `/api/user/credits`, `/api/user/credit-records` **积分相关** | `/api/credits/packages`, `/api/credits/purchase`

Mock 数据设计：

- 预设 3 个定价套餐：月度 ¥99、季度 ¥269、年度 ¥999
- 5 条订阅记录：active/expired/cancelled 各若干条
- 订阅配置：enabled=true, trialCount=3, planIds=[1,2,3]
- 订单/收益/积分明细 mock 数据均包含

Mock 遵循 Umi 标准方案：不引入 express 依赖，使用 `(req: any, res: any)` 签名，响应格式为 `{ code: '0000', data, message }` 以匹配 `RequestResponse<T>` 类型和 `SUCCESS_CODE` 校验。

---

## 十三、后续待办

> ✅ 表示已完成；[ ] 表示尚待处理

- [ ] 与后端对齐菜单 code 名称（见第八节）
- [ ] 确认并对齐接口路径（见第八节）
- [ ] 设计提供新图标 SVG（pricing、subscription、knowledge、my-orders、my-earnings、credits）
- [ ] 支付流程集成（当前仅实现订阅记录，支付跳转视产品确认后补充）
- [ ] 订阅到期提醒通知（视产品需求）
- [ ] 积分购买支付对接（与后端确认支付方式：微信/支付宝/Stripe）
- [ ] 我的收益提现流程（视产品需求是否在本期实现）
- [ ] en-US 翻译词条补充（当前所有新增 i18n key 仅有 zh-CN，其余语言回退显示 key）
- [ ] 联调阶段：各页面去除 `MOCK_*` 常量，改为仅依赖真实接口返回数据
- ✅ ~~支付与收益下 6 个三级页面前端实现~~（v2.0 已完成全部实现）
- ✅ ~~订阅与积分下 6 个三级页面前端实现~~（v2.0 已完成全部实现）
- ✅ ~~SystemManagement 12 个页面 AntD UI 规范重构~~（v2.0 已完成）
