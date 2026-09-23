import { defineConfig } from 'umi';

export default defineConfig({
  define: {
    'process.env.BASE_URL': '',
    'process.env.NUWAX_UMI_DEV_SERVER': 'false',
  },
  hash: true,
});
