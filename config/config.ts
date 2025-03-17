// import CopyWebpackPlugin from 'copy-webpack-plugin'; // 确保正确引入
// import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';
// import path from 'path';
import { defineConfig } from 'umi';
import routes from '../src/routes';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  routes,
  // 其他配置...
  // jsMinifier: 'esbuild',
  // jsMinifierOptions: {
  //   minify: true,
  //   target: 'es2020',
  //   // 关键配置：启用 IIFE 包裹
  //   esbuildMinifyIIFE: true,
  // },
  // npmClient: 'pnpm',
  // chainWebpack(config) {
  //   config.externals({
  //     'monaco-editor/esm/vs/editor/editor.worker': 'self.MonacoEditorWorker',
  //     'monaco-editor/esm/vs/language/json/json.worker': 'self.JSONWorker',
  //     'monaco-editor/esm/vs/language/typescript/ts.worker': 'self.TSWorker',
  //   });
  //   // 更新monaco插件配置
  //   config.plugin('monaco').use(MonacoWebpackPlugin, [
  //     {
  //       languages: ['javascript', 'python', 'json'],
  //       globalAPI: true,
  //       publicPath: './', // 修改为相对路径
  //     },
  //   ]);
  //
  //   // 优化资源复制配置
  //   config.plugin('copy-monaco').use(CopyWebpackPlugin, [
  //     {
  //       patterns: [
  //         {
  //           from:
  //             path.dirname(require.resolve('monaco-editor/package.json')) +
  //             '/min/vs',
  //           to: 'monaco-editor/vs', // 直接复制到 public/monaco-editor/vs
  //           force: true,
  //         },
  //       ],
  //     },
  //   ]);
  // },
});
