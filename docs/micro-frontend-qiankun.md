# 消息与资料库微应用接入

方案分类、上游 main 升级流程、客户端 loopback 兼容缺口和最终选型见 [乾坤接入方案调研](./qiankun-integration-research.md)。

本轮基于 `feat-dong.0930` 的独立 worktree 实施，沿用已有 qiankun 2.x 调研，按当前菜单保活设计改为持久宿主。子应用使用各自 `main` 的固定提交，业务源码保留原样；主仓维护适配 patch 与 overlay。

## 应用与地址契约

| 应用 | qiankun name | 原始 main 来源 | 前端构建目录 | 业务路由 | 稳定菜单入口 | 同源静态 entry |
| --- | --- | --- | --- | --- | --- | --- |
| 资料库 | `nuwax-repo-web` | `submodules/nuwax-repo-web` | 仓库根 | `/repo/*` | `/repo-entry` | `/micro-apps/repo/index.html` |
| 消息 | `nuwax-im-web` | `submodules/nuwax-im` | `nuwax-im-web/` | `/instant-message/*` | `/message-entry` | `/micro-apps/message/index.html` |

- 资料库 gitlink：`1d9f19162d3991ca693e5e79758b3bc6943e6e7e`；消息 gitlink：`f7fd703688aba50573621f9ee8e32ecf0ef9f75c`。
- `.gitmodules` 的 `branch = main` 表明上游来源；本次构建输入取主仓 index 的固定 gitlink，并与 `adapter.json.pin` 交叉校验。构建不会 fetch、checkout 或自动升级 main。
- `micro-frontends/apps.json` 登记已确认的应用，每项指向独立 `adapter.json`。消息使用用户确认的 `nuwax-im` 仓库中的 PC 前端目录，后端不参与构建和适配。
- 资源目录 `/micro-apps/<id>/` 与业务路由分开。访问业务深链必须先进入主站布局；静态 entry 仅供 qiankun 加载。

## 宿主与子应用边界

`config/config.ts` 启用 umi qiankun master，保持 `mountElementId: 'root'`、`prefetch: false`。`SidebarShell` 的持久宿主手动 `loadMicroApp`，业务路由不使用 umi 的路由级 `microApp` 挂载，避免切换菜单时自动销毁实例。

首次访问加载实例，离开时隐藏，返回时显示已有实例。显式刷新释放旧实例并重建当前深链；登出或鉴权失效清理全部实例。加载/更新/卸载失败由主站显示可重试反馈并捕获异常。

子应用使用 `container.querySelector('#root')` 创建 React 根。资料库在宿主内使用 MemoryRouter，双方通过以下 props 更新路径；独立运行保持自身路由行为：

```ts
type HostProps = {
  path: string;
  active: boolean;
  onNavigate: (path: string, replace: boolean) => void;
  onAuthExpired: (target: string) => void;
};
```

隐藏实例不消费其它应用路径。资料库适配层限制样式、全局快捷键、弹层、滚动锁与标题副作用，生命周期管理广播通道；保活切换保留编辑状态，真正重建时清理旧账号的内存缓存。消息固定 `VITE_IM_AUTH_MODE=platform`，复用主站 Cookie 会话，生命周期释放 WS、监听、定时器和原生通知。两应用的鉴权失效通过 `onAuthExpired` 交给宿主清理；请求发起时捕获实例代次，卸载后晚到的 401 不会清除新会话或影响新实例。

普通浏览器开发在加载入口前将当前调试 Token 镜像为同源 `ticket`；主站 Bearer 开发链路继续工作。生产及桌面构建使用当前 Cookie 会话。

## 可重复构建

工具要求：Node 满足子应用主线要求、Corepack 可调用，主仓 `packageManager` 固定 `pnpm@10.27.0`。主仓直接依赖 `qiankun@2.10.17-beta.0`，适配插件固定 `@tiny-codes/vite-plugin-qiankun@2.4.0`，Vite 8 peer 固定为 `8.2.0`；子应用 package/lock 不通过构建脚本修改。

```bash
git submodule update --init --recursive
pnpm install --frozen-lockfile
npm run test:micro-app-build
npm run sync:micro-apps
PORT=3002 npm run dev

# 两种宿主构建都会由 prebuild 自动先同步全部已登记子应用。
npm run build:dev
npm run build:prod
```

开发端口以终端输出为准；本次验收运行于 `http://localhost:3001`，原工作区的 3000 服务保持运行。

`scripts/sync-micro-apps.mjs` 按以下步骤构建每个已登记应用：

1. 加独占构建锁，删除旧 `public/micro-apps/`，验证固定版本和应用地址契约。
2. 校验 gitlink/adapter pin、`.gitmodules` main 和本地 `origin/main` 祖先关系。
3. 冻结适配文件快照并校验其 SHA256，`git archive` 固定 SHA 到 `.cache/micro-apps/` 的独立目录，在该目录初始化隔离 Git 上下文，`git apply --check` 后应用 checked patch。
4. 复制 overlay。monorepo 仅在 `projectDir` 指定的前端目录执行命令。
5. 用显式 `corepack pnpm@10.27.0 install --frozen-lockfile` 安装，防止无 packageManager 的子目录误用其它全局 pnpm。子应用自身有 workspace 时保留其依赖补丁；没有时加 `--ignore-workspace`，防止 monorepo 前端目录向上继承宿主 `packages/*`。
6. 完成类型/资产构建，验证 qiankun 2.x 入口转换、应用名、资源前缀和 JavaScript 产物。
7. 写版本 manifest，所有应用成功后才整体发布到 `public/micro-apps/`。umi 构建将该目录复制到同一个 `dist/micro-apps/`。

任一来源校验、安装、patch 或资产构建失败都会中止；旧 `public/micro-apps/`、旧 `dist/micro-apps/` 和半成品均删除，避免失败后留下可误发布的旧版本。成功同步只生成 public 目录，完整宿主构建后才重新生成 dist。隔离源码默认自动清理，可通过 `MICRO_APP_KEEP_BUILD=1 npm run sync:micro-apps` 留下诊断目录。锁只回收明确已经退出的构建进程。

### 资料库已存在的类型基线

资料库固定 main 的原始 `tsc -b` 已有 **72 条诊断**；采用相同冻结依赖的适配副本也是 72 条，新增 0。适配不修扩这批已有业务类型问题，不直接略过编译器。

仅资料库明确登记 `typeCheckBaseline: true`：工具先保留未应用适配的真实 main archive，基线与适配副本使用同一份 node_modules；双方强制运行 `tsc -b --pretty false --force`，按文件路径、TS code、完整消息及重复数量核对，忽略行列号。新增诊断或编译器异常会中止；匹配后才执行 `vite build`。基线数量和哈希写入版本 manifest，完整日志在保留的隔离目录中。

消息默认执行上游原有 `pnpm run build`，不自动放宽类型门。

### 版本追溯

`/micro-apps/<id>/version.json` 包含来源 main SHA、URL、前端目录、adapter 文件清单及 SHA256、构建环境、Node/pnpm/插件版本、构建时间和可选类型基线结果；`/micro-apps/manifest.json` 汇总同批产物。

升级上游是单独可审查的开发动作：先核查新 main，更新主仓 gitlink 与 `adapter.json.pin`，重做 patch 匹配和完整验收。运行构建命令本身不会改变 pin。

### 单个或全部升级脚本

```bash
# 预检查：获取远程 main 并检查适配，不改变子仓 HEAD、pin 或 index。
npm run upgrade:micro-apps -- all --dry-run

# 升级单个应用。
npm run upgrade:micro-apps -- message
npm run upgrade:micro-apps -- repo

# 升级全部已登记应用，也支持 --all。
npm run upgrade:micro-apps -- all

# 单个应用选择已经审查的 main 历史提交。
npm run upgrade:micro-apps -- message --ref '填入已审核的40位提交SHA'

# 升级后重新构建完整主站产物。
npm run build:prod
```

[升级脚本](/Users/apple/workspace/nuwax/scripts/upgrade-micro-apps.mjs)读取登记表，只 fetch 选中的子仓 `origin/main`。所有候选先校验快进/main 历史、patch 和 overlay 覆盖范围；全部预检通过后，才更新所选子仓 HEAD 和 adapter pin，并仅暂存这些 gitlink 与 `adapter.json`。单个升级不改变另一个应用的 pin；后续主站构建仍包含全部已登记应用。

选中子仓、gitlink、适配目录或共享登记文件已有 WIP 时，脚本中止；无关文件的 dirty/staged 改动保持原样。上游修改 overlay 同名文件时默认中止，需要先审查适配；明确完成审查后可加 `--allow-overlay-changes`。现有纯 rename 保存的 Vite upstream 配置不按被覆盖文件处理。

正常失败或 SIGINT/SIGTERM 会尝试恢复所选原 HEAD/分支、adapter 和 index。恢复记录和原 adapter 文件保存在 `.cache/micro-apps/upgrades/upgrade-*/`；回滚失败会报告具体条目并保留记录。SIGKILL/断电后需要按记录核对恢复，不能保证自动回滚。dry-run 会更新远程跟踪 ref 并产生临时检查文件，但不修改选中源码、pin 或 index。

脚本不执行 commit、push、构建或部署。升级成功后先构建、验收并提交本批变更，再交付最终提交生成的产物；下一次升级前需处理本次暂存改动。存在需要修改 patch/overlay 的上游升级时，应进入正常适配开发流程，不能仅凭脚本通过就视为功能验收完成。

## 本地 API / WS 代理

dev 消费预构建同源 entry，不需要另外启动子应用 Vite server。`config/config.development.ts` 将实际业务命名空间转发到测试网关：

| 范围 | 代理路径 |
| --- | --- |
| 资料库/平台 HTTP | `/api/repo`、`/api/space`、`/api/user`、`/api/tenant`、`/api/file`、`/api/f`、`/repo/internal` |
| 资料库协作 WS | `/repo/ws` |
| 消息 HTTP / WS | `/api/instant-message`、`/instant-message/ws` |

不代理整个 `/repo` 或 `/instant-message`，保证业务深链落主站路由。umi mock 中间件仍先于 proxy，原有 `mock.exclude` 保留；验收 mock 的命中规则保持原合同。

### 开发 WebSocket 的 Cookie Origin 合同

消息后端校验 Cookie 握手的业务 Origin。真实联调中，同一 Cookie 在业务域握手返回成功 `1001 / 0000`，直接转发本地页面 Origin 会返回拒绝 `1002`；HTTP probe 成功不等于 WS 已鉴权。

`config/devWebSocketProxy.ts` 为两条 WS 代理共用转换：仅当 incoming Origin 是 HTTP(S)、精确等于其自身 origin，且 host（含端口）与开发请求的 Host 相同时，才改写为配置的业务域 origin。其它站点、非法/null/缺失 Origin 原样交给后端校验。转换不新增 CONNECT Token，不改变 Cookie 会话，也不修改后端白名单。该 helper 只用于本地 dev proxy；生产保持实际站点的业务 Origin。

## 同源部署示例

消息和资料库采用与移动端 H5 相同的部署形态：每套前端占用独立静态子目录，最终合并到主站同一份 `dist/`，通过同一域名发布。包含移动端的完整目录如下：

```text
dist/
├── index.html                 # 主站入口
├── m/                        # 移动端 H5（build:prod:m 时合入）
│   └── index.html
└── micro-apps/
    ├── message/               # 消息 HTML、JS、CSS、图片
    │   ├── index.html
    │   └── assets/
    └── repo/                  # 资料库 HTML、JS、CSS、图片
        ├── index.html
        └── assets/
```

`/m/` 继续由移动端占用。消息和资料库的静态 entry 分别是 `/micro-apps/message/index.html`、`/micro-apps/repo/index.html`；用户访问的 `/instant-message`、`/repo` 仍由主站打开侧栏并挂载子应用。静态目录不存在的文件返回 404，业务深链刷新回到主站入口。

`npm run build:prod` 合入两个微应用，`npm run build:prod:m gitlab` 进一步下载移动端 H5 到 `dist/m/`。现有 `deploy_test.sh` 与 `scripts/deploy_sync_test.sh` 都提交整个 `dist/`，Docker 的静态阶段也完整复制这个目录，没有对子目录进行裁剪。线上前端可以由一套静态服务托管，HTTP API 和 WebSocket 继续转发到各业务后端。

产物生成过程目前不同：移动端从独立仓库下载已提交的 `unpackage/dist/build/web/`，消息/资料库则由主站构建固定 main 的源码并应用适配层。如果后续要独立发布两个子应用，可让子仓产出包含 qiankun 生命周期的版本包，再由主站按固定版本拉取合并；仍保持上述静态目录契约。

### 当前发布链的待接线项

本轮已验证主站和子应用构建后的目录及内容，尚未验证线上发布。仓库原有 Docker 构建阶段仍使用 Node 22.10 + yarn，未准备新管线需要的子模块及有效 Git 上下文；该入口还需调整构建环境或改为消费预构建的完整 dist。原有 nginx 模板仅有通用 history fallback，还需加入下面的微应用静态 404 规则。仓库可见 CI 未包含业务发布任务，实际网关的 HTTP/WS 转发配置也需在发布验收时核对。

发布整个 `dist/`；运维现有 `/api/` 和 WS 代理必须保持同源会话。以下片段中的 `business_gateway` 替换为部署环境实际网关，接入现有 nginx server；`root` 指向完整宿主 dist。

```nginx
location ^~ /micro-apps/ {
    # 静态资源不存在就 404，不能回退到主站 HTML。
    try_files $uri =404;
    add_header Cache-Control "no-cache";
}

location ^~ /repo/ws {
    proxy_pass http://business_gateway;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

location ^~ /repo/internal {
    proxy_pass http://business_gateway;
}

location ^~ /instant-message/ws {
    proxy_pass http://business_gateway;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

location = /repo { try_files $uri /index.html; }
location /repo/ { try_files $uri /index.html; }
location = /instant-message { try_files $uri /index.html; }
location /instant-message/ { try_files $uri /index.html; }
location / { try_files $uri $uri/ /index.html; }
```

业务路由的 fallback 是主站 `index.html`；不能指向微应用静态 index，否则直接刷新会绕开 SidebarShell 和鉴权。

## 初次接入验证记录（2026-09-28，分支同步前）

| 层次 | 证据 |
| --- | --- |
| 主仓安装 / umi 生成 | 精确依赖安装成功，`max setup` 成功 |
| 构建管线合同 | 10 项 Node 测试通过：固定 pin/dirty 源保护、monorepo、失败清产物、pin 不匹配、地址与 auth、类型基线及新增诊断、适配输入冻结、独立 workspace |
| 资料库正式隔离构建 | main `1d9f191`，frozen install；真实基线 72 / 适配 72 / 新增 0；Vite 8.2.1 资产构建、qiankun 入口及静态前缀通过 |
| 消息正式隔离构建 | main `f7fd703` 的 PC 前端子目录；独立 frozen install，原始 `tsc -b` 全绿，Vite 5.4.21 资产构建，固定 platform 模式 |
| 宿主构建 | `npm run build:dev`、`npm run build:prod` 均已完成最终全链路，含宿主 4011 清理和开发 WS Origin 转换；public/dist manifest 字节一致，dev/prod 适配摘要均匹配当前文件 |
| 集成定向合同 | 12 文件 / 110 项通过，覆盖宿主生命周期、鉴权清理、路由、资料库与消息适配 |
| 子应用真实源码合同 | 资料库适配 12 项、消息适配 18 项通过，覆盖路由、全局副作用释放及卸载后迟到认证响应隔离 |
| 会话硬约束 | 最终 `pnpm run test:conversation`：107 文件 / 1042 项全绿 |
| 全量 Vitest | 321 文件：320 通过、1 失败；2892 项通过、5 项失败、6 项跳过。失败均为 `tests/paymentSettlement`，已在原分支复现的既有基线 |
| 分层依赖 | `lint:arch` 无新增违规：2930 模块、12804 依赖、97 项已知基线 |
| 主仓类型检查 | 全库仍存在既有诊断基线；新增微应用宿主、路由和认证服务无诊断，`common` 及其旧测试的存量类型问题未扩展 |
| 登录态 / WS | 资料库真实空间与文档、消息真实会话与系统通知已通过同源联调；消息 WS 使用平台 Cookie 完成鉴权 |
| 资料库浏览器 | 真实 `/repo/doc/UdxgX2M64i8QEC8N` 深链重载、离开至首页后返回相同 DOM 根与路径通过，微应用 iframe 数为 0 |
| 消息浏览器待验证 | 最终摘要 fresh reload 的真实消息与新增系统通知通过；草稿、portal 和菜单保活尚未完成走查，原生通知权限提示待用户处理后继续 |

最终产物采用相同的适配输入：资料库 `8a1e3e58c9b103ecf838f783d84a0e945fc0a25e915a44b082910f8be48600b1`，消息 `2af662029c3ad53e956b66c9e987ab86ee5e3a155b9250f1b6ca2e3da996ca00`。生产宿主最终构建完成于 `2026-09-28T08:41:24Z`；忽略的诊断目录保留 `host-build-{dev,prod}-final.log` 和对应 `-evidence.json`，发布物内的 manifest 提供持久追溯。

显式刷新重建、加载失败重试、登出/401 卸载以及跨挂载迟到响应由合同测试覆盖，浏览器异常路径尚未走查。Electron/生产网关、原生通知点击和实际发送消息尚未验收；本轮未部署。

## feat-dong.0930 分支同步（2026-09-28）

- 接入代码已保存为 `057c2bb294`；提交钩子的 ESLint、Stylelint 和 Prettier 均通过。
- 在独立 worktree 合入 `feat-dong.0930@d956d944a0024fe67562f7aea424398a92d350c6`，没有文本冲突；保留该分支新增的登录状态订阅及微应用登出清理，两套逻辑共同工作。
- 全局事件轮询测试补齐鉴权清理广播 mock，分别校验业务事件与鉴权事件；该测试 6 项通过。
- 合并后会话合同 110 文件 / 1061 项、微应用集成合同 16 文件 / 135 项通过，分层检查 2933 模块 / 12815 依赖，无新增违规。
- 上面的静态产物摘要与浏览器截图是分支同步前的验证记录；本次提交前的适配 lint 收尾改变了适配摘要，合并后的发布物需重新构建。

## 合回 feat-dong.0930 的质量复核（2026-09-28）

已再次同步目标分支 `80e72a9fa8`，自动合并无冲突，保留其推荐功能与测试质量修复。合回采用快速前移，主工作区其它任务的未提交改动保留。

| 三问 | 结论与证据 |
| --- | --- |
| 功能逻辑内聚 | 通过。菜单识别归 `src/utils/microAppRoutes.ts:13`，保活状态归 `src/layouts/MicroAppHost/store.ts:42`，加载/更新/卸载归同目录 `lifecycle.ts:24`；弹层几何换算归 `micro-frontends/repo-web/overlay/src/hostRuntime.ts:97` 与 `micro-frontends/message/overlay/src/hostRuntime.ts:120`。 |
| 代码分层 | 通过。路由解析、宿主编排、`src/services/microAppAuth.ts:44` 认证服务与 `scripts/sync-micro-apps.mjs:477` 隔离构建职责独立；适配只落主仓 patch/overlay，两套 main gitlink 未改。`lint:arch` 检查 2933 模块、12815 依赖，无新增违规，97 项存量豁免。 |
| 后续维护 | 通过。`scripts/sync-micro-apps.mjs:150` 固定 pin、`:241` 冻结输入、`:324` 对照真实类型基线、`:562` 失败清理均有合同；`micro-frontends/repo-web/adapter.patch:23` 捕获挂载态并在 cleanup 后停止 head 副作用。构建管线 Node 合同 10 项全绿。 |

复核发现并修复了三处实际副作用：资料库提及/表格弹层在子根内仍用视口坐标、消息图片右键菜单的 fixed 锚点重复叠加宿主偏移，以及资料库卸载后迟到的租户配置响应改写主站 head。弹层统一转换到子根坐标，独立运行维持原定位；租户配置 effect 捕获挂载态并在 cleanup 后停止写入。

- 最新合并态全量 Vitest：335 文件、2967 项通过、6 项跳过；支付测试既有失败已由目标分支的 `393b56dbb4` 修复。
- 最终接入定向合同：14 文件、125 项全绿，包含新补的弹层位置和边界回归。
- 资料库使用真实隔离源码和 React/Router 的合同：3 文件、8 项全绿，包含内嵌卸载后迟到 200、独立页卸载保护、独立站点标题行为；patch 校验通过。
- 合入前运行最后一次 `npm run build:prod`，核对固定 main、当前适配摘要及 public/dist manifest。发布追溯以该次产物 `micro-apps/manifest.json` 与宿主 `version.json` 为准，上文初次构建摘要不代表本次修复产物。

浏览器剩余走查与 Docker/线上发布边界仍按前文记录；本次操作为本地分支合并。
