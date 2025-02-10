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

console.log('BASE_URL:', BASE_URL);

const customRequest = async <T = any>(config: RequestConfig): Promise<T> => {
  // 直接拼接 base URL 和相对路径
  let originalUrl = config.url;
  if (!originalUrl.startsWith('http')) {
    config.url = new URL(originalUrl, BASE_URL).toString();
  }

  // 获取token，假设token存储在localStorage或sessionStorage中
  const token =
    'eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIxIiwic3ViIjoiODYxODYwODAxMjQ2NSIsImlhdCI6MTczNzM0MDI1MCwiZXhwIjoxNzM5OTMyMjUwfQ.0rg2u0rhULNyeOsCsWGhq0qCnBKfqsITi5ToCiKl79I';
  if (token) {
    // 如果有token，则添加到请求头中
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  // 使用修改后的配置直接调用 request 方法
  return await request<T>(config.url, {
    ...config,
    interceptors: {
      response: (response: any) => {
        if (response.status !== 200) {
          console.log('Response status is not 200');
        } else {
          console.log('Successful response');
        }
        return response;
      },
      error: (error: any) => {
        console.error('Error occurred:', error);
        return Promise.reject(error);
      },
    },
  });
};

export default customRequest;
