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
  // 使用ref保存验证参数，避免闭包问题
  const captchaParamRef = useRef<any>(null);
  const captchaInstanceRef = useRef<any>(null);

  // 使用useCallback缓存回调函数，避免不必要的重新渲染
  const captchaVerifyCallback = (captchaVerifyParam: any) => {
    // 保存验证参数到ref，供业务回调使用
    console.log('[AliyunCaptcha] 验证参数生成:', captchaVerifyParam);
    captchaParamRef.current = captchaVerifyParam;
    // 只返回验证结果，不在这里执行业务逻辑
    return {
      captchaResult: true,
      bizResult: true,
    };
  };

  // 业务结果回调 - 在验证成功后执行业务逻辑
  const onBizResultCallback = useCallback(() => {
    // 检查验证参数是否存在，防止重复使用
    if (!captchaParamRef.current) {
      console.warn(
        '[AliyunCaptcha] Blocked double usage: Token already consumed or invalid.',
      );
      return;
    }

    // 在业务回调中执行登录逻辑，从ref中读取验证参数
    console.log('[AliyunCaptcha] 消费 Token:', captchaParamRef.current);
    doAction(captchaParamRef.current);

    // 消费后刷新实例，确保下次验证生成新的token
    if (
      captchaInstanceRef.current &&
      typeof captchaInstanceRef.current.refresh === 'function'
    ) {
      console.log('[AliyunCaptcha] 刷新实例以重置状态');
      captchaInstanceRef.current.refresh();
    }

    // 消费后立即置空，防止二次使用
    captchaParamRef.current = null;
  }, [doAction]);

  // 清理验证码相关DOM元素
  const cleanupCaptchaElements = useCallback(() => {
    console.log('[AliyunCaptcha] 清理资源');
    document.getElementById('aliyunCaptcha-mask')?.remove();
    document.getElementById('aliyunCaptcha-window-popup')?.remove();

    // 尝试销毁实例
    if (
      captchaInstanceRef.current &&
      typeof captchaInstanceRef.current.destroy === 'function'
    ) {
      console.log('[AliyunCaptcha] 销毁实例');
      captchaInstanceRef.current.destroy();
    }
    captchaInstanceRef.current = null;
  }, []);

  // 获取验证码实例
  const getInstance = useCallback((instance: any) => {
    console.log('[AliyunCaptcha] 获取实例:', instance);
    captchaInstanceRef.current = instance;
    if (instance) {
      setCaptchaInited(true);
    }
  }, []);

  // 初始化验证码
  useEffect(() => {
    console.log('[AliyunCaptcha] 组件挂载');
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
        console.log('[AliyunCaptcha] 实例已存在，跳过初始化');
        return;
      }
      console.log('[AliyunCaptcha] 初始化 SDK...');
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
