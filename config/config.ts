// 取消以下注释并确保已安装依赖
import CopyWebpackPlugin from 'copy-webpack-plugin';
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';
import path from 'path';
import { defineConfig } from 'umi';
import routes from '../src/routes';

export default defineConfig({
  // 优先从环境变量读取（需要创建 .env 文件）
  // publicPath: process.env.UMI_PUBLIC_PATH || '/',
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  routes,
  npmClient: 'pnpm',
  // 添加在顶层配置中
  jsMinifier: 'esbuild',
  jsMinifierOptions: {
    minify: true,
    target: ['es2020'],
    format: 'iife',
  },
  // publicPath: '/', // 保持根路径
  // 修改复制配置和插件配置
  chainWebpack(config) {
    // 复制 Monaco Editor 的 min 目录到 public/monaco-editor/min
    config.plugin('copy-monaco').use(CopyWebpackPlugin, [
      {
        patterns: [
          {
            from: path.join(
              path.dirname(require.resolve('monaco-editor/package.json')),
              'min',
            ),
            to: 'public/monaco-editor/min', // 输出到 public 目录
            force: true,
          },
        ],
      },
    ]);

    // 配置 MonacoWebpackPlugin
    config.plugin('monaco').use(MonacoWebpackPlugin, [
      {
        languages: ['javascript', 'python', 'json'],
        globalAPI: true,
        publicPath: '/monaco-editor/min/', // 与 CopyWebpackPlugin 的 to 路径一致
        filename: 'vs/[name].worker.js', // Web Worker 文件名规则
      },
    ]);
  },
});
