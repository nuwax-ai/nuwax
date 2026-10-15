# 测试策略总览

一句话：**改哪个域，就跑那个域的门**；会话路径和脚本层有硬性门禁，其余按改动范围跑相关测试。

## 1. 测试分层

| 层 | 工具 / 位置 | 规模（2026-10-15） | 管什么 | 入口 |
| --- | --- | --- | --- | --- |
| 单元 / 组件 | vitest + jsdom；`tests/**`、`src/**/*.test.*`（setup：`tests/setupTests.ts`） | tests 209 个、src 197 个测试文件 | 纯函数、hook、组件行为、模型 reducer | `npx vitest run [路径]` |
| 会话合同网 | vitest，`test:conversation` 固定 15 个目录 | 约 20 秒 | 会话 runtime / 渲染 / 队列 / 介入等合同 | `npm run test:conversation` |
| 脚本层 | `node --test`，`tests/*.node.mjs`、`tests/microApps/*.node.mjs`、`scripts/check-types.test.mjs` | 7 个文件 + 类型门测试 | 提测脚本、微应用构建/升级流水线、doctor、类型门本身（git 夹具，不联网） | `npm run test:scripts` |
| 微应用适配合同 | `micro-frontends/*/adapter.test.ts`、`*.contract.*`（资料库路由用 `vitest.router.config.ts`） | 7 个 | 适配层生命周期、宿主路由/接口契约 | `npx vitest run micro-frontends` |
| 类型门 | `scripts/check-types.mjs` 分 4 域（nodes / conversation / workspace / contracts），基线 0 | — | 域内零新增 strict 错误；域外不受约束 | `npm run typecheck[:<域>]` |
| 分层门 | dependency-cruiser，存量基线 `.dependency-cruiser-known-violations.json` | 约 7 秒 | 禁止新增跨层依赖 / 循环 | `npm run lint:arch` |
| 真实页面 E2E | ego-browser，`scripts/e2e/*` | — | 合入前走查：会话真实页面、mock 场景回放 | `npm run e2e:conversation`（需 dev + 登录态）/ `e2e:mock-chat` |

## 2. 什么时候必须跑什么

| 改动范围 | 必跑 | 建议 |
| --- | --- | --- |
| 会话路径：`models/conversation*`、`features/conversation/**`、`UnifiedChatSession`、`MessageQueue`、`AgentIntervention`、`pages/Chat` | `test:conversation` 全绿；合入前 E2E | `typecheck:conversation` |
| 工作流画布（Antv-X6/v3、AgentFlowCanvas） | `typecheck:nodes` | 相关 `tests/workflow*` |
| AppDevPro | `typecheck:workspace` | — |
| 宿主桥 / 鉴权 / IM 契约类型 | `typecheck:contracts` | — |
| `scripts/**`、`deploy_test.sh`、`micro-frontends/**` | `test:scripts` | 微应用改动加跑 `sync:micro-apps` |
| 任意跨目录 import 调整 | `lint:arch` | — |
| 其他 | 相关目录 `npx vitest run <路径>` | 合并主干前 `npx vitest run` 全量 |

提测脚本步骤 4 自带 `test:conversation` 门（源码与已部署版本相同则跳过），提测前不必本地预跑。

## 3. CI

| 工作流 | 触发路径 | 内容 |
| --- | --- | --- |
| `conversation-tests.yml` | 会话路径 | `test:conversation` |
| `typecheck.yml` | 类型门覆盖路径 | `test:typecheck` + `typecheck` |
| `sdlc-evals.yml` | AGENTS / .claude / templates / plans / specs | SDLC hooks 样本回归 |

缺口：脚本层（`test:scripts`）和 `lint:arch` 还没有 CI 守门，已列入 [架构优化排查表](./architecture/optimization-roadmap.md)。

## 4. 写测试的约束

- vitest **不能 import umi 模块**（包括传递依赖），测试需 `vi.mock`；组件新增对 umi 导出的消费后，相关测试的 mock 要补导出，否则整文件崩。
- 自动请求和 UI 事件发起的 Promise 必须消费拒绝；断言里覆盖失败分支。
- 脚本测试用临时目录里的 git 夹具，**不访问网络、不碰真实子模块**；外部命令通过注入的 `execute` 替身控制。
- 重构类改动先补「锁行为」的测试，再改实现（见排查表的行为等价要求）。
