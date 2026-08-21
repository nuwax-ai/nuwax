# Mock 验收体系优化开发计划（v3，subagent 评审修订版）

> **目标**：把 `/mock-chat` 场景库升级为「自动化测试 + 人工验收」双用的会话域回归防线—— 服务两个在途决策：终态收敛修复的持续回归、双轨 R6 默认值切换前的大面积回归。 v2 经 Plan 架构评审（代码逐项核证）修订为 v3：修正 1 处设计错误、2 处假绿漏洞，吸收 10 项遗漏。评审关键结论：顺序 M0→M3 合理，但 M0 范围需扩大。

## 现状基线（2026-08-21，均已落地）

- 32 场景，数据源单点 `mock/conversationScenarios.ts`；页面 `src/examples/MockChat` 经 `GET /api/mock/conversation/scenarios` 拉元数据，`src` 零依赖 mock 数据
- 合同测试 `tests/interventionDockScenarios.test.ts`（11 用例）锁定场景 ↔ `processInterventionSsePatch` 对齐——runtime 线经 `reconcileFinalMessageState.ts:55` 复用同一 applier，两轨同受益；两线投影差异由双轨 E2E 补（单测层已有 `conversationDualTrackParity.test.ts`）
- 双路由 `/mock-chat` / `/app/mock-chat`；mock 12 个接口双轨全覆盖（传输层 URL 已含 mock 同源改写）
- 分层现状：vitest 合同网（秒级，CI 守门）→ **mock 场景 E2E（`e2e:mock-chat`，31 场景 × 双轨，无登录态，M2 已落地）** → 真实页面 E2E（`conversation-acceptance.mjs`，登录态，本地跑）

## M0：runtime 轨接入 mock 页（1~1.5 天，最高优先）

**评审修正**：v2 的「照抄 Chat 页 1251/1365 行」低估了两块必要改造——MockChat 的页面编排（`prepareScenario`→`model.runAsync`、`play`→`model.onMessageSend`、resume/sub→ `model.resumeConversationStream`、IDLE_POLL→`model.syncConversationSnapshotMessages/ finalizeConversationTerminal`、stop→`model.runStopConversation`）全部直驱 legacy 线， **props 覆盖机制管不到它们**。只加 spread 会出现「消息走 legacy SSE、UI 显示 runtime 空列表、断言读 legacy 状态」的假通过。因此 M0 范围是：

1. **组装 runtime 线**（照抄 `src/pages/Chat/index.tsx:1251,1365` 模式）：
   ```ts
   const runtimeLine = useConversationRuntimeSession({
     conversationId: MOCK_CONVERSATION_ID,
     // effectsResources 可选契约（adapter 全 optional chaining + asyncNoop 兜底）；
     // 先例：AgentConversationChatPanel/index.tsx:104 传 {}。
     // TaskAgent 文件树/预览类 effect 在 mock 页静默跳过——M0 验证时记录跳过清单。
   });
   // UnifiedChatSession JSX 尾部：...(runtimeLine?.conversationProps ?? {})
   ```
   轨归属由 `conversationRuntimeFlag`（URL param > localStorage）驱动，页面头部显示当前轨。
2. **编排层按轨分派**：`prepare/play/stop/resume/IDLE_POLL` 五处 `model.*` 调用改为轨感知（runtime 轨改走 `runtimeLine.session` 等价 API；以 `useConversationRuntimeSession` 暴露的 session 接口为准，对照 `useConversationAgentChatSession.ts:254` 的现成用法）。
3. **断言输入按轨选择器**：`model.conversationInfo / model.isConversationActive / model.messageList` 等断言数据源抽成「当前轨状态选择器」——runtime 线不写旧 model（接口注释明示），否则 runtime 轨断言恒真空转（「终态后已释放」永真假绿）。
4. **queueContext 注入**：`useUnifiedChatQueue.ts:72-83` 未注入时队列门控回落读 legacy model， runtime 轨下恒假——传 `queueContext` 对齐 `useConversationAgentChatSession.ts:272`。
5. **场景切换时清理 runtime 连接**：`prepareScenario` 目前只清 legacy （`model.abortResumeStream/handleClearSideEffect`），补 runtime 等价清理，防上一场景连接继续收事件污染断言。

**验证**：`?conversationRuntime=1` 下 NORMAL_SINGLE / RENDER_SHOWCASE / SESSION_RESUME / MESSAGE_QUEUE_HOLDING 播放正常；页面断言非空转（终态场景先出现 EXECUTING 再收敛）； fiber 探针确认轨归属。

## M1：侵入收敛 + 文档同步（各 0.5h）

- 单点化：新建 `src/utils/isConversationMockPage.ts`（dev-only），替换 **5 处**业务判断（评审修正计数；v2 误写 6 处）：`src/app.tsx:44`（publicPaths 项）、 `src/constants/common.constants.ts:14`、`src/services/agentConfig.ts:46`、 `src/services/common.ts:157,167`。路由注册 2 处保持 dev-only 分支现状。
- **收紧匹配**：现 `includes('mock-chat')` 为子串宽匹配，单点化时改为精确路由（`/mock-chat` 与 `/app/mock-chat`）。
- **语义注意**：`conversationApiOrigin` 是模块加载期一次求值的 const；单点函数若改为每次调用求值，需同步改造三个下游 URL 常量的导出方式。
- 文档：`mock-testing-plan.md` 追加「实施现状」（32 场景表、目录结构、元数据接口、 **热重载坑**：改 `mock/conversationScenarios.ts` 需 touch `mock/conversationMock.ts`）； `docs/conversation/README.md` 挂入口。

## M2：E2E 一期——断言型全场景回归（1~1.5 天）

**原则：断言单源**——页面算（M0 已按轨取源），E2E 只读。

- 页面暴露 `window.__MOCK_CHAT_ASSERTIONS__ = { scenarioId, line, assertions: [{label, passed}], updatedAt }`（dev-only）
- 新建 `scripts/e2e/mock-chat-acceptance.mjs`，复用 `conversation-acceptance.mjs` 的 ego-browser 模式（http 前置探测 / scenario 包装 / exit 0/1）：
  1. 遍历 `GET /api/mock/conversation/scenarios`
  2. 逐场景：设 URL（含 `?conversationRuntime=`）→ 播放 → 轮询 `window.__MOCK_CHAT_ASSERTIONS__` 至收尾判定
  3. 轨归属探针：抄 `probeLine`（runtime 的 `onSendMessage` 函数体含 `session.send`）， **选择器放宽**为 `[class*="mention-editor"]`（原 `___tr1OZ` 哈希脆弱）
- **收尾判定补门控（评审漏洞二）**：无 FINAL_RESULT 的场景（NETWORK_ERROR / SUB_NETWORK_ERROR / PROCESSING_UNFINISHED 等）断言在 t=0 即全真，E2E 会在开播前误收。收尾条件 = `已开流`（mock status `emittedEvents.length > 0` 且页面消息数 > 0） `且`（终态场景：断言全 passed `且` FINAL_RESULT 已发；悬挂场景：稳定 N 秒窗口—— 搬 `waitForStreamSettled` 的稳定窗口模式）
- **单标签串行（评审确认）**：mock server 的 `currentScenarioId/emittedEvents/pollCount` 为模块级全局单例——并行多 tab 会互相覆盖场景状态。E2E 用 `openOrReuseTab` 模式单标签跑。
- 场景矩阵：32 场景 × {legacy, runtime}；`MESSAGE_QUEUE_HOLDING` 归 M3。 `package.json`：`"e2e:mock-chat"` + `E2E_SCENARIOS` / `E2E_LINE` 过滤变量。
- **已知边界（评审遗漏 6）**：`src/models/conversationAgent.ts` 是 ConversationAgent 页的独立 fork（SSE 处理整份拷贝），不在本矩阵内；该页已有两个 runtime 接入点—— R6 切换若需覆盖此 fork 线，另行立项。此边界写入文档。

## M3：E2E 二期——交互型 + 补全（1 天）

- 交互驱动：`PERMISSION_*` 点「允许一次」断言流继续；`ASK_*` 填表提交； `INTERVENTION_STACK` 逐卡 FIFO；`MESSAGE_QUEUE_HOLDING` 连发 2 条 → 队列面板 → 停止 → flush； `OPENUI_*` 容器挂载断言
- console 观测：断言页面零 `Conv:Status` 级 error 输出
- **时长型场景分层**（评审设计修正）：
  - 日常回归跑压缩版（现状 delayMs：HEARTBEAT ~4.1s / LATE_CHUNK 200ms / ERROR 无延迟）
  - `E2E_REAL_TIMING=1` 跑真实时长子集：`HEARTBEAT_ONLY`（60s+，验看门狗不误杀—— 看门狗真实存在且两轨共用：`fetchEventSourceConversationInfo.ts:103-148`，60s 空闲断连、5s 检查）； `LATE_CHUNK_SLOW`（迟到 154s，对齐 1654471 事故）——**必须在 FINAL_RESULT 与迟到 MESSAGE 之间补心跳维活**，否则 60s 看门狗 abort 连接，迟到分片永远送不到 `shouldDropLateMessageChunk`，测到的只是看门狗（v2 设计错误，v3 修正；补心跳也正对齐事故中服务端带心跳的真实形态）
  - 服务端无障碍：mock middleware 直写 res，keep-open 已有无限期挂连接先例
- 上传/STT 纳入 mock：常量切同源（复用 M1 单点）+ multipart handler
- CI 评估（独立决策点）：mock E2E 无登录态，进 CI 仅需起 dev server（~2min）； `conversation-tests.yml` 注释说明 gitee Go/Jenkins 可照抄三步——M2 稳定后再接

## M0 实施记录（2026-08-21，已落地）

- 编排分派（`lineApi`：resetAndLoad/abortStreams/send/stop/resume/applySnapshot/applyTerminal）、断言按轨选择器、queueContext 注入、runtime 滚动 refs 均已实现；页面头部显示当前轨 Tag。
- 浏览器级验证（chrome-devtools，`?conversationRuntime=1`）：
  - NORMAL_SINGLE：消息流完整（think → 工具 → 正文），4 断言全绿，COMPLETE、无 EXECUTING 残留 ✓
  - SESSION_RESUME：快照装载 + sub 续接 + 终态 ✓；干净复现下消息列表无残留（连续快速切换场景的时序假象除外——重复 play 与页面自动 resume 叠加，第二轮流被 requestId 门禁丢弃，幂等）
- **已知差异（记录，runtime 线另行修复）**：SESSION_RESUME 续接后快照 assistant 的 EXECUTING processingList 不被清理（runtime 续接投影新建消息而非 upsert 快照 loading 消息； legacy 靠 finalizeConversationTerminal 全列表清理）——mock 页断言 4 在 runtime 轨此场景为红，属真实行为差异暴露，正是双轨验收的价值。
- **重复 resume 说明**：UnifiedChatSession 的自动恢复 hook（EXECUTING 时）与 play 的手动 resume 可能并存，实测幂等（requestId 门禁丢弃第二轮）；E2E 化后可按「事件数 == 脚本数」断言防重复。

## M2 实施记录（2026-08-21，已落地）

- **页面侧（`src/examples/MockChat/index.tsx`）**：
  - URL 驱动入口：`?scenario=<id>&speed=<n>&autoplay=1`——E2E 单标签串行整页重载，状态天然干净；autoplay 依赖场景元数据就绪（异步 fetch），首帧为空会导致 play 提前 return、SSE 永不开流，已修复为等 `scenarios` 非空再触发
  - `window.__MOCK_CHAT_ASSERTIONS__` dev-only 快照（断言单源：页面算，E2E 只读）：`{ scenarioId, line, assertions, playing, streamActive, messageCount, emittedCount, hasFinalResult, serverTaskStatus, sawActive, sawExecutingTools, lastError, updatedAt }`
  - **修复 M0 遗留假绿**：断言 3 非悬挂分支原读 `model.isConversationActive`（runtime 轨恒 false）→ 统一按轨选择器 `lineIsConversationActive`；「停止会话」按钮与运行状态 Tag 同步按轨取源
  - 非空转证明：`sawActive`（本轨流式活跃 或 快照 taskStatus=EXECUTING——resume 链路 legacy 轨 model 标志不覆盖，靠 taskStatus 补充）、`sawExecutingTools`
- **E2E 套件（`scripts/e2e/mock-chat-acceptance.mjs` + `scripts/e2e/ego-run.mjs`）**：
  - `npm run e2e:mock-chat`：31 场景（32 减 M3 的 MESSAGE_QUEUE_HOLDING）× {legacy, runtime} 单标签串行；过滤变量 `E2E_SCENARIOS` / `E2E_LINE` / `E2E_TIMEOUT` / `E2E_SPEED`
  - **env 桥接**：ego-browser 沙箱不透传父进程 env（既有 conversation-acceptance.mjs 的 `process.env.E2E_*` 覆盖实际从未生效），`ego-run.mjs` 落临时 JSON 传入
  - 收尾门控：`playing && emittedCount>0 && messageCount>0` 后才判收（防 t=0 断言全真误收）；终态场景等 `hasFinalResult && 断言全绿`，无终态场景（悬挂/错误收尾）等 `断言全绿 && 状态快照稳定 3s`
  - 轨归属探针每 case 校验（fiber `onSendMessage` 含 `session.send` 判 RUNTIME），选择器放宽 `[class*="mention-editor"]` + `waitForElement` 等延迟挂载
  - KNOWN-FAIL 机制：`SESSION_RESUME × runtime`（断言 4，runtime 续接不清快照 EXECUTING）标已知差异不计入退出码
- **mock server 状态机补全（`mock/conversationMock.ts`）**——E2E 暴露的后端行为缺失，非掩盖问题：
  - network-error destroy 时 `taskStatus → FAILED`：否则详情轮询恒报 EXECUTING，runtime 轨 `isConversationActive` 的 `taskExecuting` 合成分支永不释放（NETWORK_ERROR / SUB_NETWORK_ERROR 双轨红）
  - 事件回放完毕 `res.end()` 时若仍 EXECUTING 且非 `pollTerminalAfter` 场景 → `COMPLETE`：QUESTION_TYPE 等无 FINAL_RESULT 正常收尾场景的后端终态化；保留 pollTerminalAfter 场景由轮询切换（IDLE_POLL_TERMINAL 验证路径不受影响）
- **验证**：全量矩阵 62 项 = 61 通过 + 1 KNOWN-FAIL，exit 0；`test:conversation` 325 用例全绿；tsc 改动文件零新增；`/app/mock-chat` 嵌入形态 autoplay 验证通过（M0 风险表待测项闭环）
- **已知边界**：`src/models/conversationAgent.ts` 是 ConversationAgent 页的独立 fork（SSE 处理整份拷贝），不在本矩阵内；该页已有两个 runtime 接入点——R6 切换若需覆盖此 fork 线，另行立项

## M3 实施记录（2026-08-21，已落地）

- **console 观测**：页面 dev-only patch `console.error` 收集进断言快照（`consoleErrors`）；E2E 每 case 收尾断言零 `[Conv:Status]` 级 error 输出。
- **审批模式门禁（业务规则）**：审批 DockPanel 仅在会话框 ask 模式下出现。页面支持 `?agentMode=ask`（模块级写智能体模式缓存 `nuwax_agent_mode_cache`，早于 intervention hook 初始化）；`lineApi.send` 的 agentMode 与注入一致。干预类交互用例统一 ask 模式播放。
- **交互型用例**（5 用例 × 双轨，speed 放大留点击窗口，如 PERMISSION_REQUEST speed=5 → 审批等待窗 10s）：
  - `PERMISSION_REQUEST`：**快捷键「1 + Enter」**（useAcpPermissionShortcuts，window capture）——双击路径在卡片重渲染窗口会永久 pending 并堵塞 ego 串行队列（实测），键盘路径不依赖元素点击稳定性
  - `ASK_QUESTION`：点 radio 方案 A → 点「确认」按钮（Enter 在 radio 焦点下不触发卡提交，实测）
  - `INTERVENTION_STACK`：循环处理 front 卡至 dock 清空；**实测一次 Enter 可能连续提交两张权限卡**（第一张关闭瞬间第二张转 front、全局快捷键重复命中）——处理轮数与卡片数非 1:1，以 dock 清空为成功判定
  - `MESSAGE_QUEUE_HOLDING`：流式中连发 2 条 → 「待发送」面板出现 → 「清空全部」→ 面板消失
  - `OPENUI_RENDER`：断言组件渲染证据（「结果数值：42」文本 + 容器节点；DSL 的 title 走样式层不在 textContent）
  - **处理生效判定**（实测形态）：dock 签名（卡片 aria-label 集合）变化或「已提交」Tag；DockPanel 只给 front 卡渲染完整 role 结构，卡片计数不可靠
- **ego 通道健壮性**（踩坑记录）：ego-browser 的 js/click//waitForElement 无内建超时，页面导航窗口期的调用会永久 pending 且**堵塞串行队列**（后续所有调用挂起、套件僵死零输出）——全部调用统一 `withTimeout` 兜底（`pageJs`/`pause`/click 包装）；后台重定向下 cliLog 全缓冲，进度监控走 mock status 而非日志尾部
- **runtime resume-send 语义适配**（mock server）：runtime 线审批/问答回执会再开 chat 连接（resume-send），无状态 replay 会整轮重演致干预卡无限循环——mock 侧补全生产语义：
  - 干预卡事件跨连接去重（`interventionEventId`：REQUEST_PERMISSION 按 `data.executeId`，事件 status 为 FINISHED；ask/openui 按 EXECUTING+name）
  - 续连（第 2 轮 chat）只回放 FINAL_RESULT（「服务端无剩余输出直接终态」）；keep-open 场景续连直接挂起不打断悬挂任务
  - status 新增 `replaySettled`（在飞回放连接归零）：终态场景的回放完毕信号——续连只发终态时 `emittedCount` 永达不到 `scriptLength`，计数比较失效
- **🔴 runtime 轨干预/OpenUI 渲染缺口（R6 阻塞项，探针确证）**：ask 模式下 runtime 轨事件全部发出、消息投影正常，但 **干预 dock 完全不渲染**（`dockExists=false`——事件未桥接 AgentIntervention dock 数据源）、**OpenUI inline 组件不渲染**（消息投影未接 OpenUI applier）。legacy 轨全部正常。E2E 以 KNOWN-FAIL 显式跟踪（PERMISSION_REQUEST / ASK_QUESTION / INTERVENTION_STACK / OPENUI_RENDER 的 runtime 交互用例），断言型（快照层）不受影响照常跑。**R6 默认切换前必须修复**。
- **真实时长子集**（`E2E_REAL_TIMING=1`，speed=1 + 360s 超时，默认跳过）：`HEARTBEAT_REAL`（80s 空闲心跳窗验看门狗，**双轨通过**）、`LATE_CHUNK_SLOW`（FINAL_RESULT 后心跳维活 150s 送迟到分片，场景断言双轨通过）；**守卫证据用例发现真实 bug**：两轨消息列表均渲染了迟到分片——`shouldDropLateMessageChunk` 在真实时长下未生效（见风险表，KNOWN-FAIL 跟踪）
- **上传/STT 纳入 mock**：`UPLOAD_FILE_ACTION` / `AUDIO_STT_URL` 切 `conversationApiOrigin` 同源分支；mock 补 `/api/file/upload`（url/key/fileName/mimeType）与 `/api/audio/stt`（`{text}`）——multipart 正文不解析，避免打到远端测试域名
- **CI 接入注释**：`conversation-tests.yml` 尾注三步接法，待稳定后独立评估

## 风险与待办

| 项 | 风险 | 处理 |
| --- | --- | --- |
| runtime 续接不清快照 EXECUTING | SESSION_RESUME 断言 4 红 | runtime resume 投影修复（upsert 快照 loading 消息或 finalize 尾巴），另行立项；M2 起以 E2E KNOWN-FAIL 显式跟踪 |
| **runtime 干预 dock / OpenUI 不渲染** | **R6 阻塞项**：ask 模式审批卡不出、OpenUI inline 无 DOM（事件已到、消息投影正常） | runtime 线干预事件桥接 AgentIntervention dock 数据源 + OpenUI applier 接入消息投影，另行立项；E2E 以 KNOWN-FAIL 显式跟踪（4 个 runtime 交互用例） |
| **终态守卫未丢弃 154s 迟到分片** | LATE_CHUNK_SLOW 真实时长场景消息列表渲染了迟到文本（**两轨一致**，压缩版 LATE_CHUNK 断言只查 EXECUTING 残留从未验证守卫证据——M3 首次暴露） | 初步定位 `shouldDropLateMessageChunk` 的 `messageIdRefCurrent` 非空分支或 status 判定在终态后放行；终态收敛线专项修复，E2E 以 KNOWN-FAIL 跟踪（双轨守卫证据用例） |
| runtime resume-send 循环 | 审批回执再开 chat 连接，无状态 replay 整轮重演 | M3 已解：mock 干预事件跨连接去重 + 续连只发终态 + replaySettled 判收 |
| ego E2E 通道堵塞 | 单次 pending 调用堵死串行队列（套件僵死零输出） | M3 已解：全部 ego 调用 withTimeout 兜底；后台跑时用 mock status 监控进度（cliLog 全缓冲） |
| M0 编排分派 | runtime session API 与 legacy model 行为差异 | 对照 `useConversationAgentChatSession.ts` 现成用法；M0 验证覆盖 4 类代表场景 |
| M0 断言空转 | 按轨取源不彻底 → 假绿 | 验收要求终态场景先出现 EXECUTING 再收敛（非空转证明）；M2 起由 E2E `sawActive` 硬门控自动把关 |
| `/app/mock-chat` | `useOpenApp` 视口同步操作不存在 DOM | 已验证（2026-08-21）：autoplay + 断言全绿，风险关闭 |
| 真实时长 E2E | 单场景 60~154s | 环境变量门控，仅发版前跑 |
| conversationAgent fork | 独立 SSE 拷贝线不在矩阵 | 已记录为已知边界，R6 前另行评估 |
| E2E 接 CI | dev server 成本 | M2 稳定后独立评估 |

## 顺序与验收

1. **M0**（1~1.5d）：runtime 轨接入 + 编排分派 + 断言取源 + queueContext + 连接清理 → 两轨 × 4 代表场景人工验证（含断言非空转检查）
2. **M1**（1h）：侵入单点（5 处 + 精确匹配收紧）+ 文档 → `test:conversation` 全绿
3. **M2**（1~1.5d）：断言型 E2E + 收尾门控 + 单标签串行 → `e2e:mock-chat` 双轨矩阵 exit 0
4. **M3**（1d）：交互型 + 真实时长子集（心跳维活版）+ 上传/STT → 全场景自动回归闭环

每步独立可提交；M0/M1 可与当前未提交的目录迁移一并或分批入库。
