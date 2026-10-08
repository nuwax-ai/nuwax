import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  summary: vi.fn(),
  subscription: 1,
  pathname: '/home',
  hostVisible: true,
}));

vi.mock('@/services/subscriptionService', () => ({
  apiGetCreditSummary: mocks.summary,
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/services/hostVisibility', () => ({
  getHostVisibility: () => mocks.hostVisible,
}));
vi.mock('@/components/SiteFooter', () => ({ default: () => null }));
vi.mock('@/components/business-component/PurchaseModal', () => ({
  default: () => null,
}));
vi.mock('@ant-design/icons', () => ({ InfoCircleOutlined: () => null }));
vi.mock('antd', () => ({
  Button: ({ children, onClick }: any) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  Tooltip: ({ children }: any) => children,
  Typography: { Text: ({ children }: any) => <span>{children}</span> },
}));
vi.mock('./index.less', () => ({ default: {} }));
vi.mock('umi', async () => {
  const React = await import('react');
  return {
    history: { push: vi.fn() },
    useLocation: () => ({ pathname: mocks.pathname }),
    useModel: () => ({
      tenantConfigInfo: { enableSubscription: mocks.subscription },
    }),
    useRequest: (service: any, options: any) => {
      const latest = React.useRef(options);
      latest.current = options;
      const run = React.useCallback(() => {
        // Umi useRequest 将接口 data 交给 onSuccess；失败不调用 onSuccess。
        service().then(
          (data: unknown) => latest.current.onSuccess(data),
          () => {},
        );
      }, [service]);
      return { run };
    },
  };
});

import CreditsBalance from './index';

const flushRequest = () =>
  act(async () => {
    await Promise.resolve();
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  Object.assign(mocks, {
    subscription: 1,
    pathname: '/home',
    hostVisible: true,
  });
  mocks.summary.mockResolvedValue({ totalCredit: -6711 });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('用户菜单积分余额刷新', () => {
  it('首次展开及重新展开都取最新积分，普通重渲染不重复请求', async () => {
    const view = render(<CreditsBalance active={false} showFooter={false} />);
    expect(mocks.summary).not.toHaveBeenCalled();
    view.rerender(<CreditsBalance active showFooter={false} />);
    await flushRequest();
    expect(screen.getByText('-6,711')).toBeTruthy();
    expect(mocks.summary).toHaveBeenCalledTimes(1);
    view.rerender(<CreditsBalance active showFooter={false} />);
    expect(mocks.summary).toHaveBeenCalledTimes(1);
    view.rerender(<CreditsBalance active={false} showFooter={false} />);
    mocks.summary.mockResolvedValue({ totalCredit: 3289 });
    view.rerender(<CreditsBalance active showFooter={false} />);
    await flushRequest();
    expect(screen.getByText('3,289')).toBeTruthy();
    expect(mocks.summary).toHaveBeenCalledTimes(2);
  });

  it('收起菜单后停止轮询，展开时继续刷新', async () => {
    const view = render(<CreditsBalance active />);
    await flushRequest();
    await act(async () => {
      vi.advanceTimersByTime(60000);
    });
    expect(mocks.summary).toHaveBeenCalledTimes(2);
    view.rerender(<CreditsBalance active={false} />);
    await act(async () => {
      vi.advanceTimersByTime(120000);
    });
    expect(mocks.summary).toHaveBeenCalledTimes(2);
    view.rerender(<CreditsBalance active />);
    await flushRequest();
    expect(mocks.summary).toHaveBeenCalledTimes(3);
  });

  it('重新展开时接口失败保留上次成功余额', async () => {
    const view = render(<CreditsBalance active />);
    await flushRequest();
    view.rerender(<CreditsBalance active={false} />);
    mocks.summary.mockRejectedValue(new Error('network failed'));
    view.rerender(<CreditsBalance active />);
    await flushRequest();
    expect(mocks.summary).toHaveBeenCalledTimes(2);
    expect(screen.getByText('-6,711')).toBeTruthy();
  });

  it('关闭订阅功能后不请求积分', () => {
    mocks.subscription = 0;
    render(<CreditsBalance active />);
    expect(mocks.summary).not.toHaveBeenCalled();
    expect(screen.queryByText('-6,711')).toBeNull();
  });

  it('常驻余额栏继续刷新，客户端不可见时跳过轮询', async () => {
    render(<CreditsBalance />);
    await flushRequest();
    mocks.hostVisible = false;
    await act(async () => {
      vi.advanceTimersByTime(60000);
    });
    expect(mocks.summary).toHaveBeenCalledTimes(1);
    mocks.hostVisible = true;
    await act(async () => {
      vi.advanceTimersByTime(60000);
    });
    expect(mocks.summary).toHaveBeenCalledTimes(2);
  });

  it('在订阅页首次展开只请求一次，订阅路由变化时刷新', async () => {
    mocks.pathname = '/more-page/my-subscriptions';
    const view = render(<CreditsBalance active />);
    await flushRequest();
    expect(mocks.summary).toHaveBeenCalledTimes(1);
    mocks.pathname = '/more-page/my-subscriptions/details';
    view.rerender(<CreditsBalance active />);
    await flushRequest();
    expect(mocks.summary).toHaveBeenCalledTimes(2);
  });
});
