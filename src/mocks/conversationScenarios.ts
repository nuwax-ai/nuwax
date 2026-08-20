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
  | 'CONTENT_WITH_TAGS'
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
    label: 'Plan 类型事件',
    description: '执行计划 PROCESSING（Plan）不影响终态',
    verifies: 'Plan 事件不触发终态清算',
    events: [
      processing('执行计划（2/3已完成）', 'FINISHED', 'plan-1', {
        type: 'Plan',
      }),
      processing('执行计划（3/3已完成）', 'FINISHED', 'plan-2', {
        type: 'Plan',
      }),
      chat('计划执行完成', true),
      finalResult(true, '计划执行完成。'),
    ],
  },
  {
    id: 'CONTENT_WITH_TAGS',
    label: '含标签的内容',
    description: 'markdown-custom-process + task-result 标签',
    verifies: 'TaskResult 组件 + 守卫不误拦',
    events: [
      chat('我已完成了任务。'),
      chat(
        '<div><markdown-custom-process executeId="tc-1" type="ToolCall" status="FINISHED" name="终端执行"></markdown-custom-process></div>',
        false,
      ),
      chat(
        '<task-result><description>输出文件</description><file>output/report.pdf</file></task-result>',
        true,
      ),
      finalResult(
        true,
        '我已完成了任务。\n<task-result><description>输出文件</description><file>output/report.pdf</file></task-result>',
      ),
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
      {
        eventType: 'PROCESSING',
        requestId: req('1'),
        data: {
          type: 'Event',
          subEventType: 'REQUEST_PERMISSION',
          toolCallId: 'perm-1',
          name: 'bash',
          status: 'EXECUTING',
          rawInput: {
            options: [
              { optionId: 'allow_once', name: '允许一次' },
              { optionId: 'reject', name: '拒绝' },
            ],
          },
        },
      },
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
      {
        eventType: 'PROCESSING',
        requestId: req('1'),
        data: {
          type: 'Event',
          subEventType: 'REQUEST_PERMISSION',
          toolCallId: 'perm-deny',
          name: 'bash',
          status: 'EXECUTING',
          rawInput: {
            options: [
              { optionId: 'allow_once', name: '允许一次' },
              { optionId: 'reject', name: '拒绝' },
            ],
          },
        },
      },
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
      {
        eventType: 'PROCESSING',
        requestId: req('1'),
        data: {
          type: 'Event',
          subEventType: 'REQUEST_PERMISSION',
          toolCallId: 'perm-timeout',
          name: 'bash',
          status: 'EXECUTING',
          rawInput: { options: [{ optionId: 'allow_once', name: '允许一次' }] },
        },
      },
    ],
  },
  {
    id: 'ASK_QUESTION',
    label: 'Ask Question',
    description: 'nuwax_ask_question → 弹问答框 → 用户选择',
    verifies: 'ask-question 交互',
    events: [
      think('需要用户确认'),
      {
        eventType: 'PROCESSING',
        requestId: req('1'),
        data: {
          type: 'ToolCall',
          name: 'nuwax_ask_question',
          status: 'EXECUTING',
          toolCallId: 'ask-1',
          rawInput: { question: '选择哪个方案？', options: ['方案A', '方案B'] },
        },
      },
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
      {
        eventType: 'PROCESSING',
        requestId: req('1'),
        data: {
          type: 'ToolCall',
          name: 'nuwax_ask_question',
          status: 'EXECUTING',
          toolCallId: 'ask-wait',
          rawInput: { question: '请选择继续方式', options: ['继续', '暂停'] },
        },
      },
    ],
  },
  {
    id: 'OPENUI_RENDER',
    label: 'OpenUI 渲染',
    description: 'nuwax_render_openui → 内嵌 OpenUI 组件',
    verifies: 'OpenUI 组件渲染',
    events: [
      {
        eventType: 'PROCESSING',
        requestId: req('1'),
        data: {
          type: 'ToolCall',
          name: 'nuwax_render_openui',
          status: 'EXECUTING',
          toolCallId: 'openui-1',
          rawInput: {
            component: 'DataCard',
            props: { title: '测试数据', value: 42 },
          },
        },
      },
      processing('nuwax_render_openui', 'FINISHED', 'openui-1'),
      chat('组件已渲染', true),
      finalResult(true, '组件已渲染。'),
    ],
  },
  {
    id: 'OPENUI_INTERACTIVE',
    label: 'OpenUI 交互',
    description: '渲染含按钮和表单状态的 OpenUI 组件',
    verifies: 'OpenUI 交互式组件',
    events: [
      {
        eventType: 'PROCESSING',
        requestId: req('1'),
        data: {
          type: 'ToolCall',
          name: 'nuwax_render_openui',
          status: 'FINISHED',
          toolCallId: 'openui-form',
          rawInput: {
            component: 'FormCard',
            props: {
              title: '发布确认',
              fields: [{ name: 'version', label: '版本号', value: '1.0.0' }],
              actions: [{ id: 'submit', label: '确认发布' }],
            },
          },
        },
      },
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
      {
        eventType: 'PROCESSING',
        requestId: req('1'),
        data: {
          type: 'Event',
          subEventType: 'REQUEST_PERMISSION',
          toolCallId: 'mix-perm',
          name: 'bash',
          status: 'EXECUTING',
          rawInput: {
            options: [
              { optionId: 'allow_once', name: '允许一次' },
              { optionId: 'reject', name: '拒绝' },
            ],
          },
        },
      },
      processing('bash', 'FINISHED', 'mix-perm'),
      {
        eventType: 'PROCESSING',
        requestId: req('1'),
        data: {
          type: 'ToolCall',
          name: 'nuwax_ask_question',
          status: 'EXECUTING',
          toolCallId: 'mix-ask',
          rawInput: { question: '确认执行？', options: ['是', '否'] },
        },
      },
      processing('nuwax_ask_question', 'FINISHED', 'mix-ask'),
      {
        eventType: 'PROCESSING',
        requestId: req('1'),
        data: {
          type: 'ToolCall',
          name: 'nuwax_render_openui',
          status: 'FINISHED',
          toolCallId: 'mix-openui',
          rawInput: { component: 'StatusBadge', props: { status: 'done' } },
        },
      },
      chat('混合任务完成', true),
      finalResult(true, '混合任务完成。'),
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
