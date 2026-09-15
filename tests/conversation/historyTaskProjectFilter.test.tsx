/**
 * 历史会话页「任务」tab 项目会话过滤（2026-09-14 后端 projectFilter 上线）：
 * 有「项目」tab 承接时（excludeProjectConversations），
 * 全部/已归档视图传 projectFilter=exclude 排除项目会话；
 * 已收藏视图不传（收藏是跨归档/跨项目的个人视图，收藏的项目会话仅在此可见）；
 * 未开启时（无项目 tab 的入口，如 OpenApp 应用侧栏）一律不传，保持全量。
 */
import ConversationList from '@/components/business-component/HistoryConversationList/ConversationList';
import { apiAgentConversationList } from '@/services/agentConfig';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock(
  '@/components/business-component/HistoryConversationList/ConversationList/index.less',
  () => ({ default: {} }),
);
// 只验证列表请求参数，右键菜单整体浅 mock（隔断其 services 依赖链）
vi.mock('@/components/business-component/ConversationContextMenu', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
}));
vi.mock('@/services/conversationFavoriteMigration', () => ({
  migrateLocalConversationFavorites: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/services/agentConfig', () => ({
  apiAgentConversationList: vi.fn(),
}));

const listMock = vi.mocked(apiAgentConversationList);

const buildConversation = (): ConversationInfo =>
  ({
    id: 1,
    topic: '会话A',
    agentId: 5,
    pinned: false,
    archived: false,
    collected: false,
    modified: '2026-09-14 10:00:00',
    summary: '摘要',
  } as ConversationInfo);

const pageOf = (records: ConversationInfo[]) => ({
  code: '0000',
  success: true,
  data: records,
});

beforeEach(() => {
  listMock.mockResolvedValue(pageOf([buildConversation({ id: 1 })]));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('历史会话页「任务」tab projectFilter 口径', () => {
  it('未开启排除（无项目 tab 入口）：首拉不传 projectFilter，保持全量', async () => {
    render(<ConversationList />);
    await waitFor(() => expect(listMock).toHaveBeenCalled());
    expect(listMock.mock.calls[0][0].projectFilter).toBeUndefined();
  });

  it('开启排除：全部视图首拉 projectFilter=exclude（项目会话由「项目」tab 承接）', async () => {
    render(<ConversationList excludeProjectConversations />);
    await waitFor(() => expect(listMock).toHaveBeenCalled());
    expect(listMock.mock.calls[0][0].projectFilter).toBe('exclude');
    expect(listMock.mock.calls[0][0].archivedFilter).toBe('exclude');
  });

  it('开启排除：已收藏视图不排除（跨项目个人视图），collectedFilter=only', async () => {
    render(<ConversationList excludeProjectConversations />);
    await waitFor(() => expect(listMock).toHaveBeenCalled());
    fireEvent.click(
      screen.getByRole('button', {
        name: 'PC.Components.HistoryConversationList.collectedTab',
      }),
    );
    await waitFor(() => expect(listMock.mock.calls.length).toBe(2));
    expect(listMock.mock.lastCall![0].projectFilter).toBeUndefined();
    expect(listMock.mock.lastCall![0].collectedFilter).toBe('only');
    // 收藏跨归档：归档口径放全量
    expect(listMock.mock.lastCall![0].archivedFilter).toBe('all');
  });

  it('开启排除：已归档视图仍排除项目会话，archivedFilter=only', async () => {
    render(<ConversationList excludeProjectConversations />);
    await waitFor(() => expect(listMock).toHaveBeenCalled());
    fireEvent.click(
      screen.getByRole('button', {
        name: 'PC.Components.HistoryConversationList.archivedTab',
      }),
    );
    await waitFor(() => expect(listMock.mock.calls.length).toBe(2));
    expect(listMock.mock.lastCall![0].projectFilter).toBe('exclude');
    expect(listMock.mock.lastCall![0].archivedFilter).toBe('only');
  });
});
