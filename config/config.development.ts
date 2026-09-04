import { defineConfig } from 'umi';

// 本地调试统一走测试环境后端。主应用请求经请求拦截器拼 BASE_URL 绝对地址直连（不落 dev server）；
// 资料库子应用（/repo/）为同源相对路径请求，需 dev 代理转发。mock/* 无 /api 字面路由、
// 会话 mock 走页面级 fetch 拦截，均不受以下代理影响。
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
    // 协作 WS：网关路由待后端确认（契约 docs/repo-web-integration.md §6-3），落地后自动生效
    '/repo/ws': { target: testAgent, changeOrigin: true, ws: true },
  },
});
