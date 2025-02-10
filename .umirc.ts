import { defineConfig } from 'umi';
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
      target: 'https://test-nvwa-api.xspaceagi.com',
      changeOrigin: true, // 是否跨域
      pathRewrite: { '^/api': '/api' },
    },
  },
});
