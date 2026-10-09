import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __resetForTest,
  getComputerServiceState,
  handleComputerServiceStatePayload,
  subscribeComputerServiceState,
} from './computerServiceState';

beforeEach(__resetForTest);

describe('computerServiceState', () => {
  it('先收到状态再订阅时快照可读；同值事件不重复通知', () => {
    handleComputerServiceStatePayload({ phase: 'ready', sandboxId: '366' });
    const listener = vi.fn();
    const unsubscribe = subscribeComputerServiceState(listener);
    expect(getComputerServiceState()).toEqual({
      phase: 'ready',
      sandboxId: '366',
    });
    expect(listener).not.toHaveBeenCalled();
    handleComputerServiceStatePayload({ phase: 'ready', sandboxId: '366' });
    expect(listener).not.toHaveBeenCalled();
    handleComputerServiceStatePayload({ phase: 'starting', sandboxId: '366' });
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    handleComputerServiceStatePayload({ phase: 'ready', sandboxId: '366' });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('忽略非法 phase；只保留 phase 与可选字符串 sandboxId', () => {
    handleComputerServiceStatePayload({ phase: '' });
    handleComputerServiceStatePayload({ phase: 1 });
    expect(getComputerServiceState()).toBeNull();
    handleComputerServiceStatePayload({ phase: 'ready', sandboxId: 366 });
    expect(getComputerServiceState()).toEqual({ phase: 'ready' });
  });
});
