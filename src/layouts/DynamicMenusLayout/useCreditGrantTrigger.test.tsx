import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  summary: vi.fn(),
  tenantConfigInfo: undefined as { enableSubscription?: number } | undefined,
}));

vi.mock('@/services/subscriptionService', () => ({
  apiGetCreditSummary: mocks.summary,
}));
vi.mock('umi', async () => {
  const React = await import('react');
  return {
    useModel: () => ({ tenantConfigInfo: mocks.tenantConfigInfo }),
    useRequest: (service: any) => {
      const run = React.useCallback(() => {
        service().then(
          () => {},
          () => {},
        );
      }, [service]);
      return { run };
    },
  };
});

import { useCreditGrantTrigger } from './useCreditGrantTrigger';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.tenantConfigInfo = { enableSubscription: 1 };
  mocks.summary.mockResolvedValue({ totalCredit: 0 });
});

describe('单栏布局积分发放触发', () => {
  it('布局挂载即请求一次积分 summary，重渲染不重复请求', () => {
    const view = renderHook(() => useCreditGrantTrigger());
    expect(mocks.summary).toHaveBeenCalledTimes(1);
    view.rerender();
    expect(mocks.summary).toHaveBeenCalledTimes(1);
  });

  it('租户关闭订阅功能时不请求', () => {
    mocks.tenantConfigInfo = { enableSubscription: 0 };
    renderHook(() => useCreditGrantTrigger());
    expect(mocks.summary).not.toHaveBeenCalled();
  });

  it('租户配置未就绪时不请求，就绪后请求一次', () => {
    mocks.tenantConfigInfo = undefined;
    const view = renderHook(() => useCreditGrantTrigger());
    expect(mocks.summary).not.toHaveBeenCalled();
    mocks.tenantConfigInfo = { enableSubscription: 1 };
    view.rerender();
    expect(mocks.summary).toHaveBeenCalledTimes(1);
    mocks.tenantConfigInfo = { enableSubscription: 1 };
    view.rerender();
    expect(mocks.summary).toHaveBeenCalledTimes(1);
  });

  it('接口失败不抛未处理异常', async () => {
    mocks.summary.mockRejectedValue(new Error('network failed'));
    renderHook(() => useCreditGrantTrigger());
    await Promise.resolve();
    expect(mocks.summary).toHaveBeenCalledTimes(1);
  });
});
