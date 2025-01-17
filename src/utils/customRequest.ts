// src/utils/request.ts

import { request } from '@umijs/max';

// 从环境变量或其他配置中读取 baseUrl
const BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'https://test-nvwa-api.xspaceagi.com';

interface RequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  data?: any;
  params?: any;
  [key: string]: any; // 其他可能的配置项
}

const customRequest = async <T = any>(config: RequestConfig): Promise<T> => {
  const wrappedRequest = async (reqConfig: RequestConfig) => {
    // 如果不是绝对路径，则添加 base URL
    if (!reqConfig.url.startsWith('http')) {
      reqConfig.url = new URL(reqConfig.url, BASE_URL).toString();
    }

    // 获取token，假设token存储在localStorage或sessionStorage中
    const token =
      localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

    if (token) {
      // 如果有token，则添加到请求头中
      reqConfig.headers = {
        ...reqConfig.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    return reqConfig;
  };

  const handleResponse = (response: any) => {
    if (response.status !== 200) {
      console.log('aaa');
    } else {
      console.log('bbb');
    }

    return response;
  };

  const handleError = (error: any) => {
    console.error('Error occurred:', error);
    return Promise.reject(error);
  };

  // 使用拦截器并直接返回结果
  return await request<T>(config.url, {
    ...config,
    interceptors: {
      request: wrappedRequest,
      response: handleResponse,
      error: handleError,
    },
  });
};

export default customRequest;
