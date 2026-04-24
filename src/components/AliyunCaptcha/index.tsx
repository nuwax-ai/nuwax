import useCaptchaConsume, {
  CaptchaConsumeControl,
  CaptchaTokenSnapshot,
} from '@/hooks/useCaptchaConsume';
import { FC, memo, useCallback, useEffect, useRef, useState } from 'react';

// 阿里云验证码配置类型定义
interface AliyunCaptchaConfig {
  captchaSceneId: string; // 场景ID
  captchaPrefix: string; // 身份标
  openCaptcha?: boolean; // 是否开启验证码
  // 其他可能的配置项
}

// 阿里云验证码初始化选项
interface CaptchaOptions {
  SceneId: string; // 场景ID
  prefix: string; // 身份标
  mode: 'popup' | 'embed'; // 验证码模式：弹出式或嵌入式
  element: string; // 渲染验证码的元素
  button: string; // 触发验证码弹窗的元素
  captchaVerifyCallback: (param: any) => {
    captchaResult: boolean;
    bizResult: boolean;
    captchaVerifyParam?: any;
  };
  onBizResultCallback: (param?: any) => void;
  getInstance: (instance: any) => void;
  slideStyle?: {
    width: number;
    height: number;
  };
  language?: 'cn' | 'tw' | 'en'; // 验证码语言类型
}

// 全局类型声明
declare global {
  interface Window {
    initAliyunCaptcha: (options: CaptchaOptions) => void;
  }
}

interface AliyunCaptchaProps {
  config: AliyunCaptchaConfig;
  elementId: string;
  doAction: (
    captchaVerifyParam: string,
  ) => void | CaptchaConsumeControl | Promise<void | CaptchaConsumeControl>;
  onReady?: () => void; // 使用可选属性避免undefined调用
  /**
   * 业务 action 失败时是否自动刷新验证码实例。
   * 默认 true（保持原行为）；登录页可按需关闭，避免失败后额外触发一次验证码请求。
   */
  refreshOnError?: boolean;
}

/**
 * 阿里云验证码组件
 * @param config - 验证码配置信息
 * @param elementId - 触发验证码的元素ID
 * @param doAction - 验证成功后的回调函数
 * @param onReady - 验证码准备就绪的回调函数
 */
const AliyunCaptcha: FC<AliyunCaptchaProps> = ({
  config,
  elementId,
  doAction,
  onReady,
  refreshOnError = true,
}) => {
  const enableCaptchaDebugLog = process.env.NODE_ENV !== 'production';
  const [captchaInited, setCaptchaInited] = useState<boolean>(false);
  // 使用ref记录onReady是否已经调用过，避免重复调用
  const onReadyCalledRef = useRef<boolean>(false);
  // 使用 ref 保存“最新 token 快照”，避免闭包导致消费旧 token
  const captchaParamRef = useRef<CaptchaTokenSnapshot | null>(null);
  // 记录 token 生成版本，确保每次生成可追踪
  const tokenVersionRef = useRef<number>(0);
  const captchaInstanceRef = useRef<any>(null);

  const { onBizResultCallback } = useCaptchaConsume({
    doAction,
    captchaParamRef,
    captchaInstanceRef,
    refreshOnError,
  });

  /**
   * 将 SDK 返回的验证码参数统一规范成后端约定的 string。
   *
   * 背景：
   * 1. 密码登录接口要求 captchaVerifyParam 为字符串；
   * 2. SDK 在边界场景可能返回对象、空值，或“被 JSON 包装过一层”的字符串；
   * 3. 前端在这里做最小归一化，避免把不稳定形态直接带到请求层。
   *
   * @param rawParam - SDK 回调原始参数
   * @returns 归一化后的验证码参数字符串；无法使用时返回空字符串
   */
  const normalizeCaptchaVerifyParam = useCallback(
    (rawParam: any): string => {
      const rawType = typeof rawParam;

      if (rawParam === null || rawParam === undefined) {
        if (enableCaptchaDebugLog) {
          console.warn('[CaptchaFlow][normalize] rawParam is null/undefined', {
            elementId,
          });
        }
        return '';
      }

      if (typeof rawParam === 'string') {
        const trimmed = rawParam.trim();
        if (!trimmed) {
          if (enableCaptchaDebugLog) {
            console.warn('[CaptchaFlow][normalize] rawParam is empty string', {
              elementId,
            });
          }
          return '';
        }

        // 兼容 “\”{...}\”” 这类”字符串再次序列化”场景，解一层后继续使用。
        try {
          const parsed = JSON.parse(trimmed);
          if (typeof parsed === 'string') {
            if (enableCaptchaDebugLog) {
              console.info('[CaptchaFlow][normalize] path=string→json-unwrap', {
                elementId,
                rawType,
                rawLen: trimmed.length,
                parsedLen: parsed.trim().length,
              });
            }
            return parsed.trim();
          }
          // parsed 是对象，说明 SDK 把 JSON 对象序列化成了字符串传过来
          if (enableCaptchaDebugLog) {
            console.info(
              '[CaptchaFlow][normalize] path=string→json-object(as-is)',
              {
                elementId,
                rawType,
                rawLen: trimmed.length,
                parsedType: typeof parsed,
                parsedKeys:
                  parsed && typeof parsed === 'object'
                    ? Object.keys(parsed)
                    : null,
              },
            );
          }
        } catch {
          // 非 JSON 字符串，按原样使用
          if (enableCaptchaDebugLog) {
            console.info(
              '[CaptchaFlow][normalize] path=string→non-json(as-is)',
              {
                elementId,
                rawType,
                rawLen: trimmed.length,
              },
            );
          }
        }
        return trimmed;
      }

      // SDK 直接返回对象
      try {
        const result = JSON.stringify(rawParam);
        if (enableCaptchaDebugLog) {
          console.info('[CaptchaFlow][normalize] path=object→stringify', {
            elementId,
            rawType,
            rawKeys:
              typeof rawParam === 'object' ? Object.keys(rawParam) : null,
            resultLen: result.length,
          });
        }
        return result;
      } catch {
        if (enableCaptchaDebugLog) {
          console.warn(
            '[CaptchaFlow][normalize] path=object→stringify-failed',
            {
              elementId,
              rawType,
            },
          );
        }
        return String(rawParam);
      }
    },
    [elementId, enableCaptchaDebugLog],
  );

  // 使用useCallback缓存回调函数，避免不必要的重新渲染
  const captchaVerifyCallback = (captchaVerifyParam: any) => {
    const normalizedCaptchaParam =
      normalizeCaptchaVerifyParam(captchaVerifyParam);
    tokenVersionRef.current += 1;
    const snapshot: CaptchaTokenSnapshot = {
      token: normalizedCaptchaParam,
      version: tokenVersionRef.current,
      createdAt: Date.now(),
    };
    captchaParamRef.current = snapshot;
    // 只返回验证结果，不在这里执行业务逻辑
    return {
      captchaResult: true,
      bizResult: true,
    };
  };

  // 清理验证码相关DOM元素
  const cleanupCaptchaElements = useCallback(() => {
    console.info('[AliyunCaptcha] sdk-cleanup', { elementId });
    document.getElementById('aliyunCaptcha-mask')?.remove();
    document.getElementById('aliyunCaptcha-window-popup')?.remove();

    // 尝试销毁实例
    if (
      captchaInstanceRef.current &&
      typeof captchaInstanceRef.current.destroy === 'function'
    ) {
      // console.log('[AliyunCaptcha] 销毁实例');
      captchaInstanceRef.current.destroy();
    }
    captchaInstanceRef.current = null;
  }, []);

  // 获取验证码实例
  const getInstance = useCallback((instance: any) => {
    // console.log('[AliyunCaptcha] 获取实例:', instance);
    captchaInstanceRef.current = instance;
    if (instance) {
      setCaptchaInited(true);
    }
  }, []);

  // 初始化验证码
  useEffect(() => {
    // console.log('[AliyunCaptcha] 组件挂载');
    // 重置onReady调用状态
    onReadyCalledRef.current = false;

    // 初始化阿里云验证码
    if (
      config?.captchaSceneId &&
      config?.captchaPrefix &&
      config?.openCaptcha
    ) {
      // 防止重复初始化
      if (captchaInstanceRef.current) {
        console.info('[AliyunCaptcha] sdk-init-skipped', {
          elementId,
          reason: 'instance already exists',
        });
        return;
      }
      const sdkInitStartTime = Date.now();
      console.info('[AliyunCaptcha] sdk-init-start', { elementId });
      window.initAliyunCaptcha({
        SceneId: config.captchaSceneId, // 场景ID
        prefix: config.captchaPrefix, // 身份标
        mode: 'popup', // 验证码模式：弹出式
        element: '#captcha-element', // 渲染验证码的元素
        button: `#${elementId}`, // 触发验证码弹窗的元素
        captchaVerifyCallback, // 验证回调函数
        onBizResultCallback, // 业务请求结果回调函数
        getInstance, // 绑定验证码实例函数
        slideStyle: {
          width: 360,
          height: 40,
        }, // 滑块验证码样式
        language: 'cn', // 验证码语言类型
      });
      console.info('[AliyunCaptcha] sdk-init-triggered', {
        elementId,
        sdkInitDurationMs: Date.now() - sdkInitStartTime,
      });
    }

    // 组件卸载时清理DOM元素
    return cleanupCaptchaElements;
  }, [config, elementId]);

  // 处理onReady回调
  useEffect(() => {
    // 只有当captchaInited为true且onReady回调未被调用过时才调用
    if (captchaInited) {
      onReady?.();
      console.info('[AliyunCaptcha] sdk-ready', { elementId });
    }

    // 组件卸载时重置状态
    return () => {};
  }, [captchaInited]);

  return (
    <div className="captcha-a">
      <div id="captcha-element"></div>
    </div>
  );
};

export default memo(AliyunCaptcha);
