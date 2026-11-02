import { useWorkspaceFileTreeSession } from '@/components/business-component/FileTreeGitSourcePanel/hooks/useWorkspaceFileTreeSession';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  search: vi.fn(),
  error: vi.fn(),
  key: 'ctx-A',
}));
vi.mock('@/services/vncDesktop', () => ({
  apiGetStaticFileList: mocks.list,
  apiSearchFiles: mocks.search,
}));
vi.mock('@/features/client-shell/localFileService', () => ({
  getLocalFilesContextKey: () => mocks.key,
  useLocalFilesRevision: () => 0,
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('antd', () => ({ message: { error: mocks.error } }));
const response = (files: unknown[] = []) => ({
  code: '0000',
  data: { recursive: false, files },
});
const flush = () => act(async () => {});
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(10000);
  vi.resetAllMocks();
  mocks.key = 'ctx-A';
  mocks.list.mockResolvedValue(response());
  mocks.search.mockResolvedValue(response());
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it.each([0, 30 * 60 * 1000])(
  '停留 %s ms 后隐藏会话，已释放授权的页面不再发出 trailing 请求',
  async (stay) => {
    const { rerender } = renderHook(
      ({ active, trigger }) =>
        useWorkspaceFileTreeSession({
          conversationId: 7,
          active,
          enabled: active,
          refreshEnabled: active,
          fileTreeRefreshTrigger: trigger,
        }),
      { initialProps: { active: true, trigger: 1 } },
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(stay);
    });
    rerender({ active: true, trigger: 2 });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    rerender({ active: true, trigger: 3 });
    mocks.key = '';
    rerender({ active: false, trigger: 3 });
    await flush();
    const before = mocks.list.mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(mocks.list).toHaveBeenCalledTimes(before);
    expect(mocks.error).not.toHaveBeenCalled();
  },
);

it('面板隐藏时保留未执行的刷新，返回后同一信号仍补刷根目录和已展开目录', async () => {
  mocks.list.mockImplementation(async (_id, options) =>
    response(
      options.relativePath
        ? [{ name: 'docs/current.txt', isDir: false }]
        : [{ name: 'docs', isDir: true }],
    ),
  );
  const { result, rerender } = renderHook(
    ({ visible, trigger }) =>
      useWorkspaceFileTreeSession({
        conversationId: 7,
        active: true,
        enabled: visible,
        refreshEnabled: visible,
        fileTreeRefreshTrigger: trigger,
      }),
    { initialProps: { visible: true, trigger: 0 } },
  );
  await flush();
  await act(async () => {
    await result.current.loadDirectory('docs');
  });
  rerender({ visible: true, trigger: 1 });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(100);
  });
  rerender({ visible: true, trigger: 2 });
  rerender({ visible: false, trigger: 2 });
  const before = mocks.list.mock.calls.length;
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000);
  });
  expect(mocks.list).toHaveBeenCalledTimes(before);
  rerender({ visible: true, trigger: 2 });
  await flush();
  const resumedPaths = mocks.list.mock.calls
    .slice(before)
    .map((call) => call[1].relativePath);
  expect(resumedPaths).toContain('');
  expect(resumedPaths).toContain('docs');
});

it('隐藏期间多次变更合并，返回后使用最新信号，不在后台请求', async () => {
  const { rerender } = renderHook(
    ({ active, trigger }) =>
      useWorkspaceFileTreeSession({
        conversationId: 7,
        active,
        enabled: false,
        refreshEnabled: active,
        fileTreeRefreshTrigger: trigger,
      }),
    { initialProps: { active: false, trigger: 1 } },
  );
  rerender({ active: false, trigger: 2 });
  rerender({ active: false, trigger: 3 });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000);
  });
  expect(mocks.list).not.toHaveBeenCalled();
  rerender({ active: true, trigger: 3 });
  await flush();
  expect(mocks.list).toHaveBeenCalledOnce();
});

it('换成另一会话时旧信号不重放到新会话，卸载后也不再请求', async () => {
  const { rerender, unmount } = renderHook(
    ({ id, trigger }) =>
      useWorkspaceFileTreeSession({
        conversationId: id,
        enabled: false,
        fileTreeRefreshTrigger: trigger,
      }),
    { initialProps: { id: 7, trigger: 1 } },
  );
  await flush();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(100);
  });
  rerender({ id: 7, trigger: 2 });
  rerender({ id: 8, trigger: 0 });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000);
  });
  expect(mocks.list.mock.calls.filter(([id]) => id === 8)).toHaveLength(0);
  unmount();
  const before = mocks.list.mock.calls.length;
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000);
  });
  expect(mocks.list).toHaveBeenCalledTimes(before);
});

const hit = (contextId: string) =>
  response([
    {
      name: 'docs/result.txt',
      isDir: false,
      fileProxyUrl: '/api/computer/static/7/docs/result.txt',
      localFile: { contextId, cId: '7', path: 'docs/result.txt' },
    },
  ]);

it('搜索期间隐藏再返回，旧结果不得展开目录、选中文件或清掉新搜索标记', async () => {
  const finishes: Array<(value: unknown) => void> = [];
  mocks.search.mockImplementation(
    () =>
      new Promise((resolve) => {
        finishes.push(resolve);
      }),
  );
  const { result, rerender } = renderHook(
    ({ active }) =>
      useWorkspaceFileTreeSession({
        conversationId: 7,
        active,
        enabled: false,
        refreshEnabled: false,
        taskAgentSelectedFileId: 'docs/result.txt',
        taskAgentSelectTrigger: 1,
      }),
    { initialProps: { active: true } },
  );
  const select = vi.fn();
  result.current.selectFileRef.current = select;
  await flush();
  rerender({ active: false });
  rerender({ active: true });
  await flush();
  expect(finishes).toHaveLength(2);
  await act(async () => finishes[0](hit('old-context')));
  expect(mocks.list).not.toHaveBeenCalled();
  expect(select).not.toHaveBeenCalled();
  expect(result.current.openingTaskResultRef.current).not.toBeNull();
  await act(async () => finishes[1](hit('new-context')));
  expect(select).toHaveBeenCalledOnce();
  expect(select.mock.calls[0][1].fallbackNode.localFile.contextId).toBe(
    'new-context',
  );
});

it('后台 task-result 不搜索，前台完成一次后回访不重放旧导航', async () => {
  mocks.search.mockResolvedValue(hit('current-context'));
  const { result, rerender } = renderHook(
    ({ active }) =>
      useWorkspaceFileTreeSession({
        conversationId: 7,
        active,
        enabled: false,
        refreshEnabled: false,
        taskAgentSelectedFileId: 'docs/result.txt',
        taskAgentSelectTrigger: 1,
      }),
    { initialProps: { active: false } },
  );
  const select = vi.fn();
  result.current.selectFileRef.current = select;
  await flush();
  expect(mocks.search).not.toHaveBeenCalled();
  rerender({ active: true });
  await flush();
  expect(select).toHaveBeenCalledOnce();
  rerender({ active: false });
  rerender({ active: true });
  await flush();
  expect(mocks.search).toHaveBeenCalledOnce();
});
