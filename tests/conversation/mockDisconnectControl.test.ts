import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import handlers from '../../mock/conversationMock';

const invoke = (name: keyof typeof handlers, req: unknown, res: unknown) =>
  (handlers[name] as (req: unknown, res: unknown) => void)(req, res);

const jsonResponse = () => {
  const res = {
    statusCode: 200,
    json: vi.fn(),
    status(code: number) {
      res.statusCode = code;
      return res;
    },
  };
  return res;
};

const createStream = (conversationId: number) => {
  invoke(
    'POST /api/mock/conversation/scenario',
    { body: { scenario: 'USER_CANCEL', conversationId } },
    jsonResponse(),
  );
  const stream = Object.assign(new EventEmitter(), {
    writableEnded: false,
    destroyed: false,
    setHeader: vi.fn(),
    flushHeaders: vi.fn(),
    write: vi.fn(),
    end: vi.fn(() => {
      stream.writableEnded = true;
      stream.emit('close');
    }),
    destroy: vi.fn(() => {
      stream.destroyed = true;
      stream.emit('close');
    }),
  });
  invoke(
    'POST /api/agent/conversation/chat',
    { body: { conversationId, message: '断流验收' } },
    stream,
  );
  return stream;
};

const status = (conversationId: number) => {
  const response = jsonResponse();
  invoke(
    'GET /api/mock/conversation/status',
    { query: { conversationId } },
    response,
  );
  return response.json.mock.calls[0][0].data;
};

describe('开发验收的 HTTP SSE 断流控制', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('只断开目标会话并保留 EXECUTING，供真实 sub 恢复链接管', async () => {
    const target = createStream(982601);
    const other = createStream(982602);
    invoke(
      'POST /api/mock/conversation/disconnect/:id',
      { params: { id: 982601 }, body: { mode: 'error' } },
      jsonResponse(),
    );
    await vi.advanceTimersByTimeAsync(1000);
    expect(target.destroy).toHaveBeenCalledOnce();
    expect(target.write).not.toHaveBeenCalled();
    expect(other.destroy).not.toHaveBeenCalled();
    expect(status(982601)).toMatchObject({
      taskStatus: 'EXECUTING',
      activeStreamCount: 0,
      replaySettled: true,
    });
    expect(status(982602).activeStreamCount).toBe(1);
    other.destroy();
  });

  it.each(['FAILED', 'COMPLETE', 'CANCEL'])(
    '无 FINAL 地关闭后，详情明确报告 %s；已关流的延迟脚本不继续写入',
    async (taskStatus) => {
      const target = createStream(982603);
      invoke(
        'POST /api/mock/conversation/disconnect/:id',
        { params: { id: 982603 }, body: { mode: 'close', taskStatus } },
        jsonResponse(),
      );
      await vi.advanceTimersByTimeAsync(1000);
      expect(target.end).toHaveBeenCalledOnce();
      expect(target.write).not.toHaveBeenCalled();
      expect(status(982603)).toMatchObject({
        taskStatus,
        emittedEvents: [],
        activeStreamCount: 0,
      });
    },
  );

  it('无效状态不关闭流、不改变执行中的任务状态', () => {
    const target = createStream(982604);
    const response = jsonResponse();
    invoke(
      'POST /api/mock/conversation/disconnect/:id',
      { params: { id: 982604 }, body: { taskStatus: 'CREATE' } },
      response,
    );
    expect(response.statusCode).toBe(400);
    expect(target.destroy).not.toHaveBeenCalled();
    expect(status(982604).taskStatus).toBe('EXECUTING');
    target.destroy();
  });
});
