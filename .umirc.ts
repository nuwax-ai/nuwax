/*
 * @Author: binxiaolin 18030705033
 * @Date: 2025-01-16 15:16:11
 * @LastEditors: binxiaolin 18030705033
 * @LastEditTime: 2025-01-17 17:18:04
 * @FilePath: \agent-platform-front\.umirc.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { defineConfig } from '@umijs/max';
import routes from './src/routes';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  define: { 'process.env.BASE_URL': process.env.BASE_URL },
  routes,
  npmClient: 'pnpm',
  proxy: {
    '/api': {
      target: 'https://test-nvwa-api.xspaceagi.com', // 目标服务器的地址
      changeOrigin: true, // 是否跨域
      pathRewrite: { '^/api': '' }, // 重写路径，将'/api'替换为空字符串
      // 其他配置项...
    },
    // 可以配置多个代理规则
    '/another-api': {
      target: 'http://example.com',
      changeOrigin: true,
      pathRewrite: { '^/another-api': '' },
      // 其他配置项...
    },
  },
});
