# 「消息运行完毕但会话框按钮一直会话中」分析文档

> 状态：**已定案——终态后状态残留属实，触发源为连接级 onerror 全量收尾（§0.3 调用栈定案）**（2026-08-19）。用户反馈：会话输出正常结束、RunOver 显示「运行完毕」，但会话框按钮（会话中/停止）不结束；出现在第 N 轮长任务。前置：终态统一收敛修复已上线生产（`da11719f1`/`12a161bd4`/`cf5adca1a` 及 dual-track 对应 commit）。

---

## 0. 当前结论（2026-08-19 二次修订）

HAR 全量数据事实：

1. 该轮 chat 流**完全有序**——HAR body（单行存储，8832 事件）中 FINAL_RESULT 是第 8832/8832 条即最后一条，其后无任何事件；首条分片「我来」在流开始时刻（11:01:21.455）正常到达
2. 全量 HAR（10:59:19–11:07:59）**无任何 `/chat/sub` 请求**——sub 双流假设在本案不成立
3. 流中曾发生 `taskStatus COMPLETE→FAILED` 转变（console，栈含队列消费签名 `ur @ 6712` / `ne @ p__Chat`）——但 chat body 中**无 ERROR 事件**，该转变的**载体不明**（待定嫌疑）
4. 终态后症状真实且未变：详情轮询 4 分钟零请求（轮询门卡死）+ 按钮停留「会话中」+ 页面存活——共同指向 `isConversationActive` 卡 true（被 `isSessionStreamBusy` 的残留顶住）
5. 未解释异常：console 中 `authWithLoading: 863781ms`（鉴权包裹请求 loading 持续 14 分钟）

**定性：终态后"有东西把消息/活跃态打回且无人再清"的框架成立，但触发载体未定。**

**已落代码（保留，重新定性为防御加固而非根因修复）：** 终态守卫 `shouldDropLateMessageChunk`（`aedb332a8` + 精化 `561025ac7` + 收敛 `88520e591`）——"已终态消息不接受分片状态回退"作为不变式独立成立、无害，无论回退分片来自哪条通道都拦截。

**定案路径（下一步）：** 本地 dev 构建（未压缩 + 全量日志）受控复现同一场景（第一轮流式中入队第二条 → 队列自动消费 → 抓流中 FAILED 转变的真实来源与终态后残留的确切字段）。

### 0.1 守卫精化（review 中发现的多步轮误伤，已随 `561025ac7` 落码）

当前守卫条件"消息已终态即丢弃"会**误伤多步输出轮次**（工作流/多消息型 agent）：轮内某步的 `finished=true` 分片会把消息置 Complete，随后下一步的分片会被守卫丢弃、**内容丢失**——而"Complete → 下一分片拉回 Incomplete"对多步轮是原有设计行为。

**精化方案（一行条件）**：利用 FINAL_RESULT 分支会重置 `messageIdRef.current = ''` 的既有信号，改为：

```ts
// 仅当「消息已终态 && 本轮终态已处理（messageIdRef 已被 FINAL_RESULT 清空）」才丢弃
if (isCurrentMessageTerminal && !messageIdRef.current) { ...整条丢弃... }
```

| 场景 | status | messageIdRef | 结果 |
| --- | --- | --- | --- |
| 终态后迟到分片 | 终态 | `''` | 丢弃 ✓ |
| 多步轮中间步边界 | Complete | 非空（当前步 id） | 放行，工作流插新消息逻辑照跑 ✓ |
| 轮初 THINK（id=null） | Loading | `''` | 不触发（status 非终态）✓ |

**后端关联待查**：连接级 onerror 的物理触发源（onerror 后流仍存活 153 秒的矛盾，§0.3）——若复现确认为后端连接异常引起，再立工单。

### 0.2 完整调用时间线（会话 1678724，证据归档）

时间统一为北京时间（HAR 记录为 UTC，+8 对齐）。证据来源：HAR（`agent.nuwax.com.har`）、console（保留日志）、两条 request call stack、SSE EventStream 导出。

| 时刻 | 事件 | 证据来源 |
| --- | --- | --- |
| 10:59:22–11:01:18 | 详情轮询每 5s 一条（`POST /conversation/1678724`，返回 COMPLETE），空闲态正常轮询 | HAR ×24 条 |
| 10:59 前某时刻 | 用户在第一轮流式期间输入第二条消息 → **入队**（会话忙，发送被拦截） | 推断（队列消费反证） |
| 11:01:18.665 | 最后一条轮询；第一轮已完成（sub 已随 FINAL_RESULT 重放关闭，`[Poll] resume COMPLETE`） | HAR + console |
| 11:01:21.455 | **`POST /chat` 发起（第二轮，非手动点击）**——队列消费边沿触发：SSE 事件处理 → setState → 重渲染 → Chat 页（`ne @ p__Chat`）→ 队列消费（`ur @ 6712`）→ 发送 | call stack（chat 请求 initiator） |
| 11:01:21 起 | 该流共 153.7 秒（满江红 PPT 任务）；期间 `file-list` 随工具调用持续刷新 | HAR time=153662ms |
| 11:01:2x（流中） | **流中收到 ERROR 事件** → sweep(FAILED)：消息置 Error、taskStatus=FAILED、活跃态/awaiting 清空 → **轮询门意外打开** | console：`applyTerminalTaskStatus COMPLETE→FAILED`（onMessage 栈） |
| 11:02:32.367 | **详情请求（轮询 interval 触发，流进行中）**——ERROR 清门后 ahooks ready 翻 true 轮询中途重启；返回 EXECUTING + user 尾，被「user-tail 未持久化」守卫丢弃（无害） | call stack（`fn.pollingInterval @ 6712`）+ HAR |
| 11:02:3x | 后续 MESSAGE 分片把消息从 Error 拉回 Incomplete → busy 复活 → active 顶回 true → 轮询门再关 | console：「local send started」pollGeneration 3 且 **无第三次 POST**（假发送=活跃态重算） |
| ~11:03:54–55 | **FINAL_RESULT 到达**（success=true, completed=true）→ 消息 Complete + taskStatus=COMPLETE（console `FAILED→COMPLETE`） | console + SSE 导出 |
| 11:03:55.117 | 连接结束（153.7s 走完） | HAR time |
| 11:03:55.125 | FINAL_RESULT 到达（流内最后一个事件） | HAR body 事件序（8832 条） |
| 11:03:55.133 | `conversation/list` 刷新（onClose 触发 RefreshConversationList） | HAR |
| 11:03:55 之后 | ★ **详情轮询再未恢复**（HAR 覆盖至 11:07:59，4 分钟零请求）→ `isPollingReady` 卡死；按钮停留「会话中」；页面其余功能存活（notify/credit 每 5s 正常） | HAR + 用户观察 |

关键推论：**按钮卡会话中 + 轮询门卡死 + 页面存活**三者并存的唯一公共变量是 `isConversationActive` 卡 true（既直接撑按钮，又经 `isLocallyStreaming` 挡死轮询），而它被谁顶着——`isSessionStreamBusy(messageList)` 的残留（末条状态回退或近 5 条 processingList 残留，具体字段待受控复现确认）。

### 0.3 「门打开瞬间」的代码映射（19:02:32.3x，流开始后第 70.9 秒）

发起时间反向定位：轮询请求发出时刻 19:02:32.367 = `startedDateTime`（HAR entry[75]，文件第 127746 行）；ahooks 的 `ready` 翻 true 是**立即自动执行**（不等 5s interval），故上游触发（流中状态清空）≈ 同一瞬间。chat 响应头 `date: 11:01:22 GMT` 是流打开时刻，与终态无关。

完整调用链（**执行者 = 连接级 onerror 全量收尾路径**，由 1678724 console 的 FAILED 转变调用栈逐帧定案）：

```
console FAILED 转变的调用栈（自底向上）：
  React 提交 → 队列消费发送链（ur/na/oa @ 6712、ne @ p__Chat）
  → onMessageSend（umi:66）
  → createSSEConnection（umi:124）
  → fetch-event-source 内部 await 抛异常（await in D @ umi:61）
  → fetch-event-source 的 onerror 回调（umi:124）
  → safeOnError（te @ 124）
  → model onError 全量路径（umi:66）：
       ① toast 网络错误
       ② setIsAwaitingChatTerminal(false)                        ← 门条件①
       ③ 末条消息置 Error + processing→FAILED
       ④ applyTerminalTaskStatus(FAILED)                          ← console COMPLETE→FAILED 来源
       ⑤ emitConversationListTaskStatus（eventBus 分发，Ym.835643.F.forEach @ 209）
       ⑥ lastSendAtRef=0; setIsConversationActive(false)          ← 门条件② isLocallyStreaming
  → isPollingReady 两条件均已清除（useConversationStreamResume:461）→ 门全开
  → ready 翻 true → 立即自动执行 → 19:02:32.367 轮询发出（+45ms 返回 EXECUTING，被守卫丢弃）
随后 MESSAGE 分片继续到达 → 消息从 Error 拉回 Incomplete → isSessionStreamBusy 复活
→ checkConversationActive 重算 → active 顶回 true → 门再关（console "假发送" gen3，无第三次 POST）
```

**与"ERROR 型事件"的区分（重要）**：HAR body 8832 事件中零 ERROR——触发源不是 SSE 事件，是 **fetch-event-source 的连接错误回调**。触发路径详见图上方调用链。

**待解矛盾（受控复现目标）**：onerror 的 handler 会执行 `controller.abort()` 杀掉连接，而 HAR 显示该流活满 153 秒且 body 完整——**一次 onerror 之后流为什么还活着**。复现目标：队列自动消费场景下观察 onerror 触发与流存活的时序关系；候选解释含 fetch-event-source 重连语义（isAborted 守卫 return 不 throw → 自动重试）等，需一手数据裁决。

轮询双防线自检（本案均按设计工作）：请求级 `isPollingReady` 门控 + 发送时主动 cancel；响应级四重丢弃守卫（本地流式 / user 尾未落库 / 会话切换 / 代际过期）——19:02:32 的响应被守卫丢弃、零副作用。问题不在轮询，在门被异常打开。

### 0.4 线上验证记录（2026-08-19，会话 1678770）

部署版本鉴定（`umi.671ccdf5.js` 指纹）：`1.1.18` ✓ / `finalize terminal` ✓ / `finalize streaming placeholder` ✓ / 该日志载荷 `outcome` 字段（cf5adca1a 专属）✓ / `drop late MESSAGE chunk`（终态守卫）✗ 未上线——**线上 = `cf5adca1a` 精确一致**。

运行时验证：新会话第一发即遇 `ERR_NETWORK_CHANGED`，console 栈中出现 `onStreamError @ umi:66`（cf5adca1a 的接线，旧包不可能存在）→ `applyTerminalTaskStatus noop {unchanged}`（幂等符合设计）→ 轮询恢复 → 重挂 sub。**cf5adca1a 的 sub 网络错误统一收敛在线上生效**；错误恢复循环完整工作。

---

## 1. 两层状态的分离（为什么会出现这种"半收敛"）

| 层 | 驱动信号 | 本次现象 |
| --- | --- | --- |
| **消息层**（RunOver 组件） | 消息 `status`：`MESSAGE finished=true` 单独即可置 Complete | ✅ 显示「运行完毕」 |
| **会话层**（输入框按钮） | `isSessionActive = isConversationActive \|\| isSessionStreamBusy(messageList) \|\| taskStatus===EXECUTING` 三要素 | ❌ 一直「会话中」 |

RunOver 显示运行完毕**不能证明 FINAL_RESULT 到达**——取证易错点。

---

## 2. SSE 流实据（HAR body，entry[51]，`POST /api/agent/conversation/chat`）

以 HAR 为唯一事实依据（body 单行存储于文件第 70549 行，共 8832 个事件全部可解析）：

| 检查项 | 结果 | 推论 |
| --- | --- | --- |
| 事件分布 | MESSAGE 8734 / HEART_BEAT 15 / PROCESSING 82 / **FINAL_RESULT 1（第 8832/8832，流的最末）** | 事件序正确 |
| 首分片位置 | 独立「我来」分片 = **第 1/8832 个事件**（finished=false），流开始即达 | 流内无乱序 |
| FINAL_RESULT 载荷 | `success: true`、`completed: true`、`error: null` | **M1 排除**：`resolveTerminalTaskStatus` 必返回 COMPLETE |
| 终态后杂散事件 | 无 | **M2 chat 流变体排除** |
| 终态是否送达 | 送达且在流末（19:03:55.125，与流结束 19:03:55.117 吻合） | **M3 排除** |
| PROCESSING 残留 | 22 个去重项**全部 FINISHED**（HAR body 直验），无 EXECUTING 残留 | 本轮内 processing 残留排除 |
| 心跳 | 15 条全在执行期，终态后无（后端 flux 完成即停） | 后端侧本轮流生命周期正常 |
| 响应头 | `date: 11:01:22 GMT` = 流打开时刻（非终态时刻） | 头时间是流开始旁证 |

## **核心矛盾：这条流在线上版本（cf5adca1a，含终态清算）上必然收敛——FINAL_RESULT(success=true) → sweep 全清。HAR 证明流本身无懈可击，卡死不在流内，而在 §0.3 定性的「流中状态被异常清空」及其终态后残留。**

## 3. 假设空间的当前状态（HAR-only 复核后）

| 假设 | 状态 | HAR 依据 |
| --- | --- | --- |
| Z：现场构建不含修复 | **已排除**（线上 = cf5adca1a，§0.4 指纹鉴定） | bundle 指纹 |
| M1：FINAL_RESULT 解析不出终态 | **排除** | §2：success=true |
| M2-chat：chat 流迟到分片回退 | **排除** | §2：FINAL_RESULT 后零事件、首分片第 1 位 |
| M2-sub：并行 sub 流投递回退 | **排除（本案）** | 全量 HAR 零 `/chat/sub` 请求 |
| M3：终态未送达 | **排除** | §2：FINAL_RESULT 在流末到达 |
| M4：终态后快照落库回打 | **不成立（本案）** | 终态后详情轮询零请求——M4 的前提（轮询在跑）不存在 |
| **M5（现行，栈帧定案）：连接级 onerror 在流存活期间执行全量收尾** | **执行路径已定案（§0.3），物理触发待受控复现** | FAILED 转变调用栈：fetch-event-source onerror → model onError 全量（清 awaiting/active + 写 FAILED）→ 门开 → 19:02:32.367 轮询 |

## 4. 取证记录（均已完成）

| # | 取证项 | 结果 |
| --- | --- | --- |
| 1 | 会话详情接口响应（后端落库终态） | HAR 内 25 条：空闲期全 COMPLETE、流中一条 EXECUTING——后端侧正常 |
| 2 | 并行 `/chat/sub` | 全量 HAR 零条——双流假设排除 |
| 3 | 现场构建版本 | bundle 指纹 = cf5adca1a 精确一致（§0.4） |
| 4 | 轮次特征 | 第二轮（队列自动消费发起）、153.7s 长任务 |
| 5 | 请求发起链 | chat POST = 队列消费（call stack）；19:02:32 详情 = 轮询 interval（call stack） |

**已收敛的判定**：流干净（§2）→ 卡死在流外（§0.3 的流中清门 + 终态后残留）→ 前端状态机问题，与后端无关（后端唯一可能关联 = 若复现确认 onerror 由后端连接异常引起，再立工单）。

## 5. 取证能力漏洞（本次发现）

`logger.ts:26` 的 `isLogEnabled`：**生产构建直接返回 false**，localStorage 只能关不能开。因此：

- 之前"console 搜 `[ConversationTerminalSweep]`"的判别法**在生产包上无效**（本文档初版有误，已修正）
- 含修复构建与旧包在生产环境**没有任何可区分的运行时标记**

**待拍板（方案 A）**：给 sweep 的收敛日志换成 always-on（每轮会话仅 1 条，无噪音）。它是这类问题唯一的生产侧取证手段——没有它，每次现场反馈都只能隔空推演。落完后本节更新为"已具备"。

---

## 6. 修复方案详述与影响分析（commit `452094f28` = A、`f0d7068cf` = B）

### 6.1 ERROR 恢复与 FINAL_RESULT 同权完整清算（`cb91f4418`）

**协议依据**：ERROR 与 FINAL_RESULT 同为轮次终止态——后端出错时 `sessionPromptEnd(error)` → `sink.error` → ERROR 事件 + 流必然关闭。到达即完整清算（FAILED + 全清 + 末条 Error），无延迟。

**本案的真正修复对象（待复现确认后设计）**：连接级 onError 路径——1678724 中它在流存活期间执行了全量收尾（含写 FAILED + 清状态 → 门开）。待解矛盾：onerror 后 handler 自己 `controller.abort()` 应杀连接，而该流活满 153 秒且 body 完整。受控复现目标：队列自动消费场景下观察 onerror 与流存活的时序关系。

### 6.2 方案 B：终态守卫丢弃迟到 MESSAGE 分片（`f0d7068cf`）

**改动位置**：`conversationInfoMessageList.ts` 新增共享谓词 `shouldDropLateMessageChunk`（判定+日志+注释收敛于此，vitest 可测）；两个 model 的 `handleChangeMessageList` MESSAGE 分支入口各 10 行调用。

**判定逻辑**：

```ts
!messageIdRef.current && status ∈ {Complete, Error, Stopped} → 整条丢弃（不回退状态、不拼接内容）
```

- `messageIdRef` 为空 = 本轮终态已处理（FINAL_RESULT 分支既有行为会重置它）→ 迟到分片丢弃
- `messageIdRef` 非空 = 多步输出中间步边界（本步 finished=true 已置 Complete，下一步分片需走工作流插新消息逻辑）→ 放行
- 消息非终态（Loading/Incomplete）→ 不触发

**关键实现约束**：守卫位于 `setMessageList` updater 内，命中必须 `return list`（返回未变更列表）——裸 return 会使 updater 返回 undefined 摧毁 messageList。

**影响面**：

| 场景 | 行为 |
| --- | --- |
| 终态后迟到/乱序分片（任何通道：连接缓冲冲刷、事件乱序） | 丢弃 + always-on 日志（状态与内容均不受污染） |
| 多步输出轮次（工作流/多消息 agent） | 中间步边界放行，插新消息逻辑照常（messageIdRef 判据保护） |
| 正常流式 | 不触发（消息非终态） |
| 内容完整性 | 迟到分片本是异常投递的碎片（内容已在正常分片或 FINAL_RESULT.outputText 中），丢弃不损失 |

**单测**（41 条全过，其中 3 条为本守卫）：终态后丢弃（Complete/Error/Stopped × messageIdRef 空）/ 多步边界放行 / 流式中放行。

### 6.3 观测能力（随修复落地）

- sweep 日志 `finalize terminal` 升级 always-on（`createLogger` → `createAlwaysLogger`，每轮 1 条）
- A 降级路径专属日志 `terminal-event ERROR degraded: skip sweep`
- B 守卫日志 `drop late MESSAGE chunk`（既有 always-on）
- 验证表见 §7.1

### 6.4 修复版图

```
✅ B（已合入 f0d7068cf）：终态守卫——已终态消息不接受分片状态回退（防"终态后被回退"）
✅ ERROR/FINAL_RESULT 同权完整清算（协议正确性，本轮恢复）
⬜ 待复现 → 设计：连接级 onError 路径的真凶修复（1678724 的实际触发源）
⬜ 顺带修补：工具层 catch 的 isAborted 守卫 + model 过期守卫的 null 窗口（独立缺口）
```

B 与事件路径的关系不变：无论终态由 FINAL_RESULT 还是 ERROR 事件宣告，B 守卫保护清算成果不被后续分片回退。### 6.6 边界场景 Q&A：会话已结束才收到迟到的详情轮询响应（chat 前/chat 中发起）

场景：终态已处理（sweep 已收敛），一个此前发起（空闲期或流中）的 `POST /api/agent/conversation/{id}` 响应悬挂多秒后才返回。逐层推演（行号基准 cf5adca1a）：

| 层 | 守卫 | 拦截条件 | 结果 |
| --- | --- | --- | --- |
| 1 | 代际守卫（`useConversationStreamResume` onSuccess） | 请求发起后有过新发送（pollGeneration 已递增） | **chat 前发起的在途请求整段丢弃** ✓ |
| 2 | user 尾守卫（onSuccess dispatch 条件） | 快照末条是 USER（assistant 未落库） | 丢弃、不 dispatch ✓（19:02:32 那拍即此形态） |
| 3 | **呈现冻结**（`conversationInfoMessageList` `preserveFinalizedMessagePresentation:240`） | 本地消息已终态（非 Loading/Incomplete） | **stale 落库 Loading 不覆盖本地终态呈现** ✓——这是 B 守卫在快照路径的孪生实现（B 拦事件分片回退、它拦快照合并回退，同一不变式两条路径） |
| 4 | taskStatus 写回守卫（onSuccess 终态写回） | 快照 taskStatus=EXECUTING | 跳过写回——不会把本地 COMPLETE 打回 EXECUTING ✓；终态快照则幂等 |

结论：该场景安全。chat 中发起、悬挂到终态后才返回的响应（层 1 放行）由层 2/3/4 兜住，`isSessionStreamBusy` 不复活。

**残留理论窄缝**：本地已终态消息与快照消息身份映射完全失配（稳定 id / clientRenderKey / 轮次映射三者全不中）时，stale Loading 会作为新消息插入 → 重复气泡 + busy 复活。需同时满足「后端持久化 Loading 态 assistant」且「本地终态轮次不可识别」，概率极窄且症状可见（重复气泡）；真出现时在 merge 层加同款终态冻结即可，暂不预置。

### 6.7 遗留与不做的事

| 项 | 决策 |
| --- | --- |
| 流中 ERROR 事件的载体（chat body 无 ERROR 事件） | 待受控复现确认；若确认后端在流中下发 ERROR，立后端工单 |
| P1 内容看门狗 / P2 本地发送中断 sub | 暂缓（本案 HAR 已排除 sub 参与；A 落地后"连接活任务死"的假运行态已有 sweep 兜底） |
| `conversationInfo.ts:1546` ERROR 清 awaiting | 有意保留（见 6.1） |
| dual-track 分支同步 | 待主分支验证后 cherry-pick |

## 7. 当前行动项

- [x] HAR 全量分析定案：流有序/无 sub/轮询双防线正常/卡死=流中清门+终态残留（§0–§4）
- [x] 线上版本鉴定 = cf5adca1a（§0.4）
- [x] 门打开瞬间的代码映射与行号核验（§0.3，基准 cf5adca1a）
- [ ] **受控复现**（本地 dev + 全量日志）：抓连接级 onerror 与流存活的时序（重点流开始后 ~70s 窗口）→ 按 §6.1 设计 onError 路径修复
- [ ] review `stash@{0}` 的终态守卫（§6-B，与 A 互补）
- [ ] 修复验证后发版；生产验证按下表日志标志

### 7.1 生效验证的日志标志（发版后生产 console 直接可判）

| 日志（均 always-on） | 出现时机 | 说明什么 |
| --- | --- | --- |
| `[ConversationTerminalSweep] finalize terminal {conversationId, taskStatus}` | 每轮正常完成/终态到达 | **方案 A 生效**：终态完整收敛（sweep 日志已升 always-on） |
| `drop late MESSAGE chunk: message already terminal {messageId, chunkType}` | 已终态消息收到迟到分片 | **方案 B 生效**：守卫丢弃了回退分片 |
| `applyTerminalTaskStatus {prev, next}` | 任意终态写回 | 既有日志：状态迁移轨迹（含降级路径的 → FAILED） |
| （Network 层）流进行中无详情轮询请求 | 全程 | A 的行为验证：19:02:32 那种"流中轮询重启"应消失 |

**反向判定（未生效/回归）**：流中 ERROR 后出现 `cancel polling: local send started`（无对应 POST 的"假发送"）或流中出现详情轮询请求 = A 未生效；已终态后消息状态回 Incomplete = B 未生效。
