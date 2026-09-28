import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { tasks, logs, cancelBuild } = vi.hoisted(() => ({
  tasks: vi.fn(),
  logs: vi.fn(),
  cancelBuild: vi.fn(),
}));
vi.mock('@/pages/AppDevPro/services/appDevPro', () => ({
  apiUserAppTasksActive: tasks,
  apiUserAppLogsSourcesQuery: logs,
  apiUserAppBuildCancel: cancelBuild,
}));
vi.mock('umi', async () => {
  const { useRealUmiRequest } = await import('./helpers/useRealUmiRequest');
  return { useRequest: useRealUmiRequest };
});

import { useConversationAgentDevLogs } from '@/pages/AppDevPro/hooks/useConversationAgentDevLogs';
import { useUserAppTasksActive } from '@/pages/AppDevPro/hooks/useUserAppTasksActive';
import { UserAppTaskTypeEnum } from '@/pages/AppDevPro/type';
import {
  __resetForTest,
  handleHostActivityPayload,
} from '@/services/hostVisibility';

describe('AppDevPro UI 查询真实 React / request 生命周期', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    __resetForTest();
    tasks.mockResolvedValue({
      code: '0000',
      data: {
        devActionAllowed: false,
        buildAllowed: true,
        tasks: [{ taskId: 'dev-1', taskType: UserAppTaskTypeEnum.DevStart }],
      },
    });
    logs.mockResolvedValue({
      code: '0000',
      data: { lines: ['INFO resident output'] },
    });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('宿主隐藏暂停 UI 查询，恢复后状态与输出衔接，不取消服务端任务', async () => {
    const { result } = renderHook(() => ({
      tasks: useUserAppTasksActive(7001),
      logs: useConversationAgentDevLogs(7001, { enabled: true }),
    }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(tasks).toHaveBeenCalledTimes(1);
    expect(logs).toHaveBeenCalledTimes(1);
    expect(result.current.tasks.tasks[0].taskId).toBe('dev-1');
    expect(result.current.logs.logs[0].content).toBe('INFO resident output');
    act(() => handleHostActivityPayload({ visible: false }));
    await act(async () => {
      result.current.tasks.refresh();
      result.current.logs.startPolling();
      await result.current.logs.refreshLogs();
      await vi.advanceTimersByTimeAsync(15_000);
    });
    expect(tasks).toHaveBeenCalledTimes(1);
    expect(logs).toHaveBeenCalledTimes(1);
    expect(result.current.logs.logs[0].content).toBe('INFO resident output');
    await act(async () => {
      handleHostActivityPayload({ visible: true });
    });
    expect(tasks).toHaveBeenCalledTimes(2);
    expect(logs).toHaveBeenCalledTimes(2);
    expect(cancelBuild).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(tasks).toHaveBeenCalledTimes(3);
    expect(logs).toHaveBeenCalledTimes(3);
  });

  it('隐藏初态不发 UI 查询，激活前后仍尊重路由 enabled', async () => {
    handleHostActivityPayload({ visible: false });
    const { rerender } = renderHook(
      ({ active }) => ({
        tasks: useUserAppTasksActive(7001, active),
        logs: useConversationAgentDevLogs(7001, { enabled: active }),
      }),
      { initialProps: { active: true } },
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    expect(tasks).not.toHaveBeenCalled();
    expect(logs).not.toHaveBeenCalled();
    rerender({ active: false });
    await act(async () => {
      handleHostActivityPayload({ visible: true });
    });
    expect(tasks).not.toHaveBeenCalled();
    expect(logs).not.toHaveBeenCalled();
    await act(async () => {
      rerender({ active: true });
    });
    expect(tasks).toHaveBeenCalledTimes(1);
    expect(logs).toHaveBeenCalledTimes(1);
  });

  it('隐藏后迟到 UI 响应不写回状态，也不重新启动轮询', async () => {
    let resolveTasks!: (data: object) => void;
    let resolveLogs!: (data: object) => void;
    tasks.mockReturnValue(
      new Promise((done) => {
        resolveTasks = done;
      }),
    );
    logs.mockReturnValue(
      new Promise((done) => {
        resolveLogs = done;
      }),
    );
    const { result } = renderHook(() => ({
      tasks: useUserAppTasksActive(7001),
      logs: useConversationAgentDevLogs(7001, { enabled: true }),
    }));
    act(() => handleHostActivityPayload({ visible: false }));
    await act(async () => {
      resolveTasks({
        code: '0000',
        data: { devActionAllowed: false, tasks: [{ taskId: 'late' }] },
      });
      resolveLogs({ code: '0000', data: { lines: ['late output'] } });
      await vi.advanceTimersByTimeAsync(15_000);
    });
    expect(result.current.tasks.tasks).toEqual([]);
    expect(result.current.logs.logs).toEqual([]);
    expect(tasks).toHaveBeenCalledTimes(1);
    expect(logs).toHaveBeenCalledTimes(1);
  });

  it('部署弹窗的手动暂停跨宿主隐藏/恢复仍有效，resume 后再查询', async () => {
    const { result } = renderHook(() => useUserAppTasksActive(7001));
    await act(async () => {
      await Promise.resolve();
    });
    act(() => result.current.pause());
    await act(async () => {
      handleHostActivityPayload({ visible: false });
      await Promise.resolve();
    });
    await act(async () => {
      handleHostActivityPayload({ visible: true });
      await vi.advanceTimersByTimeAsync(15_000);
    });
    expect(tasks).toHaveBeenCalledTimes(1);
    await act(async () => {
      result.current.resume();
    });
    expect(tasks).toHaveBeenCalledTimes(2);
  });
});
