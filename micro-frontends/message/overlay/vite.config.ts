import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vite';
import { messageScopedStyles } from './scope-styles.mjs';
import upstream from './vite.upstream.config.ts';

const hostRoot = process.env.NUWAX_MICRO_APP_HOST_ROOT;
if (!hostRoot)
  throw new Error('构建消息适配产物需 NUWAX_MICRO_APP_HOST_ROOT 指向主仓');
const hostRequire = createRequire(`${hostRoot}/package.json`);
const pluginModule = hostRequire('@tiny-codes/vite-plugin-qiankun');
const qiankun = pluginModule.default ?? pluginModule;
const root = fileURLToPath(new URL('.', import.meta.url));

function messageStandaloneRoutes() {
  const install = (server: {
    middlewares: {
      use: (
        handler: (
          req: { url?: string; headers: { accept?: string } },
          res: unknown,
          next: () => void,
        ) => void,
      ) => void;
    };
  }) => {
    server.middlewares.use((req, _res, next) => {
      if (
        /^\/instant-message(?:\/|[?#]|$)/.test(req.url ?? '') &&
        req.headers.accept?.includes('text/html')
      ) {
        req.url = '/micro-apps/message/';
      }
      next();
    });
  };
  return {
    name: 'nuwax-message-business-routes',
    configureServer: install,
    configurePreviewServer: install,
  };
}

export default defineConfig((environment) => {
  // 主站适配产物只使用平台 Cookie，dev/build 均不允许回退 mock 模式。
  process.env.VITE_IM_AUTH_MODE = 'platform';
  const config =
    typeof upstream === 'function' ? upstream(environment) : upstream;
  return mergeConfig(config, {
    root,
    base: '/micro-apps/message/',
    define: { 'import.meta.env.VITE_IM_AUTH_MODE': JSON.stringify('platform') },
    plugins: [
      qiankun('nuwax-im-web', {
        changeScriptOrigin: environment.command === 'serve',
      }),
      messageStandaloneRoutes(),
    ],
    css: { postcss: { plugins: [messageScopedStyles()] } },
    server: {
      port: 7110,
      strictPort: true,
      cors: true,
      open: '/instant-message/',
    },
    preview: { port: 7110, strictPort: true },
  });
});
