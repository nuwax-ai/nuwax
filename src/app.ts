import { SUCCESS_CODE } from '@/constants/codes.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { message } from 'antd';

// 运行时配置 todo 待完善
export const request: any = {
  timeout: 10000,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
  // 错误处理： umi@3 的错误处理方案。
  errorConfig: {
    // 错误抛出
    errorThrower: (res) => {
      //todo 处理错误逻辑
      // const { success, displayCode, message } = res;
      // if (!success) {
      //   const error: any = new Error(message);
      //   error.displayCode = displayCode;
      //   error.message = message;
      //   throw error; // 抛出自制的错误
      // }
    },

    // 错误接收及处理
    errorHandler: (error: any, opts: any) => {
      if (opts?.skipErrorHandler) throw error;
      //TODO  我们的 errorThrower 抛出的错误。
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
        message.warning(data.message);
      }
      return response;
    },
  ],
};
