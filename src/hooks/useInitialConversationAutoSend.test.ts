import type { ConversationRuntimeSession } from '@/features/conversation/runtime/createConversationRuntimeSession';
import { useInitialConversationAutoSend } from '@/hooks/useInitialConversationAutoSend';
import { AgentComponentTypeEnum, MessageTypeEnum } from '@/types/enums/agent';
import { OpenCloseEnum } from '@/types/enums/space';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetchConversationSnapshot } = vi.hoisted(() => ({
  mockFetchConversationSnapshot: vi.fn(),
}));

vi.mock('@/utils/conversationTaskStatusSync', () => ({
  fetchConversationSnapshot: (...args: unknown[]) =>
    mockFetchConversationSnapshot(...args),
}));

/** 只用到 send 的最小 session 桩（完整接口由 hook 类型约束，测试只验证发送分派） */
const createRuntimeSessionStub = () =>
  ({ send: vi.fn() } as unknown as ConversationRuntimeSession);

const routeState = {
  message: 'build a dashboard',
  files: [
    {
      uid: 'f1',
      name: 'mockup.png',
      type: 'image/png',
      url: 'https://e.test/m.png',
      size: 1024,
    },
  ],
  infos: [{ id: 11, type: AgentComponentTypeEnum.Plugin }],
  skillIds: [301],
  modelId: 2002,
};

const snapshot = {
  id: 1694187,
  messageList: [],
  agent: { agentId: 88, openSuggest: OpenCloseEnum.Open },
};

const baseParams = {
  conversationId: 1694187,
  routeState,
  getEffectiveSandboxId: () => '-1',
};

describe('useInitialConversationAutoSend（bug 2477：V2 直发与 V1 回退二分）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchConversationSnapshot.mockResolvedValue(snapshot);
  });

  it('runtimeSession 存在时直发 runtime store（乐观轮次与渲染同线），不再走 model 线', async () => {
    const runtimeSession = createRuntimeSessionStub();
    const send = runtimeSession.send as ReturnType<typeof vi.fn>;
    const onMessageSend = vi.fn();

    renderHook(() =>
      useInitialConversationAutoSend({
        ...baseParams,
        onMessageSend,
        runtimeSession,
      }),
    );

    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    // 参数映射对齐 Chat 页 runtimeSession.send（sandboxId 字符串化、
    // currentInfo=预查询快照、isSuggestEnabled 由 agent.openSuggest 推导）
    expect(send).toHaveBeenCalledWith({
      conversationId: 1694187,
      message: 'build a dashboard',
      files: routeState.files,
      infos: routeState.infos,
      sandboxId: '-1',
      currentInfo: snapshot,
      isSuggestEnabled: true,
      skillIds: [301],
      modelId: 2002,
      agentMode: 'yolo',
    });
    expect(onMessageSend).not.toHaveBeenCalled();
  });

  it('runtimeSession 缺省（flag 关）时回落 V1 onMessageSend 原路径', async () => {
    const onMessageSend = vi.fn();

    renderHook(() =>
      useInitialConversationAutoSend({
        ...baseParams,
        onMessageSend,
        runtimeSession: null,
      }),
    );

    await waitFor(() => expect(onMessageSend).toHaveBeenCalledTimes(1));
    expect(onMessageSend).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1694187,
        messageInfo: 'build a dashboard',
        sandboxId: '-1',
        data: snapshot,
      }),
    );
  });

  it('快照已有用户消息（非开场白）时不发送', async () => {
    mockFetchConversationSnapshot.mockResolvedValue({
      ...snapshot,
      messageList: [{ id: 'm1', messageType: MessageTypeEnum.USER }],
    });
    const runtimeSession = createRuntimeSessionStub();
    const send = runtimeSession.send as ReturnType<typeof vi.fn>;
    const onMessageSend = vi.fn();

    renderHook(() =>
      useInitialConversationAutoSend({
        ...baseParams,
        onMessageSend,
        runtimeSession,
      }),
    );

    await waitFor(() =>
      expect(mockFetchConversationSnapshot).toHaveBeenCalledTimes(1),
    );
    expect(send).not.toHaveBeenCalled();
    expect(onMessageSend).not.toHaveBeenCalled();
  });

  it('同一会话只自动发送一次（effect 重跑防重）', async () => {
    const runtimeSession = createRuntimeSessionStub();
    const send = runtimeSession.send as ReturnType<typeof vi.fn>;
    const onMessageSend = vi.fn();

    const { rerender } = renderHook(() =>
      useInitialConversationAutoSend({
        ...baseParams,
        onMessageSend,
        runtimeSession,
      }),
    );
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));

    rerender();
    rerender();

    expect(send).toHaveBeenCalledTimes(1);
    expect(onMessageSend).not.toHaveBeenCalled();
  });

  it('预查询失败时仍以空快照放行发送（sandboxId 走兜底链）', async () => {
    mockFetchConversationSnapshot.mockResolvedValue(undefined);
    const runtimeSession = createRuntimeSessionStub();
    const send = runtimeSession.send as ReturnType<typeof vi.fn>;

    renderHook(() =>
      useInitialConversationAutoSend({
        ...baseParams,
        onMessageSend: vi.fn(),
        runtimeSession,
      }),
    );

    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ currentInfo: null, isSuggestEnabled: false }),
    );
  });
});
