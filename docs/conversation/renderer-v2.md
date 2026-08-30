# V2 可控会话渲染（conversation renderer v2）

> 规格：父仓 `specs/nuwax-conversation-renderer-v2.md`；计划：`plans/20260830-nuwax-conversation-renderer-v2-plan.md`。本文是 nuwax 侧的实现说明：结构、配置、回退与测试入口。

## 一句话

普通会话的消息列表在旧 `ChatView + MarkdownRenderer`（V1，完全冻结）之外，新增一条正交的渲染线 V2：`MessageInfo[] → 纯投影 → 两级工作轨迹 + 最终回答`。数据线（`conversationRuntime` legacy/runtime）与渲染线（V1/V2）自由组合成 2×2 矩阵。

## 结构分层

```
src/features/conversation/presentation-v2/          纯投影层（无 React，双数据线共用）
  types.ts                 ConversationPresentationV2 / ProcessNode / FinalAnswer / Preferences
  parseMessageSegments.ts  容错词法解析：text → think/process/正文/unknown 有序段
  projectConversation.ts   MessageInfo[] → 轮次投影（分组/分类/详情合并/最终回答/指标）
  renderPreferences.ts     三档预设表 + 逐类覆盖 + 失败节点最低可见性 + 外层默认态
  index.ts                 纯函数出口
  react/                   React 层（组件与样式）
    ConversationRendererV2.tsx   列表渲染器（ErrorBoundary + 投影 try/catch 双保险回退 V1）
    WorkTraceDisclosure.tsx      外层轨迹折叠头（指标行/运行点/隐藏恢复入口）
    ProcessNodeRow.tsx           单行节点 + 受限高度详情（复用 MarkdownCustomProcess 工具卡）
    FinalAnswerBlock.tsx         最终回答常显 + 回答专属操作栏（复制不含过程）
    formatElapsed.ts             耗时文案
src/utils/conversationRendererPreference.ts   偏好存取（URL>会话覆盖>全局>默认 V2）
src/hooks/useConversationRendererPreference.ts 偏好 hook（CustomEvent 即时同步）
UnifiedChatSession/components/ChatContentArea  渲染线选择边界（messageRenderer prop，默认 v1）
UnifiedChatSession/components/ChatInputHomeIndependent/ConversationDisplaySettings.tsx
                                              输入区「会话显示」入口
```

## 关键契约

- **轮次分组**：优先 requestId 归组（同轮非空 requestId 变化切分），缺失回退 USER 消息边界；列表头部无 USER 前导的 assistant 消息自成一轮（分页半轮/resume）。
- **节点类型**：`reasoning | context | narration | tool | subagent | plan | completed-interaction | unknown`。`type=Event` 丢弃（OpenUI render 例外按 tool）；无 executeId 的 process 段丢弃（与 V1 null 分支一致）；畸形标签碎片 → unknown。
- **最终回答**（三级选择，禁止读 `ConversationInfo.summary`）： ① 最后一条非空 `finalResult.outputText`（剥内嵌标签）② 终态最后一条非空正文段 ③ 无正文只显示停止/错误状态。运行态以末尾正文段为实时回答区。
- **指标**：工具数 = 非 Plan/Event 的 executeId 去重；消息数 = reasoning+context+ narration+completed-interaction；耗时优先 `finalResult.start/endTime`，其次 processing 最早开始/最晚结束，运行态每秒跳动、终态冻结；零工具时头部以「执行过程」开头，缺失指标单独省略。
- **交互**：外层运行轮默认展开、终态 focused/balanced 收起 / detailed 展开；用户手动操作后固定，流式增量与 FINAL_RESULT 均不重置。节点行/折叠头均为原生 button（Enter/Space 浏览器语义）+ `aria-expanded`/`aria-controls`；详情 `min(360px, 45vh)` 内部滚动；`prefers-reduced-motion` 下停用动效。
- **干预卡**：待回答审批/提问仍由 AgentIntervention dock 独立置顶（不在轨迹内）； responseStatus 到达终态（submitted/cancelled/skipped/failed）后才投影为 completed-interaction 节点，按 toolCallId 锚定在对应工具节点之后。

## 配置

- 优先级：URL `conversationRenderer=v1|v2` > 会话覆盖（可清除）> 全局偏好 > 构建默认 `v2`（`CONVERSATION_RENDERER_DEFAULT`）。
- localStorage 键：`conversation_renderer_v2` / `conversation_renderer_v2_preset` / `conversation_renderer_v2_node_overrides` / `conversation_renderer_v2_session_overrides`。独立于旧 `conversation_density`（V1 三档密度行为原样保留）。
- 入口：输入区「会话显示」（Eye 图标）统一配置渲染版本 / 会话覆盖 / V2 预设（focused/balanced/detailed）/ 逐类 hidden/summary/expanded 高级覆盖。
- 接入面：`pages/Chat` 与 `/mock-chat` 已接入；`PreviewAndDebug`、 `ConversationAgent` 面板、AppDev 未传 `messageRenderer`，恒走 V1。

## 回退

1. 用户级：设置切 V1 / 会话覆盖 / `?conversationRenderer=v1`，即时生效。
2. 代码级：投影抛错（try/catch）或渲染抛错（ErrorBoundary）→ 整份会话回退 V1 逐消息 ChatView 列表，console 记录 `[ConversationRendererV2]` 诊断，不白屏。
3. `renderMessageItem` 自定义入口恒优先于 V2（AppDev/预览扩展点不受影响）。

## 测试入口

- 纯函数：`tests/conversationPresentationRenderer.test.ts`（21）、 `tests/conversationRendererPreference.test.ts`（12）。
- 组件：`tests/conversationRendererComponent.test.tsx`（13）。
- 选择器/四组合：`tests/unifiedChatSessionRendererSelection.test.tsx`（3）、 `tests/conversationRendererDualLine.test.tsx`（5）。
- e2e：`npm run e2e:mock-chat`（`E2E_RENDERER=v1|v2|both`，默认 both；断言型场景跑满 2 数据线 × 2 渲染线；交互型按用例声明——dock/输入区驱动类双渲染， V1 DOM 探针类仅 v1，V2 轨迹探针 `RENDERER_SHOWCASE` 仅 v2）。
- 场景：`mock/conversationScenarios.ts` 的 `RENDERER_SHOWCASE`（多轮思考 × 连续工具 × 子智能体 × 中间说明 × 终态 outputText）。

## 已知边界

- `MarkdownCustomProcess` 详情卡在 V2 节点内复用：`useModel('chat')` 全局 processingList 仍为详情数据源（与 V1 同源）。
- 本期不重做工具卡；移动端/ConversationAgent/预览入口未接 V2（代码可达但未启用）。
- e2e 中 runtime 线干预 dock 桥接缺口（PERMISSION/ASK/INTERVENTION_STACK）为基线已知问题（KNOWN_ISSUES），与渲染线无关。
