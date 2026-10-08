import ImageCaptcha, {
  useImageCaptcha,
  type ImageCaptchaValue,
} from '@/components/business-component/ImageCaptcha';
import '@testing-library/jest-dom/vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { StrictMode, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  imageCaptcha: vi.fn(),
  warning: vi.fn(),
  take: vi.fn(),
}));
vi.mock('@/services/account', () => ({ apiImageCaptcha: h.imageCaptcha }));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/components/business-component/ImageCaptcha/index.less', () => ({
  default: {
    container: 'image-captcha-container',
    row: 'image-captcha-row',
    input: 'image-captcha-input',
    image: 'image-captcha-image',
    placeholder: 'image-captcha-placeholder',
    hint: 'image-captcha-hint',
  },
}));
vi.mock('antd', async (importOriginal) => {
  const original = await importOriginal<typeof import('antd')>();
  return { ...original, message: { ...original.message, warning: h.warning } };
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function challenge(captchaId: string) {
  return { data: { captchaId, image: `data:image/svg+xml,${captchaId}` } };
}

/** 对应 VerifyCode 倒计时：保留父 hook/valueRef，仅卸载与重挂 ImageCaptcha。 */
function Harness() {
  const captcha = useImageCaptcha(true);
  const [visible, setVisible] = useState(true);
  return (
    <main>
      <button onClick={() => setVisible(false)}>开始倒计时</button>
      <button onClick={() => setVisible(true)}>倒计时结束</button>
      <button onClick={() => h.take(captcha.take())}>读取发码参数</button>
      <button onClick={captcha.refresh}>提交失败换图</button>
      <output data-testid="captcha-parent-value">
        {JSON.stringify(captcha.inputProps.value)}
      </output>
      {visible && (
        <ImageCaptcha {...captcha.inputProps} placeholder="图形验证码" />
      )}
    </main>
  );
}

function parentValue(): ImageCaptchaValue | null {
  return JSON.parse(
    screen.getByTestId('captcha-parent-value').textContent || 'null',
  );
}

async function fillReadyChallenge(captchaId: string, code: string) {
  await waitFor(() => expect(parentValue()?.captchaId).toBe(captchaId));
  fireEvent.change(screen.getByPlaceholderText('图形验证码'), {
    target: { value: code },
  });
  fireEvent.click(screen.getByRole('button', { name: '读取发码参数' }));
  expect(h.take).toHaveBeenLastCalledWith({ captchaId, captchaCode: code });
}

beforeEach(() => {
  vi.clearAllMocks();
  h.imageCaptcha.mockReset();
});
afterEach(cleanup);

describe('ImageCaptcha 卸载与重挂', () => {
  it.each(['success', 'failure'] as const)(
    '卸载前请求迟到 %s 都不能再通知外部 onChange',
    async (result) => {
      const request = deferred<unknown>();
      h.imageCaptcha.mockReturnValue(request.promise);
      const onChange = vi.fn();
      const view = render(<ImageCaptcha onChange={onChange} />);
      await waitFor(() => expect(h.imageCaptcha).toHaveBeenCalledTimes(1));
      onChange.mockClear();
      view.unmount();
      await act(async () => {
        if (result === 'success') request.resolve(challenge('old-A'));
        else request.reject(new Error('old request failed'));
      });
      expect(onChange).not.toHaveBeenCalled();
    },
  );

  it('新实例 B 先返回并已输入，旧实例 A 迟到不能覆盖父 valueRef 的挑战', async () => {
    const oldRequest = deferred<unknown>();
    const newRequest = deferred<unknown>();
    h.imageCaptcha
      .mockReturnValueOnce(oldRequest.promise)
      .mockReturnValueOnce(newRequest.promise);
    render(<Harness />);
    await waitFor(() => expect(h.imageCaptcha).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: '开始倒计时' }));
    fireEvent.click(screen.getByRole('button', { name: '倒计时结束' }));
    await waitFor(() => expect(h.imageCaptcha).toHaveBeenCalledTimes(2));
    await act(async () => {
      newRequest.resolve(challenge('new-B'));
    });
    await fillReadyChallenge('new-B', '2468');
    await act(async () => {
      oldRequest.resolve(challenge('old-A'));
    });
    expect(parentValue()).toEqual({ captchaId: 'new-B', captchaCode: '2468' });
    fireEvent.click(screen.getByRole('button', { name: '读取发码参数' }));
    expect(h.take).toHaveBeenLastCalledWith({
      captchaId: 'new-B',
      captchaCode: '2468',
    });
  });

  it('重挂取图期间立即清除父 hook 保留的一次性旧挑战', async () => {
    const newRequest = deferred<unknown>();
    h.imageCaptcha
      .mockResolvedValueOnce(challenge('old-A'))
      .mockReturnValueOnce(newRequest.promise);
    render(<Harness />);
    await fillReadyChallenge('old-A', '1234');
    fireEvent.click(screen.getByRole('button', { name: '开始倒计时' }));
    fireEvent.click(screen.getByRole('button', { name: '倒计时结束' }));
    await waitFor(() => expect(h.imageCaptcha).toHaveBeenCalledTimes(2));
    expect(parentValue()).toEqual({ captchaId: undefined, captchaCode: '' });
    fireEvent.click(screen.getByRole('button', { name: '读取发码参数' }));
    expect(h.take).toHaveBeenLastCalledWith(null);
    await act(async () => {
      newRequest.resolve(challenge('new-B'));
    });
    await fillReadyChallenge('new-B', '2468');
  });

  it('StrictMode 重跑 effect 时仍采用后发挑战，清理前请求迟到不能覆盖', async () => {
    const first = deferred<unknown>();
    const second = deferred<unknown>();
    h.imageCaptcha
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    render(
      <StrictMode>
        <Harness />
      </StrictMode>,
    );
    await waitFor(() => expect(h.imageCaptcha).toHaveBeenCalledTimes(2));
    await act(async () => {
      second.resolve(challenge('strict-B'));
    });
    await fillReadyChallenge('strict-B', '2468');
    await act(async () => {
      first.resolve(challenge('strict-A'));
    });
    expect(parentValue()).toEqual({
      captchaId: 'strict-B',
      captchaCode: '2468',
    });
  });
});

describe('ImageCaptcha 刷新挑战边界', () => {
  it('换图开始即清除 ID/输入，loading 期间不能复用旧挑战；新图成功后需重新填写', async () => {
    const newRequest = deferred<unknown>();
    h.imageCaptcha
      .mockResolvedValueOnce(challenge('old-A'))
      .mockReturnValueOnce(newRequest.promise);
    const view = render(<Harness />);
    await fillReadyChallenge('old-A', '1234');
    fireEvent.click(
      screen.getByRole('button', {
        name: 'PC.Components.ImageCaptcha.refresh',
      }),
    );
    expect(parentValue()).toEqual({ captchaId: undefined, captchaCode: '' });
    expect(screen.getByPlaceholderText('图形验证码')).toHaveValue('');
    expect(view.container.querySelector('img')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '读取发码参数' }));
    expect(h.take).toHaveBeenLastCalledWith(null);
    await act(async () => {
      newRequest.resolve(challenge('new-B'));
    });
    await waitFor(() =>
      expect(parentValue()).toEqual({ captchaId: 'new-B', captchaCode: '' }),
    );
    fireEvent.click(screen.getByRole('button', { name: '读取发码参数' }));
    expect(h.take).toHaveBeenLastCalledWith(null);
    await fillReadyChallenge('new-B', '2468');
  });

  it('提交失败的命令式刷新也立即清旧挑战；取图失败保持不可提交，重试成功才接受新挑战', async () => {
    const failedRequest = deferred<unknown>();
    h.imageCaptcha
      .mockResolvedValueOnce(challenge('old-A'))
      .mockReturnValueOnce(failedRequest.promise)
      .mockResolvedValueOnce(challenge('retry-C'));
    const view = render(<Harness />);
    await fillReadyChallenge('old-A', '1234');
    fireEvent.click(screen.getByRole('button', { name: '提交失败换图' }));
    expect(parentValue()).toEqual({ captchaId: undefined, captchaCode: '' });
    fireEvent.click(screen.getByRole('button', { name: '读取发码参数' }));
    expect(h.take).toHaveBeenLastCalledWith(null);
    await act(async () => {
      failedRequest.reject(new Error('network'));
    });
    expect(parentValue()).toEqual({ captchaId: undefined, captchaCode: '' });
    expect(view.container.querySelector('img')).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'PC.Components.ImageCaptcha.refresh',
      }),
    );
    await fillReadyChallenge('retry-C', '5678');
  });

  it.each(['success', 'failure'] as const)(
    '连续刷新中旧请求迟到 %s 不改写最新成功挑战',
    async (result) => {
      const oldRequest = deferred<unknown>();
      const newRequest = deferred<unknown>();
      h.imageCaptcha
        .mockResolvedValueOnce(challenge('initial-A'))
        .mockReturnValueOnce(oldRequest.promise)
        .mockReturnValueOnce(newRequest.promise);
      render(<Harness />);
      await fillReadyChallenge('initial-A', '1234');
      const refresh = screen.getByRole('button', {
        name: 'PC.Components.ImageCaptcha.refresh',
      });
      fireEvent.click(refresh);
      fireEvent.click(refresh);
      await act(async () => {
        newRequest.resolve(challenge('latest-C'));
      });
      await fillReadyChallenge('latest-C', '2468');
      await act(async () => {
        if (result === 'success') oldRequest.resolve(challenge('old-B'));
        else oldRequest.reject(new Error('old request failed'));
      });
      expect(parentValue()).toEqual({
        captchaId: 'latest-C',
        captchaCode: '2468',
      });
    },
  );
});
