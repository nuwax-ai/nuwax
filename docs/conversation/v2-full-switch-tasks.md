# 「全切换到 V2」开发任务清单

> **目标**：会话域功能层面全切换到 V2（runtime 数据线 + V2 渲染器），所有会话入口走 V2，双线已知差异清零；V1 代码阶段一保留冻结（`?conversationRuntime=0` 紧急回退保留），代码退役放阶段二（稳定 1-2 个版本后启动）。
>
> 姊妹文档：[conversation-v1-v2-alignment-2026-09.md](./conversation-v1-v2-alignment-2026-09.md)（V1×V2 横向对比与对齐状态快照）。本文只列**还没做的事**。
>
> 建档：2026-09-19。状态取值：`➖ 待办` / `🔄 进行中` / `✅ 完成(日期)` / `⛔ 阻塞(原因)`。

**硬约束**：会话路径改动（`models/conversation*`、`features/conversation/**`、`UnifiedChatSession`、`MessageQueue`、`AgentIntervention`、`pages/Chat`）每任务收口必跑 `npm run test:conversation` 全绿；合入前过 E2E（AGENTS.md 质量门）。

---

## 阶段一：功能全切换（本轮主体，估 5-8 人日，P1 各项可并行）

### P0 在途收口（先落地已实现的，再开新工）

| ID | 任务 | 证据锚点 | 依赖 | 工作量 | 验收门 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| T0.1 | 文件树三连回归 + V2 OpenUI 挂载两批走查收口 → 提交推送（27 文件 + 1 删） | 6 条走查清单见 [对齐清单 §四](./conversation-v1-v2-alignment-2026-09.md)；分支 behind 1 先收远端再推。**OpenUI 部分 09-19 已确认搞定**（实现会话 sess_16e2533c，E2E 16/16+testagent 真实会话走查过）——剩余走查仅文件树 6 条 | 无 | 0.5-1 天 | 走查 6 条全过 + test:conversation 815 绿 + 提交推送 | 🔄 OpenUI 部分闭环；剩文件树走查 |
| T0.2 | 过程叙述折叠方案 A：demo 走查 → 过审 → 源码实现 | `/examples/trace-structure-demo`（3 文件未提交）；🔴 过审才动源码（用户定调） | demo 走查 | 1-2 天 | 走查过 + 实现后 test:conversation 全绿 + V1 渲染线不回归 | ➖ |
| T0.3 | 已提交 2 笔（`b9016c651` sandboxId、`3c3c4a624` 参与者自选沙箱）推送跟进 | `git status -sb` ahead 2 / behind 1 | T0.1 同窗口处理 | 0.25 天 | push 成功无冲突 | ➖ |

### P1 V2 缺口修复（每项独立，可并行）

| ID | 任务 | 证据锚点 | 依赖 | 工作量 | 验收门 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| T1.1 | **EditAgent 预览调试 runtime 线补 `isSync:false`**：V2 下发送会发乐观标记/更新主题，破坏隔离入口语义（疑似线上 bug）。旧线 `:508` 有传、runtime 线 `:636-653` 漏传 | `src/pages/EditAgent/PreviewAndDebug/index.tsx:636-653`（漏）vs `:508`（旧线有）；isSync 语义落点 `createConversationRuntimeSession.ts:442-443,534,594`；顺带 MockChat runtime 线同款（`src/examples/MockChat/index.tsx:200-207`） | 无 | 0.5 天 | 单测补 isSync 断言 + test:conversation 全绿 + 预览调试页发送后侧栏无执行中标记 | 🔄 代码完成（09-19）：EditAgent+MockChat 两处已补；session 层契约已有锚（conversationRuntimeSession.test.ts「isSync=false：不发乐观执行中标记」），hook 透传为 5 行直白代码且无 hook 测试基建，不单建测试；tsc 触达零新增（MockChat L566/L716 两错为并行 WIP 存量）；浏览器走查归 P3.1 矩阵 |
| T1.2 | **SESSION_RESUME 断言 4**：runtime 续接不清快照 EXECUTING | **已修（09-19）**：两层根因 ① 终态后轮询快照滞后 EXECUTING 被 reconcile 稳定 ID 覆盖盖回 → session 新增终态记忆 `settledTerminalStatus`，`applySnapshot` 归并后按终态重收敛（send/reset 清空；对齐旧线 finalizer sweep 语义）②mock 页同会话 id 重放时 hook conversationInfo 终态残留+`mergeConversationInfoTaskStatus` 终态守卫吞新场景 EXECUTING → hook 新增 `resetAndReloadConversation`（MockChat prepare 改用） | 无 | 实际 0.5 天 | 回归锚 `tests/conversation/sessionSnapshotTerminalGuard.test.ts` 2 用例 + 合同网 813 绿 + E2E SESSION_RESUME 4/4 真断言绿（KNOWN-FAIL 条目已删） | ✅ 完成（09-19；dev 走查并入 P3.1） |
| T1.3 | **迟到分片守卫**：`shouldDropLateMessageChunk` 真实时长下未生效（154s 迟到分片两轨都渲染） | LATE_CHUNK_SLOW KNOWN-FAIL（两轨一致，非双线差异）；守卫实现在 `models/conversationInfoMessageList.ts`（双线共用，修一处两轨受益）；初判 messageIdRef 非空分支或 status 判定在终态后放行 | 无 | 1-2 天 | 真实时长守卫证据用例（`E2E_REAL_TIMING=1`）转绿 + 删 KNOWN-FAIL + 守卫单测 | ➖ |
| T1.4 | **B11 延迟 Ask 表单补偿**：仅旧线有（FINAL_RESULT 后 250/750/1500ms 静默补读），runtime 线无对应逻辑 | 旧线实现 `models/conversationInfo.ts`；业务逻辑清单 B11；**先向后端确认慢落库是否已根治** → 已根治则判废弃关闭差异，未根治则移植到 runtime session | 后端答复 | 0.5-1 天（确认）/ +1 天（移植） | 确认结论记录进对齐清单；移植则补双线断言 | ➖ |

### P2 入口数据线全覆盖

| ID | 任务 | 证据锚点 | 依赖 | 工作量 | 验收门 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| T2.1 | **【点名必做】AppDevPro 面板接入 runtime 线**——全仓唯一未接 UnifiedChatSession 的会话入口 | `src/pages/AppDevPro/AgentConversationChatPanel/index.tsx`（原只有 `useModel('conversationInfo')`）。已落：① 挂 `useConversationRuntimeSession`（`getSandboxId: () => selectedComputerId \|\| undefined`）+ props 末尾展开覆盖旧线回调；②**isSync 保持默认 true**（AppDevPro 是真实开发入口，A3 语义=发送 → 侧栏标执行中；与 EditAgent 预览调试 false 区分）；③ 结束沿改 effectiveIsActive（V2 生效值优先，V1 回落 model 值） | T0.1 先落地（同文件域并行冲突小，但走查基线要先稳） | 1 天 | test:conversation 全绿 + AppDevPro 面板 dev 走查（发送/流式/停止/侧栏执行中同步） | 🔄 代码完成（09-19）：新增 index.test.tsx 5 用例全绿（双线分派/结束沿/沙箱透传；单独跑不在合同网过滤器内）；合同网 808 绿（parity 崩=存量环境）；dev 走查归 P3.1 矩阵 |
| T2.2 | ConversationAgent 面板 runtimeLine 补 `getSandboxId`（接线时新发现的既有缺口） | `src/pages/ConversationAgent/AgentConversationChatPanel/index.tsx:137-143` 原 runtimeLine 未传 getSandboxId → V2 下该面板发送 sandboxId 恒 undefined（旧线传 selectedComputerId）。修法一行：`getSandboxId: () => selectedComputerId \|\| undefined`（AppDevPro 同款已落） | 无 | 0.25 天 | 发送请求体带选中电脑 + 合同网绿 | 🔄 代码完成（09-19）：一行已补；面板测试 9/9 + 合同网 808 绿 + tsc 零新增；dev 走查归 P3.1 |
| T1.5 | v1 终端卡展开断链（TERMINAL_OUTPUT，两轨一致的既有失败——2026-09-19 全量复测暴露，并行会话登记） | 症状：终端卡标题/exit 徽标正常但 `terminalItem.content` 为空 → 展开按钮不渲染、点击标题落文件树兜底；断链在数据链（PROCESSING → processingList detail 形态），MarkdownCustomProcess 自 9 月初零提交 | 无 | 0.5-1 天（排查） | 终端卡展开恢复 + TERMINAL_OUTPUT 两条 KNOWN-FAIL 删除复测 | ➖ 新增（09-19 登记；E2E KNOWN-FAIL 跟踪中） |
| — | ChatTemp（`/chat-temp/:chatKey`，旧线+直渲染 ChatView）**暂不动**（2026-09-19 拍板排除，后续单独处理） | `src/pages/ChatTemp/index.tsx:83,891` | — | — | — | ⛔ 排除 |

### P3 阶段一验收判定

| ID | 任务 | 内容 | 验收门 |
| --- | --- | --- | --- |
| T3.1 | 全入口 V2 走查矩阵 | 五入口（Chat / ConversationAgent 会话面板+预览 Tab / EditAgent 预览调试 / 插件 / AppDevPro）× 七链路（发送/流式/停止/续接/文件树/干预/OpenUI） | 矩阵全过，问题归零或立单 |
| T3.2 | E2E 收口 | `npm run e2e:mock-chat` 双线矩阵 KNOWN-FAIL 清零（仅剩两轨一致且已立单项）；`e2e:conversation` 8 场景 | 全绿 |
| T3.3 | 阶段一完成判定 | 缺口全清（P1）+ 入口全接（P2）+ 走查全过（P3.1/3.2）→ **功能层面全切换达成**；启动阶段二稳定期计时 | 对齐清单状态列同步 |

---

## 阶段二：代码退役（稳定 1-2 个版本后启动；本节只列预告+依赖链，不排期）

> 启动前提：T3.3 达成 + 线上无 V2 回退诉求。🔴 阶段一期间 V1 保持冻结共存，不提前拆。

| ID | 任务 | 内容与证据锚点 | 依赖 | 风险备注 |
| --- | --- | --- | --- | --- |
| T4.1 | **前提工程：legacy model 职责迁移** | `useModel('conversationInfo')` 的 7+ 组件消费点把预览/文件树/干预队列状态从 model 迁出（独立 store 或 props 注入）：MarkdownCustomProcess:160、TaskResult:30、ChatBottomDebug:20、AgentSidebar:28、useAgentInterventionLayer:361、useUnifiedChatQueue:76、UnifiedChatSession:363（V2 sidecar 也用旧 model 的 openPreviewView）、ConversationProgressCapsule:261 | T2.1（所有入口走 V2 后才有意义） | 🔴 最大风险项：model 是页面共享状态容器不止 SSE；runtime 线目前只桥接 processing 列表（useConversationRuntimeSession:307-315） |
| T4.2 | legacy SSE 块删除 | `models/conversationInfo.ts`（2306 行）的 handleChangeMessageList（:1145-1655，~510 行）/ handleConversation（:1656-1953，~300 行）/ onMessageSend（:2048-2164）；+ `models/conversationAgent.ts` 预览 Tab 旧线副本全套 | T4.1 | `conversationInfoMessageList.ts`（628 行）双线共用勿删 |
| T4.3 | 测试资产处置 | 4 个纯 V1 测试退役/迁移（conversationInfoModel 33 + useResumeStreamHandlers 19 + useConversationStreamResume 17 + fetchEventSourceConversationInfo 6 ≈ 75 用例）；conversationDualTrackParity 改写（V1 基准消失后转 V2 快照锚）；conversation-acceptance.mjs 的 E2E-02/05/06 改写；mock-chat legacy 半矩阵与 KNOWN_ISSUES legacy 条目收缩 | T4.2 | 🔴 tests/useConversationStreamResume.test.ts 经 `tests/useConversation` 子串过滤**在合同网内**，删码须同步处置测试 |
| T4.4 | 双副本清理 | 组件目录版 `UnifiedChatSession/hooks/useConversationStreamResume.ts`（757 行，零生产引用）+ 其测试（726 行）；useResumeStreamHandlers（届时生产调用方只剩 legacy model） | T4.2 | 同上网内子串匹配机制 |
| T4.5 | 死代码清理 | `apiGetStaticFileDetail`（services/vncDesktop.ts:94，零调用）；`previewEffectsAdapter.ts`（生产零引用仅测试用）；V1-only 渲染组件 MarkdownCustomThink/MarkdownCustomProcessGroup/MarkdownCustomPlanDoc（~478 行） | T4.2 | 🔴 ChatView/MarkdownRenderer/MarkdownCustomProcess 被 V2 复用且是 V2 异常回退路径，**禁删** |
| T4.6 | 开关退役 | conversationRuntimeFlag / conversationRendererPreference 的 URL 回退 / MockChat 调试开关 / conversationV2Rollout 迁移标记 | T4.1-T4.5 全清 | 紧急回退 `?conversationRuntime=0` 保留至本项执行时才拆 |

---

## 风险与备注

1. **conversationDualTrackParity 的 esbuild/TextEncoder 崩溃是存量环境问题**（HEAD worktree 对照同崩，非回归）——验收时勿误判为任务引入。
2. **回退开关是发布保险**：阶段一保留 `?conversationRuntime=0` / `?conversationRenderer=v1`；输入区调试面板和用户级 renderer 设置已于 2026-09-24 移除，URL 渲染回退仍保留至 T4.6。
3. **V1 渲染器是 V2 的回退路径**：投影/渲染异常整份回退 V1 是设计保险（ConversationRendererV2 双保险），任何「删 V1」动作前必须确认回退路径改走何处。
4. **阶段二最大工程不是删 SSE，是 model 职责迁移**（T4.1）——预估占阶段二一半以上工作量。
5. 本清单任务状态变化时同步更新 [对齐清单](./conversation-v1-v2-alignment-2026-09.md) 对应状态列，两文档互为视图（清单=待办，对齐=现状）。

## 相关文档

- [conversation-v1-v2-alignment-2026-09.md](./conversation-v1-v2-alignment-2026-09.md) —— V1×V2 横向对比与近期对齐快照
- [dual-track/conversation-business-logic-checklist.md](./dual-track/conversation-business-logic-checklist.md) —— 业务逻辑验收底稿（A-D 域 ID）
- [mock-optimization-plan.md](./mock-optimization-plan.md) —— E2E 已知差异跟踪（KNOWN-FAIL 清单）
- [README.md](./README.md) —— 会话域总入口
