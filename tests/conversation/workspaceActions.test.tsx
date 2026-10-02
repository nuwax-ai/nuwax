import { ConversationWorkspaceCompatBoundary } from '@/features/conversation/react/ConversationWorkspaceCompatBoundary';
import {
  ConversationWorkspaceProvider,
  useConversationWorkspaceActions,
} from '@/features/conversation/react/ConversationWorkspaceProvider';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const legacy = vi.hoisted(() => ({
  openPreviewView: vi.fn(),
  setTaskAgentSelectedFileId: vi.fn(),
  setTaskAgentSelectTrigger: vi.fn(),
  useModel: vi.fn(),
}));
vi.mock('umi', () => ({
  useModel: (...args: unknown[]) => legacy.useModel(...args),
}));

function OpenFile() {
  const actions = useConversationWorkspaceActions()!;
  return (
    <button
      type="button"
      onClick={() =>
        void actions.openFile(42, 'report.html', {
          skipFileTreeRefresh: true,
        })
      }
    >
      打开文件
    </button>
  );
}

describe('会话工作区兼容边界', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    legacy.useModel.mockImplementation(() => legacy);
    legacy.openPreviewView.mockResolvedValue(undefined);
  });

  it('注入动作不订阅旧 model；props 优先于外层 context', () => {
    legacy.useModel.mockImplementation(() => {
      throw new Error('此入口没有 conversationInfo provider');
    });
    const outer = { openFile: vi.fn() };
    const injected = { openFile: vi.fn() };
    const { rerender } = render(
      <ConversationWorkspaceProvider actions={outer}>
        <ConversationWorkspaceCompatBoundary actions={injected}>
          <OpenFile />
        </ConversationWorkspaceCompatBoundary>
      </ConversationWorkspaceProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: '打开文件' }));
    expect(injected.openFile).toHaveBeenCalledWith(42, 'report.html', {
      skipFileTreeRefresh: true,
    });
    expect(outer.openFile).not.toHaveBeenCalled();
    rerender(
      <ConversationWorkspaceProvider actions={outer}>
        <ConversationWorkspaceCompatBoundary>
          <OpenFile />
        </ConversationWorkspaceCompatBoundary>
      </ConversationWorkspaceProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: '打开文件' }));
    expect(outer.openFile).toHaveBeenCalledOnce();
    expect(legacy.useModel).not.toHaveBeenCalled();
  });

  it('旧入口等预览完成后再选文件；重复选择仍触发刷新', async () => {
    let finishPreview!: () => void;
    legacy.openPreviewView.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishPreview = resolve;
        }),
    );
    const now = vi.spyOn(Date, 'now').mockReturnValue(123456);
    try {
      render(
        <ConversationWorkspaceCompatBoundary>
          <OpenFile />
        </ConversationWorkspaceCompatBoundary>,
      );
      fireEvent.click(screen.getByRole('button', { name: '打开文件' }));
      expect(legacy.openPreviewView).toHaveBeenCalledWith(42, {
        skipFileTreeRefresh: true,
      });
      expect(legacy.setTaskAgentSelectedFileId).not.toHaveBeenCalled();
      expect(legacy.setTaskAgentSelectTrigger).not.toHaveBeenCalled();
      await act(async () => finishPreview());
      expect(legacy.setTaskAgentSelectedFileId).toHaveBeenCalledWith(
        'report.html',
      );
      expect(legacy.setTaskAgentSelectTrigger).toHaveBeenCalledWith(123456);
      fireEvent.click(screen.getByRole('button', { name: '打开文件' }));
      await act(async () => finishPreview());
      expect(legacy.setTaskAgentSelectedFileId).toHaveBeenCalledTimes(2);
      expect(legacy.setTaskAgentSelectTrigger).toHaveBeenCalledTimes(2);
    } finally {
      now.mockRestore();
    }
  });

  it('预览失败向调用方返回错误且不写入选中文件', async () => {
    const failure = new Error('预览不可用');
    legacy.openPreviewView.mockRejectedValue(failure);
    let actions: ReturnType<typeof useConversationWorkspaceActions>;
    function CaptureActions() {
      actions = useConversationWorkspaceActions();
      return null;
    }
    render(
      <ConversationWorkspaceCompatBoundary>
        <CaptureActions />
      </ConversationWorkspaceCompatBoundary>,
    );
    await expect(
      actions!.openFile(42, 'data/a.openui.json', {
        forceRefresh: true,
      }),
    ).rejects.toBe(failure);
    expect(legacy.openPreviewView).toHaveBeenCalledWith(42, {
      forceRefresh: true,
    });
    expect(legacy.setTaskAgentSelectedFileId).not.toHaveBeenCalled();
    expect(legacy.setTaskAgentSelectTrigger).not.toHaveBeenCalled();
  });
});
