import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CreditsPurchaseModal from './index';

const mocks = vi.hoisted(() => ({
  purchase: vi.fn(),
  openNative: vi.fn(),
  error: vi.fn(),
  hasBridge: false,
  desktop: false,
}));

vi.mock('@/services/subscriptionService', () => ({
  apiListCreditPackages: vi.fn(),
  apiPurchaseCredits: mocks.purchase,
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/utils/hostBridge', () => ({
  hasHostBridge: () => mocks.hasBridge,
  isDesktopHost: () => mocks.desktop,
  native: { openWindow: mocks.openNative },
}));
vi.mock('umi', () => ({
  useRequest: (_service: any, callbacks: any) => ({
    loading: false,
    run: () =>
      callbacks.onSuccess({
        data: [{ id: 7, name: 'Fixture package', credits: 100, price: 3 }],
      }),
  }),
}));
vi.mock('antd', () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Modal: ({ open, children, footer }: any) =>
    open ? (
      <div>
        {children}
        {footer}
      </div>
    ) : null,
  Spin: () => null,
  Tag: ({ children }: any) => <span>{children}</span>,
  message: { error: mocks.error, success: vi.fn(), info: vi.fn() },
}));

describe('积分流水页增购复用支付窗口', () => {
  let paymentWindow: {
    closed: boolean;
    opener: Window | null;
    close: ReturnType<typeof vi.fn>;
    location: { replace: ReturnType<typeof vi.fn> };
  };
  let open: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasBridge = false;
    mocks.desktop = false;
    mocks.openNative.mockResolvedValue({ success: true });
    mocks.purchase.mockResolvedValue({
      data: { payUrl: 'https://cashier.example/credits' },
    });
    paymentWindow = {
      closed: false,
      opener: window,
      close: vi.fn(),
      location: { replace: vi.fn() },
    };
    open = vi.spyOn(window, 'open').mockReturnValue(paymentWindow as any);
  });
  afterEach(() => vi.restoreAllMocks());

  const buy = () =>
    fireEvent.click(
      screen.getByRole('button', {
        name: 'PC.Components.CreditsBalance.buyNow',
      }),
    );

  it('浏览器先预开页签，下单后跳转，业务页面保留', async () => {
    const onCancel = vi.fn();
    const originalUrl = window.location.href;
    render(<CreditsPurchaseModal open onCancel={onCancel} />);
    buy();
    expect(open).toHaveBeenCalledWith('', '_blank');
    expect(open.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.purchase.mock.invocationCallOrder[0],
    );
    expect(paymentWindow.opener).toBeNull();
    await waitFor(() => expect(onCancel).toHaveBeenCalledOnce());
    expect(paymentWindow.location.replace).toHaveBeenCalledWith(
      'https://cashier.example/credits',
    );
    expect(paymentWindow.close).not.toHaveBeenCalled();
    expect(window.location.href).toBe(originalUrl);
  });

  it('客户端使用统一的新窗口接口', async () => {
    mocks.hasBridge = true;
    mocks.desktop = true;
    const onCancel = vi.fn();
    render(<CreditsPurchaseModal open onCancel={onCancel} />);
    buy();
    await waitFor(() => expect(onCancel).toHaveBeenCalledOnce());
    expect(mocks.openNative).toHaveBeenCalledWith(
      'https://cashier.example/credits',
    );
    expect(open).not.toHaveBeenCalled();
  });

  it('下单失败关闭待支付页签，不触发成功回调', async () => {
    mocks.purchase.mockRejectedValue(new Error('fixture failure'));
    const onSuccess = vi.fn();
    render(
      <CreditsPurchaseModal open onCancel={vi.fn()} onSuccess={onSuccess} />,
    );
    buy();
    await waitFor(() => expect(paymentWindow.close).toHaveBeenCalledOnce());
    expect(onSuccess).not.toHaveBeenCalled();
    expect(mocks.error).toHaveBeenCalledOnce();
  });

  it('连续点击只下单并开页签一次', async () => {
    const onCancel = vi.fn();
    render(<CreditsPurchaseModal open onCancel={onCancel} />);
    buy();
    buy();
    await waitFor(() => expect(onCancel).toHaveBeenCalledOnce());
    expect(open).toHaveBeenCalledTimes(1);
    expect(mocks.purchase).toHaveBeenCalledTimes(1);
    expect(mocks.purchase).toHaveBeenCalledWith(7);
  });

  it('页签被浏览器拦截时停止下单', () => {
    open.mockReturnValue(null);
    render(<CreditsPurchaseModal open onCancel={vi.fn()} />);
    buy();
    expect(mocks.purchase).not.toHaveBeenCalled();
    expect(mocks.error).toHaveBeenCalledOnce();
  });
});
