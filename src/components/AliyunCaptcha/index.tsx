import { FC, memo, useCallback, useEffect, useRef, useState } from 'react';

interface AliyunCaptchaConfig {
  captchaSceneId: string;
  captchaPrefix: string;
  openCaptcha?: boolean;
}

export interface CaptchaVerifyResult {
  captchaResult: boolean;
  bizResult: boolean;
}

declare global {
  interface Window {
    initAliyunCaptcha: (options: any) => void;
  }
}

interface AliyunCaptchaProps {
  config: AliyunCaptchaConfig;
  elementId: string;
  /**
   * 验证码通过后由 SDK 调用，在此处发起业务请求。
   * 返回 captchaResult（验证码是否有效）和 bizResult（业务是否成功）给 SDK。
   */
  onVerify: (captchaVerifyParam: string) => Promise<CaptchaVerifyResult>;
  /**
   * SDK 根据 captchaVerifyCallback 的 bizResult 回调。
   * 可用于处理业务失败时的 UI 重置，通常不需要实现。
   */
  onBizResult?: (bizResult: boolean) => void;
  onReady?: () => void;
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

const AliyunCaptcha: FC<AliyunCaptchaProps> = ({
  config,
  elementId,
  onVerify,
  onBizResult,
  onReady,
}) => {
  const captchaInstanceRef = useRef<any>(null);
  const [captchaInited, setCaptchaInited] = useState(false);

  // 解构 primitive 值，避免 config 对象引用变化触发 effect 重新初始化
  const { captchaSceneId, captchaPrefix, openCaptcha } = config || {};

  // 使用 ref 持有最新回调，避免 SDK init 时捕获过期闭包
  const onVerifyRef = useRef(onVerify);
  onVerifyRef.current = onVerify;
  const onBizResultRef = useRef(onBizResult);
  onBizResultRef.current = onBizResult;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const getInstance = useCallback((instance: any) => {
    captchaInstanceRef.current = instance;
    if (instance) setCaptchaInited(true);
  }, []);

  /**
   * SDK 验证通过后调用此函数。
   *
   * SDK 支持两种调用模式：
   * - ES6 Promise 模式：captchaVerifyCallback(param) → 返回值作为验证结果
   * - ES5 回调模式：captchaVerifyCallback(param, callback) → 调用 callback(result)
   *
   * 在无痕验证（TRACELESS）等场景下 SDK 可能使用 ES5 回调模式，
   * 如果忽略 callback 参数会导致 SDK 收不到结果、超时后重新生成验证码。
   */
  const captchaVerifyCallback = useCallback(
    (
      captchaVerifyParam: any,
      callback?: (result: CaptchaVerifyResult) => void,
    ): Promise<CaptchaVerifyResult> | void => {
      const param = normalizeCaptchaVerifyParam(captchaVerifyParam);
      const resultPromise = onVerifyRef.current(param);

      if (typeof callback === 'function') {
        // ES5 回调模式：通过 callback 传递验证结果给 SDK
        // catch 确保业务异常时 SDK 也能收到反馈，避免 SDK 超时重试
        resultPromise
          .then((result) => callback(result))
          .catch(() => callback({ captchaResult: true, bizResult: true }));
        return;
      }

      // ES6 Promise 模式：通过返回值传递验证结果给 SDK
      return resultPromise;
    },
    [],
  );

  const onBizResultCallback = useCallback((bizParam?: any) => {
    onBizResultRef.current?.(bizParam === true);
  }, []);

  const cleanupCaptchaElements = useCallback(() => {
    document.getElementById('aliyunCaptcha-mask')?.remove();
    document.getElementById('aliyunCaptcha-window-popup')?.remove();
    captchaInstanceRef.current?.destroy?.();
    captchaInstanceRef.current = null;
  }, []);

  useEffect(() => {
    if (!captchaSceneId || !captchaPrefix || !openCaptcha) return;
    if (captchaInstanceRef.current) return;

    window.initAliyunCaptcha({
      SceneId: captchaSceneId,
      prefix: captchaPrefix,
      mode: 'popup',
      element: '#captcha-element',
      button: `#${elementId}`,
      captchaVerifyCallback,
      onBizResultCallback,
      getInstance,
      slideStyle: { width: 360, height: 40 },
      language: 'cn',
    });

    return cleanupCaptchaElements;
  }, [
    captchaSceneId,
    captchaPrefix,
    openCaptcha,
    elementId,
    captchaVerifyCallback,
    onBizResultCallback,
    getInstance,
    cleanupCaptchaElements,
  ]);

  useEffect(() => {
    if (captchaInited) onReadyRef.current?.();
  }, [captchaInited]);

  return (
    <div className="captcha-a">
      <div id="captcha-element"></div>
    </div>
  );
};

export default memo(AliyunCaptcha);
