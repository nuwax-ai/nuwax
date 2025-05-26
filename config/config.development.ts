import { defineConfig } from 'umi';

export default defineConfig({
  define: {
    'process.env.BASE_URL': 'http://testagent.xspaceagi.com',
  },
  hash: true,
});
