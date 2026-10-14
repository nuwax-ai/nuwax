# 实施计划：credit-summary-polling

- 对应 spec：无（中等需求，仅 plan）
- 状态：已接受（用户口头确认：60 秒、页面不可见时跳过、单栏与经典都恢复、走仓库标准 useRequest 轮询）

## 背景

`GET /api/credit/summary` 后端自带「每日赠送积分」发放（bizNo=`DGC<userId>-<yyyyMMdd>`，当天幂等、23:59:59 过期）。单栏（style3）无常驻余额栏，之前只在头像弹层展开后才调；经典布局的 60s 轮询已于 402fb0b6b1 删除。长期开着的页面跨零点后无人触发，当日赠送领不到。

## 方案

- 全局只挂 **一个** 轮询，挂在布局分发器 `DynamicMenusLayout/index.tsx`：覆盖单栏与经典，切主题不重挂（不多调），经典无二级列的页面也覆盖。
- 轮询用仓库标准 `useRequest`（manual + pollingInterval 60s + pollingWhenHidden:false）；可见性门控同 useEventPolling：`document.hidden` 与宿主可见性（`services/hostVisibility`）任一不可见即 cancel，恢复可见立即补拉。
- 订阅关闭 / 租户配置未就绪不轮询。
- 轮询成功后经 eventBus 广播 `CreditSummaryUpdated`，`CreditsBalance` 订阅后更新余额显示；`CreditsBalance` 自身保持「展示时拉一次」，不再自带 interval，避免多处叠加。
- 不走 `/api/notify/event/collect/batch`：该接口只返回通知事件，无积分信息，要走需后端先新增事件类型。

## 改动文件清单

| # | 文件 | 动作 | 说明 |
| --- | --- | --- | --- |
| 1 | `src/layouts/DynamicMenusLayout/useCreditGrantTrigger.ts` | 改名 | → `useCreditSummaryPolling.ts`，加 60s 轮询与门控 |
| 2 | `src/layouts/DynamicMenusLayout/useCreditGrantTrigger.test.tsx` | 改名 | → `useCreditSummaryPolling.test.tsx`，补轮询用例 |
| 3 | `src/layouts/DynamicMenusLayout/index.tsx` | 改 | 分发器挂载轮询 |
| 4 | `src/layouts/DynamicMenusLayout/SidebarNavLayout/index.tsx` | 改 | 移除原单栏内的触发调用 |
| 5 | `src/types/enums/event.ts`、`src/constants/event.constants.tsx` | 改 | 新增本地事件 `CreditSummaryUpdated` |
| 6 | `src/components/business-component/CreditsBalance/index.tsx`/test | 改 | 订阅事件更新余额 |

## 实施顺序

1. 先改测试（失败）→ 实现 hook → 事件枚举 → CreditsBalance 订阅 → 分发器挂载并移除单栏调用。

## 证明成立的测试

- 新增/更新：轮询参数 60000；可见时 run、document.hidden 或宿主不可见时 cancel、恢复可见 run；订阅关闭/配置未就绪不轮询；成功后广播事件；CreditsBalance 收到事件更新余额。
- 回归范围：`npx vitest run src/layouts/DynamicMenusLayout src/components/business-component/CreditsBalance`，`npm run lint:arch`。

## 风险与回退

| 风险 | 缓解 | 回退方式 |
| --- | --- | --- |
| 轮询在隐藏态仍打后端 | cancel 双重门控（document.hidden + 宿主可见） | 回退本提交即恢复为仅挂载触发 |
| 分发器重挂导致启动期多调一次 | 接口当日幂等，仅多一次 bizNoAdded 判断 | 无需回退 |
| OpenApp 分享页 CreditsBalance 不在分发器 | 本次范围仅单栏/经典；该页保持「展示时拉一次」 | 另起需求 |

## 偏离记录

（暂无）
