import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useInitProjectMetadata } from './useInitProjectMetadata';

const { mockFetchGeneratedMetadata, mockUseLocation, mockHistory } = vi.hoisted(
  () => ({
    mockFetchGeneratedMetadata: vi.fn(),
    mockUseLocation: vi.fn(),
    mockHistory: {
      action: 'PUSH',
      location: { state: undefined as unknown },
    },
  }),
);

vi.mock('umi', () => ({
  history: mockHistory,
  useLocation: () => mockUseLocation(),
}));

vi.mock('@/utils/generatedMetadata', () => ({
  fetchGeneratedMetadata: mockFetchGeneratedMetadata,
}));

vi.mock('@/utils/applyGeneratedIcon', () => ({
  applyGeneratedIcon: vi.fn(),
}));

describe('useInitProjectMetadata 常驻页面路由隔离', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHistory.action = 'PUSH';
    mockHistory.location.state = { message: '当前 B 页面 prompt' };
    mockUseLocation.mockReturnValue({
      state: { message: '当前 B 页面 prompt' },
    });
    mockFetchGeneratedMetadata.mockResolvedValue({ name: '生成名称' });
  });

  it('隐藏 A 不初始化；激活后只使用 A 固定的入页 prompt', async () => {
    const routeA = {
      state: { message: 'A 入页 prompt' },
      action: 'PUSH' as const,
    };
    const routeB = {
      state: { message: 'B 入页 prompt' },
      action: 'PUSH' as const,
    };
    const applyA = vi.fn().mockResolvedValue(undefined);
    const applyB = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ activeA, activeB }) => {
        useInitProjectMetadata({
          targetType: AgentComponentTypeEnum.Agent,
          targetId: 101,
          routeSnapshot: routeA,
          ready: activeA,
          applyMetadata: applyA,
        });
        useInitProjectMetadata({
          targetType: AgentComponentTypeEnum.UserApp,
          targetId: 202,
          routeSnapshot: routeB,
          ready: activeB,
          applyMetadata: applyB,
        });
      },
      { initialProps: { activeA: false, activeB: true } },
    );

    await waitFor(() => expect(applyB).toHaveBeenCalledTimes(1));
    expect(mockFetchGeneratedMetadata).toHaveBeenCalledWith('B 入页 prompt');
    expect(applyA).not.toHaveBeenCalled();

    rerender({ activeA: true, activeB: false });
    await waitFor(() => expect(applyA).toHaveBeenCalledTimes(1));
    expect(
      mockFetchGeneratedMetadata.mock.calls.map(([prompt]) => prompt),
    ).toEqual(['B 入页 prompt', 'A 入页 prompt']);
  });

  it('快照 state 为空时不回退读取当前页面 prompt，且遵守固定 action', () => {
    const applyMetadata = vi.fn().mockResolvedValue(undefined);
    renderHook(() => {
      useInitProjectMetadata({
        targetType: AgentComponentTypeEnum.Agent,
        targetId: 101,
        routeSnapshot: { state: undefined, action: 'PUSH' },
        applyMetadata,
      });
      useInitProjectMetadata({
        targetType: AgentComponentTypeEnum.Agent,
        targetId: 102,
        routeSnapshot: {
          state: { message: '不可执行' },
          action: 'POP',
        },
        applyMetadata,
      });
    });

    expect(mockFetchGeneratedMetadata).not.toHaveBeenCalled();
    expect(applyMetadata).not.toHaveBeenCalled();
  });

  it('普通页面不传快照时沿用当前路由逻辑', async () => {
    const applyMetadata = vi.fn().mockResolvedValue(undefined);
    renderHook(() =>
      useInitProjectMetadata({
        targetType: AgentComponentTypeEnum.Agent,
        targetId: 101,
        applyMetadata,
      }),
    );

    await waitFor(() => expect(applyMetadata).toHaveBeenCalledTimes(1));
    expect(mockFetchGeneratedMetadata).toHaveBeenCalledWith(
      '当前 B 页面 prompt',
    );
  });
});
