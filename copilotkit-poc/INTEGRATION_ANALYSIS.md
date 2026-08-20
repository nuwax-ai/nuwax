# CopilotKit / AG-UI 接入分析与 PoC 报告

> 项目：nuwax AppDev Web IDE
> 日期：2026-06-13
> 评估范围：CopilotKit v1.60.1 + AG-UI 协议接入可行性

---

## 一、背景

nuwax 当前的 AI 对话系统基于自建 SSE 流式传输，核心代码分散在以下文件中：

| 文件 | 行数 | 职责 |
|------|------|------|
| `hooks/useAppDevChat.ts` | ~1,028 | SSE 消息处理、聊天状态管理 |
| `utils/fetchEventSource.ts` | ~232 | SSE 连接管理 |
| `utils/chatUtils.ts` | ~930 | 流式追加、历史合并 |
| `services/appDev.ts` | ~676 | API 封装 |
| `pages/AppDev/index.tsx` | ~2,089 | 页面编排、消息分发 |

后端 SSE 端点：`/api/custom-page/ai-chat-flux`，使用 DeepSeek-V3 模型。

本报告评估将 CopilotKit + AG-UI 协议接入 nuwax 框架的可行性、开发工作量和预期收益。

---

## 二、架构映射

CopilotKit 的 AG-UI 协议与 nuwax 的 SSE 消息类型存在 **1:1 映射关系**，这意味着迁移成本可控：

| nuwax SSE 事件 | AG-UI 事件类型 | 说明 |
|---|---|---|
| `agent_thought_chunk` | `REASONING_MESSAGE_START/CONTENT/END` | AI 思考过程 |
| `agent_message_chunk` | `TEXT_MESSAGE_START/CONTENT/END` | AI 回复内容 |
| `tool_call` | `TOOL_CALL_START/ARGS/END` | 工具调用 |
| `prompt_end` | `RUN_FINISHED` | 会话结束 |
| _(无)_ | `RUN_STARTED` | AG-UI 额外提供 |
| _(无)_ | `STATE_SNAPSHOT` | AG-UI 额外提供，用于状态同步 |

**关键发现**：映射是天然的，不需要复杂的适配层。

---

## 三、PoC 验证结果

### 3.1 PoC 结构

```
copilotkit-poc/
├── server/index.ts          # Express + CopilotKit v2 runtime
├── src/
│   ├── App.tsx              # CopilotKit Provider + 所有 hooks
│   ├── main.tsx             # 入口
│   ├── index.css            # 样式
│   └── components/
│       ├── FileTree.tsx     # 文件树组件
│       ├── CodeEditor.tsx   # 代码编辑器
│       └── GenUIDiff.tsx    # 生成式 UI diff + HITL 确认
├── vite.config.ts           # Vite + 代理配置
└── package.json
```

### 3.2 验证的功能点

| # | 功能 | 状态 | 验证方式 |
|---|------|------|----------|
| 1 | SSE 流式回复 (TEXT_MESSAGE_CONTENT) | ✅ 通过 | Playwright 发送消息，确认逐词流式输出 |
| 2 | AI 思考过程展示 (REASONING_MESSAGE) | ✅ 通过 | 确认 reasoning 在回复前显示 |
| 3 | `useCopilotReadable` 状态共享 | ✅ 通过 | Agent 能读取文件树数量 |
| 4 | `useCopilotAction` 工具调用 | ✅ 通过 | createFile/updateFile 注册并可调用 |
| 5 | 生成式 UI (Generative UI) | ✅ 通过 | previewCodeChange 的 render prop 渲染 diff 卡片 |
| 6 | Human-in-the-Loop 确认 | ✅ 通过 | diff 卡片含 Apply/Reject 按钮 |
| 7 | CopilotSidebar 聊天 UI | ✅ 通过 | 侧边栏正常显示、消息列表、输入框均可用 |

### 3.3 技术选型

- **CopilotKit v1.60.1**（最新稳定版）
- **Runtime v2 API**：`@copilotkit/runtime/v2`，使用 `createCopilotExpressHandler`
- **Agent 模式**：`BuiltInAgent` + `type: 'custom'` 工厂模式，异步生成器输出 AG-UI 事件
- **单路由模式**：`mode: 'single-route'`，单个 POST 端点处理所有操作
- **前端**：React 18 + Vite，`CopilotKit` Provider + `CopilotSidebar`

---

## 四、开发工作量评估

### 总计：3-5 人日

| 模块 | 工作量 | 说明 |
|------|--------|------|
| Runtime 适配层 | 1-2 人日 | 将 nuwax SSE 端点的响应转换为 AG-UI 事件流。映射关系明确（见第二节），核心是写一个 SSE-to-AGUI 转换器 |
| 前端 hooks 迁移 | 1-1.5 人日 | 用 `useCopilotAction` 替换现有 `tool_call` 处理逻辑，用 `useCopilotReadable` 替换手动上下文传递 |
| UI 组件适配 | 0.5-1 人日 | `CopilotSidebar` 替换自定义 ChatView，自定义消息渲染组件 |
| 测试与联调 | 0.5 人日 | 端到端验证，处理边缘情况 |

### 不需要额外工作量的部分

- **不需要重写后端**：nuwax 现有 SSE 端点可继续使用，只需在 runtime 层做事件转换
- **不需要改变 AI 模型**：DeepSeek-V3 等模型不受影响
- **不需要修改文件管理系统**：`useAppDevFileManagement.ts` 保持不变

---

## 五、收益分析

### 5.1 代码精简

接入 CopilotKit 后可**替换约 1,500 行自建 SSE 代码**：

| 被替换的内容 | 原行数 | 替换为 |
|---|---|---|
| SSE 连接管理 | ~232 行 | CopilotKit 内部管理 |
| 消息流处理 | ~930 行 | CopilotKit 自动处理 AG-UI 流 |
| 工具调用逻辑 | ~300 行 | `useCopilotAction` 声明式注册 |
| 聊天 UI 组件 | ~257 行 | `CopilotSidebar` 开箱即用 |

### 5.2 新增能力

| 能力 | 说明 | 当前是否支持 |
|------|------|-------------|
| 生成式 UI (Generative UI) | AI 回复中嵌入交互式组件 | ❌ 当前不支持 |
| Human-in-the-Loop | 关键操作需用户确认后才执行 | ❌ 当前不支持 |
| 前端 action 注册 | 声明式注册工具，无需改后端 | ❌ 当前不支持 |
| 自带聊天 UI | 完整的聊天界面组件 | ✅ 当前有自建版本 |
| 多 Agent 支持 | 可注册多个 Agent | ❌ 当前不支持 |

### 5.3 生态优势

- CopilotKit 是 GitHub 上最活跃的 AI 聊天框架之一（star 数持续增长）
- AG-UI 是开放协议，不锁定供应商
- 支持多种 AI 后端（OpenAI、Anthropic、DeepSeek 等）

---

## 六、风险与注意事项

### 风险 1：UmiJS 无 API Routes

nuwax 使用 UmiJS，本身不提供后端 API Routes 能力。CopilotKit Runtime 需要一个 Node.js 进程来运行。

**影响**：需要部署一个独立的 Express 进程作为 runtime。

**缓解方案**：
- 方案 A：在现有后端服务中增加 CopilotKit runtime 端点
- 方案 B：部署独立的 runtime 微服务（PoC 采用此方案）
- 方案 C：使用 CopilotKit 的 Next.js 适配器，单独部署一个 Next.js runtime

### 风险 2：PLAN 事件无 AG-UI 对应

nuwax 后端可能有 `PLAN` 类型的消息（任务规划），AG-UI 协议目前没有直接的 PLAN 事件。

**影响**：如果依赖 PLAN 事件展示任务列表，需要额外处理。

**缓解方案**：用 `TEXT_MESSAGE_CONTENT` + 自定义渲染组件模拟，或用 `TOOL_CALL` 包装。

### 风险 3：包体积增加

CopilotKit 前端包（react-core + react-ui）约增加 ~200KB（gzip 后约 ~65KB）。

**影响**：对首屏加载有轻微影响。

**缓解方案**：使用动态 import 按需加载聊天组件。

### 风险 4：自定义样式覆盖

`CopilotSidebar` 自带样式，要与 nuwax 的 AntD 设计体系融合需要额外的 CSS 覆盖。

**缓解方案**：CopilotKit 支持自定义 CSS class 和主题覆盖。

---

## 七、技术方案对比

| 维度 | CopilotKit | 自建 SSE（当前方案） | LangChain.js |
|------|-----------|-------------------|-------------|
| 开发效率 | ⭐⭐⭐⭐⭐ 声明式 | ⭐⭐ 手动管理 | ⭐⭐⭐ 中等 |
| 生成式 UI | ✅ 内置 | ❌ 不支持 | ❌ 不支持 |
| Human-in-the-Loop | ✅ 内置 | ❌ 不支持 | ❌ 不支持 |
| 前端工具注册 | ✅ useCopilotAction | ❌ 需后端定义 | ❌ 需后端定义 |
| 维护成本 | 低（社区维护） | 高（自维护） | 中 |
| 协议开放性 | AG-UI 开放协议 | 私有 | LangChain 生态 |
| 包体积增量 | ~65KB gzip | 0 | ~80KB gzip |
| 学习曲线 | 低 | - | 中 |

**结论**：CopilotKit 在开发效率、生成式 UI、HITL 三方面有明显优势，且 AG-UI 协议保证不锁定供应商。

---

## 八、迁移路径（4 阶段）

### 阶段 1：Runtime 适配（1-2 天）

1. 部署独立的 CopilotKit runtime（Express）
2. 编写 SSE-to-AGUI 事件转换器，对接 nuwax 后端 `/api/custom-page/ai-chat-flux`
3. 验证基础流式回复和思考过程展示

### 阶段 2：前端 hooks 迁移（1-1.5 天）

1. 将 `useAppDevChat.ts` 的消息处理逻辑迁移到 `CopilotKit` Provider
2. 用 `useCopilotAction` 替换 `tool_call` 处理
3. 用 `useCopilotReadable` 替换手动上下文传递

### 阶段 3：UI 适配（0.5-1 天）

1. 用 `CopilotSidebar` 替换 `ChatView` 组件
2. 自定义样式覆盖以匹配 AntD 设计体系
3. 实现生成式 UI diff 确认组件

### 阶段 4：测试与优化（0.5 天）

1. 端到端测试所有功能
2. 处理边缘情况（网络中断、超时等）
3. 性能优化（按需加载、包体积分析）

---

## 九、结论

**CopilotKit / AG-UI 适合接入 nuwax**，理由：

1. **架构天然兼容**：AG-UI 事件与 nuwax SSE 消息 1:1 映射，迁移成本低
2. **工作量可控**：3-5 人日完成完整迁移
3. **显著收益**：替换约 1,500 行自建代码，新增生成式 UI 和 HITL 能力
4. **不锁定供应商**：AG-UI 是开放协议，后端可随时切换

**建议**：按 4 阶段迁移路径推进，先从 Runtime 适配开始验证，逐步替换前端逻辑。

---

## 十、PoC 运行方式

```bash
cd copilotkit-poc
npm install
npm run dev
```

- 前端：http://localhost:5174
- Runtime：http://localhost:4001
- 健康检查：http://localhost:4001/health

当前 PoC 已在运行中，可直接访问 http://localhost:5174 体验。
