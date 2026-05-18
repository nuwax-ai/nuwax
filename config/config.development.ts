import { defineConfig } from 'umi';

export default defineConfig({
  define: {
    'process.env.BASE_URL': 'https://testagent.xspaceagi.com',
  },
  hash: true,
  /** 本地 ACP 权限审批 UI 调试（mock/agentIntervention.ts） */
  mock: {
    include: ['mock/**/*.ts'],
  },
});
