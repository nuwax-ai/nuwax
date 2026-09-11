/**
 * 能力弹窗空间维度排序契约测试：
 * - 个人空间排最前（SpaceTypeEnum.Personal 判定，2026-09-11 用户要求）；
 * - 专家维度团队维度首位为"全部"页签（经 spaceIds 聚合全部空间）；
 * - 专家团队维度数据源 = /api/published/agent/list（spaceIds 参数），
 *   不再走空间智能体配置接口。
 * hooks 依赖 services（umi request），vitest 环境全部 mock。
 */
import useCapabilityCategories from '@/components/ChatInputHome/CapabilityModal/hooks/useCapabilityCategories';
import useCapabilityResources from '@/components/ChatInputHome/CapabilityModal/hooks/useCapabilityResources';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiSpaceList = vi.hoisted(() => vi.fn());
const apiPublishedAgentList = vi.hoisted(() => vi.fn());
const apiPublishedSkillList = vi.hoisted(() => vi.fn());
const apiRepoSpaceTree = vi.hoisted(() => vi.fn());

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  t: (key: string) => key,
}));

vi.mock('@/services/workspace', () => ({
  apiSpaceList,
}));

vi.mock('@/services/square', () => ({
  apiPublishedAgentList,
  apiPublishedSkillList,
  apiPublishedCategoryList: vi.fn(),
}));

vi.mock('@/services/library', () => ({
  apiSkillList: vi.fn(),
}));

vi.mock('@/services/repo', () => ({
  apiRepoSpaceTree,
}));

vi.mock('@/services/systemManage', () => ({
  apiConnectorProviderPageList: vi.fn(),
  apiSystemConnectorProviderList: vi.fn(),
}));

const space = (id: number, name: string, type: string): SpaceInfo =>
  ({ id, name, type } as unknown as SpaceInfo);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('能力弹窗团队空间维度排序（个人空间优先）', () => {
  it('资料库维度：个人空间排最前、无"全部"页签，默认选中 = 首个分类', async () => {
    apiSpaceList.mockResolvedValue({
      data: [
        space(2, '测试空间', 'Team'),
        space(1, '个人空间', 'Personal'),
        space(3, '班级空间', 'Class'),
      ],
    });
    const { result } = renderHook(() =>
      useCapabilityCategories('knowledge', 'team'),
    );
    await waitFor(() => expect(result.current.length).toBe(3));
    expect(result.current.map((item) => item.label)).toEqual([
      '个人空间',
      '测试空间',
      '班级空间',
    ]);
    // 上层默认选中逻辑取 categories[0]（见 index.tsx 兜底 effect）
    expect(result.current[0].key).toBe('1');
  });

  it('专家维度：首位为"全部"页签，其后个人空间优先', async () => {
    apiSpaceList.mockResolvedValue({
      data: [space(2, '测试空间', 'Team'), space(1, '个人空间', 'Personal')],
    });
    const { result } = renderHook(() =>
      useCapabilityCategories('expert', 'team'),
    );
    await waitFor(() => expect(result.current.length).toBe(3));
    expect(result.current).toEqual([
      { key: '', label: 'PC.Components.CapabilityModal.tabAll' },
      { key: '1', label: '个人空间' },
      { key: '2', label: '测试空间' },
    ]);
  });

  it('技能维度同样首位"全部"页签（个人空间优先）', async () => {
    apiSpaceList.mockResolvedValue({
      data: [space(2, '测试空间', 'Team'), space(1, '个人空间', 'Personal')],
    });
    const { result } = renderHook(() =>
      useCapabilityCategories('skill', 'team'),
    );
    await waitFor(() => expect(result.current.length).toBe(3));
    expect(result.current).toEqual([
      { key: '', label: 'PC.Components.CapabilityModal.tabAll' },
      { key: '1', label: '个人空间' },
      { key: '2', label: '测试空间' },
    ]);
  });

  it('无个人空间时保持接口顺序不崩溃', async () => {
    apiSpaceList.mockResolvedValue({
      data: [space(5, '团队A', 'Team'), space(6, '团队B', 'Team')],
    });
    const { result } = renderHook(() =>
      useCapabilityCategories('knowledge', 'team'),
    );
    await waitFor(() => expect(result.current.length).toBe(2));
    expect(result.current.map((item) => item.label)).toEqual([
      '团队A',
      '团队B',
    ]);
  });
});

describe('能力弹窗专家数据源（/api/published/agent/list，对齐广场两参考页）', () => {
  const page = (records: unknown[], pages = 1) => ({
    code: '0000',
    data: { records, current: 1, pages, total: records.length },
  });
  // 稳定引用：spaceIds 数组内联会在每次 render 产生新引用，触发 hook
  // 重置 effect 无限循环（生产侧由 index.tsx useMemo 保证稳定）
  const ALL_SPACE_IDS = [1, 2];
  const SINGLE_SPACE_IDS = [2];
  const SKILL_ALL_SPACE_IDS = [1, 2];
  const SKILL_SINGLE_SPACE_IDS = [2];

  it('团队·"全部"页签：category=Agent + justReturnSpaceData + spaceIds 聚合，条目 source=team', async () => {
    apiPublishedAgentList.mockResolvedValue(
      page([
        {
          id: 11,
          targetId: 2503,
          name: '智慧校园助手',
          description: 'd',
          icon: 'i',
          paymentRequired: true,
          subscribed: false,
          official: true,
          collect: true,
          publishUser: {
            userId: 9,
            userName: 'user1788748511',
            nickName: '',
            avatar: 'https://example.com/a.png',
          },
          statistics: { userCount: 5, convCount: 16, collectCount: 1 },
        },
      ]),
    );
    const { result } = renderHook(() =>
      useCapabilityResources({
        resourceType: 'expert',
        source: 'team',
        category: '',
        keyword: '',
        spaceIds: ALL_SPACE_IDS,
      }),
    );
    await waitFor(() => expect(result.current.list.length).toBe(1));
    // 空间广场口径（/space/:id/space-square?activeKey=Agent）
    expect(apiPublishedAgentList).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'Agent',
        justReturnSpaceData: true,
        spaceIds: [1, 2],
      }),
    );
    const item = result.current.list[0];
    expect(item.source).toBe('team');
    expect(item.key).toBe('expert:team:11');
    expect(item.targetId).toBe(2503);
    expect(item.paymentRequired).toBe(true);
    // 广场卡同款信息：官方/收藏态/统计（用户数/会话数/收藏数）
    expect(item.official).toBe(true);
    expect(item.collect).toBe(true);
    expect(item.userCount).toBe(5);
    expect(item.convCount).toBe(16);
    expect(item.collectCount).toBe(1);
    // 发布者（卡片名称下方「头像+人物名」）：昵称优先，空昵称回退用户名
    expect(item.publisherName).toBe('user1788748511');
    expect(item.publisherAvatar).toBe('https://example.com/a.png');
  });

  it('团队·具体空间页签：单空间走 spaceId 口径（spaceIds 不下发），kw 透传', async () => {
    apiPublishedAgentList.mockResolvedValue(page([]));
    renderHook(() =>
      useCapabilityResources({
        resourceType: 'expert',
        source: 'team',
        category: '2',
        keyword: '智慧',
        spaceIds: SINGLE_SPACE_IDS,
      }),
    );
    await waitFor(() => expect(apiPublishedAgentList).toHaveBeenCalled());
    const params = apiPublishedAgentList.mock.calls[0][0];
    expect(params).toEqual(
      expect.objectContaining({ spaceId: 2, kw: '智慧', category: 'Agent' }),
    );
    expect(params.spaceIds).toBeUndefined();
  });

  it('系统广场：与 /square?cate_type=Agent 默认口径一致（targetType/targetSubType，不带 official）', async () => {
    apiPublishedAgentList.mockResolvedValue(page([]));
    renderHook(() =>
      useCapabilityResources({
        resourceType: 'expert',
        source: 'system',
        category: '',
        keyword: '',
      }),
    );
    await waitFor(() => expect(apiPublishedAgentList).toHaveBeenCalled());
    const params = apiPublishedAgentList.mock.calls[0][0];
    expect(params).toEqual(
      expect.objectContaining({
        targetType: 'Agent',
        targetSubType: 'ChatBot',
      }),
    );
    expect(params.official).toBeUndefined();
    expect(params.justReturnSpaceData).toBeUndefined();
  });

  it('技能·团队维度：与空间广场 activeKey=Skill 同口径（category=Skill + justReturnSpaceData），全部页签经 spaceIds 聚合', async () => {
    apiPublishedSkillList.mockResolvedValue(page([]));
    renderHook(() =>
      useCapabilityResources({
        resourceType: 'skill',
        source: 'team',
        category: '',
        keyword: '',
        spaceIds: SKILL_ALL_SPACE_IDS,
      }),
    );
    await waitFor(() => expect(apiPublishedSkillList).toHaveBeenCalled());
    expect(apiPublishedSkillList).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'Skill',
        justReturnSpaceData: true,
        spaceIds: [1, 2],
      }),
    );
  });

  it('技能·具体空间页签：单空间走 spaceId 口径', async () => {
    apiPublishedSkillList.mockResolvedValue(page([]));
    renderHook(() =>
      useCapabilityResources({
        resourceType: 'skill',
        source: 'team',
        category: '2',
        keyword: '',
        spaceIds: SKILL_SINGLE_SPACE_IDS,
      }),
    );
    await waitFor(() => expect(apiPublishedSkillList).toHaveBeenCalled());
    const params = apiPublishedSkillList.mock.calls[0][0];
    expect(params).toEqual(expect.objectContaining({ spaceId: 2 }));
    expect(params.spaceIds).toBeUndefined();
  });
});

describe('能力弹窗资料库数据源（repo 树平铺 + 创建人映射）', () => {
  it('团队维度：先序平铺树节点，creatorName/creatorAvatar 映射为创建人（与其他卡同款展示）', async () => {
    apiRepoSpaceTree.mockResolvedValue({
      code: '0000',
      data: [
        {
          page: {
            id: 7,
            title: '使用手册',
            slugId: 's-7',
            sourceExt: 'md',
            creatorId: 3,
            creatorName: '张三',
            creatorAvatar: 'https://example.com/u3.png',
          },
          children: [{ page: { id: 8, title: '子文档', slugId: 's-8' } }],
        },
      ],
    });
    const { result } = renderHook(() =>
      useCapabilityResources({
        resourceType: 'knowledge',
        source: 'team',
        category: '1',
        keyword: '',
        spaceId: 1,
      }),
    );
    await waitFor(() => expect(result.current.list.length).toBe(2));
    expect(apiRepoSpaceTree).toHaveBeenCalledWith(1);
    expect(result.current.list[0]).toMatchObject({
      key: 'knowledge:team:7',
      name: '使用手册',
      fileType: 'MD',
      publisherName: '张三',
      publisherAvatar: 'https://example.com/u3.png',
    });
    // 后端未返回创建人的节点（如历史数据）不展示创建人，不阻断平铺
    expect(result.current.list[1]).toMatchObject({
      key: 'knowledge:team:8',
      name: '子文档',
      publisherName: undefined,
    });
  });
});
