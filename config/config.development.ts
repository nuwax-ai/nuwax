import { defineConfig } from 'umi';

export default defineConfig({
  define: {
    'process.env.BASE_URL': '',
  },
  hash: true,
  /** 本地 ACP 权限审批 UI 调试（mock/agentIntervention.ts） */
  mock: {
    include: ['mock/**/*.ts'],
  },
  proxy: {
    '/api/': {
      target: 'https://testagent.xspaceagi.com',
      changeOrigin: true,
    },
  },
});
