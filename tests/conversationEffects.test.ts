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

const { mockEventBusEmit, mockEmitConversationListTaskStatus } = vi.hoisted(
  () => ({
    mockEventBusEmit: vi.fn(),
    mockEmitConversationListTaskStatus: vi.fn(),
  }),
);

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
});

describe('mainChatEffectsAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('无 context 的终态补丁经领域守卫入口 emitConversationListTaskStatus', () => {
    createMainChatEffectsAdapter().dispatch(terminalPatch);

    expect(mockEmitConversationListTaskStatus).toHaveBeenCalledWith(
      1001,
      TaskStatus.FAILED,
    );
    expect(mockEventBusEmit).not.toHaveBeenCalled();
  });

  it('带 context 的乐观「执行中」标记直接发射事件（不经终态守卫）', () => {
    createMainChatEffectsAdapter().dispatch(optimisticPatch);

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
    createMainChatEffectsAdapter().dispatch(listRefresh);

    expect(mockEventBusEmit).toHaveBeenCalledWith(
      EVENT_TYPE.RefreshConversationList,
      { conversationId: 1001, reason: 'stream-closed' },
    );
  });
});

describe('previewEffectsAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('执行无 context 的终态补丁', () => {
    createPreviewEffectsAdapter().dispatch(terminalPatch);

    expect(mockEmitConversationListTaskStatus).toHaveBeenCalledWith(
      1001,
      TaskStatus.FAILED,
    );
    expect(mockEventBusEmit).not.toHaveBeenCalled();
  });

  it('忽略乐观标记与列表刷新（隔离子集）', () => {
    createPreviewEffectsAdapter().dispatch(optimisticPatch);
    createPreviewEffectsAdapter().dispatch(listRefresh);

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
