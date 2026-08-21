/**
 * 会话 Mock：使用 Umi dev-server 回放真实 SSE 协议。
 *
 * 仅供 /mock-chat（及 /app/mock-chat）开发验收页使用；场景定义在
 * mock/conversationScenarios.ts，页面通过 /api/mock/conversation/scenarios
 * 拉取元数据，不在业务代码 src 内依赖 mock 数据。
 *
 * 注意：Umi mock 层只 watch mock/ 目录。修改 mock/conversationScenarios.ts
 * 后需重启 dev server，或 touch 本文件触发 mock 层重载，否则新场景会报
 * MOCK_SCENARIO_NOT_FOUND（HTTP 400）。
 */
import {
  getScenario,
  MOCK_SCENARIOS,
  type MockScenario,
  type MockSseEvent,
} from './conversationScenarios';
import { S } from './utils';

const MOCK_CONVERSATION_ID = 999999;

let currentScenarioId = 'NORMAL_SINGLE';
let currentTaskStatus = 'CREATE';
let conversationMessages: Array<Record<string, unknown>> = [];
let emittedEvents: MockSseEvent[] = [];
let pollCount = 0;
let speed = 1;

const currentScenario = (): MockScenario =>
  getScenario(currentScenarioId) || getScenario('NORMAL_SINGLE')!;

const terminalStatusFrom = (event: MockSseEvent) => {
  if (event.eventType === 'ERROR') return 'FAILED';
  if (event.eventType !== 'FINAL_RESULT') return null;
  if (event.data?.stop_reason === 'cancelled') return 'CANCEL';
  return event.data?.success === false ? 'FAILED' : 'COMPLETE';
};

const writeEvent = (res: any, event: MockSseEvent) => {
  const payload = { ...event };
  delete payload.delayMs;
  emittedEvents.push(payload);
  const terminalStatus = terminalStatusFrom(event);
  if (terminalStatus) currentTaskStatus = terminalStatus;
  res.write(`data:${JSON.stringify(payload)}\n\n`);
};

const openSse = (res: any) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
};

const replay = (
  res: any,
  scenario: MockScenario,
  options: { sub?: boolean } = {},
) => {
  let index = 0;
  let cancelled = false;
  res.on('close', () => {
    if (!res.writableEnded) cancelled = true;
  });

  const next = () => {
    if (cancelled) return;
    if (index >= scenario.events.length) {
      if (scenario.transport === 'keep-open') return;
      if (
        scenario.transport === 'network-error' ||
        (options.sub && scenario.id === 'SUB_NETWORK_ERROR')
      ) {
        // 连接死亡时后端视角同步终态化：否则详情轮询恒报 EXECUTING，
        // runtime 轨 isConversationActive 的 taskExecuting 合成分支永不释放
        currentTaskStatus = 'FAILED';
        res.socket?.destroy(new Error('Mock SSE network failure'));
        return;
      }
      // 正常收尾但无 FINAL_RESULT 事件的场景（如 QUESTION_TYPE）：真实后端
      // 仍会将任务终态化。pollTerminalAfter 场景除外——保留 EXECUTING 由
      // 详情轮询按次数切换，验证 poll-snapshot 收敛路径
      if (!scenario.pollTerminalAfter && currentTaskStatus === 'EXECUTING') {
        currentTaskStatus = 'COMPLETE';
      }
      res.end();
      return;
    }

    const event = scenario.events[index++];
    const baseDelay = event.delayMs ?? (options.sub ? 50 : 100);
    setTimeout(() => {
      if (cancelled) return;
      writeEvent(res, event);
      next();
    }, Math.max(0, Math.round(baseDelay * speed)));
  };

  next();
};

export default {
  'POST /api/mock/conversation/scenario': (req: any, res: any) => {
    const requested = String(req.body?.scenario || 'NORMAL_SINGLE');
    const scenario = getScenario(requested);
    if (!scenario) {
      res
        .status(400)
        .json({ code: 'MOCK_SCENARIO_NOT_FOUND', message: requested });
      return;
    }

    currentScenarioId = scenario.id;
    // sub-only 传输的场景初始即为 EXECUTING：详情接口直接报告执行中，
    // 页面刷新/重进后据此触发 sub 流续接。
    currentTaskStatus =
      scenario.transport === 'sub-only' ? 'EXECUTING' : 'CREATE';
    conversationMessages = [...(scenario.initialMessages || [])];
    emittedEvents = [];
    pollCount = 0;
    speed = Number(req.body?.speed) || 1;
    res.json(S({ scenario: currentScenarioId, speed }));
  },

  'GET /api/mock/conversation/scenarios': (_req: any, res: any) => {
    // 页面只消费元数据（不含 events/initialMessages 全量），保持数据源单点在 mock/
    res.json(
      S(
        MOCK_SCENARIOS.map((scenario) => ({
          id: scenario.id,
          label: scenario.label,
          description: scenario.description,
          verifies: scenario.verifies,
          transport: scenario.transport,
          entry: scenario.entry,
          hasFinalResult: scenario.events.some(
            (event) => event.eventType === 'FINAL_RESULT',
          ),
        })),
      ),
    );
  },

  'GET /api/mock/conversation/status': (_req: any, res: any) => {
    res.json(
      S({
        scenario: currentScenarioId,
        taskStatus: currentTaskStatus,
        pollCount,
        emittedEvents,
      }),
    );
  },

  'POST /api/agent/conversation/chat': (req: any, res: any) => {
    const scenario = currentScenario();
    openSse(res);
    currentTaskStatus = 'EXECUTING';
    conversationMessages.push({
      id: `mock-user-${Date.now()}`,
      role: 'USER',
      messageType: 'USER',
      type: 'CHAT',
      status: 'complete',
      text: req.body?.message || '执行当前 Mock 场景',
      time: Date.now(),
    });

    // chat 主连接静默结束，页面随后显式触发生产 sub 恢复链。
    if (scenario.transport === 'sub-only') {
      res.end();
      return;
    }
    replay(res, scenario);
  },

  'GET /api/agent/conversation/chat/sub/:id': (_req: any, res: any) => {
    const scenario = currentScenario();
    openSse(res);
    replay(res, scenario, { sub: true });
  },

  'POST /api/agent/conversation/chat/stop/:id': (_req: any, res: any) => {
    currentTaskStatus = 'CANCEL';
    res.json(S(null));
  },

  'POST /api/agent/conversation/chat/permission-request/response': (
    _req: any,
    res: any,
  ) => res.json(S(null)),

  'POST /api/computer/notify-resolved': (_req: any, res: any) =>
    res.json(S(null)),

  'POST /api/agent/conversation/update': (_req: any, res: any) =>
    res.json(S({ id: MOCK_CONVERSATION_ID })),

  'POST /api/agent/conversation/chat/suggest': (_req: any, res: any) =>
    res.json(S([])),

  'POST /api/agent/conversation/message/list': (_req: any, res: any) =>
    res.json(S([])),

  // 参数路由必须放在 /chat 等固定路由之后，避免把 chat 误识别为会话 ID。
  'POST /api/agent/conversation/:id': (req: any, res: any) => {
    const scenario = currentScenario();
    pollCount += 1;
    if (scenario.pollTerminalAfter && pollCount >= scenario.pollTerminalAfter) {
      currentTaskStatus = 'COMPLETE';
    }
    res.json(
      S({
        id: Number(req.params.id) || MOCK_CONVERSATION_ID,
        agentId: 44,
        topic: `Mock · ${scenario.label}`,
        taskStatus: currentTaskStatus,
        messageList: conversationMessages,
        agent: {
          id: 44,
          name: '会话验收 Mock Agent',
          icon: '',
          type: 'TaskAgent',
          openSuggest: 'Close',
          manualComponents: [],
          variables: [],
          hasPermission: true,
          allowPrivateSandbox: true,
        },
      }),
    );
  },
};
