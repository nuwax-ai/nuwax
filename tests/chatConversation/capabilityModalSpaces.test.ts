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

describe('能力弹窗专家/技能数据源（已接入独立列表组件）', () => {
  // 稳定引用：spaceIds 内联数组每次 render 产生新引用，触发 hook 重置
  // effect 无限循环（生产侧由 index.tsx useMemo 保证稳定）
  const TEAM_SPACE_IDS = [1, 2];

  it('专家维度：已接入 ExpertListView,弹窗数据层不注册适配器（不发起请求）', async () => {
    renderHook(() =>
      useCapabilityResources({
        resourceType: 'expert',
        source: 'team',
        category: '',
        keyword: '',
        spaceIds: TEAM_SPACE_IDS,
      }),
    );
    // 未注册适配器 → 保持空态,不发任何请求
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    expect(apiPublishedAgentList).not.toHaveBeenCalled();
  });

  it('技能维度：已接入 SkillListView,弹窗数据层不注册适配器（不发起请求）', async () => {
    renderHook(() =>
      useCapabilityResources({
        resourceType: 'skill',
        source: 'team',
        category: '',
        keyword: '',
        spaceIds: TEAM_SPACE_IDS,
      }),
    );
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    expect(apiPublishedSkillList).not.toHaveBeenCalled();
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
