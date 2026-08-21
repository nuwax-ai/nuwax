/**
 * 会话 Mock 场景脚本定义
 *
 * 每个场景是一组按时间序排列的 SSE 事件，由 mock/conversationMock.ts
 * 在 dev-server 内按脚本回放。用于 /mock-chat 测试页面的故障注入验收。
 */

export type MockScenarioId =
  | 'NORMAL_SINGLE'
  | 'NORMAL_MULTI_STEP'
  | 'ERROR_MID_STREAM'
  | 'LATE_CHUNK'
  | 'SUB_ONLY_RECOVERY'
  | 'NETWORK_ERROR'
  | 'SUB_NETWORK_ERROR'
  | 'PROCESSING_STORM'
  | 'PROCESSING_UNFINISHED'
  | 'USER_CANCEL'
  | 'TASK_CONFLICT'
  | 'QUESTION_TYPE'
  | 'PLAN_PROCESSING'
  | 'EMPTY_CONVERSATION'
  | 'DEEP_HISTORY'
  | 'IDLE_POLL_TERMINAL'
  | 'MULTI_TOOL_ONE_MSG'
  | 'PERMISSION_REQUEST'
  | 'PERMISSION_DENY'
  | 'PERMISSION_TIMEOUT'
  | 'ASK_QUESTION'
  | 'ASK_QUESTION_UNANSWERED'
  | 'OPENUI_RENDER'
  | 'OPENUI_INTERACTIVE'
  | 'INTERVENTION_MIXED'
  | 'RENDER_SHOWCASE'
  | 'SESSION_RESUME'
  | 'ASK_DUPLICATE'
  | 'INTERVENTION_STACK'
  | 'MESSAGE_QUEUE_HOLDING'
  | 'HEARTBEAT_ONLY'
  | 'CANCELLED_BY_BACKEND';

export interface MockSseEvent {
  eventType: string;
  requestId: string;
  completed?: boolean;
  error?: string | null;
  data?: Record<string, unknown>;
  delayMs?: number; // 事件间隔，默认 100ms
}

export interface MockScenario {
  id: MockScenarioId;
  label: string;
  description: string;
  /** 验证的修复项 */
  verifies: string;
  events: MockSseEvent[];
  /** mock 服务端使用的传输故障模式。 */
  transport?: 'normal' | 'network-error' | 'keep-open' | 'sub-only';
  /**
   * 验收页播放方式：默认发送一条用户消息触发；'resume' 表示不发送、
   * 仅装载 initialMessages 快照后直接 sub 续接（模拟刷新/重进会话）。
   */
  entry?: 'resume';
  /** 详情接口的初始消息，用于历史/轮询类场景。 */
  initialMessages?: Array<Record<string, unknown>>;
  /** 详情接口在读取指定次数后切换到终态。 */
  pollTerminalAfter?: number;
}

// ── 工具函数 ──

const req = (id: string) => `mock-req-${id}`;

const think = (text: string, finished = false): MockSseEvent => ({
  eventType: 'MESSAGE',
  requestId: req('1'),
  data: { role: 'ASSISTANT', type: 'THINK', text, think: null, finished },
});

const chat = (text: string, finished = false, id?: string): MockSseEvent => ({
  eventType: 'MESSAGE',
  requestId: req('1'),
  data: { role: 'ASSISTANT', type: 'CHAT', text, think: null, finished, id },
});

const heartbeat = (): MockSseEvent => ({
  eventType: 'HEART_BEAT',
  requestId: req('1'),
});

const processing = (
  name: string,
  status: string,
  toolCallId: string,
  extra?: Record<string, unknown>,
): MockSseEvent => ({
  eventType: 'PROCESSING',
  requestId: req('1'),
  data: {
    targetId: -1,
    name,
    status,
    toolCallId,
    type: 'ToolCall',
    result: { executeId: toolCallId, startTime: Date.now() },
    ...extra,
  },
});

// ── 干预类事件 helper ──
// 载荷对齐 AgentIntervention 三个 applier 的真实判别口径
// （applyAcpPermissionSseEvent / applyMcpAskToolCallSseEvent /
// applyOpenUiToolCallSseEvent）；扁平 ToolCall 形状不会触发审批卡 /
// ask-question 卡 / OpenUI 渲染。

const MOCK_SESSION_ID = 'mock-session-1';

/** 权限审批：PROCESSING + subEventType=REQUEST_PERMISSION，ACP 数据在 result.input。 */
const requestPermission = (
  toolCallId: string,
  title: string,
  rawInput: Record<string, unknown>,
  options: Array<{ optionId: string; name: string; kind: string }> = [
    { optionId: 'allow_once', name: '允许一次', kind: 'allow_once' },
    { optionId: 'reject', name: '拒绝', kind: 'reject_once' },
  ],
  kind = 'other',
): MockSseEvent => ({
  eventType: 'PROCESSING',
  requestId: req('1'),
  data: {
    targetId: -1,
    name: 'Backend.Sandbox.Event.RequestPermission',
    type: 'Event',
    status: 'FINISHED',
    executeId: toolCallId,
    subEventType: 'REQUEST_PERMISSION',
    result: {
      id: -1,
      name: 'Backend.Sandbox.Event.RequestPermission',
      type: 'Event',
      startTime: Date.now(),
      endTime: Date.now(),
      input: {
        request_permission_request: {
          sessionId: MOCK_SESSION_ID,
          toolCall: {
            toolCallId,
            kind,
            status: 'pending',
            title,
            rawInput,
          },
          options,
        },
        toolCallId,
      },
      executeId: toolCallId,
    },
    _meta: {
      nuwaclaw_intervention_id: `itv-${toolCallId}`,
      nuwaclaw_revision: 1,
    },
  },
});

/** ask-question：PROCESSING + result.input 携带 nuwax.mcp_ask.v2 表单。 */
const askQuestion = (
  requestId: string,
  title: string,
  fields: Array<Record<string, unknown>>,
): MockSseEvent => ({
  eventType: 'PROCESSING',
  requestId: req('1'),
  data: {
    targetId: -1,
    executeId: requestId,
    result: {
      executeId: requestId,
      input: {
        schemaVersion: 'nuwax.mcp_ask.v2',
        requestId,
        revision: 1,
        sessionId: MOCK_SESSION_ID,
        title,
        toolName: 'nuwax_ask_question',
        ui: {
          version: 'nuwax.interaction.v2',
          presentation: 'inline',
          title,
          fields,
          submitLabel: '确认',
        },
      },
    },
  },
});

/**
 * ask-question（真实抓包形状，吸纳自 McpAskDuplicateDemo）：
 * PROCESSING + subEventType=ASK_QUESTION，mcpAsk 数据在 result.data——
 * 与 askQuestion() 的 result.input 路径分别覆盖 applier 的两条判别分支。
 * schemaVersion 保留真实后端曾下发的 v1 字面量 + v2 形状（fields 无 schema），
 * 前端走 parseMcpAskToolInput 的裸 v2 兜底。
 */
const askQuestionReal = (
  requestId: string,
  executeId: string,
  title: string,
  fields: Array<Record<string, unknown>>,
): MockSseEvent => ({
  eventType: 'PROCESSING',
  requestId: req('1'),
  data: {
    targetId: null,
    name: 'AskQuestion',
    type: 'Event',
    status: 'EXECUTING',
    subEventType: 'ASK_QUESTION',
    result: {
      name: title,
      type: 'Event',
      success: true,
      data: {
        schemaVersion: 'nuwax.mcp_ask.v1',
        ui: { presentation: 'inline', title, fields },
        requestId,
        title,
        revision: 1,
      },
      executeId,
      input: null,
    },
  },
});

/** 六种 widget 的富表单字段（吸纳自真实载荷 sharedFields）。 */
const RICH_ASK_FIELDS = [
  {
    widget: 'file',
    name: 'file',
    type: 'string',
    title: '补充内容',
    required: false,
  },
  {
    widget: 'text',
    name: 'name',
    type: 'string',
    title: '你的名字',
    required: false,
  },
  {
    widget: 'select',
    name: 'schedule',
    options: [
      { label: '立即执行', value: '立即执行' },
      { label: '夜间执行', value: '夜间执行' },
    ],
    type: 'string',
    title: '调度',
    required: false,
  },
  {
    widget: 'radio',
    name: 'priority',
    options: [
      { label: '低', value: 'low' },
      { label: '中', value: 'medium' },
      { label: '高', value: 'high' },
    ],
    type: 'string',
    title: '优先级',
    required: false,
  },
  {
    widget: 'checkboxes',
    name: 'notify',
    options: [
      { label: '站内信', value: 'inbox' },
      { label: '邮件', value: 'email' },
    ],
    type: 'array',
    title: '完成后通知',
    required: false,
  },
  {
    widget: 'number',
    name: 'retry',
    type: 'integer',
    title: '失败重试次数',
    required: false,
  },
];

/** OpenUI inline 渲染：PROCESSING + subEventType=RENDER_UI，openui-lang 源在 result.input。 */
const renderOpenUi = (
  executeId: string,
  title: string,
  source: string,
  status: 'EXECUTING' | 'FINISHED' = 'FINISHED',
): MockSseEvent => ({
  eventType: 'PROCESSING',
  requestId: req('1'),
  data: {
    targetId: -1,
    subEventType: 'RENDER_UI',
    status,
    executeId,
    result: {
      executeId,
      name: 'Backend.Sandbox.Event.RenderUi',
      status,
      data: null,
      input: {
        schemaVersion: 'nuwax.openui/v1',
        title,
        presentation: { mode: 'inline', preferredWidth: 'wide' },
        document: { language: 'openui-lang', specVersion: '0.5', source },
        bindings: { tools: [] },
        fallback: { markdown: '' },
      },
    },
  },
});

/** Plan 计划列表：同一 executeId 逐步 upsert 快照，步骤状态在 result.data 数组演进。 */
const planSteps = (
  toolCallId: string,
  steps: Array<{ status: string; content: string; priority?: string }>,
  status: 'EXECUTING' | 'FINISHED' = 'EXECUTING',
): MockSseEvent => ({
  eventType: 'PROCESSING',
  requestId: req('1'),
  data: {
    targetId: -1,
    name: '执行计划',
    status,
    toolCallId,
    type: 'Plan',
    result: {
      executeId: toolCallId,
      startTime: Date.now(),
      input: {},
      data: steps,
    },
  },
});

/** 指定 type 的 PROCESSING：不同 AgentComponentTypeEnum 在 MarkdownCustomProcess 有专属渲染。 */
const typedProcess = (
  type: string,
  name: string,
  toolCallId: string,
  input: Record<string, unknown> = {},
): MockSseEvent => ({
  eventType: 'PROCESSING',
  requestId: req('1'),
  data: {
    targetId: -1,
    name,
    status: 'FINISHED',
    toolCallId,
    type,
    result: { executeId: toolCallId, startTime: Date.now(), input },
  },
});

/** 文件 diff 工具调用：result.data 携带 diff 项，渲染 +N/-N 徽章与展开列表。 */
const fileDiff = (
  toolCallId: string,
  name: string,
  diffs: Array<{ path: string; oldText: string; newText: string }>,
): MockSseEvent => ({
  eventType: 'PROCESSING',
  requestId: req('1'),
  data: {
    targetId: -1,
    name,
    status: 'FINISHED',
    toolCallId,
    type: 'ToolCall',
    result: {
      executeId: toolCallId,
      startTime: Date.now(),
      input: {},
      data: diffs.map((item) => ({ type: 'diff', ...item })),
    },
  },
});

const finalResult = (
  success: boolean,
  outputText: string,
  extra?: Record<string, unknown>,
): MockSseEvent => ({
  eventType: 'FINAL_RESULT',
  requestId: req('1'),
  completed: true,
  data: {
    success,
    outputText,
    startTime: Date.now(),
    endTime: Date.now(),
    ...extra,
  },
});

const errorEvent = (message: string): MockSseEvent => ({
  eventType: 'ERROR',
  requestId: req('1'),
  error: message,
});

const historyMessages = Array.from({ length: 52 }, (_, index) => ({
  id: `history-${index + 1}`,
  role: index % 2 === 0 ? 'USER' : 'ASSISTANT',
  messageType: index % 2 === 0 ? 'USER' : 'ASSISTANT',
  type: 'CHAT',
  status: 'complete',
  text:
    index % 2 === 0
      ? `历史问题 ${Math.floor(index / 2) + 1}`
      : `历史回答 ${Math.ceil(index / 2)}：这是用于验证长会话快照合并的内容。`,
  time: Date.now() - (52 - index) * 1000,
}));

// ── 真实抓包样本（吸纳自 src/examples/tool-plan-data-examples.ts）──
// 真实任务的 7 步计划（priority 等字段按抓包原样保留，贴近线上载荷）。
const REAL_PLAN_STEPS = [
  '删除TokenPriceQuery组件',
  '删除TokenIcon组件',
  '删除TokenPage页面',
  '从路由配置中移除Token页面路由',
  '从导航组件中移除Token页面链接',
  '从services.ts中删除Token相关API',
  '更新首页内容，移除Token查询相关描述',
].map((content) => ({ content, priority: 'medium', status: 'pending' }));

/** 按真实快照的推进形态生成计划：前 n 步 completed、第 n+1 步 in_progress。 */
const planProgress = (completedCount: number, inProgress = true) =>
  REAL_PLAN_STEPS.map((step, index) => ({
    ...step,
    status:
      index < completedCount
        ? 'completed'
        : index === completedCount && inProgress
        ? 'in_progress'
        : 'pending',
  }));

const planAllCompleted = () =>
  REAL_PLAN_STEPS.map((step) => ({ ...step, status: 'completed' }));

// ── 场景定义 ──

export const MOCK_SCENARIOS: MockScenario[] = [
  {
    id: 'NORMAL_SINGLE',
    label: '正常单步完成',
    description: 'THINK chunks → CHAT chunks → PROCESSING → FINAL_RESULT',
    verifies: 'sweep 四步收敛',
    events: [
      think('让我分析'),
      think('这个任务需要'),
      think('首先制定计划', true),
      processing('终端执行 ls -la', 'EXECUTING', 'tc-1'),
      processing('终端执行 ls -la', 'FINISHED', 'tc-1'),
      chat('好的，我来'),
      chat('帮你完成这个任务。'),
      chat('已执行完毕。', true),
      finalResult(true, '好的，我来帮你完成这个任务。已执行完毕。'),
    ],
  },
  {
    id: 'NORMAL_MULTI_STEP',
    label: '多步输出轮次',
    description: '步骤1消息(Complete) → 步骤2消息(Complete) → FINAL_RESULT',
    verifies: '轮次边界 findCurrentRoundStart',
    events: [
      chat('步骤1开始', false, 'step-1'),
      chat('步骤1完成', true, 'step-1'),
      chat('步骤2开始', false, 'step-2'),
      chat('步骤2完成', true, 'step-2'),
      chat('步骤3执行中', false, 'step-3'),
      chat('步骤3完成', true, 'step-3'),
      finalResult(true, '三个步骤全部完成。'),
    ],
  },
  {
    id: 'ERROR_MID_STREAM',
    label: '流中 ERROR 后流继续',
    description: 'MESSAGE → ERROR → MESSAGE 续 → FINAL_RESULT（1678724 场景）',
    verifies: 'ERROR 同权清算 + 门打开防护',
    events: [
      think('开始执行'),
      think('正在处理', true),
      processing('工具A', 'EXECUTING', 'tc-a'),
      errorEvent('Temporary failure'),
      processing('工具A', 'FINISHED', 'tc-a'),
      chat('虽然遇到了错误'),
      chat('但任务已完成。', true),
      finalResult(true, '虽然遇到了错误但任务已完成。'),
    ],
  },
  {
    id: 'LATE_CHUNK',
    label: '终态后迟到分片',
    description: 'FINAL_RESULT 后 200ms 迟到一条 MESSAGE',
    verifies: '终态守卫 shouldDropLateMessageChunk',
    events: [
      chat('正常内容', true),
      finalResult(true, '正常内容'),
      { ...chat('迟到的碎片'), delayMs: 200 },
    ],
  },
  {
    id: 'SUB_ONLY_RECOVERY',
    label: '仅 sub 流恢复',
    description: 'chat 静默关闭，刷新恢复后由 sub 流重放终态',
    verifies: 'sub onTerminalEvent + 占位收尾',
    transport: 'sub-only',
    events: [
      think('从恢复流重建思考过程', true),
      chat('已通过 sub 流恢复输出', true),
      finalResult(true, '已通过 sub 流恢复输出。'),
    ],
  },
  {
    id: 'NETWORK_ERROR',
    label: 'chat 网络中断',
    description: '部分 MESSAGE 后底层连接异常中断',
    verifies: 'chat onError 全量收尾',
    transport: 'network-error',
    events: [think('连接即将异常'), chat('只收到部分内容')],
  },
  {
    id: 'SUB_NETWORK_ERROR',
    label: 'sub 网络中断',
    description: '恢复流收到部分数据后异常中断',
    verifies: 'sub onStreamError 与 chat 对齐',
    transport: 'sub-only',
    events: [think('恢复中'), chat('恢复流的部分内容')],
  },
  {
    id: 'PROCESSING_STORM',
    label: '密集 PROCESSING + FINISHED 丢失',
    description:
      '多个工具 PROCESSING(EXECUTING) 部分未收到 FINISHED（1560859）',
    verifies: '事件类型白名单 + sweep processing 清理',
    events: [
      think('开始处理'),
      processing('工具1', 'EXECUTING', 'tc-1'),
      processing('工具2', 'EXECUTING', 'tc-2'),
      processing('工具3', 'EXECUTING', 'tc-3'),
      processing('工具1', 'FINISHED', 'tc-1'),
      // 工具2 和工具3 的 FINISHED 丢失
      processing('工具4', 'EXECUTING', 'tc-4'),
      processing('工具4', 'FINISHED', 'tc-4'),
      chat('处理完成', true),
      finalResult(true, '处理完成。'),
    ],
  },
  {
    id: 'PROCESSING_UNFINISHED',
    label: '单工具 FINISHED 丢失',
    description: '一个工具 PROCESSING(EXECUTING) 直接 FINAL_RESULT',
    verifies: 'sweep processing 残留清理',
    events: [
      think('执行中'),
      processing('终端执行 npm install', 'EXECUTING', 'tc-lost'),
      chat('安装完成', true),
      finalResult(true, '安装完成。'),
    ],
  },
  {
    id: 'USER_CANCEL',
    label: '用户停止',
    description: '流式中用户点击停止 → taskStatus=CANCEL',
    verifies: 'runStopConversation + 复制按钮',
    transport: 'keep-open',
    events: [
      think('开始执行'),
      chat('正在处理', false), // 保持 Loading，等用户停止
    ],
  },
  {
    id: 'TASK_CONFLICT',
    label: '任务冲突',
    description: 'FINAL_RESULT 带"正在执行任务"错误',
    verifies: '冲突型跳过清算',
    events: [
      {
        eventType: 'FINAL_RESULT',
        requestId: req('1'),
        completed: true,
        error: 'Agent正在执行任务，请等待当前任务完成后再发送新请求',
        data: {
          success: false,
          error: 'Agent正在执行任务，请等待当前任务完成后再发送新请求',
        },
      },
    ],
  },
  {
    id: 'QUESTION_TYPE',
    label: 'QUESTION 类型消息',
    description: 'QUESTION finished=true → status=null',
    verifies: 'busy 检查不误判',
    events: [
      think('需要确认'),
      {
        eventType: 'MESSAGE',
        requestId: req('1'),
        data: {
          role: 'ASSISTANT',
          type: 'QUESTION',
          text: '请选择方案',
          ext: [{ content: '方案A' }, { content: '方案B' }],
          finished: true,
        },
      },
    ],
  },
  {
    id: 'PLAN_PROCESSING',
    label: 'Plan 执行计划',
    description:
      '真实抓包任务（7 步移除 Token 功能，含 priority）逐步推进至全 completed',
    verifies: 'Plan 列表状态逐步变化 + 终态收敛',
    events: [
      think('收到，按计划移除 Token 相关功能。'),
      planSteps('plan-1', planProgress(0, false)),
      {
        ...planSteps('plan-1', planProgress(1)),
        delayMs: 1500,
      },
      {
        ...planSteps('plan-1', planProgress(3)),
        delayMs: 1500,
      },
      {
        ...planSteps('plan-1', planProgress(5)),
        delayMs: 1500,
      },
      {
        ...planSteps('plan-1', planAllCompleted(), 'FINISHED'),
        delayMs: 1500,
      },
      chat('Token 相关功能已全部移除。', true),
      finalResult(true, 'Token 相关功能已全部移除。'),
    ],
  },
  {
    id: 'EMPTY_CONVERSATION',
    label: '空会话首发',
    description: '无历史消息的会话直接发送首条消息',
    verifies: 'CREATE → COMPLETE 路径',
    events: [
      chat('这是空会话的第一条回复', true),
      finalResult(true, '这是空会话的第一条回复。'),
    ],
  },
  {
    id: 'DEEP_HISTORY',
    label: '长会话历史',
    description: '52 条历史消息后继续一轮流式输出',
    verifies: '快照合并 + 轮次边界',
    initialMessages: historyMessages,
    events: [
      chat('长历史后的新回复', true),
      finalResult(true, '长历史后的新回复。'),
    ],
  },
  {
    id: 'IDLE_POLL_TERMINAL',
    label: '轮询拿终态',
    description: '无协议终态，详情轮询在第二次读取时返回 COMPLETE',
    verifies: 'poll-snapshot 终态收敛',
    pollTerminalAfter: 2,
    events: [chat('正文已结束，等待详情终态', true)],
  },
  {
    id: 'MULTI_TOOL_ONE_MSG',
    label: '单消息多工具',
    description: '一条消息的 processingList 含多个工具调用',
    verifies: 'sweep 清理 processingList 数组',
    events: [
      processing('搜索', 'EXECUTING', 'multi-1'),
      processing('分析', 'EXECUTING', 'multi-2'),
      processing('生成', 'EXECUTING', 'multi-3'),
      processing('搜索', 'FINISHED', 'multi-1'),
      processing('生成', 'FINISHED', 'multi-3'),
      // multi-2 FINISHED 丢失
      chat('全部完成', true),
      finalResult(true, '全部完成。'),
    ],
  },
  {
    id: 'PERMISSION_REQUEST',
    label: '权限审批',
    description: '流式中 acpRequestPermission → 弹审批框 → 批准 → 流继续',
    verifies: '权限审批 UI + 恢复',
    events: [
      think('需要执行命令'),
      requestPermission('perm-1', '执行 bash 命令', {
        command: 'rm -rf /tmp/mock-cache',
      }),
      { ...processing('bash', 'FINISHED', 'perm-1'), delayMs: 2000 }, // 等审批
      chat('命令已执行', true),
      finalResult(true, '命令已执行。'),
    ],
  },
  {
    id: 'PERMISSION_DENY',
    label: '权限拒绝',
    description: '权限请求被拒绝后 agent 调整执行策略',
    verifies: '拒绝回执 + 流继续',
    events: [
      requestPermission('perm-deny', '执行 bash 命令', {
        command: 'curl https://example.com',
      }),
      { ...processing('bash', 'FAILED', 'perm-deny'), delayMs: 1500 },
      chat('权限被拒绝，已改用只读方案。', true),
      finalResult(true, '权限被拒绝，已改用只读方案。'),
    ],
  },
  {
    id: 'PERMISSION_TIMEOUT',
    label: '权限等待超时',
    description: '权限请求后保持连接，不发送后续事件',
    verifies: '未处理权限的悬挂态',
    transport: 'keep-open',
    events: [
      requestPermission('perm-timeout', '执行 bash 命令', {
        command: 'tail -f /var/log/system.log',
      }),
    ],
  },
  {
    id: 'ASK_QUESTION',
    label: 'Ask Question',
    description: 'nuwax_ask_question → 弹问答框 → 用户选择',
    verifies: 'ask-question 交互',
    events: [
      think('需要用户确认'),
      askQuestion('ask-1', '选择哪个方案？', [
        {
          name: 'choice',
          title: '实施方案',
          widget: 'radio',
          required: true,
          options: [
            { value: '方案A', label: '方案A：全量迁移' },
            { value: '方案B', label: '方案B：灰度发布' },
          ],
        },
        {
          name: 'note',
          title: '补充说明',
          widget: 'textarea',
          placeholder: '可选，填写执行注意事项',
        },
      ]),
      {
        ...processing('nuwax_ask_question', 'FINISHED', 'ask-1'),
        delayMs: 2000,
      },
      chat('已确认方案', true),
      finalResult(true, '已确认方案。'),
    ],
  },
  {
    id: 'ASK_QUESTION_UNANSWERED',
    label: '提问未回答',
    description: 'Ask Question 卡片出现后流保持暂停',
    verifies: '未回答时交互与流状态保持',
    transport: 'keep-open',
    events: [
      askQuestion('ask-wait', '请选择继续方式', [
        {
          name: 'choice',
          title: '继续方式',
          widget: 'radio',
          required: true,
          options: [
            { value: '继续', label: '继续执行' },
            { value: '暂停', label: '暂停等待' },
          ],
        },
      ]),
    ],
  },
  {
    id: 'OPENUI_RENDER',
    label: 'OpenUI 渲染',
    description: 'RENDER_UI 事件 → 内嵌 OpenUI inline 组件',
    verifies: 'OpenUI 组件渲染',
    events: [
      renderOpenUi(
        'openui-1',
        '测试数据看板',
        'root = Stack([title, value])\ntitle = TextContent("测试数据", "large-heavy")\nvalue = TextContent("结果数值：42", "body")',
        'EXECUTING',
      ),
      renderOpenUi(
        'openui-1',
        '测试数据看板',
        'root = Stack([title, value])\ntitle = TextContent("测试数据", "large-heavy")\nvalue = TextContent("结果数值：42", "body")',
      ),
      chat('组件已渲染', true),
      finalResult(true, '组件已渲染。'),
    ],
  },
  {
    id: 'OPENUI_INTERACTIVE',
    label: 'OpenUI 交互',
    description: '渲染含多字段展示的 OpenUI inline 组件',
    verifies: 'OpenUI 交互式组件',
    events: [
      renderOpenUi(
        'openui-form',
        '发布确认',
        'root = Stack([title, version, hint])\ntitle = TextContent("发布确认", "large-heavy")\nversion = TextContent("版本号：1.0.0", "body")\nhint = TextContent("确认无误后在对话中回复提交", "caption")',
      ),
      chat('交互组件已就绪', true),
      finalResult(true, '交互组件已就绪。'),
    ],
  },
  {
    id: 'INTERVENTION_MIXED',
    label: '混合干预场景',
    description: '权限 + ask-question + openui + 正常分片 + 终态',
    verifies: '多干预混合终态收敛',
    events: [
      think('复杂任务开始'),
      requestPermission('mix-perm', '执行 bash 命令', {
        command: 'git push origin main',
      }),
      processing('bash', 'FINISHED', 'mix-perm'),
      askQuestion('mix-ask', '确认执行？', [
        {
          name: 'choice',
          title: '执行确认',
          widget: 'radio',
          required: true,
          options: [
            { value: '是', label: '是，立即执行' },
            { value: '否', label: '否，先检查' },
          ],
        },
      ]),
      processing('nuwax_ask_question', 'FINISHED', 'mix-ask'),
      renderOpenUi(
        'mix-openui',
        '任务状态',
        'root = Stack([title, status])\ntitle = TextContent("任务状态", "large-heavy")\nstatus = TextContent("done", "body")',
      ),
      chat('混合任务完成', true),
      finalResult(true, '混合任务完成。'),
    ],
  },
  {
    id: 'RENDER_SHOWCASE',
    label: '渲染类型全景展示',
    description:
      '长任务串联全部渲染类型：Plan 推进 + 11 种 process 类型 + 文件 diff + OpenUI inline + group 容器 + conversation 链接 + task-result',
    verifies: '全部自定义渲染类型一次看完',
    events: [
      think('收到需求，我先梳理发布流程。'),
      think('需要先取数、再生成报表、最后部署上线。', true),
      planSteps('rs-plan', [
        { status: 'pending', content: '拉取订单数据' },
        { status: 'pending', content: '生成报表文件' },
        { status: 'pending', content: '部署发布上线' },
      ]),
      {
        ...planSteps('rs-plan', [
          { status: 'in_progress', content: '拉取订单数据' },
          { status: 'pending', content: '生成报表文件' },
          { status: 'pending', content: '部署发布上线' },
        ]),
        delayMs: 800,
      },
      // ── 取数阶段：多类型组件 ──
      // ToolCall 按真实抓包结构（kind/rawInput/description，toolCallId 为 call_* 格式）
      typedProcess('ToolCall', '终端执行 psql 查询订单表', 'call_rs_tool', {
        kind: 'execute',
        rawInput: {
          command:
            'psql -c "SELECT COUNT(*) FROM orders WHERE created_at >= \'2026-08-01\'"',
          description: '查询本月订单总量',
        },
      }),
      typedProcess('Mcp', 'nuwax-openui MCP 准备渲染环境', 'rs-mcp'),
      typedProcess('Knowledge', '知识库检索：报表口径说明', 'rs-knowledge'),
      typedProcess('Table', '数据表：orders_2026_08', 'rs-table'),
      typedProcess('Model', '模型调用：数据摘要生成', 'rs-model'),
      chat('数据已就绪，开始生成报表文件。'),
      {
        ...planSteps('rs-plan', [
          { status: 'completed', content: '拉取订单数据' },
          { status: 'in_progress', content: '生成报表文件' },
          { status: 'pending', content: '部署发布上线' },
        ]),
        delayMs: 800,
      },
      // ── 生成阶段：更多类型 + 文件 diff ──
      typedProcess('Skill', '技能：Excel 导出', 'rs-skill'),
      typedProcess('SubAgent', '子智能体：图表配色审查', 'rs-subagent'),
      typedProcess('Workflow', '工作流：报表发布流水线', 'rs-workflow'),
      typedProcess('Plugin', '插件：图表生成', 'rs-plugin'),
      processing('编辑文件 report/index.html', 'EXECUTING', 'rs-diff-1'),
      fileDiff('rs-diff-1', '编辑文件 report/index.html', [
        {
          path: 'report/index.html',
          oldText: '<title>月度报表 v1</title>',
          newText:
            '<title>月度报表 v2</title>\n<meta name="report-version" content="2">',
        },
        {
          path: 'report/styles.css',
          oldText: '.chart { color: #333; }',
          newText: '',
        },
      ]),
      fileDiff('rs-diff-2', '新增文件 report/summary.md', [
        {
          path: 'report/summary.md',
          oldText: '',
          newText: '# 2026-08 月度报表\n\n- 订单总量 12,480（环比 +8.2%）',
        },
      ]),
      typedProcess('Page', '打开页面：报表预览', 'rs-page', {
        uri: '/home/report',
        uri_type: 'Page',
      }),
      typedProcess('Event', '事件：心跳（不渲染）', 'rs-event'),
      {
        ...planSteps('rs-plan', [
          { status: 'completed', content: '拉取订单数据' },
          { status: 'completed', content: '生成报表文件' },
          { status: 'in_progress', content: '部署发布上线' },
        ]),
        delayMs: 800,
      },
      // ── 上线阶段：OpenUI + 收尾标签 ──
      renderOpenUi(
        'rs-openui',
        '订单月度看板',
        'root = Stack([title, total])\ntitle = TextContent("订单月度看板", "large-heavy")\ntotal = TextContent("订单总量：12,480（环比 +8.2%）", "body")',
      ),
      {
        ...planSteps(
          'rs-plan',
          [
            { status: 'completed', content: '拉取订单数据' },
            { status: 'completed', content: '生成报表文件' },
            { status: 'completed', content: '部署发布上线' },
          ],
          'FINISHED',
        ),
        delayMs: 800,
      },
      chat('发布完成，任务执行汇总如下。'),
      chat(
        '<div><markdown-custom-process-group autocollapse="true"><div><markdown-custom-process executeId="call_rs_tool" type="ToolCall" status="FINISHED" name="步骤一：数据查询"></markdown-custom-process></div><div><markdown-custom-process executeId="rs-workflow" type="Workflow" status="FINISHED" name="步骤二：报表生成"></markdown-custom-process></div><div><markdown-custom-process executeId="rs-page" type="Page" status="FINISHED" name="步骤三：部署发布"></markdown-custom-process></div></markdown-custom-process-group></div>',
        false,
      ),
      chat(
        '参考的历史版本会话：<conversation id="123" agentid="456">查看任务详情</conversation>',
        false,
      ),
      chat(
        '<task-result><description>月度报表页面</description><file>999999/report/index.html</file></task-result>',
        false,
      ),
      chat(
        '<task-result><description>数据明细导出</description><file>999999/report/summary.md</file></task-result>',
        true,
      ),
      finalResult(
        true,
        '发布完成，任务执行汇总如下。\n参考的历史版本会话：<conversation id="123" agentid="456">查看任务详情</conversation>\n<task-result><description>月度报表页面</description><file>999999/report/index.html</file></task-result>\n<task-result><description>数据明细导出</description><file>999999/report/summary.md</file></task-result>',
      ),
    ],
  },
  {
    id: 'ASK_DUPLICATE',
    label: '重复 ask 询问',
    description:
      '真实载荷：两次同 title 不同 requestId 的 AskQuestion，六种 widget 富表单',
    verifies: 'ask 去重按 requestId + 双卡不合并 + ASK_QUESTION 判别分支',
    events: [
      think('需要补充信息。'),
      askQuestionReal(
        '13f030d0c07547fe83fd6d43b624f0e0',
        '733e52ee48a8406b8f148de386092f47',
        '补充回复',
        RICH_ASK_FIELDS,
      ),
      {
        ...processing(
          'nuwax_ask_question',
          'FINISHED',
          '733e52ee48a8406b8f148de386092f47',
        ),
        delayMs: 2000,
      },
      chat('收到第一次回复，还需要确认执行偏好。'),
      askQuestionReal(
        'ed325c9eec724bce95ca6a05974b42e6',
        '449db35f985747bf8cd1645627bc2d8c',
        '补充回复',
        RICH_ASK_FIELDS,
      ),
      {
        ...processing(
          'nuwax_ask_question',
          'FINISHED',
          '449db35f985747bf8cd1645627bc2d8c',
        ),
        delayMs: 2000,
      },
      chat('信息齐备，开始执行。', true),
      finalResult(true, '信息齐备，开始执行。'),
    ],
  },
  {
    id: 'INTERVENTION_STACK',
    label: '多干预堆叠',
    description:
      '权限（四选项 + 文件编辑类）与 ask 同时悬挂，DockPanel 堆叠 FIFO 轮转',
    verifies: '一次只处理 front 卡 + 堆叠顺序 + 审批后顶卡',
    transport: 'keep-open',
    events: [
      think('批量变更前需要多重确认。'),
      requestPermission(
        'stack-exec',
        '执行 bash 命令: npm install',
        { command: 'npm install' },
        [
          { optionId: 'allow_once', name: '允许一次', kind: 'allow_once' },
          { optionId: 'allow_always', name: '始终允许', kind: 'allow_always' },
          { optionId: 'reject_once', name: '拒绝一次', kind: 'reject_once' },
          {
            optionId: 'reject_always',
            name: '始终拒绝',
            kind: 'reject_always',
          },
        ],
        'execute',
      ),
      requestPermission(
        'stack-edit',
        '编辑文件 src/app.tsx',
        {
          file_path: 'src/app.tsx',
          old_string: 'const DEBUG = true;',
          new_string: 'const DEBUG = false;',
        },
        [
          { optionId: 'allow_once', name: '允许一次', kind: 'allow_once' },
          { optionId: 'reject', name: '拒绝', kind: 'reject_once' },
        ],
        'edit',
      ),
      askQuestion('stack-ask', '确认执行范围？', [
        {
          name: 'scope',
          title: '执行范围',
          widget: 'radio',
          required: true,
          options: [
            { value: 'full', label: '全部变更' },
            { value: 'partial', label: '仅第一个文件' },
          ],
        },
      ]),
    ],
  },
  {
    id: 'MESSAGE_QUEUE_HOLDING',
    label: '消息队列（长执行）',
    description:
      '长时间执行悬挂中连续发送消息 → 进入待发队列面板（等待/立即发送/删除/编辑/重排）',
    verifies: 'MessageQueue 面板展示与停止后 flush',
    transport: 'keep-open',
    events: [
      think('长时间批量任务开始。'),
      chat('正在处理第一批数据，预计需要较长时间……'),
      heartbeat(),
      { ...heartbeat(), delayMs: 1500 },
      { ...heartbeat(), delayMs: 1500 },
      { ...heartbeat(), delayMs: 1500 },
      chat('第一批完成，正在处理第二批……'),
      { ...heartbeat(), delayMs: 1500 },
      { ...heartbeat(), delayMs: 1500 },
    ],
  },
  {
    id: 'SESSION_RESUME',
    label: '会话续接',
    description:
      'EXECUTING 半途快照 → 刷新重进 → sub 流续接剩余输出 → 轮询详情同步终态',
    verifies: '详情快照装载 + sub 续接 + 轮询状态同步',
    transport: 'sub-only',
    entry: 'resume',
    // 半途快照：详情接口返回给页面的 initialMessages（用户消息 + 执行中 assistant 中间态）
    initialMessages: [
      {
        id: 'resume-user-1',
        role: 'USER',
        messageType: 'USER',
        type: 'CHAT',
        status: 'complete',
        text: '帮我优化首页的加载速度',
        time: Date.now() - 60_000,
      },
      {
        id: 'resume-assistant-1',
        role: 'ASSISTANT',
        messageType: 'ASSISTANT',
        type: 'CHAT',
        status: 'loading',
        text: '我先对首页做一次性能审计，定位加载瓶颈。',
        thinkingFinished: true,
        processingList: [
          {
            executeId: 'resume-tool-1',
            name: '终端执行 lighthouse 审计',
            type: 'ToolCall',
            status: 'EXECUTING',
            targetId: -1,
            result: { executeId: 'resume-tool-1', startTime: Date.now() },
          },
        ],
        time: Date.now() - 30_000,
      },
    ],
    // sub 流从断点继续：完成执行中工具 → 剩余分片 → 终态
    events: [
      processing('终端执行 lighthouse 审计', 'FINISHED', 'resume-tool-1'),
      chat('审计完成，发现三个瓶颈：'),
      chat('首屏资源体积过大、图片未做压缩、关键接口串行请求。'),
      chat('对应的优化方案与预估收益已列出。', true),
      finalResult(
        true,
        '审计完成，发现三个瓶颈：首屏资源体积过大、图片未做压缩、关键接口串行请求。对应的优化方案与预估收益已列出。',
      ),
    ],
  },
  {
    id: 'HEARTBEAT_ONLY',
    label: '仅心跳（长空闲）',
    description: '流空闲期仅心跳事件，最终正常完成',
    verifies: '看门狗不误杀',
    events: [
      think('开始处理', true),
      heartbeat(),
      { ...heartbeat(), delayMs: 1000 },
      { ...heartbeat(), delayMs: 1000 },
      { ...heartbeat(), delayMs: 1000 },
      { ...heartbeat(), delayMs: 1000 },
      chat('处理完成', true),
      finalResult(true, '处理完成。'),
    ],
  },
  {
    id: 'CANCELLED_BY_BACKEND',
    label: '后端取消',
    description: 'FINAL_RESULT stop_reason=cancelled',
    verifies: 'CANCEL 终态',
    events: [
      chat('正在执行', false),
      finalResult(false, '', { stop_reason: 'cancelled', reason: 'cancelled' }),
    ],
  },
];

/** 根据 id 查找场景 */
export function getScenario(id: string): MockScenario | undefined {
  return MOCK_SCENARIOS.find((s) => s.id === id);
}
