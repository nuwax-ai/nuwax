import { defineConfig } from 'umi';

// 本地调试统一走测试环境后端。主应用请求经请求拦截器拼 BASE_URL 绝对地址直连（不落 dev server）；
// 资料库子应用（/repo/）为同源相对路径请求，需 dev 代理转发。
// 与 mock 的共存机制：umi dev server 中 mock 中间件经 addBeforeMiddlewares 注册、先于 proxy，
// mock 命中的请求不会落到代理——注意 /api/user、/api/space、/api/file 前缀下存在 mock 路由
// （subscriptionAPI.ts、conversationMock.ts），依赖该顺序才不冲突；umi 升级或以 MOCK=none 起 dev 时需复查。
const testAgent = 'https://testagent.xspaceagi.com';

export default defineConfig({
  define: {
    'process.env.BASE_URL': testAgent,
  },
  hash: true,
  proxy: {
    // 资料库子应用调用的平台命名空间（submodules/nuwax-repo-web/src/lib/api.ts）
    '/api/repo': { target: testAgent, changeOrigin: true },
    '/api/space': { target: testAgent, changeOrigin: true },
    '/api/user': { target: testAgent, changeOrigin: true },
    '/api/tenant': { target: testAgent, changeOrigin: true },
    '/api/file': { target: testAgent, changeOrigin: true },
    '/api/f': { target: testAgent, changeOrigin: true },
    // 协作 WS：网关路由待后端确认（契约 docs/repo-web-integration.md §6-3），落地后自动生效。
    // qiankun dev 不需要 /repo HTTP 代理：子应用 entry/模块直连其 vite dev server（7100），
    // 业务 API 走上方 /api/* 代理；且任何 /repo 前缀代理都会吞掉 /repo-entry 稳定入口。
    '/repo/ws': { target: testAgent, changeOrigin: true, ws: true },
  },
});
