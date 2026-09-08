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
      'tests/**/*[Vv]2*.test.{ts,tsx}',
      // 本地 Claude 隔离 worktree 不是当前 checkout，禁止重复收集旧测试。
      '.claude/worktrees/**',
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
