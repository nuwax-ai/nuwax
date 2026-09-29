# 乾坤接入方案调研与消息、资料库选型

调研日期：2026-09-29。范围：Nuwax PC 主站、消息 PC 前端、资料库前端，以及 Nuwax 客户端的 loopback 集成。

本文以当前锁定的 `qiankun@2.10.17-beta.0`、Umi Max 4 和实际仓库实现为依据。加载方式、资源入口、发布方式和源码适配是不同维度，可以组合；不能把它们相加得出一个“乾坤共有多少种方案”的数字。

## 1. 加载方式：乾坤核心有两种

| 方案 | 接入 API | 加载与卸载由谁控制 | 适用场景 | 对本项目的取舍 |
| --- | --- | --- | --- | --- |
| 路由自动激活 | `registerMicroApps` + `start` | 乾坤根据 `activeRule` 匹配浏览器 URL，驱动挂载、卸载 | URL 决定当前应用；切换应用时可以释放页面实例 | 可以接入，但默认切出卸载不符合编辑状态、消息草稿的保活要求，需要另加状态恢复或保活策略 |
| 手动加载 | `loadMicroApp` | 主站持有实例，决定挂载、更新、卸载 | 页面插槽、多个实例、菜单保活、自定义生命周期 | **当前采用**；生命周期管理代码更多，但能明确控制实例何时释放 |

这两种是官方 API 的分类；手动加载同样可以承载有路由的完整业务应用，由宿主和子应用约定路由同步。[乾坤 2.x API](https://umijs.github.io/qiankun/zh/api/)、[快速上手](https://umijs.github.io/qiankun/zh/guide/getting-started/)。

### Umi 插件提供的三种引入形式

Umi 在乾坤之上还提供以下封装，属于开发接口层的选择。

| 形式 | 特点 | 当前使用情况 |
| --- | --- | --- |
| 路由配置 `microApp` | 把某段 Umi 路由交给子应用组件 | 本项目的业务路由没有采用这种挂载方式 |
| `<MicroApp />` | 在组件内引入子应用，并同步父子路由 | 当前宿主自行调用 `loadMicroApp` |
| `<MicroAppWithMemoHistory />` | 显式传子应用 URL，使其路由与父应用路由解耦 | 资料库使用自己的 MemoryRouter 和 props 合同，没有使用这个 Umi 组件 |

以上三种形式见 [Umi Max 微前端文档](https://umijs.org/docs/max/micro-frontend/)。仅配置 `qiankun.master.apps` 不能判断最终的实例加载方式，仍要看路由和宿主实现。

当前 [配置文件](/Users/apple/workspace/nuwax/config/config.ts:40)启用了 Umi qiankun master；实际挂载来自 [MicroAppHost](/Users/apple/workspace/nuwax/src/layouts/MicroAppHost/index.tsx:66) 的 `loadMicroApp`。

## 2. 资源入口：两种形式

| 入口形式 | 含义 | 优点 | 维护成本 |
| --- | --- | --- | --- |
| HTML Entry | `entry` 指向子应用 HTML，由入口描述页面和资源 | 子应用构建自然产出 HTML；带哈希的 JS/CSS 随构建更新 | 必须保证资源地址、生命周期和入口内容正确 |
| 资源配置对象 | `entry` 直接配置 `html`、`scripts`、`styles` | 可以接入没有标准 HTML 入口的资源 | 需要自行维护资源列表、加载顺序和动态资源路径 |

两种形式都能用于前面的加载 API；资源入口形式也不决定是否独立部署。[入口类型说明](https://umijs.github.io/qiankun/zh/api/)。

**当前使用 HTML Entry**：

- 消息：`/micro-apps/message/index.html`。
- 资料库：`/micro-apps/repo/index.html`。

两个子应用都通过适配入口导出 `bootstrap`、`mount`、`unmount`、`update`。这里的 `update` 是宿主向现有实例传递路径、显示状态等 props，不会拉取远程 Git 分支，也不是在线升级子应用版本。

## 3. 构建与发布：三种常见组织方式

这三种是项目发布组织方式的比较，不是乾坤官方限定的三种 API。

| 方案 | 构建与交付 | 更新方式 | 优点 | 成本及约束 |
| --- | --- | --- | --- | --- |
| A. 主站构建子应用，统一发布 | 主站取固定子仓提交，构建后合并到同一份 `dist` | 更新固定提交和适配层，再重建主站产物 | Web、客户端共用完整资源包；来源可追溯；资源可以由 loopback 本地提供 | 主站构建需要子仓源码、依赖与相应 Node 工具链；子应用资源升级要交付新产物 |
| B. 子应用产出版本包，主站装配发布 | 子仓 CI 生成带生命周期的版本包；主站按固定版本下载并合入 `dist` | 发布子应用版本包，再更新主站的包版本记录 | 子应用构建职责回归子仓；仍能给客户端打完整本地包 | 需要版本包仓库、校验摘要和明确的装配合同；客户端仍需更新所消费的资源包 |
| C. 子应用独立托管，运行时加载 | 子应用分别部署；宿主加载其远程入口。可用同域反向代理，也可使用独立域名/CDN | 发布远程入口和资源；新加载或重挂实例消费对应版本 | 可独立发布子应用，减少主站资源装配 | 需要版本兼容、缓存、网络可用性和回滚设计；跨域时还需 CORS；客户端无法仅依赖随包资源提供这些子应用 |

乾坤读取的是 `entry` 所指向的前端资源，而不是 Git 分支。即使采用 C，给远程 `main` 提交代码也不等于发布了子应用；仍需要构建和部署。已经保活的实例通常继续执行已加载代码，升级时还需设计刷新、重挂及未保存内容的处理。

**当前采用 A**。两套子应用同源放在主站静态目录，与移动端 H5 的“独立子目录、完整产物统一交付”形态一致。`/m/` 继续用于移动端；PC 消息和资料库放在 `/micro-apps/`。

```text
dist/
├── index.html                       # 主站 HTML
├── umi.<hash>.js / css               # 主站资源
├── version.json                     # 主站来源提交
├── m/                               # build:prod:m 额外装入的移动端 H5
└── micro-apps/
    ├── manifest.json                # 两套子应用来源与适配摘要
    ├── message/
    │   ├── index.html
    │   ├── version.json
    │   └── assets/                  # 消息 JS、CSS 等
    └── repo/
        ├── index.html
        ├── version.json
        └── assets/                  # 资料库 JS、CSS 等
```

普通 `build:prod` 包含消息和资料库，不自动生成 `m/`。用户访问 `/instant-message/*`、`/repo/*` 时，先进入主站布局，再由主站加载子应用静态入口。部署服务应让业务深链回到主站 HTML，让 `/micro-apps/` 内不存在的资源返回 404。

## 4. 子仓源码接入：三种组织方式

| 方式 | 适配代码放在哪里 | 优点 | 代价 |
| --- | --- | --- | --- |
| 在上游子仓原生支持乾坤 | 子仓维护生命周期、宿主路由和会话合同 | 子仓能自行验证和发布微应用形态 | 需要子仓团队接受并维护集成合同 |
| 使用独立集成分支或 fork | 集成分支维护源码差异 | 可以直接调试适配源码 | 上游升级需要持续合并，容易积累分支差异 |
| 主仓维护 patch + overlay | 子仓保持固定 main 原始源码；隔离副本应用适配后构建 | 业务来源与宿主适配可分别追溯，集中维护当前集成 | 上游修改被 patch 或 overlay 覆盖的文件时，需要主动重审适配 |

**当前使用主仓 patch + overlay**。消息来源是独立仓库 `nuwax-im` 中的 `nuwax-im-web/` PC 前端，构建只作用于这个前端目录；资料库来源是 `nuwax-repo-web`。消息后端不参与本次适配。

构建流程为：固定 gitlink → `git archive` 到隔离目录 → 校验并应用 patch → 复制 overlay → 冻结依赖安装 → 类型检查与资产构建 → 发布到 `public/micro-apps` → 主站复制到 `dist/micro-apps`。原始子模块工作区不会被应用适配或安装构建依赖。

当前宿主开启 `sandbox: true`，没有开启 Shadow DOM 或乾坤的实验性样式隔离；样式、弹层容器和全局副作用由适配层另外约束。乾坤文档区分普通沙箱、`strictStyleIsolation` 和 `experimentalStyleIsolation`，不能仅凭打开 JS 沙箱推断全局 CSS、弹层与事件已经隔离。[沙箱配置说明](https://umijs.github.io/qiankun/zh/api/)。

## 5. 上游 main 更新后会发生什么

### 当前不会自动升级

`.gitmodules` 中的 `branch = main` 标明上游来源，但每次构建真正读取的是**主仓 Git index 中的固定 gitlink SHA**，并要求它与对应 `adapter.json.pin` 一致。[来源校验实现](/Users/apple/workspace/nuwax/scripts/sync-micro-apps.mjs:159)。

| 操作 | 当前构建行为 |
| --- | --- |
| 上游远程 main 新增提交 | 没有自动影响；已生成的 Web/客户端资源也不会改变 |
| 只执行主站 build | 仍构建当前固定提交，不会 fetch、checkout 或自动升级子仓 |
| 只在子仓 pull，或执行 `git submodule update --remote` | 子仓 HEAD 可能变化，但主仓 index 未更新时，构建仍读取旧 gitlink |
| 只暂存新 gitlink，未同步 adapter pin | 固定提交校验失败，构建中止 |
| 更新并暂存新 gitlink，同时同步 pin 和必要适配 | 使用新固定提交；仍须通过 patch、类型、构建与功能验收 |

本次核查的固定提交如下，未 fetch 远端确认最新 main：

| 应用 | 固定 main SHA | pin 配置 |
| --- | --- | --- |
| 消息 | `f7fd703688aba50573621f9ee8e32ecf0ef9f75c` | [message/adapter.json](/Users/apple/workspace/nuwax/micro-frontends/message/adapter.json:7) |
| 资料库 | `1d9f19162d3991ca693e5e79758b3bc6943e6e7e` | [repo-web/adapter.json](/Users/apple/workspace/nuwax/micro-frontends/repo-web/adapter.json:7) |

### 升级流程

已提供单个/全部升级入口：`npm run upgrade:micro-apps -- message`、`repo` 或 `all`；加 `--dry-run` 先获取 main 并预检。脚本同步固定提交与 pin，并暂存构建所需条目；使用方法、失败恢复和边界见 [升级脚本说明](/Users/apple/workspace/nuwax/docs/micro-frontend-qiankun.md)。

1. 使用干净、可恢复的集成工作区，保留已有 WIP；分别 fetch 上游 main，审查变化并选定明确 SHA。
2. 将对应子模块检出到审核通过的 SHA，同步修改 `adapter.json.pin`。审查新源码与 patch、overlay 的差异，必要时重做适配。
3. **先暂存新 gitlink 和本批适配文件，再验证构建**；只改子仓 HEAD 不会改变脚本读取的 index。
4. 运行构建合同测试与生产构建，再检查登录、深链、保活、消息收发、资料编辑、两应用 WS、退出和账号切换。patch 能应用不代表业务合同兼容。
5. 将 gitlink、pin 和适配作为同一批变更提交。交付前从最终提交重新构建，核对主站 `version.json` 与子应用 `manifest.json`，避免交付时使用提交前的来源戳。
6. 更新 Web 发布产物；客户端则同步更新其前端源码和产物 pin，并完成客户端验收后交付。

主站的构建验证命令：

```bash
npm run test:micro-app-build
npm run build:prod
```

资料库目前以同一冻结依赖比较原始 main 和适配副本的类型诊断，只接受适配新增 0 条；消息执行其正常 `tsc -b && vite build`。上游升级后的类型诊断、API、路由、鉴权、WS、弹层坐标、标题副作用和卸载清理，都需要重新核查。

## 6. 对 Nuwax 客户端 loopback 的影响

结论是：**可以继续使用 loopback 架构，但现有客户端升级到这份乾坤前端时，需要同步调整路由和源码构建初始化。当前并非可以直接换一份 dist 就完成客户端接入。**

### 6.1 当前客户端资源不会被这次主站 build 自动替换

2026-09-29 核查 `/Users/apple/workspace/nuwax-client`：

- 分支：`release/v1.0.x`。
- 前端源码 pin：`4955285f2a0a2e54c2839862dfc59a5b52562c6f`。
- 前端产物 pin：`a4cbde623f88b7ae751d178fb2ff28002d780ace`。
- `nuwax-dist/version.json.gitHash` 为 `4955285f2a`，该产物没有 `micro-apps/`，尚未包含本次接入。

当前开发态网关优先读取 `NUWAX_FRONTEND_DIST`，默认回落到客户端仓库的独立 `nuwax-dist`；打包态读取 `resources/nuwax-dist`。[目录解析](/Users/apple/workspace/nuwax-client/overlay/crates/agent-electron-client/src/main/services/loopbackGateway/index.ts:146)。因此 `/Users/apple/workspace/nuwax/dist` 与客户端默认所消费的产物是两份目录。

客户端检查源码与产物双 pin，并核对产物版本戳。[双 pin 校验](/Users/apple/workspace/nuwax-client/scripts/client/prepare.mjs:124)。远程 main 变化或在主工作区执行 build，都不会自动更新客户端的这两个 pin。

### 6.2 现有架构能沿用的部分

客户端打包将完整前端目录复制到 `resources/nuwax-dist`，过滤规则包含全部资源，因此包含 `micro-apps/` 的新产物可以沿用这一复制方式。[打包规则](/Users/apple/workspace/nuwax-client/scripts/client/pack.mjs:66)。

loopback 静态服务能按目录读取现有 HTML、JS、CSS；`/api/repo`、`/api/instant-message` 已属于 `/api` 反代范围。两条 WS 由统一 upgrade 代理处理，不走普通 HTTP 的 SPA fallback。[HTTP 与 WS 分流](/Users/apple/workspace/nuwax-client/overlay/crates/agent-electron-client/src/main/services/loopbackGateway/gateway.ts:619)。

子应用加载前会同步桌面宿主会话；生产子应用使用平台 Cookie。这个合同与现有 loopback 会话体系方向一致，但登录成功和 WS 实际握手仍需 Electron 验收。[会话准备](/Users/apple/workspace/nuwax/src/utils/businessAuth.ts:42)。本地资源包也仍然依赖在线业务 API、协作服务和消息服务。

### 6.3 已确认的三个缺口

| 缺口 | 当前源码行为 | 升级后的影响 | 所需调整 |
| --- | --- | --- | --- |
| 业务路由整段反代 | `MICROAPP_BACKEND_PREFIXES` 包含 `/instant-message`、`/repo`；HTTP 先判断这些前缀，再决定是否读取本地 dist | 刷新或直接访问新主站业务深链时，被送到后端旧页面 | 收窄到真正的后端 API、WS、内部服务路径，使业务深链进入主站入口 |
| 资源请求的页面归属判断 | `routingPolicy` 把路径匹配这些前缀的 frame 判定为后端页面，把其本地资源归一到 `/__backend/...` | 在消息或资料库页面加载 `/micro-apps/`、主站懒加载 chunk 等资源时，可能错误取后端资源 | 与 HTTP 前缀同时调整页面归属规则，确保乾坤页面中的本地资源保持本地 URL |
| 子模块初始化不完整 | 客户端源码构建、prepare 和发布 CI 只初始化顶层子模块，没有初始化前端里的两套子仓 | 干净环境首次构建新前端时，找不到固定子仓提交；新的主站构建脚本不会替客户端补拉取 | 初始化固定的两层子模块，确保构建环境能访问 `git.yichamao.com`，校验提交和本地 main 历史 |

证据：

- [旧页面反代前缀](/Users/apple/workspace/nuwax-client/overlay/crates/agent-electron-client/src/main/services/loopbackGateway/index.ts:51)、[HTTP 前缀判断](/Users/apple/workspace/nuwax-client/overlay/crates/agent-electron-client/src/main/services/loopbackGateway/gateway.ts:633)。
- [资源归一规则](/Users/apple/workspace/nuwax-client/overlay/crates/agent-electron-client/src/main/services/loopbackGateway/routingPolicy.ts:164)。只读纯函数核查中，frame 为 `/repo/doc/7` 或 `/instant-message` 时，同一个 `/micro-apps/repo/assets/index-example.js` 被重定向到 `/__backend/business.example/micro-apps/repo/assets/index-example.js`；frame 为 `/home` 时不重定向。示例域名和资源名用于规则验证，没有发起业务请求。
- [源码构建初始化](/Users/apple/workspace/nuwax-client/scripts/client/frontend.mjs:19)、[prepare 初始化](/Users/apple/workspace/nuwax-client/scripts/client/prepare.mjs:120)、[发布 CI](/Users/apple/workspace/nuwax-client/.github/workflows/release-electron-dev.yml:138)。

### 6.4 新前端在 loopback 中需要满足的路径合同

下表是升级目标，不表示当前客户端已全部满足。

| 请求范围 | 应有行为 |
| --- | --- |
| `/micro-apps/message/*`、`/micro-apps/repo/*` | 读取本地 dist，资源不存在返回 404，不归一到后端或回落成主站 HTML |
| `/repo`、`/repo/*` 的业务页面 | 返回本地主站 HTML，由 SidebarShell 挂载资料库 |
| `/instant-message`、`/instant-message/*` 的业务页面 | 返回本地主站 HTML，由 SidebarShell 挂载消息 |
| `/api/*`、`/repo/internal/*` | 保留对应后端 HTTP 转发；不能在收窄业务前缀时误删这些服务路径 |
| `/repo/ws`、`/instant-message/ws` | 保留 WS upgrade、Cookie 与业务 Origin 合同 |
| 主站 JS/CSS、动态 chunk | 无论当前浏览器 pathname 是哪一个子应用，都从本地正确加载 |

客户端路由调整和前端产物升级需要共同交付；还消费旧版后端页面/iframe 产物的客户端必须保留对应旧路由行为。升级可以按前端能力或产物版本区分策略，并保留其它后端页面所需的显式后端命名空间。

## 7. 当前验证证据和未完成项

| 项目 | 本次可确认的状态 |
| --- | --- |
| 主站生产构建 | `npm run build:prod` 成功；主站来源 `f04627d51b`；`dist/version.json.buildAt = 2026-09-29T02:20:01.115Z` |
| 子应用交付完整性 | 主站产物包含两套 HTML、JS、CSS、版本清单；`public/micro-apps` 与 `dist/micro-apps` 的 143 个文件逐字节一致 |
| 类型门 | 资料库 main 72 / 适配 72 / 新增 0；消息正常类型检查及构建通过 |
| 资源查看 | 消息 JS 附带 4 个 source map；当前主站和资料库产物没有 source map |
| 客户端兼容核查 | 已只读核对当前源码、双 pin、路径分流和资源归一规则；确认前述三个升级缺口 |
| 客户端实际验收 | 升级后的 Electron 运行、登录/退出/换账号、两条 WS、安装包内资源、深链刷新尚未完成验收 |
| 线上发布 | 本次只做本地构建；原有 Docker 构建环境、Git/子模块准备、静态 404 与实际网关 HTTP/WS 接线仍需按实施文档核对 |

实施细节、既有测试和浏览器验收记录见 [消息与资料库微应用接入](/Users/apple/workspace/nuwax/docs/micro-frontend-qiankun.md)。

## 8. 最终选择的方案

**我们当前选择：乾坤 2.x `loadMicroApp` 手动加载 + 持久宿主保活 + HTML Entry + 子仓固定 main SHA + 主仓 patch/overlay 适配 + 同源目录统一打包。**

| 决策 | 当前落地 |
| --- | --- |
| 加载 | SidebarShell 内的 MicroAppHost 手动加载；首次访问创建实例 |
| 保活 | 切换菜单时隐藏实例，返回时复用；显式刷新重建当前实例，退出或会话失效清理全部实例 |
| 路由 | 业务地址由主站承接，通过 `path`、`active`、`onNavigate` 等 props 同步；静态入口独立放置 |
| 资源交付 | 消息与资料库分别位于 `/micro-apps/message/`、`/micro-apps/repo/`，随主站完整 dist 发布 |
| 上游升级 | 人工审查并更新 gitlink、adapter pin 和必要适配，验证后生成新产物；构建不自动追随 main |
| 客户端 | 延续 loopback 托管本地资源和代理业务请求的架构；同步解决已确认的路由与初始化缺口后完成客户端验收 |

选型依据是当前要求：切换菜单保留资料编辑和消息状态；复用主站会话和侧栏；子应用来源保持独立仓库；Web 与客户端能够消费同一份可追溯的完整资源包。这是本项目需求下的判断，不是对所有乾坤项目的通用结论。

后续如果子应用需要由自己的团队独立构建发布，优先评估方案 B，把生命周期和适配合同逐步迁回子仓，主站按固定版本装配资源包；保留现有路径和宿主合同，仍能支持客户端 loopback。方案 C 需要另行决定远程版本兼容、网络依赖和升级时编辑状态处理，当前没有采用。
