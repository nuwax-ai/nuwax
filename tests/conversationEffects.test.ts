/**
 * Effects Seam（effectDispatcher + 主/隔离 Adapter）单元测试
 *
 * Phase 5 第一片（recent/taskStatus）：
 * - dispatcher shadow/live 双模式合同；
 * - 主 Chat Adapter 全量执行；
 * - 隔离 Preview Adapter 只执行允许子集。
 */
import { EVENT_TYPE } from '@/constants/event.constants';
import { createMainChatEffectsAdapter } from '@/features/conversation/adapters/mainChatEffectsAdapter';
import { createPreviewEffectsAdapter } from '@/features/conversation/adapters/previewEffectsAdapter';
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
} = vi.hoisted(() => ({
  mockEventBusEmit: vi.fn(),
  mockEmitConversationListTaskStatus: vi.fn(),
  mockFetchSuggest: vi.fn(),
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

const createMainAdapter = () =>
  createMainChatEffectsAdapter({ fetchSuggest: mockFetchSuggest });

const createPreviewAdapter = () =>
  createPreviewEffectsAdapter({ fetchSuggest: mockFetchSuggest });

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

describe('mainChatEffectsAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('无 context 的终态补丁经领域守卫入口 emitConversationListTaskStatus', () => {
    createMainAdapter().dispatch(terminalPatch);

    expect(mockEmitConversationListTaskStatus).toHaveBeenCalledWith(
      1001,
      TaskStatus.FAILED,
    );
    expect(mockEventBusEmit).not.toHaveBeenCalled();
  });

  it('带 context 的乐观「执行中」标记直接发射事件（不经终态守卫）', () => {
    createMainAdapter().dispatch(optimisticPatch);

    expect(mockEventBusEmit).toHaveBeenCalledWith(
      EVENT_TYPE.UpdateConversationListTaskStatus,
      {
        conversationId: 1001,
        agentId: 9,
        topic: '会话主题',
        taskStatus: TaskStatus.EXECUTING,
      },
    );
    expect(mockEmitConversationListTaskStatus).not.toHaveBeenCalled();
  });

  it('recent.list.refresh 发射侧栏列表刷新', () => {
    createMainAdapter().dispatch(listRefresh);

    expect(mockEventBusEmit).toHaveBeenCalledWith(
      EVENT_TYPE.RefreshConversationList,
      { conversationId: 1001, reason: 'stream-closed' },
    );
  });

  it('suggest.fetch 交给注入的建议拉取句柄', () => {
    createMainAdapter().dispatch(suggestFetch);

    expect(mockFetchSuggest).toHaveBeenCalledWith(suggestFetch.params);
    expect(mockEventBusEmit).not.toHaveBeenCalled();
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

  it('忽略乐观标记与列表刷新（隔离子集）', () => {
    createPreviewAdapter().dispatch(optimisticPatch);
    createPreviewAdapter().dispatch(listRefresh);

    expect(mockEmitConversationListTaskStatus).not.toHaveBeenCalled();
    expect(mockEventBusEmit).not.toHaveBeenCalled();
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
