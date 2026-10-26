# 测试策略

按改动风险选择验证，复用已有测试。资产保留与新增规则以 [AGENTS.md](../AGENTS.md#测试与文档减负) 为准，不追求文件数、用例数或覆盖率。

## 保留什么

- 会话状态、隔离、断线恢复、消息队列、终态迟到事件和权限审批。
- 登录鉴权、支付授权、文件与数据保存、失败重试和防重复提交。
- 部署、微应用宿主契约，以及解析、图算法、并发、代际和取消等复杂逻辑。
- 相同场景保留依赖最少、最接近实际行为的一层；其他层只补独有边界。UI 测试中有这些场景时保留关键用例。

普通展示、图标、文案、CSS 字符串、布局插槽、简单透传和纯示例页不单独写自动化。样式效果用页面走查；不要用源码字符串断言代替实际布局验证。

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
| 测试资产批量精简 | 剩余全量 `pnpm exec vitest run`，涉及会话再跑会话门及相应 E2E；命令和配置引用不能悬空 |

提测脚本自带会话门及成功缓存，提测前不要重复预跑。普通改动跑相关域，只有跨域影响或批量测试调整才跑全量。

## 工具与约束

- Vitest 收集 `tests/**`、`src/**/*.test.*` 与宿主适配合同；共用 `tests/setupTests.ts`。子仓测试由各自管线执行。
- `test:conversation` 使用文件路径子串过滤，不是目录枚举；变更入口时确认核心文件仍被收集。
- `test:scripts` 使用 `node --test`，以临时 git 夹具验证部署、微应用升级、doctor 与类型门，不联网、不操作真实子模块。
- Vitest 不能经传递依赖加载 umi；替换网络和宿主边界，保留被测行为。不要搭建通用 mock 框架。
- 请求失败必须消费拒绝；自动化应断言保留输入、允许重试及无错误成功副作用，而非只断言 mock 被调用。
- 类型检查使用分域 `typecheck`。全库 tsc 的历史诊断不作为门，改动路径零新增。
- E2E：`e2e:conversation` 需要 dev server 与登录态；`e2e:mock-chat` 使用本地供数，保留数据线 × 渲染线验证，不需要真实账号。
- 历史滚动使用 `E2E_CHAT_URL=http://localhost:3000/home/chat/<会话ID>/<智能体ID> npm run e2e:history-scroll`：需要登录态及至少两页历史，只读取会话；覆盖两条数据线的历史前插和加载期间/落地后的主动滚动。可用 `E2E_BASE_URL` 指定开发端口，结果写入临时目录 `nuwax-history-scroll-acceptance.json`。

CI 现有 `conversation-tests.yml`、`typecheck.yml` 和 `sdlc-evals.yml` 继续运行。脚本层及分层 CI 的后续安排见 [架构排查表](architecture/optimization-roadmap.md)，本次不增加新门禁。
