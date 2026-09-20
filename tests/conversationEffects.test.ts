/**
 * Effects Seam（effectDispatcher + 主/隔离 Adapter）单元测试
 *
 * Phase 5 第一片（recent/taskStatus）：
 * - dispatcher shadow/live 双模式合同；
 * - 主 Chat Adapter 全量执行；
 * - 隔离 Preview Adapter 只执行允许子集。
 */
import { createPreviewEffectsAdapter } from '@/features/conversation/adapters/previewEffectsAdapter';
import { createRuntimeLineEffectsAdapter } from '@/features/conversation/react/runtimeLineHttp';
import { createConversationRuntime } from '@/features/conversation/runtime/createConversationRuntime';
import {
  createEffectDispatcher,
  type ConversationEffect,
  type ConversationEffectsAdapter,
} from '@/features/conversation/runtime/effectDispatcher';
import { TaskStatus } from '@/types/enums/agent';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockEventBusEmit,
  mockEmitConversationListTaskStatus,
  mockFetchSuggest,
  mockShowPagePreview,
  mockOpenDesktop,
  mockRefreshFileListThrottled,
  mockRefreshGitList,
  mockOpenPreviewView,
} = vi.hoisted(() => ({
  mockEventBusEmit: vi.fn(),
  mockEmitConversationListTaskStatus: vi.fn(),
  mockFetchSuggest: vi.fn(),
  mockShowPagePreview: vi.fn(),
  mockOpenDesktop: vi.fn(),
  mockRefreshFileListThrottled: vi.fn(),
  mockRefreshGitList: vi.fn(),
  mockOpenPreviewView: vi.fn(),
}));

vi.mock('@/utils/eventBus', () => ({
  default: {
    on: vi.fn(),
    off: vi.fn(),
    emit: (...args: unknown[]) => mockEventBusEmit(...args),
  },
}));

vi.mock('@/utils/conversationTaskStatusSync', () => ({
  emitConversationListTaskStatus: (...args: unknown[]) =>
    mockEmitConversationListTaskStatus(...args),
  // runtimeLineHttp 从该模块 re-export applyTerminalTaskStatus，桩需含此导出
  applyTerminalTaskStatus: vi.fn(),
}));

// runtimeLineHttp 顶层 import services（umi request 链），非 umi 测试环境桩掉
vi.mock('@/services/agentConfig', () => ({
  apiAgentConversation: vi.fn(),
  apiAgentConversationChatStop: vi.fn(),
  apiAgentConversationChatSuggest: vi.fn(),
  apiAgentConversationMessageList: vi.fn(),
  apiAgentConversationUpdate: vi.fn(),
}));

vi.mock('@/utils/conversationEffectsDiagnostics', () => ({
  logConversationEffectDispatch: vi.fn(),
}));

const terminalPatch: ConversationEffect = {
  type: 'recent.status.patch',
  conversationId: 1001,
  status: TaskStatus.FAILED,
};

const optimisticPatch: ConversationEffect = {
  type: 'recent.status.patch',
  conversationId: 1001,
  status: TaskStatus.EXECUTING,
  context: { agentId: 9, topic: '会话主题' },
};

const listRefresh: ConversationEffect = {
  type: 'recent.list.refresh',
  conversationId: 1001,
  reason: 'stream-closed',
};

const suggestFetch: ConversationEffect = {
  type: 'suggest.fetch',
  params: { conversationId: 1001, message: 'hello' } as never,
};

const topicUpdate: ConversationEffect = {
  type: 'topic.update',
  conversationId: 1001,
  firstMessage: '你好',
  currentInfo: {
    id: 1001,
    agentId: 9,
    topicUpdated: 0,
  } as never,
};

/** runtimeLine 版页面资源构造器（默认全 mock，按用例覆盖；生产执行体
 *  为 createRuntimeLineEffectsAdapter——原 mainChatEffectsAdapter 参考实现已删除） */
const createRuntimeResources = (overrides: Record<string, unknown> = {}) => ({
  refreshFileListThrottled: mockRefreshFileListThrottled,
  refreshFileListImmediately: vi
    .fn()
    .mockReturnValue(Promise.resolve()) as never,
  refreshGitListRef: { current: mockRefreshGitList },
  openPreviewView: mockOpenPreviewView,
  setTaskAgentSelectedFileId: vi.fn(),
  setTaskAgentSelectTrigger: vi.fn(),
  setFileTreeRefreshTrigger: vi.fn(),
  ...overrides,
});

const createRuntimeAdapter = (overrides: Record<string, unknown> = {}) =>
  createRuntimeLineEffectsAdapter({
    setConversationInfo: vi.fn(),
    resources: createRuntimeResources(overrides) as never,
  });

const createPreviewAdapter = () =>
  createPreviewEffectsAdapter({
    fetchSuggest: mockFetchSuggest,
    showPagePreview: mockShowPagePreview,
  });

describe('effectDispatcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shadow 模式只记录计划 effect，不执行 Adapter', () => {
    const adapter: ConversationEffectsAdapter = { dispatch: vi.fn() };
    const dispatcher = createEffectDispatcher({ adapter, mode: 'shadow' });

    dispatcher.dispatch(terminalPatch);
    dispatcher.dispatch(listRefresh);

    expect(dispatcher.mode).toBe('shadow');
    expect(adapter.dispatch).not.toHaveBeenCalled();
    expect(dispatcher.getJournal()).toEqual([terminalPatch, listRefresh]);
  });

  it('live 模式记录并交给 Adapter 执行', () => {
    const adapter: ConversationEffectsAdapter = { dispatch: vi.fn() };
    const dispatcher = createEffectDispatcher({ adapter, mode: 'live' });

    dispatcher.dispatch(terminalPatch);

    expect(adapter.dispatch).toHaveBeenCalledWith(terminalPatch);
    expect(dispatcher.getJournal()).toEqual([terminalPatch]);
  });

  it('未指定模式时默认 shadow（迁移期安全默认）', () => {
    const adapter: ConversationEffectsAdapter = { dispatch: vi.fn() };
    const dispatcher = createEffectDispatcher({ adapter });

    dispatcher.dispatch(terminalPatch);

    expect(dispatcher.mode).toBe('shadow');
    expect(adapter.dispatch).not.toHaveBeenCalled();
  });

  it('clearJournal 清空计划记录', () => {
    const dispatcher = createEffectDispatcher({
      adapter: { dispatch: vi.fn() },
      mode: 'shadow',
    });
    dispatcher.dispatch(terminalPatch);
    dispatcher.clearJournal();
    expect(dispatcher.getJournal()).toEqual([]);
  });

  it('live 模式下 shadowEffectTypes 名单内的类型只记录不执行（分片 shadow 通道）', () => {
    const adapter: ConversationEffectsAdapter = { dispatch: vi.fn() };
    const dispatcher = createEffectDispatcher({
      adapter,
      mode: 'live',
      shadowEffectTypes: ['suggest.fetch'],
    });

    dispatcher.dispatch(suggestFetch);
    dispatcher.dispatch(terminalPatch);

    // 名单内：不执行（防与旧路径双发）；名单外：正常执行
    expect(adapter.dispatch).toHaveBeenCalledTimes(1);
    expect(adapter.dispatch).toHaveBeenCalledWith(terminalPatch);
    expect(dispatcher.getJournal()).toEqual([suggestFetch, terminalPatch]);
  });
});

describe('runtimeLineEffectsAdapter（生产 effects 执行体）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('preview.file.refresh 按模式路由节流/立即刷新', () => {
    const refreshFileListImmediately = vi
      .fn()
      .mockReturnValue(Promise.resolve());
    const adapter = createRuntimeAdapter({ refreshFileListImmediately });

    adapter.dispatch({
      type: 'preview.file.refresh',
      conversationId: 1001,
      mode: 'throttled',
    });
    adapter.dispatch({
      type: 'preview.file.refresh',
      conversationId: 1001,
      mode: 'immediate',
    });

    expect(mockRefreshFileListThrottled).toHaveBeenCalledWith(1001);
    expect(refreshFileListImmediately).toHaveBeenCalledWith(1001);
  });

  it('taskResult.settle 保序：立即刷树 → Git → 文件选中打开，命中不发兜底 trigger', async () => {
    const setTaskAgentSelectedFileId = vi.fn();
    const setTaskAgentSelectTrigger = vi.fn();
    const setFileTreeRefreshTrigger = vi.fn();
    const adapter = createRuntimeAdapter({
      setTaskAgentSelectedFileId,
      setTaskAgentSelectTrigger,
      setFileTreeRefreshTrigger,
    });

    adapter.dispatch({
      type: 'taskResult.settle',
      conversationId: 1001,
      taskResult: { hasTaskResult: true, file: '1001/src/app.tsx' },
      enableVersionControl: true,
    });

    await vi.waitFor(() => {
      expect(setTaskAgentSelectedFileId).toHaveBeenCalled();
    });
    expect(mockOpenPreviewView).toHaveBeenCalledWith(1001);
    expect(mockRefreshGitList).toHaveBeenCalled();
    expect(setTaskAgentSelectedFileId).toHaveBeenCalledWith('src/app.tsx');
    expect(setTaskAgentSelectTrigger).toHaveBeenCalledWith(expect.any(Number));
    // 命中 task-result 文件：不发兜底 trigger
    expect(setFileTreeRefreshTrigger).not.toHaveBeenCalled();
  });

  it('taskResult.settle 未命中文件或未开版本管理时的分支', async () => {
    const setFileTreeRefreshTrigger = vi.fn();
    const adapter = createRuntimeAdapter({ setFileTreeRefreshTrigger });

    adapter.dispatch({
      type: 'taskResult.settle',
      conversationId: 1001,
      taskResult: { hasTaskResult: false },
      enableVersionControl: false,
    });

    await vi.waitFor(() => {
      expect(setFileTreeRefreshTrigger).toHaveBeenCalled();
    });
    expect(mockRefreshGitList).not.toHaveBeenCalled();
    expect(mockOpenPreviewView).not.toHaveBeenCalled();
  });
});

describe('previewEffectsAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('执行无 context 的终态补丁', () => {
    createPreviewAdapter().dispatch(terminalPatch);

    expect(mockEmitConversationListTaskStatus).toHaveBeenCalledWith(
      1001,
      TaskStatus.FAILED,
    );
    expect(mockEventBusEmit).not.toHaveBeenCalled();
  });

  it('执行 suggest.fetch（隔离面板同样拉取建议）', () => {
    createPreviewAdapter().dispatch(suggestFetch);

    expect(mockFetchSuggest).toHaveBeenCalledWith(suggestFetch.params);
  });

  it('执行页面与链接预览（隔离面板同样支持）', () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);

    createPreviewAdapter().dispatch({
      type: 'preview.page.open',
      preview: { uri: '/p', params: {}, executeId: 'e' },
    });
    createPreviewAdapter().dispatch({
      type: 'preview.link.open',
      url: 'https://example.com',
    });

    expect(mockShowPagePreview).toHaveBeenCalledWith({
      uri: '/p',
      params: {},
      executeId: 'e',
    });
    expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank');
    openSpy.mockRestore();
  });

  it('忽略乐观标记、列表刷新、主题更新、卡片与桌面（隔离子集）', () => {
    const setCardList = vi.fn();
    const adapter = createPreviewEffectsAdapter({
      fetchSuggest: mockFetchSuggest,
      showPagePreview: mockShowPagePreview,
    });

    createPreviewAdapter().dispatch(optimisticPatch);
    createPreviewAdapter().dispatch(listRefresh);
    createPreviewAdapter().dispatch(topicUpdate);
    adapter.dispatch({
      type: 'card.result.apply',
      cardBindConfig: { cardKey: 'k' },
      cardData: {} as never,
      append: true,
    });
    adapter.dispatch({ type: 'desktop.open', conversationId: 1 });

    expect(mockEmitConversationListTaskStatus).not.toHaveBeenCalled();
    expect(mockEventBusEmit).not.toHaveBeenCalled();
    expect(setCardList).not.toHaveBeenCalled();
    expect(mockOpenDesktop).not.toHaveBeenCalled();
  });
});

describe('createConversationRuntime 组合 effect 分发', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Runtime 暴露 effects dispatcher，未注入 Adapter 时默认 shadow 不执行', () => {
    const runtime = createConversationRuntime({
      renderProcessingBlock: vi.fn(),
      reconcileFinalMessage: vi.fn(),
    });

    expect(runtime.effects.mode).toBe('shadow');
    runtime.effects.dispatch(terminalPatch);
    expect(runtime.effects.getJournal()).toEqual([terminalPatch]);
  });

  it('不同 Runtime 实例的 effect 计划互相隔离', () => {
    const first = createConversationRuntime({
      renderProcessingBlock: vi.fn(),
      reconcileFinalMessage: vi.fn(),
    });
    const second = createConversationRuntime({
      renderProcessingBlock: vi.fn(),
      reconcileFinalMessage: vi.fn(),
    });

    first.effects.dispatch(terminalPatch);

    expect(first.effects.getJournal()).toEqual([terminalPatch]);
    expect(second.effects.getJournal()).toEqual([]);
  });
});
