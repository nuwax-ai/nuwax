import { hasHostBridge, isDesktopHost, native } from './index';

export interface PaymentWindow {
  open: (url: string) => Promise<boolean>;
  closePending: () => void;
}

/** 点击事件内预备收银台：客户端新窗口，浏览器新页签。 */
export function preparePaymentWindow(): PaymentWindow | null {
  const hosted = hasHostBridge();
  let pending: Window | null = null;
  let cancelled = false;

  const closePending = () => {
    cancelled = true;
    const paymentWindow = pending;
    pending = null;
    if (paymentWindow && !paymentWindow.closed) paymentWindow.close();
  };

  if (!hosted) {
    try {
      // 浏览器必须在点击时开页签，等待下单接口后再开会被拦截。
      pending = window.open('', '_blank');
      if (!pending) return null;
      pending.opener = null;
    } catch {
      closePending();
      return null;
    }
  }

  return {
    closePending,
    async open(url) {
      if (cancelled) return false;
      try {
        const target = new URL(url, window.location.href);
        if (!['http:', 'https:'].includes(target.protocol)) return false;
        if (hosted && isDesktopHost()) {
          return (await native.openWindow(target.href)).success;
        }
        if (hosted) {
          // 社区宿主沿用普通弹窗；Electron 无需预开且会拒绝 about:blank。
          window.open(target.href, '_blank', 'noopener,noreferrer');
          return true;
        }
        if (!pending || pending.closed) return false;
        pending.location.replace(target.href);
        // 已进入收银台的页签由用户关闭，组件卸载只清理尚未跳转的空白页。
        pending = null;
        return true;
      } catch {
        return false;
      }
    },
  };
}
