<!--
nuwa-sdlc-kit v1.0.0 · content — 播种一次，本地所有（升级不覆盖）
SDLC Stage 1 · Plan 工件模板
闸门：负责人确认接受后才进 Design（grill-with-docs → specs/<slug>.md）。
-->

# 意图：专家&专家团页付费专家改为先弹统一专家卡（对齐添加能力弹窗口径）

- 日期：2026-09-12 　发起人：用户（zhengqiang）
- 状态：已接受（zhengqiang，2026-09-12，开放问题已裁决）

## 问题

专家&专家团页（`/expert-skill-connector/expert`）中，付费未订阅的专家/专家团卡片：

- 点击「召唤」按钮或「付费」角标，当前一律 `jumpTo('/agent/:id')` 跳智能体详情页，由详情页自动弹订阅套餐（`ResourceAggregation/index.tsx` 的 `handlePaymentJump` / `handleSummon` 拦截分支）；
- 而添加能力弹窗（CapabilityModal）系统广场列表中，付费专家点「聘请」是**先弹统一专家卡**（ExpertSummonCard，内联套餐区，订阅+召唤在卡内自闭环，详情复核后决定是否拦截），体验两处不一致且跳页打断感强。

## 预期结果

1. 付费未订阅专家点击「召唤」：先按详情口径复核（`apiPublishedAgentInfo`，列表 `paymentRequired/subscribed` 可能滞后，以详情为准），确认「付费且未订阅」才弹统一专家卡弹窗；详情显示已订阅则回写卡片角标并直接放行召唤；详情异常保守按列表口径弹卡——与 CapabilityModal「聘请」逻辑完全一致。
2. 弹窗内完成订阅后召唤 → 就地更新卡片为「已订阅」角标，并按现有 `useSummonExpertHandoff` 透传跳 `/home`。
3. 点击「付费」角标：不再跳详情页，同样先弹统一专家卡。
4. 系统广场/团队空间两数据源同口径；专家与专家团同列表同流程。

验收点：付费专家点召唤/付费角标均先见弹窗；订阅完成后角标变「已订阅」且召唤放行；免费/已订阅专家召唤行为不变；技能/连接器维度不受影响。

## 受影响的能力面

- `pages/ExpertSkillConnector/components/ResourceAggregation/index.tsx`（召唤/付费点击拦截改造，新增专家卡弹窗挂载）；
- 复用 `components/business-component/ExpertSummonCard`（不改动其内部）；
- CapabilityModal 的弹窗包装（Modal + `expert-summon-modal` 样式，目前内联在 CapabilityModal/index.less）需在页面侧复用或抽共享；
- 外部接口面无变化（仍用 `/agent/:id` 详情复核 + 卡内既有订阅接口）。

## 约束

- 订阅开关口径不变：`tenantConfigInfo.enableSubscription !== 0` 时才拦截；
- 弹窗文案/套餐逻辑已内聚在 ExpertSummonCard，预计无新增 i18n；
- 非会话路径，不触发 `test:conversation` 硬门，但需保证 tsc 改动路径零新增错误。

## 开放问题（已裁决）

1. 「已订阅」状态下点付费角标：**保持跳详情页**（`jumpTo(/agent/:id)`），仅付费未订阅改为弹卡——zhengqiang 2026-09-12；
2. 弹卡放行召唤后维持现有 `/home` 透传跳转（`useSummonExpertHandoff`）——zhengqiang 2026-09-12；
3. 弹窗包装是否抽共享组件——实现层决策，Plan 阶段定。
