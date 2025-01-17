// // 运行时配置
//
// // 全局初始化数据配置，用于 Layout 用户信息和权限初始化
// // 更多信息见文档：https://umijs.org/docs/api/runtime-config#getinitialstate
// // export async function getInitialState(): Promise<{ name: string }> {
// //   return { name: '@umijs/max' };
// // }
//
//

const ACCESS_TOKEN = 'ACCESS_TOKEN';
const LANGUAGE = 'zh_cn';

// 运行时配置 todo 待完善
export const request: any = {
  timeout: 10000,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },

  requestInterceptors: [
    (config) => {
      const token = localStorage.getItem(ACCESS_TOKEN) ?? '';
      if (token) {
        config.headers.token = token;
      }
      const language = localStorage.getItem(LANGUAGE) ?? 'en';
      config.headers['Accept-Language'] = language;
      config.headers['Content-Type'] = 'application/json';
      return { ...config };
    },
  ],

  responseInterceptors: [
    async (response) => {
      return response;
    },
  ],
};
