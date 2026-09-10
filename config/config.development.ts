import { defineConfig } from 'umi';

export default defineConfig({
  define: {
    'process.env.BASE_URL': 'https://testagent.xspaceagi.com',
  },
  hash: true,
  mock: {
    // 业务供数 mock 默认关闭（后端接口 ready 后走真实链路，文件保留随时可再开）；
    // 示例/验收 mock（conversationMock 系列，仅 /mock-chat 等验收页消费）不受影响。
    // fsBrowseAPI（目录选择弹窗）默认关闭：真机走查（nuwawork 壳）必须走真实
    // 网关到本机 file-server；纯浏览器 UI 走查时移出 exclude 并重启 dev。
    exclude: [
      'mock/userProjectAPI.ts',
      'mock/fsBrowseAPI.ts',
      'mock/subscriptionAPI.ts',
    ],
  },
});
