# 资料库前端（nuwax-repo-web）接入方案总结

> 交付日期：2026-09-04 · 分支：`feat/repo-web-integration`（origin=gitlab 内网仓）· 基线：`1ab3fd44e` 契约与维护手册：[docs/repo-web-integration.md](./repo-web-integration.md)（规则细节以契约为准，本文是全景总结）子仓：`https://git.yichamao.com/agent-platform/nuwax-repo-web.git`（submodule，pin `f07ce55`）

## 1. 背景与目标

把独立的资料库前端（文档/表格/幻灯片协作编辑，React19 + Vite8 + react-router7）集成进 nuwax 主站（umi max + React18）：

- **不冲击现有代码架构**，子应用**保持独立维护**（独立仓、独立构建、独立发版节奏）；
- 通过**菜单入口挂入**，以页面方式接入（排除 iframe）；
- **渐进式**：先物理打通，再逐步融合（请求/登录/上下文），远期不排除整体同构化。

## 2. 方案选型

| 候选 | 结论 | 理由 |
| --- | --- | --- |
| iframe | ❌ 排除 | 用户明确排除；且与「融合」目标背道而驰 |
| 源码组件化挂载 | ❌ 排除 | 子应用 React19 + router7 与主仓 React18 + umi 双冲突，需先降级/升级整仓 |
| 微前端布局内嵌（wujie/qiankun） | ⏸ 后续专项 | 需引入运行时级新依赖，M1 不做；设计上不封锁 |
| **submodule + 同域整页挂载** | ✅ 选定 | 零运行时耦合、单一部署物、子应用作者本就按 `/repo` 基路径预留了集成位（代码注释可证） |

既有先例佐证：移动端整包挂 `dist/m/`（`scripts/download-mobile-build.js`）——「外部前端产物挂主站同域路径」在本仓是成熟模式。

## 3. 架构与构建链路

```
submodules/nuwax-repo-web（独立仓，pin commit）
        │  npm run sync:repo-web（显式命令，不进 predev）
        │  = submodule init/update → pnpm install → vite build → 拷产物
        ▼
public/repo/（gitignore，不进 git；附 version.json={name,commit,builtAt}）
        │  umi build 随 public 原样并入
        ▼
dist/repo/ ── 同一 nginx dist，单一部署物；dev 下 umi dev server 直接同源服务
```

- 浏览器整页导航：`/repo-entry`（契约稳定入口，永不变）→ `window.location.replace('/repo/')`，子应用用自带业务布局。
- dev 数据链路：`config/config.development.ts` 把子应用调用的平台命名空间（`/api/repo`、`/api/space`、`/api/user`、`/api/tenant`、`/api/file`、`/api/f`、`/repo/ws`）代理到 `https://testagent.xspaceagi.com`。主应用请求走 BASE_URL 绝对地址直连、mock 层零冲突，互不影响。

## 4. 主仓改动面（子仓零改动）

| 文件 | 动作 | 内容 |
| --- | --- | --- |
| `.gitmodules` + `submodules/nuwax-repo-web` | 新增 | submodule 引入（URL 必须带 `.git`，否则 301 降 http 凭据失效） |
| `scripts/sync-repo-web.mjs` | 新增 | 构建同步脚本（`pnpm exec vite build`，绕开子仓 tsc 预存类型错——类型门属子仓 CI） |
| `package.json` | +1 行 | `sync:repo-web` 命令 |
| `src/routes/index.ts` | +4 行 | `/repo-entry` 路由（挂 `/` children，自带布局壳 + 登录守卫） |
| `src/pages/RepoWebEntry/index.tsx` | 新增 | 入口薄壳：dev 桥（见 §5）+ 整页跳转 |
| `src/locales/i18n/*.ts` ×5 | +5 行 | `PC.Pages.RepoWeb.entering` 五语言 |
| `config/config.development.ts` | 修改 | dev 代理（仅开发环境生效） |
| `docs/repo-web-integration.md` + 本文档 + `plans/20260904-*` | 新增 | 契约 / 总结 / 计划工件 |

菜单接入**零前端代码**：后端「菜单管理」配一条 code=`repo`、path=`/repo-entry` 即生效（不能直配 `/repo/`，会落被排除的 open-iframe-page 机制）。

## 5. 鉴权打通（本次最关键的排查成果）

**核心实证**：后端 `passwordLogin` 响应 `set-cookie: ticket=<JWT>`，值与响应体 token **完全等值**，CORS `allow-credentials: true`。由此推出两侧路径：

- **生产（同源部署）**：登录同源请求 → ticket cookie 原生落在站点域 → 子应用 `/api/repo`（cookie 鉴权）天然可用，**无需任何桥**。
- **dev**：主应用登录走跨域绝对地址（BASE_URL），cookie 落不到 localhost → `RepoWebEntry` 做 **dev 桥**：`process.env.BASE_URL` 非空时把 token 镜像为同源 `ticket` cookie。生产 BASE_URL 为空，桥不介入。
- **returnUrl**：平台已有回跳协议（4011 的 message 即 `/login?redirect=<当前页>`），登录体验闭环现成。
- **testagent 网关已部署 `/api/repo`**（带鉴权拦截，实测通过）。

## 6. 三层演进设计（渐进融合的骨架）

- **A 物理集成（本次已完成）**：submodule + 同域整页 + 单一部署物。
- **B 运行时融合（近期迭代）**：请求拦截对齐（Accept-Language/toast/重定向语义）、主题与 locale、桌面端 webview bridge、权限边界、埋点；宿主注入走 `window.__NUWA_HOST__` 单一命名空间，子仓侧以 `src/lib/platform.ts` 适配器收口 cookie/登录跳转/API_BASE 三处散点（对方排期，v0 不依赖）。
- **C 同构化（战略可选）**：子应用迁 React18+umi 抽共享包（@nuwax/request、utils、UI），或宿主升 React19 走布局内嵌。三条设计规则保证不被封锁：① 子应用业务代码只经适配器碰平台状态；② 宿主只经 `/repo-entry` 稳定入口 + 单一全局命名空间对接；③ 全局命名空间与样式零交叉。

## 7. 验证记录

| 项 | 结果 |
| --- | --- |
| `npm run test:conversation`（会话域硬门） | ✅ 49 文件 / 458 用例全绿（每轮改动后复跑） |
| code-reviewer 评审（对照 AGENTS.md/REVIEW.md） | ✅ 无 P0/P1；4 条 P2 已全部修复（契约登记缺口、脚本错误输出、version.json 字段） |
| `npm run sync:repo-web` 实跑 | ✅ 产物落 `public/repo/` + version.json |
| curl 链路 | ✅ `/repo-entry`、`/repo/`、`/repo/version.json`、`/repo/space/:id` 深链（dev 回退）全 200 |
| 浏览器实测（测试账号） | ✅ 登录 → `/repo-entry` → 资料库门户渲染 → **测试环境真实文档列表加载**（「我的资料」「与账号共享」分组）→ 点开文档进入编辑器（`/repo/doc/:slugId`）；无 401 弹回、无报错红字 |
| 主站回归 | ✅ `/`、`/home`、登录流正常 |

## 8. 遗留与协作项

| 项 | 归属 | 说明 |
| --- | --- | --- |
| `/repo/ws` 协作 WS 网关路由 | 后端 | 文档**列表/浏览/打开**已通；多人**协作编辑**依赖此项（dev 代理已就位，路由落地即生效） |
| 主站登出联动清 `ticket` | 后端/主站 | 假登出风险：换账号后子应用仍持旧会话；B 阶段登出回调统一 |
| 生产 nginx `location /repo/` try_files 回退 | 运维 | history 路由深链刷新必需（契约 §6-5） |
| 生产构建管线前置 `sync:repo-web` + CI 适配（pnpm/submodule） | 工程 | 产物 gitignore，checkout 不带（契约 §6-6） |
| 菜单管理配置 | 环境 | code=`repo`、path=`/repo-entry`（配完即现菜单入口） |
| 移动端语义 | 后续立项 | `/repo-entry` 移动 UA 会被主站脚本跳 `/m/`（与既有 PC 页一致） |
| 子仓 `platform.ts` 适配器 | 子仓维护侧 | B 阶段融合前置（契约 §5） |

## 9. 快速上手（新同事 5 步）

```bash
git clone <主仓> && cd nuwax
git submodule update --init          # 拉子仓（URL 带 .git）
npm install                          # 主仓依赖
npm run sync:repo-web                # 构建子应用产物到 public/repo/
npm run dev                          # 起主站，访问 /repo-entry（dev 桥自动种 cookie）
```

线上排障：先查 `/repo/version.json` 的 commit 对照主仓 submodule pin；升级子应用 = bump pin + 重跑 sync（流程见契约 §3）。
