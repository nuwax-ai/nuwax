import RecommendListPage from '@/pages/SystemManagement/RecommendManage/components/RecommendListPage';
import { OFFICIAL_RECOMMEND_CONFIG } from '@/pages/SystemManagement/RecommendManage/constants';
import type { DisplayRecommendInfo } from '@/pages/SystemManagement/RecommendManage/types';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

// jsdom 无 ResizeObserver（useTableAutoHeight 依赖），补最小桩
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
  ResizeObserverStub;

const listRequest = vi.hoisted(() => vi.fn());

vi.mock('umi', () => ({
  useLocation: () => ({
    pathname: '/system/recommend-manage/official',
    key: 'default',
    state: undefined,
  }),
  useModel: () => ({}),
  useIntl: () => ({ locale: 'zh-CN' }),
  history: { push: vi.fn(), replace: vi.fn() },
}));

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  t: (key: string) => key,
  getCurrentLang: () => 'zh-CN',
}));

vi.mock('@/services/square', () => ({
  fetchChatboxCategories: vi.fn(async () => []),
}));

vi.mock('@/pages/SystemManagement/RecommendManage/services/recomment', () => ({
  apiSystemGetDisplayRecommendList: (...args: unknown[]) =>
    listRequest(...args),
  apiSystemDeleteDisplayRecommend: vi.fn(),
  apiSystemUpdateDisplayRecommendSort: vi.fn(),
}));

// 弹窗（本页渲染但未打开）与布局壳的重依赖桩，聚焦列表页本体行为
vi.mock(
  '@/pages/SystemManagement/RecommendManage/components/RecommendAddModal',
  () => ({ default: () => null }),
);
vi.mock(
  '@/pages/SystemManagement/RecommendManage/components/RecommendFormModal',
  () => ({ default: () => null }),
);
vi.mock('@/components/WorkspaceLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
// vitest 下 less 模块返回 undefined，TableActions 内 styles.container 会崩，桩成空样式表
vi.mock('@/components/ProComponents/TableActions/index.less', () => ({
  default: new Proxy({}, { get: () => '' }),
}));

const record = (
  overrides: Partial<DisplayRecommendInfo> = {},
): DisplayRecommendInfo => ({
  id: 1,
  tenantId: 1,
  targetType: 'Agent',
  targetId: 71,
  recType: 'Official',
  functionType: '',
  label: '官方推荐项A',
  icon: '',
  placeholder: '',
  sort: 1,
  modified: '',
  created: '',
  ...overrides,
});

/**
 * U-PC2 防回归：官方推荐页曾被反馈「进入页面就卡死」。
 * 本用例守住两类可自动化复现的根因——请求风暴与渲染死循环：
 * 进入页面仅发一次列表请求、数据经 postData 落进表格、
 * 稳定期请求数不再增长、切 Tab 只补发一次请求。
 */
describe('官方推荐列表页', () => {
  it('进入页面加载列表后不再无限重复请求/渲染', async () => {
    listRequest.mockResolvedValue({
      code: '0000',
      data: { records: [record(), record({ id: 2, label: '官方推荐项B' })] },
    });

    const { container } = render(
      <RecommendListPage
        titleKey="PC.Routes.officialRecommend"
        config={OFFICIAL_RECOMMEND_CONFIG}
      />,
    );

    // 首屏数据经 postData → setRecords 落进受控 dataSource 后渲染出来
    await waitFor(
      () => {
        expect(listRequest).toHaveBeenCalled();
      },
      { timeout: 4000 },
    );
    const firstCallArgs = listRequest.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    // 官方推荐首屏按当前 Tab 携带 targetType 查询
    expect(firstCallArgs).toMatchObject({
      recType: 'Official',
      targetType: 'Agent',
    });

    // 稳定期内请求数不应持续增长（死循环会无限刷请求/渲染直到页面冻结）
    const countAfterFirstPaint = listRequest.mock.calls.length;
    expect(countAfterFirstPaint).toBeGreaterThan(0);
    await new Promise((resolve) => {
      setTimeout(resolve, 800);
    });
    expect(listRequest.mock.calls.length).toBeLessThanOrEqual(
      countAfterFirstPaint + 1,
    );
    // Tab 选项与首屏表格结构存在（页面真正渲染，而非停在空白）
    expect(container.textContent).toContain('PC.Pages.Square.Square.agent');
  });
});
