import QrCodeLogin from '@/pages/Login/QrCodeLogin';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ create: vi.fn(), status: vi.fn() }));
vi.mock('@/services/qrLogin', () => ({
  apiCreateQrLoginCode: h.create,
  apiGetQrLoginStatus: h.status,
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/pages/Login/QrCodeLogin/index.less', () => ({ default: {} }));

const code = {
  sceneId: 'scene-1',
  pollToken: 'private-poll-token',
  qrContent: 'https://example.com/qrlogin/scene-1',
  expireSeconds: 120,
};
const ok = (data: unknown) => ({ code: '0000', data });
const flush = () =>
  act(async () => {
    await Promise.resolve();
  });
const tick = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

beforeEach(() => {
  vi.useFakeTimers();
  h.create.mockReset().mockResolvedValue(ok(code));
  h.status.mockReset().mockResolvedValue(ok({ status: 'WAITING' }));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('扫码登录生命周期', () => {
  it('串行轮询、扫码后隐藏二维码，确认时仅收尾一次且接受空 token 的 Cookie 登录', async () => {
    let resolveStatus!: (value: unknown) => void;
    h.status.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveStatus = resolve;
      }),
    );
    const onSuccess = vi.fn().mockResolvedValue(undefined);
    const onConfirmingChange = vi.fn();
    render(<QrCodeLogin {...{ onSuccess, onConfirmingChange }} />);
    await flush();
    expect(
      screen.getByRole('img', { name: 'PC.Pages.Login.qrCodeLabel' }),
    ).toBeInTheDocument();
    expect(document.body.innerHTML).not.toContain(code.pollToken);
    expect(h.status).toHaveBeenCalledWith(
      { sceneId: code.sceneId, pollToken: code.pollToken },
      expect.any(AbortSignal),
    );
    await tick(6000);
    expect(h.status).toHaveBeenCalledTimes(1);
    resolveStatus(ok({ status: 'SCANNED' }));
    await flush();
    expect(screen.getByRole('status')).toHaveTextContent(
      'PC.Pages.Login.qrScanned',
    );
    expect(
      screen.queryByRole('img', { name: 'PC.Pages.Login.qrCodeLabel' }),
    ).toBeNull();
    h.status.mockResolvedValue(
      ok({
        status: 'CONFIRMED',
        token: '',
        expireDate: '2030-01-01',
        resetPass: 1,
      }),
    );
    await tick(2000);
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(onSuccess).toHaveBeenCalledWith(
      {
        status: 'CONFIRMED',
        token: '',
        expireDate: '2030-01-01',
        resetPass: 1,
      },
      expect.any(Function),
    );
    expect(onConfirmingChange.mock.calls).toEqual([[true], [false]]);
    await tick(150000);
    expect(h.status).toHaveBeenCalledTimes(2);
  });

  it('即使状态请求挂起也按本地期限过期，并丢弃旧二维码的迟到确认', async () => {
    h.create.mockResolvedValueOnce(ok({ ...code, expireSeconds: 3 }));
    let resolveStatus!: (value: unknown) => void;
    h.status.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveStatus = resolve;
      }),
    );
    const onSuccess = vi.fn();
    render(<QrCodeLogin onSuccess={onSuccess} onConfirmingChange={vi.fn()} />);
    await flush();
    const oldSignal = h.status.mock.calls[0][1] as AbortSignal;
    await tick(3000);
    expect(oldSignal.aborted).toBe(true);
    expect(screen.getByRole('status')).toHaveTextContent(
      'PC.Pages.Login.qrExpiredTitle',
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'PC.Pages.Login.qrRefresh' }),
    );
    await flush();
    expect(h.create).toHaveBeenCalledTimes(2);
    resolveStatus(ok({ status: 'CONFIRMED', token: 'old-session' }));
    await flush();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent(
      'PC.Pages.Login.qrHintWithAppName',
    );
  });

  it('已扫码时可主动换码，点击即取消旧轮询，迟到确认不能完成登录', async () => {
    let resolveOld!: (value: unknown) => void;
    h.status
      .mockResolvedValueOnce(ok({ status: 'SCANNED' }))
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
      );
    const onSuccess = vi.fn();
    const onConfirmingChange = vi.fn();
    render(<QrCodeLogin {...{ onSuccess, onConfirmingChange }} />);
    await flush();
    await tick(2000);
    const oldSignal = h.status.mock.calls[1][1] as AbortSignal;
    const nextCode = {
      ...code,
      sceneId: 'scene-2',
      pollToken: 'next-poll-token',
      qrContent: 'https://example.com/qrlogin/scene-2',
    };
    h.create.mockResolvedValueOnce(ok(nextCode));
    act(() => {
      fireEvent.click(
        screen.getByRole('button', { name: 'PC.Pages.Login.qrRefresh' }),
      );
      // 外层 act 尚未提交 effect 清理，旧请求也必须已经取消。
      expect(oldSignal.aborted).toBe(true);
      resolveOld(ok({ status: 'CONFIRMED', token: 'old-session' }));
    });
    await flush();
    expect(h.create).toHaveBeenCalledTimes(2);
    expect(h.status).toHaveBeenLastCalledWith(
      { sceneId: nextCode.sceneId, pollToken: nextCode.pollToken },
      expect.any(AbortSignal),
    );
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onConfirmingChange).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent(
      'PC.Pages.Login.qrHintWithAppName',
    );
    expect(
      screen.getByRole('img', { name: 'PC.Pages.Login.qrCodeLabel' }),
    ).toBeInTheDocument();
  });

  it.each(['EXPIRED', 'UNKNOWN'])(
    '后端状态 %s 停止轮询并可手动刷新',
    async (status) => {
      h.status.mockResolvedValueOnce(ok({ status }));
      render(<QrCodeLogin onSuccess={vi.fn()} onConfirmingChange={vi.fn()} />);
      await flush();
      expect(screen.getByRole('status')).toHaveTextContent(
        status === 'EXPIRED'
          ? 'PC.Pages.Login.qrExpiredTitle'
          : 'PC.Pages.Login.qrLoadFailed',
      );
      await tick(10000);
      expect(h.status).toHaveBeenCalledTimes(1);
      fireEvent.click(
        screen.getByRole('button', { name: 'PC.Pages.Login.qrRefresh' }),
      );
      await flush();
      expect(h.create).toHaveBeenCalledTimes(2);
    },
  );

  it('创建业务失败和轮询网络失败均可重试，不泄漏 Promise 拒绝', async () => {
    h.create.mockResolvedValueOnce({ code: '4000', message: 'create failed' });
    h.status.mockRejectedValueOnce(
      Object.assign(new Error('Network Error'), { name: 'AxiosError' }),
    );
    render(<QrCodeLogin onSuccess={vi.fn()} onConfirmingChange={vi.fn()} />);
    await flush();
    expect(screen.getByRole('status')).toHaveTextContent('create failed');
    expect(h.status).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('button', { name: 'PC.Pages.Login.qrRefresh' }),
    );
    await flush();
    expect(screen.getByRole('status')).toHaveTextContent(
      'PC.Pages.Login.qrLoadFailed',
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'PC.Pages.Login.qrRefresh' }),
    );
    await flush();
    expect(screen.getByRole('status')).toHaveTextContent(
      'PC.Pages.Login.qrHintWithAppName',
    );
  });

  it('登录收尾失败时释放交互锁并允许重新扫码', async () => {
    h.status.mockResolvedValueOnce(ok({ status: 'CONFIRMED' }));
    const onSuccess = vi
      .fn()
      .mockRejectedValue(new Error('session sync failed'));
    const onConfirmingChange = vi.fn();
    render(<QrCodeLogin {...{ onSuccess, onConfirmingChange }} />);
    await flush();
    expect(screen.getByRole('status')).toHaveTextContent('session sync failed');
    expect(onConfirmingChange.mock.calls).toEqual([[true], [false]]);
    expect(
      screen.getByRole('button', { name: 'PC.Pages.Login.qrRefresh' }),
    ).toBeEnabled();
  });

  it('卸载期间创建结果迟到不会继续轮询', async () => {
    let resolveCreate!: (value: unknown) => void;
    h.create.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );
    const { unmount } = render(
      <QrCodeLogin onSuccess={vi.fn()} onConfirmingChange={vi.fn()} />,
    );
    const signal = h.create.mock.calls[0][0] as AbortSignal;
    unmount();
    expect(signal.aborted).toBe(true);
    resolveCreate(ok(code));
    await flush();
    await tick(10000);
    expect(h.status).not.toHaveBeenCalled();
  });

  it('卸载取消正在进行的状态请求，迟到响应不能注入登录态', async () => {
    let resolveStatus!: (value: unknown) => void;
    h.status.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveStatus = resolve;
      }),
    );
    const onSuccess = vi.fn();
    const { unmount } = render(
      <QrCodeLogin onSuccess={onSuccess} onConfirmingChange={vi.fn()} />,
    );
    await flush();
    const signal = h.status.mock.calls[0][1] as AbortSignal;
    unmount();
    expect(signal.aborted).toBe(true);
    resolveStatus(ok({ status: 'CONFIRMED', token: 'old-session' }));
    await flush();
    await tick(10000);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(h.status).toHaveBeenCalledTimes(1);
  });
});
