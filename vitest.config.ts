import { createRequire } from 'module';
import path from 'path';
import { configDefaults, defineConfig } from 'vitest/config';

const require = createRequire(import.meta.url);
const reactJsxRuntime = require.resolve('react/jsx-runtime');
const reactJsxDevRuntime = require.resolve('react/jsx-dev-runtime');
const umiEntry = require.resolve('@umijs/max');

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setupTests.ts',
    exclude: [
      ...configDefaults.exclude,
      // 本地 Claude 隔离 worktree 不是当前 checkout，禁止重复收集旧测试。
      '.claude/worktrees/**',
      // 子仓的 node:test/业务测试由各自管线执行，宿主只收集集成合同。
      'submodules/**',
      // 类型门由 test:typecheck 使用 node:test 独立执行，避免 Vitest 误收集。
      'scripts/check-types.test.mjs',
    ],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'react/jsx-runtime': reactJsxRuntime,
      'react/jsx-dev-runtime': reactJsxDevRuntime,
      umi: umiEntry,
    },
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'react/jsx-runtime': reactJsxRuntime,
      'react/jsx-dev-runtime': reactJsxDevRuntime,
      umi: umiEntry,
    },
    dedupe: ['react', 'react-dom'],
  },
});
