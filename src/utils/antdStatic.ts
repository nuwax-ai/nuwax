/**
 * antd message 静态方法桥接器
 * 将 message 的静态调用桥接到 App.useApp() 实例，
 * 使其能正确获取 ConfigProvider 的主题和国际化上下文。
 */
import { message as staticMessage } from 'antd';

let _message: typeof staticMessage | undefined;

export function setAntdStaticInstances(instances: {
  message: typeof staticMessage;
  notification: any;
  modal: any;
}) {
  _message = instances.message;
}

function createMethod(key: keyof typeof staticMessage) {
  return (...args: any[]) => {
    const fn = (_message || staticMessage)[key];
    return typeof fn === 'function'
      ? fn.apply(_message || staticMessage, args)
      : undefined;
  };
}

export const message = {
  success: createMethod('success'),
  error: createMethod('error'),
  info: createMethod('info'),
  warning: createMethod('warning'),
  loading: createMethod('loading'),
  open: createMethod('open'),
  destroy: createMethod('destroy'),
} as unknown as typeof staticMessage;
