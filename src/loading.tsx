import AppStartup from '@/components/business-component/AppStartup';

/** 登录代码包尚未加载时衔接启动提示，避免鉴权跳转途中出现空白帧。 */
export default function RouteLoading() {
  return /^\/login\/?$/i.test(window.location.pathname) ? (
    <AppStartup />
  ) : (
    <div />
  );
}
