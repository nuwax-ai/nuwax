# Agent 会话渲染升级开发计划（P0/P1/P2）

> 📚 文档总入口：[README.md](./README.md) · 日期：2026-08-25 · 分支：`feat/conversation-auto-collapse`（基于 `origin/feat/conversation-mock-testing` @ 04b768478） · 调研依据：[agent-session-rendering-analysis.md](./agent-session-rendering-analysis.md) · Mock 基建：[mock-testing-plan.md](./mock-testing-plan.md) / [mock-optimization-plan.md](./mock-optimization-plan.md)

## 0. 总则：示例演示与回归保障（每个功能项的 Done 定义）

> **约定**：本文档列出的每个功能项，开发完成的必要条件除代码与单测外，还必须同时交付「示例演示」并可自动回归：

1. **mock 演示场景**：在 `mock/conversationScenarios.ts` 增加专属场景。载荷构造用 `processing(name, status, toolCallId, extra)` 第 4 参整体覆盖 `result`（先例：`fileDiff` / `planSteps` / `renderOpenUi` helper，`conversationScenarios.ts:100-399`）。新 helper 命名与既有风格一致。
2. **E2E DOM 断言**：在 `scripts/e2e/mock-chat-acceptance.mjs` 的 `INTERACTIVE_CASES` 注册 `{ id, speed, drive }`，`drive()` 内用 `waitForText` + `pageJs(DOM 计数)` 断言渲染形态（先例：`driveOpenuiRender`，:486-490）。断言失败即 case 失败，复用 `waitForSettled` 收尾判定，无需新建 case 类型。
3. **演示状态登记**：在本文档 §1 的「演示矩阵」勾选对应行；`/mock-chat` 页人工对照走查一遍（可视化对照的入口即场景本身）。

**已完成功能的演示补齐状态**（2026-08-25 本轮补齐）：

| 已完成功能 | 演示场景 | E2E 断言 | 状态 |
| --- | --- | --- | --- |
| 工具调用成组 + 主动折叠 | `MULTI_TOOL_ONE_MSG` / `LONG_TASK_INTERLEAVED` / `RENDER_SHOWCASE` | `driveThinkRenderProbe` / `driveRenderShowcaseProbe`（本轮注册） | ✅ |
| 思考按流式位置内联渲染（含 runtime 轨 reducer 接线，本轮补齐） | `LONG_TASK_INTERLEAVED` | `driveThinkRenderProbe`（本轮注册）+ 独立探针 `scripts/e2e/think-render-probe.mjs` | ✅ |
| Plan / diff / OpenUI / task-result 全类型渲染 | `RENDER_SHOWCASE`（11 类型 + Plan 三阶段 + diff ×2 + OpenUI + 链接标签；本轮 helpers 补 endTime 载荷） | `driveRenderShowcaseProbe`（本轮注册；OpenUI 断言仅 legacy 轨） | ✅ |

> 本轮同时修复两个 runtime 轨桥接缺口（渲染探针首次暴露）：
> ① runtime 轨（`features/conversation/domain` 三个 reducer）此前未接入思考内联标签协议——THINK 仍只写 `think` 字段，双轨切换后退化为消息开头单块合成。现已按「adapter 注入」架构补齐（`ThinkBlockAdapter` 可选注入，缺省保持旧投影行为），reducer 单测覆盖注入/不注入两种形态。
> ② runtime 会话未把 message.processingList 同步进 chat model（`MarkdownCustomProcess` 的 Plan 步骤 / diff 内容 / 详情弹窗数据源），旧线由 `useConversationActiveState` 的 rAF 派生承担。已在 `useConversationRuntimeSession` 补对齐 effect（session 为空时不同步，避免清掉旧线数据）。

## 1. 演示矩阵（随开发滚动更新）

| 功能项 | 演示场景 | drive 断言 | 状态 |
| --- | --- | --- | --- |
| （已完成三项见 §0 表） | — | — | ✅ |
| P0-1 终端输出渲染 | `TERMINAL_OUTPUT`（2026-08-25 建）+ `RENDER_SHOWCASE` 并入 | `driveTerminalOutputProbe`（2026-08-25 注册）+ showcase 探针扩展 | ✅ |
| P0-2 Plan 进度 | `PLAN_PROCESSING` / `RENDER_SHOWCASE`（终态 3/3 断言入 showcase 探针） | showcase 探针（`3/3` 文案断言） | ✅ |
| P0-3 工具耗时徽标 | `RENDER_SHOWCASE`（endTime 载荷） | showcase 探针（`1.8s/2.4s/3.2s` 断言） | ✅ |
| P1-4 子 agent 渲染 | `SUBAGENT_NESTED`（待建） | `driveSubagentProbe`（待建） | ⬜ |
| P1-5 消息重试 | 手动矩阵 + 单测 | —（交互在输入框区，不适合回放断言） | ⬜ |
| P1-6 会话密度设置 | `/mock-chat` 手动三档对照 + 映射单测 | —（偏好类，手动验收） | ⬜ |
| P2 各项 | 立项时补 | 立项时补 | ⬜ |

## 2. P0：紧跟折叠基建，边际成本最低

### P0-1 终端输出专属渲染

- **目标**：Bash / shell / terminal 类工具调用在会话流内渲染为等宽终端块，而非「通用一行卡 + JSON 弹窗」。
- **验收标准**：① 流式 EXECUTING 时显示命令行 + 实时输出尾部 N 行（默认 6）预览；② FINISHED 后收为摘要行（命令 + 退出码徽标 + 耗时），点击展开全量输出（等宽、暗底、横向滚动、限高）；③ 退出码 0 绿、非 0 红；④ 历史消息同样渲染；⑤ 长输出（1000+ 行）展开不卡。
- **协议方案**：`ExecuteResultInfo.data` 数组新增项 `{ type: 'terminal', command?, content: string, exitCode?: number }`，与 diff 项（`{type:'diff', ...}`，`src/utils/fileChangeDiff.ts:120-150` 的 `normalizeFileDiffItems` 同层）同构；新增 `normalizeTerminalItems`（`src/utils/terminalOutput.ts`，兼容 content/output 别名）。**输出内容不走 text 标签属性**——text 标签只占位，内容经 processingList → chat model 的既有同步链路增长（流式无需标签重写）；渲染端 `TerminalOutputView` 尾部截断（预览 6 行 / 全量 500 行）防超长输出撑爆 DOM。命令行来源：item.command → result.input.command → 工具名。
- **涉及文件**：`MarkdownCustomProcess/index.tsx`（新增终端分支 + 展开态）、`MarkdownCustomProcess/index.less`（等宽块样式）、`src/utils/fileChangeDiff.ts` 或新 `terminalOutput.ts`（normalize）、可选 `MarkdownRenderer` 无需改（标签协议不变）。
- **演示场景**：helper `terminalOutput(toolCallId, { command, content, exitCode })`（覆盖 result.data）；场景 `TERMINAL_OUTPUT`：安装依赖（长输出成功）→ 跑测试（失败非 0 退出码）→ 修复重跑（成功）→ 正文总结。
- **后端确认项**：真实 Bash 工具 `result.data` 的实际形状（若后端已下发某种 stdout 结构，normalize 做兼容映射即可，协议可吸收）。

### P0-2 Plan 进度升级

- **目标**：Plan 从「只读步骤列表」升级为带进度概览的计划面板。
- **验收标准**：① 卡片头部显示进度摘要 `2/5` 与当前 in_progress 步骤名；② 步骤状态图标保留（completed/pending/failed/in_progress）；③ 全量重写式更新语义不变（同 executeId 原地替换，Manus 式前缀稳定）；④ 连续 Plan 只保留最后一个的既有去重规则不回归。
- **涉及文件**：`MarkdownCustomProcess/index.tsx:369-427`（头部区 + 进度计算）。
- **演示场景**：复用 `PLAN_PROCESSING` 与 `RENDER_SHOWCASE` 的 `planSteps` 三阶段序列，drive 断言：`2/5` 文案出现、in_progress 步骤名可见、终态全勾。
- **后续项（不在 P0）**：扣子式「规划确认门」——Plan 完成后 agent 发 `nuwax_ask_question` 请求确认，**完全复用现有干预队列机制**（`AgentIntervention` + 队列暂停消费），前端零新组件，需后端在 Plan 完成时插入 ask 事件。

### P0-3 工具耗时徽标

- **目标**：单行工具卡可见单步耗时，不必 hover RunOver 弹层。
- **验收标准**：FINISHED / FAILED 后单行卡右侧显示 `x.x s`（<1s 显示 `ms`）；EXECUTING 不显示；数据源 `result.endTime - result.startTime`（`ExecuteResultInfo` 已有字段，`types/interfaces/conversationInfo.ts:81-97`）。
- **涉及文件**：`MarkdownCustomProcess/index.tsx`（徽标）+ less。
- **演示场景**：`RENDER_SHOWCASE` 的 FINISHED 事件本轮已补 `endTime` 载荷；drive 断言耗时文本出现。

### P0 汇总演示

`RENDER_SHOWCASE` 保持「全类型渲染对照总入口」定位，P0 各项落地后把新形态并入该场景（终端块、进度摘要、耗时徽标各加一组事件），人工对照走查一次到位。

## 3. P1：需少量协议 / 后端确认

### P1-4 子 agent 渲染

- **目标**：SubAgent 类型有专属形态：折叠行「子 agent 名 + 状态图标 + 耗时」，其执行的工具调用嵌套缩进展示。
- **协议方案（两段走）**：① 近似方案（先行）：按文本协议相邻性归属——`groupMarkdownProcesses` 已有相邻判定，SubAgent 标签之后、下一个非工具内容之前的连续 process 标签归入其嵌套组（与现有分组算法同构）；② 精确方案（待后端）：PROCESSING 事件增加 `parentExecuteId`，标签属性直传。
- **涉及文件**：`MarkdownCustomProcess` 新增 SubAgent 分支、`MarkdownRenderer/utils.ts`（嵌套归属）、genCustomPlugin。
- **演示场景**：`SUBAGENT_NESTED`：主任务 → SubAgent 调用（含 2 个子工具）→ 返回 → 主任务继续。drive 断言嵌套结构（子工具 DOM 在 SubAgent 容器内）。
- **注意**：`RENDER_SHOWCASE` 现含 SubAgent 事件但落通用卡——P1-4 落地后该场景断言同步升级。

### P1-5 消息重试 / 重新生成

- **目标**：助手消息底部支持「重新生成」（携带原 prompt 重发），失败消息支持「重试」。
- **依赖**：后端 resend / regenerate 接口（**待确认，阻塞项**）。
- **涉及文件**：`ChatView/ChatBottomMore`（按钮）、`conversationInfo` model（动作）、i18n。
- **演示**：交互在输入区发起，不适合回放断言；以单测 + `/mock-chat` 手动矩阵验收。

### P1-6 会话密度设置

- **目标**：Cursor 式 Conversation Density：compact / normal / detailed 三档。
- **方案**：localStorage 偏好 + 输入框工具条入口；映射折叠策略——compact：工具组与思考块始终收起（`defaultCollapsed=true` 恒定）；normal（默认）：现行「被超越即收起」；detailed：`autoCollapse=false` 恒展开。折叠基建（`autoCollapse` / `defaultCollapsed`）已参数化，`ChatView → MarkdownRenderer → genCustomPlugin` 透传链已有。
- **演示**：密度 → 参数映射单测；`/mock-chat` 三档手动对照。

## 4. P2：体验加分项

- **流式自动跟随文件预览**：edit/diff 类工具 EXECUTING 时自动在右侧打开该文件（Cursor/Devin 形态）；复用 `taskAgentSelectedFileId` 机制，加防抖与用户中断。
- **diff 增强**：「在文件树中打开」直达按钮；Unified / side-by-side 切换（`ChangeFileGitDiffView` 支持 split 模式）。
- **状态条停止按钮**：`RunOver` 旁挂停止（复用 `runStopConversation`），极小。
- **会话回放分享**（Manus 式）：录制事件序列 + 时间线回放 UI，大工程远期。

## 5. 后端确认清单（阻塞项汇总）

| # | 事项 | 阻塞 |
| --- | --- | --- |
| 1 | Bash 类工具 `result.data` 实际形状（stdout / exitCode 是否已下发） | P0-1 |
| 2 | PROCESSING 事件能否携带子 agent 归属标识（`parentExecuteId`） | P1-4 精确方案 |
| 3 | 重发 / 重新生成消息接口 | P1-5 |

## 6. 里程碑与分支策略

| 批次 | 内容 | 分支策略 |
| --- | --- | --- |
| M1 | P0-1 + P0-2 + P0-3 + P0 汇总演示 | ~~独立新分支~~ 已于 2026-08-25 在 `feat/conversation-auto-collapse` 续作完成（演示矩阵 / e2e 基建依赖该分支，避免重复搬运） |
| M2 | P1-4（近似方案）/ P1-6；P1-5 视后端就绪 | 按项独立分支 |
| M3 | P2 按需立项 | 按项独立分支 |

每项合入前：勾 §1 演示矩阵 → `npm run e2e:mock-chat` 全绿（KNOWN_ISSUES 除外）→ 单测全绿 → 本文档登记日期。
