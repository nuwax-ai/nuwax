/**
 * NW-123 回归：源代码管理「提交」双提示竞态。
 * 守卫语义：同一提交在途时（state 未及重渲染的连点窗口）不得放出第二条
 * /api/git/commit——第一条成功弹绿、第二条撞变更后服务端被拒弹橙，正是
 * 「提交成功 + files is invalid」自相矛盾双提示的来源。
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChangeFileInfo } from '@/components/business-component/FileTreePreviewPanel/types/file-tree';

const { apiGitCommitMock, apiGitStatusMock } = vi.hoisted(() => ({
  apiGitCommitMock: vi.fn(),
  apiGitStatusMock: vi.fn(),
}));

vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/services/appDev', () => ({
  getProjectContent: vi.fn(),
  submitFilesUpdate: vi.fn(),
}));
vi.mock('antd', () => ({
  message: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));
vi.mock('../services/git-version-management', () => ({
  apiGitCommit: apiGitCommitMock,
  apiGitStatus: apiGitStatusMock,
}));

import { useSourceControl } from './useSourceControl';

const changeFile = {
  fileId: 'workspace:src/a.ts',
  stagedStatus: 'modified',
  unstagedStatus: 'modified',
} as unknown as ChangeFileInfo;

const setup = () =>
  renderHook(() =>
    useSourceControl({
      workspace: { workspaceType: 'taskAgent', cid: 101 },
      callbacks: {
        openChangeFile: vi.fn(),
      },
      changeFiles: [changeFile],
    }),
  );

describe('源代码管理提交单飞（NW-123）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGitCommitMock.mockReset();
    apiGitStatusMock.mockReset();
  });

  it('在途提交未收尾时重入直接拒绝，只发一条 commit', async () => {
    let resolveCommit!: (value: { code: string }) => void;
    apiGitCommitMock.mockReturnValue(
      new Promise((resolve) => {
        resolveCommit = resolve;
      }),
    );
    const { result } = setup();

    // 连点：第一次未收尾前第二次进来（isCommitting state 未重渲染的同批语义）
    let first!: Promise<boolean>;
    let second!: Promise<boolean>;
    act(() => {
      first = result.current.handleCommit('消息');
      second = result.current.handleCommit('消息');
    });
    expect(apiGitCommitMock).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveCommit({ code: '0000' });
      await Promise.all([first, second]);
    });
    await waitFor(() => {
      expect(result.current.isCommitting).toBe(false);
    });
    // 收尾后可再次提交（不是永久锁死）
    apiGitCommitMock.mockResolvedValue({ code: '0000' });
    await act(async () => {
      await result.current.handleCommit('消息2');
    });
    expect(apiGitCommitMock).toHaveBeenCalledTimes(2);
  });

  it('commit 业务失败（code != 0000）不弹成功提示', async () => {
    apiGitCommitMock.mockResolvedValue({ code: '9999' });
    const { result } = setup();
    await act(async () => {
      const ok = await result.current.handleCommit('消息');
      expect(ok).toBe(false);
    });
    const { message } = await import('antd');
    expect(message.success).not.toHaveBeenCalled();
  });
});
