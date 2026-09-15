import ConversationCacheDebugPanel from '@/components/business-component/ChatInputUnified/ConversationCacheDebugPanel';
import { DEFAULT_CONVERSATION_PAGE_CACHE_CAPACITY } from '@/features/conversation/domain/conversationPageCache';
import { conversationPageCacheManager } from '@/features/conversation/runtime/conversationPageCacheManager';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

describe('ConversationCacheDebugPanel', () => {
  afterEach(() => {
    cleanup();
    conversationPageCacheManager.invalidateAll('test-cleanup');
    conversationPageCacheManager.setCapacity(
      DEFAULT_CONVERSATION_PAGE_CACHE_CAPACITY,
    );
    localStorage.clear();
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
});
