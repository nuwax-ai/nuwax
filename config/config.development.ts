import { defineConfig } from 'umi';

/**
 * make dev（UMI :3000）时把 ttyd 虚拟终端 WS 接到本机 gateway。
 *
 * 前端 buildTtydTerminalWsUrl 拼的是 window.location.host + `/computer/terminal/{cId}/ws`，
 * 开发态 host 是 :3000，既不走 loopback 也不认本地 ttyd；ttyd gateway 只收
 * `/computer/ttyd/{userId}/{projectId}/ws`。这里做升级代理 + 路径重写：
 *   /computer/terminal/{cId}/ws → /computer/ttyd/local/{cId}/ws
 * userId 写死 local：gateway.resolveRouteCwd 会按 projectId 反查
 * computer-project-workspace 下各 userId 层的 {cId}（见 findProjectWorkspaceByProjectId）。
 *
 * 端口：公式默认 DEFAULT_TTYD_PORT = 60009+NUWAX_PORT_OFFSET（offset=1000 → 61009）；
 * 实际以 step1_config.ttydPort 为准（本机常见 61012）。对不上时看 electron.log 的
 * 「behind gateway 127.0.0.1:…」，并用 NUWAX_TTYD_PORT= 覆盖。
 */
const TTYD_GATEWAY_PORT = Number(process.env.NUWAX_TTYD_PORT || 61012);

export default defineConfig({
  define: {
    'process.env.BASE_URL': 'https://testagent.xspaceagi.com',
  },
  proxy: {
    '/computer/terminal': {
      target: `http://127.0.0.1:${TTYD_GATEWAY_PORT}`,
      changeOrigin: true,
      ws: true,
      pathRewrite: { '^/computer/terminal': '/computer/ttyd/local' },
    },
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
