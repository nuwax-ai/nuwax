# V2 可控会话渲染（conversation renderer v2）

> 规格：父仓 `specs/nuwax-conversation-renderer-v2.md`；计划：`plans/20260830-nuwax-conversation-renderer-v2-plan.md`。本文是 nuwax 侧的实现说明：结构、配置、回退与测试入口。当前行为以 [rendering-rules.md](./rendering-rules.md) 为准。

## 一句话

普通会话的消息列表在旧 `ChatView + MarkdownRenderer`（V1，完全冻结）之外，新增一条正交的渲染线 V2：`MessageInfo[] → 纯投影 → 整轮轨迹 / 工具组 / 单项详情 + 最终回答`。数据线（`conversationRuntime` legacy/runtime）与渲染线（V1/V2）自由组合成 2×2 矩阵。

## 术语约定

日常交流只说 **V1 / V2**：V1 = 旧线（legacy 数据线 + V1 渲染），V2 = 新线（runtime 数据线 + V2 渲染）——两者绑定放量，默认已全走 V2。代码与调试入口保留两个正交开关名（数据线 `conversationRuntime`、渲染线 `conversationRenderer`）：2×2 组合真实存在（如渲染异常回退 V1 时数据线不变），数据线若也叫 v1/v2 会与渲染线撞名产生歧义。

## 结构分层

```
src/features/conversation/presentation-v2/          纯投影层（无 React，双数据线共用）
  types.ts                 ConversationPresentationV2 / ProcessNode / FinalAnswer / Preferences
  parseMessageSegments.ts  容错词法解析：text → think/process/正文/unknown 有序段
  projectConversation.ts   MessageInfo[] → 轮次投影（分组/分类/详情合并/最终回答/指标）
  traceItems.ts             原子节点 → narration / standalone / tool-group 展示流
  traceSegments.ts         正文边界分段与段指标
  traceViewModel.ts        分组后过滤、段关联与展示模型
  traceDisclosureState.ts  纯折叠默认值与状态转换
  toolDetail.ts             协议优先的工具详情归一化（终端/文件/搜索/浏览器/Skill/通用）
  renderPreferences.ts     三档预设表 + 逐类覆盖 + 失败节点最低可见性 + 外层默认态
  index.ts                 纯函数出口
  react/                   React 层（组件与样式）
    ConversationRendererV2.tsx   列表渲染器（ErrorBoundary + 投影 try/catch 双保险回退 V1）
    WorkTraceDisclosure.tsx      整轮轨迹折叠头 + 布局与事件绑定
    useTraceDisclosure.ts       纯折叠状态机的 React 绑定
    ToolGroupDisclosure.tsx      连续工具动作摘要组
    ProcessNodeRow.tsx           紧凑原子事件行（仅有详情时提供 disclosure）
    ToolNodeDetail.tsx           类型化详情（终端/文件/Diff/搜索/浏览器/Skill/Plan/通用）
    FinalAnswerBlock.tsx         最终回答常显 + 回答操作栏（复制/分享 + V1 相对消息时间）
    formatElapsed.ts             耗时文案
src/utils/conversationRendererPreference.ts   URL 调试覆盖与默认 V2
src/hooks/useConversationRendererPreference.ts 渲染线 hook（CustomEvent 即时同步）
UnifiedChatSession/components/ChatContentArea  渲染线选择边界（messageRenderer prop，默认 v2）
```

## 规则维护入口

所有当前有效的节点、分组、可见性和折叠行为统一维护在 [会话渲染规则](./rendering-rules.md)。该文档以规则编号连接代码和测试；本文只维护接入、配置与回退。

## 配置

- 渲染线仅接受 URL `conversationRenderer=v1|v2` 调试覆盖；未指定时使用构建默认 `v2`（`CONVERSATION_RENDERER_DEFAULT`）。
- 输入区的调试按钮和渲染设置面板已移除；启动迁移会清理旧面板写入的 renderer localStorage 值。
- V2 使用 `balanced` 预设和空节点覆盖作为固定默认值；预设/逐类展示规则仍由 `renderPreferences.ts` 定义。
- 接入面：`pages/Chat` 与 `/mock-chat` 已接入；`PreviewAndDebug`、 `ConversationAgent` 面板、AppDev 未传 `messageRenderer`，恒走 V1。

## 回退

1. 调试回退：`?conversationRenderer=v1`，即时生效。
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
