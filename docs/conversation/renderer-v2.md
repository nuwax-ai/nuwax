# V2 可控会话渲染（conversation renderer v2）

> 规格：父仓 `specs/nuwax-conversation-renderer-v2.md`；计划：`plans/20260830-nuwax-conversation-renderer-v2-plan.md`。本文是 nuwax 侧的实现说明：结构、配置、回退与测试入口。节点、分组、折叠状态机及验收修订总览见 [renderer-v2-grouped-trace-summary.md](./renderer-v2-grouped-trace-summary.md)。

## 一句话

普通会话的消息列表在旧 `ChatView + MarkdownRenderer`（V1，完全冻结）之外，新增一条正交的渲染线 V2：`MessageInfo[] → 纯投影 → 整轮轨迹 / 工具组 / 单项详情 + 最终回答`。数据线（`conversationRuntime` legacy/runtime）与渲染线（V1/V2）自由组合成 2×2 矩阵。

## 结构分层

```
src/features/conversation/presentation-v2/          纯投影层（无 React，双数据线共用）
  types.ts                 ConversationPresentationV2 / ProcessNode / FinalAnswer / Preferences
  parseMessageSegments.ts  容错词法解析：text → think/process/正文/unknown 有序段
  projectConversation.ts   MessageInfo[] → 轮次投影（分组/分类/详情合并/最终回答/指标）
  traceItems.ts             原子节点 → narration / standalone / tool-group 展示流
  toolDetail.ts             协议优先的工具详情归一化（终端/文件/搜索/浏览器/Skill/通用）
  renderPreferences.ts     三档预设表 + 逐类覆盖 + 失败节点最低可见性 + 外层默认态
  index.ts                 纯函数出口
  react/                   React 层（组件与样式）
    ConversationRendererV2.tsx   列表渲染器（ErrorBoundary + 投影 try/catch 双保险回退 V1）
    WorkTraceDisclosure.tsx      整轮轨迹折叠头 + 展示流编排 + 子层状态托管
    ToolGroupDisclosure.tsx      连续工具动作摘要组
    ProcessNodeRow.tsx           紧凑原子事件行（仅有详情时提供 disclosure）
    ToolNodeDetail.tsx           类型化详情（终端/文件/Diff/搜索/浏览器/Skill/Plan/通用）
    FinalAnswerBlock.tsx         最终回答常显 + 回答操作栏（复制/分享 + V1 相对消息时间）
    formatElapsed.ts             耗时文案
src/utils/conversationRendererPreference.ts   偏好存取（URL>会话覆盖>全局>默认 V2）
src/hooks/useConversationRendererPreference.ts 偏好 hook（CustomEvent 即时同步）
UnifiedChatSession/components/ChatContentArea  渲染线选择边界（messageRenderer prop，默认 v1）
UnifiedChatSession/components/ChatInputHomeIndependent/ConversationDisplaySettings.tsx
                                              输入区「会话显示」入口
```

## 关键契约

- **轮次分组**：优先 requestId 归组（同轮非空 requestId 变化切分），缺失回退 USER 消息边界；列表头部无 USER 前导的 assistant 消息自成一轮（分页半轮/resume）。
- **节点类型**：保留原子 `reasoning | context | tool | subagent | plan | completed-interaction | unknown`；中间正文 narration 原位直出，不受预设/逐类覆盖影响。`type=Event` 丢弃（OpenUI render 例外按独立 tool）；无 executeId 的 process 段丢弃（与 V1 null 分支一致）；畸形标签碎片 → unknown。
- **展示分组**：投影后、预设过滤前将节点编排为 `narration | standalone | tool-group`。连续两条及以上普通工具成组；正文、思考、上下文、Plan、子智能体、已完成交互、OpenUI 和未知节点均切断分组；单工具保持独立。组 ID 固定取首节点 ID，重复执行逐条保留，隐藏边界不会导致前后工具误合并。
- **组语义**：子项存在运行态时组为 running，否则失败优先于完成；组头按首次出现顺序去重显示动作短语。工具展示以协议 `result.kind` / 结构字段优先，组件类型与名称仅作兜底。
- **最终回答**（三级选择，禁止读 `ConversationInfo.summary`）： ① 最后一条非空 `finalResult.outputText`（剥内嵌标签）② 终态最后一条非空正文段 ③ 无正文只显示停止/错误状态。运行态以末尾正文段为实时回答区。
- **指标**：工具数 = 非 Plan/Event 的 executeId 去重；消息数 = reasoning+context+completed-interaction（narration 直出不计）；耗时优先 `finalResult.start/endTime`，其次 processing 最早开始/最晚结束，运行态每秒跳动、终态冻结；零工具时头部以「执行过程」开头，缺失指标单独省略。
- **三层交互**：整轮运行时默认展开且头部只显示「工作中 T」；流式结束时自动收起一次，历史终态轮也默认收起，终态头保留完整指标。当前最后活动工具组默认展开，正文/思考/新组出现时旧组自动收起一次；终态组默认收起。用户手动重开后的状态不会被流式增量重复覆盖，外层收起也不会清空组和单项状态。折叠控件均使用原生 button、`aria-expanded`/`aria-controls` 和可见焦点；无有效详情的事件行为静态元素、不显示假箭头；`prefers-reduced-motion` 下停用动效。
- **箭头行为**：三层统一使用细线 `DownOutlined`，收起旋转为 `>`、展开为 `∨`；工具组和单工具在收起态仅 hover/focus 显示，展开态常驻，并紧跟摘要内容。
- **类型化详情**：终端仅显示 Shell、命令、stdout/stderr 与退出码；文件读取显示路径/行范围/正文；编辑显示文件统计与统一 Diff；搜索/浏览器显示查询、标题、URL 和摘要；Skill 渲染 Markdown；Plan/Todo 作为独立状态清单；Generic 仅显示清洗后的输入/结果。原始协议 JSON 不进入普通详情。文件/URL 可通过可选资源回调联动宿主预览，否则保持可复制文本或普通链接。
- **回答操作栏**：用户消息只保留复制；助手最终回答保留复制/分享，图标统一为 12px。最右侧时间复用 V1 `formatTimeAgo(message.time)` 规则并每分钟刷新；轨迹头的「已工作 T」继续单独表达执行耗时。
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

- 纯函数：`tests/conversationPresentationRenderer.test.ts`、`tests/conversationRendererPreference.test.ts`、`tests/conversation/traceItems.test.ts`、`tests/conversation/toolNodeDetail.test.ts`。
- 组件：`tests/conversationRendererComponent.test.tsx`、`tests/conversation/toolNodeDetailComponent.test.tsx`。
- 选择器/四组合：`tests/unifiedChatSessionRendererSelection.test.tsx`（3）、 `tests/conversationRendererDualLine.test.tsx`（5）。
- e2e：`npm run e2e:mock-chat`（`E2E_RENDERER=v1|v2|both`，默认 both；断言型场景跑满 2 数据线 × 2 渲染线；交互型按用例声明——dock/输入区驱动类双渲染， V1 DOM 探针类仅 v1，V2 轨迹探针 `RENDERER_SHOWCASE` 仅 v2）。
- 场景：`mock/conversationScenarios.ts` 的 `V2_GROUPED_TOOL_TRACE` 专门覆盖两段工具组、重复动作、运行/失败、单工具和真实 `kind=execute/read/edit` 载荷；`TRACE_HAIRLINE`、`TOOL_RENDERING_TYPED` 继续独立回归。

## 已知边界

- V2 不再嵌入 V1 `MarkdownCustomProcess` 工具卡，但 processingList 仍是详情数据源（与 V1 同源），协议和 legacy/runtime 数据线不变。
- 移动端/ConversationAgent/预览入口未接 V2（代码可达但未启用）。
- e2e 中 runtime 线干预 dock 桥接缺口（PERMISSION/ASK/INTERVENTION_STACK）为基线已知问题（KNOWN_ISSUES），与渲染线无关。
