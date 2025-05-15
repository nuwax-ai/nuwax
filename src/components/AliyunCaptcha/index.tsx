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
  };
  onBizResultCallback: () => void;
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
  doAction: (captchaVerifyParam: any) => void;
  onReady?: () => void; // 使用可选属性避免undefined调用
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
}) => {
  const [captchaInited, setCaptchaInited] = useState<boolean>(false);
  // 使用ref记录onReady是否已经调用过，避免重复调用
  const onReadyCalledRef = useRef<boolean>(false);

  // 使用useCallback缓存回调函数，避免不必要的重新渲染
  const captchaVerifyCallback = (captchaVerifyParam: any) => {
    doAction(captchaVerifyParam);
    return {
      captchaResult: true,
      bizResult: true,
    };
  };

  // 清理验证码相关DOM元素
  const cleanupCaptchaElements = useCallback(() => {
    document.getElementById('aliyunCaptcha-mask')?.remove();
    document.getElementById('aliyunCaptcha-window-popup')?.remove();
  }, []);

  // 获取验证码实例
  const getInstance = useCallback((instance: any) => {
    if (instance) {
      setCaptchaInited(true);
    }
  }, []);

  // 初始化验证码
  useEffect(() => {
    // 重置onReady调用状态
    onReadyCalledRef.current = false;

    // 初始化阿里云验证码
    if (
      config?.captchaSceneId &&
      config?.captchaPrefix &&
      config?.openCaptcha
    ) {
      window.initAliyunCaptcha({
        SceneId: config.captchaSceneId, // 场景ID
        prefix: config.captchaPrefix, // 身份标
        mode: 'popup', // 验证码模式：弹出式
        element: '#captcha-element', // 渲染验证码的元素
        button: `#${elementId}`, // 触发验证码弹窗的元素
        captchaVerifyCallback, // 业务请求回调函数
        onBizResultCallback: () => {}, // 业务请求结果回调函数
        getInstance, // 绑定验证码实例函数
        slideStyle: {
          width: 360,
          height: 40,
        }, // 滑块验证码样式
        language: 'cn', // 验证码语言类型
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
      console.log('验证码初始化完成，onReady已调用');
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
