import { createRequire } from 'node:module';
import path from 'node:path';
import { defineConfig, mergeConfig } from 'vitest/config';
import upstream from '../../vitest.config';

// 使用隔离产物实际安装的 Router7，而不假定主仓直接依赖 react-router-dom。
const appRoot = process.env.NUWAX_REPO_APP_ROOT;
if (!appRoot)
  throw new Error(
    '资料库路由合同需 NUWAX_REPO_APP_ROOT 指向已安装依赖的隔离源码',
  );
const appRequire = createRequire(path.join(appRoot, 'package.json'));
const aliases = {
  '@repo-app': path.join(appRoot, 'src/App.tsx'),
  '@repo-nav-hold': path.join(appRoot, 'src/lib/navHold.ts'),
  ...Object.fromEntries(
    ['SpaceGate', 'SpacePage', 'LibraryPortal'].map((name) => [
      `@repo-${name}`,
      path.join(appRoot, `src/pages/${name}.tsx`),
    ]),
  ),
  ...Object.fromEntries(
    [
      'FeedbackHost',
      'UploadStatusBar',
      'ImportBlockOverlay',
      'ExportBusyBar',
    ].map((name) => [
      `@repo-${name}`,
      path.join(appRoot, `src/components/${name}.tsx`),
    ]),
  ),
  '@repo-api': path.join(appRoot, 'src/lib/api.ts'),
  '@repo-host-runtime': path.join(appRoot, 'src/hostRuntime.ts'),
  'react-router-dom': appRequire.resolve('react-router-dom'),
  'react/jsx-runtime': appRequire.resolve('react/jsx-runtime'),
  'react/jsx-dev-runtime': appRequire.resolve('react/jsx-dev-runtime'),
  'react-dom/client': appRequire.resolve('react-dom/client'),
  'react-dom': appRequire.resolve('react-dom'),
  react: appRequire.resolve('react'),
};

export default mergeConfig(
  upstream,
  defineConfig({
    test: {
      include: [
        'micro-frontends/repo-web/App.contract.tsx',
        'micro-frontends/repo-web/HostRouter.contract.tsx',
        'micro-frontends/repo-web/Api.contract.ts',
      ],
      alias: aliases,
    },
    resolve: {
      alias: aliases,
    },
  }),
);
