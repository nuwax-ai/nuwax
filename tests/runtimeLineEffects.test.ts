/**
 * 新线 effects adapter（runtimeLineHttp.createRuntimeLineEffectsAdapter）合同测试。
 * 覆盖：recent/list 面、suggest 防抖写回、topic 更新与门禁、conflict.confirmStop、
 * 页面资源路由（card/desktop/file/taskResult）、未注入资源时静默忽略。
 */
import { EVENT_TYPE } from '@/constants/event.constants';
import {
  createRuntimeLineEffectsAdapter,
  runtimeLineHttp,
} from '@/features/conversation/react/runtimeLineHttp';
import { TaskStatus } from '@/types/enums/agent';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockEventBusEmit, mockListStatus, mockSuggestApi, mockTopicApi } =
  vi.hoisted(() => ({
    mockEventBusEmit: vi.fn(),
    mockListStatus: vi.fn(),
    mockSuggestApi: vi.fn(),
    mockTopicApi: vi.fn(),
  }));

vi.mock('@/utils/eventBus', () => ({
  default: {
    on: vi.fn(),
    off: vi.fn(),
    emit: (...args: unknown[]) => mockEventBusEmit(...args),
  },
}));

vi.mock('@/utils/conversationTaskStatusSync', () => ({
  applyTerminalTaskStatus: vi.fn(),
  emitConversationListTaskStatus: (...args: unknown[]) =>
    mockListStatus(...args),
}));

vi.mock('@/services/agentConfig', () => ({
  apiAgentConversation: vi.fn(),
  apiAgentConversationChatStop: vi.fn(),
  apiAgentConversationChatSuggest: (...args: unknown[]) =>
    mockSuggestApi(...args),
  apiAgentConversationMessageList: vi.fn(),
  apiAgentConversationUpdate: (...args: unknown[]) => mockTopicApi(...args),
}));

const createAdapter = (
  resources: Record<string, unknown> = {},
  setConversationInfo = vi.fn(),
) =>
  createRuntimeLineEffectsAdapter({
    setConversationInfo: setConversationInfo as never,
    resources: resources as never,
  });

describe('runtimeLine effects adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('recent.status.patch：乐观 context 直发事件，终态补丁走领域入口', () => {
    const adapter = createAdapter();
    adapter.dispatch({
      type: 'recent.status.patch',
      conversationId: 1001,
      status: TaskStatus.EXECUTING,
      context: { agentId: 9, topic: 't' },
    });
    expect(mockEventBusEmit).toHaveBeenCalledWith(
      EVENT_TYPE.UpdateConversationListTaskStatus,
      { conversationId: 1001, agentId: 9, topic: 't', taskStatus: 'EXECUTING' },
    );

    adapter.dispatch({
      type: 'recent.status.patch',
      conversationId: 1001,
      status: TaskStatus.FAILED,
    });
    expect(mockListStatus).toHaveBeenCalledWith(1001, 'FAILED');
  });

  it('recent.list.refresh：发射侧栏刷新', () => {
    createAdapter().dispatch({
      type: 'recent.list.refresh',
      conversationId: 1001,
      reason: 'stream-closed',
    });
    expect(mockEventBusEmit).toHaveBeenCalledWith(
      EVENT_TYPE.RefreshConversationList,
      { conversationId: 1001, reason: 'stream-closed' },
    );
  });

  it('suggest.fetch：300ms 防抖后拉取并经 onSuggestLoaded 写回', async () => {
    vi.useFakeTimers();
    mockSuggestApi.mockResolvedValue({ data: ['建议一', '建议二'] });
    const onSuggestLoaded = vi.fn();
    const adapter = createAdapter({ onSuggestLoaded });

    adapter.dispatch({ type: 'suggest.fetch', params: {} as never });
    adapter.dispatch({ type: 'suggest.fetch', params: {} as never });
    expect(mockSuggestApi).not.toHaveBeenCalled(); // 防抖窗口内未发

    await vi.advanceTimersByTimeAsync(350);
    expect(mockSuggestApi).toHaveBeenCalledTimes(1); // 连续触发只发一次
    expect(onSuggestLoaded).toHaveBeenCalledWith(['建议一', '建议二']);
  });

  it('topic.update：一次门禁 + 成功写回/列表刷新/历史双拉，失败回滚门禁', async () => {
    mockTopicApi.mockResolvedValue({
      data: { topic: '新主题', topicUpdated: 1 },
    });
    const setConversationInfo = vi.fn();
    const runHistory = vi.fn();
    const runHistoryItem = vi.fn();
    const adapter = createAdapter(
      { runHistory, runHistoryItem },
      setConversationInfo,
    );
    const currentInfo = { id: 1001, agentId: 9, topicUpdated: 0 } as never;

    adapter.dispatch({
      type: 'topic.update',
      conversationId: 1001,
      firstMessage: '首条',
      currentInfo,
    });
    // 门禁立即落下：第二次 dispatch 被拦
    adapter.dispatch({
      type: 'topic.update',
      conversationId: 1001,
      firstMessage: '首条',
      currentInfo,
    });
    expect(mockTopicApi).toHaveBeenCalledTimes(1);

    await vi.waitFor(() => {
      expect(setConversationInfo).toHaveBeenCalled();
    });
    expect(mockEventBusEmit).toHaveBeenCalledWith(
      EVENT_TYPE.RefreshConversationList,
      expect.objectContaining({ reason: 'topic-updated' }),
    );
    expect(runHistory).toHaveBeenCalledWith({ agentId: null, limit: 5 });
    expect(runHistoryItem).toHaveBeenCalledWith({ agentId: 9, limit: 20 });
  });

  it('topic.update 失败：门禁回滚允许重试', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockTopicApi.mockRejectedValue(new Error('net'));
    const adapter = createAdapter();
    const currentInfo = { id: 1001, agentId: 9, topicUpdated: 0 } as never;

    adapter.dispatch({
      type: 'topic.update',
      conversationId: 1001,
      firstMessage: 'a',
      currentInfo,
    });
    // 等待 rejection 被 catch 处理（门禁回滚发生在 catch 微任务中）
    await vi.waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
    adapter.dispatch({
      type: 'topic.update',
      conversationId: 1001,
      firstMessage: 'a',
      currentInfo,
    });
    expect(mockTopicApi).toHaveBeenCalledTimes(2); // 门禁已回滚
    errorSpy.mockRestore();
  });

  it('conflict.confirmStop：交给资源执行', () => {
    const confirmStop = vi.fn();
    createAdapter({ confirmStop }).dispatch({
      type: 'conflict.confirmStop',
      conversationId: 1001,
    });
    expect(confirmStop).toHaveBeenCalledWith(1001);
  });

  it('taskResult.settle：保序路由资源（刷树→Git→选中→兜底 trigger）', async () => {
    const refreshFileListImmediately = vi.fn().mockResolvedValue(undefined);
    const refreshGitList = vi.fn();
    const setTaskAgentSelectedFileId = vi.fn();
    const setTaskAgentSelectTrigger = vi.fn();
    const setFileTreeRefreshTrigger = vi.fn();
    const openPreviewView = vi.fn();
    const adapter = createAdapter({
      refreshFileListImmediately,
      refreshGitListRef: { current: refreshGitList },
      setTaskAgentSelectedFileId,
      setTaskAgentSelectTrigger,
      setFileTreeRefreshTrigger,
      openPreviewView,
    });

    adapter.dispatch({
      type: 'taskResult.settle',
      conversationId: 1001,
      taskResult: { hasTaskResult: true, file: '1001/src/a.tsx' },
      enableVersionControl: true,
    });
    await vi.waitFor(() => {
      expect(setTaskAgentSelectedFileId).toHaveBeenCalledWith('src/a.tsx');
    });
    expect(refreshFileListImmediately).toHaveBeenCalledWith(1001);
    expect(refreshGitList).toHaveBeenCalled();
    expect(openPreviewView).toHaveBeenCalledWith(1001);
    expect(setFileTreeRefreshTrigger).not.toHaveBeenCalled(); // 命中文件：无兜底

    // 未命中文件：发兜底 trigger
    adapter.dispatch({
      type: 'taskResult.settle',
      conversationId: 1001,
      taskResult: { hasTaskResult: false },
      enableVersionControl: false,
    });
    await vi.waitFor(() => {
      expect(setFileTreeRefreshTrigger).toHaveBeenCalled();
    });
  });

  it('未注入资源的 effect 静默忽略（不抛错）', () => {
    const adapter = createAdapter(); // 无任何资源
    expect(() => {
      adapter.dispatch({
        type: 'preview.page.open',
        preview: {} as never,
      });
      adapter.dispatch({
        type: 'card.result.apply',
        cardBindConfig: {},
        cardData: {},
        append: true,
      });
      adapter.dispatch({ type: 'desktop.open', conversationId: 1 });
      adapter.dispatch({
        type: 'preview.file.refresh',
        conversationId: 1,
        mode: 'throttled',
      });
    }).not.toThrow();
  });

  it('runtimeLineHttp：stop/load/分页句柄直通 services', async () => {
    const {
      apiAgentConversationChatStop,
      apiAgentConversation,
      apiAgentConversationMessageList,
    } = await import('@/services/agentConfig');
    await runtimeLineHttp.stopConversation('42');
    await runtimeLineHttp.loadConversation(7);
    await runtimeLineHttp.fetchMessagePage(7, 0, 20);
    expect(apiAgentConversationChatStop).toHaveBeenCalledWith('42');
    expect(apiAgentConversation).toHaveBeenCalledWith(7);
    expect(apiAgentConversationMessageList).toHaveBeenCalledWith({
      conversationId: 7,
      index: 0,
      size: 20,
    });
  });
});
