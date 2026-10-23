/**
 * useResourceCategories 单元测试（U-BH4：系统广场维度「其他」分类固定置底）
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUseRequest = vi.fn();
vi.mock('umi', () => ({
  useRequest: (...args: unknown[]) => mockUseRequest(...args),
}));

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => `dict:${key}`,
}));

const mockCategoryList = vi.fn();
vi.mock('@/services/square', () => ({
  apiPublishedCategoryList: (...args: unknown[]) => mockCategoryList(...args),
}));

const mockSpaceList = vi.fn();
vi.mock('@/services/workspace', () => ({
  apiSpaceList: (...args: unknown[]) => mockSpaceList(...args),
}));

import useResourceCategories from './useResourceCategories';

/** 模拟 umi useRequest：同一 fetcher 引用只执行一次（真实实现不随重渲染重发），结果走 onSuccess/onError */
function installUseRequest() {
  const ranFetchers = new Set<() => Promise<unknown>>();
  mockUseRequest.mockImplementation(
    (fetcher: () => Promise<unknown>, options: Record<string, unknown>) => {
      if (!ranFetchers.has(fetcher)) {
        ranFetchers.add(fetcher);
        void (fetcher() as Promise<unknown>)
          .then((list) => (options.onSuccess as (l: unknown) => void)(list))
          .catch(() => (options.onError as () => void)());
      }
      return {};
    },
  );
}

function agentRoot(children: Array<{ key: string; label: string }>) {
  return { data: [{ type: 'Agent', key: 'Agent', children }] };
}

beforeEach(() => {
  mockUseRequest.mockReset();
  mockCategoryList.mockReset();
  mockSpaceList.mockReset();
  installUseRequest();
});

describe('useResourceCategories（U-BH4 其他置底）', () => {
  it('系统广场维度：「其他」在接口下发中间时被置底，其余保持原序', async () => {
    mockCategoryList.mockResolvedValue(
      agentRoot([
        { key: 'business', label: '商业服务' },
        { key: 'other', label: '其他' },
        { key: 'writing', label: '文本创作' },
      ]),
    );
    const { result } = renderHook(() =>
      useResourceCategories('expert', 'system'),
    );
    await waitFor(() => expect(result.current.length).toBe(4));
    expect(result.current.map((c) => c.label)).toEqual([
      'dict:PC.Pages.ExpertSkillConnector.tabAll',
      '商业服务',
      '文本创作',
      '其他',
    ]);
  });

  it('key 为 Other（大小写/空白归一）同样置底', async () => {
    mockCategoryList.mockResolvedValue({
      data: [
        {
          type: 'Skill',
          key: 'Skill',
          children: [
            { key: 'Other ', label: 'Misc' },
            { key: 'edu', label: '教育' },
          ],
        },
      ],
    });
    const { result } = renderHook(() =>
      useResourceCategories('skill', 'system'),
    );
    await waitFor(() => expect(result.current.length).toBe(3));
    expect(result.current.map((c) => c.key)).toEqual(['', 'edu', 'Other ']);
  });

  it('无「其他」分类时顺序与接口下发一致', async () => {
    mockCategoryList.mockResolvedValue(
      agentRoot([
        { key: 'a', label: '代码助手' },
        { key: 'b', label: '教育' },
      ]),
    );
    const { result } = renderHook(() =>
      useResourceCategories('expert', 'system'),
    );
    await waitFor(() => expect(result.current.length).toBe(3));
    expect(result.current.map((c) => c.label)).toEqual([
      'dict:PC.Pages.ExpertSkillConnector.tabAll',
      '代码助手',
      '教育',
    ]);
  });

  it('团队空间维度：空间名即使叫「其他」也不重排（置底仅适用内容分类）', async () => {
    mockSpaceList.mockResolvedValue({
      data: [
        { id: 1, name: '其他空间' },
        { id: 2, name: '公司团队' },
      ],
    });
    const { result } = renderHook(() => useResourceCategories('skill', 'team'));
    await waitFor(() => expect(result.current.length).toBe(3));
    expect(result.current.map((c) => c.label)).toEqual([
      'dict:PC.Pages.ExpertSkillConnector.tabAll',
      '其他空间',
      '公司团队',
    ]);
  });

  it('接口失败时降级为仅「全部」', async () => {
    mockCategoryList.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() =>
      useResourceCategories('expert', 'system'),
    );
    // onError 触发后仍只剩「全部」（失败降级不引入其他分类）
    await waitFor(() => expect(mockCategoryList).toHaveBeenCalled());
    await act(async () => {});
    expect(result.current.map((c) => c.key)).toEqual(['']);
    expect(result.current.length).toBe(1);
  });
});
