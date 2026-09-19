# 会话 V1×V2 双线横向对比 · 功能逻辑清单与近期对齐（2026-09-16 ~ 09-19）

> **本文定位**：V2（runtime 数据线 + V2 渲染器）默认化之后的**对齐状态快照**——逐功能域横向对比 V1（旧线）行为与 V2 现行为，标注对齐状态，并收录 09-16~09-19 的对齐工作。逐条业务行为的**验收底稿**在 [dual-track/conversation-business-logic-checklist.md](./dual-track/conversation-business-logic-checklist.md)（本文引用其 ID），验收走查请用那份。
>
> 术语口径：**V1=旧线**（legacy 数据 + V1 渲染，ChatView + MarkdownRenderer，已冻结）/ **V2=新线**（runtime 数据 + V2 渲染，默认）。两轴正交：`?conversationRuntime=0` 回旧数据线、`?conversationRenderer=v1` 回旧渲染器，可组合成 2×2。

**对齐状态图例**

| 标记 | 含义                                           |
| ---- | ---------------------------------------------- |
| ✅   | 双线对齐（自动验收锚定）                       |
| 🔵   | 本期已实现待浏览器走查（未提交）               |
| 🔴   | 已知缺口 / 已知差异（E2E KNOWN-FAIL 或待确认） |
| ⚪   | 刻意差异（设计如此，非遗漏）                   |
| ➕   | V2 独有增量（V1 无对应物）                     |

---

## 一、全景总表

| 功能域 | V1 行为 | V2 现行为 | 状态 |
| --- | --- | --- | --- |
| 发送与乐观上屏（A1-A8） | model onMessageSend | runtime send，参数面/乐观态/侧栏执行中同步同构 | ✅ parity+合同网锚定 |
| SSE 流式归并（B1-B10/B12） | model handleChangeMessageList | domain reduce\* + store，digest 一致 | ✅ |
| 延迟 Ask 表单补偿（B11） | FINAL_RESULT 后 250/750/1500ms 静默补读 | **无对应实现** | 🔴 差异待确认 |
| 停止与终态同步（C1-C15） | model + 统一清算 hook | runtime stop/onClose + 同一清算 hook 双轨共用 | ✅ |
| sub 流式恢复（D1-D13） | useConversationStreamResume（旧线实现） | features 版编排 + resume 一致性控制器 | ✅（1 条 🔴 见 2.3） |
| 干预链路（permission/ask） | model 写 interactions 字段 → dock 派生 | interventionAdapter.patchEvent 写同字段 | ✅ 09-19 复测 12/12 |
| OpenUI 消息投影 | legacy applier | runtime applier（`2974cb2a2` 接入） | ✅ |
| 文件树刷新信号 | model ToolCall 节流 + FINAL_RESULT | runtime 生产者（preview.file.refresh / taskResult.settle） | 🔵 09-19 补齐 |
| 面板结束沿 | model isConversationActive | conversationProps 生效值优先 | 🔵 09-19 对齐 |
| 渲染：轨迹结构 | 扁平消息 + 工具卡 | 三层分组轨迹（轮次/工具组/类型化详情） | ⚪ 重构目标 |
| 渲染：OpenUI | MarkdownCustomProcess 内嵌卡 | OpenUiTraceNode 常显节点 | ✅ 09-19 补齐（用户确认） |
| 渲染：密度体系 | conversation_density 三档 | focused/balanced/detailed + 逐类覆盖 | ⚪ 两套独立键并存 |
| 渲染：异常保险 | — | 投影/渲染异常整份回退 V1，不白屏 | ➕ |
| 进度胶囊 | 无 | TaskAgent 专属、终态常驻、分区面板 | ➕ 09-17 |
| 文件树数据面 | model 全量递归树 | file-server 单层「面包屑」+ 懒加载 | ⚪ #5a 改造 |

---

## 二、数据线（runtime）横向对比

### 2.1 双线共同实现且自动验收锚定（✅）

以下能力域在旧线（`models/conversationInfo.ts`）与新线（`features/conversation/runtime/` + `domain/reduce*`）各有一份实现，行为由合同网 + parity 测试锚定一致（ID 引用 [业务逻辑清单](./dual-track/conversation-business-logic-checklist.md)）：

- **A 发送与乐观上屏**：乐观 user+Loading 立即上屏、发送瞬间活跃态（3s 保活）、真实入口侧栏标执行中（A3，isSync 语义）、参数面透传（A4，files/infos/variableParams/sandboxId/skillIds/modelId/agentMode）、必填变量拦截、新建会话跳转。
- **B SSE 流式归并**（协议 5+1 种事件）：THINK 思考流、正文 chunk、QUESTION 建议、PROCESSING 按 executeId upsert、工作流多输出原位前插、FINAL_RESULT 收尾（含干预 reconcile）、ERROR 落终态、heartbeat 无副作用、Page/Link 预览（B9）、卡片结果 cardList（B10）、双线 digest 一致（B12，`conversationDualTrackParity`）。
- **C 停止与终态同步**：停止按钮合成活跃判定、停止链路 abort→Stopped→ 后端 stop、取消无输出删空气泡、ERROR/onError 落终态、onClose 兜底、终态写回规则、侧栏终态补偿、收尾不闪烁（C8）、终态统一收敛 sweep（C10，`useConversationTerminalFinalizer` 双轨共用）、事件白名单、迟到分片守卫（C12）、轮次边界、工具状态解耦。
- **D sub 流式恢复**：EXECUTING 会话刷新/新开标签 → sub 重放重建、订阅前数据来源、持久化尾去重、占位策略、连接隔离复用、本地流结束冷却、秒关指数退避、sub ERROR 主动断、终态确认不 reload、本地发送打断 sub。

### 2.2 本期（09-16 ~ 09-19）补齐的 V1→V2 对齐项

| 项 | V1 侧 | V2 侧（本期补） | 状态 |
| --- | --- | --- | --- |
| 干预 dock 桥接 | model 写 `acpPermissionInteractions`/`mcpAskInteractions` → `useActiveInterventionQueue` 派生 dock | `2974cb2a2` interventionAdapter.patchEvent 写同字段，「事件 →dock」随接线打通；PERMISSION/ASK/STACK 三条 E2E KNOWN-FAIL 已删 | ✅ 09-19 复测 12/12 绿（此前记录「仍开放」已过时） |
| OpenUI 消息投影 | legacy applier | `2974cb2a2` 同批接入 runtime 投影 | ✅（渲染层缺口见 3.2） |
| 文件树刷新信号生产者 | model 触发点（ToolCall 节流 :1353 / FINAL_RESULT :1508） | runtime session：PROCESSING ToolCall → `preview.file.refresh(throttled)`；FINAL_RESULT+TaskAgent → `taskResult.settle`（收尾组合体） | 🔵 09-19，待走查 |
| 智能体快照 | `conversationInfoRef.current?.agent` | runtime `currentAgent`（load/send 双写、reset 清空）；TaskAgent 判定 + 版本管理枚举直比 | 🔵 同批 |
| ConversationAgent 结束沿 | model isConversationActive（V2 下置位点不执行） | `effectiveIsActive = conversationProps.isConversationActive ?? model 值` | 🔵 同批 |
| 会话创建携带沙箱 | — | chat/create 统一携带电脑 sandboxId，未选默认 `-1` | 🟡 `b9016c651` 未推送 |
| V2 默认化本体 | 默认 legacy | CONVERSATION_RUNTIME_DEFAULT=true + ChatContentArea 默认 v2 + conversationV2Rollout 一次性迁移 + ConversationDetails 收敛 UnifiedChatSession（-204 行）+ AppDevPro 面板接 runtime 线 | ✅ `2974cb2a2`+`e6cae5baf`+自查四修 `a93c3b115` |
| topic 自动更新 | firstEventOfConnection 反置毒化（已修 `0c8b49d64`） | 同修 | ✅ |

### 2.3 已知差异与开放缺口（🔴）

| 项 | 现象 | 跟踪机制 |
| --- | --- | --- |
| runtime 续接不清快照 EXECUTING（SESSION_RESUME 断言 4） | **已修（09-19，T1.2）**：终态后轮询快照滞后 EXECUTING 被 reconcile 盖回 → session 终态记忆 + applySnapshot 按终态重收敛；mock 页同会话重放终态残留 → hook `resetAndReloadConversation` | 回归锚 `tests/conversation/sessionSnapshotTerminalGuard.test.ts`；E2E KNOWN-FAIL 已删、SESSION_RESUME 4/4 真断言绿 |
| 终态守卫未丢弃迟到分片 | `shouldDropLateMessageChunk` 真实时长下未生效（154s 迟到分片两轨都渲染了） | **两轨一致**，非 V1/V2 差异；E2E KNOWN-FAIL（LATE_CHUNK_SLOW 双轨守卫证据用例），终态收敛线专项 |
| 延迟 Ask 表单补偿仅旧线（B11） | V1 在 FINAL_RESULT 后按 250/750/1500ms 静默补读补齐慢落库 Ask 表单；runtime 线无对应逻辑 | 业务影响待确认（后端若已根治慢落库可判废弃，否则需移植） |

### 2.4 结构性说明

- **effects 面**：V1 的副作用散在 model（预览打开/卡片/终态同步/文件刷新），V2 统一经 `runtime.effects.dispatch`（`createRuntimeLineEffectsAdapter` 消费），语义锚测试在 `tests/conversationEffects.test.ts`。旧 `mainChatEffectsAdapter` 为生产零调用死代码，已 git rm（🔵 本批）。
- **终态清算**：`useConversationTerminalFinalizer`（sweep）与 `messageLifecycle` 终态清算是双轨共用的单点——对齐不是复制两份，而是共用底层。

---

## 三、渲染层横向对比（V1 渲染器 vs V2 渲染器）

### 3.1 刻意差异（⚪ 重构目标，勿「对齐」回去）

| 维度 | V1 | V2 |
| --- | --- | --- |
| 轨迹结构 | 扁平消息列表 + MarkdownCustomProcess 工具卡（已冻结） | `MessageInfo[] → 纯投影 → 整轮轨迹 / 工具组 / 类型化详情` 三层 |
| 工具详情 | 旧式卡片（重复标题、参数 JSON） | 类型化：终端/文件/Diff/搜索/浏览器/Skill/Plan/Generic，协议 `result.kind` 优先 |
| 折叠 | V1 三档密度（conversation_density）原样保留 | focused/balanced/detailed 预设 + 逐类 hidden/summary/expanded 覆盖（独立键）；三层严格懒挂载（`{expanded &&}` 收起即卸载、运行转完成自动收起） |
| 中间正文 | — | narration 原位直出，不受预设/覆盖影响 |
| 轮次分组 | — | requestId 优先归组、USER 边界兜底 |

### 3.2 已对齐 / 本期补齐

- **最终回答**：共用同一渲染链与回答操作栏（复制/分享）；时间戳复用 V1 `formatTimeAgo` 规则。⚪ 共用。
- **OpenUI 挂载**（✅ 09-19 用户确认搞定，12 文件未提交随批走）：V1 在 MarkdownCustomProcess 内嵌渲染；V2 新增 `OpenUiTraceNode`——`resolveOpenUiDisplayState` 判 ready/input-only 懒挂 `OpenUiArtifactView`，absent 降级普通工具行；产品口径**看板常显**（`.openui-pinned` 在折叠按钮外，轨迹收起/历史终态轮可见）；sidecar 经 props 注入（features 层不引 umi）。关键修复：`isOpenUiToolNode` 从 `componentType===Event` 放宽为只认工具名（流式 applier 产 ToolCall、历史产 Event 两态兼容）。验收 812 绿 + E2E 16/16 + testagent 真实会话 1693163 走查过。
- **taskWait 闪占位**（✅ `cc2657dc6`）：完成瞬间不闪「智能体正在执行」。

### 3.3 V2 独有增量（➕）

- **进度胶囊**（✅ 09-17 多笔）：Chat 页 TaskAgent 专属（🔴 ChatBot 不显示，用户定调勿放开类型判断）；终态常驻（新消息新轮才隐藏）、分区面板（任务结果=task-result 标签产物行 / Git 工具 / 计划 / 进程 / 终端超 5 折叠 / 智能体摘要）、扫光、JS 逐帧纯淡入（🔴 用户机器减弱动态效果冻结 CSS 动画，勿改回）。
- **过程叙述折叠方案 A**（🟣 demo 待走查）：去外层大折叠 / 纯统计行 / 折叠下沉组行级；demo 在 `/examples/trace-structure-demo`（3 文件未提交），**过审才动源码**。演进史：两版直出方案（`83f579c27`/`3e5a5e196`）已两连 revert 净零。

### 3.4 保险与接入面

- **回退三保险**：用户级设置/URL 回切 V1；投影抛错 try/catch、渲染抛错 ErrorBoundary → 整份回退 V1 不白屏；`renderMessageItem` 自定义入口恒优先（AppDev/预览扩展点）。
- **接入面现状**：`ChatContentArea` 默认 `messageRenderer='v2'`（`index.tsx:109`），五入口经 UnifiedChatSession 全走 V2；Chat 页透传偏好链（URL > 会话覆盖 > 全局 > 默认 v2）。⚠️ renderer-v2.md「接入面」段（PreviewAndDebug/ConversationAgent 面板/AppDev 恒 V1）为 09-04 默认切换前记录，**已过时**，以代码为准。

---

## 四、文件树面板横向对比（重点）

前置：#5a 懒加载改造（[file-tree-lazyload-5a.md](./file-tree-lazyload-5a.md)）把数据面从「model 全量递归树」改为「file-server 单层面包屑浏览器 + 按需加载」。下表对比各链路 V1（全量树时代）与 V2（runtime 线 + 懒加载，**本期修复后**）：

| 链路 | V1（旧行为） | V2（现行为） | 状态 |
| --- | --- | --- | --- |
| 数据面 | model 全量递归拉整树 | `apiGetStaticFileList` 单层查询、点文件夹进目录 | ⚪ #5a |
| file-list 时机 | 挂载/切会话即拉（新会话先于 chat 发出） | `enabled` 门控「打开面板才拉」+ 在途去重 | 🔵 09-19 修 |
| 流式期间刷新 | legacy ToolCall → model 节流全量刷 | runtime 生产者 `preview.file.refresh(throttled)`（此前 V2 只有消费者无生产者，**整条死**） | 🔵 09-19 补 |
| 终局刷新 | FINAL_RESULT(TaskAgent) → model 全量刷 | `taskResult.settle` 收尾组合体 → Chat 自管树 `refreshAllLoaded()`（根层+全部已加载目录） | 🔵 09-19 补 |
| task-result 文件选中 | model 组合体，fileId 全路径 | settle `file` 传含会话段原始终路径，消费端 split；FinalAnswerBlock 漏传 conversationId 已修 | 🔵 09-19 修 |
| 嵌套目录文件打开 | 全量树必命中 | `isAutoSelectDirectoryLoaded` 谓词：父目录未加载保持等待不判 miss（此前 abandon 竞态打不开） | 🔵 09-19 修 |
| 面板结束沿（ConversationAgent） | model isConversationActive 下降沿 | conversationProps 生效值优先（V2 下 model 置位点不执行） | 🔵 09-19 修 |
| 自动展开定位 | 全量树路径匹配 | node id（`workspace:` 前缀）切 folderIds，path 无前缀不匹配 | 🔵 本批修 |
| EditAgent / SkillDetails | model 全量树 | 未自管（`fileTreeSelfManaged=false`），保持 model 全量树 + 信号驱动重拉 | ⚪ 刻意保持 |
| @弹层文件选择 | 全量递归 | 不变（全量递归） | ⚪ |

**终态行为口径（验收基准快照）**：挂载零请求（面板关）→ 开面板首拉（双路+在途去重）→ 关面板信号不消费、重开恒补 → @弹层不变；刷新链 ToolCall 节流刷 + TaskAgent 终局 settle 组合体；嵌套打开=相对路径+trigger→navigate 父目录 → 谓词判「父目录已加载」才许 miss；结束沿=生效值下降沿 → 刷树/Git/编排。

**🔴 待走查（6 条）**：新会话无预发 / 开面板才拉 / 新文件自动出现 / 嵌套卡片可开 / `?conversationRuntime=0` 旧线不回归 / ConversationAgent 发任务结束后树-Git-编排自动刷新。

---

## 五、近期批次与提交状态

| 功能 | 域 | 状态 | 验证 |
| --- | --- | --- | --- |
| V2 默认化收口 | 数据+渲染 | ✅ `2974cb2a2`+`e6cae5baf`+`a93c3b115` | 767 绿，/quality-review 三问过 |
| 干预 dock + OpenUI applier 桥接 | 数据 | ✅（随 `2974cb2a2`，09-19 复测确认） | E2E 12/12 |
| 进度胶囊全链 | 渲染（V2 独有） | ✅ 09-17 多笔 | 794 绿基线 |
| 工具折叠严格懒挂载 + V1/V2 术语口径 | 渲染 | ✅ `9564818f22` | 已入档 |
| taskWait 闪占位 | 渲染 | ✅ `cc2657dc6` | 已推 |
| 文件树三连回归 + 遗留收口（二、四节 🔵 项） | 文件树 ×V2 | 🔵 15 文件 + 1 删（mainChatEffectsAdapter） | 815 断言绿；🔴 浏览器走查未做 |
| V2 渲染层 OpenUI 挂载 | 渲染 | ✅ 12 文件（09-19 用户确认；未提交随批走） | 812 绿 + E2E 16/16 + testagent 走查过 |
| 过程叙述方案 A demo | 渲染 | 🟣 3 文件 | 待走查，过审才动源码 |
| 页签切回请求门控 | 首页/侧栏 | ✅ `155a4b4f2` | ego 走查三组过 |
| sandboxId 统一携带 | 会话创建 | 🟡 `b9016c651` | 未推送 |
| 参与者自选沙箱 | 项目/会话创建 | 🟡 `3c3c4a624` | 未推送 |
| 目录浏览网关断言跟进 | 文件树 | ✅ `9d0ae4930` | tests/ 同步 |

（🟡 = 已提交未推送，分支 ahead 2；🔵 = 已实现未提交。）

## 六、验证基建

| 层 | 资产 | 覆盖 |
| --- | --- | --- |
| 合同网 | `npm run test:conversation`（15 路径过滤器，当前 815+ 断言） | 双线行为契约 + parity |
| 组件/纯函数 | presentation 投影、traceItems、toolDetail、选择器四组合 | V2 渲染层 |
| E2E 矩阵 | `npm run e2e:mock-chat`（`E2E_RENDERER=v1\|v2\|both` 默认 both；断言型跑满 2×2） | 双线 × 双渲染组合；KNOWN-FAIL 机制显式跟踪已知差异 |
| 真实环境 E2E | `e2e:conversation`（dev + ego 登录态，8 场景） | legacy/runtime 发送/续接/回退 |
| CI | `.github/workflows/conversation-tests.yml` | 会话路径改动自动跑合同网 |

## 相关文档索引

- [v2-full-switch-tasks.md](./v2-full-switch-tasks.md) —— **「全切换到 V2」开发任务清单**（本文的待办视图：阶段一功能全切换 + 阶段二代码退役）
- [dual-track/conversation-business-logic-checklist.md](./dual-track/conversation-business-logic-checklist.md) —— 业务逻辑验收底稿（本文 ID 来源）
- [file-tree-lazyload-5a.md](./file-tree-lazyload-5a.md) —— 文件树懒加载改造（第四节前置）
- [renderer-v2.md](./renderer-v2.md) / [renderer-v2-grouped-trace-summary.md](./renderer-v2-grouped-trace-summary.md) —— V2 渲染器结构与契约（⚠️ 接入面段已过时，见 3.4）
- [mock-optimization-plan.md](./mock-optimization-plan.md) —— E2E 已知差异跟踪（KNOWN-FAIL 清单）
- [README.md](./README.md) —— 会话域总入口
