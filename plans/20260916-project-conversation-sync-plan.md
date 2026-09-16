# 实施计划：project-conversation-sync

- 对应 spec：specs/project-conversation-sync.md
- 状态：实施完成（自动化回归已完成，浏览器 E2E 待测试环境验证，2026-09-16）

## 改动文件清单

| # | 文件 | 动作(增/改/删) | 说明 |
| --- | --- | --- | --- |
| 1 | `src/types/directorySync.ts` | 增 | 领域事件与实体身份类型 |
| 2 | `src/types/enums/event.ts`、`src/constants/event.constants.tsx` | 改 | 注册两个新事件名 |
| 3 | `src/utils/directorySyncEvents.ts` | 增 | 类型化总线、旧通道桥接、纯补丁助手 |
| 4 | `src/hooks/useDirectorySync.ts` | 增 | React 订阅封装 |
| 5 | `src/app.tsx` | 改 | 显式安装旧通道桥接 |
| 6 | `NewHomeSection/useHomeSectionData.ts`、`ProjectPanel/index.tsx` | 改 | 侧栏消费与子会话失效竞态保护 |
| 7 | 会话 legacy/runtime 更新链 | 改 | 自动标题与当前详情同步 |
| 8 | 项目/会话 CRUD 调用点 | 改 | 成功后单次发领域事件 |
| 9 | 管理页、历史页、项目详情、AppDevPro | 改 | 补丁或静默重拉消费 |
| 10 | 相关测试与 docs | 增/改 | 协议、竞态、双线和页面回归 |

## 实施顺序

1. 先写协议、桥接和纯函数测试，再实现底座。
2. 接入 `useHomeSectionData` 与 `ProjectPanel`，完成侧栏端到端闭环和请求竞态测试。
3. 接入会话自动标题、状态与详情标题双线。
4. 接入项目/会话创建、改名、删除发射点。
5. 接入管理页、历史页、项目详情和 AppDevPro 等次级消费者。
6. 跑分层检查、会话合同网、相关测试与全量 vitest；修复触达路径新增问题。

## 证明成立的测试

- 新增测试：`tests/directorySyncEvents.test.ts`、ProjectPanel 事件与竞态用例、双线标题事件用例。
- 回归范围：`npx vitest run`、`npm run test:conversation`、`npm run lint:arch`。
- 手工验证：style1/2/3 侧栏及 AppDevPro/Chat 当前详情。

## 风险与回退

| 风险 | 缓解 | 回退方式 |
| --- | --- | --- |
| 旧/新事件重复 | 单向桥接、单业务事件、幂等补丁 | 移除新消费者并保留旧通道 |
| 子会话旧响应覆盖 | per-project revision + dirty 补拉 | 回退为事件后直接全页重拉 |
| 调用点遗漏 | `rg` 全仓核对 CRUD 调用点并记录 | 保留静默刷新兜底 |
| 双线行为不一致 | legacy/runtime 分别测试 | 单独回退对应线发射点 |

## 偏离记录

- 领域协议由原方案的多个细粒度事件收敛为 `conversation.changed` 与 `project.changed` 两个判别联合事件；旧事件只做单向桥接，避免同一业务写操作重复广播。
- `npm run test:conversation` 已通过：86 个文件、767 项测试全绿；本方案相关定向回归 7 个文件、48 项测试全绿。
- `npm run build:dev` 已通过，Webpack 编译成功。
- 全量 `npx vitest run` 未全绿：仓库当前存在 22 个失败文件、48 个失败用例及 runtime 测试未 mock `umi.request` 引发的未处理错误；已确认本任务质量门和定向用例通过，失败集中在 MarkdownRenderer、SidebarSearchModal 及既有 runtime 页面测试。
- `npm run lint:arch` 仍有 2 条 `SpaceProjectManage -> AppDevPro` 违规；两条 import 在本次起始 HEAD 已存在，本方案未新增跨页面依赖。
- 未启动登录态 dev server 执行 style1/2/3 浏览器 E2E，保留为测试环境验收项。
