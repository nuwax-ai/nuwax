# 测试策略

按改动风险选择验证，复用已有测试。资产保留与新增规则以 [AGENTS.md](../AGENTS.md#测试与文档减负) 为准，不追求文件数、用例数或覆盖率。

## 改什么跑什么

| 改动 | 验证入口 |
| --- | --- |
| 会话逻辑 / 会话测试 | `npm run test:conversation`；行为或保护网变化合入前跑对应 E2E；按需 `typecheck:conversation` |
| 工作流图与保存逻辑 | 相关 `tests/workflow*` 或节点测试 + `typecheck:nodes` |
| AppDevPro 逻辑 | 相关测试 + `typecheck:workspace` |
| 宿主桥 / 鉴权 / IM 类型契约 | 相关合同测试 + `typecheck:contracts` |
| 部署 / 构建 / 微应用脚本 | `npm run test:scripts`；适配输入改变时加构建验证 |
| 跨目录 import | `npm run lint:arch` |
| 样式 / 文案 / 注释 / 文档 | 页面走查、格式与引用检查；不机械补单测或跑全套 E2E |
| 测试资产批量精简 | 剩余全量 `pnpm exec vitest run`；会话子集成功证据按下文复用，行为或保护网变化跑对应 E2E；命令和配置引用不能悬空 |

提测脚本自带会话门及成功缓存，提测前不要重复预跑。普通改动跑相关域，只有跨域影响或批量测试调整才跑全量。

同一源码、测试配置、依赖与运行环境下，已核对全量收集集合包含当前会话集合且全量全部通过时，可复用为会话子集的成功证据，不再重复运行相同用例。E2E 按会话行为与保护网的实际变化执行，不能由单测结果替代。

## 工具与约束

- Vitest 收集 `tests/**`、`src/**/*.test.*` 与宿主适配合同；共用 `tests/setupTests.ts`。子仓测试由各自管线执行。
- `test:conversation` 的收集范围统一在 `vitest.conversation.config.ts` 声明，并继承公共 Vitest 配置；变更范围时对比收集清单，确认原有用例和就地会话测试仍被收集。
- `test:scripts` 使用 `node --test`，以临时 git 夹具验证部署、微应用升级、doctor 与类型门，不联网、不操作真实子模块。
- Vitest 不能经传递依赖加载 umi；替换网络和宿主边界，保留被测行为。不要搭建通用 mock 框架。
- 请求失败必须消费拒绝；自动化应断言保留输入、允许重试及无错误成功副作用，而非只断言 mock 被调用。
- 类型检查使用分域 `typecheck`。全库 tsc 的历史诊断不作为门，改动路径零新增。
- E2E：`e2e:conversation` 需要 dev server 与登录态；`e2e:mock-chat` 使用本地供数，保留数据线 × 渲染线验证，不需要真实账号。
- 历史滚动使用 `E2E_CHAT_URL=http://localhost:3000/home/chat/<会话ID>/<智能体ID> npm run e2e:history-scroll`：需要登录态及至少两页历史，只读取会话；覆盖两条数据线的历史前插和加载期间/落地后的主动滚动。可用 `E2E_BASE_URL` 指定开发端口，结果写入临时目录 `nuwax-history-scroll-acceptance.json`。

CI 现有 `conversation-tests.yml` 和 `typecheck.yml` 继续运行。脚本层及分层 CI 的后续安排见 [架构排查表](architecture/optimization-roadmap.md)，本次不增加新门禁。
