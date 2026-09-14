/**
 * 能力弹窗空间维度排序契约测试：
 * - 个人空间排最前（SpaceTypeEnum.Personal 判定，2026-09-11 用户要求）；
 * - 专家/技能团队维度首位为"全部"页签（spaceIds 聚合口径）；
 * - 四维度列表已全部接入独立组件（SkillListView / ExpertListView /
 *   ConnectorListView / KnowledgeListView），数据层契约由各组件测试承接。
 * hooks 依赖 services（umi request），vitest 环境全部 mock。
 */
import useCapabilityCategories from '@/components/ChatInputHome/CapabilityModal/hooks/useCapabilityCategories';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiSpaceList = vi.hoisted(() => vi.fn());

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  t: (key: string) => key,
}));

vi.mock('@/services/workspace', () => ({
  apiSpaceList,
}));

// useCapabilityCategories 仍引用 square 的分类接口（umi request）,需 mock
vi.mock('@/services/square', () => ({
  apiPublishedCategoryList: vi.fn(),
  apiPublishedAgentList: vi.fn(),
  apiPublishedSkillList: vi.fn(),
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
