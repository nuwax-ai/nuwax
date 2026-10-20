import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('umi', () => ({ request: mocks.request }));

import { apiClearEvent, apiCollectEvent } from './event';
import { apiGetCreditSummary } from './subscriptionService';

beforeEach(() => vi.clearAllMocks());

it('只有后台积分查询携带全静默选项，主动查询仍保留普通鉴权处理', async () => {
  await apiGetCreditSummary({ silentPolling: true });
  expect(mocks.request).toHaveBeenLastCalledWith('/api/credit/summary', {
    method: 'GET',
    silentPolling: true,
  });
  await apiGetCreditSummary();
  expect(mocks.request).toHaveBeenLastCalledWith('/api/credit/summary', {
    method: 'GET',
  });
});

it('batch 及后台事件清除均显式静默', async () => {
  await apiCollectEvent();
  expect(mocks.request).toHaveBeenLastCalledWith(
    '/api/notify/event/collect/batch',
    { method: 'GET', silentPolling: true },
  );
  await apiClearEvent();
  expect(mocks.request).toHaveBeenLastCalledWith('/api/notify/event/clear', {
    method: 'GET',
    silentPolling: true,
  });
});
