import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vite';
import { repoScopedStyles } from './scope-styles.mjs';
import upstream from './vite.upstream.config.ts';

// 插件属于主仓适配层；子仓 package/lock 不变，继续 frozen install 原始 main。
const hostRoot = process.env.NUWAX_MICRO_APP_HOST_ROOT;
if (!hostRoot)
  throw new Error('构建资料库适配产物需 NUWAX_MICRO_APP_HOST_ROOT 指向主仓');
const hostRequire = createRequire(`${hostRoot}/package.json`);
const pluginModule = hostRequire('@tiny-codes/vite-plugin-qiankun');
const qiankun = pluginModule.default ?? pluginModule;
const root = fileURLToPath(new URL('.', import.meta.url));

/** dev 独立运行保留 /repo 业务地址；静态资源仍走独立的 /micro-apps/repo/。 */
function repoStandaloneRoutes() {
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
        /^\/repo(?:\/|[?#]|$)/.test(req.url ?? '') &&
        req.headers.accept?.includes('text/html')
      ) {
        req.url = '/micro-apps/repo/';
      }
      next();
    });
  };
  return {
    name: 'nuwax-repo-business-routes',
    configureServer: install,
    configurePreviewServer: install,
  };
}

export default defineConfig((environment) => {
  return mergeConfig(upstream, {
    root,
    base: '/micro-apps/repo/',
    plugins: [
      qiankun('nuwax-repo-web', {
        changeScriptOrigin: environment.command === 'serve',
      }),
      repoStandaloneRoutes(),
    ],
    css: { postcss: { plugins: [repoScopedStyles()] } },
    server: { port: 7100, strictPort: true, cors: true, open: '/repo/' },
    preview: { port: 7100, strictPort: true },
  });
});
