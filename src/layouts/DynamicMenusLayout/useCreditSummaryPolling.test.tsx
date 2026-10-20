import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  summary: vi.fn(),
  run: vi.fn(),
  cancel: vi.fn(),
  emit: vi.fn(),
  options: undefined as any,
  tenantConfigInfo: undefined as { enableSubscription?: number } | undefined,
  hostVisible: true,
  docHidden: false,
  hostListener: undefined as undefined | (() => void),
}));

vi.mock('@/services/subscriptionService', () => ({
  apiGetCreditSummary: mocks.summary,
}));
vi.mock('@/services/hostVisibility', () => ({
  getHostVisibility: () => mocks.hostVisible,
  subscribeHostVisibility: (listener: () => void) => {
    mocks.hostListener = listener;
    return () => {
      mocks.hostListener = undefined;
    };
  },
}));
vi.mock('@/utils/eventBus', () => ({ default: { emit: mocks.emit } }));
vi.mock('umi', () => ({
  useModel: () => ({ tenantConfigInfo: mocks.tenantConfigInfo }),
  useRequest: (_service: unknown, options: unknown) => {
    mocks.options = options;
    return { run: mocks.run, cancel: mocks.cancel };
  },
}));

import { EVENT_TYPE } from '@/constants/event.constants';
import { useCreditSummaryPolling } from './useCreditSummaryPolling';

const setDocumentHidden = (hidden: boolean) => {
  mocks.docHidden = hidden;
  document.dispatchEvent(new Event('visibilitychange'));
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.tenantConfigInfo = { enableSubscription: 1 };
  mocks.hostVisible = true;
  mocks.docHidden = false;
  mocks.hostListener = undefined;
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    get: () => mocks.docHidden,
  });
});
afterEach(() => {
  delete (document as any).hidden;
});

describe('积分 summary 全局轮询', () => {
  it('按 60 秒间隔配置标准轮询，挂载即请求一次，重渲染不重复请求', () => {
    const view = renderHook(() => useCreditSummaryPolling());
    expect(mocks.options.manual).toBe(true);
    expect(mocks.options.pollingInterval).toBe(60000);
    expect(mocks.run).toHaveBeenCalledTimes(1);
    view.rerender();
    expect(mocks.run).toHaveBeenCalledTimes(1);
  });

  it('租户关闭订阅功能时不轮询', () => {
    mocks.tenantConfigInfo = { enableSubscription: 0 };
    renderHook(() => useCreditSummaryPolling());
    expect(mocks.run).not.toHaveBeenCalled();
  });

  it('租户配置未就绪时不轮询，就绪后开始轮询一次', () => {
    mocks.tenantConfigInfo = undefined;
    const view = renderHook(() => useCreditSummaryPolling());
    expect(mocks.run).not.toHaveBeenCalled();
    mocks.tenantConfigInfo = { enableSubscription: 1 };
    view.rerender();
    expect(mocks.run).toHaveBeenCalledTimes(1);
    mocks.tenantConfigInfo = { enableSubscription: 1 };
    view.rerender();
    expect(mocks.run).toHaveBeenCalledTimes(1);
  });

  it('页面不可见时停止轮询，恢复可见立即补拉', () => {
    renderHook(() => useCreditSummaryPolling());
    expect(mocks.run).toHaveBeenCalledTimes(1);
    act(() => setDocumentHidden(true));
    expect(mocks.cancel).toHaveBeenCalledTimes(1);
    expect(mocks.run).toHaveBeenCalledTimes(1);
    act(() => setDocumentHidden(false));
    expect(mocks.run).toHaveBeenCalledTimes(2);
  });

  it('挂载时页面已不可见则不请求', () => {
    mocks.docHidden = true;
    renderHook(() => useCreditSummaryPolling());
    expect(mocks.run).not.toHaveBeenCalled();
  });

  it('桌面宿主不可见（最小化/锁屏）时停止轮询，恢复后补拉', () => {
    renderHook(() => useCreditSummaryPolling());
    expect(mocks.run).toHaveBeenCalledTimes(1);
    act(() => {
      mocks.hostVisible = false;
      mocks.hostListener?.();
    });
    expect(mocks.cancel).toHaveBeenCalledTimes(1);
    expect(mocks.run).toHaveBeenCalledTimes(1);
    act(() => {
      mocks.hostVisible = true;
      mocks.hostListener?.();
    });
    expect(mocks.run).toHaveBeenCalledTimes(2);
  });

  it('卸载时停止轮询并注销订阅', () => {
    const view = renderHook(() => useCreditSummaryPolling());
    expect(mocks.hostListener).toBeDefined();
    view.unmount();
    expect(mocks.cancel).toHaveBeenCalled();
    expect(mocks.hostListener).toBeUndefined();
  });

  it('请求成功后广播最新积分，供余额栏同步显示', () => {
    renderHook(() => useCreditSummaryPolling());
    mocks.options.onSuccess({ totalCredit: 123 });
    expect(mocks.emit).toHaveBeenCalledWith(EVENT_TYPE.CreditSummaryUpdated, {
      totalCredit: 123,
    });
  });
});
