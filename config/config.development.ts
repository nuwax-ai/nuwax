import { defineConfig } from 'umi';

export default defineConfig({
  define: {
    'process.env.BASE_URL': 'https://test-nvwa-api.xspaceagi.com',
    hash: true,
  },
});
