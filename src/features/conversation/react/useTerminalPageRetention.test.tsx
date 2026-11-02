import { TaskStatus } from '@/types/enums/agent';
import { act, renderHook } from '@testing-library/react';
import { message } from 'antd';
import { afterEach, expect, it, vi } from 'vitest';
import { fullPageInstanceCacheManager as manager } from '../runtime/fullPageInstanceCacheManager';
import { useTerminalPageRetention } from './useTerminalPageRetention';
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('antd', () => ({ message: { warning: vi.fn() } }));
afterEach(() => {
  manager.invalidateAll('cleanup');
  vi.restoreAllMocks();
  vi.useRealTimers();
});
it('驻留终端抑制60秒淘汰；容量回收仍受限并明确提示', () => {
  vi.useFakeTimers();
  manager.activate({
    key: 'conversation:1',
    kind: 'conversation',
    conversationId: 1,
    status: TaskStatus.COMPLETE,
  });
  const { result, unmount } = renderHook(() =>
    useTerminalPageRetention('conversation:1'),
  );
  act(() => result.current(2));
  act(() => {
    manager.activate({ key: 'conversation:2', kind: 'conversation' });
    vi.advanceTimersByTime(120000);
  });
  expect(manager.getEntry('conversation:1')?.terminalSessionCount).toBe(2);
  act(() => {
    manager.setTerminalSessionCount('conversation:2', 1);
    for (let i = 3; i <= 6; i++) {
      manager.activate({ key: `conversation:${i}`, kind: 'conversation' });
      manager.setTerminalSessionCount(`conversation:${i}`, 1);
    }
  });
  expect(manager.getSnapshot().entries).toHaveLength(5);
  expect(message.warning).toHaveBeenCalledWith(
    'PC.Components.ConversationBottomConsole.cacheLimitReleased',
  );
  unmount();
});
