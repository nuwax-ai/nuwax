# V2 轨迹行三态交互(思考时长 + 计数组头 + 待办卡)

日期:2026-09-19 · 分支:feat-dong.0930 · 前置批次:同日已实现运行中思考行 ticker + RunOver 去扫光

## 定稿口径(用户逐项拍板)

- 完成态思考行 = 折叠单行「思考 · 持续了 N 秒」;无时长数据保首行摘要降级。
- 组头 = 终态计数拼接(「读取了 2 个文件 · 运行了 1 条命令」);运行中保持动词词条 + spinner 不计数。
- 展开/收起 = 即时无动画(严格懒挂载不动)。
- 文件可点**不恢复**(09-14 定调维持)。
- 待办卡按参考样式专属渲染(「待办 N/M」头部 + 完成/进行中/待办三态项)。

## 数据契约(已核实)

- Plan 工具 `processing.result.data` = `Array<{status:'completed'|'pending'|'failed'|'in_progress', content:string}>`(V1 `MarkdownCustomProcess` renderPlanDetails 同源)。
- N/M 复用 `@/utils/terminalOutput` 的 `getPlanProgress`,不自造解析器。
- 思考段无任何后端时间戳 → 投影层内存锚点(页面生命周期);后端补契约后替换(TODO 锚)。

## 实现要点

1. `types.ts`:`ConversationProcessNode.durationMs?: number`。
2. `projectConversation.ts`:模块级 `Map<nodeId, {start, end?}>`;构建 reasoning 节点时首见 running 记 start、翻 finished 记 end,`durationMs = max(0, end-start)`;历史无锚点 undefined。投影层记录(非渲染层 effect)保证 focused 预设/轨迹收起时不丢锚点。
3. `ProcessNodeRow.tsx`:完成态 reasoning 行——durationMs 存在时 summary 槽位渲染 `nodeThinkingDuration`+node-dot;否则维持首行摘要。
4. `ToolGroupDisclosure.tsx`:组头 running 沿用 `toolActionLabel`;终态按 kind 计数词条拼接(全 isCreate 用创建变体)。
5. `TodoTraceNode.tsx`(新):头部(图标+「待办」+N/M+spinner/chevron)+三态项列表(完成=绿勾+删除线、进行中=→+主色、待办=空心圈+次级、失败=红 ✗);运行中默认展开、结束自动收起一次、历史收起;`result.data` 非空数组才接管,否则回落 ProcessNodeRow。
6. `traceItems.ts`:`isTodoTraceNode(node)` = kind 'plan' 且可提取非空步骤数组。
7. `WorkTraceDisclosure.tsx`:standalone 分支在 OpenUiTraceNode 之后接管 TodoTraceNode。
8. i18n(zh-CN/en-US):`nodeThinkingDuration`、`todoTraceTitle`、组头计数 9 条。

## 明确不做

文件可点、展开动画、工具行耗时、运行中组头计数、后端思考时间戳(仅 TODO 锚)、todo 跨轮去重。

## 质量门

`npm run test:conversation` 全绿(parity 存量收集崩除外);tsc 触达零新增;浏览器走查:思考时长/终态组头计数/待办卡三态与降级/历史轮回退。
