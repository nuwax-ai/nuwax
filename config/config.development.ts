import { defineConfig } from 'umi';

export default defineConfig({
  define: {
    'process.env.BASE_URL': 'https://testagent.xspaceagi.com',
    'process.env.OPENUI_INLINE_RENDER_MODE':
      process.env.OPENUI_INLINE_RENDER_MODE === 'iframe'
        ? 'iframe'
        : 'renderer',
  },
});
