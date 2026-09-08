# V2 会话渲染与工具分组重构总览

> 状态：已实施并完成自动化与真实页面验收（2026-09-04）。
>
> 适用范围：`src/features/conversation/presentation-v2/**` 及其在普通会话、Mock Chat 中的接入。
>
> 详细入口、配置和回退机制见 [renderer-v2.md](./renderer-v2.md)。

## 1. 改造目标

旧 V2 将一轮助手工作过程直接投影为扁平节点，工具详情仍带有旧式卡片、重复标题和参数 JSON，长任务难以扫描。本次重构将助手轮次整理为三层信息结构：

```text
整轮工作轨迹
├─ 过程正文 / 思考 / 计划等独立节点
├─ 连续工具调用组
│  ├─ 紧凑工具事件行
│  └─ 类型化工具详情
└─ 最终回答（始终独立可见）
```

目标是让用户先看清“这一轮做了什么”，再按需下钻到“每次工具具体做了什么”，同时保持流式状态、历史回放、错误追溯和 V1 回退能力。

## 2. 边界与兼容性

- 不修改后端协议，legacy/runtime 两条数据线继续产出同一 `MessageInfo[]`。
- 不将 V1 工具卡嵌回 V2；V2 只复用同源的 `processingList` / `componentExecutedList` / `finalResult` 数据。
- 用户气泡和最终回答 Markdown 保持原渲染链；V2 只重构助手过程区及回答操作栏。
- 投影或 React 渲染异常时，整份会话回退 V1，禁止白屏或 V1/V2 半套混合。
- `focused / balanced / detailed` 及逐类覆盖只控制可见性和默认详情深度，不改变分组、失败追溯或终态折叠规则。

## 3. 数据流与职责

```text
MessageInfo[]
  │
  ├─ parseMessageSegments.ts  容错解析 think/process/正文/unknown
  ├─ projectConversation.ts   轮次、原子节点、最终回答、指标
  ├─ traceItems.ts            生成 narration/standalone/tool-group 展示流
  └─ React
      ├─ WorkTraceDisclosure       整轮折叠与嵌套状态托管
      ├─ ToolGroupDisclosure       连续工具组摘要
      ├─ ProcessNodeRow            单个紧凑事件行
      ├─ ToolNodeDetail            类型化详情
      └─ FinalAnswerBlock          最终回答与回答操作栏
```

分组在 React 渲染前完成，组件不再依靠 DOM 顺序猜测工具边界。

## 4. 节点总表

原子层继续使用 `ConversationProcessNode`，展示层新增 `ConversationTraceItem` 联合类型。

| 原子节点 | 展示形态 | 是否切断工具组 | 说明 |
| --- | --- | --- | --- |
| `narration` | `narration` | 是 | 过程正文原位直接渲染，不套事件卡 |
| `reasoning` | `standalone` | 是 | 思考摘要与正文详情 |
| `context` | `standalone` | 是 | 上下文或系统过程信息 |
| `tool` | 单条 `standalone` 或 `tool-group` | 否 | 连续两条及以上普通工具才成组 |
| `subagent` | `standalone` | 是 | 子智能体调用独立展示 |
| `plan` | `standalone` | 是 | Plan/Todo 状态清单，不混入普通工具组 |
| `completed-interaction` | `standalone` | 是 | 已完成的 ask/permission 交互 |
| OpenUI | `standalone` | 是 | 保留专属内容与交互 |
| `unknown` | `standalone` | 是 | 畸形或未知协议仍可追溯 |

补充约束：

- `type=Event` 默认丢弃，OpenUI render 例外。
- 无 `executeId` 的 process 段沿用 V1 行为丢弃。
- 相同 `executeId` 的状态更新继续合并；不同 executeId 的重复动作逐次保留。
- 连续 Plan 继续只保留最后一项。

## 5. 工具分组算法

`composeConversationTraceItems` 按原始节点时间线顺序执行：

1. 遇到普通工具先进入候选缓冲区。
2. 连续工具数量为 1 时输出单条 `standalone`。
3. 连续工具数量达到 2 时输出 `tool-group`，后续连续工具追加到同组。
4. 遇到正文、思考、上下文、Plan、子智能体、已完成交互、OpenUI 或 unknown 时立即结束当前组。
5. 分组发生在预设过滤之前，因此即使思考或上下文被隐藏，也仍然保持真实时间线边界，不会把前后工具错误合并。
6. 组 ID 为 `tool-group:${firstNode.id}`，流式向组尾追加时 React key 和手动展开状态保持稳定。

### 组状态

优先级固定为：

```text
任一子项 running → running
否则任一子项 failed → failed
否则 → finished
```

组头动作按首次出现顺序去重，例如：

```text
读取了文件 · 编辑了文件 · 运行了命令
```

运行和失败文案使用对应状态语态，例如“正在运行命令”“运行命令失败”。

## 6. 工具类型归一化

工具先归一化为展示模型，再进入行标题与详情组件。识别顺序为协议字段优先，名称启发式兜底。

| 展示类型 | 行摘要 | 详情内容 |
| --- | --- | --- |
| `terminal` | 运行命令 + 命令摘要 | Shell、命令、stdout/stderr、退出码 |
| `file-read` | 读取文件 + 路径 | 路径、行范围、正文预览 |
| `file-edit` | 编辑/创建文件 + 路径 | 文件列表、`+N/-N`、统一 Diff |
| `search` | 搜索 + 查询词 | 查询、结构化结果和摘要 |
| `browser` | 浏览页面 + 标题/URL | 页面标题、URL、结果摘要 |
| `skill` | 加载/执行 Skill | Markdown 正文 |
| `todo` | 更新计划 | 独立状态清单，不进入普通工具组 |
| `generic` | 清洗后的动作和目标 | 仅“输入/结果”；原始协议 JSON 不进入普通视图 |

文件路径采用“行内详情优先”：宿主提供 `onOpenToolResource` 时可联动文件预览，否则保持可复制文本；URL 使用普通链接。

## 7. 三层折叠状态机

### 7.1 整轮轨迹

- 运行中默认展开，头部仅显示“工作中 T”。
- 从运行态进入终态时自动收起一次。
- 历史终态轮默认收起，头部显示完整工具数、消息数和工作耗时。
- 用户在终态手动重新打开后保持选择；普通流式增量不重置手动状态。

### 7.2 工具组

- 当前最后一个活动组默认展开。
- 后续正文、思考或新工具组出现后，旧活动组自动收起一次。
- 终态和历史组默认收起；用户手动重新打开后不被重复强制关闭。
- 外层轨迹收起只卸载展示，不清空组和单项的手动状态。

### 7.3 单条工具

- 默认只显示紧凑事件行，确有详情时才提供 disclosure。
- `detailed` 可让已完成工具在所属组打开后默认展示详情。
- 无详情行使用静态元素，不伪装成可点击控件。
- 折叠状态下，细线箭头仅在 hover 或键盘 focus 时出现；展开状态下，向下箭头常驻显示。
- 控件使用原生 `button`、`aria-expanded`、`aria-controls` 和可见焦点态。

## 8. 视觉与操作栏验收修订

本轮真实页面验收后补充以下统一规则：

- 工作轨迹、工具组、工具详情统一使用 `DownOutlined`：收起旋转为 `>`，展开显示为 `∨`。
- 箭头紧跟内容，避免固定漂在整行最右侧；展开箭头常驻，收起箭头 hover/focus 才出现。
- 工具详情移除左侧装饰竖线和额外左 padding，详情左边缘与事件行标题对齐。
- 失败只用错误图标和局部文字强调，不出现整块红色边框。
- 分享图标固定为 12×12，与复制图标一致。
- 用户消息只保留复制操作，不显示分享；助手最终回答保留复制和分享。
- 助手消息时间固定在回答操作栏最右侧，不再展示执行耗时 `00:00`。
- 消息时间完全复用 V1 `ChatSampleBottom` 的 `formatTimeAgo(message.time)` 规则，并每分钟刷新：刚刚、N 分钟前、N 小时前、昨天、前天、月-日、N 天前、N 月前、去年、N 年前。

说明：轨迹头中的“已工作 T”仍表示本轮执行耗时；回答操作栏最右侧表示消息时间，两者语义分离。

## 9. Mock Chat 回归场景

`V2_GROUPED_TOOL_TRACE` 专门覆盖：

- 两段被正文切开的工具组。
- 重复读取、编辑和命令调用。
- 单工具不成组。
- 运行态、失败态及状态优先级。
- 真实 `kind=execute/read/edit` 载荷。
- 最终回答及运行结束自动折叠。

`TRACE_HAIRLINE` 和 `TOOL_RENDERING_TYPED` 保持独立，分别验证轨迹视觉和类型化详情回归。

## 10. 测试与验收证据

截至 2026-09-04：

| 验证项 | 结果 |
| --- | --- |
| `npm run test:conversation` | 49 文件、462 用例通过 |
| V2 分组专用 E2E | legacy/runtime × V2，4/4 通过 |
| 真实会话 `/home/chat/1561455/2592` | 运行/终态折叠、分组、失败终端、类型化详情通过 |
| 回答操作栏 DOM | 消息时间位于最后一项，右边距为 0 |
| 消息时间 | 页面显示“昨天 / 前天”，旧 `v2-answer-duration` 数量为 0 |
| 用户消息分享 | 数量为 0 |
| 图标尺寸 | 复制/分享均为 12×12 |
| disclosure | 展开箭头 `opacity=1`；收起非 hover 时 `opacity=0` |
| 工具详情对齐 | 左边框 0、左 padding 0、详情与标题同一 x 坐标 |

`vitest.config.ts` 排除 `.claude/worktrees/**`，避免把嵌套工作树重复收集为同一套测试；测试数字以主工作区真实收集结果为准。

## 11. 主要文件索引

- 投影与分组：`types.ts`、`projectConversation.ts`、`traceItems.ts`。
- 类型识别与详情：`toolPresentation.ts`、`toolDetail.ts`、`ToolNodeDetail.tsx`。
- 三层组件：`WorkTraceDisclosure.tsx`、`ToolGroupDisclosure.tsx`、`ProcessNodeRow.tsx`。
- 最终回答：`FinalAnswerBlock.tsx`。
- 样式：`presentation-v2/react/index.less`。
- Mock 与 E2E：`mock/conversationScenarios.ts`、`scripts/e2e/mock-chat-acceptance.mjs`。
- 单元/组件测试：`tests/conversation/traceItems.test.ts`、`tests/conversation/toolNodeDetail*.test.*`、`tests/conversationRendererComponent.test.tsx`。
