# OpenUI Query/Mutation 数据绑定执行闭环（TODO / 暂停）

> 状态：**暂停（TODO）** —— 2026-07-30 决定暂不实现，记录为后续任务。暂停原因：引擎接线（前端）可行，但 `toolProvider.callTool` 最终要调后端挂载的 MCP tool，而前端浏览器**没有现成的"前端直连 MCP server"通道**，需要后端先开 tool 调用端点（方案 A）。待后端通道就绪后按下方「分步方案」复工。关联：`nuwax-openui-mcp` 曾短暂在 authoring reference 预埋 Query/Mutation 语法文档，**后已撤回**——因 runtime 不执行，为避免 Agent 误写空态绑定，reference 与 `bindings.tools` 现均标注「保留占位、留空」且 render 输入端硬禁非空（`.max(0)`）。复工实现本闭环时，需**一并恢复**语法教学文档并解禁 `bindings.tools`。影响仓库：`nuwax-openui-mcp`（runtime 侧）+ `nuwax`（host inline 侧 + 后端 tool 桥）。

## 背景

OpenUI Lang v0.5 的 `Query(tool, args, default, refreshSeconds?)` / `Mutation(tool, args)` + `@Run(...)` 让界面在运行时向 MCP tool 取数 / 写数，是「活的看板 / 表单」的关键能力。

**现状**：`nuwax-openui-mcp` 的 reference 只教模型怎么**写**这套语法，但整条「执行 → 取数 → 回注 UI」链路不存在——

- `Query(...)` 永远落到 `default`，UI 停在空态；
- `@Run(...)`（Mutation）被当成普通表单 submit，经 `onAction` 打包成 `nuwax.openui-action` 发回 chat，**没有真正执行 tool**；
- 轮询 `refreshSeconds` 无人执行。

**关键发现（降低工作量）**：官方 `@openuidev/react-ui` 的 `Renderer` **自带 Query/Mutation 执行引擎**，只需喂一个 `toolProvider` prop——本 issue 的核心是「造一个接进 nuwax MCP 通道的 `toolProvider`」，而不是自研执行引擎。

```tsx
// react-ui RendererProps（已存在，未接）
toolProvider?: Record<string, (args) => Promise<unknown>> | McpClientLike | null;
queryLoader?: ReactNode;   // Query 拉取中的 loading UI
```

lang-core 内部：`createQueryManager(toolProvider)` 负责 Query 求值 / 缓存 / 失效 / 轮询调度、`registerMutations` / `fireMutation` 负责 Mutation；`Query`/`Mutation`/`@Run` 在 parse 阶段就被提取为 `queryStatements` / `mutationStatements`。我们只要提供 `toolProvider.callTool(toolName, args)` 即可。

## 目标

让声明了 `bindings.tools` 的 OpenUI 界面，能在 inline / sidecar 两种入口真正执行 `Query`（取数）与 `Mutation`（`@Run` 写数），且**不破坏现有「表单 submit → chat 回传」链路**（与 ask-question 类似那条）。

## 非目标（本期不做）

- 自定义组件 `defineComponent` / `createLibrary` 注册（另案，contracts 已留 `customComponents` 占位）。
- 多页 / 路由 / 任意 JS（能力象限外，不做）。
- 后端 TaskAgent systemPrompt / NuwaClaw 模板（另案）。

## 现状缺口（逐入口）

| 环节 | 现状 | 缺口 |
| --- | --- | --- |
| 官方 `Renderer` | 支持 `toolProvider` + `queryLoader`；自带 QueryManager | 我们**没传** `toolProvider`（默认 `null`）→ Query 永远 default、Mutation 不执行 |
| sidecar / 文件预览 runtime `packages/runtime/web/RuntimeApp.tsx` | `handleAction` 把**所有** action 一律 `postMessage` 成 `nuwax.openui-action` | 无 tool 执行；`@Run` 被误当表单 submit；postMessage 协议里**没有 tool 调用 / 结果回注的消息类型** |
| host inline `src/components/business-component/OpenUiArtifactView/index.tsx` | `handleInlineAction` 同样一律打包 → `getOpenUiActionSender` → chat | 同上；无 tool 桥，无 action 分流 |
| `bindings.tools`（`{serverId, toolName, access}`） | 仅声明式写入 artifact，无任何消费方 | 无人把它解析成可调用的 `toolProvider` |
| 轮询 `refreshSeconds` | lang-core QueryManager 支持调度 | 只要 `toolProvider` 接上即自动获得，但需确认 host 允许后台定时调 tool |

## 协议事实（实现依据，已核对官方 `.d.ts`）

- `RendererProps.toolProvider`：函数 map `{tool_name: async (args)=>result}`，或 `McpClientLike`（`callTool({name, arguments})`）。
- `McpClientLike.callTool` 返回 `{content[], structuredContent?, isError?}`；官方 `extractToolResult` 优先取 `structuredContent`，否则解析 text。
- `ActionEvent` = `{type, params, humanFriendlyMessage, formState?, formName?}`；`BuiltinActionType` 仅 `continue_conversation` / `open_url`，`@Run` 不走 `onAction` 的这两个内建类型，而是由 QueryManager 的 `fireMutation` 处理。
- `bindings.tools[].access ∈ {query, mutation}`：**官方 lang 不消费 access**，access 是我们在 tool 桥上做权限/路由的依据（query 工具只用于 Query、mutation 工具只用于 Mutation）。

### 已核实：`@Run`/Mutation **不经过 `onAction`**（react-lang `index.mjs` `triggerAction` 实现）

action 在 Renderer 内部被分流，`onAction` 只为会发 chat / 打开链接的类型触发：

| Action 种类 | Renderer 内部处理 | 触发 `onAction`（→chat）？ |
| --- | --- | --- |
| `@Run` / Mutation（ActionPlan `steps[].type==="run"`） | `queryManager.fireMutation(statementId, args)`，结果回注 UI | ❌ 不调 |
| Query 刷新（`run` + `refType==="query"`） | `queryManager.invalidate(...)` 重取 | ❌ 不调 |
| `@Set` / `@Reset` | `store.set(...)` 改本地状态 | ❌ 不调 |
| `@ToAssistant` | `onAction({type:"continue_conversation", …})` | ✅ 调（发 chat） |
| `@OpenUrl` | `onAction({type:"open_url", …})` | ✅ 调（打开链接） |
| 表单 submit / 无 ActionPlan（兜底） | `onAction({type:"continue_conversation", formState, formName})` | ✅ 调（**现有表单回传走这条**） |

**结论**：`onAction` 的 `event.type` 只会是 `continue_conversation` / `open_url`。`@Run`/Mutation 在 Renderer 内部被 QueryManager 截胡执行，**不冒泡**。因此现有「表单 → chat」链路天然隔离，无需我们手写 `@Run` 分流——分流是官方 Renderer 做的。

## 复工路径（TODO 分步方案）

核心卡点：`toolProvider.callTool(toolName, args)` 要调真实 MCP tool，而 `bindings.tools` 的 `{serverId, toolName}` 指向**后端**挂载的 MCP server；前端浏览器**无现成的"前端直连 MCP server"通道**（host 前端只有 AgentIntervention 的 MCP-ask SSE 事件，没有可复用的"前端发起 callTool"HTTP 端点）。因此「callTool 调谁」依赖后端决策，前端引擎接线本身不依赖后端。

| 方案 | 做法 | 前端 | 后端 | 本期能否闭环 |
| --- | --- | --- | --- | --- |
| **A. 后端新增 callTool HTTP 端点** | 后端开 `POST /api/openui/tool-call {serverId, toolName, args}`，前端 fetch | 小 | **需新增端点** | 需后端排期 |
| **B. 复用 chat/Agent 通道** | 把 tool 调用伪装成 chat 请求 | — | — | ❌ 污染 chat（不可接受） |
| **C. 内存函数 map 桩** | `toolProvider` 接好，`callTool` 打到可注入桩（默认空 →`ToolNotFoundError`） | 中 | 0 | 引擎通、无真数据 |

**复工时分两步（推荐）**：

1. **前端引擎接线（不依赖后端，可先做）**：inline + sidecar 两路径都传 `toolProvider`；`callTool` 收敛为可注入的 `openUiToolBridge`（host 侧仿 `actionRegistry` 提供 `registerOpenUiToolBridge`，默认未注册 →`ToolNotFoundError` 兜底，满足「未接 tool 桥时有明确提示」）。sidecar postMessage 协议加 `OPENUI_TOOL_CALL` / `OPENUI_TOOL_RESULT` 两端消息。此步完成则**引擎、协议、兜底全部就位**。
2. **后端通道（方案 A，依赖后端排期）**：后端开 callTool 端点后，前端用一行 `registerOpenUiToolBridge(...)` 接上真实通道即闭环，**前端无需再改**。

> 若届时已有现成后端 tool 调用接口，直接给前端接入地址即可跳到第 2 步，跳过第 1 步的桩。

---

## 实现要点

### 1. 造 `toolProvider`（核心）

把 `artifact.bindings.tools` 映射成 `Record<toolName, (args)=>Promise<result>>`：

- 每个 `toolName` 对应一个 async 函数，内部调 nuwax 后端的 MCP 调用通道（`serverId` 定位 MCP server，`toolName` 定位工具）。
- `access` 用于分流/校验：`access:"query"` 的 tool 才允许进 Query，`"mutation"` 才允许 `@Run`；越权调用直接 `ToolNotFoundError`。
- 结果经 `extractToolResult` 兼容（取 `structuredContent`，否则 text→JSON）。

### 2. action 分流 = 官方 Renderer 负责（**现有 chat 回传天然安全**）

已核实（见上表）：`@Run`/Mutation/Query/`@Set`/`@Reset` 都在 Renderer 内部由 QueryManager / store 处理，**不调 `onAction`**；只有 `@ToAssistant`、`@OpenUrl`、表单 submit 才冒泡到 `onAction`。

- 表单 submit（`continue_conversation`）→ 照旧 `nuwax.openui-action` → `getOpenUiActionSender` → chat。**行为不变，无需改 `handleInlineAction` / `handleAction` 的分流逻辑**。
- `@Run`/Mutation → 只要传了 `toolProvider`，Renderer 内部执行，**不会**误发 chat。
- ⚠️ 唯一兜底场景：模型写了 `@Run` 但**没传 `toolProvider`** → `fireMutation` 失败、`triggerAction` 提前 `return`，Mutation 静默无效（UI 不刷新、也不报错进 chat）。需在验收覆盖此兜底表现（建议：检测到 `mutationStatements` 非空而 `toolProvider` 为空时，给 Agent/用户一个明确提示）。

### 3. 两条渲染路径都要接 `toolProvider`

- **inline**：`OpenUiArtifactView/index.tsx` 的 `<Renderer ... toolProvider={...} />`。
- **sidecar / 文件预览**：`nuwax-openui-mcp` 的 `RuntimeApp.tsx`；因 iframe 隔离，需在 postMessage 协议**新增两类消息**：
  - host → runtime：下发 `toolProvider` 可调用的工具清单（来自 `bindings.tools`）。
  - runtime → host：`OPENUI_TOOL_CALL {nonce, toolName, args}` 请求执行；host 执行后回 `OPENUI_TOOL_RESULT {nonce, toolName, result|error}`，runtime 侧把 promise resolve/reject 给 `toolProvider`。

### 4. Query 取数 + loading + 轮询

- `Query` 挂载 / `$var` 依赖变化 → QueryManager 经 `toolProvider` 取数，回注绑定名。
- 用 `queryLoader` 提供加载态（react-ui 自带 `useIsQueryLoading`），避免空态闪烁。
- `refreshSeconds`：接上 `toolProvider` 后 QueryManager 自动调度；需确认 host 允许 iframe/inline 在后台定时发 tool 调用（鉴权/频控）。

### 5. 鉴权与边界

- tool 桥必须走 nuwax 已登录的 MCP 调用通道，携带会话/用户上下文；`serverId` 要在后端可解析。
- 仅允许 `bindings.tools` 声明过的 `{serverId, toolName}`，拒绝界面里任意写的 toolName（防越权）。

## 验收

- [ ] 声明了 `bindings.tools` 的 `Query` 看板，挂载即渲染真实数据（非 default 空态）。
- [ ] `$var`（如筛选条件）变化时 `Query` 自动重取并刷新图表/表格。
- [ ] `Mutation` + `@Run` 按钮真正调用 tool，结果回注 UI（如保存后列表刷新）。
- [ ] **回归**：普通表单 submit 仍走 chat 回传，用户气泡干净（无 `@Run`/`Query` 裸文本）。
- [ ] `refreshSeconds` 轮询按间隔重取（若启用）。
- [ ] inline 与 sidecar 两入口行为一致。
- [ ] 未在 `bindings.tools` 声明的 toolName 被拒绝并有明确错误。
- [ ] 写了 `@Run`/Mutation 但未配置 tool 桥（`toolProvider` 为空）时，有明确兜底提示，不静默失败、也不污染 chat。

## 涉及文件

| 仓库 | 路径 | 改动 |
| --- | --- | --- |
| nuwax | `src/components/business-component/OpenUiArtifactView/index.tsx` | inline 接 `toolProvider` + action 分流 + `queryLoader` |
| nuwax | （后端 / tool 桥服务） | 新增：把 `{serverId, toolName}` 解析为可调用 MCP 通道，供 inline 与 sidecar 复用 |
| nuwax-openui-mcp | `packages/runtime/web/RuntimeApp.tsx` | sidecar 接 `toolProvider`；postMessage 增 `OPENUI_TOOL_CALL` / `OPENUI_TOOL_RESULT` |
| nuwax | `src/components/business-component/OpenUiArtifactView/`（runtime frame host） | 响应 sidecar 的 tool 调用消息，转发到 tool 桥 |
| nuwax-openui-mcp | `packages/server/src/openui-reference.ts` | 执行落地后，去掉 `refreshSeconds`「未支持」的说明 |

## 参考

- 官方 react-ui `RendererProps.toolProvider` / `queryLoader`：`@openuidev/react-ui@0.12.1`
- 官方 lang-core `createQueryManager` / `extractToolResult` / `McpClientLike` / `ToolProvider`：`@openuidev/lang-core@0.2.9`
- 语法文档（已预埋）：`nuwax-openui-mcp` `packages/server/src/openui-reference.ts` `QUERY_MUTATION_GUIDE`
