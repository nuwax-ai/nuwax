import type { ConversationRuntimeSession } from '@/features/conversation/runtime/createConversationRuntimeSession';
import { useInitialConversationAutoSend } from '@/hooks/useInitialConversationAutoSend';
import { AgentComponentTypeEnum, MessageTypeEnum } from '@/types/enums/agent';
import { OpenCloseEnum } from '@/types/enums/space';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement, StrictMode } from 'react';
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

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

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

  it('A 预查询迟到时不得在 B 已发送后向共用 runtime 发送 A', async () => {
    const pendingA = deferred<typeof snapshot>();
    mockFetchConversationSnapshot.mockImplementation((id: number) =>
      id === 101 ? pendingA.promise : Promise.resolve({ ...snapshot, id }),
    );
    const runtimeSession = createRuntimeSessionStub();
    const onMessageSend = vi.fn();
    const { rerender } = renderHook(
      ({ conversationId }) =>
        useInitialConversationAutoSend({
          ...baseParams,
          conversationId,
          runtimeSession,
          onMessageSend,
        }),
      { initialProps: { conversationId: 101 } },
    );

    rerender({ conversationId: 202 });
    await waitFor(() => expect(runtimeSession.send).toHaveBeenCalledTimes(1));
    await act(async () => pendingA.resolve({ ...snapshot, id: 101 }));

    expect(runtimeSession.send).toHaveBeenCalledTimes(1);
    expect(runtimeSession.send).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: 202 }),
    );
    expect(onMessageSend).not.toHaveBeenCalled();
  });

  it.each(['runtime', 'legacy'] as const)(
    '%s 入口卸载后预查询返回，不得后台自动发送',
    async (line) => {
      const pending = deferred<typeof snapshot>();
      mockFetchConversationSnapshot.mockReturnValue(pending.promise);
      const runtimeSession = createRuntimeSessionStub();
      const onMessageSend = vi.fn();
      const { unmount } = renderHook(() =>
        useInitialConversationAutoSend({
          ...baseParams,
          runtimeSession: line === 'runtime' ? runtimeSession : null,
          onMessageSend,
        }),
      );

      unmount();
      await act(async () => pending.resolve(snapshot));

      expect(runtimeSession.send).not.toHaveBeenCalled();
      expect(onMessageSend).not.toHaveBeenCalled();
    },
  );

  it('A→B→A 时只允许第二次进入 A 的预查询触发首发', async () => {
    const staleA = deferred<typeof snapshot>();
    const currentA = deferred<typeof snapshot>();
    mockFetchConversationSnapshot
      .mockReturnValueOnce(staleA.promise)
      .mockReturnValueOnce(currentA.promise);
    const runtimeSession = createRuntimeSessionStub();
    const onMessageSend = vi.fn();
    const { rerender } = renderHook(
      ({ conversationId, initialMessage }) =>
        useInitialConversationAutoSend({
          ...baseParams,
          conversationId,
          routeState: initialMessage ? routeState : null,
          runtimeSession,
          onMessageSend,
        }),
      { initialProps: { conversationId: 101, initialMessage: true } },
    );

    rerender({ conversationId: 202, initialMessage: false });
    rerender({ conversationId: 101, initialMessage: true });
    await act(async () => staleA.resolve({ ...snapshot, id: 101 }));
    expect(runtimeSession.send).not.toHaveBeenCalled();
    await act(async () => currentA.resolve({ ...snapshot, id: 101 }));

    expect(runtimeSession.send).toHaveBeenCalledTimes(1);
    expect(mockFetchConversationSnapshot).toHaveBeenCalledTimes(2);
  });

  it('同会话查询期间回调引用变化，不取消或重复首发', async () => {
    const pending = deferred<typeof snapshot>();
    mockFetchConversationSnapshot.mockReturnValue(pending.promise);
    const runtimeSession = createRuntimeSessionStub();
    const onMessageSend = vi.fn();
    const { rerender } = renderHook(() =>
      useInitialConversationAutoSend({
        ...baseParams,
        getEffectiveSandboxId: () => '-1',
        runtimeSession,
        onMessageSend,
      }),
    );

    rerender();
    await act(async () => pending.resolve(snapshot));

    expect(runtimeSession.send).toHaveBeenCalledTimes(1);
    expect(mockFetchConversationSnapshot).toHaveBeenCalledTimes(1);
  });

  it('StrictMode 清理并重放 effect 后仍恰好首发一次', async () => {
    const pending = deferred<typeof snapshot>();
    mockFetchConversationSnapshot.mockReturnValue(pending.promise);
    const runtimeSession = createRuntimeSessionStub();
    renderHook(
      () =>
        useInitialConversationAutoSend({
          ...baseParams,
          runtimeSession,
          onMessageSend: vi.fn(),
        }),
      { wrapper: ({ children }) => createElement(StrictMode, null, children) },
    );

    await act(async () => pending.resolve(snapshot));
    expect(runtimeSession.send).toHaveBeenCalledTimes(1);
  });
});
