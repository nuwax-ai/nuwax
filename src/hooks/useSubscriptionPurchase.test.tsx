import { PAYMENT_SETTLEMENT_PATH } from '@/constants/subscription.constants';
import {
  apiCreateAgentSubscriptionOrder,
  apiGetAgentSubscriptionOrderCashier,
} from '@/services/agent-subscription-plan';
import { apiCreateCreditOrder } from '@/services/subscriptionService';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSubscriptionPurchase } from './useSubscriptionPurchase';

const mocks = vi.hoisted(() => ({
  callbacks: new Map<any, any>(),
  createSubscription: vi.fn(),
  createCredits: vi.fn(),
  cashier: vi.fn(),
  openNative: vi.fn(),
  error: vi.fn(),
  replaceHistory: vi.fn(),
  hasBridge: false,
  desktop: false,
}));

vi.mock('@/services/agent-subscription-plan', () => ({
  apiCreateAgentSubscriptionOrder: mocks.createSubscription,
  apiGetAgentSubscriptionOrderCashier: mocks.cashier,
}));
vi.mock('@/services/subscriptionService', () => ({
  apiCreateCreditOrder: mocks.createCredits,
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/utils/hostBridge', () => ({
  hasHostBridge: () => mocks.hasBridge,
  isDesktopHost: () => mocks.desktop,
  native: { openWindow: mocks.openNative },
}));
vi.mock('antd', () => ({
  message: { error: mocks.error, success: vi.fn(), info: vi.fn() },
}));
vi.mock('umi', () => ({
  history: { replace: mocks.replaceHistory },
  useLocation: () => ({ pathname: '/home', search: '' }),
  useRequest: (service: any, callbacks: any) => {
    mocks.callbacks.set(service, callbacks);
    return { run: service, loading: false };
  },
}));

function pendingWindow() {
  return {
    closed: false,
    opener: window,
    close: vi.fn(),
    location: { replace: vi.fn() },
  };
}

async function succeed(service: any, data: any) {
  await act(async () => mocks.callbacks.get(service).onSuccess(data));
}

describe('支付收银台独立窗口', () => {
  let paymentWindow: ReturnType<typeof pendingWindow>;
  let open: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.callbacks.clear();
    mocks.hasBridge = false;
    mocks.desktop = false;
    mocks.openNative.mockResolvedValue({ success: true });
    paymentWindow = pendingWindow();
    open = vi.spyOn(window, 'open').mockReturnValue(paymentWindow as any);
  });

  afterEach(() => vi.restoreAllMocks());

  it.each(['credits', 'subscription', 'existing'] as const)(
    '%s 在点击时预开浏览器页签，保留业务页面和结算回跳',
    async (kind) => {
      const originalUrl = window.location.href;
      const returnUrl = `${window.location.origin}/more-page/my-subscriptions`;
      const { result } = renderHook(() => useSubscriptionPurchase());
      const service =
        kind === 'credits'
          ? apiCreateCreditOrder
          : apiCreateAgentSubscriptionOrder;
      act(() => {
        if (kind === 'credits') result.current.handlePayCredits(7, returnUrl);
        if (kind === 'subscription')
          result.current.handlePaySubscription(7, returnUrl);
        if (kind === 'existing')
          result.current.handlePayExistingOrder(81, returnUrl);
      });
      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith('', '_blank');
      expect(paymentWindow.opener).toBeNull();
      expect(result.current.loading).toBe(true);
      if (kind !== 'existing') {
        expect(open.mock.invocationCallOrder[0]).toBeLessThan(
          (service as any).mock.invocationCallOrder[0],
        );
        await succeed(service, { data: { id: 81 } });
      }
      const request = mocks.cashier.mock.calls[0][0];
      expect(request.orderId).toBe(81);
      const settlement = new URL(request.returnUrl);
      expect(settlement.pathname).toBe(PAYMENT_SETTLEMENT_PATH);
      expect(settlement.searchParams.get('orderId')).toBe('81');
      expect(settlement.searchParams.get('returnUrl')).toBe(returnUrl);

      await succeed(apiGetAgentSubscriptionOrderCashier, {
        cashierUrl: 'https://cashier.example/order/81',
      });
      expect(paymentWindow.location.replace).toHaveBeenCalledWith(
        'https://cashier.example/order/81',
      );
      expect(paymentWindow.close).not.toHaveBeenCalled();
      expect(window.location.href).toBe(originalUrl);
      expect(result.current.processingId).toBeNull();
      expect(result.current.loading).toBe(false);
    },
  );

  it('客户端通过桥新开收银台窗口，打开完成前保持点击锁', async () => {
    mocks.hasBridge = true;
    mocks.desktop = true;
    let resolveOpen: (value: { success: boolean }) => void = () => {};
    mocks.openNative.mockReturnValue(
      new Promise((resolve) => {
        resolveOpen = resolve;
      }),
    );
    const originalUrl = window.location.href;
    const { result } = renderHook(() => useSubscriptionPurchase());
    act(() => result.current.handlePayCredits(7));
    expect(open).not.toHaveBeenCalled();
    await succeed(apiCreateCreditOrder, { id: 81 });
    await succeed(apiGetAgentSubscriptionOrderCashier, {
      data: { cashierUrl: 'https://cashier.example/order/81' },
    });
    expect(mocks.openNative).toHaveBeenCalledTimes(1);
    expect(mocks.openNative).toHaveBeenCalledWith(
      'https://cashier.example/order/81',
    );
    expect(result.current.loading).toBe(true);
    act(() => result.current.handlePayCredits(8));
    expect(mocks.createCredits).toHaveBeenCalledTimes(1);
    await act(async () => resolveOpen({ success: true }));
    expect(result.current.loading).toBe(false);
    expect(window.location.href).toBe(originalUrl);
  });

  it('同步重复点击只创建一个页签和订单', () => {
    const { result } = renderHook(() => useSubscriptionPurchase());
    act(() => {
      result.current.handlePayCredits(7);
      result.current.handlePayCredits(7);
    });
    expect(open).toHaveBeenCalledTimes(1);
    expect(mocks.createCredits).toHaveBeenCalledTimes(1);
    expect(mocks.createCredits).toHaveBeenCalledWith({ packageId: 7 });
  });

  it('浏览器拦截页签时提示失败，不创建订单', () => {
    open.mockReturnValue(null);
    const { result } = renderHook(() => useSubscriptionPurchase());
    act(() => result.current.handlePayCredits(7));
    expect(mocks.createCredits).not.toHaveBeenCalled();
    expect(mocks.error).toHaveBeenCalledOnce();
    expect(result.current.loading).toBe(false);
  });

  it.each(['credit-error', 'subscription-error', 'cashier-error'])(
    '%s 清理待支付页签，允许重试',
    (kind) => {
      const { result } = renderHook(() => useSubscriptionPurchase());
      act(() => {
        if (kind === 'subscription-error')
          result.current.handlePaySubscription(7);
        else result.current.handlePayCredits(7);
      });
      const service =
        kind === 'credit-error'
          ? apiCreateCreditOrder
          : kind === 'subscription-error'
          ? apiCreateAgentSubscriptionOrder
          : apiGetAgentSubscriptionOrderCashier;
      act(() => mocks.callbacks.get(service).onError(new Error('fixture')));
      expect(paymentWindow.close).toHaveBeenCalledOnce();
      expect(result.current.processingId).toBeNull();
      act(() => result.current.handlePayCredits(8));
      expect(mocks.createCredits).toHaveBeenLastCalledWith({ packageId: 8 });
    },
  );

  it.each([null, {}, { cashierUrl: 'javascript:alert(1)' }])(
    '收银台返回无效数据 %s 时关闭待支付页签',
    async (response) => {
      const { result } = renderHook(() => useSubscriptionPurchase());
      act(() => result.current.handlePayCredits(7));
      await succeed(apiGetAgentSubscriptionOrderCashier, response);
      expect(paymentWindow.close).toHaveBeenCalledOnce();
      expect(paymentWindow.location.replace).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
    },
  );

  it('用户提前关闭页签后，迟到响应不会另开窗口或跳走原页面', async () => {
    const originalUrl = window.location.href;
    const { result } = renderHook(() => useSubscriptionPurchase());
    act(() => result.current.handlePayCredits(7));
    paymentWindow.closed = true;
    await succeed(apiGetAgentSubscriptionOrderCashier, {
      cashierUrl: 'https://cashier.example/order/81',
    });
    expect(open).toHaveBeenCalledTimes(1);
    expect(paymentWindow.location.replace).not.toHaveBeenCalled();
    expect(window.location.href).toBe(originalUrl);
    expect(result.current.loading).toBe(false);
  });

  it('客户端窗口打开失败时原页面仍可用并允许重试', async () => {
    mocks.hasBridge = true;
    mocks.desktop = true;
    mocks.openNative.mockResolvedValue({ success: false });
    const originalUrl = window.location.href;
    const { result } = renderHook(() => useSubscriptionPurchase());
    act(() => result.current.handlePayCredits(7));
    await succeed(apiGetAgentSubscriptionOrderCashier, {
      cashierUrl: 'https://cashier.example/order/81',
    });
    expect(mocks.error).toHaveBeenCalledOnce();
    expect(open).not.toHaveBeenCalled();
    expect(window.location.href).toBe(originalUrl);
    expect(result.current.loading).toBe(false);
  });

  it('社区宿主沿用收银台普通弹窗，不预开壳拒绝的空白窗口', async () => {
    mocks.hasBridge = true;
    const { result } = renderHook(() => useSubscriptionPurchase());
    act(() => result.current.handlePayCredits(7));
    expect(open).not.toHaveBeenCalled();
    await succeed(apiGetAgentSubscriptionOrderCashier, {
      cashierUrl: 'https://cashier.example/order/81',
    });
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith(
      'https://cashier.example/order/81',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it.each([false, true])(
    '组件卸载只关闭未跳转的页签，已进入收银台=%s',
    async (navigated) => {
      const { result, unmount } = renderHook(() => useSubscriptionPurchase());
      act(() => result.current.handlePayCredits(7));
      if (navigated) {
        await succeed(apiGetAgentSubscriptionOrderCashier, {
          cashierUrl: 'https://cashier.example/order/81',
        });
      }
      unmount();
      expect(paymentWindow.close).toHaveBeenCalledTimes(navigated ? 0 : 1);
    },
  );
});
