/**
 * 会话页面缓存遥测拆分后的合同测试：
 * 1) 面板内容：LRU/资源/脱敏草稿摘要 + 「执行中的页面实例」分区随任务状态进出；
 * 2) 入口拆分：ConversationDebugFab 不再含缓存遥测，独立入口
 *    ConversationCacheDebugFab 点击弹出缓存面板。
 */
import ConversationCacheDebugFab from '@/components/business-component/ChatInputUnified/ConversationCacheDebugFab';
import ConversationCacheDebugPanel from '@/components/business-component/ChatInputUnified/ConversationCacheDebugPanel';
import ConversationDebugFab from '@/components/business-component/ChatInputUnified/ConversationDebugFab';
import { DEFAULT_CONVERSATION_PAGE_CACHE_CAPACITY } from '@/features/conversation/domain/conversationPageCache';
import { conversationPageCacheManager } from '@/features/conversation/runtime/conversationPageCacheManager';
import { TaskStatus } from '@/types/enums/agent';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string, ...values: (string | number)[]) =>
    values.length ? `${key}:${values.join(',')}` : key,
  t: (key: string) => key,
}));
vi.mock('@/components/ChatInputHome/index.less', () => ({
  default: new Proxy({}, { get: () => 'cls' }),
}));

describe('ConversationCacheDebugPanel', () => {
  afterEach(() => {
    cleanup();
    conversationPageCacheManager.invalidateAll('test-cleanup');
    conversationPageCacheManager.setCapacity(
      DEFAULT_CONVERSATION_PAGE_CACHE_CAPACITY,
    );
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('展示 LRU、资源与脱敏草稿摘要，不暴露草稿正文', () => {
    act(() => {
      conversationPageCacheManager.activate({
        surface: 'chat',
        conversationId: 301,
      });
      conversationPageCacheManager.update('chat:301', { view: 'terminal' });
      conversationPageCacheManager.updateResources('chat:301', {
        terminalMounted: true,
        terminalConnected: true,
      });
      conversationPageCacheManager.saveDraft('chat:301', {
        version: 1,
        text: 'secret',
        skillIds: [7],
      });
    });

    const view = render(<ConversationCacheDebugPanel />);

    expect(screen.getByText('chat:301')).toBeInTheDocument();
    expect(screen.getByText('terminal')).toBeInTheDocument();
    expect(screen.getByText('draft 6c /1s')).toBeInTheDocument();
    expect(screen.getByText('TERM:ON')).toBeInTheDocument();
    expect(screen.getByText('WS:ON')).toBeInTheDocument();
    expect(view.container).not.toHaveTextContent('secret');
  });

  it('执行中的页面实例分区随 EXECUTING 进入、终态退出', () => {
    act(() => {
      conversationPageCacheManager.activate({
        surface: 'chat',
        conversationId: 501,
      });
      conversationPageCacheManager.activate({
        surface: 'chat',
        conversationId: 502,
      });
    });

    const view = render(<ConversationCacheDebugPanel />);
    expect(screen.getByText('No executing instances')).toBeInTheDocument();

    act(() => {
      conversationPageCacheManager.markConversationTaskStatus(
        501,
        TaskStatus.EXECUTING,
      );
    });
    expect(screen.getAllByText('chat:501').length).toBeGreaterThanOrEqual(1);
    // 执行中分区徽标 + LRU 列表标记，两处均出现
    expect(screen.getAllByText('EXEC').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('run 0s')).toBeInTheDocument();
    // 执行中计数指标
    expect(
      view.container.querySelector('[data-testid="conversation-cache-debug"]')
        ?.textContent,
    ).toContain('executing');

    act(() => {
      conversationPageCacheManager.markConversationTaskStatus(
        501,
        TaskStatus.COMPLETE,
      );
    });
    expect(screen.getByText('No executing instances')).toBeInTheDocument();
  });
});

describe('缓存遥测入口拆分', () => {
  afterEach(() => {
    cleanup();
    conversationPageCacheManager.invalidateAll('test-cleanup');
    localStorage.clear();
  });

  it('会话调试面板不再包含缓存遥测', async () => {
    const user = userEvent.setup();
    render(<ConversationDebugFab conversationId={1} />);
    await user.click(screen.getByTestId('conversation-debug-entry'));
    expect(screen.getByTestId('conversation-debug-panel')).toBeInTheDocument();
    expect(
      screen.queryByTestId('conversation-cache-debug'),
    ).not.toBeInTheDocument();
  });

  it('独立缓存入口点击弹出缓存遥测面板', async () => {
    act(() => {
      conversationPageCacheManager.activate({
        surface: 'chat',
        conversationId: 601,
      });
    });
    const user = userEvent.setup();
    render(<ConversationCacheDebugFab />);
    const entry = screen.getByTestId('conversation-cache-entry');
    expect(entry.tagName).toBe('BUTTON');
    expect(entry.getAttribute('aria-label')).toBe(
      'PC.Components.ChatInputHome.conversationCacheDebugEntry',
    );
    await user.click(entry);
    expect(screen.getByTestId('conversation-cache-debug')).toBeInTheDocument();
    expect(screen.getByText('chat:601')).toBeInTheDocument();
  });
});
