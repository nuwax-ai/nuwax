import { SUCCESS_CODE, USER_NO_LOGIN } from '@/constants/codes.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import type { RequestResponse } from '@/types/interfaces/request';
import { RequestConfig } from '@@/plugin-request/request';
import { message } from 'antd';
import { history } from 'umi';

export const request: RequestConfig = {
  errorConfig: {
    // 错误抛出
    errorThrower: (res: RequestResponse<null>) => {
      const { code, displayCode, message, data, debugInfo, success, tid } = res;

      if (!success) {
        const error: any = new Error(message);
        error.name = 'BizError';
        error.info = { code, displayCode, message, data, debugInfo, tid };
        throw error; // 抛出自制的错误
      }
    },

    // 错误接收及处理
    errorHandler: (error: any, opts: any) => {
      if (opts?.skipErrorHandler) throw error;
      // 我们的 errorThrower 抛出的错误。
      if (error.name === 'BizError') {
        const errorInfo: RequestResponse<null> | undefined = error.info;
        if (errorInfo) {
          const { code } = errorInfo;
          //用户未登录 , 使用 history.push 进行跳转
          if (code === USER_NO_LOGIN) {
            history.push('/login');
          }
        }
      } else if (error.response) {
        // Axios 的错误
        // 请求成功发出且服务器也响应了状态码，但状态代码超出了 2xx 的范围
        message.error(`Response status:${error.response.status}`);
      } else if (error.request) {
        // 请求已经成功发起，但没有收到响应
        // \`error.request\` 在浏览器中是 XMLHttpRequest 的实例，
        // 而在node.js中是 http.ClientRequest 的实例
        message.error('None response! Please retry.');
      } else {
        // 发送请求时出了点问题
        message.error('Request error, please retry.');
      }
    },
  },
  requestInterceptors: [
    // 直接写一个 function，作为拦截器
    (url, options) => {
      // do something
      const new_url = process.env.BASE_URL + url;
      return { url: new_url, options };
    },
    (config) => {
      const token = localStorage.getItem(ACCESS_TOKEN) ?? '';
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      config.headers['Content-Type'] = 'application/json';
      config.headers['Accept'] = 'application/json, text/plain, */*';
      return { ...config };
    },
  ],

  responseInterceptors: [
    async (response) => {
      // 拦截响应数据，进行个性化处理
      const { data = {} as any } = response;
      if (data.code !== SUCCESS_CODE) {
        message.error(data.message);
      }
      return response;
    },
  ],
};
