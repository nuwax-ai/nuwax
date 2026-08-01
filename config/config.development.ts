import { defineConfig } from 'umi';

export default defineConfig({
  define: {
    'process.env.BASE_URL': '',
  },
  hash: true,
  proxy: {
    '/api/': {
      //target: 'https://testagent.xspaceagi.com',
      target: 'http://127.0.0.1:8081',
      changeOrigin: true,
    },
  },
});
