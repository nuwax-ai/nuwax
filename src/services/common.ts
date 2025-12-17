import {
  AGENT_NOT_EXIST,
  AGENT_SERVICE_RUNNING,
  REDIRECT_LOGIN,
  SUCCESS_CODE,
  USER_NO_LOGIN,
} from '@/constants/codes.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import type { RequestResponse } from '@/types/interfaces/request';
import { redirectToLogin } from '@/utils/router';
import { RequestConfig } from '@@/plugin-request/request';
import { message } from 'antd';
import { clearLoginStatusCache } from './userService';

/**
 * 判断请求是否为不需要显示错误消息的API
 * @param url 请求URL
 * @returns 是否应该隐藏错误提示
 */
const beSilentRequestList = (url: string): boolean => {
  // 不展示错误消息的API路径列表
  const list = [
    '/api/notify/event/collect/batch', // 事件轮询
    '/api/notify/event/clear', // 事件清除
    '/api/user/getLoginInfo', // 获取登录信息
    '/api/custom-page/keepalive', // 开发页面保活
    '/api/custom-page/start-dev', // 开发页面启动
    '/api/custom-page/restart-dev', // 开发页面重启
    '/api/custom-page/get-dev-log', // 开发页面获取日志
    // 可以在此添加其他不需要显示错误消息的API
  ];
  return list.some((api) => url.includes(api));
};

/**
 * 错误抛出函数
 * 将API错误包装成标准格式的错误对象
 */
const errorThrower = (res: RequestResponse<null>) => {
  const {
    code,
    displayCode,
    message: errorMessage,
    data,
    debugInfo,
    success,
    tid,
  } = res;
  if (!success) {
    const error: any = new Error(errorMessage);
    error.name = 'BizError';
    error.info = {
      code,
      displayCode,
      message: errorMessage,
      data,
      debugInfo,
      tid,
    };
    return error; // 返回错误对象，而不是直接抛出
  }
};

/**
 * 全局错误处理器
 * 处理所有请求的错误情况，并显示适当的错误消息
 */
const errorHandler = (error: any, opts: any) => {
  if (!error) {
    return;
  }
  // 检查是否为不需要显示错误消息的请求
  const url = error?.config?.url || opts?.config?.url;
  const isSilentRequest = url && beSilentRequestList(url);

  if (isSilentRequest) {
    return;
  }

  if (error.name === 'BizError') {
    // 处理业务错误
    const errorInfo: RequestResponse<null> | undefined = error.info;
    if (errorInfo) {
      const { code, message: errorMessage } = errorInfo;

      // 已经有后台Agent服务正在运行
      if (code === AGENT_SERVICE_RUNNING) {
        return Promise.reject(errorInfo);
      }

      // 根据错误码处理不同情况
      switch (code) {
        // 用户未登录，跳转到登录页
        case USER_NO_LOGIN:
          localStorage.clear();
          clearLoginStatusCache();
          redirectToLogin(-1);
          break;

        // 重定向到登录页
        case REDIRECT_LOGIN:
          clearLoginStatusCache();
          window.location.href = errorMessage;
          break;

        // 智能体不存在或已下架
        case AGENT_NOT_EXIST:
          message.warning(errorMessage);
          break;

        // 默认错误处理
        default:
          // 只有当请求不在过滤列表中才显示错误消息
          message.warning(errorMessage);
          break;
      }

      /**
       * 统一返回错误信息，方便调用方处理
       * return Promise.reject() 会立即终止当前函数的执行，并将错误状态传递给接口调用方。所以此处注释掉了
       */
      // return Promise.reject();
    }
  } else if (error.response) {
    // 处理HTTP错误
    // message.error(`请求错误 ${error.response.status}`);
    message.error(`网络异常`);
    return Promise.reject();
  } else if (error.request) {
    // 处理请求超时
    message.error('服务器无响应，请重试');
    return Promise.reject();
  } else {
    // 处理网络错误
    message.error('网络异常，无法连接服务器');
    return Promise.reject();
  }
};

/**
 * 请求拦截器列表
 * 对所有请求进行预处理
 */
const requestInterceptors = [
  // 添加基础URL
  (url: string, options: any) => {
    const newUrl = process.env.BASE_URL + url;
    return { url: newUrl, options };
  },

  // 添加认证头和通用头信息
  (config: any) => {
    // 添加token认证
    const token = localStorage.getItem(ACCESS_TOKEN) ?? '';
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 添加通用头信息
    config.headers['Content-Type'] = 'application/json';
    config.headers['Accept'] = 'application/json, text/plain, */*';

    return { ...config };
  },
];

/**
 * 响应拦截器列表
 * 对所有响应进行预处理
 */
const responseInterceptors = [
  async (response: any) => {
    // 拦截响应数据，进行错误处理
    const { data = {} as any, config } = response;

    // 如果响应类型是blob，直接返回响应对象
    if (config?.responseType === 'blob') {
      return response;
    }

    // 当响应码不是成功时，进行错误处理
    if (data.code !== SUCCESS_CODE) {
      if (config?.skipErrorHandler) return response; // 跳过错误处理
      const error = errorThrower?.(data);

      if (error) {
        // 如果errorThrower返回了错误对象，使用errorHandler处理它
        return errorHandler?.(error, { config }) || response;
      }
    }

    return response;
  },
];

export const request: RequestConfig = {
  errorConfig: {
    errorThrower,
    errorHandler,
  },
  requestInterceptors,
  responseInterceptors,
};
