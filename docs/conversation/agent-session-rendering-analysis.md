# Agent 会话渲染与交互：市面形态调研与我们的差距分析

> 调研时间：2026-08-25 · 分支：`feat/conversation-auto-collapse`（基于 `origin/feat/conversation-mock-testing` @ 04b768478） · 配套开发计划：[agent-session-rendering-plan.md](./agent-session-rendering-plan.md) · 背景事件：本分支刚合入「任务型 agent 长输出主动折叠 + 思考按流式位置内联渲染」（e42ab5a27），本文是该方向的延续调研。

## Context

任务型 agent 单轮输出越来越长（多轮思考 × 多次工具调用 × 多段正文），会话流的「过程渲染」成为体验主战场。本文盘点 2025-2026 市面主流产品在 agent 会话里的渲染类型与交互形态，对照我们的代码现状，给出差距矩阵与优先级结论，作为后续开发计划的输入。

---

## 1. 市面形态盘点

### 1.1 Cursor 3（2026-04，agent-first 重构）

- **并行 agent 管理台**：从「编辑器为主」转向独立 Agents Window，跨仓库并行跑多个 agent（[InfoQ 报道](https://www.infoq.com/news/2026/04/cursor-3-agent-first-interface/)、[官方博客](https://cursor.com/blog/cursor-3)、[Agents Window 指南](https://www.digitalapplied.com/blog/cursor-3-agents-window-complete-guide)）。
- **Plan Mode + 自动 TODO**：先出可编辑计划，计划通过后自动生成 TODO 清单逐步执行，支撑更长的 agent 运行（[实测](https://engincanveske.substack.com/p/how-i-use-cursor-plan-mode-for-real)、[Hacker News 讨论](https://news.ycombinator.com/item?id=45554645)）。
- **Conversation Density 设置**：compact / normal / detailed 三档控制工具调用在会话里的默认展示密度（[论坛](https://forum.cursor.com/t/new-version-hides-agent-tool-call-details-in-defiance-of-setting/165292)）——用户对「过程要看多细」的偏好被产品化为一等设置。

### 1.2 Manus

- **TodoList 全量重写式更新**：每次计划变更都下发完整清单（而非增量 diff），保证上下文前缀稳定、KV-cache 命友——这是 UI 形态背后的上下文工程取舍（[Context Engineering for AI Agents](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus)）。
- **「Manus's Computer」右侧实时视图**：浏览器/终端/编辑器跟随 agent 操作，聊天与工作现场分屏（[UX 分析](https://www.scribd.com/document/978263855/Replicating-Manus-AI-UI-UX-and-Visuals)）。
- **会话可回放分享**：任务过程录制为可拖动时间线回放。
- **子 agent 独立上下文**：Wide Research 场景每个子 agent 独立上下文处理条目，解决长任务上下文退化（[Manus 文档](https://manus.im/docs/zh-tw/)）。

### 1.3 Devin

- **计划是一等公民**：可编辑的计划面板（用户可直接改文字再放行）；命令输出、diff、日志各有独立视图（[2026 Release Notes](https://docs.devin.ai/release-notes/2026)）。
- **按生命周期串联的 2026 新 UI**：从任意位置发起 session、在 Devin 内直接 review agent 产出、随时跳回历史 session。
- **Playbook 体系**：Procedure / Specification / 宏沉淀为可复用资产（[Playbooks 指南](https://fast.io/resources/devin-ai-playbook-guide/)）。

### 1.4 Claude Code（终端形态）

- **子 agent 折叠行**：`⏺ agent (web-search)` 一行摘要，内部工具调用默认隐藏，Ctrl+O 展开完整 transcript（[子 agent 文档](https://code.claude.com/docs/en/sub-agents)、[使用指南](https://claude.com/blog/subagents-in-claude-code)）。
- **折叠太深是公认痛点**：[Zed 讨论 #49452](https://github.com/zed-industries/zed/discussions/49452) 讨论如何在编辑器面板显性化子 agent 活动；社区甚至专门做了 [Agent Flow](https://www.reddit.com/r/ClaudeAI/comments/1s286nb/agent_flow_a_beautiful_way_to_visualize_what/) 可视化工具——证明子 agent 渲染是真实需求，且「一行摘要 + 可展开」是最低可用形态、不是终态。
- **TODO checklist 渲染**：todo write 工具渲染为勾选清单，in_progress 步骤高亮。
- **Bash 输出折叠**：命令 + 等宽输出块，默认收起。

### 1.5 ChatGPT（OpenAI）

- **agent 模式双浏览器**：可视浏览器（可看见滚动/点击/登录）+ 纯文本浏览器（快速抓取），旁白式进度说明（[官方发布](https://openai.com/index/introducing-chatgpt-agent/)、[界面实拍](https://www.linkedin.com/pulse/chatgpt-agent-mode-wild-how-use-anders-jensen-0a1of)）。
- **Deep Research 折叠进度流**：研究步骤逐条折叠展开。
- **形态演进**：Operator 并入 agent 模式后，现在演进为 [ChatGPT Work](https://chatgpt.com/work/) 的任务化（Tasks）界面。

### 1.6 国内产品

- **扣子空间（字节）**：**「探索 / 规划」双模式**——规划模式先展示任务计划，**用户确认后才执行**（[腾讯新闻](https://view.inews.qq.com/k/20250421A052YR00?scene=wap&no-redirect=1)、[知乎复盘](https://zhuanlan.zhihu.com/p/1897728774449107589)）；会话支持 `+` / `/` 引用技能与数据集（[官方文档](https://docs.coze.cn/cozespace_session)）。
- **Kimi OK Computer / 探索版（月之暗面）**：电脑操作回放路线；K3（2026-07）支持**多子 agent 并行 + 4000 步协调**（[火山引擎 2026 Agent 工具清单](https://developer.volcengine.com/articles/7665936353855635519)）。

### 1.7 通用交互模式

社区已收敛出 agent UI 七模式：任务框定 / 自主度滑杆 / 计划面板 / 进度流 / 确认门 / 错误恢复 /（[Brainy Papers: AI Agent UI Design Patterns](https://brainy.ink/paper/ai-agent-ui-design-patterns)、[Fuselab 指南](https://fuselabcreative.com/ui-design-for-ai-agents/)）。国内教程侧也把「输入框 + 过程展示区 + 任务步骤进度 + 结果输出区」四区结构作为标准叙事（[AI Agent 交互设计](https://siyujia.net/posts/ai-agent-hci)、[Deep Agents 实战](https://datawhalechina.github.io/deepagents-in-action/chapters/ch04-task-planning/)）。

---

## 2. 我们的现状清单（代码盘点，2026-08-25）

渲染主链路：`UnifiedChatSession → ChatContentArea → ChatView → MarkdownRenderer(ds-markdown 自定义标签插件) → MarkdownCustomProcess(Group) / MarkdownCustomThink`。过程类内容走文本标签协议（`<markdown-custom-process>` / `<markdown-custom-think>` 内嵌消息 text，渲染前 `groupMarkdownProcesses` 分组）。

| 能力 | 位置 | 现状 |
| --- | --- | --- |
| 工具调用成组折叠 | `MarkdownCustomProcessGroup` + `groupMarkdownProcesses` | ✅ 已有；本分支升级为「被超越即收起」主动折叠 |
| 思考按流式位置内联渲染 | `MarkdownCustomThink` + `plugins/ds-markdown-think` | ✅ 本分支新增（e42ab5a27） |
| 文件 diff 渲染 | `MarkdownCustomProcess` :54-109（`ChangeFileGitDiffView`） | ✅ 行级增删徽标 + 展开逐文件 Unified diff |
| Plan 计划 | `MarkdownCustomProcess` :369-427 | ⚠️ 只读步骤列表（状态图标齐全），无进度概览、无确认门、步骤不可点 |
| 干预审批 | `AgentIntervention`（ACP 权限卡 / MCP ask 表单） | ✅ 内联 diff 预览 + 数字键快捷键，强于多数产品 |
| OpenUI | `OpenUiArtifactView` 三形态（inline / iframe / sidecar） | ✅ |
| 任务状态条 | `RunOver` + `ConversationStatus` | ⚠️ 状态徽标 + 计时；单步耗时只在 hover 弹层 |
| 终端 | `ConversationAgent` 底部 xterm 控制台（ttyd） | ⚠️ 与会话消息流脱钩；Bash 类工具调用只有通用一行卡 + JSON 详情弹窗 |
| 子 agent | 无 | ❌ `SubAgent` 枚举落通用卡片，零专属渲染 |
| 消息队列 | `useUnifiedChatQueue` + 排队面板 | ✅ 拖拽排序 / 编辑 / 立即发送 |
| 消息重试 | 无 | ❌ 仅复制按钮 |
| 会话密度设置 | 无 | ❌ 折叠策略已参数化但无用户偏好入口 |
| 三栏工作区 | 文件树 + 预览 Tab + VNC 电脑 | ✅（ConversationAgent 页） |

工具类型枚举全集（`src/types/enums/agent.ts:12-37`）：Plugin / Workflow / Knowledge / Variable / Table / Model / Agent / MCP / Page / PageApp / Event / Skill / **SubAgent** / ToolCall / **Plan** / ApiKey / Hook——除 Plan / Page / Event / diff / OpenUI 有专属渲染外，其余全部落「通用单行卡 + JSON 详情弹窗」。

---

## 3. 差距矩阵

| # | 缺口 | 市面对照 | 我们的现状 | 改造量 |
| --- | --- | --- | --- | --- |
| 1 | **终端/命令输出渲染** | 所有编码类 agent 标配（等宽折叠块 + 退出码） | Bash 工具落通用卡；xterm 控制台与消息流脱钩 | 中：`MarkdownCustomProcess` 新增分支 + `result.data` 协议约定 |
| 2 | **TodoList 交互** | Cursor/Devin 计划可编辑、扣子计划需确认、Manus 全量重写 | Plan 只读，无 x/y 概览、无确认门 | 小-中：进度摘要纯前端；确认门复用干预队列 |
| 3 | **子 agent 渲染** | Claude Code 折叠行（社区还嫌不够）、K3 并行协调 | 零专属渲染 | 中：渲染分支小；归属协议需后端确认 |
| 4 | 会话密度设置 | Cursor 三档密度 | 无 | 小：折叠基建已参数化 |
| 5 | 消息重试/重新生成 | 普遍标配 | 无 | 前端小；后端依赖强 |
| 6 | 工具耗时 | 多数产品单步耗时可见 | 只在 RunOver hover 弹层 | 小：`result.startTime/endTime` 已有 |
| 7 | diff 直达/side-by-side | Cursor/Devin | 点标题展开 diff，无文件树直达；固定 Unified | 小 |
| 8 | 流式自动跟随预览 | Cursor/Devin 跟随编辑文件 | 仅 Chat 页加载历史时预览最后 task-result | 小-中 |
| 9 | 状态条停止按钮 | 普遍标配 | 停止只在输入框 | 极小 |
| 10 | 会话回放分享 | Manus 签名功能 | 无 | 大（远期） |

---

## 4. 优先级结论

按「复用刚建立的折叠基建程度 × 用户感知 × 后端依赖」排序：

- **P0**：终端输出渲染、Plan 进度升级、工具耗时徽标——与文本协议/折叠组件完全同构，边际成本最低，且都是任务型 agent 高频感知项。
- **P1**：子 agent 渲染（先只读形态）、消息重试（等后端）、会话密度设置。
- **P2**：自动跟随预览、diff 直达/side-by-side、状态条停止、回放分享。

后端需确认三件事：① Bash 类工具 `result.data` 的实际形状；② PROCESSING 事件能否携带子 agent 归属标识；③ 重发消息接口是否存在。

各项的目标/验收/协议方案/演示场景设计，见 [agent-session-rendering-plan.md](./agent-session-rendering-plan.md)。
