# 前端架构总览

> 适用：nuwax-frontend（React 18 + TypeScript + umi max）。数字为 2026-10-15 实测，用于后续对照；规则以 [工程规范](../engineering-conventions.md) 与 `.dependency-cruiser.cjs` 为准。
> 演进目标与待办见 [架构优化排查表](./optimization-roadmap.md)。

## 1. 一张图

```
                    ┌──────────────── 宿主环境 ────────────────┐
                    │ 浏览器 │ NuwaClaw/Nuwax 桌面端 webview      │
                    └───────┬─────────────────┬────────────────┘
                            │ utils/hostBridge（唯一宿主能力收口）
┌───────────────────────────▼─────────────────────────────────────────────┐
│ app.tsx / routes / layouts（SidebarShell、DynamicMenusLayout、MicroAppHost）│
├──────────────────────────────────────────────────────────────────────────┤
│ pages/*          页面（路由级，互不引用）                                  │
│   └─ 只经 features/conversation/react/* 消费会话域                         │
├──────────────────────────────────────────────────────────────────────────┤
│ features/        领域模块（conversation 新线、client-shell 桌面壳能力）    │
│ components/      base（通用 UI）/ business-component（业务组件）           │
│ hooks/  contexts/  modelScopes/  wrappers/  plugins/（markdown 插件）      │
├──────────────────────────────────────────────────────────────────────────┤
│ models/（umi model 全局状态）   services/（接口请求，umi request）          │
├──────────────────────────────────────────────────────────────────────────┤
│ utils/  constants/  types/  locales/  styles/                             │
└──────────────────────────────────────────────────────────────────────────┘
        ▲ qiankun loadMicroApp（持久实例、隐藏保活）
┌───────┴──────────────────────────────────────┐
│ 微应用：资料库 nuwax-repo-web / 消息 nuwax-im │  ← submodules + micro-frontends 适配层
└──────────────────────────────────────────────┘
```

依赖方向自上而下。分层禁令由 depcruise 强制（只拦新增）：

| 规则 | 含义 |
| --- | --- |
| `non-pages-not-to-pages` | pages 以外的任何层不得 import pages |
| `pages-not-to-other-pages` | 页面之间不互相 import（共享代码下沉到 components/features） |
| `pages-not-to-conversation-internals` | 页面只能用 `features/conversation/react/*`，不能碰 domain/runtime/adapters |
| `components-not-to-models` | components / features 不读全局 model |
| `hooks-not-to-components`、`services-not-to-hooks-or-components`、`utils-not-to-services` | 下层不反向依赖上层 |
| `no-circular` | 禁止循环依赖 |

存量违规基线 105 条（实测已修掉约 8 条待刷新），构成：页面互引 51、utils→services 32（其中 18 条指向 `services/i18nRuntime.ts`）、循环 11、其它 11。

## 2. 目录职责

| 目录 | 规模（行） | 职责 | 备注 |
| --- | --- | --- | --- |
| `pages/` | 205k / 774 文件 | 路由页面 | 大户：Antv-X6 39k（v1 根目录约 10k + `v3/` 29k）、SystemManagement 38k、AppDev 19k、AppDevPro 17k、EditAgent 13k |
| `components/` | 114k | `base/` 通用 UI；`business-component/` 业务组件（64k） | AgentIntervention 11k、ChatInputHome 10k、UnifiedChatSession 4k |
| `features/conversation/` | 12.6k | 会话新线（V2）：`domain` 纯模型 → `runtime` 传输/存储/续流 → `react` 页面消费入口；`presentation-v2` V2 渲染 | 五入口（Chat / ConversationAgent / EditAgent 调试 / 插件 / 技能）复用 UnifiedChatSession |
| `features/client-shell/` | 3.4k | 桌面壳专属能力：版本徽标、直更、本地文件、IM 通知偏好 | 测试覆盖较好（9 个） |
| `layouts/` | 20k | 侧栏壳、菜单、历史会话、`MicroAppHost`（qiankun 持久宿主） | |
| `models/` | 8.8k | umi model 全局状态（`useModel` 315 处，最多：menuModel、tenantConfigInfo、layout、workflowV3） | 会话旧线模型 conversationInfo 2.3k、conversationAgent 1.3k |
| `modelScopes/` | — | 页面级 model 实例（`ConversationPageModelProvider` + `usePageModel`），让多会话页面互不串状态 | conversationInfo 同时存在全局与页面级两种用法 |
| `services/` | 16.7k | 接口封装（统一走 umi `request`） | 仍有 16 处直接 `fetch` |
| `utils/` | 23.6k | 纯工具；`hostBridge/` 宿主能力唯一收口；SSE 封装 | SSE 现有 3 套实现 |
| `hooks/` / `contexts/` / `wrappers/` | — | 通用 hook；画布/工作流上下文；路由守卫与沉浸式避让 | |
| `locales/` | 35.7k | 5 种语言词典 | |
| `examples/` | 12k | 组件演示页 | 目前注册在生产路由中 |

## 3. 关键机制速查

| 机制 | 入口 | 文档 |
| --- | --- | --- |
| 会话 V1/V2 双轨 | 运行时 `utils/conversationRuntimeFlag.ts`（默认 V2，`?conversationRuntime=0` 回切）；渲染 `utils/conversationRendererPreference.ts`（`?conversationRenderer=v1`） | [会话域总入口](../conversation/README.md) |
| 宿主适配（浏览器 / NuwaClaw / Nuwax） | `utils/hostBridge/index.ts` | [宿主适配矩阵](../desktop-host-adaptation-matrix.md) |
| 微应用 | 注册 `config/config.ts` qiankun.apps + `utils/microAppRoutes.ts`；挂载 `layouts/MicroAppHost`；适配 `micro-frontends/<id>` | [接入设计](../micro-frontend-qiankun.md) · [操作手册](../micro-apps-runbook.md) |
| SSE 流式 | `utils/fetchEventSource.ts`（AppDev/工作流）、`utils/fetchEventSourceConversationInfo.ts`（会话）、`pages/AppDevPro/utils/userAppTaskStream.ts` | [SSE 实现指南](../ch/SSE-Implementation-Guide.md) |
| 类型门 | `typecheck-domains.json`（4 域） | [typecheck-domains](../typecheck-domains.md) |
| 构建产物版本 | `dist/version.json`（运行时读 gitHash）；`DIST_RETENTION` 旧哈希保留 | [scripts 索引](../../scripts/README.md) |

## 4. 已知结构性问题（详见排查表）

1. **巨型文件**：>1000 行文件 53 个；最大 `pages/AppDevPro/index.tsx` 4322 行、`useFileTreePreviewView.tsx` 2836、`pages/Chat/index.tsx` 2610、`models/conversationInfo.ts` 2305。
2. **双轨并存**：会话 V1（约 4.6k 行旧模型）与 V2；工作流编辑器 Antv-X6 v1 与 v3。
3. **重复实现**：3 套 SSE 封装；两份 ChatInputHome（`components/` 与 `pages/AppDev/.../ChatArea/components/`）；微应用注册表在 config、`microAppRoutes.ts`、`adapter.json` 三处重复。
4. **类型门覆盖面小**：只有 4 个域受 strict 约束。
5. **微应用适配补丁大**：message 补丁约 3k 行，其中新增文件 1740 行、对上游文件的修改仅约 240 行；新增文件更适合放 overlay。
