# 会话渲染规则

本文件是 V2 当前渲染行为的维护入口。适用于普通 live、sub 续接及历史回放；数据来源不决定展示规则。修改行为时同步更新本文件及对应测试。接入与回退见 [renderer-v2.md](./renderer-v2.md)。

## 职责与处理顺序

`MessageInfo[] → projectConversation → 原子节点 → traceItems / traceSegments → traceViewModel → traceDisclosureState → React`

- **整轮**：一次用户请求及其助手过程，最终回答在轨迹外。
- **过程段**：由过程正文 narration 分隔的连续过程节点。
- **工具组**：过程段内连续的两条及以上普通工具。
- **单项**：思考、工具、计划、上下文等原子节点的摘要和详情。

分组、分段先于偏好过滤；状态基于稳定 ID 保存。组件只绑定布局、事件与状态，不按 chat/sub 来源重复实现规则。

## 规则与实现映射

下列代码路径相对 `src/features/conversation/presentation-v2/`；测试路径相对 `tests/`。

| 编号 | 当前规则 | 实现入口 | 回归测试 |
| --- | --- | --- | --- |
| R-PROJECTION | requestId 优先，USER 消息兜底切轮；分页无 USER 的半轮也能投影；processing 按 executeId 合并详情 | `projectConversation.ts` | `conversationPresentationRenderer.test.ts` |
| R-ANSWER | 优先非空 finalResult 输出，其次终态最后正文；运行态末尾正文进入回答区。其他正文为 narration，随整轮轨迹折叠；只有 narration 的终态轮直接显示，不创建空轨迹条。禁止用会话 summary 充当回答 | `projectConversation.ts`、`react/FinalAnswerBlock.tsx` | `conversationRendererComponent.test.tsx` |
| R-GROUP | 连续两条以上普通工具合并，单条独立。正文、思考、上下文、Plan/Todo、子智能体、已完成交互、OpenUI、未知节点打断组。组 ID 取首工具 ID；重复执行保留 | `traceItems.ts` | `conversation/traceItems.test.ts` |
| R-VISIBILITY | 先分组再过滤；隐藏思考仍打断工具组。过滤后不跨边界重组，组只剩一个可见工具也保留原 ID。失败节点至少保留摘要，narration 不受逐类偏好影响 | `renderPreferences.ts`、`traceViewModel.ts` | `conversation/traceDisclosureState.test.ts`、`conversationRendererComponent.test.tsx` |
| R-DISCLOSURE | 活动尾组默认展开，被后续内容超越时收起一次，手动重开不被后续增量反复覆盖；具体层级见下表 | `traceDisclosureState.ts`、`react/useTraceDisclosure.ts`；整轮由 `react/ConversationRendererV2.tsx` 托管 | `conversation/traceDisclosureState.test.ts`、`conversationRendererComponent.test.tsx`（含三种 sub 快照） |
| R-TODO | 同一 executeId 去重；相邻 Plan/Todo 清单更新只保留最后一份。live 标签名称可能滞后，识别优先使用最新 processing 详情 | `projectConversation.ts` 的 `dedupeProcessSegments`、`traceItems.ts` 的 `isTodoTraceNode` | `conversation/todoToolNormalization.test.ts` |
| R-OPENUI | inline/sidecar 产物独立展示；折叠或收尾保持父路径与 key，避免重挂载表单/iframe。无产物或失败退化为普通事件行 | `traceViewModel.ts`、`react/WorkTraceDisclosure.tsx`、`react/OpenUiTraceNode.tsx` | `conversationRendererComponent.test.tsx` |
| R-METRICS | 消息数只计 reasoning/context/completed-interaction，不含正文；工具数按执行 ID 去重。结束耗时缺失或不足一秒时省略，禁止显示“已工作 0 秒”；运行计时可从 00:00 起 | `projectConversation.ts`、`traceSegments.ts`、`react/WorkTraceDisclosure.tsx` 的 `TraceMetrics` | `conversation/traceSegments.test.ts`、`conversation/workTraceTimer.test.tsx` |

## 折叠状态与优先级

| 层级 | 默认值 | 事件与覆盖规则 |
| --- | --- | --- |
| 整轮轨迹 | live 展开，历史终态收起 | 用户操作覆盖默认；从运行到终态自动收起。正文过程说明随之收起，最终回答常显 |
| 过程段 | live 活动段展开；非活动多项段收起；单项段与终态段展开 | 活动段被超越时记录收起；非活动多项段可手动展开。段内容仍受整轮折叠控制；展示隐藏项时展开其所在段 |
| 工具组 | live 尾组展开，其他组收起 | 手动值优先于默认；首次失去活动状态强制收起一次。之后手动重开，即使出现更多增量也保留。外层折叠不清空选择 |
| 单项详情 | 偏好为 expanded 且节点已结束时展开，运行时默认摘要 | 手动值优先；无有效详情不显示折叠按钮。Todo 卡自身清单交互由 `TodoTraceNode` 管理 |

示例：`工具 A → 工具 B → 思考 → 工具 C → 工具 D`。

1. A/B 到达：形成尾组并展开。
2. 思考到达：思考独立；A/B 收起一次。focused 隐藏思考也执行同一转换。
3. C/D 到达：形成新的展开组。用户重开 A/B 后，其选择不再被 C/D 的后续更新覆盖。
4. 终态：整轮收起，最终回答显示；重新展开整轮时保留已手动重开的组。

普通详情折叠时卸载，状态保留在整轮组件绑定的 reducer 中；OpenUI 产物是保持挂载的明确例外。每秒计时状态只在 `TraceMetrics` 内更新，不驱动整个轨迹重渲染。

## 其他展示契约

- 工具组状态：running 优先，其次 failed，再 finished；动作摘要按首次出现顺序去重。浏览器相关操作用“浏览器操作”计数，不把读取日志、脚本执行等一律称为浏览页面。
- 工具详情优先使用协议字段；无结构时才按名称兜底。普通详情不展示原始协议 JSON，文件和 URL 可交给宿主资源回调。
- 待处理审批/提问留在干预 dock；结束后投影为 completed-interaction，按工具调用 ID 锚定。
- 折叠触发器使用 button、aria-expanded/aria-controls；用户消息可复制，最终回答可复制/分享。相对消息时间与执行耗时独立。

## 修改与验证

先判断修改的是投影语义、分组边界、偏好过滤还是状态转换，只修改对应入口。不要在组件里追加同类 if，也不要通过更换 key 或卸载整个会话修复局部展示问题。

1. 在对应纯函数测试中覆盖边界与事件顺序；涉及挂载/交互时补组件回归。
2. 跑 `npm run test:conversation`、`npm run typecheck:conversation`；职责/依赖变化再跑 `npm run lint:arch`。
3. 合入前走会话 E2E。live/sub 需分别核对活动尾组、隐藏思考边界、手动重开、终态切换；Todo 与 OpenUI 核对唯一节点和稳定挂载。
4. 规则改变时同时改本文、实现及测试，不在旧 summary 文档复制第二份规则。
