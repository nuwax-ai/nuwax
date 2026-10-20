import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ summary: vi.fn(), emit: vi.fn() }));
vi.mock('@/services/subscriptionService', () => ({
  apiGetCreditSummary: mocks.summary,
}));
vi.mock('@/utils/eventBus', () => ({ default: { emit: mocks.emit } }));
vi.mock('@/services/hostVisibility', () => ({
  getHostVisibility: () => true,
  subscribeHostVisibility: () => () => {},
}));
vi.mock('umi', async () => {
  const { useRealUmiRequest } = await import('./helpers/useRealUmiRequest');
  return {
    useRequest: useRealUmiRequest,
    useModel: () => ({ tenantConfigInfo: { enableSubscription: 1 } }),
  };
});

import { EVENT_TYPE } from '@/constants/event.constants';
import { useCreditSummaryPolling } from '@/layouts/DynamicMenusLayout/useCreditSummaryPolling';

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it('全局积分轮询的真实 Umi 生命周期中，失败无广播且继续重试', async () => {
  mocks.summary
    .mockResolvedValueOnce({ data: { totalCredit: 100 } })
    .mockRejectedValueOnce(new Error('HTTP 401'))
    .mockResolvedValue({ data: { totalCredit: 200 } });
  renderHook(() => useCreditSummaryPolling());
  await act(async () => {
    await Promise.resolve();
  });
  expect(mocks.summary).toHaveBeenCalledWith({ silentPolling: true });
  expect(mocks.emit).toHaveBeenLastCalledWith(EVENT_TYPE.CreditSummaryUpdated, {
    totalCredit: 100,
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60_000);
  });
  expect(mocks.summary).toHaveBeenCalledTimes(2);
  expect(mocks.emit).toHaveBeenCalledTimes(1);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60_000);
  });
  expect(mocks.summary).toHaveBeenCalledTimes(3);
  expect(mocks.emit).toHaveBeenLastCalledWith(EVENT_TYPE.CreditSummaryUpdated, {
    totalCredit: 200,
  });
});
