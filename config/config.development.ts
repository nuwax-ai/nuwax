import { defineConfig } from 'umi';

export default defineConfig({
  define: {
    'process.env.BASE_URL': 'https://testagent.xspaceagi.com',
  },
  // Proxy CopilotKit runtime requests to the local AG-UI runtime server
 proxy: {
   '/api/copilotkit': {
     target: 'http://localhost:4001',
     changeOrigin: true,
     // AG-UI streaming responses can take several minutes (model thinking + tool calls).
     // Disable proxy timeout so the SSE stream stays open until the agent finishes.
     timeout: 0,
     proxyTimeout: 0,
   },
 },
});
