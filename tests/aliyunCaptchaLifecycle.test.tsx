import AliyunCaptcha, {
  type AliyunCaptchaRef,
  type CaptchaVerificationContext,
  type CaptchaVerifyResult,
} from '@/components/AliyunCaptcha';
import { act, cleanup, render } from '@testing-library/react';
import { createRef, StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface Instance {
  refresh: ReturnType<typeof vi.fn>;
  destroyCaptcha: ReturnType<typeof vi.fn>;
}
interface SdkOptions {
  getInstance: (instance: Instance) => void;
  onError: (error: unknown) => void;
  captchaVerifyCallback: (
    value: unknown,
    callback?: (result: CaptchaVerifyResult) => void,
  ) => Promise<CaptchaVerifyResult> | void;
  onBizResultCallback: (value: boolean) => void;
}
const config = {
  captchaSceneId: 'scene-A',
  captchaPrefix: 'prefix',
  openCaptcha: 1,
};
const result = { captchaResult: true, bizResult: true };
let initializations: SdkOptions[];
const instance = (): Instance => ({
  refresh: vi.fn(),
  destroyCaptcha: vi.fn(),
});

beforeEach(() => {
  vi.useFakeTimers();
  initializations = [];
  vi.stubGlobal('initAliyunCaptcha', (options: SdkOptions) => {
    initializations.push(options);
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete window.__captchaInitAt;
});

describe('阿里云验证码实例生命周期', () => {
  it('初始化自动回调不发业务请求，就绪后才交出本次验证参数', async () => {
    const onVerify = vi.fn().mockResolvedValue(result);
    const onReadyChange = vi.fn();
    render(
      <AliyunCaptcha
        config={config}
        elementId="login"
        onVerify={onVerify}
        onReadyChange={onReadyChange}
      />,
    );
    const sdk = initializations[0];
    expect(sdk).not.toHaveProperty('success');
    expect(sdk).not.toHaveProperty('fail');
    sdk.getInstance(instance());
    await sdk.captchaVerifyCallback('initialization');
    expect(onVerify).not.toHaveBeenCalled();
    expect(onReadyChange).toHaveBeenLastCalledWith(false);
    await act(() => vi.advanceTimersByTimeAsync(5100));
    expect(onReadyChange).toHaveBeenLastCalledWith(true);
    await sdk.captchaVerifyCallback({
      sceneId: 'scene-A',
      certifyId: 'current',
    });
    expect(onVerify).toHaveBeenCalledOnce();
    expect(onVerify.mock.calls[0][0]).toBe(
      '{"sceneId":"scene-A","certifyId":"current"}',
    );
  });

  it('配置重建清除就绪状态，旧 getInstance、成功、失败及验证回调都不能污染新实例', async () => {
    const ref = createRef<AliyunCaptchaRef>();
    const onVerify = vi.fn().mockResolvedValue(result);
    const onReady = vi.fn();
    const onReadyChange = vi.fn();
    const onBizResult = vi.fn();
    const props = {
      elementId: 'login',
      onVerify,
      onReady,
      onReadyChange,
      onBizResult,
      ref,
    };
    const view = render(<AliyunCaptcha {...props} config={config} />);
    const old = initializations[0];
    const oldInstance = instance();
    old.getInstance(oldInstance);
    await act(() => vi.advanceTimersByTimeAsync(5100));
    expect(onReady).toHaveBeenCalledOnce();
    view.rerender(
      <AliyunCaptcha
        {...props}
        config={{ ...config, captchaSceneId: 'scene-B' }}
      />,
    );
    const current = initializations[1];
    const newInstance = instance();
    current.getInstance(newInstance);
    expect(oldInstance.destroyCaptcha).toHaveBeenCalledOnce();
    expect(onReadyChange).toHaveBeenLastCalledWith(false);
    const lateInstance = instance();
    old.getInstance(lateInstance);
    expect(lateInstance.destroyCaptcha).not.toHaveBeenCalled();
    old.onError(new Error('late failure'));
    old.onBizResultCallback(true);
    await old.captchaVerifyCallback('old token');
    ref.current?.refresh();
    expect(newInstance.refresh).toHaveBeenCalledOnce();
    expect(onReady).toHaveBeenCalledOnce();
    expect(onVerify).not.toHaveBeenCalled();
    expect(onBizResult).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(5100));
    expect(onReady).toHaveBeenCalledTimes(2);
    await current.captchaVerifyCallback('current token');
    expect(onVerify).toHaveBeenCalledWith('current token', expect.any(Object));
  });

  it('初始化期间卸载，迟到回调不能重新就绪或恢复已销毁实例', async () => {
    const onVerify = vi.fn().mockResolvedValue(result);
    const onReady = vi.fn();
    const onReadyChange = vi.fn();
    const view = render(
      <AliyunCaptcha
        config={config}
        elementId="login"
        onVerify={onVerify}
        onReady={onReady}
        onReadyChange={onReadyChange}
      />,
    );
    const old = initializations[0];
    view.unmount();
    onReadyChange.mockClear();
    old.getInstance(instance());
    const sdkCallback = vi.fn();
    old.captchaVerifyCallback('old token', sdkCallback);
    await act(() => vi.advanceTimersByTimeAsync(10000));
    expect(onReady).not.toHaveBeenCalled();
    expect(onReadyChange).not.toHaveBeenCalled();
    expect(onVerify).not.toHaveBeenCalled();
    expect(sdkCallback).not.toHaveBeenCalled();
    expect(window.__captchaInitAt).toBeUndefined();
  });

  it('业务回调等待期间卸载，取消上下文且不再执行旧 SDK 的 ES5 收尾', async () => {
    let finish!: (value: CaptchaVerifyResult) => void;
    let context!: CaptchaVerificationContext;
    const onVerify = vi.fn(
      (_param: string, current: CaptchaVerificationContext) => {
        context = current;
        return new Promise<CaptchaVerifyResult>((resolve) => {
          finish = resolve;
        });
      },
    );
    const view = render(
      <AliyunCaptcha config={config} elementId="login" onVerify={onVerify} />,
    );
    const sdk = initializations[0];
    sdk.getInstance(instance());
    await act(() => vi.advanceTimersByTimeAsync(5100));
    const sdkCallback = vi.fn();
    sdk.captchaVerifyCallback('token', sdkCallback);
    await act(async () => {
      await Promise.resolve();
    });
    expect(context.isCurrent()).toBe(true);
    view.unmount();
    expect(context.isCurrent()).toBe(false);
    await act(async () => {
      finish(result);
    });
    expect(sdkCallback).not.toHaveBeenCalled();
  });

  it('初始化失败会取消兜底就绪计时，开关重新开启后只接收新实例', async () => {
    const onVerify = vi.fn().mockResolvedValue(result);
    const onReady = vi.fn();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const props = { elementId: 'login', onVerify, onReady };
    const view = render(<AliyunCaptcha {...props} config={config} />);
    initializations[0].getInstance(instance());
    initializations[0].onError(new Error('init failed'));
    await act(() => vi.advanceTimersByTimeAsync(5100));
    expect(onReady).not.toHaveBeenCalled();
    view.rerender(
      <AliyunCaptcha {...props} config={{ ...config, openCaptcha: 0 }} />,
    );
    view.rerender(<AliyunCaptcha {...props} config={config} />);
    expect(initializations).toHaveLength(2);
    initializations[1].getInstance(instance());
    await act(() => vi.advanceTimersByTimeAsync(5100));
    expect(onReady).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('StrictMode 重跑初始化后，首轮回调不会被新实例接纳', async () => {
    const onVerify = vi.fn().mockResolvedValue(result);
    const onReady = vi.fn();
    render(
      <StrictMode>
        <AliyunCaptcha
          config={config}
          elementId="login"
          onVerify={onVerify}
          onReady={onReady}
        />
      </StrictMode>,
    );
    expect(initializations).toHaveLength(1);
    const first = instance();
    initializations[0].getInstance(first);
    await act(async () => {
      await Promise.resolve();
    });
    expect(first.destroyCaptcha).toHaveBeenCalledOnce();
    expect(initializations).toHaveLength(2);
    initializations[1].getInstance(instance());
    await act(() => vi.advanceTimersByTimeAsync(5100));
    await initializations[0].captchaVerifyCallback('old token');
    await initializations[1].captchaVerifyCallback('new token');
    expect(onReady).toHaveBeenCalledOnce();
    expect(onVerify).toHaveBeenCalledOnce();
    expect(onVerify.mock.calls[0][0]).toBe('new token');
  });

  it('扫码往返暂停业务验证，复用实例并使上次激活期间的等待上下文失效', async () => {
    const contexts: CaptchaVerificationContext[] = [];
    const onVerify = vi.fn(
      async (_param: string, context: CaptchaVerificationContext) => {
        contexts.push(context);
        return result;
      },
    );
    const onReadyChange = vi.fn();
    const props = { config, elementId: 'login', onVerify, onReadyChange };
    const view = render(<AliyunCaptcha {...props} />);
    const current = instance();
    const sdk = initializations[0];
    sdk.getInstance(current);
    await act(() => vi.advanceTimersByTimeAsync(5100));
    await sdk.captchaVerifyCallback('first');
    expect(contexts[0].isCurrent()).toBe(true);
    view.rerender(<AliyunCaptcha {...props} active={false} />);
    expect(onReadyChange).toHaveBeenLastCalledWith(false);
    await sdk.captchaVerifyCallback('paused');
    expect(onVerify).toHaveBeenCalledOnce();
    view.rerender(<AliyunCaptcha {...props} active />);
    expect(contexts[0].isCurrent()).toBe(false);
    expect(onReadyChange).toHaveBeenLastCalledWith(true);
    expect(initializations).toHaveLength(1);
    expect(current.destroyCaptcha).not.toHaveBeenCalled();
    await sdk.captchaVerifyCallback('current');
    expect(onVerify).toHaveBeenCalledTimes(2);
  });
});
