/**
 * 发起会话选目录（wiki #17）链路测试：
 * useConversation：选个人电脑时创建参数携带 sandboxId（数值）+ workspacePath；
 * 云电脑（'-1'）不携带（避免污染云端沙箱语义）。
 * 注：文件树侧「会话记录目录回显（seedRecordedRoot）」已随文件树本地目录
 * 数据源回滚删除（2026-09-09，需求取消），输入框工作目录栏保留。
 */
import useConversation from '@/hooks/useConversation';
import { apiAgentConversationCreate } from '@/services/agentConfig';
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { historyPush } = vi.hoisted(() => ({
  historyPush: vi.fn(),
}));

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

const createMock = vi.mocked(apiAgentConversationCreate);

afterEach(() => {
  vi.clearAllMocks();
});

describe('useConversation 创建会话携带工作目录（wiki #17）', () => {
  beforeEach(() => {
    createMock.mockResolvedValue({
      code: 200,
      success: true,
      data: { id: 77, agentId: 5 },
    } as never);
  });

  it('选个人电脑时创建参数携带 sandboxId 数值与 workspacePath', async () => {
    const { result } = renderHook(() => useConversation());
    await result.current.handleCreateConversation(5, {
      message: 'hi',
      selectedComputerId: '4321',
      workspacePath: '/Users/me/project',
    });
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: 5,
        sandboxId: 4321,
        workspacePath: '/Users/me/project',
      }),
    );
    expect(historyPush).toHaveBeenCalledWith(
      '/home/chat/77/5',
      expect.objectContaining({ selectedComputerId: '4321' }),
    );
  });

  it('云电脑（-1）不携带 sandboxId/workspacePath', async () => {
    const { result } = renderHook(() => useConversation());
    await result.current.handleCreateConversation(5, {
      message: 'hi',
      selectedComputerId: '-1',
      workspacePath: '/should/not/send',
    });
    const params = createMock.mock.calls[0][0];
    expect(params.sandboxId).toBeUndefined();
    expect(params.workspacePath).toBeUndefined();
  });

  it('选个人电脑但未选目录时不携带 workspacePath，仍带 sandboxId', async () => {
    const { result } = renderHook(() => useConversation());
    await result.current.handleCreateConversation(5, {
      message: 'hi',
      selectedComputerId: '88',
    });
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ sandboxId: 88 }),
    );
    const params = createMock.mock.calls[0][0];
    expect(params.workspacePath).toBeUndefined();
  });

  it('创建失败（如目录被占用）时中止跳转会话页', async () => {
    createMock.mockResolvedValue({
      code: 'BUSINESS_ERROR',
      success: false,
      message: '目录已被占用',
      data: null,
    } as never);
    const { result } = renderHook(() => useConversation());
    await result.current.handleCreateConversation(5, {
      message: 'hi',
      selectedComputerId: '4321',
      workspacePath: '/Users/me/project',
    });
    expect(historyPush).not.toHaveBeenCalled();
  });
});
