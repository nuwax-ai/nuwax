import ConversationContextMenu from '@/components/business-component/ConversationContextMenu';
import {
  apiAgentConversationArchive,
  apiAgentConversationCollect,
  apiAgentConversationPin,
  apiAgentConversationUnCollect,
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
// ⋯ 图标已换 SvgIcon（icons-common-more，2026-09-12）：其 less 导入在测试环境
// 为 undefined，按组件边界 mock 成同构 span（role/aria-label 与真实渲染对齐）
vi.mock('@/components/base/SvgIcon', () => ({
  default: ({ name }: { name: string }) => (
    <span role="img" aria-label={name} />
  ),
}));
vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
}));
vi.mock('@/services/agentConfig', () => ({
  apiAgentConversationPin: vi.fn().mockResolvedValue({ code: '0000' }),
  apiAgentConversationArchive: vi.fn().mockResolvedValue({ code: '0000' }),
  apiAgentConversationCollect: vi.fn().mockResolvedValue({ code: '0000' }),
  apiAgentConversationUnCollect: vi.fn().mockResolvedValue({ code: '0000' }),
  apiAgentConversationDelete: vi.fn(),
  apiAgentConversationUpdate: vi.fn(),
}));

const openMenu = () => {
  // ⋯ 兜底按钮图标 = SvgIcon icons-common-more（aria-label 即图标名）
  fireEvent.click(
    screen.getByRole('img', { name: 'icons-common-more' }).parentElement!,
  );
};

describe('会话菜单服务端标记', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('置顶成功后回传服务端状态', async () => {
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
    fireEvent.click(
      await screen.findByText('PC.Components.ConversationContextMenu.pin'),
    );

    await waitFor(() =>
      expect(apiAgentConversationPin).toHaveBeenCalledWith(42, true),
    );
    expect(onFlagChanged).toHaveBeenCalledWith('pinned', true);
  });

  it('收藏调 collect 接口，成功后回传 true（2026-09-13 后端化）', async () => {
    const onCollectedChanged = vi.fn();
    render(
      <ConversationContextMenu
        conversationId={42}
        showMoreButton
        onCollectedChanged={onCollectedChanged}
      >
        {(moreButton) => <div>{moreButton}会话</div>}
      </ConversationContextMenu>,
    );
    openMenu();
    expect(
      screen.getByText('PC.Components.ConversationContextMenu.favorite'),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByText('PC.Components.ConversationContextMenu.favorite'),
    );

    await waitFor(() =>
      expect(apiAgentConversationCollect).toHaveBeenCalledWith(42),
    );
    expect(apiAgentConversationUnCollect).not.toHaveBeenCalled();
    await waitFor(() => expect(onCollectedChanged).toHaveBeenCalledWith(true));
  });

  it('已收藏状态展示取消收藏项，取消调 unCollect 并回传 false', async () => {
    const onCollectedChanged = vi.fn();
    render(
      <ConversationContextMenu
        conversationId={42}
        collected
        showMoreButton
        onCollectedChanged={onCollectedChanged}
      >
        {(moreButton) => <div>{moreButton}会话</div>}
      </ConversationContextMenu>,
    );
    openMenu();
    fireEvent.click(
      await screen.findByText(
        'PC.Components.ConversationContextMenu.unfavorite',
      ),
    );

    await waitFor(() =>
      expect(apiAgentConversationUnCollect).toHaveBeenCalledWith(42),
    );
    expect(apiAgentConversationCollect).not.toHaveBeenCalled();
    await waitFor(() => expect(onCollectedChanged).toHaveBeenCalledWith(false));
  });

  it('收藏失败时不回传状态', async () => {
    const onCollectedChanged = vi.fn();
    vi.mocked(apiAgentConversationCollect).mockResolvedValueOnce({
      code: '1001',
    } as never);
    render(
      <ConversationContextMenu
        conversationId={42}
        showMoreButton
        onCollectedChanged={onCollectedChanged}
      >
        {(moreButton) => <div>{moreButton}会话</div>}
      </ConversationContextMenu>,
    );
    openMenu();
    fireEvent.click(
      await screen.findByText('PC.Components.ConversationContextMenu.favorite'),
    );

    await waitFor(() =>
      expect(apiAgentConversationCollect).toHaveBeenCalledWith(42),
    );
    expect(onCollectedChanged).not.toHaveBeenCalled();
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
