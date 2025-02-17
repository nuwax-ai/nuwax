import { SUCCESS_CODE } from '@/constants/codes.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { message } from 'antd';

// 运行时配置 todo 待完善
export const request: any = {
  timeout: 10000,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },

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
      return { ...config };
    },
  ],

  responseInterceptors: [
    async (response) => {
      // 拦截响应数据，进行个性化处理
      const { data } = response;
      if (data.code === SUCCESS_CODE) {
        return response;
      } else {
        message.warning(data.message);
      }
    },
  ],
};
