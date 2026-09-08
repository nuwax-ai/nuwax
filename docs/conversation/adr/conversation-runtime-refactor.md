# ADR：会话运行时重构（绞合式 Phase 0-7 + 双线切换）

> 📚 文档总入口：[README.md](../README.md) 日期：2026-08-16 ~ 2026-08-17 状态：**已全部完成**（Phase 0-7 + 双线 R1-R6 + 回归网 + CI；默认值切换待团队确认）关联：[conversation-dual-track-plan.md](../conversation-dual-track-plan.md)、[conversation-maintenance-guide.md](../conversation-maintenance-guide.md)、验收底稿：[conversation-business-logic-checklist.md](../conversation-business-logic-checklist.md)

## 1. 背景与动机：为什么必须重构

### 1.1 重构前的结构问题（四个，均有实例佐证）

**P1 巨石 model**：`src/models/conversationInfo.ts` 2096 行，六类职责混在一处——数据查询、SSE 连接所有权、事件归并、消息身份、taskStatus 补偿、页面/文件树/远程桌面/卡片副作用。改任何行为都要在这一个文件里穿行，无法局部理解、无法局部测试。

**P2 复制型第二实现**：`conversationAgent.ts` 1292 行是为「预览/调试隔离」复制的一份，核心逻辑高度相似但**不是同一份代码**，语义持续漂移。实例：

- suggest 过期响应防护（generation 守卫）只有 conversationAgent 有，conversationInfo 没有——快速切会话时旧建议可能覆盖新会话（[回归对齐文档](../agent-session-runtime-regression.md) §10.6）；
- onClose 兜底终态查询，conversationInfo 用 `.catch().finally()` 保护，conversationAgent 是裸 `await`——接口 reject 时等终态标志不释放（[收尾闪烁 QA 报告](../chat-terminal-polling-flash-qa-report.md) §7.1 遗留）。

**P3 同一业务事实多处推导**：「能否发送 / 能否停止 / 能否轮询 / 能否入队」在 model、UnifiedChatSession、MessageQueue、Resume Hook 各自重新实现。判定不一致就是线上缺陷——历史缺陷的共同根因：停止按钮卡死（[错误终态修复](../conversation-error-taskstatus-stuck-fix.md)：消息层已报错、会话层仍 EXECUTING）、轮询误订阅冲掉乐观消息（[轮询竞态修复](../poll-send-race-stale-snapshot-fix.md)）、队列不消费。

**P4 副作用与事件归并耦合**：事件归并代码里直接操作页面（开文件树、开远程桌面、写卡片），既不可单测，隔离入口（预览 Tab）想要子集行为只能再抄一份——P2 的复制正是这样产生的。

### 1.2 为什么「必须」而不是「可以缓缓」

1. **修复成本失控且只增不减**：一个 P2 体验缺陷（收尾闪烁）的修复是 **16 文件 +1189/-57 行**；错误终态修复必须同时动两个 model + 队列。这是结构的必然产出，不重构则每个后续缺陷都按此成本计价。
2. **漂移已在制造真实 bug**（见 P2 两例）：「修一份漏一份」是常态而非意外，且无机制能发现漏改。
3. **无验收门**：会话回归全靠人肉点页面；全库 415 个预存 tsc 错误使类型检查不可用——改动是否安全无法廉价回答。
4. **演进受阻**：五入口各自组合会话状态，新增入口/副作用只能在巨石里加分支，行为无法对齐，复杂度按入口数线性放大。

### 1.3 重构目标

**行为不变的架构重组**：巨石拆为深 Module（分层不可反转）、业务事实单一事实源（Session View/selectors）、副作用经 seam 描述（可测、可子集）、纯函数化使合同测试成为可能。量化对比：旧线单文件 2096 行；新线 domain + runtime 共 17 个模块，最大 589 行（`createConversationRuntimeSession.ts`），其余全部 ≤400 行，纯函数层全部可单测——这就是 292 条合同网能存在的前提。

## 2. 决策（两阶段）

### 2.1 目标与最高约束

最高约束（出自[双轨方案](../conversation-dual-track-plan.md)）：**已上线项目，重构全程不得影响线上业务，任何时刻可整体切换/回退。**

由此推出方案形状：不能大爆炸重写（不可回退）、不能直接改旧线（影响线上）→ 只能「新线完整并行 + 运行时开关整体切换」。

### 2.2 阶段一：绞合式迁移（Phase 0-7，分支 refactor/conversation-runtime）

1. **深 Module 分层**（domain / runtime / adapters / react），依赖方向不可反转：页面 → react 层 → runtime → domain。
2. **Runtime 实例制**：`createConversationRuntime` 每 model 一个实例，拥有跨 chunk 输出身份、live/sub 连接所有权（runId 隔离）、effects 分发器。
3. **Effects Seam + 分片 shadow→live**：副作用以 `ConversationEffect` 描述、入口注入 Adapter；shadow 模式只记 journal 不执行，可分片放量。所有副作用走 effect 通道。
4. **入口零组合**：五入口经 `createConversationSessionModel` / `ConversationSessionProvider`，组件不自行组合状态。
5. **不迁移决策**：perf 埋点与流式滚动属连接编排层时序遥测，不进 Effects Seam。

### 2.3 阶段一的教训 → 阶段二的由来

阶段一完成后发现结构性问题：**旧直调已删、无法运行时切回**——只能整体上新实现，不满足「任何时刻可回退」的最高约束。阶段二因此改为两条完整独立的线。

### 2.4 阶段二：双线切换（R1-R6，分支 refactor/conversation-dual-track，基于基线 c710ab296）

- **旧线（legacy，默认）**：基线原版 model，零改动；
- **新线（runtime）**：`createConversationRuntimeSession` 拥有 message state（store）、连接编排（transport）、恢复/轮询编排、副作用分发，经 `useConversationRuntimeSession` 绑定层产出与旧线同形状的 conversationProps；
- **flag**：URL `?conversationRuntime=1` > localStorage > 默认 legacy（`CONVERSATION_RUNTIME_DEFAULT = false`）——运行时整体切换/回退，无需发版；切默认 = 改一行常量。

## 3. 实施过程

### 3.1 双线 R1-R6 切片（每片独立可验证后进入下一片）

| 片 | 内容 |
| --- | --- |
| R1 | messageStore + transport + 合同测试（先有测试再有集成） |
| R2 | session send 核心环（乐观 → SSE → 投影 → effects → 收尾） |
| R3 | load / applySnapshot / stop / resume / 事件分支 effects |
| R4 | flag + 绑定层 + Chat 入口接线（首个入口打通） |
| R5 | 其余四入口 + 双轨 parity 测试 |
| R6 | 已知差异收口（suggest/topic/taskStatus/冲突确认/isSync/loadMore/干预/置底/参数面）+ props 覆盖顺序修正 + 浏览器验证 |

五入口：Chat、ConversationAgent 预览 Tab（`useConversationAgentChatSession`）、AgentConversationChatPanel、EditAgent PreviewAndDebug、Plugin（`PluginChatSession`）——均为 `...(runtimeLine?.conversationProps ?? {})` 置于 props **末尾**（flag off 时空对象，旧线原行为）。

### 3.2 工程保障（怎么保证改不坏）

- **旧线零改动门**：`git diff c710ab296 --name-only -- src/models/ | wc -l` 结果为 0——旧线与线上基线逐字节一致。
- **shadow → live 分片放量**：effect 通道支持只记不执行，副作用逐类切换到真实执行。
- **入口逐个接线**：R4 先 Chat，验证模式成立后 R5 扩到其余四入口。
- **双网验证**：合同网（33 文件 292 条，秒级，每次改动必跑）+ 页面 E2E（8 场景，含 fiber 探针判定线归属、流后归属不漂移）；CI（`.github/workflows/conversation-tests.yml`）在触及会话路径时自动跑合同网，失败阻断合入。
- **双轨 parity**：同一事件 Trace 驱动两线，消息 digest 必须一致（`tests/conversationDualTrackParity.test.ts`）。

## 4. 风险与应对

| # | 风险 | 应对 | 现状 |
| --- | --- | --- | --- |
| 1 | 重构影响线上业务（最高约束） | 双线并存、默认 legacy；旧线零改动并以 diff 门验证；flag 单行常量整体回退；新线全为新文件可整目录回滚 | 默认仍 legacy，切默认待团队确认 |
| 2 | 新线与旧线行为不一致 | 同 Trace parity digest + 292 合同 + 8 E2E + CI 守门 | ⚠️ 已知缺口：新线缺 `desktop.open` / `preview.file.refresh` / `taskResult.settle` 分发点（清单 L6），**切默认前必须定性**（补接线或记为已知差异） |
| 3 | 阶段一式「删旧直调」不可运行时回退（过程风险） | 阶段二基于基线重建为完整双线 + 三级 flag | 已解决 |
| 4 | 并存期修 bug 双份维护、再次漂移 | 共享纯件（domain / resumeController / messageStore）一处修两线受益；两 model 已知差异清单见回归对齐文档 §10.2；终态路线：拆 model 非会话职责 → 删旧线（见 §5） | 并存中，风险长期存在直至删旧线 |
| 5 | props 覆盖顺序错误致线归属漂移（已踩坑） | conversationProps 强制放 props 末尾，固化进维护指南 §3.2；E2E-03/08 断言流后线归属不变 | 已固化 |
| 6 | 测试网盲区 | 合同网是路径子串过滤（大小写敏感），个别文件不在网内；合同钉住的 resume hook 副本与生产引用版本不同——两条事实已写入验收清单 §1，改相关文件须手动补跑 | 遗留监控项，随删旧线一并清理 |
| 7 | 全库 415 个预存 tsc 错误掩盖类型回归 | 验收门 = vitest 合同网而非 `tsc --noEmit`；标准为「改动路径零新增」 | 长期遗留（与本次重构无关） |
| 8 | E2E 依赖登录态与特定会话，无法进 CI | CI 只放合同网；E2E 本地/合入前人工跑；固定可靠会话（女娲 3994、TaskAgent 1596、预览 `/space/57/agent/3994`；TaskAgent 4042 编辑器 E2E 不生效属工具限制） | 按约定执行 |

## 5. 后果

- 正面：两线可整体切换（flag）、可代码回滚（新线全为新文件）；292 条合同网 + 8 场景 E2E 回归保障；CI 自动守门；巨石拆为 17 个可测模块（§1.3）。
- 代价：双线并存（默认切 runtime 后删除旧线）；双线维护（共享纯件，编排壳双份）。
- 终态待办：切默认（两网全绿 + L6 定性 + 五入口验证 + 团队确认）→ 观察期 → 拆分 model 非会话职责（文件树/VNC/变量）→ 删旧线。

## 6. 验证基线（截至 2026-08-17）

- `npm run test:conversation`：33 文件 292 条，全绿
- `npm run e2e:conversation`：8 场景，全绿（需 dev server + ego-browser 登录态）
- 全库 TypeScript 错误 415（预存基线，改动路径零新增）
- CI：`.github/workflows/conversation-tests.yml` 自动跑合同网

## 变更记录

- 2026-08-17：首版（决策骨架 + 验证基线）；同日补充 §1 背景/必要性、§3 实施过程、§4 风险与应对（证据来自验收清单梳理与三份专项修复/QA 文档）。
