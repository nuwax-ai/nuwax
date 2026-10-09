import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import handlers from '../../mock/conversationMock';
import { hydrateMcpAskInteractionsInMessageList } from '../../src/components/business-component/AgentIntervention/utils/mcpAskHydrateMessage';

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  t: (key: string) => key,
  getCurrentLang: () => 'zh-CN',
}));

const invoke = (name: keyof typeof handlers, req: unknown, res: unknown) =>
  (handlers[name] as (req: unknown, res: unknown) => void)(req, res);
const jsonResponse = () => {
  const res = {
    statusCode: 200,
    json: vi.fn(),
    status(code: number) {
      this.statusCode = code;
      return this;
    },
  };
  return res;
};
const stream = () => {
  const res = Object.assign(new EventEmitter(), jsonResponse(), {
    writableEnded: false,
    destroyed: false,
    setHeader: vi.fn(),
    flushHeaders: vi.fn(),
    write: vi.fn(),
    end: vi.fn(() => {
      res.writableEnded = true;
      res.emit('close');
    }),
  });
  return res;
};
const prepare = (scenario = 'CHATBOT_ASK_REQUIRED', id = 987201) => {
  invoke(
    'POST /api/mock/conversation/scenario',
    { body: { scenario, conversationId: id } },
    jsonResponse(),
  );
  return id;
};
const chat = (id: number, message = '开始问答') => {
  const res = stream();
  invoke(
    'POST /api/agent/conversation/chat',
    { body: { conversationId: id, message } },
    res,
  );
  return res;
};
const sub = (id: number) => {
  const res = stream();
  invoke('GET /api/agent/conversation/chat/sub/:id', { params: { id } }, res);
  return res;
};
const status = (id: number) => {
  const res = jsonResponse();
  invoke(
    'GET /api/mock/conversation/status',
    { query: { conversationId: id } },
    res,
  );
  return res.json.mock.calls[0][0].data;
};
const detail = (id: number) => {
  const res = jsonResponse();
  invoke('POST /api/agent/conversation/:id', { params: { id } }, res);
  return res.json.mock.calls[0][0].data;
};
const events = (res: ReturnType<typeof stream>) =>
  res.write.mock.calls.map(([raw]) => JSON.parse(raw.slice(5)));
const answer = '我已填写「请选择继续方式」，表单内容如下：\n处理方式：方案A';

// 固定生产回应链：普通 chat 文本，不制造 notify-resolved 或额外 requestId 参数。
describe('ChatBot Ask 的回应驱动状态机', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('标准 v2 问题携独立 requestId/allowSkip；等待再久也不自动续跑', async () => {
    const id = prepare();
    const pending = chat(id);
    await vi.advanceTimersByTimeAsync(60000);
    expect(status(id)).toMatchObject({
      taskStatus: 'EXECUTING',
      replaySettled: false,
      askState: {
        waiting: true,
        currentRequestId: 'mock-chatbot-ask-1',
        answeredRequestIds: [],
      },
    });
    expect(events(pending)).toHaveLength(1);
    expect(events(pending)[0]).toMatchObject({
      eventType: 'PROCESSING',
      data: {
        type: 'Event',
        subEventType: 'ASK_QUESTION',
        result: {
          data: {
            schemaVersion: 'nuwax.mcp_ask.v2',
            requestId: 'mock-chatbot-ask-1',
            ui: { allowSkip: false },
          },
        },
      },
    });
    expect(detail(id).agent.type).toBe('ChatBot');
    pending.end();
  });

  it('提交真实 chat 回应后才在同会话输出结果，历史包含问题与用户回应', () => {
    const id = prepare();
    chat(id);
    const continued = chat(id, answer);
    expect(status(id)).toMatchObject({
      taskStatus: 'COMPLETE',
      replaySettled: true,
      askState: {
        waiting: false,
        currentRequestId: null,
        answeredRequestIds: ['mock-chatbot-ask-1'],
        responses: [
          { requestId: 'mock-chatbot-ask-1', action: 'submit', text: answer },
        ],
      },
    });
    expect(events(continued).map((e) => e.eventType)).toEqual([
      'MESSAGE',
      'FINAL_RESULT',
    ]);
    const history = detail(id);
    expect(history.id).toBe(id);
    expect(
      history.messageList[1].componentExecutedList[0].result.data.requestId,
    ).toBe('mock-chatbot-ask-1');
    expect(history.messageList[2].text).toBe(answer);
  });

  it.each([
    [
      'CHATBOT_ASK_REQUIRED',
      '我取消了「请选择继续方式」。',
      'cancel',
      'COMPLETE',
    ],
    [
      'CHATBOT_ASK_SKIPPABLE',
      '我跳过了「请选择继续方式」。',
      'skip',
      'COMPLETE',
    ],
  ])('%s 接收 %s 后退出待答', (scenario, text, action, taskStatus) => {
    const id = prepare(scenario);
    chat(id);
    chat(id, text);
    expect(status(id)).toMatchObject({
      taskStatus,
      askState: { waiting: false, responses: [{ action, text }] },
    });
  });

  it('禁止跳过时拒绝伪造回应；普通聊天也不能偷偷推进', () => {
    const id = prepare();
    chat(id);
    expect(chat(id, '我跳过了「请选择继续方式」。').statusCode).toBe(400);
    expect(chat(id, '无关聊天').statusCode).toBe(400);
    expect(status(id).askState).toMatchObject({
      waiting: true,
      answeredRequestIds: [],
    });
    expect(detail(id).messageList).toHaveLength(2);
  });

  it('同标题连续问题按不同 requestId 逐题推进，答第一题不能自动答第二题', async () => {
    const id = prepare('CHATBOT_ASK_SEQUENTIAL');
    chat(id);
    const second = chat(id, answer);
    await vi.advanceTimersByTimeAsync(60000);
    expect(status(id).askState).toMatchObject({
      waiting: true,
      currentRequestId: 'mock-chatbot-ask-2',
      answeredRequestIds: ['mock-chatbot-ask-1'],
    });
    expect(events(second)).toHaveLength(1);
    expect(events(second)[0].data.result.data.requestId).toBe(
      'mock-chatbot-ask-2',
    );
    chat(id, answer);
    expect(status(id).askState.answeredRequestIds).toEqual([
      'mock-chatbot-ask-1',
      'mock-chatbot-ask-2',
    ]);
    expect(status(id).taskStatus).toBe('COMPLETE');
  });

  it('未答刷新/sub恢复同一问题，不复制历史；已答刷新不重放Ask', () => {
    const id = prepare();
    const original = chat(id);
    original.end();
    const before = detail(id).messageList.length;
    const restored = sub(id);
    expect(events(restored)[0].data.result.data.requestId).toBe(
      'mock-chatbot-ask-1',
    );
    expect(detail(id).messageList).toHaveLength(before);
    chat(id, answer);
    const completedHistory = detail(id).messageList.length;
    const afterAnswer = sub(id);
    expect(events(afterAnswer).map((e) => e.eventType)).toEqual([
      'FINAL_RESULT',
    ]);
    expect(detail(id).messageList).toHaveLength(completedHistory);
    expect(status(id).askState.waiting).toBe(false);
  });

  it('第二题刷新只续接第二题；取消末题后正常完成会话', () => {
    const id = prepare('CHATBOT_ASK_SEQUENTIAL');
    chat(id);
    chat(id, answer);
    const restored = sub(id);
    expect(events(restored)[0].data.result.data.requestId).toBe(
      'mock-chatbot-ask-2',
    );
    const continued = chat(id, '我取消了「请选择继续方式」。');
    expect(status(id).taskStatus).toBe('COMPLETE');
    expect(events(continued).at(-1)?.data).toEqual({ success: true });
    expect(
      status(id).askState.responses.map((r: { action: string }) => r.action),
    ).toEqual(['submit', 'cancel']);
    expect(events(sub(id)).some((e) => e.eventType === 'PROCESSING')).toBe(
      false,
    );
  });

  it('取消首题只消耗该题，第二题继续待答并可刷新、提交', () => {
    const id = prepare('CHATBOT_ASK_SEQUENTIAL');
    chat(id);
    const continued = chat(id, '我取消了「请选择继续方式」。');
    expect(status(id)).toMatchObject({
      taskStatus: 'EXECUTING',
      askState: {
        waiting: true,
        currentRequestId: 'mock-chatbot-ask-2',
        answeredRequestIds: ['mock-chatbot-ask-1'],
        responses: [{ requestId: 'mock-chatbot-ask-1', action: 'cancel' }],
      },
    });
    expect(events(continued).map((event) => event.eventType)).toEqual([
      'PROCESSING',
    ]);
    expect(events(sub(id))[0].data.result.data.requestId).toBe(
      'mock-chatbot-ask-2',
    );
    expect(
      hydrateMcpAskInteractionsInMessageList(detail(id).messageList)
        .flatMap((message) => message.mcpAskInteractions ?? [])
        .map(({ input, responseStatus }) => ({
          requestId: input.requestId,
          responseStatus,
        })),
    ).toEqual([
      { requestId: 'mock-chatbot-ask-1', responseStatus: 'submitted' },
      { requestId: 'mock-chatbot-ask-2', responseStatus: 'pending' },
    ]);
    const completed = chat(id, answer);
    expect(status(id).taskStatus).toBe('COMPLETE');
    expect(events(completed).at(-1)?.data).toEqual({ success: true });
    expect(
      status(id).askState.responses.map(
        ({ action }: { action: string }) => action,
      ),
    ).toEqual(['cancel', 'submit']);
  });

  it('真实历史 hydrate 恢复第一题待答、第二题待答，已答后两题都不重开', () => {
    const id = prepare('CHATBOT_ASK_SEQUENTIAL');
    chat(id);
    const interactions = () =>
      hydrateMcpAskInteractionsInMessageList(detail(id).messageList)
        .flatMap((message) => message.mcpAskInteractions ?? [])
        .map(({ input, responseStatus }) => ({
          requestId: input.requestId,
          responseStatus,
        }));
    expect(interactions()).toEqual([
      { requestId: 'mock-chatbot-ask-1', responseStatus: 'pending' },
    ]);
    chat(id, answer);
    expect(interactions()).toEqual([
      { requestId: 'mock-chatbot-ask-1', responseStatus: 'submitted' },
      { requestId: 'mock-chatbot-ask-2', responseStatus: 'pending' },
    ]);
    chat(id, answer);
    expect(interactions()).toEqual([
      { requestId: 'mock-chatbot-ask-1', responseStatus: 'submitted' },
      { requestId: 'mock-chatbot-ask-2', responseStatus: 'submitted' },
    ]);
  });
});
