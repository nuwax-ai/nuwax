/**
 * mock 会话服务端键控合同测试（综合验收画廊的前置）：
 * 回放状态按 conversationId 隔离；无 id 调用落默认键 999999（单页/e2e 行为不变）。
 * 直接驱动 umi mock handlers 的假 req/res，不起 dev server。
 */
import handlers from '../mock/conversationMock';

import { describe, expect, it } from 'vitest';

type Captured = { status: number; json: unknown };

const jsonReq = (
  body?: unknown,
  params?: Record<string, string>,
  query?: Record<string, string>,
) => ({ body, params, query } as never);

const jsonRes = (captured: Captured) =>
  ({
    // umi dev-server 成功路径默认 200（handler 只在 4xx 时显式 .status()）
    status(code: number) {
      captured.status = code;
      return jsonRes(captured);
    },
    json(data: unknown) {
      captured.json = data;
    },
  } as never);

const prepare = (body: unknown) => {
  const captured: Captured = { status: 200, json: null };
  (handlers as Record<string, (req: never, res: never) => void>)[
    'POST /api/mock/conversation/scenario'
  ](jsonReq(body), jsonRes(captured));
  return captured;
};

const status = (conversationId?: number) => {
  const captured: Captured = { status: 0, json: null };
  (handlers as Record<string, (req: never, res: never) => void>)[
    'GET /api/mock/conversation/status'
  ](
    jsonReq(
      undefined,
      undefined,
      conversationId ? { conversationId: String(conversationId) } : undefined,
    ),
    jsonRes(captured),
  );
  return captured.json as {
    data: { scenario: string; taskStatus: string; replaySettled: boolean };
  };
};

describe('mock 会话服务端 · 按 conversationId 键控', () => {
  it('两个会话键互不干扰：各自的 scenario/taskStatus 独立', () => {
    expect(
      prepare({ scenario: 'NORMAL_MULTI_STEP', conversationId: 111 }).status,
    ).toBe(200);
    expect(
      prepare({ scenario: 'ERROR_MID_STREAM', conversationId: 222 }).status,
    ).toBe(200);

    expect(status(111).data.scenario).toBe('NORMAL_MULTI_STEP');
    expect(status(222).data.scenario).toBe('ERROR_MID_STREAM');
  });

  it('stop/:id 只终止对应会话：111 置 CANCEL，222 不受影响', () => {
    const captured: Captured = { status: 0, json: null };
    (handlers as Record<string, (req: never, res: never) => void>)[
      'POST /api/agent/conversation/chat/stop/:id'
    ](jsonReq(undefined, { id: '111' }), jsonRes(captured));

    expect(status(111).data.taskStatus).toBe('CANCEL');
    expect(status(222).data.taskStatus).not.toBe('CANCEL');
  });

  it('无 id 的调用统一落默认键（单页行为不变）：默认键与画廊键隔离', () => {
    expect(prepare({ scenario: 'USER_CANCEL' }).status).toBe(200);
    // 无 query 读默认键
    expect(status().data.scenario).toBe('USER_CANCEL');
    // 画廊键不受默认键重置影响
    expect(status(111).data.scenario).toBe('NORMAL_MULTI_STEP');
  });

  it('prepare 重置对应键：sub-only 场景初始 EXECUTING，详情接口回该键 messageList', () => {
    expect(
      prepare({ scenario: 'SUB_ONLY_RECOVERY', conversationId: 333 }).status,
    ).toBe(200);
    expect(status(333).data.taskStatus).toBe('EXECUTING');

    const captured: Captured = { status: 0, json: null };
    (handlers as Record<string, (req: never, res: never) => void>)[
      'POST /api/agent/conversation/:id'
    ](jsonReq(undefined, { id: '333' }), jsonRes(captured));
    const data = (captured.json as { data: { id: number } }).data;
    expect(data.id).toBe(333);
  });

  it('未知场景返回 400（MOCK_SCENARIO_NOT_FOUND）且不改既有键', () => {
    const captured = prepare({ scenario: '__NO_SUCH__', conversationId: 444 });
    expect(captured.status).toBe(400);
    expect(status(444).data.scenario).toBe('NORMAL_SINGLE');
  });
});
