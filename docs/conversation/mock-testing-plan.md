# 终态收敛修复的测试验收方案

## Context

本轮修复（10 项核心修复 + 观测基建）需要验收。用户提出建一个完整复刻会话页面的 mock 数据驱动测试页面。

## 前置步骤

1. **拉专用分支** `feat/conversation-mock-testing`（基于 feat-2026.7.31）
2. **方案文档留存** 至 `docs/conversation/mock-testing-plan.md`

## 调研结论：市面上通行方案

### MSW v2.12+（2025 行业标准）

[MSW](https://mswjs.io/docs/sse/) v2.12.0 引入了一等公民 SSE 支持（`sse()` handler），是当前 React 生态推荐方案：

- ✅ 与 `@microsoft/fetch-event-source` 兼容（nuwax 使用的库）——[Alex O'Callaghan 教程](https://alexocallaghan.com/mock-sse-with-msw)专门验证了这一点
- ✅ vitest [官方推荐](https://vitest.dev/guide/mocking/requests)用 MSW 替代手动 fetch stub
- ✅ Service Worker 层拦截，dev 和 test 共用同一套 handler
- ❌ 需新增依赖（msw v2.12+），需配置 Service Worker
- ❌ 故障注入（如"迟到 154 秒的分片"）需要手工构造 ReadableStream 时序，不如直接控制回调直观

### umi 内置 mock

[umi mock](https://umijs.org/docs/guides/mock/) 基于 Express 中间件，可做 SSE 但需手动 `res.write()` + `res.flushHeaders()`：

```ts
// mock/conversation.ts — umi 的 SSE mock 写法
export default {
  'POST /api/agent/conversation/chat': (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.flushHeaders();
    // 按 script 时序 res.write(`data: {...}\n\n`)
  },
};
```

- ✅ 零新依赖，umi dev-server 原生支持
- ❌ 无 SSE 官方文档，有 [compression buffering 问题](https://stackoverflow.com/questions/61412538)
- ❌ 故障注入场景需在 mock handler 内实现延迟/乱序/中断逻辑，维护成本高

### 项目现有 vitest 模式（已验证可行）

`tests/conversationInfoModel.test.ts` 已有成熟模式：mock `createSSEConnection` → 捕获 handlers → 手动调 `onMessage/onError/onClose` 模拟任意事件序列。这正是故障注入需要的。

## 推荐方案（分三层）

### 第一层：修复现有测试（立即可做，半天）

| 问题 | 修复 | 工作量 |
| --- | --- | --- |
| `useExecutingTaskStatusPoll.test.ts` **3/10 失败** | import 改为 `@/hooks/useExecutingTaskStatusPoll` | 一行 |
| `findCurrentRoundStart` 零测试 | 在 `conversationInfoMessageList.test.ts` 补 4 个 case | 十几行 |
| `useResumeStreamHandlers` 三个新回调零覆盖 | 在现有 harness 补 3 个 test | ~60 行 |
| `finalizeStreamingPlaceholder` 零覆盖 | 在 `conversationInfoModel.test.ts` 补场景 | ~40 行 |

### 第二层：新增 hook 直接测试（半天）

`useConversationTerminalFinalizer` 不拥有 React state，所有依赖可注入：

```ts
// tests/useConversationTerminalFinalizer.test.ts
// renderHook + vi.fn() 注入 → 测试：
// - 跨会话守卫
// - PROCESSING 事件跳过（白名单）
// - FINAL_RESULT 全清（四步收敛）
// - ERROR 全清
// - 占位收尾 stopped vs error
```

### 第三层：Mock 会话测试页面（用户的方案，1-2 天）

**技术选型：umi mock/ + SSE streaming**（不引入 MSW）

理由：零新依赖、dev-server 原生支持、mock handler 可精确控制事件时序和延迟。MSW 的 SSE 支持虽然是一等公民，但对本项目已有 `mock/` 目录 + `createSSEConnection` mock 模式而言是多余的。

#### 新增文件

| 文件 | 用途 |
| --- | --- |
| `mock/conversationMock.ts` | SSE 流式 mock（chat 接口 + sub 接口 + 详情接口） |
| `src/mocks/sseScriptPlayer.ts` | 事件脚本定义 + 回放器（供 mock handler 使用） |
| `src/pages/MockChat/index.tsx` | 测试页面：渲染 `UnifiedChatSession` + 场景选择器 + 断言面板 |
| `config/routes.ts` 加路由 | `/mock-chat`（dev only） |

#### 场景覆盖（完整）

| # | 场景 ID | 描述 | 验证哪个修复 | 数据类型覆盖 |
| --- | --- | --- | --- | --- |
| 1 | `NORMAL_SINGLE` | 单步正常完成：THINK chunks → CHAT chunks → FINAL_RESULT success=true | sweep 四步收敛 | MESSAGE(THINK), MESSAGE(CHAT), PROCESSING(ToolCall), FINAL_RESULT |
| 2 | `NORMAL_MULTI_STEP` | 多步输出：步骤 1 消息(Complete) → 步骤 2 消息(Complete) → 步骤 3 消息 → FINAL_RESULT | 轮次边界 findCurrentRoundStart | 多条 MESSAGE(CHAT) with 不同 id |
| 3 | `ERROR_MID_STREAM` | 流中 ERROR 事件到达，流继续（80s+ 后 FINAL_RESULT） | ERROR 同权清算 + 门打开防护 | MESSAGE, ERROR, MESSAGE(续), FINAL_RESULT |
| 4 | `LATE_CHUNK` | FINAL_RESULT 后 200ms 迟到一条 MESSAGE 分片 | 终态守卫 shouldDropLateMessageChunk | FINAL_RESULT → MESSAGE(迟到) |
| 5 | `PROCESSING_UNFINISHED` | 工具 PROCESSING(EXECUTING) 未收到 FINISHED，直接 FINAL_RESULT | sweep processing 残留清理 | PROCESSING(EXECUTING), FINAL_RESULT |
| 6 | `PROCESSING_STORM` | 密集 PROCESSING + 部分 FINISHED 丢失 + PROCESSING 载荷含可解析终态字段 | 事件类型白名单 | PROCESSING(EXECUTING→FINISHED→EXECUTING), MESSAGE |
| 7 | `SUB_ONLY_RECOVERY` | chat 连接静默死亡，仅 sub 流重放终态 | sub onTerminalEvent + 占位收尾 | sub 流的 MESSAGE(THINK/CHAT), FINAL_RESULT |
| 8 | `NETWORK_ERROR` | 流式中网络错误（fetch onerror） | chat onError 全量收尾 | 部分 MESSAGE → onError |
| 9 | `SUB_NETWORK_ERROR` | sub 流网络错误 | sub onStreamError 对齐 chat | sub 流部分数据 → onerror |
| 10 | `USER_CANCEL` | 用户点击停止 | runStopConversation + taskStatus=CANCEL | MESSAGE(Loading) → 停止 |
| 11 | `TASK_CONFLICT` | FINAL_RESULT 带"正在执行任务"错误 | 冲突型跳过清算 | FINAL_RESULT(error=正在执行任务) |
| 12 | `QUESTION_TYPE` | QUESTION 类型消息 finished=true → status=null | busy 检查不误判 | MESSAGE(QUESTION finished=true) |
| 13 | `PLAN_PROCESSING` | Plan 类型 PROCESSING 事件（执行计划） | Plan 事件不影响终态 | PROCESSING(type=Plan) |
| 14 | `CONTENT_WITH_TAGS` | 内容含 markdown-custom-process + task-result 标签 | TaskResult 组件 + content 不被守卫误拦 | MESSAGE(CHAT with tags), FINAL_RESULT(outputText with tags) |
| 15 | `EMPTY_CONVERSATION` | 空会话直接发送（首条消息） | CREATE → COMPLETE 路径 | 仅 1 条 USER + FINAL_RESULT |
| 16 | `DEEP_HISTORY` | 长会话（50+ 条消息）+ 轮询终态快照 | 快照合并 + 侧栏终态补偿 | 详情接口大量 messageList |
| 17 | `HEARTBEAT_ONLY` | 流空闲期仅心跳（60s+ 无内容事件） | 看门狗不误杀 | HEART_BEAT × N → FINAL_RESULT |
| 18 | `MULTI_TOOL_ONE_MSG` | 单条消息含多个工具调用（processingList 多项） | sweep 清理 processingList 数组 | PROCESSING(多个 toolCallId) |
| 19 | `CANCELLED_BY_BACKEND` | 后端返回 stop_reason=cancelled | CANCEL 终态 | FINAL_RESULT(stop_reason=cancelled) |
| 20 | `IDLE_POLL_TERMINAL` | 空闲态轮询拿到终态快照（无 SSE 事件） | poll-snapshot 路径 | 仅详情接口（taskStatus 变化） |
| 21 | `PERMISSION_REQUEST` | 流式中 acpRequestPermission → 弹审批框 → 批准 → 流继续 | 权限审批 UI + 审批后流恢复 | PROCESSING(subEventType=REQUEST_PERMISSION, rawInput 含 options) |
| 22 | `PERMISSION_DENY` | 同上但用户拒绝 → agent 调整策略 | 拒绝后行为 | PROCESSING(REQUEST_PERMISSION) → MESSAGE(调整) |
| 23 | `PERMISSION_TIMEOUT` | 权限请求后无响应 → 超时处理 | 超时兜底 | PROCESSING(REQUEST_PERMISSION) → 长时间无后续事件 |
| 24 | `ASK_QUESTION` | nuwax_ask_question → 弹问答框 → 用户选择 → 流继续 | ask-question 交互 | PROCESSING(title=nuwax_ask_question, rawInput 含 question/options) |
| 25 | `ASK_QUESTION_UNANSWERED` | 问答框弹出后用户不回答 → 流暂停 | 未回答时流暂停 | PROCESSING(ask_question) → 无后续事件 |
| 26 | `OPENUI_RENDER` | nuwax_render_openui → 内嵌 OpenUI 组件渲染 | OpenUI 组件渲染 | PROCESSING(title=nuwax_render_openui, rawInput 含 component/props) |
| 27 | `OPENUI_INTERACTIVE` | OpenUI 组件含交互（按钮/表单）→ 交互 → 状态更新 | OpenUI 交互式组件 | PROCESSING(openui) → MESSAGE(含交互组件) |
| 28 | `INTERVENTION_MIXED` | 同轮混合：权限 + ask-question + openui + 正常分片 + 终态 | 多干预混合终态收敛 | PROCESSING(REQUEST_PERMISSION) + PROCESSING(ask_question) + PROCESSING(openui) + MESSAGE + FINAL_RESULT |

#### Mock 数据类型完整清单

**SSE 事件类型（chat 流 + sub 流共用）：**

```ts
interface MockSseEvent {
  eventType: 'MESSAGE' | 'PROCESSING' | 'FINAL_RESULT' | 'ERROR' | 'HEART_BEAT';
  requestId: string;
  completed?: boolean;
  error?: string | null;
  data?: {
    // MESSAGE
    role?: 'ASSISTANT' | 'USER';
    type?: 'THINK' | 'CHAT' | 'QUESTION';
    text?: string; // 分片文本
    think?: string;
    finished?: boolean;
    id?: string | null; // 多步轮的步骤 id
    // PROCESSING
    targetId?: number;
    name?: string;
    status?: 'EXECUTING' | 'FINISHED' | 'FAILED';
    type?: 'Plan' | 'ToolCall' | 'Event';
    subEventType?:
      | 'REQUEST_PERMISSION'
      | 'OPEN_DESKTOP'
      | 'ASK_QUESTION'
      | 'RENDER_UI';
    toolCallId?: string;
    rawInput?: Record<string, unknown>; // 权限 options / ask-question question+options / openui component+props
    rawOutput?: Record<string, unknown>; // 工具输出
    result?: { executeId?: string; startTime?: number; endTime?: number };
    // FINAL_RESULT
    success?: boolean;
    outputText?: string;
    stop_reason?: string;
    componentExecuteResults?: unknown[];
  };
}
```

**干预事件 Mock 数据（权限审批 / ask-question / nuwax-openui）：**

```ts
// 权限审批事件（acpRequestPermission）
interface MockPermissionRequest {
  eventType: 'PROCESSING';
  data: {
    type: 'Event';
    subEventType: 'REQUEST_PERMISSION';
    toolCallId: string;
    name: string; // 触发审批的工具名
    status: 'EXECUTING';
    rawInput: {
      options: Array<{
        optionId: string; // "allow_once" | "allow_always" | "reject"
        name: string; // "允许一次" | "总是允许" | "拒绝"
        kind?: string;
      }>;
      meta?: { title?: string; description?: string; command?: string };
    };
  };
}

// ask-question 事件（nuwax_ask_question MCP）
interface MockAskQuestion {
  eventType: 'PROCESSING';
  data: {
    type: 'ToolCall';
    name: string; // 含 "nuwax_ask_question"
    status: 'EXECUTING' | 'FINISHED';
    toolCallId: string;
    rawInput: {
      question: string; // 问题文本
      options?: string[]; // 可选选项
      allowMultiple?: boolean;
    };
  };
}

// nuwax-openui 事件（nuwax_render_openui MCP）
interface MockOpenUI {
  eventType: 'PROCESSING';
  data: {
    type: 'ToolCall';
    name: string; // 含 "nuwax_render_openui"
    status: 'EXECUTING' | 'FINISHED';
    toolCallId: string;
    rawInput: {
      component: string; // OpenUI 组件名
      props: Record<string, unknown>; // 组件属性
    };
  };
}
```

**详情接口返回：**

```ts
interface MockConversationDetail {
  taskStatus: 'CREATE' | 'EXECUTING' | 'COMPLETE' | 'FAILED' | 'CANCEL';
  messageList: MockMessage[];
  agentId: number;
  id: number;
}

interface MockMessage {
  id: string | number;
  role: 'ASSISTANT' | 'USER';
  type: string;
  status: 'loading' | 'incomplete' | 'complete' | 'error' | 'stopped' | null;
  text: string;
  think?: string;
  processingList?: MockProcessing[];
  finalResult?: {
    success: boolean;
    outputText: string;
    [key: string]: unknown;
  };
}
```

**内置测试数据模板（中文内容，贴近真实场景）：**

- 短对话（PPT 制作类）
- 长对话（代码审查类，含 markdown-custom-process）
- 多步工作流（含 Plan + 多个 ToolCall）
- 带错误的对话（含 ERROR + 恢复）
- 停止后对话（Stopped 状态消息）

#### Mock 页面布局

```
┌─────────────────────────────────────────────┐
│ 场景: [NORMAL] [ERROR_MID] [LATE_CHUNK] ... │
│ 速度: ○ 正常 ○ 快速 ○ 瞬间                  │
│ [▶ 播放] [⏹ 停止]                           │
├─────────────────────────────────────────────┤│        完整的 UnifiedChatSession            │
├─────────────────────────────────────────────┤
│ 断言结果:                                    │
│ ✓ 终态后按钮回发送态                         │
│ ✓ console 有 finalize terminal              │
│ ✓ 无 active-rising-blocked 死循环           │
│ ✓ 末条消息有复制按钮                         │
└─────────────────────────────────────────────┘
```

#### SSE mock 核心实现

```ts
// mock/conversationMock.ts
export default {
  // 会话详情（轮询接口）
  'POST /api/agent/conversation/:id': (req, res) => {
    const status = getMockTaskStatus(req.params.id);
    res.json(S({ taskStatus: status, messageList: getMockMessages() }));
  },

  // chat SSE 流
  'POST /api/agent/conversation/chat': (req, res) => {
    const scenario = getCurrentScenario();
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.flushHeaders();

    playSseScript(res, scenario, {
      onEvent: (event) => res.write(`data:${JSON.stringify(event)}\n\n`),
      onDone: () => res.end(),
      // 可按场景需要加 delay
    });
  },

  // sub SSE 流
  'GET /api/agent/conversation/chat/sub/:id': (req, res) => { ... },
};
```

#### 验收断言（自动检查）

| 断言         | 检查方式                                         |
| ------------ | ------------------------------------------------ |
| 按钮回发送态 | DOM: `stop-box-active` 类不存在                  |
| 终态日志     | console 有 `[Conv:Terminal] finalize terminal`   |
| 无状态回退   | console 无 `active-rising-blocked-by-ack` 死循环 |
| 轮询恢复     | console 有 `[Conv:Resume] resume`                |
| 守卫 B 触发  | console 有 `drop late MESSAGE chunk`             |
| 复制按钮     | DOM 检查                                         |

### 关键设计决策

1. **不用 MSW**：项目已有 `mock/` + vitest SSE mock 模式，MSW 增加复杂度无额外收益
2. **umi mock 做 SSE**：`res.write()` + `res.flushHeaders()` 可工作，需注意 dev-server 压缩
3. **场景脚本化**：每个 bug 案例对应一个 scenario 脚本，可精确复现
4. **与现有 E2E 互补**：E2E 测正常流程，mock 页面测故障注入（正常环境无法复现的 bug）

## 验证

```bash
# 第一层
npm run test:conversation  # 全绿

# 第二层
npx vitest run tests/useConversationTerminalFinalizer.test.ts

# 第三层
npm run dev  # 打开 /mock-chat → 选场景 → 播放 → 看断言
```

## 优先级

1. **第一层**（修现有测试 + 补单元测试）——半天，覆盖 80% 修复逻辑
2. **第二层**（hook 直接测试）——半天，覆盖边界
3. **第三层**（mock 页面）——1-2 天，覆盖端到端故障注入

---

## 实施现状（2026-08-21，第三层已落地并持续演进）

### 目录与数据流（规范迁移后）

- **场景定义单点**：`mock/conversationScenarios.ts`（32 个场景，SSE 事件脚本 + helper）
- **mock 服务端**：`mock/conversationMock.ts`（Umi dev-server，SSE 回放 + 12 个接口）
- **验收页**：`src/examples/MockChat`（经 `GET /api/mock/conversation/scenarios` 拉元数据， `src` 业务代码零依赖 mock 数据）
- **合同测试**：`tests/interventionDockScenarios.test.ts`（11 用例，按 model 消费方式回放场景锁定 applier 判别对齐；runtime 线复用同一 applier，两轨同受益）

### 入口

- `/mock-chat`：普通形态（dev-only 路由）
- `/app/mock-chat`：应用内嵌形态（`/app` 前缀由 useOpenApp 自动识别）
- `?conversationRuntime=1`：runtime 轨（M0 双轨接入，页面头部显示当前轨）
- `?scenario=<id>&speed=<n>&autoplay=1`：E2E 驱动参数（场景/速度/自动播放，见 M2）
- `npm run e2e:mock-chat`：断言型全场景回归（31 场景 × 双轨，无登录态；`E2E_SCENARIOS` / `E2E_LINE` 过滤，经 `scripts/e2e/ego-run.mjs` 桥接 env——ego-browser 沙箱不透传父进程环境变量）

### ⚠️ mock 层热重载坑

Umi mock 只 watch `mock/` 目录：**修改 `mock/conversationScenarios.ts` 后必须 touch `mock/conversationMock.ts`（或重启 dev server）**，否则新场景报 `MOCK_SCENARIO_NOT_FOUND`（HTTP 400），验收页会给出该提示。

### 32 场景清单

| 类别 | 场景 |
| --- | --- |
| 基础终态 | NORMAL_SINGLE、NORMAL_MULTI_STEP、ERROR_MID_STREAM、LATE_CHUNK、CANCELLED_BY_BACKEND、HEARTBEAT_ONLY |
| 传输故障 | SUB_ONLY_RECOVERY、NETWORK_ERROR、SUB_NETWORK_ERROR |
| processing | PROCESSING_STORM、PROCESSING_UNFINISHED、MULTI_TOOL_ONE_MSG、QUESTION_TYPE、PLAN_PROCESSING（真实抓包 7 步） |
| 渲染全景 | RENDER_SHOWCASE（Plan 推进 + 11 种 process type + diff + OpenUI inline + group/conversation/task-result） |
| 恢复/轮询 | SESSION_RESUME（EXECUTING 半途快照 + sub 续接 + 轮询同步）、IDLE_POLL_TERMINAL、EMPTY_CONVERSATION、DEEP_HISTORY |
| 干预 | PERMISSION_REQUEST/DENY/TIMEOUT、ASK_QUESTION/UNANSWERED、OPENUI_RENDER/INTERACTIVE、INTERVENTION_MIXED、ASK_DUPLICATE（真实载荷双卡）、INTERVENTION_STACK（四选项/编辑类/堆叠） |
| 队列/停止 | USER_CANCEL、TASK_CONFLICT、MESSAGE_QUEUE_HOLDING |

### 后续优化

见 [mock-optimization-plan.md](./mock-optimization-plan.md)（v3：M0 双轨、M2 断言型 E2E 已落地，M1 侵入单点化完成，M3 交互型 E2E 进行中）。
