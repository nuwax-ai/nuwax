import ConversationContextMenu from '@/components/business-component/ConversationContextMenu';
import {
  apiAgentConversationArchive,
  apiAgentConversationPin,
} from '@/services/agentConfig';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock(
  '@/components/business-component/ConversationContextMenu/index.less',
  () => ({ default: {} }),
);
vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
}));
vi.mock('@/services/agentConfig', () => ({
  apiAgentConversationPin: vi.fn().mockResolvedValue({ code: '0000' }),
  apiAgentConversationArchive: vi.fn().mockResolvedValue({ code: '0000' }),
  apiAgentConversationDelete: vi.fn(),
  apiAgentConversationUpdate: vi.fn(),
}));

const openMenu = () => {
  fireEvent.click(screen.getByRole('img', { name: 'more' }).parentElement!);
};

describe('会话菜单服务端标记', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('置顶成功后回传服务端状态，且不展示收藏', async () => {
    const onFlagChanged = vi.fn();
    render(
      <ConversationContextMenu
        conversationId={42}
        showMoreButton
        onFlagChanged={onFlagChanged}
      >
        {(moreButton) => <div>{moreButton}会话</div>}
      </ConversationContextMenu>,
    );
    openMenu();
    expect(
      screen.queryByText('PC.Components.ConversationContextMenu.favorite'),
    ).not.toBeInTheDocument();
    fireEvent.click(
      await screen.findByText('PC.Components.ConversationContextMenu.pin'),
    );

    await waitFor(() =>
      expect(apiAgentConversationPin).toHaveBeenCalledWith(42, true),
    );
    expect(onFlagChanged).toHaveBeenCalledWith('pinned', true);
  });

  it('归档失败时不回传状态', async () => {
    const onFlagChanged = vi.fn();
    vi.mocked(apiAgentConversationArchive).mockResolvedValueOnce({
      code: '1001',
    } as never);
    render(
      <ConversationContextMenu
        conversationId={42}
        showMoreButton
        onFlagChanged={onFlagChanged}
      >
        {(moreButton) => <div>{moreButton}会话</div>}
      </ConversationContextMenu>,
    );
    openMenu();
    fireEvent.click(
      await screen.findByText('PC.Components.ConversationContextMenu.archive'),
    );

    await waitFor(() =>
      expect(apiAgentConversationArchive).toHaveBeenCalledWith(42, true),
    );
    expect(onFlagChanged).not.toHaveBeenCalled();
  });
});
