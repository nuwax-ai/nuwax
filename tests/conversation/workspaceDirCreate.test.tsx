/**
 * 发起会话选目录 + 会话记录目录（wiki #17）链路测试：
 * 1. useConversation：选个人电脑时创建参数携带 sandboxId（数值）+ workspaceDir；
 *    云电脑（'-1'）不携带（避免污染云端沙箱语义）；
 * 2. useLocalDirectoryFiles.seedRecordedRoot：会话记录目录补种为本地目录根、
 *    同一会话同一目录只种一次、切换会话后重置可再种；
 * 3. pickSingleLocalDirectory：无原生选择器时走手动输入弹窗。
 */
import useConversation from '@/hooks/useConversation';
import { useLocalDirectoryFiles } from '@/pages/Chat/hooks/useLocalDirectoryFiles';
import { apiAgentConversationCreate } from '@/services/agentConfig';
import { pickSingleLocalDirectory } from '@/utils/pickLocalDirectory';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { historyPush, pickDirectoryMock, hasNativePickerMock } = vi.hoisted(
  () => ({
    historyPush: vi.fn(),
    pickDirectoryMock: vi.fn(),
    hasNativePickerMock: vi.fn(),
  }),
);

vi.mock('umi', () => ({
  history: { push: historyPush },
}));

vi.mock('@/services/agentConfig', () => ({
  apiAgentConversationCreate: vi.fn(),
}));

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  t: (key: string) => key,
}));

vi.mock('@/utils/nuwaClawBridge', () => ({
  localFiles: {
    hasNativePicker: hasNativePickerMock,
    pickDirectory: pickDirectoryMock,
  },
  isImmersiveShell: () => false,
  isMac: () => false,
}));

vi.mock('@/services/vncDesktop', () => ({
  apiGetStaticFileList: vi.fn(),
  apiSearchFiles: vi.fn().mockResolvedValue({ data: [] }),
  apiUpdateStaticFile: vi.fn(),
}));

const createMock = vi.mocked(apiAgentConversationCreate);

afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

describe('useConversation 创建会话携带工作目录（wiki #17）', () => {
  beforeEach(() => {
    createMock.mockResolvedValue({
      code: 200,
      success: true,
      data: { id: 77, agentId: 5 },
    } as never);
  });

  it('选个人电脑时创建参数携带 sandboxId 数值与 workspaceDir', async () => {
    const { result } = renderHook(() => useConversation());
    await result.current.handleCreateConversation(5, {
      message: 'hi',
      selectedComputerId: '4321',
      workspaceDir: '/Users/me/project',
    });
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: 5,
        sandboxId: 4321,
        workspaceDir: '/Users/me/project',
      }),
    );
    expect(historyPush).toHaveBeenCalledWith(
      '/home/chat/77/5',
      expect.objectContaining({ selectedComputerId: '4321' }),
    );
  });

  it('云电脑（-1）不携带 sandboxId/workspaceDir', async () => {
    const { result } = renderHook(() => useConversation());
    await result.current.handleCreateConversation(5, {
      message: 'hi',
      selectedComputerId: '-1',
      workspaceDir: '/should/not/send',
    });
    const params = createMock.mock.calls[0][0];
    expect(params.sandboxId).toBeUndefined();
    expect(params.workspaceDir).toBeUndefined();
  });

  it('选个人电脑但未选目录时不携带 workspaceDir，仍带 sandboxId', async () => {
    const { result } = renderHook(() => useConversation());
    await result.current.handleCreateConversation(5, {
      message: 'hi',
      selectedComputerId: '88',
    });
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ sandboxId: 88 }),
    );
    const params = createMock.mock.calls[0][0];
    expect(params.workspaceDir).toBeUndefined();
  });
});

describe('useLocalDirectoryFiles.seedRecordedRoot（会话记录目录回显）', () => {
  it('打开会话时把记录目录补种为根，且同一目录只种一次', async () => {
    const first = renderHook(() => useLocalDirectoryFiles(9));
    act(() => {
      first.result.current.seedRecordedRoot('/Users/me/project');
    });
    await waitFor(() => {
      const roots = first.result.current.navigation?.roots ?? [];
      expect(roots.some((root) => root.path === '/Users/me/project')).toBe(
        true,
      );
    });
    // 重复 seed 同一目录不重复添加
    act(() => {
      first.result.current.seedRecordedRoot('/Users/me/project');
    });
    await waitFor(() => {
      const roots = first.result.current.navigation?.roots ?? [];
      expect(
        roots.filter((root) => root.path === '/Users/me/project'),
      ).toHaveLength(1);
    });
    first.unmount();
  });

  it('空目录不种；切换会话后重新可种（标记重置）', async () => {
    const { result, rerender, unmount } = renderHook(
      ({ id }: { id?: number }) => useLocalDirectoryFiles(id),
      { initialProps: { id: 11 } },
    );
    act(() => {
      result.current.seedRecordedRoot('  ');
    });
    expect(result.current.navigation?.roots ?? []).toHaveLength(0);

    act(() => {
      result.current.seedRecordedRoot('/a/b');
    });
    await waitFor(() => {
      expect(
        (result.current.navigation?.roots ?? []).some(
          (root) => root.path === '/a/b',
        ),
      ).toBe(true);
    });

    // 换会话 id（rootsKey 变化）后 reset，允许再次补种（换目标目录场景）
    rerender({ id: 12 });
    act(() => {
      result.current.seedRecordedRoot('/x/y');
    });
    await waitFor(() => {
      expect(
        (result.current.navigation?.roots ?? []).some(
          (root) => root.path === '/x/y',
        ),
      ).toBe(true);
    });
    unmount();
  });
});

describe('pickSingleLocalDirectory（发起会话选目录交互）', () => {
  it('桌面壳内返回原生选择器所选目录', async () => {
    hasNativePickerMock.mockReturnValue(true);
    pickDirectoryMock.mockResolvedValue({
      canceled: false,
      paths: ['/Users/me/docs'],
    });
    await expect(pickSingleLocalDirectory()).resolves.toBe('/Users/me/docs');
  });

  it('原生选择器取消返回 null', async () => {
    hasNativePickerMock.mockReturnValue(true);
    pickDirectoryMock.mockResolvedValue({ canceled: true, paths: [] });
    await expect(pickSingleLocalDirectory()).resolves.toBeNull();
  });
});
