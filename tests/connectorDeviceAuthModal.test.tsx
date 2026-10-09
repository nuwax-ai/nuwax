/**
 * ConnectorDeviceAuthModal 二次再授权状态机单测：
 * - 首轮 poll 返回 authorized 且 connectionId 为 null：弹窗不关，切中间态
 *   （回包 message 绿色提示 + 原核对码 + 「继续授权」），停轮询不排下一轮；
 * - 点「继续授权」重新调 authorize：按新回包回到扫码页形态（新二维码 /
 *   新核对码），并按新 state 启动第二轮轮询；
 * - 第二轮 poll 返回 authorized 且 connectionId 非空：关弹窗 + onConnected
 *   + 成功提示用回包 message；
 * - 回归：首轮 authorized（connectionId 非空）/ already_completed 直接成功
 *   关弹窗（现有行为不变）。
 */
import ConnectorDeviceAuthModal from '@/components/business-component/ConnectorDeviceAuthModal';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** 接口与 message 可控 mock（authorize / poll 序列按用例编排） */
const h = vi.hoisted(() => ({
  authorize: vi.fn(),
  poll: vi.fn(),
  success: vi.fn(),
}));

vi.mock('@/services/systemManage', () => ({
  apiConnectorOauthDeviceAuthorize: h.authorize,
  apiConnectorOauthDevicePoll: h.poll,
}));

// antd 轻量替身：Modal 受控直渲染、Button 透传 onClick、message 打桩
vi.mock('antd', () => ({
  Modal: ({
    open,
    title,
    children,
  }: {
    open: boolean;
    title: React.ReactNode;
    children: React.ReactNode;
  }) =>
    open ? (
      <div>
        <div>{title}</div>
        {children}
      </div>
    ) : null,
  Button: ({
    children,
    onClick,
    loading,
    type,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    loading?: boolean;
    type?: string;
  }) => (
    <button
      type="button"
      data-btn-type={type}
      disabled={loading}
      onClick={onClick}
    >
      {children}
    </button>
  ),
  message: { success: h.success, error: vi.fn() },
  Spin: () => <div data-testid="spin" />,
}));

vi.mock(
  '@/components/business-component/ConnectorDeviceAuthModal/index.less',
  () => ({ default: new Proxy({}, { get: () => 'cls' }) }),
);

const authorizeResult = (state: string, userCode: string) => ({
  code: '0000',
  data: {
    state,
    qrUrl: `/qr?state=${state}`,
    userCode,
    interval: 5,
    expiresIn: 300,
  },
});

describe('ConnectorDeviceAuthModal 二次再授权', () => {
  const onClose = vi.fn();
  const onConnected = vi.fn();

  const renderModal = () =>
    render(
      <ConnectorDeviceAuthModal
        open
        service="feishu_cli"
        spaceId={52}
        onClose={onClose}
        onConnected={onConnected}
      />,
    );

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    h.authorize.mockReset();
    h.poll.mockReset();
    h.success.mockReset();
    onClose.mockReset();
    onConnected.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('首轮 authorized 且 connectionId 为 null：切中间态不关弹窗，停轮询', async () => {
    h.authorize.mockResolvedValue(authorizeResult('s1', 'GSH2-2MKS'));
    h.poll.mockResolvedValue({
      code: '0000',
      data: {
        status: 'authorized',
        connectionId: null,
        message: '应用已创建，请继续授权（以你的身份）',
      },
    });
    renderModal();
    await waitFor(() => {
      expect(
        screen.getByText('应用已创建，请继续授权（以你的身份）'),
      ).toBeInTheDocument();
    });
    // 中间态要素：绿色提示 + 原核对码 + 继续授权按钮；二维码已隐藏
    expect(screen.getByText('GSH2-2MKS')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '继续授权' }),
    ).toBeInTheDocument();
    expect(screen.queryByAltText('扫码连接二维码')).toBeNull();
    // 不关弹窗、不回调成功、不弹成功提示
    expect(onClose).not.toHaveBeenCalled();
    expect(onConnected).not.toHaveBeenCalled();
    expect(h.success).not.toHaveBeenCalled();
    // 停轮询：推过两个轮询间隔后 poll 仍只有首轮那一次
    await vi.advanceTimersByTimeAsync(10_000);
    expect(h.poll).toHaveBeenCalledTimes(1);
  });

  it('继续授权走第二轮：新二维码回到扫码形态，第二轮成功关弹窗', async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTimeAsync,
    });
    // 第二轮 poll 挂起为可控 promise：先断言回到扫码形态，再放行驱动成功关窗
    // （测试里 onClose 不改 open，立即成功会置空 deviceAuth 让位 Spin 抢跑断言）
    let resolveSecondPoll!: (value: unknown) => void;
    h.authorize
      .mockResolvedValueOnce(authorizeResult('s1', 'GSH2-2MKS'))
      .mockResolvedValueOnce(authorizeResult('s2', 'KLM9-4ABC'));
    h.poll
      .mockResolvedValueOnce({
        code: '0000',
        data: {
          status: 'authorized',
          connectionId: null,
          message: '应用已创建，请继续授权',
        },
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecondPoll = resolve;
          }),
      );
    renderModal();
    await waitFor(() => {
      expect(screen.getByText('应用已创建，请继续授权')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: '继续授权' }));
    // 回到扫码页形态：第二轮 authorize 已发、新二维码与新核对码在、中间态文案消失
    expect(h.authorize).toHaveBeenCalledTimes(2);
    await waitFor(() => {
      expect(screen.getByAltText('扫码连接二维码')).toBeInTheDocument();
    });
    expect(screen.getByText('KLM9-4ABC')).toBeInTheDocument();
    expect(screen.queryByText('应用已创建，请继续授权')).toBeNull();
    // 第二轮轮询以新 state 发出
    expect(h.poll).toHaveBeenCalledWith({ state: 's2', interval: 5 });
    // 放行第二轮回包：connectionId 非空即连接成功——关弹窗 + 回调 + 回包 message 提示
    resolveSecondPoll({
      code: '0000',
      data: { status: 'authorized', connectionId: 196, message: '连接成功' },
    });
    await waitFor(() => {
      expect(onConnected).toHaveBeenCalledTimes(1);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(h.success).toHaveBeenCalledWith('连接成功');
  });

  it('回归：首轮 authorized 且 connectionId 非空直接成功关弹窗', async () => {
    h.authorize.mockResolvedValue(authorizeResult('s1', 'GSH2-2MKS'));
    h.poll.mockResolvedValue({
      code: '0000',
      data: { status: 'authorized', connectionId: 196, message: '连接成功' },
    });
    renderModal();
    await waitFor(() => {
      expect(onConnected).toHaveBeenCalledTimes(1);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('GSH2-2MKS')).toBeNull();
  });

  it('回归：already_completed 直接成功关弹窗', async () => {
    h.authorize.mockResolvedValue(authorizeResult('s1', 'GSH2-2MKS'));
    h.poll.mockResolvedValue({
      code: '0000',
      data: {
        status: 'already_completed',
        connectionId: null,
        message: '此前已完成',
      },
    });
    renderModal();
    await waitFor(() => {
      expect(onConnected).toHaveBeenCalledTimes(1);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('此前已完成')).toBeNull();
  });
});
