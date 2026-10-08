import type {
  apiUserAppBuildCancel,
  apiUserAppLogsSourcesQuery,
  apiUserAppTasksActive,
} from '@/pages/AppDevPro/services/appDevPro';
import type { RequestResponse } from '@/types/interfaces/request';
import type {
  UserAppDevTaskInfo,
  UserAppLogSourceItem,
  UserAppTasksActiveResult,
} from '@/types/interfaces/userProject';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { tasks, logs, cancelBuild } = vi.hoisted(() => ({
  tasks: vi.fn<typeof apiUserAppTasksActive>(),
  logs: vi.fn<typeof apiUserAppLogsSourcesQuery>(),
  cancelBuild: vi.fn<typeof apiUserAppBuildCancel>(),
}));
vi.mock('@/pages/AppDevPro/services/appDevPro', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/pages/AppDevPro/services/appDevPro')
  >()),
  apiUserAppTasksActive: tasks,
  apiUserAppLogsSourcesQuery: logs,
  apiUserAppBuildCancel: cancelBuild,
}));
vi.mock('umi', async () => {
  const { useRealUmiRequest } = await import('./helpers/useRealUmiRequest');
  return { useRequest: useRealUmiRequest, request: vi.fn() };
});

import { useConversationAgentDevLogs } from '@/pages/AppDevPro/hooks/useConversationAgentDevLogs';
import { useUserAppTasksActive } from '@/pages/AppDevPro/hooks/useUserAppTasksActive';
import {
  UserAppContainerStatusEnum,
  UserAppReadinessStatusEnum,
  type UserAppReadiness,
} from '@/pages/AppDevPro/services/appDevPro';
import {
  UserAppTaskStatusEnum,
  UserAppTaskTypeEnum,
} from '@/pages/AppDevPro/type';
import {
  __resetForTest,
  handleHostActivityPayload,
} from '@/services/hostVisibility';

const readiness: UserAppReadiness = {
  app_id: '7001',
  app_stage: 'dev',
  ready: true,
  status: UserAppReadinessStatusEnum.Ready,
  container: {
    status: UserAppContainerStatusEnum.Running,
    operation: null,
  },
  checked_at: '2026-10-07T09:00:00Z',
  serving_release_id: 'release-1',
  observation_revision: 1,
  proxy: {
    ready: true,
    status: 'ready',
    reason_code: null,
    error_origin_contract: '',
  },
  services: [
    { service_id: 'web', ready: true, status: 'ready', reason_code: null },
  ],
};

const residentSources: UserAppLogSourceItem[] = [
  {
    service_id: 'web',
    source_id: 'application',
    format: 'text',
    matched_files: ['/workspace/logs/resident.log'],
  },
];

const createTask = (
  overrides: Partial<UserAppDevTaskInfo> = {},
): UserAppDevTaskInfo => ({
  id: 1,
  tenantId: 1,
  appId: 7001,
  userId: 1,
  taskId: 'dev-1',
  taskType: UserAppTaskTypeEnum.DevStart,
  status: UserAppTaskStatusEnum.Running,
  error: '',
  sandboxServerId: 'sandbox-1',
  created: '2026-10-07T09:00:00Z',
  modified: '2026-10-07T09:00:00Z',
  ...overrides,
});

const responseOf = <T,>(data: T): RequestResponse<T> => ({
  code: '0000',
  displayCode: '0000',
  message: '',
  data,
  debugInfo: {},
  success: true,
  tid: 'app-dev-polling-test',
});

describe('AppDevPro UI 查询真实 React / request 生命周期', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    __resetForTest();
    tasks.mockResolvedValue(
      responseOf({
        devActionAllowed: false,
        buildAllowed: true,
        tasks: [createTask()],
      }),
    );
    logs.mockResolvedValue(responseOf(residentSources));
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('宿主隐藏暂停 UI 查询，恢复后状态与输出衔接，不取消服务端任务', async () => {
    const { result } = renderHook(() => ({
      tasks: useUserAppTasksActive(7001),
      logs: useConversationAgentDevLogs(7001, { enabled: true, readiness }),
    }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(tasks).toHaveBeenCalledTimes(1);
    expect(logs).toHaveBeenCalledTimes(1);
    expect(result.current.tasks.tasks[0].taskId).toBe('dev-1');
    expect(result.current.logs.sources).toEqual(residentSources);
    act(() => handleHostActivityPayload({ visible: false }));
    await act(async () => {
      result.current.tasks.refresh();
      result.current.logs.startPolling();
      await result.current.logs.refreshLogs();
      await vi.advanceTimersByTimeAsync(15_000);
    });
    expect(tasks).toHaveBeenCalledTimes(1);
    expect(logs).toHaveBeenCalledTimes(1);
    expect(result.current.logs.sources).toEqual(residentSources);
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
        logs: useConversationAgentDevLogs(7001, {
          enabled: active,
          readiness,
        }),
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
    let resolveTasks!: (
      data: RequestResponse<UserAppTasksActiveResult>,
    ) => void;
    let resolveLogs!: (data: RequestResponse<UserAppLogSourceItem[]>) => void;
    tasks.mockReturnValue(
      new Promise<RequestResponse<UserAppTasksActiveResult>>((done) => {
        resolveTasks = done;
      }),
    );
    logs.mockReturnValue(
      new Promise<RequestResponse<UserAppLogSourceItem[]>>((done) => {
        resolveLogs = done;
      }),
    );
    const { result } = renderHook(() => ({
      tasks: useUserAppTasksActive(7001),
      logs: useConversationAgentDevLogs(7001, { enabled: true, readiness }),
    }));
    act(() => handleHostActivityPayload({ visible: false }));
    await act(async () => {
      resolveTasks(
        responseOf({
          devActionAllowed: false,
          buildAllowed: true,
          tasks: [createTask({ taskId: 'late' })],
        }),
      );
      resolveLogs(
        responseOf([
          {
            service_id: 'web',
            source_id: 'late-output',
            format: 'text',
            matched_files: ['/workspace/logs/late.log'],
          },
        ]),
      );
      await vi.advanceTimersByTimeAsync(15_000);
    });
    expect(result.current.tasks.tasks).toEqual([]);
    expect(result.current.logs.sources).toEqual([]);
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
