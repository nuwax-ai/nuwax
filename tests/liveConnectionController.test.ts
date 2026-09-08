import { createLiveConnectionController } from '@/features/conversation/runtime/liveConnectionController';
import { describe, expect, it, vi } from 'vitest';

describe('liveConnectionController', () => {
  it('新 run 使旧 run 变为 superseded', () => {
    const controller = createLiveConnectionController();
    const first = controller.startRun();
    expect(controller.isSuperseded(first)).toBe(false);

    const second = controller.startRun();
    expect(controller.isSuperseded(first)).toBe(true);
    expect(controller.isSuperseded(second)).toBe(false);
  });

  it('显式 abort 后没有新 run，旧回调不视为 superseded', () => {
    const controller = createLiveConnectionController();
    const runId = controller.startRun();
    const abort = vi.fn();
    controller.attach(runId, abort);

    controller.abortCurrent();
    controller.abortCurrent();

    expect(abort).toHaveBeenCalledTimes(1);
    expect(controller.isSuperseded(runId)).toBe(false);
  });

  it('迟到的旧 run abort 句柄不会夺回所有权，并立即自清理', () => {
    const controller = createLiveConnectionController();
    const first = controller.startRun();
    controller.startRun();
    const staleAbort = vi.fn();

    expect(controller.attach(first, staleAbort)).toBe(false);
    expect(staleAbort).toHaveBeenCalledTimes(1);
  });

  it('消息只由当前 run 消费，旧 run 的收尾不能结束新 run', () => {
    const controller = createLiveConnectionController();
    const first = controller.startRun();
    const second = controller.startRun();

    expect(controller.isCurrent(first)).toBe(false);
    expect(controller.isCurrent(second)).toBe(true);
    expect(controller.complete(first)).toBe(false);
    expect(controller.isCurrent(second)).toBe(true);
    expect(controller.complete(second)).toBe(true);
    expect(controller.isCurrent(second)).toBe(false);
  });
});
