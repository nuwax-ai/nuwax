import {
  forwardRef,
  memo,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react';

interface AliyunCaptchaConfig {
  captchaSceneId: string;
  captchaPrefix: string;
  openCaptcha?: boolean | number;
}

export interface CaptchaVerifyResult {
  captchaResult: boolean;
  bizResult: boolean;
}

export interface CaptchaVerificationContext {
  /** 配置变化或组件卸载后，等待中的业务回调也必须停止消费旧参数。 */
  isCurrent: () => boolean;
}

interface CaptchaInstance {
  refresh?: () => void;
  show?: () => void;
  destroyCaptcha?: () => void;
}

const IGNORED_RESULT: CaptchaVerifyResult = {
  captchaResult: true,
  bizResult: true,
};

export const CAPTCHA_SAFETY_INTERVAL_MS = 2100;
// 首轮设备指纹采集晚于实例交付；慢网实测需要额外的首轮采集窗口。
const CAPTCHA_INITIAL_READY_DELAY_MS = 5000;
let initializing = false;
const initializationQueue: Array<() => void> = [];

// SDK 初始化期间会共享内部回调入口，必须等上一轮结束才能开始下一轮。
function scheduleInitialization(start: (finished: () => void) => void) {
  const run = () => {
    initializing = true;
    let finished = false;
    start(() => {
      if (finished) return;
      finished = true;
      void Promise.resolve().then(() => {
        initializing = false;
        initializationQueue.shift()?.();
      });
    });
  };
  if (initializing) initializationQueue.push(run);
  else run();
}

declare global {
  interface Window {
    initAliyunCaptcha: (options: any) => void;
    /** SDK 交出实例的时间戳，用于保障实例就绪到验证 >2s。 */
    __captchaInitAt?: number;
  }
}

export interface AliyunCaptchaRef {
  refresh: () => void;
  show: () => void;
}

interface AliyunCaptchaProps {
  config: AliyunCaptchaConfig;
  elementId: string;
  /**
   * 验证码通过后由 SDK 调用，在此处发起业务请求。
   * 返回 captchaResult（验证码是否有效）和 bizResult（业务是否成功）给 SDK。
   */
  onVerify: (
    captchaVerifyParam: string,
    context: CaptchaVerificationContext,
  ) => Promise<CaptchaVerifyResult>;
  /**
   * SDK 根据 captchaVerifyCallback 的 bizResult 回调。
   * 可用于处理业务失败时的 UI 重置，通常不需要实现。
   */
  onBizResult?: (bizResult: boolean) => void;
  onReady?: () => void;
  onInitError?: () => void;
  onReadyChange?: (ready: boolean) => void;
  /** 扫码面板暂停消费验证码，重新进入账号面板时复用已初始化的实例。 */
  active?: boolean;
}

/**
 * 将 SDK 回调的验证码参数统一规范成后端约定的 string。
 *
 * SDK 在不同场景可能返回：
 * - 纯字符串
 * - null / undefined
 * - JSON 对象（需 stringify）
 * - 被 JSON.stringify 包裹过一层的字符串（需解一层）
 * - 包含 captchaVerifyParam 属性的包装对象
 */
function normalizeCaptchaVerifyParam(captchaVerifyParam: any): string {
  if (captchaVerifyParam === null || captchaVerifyParam === undefined) {
    return '';
  }
  if (typeof captchaVerifyParam === 'string') {
    const trimmed = captchaVerifyParam.trim();
    if (!trimmed) return '';
    // 兼容 "\"{...}\"" 这类字符串二次序列化场景
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        return normalizeCaptchaVerifyParam(parsed);
      } catch {
        /* 非 JSON，按原样使用 */
      }
    }
    return trimmed;
  }
  if (typeof captchaVerifyParam === 'object') {
    if ('captchaVerifyParam' in captchaVerifyParam) {
      return normalizeCaptchaVerifyParam(
        (captchaVerifyParam as any).captchaVerifyParam,
      );
    }
    try {
      return JSON.stringify(captchaVerifyParam);
    } catch {
      return '';
    }
  }
  return String(captchaVerifyParam);
}

const AliyunCaptcha = forwardRef<AliyunCaptchaRef, AliyunCaptchaProps>(
  (
    {
      config,
      elementId,
      onVerify,
      onBizResult,
      onReady,
      onInitError,
      onReadyChange,
      active = true,
    },
    ref,
  ) => {
    const captchaInstanceRef = useRef<CaptchaInstance | null>(null);
    const activeRef = useRef(active);
    activeRef.current = active;
    const activationRef = useRef(0);
    const notifyReadyRef = useRef<() => void>(() => {});
    const { captchaSceneId, captchaPrefix, openCaptcha } = config || {};

    const callbacksRef = useRef({
      onVerify,
      onBizResult,
      onReady,
      onInitError,
      onReadyChange,
    });
    callbacksRef.current = {
      onVerify,
      onBizResult,
      onReady,
      onReadyChange,
      onInitError,
    };

    useImperativeHandle(
      ref,
      () => ({
        refresh: () => captchaInstanceRef.current?.refresh?.(),
        show: () => captchaInstanceRef.current?.show?.(),
      }),
      [],
    );

    // 回调归属于这次初始化，不能因新实例已存在而重新接纳旧实例的迟到回调。
    useLayoutEffect(() => {
      let disposed = false;
      let instance: CaptchaInstance | null = null;
      let ready = false;
      let failed = false;
      let readyTimer: number | undefined;
      let initAt: number | undefined;
      const clearReadyTimer = () => window.clearTimeout(readyTimer);
      const updateReady = (value: boolean) => {
        ready = value;
        callbacksRef.current.onReadyChange?.(value && activeRef.current);
      };
      notifyReadyRef.current = () => {
        if (!disposed) updateReady(ready);
      };
      const markReady = () => {
        if (disposed || failed || !instance || ready) return;
        clearReadyTimer();
        updateReady(true);
        if (activeRef.current) callbacksRef.current.onReady?.();
      };
      const cleanup = () => {
        disposed = true;
        clearReadyTimer();
        captchaInstanceRef.current = null;
        if (initAt !== undefined && window.__captchaInitAt === initAt) {
          delete window.__captchaInitAt;
        }
        updateReady(false);
        // SDK 必须先销毁自己创建的节点，再由 React 移除容器。
        instance?.destroyCaptcha?.();
      };

      updateReady(false);
      if (!openCaptcha) return cleanup;
      if (!captchaSceneId || !captchaPrefix) {
        callbacksRef.current.onInitError?.();
        return cleanup;
      }

      scheduleInitialization((finished) => {
        if (disposed) {
          finished();
          return;
        }
        // V2 使用 captchaVerifyCallback。传 success 会让 SDK 切到 V3，不能用它通知就绪。
        let timeout: number;
        const failInitialization = (error: unknown) => {
          window.clearTimeout(timeout);
          if (!disposed && !failed) {
            failed = true;
            clearReadyTimer();
            updateReady(false);
            callbacksRef.current.onInitError?.();
            console.warn('[AliyunCaptcha] init failed', error);
          }
          finished();
        };
        // 即使已卸载也要释放队列，否则没有返回实例的初始化会阻塞后续页面。
        timeout = window.setTimeout(
          () => failInitialization('getInstance timeout'),
          12000,
        );
        try {
          window.initAliyunCaptcha({
            SceneId: captchaSceneId,
            prefix: captchaPrefix,
            mode: 'popup',
            element: '#captcha-element',
            button: `#${elementId}`,
            getInstance: (value: CaptchaInstance | null) => {
              if (!value) return;
              window.clearTimeout(timeout);
              if (disposed) {
                // 上次初始化在卸载后才完成，先销毁，再允许队列中的新初始化。
                if (!instance) {
                  instance = value;
                  value.destroyCaptcha?.();
                }
                finished();
                return;
              }
              const firstInstance = !instance;
              instance = value;
              captchaInstanceRef.current = value;
              initAt = Date.now();
              window.__captchaInitAt = initAt;
              // SDK 内部从无痕升级到滑块属于同一次登录，不能清掉正在等待的业务回调。
              if (firstInstance) {
                clearReadyTimer();
                readyTimer = window.setTimeout(
                  markReady,
                  CAPTCHA_INITIAL_READY_DELAY_MS,
                );
              }
              finished();
            },
            onError: failInitialization,
            captchaVerifyCallback: (
              value: unknown,
              callback?: (result: CaptchaVerifyResult) => void,
            ): Promise<CaptchaVerifyResult> | void => {
              // 销毁后的 ES5 回调也不能再执行 SDK 收尾，否则会访问已移除的 DOM。
              if (disposed) {
                if (typeof callback !== 'function') {
                  return Promise.resolve(IGNORED_RESULT);
                }
                return;
              }
              const activation = activationRef.current;
              const isCurrent = () =>
                !disposed &&
                activeRef.current &&
                activationRef.current === activation;
              const resultPromise =
                instance && ready && activeRef.current
                  ? Promise.resolve().then(() => {
                      if (!isCurrent()) return IGNORED_RESULT;
                      return callbacksRef.current.onVerify(
                        normalizeCaptchaVerifyParam(value),
                        { isCurrent },
                      );
                    })
                  : Promise.resolve(IGNORED_RESULT);
              if (typeof callback === 'function') {
                void resultPromise
                  .then(
                    (result) => {
                      if (isCurrent()) callback(result);
                    },
                    () => {
                      if (isCurrent()) callback(IGNORED_RESULT);
                    },
                  )
                  .catch((error: unknown) => {
                    if (!disposed)
                      console.warn('[AliyunCaptcha] callback failed', error);
                  });
                return;
              }
              return resultPromise;
            },
            onBizResultCallback: (value: unknown) => {
              if (!disposed && activeRef.current && instance) {
                callbacksRef.current.onBizResult?.(value === true);
              }
            },
            slideStyle: { width: 360, height: 40 },
            language: 'cn',
          });
        } catch (error) {
          failInitialization(error);
        }
      });
      return cleanup;
    }, [captchaSceneId, captchaPrefix, openCaptcha, elementId]);

    useLayoutEffect(() => {
      activationRef.current += 1;
      notifyReadyRef.current();
    }, [active]);

    return (
      <div className="captcha-a" hidden={!active}>
        <div id="captcha-element"></div>
      </div>
    );
  },
);

export default memo(AliyunCaptcha);
