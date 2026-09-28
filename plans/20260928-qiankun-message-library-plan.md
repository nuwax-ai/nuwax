# 实施计划：qiankun-message-library

- 对应 spec：`specs/qiankun-message-library.md`
- 状态：源码接入与最终开发/生产构建完成；消息剩余浏览器走查等待用户处理原生通知权限
- worktree：`/Users/apple/.codex/worktrees/qiankun-message-library/nuwax`
- 分支：`codex/qiankun-message-library`

## 改动文件清单

| 文件 | 动作 | 说明 |
| --- | --- | --- |
| `.gitmodules`、`submodules/*` | 新增 | 子仓跟踪 main，固定可追溯 SHA |
| `micro-frontends/*` | 新增 | 可审查的 lifecycle/router/资源隔离适配 |
| `scripts/*micro-app*.mjs`、`package.json`、lock | 增改 | 固定 pin 构建并合入单一 dist |
| `config/config*.ts` | 修改 | qiankun 宿主、API/WS 代理 |
| `src/utils/microAppRoutes.ts` | 新增 | 路由和旧菜单地址映射 |
| `src/layouts/MicroAppHost/*` | 新增 | 持久容器、加载/更新/卸载状态 |
| `src/layouts/SidebarShell/index.tsx` | 修改 | 同构插槽挂载宿主 |
| `src/pages/MicroAppEntry/*`、routes、菜单工具 | 增改 | 稳定入口与深链控制 |
| 鉴权桥及会话清理 | 增改 | dev ticket 与失效清理 |
| `tests/microApps/*` | 新增 | 路由、保活、失败和清理合同 |
| `docs/micro-frontend-qiankun.md` | 新增 | 正式运行/构建/部署与验收证据 |

## 实施顺序

1. 已完成：核对当前分支及 dirty 状态、创建 worktree、找出最新调研线、实时核查资料库 main。
2. 已完成：子应用隔离适配；宿主路由/菜单；固定 pin 构建脚本。
3. 已完成：宿主加载/保活/鉴权/清理编排、依赖安装与集成。
4. 已完成：定向合同 110 项、管线合同 10 项、会话合同 1042 项、分层检查及最终开发/生产构建。全量 Vitest 2892 项通过，支付测试 5 项既有失败已在原分支复现；资料库类型基线 72/72、新增 0，消息类型检查通过。
5. 已完成资料库真实文档、深链重载、首页往返同实例验证及消息真实会话/平台 Cookie WS 鉴权。消息草稿、弹层与菜单保活的最后走查待浏览器通知权限提示处理后继续；证据与边界见接入文档。

## 证明成立的测试

- 路由与菜单映射边界（新标签/第三方外链不被错误改写）。
- 应用 A → 主站 → A 不重载；两应用路径互不污染。
- 深链刷新/历史、显式刷新、失败重试、失效卸载与异步竞态。
- `pnpm run lint:arch`、`pnpm run test:conversation` 和定向 vitest。
- 子应用 index lifecycle / 资源路径验证及主站 build。

## 风险与回退

| 风险 | 缓解 | 回退 |
| --- | --- | --- |
| 子仓 main 没生命周期 | 固定 pin + 显式适配层；patch fail closed | 回退主仓集成提交 |
| 消息仓库包含前后端 | 用户确认仅构建 main 中 `nuwax-im-web`，不涉及后端模块 | 回退消息宿主入口 |
| 样式与路由影响主站 | 容器限定/MemoryRouter + 真实切换检查 | 回退宿主入口映射 |
| 外部 API/WS 不可用 | 记录真实验证层边界 | 保留测试证据，待外部恢复复验 |

## 偏离记录

与旧 PoC 的路由级挂载不同：采用当前主线已定稿的宿主持久实例方案；静态资源与业务路由分离。消息来源已由用户确认：`nuwax-im/main` 中 `nuwax-im-web`，生命周期名 `nuwax-im-web`，资源 `/micro-apps/message/`、业务 `/instant-message/`。

## 剩余验收边界

- 浏览器原生通知权限由用户处理，遵守 ego-browser 技能的权限提示规则；未将未完成的消息草稿/弹层/保活走查记为通过。
- 显式刷新重建、登出/401 清理、加载失败重试和迟到响应隔离已由合同测试覆盖，真实浏览器异常路径尚未走查。
- Electron/生产网关、原生通知点击及实际发送消息未进行验收；本轮未提交、合并或部署。
