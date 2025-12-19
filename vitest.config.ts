import { createRequire } from 'module';
import path from 'path';
import { defineConfig } from 'vitest/config';

const require = createRequire(import.meta.url);
const reactJsxRuntime = require.resolve('react/jsx-runtime');
const reactJsxDevRuntime = require.resolve('react/jsx-dev-runtime');
const umiEntry = require.resolve('@umijs/max');

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setupTests.ts',
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
