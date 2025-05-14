import { useEffect } from 'react';

// 为window对象添加阿里云验证码方法的类型声明
declare global {
  interface Window {
    initAliyunCaptcha: (options: any) => void;
  }
}

const AliyunCaptcha: React.FC<{
  config: any;
  elementId: string;
  doAction: (captchaVerifyParam: any) => void;
}> = ({ config, elementId, doAction }) => {
  const captchaVerifyCallback = (captchaVerifyParam: any) => {
    doAction(captchaVerifyParam);
    return {
      captchaResult: true,
      bizResult: true,
    };
  };
  useEffect(() => {
    //如果 有场景ID 或者 身份标 或者 关闭验证码
    window.initAliyunCaptcha({
      SceneId: config.captchaSceneId, // 场景ID。根据步骤二新建验证场景后，您可以在验证码场景列表，获取该场景的场景ID
      prefix: config.captchaPrefix, // 身份标。开通阿里云验证码2.0后，您可以在控制台概览页面的实例基本信息卡片区域，获取身份标
      mode: 'popup', // 验证码模式。popup表示要集成的验证码模式为弹出式。无需修改
      element: '#captcha-element', // 页面上预留的渲染验证码的元素，与原代码中预留的页面元素保持一致。
      button: '#' + elementId, // 触发验证码弹窗的元素。button表示单击登录按钮后，触发captchaVerifyCallback函数。您可以根据实际使用的元素修改element的值
      captchaVerifyCallback: captchaVerifyCallback, // 业务请求(带验证码校验)回调函数，无需修改
      onBizResultCallback: () => {}, // 业务请求结果回调函数，无需修改
      getInstance: () => {}, // 绑定验证码实例函数，无需修改
      slideStyle: {
        width: 360,
        height: 40,
      }, // 滑块验证码样式，支持自定义宽度和高度，单位为px。其中，width最小值为320 px
      language: 'cn', // 验证码语言类型，支持简体中文（cn）、繁体中文（tw）、英文（en）
    });
    return () => {
      // 必须删除相关元素，否则再次mount多次调用 initAliyunCaptcha 会导致多次回调 captchaVerifyCallback
      document.getElementById('aliyunCaptcha-mask')?.remove();
      document.getElementById('aliyunCaptcha-window-popup')?.remove();
    };
  }, []);

  return (
    <div className="captcha-a">
      <div id="captcha-element"></div>
    </div>
  );
};

export default AliyunCaptcha;
