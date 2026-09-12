<!--
nuwa-sdlc-kit v1.0.0 · content — 播种一次，本地所有（升级不覆盖）
SDLC Stage 3 · Build 工件模板
闸门：接受本计划才允许动 src；实现偏离计划时同一 commit 更新本文件（plan-gate 会提醒）。
-->

# 实施计划：esc-expert-paid-popup

- 对应 intent：plans/20260912-esc-expert-paid-popup-intent.md（已裁决：已订阅态点角标保持跳详情页；弹卡放行召唤维持 /home 透传）
- 状态：已接受（zhengqiang，2026-09-12，经 Plan mode 批准）

## 背景与方案

专家&专家团页付费未订阅专家点「召唤」/「付费」角标，现状跳 `/agent/:id` 详情页订阅；对齐添加能力弹窗（CapabilityModal）「聘请」口径：先按 `/agent/:id` 详情复核，确认付费未订阅才弹统一专家卡（ExpertSummonCard 内联套餐，订阅+召唤卡内自闭环），已订阅回写角标直接放行，详情异常保守弹卡。

1. **新建共享包装 `ExpertSummonModal`**（`components/business-component/ExpertSummonModal/index.tsx` + `index.less`）：迁移 CapabilityModal 内联 Modal 包装（fit-content/centered/footer=null/destroyOnHidden + `expert-summon-modal` 样式块）；Props：`open`、`expert: ExpertSummonCardInfo | null`、`onClose`、`onSummon(expert, subscribed?)`。
2. **CapabilityModal 换用共享包装**：专家付费 Modal 块等价替换；删 less 样式块与 ExpertSummonCard 直接 import；`handleSelect`/`handleExpertCardSummon` 拦截逻辑不动。
3. **页面侧改造**（`ResourceAggregation/index.tsx`）：新增 `expertPaymentItem` 状态 + `interceptPaidExpert(item, proceed)` 复核拦截器（镜像 CapabilityModal `handleSelect`）；`handleSummon` 付费分支改走拦截器 proceed=召唤透传；`handlePaymentJump` 改 `handlePaymentClick`（已订阅 → 详情页；未订阅 → 拦截器，proceed=详情页）；`handleExpertCardSummon` 关弹窗 → 回写角标 → 召唤；渲染区按技能订阅弹窗同款模式挂载（`resourceType === 'expert'` + `ConditionRender condition={isEnableSubscription}`）。
4. **注释同步**：ResourceCard `onPaymentClick` 注释与文件头、types.ts `paymentRequired` 注释改为「先弹统一专家卡」。

## 改动文件清单

| # | 文件 | 动作(增/改/删) | 说明 |
| --- | --- | --- | --- |
| 1 | `src/components/business-component/ExpertSummonModal/index.tsx` + `index.less` | 增 | 共享专家卡弹窗包装 |
| 2 | `src/components/ChatInputHome/CapabilityModal/index.tsx` / `index.less` | 改 | 换用共享包装，删内联 Modal 与样式块 |
| 3 | `src/pages/ExpertSkillConnector/components/ResourceAggregation/index.tsx` | 改 | 拦截复核 + 弹卡挂载 + 放行召唤 |
| 4 | `ResourceCard/index.tsx`、`src/pages/ExpertSkillConnector/types.ts` | 改 | 注释同步 |

## 实施顺序

1 → 2 →（3、4）→ 验证。单 commit：`feat(ExpertSkillConnector): 付费专家召唤与角标点击先弹统一专家卡`。

## 证明成立的测试

- 无新增单测（组件强依赖 umi runtime，vitest 不能 import umi 模块——AGENTS.md 硬约束）。
- 回归：`npm run test`（vitest 全量）+ `npm run test:conversation`（保险；本次未触会话路径，非硬门）。
- tsc：415 预存错误不作门，改动路径零新增（前后对比 `npx tsc --noEmit` 报错数）。
- 手工验收（`npm run dev`）：付费专家点召唤/角标先弹卡、订阅后角标「已订阅」+召唤放行；已订阅点角标仍跳详情页；免费专家不变；CapabilityModal 聘请回归；团队空间维度重复。

## 风险与回退

| 风险 | 缓解 | 回退方式 |
| --- | --- | --- |
| CapabilityModal 换包装回归 | 纯等价替换，映射与回调不动；手工验收覆盖 | revert 单 commit |
| 详情复核点击无响应感 | 与弹窗现状同口径（既有体验） | 不额外处理 |
| 列表口径 subscribed 滞后 | 复核后 updateItem 回写（与 CapabilityModal 同款） | — |

## 偏离记录

（实现中偏离原计划的逐条补记：原因 + 同步的 commit）
