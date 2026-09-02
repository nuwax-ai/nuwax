# nuwax 前端(nuwax-frontend)

React 18 + TypeScript + umi max;中文交流与注释。桌面端 nuwaclaw 经 webview 复用本仓库。

## 常用命令

- 开发:`npm run dev`(max dev);构建:`build:prod` / `build:dev`
- 全量测试:`npm run test`(vitest)
- 会话合同网:`npm run test:conversation`(秒级);会话 E2E:`npm run e2e:conversation`(需 dev server + ego-browser 登录态);组合 `verify:conversation`
- 提交:husky 钩子自动 prettier;commit message 走 conventional(`type(scope): subject`,verify-commit 校验);`standard-version` 发版

## 核心业务入口

- **会话**:`src/pages/Chat/**` —— 五入口复用 UnifiedChatSession(Chat / ConversationAgent 会话面板 / EditAgent 预览调试 / 插件 / 技能);双轨 legacy/runtime,flag `?conversationRuntime=1`(默认 legacy)
- **智能体平台**:EditAgent(编排 + AgentFlow)、ConversationAgent、AppDev Web IDE、SpacePluginTool
- **目录速查**:`pages/` · `components/`(base / business-component) · `hooks/` · `services/` · `models/` · `utils/` · `features/conversation/`(会话新线)

## 质量门与硬约束

- 会话路径(`models/conversation*`、`features/conversation/**`、`UnifiedChatSession`、`MessageQueue`、`AgentIntervention`、`pages/Chat`)改动:`test:conversation` 必跑全绿;合入前过 E2E;CI(`.github/workflows/conversation-tests.yml`)自动守门
- tsc 全库 415 预存错误,**不作门**(改动路径零新增即可);vitest 不能 import umi 模块(含传递依赖,测试需 mock)
- 分层依赖禁令、命名、I18n 规范见 [docs/engineering-conventions.md](./docs/engineering-conventions.md);会话模块页面层只消费 `features/conversation/react/*`

## 关键文档

- [docs/conversation/README.md](./docs/conversation/README.md) —— 会话域总入口(ADR / 维护指南 / 验收清单 / 回归方案 / 行为细节)
- [docs/engineering-conventions.md](./docs/engineering-conventions.md) —— 命名 / 分层 / I18n
- `docs/ch/` —— 专项指南(SSE 实现、Markdown 渲染器、AgentFlow 设计等)

<!-- nuwa-sdlc-kit:begin v1（安装器托管区间，勿手工增删行；本节外的 AGENTS.md 内容归仓库所有） -->

## AI SDLC 规则层

- 需求 → 规格 → 计划链：skills `requirement-analysis` → `plans/*-intent.md`、`grill-with-docs` → `specs/<slug>.md` → Plan mode 产物 `plans/*-plan.md`（模板在 `templates/`）。
- 源码首改会被 `.claude/hooks/plan-gate.mjs` 追问一次计划工件（同会话只问一次；`NUWACLAW_SKIP_PLAN_GATE=1` 停用）；秘钥由 `.claude/hooks/guard-paths.mjs` 拦截（`.env*`/证书/credential 类拒读写，example 豁免）。
- PR 评审对照根目录 `REVIEW.md` 五遍清单（nit≤5；writer 不自批）。
- **单一事实源**：本文件是正文（根 CLAUDE.md 已是单行 `@AGENTS.md` 指针）；勿复制出第二份。

### 非 Claude Code agent 兼容

- 本文件、`templates/`、`REVIEW.md`、skills 正文全是纯 markdown：codex / opencode / cursor 等**直接读即可**；需要某条流程时让 agent `cat .claude/skills/<name>/SKILL.md` 照做。
- 强制机制差异：PreToolUse hooks 仅 Claude Code 执行；其他 agent 的兜底 = 提交前按同一规则自查，非协商护栏建议下沉 git pre-commit / CI（agent 无关的强制地板）。
- verifier 等价物：任何 agent 跑 `pnpm exec vitest run` 按报告格式贴结论即可，不必有子代理机制。

<!-- nuwa-sdlc-kit:end -->
