import {
  AGENT_NOT_EXIST,
  REDIRECT_LOGIN,
  SUCCESS_CODE,
  USER_NO_LOGIN,
} from '@/constants/codes.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import type { RequestResponse } from '@/types/interfaces/request';
import { RequestConfig } from '@@/plugin-request/request';
import { message } from 'antd';
import { history } from 'umi';

// 错误抛出函数
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
    // 不直接抛出自制的错误，而是返回它
    return error;
  }
};

// 错误处理器
const errorHandler = (error: any, opts: any) => {
  if (!error) {
    return;
  }
  if (opts?.skipErrorHandler) throw error;

  // 我们的 errorThrower 抛出的错误
  if (error.name === 'BizError') {
    const errorInfo: RequestResponse<null> | undefined = error.info;
    if (errorInfo) {
      const { code, message: errorMessage } = errorInfo;
      switch (code) {
        // 用户未登录，使用 history.push 进行跳转
        case USER_NO_LOGIN:
          localStorage.clear();
          history.push('/login');
          break;
        // 重定向到登录页
        case REDIRECT_LOGIN:
          window.location.href = errorMessage;
          break;
        // 智能体不存在或已下架
        case AGENT_NOT_EXIST:
          message.warning(errorMessage);
          break;
        default:
          message.warning(errorMessage);
      }
      // 返回一个空的 Promise.reject 以防止错误继续传播
      return Promise.reject();
    }
  } else if (error.response) {
    // Axios 的错误
    // 请求成功发出且服务器也响应了状态码，但状态代码超出了 2xx 的范围
    message.error(`请求错误 ${error.response.status}`);
    // 返回一个空的 Promise.reject 以防止错误继续传播
    return Promise.reject();
  } else if (error.request) {
    // 请求已经成功发起，但没有收到响应
    message.error('服务器无响应，请重试');
    return Promise.reject();
  } else {
    // 发送请求时出了点问题
    message.error('您的网络发生异常，无法连接服务器');
    // 返回一个空的 Promise.reject 以防止错误继续传播
    return Promise.reject();
  }
};

// 请求拦截器
const requestInterceptors = [
  // 添加基础 URL
  (url: string, options: any) => {
    const newUrl = process.env.BASE_URL + url;
    return { url: newUrl, options };
  },
  // 添加认证头
  (config: any) => {
    const token = localStorage.getItem(ACCESS_TOKEN) ?? '';
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['Content-Type'] = 'application/json';
    config.headers['Accept'] = 'application/json, text/plain, */*';
    return { ...config };
  },
];

// 响应拦截器
const responseInterceptors = [
  async (response: any) => {
    // 拦截响应数据，进行个性化处理
    const { data = {} as any } = response;
    console.log(response);
    if (data.code !== SUCCESS_CODE) {
      // 使用 errorConfig 中的 errorThrower 处理错误
      const error = errorThrower?.(data);

      if (error) {
        // 如果 errorThrower 返回了错误对象，使用 errorHandler 处理它
        return errorHandler?.(error, {}) || response;
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
