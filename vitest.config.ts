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
    // 领域归约、选择器与路径解析不依赖 DOM，避免为纯逻辑逐文件创建 jsdom。
    environmentMatchGlobs: [
      ['src/features/conversation/domain/**', 'node'],
      ['src/features/conversation/presentation-v2/*.test.ts', 'node'],
      [
        'tests/conversation{EventReducer,MessageEvent,ProcessingEvent,TerminalEvent,MessageLifecycle,SessionView}.test.ts',
        'node',
      ],
    ],
    setupFiles: './tests/setupTests.ts',
    exclude: [
      ...configDefaults.exclude,
      // 本地 Claude 隔离 worktree 不是当前 checkout，禁止重复收集旧测试。
      '.claude/worktrees/**',
      // 仓内嵌套 git worktree（如 worktrees/<slug>）同样不是当前 checkout；
      // 若不排除，test:conversation 会同时跑旧断言，与主仓新契约（如 preview.file.refresh 的 scope/paths）撞车。
      'worktrees/**',
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
