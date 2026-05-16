import { defineConfig } from 'umi';

export default defineConfig({
  define: {
    'process.env.BASE_URL': 'http://127.0.0.1:8081',
  },
  hash: true,
});
