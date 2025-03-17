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
  publicPath: '/', // 保持根路径
  chainWebpack(config) {
    // 修改复制目标路径
    config.plugin('copy-monaco').use(CopyWebpackPlugin, [
      {
        patterns: [
          {
            from: path.join(
              path.dirname(require.resolve('monaco-editor/package.json')),
              'min/vs',
            ),
            to: 'monaco-editor/vs', // 直接复制到根目录
            force: true,
          },
        ],
      },
    ]);

    // 更新 monaco 插件配置
    config.plugin('monaco').use(MonacoWebpackPlugin, [
      {
        languages: ['javascript', 'python', 'json'],
        globalAPI: true,
        publicPath: '/monaco-editor/vs', // 根目录绝对路径
      },
    ]);
  },
});
