# 会话模块业务逻辑验收清单(双轨重构后)

> 📚 文档总入口:[README.md](./README.md) · 测试同学请直接用:[conversation-regression-test-plan.md](./conversation-regression-test-plan.md) 基线:commit `cf5ab966c`(2026-08-17,`refactor/conversation-dual-track`)。用途:① 逐条真实验收、避免遗漏;② 维护同学之间互相认领、快速对齐接手。架构背景:[adr/conversation-runtime-refactor.md](./adr/conversation-runtime-refactor.md) · [conversation-dual-track-plan.md](./conversation-dual-track-plan.md) · 日常维护:[conversation-maintenance-guide.md](./conversation-maintenance-guide.md) · 行为细节:[agent-session-runtime-regression.md](./agent-session-runtime-regression.md)。本文是**验收底稿**:行为描述以当前代码为准,验收一项更新一项状态;发现清单与代码不符,以代码为准并回来改清单。

## 0. 使用约定

- **ID 稳定**:每条一个 ID(如 `D8`),沟通、提 bug、记录状态都引用 ID,勿复用已删除项的 ID。
- **状态取值**:`➖ 未验` / `✅ 通过(日期+人)` / `⚠️ 部分通过(备注)` / `❌ 不通过(附 issue)` / `N/A`。
- **负责人**:认领后填名字;多人协作时一人一条,验收记录写在行内或 PR 描述。
- **双线**:带 `〔双〕` 的行为在旧线(legacy)与新线(runtime)各验一遍——先 `?conversationRuntime=0` 再 `?conversationRuntime=1`。仅旧线/仅新线的会标注。
- **❗**:重点项或疑似缺口,优先安排。

## 1. 验证资产总览

| 层 | 命令 | 规模 | 前置 |
| --- | --- | --- | --- |
| 合同网 | `npm run test:conversation` | 33 文件 292 条,秒级 | 无 |
| 页面 E2E | `npm run dev` + `npm run e2e:conversation` | 8 场景 | dev server + ego-browser 登录态 |
| 组合 | `npm run verify:conversation` | 两网 | 同上 |
| CI | `.github/workflows/conversation-tests.yml` | 合同网,PR 触及会话路径自动跑 | pnpm 10.27 + Node 20 |

E2E 场景(环境变量可覆盖:`E2E_BASE_URL`/`E2E_CHAT_URL`/`E2E_TASKAGENT_URL`/`E2E_PREVIEW_TAB_URL`):

| ID | 场景 | 默认入口 |
| --- | --- | --- |
| E2E-01 | 登录态加载(home「最近使用」可见) | `${E2E_BASE_URL}/home` |
| E2E-02 | legacy 线发送:乐观追加+流式+收尾 | `/home/chat/1560617/3994` |
| E2E-03 | runtime 线发送:fiber 探针判定线归属+流后不漂移 | 同上 + `?conversationRuntime=1` |
| E2E-04 | runtime 线上滑加载更多(历史前插) | 复用 E2E-03 页面 |
| E2E-05 | flag 回落:去 URL param 回 legacy | 同 E2E-02 |
| E2E-06 | flag 粘性:localStorage 开 →runtime,清除 →legacy | 同上,键 `conversation_runtime_enabled` |
| E2E-07 | TaskAgent(runtime 线):发送+思考流+收尾 | `/home/chat/1560607/1596?conversationRuntime=1` |
| E2E-08 | 预览 Tab(隔离入口,runtime 线):发送+流式+收尾 | `/space/57/agent/3994?conversationRuntime=1` |

**可靠测试会话**:女娲 3994、TaskAgent 1596、预览 Tab `/space/57/agent/3994`(TaskAgent 4042 的 Slate 编辑器 E2E 输入不生效,人工正常)。

**两个必须知道的测试网事实**:

1. 合同网是 15 个路径子串过滤器(见 `package.json` 的 `test:conversation`),大小写敏感:`tests/useResumeStreamHandlers.test.ts`、`tests/fetchEventSourceConversationInfo.test.ts` **不在网内**(仅全量 `npm test` 跑)。改动这两个文件后务必手动跑一次。
2. `tests/useConversationStreamResume.test.ts`(17 条)钉的是 `UnifiedChatSession/hooks/useConversationStreamResume.ts`(840 行);但**生产代码实际引用的是 `src/features/conversation/react/useConversationStreamResume.ts`(754 行,`UnifiedChatSession/index.tsx:18`)**。改 features 版后合同网不会红——它的行为由 `resumeConsistencyController` / `snapshotConsistencyController` / `terminalConsistencyController` 三份测试间接锚定。组件目录版目前无生产引用,属待清理双副本。

下文表格中「自动验收」列的文件名均省略 `tests/` 前缀。

## 2. 能力域清单

### A. 发送与乐观上屏

核心文件:旧线 `src/models/conversationInfo.ts`(onMessageSend/handleConversation)、新线 `features/conversation/runtime/createConversationRuntimeSession.ts`(send/applyStreamEvent)、共享纯件 `models/conversationInfoMessageList.ts`。

| ID | 业务行为 | 预期结果 | 自动验收 | 人工验收要点 | 负责人/状态 |
| --- | --- | --- | --- | --- | --- |
| A1 | 〔双〕发送即乐观上屏 | user 消息 + assistant Loading 占位立即出现,不等后端;列表原有 Incomplete 消息置 Complete | conversationInfoModel · conversationRuntimeSession · E2E-02/03/08 | 页面直观点发送,肉眼确认两条立即上屏 | ➖ |
| A2 | 发送瞬间乐观活跃态 | `isConversationActive=true` + `isAwaitingChatTerminal=true` 立即生效(3s 保活内拒绝置 false) | conversationInfoModel | — | ➖ |
| A3 | 〔双〕乐观「执行中」标记 | isSync 入口发送后侧栏会话立即标执行中;隔离入口(`isSync:false`)不发 | conversationEffects · runtimeLineEffects · conversationRuntimeSession(R6) | 主 Chat 发送 → 侧栏立即转圈;预览 Tab 发送 → 侧栏不动 | ➖ |
| A4 | 〔双〕参数面透传 | files/infos/variableParams/sandboxId/skillIds/modelId/agentMode 完整到达请求体 | chatConversation · conversationDualTrackParity · conversationRuntimeSession | 挑一个带附件+@技能+变量表单的智能体发送,后端收参正确 | ➖ |
| A5 | 必填变量拦截 | 变量未填齐时阻止发送并触发表单校验 | chatConversation | 变量表单留空点发送 → 校验提示,不发请求 | ➖ |
| A6 | 首次进入自动发送 | `location.state` 带 message 时,仅会话为空/纯开场白才自动发;刷新(无 state)不重发 | — | 🖐 从入口卡片带消息进会话 → 自动发送;F5 刷新 → 不重发 | ➖ |
| A7 | 新建会话/清空 | 创建成功 → 清空副作用链 → 跳 `/home/chat/{id}/{agentId}`(应用侧栏模式跳 `/app/chat/...`);失败 → 错误提示+复位 | chatConversation | 点刷子新建 →URL 更新、消息区干净 | ➖ |
| A8 | RefreshChatMessage 事件 | 同会话事件消息追加到列表并强制置底 | chatConversation | 从外部入口(如卡片)触发,消息出现且滚到底 | ➖ |

### B. Live 流式渲染(SSE 事件归并)

协议事件仅 5+1 种:`HEART_BEAT / PROCESSING / MESSAGE / FINAL_RESULT / ERROR / ACP_REQUEST_PERMISSION`(干预类在进入归并前被 `processInterventionSsePatch` 优先拦截)。旧线 `conversationInfo.ts` handleChangeMessageList;新线 `features/conversation/domain/reduce*` + store。

| ID | 业务行为 | 预期结果 | 自动验收 | 人工验收要点 | 负责人/状态 |
| --- | --- | --- | --- | --- | --- |
| B1 | 〔双〕THINK 思考流 | chunk 追加到思考区,不污染正文;`finished=true` 结束思考态;每轮 THINK 独立切换 | conversationMessageEvent · conversationInfoModel · E2E-07 | TaskAgent 会话观察思考过程正常收展 | ➖ |
| B2 | 〔双〕正文 chunk 拼接 | 按顺序追加,`finished=true` 后消息 Complete;`isAwaitingChatTerminal` 保持到协议终态 | conversationInfoModel · conversationRuntimeSession | — | ➖ |
| B3 | 〔双〕QUESTION 建议消息 | text 追加,finished 后 `status=null`(隐藏运行状态),建议列表写入 | conversationInfoModel · conversationMessageEvent | — | ➖ |
| B4 | 〔双〕PROCESSING 工具块 | 按 `executeId` upsert 去重;thinkingFinished=true;status=Loading | conversationProcessingEvent · conversationRuntimeSession(T04) | 工具密集会话不出现重复工具卡 | ➖ |
| B5 | 〔双〕工作流多输出 | 新 id 且 finished 的 MESSAGE 以「原位前插」插入新行,乐观占位保留不覆盖 | conversationInfoModel · conversationMessageEvent(T03) · conversationDualTrackParity | 工作流型智能体多段输出逐段成行 | ➖ |
| B6 | 〔双〕FINAL_RESULT 收尾 | 消息 Complete、写 finalResult/requestId、reconcile 干预补齐;isSuggest 开启时拉建议 | conversationTerminalEvent · conversationInfoModel | — | ➖ |
| B7 | 〔双〕ERROR 事件 | 所属消息 Error;会话 taskStatus 立即落 FAILED+侧栏同步(不固化 EXECUTING) | conversationInfoModel · conversationTerminalEvent · conversationRuntimeSession | 构造模型报错 → 错误提示+输入区回发送态 | ➖ |
| B8 | heartbeat 无副作用 | 不写 messageList,不影响 DockPanel 与渲染 | conversationInfoModel(无分支即证) | Network 里心跳请求期间页面无跳变 | ➖ |
| B9 | 〔双〕Page/Link 预览 | PROCESSING(EXECUTING+Page)打开页面预览;Link 类型 window.open 新标签 | conversationRuntimeSession(T04-Page) · conversationEffects | 智能体产出页面/链接时预览正确打开 | ➖ |
| B10 | 〔双〕卡片结果 | PROCESSING(FINISHED+cardData)写 cardList:LIST 过滤空对象、单卡替换/同 requestId 追加,自动展开 | conversationEffects · runtimeLineEffects | 卡片型输出正常渲染与更新 | ➖ |
| B11 | 延迟 Ask 表单补偿(仅旧线) | FINAL_RESULT outputText 含 Event 标签时按 250/750/1500ms 静默补读详情,补丁缺失的 pending Ask 表单;切会话中止 | — | 🖐 构造慢落库 Ask 场景,确认表单最终补齐 | ➖ |
| B12 | 双线 digest 一致 | 同一事件 Trace 驱动两线,消息 digest 完全一致 | conversationDualTrackParity | — | ➖ |

### C. 停止与终态同步

核心文件:旧线 `conversationInfo.ts`(runStopConversation/onClose/onError)、统一清算 `useConversationTerminalFinalizer.ts`(sweep/终态守卫入口)、共享 `conversationInfoMessageList.ts`(findCurrentRoundStart + shouldDropLateMessageChunk)、`utils/conversationTaskStatusSync.ts`、新线 `createConversationRuntimeSession.ts`(stop/onClose)+ `runtime/terminalConsistencyController.ts`。修复背景:[conversation-error-taskstatus-stuck-fix.md](./conversation-error-taskstatus-stuck-fix.md)、[chat-terminal-polling-flash-qa-report.md](./chat-terminal-polling-flash-qa-report.md)。

| ID | 业务行为 | 预期结果 | 自动验收 | 人工验收要点 | 负责人/状态 |
| --- | --- | --- | --- | --- | --- |
| C1 | 〔双〕停止按钮显示 | 合成活跃=model isConversationActive ‖ 末条 Loading/Incomplete ‖ taskStatus===EXECUTING（工具状态不参与——架构解耦 `1f8c77bd9`） | runtimeSelectors · createConversationSessionModel · conversationSessionView | 后台任务执行中(无流式)也显示停止按钮;终态后按钮立即恢复 | ➖ |
| C2 | 〔双〕停止链路 | abort live+sub→ 本地尾消息 Stopped、EXECUTING processing→FAILED→ 调后端 stop;isStopping 防重 | conversationInfoModel · conversationRuntimeSession | 流式中点停止 → 立即停、消息标已停止、可继续发送 | ➖ |
| C3 | 〔双〕取消无输出删空气泡 | 用户主动取消且消息无文本 →splice 删除,不显示空气泡 | conversationTerminalEvent | 秒停场景不留空 Loading 气泡 | ➖ |
| C4 | ERROR/onError 落终态 | SSE ERROR 与网络 onError 都立刻 taskStatus=FAILED+侧栏清除执行中(历史 bug:只改消息不落会话态) | conversationInfoModel · conversationRuntimeSession(R6) | 拔网/断流 → 输入区不卡停止按钮 | ➖ |
| C5 | onClose 终态兜底 | FINAL 已解析终态则不再查询;未解析才 `syncTerminalConversationTaskStatus`;查询未返回也先释放活跃态 | conversationInfoModel · conversationRuntimeSession | — | ➖ |
| C6 | 终态写回规则 | 只写终态不写 EXECUTING;同值不写(防重渲);会话 id 不匹配不写;跨会话不沿用 | conversationTaskStatusSync(33 条) | — | ➖ |
| C7 | 侧栏终态补偿 | 轮询/sub 收尾观察到终态即 emitConversationListTaskStatus(幂等合并) | conversationInfoModel · useConversationStreamResume | 会话结束后侧栏「执行中」消失、终态正确 | ➖ |
| C8 | ❗〔双〕收尾不闪烁 | `isAwaitingChatTerminal` 门禁:MESSAGE finished 到 FINAL_RESULT 之间不轮询;USER 尾快照丢弃;`data-message-id` 用 clientRenderKey 保持稳定 | useConversationStreamResume · conversationInfoModel | 🖐 QA 报告 §6 十项(长回答/工具密集/快速多轮/停止/切后台/错误/刷新续接/四入口/侧栏同步/DOM 身份) | ➖ |
| C9 | 高频连续发送 | 上一轮连接延迟 onClose/onError 只清理自己的消息,不误停新一轮、不误弹错 | conversationInfoModel(2 条) · conversationRuntimeSession · liveConnectionController | 快速连发 3-5 轮无错乱 | ➖ |
| C10 | ❗〔双〕终态统一收敛 sweep | FINAL_RESULT/ERROR 到达 → taskStatus 落终态 + 清 awaiting + 破 3s 保活清活跃态 + 末条消息/当前轮 processing 收敛(一次完成,无论哪条路径到达) | conversationInfoModel · conversationRuntimeSession | 🖐 长任务正常完成后按钮立即回发送态、轮询恢复 | ➖ |
| C11 | 事件类型白名单 | finalizeChatTerminalEvent 只处理 FINAL_RESULT/ERROR;PROCESSING 载荷不误触发终态清算 | conversationInfoModel | PROCESSING 密集型 agent(如 PPT 生成)不出现内容丢失 | ➖ |
| C12 | 终态守卫(迟到分片丢弃) | 已终态消息(Complete/Error/Stopped)收到 MESSAGE 分片 → 整条丢弃,不回退状态;多步轮中间步边界放行(messageIdRef 判据) | conversationInfoMessageList(3 条) | 多步 agent 每步输出完整;终态后无状态回退 | ➖ |
| C13 | 轮次边界(检查与清理共用) | findCurrentRoundStart = 最后一条 USER 之后;isSessionStreamBusy 检查范围与 sweep 清理范围共用此边界 | conversationInfoMessageList · useExecutingTaskStatusPoll | 深工作流(>5 步)终态后按钮正确恢复 | ➖ |
| C14 | 工具状态架构解耦 | isSessionStreamBusy 不检查 processingList EXECUTING;工具状态仅影响 RunOver UI 展示 | useExecutingTaskStatusPoll | 单个工具 FINISHED 丢失不导致按钮卡死 | ➖ |
| C15 | Stopped/Error 复制按钮 | 终态消息(Stopped/Error/Complete/null)均可复制,无 status 限制 | ChatView | 停止/出错消息有完整输出时可复制 | ➖ |

### D. sub 流式恢复(刷新/新开标签)

核心文件:生产 `features/conversation/react/useConversationStreamResume.ts`(编排)+ `runtime/resumeController.ts`(订阅)+ `runtime/resumeConsistencyController.ts`(节律);`src/hooks/useResumeStreamHandlers.ts` 为旧线 model 内共享实现。

| ID | 业务行为 | 预期结果 | 自动验收 | 人工验收要点 | 负责人/状态 |
| --- | --- | --- | --- | --- | --- |
| D1 | 〔双〕EXECUTING 恢复 | 刷新/新开标签进入 EXECUTING 会话 → 轮询发现 → 订阅 `/chat/sub/:id` 从头重放重建输出 | resumeController · conversationRuntimeSession(R3-resume) | 🖐 发长任务后 F5→ 流式输出继续生长 | ➖ |
| D2 | 订阅前数据来源 | 优先复用轮询快照 messageList;无快照入口(首次进入)才 reload 历史 | useConversationStreamResume | — | ➖ |
| D3 | 等待历史 user | reload 后未出现可承接 user 时按 150/300/600/900/1200/1800ms 重试;始终没有 → 放弃订阅恢复轮询(避免先渲 assistant 再补 user 跳动) | useConversationStreamResume · resumeConsistencyController | 🖐 多页签场景 B 页签不漏显 A 的用户消息 | ➖ |
| D4 | 持久化尾去重 | reload 快照末尾已是持久化完整 assistant→ 不建 sub 不造占位(直接 onClose),防重复气泡 | resumeController | 🖐 任务刚完成瞬间刷新 → 无双气泡 | ➖ |
| D5 | 占位策略 | 只复用「本次恢复追加的占位」,绝不复用历史残留 Incomplete(防旧任务残留吞并本任务输出) | resumeController · useResumeStreamHandlers(网外) | — | ➖ |
| D6 | sub 的 user 消息 | sub 重放中的 USER 事件 upsert 到 assistant 占位**前**;误插到后面会移回 | resumeController · useResumeStreamHandlers | — | ➖ |
| D7 | 连接隔离与复用 | sub 独立 abort 句柄不与 live 互覆;同会话重入复用连接;不同会话才 abort 旧连接;旧 sub 迟到 close 不误杀新会话 | resumeController · createConversationRuntime | 🖐 快速切换会话不串流 | ➖ |
| D8 | 本地流结束冷却 | 同一会话本地流结束后 5s 内不订阅 sub(等 taskStatus 稳定);切会话不继承冷却 | resumeConsistencyController · useConversationStreamResume | — | ➖ |
| D9 | sub 秒关退避 | 存活<3s 记失败,按 2s×2ⁿ 指数退避(封顶 30s);长连接正常关闭重置;切会话清零 | resumeConsistencyController · useConversationStreamResume | — | ➖ |
| D10 | 〔双〕sub ERROR 主动断 | 收到 ERROR 事件 → 主动 abort→ 触发 onClose→ 恢复轮询继续检测重试 | resumeController · useResumeStreamHandlers(网外) | — | ➖ |
| D11 | sub 关闭终态确认 | 优先从本地 messageList finalResult 解析终态(**不 reload**,防结束闪烁);解析不到才 fetchConversationTaskStatus 兜底;终态同步完成后才恢复轮询 | terminalConsistencyController · useConversationStreamResume | 🖐 sub 恢复自然结束后页面不闪、侧栏状态正确 | ➖ |
| D12 | 本地发送打断 sub | 本地发消息 → 立即 abort sub,由 live 接管,无双流 | useConversationStreamResume | — | ➖ |
| D13 | sub 终态事件回调 | sub onMessage 收到 FINAL_RESULT/ERROR → finalizeChatTerminalEvent 完整清算(终态不依赖本地连接存活) | useResumeStreamHandlers | 🖐 本地连接断网后 sub 重放终态仍能恢复按钮 | ➖ |
| D14 | sub 关闭占位收尾 | sub onClose → 占位落 Stopped + rAF 重算活跃态 → 轮询恢复(由快照决定续挂或终态) | useResumeStreamHandlers · useConversationTerminalFinalizer | sub 恢复自然关闭后按钮不卡 | ➖ |
| D15 | sub 网络错误对齐 | sub onerror → 占位落 Error + taskStatus FAILED + 侧栏同步(与 chat onError 同款) | useResumeStreamHandlers | 断网时 sub 与 chat 表现一致 | ➖ |

### E. 状态轮询与竞态防护

核心文件:`features/conversation/react/useConversationStreamResume.ts`(编排)+ `runtime/snapshotConsistencyController.ts`。修复背景:[poll-send-race-stale-snapshot-fix.md](./poll-send-race-stale-snapshot-fix.md)。

| ID | 业务行为 | 预期结果 | 自动验收 | 人工验收要点 | 负责人/状态 |
| --- | --- | --- | --- | --- | --- |
| E1 | 〔双〕轮询 ready 条件 | 有会话 id 且 非本地流式 且 非等终态 且 未订阅 sub 且 resumeStream 已注入;5s 间隔、标签隐藏暂停、错误无限重试 | useConversationStreamResume · conversationSessionView(canPollSnapshot) | 🖐 DevTools Network:上述状态时无 `conversation` 详情轮询 | ➖ |
| E2 | 订阅即停轮询 | 续上 sub 同步 stopPolling;sub 关闭且终态同步完成后才 startPolling | useConversationStreamResume | — | ➖ |
| E3 | 轮询代际丢弃 | 本地开始发送 →generation++ 并立即 cancel;已在途回包整段丢弃(不写快照/终态/不误订阅) | useConversationStreamResume · snapshotConsistencyController | 🖐 轮询回包前夜快速发消息,乐观消息不被冲掉 | ➖ |
| E4 | 切回可见页签补快照 | visibilitychange→ 单飞拉一次快照(in-flight 去重);EXECUTING 且 user 就绪则订阅 sub;过期回包丢弃 | useConversationStreamResume · snapshotConsistencyController | 🖐 切后台再切回,无并发重复请求 | ➖ |
| E5 | USER 尾快照丢弃 | 快照末条为 USER(用户消息未落库)时拒绝覆盖列表(但 taskStatus/messageList 窗口可携带用于启动 sub) | snapshotConsistencyController · useConversationStreamResume | — | ➖ |
| E6 | 同值终态不写回 | taskStatus 相同不重复写(防下游 reload 闪烁);跨会话不沿用 | conversationTaskStatusSync · useConversationStreamResume | — | ➖ |
| E7 | 快照静默归并 | 轮询快照按稳定 id upsert+语义签名去重+保留乐观尾;内容等价引用不变不重渲 | conversationInfoModel(syncConversationSnapshotMessages) | — | ➖ |
| E8 | ChatFinished 事件订阅 | 列表含 EXECUTING 时订阅,仅匹配 conversationId 的事件触发一次终态同步 | useChatFinishedWhenListExecuting · conversationTaskStatusSync | — | ➖ |

### F. 消息队列(MessageQueue)

核心文件:`components/business-component/MessageQueue/`(useMessageQueue 原语 / useChatMessageQueue 编排 / queueStorage 持久化 / useUnifiedChatQueue 接入)。

| ID | 业务行为 | 预期结果 | 自动验收 | 人工验收要点 | 负责人/状态 |
| --- | --- | --- | --- | --- | --- |
| F1 | 〔双〕活跃时入队 | 流式/后台执行中发送 → 入队面板展示,不触发真实发送;空闲 → 直发 | messageQueue · messageQueueDisabled | 流式中连发两条 → 进面板不打断 | ➖ |
| F2 | 入队/消费阻塞分层 | 入队=流式‖执行中;消费额外被 pending intervention 阻塞,全解除才消费 | messageQueue · messageQueueIntervention · runtimeSelectors(queueGate) | — | ➖ |
| F3 | 自动消费节奏 | 阻塞 true→false 边沿触发;间隔 minConsumeInterval(1200ms)从流式结束时刻起算;逐条消费 | messageQueue | 连续入队 3 条 → 依次自动发出 | ➖ |
| F4 | 防双发 | 消费即 awaitingStreamEnd(须经历完整 active→idle 周期)+5s watchdog;consumeLock+2s release | messageQueue | — | ➖ |
| F5 | Error 不阻断消费 | 末条消息 Error 仍继续自动消费(历史 bug:曾永久阻断) | messageQueue · messageQueueIntervention | 出错后队列下一条仍发出 | ➖ |
| F6 | 停止暂停/再发恢复 | 用户点停止 →pauseAutoConsume;再发新消息 → 仅解除暂停不抢跑 | messageQueue | 停止后队列静默;手动发一条后队列恢复消费 | ➖ |
| F7 | 立即发送 | markSending 原地标记(不 stop 当前会话);空闲立即发,忙碌等本轮结束优先消费该项 | messageQueue · messageQueueIntervention | 流式中点某条「立即发送」→ 本轮结束后该条先于队首发出 | ➖ |
| F8 | 编辑回填 | 出队回填输入框;QUEUE_EDIT_MESSAGE 按 conversationId 过滤,主聊天/预览 Tab 不串扰 | messageQueue · unifiedChatSession | 双开两个会话编辑队列项,互不影响 | ➖ |
| F9 | 拖拽排序 | dnd-kit 拖拽改序;相同位置/越界不变 | messageQueue | 面板内拖动顺序生效 | ➖ |
| F10 | 参数快照回放 | 入队时快照 skillIds/modelId/agentMode(含 @技能),消费时原样回放 | messageQueue · queueStorage | 带 @技能入队,消费后技能仍生效 | ➖ |
| F11 | 持久化 | `msg_queue:{conversationId}` 分键;TTL 24h 过期丢弃;空队列删 key;损坏安全降级 | queueStorage | 🖐 刷新页面队列还在;隔天消失 | ➖ |
| F12 | 切会话隔离 | 切会话清空队列+重置消费状态与边沿基准 | messageQueue · messageQueueIntervention | — | ➖ |
| F13 | 队列开关关闭 | `!ENABLE_CHAT_MESSAGE_QUEUE` 时活跃期间禁发(拦截回车),无队列入队能力 | messageQueueDisabled | — | ➖ |
| F14 | 干预独占 | 有 pending intervention→ 队列面板隐藏、输入 wholeDisabled、消费暂停;解除恢复 | messageQueueIntervention · unifiedChatSession(.behavior) | 审批期间队列不可操作 | ➖ |

### G. 权限审批(acp permission)

核心文件:`AgentIntervention/`(useActiveInterventionQueue / AcpPermissionCard / DockPanel / reconcileAcpPermissionStatus)。

| ID | 业务行为 | 预期结果 | 自动验收 | 人工验收要点 | 负责人/状态 |
| --- | --- | --- | --- | --- | --- |
| G1 | Dock FIFO 堆叠 | 跨消息收集 pending/submitting 审批,按消息序+triggeredAt 升序;front 可交互,后层 aria-hidden+偏移,>2 层显徽标 | interventionDock · useActiveInterventionQueue(网外有 .test) | 多审批堆叠展示正确 | ➖ |
| G2 | 选项与快捷键 | 过滤 reject_always/codex 的 accept_execpolicy_amendment;数字 1/2/3、↑↓、Enter、Esc;submitting 禁用 | — | 🖐 键盘全流程走一遍 | ➖ |
| G3 | 提交/取消关闭 | approve/cancel 成功 → 卡片关闭 → 下一项自动顶上 | interventionDock | — | ➖ |
| G4 | API 幂等 | not_found / already_resolved / gone 视为已提交,不卡 front | reconcileAcpPermissionStatus(经 useActiveInterventionQueue 测试间接) | — | ➖ |
| G5 | failed 不阻塞 | 审批失败态不挡后续队列项 | useActiveInterventionQueue | — | ➖ |
| G6 | ❗〔双〕sub 重放幂等 | sub 从头重放已审批事件:processingList 该 toolCallId 已 FINISHED→submitted;关联 Ask 已有 resume→submitted;不再卡 Dock | resumeController 场景 · AgentIntervention reconcile 系列 | 🖐 审批后刷新页面(replay)→Dock 不重现已批卡 | ➖ |
| G7 | 卡片信息 | bash 标题显示 rawInput.command;文件变更渲染 diff;自动 focus+失焦回焦 | — | 🖐 bash 命令卡与文件 diff 卡各验一次 | ➖ |
| G8 | ACP 抑制 MCP Ask | ACP rawInput 指向的 Ask 不重复弹 | useActiveInterventionQueue | — | ➖ |

### H. MCP Ask(ask-question)

核心文件:`AgentIntervention/McpAskQuestionCard/`、`utils/mcpAskResumeMessage.ts`、`normalizeMcpAskFormData.ts`。

| ID | 业务行为 | 预期结果 | 自动验收 | 人工验收要点 | 负责人/状态 |
| --- | --- | --- | --- | --- | --- |
| H1 | 表单渲染 | 普通表单一键校验;wizard 多步逐 step 校验+最终全量;Enter 提交(textarea/输入法态忽略)、Esc 取消、isSkipAllowed 显示跳过 | interventionDock · McpAskQuestionCard 自带 test | 🖐 各 widget 类型各过一遍 | ➖ |
| H2 | 提交 →resume 消息 | respondMcpAsk 返回文本/附件 →`rawSend` 发送(**绕过消息队列**)→ 会话继续 | interventionDock · unifiedChatSession(.behavior) | 🖐 提交后 agent 继续执行 | ➖ |
| H3 | 取消/跳过 | 仅发对应 action payload,生成对应 resume 语义 | interventionDock | — | ➖ |
| H4 | 文件上传字段 | file 字段用 McpAskFileUpload(UPLOAD_FILE_ACTION+Bearer+type:tmp),单/多文件限制,提交时提取附件归一化 | normalizeMcpAskFormData · applyMcpAskToolCallSseEvent 系列 | 🖐 带文件字段的表单上传+提交 | ➖ |
| H5 | 表单幂等初始化 | `requestId:revision` 为 key 只初始化一次;服务端补偿快照不覆盖用户未提交的本地编辑 | McpAskQuestionCard 自带 test | 🖐 填一半等补偿到达,输入不丢 | ➖ |
| H6 | 同 title 连续 ask | 第一次回答后第二次仍弹 Dock(顺序配对) | mcpAskResumeMessage 系列 | 🖐 连续两次同名表单 | ➖ |
| H7 | hydrate/reconcile 幂等 | hydrated 仍 pending 但已有 resume 消息 →submitted,防重放误弹 | reconcileMcpAskHydratedStatus | — | ➖ |
| H8 | 提交乐观 dismiss | 提交即本地移除防重复点击;回执失败回滚重弹 | AgentInterventionChatLayer | 🖐 弱网下提交失败卡片回来 | ➖ |

### I. agentMode 模式切换(yolo/ask)

核心文件:`AgentIntervention/hooks/useAgentInterventionLayer.ts`。注意:缓存已是 **versioned 对象** `{version, defaultMode, agents:{agentId:mode}}`(兼容旧纯字符串),key `nuwax_agent_mode_cache`。

| ID | 业务行为 | 预期结果 | 自动验收 | 人工验收要点 | 负责人/状态 |
| --- | --- | --- | --- | --- | --- |
| I1 | 按智能体缓存 | 每个 agentId 独立记忆 yolo/ask;旧字符串缓存可读 | useAgentInterventionLayer 自带 test | 同页签切两个智能体,模式各自记忆 | ➖ |
| I2 | 隔离入口不落缓存 | 预览 Tab/未开模式选择 → 固定 yolo 纯内存态,不读写 localStorage | useAgentInterventionLayer 自带 test | 预览切模式 → 主会话不受影响 | ➖ |
| I3 | 跨标签页同步 | storage 事件即时同步;同标签 5s 轮询兜底;只更新 state 不回写(防循环) | useAgentInterventionLayer 自带 test | 🖐 双开标签 A 切模式 →B 跟随 | ➖ |
| I4 | 门控与回归 | 仅 allowChooseMode===Yes 显示选择器;agentId/权限变化重读缓存或回归 yolo | unifiedChatSession(.behavior) | — | ➖ |

### J. 历史加载与加载更多

核心文件:`conversationInfo.ts` reload、`UnifiedChatSession/hooks/useLoadMoreHistory.ts`、新线 `conversationMessageStore`(replaceFromHistory/prependFromHistory)。

| ID | 业务行为 | 预期结果 | 自动验收 | 人工验收要点 | 负责人/状态 |
| --- | --- | --- | --- | --- | --- |
| J1 | 〔双〕详情加载 | 整体替换列表但保留本地乐观尾;`mergeConversationInfoTaskStatus` 防 EXECUTING 覆盖已确认终态 | conversationRuntimeSession(R3-load) · conversationTaskStatusSync | — | ➖ |
| J2 | 慢请求过期丢弃 | 加载在途回包时已切会话 → 返回丢弃 | conversationRuntimeSession(R3-load) | 🖐 慢网络快速切会话不串数据 | ➖ |
| J3 | 〔双〕上滑加载更多 | 顶部哨兵进入视口 → 前插更早历史页;loadingMore 防重入 | useLoadMoreHistory 自带 test(网外注意) · E2E-04 | 长会话上滑加载,顺序正确 | ➖ |
| J4 | 视口位置锁定 | 加载完成后按 scrollHeight 差补偿,阅读位置不跳 | useUnifiedChatScroll 自带 test | 上滑加载后视口停在原消息 | ➖ |
| J5 | 空态与开场白 | 空会话渲染 AgentChatEmpty;开场白占位(id 为空)过滤不渲;加载中只显示 loading | unifiedChatSession | — | ➖ |

### K. 滚动行为

核心文件:`UnifiedChatSession/hooks/useUnifiedChatScroll.ts`、`src/hooks/useConversationScrollDetection.ts`。

| ID | 业务行为 | 预期结果 | 自动验收 | 人工验收要点 | 负责人/状态 |
| --- | --- | --- | --- | --- | --- |
| K1 | 〔双〕流式自动贴底 | messageList 引用变化/首载/末条完成 → 多级延迟兜底贴底 | useUnifiedChatScroll 自带 test | 长输出期间稳定跟随 | ➖ |
| K2 | 程序滚动标记 | `__isProgrammaticScroll` 防「滚一半被当用户滚动而停」 | useUnifiedChatScroll 自带 test | 🖐 恢复流(sub)也持续贴底 | ➖ |
| K3 | 用户滚动打断 | 上滚立即停自动贴底;距底 ≤50px 重新启用;>100px 显示回到底部按钮 | useConversationScrollDetection(网外) | 🖐 上滚回读历史不被拽回 | ➖ |
| K4 | 发送强制置底 | 点发送 → 强制 allowAutoScroll=true+隐藏滚底按钮+立即置底 | — | 🖐 上滚后直接发送,自动回底 | ➖ |
| K5 | 会话结束补滚 | isConversationActive true→false 下降沿补多轮置底(定时器不被重渲清掉) | useUnifiedChatScroll 自带 test | 收尾瞬间停在底部 | ➖ |

### L. 双轨 flag 与五入口

核心文件:`utils/conversationRuntimeFlag.ts`、`features/conversation/react/useConversationRuntimeSession.ts`。五入口:Chat、ConversationAgent 面板(x2)、EditAgent PreviewAndDebug、Plugin(PluginChatSession);另有 SkillDetailsConversation 复用 ChatCore。

| ID | 业务行为 | 预期结果 | 自动验收 | 人工验收要点 | 负责人/状态 |
| --- | --- | --- | --- | --- | --- |
| L1 | flag 优先级 | URL `?conversationRuntime=1/0` > localStorage `conversation_runtime_enabled` > 默认 **false(legacy)**;清除回落默认 | conversationRuntimeFlag · E2E-05/06 | — | ➖ |
| L2 | 五入口接线 | `...(runtimeLine?.conversationProps ?? {})` 置 props **末尾**覆盖旧线字段;flag off 空对象零影响 | conversationDualTrackParity · E2E-02/03/07/08 | 🖐 五入口各开一次 `?conversationRuntime=1` 发消息 | ➖ |
| L3 | 线归属不漂移 | 流式过程/结束后线归属稳定(props 覆盖顺序) | E2E-03/08 | — | ➖ |
| L4 | isSync 隔离语义 | 预览等隔离入口 `isSync:false`:乐观列表标记/topic 更新/onClose 列表刷新全 gate | conversationRuntimeSession(R6) · conversationEffects | — | ➖ |
| L5 | 新线 store 接管 | 新线 messageList 唯一写入口 conversationMessageStore;干预回执经 storeAsDispatch 入新线 store | conversationMessageStore · useConversationRuntimeSession | — | ➖ |
| L6 | ❗ 新线 effect 分发缺口 | 新线 session 仅分发 8 类 effect;`desktop.open`(远程桌面)、`preview.file.refresh`(文件树节流刷新)、`taskResult.settle`(TaskAgent 收尾文件链)**有执行体但无分发点**(`createConversationRuntimeSession.ts` 无 dispatch;执行体在 mainChatEffectsAdapter:213/runtimeLineHttp:192)。runtime 线上这三条链路疑似不触发,E2E-07 未覆盖文件树断言 | — | 🖐 **runtime 线 TaskAgent 会话**:执行任务后确认文件树刷新/Git 刷新/task-result 文件自动打开是否生效;远程桌面/ToolCall 文件树刷新同样验证。结论要么补接线要么记为已知差异 | ➖ |
| L7 | 预览 effects 子集 | previewEffectsAdapter 只执行 suggest/预览/终态补丁,忽略列表/主题/卡片/桌面(预期差异) | conversationEffects(preview 4 条) | — | ➖ |

### M. 多页签协同

| ID | 业务行为 | 预期结果 | 自动验收 | 人工验收要点 | 负责人/状态 |
| --- | --- | --- | --- | --- | --- |
| M1 | 跨页签 sub 恢复 | B 页签轮询发现 A 页签触发的 EXECUTING→ 订阅前拿含 A 用户消息的列表,不漏显 | useConversationStreamResume | 🖐 双开标签,A 发消息,B 恢复流且用户消息可见 | ➖ |
| M2 | 跨页签审批关闭 | A 页签审批 → 会话结束 →B 页签 sub 收 end_turn/轮询终态 →Dock 关闭 | — | 🖐 双开标签走一次 ACP 审批 | ➖ |
| M3 | agentMode 跨标签 | 见 I3 | useAgentInterventionLayer | 🖐 | ➖ |
| M4 | 仅可见页签轮询 | pollingWhenHidden:false,隐藏页签不轮询 | useConversationStreamResume(ready 含 hidden) | 🖐 DevTools 确认后台标签无轮询 | ➖ |
| M5 | 队列编辑不串扰 | 见 F8 | messageQueue | 🖐 | ➖ |

### N. TaskAgent / 预览 Tab / 入口差异

| ID | 业务行为 | 预期结果 | 自动验收 | 人工验收要点 | 负责人/状态 |
| --- | --- | --- | --- | --- | --- |
| N1 | ❗TaskAgent 收尾文件链(旧线) | FINAL_RESULT→ 刷文件树 → 按需刷 Git→task-result 文件打开并选中 → 未命中发兜底 trigger(新线疑似断链,见 L6) | conversationEffects · runtimeLineEffects(仅执行体) | 🖐 两条线各跑一次 TaskAgent 任务收尾 | ➖ |
| N2 | TaskAgent 工作区 | 文件树/终端/智能体电脑三入口互斥切换;电脑入口按「通用型+未隐藏+云端」显示;@技能 mention 与 Git 仅 TaskAgent | — | 🖐 TaskAgent 页面逐项点检 | ➖ |
| N3 | 预览 Tab 数据隔离 | 走 conversationAgent model,与主会话完全隔离;队列/干预显式注入 context | useConversationAgentChatSession | 🖐 主会话与预览 Tab 同时会话,互不串 | ➖ |
| N4 | 预览输入联动 | 主会话流式活跃或 EXECUTING→ 预览输入禁用 | — | 🖐 主会话执行中预览灰掉 | ➖ |
| N5 | 预览终态兜底 reload | applyTerminalTaskStatus 后 reload 最新历史(外部写入可能错过 sub 窗口),保留乐观尾、等价不重渲 | useConversationAgentChatSession | — | ➖ |
| N6 | Plugin/EditAgent 入口 | 两入口 runtime 线基本发送/收尾同主 Chat | E2E-08(预览) | 🖐 Plugin 会话页人工过一遍(无 E2E) | ➖ |

## 3. 已知边界与交接要点

1. **resume hook 双副本**(见 §1 事实 2):生产用 features 版,合同网钉旧副本。接手恢复/轮询逻辑时**改 features 版**;组件目录版待删除(删时同步退役其测试)。
2. **新线 effect 分发缺口**(L6):`desktop.open` / `preview.file.refresh` / `taskResult.settle` 无分发点,切默认 `CONVERSATION_RUNTIME_DEFAULT=true` 前必须给出结论。
3. **conversationAgent onClose 裸 await**(`conversationAgent.ts:970-976`):兜底终态查询 reject 时 `isAwaitingChatTerminal` 不释放,Agent 面板轮询保持阻塞直到下次发送/切会话自愈;主链路 conversationInfo 已用 `.catch().finally()`。建议一行对齐(QA 报告 §7.1)。
4. **两 model 漂移**:conversationInfo 与 conversationAgent 高度相似但独立维护(已知差异:后者 suggest 有 generation 守卫、无 TaskAgent/卡片/桌面/文件树链路;前者 suggest 无防过期)。修 bug 时检查另一份是否需要同步。
5. **诊断日志**:`conversationPollingDiagnostics` / `conversationEffectsDiagnostics` / `[DEBUG-chat-poll-before-final]`(开发环境临时)保留用于排障;effects 诊断只记摘要不记正文。
6. **E2E 覆盖边界**:E2E 不进 CI(需登录态);断网类(E3/C4 部分)、多页签(M1/M2)、弱网回滚(H8)只有人工路径;TaskAgent 4042 Slate 编辑器 E2E 不生效用 1596。
7. **tsc 预存 ~415 错误**与会话无关,验收门是 `npm run test:conversation`,不是 `tsc --noEmit`。
8. **umi 传递依赖**:`utils/common`、基线 `constants/*` 会拖入 umi,vitest 需 mock;纯模块避免直接依赖。
9. **失败消息无「重发」按钮**:重试语义由队列「立即发送/编辑」与 sub 退避承担;若产品要加重发,当前无实现。

## 4. 相关文档

- [conversation-regression-test-plan.md](./conversation-regression-test-plan.md) — **测试同学用的回归方案**(同一套条目 ID,含影响范围/改动点/优先级分层/出口标准)
- [conversation-maintenance-guide.md](./conversation-maintenance-guide.md) — 日常维护/双线 flag 运维
- [agent-session-runtime-regression.md](./agent-session-runtime-regression.md) — 行为细节全量对齐文档(§10 高风险点、§11 建议回归清单为本文前身)
- [archive/conversation-stream-resume-and-intervention.md](./archive/conversation-stream-resume-and-intervention.md) — ⚠️ 2026-06-30 后未更新,轮询条件/agentMode 缓存结构/恢复节律已过时,以本文 D/E/I 域为准
- [chat-terminal-polling-flash-qa-report.md](./chat-terminal-polling-flash-qa-report.md) — C8 收尾闪烁专项(含 §6 十项人工场景)
- [poll-send-race-stale-snapshot-fix.md](./poll-send-race-stale-snapshot-fix.md) — E3 竞态专项
- [conversation-error-taskstatus-stuck-fix.md](./conversation-error-taskstatus-stuck-fix.md) — C4 终态固化专项
- [message-queue-design.md](./message-queue-design.md) — F 域初版设计(实现已演进,以代码为准)

## 变更记录

- 2026-08-17:首版,基于 `cf5ab966c` 全量梳理(合同网 33 文件 292 条 + E2E 8 场景 + QA 报告 + 代码走查)。

### 2026-08-20 终态收敛体系修复同步

- C1 按钮公式更新:移除"近 5 条 EXECUTING processing"(架构解耦 `1f8c77bd9`)
- 新增 C10~C15:终态统一收敛 sweep / 事件类型白名单 / 终态守卫 / 轮次边界 / 工具状态解耦 / 复制按钮
- 新增 D13~D15:sub 终态回调 / sub 关闭占位收尾 / sub 网络错误对齐
- 修复文档: [terminal-convergence-fix-summary.md](./terminal-convergence-fix-summary.md)
