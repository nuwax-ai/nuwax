import { defineConfig } from 'umi';

export default defineConfig({
  define: {
    'process.env.BASE_URL': 'http://localhost:8081',
  },
  hash: true,
  /** 本地 ACP 权限审批 UI 调试（mock/agentIntervention.ts） */
  // mock: {
  //   include: ['mock/**/*.ts'],
  // },
  // proxy: {
  //   '/api/': {
  //     target: 'http://localhost:8081',
  //     changeOrigin: true,
  //   },
  // },
});
