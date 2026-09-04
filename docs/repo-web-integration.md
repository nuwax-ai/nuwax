# 资料库前端（nuwax-repo-web）接入契约与维护手册

> 状态：v0（2026-09-04 随接入骨架落地）接入对象：`https://git.yichamao.com/agent-platform/nuwax-repo-web.git`（submodule：`submodules/nuwax-repo-web`）

## 1. 接入形态与原则

资料库前端是独立 Vite + React SPA，以 **git submodule** 引入本仓，构建产物随主站构建为**单一部署物**：

```
submodules/nuwax-repo-web  --vite build-->  public/repo/  --umi build-->  dist/repo/（同一 nginx dist）
```

- 浏览器整页导航进入（`/repo-entry` → `/repo/`），**不走 iframe**；子应用使用其自带的业务侧栏布局。
- 子应用基路径 `/repo/` 为其既有事实（vite base / router basename / `APP_BASE` 三处硬编码同步），主仓承诺不要求其变更。
- dev 环境同源：umi dev server 直接服务 `public/repo/`，登录态与网关行为和生产一致。
- 设计原则：**物理独立 + 逻辑留缝 + 不封锁同构化**。演进分三层：
  - **A 物理集成**（本次）：submodule + 同域挂载 + 统一部署物。
  - **B 运行时融合**（近期迭代）：鉴权/请求/上下文经契约对齐（见 §3 P0、§4 P1）。
  - **C 同构化**（战略可选）：子应用迁 React18+umi 抽共享包，或宿主升 React19 走布局内嵌。本次契约与稳定入口对两条路线均不封锁。

## 2. P0 契约（已生效，双向承诺）

### 2.1 入口与深链

| 项 | 契约 |
| --- | --- |
| 稳定入口 | 主仓路由 `/repo-entry` **永不变更**（`src/pages/RepoWebEntry`，当前实现为整页重定向）。将来切换布局内嵌时仅替换该页实现，菜单配置不受影响 |
| 子应用基路径 | `/repo/`，主仓侧由 sync 脚本保证产物落位；子应用侧不得变更 base |
| 深链格式 | 主仓 → 资料库：`/repo/space/:spaceId`、`/repo/doc/:slugId`、`/repo/share/:token`（子应用既有路由）；资料库 → 主站：根路径 `/login`（未登录）等，按需在 B 阶段补充回跳协议 |
| 菜单配置 | 后端「菜单管理」配一条：code=`repo`、name=资料库、path=`/repo-entry`、openType=当前窗口。注意 path 不能配 `/repo/` 原始路径——后端菜单 path 为 http/站外语义时会落 open-iframe-page（iframe，被排除方案），必须经由 `/repo-entry` |
| 移动端语义 | `/repo-entry` 受主站全局 UA 跳转脚本影响（`config/config.ts` headScripts，仅生产生效）：移动 UA 打开会被跳到 `/m/` 移动端首页，与既有 PC 页行为一致；`/repo/` 直达不受影响（子应用 HTML 不含该脚本）。如需移动端可用，后续单独立项（UA 脚本豁免或子应用移动适配） |

### 2.2 身份与登录协议

| 项 | v0（现状） | v1（B 阶段，向后兼容） |
| --- | --- | --- |
| token 载体 | 子应用读平台 cookie `ticket`（fetch `credentials:'include'`）；主仓登录态是 localStorage `ACCESS_TOKEN`（Bearer），两者机制不同源，cookie 是否在位以**后端种植为准** | 宿主经 `window.__NUWA_HOST__` 注入 token；子应用适配器优先读注入、读不到回退 cookie 现状 |
| 未登录语义 | 错误码 `4010` → `window.location.href='/login'`；`4011` → 跳服务端下发地址（缺省 `/login`）。语义全局统一，两侧不得私改 | 同左，跳转动作改经适配器（可被宿主回调接管） |
| 登录回跳 | 暂无 returnUrl 协议（B 阶段补：`/login?returnUrl=...`） | returnUrl 协议生效 |
| 登出/账号切换 | 主仓登出须同时清理 localStorage **与** cookie `ticket`（假登出风险，待后端确认清除接口）；子应用侧 401 即踢回 `/login` | 经宿主统一登出回调 |

### 2.3 上下文注入协议

- v0：主仓 → 子应用仅经 URL 参数（如 `/repo/space/:spaceId`）；子应用自行拉取用户信息（`/api/repo` 既有接口）。
- v1：统一命名空间 `window.__NUWA_HOST__`（**唯一**，不得新增其他全局挂载点）：

```ts
interface NuwaHostBridge {
  token?: string; // v1：宿主注入登录态
  user?: { id: string; name: string; tenantId?: string };
  locale?: string; // 见 §4.2
  redirectToLogin?: (returnUrl?: string) => void;
}
```

### 2.4 API 网关与错误契约

- 子应用业务前缀 `/api/repo`，协作 WS `/repo/ws`，Sidecar 内部 HTTP `/repo/internal/*`；`API_BASE` 默认同源（可用 `VITE_API_BASE` 覆盖）。
- **后端协作项（未尽，见 §6）**：网关需同时认 cookie `ticket` 与 `Authorization: Bearer`（双认）；`/api/repo`、`/repo/ws` 在 dev 直连域（testagent）与生产 ingress 的路由。
- 错误响应结构 `{ code, message }` 全局统一；`4010/4011` 语义见 §2.2。

### 2.5 版本可见性

- sync 脚本生成 `public/repo/version.json`：`{ name, commit, builtAt }`（submodule 常规为 detached HEAD，branch 名无稳定意义，不落字段）。线上排障先查此文件定位子应用版本。
- 子应用版本 = 主仓 pin 的 submodule commit；**仅 main 分支、无 tag**，升级须有意识地 bump pin。

## 3. 常用操作

```bash
# 全量同步（子模块初始化 + pnpm install + 构建 + 拷产物 + version.json）
npm run sync:repo-web

# 重复同步提速（复用子仓 node_modules）
npm run sync:repo-web -- --skip-install

# 升级子应用版本（有意识 bump pin，主仓单独提交 gitlink）
git -C submodules/nuwax-repo-web fetch origin
git -C submodules/nuwax-repo-web checkout origin/main   # 或指定 commit
cd <主仓根> && git add submodules/nuwax-repo-web && git commit -m "chore(repo-web): bump submodule pin"

# 新同事/CI 首次拉取
git submodule update --init
```

注意：sync 脚本构建用 `pnpm exec vite build`，**不走子仓 `pnpm build`**——其 `tsc -b` 在当前 pin（f07ce55）存在预存类型错误，类型门属子仓自身 CI 职责，不在跨仓链路上卡主仓产物。

dev 验证：启动主站 dev server → 访问 `/repo-entry`（重定向 `/repo/`）或直达 `/repo/`；`/repo/version.json` 应可访问。

## 4. P1 预留（B 阶段近期迭代）

1. **请求拦截行为对齐**：Accept-Language / 错误 toast 去重 / 未登录重定向语义向主仓 `src/services/common.ts` 靠拢，收敛在子应用适配器实现内（见 §5）。
2. **主题与 i18n**：design tokens（主色/暗色/密度）与 locale 传递（主仓语言键 ↔ 子应用）；`__NUWA_HOST__.locale` 预留位。
3. **桌面端 nuwaclaw**：webview 加载 `/repo/` 时的 bridge token 注入、下载等宿主能力适配。
4. **权限模型边界**：主仓菜单/按钮权限（`resourceTree`）与资料库文档级权限的分工与传递。
5. **监控埋点**：错误上报/埋点通道统一。

## 5. 子仓（nuwax-repo-web）协调改造清单

交子仓维护侧随其排期；v0 契约不依赖以下改造即可运行：

1. 新增 `src/lib/platform.ts` 平台适配器，收口三处散点为单点：
   - cookie `ticket` 读取（`src/lib/api.ts` 的 credentials 语义）；
   - 4010/4011 跳转（`window.location.href='/login'`，`src/lib/api.ts:34-44`）；
   - `API_BASE` 解析（`import.meta.env.VITE_API_BASE ?? ''`）。
2. 适配器优先读 `window.__NUWA_HOST__`（§2.3），读不到回退现状，**向后兼容**。
3. 后续在适配器内逐步实现主题/locale/登出回调消费。

## 6. 后端协作清单（已发出，待对齐）

| # | 事项 | 影响 |
| --- | --- | --- |
| 1 | cookie `ticket` 的种植/清除时机与 Domain/Path/SameSite 作用域；主站登出如何联动清 cookie | 登录态打通、假登出风险 |
| 2 | 网关双认鉴权：同一后端同时接受 cookie `ticket` 与 Bearer header | v0 可用性 |
| 3 | `/api/repo`、`/repo/ws`、`/repo/internal` 的 dev（testagent 域）与生产 ingress 路由 | dev 联调与生产可用性 |
| 4 | 登录回跳 returnUrl 协议（`/login?returnUrl=`）支持 | 登录体验闭环 |
| 5 | 生产 nginx 静态回退：`location /repo/ { try_files $uri $uri/ /repo/index.html; }`——子应用是 history 路由，`/repo/space/:id` 等深链刷新/直达必须回退到子应用 index.html，否则落到主站 SPA 的 404 兜底 | 深链可用性 |
| 6 | 生产构建管线前置 `npm run sync:repo-web`：产物 `public/repo/` 已 gitignore，CI/构建机 checkout 不带产物，必须先 sync 再 umi build | 单一部署物完整性 |

## 7. 风险登记

| 风险 | 现状 | 缓解 |
| --- | --- | --- |
| cookie ticket 透传不确定（主仓 localStorage Bearer 与子应用 cookie 机制不一致） | 待后端 §6-1/6-2 对齐 | 401 回跳 `/login` 复现则记 B 阶段输入；入口可独立回退 |
| 子应用产物较重（SheetEditor ~5.9MB / CollabEditor ~3MB minified） | 独立 `/repo/` 路径，不进主包 chunks | sync 为显式命令不进 predev；子仓侧分包优化属其自身演进 |
| 子仓仅 main 无 tag | pin f07ce55 | 纪律性 bump pin + version.json 排障 |
| 构建依赖 pnpm 在本地/CI 在位 | 本机 pnpm 10.27.0 已验证 | CI 适配属后续专项 |
