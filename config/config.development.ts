import { defineConfig } from 'umi';

export default defineConfig({
  define: {
    'process.env.BASE_URL': '',
  },
  hash: true,
  proxy: {
    '/api/': {
      target: 'https://testagent.xspaceagi.com',
      changeOrigin: true,
    },
  },
});
