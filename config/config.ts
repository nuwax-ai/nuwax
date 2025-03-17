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

  chainWebpack(config) {
    // 修改 monaco 插件配置
    config.plugin('monaco').use(MonacoWebpackPlugin, [
      {
        languages: ['javascript', 'python', 'json'],
        globalAPI: true,
        publicPath: './monaco-editor/vs', // 改为绝对路径
      },
    ]);

    // 修改资源复制配置
    config.plugin('copy-monaco').use(CopyWebpackPlugin, [
      {
        patterns: [
          {
            from: path.join(
              path.dirname(require.resolve('monaco-editor/package.json')),
              'min/vs',
            ),
            to: 'monaco-editor/vs', // 确保输出到 public 目录
            force: true,
          },
        ],
      },
    ]);
  },
});
