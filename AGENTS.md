# nuwax 前端(nuwax-frontend)

React 18 + TypeScript + umi max;中文交流与注释。包管理器 pnpm(`pnpm-lock.yaml`,脚本 npm/pnpm 均可跑)。桌面端 nuwax-client/nuwaclaw 经 webview 复用本仓库。

## 常用命令

- 开发:`npm run dev`(max dev;predev 跑 `doctor --quick` 提醒微应用产物/子模块问题,不拦截);构建:`build:prod` / `build:dev`;环境体检:`npm run doctor`(只读,子模块/pin/产物/工具链)
- 全量测试:`npx vitest run`(裸 `npm run test` 是 watch 模式);脚本层测试(提测/微应用构建升级/doctor/类型门,不联网):`npm run test:scripts`
- 会话合同网:`npm run test:conversation`;会话 E2E:`e2e:conversation`(需 dev server + ego-browser 登录态)、`e2e:mock-chat`(mock 场景走查);组合 `verify:conversation`
- 分层依赖检查:`npm run lint:arch`(depcruise;存量豁免基线 `.dependency-cruiser-known-violations.json`)
- 提交:husky 钩子自动 prettier;commit message 走 conventional(`type(scope): subject`,verify-commit 校验);`standard-version` 发版
- 同步测试部署:`bash scripts/deploy_sync_test.sh` —— 个人分支 → 版本分支(如 feat-2026.9.30,origin)→dev→test 级联合并+质量门+构建,推 gitlab/test 内网测试环境;配置 `scripts/deploy_sync_test.env`(模板 `scripts/deploy_sync_test.env.example`,`FEATURE_BRANCH`/`VERSION_BRANCH` 必填无默认,缺失时交互提示);`DRY_RUN=1` 演练、`INIT_ONLY=1` 只配置
- 快速提测:`bash deploy_test.sh` —— 代码已在 dev 时使用，本地汇合双远端 dev → test，自动升级微应用并过质量门，构建后推 origin/test+gitlab/test，不推远端 dev。全链与快速通道的选源、隔离、重试及冲突规则统一见 [提测手册](./docs/deploy-sync-test-runbook.md)。
- 提测提速三约定(2026-09-30):① 主区不干净时脚本自动转入 `.deploy-worktree` 隔离跑全链(主区/并行开发零互抢,`USE_WORKTREE=0/1` 控制)② 网络抖动(SSL 瞬断/fetch 断)脚本自动退避重试,勿手工重启整链;提测前**不再本地预跑质量门**(脚本步骤 4 即门,断点续跑免重付)
- 产物哈希稳定性(2026-10-08):① `src/constants/version.ts` 不再烤 git 哈希(只含 APP_VERSION/APP_NAME,随 standard-version 发版变);gitHash 由 `dist/version.json` 运行时读取,勿再向源码烤提交哈希 ② deploy 构建 `DIST_RETENTION=1` 自动保留上一版 dist 的旧哈希资源(默认 3 代,`DIST_RETAIN_GENERATIONS` 可调,机制见 `scripts/deploy-asset-retention.mjs`),防发版后旧页面 chunk 404 弹「资源加载失败」;本地构建不设该变量零影响 ③ webpack runtime 已抽 `runtimeChunk: 'single'`,增量发版未改动页面的缓存仍可命中

## 核心业务入口

- **会话**:`src/pages/Chat/**` —— 五入口复用 UnifiedChatSession(Chat / ConversationAgent 会话面板 / EditAgent 预览调试 / 插件 / 技能);术语口径 V1=旧线(legacy 数据+V1 渲染)/V2=新线(runtime 数据+V2 渲染),默认已全 V2;调试回切 `?conversationRuntime=0` 或 `?conversationRenderer=v1`
- **智能体平台**:EditAgent(编排 + AgentFlow)、ConversationAgent、AppDev/AppDevPro(Web IDE)、SpacePluginTool(插件)
- **目录速查**:`pages/` · `components/`(base / business-component) · `hooks/` · `services/` · `models/` · `utils/` · `features/conversation/`(会话新线)

## 质量门与硬约束

- 会话逻辑或会话测试改动：`test:conversation` 必跑全绿；改变会话行为或调整保护网时，合入前过对应 E2E。仅文案、样式、纯注释和文档按影响范围验证，不机械运行完整 E2E。CI(`.github/workflows/conversation-tests.yml`)继续守门。
- tsc 全库有预存错误基线,**不作门**(改动路径零新增即可);vitest 不能 import umi 模块(含传递依赖,测试需 mock)
- 自动请求和 UI 事件发起的 Promise 必须消费拒绝；请求层已提示的业务失败不能泄漏为全局未处理异常。账号解绑、验证码发码等失败后重试路径需用真实页面验证。
- 分层依赖禁令、命名、I18n 规范见 [docs/engineering-conventions.md](./docs/engineering-conventions.md);会话模块页面层只消费 `features/conversation/react/*`

## 测试与文档减负

- 自动化优先保护会话隔离与恢复、权限鉴权、支付授权、数据读写、部署及复杂解析/图算法/并发取消。修复这些路径的缺陷需有回归证据，优先复用已有测试；普通展示、文案、样式、简单透传默认不新增单测。
- 不以用例数量或覆盖率为目标，不为每个 helper、组件或 bug 机械建测试。重复覆盖只留有独有保护价值的层；不得用 skip、排除目录或放宽断言代替清理。
- 重构可使用已有自动化、产物对比或真实页面证明行为等价，不统一要求先新增单测或“失败测试先于修复”的提交序列。提测前不重复执行脚本已有的门。
- 文档只记录当前契约、操作步骤、非显然约束与未完成事项；Props/类型不复制成表。已完成计划、验收流水和失效快照提取有效结论后删除，历史查 Git；未完成或无法确认完成的材料保留。
- 注释解释业务原因、边界和兼容陷阱；删掉代码复述、开发过程与过期 TODO。许可证、编译/类型指令必须保留。规则在本节维护，测试入口见测试策略，不在组件 README 再复制流程。

## 关键文档

- [docs/getting-started.md](./docs/getting-started.md) —— 新同事上手(环境/子模块/日常循环)
- [docs/architecture/overview.md](./docs/architecture/overview.md) —— 架构总览(目录职责/分层/已知问题);[docs/architecture/optimization-roadmap.md](./docs/architecture/optimization-roadmap.md) —— 架构优化排查表(持续维护,改代码前先看红线与分级门)
- [docs/micro-apps-runbook.md](./docs/micro-apps-runbook.md) —— 微应用子模块操作手册(初始化/升级/patch 重制/排障);[scripts/README.md](./scripts/README.md) —— 脚本索引
- [docs/testing-strategy.md](./docs/testing-strategy.md) —— 测试分层与「改什么跑什么」
- [docs/conversation/README.md](./docs/conversation/README.md) —— 会话域总入口(ADR / 维护指南 / 验收清单 / 回归方案 / 行为细节)
- [docs/engineering-conventions.md](./docs/engineering-conventions.md) —— 命名 / 分层 / I18n
- `docs/ch/` —— 专项指南(SSE 实现、Markdown 渲染器、AgentFlow 设计等)

<!-- nuwa-sdlc-kit:begin v1（安装器托管区间，勿手工增删行；本节外的 AGENTS.md 内容归仓库所有） -->

## AI SDLC 规则层（slim）

- **小修直接改**：BUG 修复、小调整按行为风险判断，改前一句话说清「改什么、为什么」，改完跑受影响测试（入口：`pnpm exec vitest run`），不生成计划/规格工件，不按文件数量升级流程。
- **复杂需求最多一份计划**：跨模块、新契约或需拍板的需求，用 `templates/plan.md` 在 `plans/` 维护一份计划（已有计划直接更新）；不建 intent/spec 链。
- **按风险投入**：已覆盖路径的小修不强制新增测试，不为走流程写文档；重构可用已有测试或产物对比证明等价。
- **合并前查一遍**：大量代码合入主干前按 `REVIEW.md` 清单检查一次整个待合并批次；日常小 commit 不要求。
- **地板（hooks 强制，agent 无关）**：秘钥/受保护路径由 `.claude/hooks/guard-paths.mjs` 拦截（`.env*`/证书/credential 类拒读写，example 豁免）；发布/破坏性命令由 `.claude/hooks/deploy-gate.mjs` 分带拦截（force push 硬禁，发布类需 `NUWACLAW_APPROVE_DEPLOY=1` 批准，带配见 `.sdlc.json` deployGate）。
- **单一事实源**：本文件是正文（根 CLAUDE.md 已存在，建议人工收敛为单行 `@AGENTS.md` 指针）；勿复制出第二份。
- **非 Claude Code agent 兼容**：hooks 在 Claude Code 与 ZCode 均强制；codex / opencode / cursor 读本文件即可，规则即全部文字，无隐藏要求。

<!-- nuwa-sdlc-kit:end -->
