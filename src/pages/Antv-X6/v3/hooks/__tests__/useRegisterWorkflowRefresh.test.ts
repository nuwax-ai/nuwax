import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useRegisterWorkflowRefresh } from '../useRegisterWorkflowRefresh';

describe('useRegisterWorkflowRefresh', () => {
  it('挂载时将 refreshGraphData 注册给 onRefreshReady', () => {
    const refreshGraphData = vi.fn().mockResolvedValue(undefined);
    const onRefreshReady = vi.fn();

    renderHook(() =>
      useRegisterWorkflowRefresh(refreshGraphData, onRefreshReady),
    );

    expect(onRefreshReady).toHaveBeenCalledWith(refreshGraphData);
  });

  it('未提供 onRefreshReady 时不报错', () => {
    const refreshGraphData = vi.fn().mockResolvedValue(undefined);

    expect(() =>
      renderHook(() => useRegisterWorkflowRefresh(refreshGraphData)),
    ).not.toThrow();
  });
});
