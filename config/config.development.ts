import { defineConfig } from 'umi';
import { devWebSocketProxy } from './devWebSocketProxy';

// 子应用相对路径请求落在主站 origin，经代理复用 Cookie；主站 BASE_URL 链路保持一致。
// umi mock 中间件先于 proxy，保留下面的 exclude，验收 mock 仍按原规则运行。
const testAgent = 'https://testagent.xspaceagi.com';

export default defineConfig({
  define: {
    'process.env.BASE_URL': testAgent,
    // 本地 Token/Cookie 环境判定在 businessAuth.ts 内按 NODE_ENV 区分（umi 核心
    // define），此处无需自定义开关；build:dev 走本文件但 NODE_ENV=production → Cookie。
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
  proxy: {
    '/api/repo': { target: testAgent, changeOrigin: true },
    '/api/space': { target: testAgent, changeOrigin: true },
    '/api/user': { target: testAgent, changeOrigin: true },
    '/api/tenant': { target: testAgent, changeOrigin: true },
    '/api/file': { target: testAgent, changeOrigin: true },
    '/api/f': { target: testAgent, changeOrigin: true },
    '/api/instant-message': { target: testAgent, changeOrigin: true },
    '/repo/ws': devWebSocketProxy(testAgent),
    '/repo/internal': { target: testAgent, changeOrigin: true },
    '/instant-message/ws': devWebSocketProxy(testAgent),
  },
});
