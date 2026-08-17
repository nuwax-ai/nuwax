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
