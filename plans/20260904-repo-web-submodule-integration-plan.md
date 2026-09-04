# 实施计划：资料库前端（nuwax-repo-web）submodule 接入

- 对应 spec：本计划即规格（集成类需求，契约见 `docs/repo-web-integration.md`，随本次一并交付）
- 状态：已接受（Plan mode 评审通过，2026-09-04）

## 背景与决策

- 接入对象：`https://git.yichamao.com/agent-platform/nuwax-repo-web.git`（React19+Vite8 独立 SPA，base 硬编码 `/repo/`，鉴权 cookie `ticket`，API 同源 `/api/repo`；仅 main 分支，pin f07ce55）。
- 形态：submodule 引入 + **同域整页挂载**（产物随主站构建为单一部署物），排除 iframe；布局内嵌（微前端）与 CI 适配留作后续专项。
- 设计原则：物理独立 + 逻辑留缝（集成契约 + 子仓平台适配器）+ 不封锁同构化（C 阶段两条路线均可行）。
- 关键坑：submodule URL 必须带 `.git` 后缀（否则 301 降 http 凭据失效）。

## 改动文件清单

| # | 文件 | 动作 | 说明 |
| --- | --- | --- | --- |
| 1 | `.gitmodules` | 新增 | submodule：`submodules/nuwax-repo-web` ← 带 `.git` 的 https URL |
| 2 | `submodules/nuwax-repo-web` | 新增 | gitlink，pin main@f07ce55 |
| 3 | `.gitignore` | 修改 | 忽略子应用产物 `public/repo/` |
| 4 | `scripts/sync-repo-web.mjs` | 新增 | submodule init/update → 子仓 pnpm install → pnpm build → 拷产物 `public/repo/` + 生成 version.json（commit+构建时间） |
| 5 | `package.json` | 修改 | scripts 加 `sync:repo-web`（显式命令，不做 predev 强依赖） |
| 6 | `src/routes/index.ts` | 修改 | `/` children 内加 `{ path: '/repo-entry', component: '@/pages/RepoWebEntry' }` |
| 7 | `src/pages/RepoWebEntry/index.tsx` | 新增 | 稳定入口薄壳：占位文案 + `window.location.replace('/repo/')`（后端菜单 path 配 http 会落 open-iframe-page 即被排除的 iframe，故必须前端 redirect 页特判） |
| 8 | `docs/repo-web-integration.md` | 新增 | 集成契约文档：P0 五项（身份登录/上下文注入/入口深链/网关错误/版本）+ P1/P2 预留章节 + 子仓适配器改造清单 + 后端协作清单 |
| 9 | `plans/20260904-repo-web-submodule-integration-plan.md` | 新增 | 本文件 |

## 实施顺序

1. worktree 准备：`.claude/worktrees/repo-web-integration`（← feat-dong.0930），node_modules symlink 主仓，`npm run setup`。
2. M1 submodule 骨架（.gitmodules / gitlink / .gitignore）。
3. M2 sync 脚本 + package.json scripts；实际跑通一次：子仓构建产物落 `public/repo/` + version.json。
4. M3 路由 + RepoWebEntry 页 + 契约文档。
5. M4 验证：`npm run test:conversation` 全绿（硬约束守门，本次不涉会话域）；手动走查走 dev server 地址栏直达 `/repo-entry`（后端菜单配置属环境操作，前端零菜单代码）。

## 打通设计全景（契约文档承载）

- **P0（本次定死）**：① 身份与登录协议（v0 cookie ticket → v1 宿主 `window.__NUWA_HOST__` 注入 token；4010/4011 统一语义；登录跳转带 returnUrl；登出/账号切换双侧清理）；② 上下文注入（用户/租户/spaceId，v0 URL 参数+自取，v1 单命名空间注入）；③ 入口与深链（`/repo-entry` 永不变；`/repo/` 基路径承诺；`/repo/space/:spaceId/doc/:slugId` 深链格式）；④ 网关与错误契约（`/api/repo`、`/repo/ws` 路由，网关双认 cookie+Bearer，错误 code/message 结构统一）；⑤ 版本可见性（version.json）。
- **P1（近期迭代占位）**：请求拦截行为对齐、主题 tokens 与 locale 传递、桌面端 webview bridge 注入、权限模型边界、监控埋点统一。
- **P2（同构化预留，只保证不封锁）**：共享包策略（@nuwax/request、utils、UI 包）、组件生态统一、能力互用（file-preview 等）。
- **子仓协调改造清单**：repo-web 新增 `src/lib/platform.ts` 收口 cookie 读取 / `window.location.href='/login'` / API_BASE 三处散点为单点（v1 起支持读宿主注入，读不到回退现状，向后兼容）。
- **后端协作清单（本次即发出）**：cookie ticket 种植/清除时机、网关双认鉴权、`/api/repo` 与 `/repo/ws` dev/生产路由。

## 证明成立的测试

- 新增测试：本次无新增单测（纯接入骨架，无业务逻辑分支；RepoWebEntry 为一行跳转薄壳）。
- 回归范围：`npm run test:conversation` 必须全绿。
- 浏览器验收（dev server）：`/repo-entry` 重定向 `/repo/` 且子应用渲染；`/repo/version.json` 可访问；主站布局与既有路由无回归（抽测首页/会话页）。

## 风险与回退

| 风险 | 缓解 | 回退方式 |
| --- | --- | --- |
| cookie ticket 透传不确定（主仓 localStorage Bearer vs 子应用 cookie） | 契约文档列后端协作清单先行；401 回跳复现则记 B 阶段输入 | 单独回退 M3 入口提交即可下线入口 |
| `/api/repo` 网关未部署 | 联调依赖清单交后端/运维；前端接入不阻塞 | 不影响主仓其余功能 |
| 子应用产物较重（Univer/Tiptap/yjs） | sync 为显式命令不进 predev；产物独立 `/repo/` 路径不进主包 chunks | 删除 `public/repo/` 与 submodule 引用 |
| repo-web 仅 main 无 tag | 纪律性 pin commit + 契约文档记录升级流程 | `git submodule update` 回退 pin |
| 子仓适配器改造依赖对方排期 | v0 契约不依赖改造即可落地 | 按 v0 现状（cookie 直读）运行 |

## 偏离记录

1. sync 脚本构建命令由 `pnpm build` 改为 `pnpm exec vite build`：子仓 f07ce55 的 `tsc -b` 存在预存类型错误（TS6133/TS2322 等十余处，类型门属子仓自身 CI 职责），主仓跨仓链路只消费 vite 产物，不在链路上卡子仓类型问题。已在 `scripts/sync-repo-web.mjs` 注释与 `docs/repo-web-integration.md` §3 记录。
2. 评审勘误（code-reviewer）：本文件 §「打通设计全景」所写深链 `/repo/space/:spaceId/doc/:slugId` 有误，子应用实际是两条独立路由 `/repo/space/:spaceId`、`/repo/doc/:slugId`，以契约文档 `docs/repo-web-integration.md` §2.1 为准。
