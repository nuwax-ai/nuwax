import { createResumeConsistencyController } from '@/features/conversation/runtime/resumeConsistencyController';
import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import { describe, expect, it } from 'vitest';

describe('resumeConsistencyController', () => {
  it('live 结束冷却只作用于同一会话', () => {
    const controller = createResumeConsistencyController();
    controller.recordLocalStreamEnded(1001, 10000);

    expect(controller.evaluateGate(1001, 12000)).toMatchObject({
      allowed: false,
      reason: 'local-stream-cooldown',
      elapsedMs: 2000,
    });
    expect(controller.evaluateGate(1002, 12000)).toEqual({ allowed: true });
    expect(controller.evaluateGate(1001, 15000)).toEqual({ allowed: true });
  });

  it('sub 秒关按连续失败次数指数退避，长连接关闭后重置', () => {
    const controller = createResumeConsistencyController();
    controller.recordOpened(10000);
    expect(controller.recordClosed(11000)).toMatchObject({
      shortLived: true,
      failureCount: 1,
    });
    expect(controller.evaluateGate(1001, 12500)).toMatchObject({
      allowed: false,
      reason: 'sub-failure-backoff',
      backoffMs: 2000,
    });

    controller.recordOpened(13000);
    controller.recordClosed(14000);
    expect(controller.evaluateGate(1001, 17500)).toMatchObject({
      allowed: false,
      backoffMs: 4000,
    });

    controller.recordOpened(20000);
    expect(controller.recordClosed(24000)).toMatchObject({
      shortLived: false,
      failureCount: 0,
    });
    expect(controller.evaluateGate(1001, 24000)).toEqual({ allowed: true });
  });

  it('历史新增 USER、USER 尾或 Incomplete assistant 均允许恢复', () => {
    const controller = createResumeConsistencyController();
    const base = [
      { id: 'u1', role: AssistantRoleEnum.USER },
      { id: 'a1', role: AssistantRoleEnum.ASSISTANT },
    ] as any[];

    expect(
      controller.isHistoryUserReady(base, [
        ...base,
        { id: 'u2', role: AssistantRoleEnum.USER },
      ] as any[]),
    ).toBe(true);
    expect(
      controller.isHistoryUserReady([], [
        {
          id: 'a2',
          role: AssistantRoleEnum.ASSISTANT,
          status: MessageStatusEnum.Incomplete,
        },
      ] as any[]),
    ).toBe(true);
    expect(controller.isHistoryUserReady(base, [...base])).toBe(false);
  });
});
