/**
 * useHomeSectionData 数据壳单测。
 *
 * 重点守卫三类娇贵语义（均有历史事故/红线背景）：
 * - 初始加载契约：单栏挂载恒发、经典由视图调 initialLoad；silent 与初始 loading
 *   严格互补（有缓存才静默——破坏互补曾致空数组缓存永久卡 Spin）
 * - componentCache 跨挂载持久（vi.resetModules 每用例取新模块态，互不污染）
 * - 分页 append 按 lastId 续拉 + 回包去重
 * umi / agentConfig 走 vi.mock（仓内 vitest 不能 import umi 的既有约束）。
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ConversationInfo } from '@/types/interfaces/conversationInfo';

const apiAgentConversationListMock = vi.fn();
const handleCloseMobileMenu = vi.fn();
const historyPush = vi.fn();

/** umi mock 的可变状态：location/params 按用例改写后 rerender 生效 */
const umiState = {
  location: {
    pathname: '/home',
    search: '',
    state: null as unknown,
  },
  params: {} as Record<string, string | undefined>,
};

vi.mock('umi', () => ({
  useLocation: () => umiState.location,
  useParams: () => umiState.params,
  useModel: (name: string) =>
    name === 'layout' ? { handleCloseMobileMenu } : {},
  history: { push: historyPush },
}));

vi.mock('@/services/agentConfig', () => ({
  apiAgentConversationList: apiAgentConversationListMock,
  // conversationTaskStatusSync 传递依赖的具名导出（列表无执行中任务时不会被调）
  apiAgentConversation: vi.fn(),
}));

// 传递链（userService 等）存在模块顶层 dict() 求值，测试环境未初始化 i18n 会炸
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));

const buildConversation = (
  overrides: Record<string, unknown> = {},
): ConversationInfo =>
  ({
    id: 1,
    topic: '会话',
    modified: '2026-09-12 10:00:00',
    archived: false,
    pinned: false,
    ...overrides,
  } as unknown as ConversationInfo);

/** 每用例重置模块级 componentCache（resetModules 后动态 import 取全新模块态） */
async function freshHook() {
  vi.resetModules();
  const mod = await import('./useHomeSectionData');
  return mod.useHomeSectionData;
}

const flush = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

describe('useHomeSectionData', () => {
  beforeEach(() => {
    // mockReset 而非 clearAllMocks：Once 实现队列必须一并清空，
    // 否则失败用例的遗留夹具会被下一用例消费（跨用例污染实锤）
    apiAgentConversationListMock.mockReset();
    historyPush.mockReset();
    handleCloseMobileMenu.mockReset();
    umiState.location = {
      pathname: '/home',
      search: '',
      state: null,
    };
    umiState.params = {};
  });

  it('单栏形态挂载即初始加载：lastId=null、loading 收敛', async () => {
    apiAgentConversationListMock.mockResolvedValue({
      data: [buildConversation({ id: 1 }), buildConversation({ id: 2 })],
    });
    const useHomeSectionData = await freshHook();

    const { result } = renderHook(() =>
      useHomeSectionData({ isSidebarNavMode: true }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(apiAgentConversationListMock).toHaveBeenCalledTimes(1);
    expect(apiAgentConversationListMock).toHaveBeenCalledWith(
      expect.objectContaining({
        lastId: null,
        agentId: null,
      }),
    );
    expect(result.current.visibleConversationList.map((i) => i.id)).toEqual([
      1, 2,
    ]);
  });

  it('经典形态挂载只静默预取（不抬 loading），视图调 initialLoad 才非静默收敛', async () => {
    apiAgentConversationListMock.mockResolvedValue({
      data: [buildConversation({ id: 1 })],
    });
    const useHomeSectionData = await freshHook();

    const { result } = renderHook(() =>
      useHomeSectionData({ isSidebarNavMode: false }),
    );

    // 保留的原行为：挂载时 pathname 效应对 /home 恒发一次静默刷新
    // （经典停留项目 tab 也预取暖缓存），静默不碰 loading
    await waitFor(() =>
      expect(apiAgentConversationListMock).toHaveBeenCalledTimes(1),
    );
    expect(result.current.loading).toBe(true);

    await act(async () => {
      result.current.initialLoad();
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(apiAgentConversationListMock).toHaveBeenCalledTimes(2);
    expect(result.current.visibleConversationList.map((i) => i.id)).toEqual([
      1,
    ]);
  });

  it('缓存互补：重挂载带缓存时 initialLoad 走静默（loading 全程不抬升）', async () => {
    apiAgentConversationListMock.mockResolvedValue({
      data: [buildConversation({ id: 1 })],
    });
    const useHomeSectionData = await freshHook();

    // 第一轮挂载：无缓存 → 非静默，loading true→false 收敛；卸载写缓存
    const first = renderHook(() =>
      useHomeSectionData({ isSidebarNavMode: true }),
    );
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    first.unmount();

    // 第二轮挂载（同模块实例=componentCache 已带数据）：初始即不 loading，
    // 挂载静默刷新期间 loading 恒 false
    apiAgentConversationListMock.mockClear();
    apiAgentConversationListMock.mockResolvedValue({
      data: [buildConversation({ id: 1 })],
    });
    const second = renderHook(() =>
      useHomeSectionData({ isSidebarNavMode: true }),
    );
    expect(second.result.current.loading).toBe(false);
    await waitFor(() =>
      expect(apiAgentConversationListMock).toHaveBeenCalledTimes(1),
    );
    expect(second.result.current.loading).toBe(false);
    second.unmount();
  });

  it('分页 append：refreshList() 按上一页末条 lastId 续拉并去重回包', async () => {
    // jsdom 无容器高度 → calcPageSize 兜底 30：首页须回满 30 条 hasMore 才为 true，
    // append 才不会被分页闸门挡掉（真实行为同款：回包不足页大小即封页）
    const pageOne = Array.from({ length: 30 }, (_, i) =>
      buildConversation({ id: i + 1 }),
    );
    apiAgentConversationListMock.mockResolvedValueOnce({ data: pageOne });

    const useHomeSectionData = await freshHook();
    const { result } = renderHook(() =>
      useHomeSectionData({ isSidebarNavMode: true }),
    );
    await waitFor(() =>
      expect(result.current.visibleConversationList).toHaveLength(30),
    );

    // 第二页回包重复 id=1（翻页重复回包场景），应被去重
    apiAgentConversationListMock.mockResolvedValueOnce({
      data: [buildConversation({ id: 1 }), buildConversation({ id: 31 })],
    });
    await act(async () => {
      result.current.refreshList();
      await flush();
    });

    expect(apiAgentConversationListMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ lastId: 30 }),
    );
    expect(result.current.visibleConversationList.map((i) => i.id)).toEqual([
      ...Array.from({ length: 30 }, (_, i) => i + 1),
      31,
    ]);
  });

  it('可见列表：隐藏归档、置顶排前', async () => {
    apiAgentConversationListMock.mockResolvedValue({
      data: [
        buildConversation({ id: 1 }),
        buildConversation({ id: 2, archived: true }),
        buildConversation({ id: 3, pinned: true }),
      ],
    });
    const useHomeSectionData = await freshHook();

    const { result } = renderHook(() =>
      useHomeSectionData({ isSidebarNavMode: true }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.visibleConversationList.map((i) => i.id)).toEqual([
      3, 1,
    ]);
  });

  it('标记本地覆盖：archived 置真后立即从可见列表消失', async () => {
    apiAgentConversationListMock.mockResolvedValue({
      data: [buildConversation({ id: 1 }), buildConversation({ id: 2 })],
    });
    const useHomeSectionData = await freshHook();
    const { result } = renderHook(() =>
      useHomeSectionData({ isSidebarNavMode: true }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.handleConversationFlagChanged(1, 'archived', true);
    });
    expect(result.current.visibleConversationList.map((i) => i.id)).toEqual([
      2,
    ]);
  });

  it('resetSearchAndRefresh：清空关键词并按空 topic 整体刷新', async () => {
    apiAgentConversationListMock.mockResolvedValue({ data: [] });
    const useHomeSectionData = await freshHook();
    const { result } = renderHook(() =>
      useHomeSectionData({ isSidebarNavMode: true }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setKeyword('关键词');
    });
    await act(async () => {
      result.current.resetSearchAndRefresh();
      await flush();
    });

    expect(result.current.keyword).toBe('');
    expect(result.current.searchKeyword).toBe('');
    expect(apiAgentConversationListMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ topic: undefined, lastId: null }),
    );
  });

  it('conversation-updated 事件：本地补丁更新主题并触发静默重查', async () => {
    apiAgentConversationListMock.mockResolvedValue({
      data: [buildConversation({ id: 1, topic: '旧主题' })],
    });
    const useHomeSectionData = await freshHook();
    const { result } = renderHook(() =>
      useHomeSectionData({ isSidebarNavMode: true }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    apiAgentConversationListMock.mockClear();

    act(() => {
      window.dispatchEvent(
        new CustomEvent('conversation-updated', {
          detail: { id: 1, topic: '新主题' },
        }),
      );
    });

    expect(result.current.visibleConversationList[0].topic).toBe('新主题');
    await waitFor(() =>
      expect(apiAgentConversationListMock).toHaveBeenCalledTimes(1),
    );
  });

  it('conversation-deleted 事件：本地移除对应条目', async () => {
    apiAgentConversationListMock.mockResolvedValue({
      data: [buildConversation({ id: 1 }), buildConversation({ id: 2 })],
    });
    const useHomeSectionData = await freshHook();
    const { result } = renderHook(() =>
      useHomeSectionData({ isSidebarNavMode: true }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      window.dispatchEvent(
        new CustomEvent('conversation-deleted', { detail: { id: 1 } }),
      );
    });
    expect(result.current.visibleConversationList.map((i) => i.id)).toEqual([
      2,
    ]);
  });

  it('chatId 派生：会话详情路径提取第一段 id', async () => {
    apiAgentConversationListMock.mockResolvedValue({ data: [] });
    const useHomeSectionData = await freshHook();
    umiState.location = {
      pathname: '/home/chat/1562104/2592',
      search: '',
      state: null,
    };

    const { result } = renderHook(() =>
      useHomeSectionData({ isSidebarNavMode: true }),
    );
    expect(result.current.chatId).toBe('1562104');
  });

  it('路由回流：从 /space 切回 /home 系路径触发一次静默刷新', async () => {
    apiAgentConversationListMock.mockResolvedValue({ data: [] });
    const useHomeSectionData = await freshHook();

    const { result, rerender } = renderHook(() =>
      useHomeSectionData({ isSidebarNavMode: true }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    apiAgentConversationListMock.mockClear();

    // 先离开 /home（去空间页），再回流（进会话详情）
    act(() => {
      umiState.location = {
        pathname: '/space/1/develop',
        search: '',
        state: null,
      };
      rerender();
    });
    act(() => {
      umiState.location = {
        pathname: '/home/chat/1/2',
        search: '',
        state: null,
      };
      rerender();
    });

    await waitFor(() =>
      expect(apiAgentConversationListMock).toHaveBeenCalledTimes(1),
    );
  });
});
