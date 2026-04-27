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
   * 在此处直接发起业务请求，将真实结果返回给 SDK，
   * SDK 据此决定是否显示验证码错误状态，并调用 onBizResultCallback。
   */
  const captchaVerifyCallback = useCallback(
    async (captchaVerifyParam: any): Promise<CaptchaVerifyResult> => {
      const param = normalizeCaptchaVerifyParam(captchaVerifyParam);
      return onVerifyRef.current(param);
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
