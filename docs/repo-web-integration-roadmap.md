# 资料库接入：后续计划与状态跟踪

> 单一状态源：本文跟踪接入交付后（`5a19a419a`）的全部后续事项，**完成一项即更新状态**（带提交号/日期）。规则源分工：集成契约见 [repo-web-integration.md](./repo-web-integration.md)（§6 后端协作项与其重叠，契约管规则、本文管状态）；全景总结见 [repo-web-integration-summary.md](./repo-web-integration-summary.md)（交付时点快照，不再滚动）。状态图例：⬜ 未开始 · 🚧 进行中 · ⏸ 等待外部（后端/子仓/运维）· ✅ 已完成（附提交/日期）· 🚫 关闭不做

## 0. 已完成基线（2026-09-04，feat/repo-web-integration@5a19a419a）

| 项 | 状态 |
| --- | --- |
| submodule 引入 + sync/upgrade 脚本 + `/repo-entry` 入口 + 契约/总结文档 | ✅ |
| dev 代理（平台命名空间 → testagent）+ dev 鉴权桥（ticket 镜像） | ✅ 实测数据链路通 |
| 两轮 code-reviewer 评审（无 P0/P1，P2 全修）、test:conversation 458 全绿 | ✅ |
| 浏览器验收：列表加载 → 文档打开（/repo/doc/:slugId） | ✅ |

## 1. B 阶段：运行时融合（请求/登录/上下文）

| # | 事项 | 归属 | 状态 | 备注 |
| --- | --- | --- | --- | --- |
| B1 | 子仓 `src/lib/platform.ts` 平台适配器：收口 cookie 读取 / 4010/4011 登录跳转 / API_BASE 三处散点 | 子仓 | ⏸ 对方排期 | v0 不依赖；落地后 B2/B4/B5 才有消费端 |
| B2 | 宿主 `window.__NUWA_HOST__` 预留注入（token/locale，结构见契约 §2.3） | 主仓 | ⬜ | 可先行（无消费者也无害），建议与 B1 落地同批生效 |
| B3 | 登出联动清 `ticket` | **后端** | ⏸ 待对齐 | **2026-09-04 定调：后端行为**——登出接口 Set-Cookie 失效 ticket（dev 经代理、生产同源均覆盖），前端不处理 |
| B4 | 请求拦截行为对齐（Accept-Language / 错误 toast 去重 / 未登录重定向语义向主仓 common.ts 靠拢） | 子仓（适配器内实现） | ⬜ | 依赖 B1 |
| B5 | 主题 design tokens 与 locale 传递（主仓语言键 ↔ 子应用） | 主仓+子仓 | ⬜ | 依赖 B1/B2 |
| B6 | 桌面端 nuwaclaw webview：`/repo/` 加载时的 bridge token 注入与宿主能力适配 | 主仓+客户端 | ⬜ | 需先实测 webview 下表现 |
| B7 | 权限模型边界：主仓菜单/按钮权限（resourceTree）与资料库文档级权限的分工与传递 | 设计+后端 | ⬜ | 契约 §4-4 |
| B8 | 监控埋点/错误上报通道统一 | 主仓+子仓 | ⬜ | 契约 §4-5 |
| B9 | **qiankun 布局内嵌试点**（2026-09-17）：主站侧栏常驻+内容区加载子应用，形态由整页挂载演进；通用契约沉淀 [micro-frontend-qiankun.md](./micro-frontend-qiankun.md)，dev 链路全通（挂载/数据/深链/前进后退/卸载/WS/视觉），生产化步骤待立项 | 主仓+子仓 | 🚧 dev PoC ✅ | 代码在双仓本地分支未推：主仓 `feat/repo-web-qiankun`、子仓 `feat/qiankun-slave`（未 bump pin）；观察项=portal→doc 首跳 update-depth、document.title 改写 |

## 2. 环境与协作项（非本仓代码）

| # | 事项 | 归属 | 状态 | 备注 |
| --- | --- | --- | --- | --- |
| E1 | 测试环境「菜单管理」配置：code=`repo`、name=资料库、path=`/repo-entry`、openType=当前窗口 | 环境配置 | ⬜ | 配完菜单入口即现；**不能配 `/repo/` 原始路径**（会落 iframe 机制） |
| E2 | `/repo/ws` 协作 WS 网关路由（testagent + 生产 ingress） | 后端 | ⏸ | dev 代理已就位且已见 upgrade 流量，路由落地即生效；多人协作编辑依赖此项 |
| E3 | 生产 nginx `location /repo/ { try_files $uri $uri/ /repo/index.html; }` | 运维 | ⏸ | history 路由深链刷新必需（契约 §6-5） |
| E4 | 生产构建管线前置 `npm run sync:repo-web` + CI 适配（runner 装 pnpm、submodule checkout 凭据） | 工程 | ⏸ | 产物 gitignore，checkout 不带（契约 §6-6） |
| E5 | 移动端语义决策（`/repo-entry` 移动 UA 被主站脚本跳 `/m/`，接受或豁免） | 产品 | ⬜ | 契约 §2.1 已登记现状 |

## 3. C 阶段：同构化（战略可选，未立项）

触发条件：产品拍板同构化。届时二选一路线，契约与 `/repo-entry` 稳定入口均无需推翻。

| # | 事项 | 状态 |
| --- | --- | --- |
| C1 | 共享包策略（@nuwax/request、utils、UI 包；私仓 npm 或 monorepo workspace） | ⬜ 未评估 |
| C2 | 组件生态统一评估（子应用组件体系 vs 主仓 antd 体系） | ⬜ 未评估 |
| C3 | 能力互用（file-preview 静态预览、上传等） | ⬜ 未评估 |

## 维护约定

- 每完成一项：状态改 ✅ 并在备注补提交号/日期；外部依赖到位（如 E2 路由落地）也在此更新并同步契约 §6。
- 新增后续事项：先入本文再动工（与 plan 工件不冲突——本文是跨阶段跟踪器）。
- 决策记录：涉及职责边界的定调（如 B3 后端行为）写进备注并同步契约，避免口径漂移。
