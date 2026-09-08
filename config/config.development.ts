import { defineConfig } from 'umi';

export default defineConfig({
  define: {
    'process.env.BASE_URL': 'https://testagent.xspaceagi.com',
  },
  hash: true,
  mock: {
    // 业务供数 mock 默认关闭（后端接口 ready 后走真实链路，文件保留随时可再开）；
    // 示例/验收 mock（conversationMock 系列，仅 /mock-chat 等验收页消费）不受影响。
    exclude: [
      'mock/userProjectAPI.ts',
      'mock/computerBrowse.ts',
      'mock/subscriptionAPI.ts',
    ],
  },
});
