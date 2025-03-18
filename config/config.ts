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
    config.plugin('copy-monaco').use(CopyWebpackPlugin, [
      {
        patterns: [
          {
            from: path.join(
              path.dirname(require.resolve('monaco-editor/package.json')),
              'min/vs',
            ),
            to: 'public/monaco-editor/min/vs',
            force: true,
          },
        ],
      },
    ]);

    // 修改monaco插件配置
    config.plugin('monaco').use(MonacoWebpackPlugin, [
      {
        languages: ['javascript', 'typescript', 'json', 'python'],
        publicPath: '/monaco-editor/min',
        filename: 'vs/[name].worker.js',
        // 添加以下配置
        features: [
          'accessibilityHelp',
          'bracketMatching',
          'caretOperations',
          'clipboard',
          'codeAction',
          'codelens',
          'colorPicker',
          'comment',
          'contextmenu',
          'cursorUndo',
          'dnd',
          'find',
          'folding',
          'fontZoom',
          'format',
          'gotoError',
          'gotoLine',
          'hover',
          'inPlaceReplace',
          'indentation',
          'inlineCompletions',
          'inspectTokens',
          'iPadShowKeyboard',
          'linesOperations',
          'links',
          'multicursor',
          'parameterHints',
          'quickCommand',
          'quickHelp',
          'quickOutline',
          'referenceSearch',
          'rename',
          'smartSelect',
          'suggest',
          'toggleHighContrast',
          'toggleTabFocusMode',
          'unusualLineTerminators',
          'viewportSemanticTokens',
          'wordHighlighter',
          'wordOperations',
          'wordPartOperations',
        ],
      },
    ]);
  },
});
